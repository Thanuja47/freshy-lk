"use client";

import { useState, useId, useEffect, useSyncExternalStore } from "react";
const emptySubscribe = () => () => {};
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore, type CartItem } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { SRI_LANKA_DISTRICTS } from "@/lib/constants";
import { calculatePackPriceCents, calculatePrepFeeCents } from "@/lib/pricing";
import { findZoneForDistrict, calculateDeliveryFee, getCutoffCountdown, getDeliveryCutoffMessage, getEarliestDeliveryDate, formatDateYYYYMMDD } from "@/lib/delivery";
import { createOrder, getPaymentGatewayConfig, type CheckoutInput } from "@/actions/checkout";
import { uploadPaymentSlipAction } from "@/actions/orders";
import { Lock, ArrowRight, ArrowLeft, Clock, Calendar } from "lucide-react";

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
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const { items, clearCart } = useCartStore();

  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `retry-${Date.now().toString(36)}`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
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
  const [hasPayHere, setHasPayHere] = useState<boolean>(true);
  const [orderSuccessToken, setOrderSuccessToken] = useState<string | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);

  // Dynamic Bank Details from Settings
  const [bankSettings, setBankSettings] = useState({
    bankName: "Commercial Bank of Ceylon",
    bankAccountName: "Freshy LK (Pvt) Ltd",
    bankAccountNumber: "1000200300",
    bankBranch: "Colombo Main Branch",
  });

  useEffect(() => {
    getPaymentGatewayConfig()
      .then((cfg) => {
        setHasPayHere(cfg.hasPayHere);
        if (!cfg.hasPayHere) {
          setPaymentMethod("BANK_TRANSFER");
        }
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && (data.bankName || data.bankAccountNumber)) {
          setBankSettings({
            bankName: data.bankName || "Commercial Bank of Ceylon",
            bankAccountName: data.bankAccountName || "Freshy LK (Pvt) Ltd",
            bankAccountNumber: data.bankAccountNumber || "1000200300",
            bankBranch: data.bankBranch || "Colombo Main Branch",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Step Validation Helpers
  const validateStep1 = () => {
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage("Please enter your full name.");
      return false;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 9) {
      setErrorMessage("Please enter a valid phone number (at least 9 digits).");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const validateStep2 = () => {
    if (!city.trim() || city.trim().length < 2) {
      setErrorMessage("Please enter your City / Town.");
      return false;
    }
    if (!addressLine1.trim() || addressLine1.trim().length < 3) {
      setErrorMessage("Please enter your Street Address.");
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  const handleNextToAddress = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    }
  };

  const handleNextToPayment = () => {
    if (validateStep1() && validateStep2()) {
      setCurrentStep(3);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
    }
  };

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
  const earliestDateYMD = formatDateYYYYMMDD(earliestDate);

  // Live countdown check
  const countdown = activeZone ? getCutoffCountdown(activeZone.cutoffTime || "12:00") : null;
  const cutoffRuleMessage = getDeliveryCutoffMessage(activeZone, earliestDate);

  const estimatedDeliveryFeeCents = activeZone
    ? calculateDeliveryFee(activeZone, totalCartWeightGrams, subtotalCents)
    : district === "Colombo"
    ? 35000
    : 50000;
  const estimatedTotalCents = subtotalCents + prepTotalCents + estimatedDeliveryFeeCents;

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#1B9AE4] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (orderSuccessToken) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#1B9AE4] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-bold text-[#0D2137]">Order placed successfully! Redirecting...</p>
      </div>
    );
  }

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

  const handleSubmit = async (
    e?: React.FormEvent,
    overrideDeliveryDate?: string,
    overrideIdempotencyKey?: string
  ) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    setErrorMessage(null);
    setPriceChangeNotice(null);
    setDeliveryDateChangedNotice(null);
    setIsSubmitting(true);

    try {
      const activeDeliveryDate =
        overrideDeliveryDate ||
        (earliestDateYMD && deliveryDate < earliestDateYMD ? earliestDateYMD : deliveryDate);
      const activeIdempotencyKey = overrideIdempotencyKey || idempotencyKey;
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
        deliveryDate: activeDeliveryDate,
        paymentMethod,
        idempotencyKey: activeIdempotencyKey,
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
        if (slipFile && result.trackingToken) {
          try {
            const slipFormData = new FormData();
            slipFormData.append("token", result.trackingToken);
            slipFormData.append("file", slipFile);
            await uploadPaymentSlipAction(slipFormData);
          } catch (slipErr) {
            console.warn("Slip upload error on checkout:", slipErr);
          }
        }
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

        setOrderSuccessToken(result.trackingToken);
        clearCart();
        
        router.push(`/order/${result.trackingToken}`);
        return;
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
        if (result.updatedPrices) {
          useCartStore.setState((state) => ({
            items: state.items.map((it) => {
              const freshPrice = result.updatedPrices?.[it.productId];
              return freshPrice ? { ...it, pricePerKgCents: freshPrice } : it;
            }),
          }));
        }
      } else if (result.status === "OUT_OF_STOCK" || result.status === "ZONE_STORAGE_BLOCKED") {
        setErrorMessage(result.message);
      } else {
        setErrorMessage(typeof result.message === "string" ? result.message : "An unexpected error occurred. Please try again or call us.");
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : "";
      const safeMsg = typeof rawMsg === "string" && rawMsg.length > 0
        ? rawMsg
        : "Unable to place your order right now. Please try again or call us.";
      setErrorMessage(safeMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12 space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#DDE8F0] pb-4 space-y-1">
        <h1 className="font-heading font-extrabold text-3xl text-[#0D2137]">Express Checkout</h1>
        <p className="text-xs sm:text-sm text-[#0D2137]/70">No account required. Fast delivery across Sri Lanka.</p>
      </div>

      {/* Interactive 3-Step Wizard Indicator */}
      <div className="flex items-center bg-white p-2.5 rounded-2xl border border-[#DDE8F0] shadow-xs">
        {[
          { step: 1, label: "Contact Info" },
          { step: 2, label: "Delivery Address" },
          { step: 3, label: "Payment Method" },
        ].map(({ step, label }, idx) => {
          const isActive = currentStep === step;
          const isCompleted = currentStep > step;
          return (
            <div key={step} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (step === 1) setCurrentStep(1);
                  else if (step === 2 && validateStep1()) setCurrentStep(2);
                  else if (step === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                }}
                className={`flex items-center gap-2 flex-1 justify-center py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E8F4FE] text-[#1B9AE4] border border-[#1B9AE4]/30 shadow-xs"
                    : isCompleted
                    ? "text-[#2E7D32] hover:bg-emerald-50"
                    : "text-[#0D2137]/40 hover:text-[#0D2137]"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                    isCompleted
                      ? "bg-[#2E7D32] text-white"
                      : isActive
                      ? "bg-[#1B9AE4] text-white"
                      : "bg-gray-200 text-[#0D2137]/60"
                  }`}
                >
                  {isCompleted ? "✓" : step}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
              {idx < 2 && (
                <div
                  className={`w-4 sm:w-8 h-0.5 flex-shrink-0 mx-1 transition-colors ${
                    currentStep > idx + 1 ? "bg-[#2E7D32]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Notices */}
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
            onClick={(e) => {
              const newDate = deliveryDateChangedNotice.newEarliestDate;
              const newIdemKey = window.crypto.randomUUID();
              setDeliveryDate(newDate);
              setIdempotencyKey(newIdemKey);
              setDeliveryDateChangedNotice(null);
              handleSubmit(e, newDate, newIdemKey);
            }}
            className="px-5 py-2.5 bg-[#0D2137] hover:bg-[#1B9AE4] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Confirm New Delivery Date ({deliveryDateChangedNotice.newEarliestDate}) &amp; Place Order
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3 text-sm animate-in fade-in">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold">Please check your details</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
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
            onClick={(e) => {
              const newIdemKey = window.crypto.randomUUID();
              setIdempotencyKey(newIdemKey);
              setPriceChangeNotice(null);
              handleSubmit(e, deliveryDate, newIdemKey);
            }}
            className="px-5 py-2.5 bg-amber-800 text-white rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors cursor-pointer"
          >
            I Accept Updated Prices &mdash; Place Order
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Step Content */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Customer Contact Info */}
          {currentStep === 1 && (
            <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl space-y-5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-3">
                <h2 className="font-heading text-xl font-bold text-[#0D2137] flex items-center gap-2">
                  <span className="w-7 h-7 bg-[#E8F4FE] text-[#1B9AE4] text-sm rounded-xl flex items-center justify-center font-extrabold">
                    1
                  </span>
                  Contact Information
                </h2>
                <span className="text-xs text-[#0D2137]/50 font-medium">Step 1 of 3</span>
              </div>

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
                    className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
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
                    className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
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
                  placeholder="For PDF tax invoice and dispatch updates"
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
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

              {/* Step 1 Next Button */}
              <div className="pt-4 border-t border-[#DDE8F0] flex justify-end">
                <button
                  type="button"
                  onClick={handleNextToAddress}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#1B9AE4] hover:bg-[#1580C2] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Delivery Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Delivery Address & Cut-off Rule */}
          {currentStep === 2 && (
            <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl space-y-5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-3">
                <h2 className="font-heading text-xl font-bold text-[#0D2137] flex items-center gap-2">
                  <span className="w-7 h-7 bg-[#E8F4FE] text-[#1B9AE4] text-sm rounded-xl flex items-center justify-center font-extrabold">
                    2
                  </span>
                  Delivery Address &amp; Schedule
                </h2>
                <span className="text-xs text-[#0D2137]/50 font-medium">Step 2 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={`${formId}-district`} className="block text-xs font-bold uppercase tracking-wider text-[#0D2137]">
                    District *
                  </label>
                  <select
                    id={`${formId}-district`}
                    value={district}
                    onChange={(e) => {
                      const newDistrict = e.target.value;
                      setDistrict(newDistrict);
                      const z = findZoneForDistrict(zones, newDistrict);
                      if (z) setDeliveryDate(formatDateYYYYMMDD(getEarliestDeliveryDate(z)));
                    }}
                    className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-bold"
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
                    placeholder="e.g. Nugegoda / Negombo"
                    className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
                  />
                </div>
              </div>

              {/* Live Cutoff Rule Banner & Countdown */}
              <div className="bg-[#E8F4FE]/60 border border-[#1B9AE4]/20 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0D2137]">{cutoffRuleMessage.headline}</span>
                  <span className="text-[10px] bg-white border border-[#1B9AE4]/20 text-[#1B9AE4] font-bold px-2 py-0.5 rounded-full">
                    {district} Zone
                  </span>
                </div>
                <p className="text-[#0D2137]/70 text-[11px]">{cutoffRuleMessage.subtext}</p>

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
                  className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
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
                    className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-medium"
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
                    className="w-full h-12 px-4 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4] font-bold"
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
                  className="w-full p-3 border border-[#DDE8F0] rounded-xl text-xs text-[#0D2137] bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B9AE4]"
                />
              </div>

              {/* Step 2 Back & Next Buttons */}
              <div className="pt-4 border-t border-[#DDE8F0] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-3 text-xs font-bold text-[#0D2137]/70 hover:text-[#0D2137] hover:bg-gray-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Contact</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextToPayment}
                  className="px-6 py-3.5 bg-[#1B9AE4] hover:bg-[#1580C2] text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Method */}
          {currentStep === 3 && (
            <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl space-y-5 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-[#DDE8F0] pb-3">
                <h2 className="font-heading text-xl font-bold text-[#0D2137] flex items-center gap-2">
                  <span className="w-7 h-7 bg-[#E8F4FE] text-[#1B9AE4] text-sm rounded-xl flex items-center justify-center font-extrabold">
                    3
                  </span>
                  Payment Method
                </h2>
                <span className="text-xs text-[#0D2137]/50 font-medium">Step 3 of 3</span>
              </div>

              <div className="space-y-3">
                {/* Direct Bank Transfer Option */}
                <label
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-[#1B9AE4] bg-[#E8F4FE]/40 ring-2 ring-[#1B9AE4]/20"
                      : "border-[#DDE8F0] bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK_TRANSFER"
                      checked={paymentMethod === "BANK_TRANSFER"}
                      onChange={() => setPaymentMethod("BANK_TRANSFER")}
                      className="mt-1 text-[#1B9AE4] focus:ring-[#1B9AE4]"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-[#0D2137]">Direct Bank Transfer</div>
                      <p className="text-xs text-[#0D2137]/70 mt-0.5">
                        Transfer to our official corporate account via mobile banking or cash deposit slip.
                      </p>

                      {paymentMethod === "BANK_TRANSFER" && (
                        <div className="mt-3 pt-3 border-t border-[#1B9AE4]/20 space-y-3 animate-in fade-in duration-150">
                          <div className="bg-white p-3 rounded-xl border border-[#1B9AE4]/20 font-mono text-xs space-y-1 text-[#0D2137] shadow-xs">
                            <div className="text-[11px] font-bold text-[#1B9AE4] uppercase tracking-wider mb-1">
                              Corporate Bank Account Details
                            </div>
                            <div><span className="font-semibold text-gray-500">Bank:</span> {bankSettings.bankName}</div>
                            <div><span className="font-semibold text-gray-500">Account:</span> {bankSettings.bankAccountName}</div>
                            <div><span className="font-semibold text-gray-500">Account No:</span> <strong className="text-[#0D2137]">{bankSettings.bankAccountNumber}</strong></div>
                            <div><span className="font-semibold text-gray-500">Branch:</span> {bankSettings.bankBranch}</div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-[#0D2137]">
                              Upload Transfer Slip (optional -- you can also upload after placing your order)
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                              className="w-full text-xs text-[#0D2137] file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#1B9AE4] file:text-white hover:file:bg-[#1580C2] cursor-pointer"
                            />
                            <p className="text-[11px] text-[#0D2137]/60">
                              {slipFile ? `Attached: ${slipFile.name}` : "Skip now -- upload your slip from the order tracking page after paying."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </label>

                {/* Card Payment Option */}
                {hasPayHere ? (
                  <label
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "CARD_ONLINE"
                        ? "border-[#1B9AE4] bg-[#E8F4FE]/40 ring-2 ring-[#1B9AE4]/20"
                        : "border-[#DDE8F0] bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
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
                    </div>
                  </label>
                ) : (
                  <div className="text-xs text-[#0D2137]/60 italic p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Card payments currently undergoing scheduled gateway maintenance.
                  </div>
                )}
              </div>

              {/* Step 3 Back to Step 2 */}
              <div className="pt-4 border-t border-[#DDE8F0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-3 text-xs font-bold text-[#0D2137]/70 hover:text-[#0D2137] hover:bg-gray-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Address</span>
                </button>
              </div>
            </div>
          )}
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

            {/* Dynamic Step Action Button */}
            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleNextToAddress}
                className="w-full py-4 bg-[#0D2137] hover:bg-[#1B9AE4] text-white font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Delivery Address</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleNextToPayment}
                className="w-full py-4 bg-[#0D2137] hover:bg-[#1B9AE4] text-white font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Payment Method</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#0D2137] hover:bg-[#1B9AE4] text-white font-bold text-base rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Place Order ({formatMoney(estimatedTotalCents)})</span>
                )}
              </button>
            )}

            <p className="text-center text-[11px] text-[#0D2137]/60 mt-2 flex items-center justify-center space-x-1">
              <Lock className="h-3.5 w-3.5 text-[#1B9AE4]" />
              <span>Safe &amp; Secure Checkout &bull; Fresh Delivery</span>
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
