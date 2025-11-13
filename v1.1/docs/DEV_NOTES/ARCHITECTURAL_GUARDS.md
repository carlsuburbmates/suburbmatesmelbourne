# Suburbmates V1.1 – Architectural Guards (Non-Negotiable)

This document defines **hard constraints** that must not be violated.

If any implementation, PR, or document conflicts with these guards,  
**the implementation is wrong** and must be changed.

---

## 1. Merchant of Record and Money Flow

- Vendors are the **Merchant of Record (MoR)** for all marketplace transactions.
- Vendors are responsible for:
  - Product quality and descriptions.
  - Pricing.
  - Compliance with Australian Consumer Law and other applicable laws.
  - Refunds, warranties, and remedies.
- Suburbmates:
  - Provides the platform, discovery, and payment rails via Stripe.
  - Charges commission via `application_fee_amount` and subscription/featured fees.
  - Does **not** become a party to the sales contract between vendor and customer.

**Forbidden:**

- Any code or copy suggesting:
  - Suburbmates is Merchant of Record.
  - Suburbmates “sells” products directly on behalf of vendors.
  - Suburbmates guarantees product performance or outcomes.

---

## 2. Refunds and Disputes

- Refunds and disputes are **vendor-owned**.

Rules:

- Customers:
  - Request refunds from vendors directly, or
  - Use Stripe/issuer dispute channels.
- Vendors:
  - Manage refunds in Stripe as Merchant of Record.
- Suburbmates:
  - Does **not** initiate or process refunds.
  - May surface tools to help vendors see/respond to disputes.
  - Uses dispute/refund data to assess vendor risk and enforce policy
    (warnings, suspensions, bans, etc.).

**Forbidden:**

- Any implementation where:
  - Suburbmates issues a refund directly to the customer.
  - Suburbmates programmatically moves money back to a customer account.
  - Suburbmates is described as “responsible for refunds” in UX copy.

---

## 3. Directory vs Marketplace Boundaries

- **Directory**:
  - Represents businesses and their profiles.
  - Answers: “Who exists in this area?”
- **Marketplace**:
  - Represents products and orders.
  - Answers: “What can I buy?”

**Directory rules:**

- No prices, carts, or checkout logic.
- Surfaces business presence only.
- May indicate whether a business sells digital products (e.g. badge, link to vendor storefront).

**Marketplace rules:**

- Only lists products from active vendors.
- Only shows vendors with `is_vendor = true` and `vendor_status = 'active'`.
- All purchasing flows live in the Marketplace layer.

**Forbidden:**

- Directory surfaces that:
  - Directly embed Stripe checkout.
  - Display product-level pricing.
- Marketplace surfaces that:
  - Treat non-vendor businesses as if they can sell.

---

## 4. Technology Constraints

**Allowed core tech:**

- Next.js App Router
- Next.js API routes
- Supabase PostgreSQL
- Supabase Auth (JWT)
- Supabase Storage
- Stripe Payments, Billing, and Connect **Standard**
- Sentry (or equivalent) for monitoring

**Forbidden:**

- tRPC:
  - No tRPC routers, contexts, or client calls.
- Drizzle ORM:
  - No Drizzle schema or query builders.
- MySQL:
  - No MySQL-specific queries, drivers, or references.
- Legacy “Manus” stack code:
  - No direct reuse of Manus auth, DB, or money-flow logic.

Backend interfaces must be **Next.js API routes** only.

---

## 5. Phase 5 Code Constraints

Phase 5 code is:

- A **reference** for patterns.
- A **learning artifact** for what to do (and what not to do).

It is **not** an implementation target.

**Forbidden to reuse directly:**

- Database access logic (queries, migrations, schema assumptions).
- tRPC procedures and data contracts.
- Auth context and session handling.
- Refund and dispute handling logic.
- Money-flow logic assuming:
  - Platform-as-MoR.
  - Platform-controlled refunds.
- Any code that encodes Phase 5 legal/compliance posture.

Any reuse must follow the **Selective Hybrid Reuse** rules in `00_BUILD_POLICY.md`.

---

## 6. Deadlines and Time-Based Behavior

- V1.1 is **quality-first**, **gate-based**, and **not** tied to:
  - Phase 5 launch dates.
  - Any hard-coded cutover date.

**Forbidden:**

- Any code, config, or copy that:
  - Hard-codes launch deadlines as behavior triggers.
  - Changes behavior after a specific historic date based on Phase 5 planning.

All gating should be feature-/quality-based, not calendar-based.

---

## 7. Schema-Level Guards (High-Level)

These must exist and be respected (exact naming may differ, but concepts must be present):

- On the business entity:
  - `is_vendor` – boolean, default `false`.
  - `vendor_tier` – enum: `'none' | 'basic' | 'pro'`, default `'none'`.
  - `vendor_status` – enum: `'inactive' | 'active' | 'suspended'`, default `'inactive'`.

- On the product entity:
  - `published` – boolean, default `false`.
  - `delivery_type` – enum: `'download' | 'license_key'`.
  - LGA association (e.g. `lga_id` / `lga_code`).

**Functional implications:**

- Only products with `published = true` from vendors with:
  - `is_vendor = true` and `vendor_status = 'active'`
  are visible in Marketplace queries.

---

## 8. Change Control

These guards are **non-negotiable** by default.

- Changes require:
  - Founder approval, and
  - Update to `SuburbmainsV1.1` specs and `00_BUILD_POLICY.md`.

Any PR that violates these guards should be **rejected** by:

- CI checks,
- AI PR reviewer rules,
- Human code review.

This file should be treated as a contract between:
- Product,
- Engineering,
- Legal/compliance.
