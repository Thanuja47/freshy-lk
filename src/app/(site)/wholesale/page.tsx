"use client";

import { useState } from "react";
import { Building2, Send, CheckCircle2, ShieldCheck, PhoneCall } from "lucide-react";
import { wholesaleEnquirySchema, type WholesaleEnquiryInput } from "@/lib/validators/wholesale";
import { SRI_LANKA_DISTRICTS } from "@/lib/constants";

export default function WholesalePage() {
  const [formData, setFormData] = useState<WholesaleEnquiryInput>({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    businessType: "RESTAURANT",
    district: "Colombo",
    estimatedKgPerWeek: 50,
    message: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof WholesaleEnquiryInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = wholesaleEnquirySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof WholesaleEnquiryInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof WholesaleEnquiryInput;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 600);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-24 md:pb-12 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D2137] via-[#153456] to-[#0D2137] text-white p-8 sm:p-12 rounded-3xl space-y-3 relative overflow-hidden shadow-sm">
        <div className="inline-flex items-center space-x-1.5 bg-white/10 border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-[#1B9AE4]">
          <Building2 className="h-3.5 w-3.5" />
          <span>B2B WHOLESALE &amp; BULK SUPPLY</span>
        </div>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl">
          Seafood Supply for Hotels, Restaurants &amp; Export
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
          Daily bulk supply of fresh catch, custom prep specifications, tier pricing, and dedicated cold-chain delivery across Sri Lanka.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-4">
            <h2 className="font-heading font-bold text-xl text-[#0D2137]">Why Partner with Freshy.lk?</h2>

            <div className="space-y-4 text-xs text-[#0D2137]">
              <div className="flex items-start space-x-3">
                <ShieldCheck className="h-5 w-5 text-[#1B9AE4] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">Volume-Based Tier Pricing</h3>
                  <p className="text-[#0D2137]/70 mt-0.5">Automated discounted tiers for recurring weekly orders above 50 kg.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <ShieldCheck className="h-5 w-5 text-[#1B9AE4] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">Custom Prep Specifications</h3>
                  <p className="text-[#0D2137]/70 mt-0.5">Filleting, portioning, vacuum packing, and custom pack weight sizes tailored for your kitchen staff.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <ShieldCheck className="h-5 w-5 text-[#1B9AE4] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">Guaranteed Cold-Chain Logistics</h3>
                  <p className="text-[#0D2137]/70 mt-0.5">Insulated chilled temperature-controlled delivery direct to your receiving bay.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#E8F4FE] border border-[#1B9AE4]/20 p-6 rounded-2xl text-xs space-y-2 text-[#0D2137]">
            <div className="flex items-center space-x-2 font-bold text-sm text-[#1B9AE4]">
              <PhoneCall className="h-4 w-4" />
              <span>Direct Wholesale Desk</span>
            </div>
            <p className="text-[#0D2137]/80">For urgent bulk procurement or custom quotes:</p>
            <div className="font-bold font-mono text-sm pt-1">+94 77 123 4567 / wholesale@freshy.lk</div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#DDE8F0] p-6 sm:p-8 rounded-2xl shadow-xs">
            <h2 className="font-heading font-bold text-2xl text-[#0D2137] mb-2">Request a Wholesale Quote</h2>
            <p className="text-xs text-[#0D2137]/60 mb-6">Fill in your business details below. Our B2B account manager will respond within 2 hours.</p>

            {submittedSuccess ? (
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-[#27A04E] mx-auto" />
                <h3 className="font-heading font-bold text-xl text-green-900">Enquiry Submitted Successfully!</h3>
                <p className="text-xs text-green-800">
                  Thank you, <strong>{formData.contactName}</strong>. We have received your wholesale request for <strong>{formData.companyName}</strong>. Our commercial team will contact you shortly at <strong>{formData.phone}</strong>.
                </p>
                <button
                  onClick={() => setSubmittedSuccess(false)}
                  className="mt-4 px-4 py-2 bg-[#0D2137] text-white text-xs font-bold rounded-xl hover:bg-[#1B9AE4] transition-colors"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0D2137] mb-1">Company / Business Name *</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Cinnamon Grand Colombo"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                    />
                    {errors.companyName && <p className="text-[11px] text-red-600 mt-1">{errors.companyName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D2137] mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Executive Chef / Purchase Manager"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                    />
                    {errors.contactName && <p className="text-[11px] text-red-600 mt-1">{errors.contactName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0D2137] mb-1">Mobile Phone *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+94 77 123 4567"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                    />
                    {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D2137] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="purchase@hotel.lk"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                    />
                    {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0D2137] mb-1">Business Type *</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value as WholesaleEnquiryInput["businessType"] })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                    >
                      <option value="HOTEL">Hotel</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="CATERING">Catering Service</option>
                      <option value="SUPERMARKET">Supermarket / Retail</option>
                      <option value="EXPORTER">Seafood Exporter</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D2137] mb-1">District *</label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                    >
                      {SRI_LANKA_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0D2137] mb-1">Est. Volume (Kg/wk) *</label>
                    <input
                      type="number"
                      value={formData.estimatedKgPerWeek}
                      onChange={(e) => setFormData({ ...formData, estimatedKgPerWeek: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                    />
                    {errors.estimatedKgPerWeek && <p className="text-[11px] text-red-600 mt-1">{errors.estimatedKgPerWeek}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D2137] mb-1">Product Requirements &amp; Cut Specifications *</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="e.g. 30kg Yellowfin Tuna 100g portions, 20kg Jumbo Tiger Prawns peeled..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#DDE8F0] rounded-xl text-xs focus:ring-2 focus:ring-[#1B9AE4] focus:outline-none"
                  />
                  {errors.message && <p className="text-[11px] text-red-600 mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1B9AE4] hover:bg-[#157ebc] text-white py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-colors shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? "Submitting Request..." : "Submit Wholesale Quote Request"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
