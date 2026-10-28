// src/app/(site)/contact/page.tsx — Freshy.lk Contact Page
import { Metadata } from "next";
import Image from "next/image";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Freshy.lk | Customer Support & Operating Hub",
  description: "Get in touch with Freshy.lk for customer assistance, seafood order inquiries, and wholesale requests.",
};

export const dynamic = "force-dynamic";

function formatCutoffRule(cutoffTimeStr?: string | null): string {
  if (!cutoffTimeStr) return "12:00 PM Daily Cut-Off Rule";
  const [hStr, mStr] = cutoffTimeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || "0", 10);
  if (isNaN(h)) return "12:00 PM Daily Cut-Off Rule";
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const minFormatted = m > 0 ? `:${m.toString().padStart(2, "0")}` : ":00";
  return `${hour12}${minFormatted} ${period} Daily Cut-Off Rule`;
}

export default async function ContactPage() {
  const settings = await getSiteSettings();

  // Read default zone cut-off rule
  let cutoffText: string | null = null;
  try {
    const defaultZone = await db.deliveryZone.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { cutoffTime: true, name: true },
    });
    cutoffText = formatCutoffRule(defaultZone?.cutoffTime);
  } catch {
    cutoffText = "12:00 PM Daily Cut-Off Rule";
  }

  const hasPhone = Boolean(settings.supportPhone && settings.supportPhone.trim().length > 0);
  const hasWhatsapp = Boolean(settings.supportWhatsapp && settings.supportWhatsapp.trim().length > 0);
  const hasPhoneOrWa = hasPhone || hasWhatsapp;
  const hasEmail = Boolean(settings.supportEmail && settings.supportEmail.trim().length > 0);
  const hasLocation = Boolean(settings.operatingAddress && settings.operatingAddress.trim().length > 0);
  const hasHours = Boolean(settings.supportHours && settings.supportHours.trim().length > 0);

  const cleanPhone = settings.supportPhone ? settings.supportPhone.replace(/[^+\d]/g, "") : "";
  const cleanWa = settings.supportWhatsapp ? settings.supportWhatsapp.replace(/\D/g, "") : "";

  return (
    <div className="w-full bg-white selection:bg-[#1E88E5]/20 overflow-x-clip">
      {/* Soft Blue Top Hero Section with Fish Decor */}
      <section className="relative w-full bg-gradient-to-b from-[#EAF4FD] via-[#F7FBFF] to-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Left Fish Decor — Colourful Salmon Fillet with Herbs */}
        <div
          className="absolute left-0 top-4 w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] md:w-[320px] md:h-[320px] -translate-x-6 sm:-translate-x-10 md:-translate-x-16 pointer-events-none select-none z-0"
          aria-hidden="true"
          style={{
            WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(to right, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Image
            src="/contact/decor-salmon.webp"
            alt=""
            width={320}
            height={320}
            loading="lazy"
            className="w-full h-full object-contain object-left"
          />
        </div>

        {/* Right Fish Decor — Sea Fish with Lemon & Spices */}
        <div
          className="absolute right-0 top-4 w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] md:w-[320px] md:h-[320px] translate-x-6 sm:translate-x-10 md:translate-x-16 pointer-events-none select-none z-0"
          aria-hidden="true"
          style={{
            WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
            maskImage: "linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Image
            src="/contact/decor-citrus-fish.webp"
            alt=""
            width={320}
            height={320}
            loading="lazy"
            className="w-full h-full object-contain object-right"
          />
        </div>

        {/* Hero Title & Subtitle */}
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#0D2137]">
            Contact Freshy.lk
          </h1>
          <p className="text-sm sm:text-base text-[#0D2137]/70 max-w-xl mx-auto leading-relaxed">
            Get in touch with our team for questions regarding fresh seafood orders, harbor deliveries, and wholesale supply.
          </p>
        </div>

        {/* Three Contact Cards Grid */}
        <div className="relative z-10 max-w-5xl mx-auto mt-10">
          {hasPhoneOrWa || hasEmail || hasLocation ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Phone & WhatsApp */}
              {hasPhoneOrWa && (
                <div className="bg-white border border-[#CFE6F9] p-6 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center flex flex-col items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EAF4FD] text-[#1E88E5] flex items-center justify-center shadow-2xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0D2137] text-base">
                        Phone &amp; WhatsApp
                      </h3>
                      <p className="text-xs text-[#0D2137]/60 mt-1">
                        Call us or message on WhatsApp for instant order assistance.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 w-full">
                    {hasPhone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="block text-sm font-bold text-[#1E88E5] hover:underline"
                      >
                        {settings.supportPhone}
                      </a>
                    )}
                    {hasWhatsapp && (
                      <a
                        href={`https://wa.me/${cleanWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#25D366] hover:underline"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp: {settings.supportWhatsapp}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Card 2: Email */}
              {hasEmail && (
                <div className="bg-white border border-[#CFE6F9] p-6 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center flex flex-col items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EAF4FD] text-[#1E88E5] flex items-center justify-center shadow-2xs">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0D2137] text-base">
                        Email Inquiries
                      </h3>
                      <p className="text-xs text-[#0D2137]/60 mt-1">
                        For customer orders, billing, and wholesale partnerships.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 w-full">
                    <a
                      href={`mailto:${settings.supportEmail}`}
                      className="block text-sm font-bold text-[#1E88E5] hover:underline"
                    >
                      {settings.supportEmail}
                    </a>
                    {settings.responseTimeText && (
                      <span className="text-xs text-[#0D2137]/60 block">
                        {settings.responseTimeText}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Card 3: Location / Operating Hub */}
              {hasLocation && (
                <div className="bg-white border border-[#CFE6F9] p-6 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center flex flex-col items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EAF4FD] text-[#1E88E5] flex items-center justify-center shadow-2xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0D2137] text-base">
                        Operating Hub
                      </h3>
                      {settings.hubDescription && (
                        <p className="text-xs text-[#0D2137]/60 mt-1">
                          {settings.hubDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-[#0D2137]/80 pt-2 font-medium">
                    {settings.operatingAddress}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-[#0D2137]/60 bg-white/70 backdrop-blur-xs border border-[#CFE6F9] rounded-[20px] p-6">
              Contact channels are currently being updated. Please use the form below to reach us.
            </div>
          )}

          {/* Operating Hours Bar */}
          {(hasHours || cutoffText) && (
            <div className="mt-6 bg-[#EAF4FD] border border-[#CFE6F9] p-5 sm:p-6 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-10 h-10 rounded-full bg-[#1E88E5] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0D2137]">
                    Customer Support Hours
                  </div>
                  {hasHours && (
                    <div className="text-xs text-[#0D2137]/70 mt-0.5">
                      {settings.supportHours}
                    </div>
                  )}
                </div>
              </div>
              {cutoffText && (
                <div className="text-xs font-bold text-[#1E88E5] bg-white px-3.5 py-1.5 rounded-xl border border-[#CFE6F9] shadow-2xs shrink-0">
                  {cutoffText}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content: Contact Form Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <ContactForm />
      </section>
    </div>
  );
}
