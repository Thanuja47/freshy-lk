import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Freshy.lk",
  description: "Privacy policy and data protection practices of Freshy.lk.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-[#DDE8F0] pb-6">
        <h1 className="font-heading text-3xl font-extrabold text-[#0D2137]">Privacy Policy</h1>
        <p className="text-xs text-[#0D2137]/60">Last updated: October 2026</p>
      </div>

      <div className="prose prose-sm text-[#0D2137]/80 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">1. Information We Collect</h2>
          <p>
            When you place an order on Freshy.lk, we collect your name, delivery address, phone number, and email address solely to process and fulfill your order, communicate delivery status updates via SMS, and provide customer support.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">2. How Your Information is Used</h2>
          <p>
            We do not sell, rent, or trade your personal data with any third parties. Delivery contact details are shared only with our verified courier drivers and dispatch partners solely for delivery coordination.
          </p>
        </section>

        {/* [CLIENT/LEGAL REVIEW REQUIRED — DRAFT TERMS] */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-medium">
          Note: This policy document is currently in draft format and undergoing client legal review prior to final commercial ratification.
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">3. Payment Data Security</h2>
          <p>
            When online card transactions are activated, transactions are processed securely through Central Bank of Sri Lanka approved payment gateway partners (PayHere). Freshy.lk never stores credit or debit card numbers on our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">4. Bank Transfer Receipts</h2>
          <p>
            Bank transfer slips uploaded by customers are stored in private, restricted-access storage buckets accessible only by authorized finance personnel for payment reconciliation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">5. Inquiries & Data Rights</h2>
          <p>
            If you have any questions or wish to request data deletion, contact us at privacy@freshy.lk or +94 11 234 5678.
          </p>
        </section>
      </div>
    </div>
  );
}
