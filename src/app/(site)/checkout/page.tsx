"use client";

import { useState, useId, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore, type CartItem } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { SRI_LANKA_DISTRICTS } from "@/lib/constants";
import { calculatePackPriceCents, calculatePrepFeeCents } from "@/lib/pricing";
import { findZoneForDistrict, calculateDeliveryFee, getCutoffCountdown, getDeliveryCutoffMessage, getEarliestDeliveryDate, formatDateYYYYMMDD } from "@/lib/delivery";
import { createOrder, type CheckoutInput } from "@/actions/checkout";
import { Lock, ArrowRight, Clock, Calendar } from "lucide-react";

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
  const [deliveryDateChangedNotice, setDeliveryDateChangedNotice] = useState<{
    message: string;
    newEarliestDate: string;
  } | null>(null);

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

  // Dynamic delivery fee calculation & zones lookup
  const [zones, setZones] = useState<import("@/lib/delivery").DeliveryZoneLike[]>([]);

  useEffect(() => {
    fetch("/api/delivery-zones")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.zones)) setZones(data.zones);
      })
      .catch(() => {});
  }, []);

  const activeZone = findZoneForDistrict(zones, district);
  const earliestDate = activeZone ? getEarliestDeliveryDate(activeZone) : new Date();
  // Derive delivery date directly from zone (no setState in effect needed)
  const earliestDateYMD = formatDateYYYYMMDD(earliestDate);

  // Sync delivery date when zone changes (using ref comparison to avoid re-render loop)
  useEffect(() => {
    if (activeZone && deliveryDate !== earliestDateYMD) {
      requestAnimationFrame(() => setDeliveryDate(earliestDateYMD));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earliestDateYMD]);

  // Live countdown check
  const countdown = activeZone ? getCutoffCountdown(activeZone.cutoffTime || "12:00") : null;
  const cutoffRuleMessage = getDeliveryCutoffMessage(activeZone, earliestDate);

  const estimatedDeliveryFeeCents = activeZone
    ? calculateDeliveryFee(activeZone, totalCartWeightGrams, subtotalCents)
    : district === "Colombo"
    ? 35000
    : 50000;
  const estimatedTotalCents = subtotalCents + prepTotalCents + estimatedDeliveryFeeCents;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-[#E8F4FE] text-[#1B9AE4] rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-[#1B9AE4]/20">
          🛒
        </div>
        <h1 className="font-heading font-extrabold text-3xl text-[#0D2137]">Your Cart is Empty</h1>
        <p className="text-xs sm:text-sm text-[#0D2137]/70">Please add fresh fish to your cart before proceeding to checkout.</p>
        <Link
          href="/shop"
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-[#0D2137] hover:bg-[#1B9AE4] text-white font-bold text-sm rounded-xl transition-colors shadow-md"
        >
          <span>Browse Catch of the Day</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPriceChangeNotice(null);
    setDeliveryDateChangedNotice(null);
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
      } else if (result.status === "DELIVERY_DATE_CHANGED") {
        setDeliveryDateChangedNotice({
          message: result.message,
          newEarliestDate: result.newEarliestDate,
        });
        setDeliveryDate(result.newEarliestDate);
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12 space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#DDE8F0] pb-4 space-y-1">
        <h1 className="font-heading font-extrabold text-3xl text-[#0D2137]">Express Checkout</h1>
        <p className="text-xs sm:text-sm text-[#0D2137]/70">No account required. Direct cold-chain delivery setup.</p>
      </div>

      {/* 3-Step Indicator Bar */}
      <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-[#DDE8F0] text-xs font-bold text-[#0D2137] shadow-xs">
        <div className="flex items-center space-x-2 justify-center py-2 bg-[#E8F4FE] text-[#1B9AE4] rounded-xl border border-[#1B9AE4]/20">
          <span className="w-5 h-5 bg-[#1B9AE4] text-white rounded-full flex items-center justify-center text-[10px] font-extrabold">1</span>
          <span className="hidden sm:inline">Contact Info</span>
        </div>
        <div className="flex items-center space-x-2 justify-center py-2 bg-gray-50 text-[#0D2137]/70 rounded-xl">
          <span className="w-5 h-5 bg-gray-200 text-[#0D2137] rounded-full flex items-center justify-center text-[10px] font-extrabold">2</span>
          <span className="hidden sm:inline">Delivery Address</span>
        </div>
        <div className="flex items-center space-x-2 justify-center py-2 bg-gray-50 text-[#0D2137]/70 rounded-xl">
          <span className="w-5 h-5 bg-gray-200 text-[#0D2137] rounded-full flex items-center justify-center text-[10px] font-extrabold">3</span>
          <span className="hidden sm:inline">Payment Method</span>
        </div>
      </div>

      {/* Delivery Date Change Notice Banner (Point 8.e) */}
      {deliveryDateChangedNotice && (
        <div className="p-5 bg-blue-50 border border-blue-200 text-[#0D2137] rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 text-[#1B9AE4] font-bold">
            <Calendar className="h-5 w-5" />
            <span>Delivery Cut-Off Passed Notice</span>
          </div>
          <p className="text-xs text-[#0D2137]/80 leading-relaxed">
            {deliveryDateChangedNotice.message}
          </p>
          <button
            type="button"
            onClick={() => setDeliveryDateChangedNotice(null)}
            className="px-5 py-2.5 bg-[#0D2137] hover:bg-[#1B9AE4] text-white rounded-xl text-xs font-bold transition-colors"
          >
            Confirm New Delivery Date ({deliveryDateChangedNotice.newEarliestDate}) &amp; Place Order
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3 text-sm">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold">Unable to complete checkout</p>
            <p className="text-xs text-red-600">{errorMessage}</p>
          </div>
        </div>
      )}

      {priceChangeNotice && (
        <div className="p-5 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl space-y-3">
          <p className="font-bold text-base">Price Update Notice</p>
          <p className="text-xs">
            Prices for products in your cart have updated today. Your updated subtotal is{" "}
            <strong>{formatMoney(priceChangeNotice.newSubtotalCents)}</strong> and new total is{" "}
            <strong>{formatMoney(priceChangeNotice.newTotalCents)}</strong>.
          </p>
          <button
            type="button"
            onClick={() => setPriceChangeNotice(null)}
            className="px-5 py-2.5 bg-amber-800 text-white rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors"
          >
            I Accept Updated Prices — Click Place Order Again
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form Section */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Customer Contact Info */}
          <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl space-y-5 shadow-xs">
            <h2 className="font-heading text-xl font-bold text-[#0D2137] flex items-center gap-2">
              <span className="w-7 h-7 bg-[#E8F4FE] text-[#1B9AE4] text-sm rounded-xl flex items-center justify-center font-extrabold">
                1
              </span>
              Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor={`${formId}-customerName`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                  Full Name *
                </label>
                <input
                  id={`${formId}-customerName`}
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Kasun Perera"
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${formId}-phone`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                  Mobile Phone Number *
                </label>
                <input
                  id={`${formId}-phone`}
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 077 123 4567"
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${formId}-email`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                Email Address (Optional)
              </label>
              <input
                id={`${formId}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="For PDF receipt"
                className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
              />
            </div>

            {/* Business Toggle */}
            <div className="pt-2 border-t border-[#DDE8F0]">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0D2137]">
                <input
                  type="checkbox"
                  checked={customerType === "BUSINESS"}
                  onChange={(e) => setCustomerType(e.target.checked ? "BUSINESS" : "INDIVIDUAL")}
                  className="w-4 h-4 text-[#1B9AE4] border-[#DDE8F0] rounded focus:ring-[#1B9AE4]"
                />
                Ordering for a business / restaurant (Optional VAT/BR invoice)
              </label>

              {customerType === "BUSINESS" && (
                <div className="mt-3 p-4 bg-gray-50 border border-[#DDE8F0] rounded-xl space-y-3">
                  <div>
                    <label htmlFor={`${formId}-companyName`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137] mb-1">
                      Company / Restaurant Name
                    </label>
                    <input
                      id={`${formId}-companyName`}
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Ceylon Seafood Bistro"
                      className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${formId}-brNumber`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137] mb-1">
                        BR Number
                      </label>
                      <input
                        id={`${formId}-brNumber`}
                        type="text"
                        value={brNumber}
                        onChange={(e) => setBrNumber(e.target.value)}
                        placeholder="Business Reg No"
                        className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-vatNumber`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137] mb-1">
                        VAT Number
                      </label>
                      <input
                        id={`${formId}-vatNumber`}
                        type="text"
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        placeholder="VAT Reg No"
                        className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Delivery Details */}
          <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl space-y-5 shadow-xs">
            <h2 className="font-heading text-xl font-bold text-[#0D2137] flex items-center gap-2">
              <span className="w-7 h-7 bg-[#E8F4FE] text-[#1B9AE4] text-sm rounded-xl flex items-center justify-center font-extrabold">
                2
              </span>
              Delivery Address &amp; Cut-off Rule
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor={`${formId}-district`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                  District *
                </label>
                <select
                  id={`${formId}-district`}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-bold"
                >
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} District
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${formId}-city`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                  City / Town *
                </label>
                <input
                  id={`${formId}-city`}
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nugegoda"
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
                />
              </div>
            </div>

            {/* Live Cutoff Rule Banner & Countdown (Point 8.d) */}
            <div className="bg-[#E8F4FE]/60 border border-[#1B9AE4]/20 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0D2137]">{cutoffRuleMessage.headline}</span>
                <span className="text-[10px] bg-white border border-[#1B9AE4]/20 text-[#1B9AE4] font-bold px-2 py-0.5 rounded-full">
                  {district} Zone
                </span>
              </div>
              <p className="text-[#0D2137]/70 text-[11px]">{cutoffRuleMessage.subtext}</p>

              {/* Live Countdown if < 2 hours remaining */}
              {countdown?.formattedText && (
                <div className="inline-flex items-center space-x-1.5 bg-[#FF5722] text-white font-bold text-[11px] px-2.5 py-1 rounded-lg animate-pulse mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{countdown.formattedText}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${formId}-addressLine1`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                Street Address *
              </label>
              <input
                id={`${formId}-addressLine1`}
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="House No, Street / Road Name"
                className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor={`${formId}-addressLine2`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                  Address Line 2 (Optional)
                </label>
                <input
                  id={`${formId}-addressLine2`}
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apartment, suite, landmark"
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor={`${formId}-deliveryDate`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                  Earliest Delivery Date *
                </label>
                <input
                  id={`${formId}-deliveryDate`}
                  type="date"
                  required
                  min={earliestDateYMD}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${formId}-deliveryNote`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                Delivery Instructions (Optional)
              </label>
              <textarea
                id={`${formId}-deliveryNote`}
                rows={2}
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Leave with gate security, call before arrival"
                className="w-full p-3 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
              />
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl space-y-5 shadow-xs">
            <h2 className="font-heading text-xl font-bold text-[#0D2137] flex items-center gap-2">
              <span className="w-7 h-7 bg-[#E8F4FE] text-[#1B9AE4] text-sm rounded-xl flex items-center justify-center font-extrabold">
                3
              </span>
              Payment Method
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-[#1B9AE4] bg-[#E8F4FE]/60 ring-2 ring-[#1B9AE4]/20"
                    : "border-[#DDE8F0] bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="BANK_TRANSFER"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                  className="mt-1 text-[#1B9AE4] focus:ring-[#1B9AE4]"
                />
                <div>
                  <div className="font-bold text-sm text-[#0D2137]">Direct Bank Transfer</div>
                  <p className="text-xs text-[#0D2137]/70 mt-0.5">
                    Pay via online banking or deposit slip. Bank details provided upon confirmation.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "CARD_ONLINE"
                    ? "border-[#1B9AE4] bg-[#E8F4FE]/60 ring-2 ring-[#1B9AE4]/20"
                    : "border-[#DDE8F0] bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD_ONLINE"
                  checked={paymentMethod === "CARD_ONLINE"}
                  onChange={() => setPaymentMethod("CARD_ONLINE")}
                  className="mt-1 text-[#1B9AE4] focus:ring-[#1B9AE4]"
                />
                <div>
                  <div className="font-bold text-sm text-[#0D2137]">Visa / MasterCard / PayHere</div>
                  <p className="text-xs text-[#0D2137]/70 mt-0.5">
                    Instant secure card payment processing gateway.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs sticky top-24 space-y-5">
            <h2 className="font-heading text-xl font-bold text-[#0D2137] border-b border-[#DDE8F0] pb-3">
              Order Summary
            </h2>

            <div className="divide-y divide-[#DDE8F0] max-h-80 overflow-y-auto pr-1">
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
                  <div key={item.id} className="py-3 flex justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-[#0D2137]">
                        {item.productName} ({item.weightGrams >= 1000 ? `${item.weightGrams / 1000} kg` : `${item.weightGrams} g`}) x {item.quantity}
                      </div>
                      {item.prepName && (
                        <div className="text-[11px] text-[#1B9AE4] font-semibold mt-0.5">
                          Prep: {item.prepName}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-bold text-[#0D2137]">
                      {formatMoney(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#DDE8F0] pt-4 space-y-2.5 text-xs text-[#0D2137]">
              <div className="flex justify-between text-[#0D2137]/70">
                <span>Fish Subtotal</span>
                <span className="font-bold text-[#0D2137]">{formatMoney(subtotalCents)}</span>
              </div>

              {prepTotalCents > 0 && (
                <div className="flex justify-between text-[#0D2137]/70">
                  <span>Preparation Fees</span>
                  <span className="font-bold text-[#0D2137]">{formatMoney(prepTotalCents)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#0D2137]/70">
                <span>Estimated Delivery ({district})</span>
                <span className="font-bold text-[#0D2137]">
                  {formatMoney(estimatedDeliveryFeeCents)}
                </span>
              </div>

              <div className="border-t border-[#DDE8F0] pt-3 flex justify-between items-baseline font-bold text-base text-[#0D2137]">
                <span>Total Amount</span>
                <span className="text-2xl font-extrabold text-[#0D2137]">
                  {formatMoney(estimatedTotalCents)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#0D2137] hover:bg-[#1B9AE4] text-white font-bold text-base rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            <p className="text-center text-[11px] text-[#0D2137]/60 mt-2 flex items-center justify-center space-x-1">
              <Lock className="h-3.5 w-3.5 text-[#1B9AE4]" />
              <span>Safe &amp; Secure Checkout • Cold-Chain Express</span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
