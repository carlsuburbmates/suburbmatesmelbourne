# Suburbmates V1.1 Build Policy (Selective Hybrid Reuse)

This document defines the **locked** build policy for Suburbmates V1.1.

It exists to:

- Keep the codebase aligned with the V1.1 specs in `SuburbmainsV1.1`.
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
- Payments: Stripe Payments + Stripe Billing + Stripe Connect **Standard**
- Storage: Supabase Storage
- Monitoring: Sentry (or equivalent) for error logging

**Not allowed:**

- tRPC (any usage)
- Drizzle ORM (any usage)
- MySQL (any usage)
- Legacy “Manus” platform-specific code paths

Architecture must match the V1.1 specs, not the Phase 5 stack.

---

## 2. Truth Hierarchy (SSOT)

When there is any disagreement:

1. **SuburbmainsV1.1 markdown specs** (SSOT)
2. This `00_BUILD_POLICY.md`
3. `DEV_NOTES/ARCHITECTURAL_GUARDS.md`
4. Phase 5 code (reference only)
5. Phase 5 architecture (learning only)

Phase 5 code and architecture are **not** authoritative.  
They may inform decisions but never override the V1.1 specs.

---

## 3. Selective Hybrid Reuse – Allowed and Forbidden

We use **Selective Hybrid Reuse**:

- Clean V1.1 architecture.
- Reuse **only** well-scoped pieces of Phase 5 that are safe and schema-agnostic.
- Re-implement all critical business logic for V1.1.

### 3.1 What We CAN Reuse from Phase 5

These are allowed, after sanity check:

1. **UI Components and Layouts**
   - shadcn/ui components and styling patterns.
   - Presentational React components that:
     - Do not embed Phase 5 domain assumptions.
     - Do not call Phase 5 APIs, tRPC, or DB directly.

2. **Schema-Agnostic Helpers**
   - Validation utilities (e.g. email format, URL validation).
   - Pure functions (formatters, string/number/date helpers).
   - General-purpose utilities (e.g. debounce, throttle, sorting helpers).

3. **Integration Patterns (Form, Not Substance)**
   - **Allowed to reuse:**
     - Event sequencing (e.g. Stripe webhook event ordering).
     - Retry patterns and idempotency patterns.
     - Handler structure (e.g. “router” style switch over event types).
   - **Not allowed to inherit:**
     - Old business rules around:
       - Who is Merchant of Record.
       - Who owns refunds.
       - How disputes are decided.
       - Platform-owned refunds or platform-as-MoR logic.

   All business rules must be re-implemented based on the V1.1 specs and the vendor-as-MoR model.

4. **Error Handling and Logging Patterns**
   - Global error boundaries.
   - Logging wrappers and Sentry client setup.
   - Shared error-display components that do not encode old legal/financial assumptions.

   **Important:**  
   Error handling reuse is limited to **mechanics**, not **semantics**:

   - Do **not** reuse error messages or flows that:
     - Refer to the old platform name.
     - Imply platform-owned refunds.
     - Suggest the old MoR/refund model.

---

### 3.2 What We CANNOT Reuse from Phase 5

These are **forbidden** to reuse directly. They must be re-implemented for V1.1:

1. **Refund and Dispute Logic**
   - Any code that:
     - Initiates refunds on behalf of the platform.
     - Treats the platform as Merchant of Record.
     - Encodes Phase 5-specific refund/dispute policies.

   In V1.1:
   - Vendors are Merchant of Record.
   - Vendors own refunds and dispute responses.
   - Suburbmates logs, automates, and enforces policy; it does **not** move money back to customers.

2. **Database Queries and ORM Logic**
   - Any MySQL + Drizzle-based queries.
   - Any DB code that assumes the Phase 5 schema.
   - Any migration logic targeting Phase 5 databases.

   All persistence logic must target the **Supabase PostgreSQL V1.1 schema**.

3. **tRPC Procedures**
   - No reuse of tRPC routers, procedures, or types.
   - All backend interfaces must be expressed as **Next.js API routes** and typed accordingly.

4. **Auth Context and Session Logic**
   - No reuse of Manus-specific OAuth or auth context.
   - No reuse of Phase 5 auth providers, guards, or session handling.

   V1.1 auth must be implemented with **Supabase Auth + JWT**, following V1.1 specs.

5. **MoR Model Code**
   - Any logic that:
     - Treats the platform as Merchant of Record.
     - Issues refunds from the platform account.
     - Handles chargebacks as if the platform is the seller.

   All money-flow logic must follow:
   - Vendors are Merchant of Record (MoR).
   - Stripe Connect Standard direct charges.
   - Platform revenue via `application_fee_amount` and subscriptions.

6. **Hard Deadline / Launch Date Logic**
   - Any code or copy that:
     - References old Phase 5 launch dates.
     - Treats any calendar date as a hard constraint for behavior.

   V1.1 is **quality-first** and **gate-based**, not date-driven.

---

## 4. Legal & Compliance Alignment (Non-Negotiable)

All reused code and patterns must comply with the V1.1 legal/compliance posture:

- **Vendors are Merchant of Record** for marketplace transactions.
- Vendors own:
  - Refunds,
  - Warranties and remedies,
  - Responses to disputes/chargebacks.
- Suburbmates:
  - Provides platform, discovery, and payment rails (via Stripe).
  - Charges commission and subscription/featured fees.
  - Logs events, automates notifications, and enforces marketplace policy.
  - Does **not** issue refunds or move money back to customers.

Any code or copy that violates this must be refactored or removed.

---

## 5. Directory vs Marketplace Separation

All code must respect the distinction between:

- **Directory** – businesses and their presence:
  - Who exists in an area.
  - Business profiles, LGA, categories, contact details.
- **Marketplace** – digital products and orders:
  - What can be purchased.
  - Digital downloads and license keys from active vendors.

Rules:

- Directory pages and APIs must **not** show prices, carts, or checkout.
- Marketplace pages and APIs must **not** list non-vendor businesses as if they sell products.
- Schema, API, and workflows must keep Directory entities and Marketplace entities conceptually distinct.

---

## 6. How to Use This Policy (Developers and AI Tools)

- When writing or reviewing code:
  - Always check against:
    - `SuburbmainsV1.1` specs,
    - This `00_BUILD_POLICY.md`,
    - `ARCHITECTURAL_GUARDS.md`.
  - If something conflicts, change the code, not the policy (unless explicitly approved).

- When using AI tools (e.g. Copilot, ChatGPT):
  - In prompts, explicitly state:
    - “Apply the V1.1 Build Policy (Selective Hybrid Reuse) and SuburbmainsV1.1 specs.  
      Do not reuse any Phase 5 code that touches schema, auth, refunds, or MoR.  
      UI/components/helpers only.”

This file is **locked**. Changes require Founder approval.
