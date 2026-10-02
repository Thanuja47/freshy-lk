"use client";

import { MessageCircle } from "lucide-react";
import { env } from "@/lib/env";

export default function WhatsAppButton() {
  const whatsappNum = env.NEXT_PUBLIC_WHATSAPP_NUMBER || "94770000000";
  const href = `https://wa.me/${whatsappNum}?text=${encodeURIComponent("Hello Freshy.lk, I have an inquiry about today's fresh fish!")}`;

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
