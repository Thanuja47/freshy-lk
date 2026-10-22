import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import DemoBanner from "@/components/site/DemoBanner";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

// Organization JSON-LD for rich Google results
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Freshy.lk",
  legalName: "Freshy LK (Pvt) Ltd",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo.svg`,
  description:
    "Fresh seafood and fish delivery direct from Sri Lankan coastal landings to your door.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "LK",
    addressLocality: "Colombo",
    addressRegion: "Western Province",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+94-77-123-4567",
    contactType: "customer service",
    availableLanguage: ["en", "si"],
  },
  sameAs: [],
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: "Freshy.lk",
  image: `${SITE_URL}/brand/og-image.png`,
  url: SITE_URL,
  telephone: "+94-77-123-4567",
  priceRange: "Rs. 500 – Rs. 5000",
  servesCuisine: "Seafood",
  description: "Fresh seafood delivered from Sri Lankan coastal landings to your door.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "LK",
  },
  hasMap: "https://maps.google.com/?q=Colombo,Sri+Lanka",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "07:00",
    closes: "18:00",
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <DemoBanner />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
