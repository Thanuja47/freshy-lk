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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Freshy.lk | Fresh Seafood & Fish Delivery — Sri Lanka",
    template: "%s | Freshy.lk",
  },
  description:
    "Order fresh fish and seafood online. Direct from Sri Lankan coastal landings, custom prepped and delivered fresh to your door. Same-day delivery in Colombo.",
  keywords: [
    "fresh fish Sri Lanka",
    "seafood delivery Sri Lanka",
    "buy fish online Colombo",
    "fresh fish delivery Colombo",
    "seafood online Sri Lanka",
    "Freshy.lk",
    "fresh prawns delivery",
    "fresh crab delivery Sri Lanka",
  ],
  authors: [{ name: "Freshy.lk" }],
  creator: "Freshy.lk",
  publisher: "Freshy LK (Pvt) Ltd",
  // Non-production builds (preview, staging) must never be indexed
  robots:
    process.env.NEXT_PUBLIC_APP_ENV === "production"
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : { index: false, follow: false },
  icons: {
    icon: "/brand/logo.svg",
    shortcut: "/brand/logo.svg",
    apple: "/brand/logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_LK",
    url: SITE_URL,
    siteName: "Freshy.lk",
    title: "Freshy.lk | Fresh Seafood & Fish Delivery — Sri Lanka",
    description:
      "Order fresh fish and seafood online. Direct from Sri Lankan coastal landings, custom prepped and delivered fresh to your door.",
    images: [
      {
        url: "/brand/og-image.png",
        width: 1200,
        height: 630,
        alt: "Freshy.lk — Fresh Seafood & Fish Delivery Sri Lanka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Freshy.lk | Fresh Seafood & Fish Delivery — Sri Lanka",
    description:
      "Order fresh fish and seafood online. Direct from Sri Lankan coastal landings, custom prepped and delivered fresh to your door.",
    images: ["/brand/og-image.png"],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${plusJakarta.variable}`}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F0F7FF] text-[#0D2137]">
        {children}
      </body>
    </html>
  );
}
