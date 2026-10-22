// src/app/robots.ts — robots.txt generator
// Non-production (preview/staging/dev): Disallow all crawling — never index preview builds.
// Production only: allow public pages, disallow admin/api/private routes.
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

  if (!isProduction) {
    // Block all crawling on preview / staging / development environments
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/shop",
          "/fish",
          "/seafood",
          "/offers",
          "/product/",
          "/delivery",
          "/contact",
          "/wholesale",
        ],
        disallow: ["/admin/", "/api/", "/checkout", "/cart", "/order/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
