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
