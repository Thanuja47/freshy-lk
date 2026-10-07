import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0D2137] text-white border-t border-white/10 pt-14 pb-24 md:pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="space-y-4">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo.svg"
              alt="Freshy.lk"
              width={160}
              height={44}
              className="h-10 w-auto brightness-0 invert"
            />
          </Link>
          <p className="text-xs text-white/65 leading-relaxed max-w-sm">
            Fresh seafood and farm produce delivered chilled to your doorstep, islandwide.
          </p>
          <a
            href="https://wa.me/94771234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#20bd5a] transition-colors shadow-xs"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Order via WhatsApp</span>
          </a>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1E88E5] mb-4">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-xs text-white/65">
            <li><Link href="/shop" className="hover:text-white transition-colors">Shop Today&apos;s Catch</Link></li>
            <li><Link href="/shop?category=fish" className="hover:text-white transition-colors">Fresh Fish</Link></li>
            <li><Link href="/shop?category=seafood" className="hover:text-white transition-colors">Seafood &amp; Shellfish</Link></li>
            <li><Link href="/shop?category=fruits" className="hover:text-white transition-colors">Fruits</Link></li>
            <li><Link href="/shop?category=vegetables" className="hover:text-white transition-colors">Vegetables</Link></li>
            <li><Link href="/shop?deals=true" className="hover:text-white transition-colors">Offers &amp; Deals</Link></li>
            <li><Link href="/wholesale" className="hover:text-white transition-colors">Wholesale &amp; B2B</Link></li>
          </ul>
        </div>

        {/* Customer care */}
        <div>
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1E88E5] mb-4">
            Customer Care
          </h4>
          <ul className="space-y-2.5 text-xs text-white/65">
            <li><Link href="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/delivery" className="hover:text-white transition-colors">Delivery Zones &amp; Rules</Link></li>
            <li><Link href="/track" className="hover:text-white transition-colors">Track Your Order</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/refunds" className="hover:text-white transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#1E88E5] mb-4">
            Contact Info
          </h4>
          <ul className="space-y-3 text-xs text-white/65">
            <li className="flex items-start space-x-2.5">
              <MapPin className="h-4 w-4 text-[#1B9AE4] shrink-0 mt-0.5" />
              <span>Colombo &amp; Islandwide Chilled Delivery</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Phone className="h-4 w-4 text-[#1B9AE4] shrink-0" />
              <span>+94 77 123 4567</span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Mail className="h-4 w-4 text-[#1B9AE4] shrink-0" />
              <span>support@freshy.lk</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
        <p>© {new Date().getFullYear()} Freshy.lk. All rights reserved.</p>
        <div className="flex items-center space-x-4">
          <span>Chilled delivery</span>
          <span>•</span>
          <span>Islandwide courier</span>
          <span>•</span>
          <span>Prices updated daily</span>
          <span>•</span>
          <Link href="/admin/login" className="hover:text-white/70 transition-colors">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
