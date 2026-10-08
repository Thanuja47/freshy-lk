# Freshy.lk Deployment & Hosting Guide

This guide details how to deploy **Freshy.lk** on **Vercel** (zero-config serverless hosting) and **Hostinger** (VPS / Node.js container hosting) with **zero code modifications**.

---

## 1. Host-Neutral Architecture

Freshy.lk is engineered to be 100% cloud- and host-agnostic:

* **State & Data Persistence**: All database operations use **Prisma** targeting **Supabase PostgreSQL**. Distributed sessions and rate limiting use **Upstash Redis**. Client cart state persists in `localStorage` via Zustand. No orders, session state, or cart state exist in Node.js process memory or local filesystem.
* **File Storage**: Product images and bank slips are stored via **Supabase Storage SDK** (`@supabase/supabase-js`), not local disk or host-specific blob stores.
* **Runtime**: Built strictly on the standard Node.js server runtime (`output: "standalone"` supported). No edge-only APIs or `@vercel/*` host-locked packages are used.
* **Image Optimization**: Utilizes `sharp` (included in `package.json` dependencies) for self-hosted image optimization on Hostinger/VPS environments, while seamlessly leveraging Vercel Image Optimization when hosted on Vercel.
* **Strict Environment Validation**: Environment variables are strictly parsed and validated at server startup via `src/lib/env.ts` (`zod` schema).

---

## 2. Vercel Deployment Setup

Vercel provides automatic deployments, global CDN caching, and managed serverless execution.

### Step-by-Step Vercel Setup

1. **Import Repository**:
   * Connect your GitHub / GitLab / Bitbucket repository to Vercel.
   * Framework Preset: **Next.js**
   * Root Directory: `./`

2. **Configure Environment Variables**:
   In the Vercel Dashboard, under **Project Settings → Environment Variables**, add the following (see `.env.example` for details):
   ```env
   NEXT_PUBLIC_SITE_URL=https://freshy.lk
   NEXT_PUBLIC_APP_ENV=production
   DEMO_MODE=false
   TZ=Asia/Colombo

   # Database & Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   DATABASE_URL=postgresql://postgres:<password>@db.<your-project>.supabase.co:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:<password>@db.<your-project>.supabase.co:5432/postgres

   # Payment Gateway
   PAYHERE_MODE=live
   PAYHERE_MERCHANT_ID=<merchant-id>
   PAYHERE_MERCHANT_SECRET=<merchant-secret>

   # Notifications
   SMS_PROVIDER=notifylk
   NOTIFYLK_USER_ID=<user-id>
   NOTIFYLK_API_KEY=<api-key>
   NOTIFYLK_SENDER_ID=Freshy
   RESEND_API_KEY=<resend-key>
   EMAIL_FROM="Freshy.lk <orders@freshy.lk>"
   OWNER_NOTIFY_EMAIL=owner@freshy.lk
   OWNER_NOTIFY_PHONE=+94771234567
   NEXT_PUBLIC_WHATSAPP_NUMBER=94771234567

   # Security & Monitoring
   CRON_SECRET=<your-high-entropy-cron-secret>
   UPSTASH_REDIS_REST_URL=<upstash-url>
   UPSTASH_REDIS_REST_TOKEN=<upstash-token>
   ```

3. **Deploy & Cron Execution**:
   * Click **Deploy**. Vercel will build and launch the application.
   * Vercel automatically detects `vercel.json` and schedules cron triggers for:
     - `/api/cron/expire-orders` (Daily at 00:00 UTC)
     - `/api/cron/cleanup` (Daily at 03:00 UTC)
     - `/api/cron/price-reminder` (Daily at 08:00 UTC)

---

## 3. Hostinger Setup (VPS / Dedicated Node.js Host)

For deployment on Hostinger VPS (Ubuntu 22.04 / 24.04 LTS), PM2 process manager, and Nginx reverse proxy.

### Step 1: Server Environment Preparation

Log into your VPS via SSH and install Node.js 20+, pnpm, and PM2:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential nginx certbot python3-certbot-nginx

# Enable pnpm and install PM2 globally
sudo corepack enable
sudo npm install -g pm2
```

### Step 2: Codebase & Build Setup

Clone the repository and set up environment configuration:
```bash
# Navigate to web root
cd /var/www
sudo git clone https://github.com/Thanuja47/freshy-lk.git freshy-lk
sudo chown -R $USER:$USER /var/www/freshy-lk
cd /var/www/freshy-lk

# Create production environment configuration
cp .env.example .env.local
nano .env.local  # Fill in production database URLs and credentials

# Install dependencies and build standalone package
pnpm install --frozen-lockfile
pnpm db:migrate:deploy
pnpm build
```

### Step 3: PM2 Process Management

Create a `ecosystem.config.js` file in the root directory:
```javascript
module.exports = {
  apps: [
    {
      name: "freshy-lk",
      script: "node",
      args: ".next/standalone/server.js",
      env: {
        PORT: 3000,
        NODE_ENV: "production",
      },
    },
  ],
};
```

Start the application with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Nginx Reverse Proxy & SSL Setup

Create `/etc/nginx/sites-available/freshy.lk`:
```nginx
server {
    server_name freshy.lk www.freshy.lk;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;
}
```

Enable site configuration and issue SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/freshy.lk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue Let's Encrypt SSL Certificate
sudo certbot --nginx -d freshy.lk -d www.freshy.lk
```

### Step 5: Hostinger Cron Setup (`crontab`)

On Hostinger VPS, scheduled cron tasks are executed using standard system `crontab` calling plain HTTP endpoint routes secured by `CRON_SECRET`:

Edit crontab:
```bash
crontab -e
```

Add the following schedule entries:
```cron
# Expire unpaid pending orders (Daily at midnight)
0 0 * * * curl -s -X GET https://freshy.lk/api/cron/expire-orders -H "Authorization: Bearer dev_cron_secret_123456" > /dev/null 2>&1

# Database cleanup for stale notifications (Daily at 3 AM)
0 3 * * * curl -s -X GET https://freshy.lk/api/cron/cleanup -H "Authorization: Bearer dev_cron_secret_123456" > /dev/null 2>&1

# Stale product price check reminder (Daily at 8 AM)
0 8 * * * curl -s -X GET https://freshy.lk/api/cron/price-reminder -H "Authorization: Bearer dev_cron_secret_123456" > /dev/null 2>&1
```

---

## 4. Host Switch Migration Checklist

When switching from Vercel to Hostinger (or vice versa):

- [ ] **No Code Changes Required**: The codebase automatically adapts.
- [ ] **Export/Verify Environment Variables**: Copy your `.env` variables from Vercel to Hostinger `.env.local`.
- [ ] **Database & Supabase Connection**: Ensure `DATABASE_URL` and `DIRECT_URL` point to your Supabase instance.
- [ ] **Storage Buckets**: Confirm Supabase Storage buckets for product images (`product-images`) and bank slips (`bank-slips`) are active.
- [ ] **Cron Authorization**: Ensure `CRON_SECRET` matches in both your host environment and crontab script headers.
- [ ] **DNS Cutover**: Update A/AAAA DNS records at domain registrar to point to Hostinger VPS IP address.

---

## 5. Hosting Infrastructure Comparison

| Feature | Vercel | Hostinger (VPS / Node.js) |
| :--- | :--- | :--- |
| **Build & Deploy** | Git push trigger serverless build | `git pull && pnpm build` with PM2 |
| **Server Runtime** | Serverless Node.js Functions | Persistent Node.js process (`standalone`) |
| **Image Optimization** | Native Vercel CDN Optimizer | Built-in `sharp` image engine |
| **Cron Trigger** | `vercel.json` managed cron | System `crontab` + `curl` to `/api/cron/*` |
| **State & Persistence** | Supabase Postgres + Upstash Redis | Supabase Postgres + Upstash Redis |
| **Asset Storage** | Supabase Storage SDK | Supabase Storage SDK |
| **SSL Certificate** | Automatic Vercel SSL | Let's Encrypt via Certbot |
