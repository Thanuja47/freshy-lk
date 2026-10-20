import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Freshy.lk",
  description: "Common questions about delivery schedules, cut-off rules, payment methods, and preparation options at Freshy.lk.",
};

const FAQS = [
  {
    q: "How does the 12:00 PM cut-off rule work?",
    a: "Orders placed before 12:00 PM (Asia/Colombo) for zones where same-day delivery is active (such as Colombo Metro Express) are prepared and dispatched for same-day delivery. Orders placed after 12:00 PM are scheduled for the next delivery day.",
  },
  {
    q: "What payment methods are supported?",
    a: "We accept Direct Bank Transfer with slip verification, online card payments via PayHere (Visa, MasterCard), and Cash on Delivery (COD) for eligible delivery zones.",
  },
  {
    q: "Can I request custom fish preparation (e.g. curry pieces, steaks)?",
    a: "Yes! During product selection you can choose from available preparation options such as Whole Cleaned, Sliced / Steaks, Curry Cut Pieces, or Filleted. Our prep team processes each item according to your selected specification.",
  },
  {
    q: "How do I upload a bank payment slip?",
    a: "After placing your order with the Bank Transfer option, you will see a receipt upload box on your order tracking page. Simply take a photo or screenshot of your transfer slip and upload it. Our finance team verifies slips promptly.",
  },
  {
    q: "Do you deliver outside Colombo?",
    a: "Yes, Freshy.lk delivers across all 25 districts in Sri Lanka. Outstation zones have dedicated dispatch routes with lead times of 1 to 2 business days.",
  },
  {
    q: "How can I track my order status?",
    a: "You can track your order at any time using your unique tracking link or by visiting /track and entering your mobile phone number.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0D2137]">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-[#0D2137]/70 max-w-lg mx-auto">
          Everything you need to know about placing orders, cut-off timings, delivery zones, and fish preparation.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => (
          <div key={idx} className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-2">
            <h3 className="font-bold text-[#0D2137] text-base flex items-start gap-2">
              <span className="text-[#1B9AE4] font-extrabold">Q.</span>
              <span>{faq.q}</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#0D2137]/75 leading-relaxed pl-6">
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div className="p-6 bg-sand/20 rounded-2xl border border-[#DDE8F0] text-center space-y-3">
        <div className="text-sm font-bold text-[#0D2137]">Still have questions?</div>
        <p className="text-xs text-[#0D2137]/70">Our customer team is available to assist you via WhatsApp or phone call.</p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B9AE4] hover:underline"
        >
          <span>Contact Customer Support</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
