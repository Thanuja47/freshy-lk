// tests/unit/link-crawl.test.ts — Comprehensive link crawler and broken link detector
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Link Crawl & Storefront Navigation Integrity", () => {
  const rootDir = process.cwd();

  function routeExists(routePath: string): boolean {
    const cleanPath = routePath.split("?")[0].split("#")[0];
    if (cleanPath === "" || cleanPath === "/") {
      return (
        fs.existsSync(path.join(rootDir, "src/app/(site)/page.tsx")) ||
        fs.existsSync(path.join(rootDir, "src/app/page.tsx"))
      );
    }

    const segments = cleanPath.replace(/^\//, "").split("/");
    const joined = segments.join("/");

    // Possible file locations in Next.js App Router
    const candidates = [
      path.join(rootDir, "src/app", joined, "page.tsx"),
      path.join(rootDir, "src/app/(site)", joined, "page.tsx"),
      path.join(rootDir, "src/app/admin/(protected)", joined, "page.tsx"),
      path.join(rootDir, "src/app/admin", joined, "page.tsx"),
    ];

    return candidates.some((cand) => fs.existsSync(cand));
  }

  function extractInternalLinks(filePath: string): string[] {
    const fullPath = path.join(rootDir, filePath);
    if (!fs.existsSync(fullPath)) return [];
    const content = fs.readFileSync(fullPath, "utf-8");

    const matches: string[] = [];
    // Match href="/..."
    const hrefRegex = /href=["'](\/[^"'#\s]*)/g;
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      const href = match[1];
      if (href.startsWith("/") && !href.startsWith("//")) {
        matches.push(href);
      }
    }
    return Array.from(new Set(matches));
  }

  it("ensures every link in Header.tsx resolves to a valid App Router page", () => {
    const headerLinks = extractInternalLinks("src/components/site/Header.tsx");
    expect(headerLinks.length).toBeGreaterThan(0);

    const missingRoutes: string[] = [];
    for (const href of headerLinks) {
      if (!routeExists(href)) {
        missingRoutes.push(href);
      }
    }
    expect(missingRoutes).toEqual([]);
  });

  it("ensures every link in Footer.tsx resolves to a valid App Router page", () => {
    const footerLinks = extractInternalLinks("src/components/site/Footer.tsx");
    expect(footerLinks.length).toBeGreaterThan(0);

    const missingRoutes: string[] = [];
    for (const href of footerLinks) {
      if (!routeExists(href)) {
        missingRoutes.push(href);
      }
    }
    expect(missingRoutes).toEqual([]);
  });

  it("ensures all core site pages exist with valid page.tsx files", () => {
    const requiredPages = [
      "/",
      "/shop",
      "/fish",
      "/seafood",
      "/offers",
      "/contact",
      "/about",
      "/faq",
      "/delivery",
      "/track",
      "/terms",
      "/privacy",
      "/refunds",
      "/wholesale",
      "/cart",
      "/checkout",
    ];

    for (const page of requiredPages) {
      expect(routeExists(page), `Page route ${page} must exist`).toBe(true);
    }
  });

  it("verifies custom 404 not-found.tsx page exists", () => {
    const notFoundPath = path.join(rootDir, "src/app/not-found.tsx");
    expect(fs.existsSync(notFoundPath)).toBe(true);

    const content = fs.readFileSync(notFoundPath, "utf-8");
    expect(content).toContain("404");
    expect(content).toContain("Off Course at Sea");
  });
});
