# Freshy.lk — Sri Lanka Seafood E-Commerce Platform

Freshy.lk is an online store for Sri Lankan fresh seafood, servicing both individual retail customers and wholesale/B2B buyers (hotels, restaurants, shops).

## Tech Stack
- **Framework:** Next.js (App Router, React 19, TypeScript strict)
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS + custom design tokens
- **Database:** Supabase Postgres + Prisma ORM
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Testing:** Vitest (Unit) & Playwright (E2E)

## Setup & Running Locally

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Start Development Server:**
   ```bash
   pnpm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Verification Commands:**
   ```bash
   pnpm run lint
   pnpm run typecheck
   pnpm test
   pnpm run build
   ```
