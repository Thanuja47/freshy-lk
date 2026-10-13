"use client";

import { MessageCircle } from "lucide-react";

// NEXT_PUBLIC_* vars are inlined by Next.js at build time.
// Do NOT import server-side `env` here — it would be evaluated during `next build`.
const whatsappNum =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94770000000";

export default function WhatsAppButton() {
  const href = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(
    "Hello Freshy.lk, I have an inquiry about today's fresh fish!"
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-sm font-semibold pl-0 group-hover:pl-2">
        WhatsApp Order
      </span>
    </a>
  );
}
