import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Freshy.lk | Fresh Seafood, Fish, Fruits & Vegetables — Sri Lanka",
  description:
    "Order fresh fish, seafood, fruits and vegetables online. Direct from Sri Lankan coastal landings, custom prepped and delivered cold to your door.",
  icons: {
    icon: "/brand/logo.svg",
    shortcut: "/brand/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#F0F7FF] text-[#0D2137]">
        {children}
      </body>
    </html>
  );
}
