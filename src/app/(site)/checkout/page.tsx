"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore, type CartItem } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { SRI_LANKA_DISTRICTS } from "@/lib/constants";
import { calculatePackPriceCents, calculatePrepFeeCents } from "@/lib/pricing";
import { findZoneForDistrict, calculateDeliveryFee } from "@/lib/delivery";
import { createOrder, type CheckoutInput } from "@/actions/checkout";

interface SavedCustomerDetails {
  customerName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
}

const LOCAL_STORAGE_KEY = "freshy_customer_details";

function loadSavedCustomerDetails(): SavedCustomerDetails {
  if (typeof window === "undefined") {
    return {
      customerName: "",
      phone: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      district: "Colombo",
      postalCode: "",
    };
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        customerName: parsed.customerName || "",
        phone: parsed.phone || "",
        email: parsed.email || "",
        addressLine1: parsed.addressLine1 || "",
        addressLine2: parsed.addressLine2 || "",
        city: parsed.city || "",
        district: (SRI_LANKA_DISTRICTS as readonly string[]).includes(parsed.district)
          ? parsed.district
          : "Colombo",
        postalCode: parsed.postalCode || "",
      };
    }
  } catch {
    // Ignore localStorage read errors
  }
  return {
    customerName: "",
    phone: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "Colombo",
    postalCode: "",
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const formId = useId();
  const { items, clearCart } = useCartStore();

  const [idempotencyKey] = useState<string>(() =>
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [priceChangeNotice, setPriceChangeNotice] = useState<{
    newSubtotalCents: number;
    newTotalCents: number;
  } | null>(null);

  // Lazy load saved customer details
  const [savedDetails] = useState(loadSavedCustomerDetails);

  // Form Fields State
  const [customerName, setCustomerName] = useState(savedDetails.customerName);
  const [phone, setPhone] = useState(savedDetails.phone);
  const [email, setEmail] = useState(savedDetails.email);
  const [customerType, setCustomerType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [companyName, setCompanyName] = useState("");
  const [brNumber, setBrNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");

  const [addressLine1, setAddressLine1] = useState(savedDetails.addressLine1);
  const [addressLine2, setAddressLine2] = useState(savedDetails.addressLine2);
  const [city, setCity] = useState(savedDetails.city);
  const [district, setDistrict] = useState<string>(savedDetails.district);
  const [postalCode] = useState(savedDetails.postalCode);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split("T")[0];
  });

  const [paymentMethod, setPaymentMethod] = useState<"BANK_TRANSFER" | "CARD_ONLINE">("BANK_TRANSFER");

  // Calculate cart subtotal & prep total
  const subtotalCents = items.reduce((acc: number, item: CartItem) => {
    const packPrice = calculatePackPriceCents(item.pricePerKgCents, item.weightGrams);
    return acc + packPrice * item.quantity;
  }, 0);

  const prepTotalCents = items.reduce((acc: number, item: CartItem) => {
    return (
      acc +
      calculatePrepFeeCents(
        item.prepFeeCents,
        item.prepFeeType,
        item.weightGrams,
        item.quantity
      )
    );
  }, 0);

  const totalCartWeightGrams = items.reduce(
    (acc, item) => acc + item.weightGrams * item.quantity,
    0
  );

  // Dynamic delivery fee calculation from matching DeliveryZone
  const [zones, setZones] = useState<import("@/lib/delivery").DeliveryZoneLike[]>([]);

  // Fetch active zones
  useState(() => {
    fetch("/api/delivery-zones")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.zones)) setZones(data.zones);
      })
      .catch(() => {});
  });

  const activeZone = findZoneForDistrict(zones, district);
  const estimatedDeliveryFeeCents = activeZone
    ? calculateDeliveryFee(activeZone, totalCartWeightGrams, subtotalCents)
    : district === "Colombo"
    ? 35000
    : 50000;
  const estimatedTotalCents = subtotalCents + prepTotalCents + estimatedDeliveryFeeCents;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-sea-glass text-tide rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          🛒
        </div>
        <h1 className="font-serif text-3xl text-sea-ink mb-2">Your Cart is Empty</h1>
        <p className="text-sea-ink/70 mb-8">Please add fresh fish to your cart before proceeding to checkout.</p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-6 py-3 bg-coral text-white font-medium rounded-lg hover:bg-coral/90 transition-colors shadow-sm"
        >
          Browse Catch of the Day
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPriceChangeNotice(null);
    setIsSubmitting(true);

    try {
      const payload: CheckoutInput = {
        customerName,
        phone,
        email: email || undefined,
        customerType,
        companyName: companyName || undefined,
        brNumber: brNumber || undefined,
        vatNumber: vatNumber || undefined,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        district,
        postalCode: postalCode || undefined,
        deliveryNote: deliveryNote || undefined,
        deliveryDate,
        paymentMethod,
        idempotencyKey,
        items: items.map((it: CartItem) => ({
          productId: it.productId,
          packWeightGrams: it.weightGrams,
          prepOptionId: it.prepOptionId || undefined,
          quantity: it.quantity,
          cartPricePerKgCents: it.pricePerKgCents,
        })),
      };

      const result = await createOrder(payload);

      if (result.status === "SUCCESS") {
        // Save customer details to localStorage for pre-filling next time
        try {
          const detailsToSave: SavedCustomerDetails = {
            customerName,
            phone,
            email,
            addressLine1,
            addressLine2,
            city,
            district,
            postalCode,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(detailsToSave));
        } catch {
          // Ignore
        }

        clearCart();
        router.push(`/order/${result.trackingToken}`);
      } else if (result.status === "PRICE_CHANGED") {
        setPriceChangeNotice({
          newSubtotalCents: result.newSubtotalCents,
          newTotalCents: result.newTotalCents,
        });
      } else if (result.status === "OUT_OF_STOCK" || result.status === "ZONE_STORAGE_BLOCKED") {
        setErrorMessage(result.message);
      } else {
        setErrorMessage(result.message || "An unexpected error occurred.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-sea-ink mb-2">Guest Checkout</h1>
        <p className="text-sea-ink/70">No account required. Enter your delivery details below.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold">Unable to complete checkout</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {priceChangeNotice && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg">
          <p className="font-semibold text-lg mb-1">Price Update Notice</p>
          <p className="text-sm mb-3">
            Prices for products in your cart have updated today. Your updated subtotal is{" "}
            <strong>{formatMoney(priceChangeNotice.newSubtotalCents)}</strong> and new total is{" "}
            <strong>{formatMoney(priceChangeNotice.newTotalCents)}</strong>.
          </p>
          <button
            type="button"
            onClick={() => setPriceChangeNotice(null)}
            className="px-4 py-2 bg-amber-800 text-white rounded text-sm font-medium hover:bg-amber-900"
          >
            I Accept Updated Prices — Click Place Order Again
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form Section */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Customer Contact Info */}
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="font-serif text-xl font-semibold text-sea-ink flex items-center gap-2">
              <span className="w-7 h-7 bg-sea-glass text-tide text-sm rounded-full flex items-center justify-center font-sans font-bold">
                1
              </span>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-customerName`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  Full Name *
                </label>
                <input
                  id={`${formId}-customerName`}
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
                />
              </div>

              <div>
                <label htmlFor={`${formId}-phone`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  Phone Number (Mobile) *
                </label>
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 077 123 4567"
                  className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-email`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                Email Address (Optional)
              </label>
              <input
                id={`${formId}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="For PDF invoice receipt"
                className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
              />
            </div>

            {/* Business Toggle */}
            <div className="pt-2 border-t border-sand/50">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-sea-ink">
                <input
                  type="checkbox"
                  checked={customerType === "BUSINESS"}
                  onChange={(e) => setCustomerType(e.target.checked ? "BUSINESS" : "INDIVIDUAL")}
                  className="w-4 h-4 text-tide border-sand rounded focus:ring-tide"
                />
                I am ordering for a business / restaurant (Optional VAT/BR fields)
              </label>

              {customerType === "BUSINESS" && (
                <div className="mt-3 p-4 bg-ice border border-sand rounded-lg space-y-3">
                  <div>
                    <label htmlFor={`${formId}-companyName`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                      Company / Restaurant Name
                    </label>
                    <input
                      id={`${formId}-companyName`}
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Ceylon Seafood Bistro"
                      className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink bg-white focus:outline-none focus:ring-2 focus:ring-tide/50"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${formId}-brNumber`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                        BR Number (Optional)
                      </label>
                      <input
                        id={`${formId}-brNumber`}
                        type="text"
                        value={brNumber}
                        onChange={(e) => setBrNumber(e.target.value)}
                        placeholder="Business Reg No"
                        className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink bg-white focus:outline-none focus:ring-2 focus:ring-tide/50"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-vatNumber`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                        VAT Number (Optional)
                      </label>
                      <input
                        id={`${formId}-vatNumber`}
                        type="text"
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        placeholder="VAT Reg No"
                        className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink bg-white focus:outline-none focus:ring-2 focus:ring-tide/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Delivery Details */}
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="font-serif text-xl font-semibold text-sea-ink flex items-center gap-2">
              <span className="w-7 h-7 bg-sea-glass text-tide text-sm rounded-full flex items-center justify-center font-sans font-bold">
                2
              </span>
              Delivery Address & Date
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-district`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  District *
                </label>
                <select
                  id={`${formId}-district`}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink bg-white focus:outline-none focus:ring-2 focus:ring-tide/50 font-medium"
                >
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} District
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${formId}-city`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  City / Town *
                </label>
                <input
                  id={`${formId}-city`}
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nugegoda"
                  className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-addressLine1`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                Street Address (Line 1) *
              </label>
              <input
                id={`${formId}-addressLine1`}
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="House No, Road Name"
                className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-addressLine2`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  id={`${formId}-addressLine2`}
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apartment, suite, landmark"
                  className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
                />
              </div>

              <div>
                <label htmlFor={`${formId}-deliveryDate`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                  Preferred Delivery Date *
                </label>
                <input
                  id={`${formId}-deliveryDate`}
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-deliveryNote`} className="block text-xs font-semibold uppercase tracking-wider text-sea-ink/70 mb-1">
                Delivery Instructions (Optional)
              </label>
              <textarea
                id={`${formId}-deliveryNote`}
                rows={2}
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Leave with security, call before arrival"
                className="w-full px-3 py-2 border border-sand rounded-md text-sea-ink focus:outline-none focus:ring-2 focus:ring-tide/50"
              />
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="font-serif text-xl font-semibold text-sea-ink flex items-center gap-2">
              <span className="w-7 h-7 bg-sea-glass text-tide text-sm rounded-full flex items-center justify-center font-sans font-bold">
                3
              </span>
              Payment Method
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-tide bg-sea-glass/20 ring-1 ring-tide"
                    : "border-sand bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                  className="mt-1 text-tide focus:ring-tide"
                />
                <div>
                  <div className="font-semibold text-sea-ink">Direct Bank Transfer</div>
                  <p className="text-xs text-sea-ink/70 mt-0.5">
                    Pay via online banking or deposit slip. Bank details and slip upload instructions will be shown on the order confirmation page.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === "CARD_ONLINE"
                    ? "border-tide bg-sea-glass/20 ring-1 ring-tide"
                    : "border-sand bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD_ONLINE"
                  checked={paymentMethod === "CARD_ONLINE"}
                  onChange={() => setPaymentMethod("CARD_ONLINE")}
                  className="mt-1 text-tide focus:ring-tide"
                />
                <div>
                  <div className="font-semibold text-sea-ink">Visa / MasterCard / PayHere (Online Payment)</div>
                  <p className="text-xs text-sea-ink/70 mt-0.5">
                    Instant secure payment. [DEMO MODE: Payment is simulated for instant confirmation]
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-sand p-6 rounded-xl shadow-sm sticky top-24 space-y-4">
            <h2 className="font-serif text-xl font-semibold text-sea-ink border-b border-sand pb-3">
              Order Summary
            </h2>

            <div className="divide-y divide-sand/50 max-h-80 overflow-y-auto pr-1">
              {items.map((item: CartItem) => {
                const packPrice = calculatePackPriceCents(
                  item.pricePerKgCents,
                  item.weightGrams
                );
                const prepFee = calculatePrepFeeCents(
                  item.prepFeeCents,
                  item.prepFeeType,
                  item.weightGrams,
                  item.quantity
                );
                const lineTotal = packPrice * item.quantity + prepFee;

                return (
                  <div key={item.id} className="py-3 flex justify-between gap-3 text-sm">
                    <div>
                      <div className="font-medium text-sea-ink">
                        {item.productName} ({item.weightGrams >= 1000 ? `${item.weightGrams / 1000} kg` : `${item.weightGrams} g`}) x {item.quantity}
                      </div>
                      {item.prepName && (
                        <div className="text-xs text-tide font-medium mt-0.5">
                          Prep: {item.prepName}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-medium tabular-nums text-sea-ink">
                      {formatMoney(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-sand pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-sea-ink/70">
                <span>Fish Subtotal</span>
                <span className="tabular-nums text-sea-ink">{formatMoney(subtotalCents)}</span>
              </div>

              {prepTotalCents > 0 && (
                <div className="flex justify-between text-sea-ink/70">
                  <span>Preparation Fees</span>
                  <span className="tabular-nums text-sea-ink">{formatMoney(prepTotalCents)}</span>
                </div>
              )}

              <div className="flex justify-between text-sea-ink/70">
                <span>Estimated Delivery ({district})</span>
                <span className="tabular-nums text-sea-ink">
                  {formatMoney(estimatedDeliveryFeeCents)}
                </span>
              </div>

              <div className="border-t border-sand pt-3 flex justify-between items-baseline font-bold text-base text-sea-ink">
                <span>Total Amount</span>
                <span className="tabular-nums text-xl text-coral">
                  {formatMoney(estimatedTotalCents)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-coral text-white font-bold rounded-lg hover:bg-coral/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing Order...
                </>
              ) : (
                `Place Order (${formatMoney(estimatedTotalCents)})`
              )}
            </button>

            <p className="text-center text-xs text-sea-ink/60 mt-2">
              🔒 Safe & Secure Checkout • Direct Cold-Chain Express Delivery
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
