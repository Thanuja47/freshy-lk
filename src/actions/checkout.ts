// src/actions/checkout.ts — Server action for guest checkout & order creation

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { calculatePackPriceCents, getEffectivePricePerKgCents, calculatePrepFeeCents } from "@/lib/pricing";
import { findZoneForDistrict, calculateDeliveryFee, validateStorageCompatibility, getEarliestDeliveryDate, formatDateYYYYMMDD } from "@/lib/delivery";
import { reserveStock } from "@/lib/stock";
import type { StorageType, PaymentMethod, CustomerType } from "@prisma/client";

import { normalizePhone } from "@/lib/constants";

const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  packWeightGrams: z.number().int().positive(),
  prepOptionId: z.string().optional(),
  quantity: z.number().int().positive(),
  cartPricePerKgCents: z.number().int().nonnegative(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(9, "Valid Sri Lankan phone number required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  customerType: z.enum(["INDIVIDUAL", "BUSINESS"]).default("INDIVIDUAL"),
  companyName: z.string().optional(),
  brNumber: z.string().optional(),
  vatNumber: z.string().optional(),

  addressLine1: z.string().min(3, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  postalCode: z.string().optional(),
  deliveryNote: z.string().optional(),
  deliveryDate: z.string().min(1, "Delivery date is required"),

  paymentMethod: z.enum(["BANK_TRANSFER", "CARD_ONLINE", "COD"]),
  items: z.array(checkoutItemSchema).min(1, "Cart must contain at least one item"),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
  turnstileToken: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutActionResult =
  | {
      status: "SUCCESS";
      orderNo: string;
      trackingToken: string;
    }
  | {
      status: "DELIVERY_DATE_CHANGED";
      message: string;
      newEarliestDate: string;
    }
  | {
      status: "PRICE_CHANGED";
      message: string;
      newSubtotalCents: number;
      newTotalCents: number;
    }
  | {
      status: "OUT_OF_STOCK";
      message: string;
      failedProductName?: string;
    }
  | {
      status: "ZONE_STORAGE_BLOCKED";
      message: string;
      invalidStorageTypes: StorageType[];
    }
  | {
      status: "ERROR";
      message: string;
    };

function generateTrackingToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createOrder(input: CheckoutInput): Promise<CheckoutActionResult> {
  try {
    // 1. Validate Zod input
    const parsed = checkoutSchema.parse(input);
    const normalizedPhone = normalizePhone(parsed.phone);

    // 2. Idempotency Check
    const existingOrder = await db.order.findUnique({
      where: { idempotencyKey: parsed.idempotencyKey },
      select: { orderNo: true, trackingToken: true },
    });
    if (existingOrder) {
      return {
        status: "SUCCESS",
        orderNo: existingOrder.orderNo,
        trackingToken: existingOrder.trackingToken,
      };
    }

    // 3. Fetch Delivery Zone
    const allZones = await db.deliveryZone.findMany({ where: { isActive: true } });
    const zone = findZoneForDistrict(allZones, parsed.district);
    if (!zone) {
      return {
        status: "ERROR",
        message: `Delivery is not available in ${parsed.district} district.`,
      };
    }

    // 3b. Validate Delivery Date Cutoff
    const selectedDate = new Date(parsed.deliveryDate);
    const earliestAllowedDate = getEarliestDeliveryDate(zone, new Date());
    const selectedYMD = formatDateYYYYMMDD(selectedDate);
    const earliestYMD = formatDateYYYYMMDD(earliestAllowedDate);

    if (selectedYMD < earliestYMD) {
      return {
        status: "DELIVERY_DATE_CHANGED",
        message: `The 12:00 PM cut-off for today's delivery has passed. Your new earliest delivery date is ${earliestYMD}. Please confirm to proceed.`,
        newEarliestDate: earliestYMD,
      };
    }

    // 4. Fetch Products & Preps fresh from DB
    const productIds = Array.from(new Set(parsed.items.map((item) => item.productId)));
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        packs: true,
        tiers: true,
        preps: { include: { prepOption: true } },
      },
    });

    if (products.length !== productIds.length) {
      return {
        status: "ERROR",
        message: "One or more products in your cart are no longer available.",
      };
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 5. Cold-chain storage compatibility check
    const cartStorageTypes = products.map((p) => p.storageType);
    const storageCheck = validateStorageCompatibility(zone, cartStorageTypes);
    if (!storageCheck.isValid) {
      return {
        status: "ZONE_STORAGE_BLOCKED",
        message: `Delivery to ${parsed.district} does not support fresh items. Please remove fresh products or select a frozen alternative.`,
        invalidStorageTypes: storageCheck.invalidStorageTypes,
      };
    }

    // 6. Compute Total Grams per Product for Volume Tier Selection
    const productTotalGrams = new Map<string, number>();
    for (const item of parsed.items) {
      const current = productTotalGrams.get(item.productId) ?? 0;
      productTotalGrams.set(item.productId, current + item.packWeightGrams * item.quantity);
    }

interface ValidatedItem {
  productId: string;
  productName: string;
  localName: string | null;
  packLabel: string;
  packWeightGrams: number;
  quantity: number;
  pricePerKgCents: number;
  tierLabel: string | null;
  prepName: string | null;
  prepFeeCents: number;
  lineTotalCents: number;
}

    // 7. Recalculate Prices & Check for Price Changes
    let hasPriceChange = false;
    let freshSubtotalCents = 0;
    let freshPrepTotalCents = 0;
    let totalCartWeightGrams = 0;

    const validatedItems: ValidatedItem[] = [];

    for (const item of parsed.items) {
      const product = productMap.get(item.productId)!;

      if (!product.isAvailable) {
        return {
          status: "OUT_OF_STOCK",
          message: `${product.name} is sold out today.`,
          failedProductName: product.name,
        };
      }

      const pack = product.packs.find((p) => p.weightGrams === item.packWeightGrams && p.isActive);
      if (!pack) {
        return {
          status: "ERROR",
          message: `Selected pack size (${item.packWeightGrams}g) for ${product.name} is not available.`,
        };
      }

      const totalGrams = productTotalGrams.get(item.productId) ?? 0;
      const { pricePerKgCents: freshPricePerKgCents, tierLabel } = getEffectivePricePerKgCents(
        product.pricePerKgCents,
        product.tiers,
        totalGrams
      );

      if (freshPricePerKgCents !== item.cartPricePerKgCents) {
        hasPriceChange = true;
      }

      const freshPackPriceCents = calculatePackPriceCents(freshPricePerKgCents, item.packWeightGrams);
      const lineGoodsTotalCents = freshPackPriceCents * item.quantity;

      let prepName: string | undefined;
      let prepFeeCents = 0;
      if (item.prepOptionId) {
        const productPrep = product.preps.find((pr) => pr.prepOptionId === item.prepOptionId);
        if (productPrep && productPrep.prepOption.isActive) {
          prepName = productPrep.prepOption.name;
          const feeCents = productPrep.feeOverrideCents ?? productPrep.prepOption.feeCents;
          prepFeeCents = calculatePrepFeeCents(
            feeCents,
            productPrep.prepOption.feeType,
            item.packWeightGrams,
            item.quantity
          );
        }
      }

      freshSubtotalCents += lineGoodsTotalCents;
      freshPrepTotalCents += prepFeeCents;
      totalCartWeightGrams += item.packWeightGrams * item.quantity;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        localName: product.localName,
        packLabel: pack.label,
        packWeightGrams: item.packWeightGrams,
        quantity: item.quantity,
        pricePerKgCents: freshPricePerKgCents,
        tierLabel,
        prepName: prepName ?? null,
        prepFeeCents,
        lineTotalCents: lineGoodsTotalCents,
      });
    }

    const deliveryFeeCents = calculateDeliveryFee(zone, totalCartWeightGrams, freshSubtotalCents);

    if (zone.minOrderCents > 0 && freshSubtotalCents < zone.minOrderCents) {
      return {
        status: "ERROR",
        message: `Minimum order value for ${zone.name} is Rs. ${(zone.minOrderCents / 100).toLocaleString("en-LK")}.`,
      };
    }

    const freshTotalCents = freshSubtotalCents + freshPrepTotalCents + deliveryFeeCents;

    if (hasPriceChange) {
      return {
        status: "PRICE_CHANGED",
        message: "Prices for items in your cart have updated. Please review your total before completing the order.",
        newSubtotalCents: freshSubtotalCents,
        newTotalCents: freshTotalCents,
      };
    }

    // 8. Execute Order Creation inside DB Transaction
    const result = await db.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone: normalizedPhone },
        update: {
          name: parsed.customerName,
          email: parsed.email || undefined,
          company: parsed.companyName || undefined,
        },
        create: {
          phone: normalizedPhone,
          name: parsed.customerName,
          email: parsed.email || undefined,
          company: parsed.companyName || undefined,
        },
      });

      const stockReservationItems = validatedItems.map((it) => ({
        productId: it.productId,
        grams: it.packWeightGrams * it.quantity,
      }));

      const stockResult = await reserveStock(stockReservationItems, tx);
      if (!stockResult.success) {
        throw new Error(`STOCK_OUT:${stockResult.failedProductName}`);
      }

      const now = new Date();
      const colomboDateStr = now.toLocaleDateString("en-US", {
        timeZone: "Asia/Colombo",
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      });
      const [m, d, y] = colomboDateStr.split("/");
      const dayKey = `${y}${m}${d}`;

      const counter = await tx.orderCounter.upsert({
        where: { day: dayKey },
        update: { lastNumber: { increment: 1 } },
        create: { day: dayKey, lastNumber: 1 },
      });

      const orderNo = `FRS-${dayKey}-${counter.lastNumber.toString().padStart(4, "0")}`;
      const trackingToken = generateTrackingToken();

      const isCardOrder = parsed.paymentMethod === "CARD_ONLINE";
      const isDemoMode = process.env.DEMO_MODE === "true";
      const expiresAt = isCardOrder && !isDemoMode ? new Date(Date.now() + 15 * 60 * 1000) : null;

      const initialStatus = isDemoMode && isCardOrder ? "PLACED" : "PENDING_PAYMENT";
      const initialPaymentStatus = isDemoMode && isCardOrder ? "PAID" : "UNPAID";

      const newOrder = await tx.order.create({
        data: {
          orderNo,
          trackingToken,
          idempotencyKey: parsed.idempotencyKey,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          customerId: customer.id,
          customerType: parsed.customerType as CustomerType,
          customerName: parsed.customerName,
          phone: normalizedPhone,
          email: parsed.email || null,
          companyName: parsed.companyName || null,
          brNumber: parsed.brNumber || null,
          vatNumber: parsed.vatNumber || null,
          addressLine1: parsed.addressLine1,
          addressLine2: parsed.addressLine2 || null,
          city: parsed.city,
          district: parsed.district,
          postalCode: parsed.postalCode || null,
          deliveryNote: parsed.deliveryNote || null,
          zoneId: zone.id,
          deliveryDate: new Date(parsed.deliveryDate),
          paymentMethod: parsed.paymentMethod as PaymentMethod,
          subtotalCents: freshSubtotalCents,
          prepTotalCents: freshPrepTotalCents,
          deliveryFeeCents,
          totalCents: freshTotalCents,
          expiresAt,
          placedAt: initialStatus === "PLACED" ? new Date() : null,
          items: {
            create: validatedItems,
          },
          events: {
            create: {
              toStatus: initialStatus,
              note: "Guest checkout order created",
            },
          },
        },
      });

      // Increment currentSameDayOrders if same-day order
      if (zone.sameDayAvailable !== false && zone.leadDays === 0) {
        await tx.deliveryZone.update({
          where: { id: zone.id },
          data: { currentSameDayOrders: { increment: 1 } },
        });
      }

      return {
        orderNo: newOrder.orderNo,
        trackingToken: newOrder.trackingToken,
      };
    });

    return {
      status: "SUCCESS",
      orderNo: result.orderNo,
      trackingToken: result.trackingToken,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.startsWith("STOCK_OUT:")) {
      const productName = err.message.split("STOCK_OUT:")[1];
      return {
        status: "OUT_OF_STOCK",
        message: `${productName} is sold out or has insufficient stock available.`,
        failedProductName: productName,
      };
    }

    console.error("Checkout action error:", err);
    return {
      status: "ERROR",
      message: err instanceof Error ? err.message : "An unexpected error occurred during checkout.",
    };
  }
}
