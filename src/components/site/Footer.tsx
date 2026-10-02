import Link from "next/link";
import { Fish } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0B1F2A] text-white border-t border-[#1F6F78] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link href="/" className="flex items-center space-x-2 font-serif text-2xl font-bold mb-4">
            <Fish className="h-6 w-6 text-[#FF6A4D]" />
            <span>Freshy<span className="text-[#FF6A4D]">.lk</span></span>
          </Link>
          <p className="text-sm text-gray-300 leading-relaxed">
            Premium fresh seafood delivered chilled across Sri Lanka. Quality catch from coastal waters directly to your door.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-[#FF6A4D] mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/shop" className="hover:text-white transition-colors">Shop All Fish</Link></li>
            <li><Link href="/wholesale" className="hover:text-white transition-colors">Wholesale Buyers</Link></li>
            <li><Link href="/delivery" className="hover:text-white transition-colors">Cold-Chain Delivery</Link></li>
            <li><Link href="/track" className="hover:text-white transition-colors">Track Order</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-[#FF6A4D] mb-4">Customer Care</h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/refunds" className="hover:text-white transition-colors">Refund Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider text-[#FF6A4D] mb-4">Contact Info</h4>
          <p className="text-sm text-gray-300 mb-2">Colombo & Islandwide Courier</p>
          <p className="text-sm text-gray-300 mb-2">Support: +94 77 123 4567</p>
          <p className="text-sm text-gray-300">Email: support@freshy.lk</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-gray-800 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Freshy.lk. All rights reserved. Sri Lanka Fresh Seafood Online.
      </div>
    </footer>
  );
}
