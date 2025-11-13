# Suburbmates V1.1 – Architectural Guards (Non-Negotiable)

This document defines **hard constraints** that must not be violated.

---

## 1. Merchant of Record and Money Flow

- Vendors are the **Merchant of Record (MoR)** for all marketplace transactions
- Vendors are responsible for:
  - Product quality and descriptions
  - Pricing
  - Compliance with Australian Consumer Law
  - Refunds, warranties, and remedies
- Suburbmates:
  - Provides platform, discovery, and payment rails via Stripe
  - Charges commission via `application_fee_amount` and subscription/featured fees
  - Does **not** become a party to sales contracts
  - Does **not** issue refunds

**Forbidden:**
- Any code suggesting Suburbmates is MoR
- Any code suggesting Suburbmates "sells" directly
- Any code guaranteeing product performance

---

## 2. Refunds and Disputes

- Refunds and disputes are **vendor-owned**
- Vendors manage refunds in Stripe as Merchant of Record
- Suburbmates does **not** initiate or process refunds
- Suburbmates may surface dispute tools and enforce policy

**Forbidden:**
- Suburbmates issuing refunds directly to customers
- Suburbmates moving money back to customer accounts
- UX copy implying Suburbmates handles refunds

---

## 3. Directory vs Marketplace Boundaries

- **Directory**: "Who exists in this area?"
- **Marketplace**: "What can I buy?"

**Directory rules:**
- No prices, carts, or checkout
- Surfaces business presence only

**Marketplace rules:**
- Only lists products from vendors with `is_vendor = true` and `vendor_status = 'active'`
- All purchasing flows in Marketplace layer

**Forbidden:**
- Directory embedding Stripe checkout
- Directory displaying product-level pricing
- Marketplace treating non-vendor businesses as sellers

---

## 4. Technology Constraints

**Allowed:**
- Next.js App Router
- Next.js API routes
- Supabase PostgreSQL
- Supabase Auth (JWT)
- Supabase Storage
- Stripe Payments, Billing, and Connect **Standard**
- Sentry for monitoring

**Forbidden:**
- tRPC (any usage)
- Drizzle ORM (any usage)
- MySQL (any usage)
- Legacy "Manus" stack code

---

## 5. Phase 5 Code Constraints

Phase 5 code is **reference only**, not implementation target.

**Forbidden to reuse directly:**
- Database access logic (queries, migrations, schema)
- tRPC procedures
- Auth context and session handling
- Refund and dispute logic
- Money-flow logic assuming platform-as-MoR
- Any code encoding Phase 5 legal/compliance posture

---

## 6. Deadlines and Time-Based Behavior

V1.1 is **quality-first**, **gate-based**, and **not** tied to:
- Phase 5 launch dates
- Any hard-coded cutover date

**Forbidden:**
- Hard-coding launch deadlines as behavior triggers
- Calendar-based behavior changes referencing Phase 5

---

## 7. Schema-Level Guards (High-Level)

**On business entity:**
- `is_vendor` – boolean, default `false`
- `vendor_tier` – enum: `'none' | 'basic' | 'pro'`, default `'none'`
- `vendor_status` – enum: `'inactive' | 'active' | 'suspended'`, default `'inactive'`

**On product entity:**
- `published` – boolean, default `false`
- `delivery_type` – enum: `'download' | 'license_key'`
- LGA association (e.g. `lga_id` / `lga_code`)

**Functional rule:**
- Only products with `published = true` from vendors with `is_vendor = true` and `vendor_status = 'active'` are visible in Marketplace queries

---

## 8. Change Control

These guards are **non-negotiable** by default.

Changes require:
- Founder approval
- Update to SuburbmainsV1.1 specs and BUILD_POLICY.md

PRs violating these guards should be **rejected** by:
- CI checks
- AI PR reviewer rules
- Human code review
