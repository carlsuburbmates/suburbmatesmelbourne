# Suburbmates V1.1 Build Policy (Selective Hybrid Reuse)

This document defines the **locked** build policy for Suburbmates V1.1.

It exists to:
- Keep the codebase aligned with the V1.1 specs.
- Allow **selective hybrid reuse** of Phase 5 code where it is genuinely safe.
- Prevent reintroduction of old assumptions about money flow, auth, or deadlines.

If any code or document conflicts with this file, **this file and the V1.1 specs win**.

---

## 1. Architecture – V1.1 Only

**Canonical stack:**

- Framework: Next.js (App Router)
- Backend: Next.js API routes (no tRPC)
- Database: Supabase PostgreSQL
- Auth: Supabase Auth (JWT-based)
- Payments: Stripe Payments + Stripe Connect **Standard**
- Storage: Supabase Storage
- Monitoring: Sentry

**Not allowed:**
- tRPC (any usage)
- Drizzle ORM (any usage)
- MySQL (any usage)
- Legacy "Manus" platform-specific code

---

## 2. Truth Hierarchy (SSOT)

When there is any disagreement:

1. **SuburbmainsV1.1 markdown specs** (SSOT)
2. This `00_BUILD_POLICY.md`
3. `DEV_NOTES/ARCHITECTURAL_GUARDS.md`
4. Phase 5 code (reference only)
5. Phase 5 architecture (learning only)

Phase 5 code is **not** authoritative.

---

## 3. Selective Hybrid Reuse – Allowed and Forbidden

### 3.1 What We CAN Reuse from Phase 5

1. **UI Components and Layouts**
   - shadcn/ui components and styling patterns
   - Presentational React components that do not embed Phase 5 domain assumptions

2. **Schema-Agnostic Helpers**
   - Validation utilities (email, URL format)
   - Pure functions (formatters, string/number/date helpers)
   - General utilities (debounce, throttle, sorting)

3. **Integration Patterns (Form, Not Substance)**
   - Event sequencing and retry patterns
   - Handler structure and idempotency patterns
   - **NOT:** Old business rules around MoR, refunds, or disputes

4. **Error Handling and Logging**
   - Global error boundaries
   - Logging wrappers and Sentry setup
   - **NOT:** Error messages implying old MoR or refund model

---

### 3.2 What We CANNOT Reuse from Phase 5

These are **forbidden** to reuse directly:

1. **Refund and Dispute Logic**
   - Any code treating platform as Merchant of Record
   - Any code initiating refunds on behalf of platform

2. **Database Queries and ORM Logic**
   - MySQL + Drizzle-based queries
   - Any DB code assuming Phase 5 schema

3. **tRPC Procedures**
   - No tRPC routers or procedures
   - All backend must be **Next.js API routes**

4. **Auth Context and Session Logic**
   - No Manus-specific OAuth
   - No Phase 5 auth providers
   - Must use **Supabase Auth + JWT**

5. **MoR Model Code**
   - Any logic treating platform as Merchant of Record
   - Any platform-issued refunds

6. **Hard Deadline Logic**
   - No references to Phase 5 launch dates
   - No calendar-based behavior triggers

---

## 4. Legal & Compliance Alignment (Non-Negotiable)

- **Vendors are Merchant of Record** for marketplace transactions
- Vendors own refunds, warranties, and dispute responses
- Suburbmates provides platform, discovery, and payment rails
- Suburbmates charges commission and subscription/featured fees
- Suburbmates does **not** issue refunds or move money to customers

---

## 5. Directory vs Marketplace Separation

- **Directory** – businesses and their presence
- **Marketplace** – digital products and orders

Rules:
- Directory pages must **not** show prices, carts, or checkout
- Marketplace must **only** list vendors with `is_vendor = true` and `vendor_status = 'active'`
- Schema and workflows must keep Directory and Marketplace conceptually distinct

---

## 6. How to Use This Policy

- When writing code: check against V1.1 specs and this policy
- When using AI tools: explicitly state: "Apply V1.1 Build Policy. Do not reuse Phase 5 code touching schema, auth, refunds, or MoR."

This file is **locked**. Changes require Founder approval.
