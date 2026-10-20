import { Metadata } from "next";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Freshy.lk",
  description: "Get in touch with Freshy.lk. Fresh seafood delivered across Sri Lanka. Customer support, harbor landing inquiries, and wholesale assistance.",
};

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0D2137]">
          Contact Freshy.lk
        </h1>
        <p className="text-sm sm:text-base text-[#0D2137]/70 max-w-xl mx-auto">
          Have a question about your order, delivery zones, or bulk seafood supply? We are here to help every day from 6:00 AM to 8:00 PM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Phone & WhatsApp */}
        <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-3 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#E8F4FE] text-[#1B9AE4] flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#0D2137] text-base">Phone & WhatsApp</h3>
          <p className="text-xs text-[#0D2137]/60">Call us or message on WhatsApp for instant order support.</p>
          <div className="space-y-1 pt-2">
            <a href="tel:+94112345678" className="block text-sm font-bold text-[#1B9AE4] hover:underline">
              +94 11 234 5678
            </a>
            <a
              href="https://wa.me/94771234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#25D366] hover:underline mt-1"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp: +94 77 123 4567
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-3 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#E8F4FE] text-[#1B9AE4] flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#0D2137] text-base">Email Inquiries</h3>
          <p className="text-xs text-[#0D2137]/60">For order inquiries, billing, and wholesale partnerships.</p>
          <div className="space-y-1 pt-2">
            <a href="mailto:orders@freshy.lk" className="block text-sm font-bold text-[#1B9AE4] hover:underline">
              orders@freshy.lk
            </a>
            <span className="text-xs text-[#0D2137]/60">Response within 2 hours</span>
          </div>
        </div>

        {/* Operations Hub */}
        <div className="bg-white border border-[#DDE8F0] p-6 rounded-2xl shadow-xs space-y-3 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#E8F4FE] text-[#1B9AE4] flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#0D2137] text-base">Operating Hub</h3>
          <p className="text-xs text-[#0D2137]/60">Packing and dispatch hub in Colombo 03.</p>
          <div className="text-xs text-[#0D2137]/80 pt-2 font-medium">
            No. 45, Oceanfront Avenue<br />Colombo 03, Sri Lanka
          </div>
        </div>
      </div>

      {/* Operating Hours Banner */}
      <div className="bg-[#E8F4FE]/50 border border-[#1B9AE4]/20 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1B9AE4] text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-[#0D2137]">Harbor Operations & Customer Support Hours</div>
            <div className="text-xs text-[#0D2137]/70">Monday – Saturday: 6:00 AM – 8:00 PM | Sunday: 6:00 AM – 2:00 PM (Asia/Colombo)</div>
          </div>
        </div>
        <div className="text-xs font-bold text-[#1B9AE4] bg-white px-3 py-1.5 rounded-xl border border-[#1B9AE4]/20 shadow-2xs">
          12:00 PM Daily Cut-Off Rule
        </div>
      </div>
    </div>
  );
}
