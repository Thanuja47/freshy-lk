import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refunds & Replacements | Freshy.lk",
  description: "Freshness guarantee and refund policy for Freshy.lk seafood orders.",
};

export default function RefundsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-[#DDE8F0] pb-6">
        <h1 className="font-heading text-3xl font-extrabold text-[#0D2137]">Refunds & Freshness Guarantee</h1>
        <p className="text-xs text-[#0D2137]/60">Last updated: October 2026</p>
      </div>

      <div className="prose prose-sm text-[#0D2137]/80 space-y-6 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">1. Freshness Guarantee</h2>
          <p>
            We take pride in the quality of every fish and seafood item we dispatch. If any product arrives compromised in freshness, incorrect in preparation cut, or damaged, notify us within 3 hours of delivery.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">2. How to Request a Replacement or Refund</h2>
          <p>
            Please photograph the item and delivery label, and message our dispatch support line on WhatsApp (+94 77 123 4567) or email orders@freshy.lk with your order number.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[#0D2137]">3. Refund Method</h2>
          <p>
            Approved refunds will be processed via original payment method (for card payments) or bank account transfer within 1 to 2 business days.
          </p>
        </section>
      </div>
    </div>
  );
}
