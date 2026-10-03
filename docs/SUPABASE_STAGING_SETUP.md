# Supabase Staging Database Setup Guide (Windows)

This document provides step-by-step instructions for connecting the **Freshy.lk** platform to a live Supabase Postgres staging database from a Windows environment.

> [!IMPORTANT]
> Never commit real database passwords or service role keys to source control. Always store them locally in `.env.local` or securely in deployment environment variables (Vercel / GitHub Secrets).

---

## Prerequisites

- Node.js (v22+) & `pnpm` installed
- A free or paid Supabase account (https://supabase.com)
- Windows PowerShell / Terminal

---

## Step 1: Create Supabase Project

1. Log into your Supabase Dashboard at https://supabase.com/dashboard.
2. Click **New Project** and select your organization.
3. Set the project name to `freshy-lk-staging`.
4. Generate a strong Database Password (store this securely in a password manager).
5. Choose region **ap-southeast-1 (Singapore)** for lowest latency to Sri Lanka.
6. Click **Create new project** and wait ~2 minutes for provision completion.

---

## Step 2: Retrieve Credentials & Connection Strings

1. Navigate to **Project Settings -> Database**:
   - Locate **Connection string** -> **URI**.
   - **Transaction Connection String (Port 6543):**
     `postgresql://postgres.[REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Direct Connection String (Port 5432):**
     `postgresql://postgres.[REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

2. Navigate to **Project Settings -> API**:
   - **Project URL:** `https://[REF].supabase.co`
   - **anon key (public):** `eyJ...`
   - **service_role key (secret):** `eyJ...`

---

## Step 3: Configure `.env.local` on Windows

In your PowerShell terminal, create or update `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

Open `.env.local` and configure your credentials:

```env
# App Mode
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
DEMO_MODE=false
DEMO_ADMIN_PASSCODE=your-secure-demo-passcode
TZ=Asia/Colombo

# Supabase Staging Credentials
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Database Connection Strings (Prisma)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Seed Admin Credentials
SEED_ADMIN_EMAIL=admin@freshy.lk
SEED_ADMIN_PASSWORD=ChangeMe123!
```

---

## Step 4: Push Prisma Schema to Supabase

Run the following command in PowerShell to apply the Prisma schema directly to your staging Supabase Postgres instance:

```powershell
npx prisma db push
```

---

## Step 5: Seed Staging Database

Populate initial categories, products, delivery zones, and seed admin accounts:

```powershell
npx prisma db seed
```

---

## Step 6: Verify Database Connection

Start the Next.js development server:

```powershell
pnpm run dev
```

Visit `http://localhost:3000/admin` and log in using your seed admin credentials or verify live product listing on the storefront.
