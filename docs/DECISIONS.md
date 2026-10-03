# Architectural Technical Decisions Log (DECISIONS.md)

This log records major technical and architectural decisions made during the development of Freshy.lk.

---

### Decision 001: Integer Cents for Money Storage
- **Date:** 2026-10-02
- **Status:** Approved
- **Context:** Floating-point operations in JavaScript can introduce rounding errors when calculating price per kg, pack totals, prep fees, and taxes.
- **Decision:** All monetary amounts are stored and manipulated as integer LKR cents ($1\text{ LKR} = 100\text{ cents}$).

---

### Decision 002: Invoices Generated Only Upon Confirmed Payment
- **Date:** 2026-10-02
- **Status:** Approved
- **Context:** Invoices must strictly represent confirmed sales to maintain gapless numbering and financial auditability.
- **Decision:** Invoices are generated ONLY when an order transitions to `PLACED` with payment status `PAID` (PayHere callback) or when an admin manually confirms Bank Transfer / COD payments. Invoices are never generated at initial `PENDING_PAYMENT` order creation.

---

### Decision 003: Row Level Security (RLS) Deny-All Defense
- **Date:** 2026-10-02
- **Status:** Approved
- **Context:** Preventing public data leakage from Supabase anonymous client calls.
- **Decision:** RLS is enabled on all tables with 0 public policies. All DB reads/writes occur exclusively via Prisma on the server.

---

### Decision 004: Secrets Audit & Repository Visibility Verification
- **Date:** 2026-10-03
- **Status:** Verified & Passed
- **Context:** Auditing git history to ensure no production secrets, tokens, or credentials were ever committed to source control, and verifying repository privacy.
- **Audit Findings:**
  1. `.env` and `.env.local` files: Verified 0 commits in git history (`git log --all --full-history -- '*.env' '*.env.local'`). `.gitignore` has properly ignored them since initial commit.
  2. Diffs & Commit History: Scanned all commit diffs for token formats (`eyJ...`, API key prefixes, merchant secrets). 0 live secrets found; only placeholder values exist in `.env.example`.
  3. GitHub Repository Privacy: Confirmed via `gh repo view Thanuja47/freshy-lk` that the repository is set to **Private** (`isPrivate: true`).

