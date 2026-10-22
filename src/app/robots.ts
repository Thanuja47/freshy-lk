// src/app/robots.ts — robots.txt generator
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://freshy.lk";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shop", "/fish", "/seafood", "/offers", "/product/", "/delivery", "/contact", "/wholesale"],
        disallow: ["/admin/", "/api/", "/checkout", "/cart", "/order/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
