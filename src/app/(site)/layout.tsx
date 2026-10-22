// src/app/(site)/layout.tsx — Site shell layout with dynamic JSON-LD driven by DB settings
// JSON-LD omits any field not set in settings — no invented addresses, phones, or hours.
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import DemoBanner from "@/components/site/DemoBanner";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

async function getSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.setting.findMany({ select: { key: true, value: true } });
    return Object.fromEntries(
      rows
        .filter((r) => typeof r.value === "string")
        .map((r) => [r.key, r.value as string])
    );
  } catch {
    // DB unavailable (preview without DB) — return empty; JSON-LD will omit optional fields
    return {};
  }
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  const businessName = settings["businessName"] || "Freshy.lk";
  const phone = settings["contactPhone"] || settings["phone"] || null;
  const ogImage = settings["seoOgImage"] || settings["ogImage"] || null;

  // Organization JSON-LD — only include fields we actually have in settings
  const orgJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: businessName,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.svg`,
    description:
      "Fresh seafood and fish delivery direct from Sri Lankan coastal landings to your door.",
    sameAs: [],
  };

  if (phone) {
    orgJsonLd["contactPoint"] = {
      "@type": "ContactPoint",
      telephone: phone,
      contactType: "customer service",
      availableLanguage: ["en", "si"],
    };
  }

  // LocalBusiness JSON-LD — only include fields we actually have
  const localBizJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: businessName,
    url: SITE_URL,
    servesCuisine: "Seafood",
    description:
      "Fresh seafood delivered from Sri Lankan coastal landings to your door.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "LK",
    },
  };

  if (phone) {
    localBizJsonLd["telephone"] = phone;
  }
  if (ogImage) {
    localBizJsonLd["image"] = ogImage;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBizJsonLd) }}
      />
      <DemoBanner />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
