"use client";

import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  whatsappNumber?: string;
}

export default function WhatsAppButton({ whatsappNumber }: WhatsAppButtonProps) {
  const number = whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!number || number.trim() === "") {
    return null;
  }

  const cleanNum = number.replace(/\D/g, "");
  if (!cleanNum) return null;

  const href = `https://wa.me/${cleanNum}?text=${encodeURIComponent(
    "Hello Freshy.lk, I have an inquiry about today's fresh fish!"
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-sm font-semibold pl-0 group-hover:pl-2">
        WhatsApp Order
      </span>
    </a>
  );
}
