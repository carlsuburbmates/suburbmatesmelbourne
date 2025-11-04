# SuburbMates — Single Source of Truth (SSOT) **LOCKED**
(⚠️ Pending 25 open items — see `/docs/SSOT_AMBIGUITY_TRACKER.md` (v 5.2 companion)
SSOT content remains authoritative; Ambiguity Tracker defines clarifications required before Phase 6 execution.)

**Version:** 5.2 (Authoritative)
**Date:** Nov 2025
**Owner:** Planner/Architect
**File:** `docs/SSOT.md` (must only change via PR approved by SSOT Owner)

> This document governs: **design system**, **tooling/stack**, **trusted codebase**, **what survives vs. deleted**, **exact merge & build phases (order)**, and **phase-gates**.
> If a proposal contradicts this SSOT, it does **not** ship.

---

## 0) Canonical Context (What we're merging, what we trust)

We historically had 4 sources:

1. **`suburbmatesmelbourne` (Copilot repo; current working base)**

   * React + Vite + TypeScript, Tailwind + shadcn/ui + Framer Motion
   * tRPC + Express server; Drizzle ORM; MySQL/TiDB-compatible schema
   * Core pages: `Home`, `Directory`, `BusinessProfile`, `ListBusiness`, Auth
   * Melbourne postcodes dataset, consent tracking, ABN verification UI/flow
   * **✅ This is our BASELINE.** Everything merges **into** this codebase.

2. **`suburbmates` (original MVP zip)**

   * Working backend flows: business creation, agreements, consents, geofence
   * ABN verification plan + role model (buyer/owner/vendor/admin)
   * **✅ Canonical source for backend behavior & schema** (after refactor to Drizzle+tRPC).

3. **`suburbmates2` (partial PWA/AI zip)**

   * PWA (manifest/SW), AI description generator, suburb autocomplete
   * Partial marketplace attempts (not fully finished)
   * **🟡 Donor of discrete, complete features only** (PWA/AI/autocomplete). No wholesale import.

4. **`suburbmates-deepagent` (DeepAgent zip)**

   * Agentic workflows, Manus integrations, "autonomous helper" concepts
   * **🟡 Reference only.** Import **logic** that runs locally; reject Manus-locked code.

**Rule of Rules**

* The **only active app** is the Copilot repo base.
* We **merge into** it in controlled phases, never switch bases.
* Every phase ends with a **hard verification gate**. No green, no go.

---

## 1) Canonical Design System (Frozen)

**Palette (locked)**

* Forest Green `#2D5016` (primary), Emerald `#50C878` (success/active), Gold `#FFD700` (trust/CTA)
* Greys/charcoal for text/borders, high contrast; mobile-first tap targets

**Typography**

* Inter-class modern sans; bold headlines; 14–16 base mobile; 44px min tap; WCAG 2.2 AA

**Components (authoritative set)**

* All `client/src/components/ui/*` from the Copilot repo (shadcn/Radix patterns)
* Skeletons, Cards, Badge, Dialog, Drawer, Tabs, Toast (Sonner), Form (react-hook-form)
* Framer Motion allowed for micro-interactions only (no gratuitous motion)

**Layouts**

* Mobile-first card grids; clear vendor CTA surfaces; consistent spacing scale
* `DashboardLayout` is canonical for dashboard-class pages (vendor/admin)

**Trust/Compliance**

* **ABN Verified** badge visual locked; appears on business profile & list cards when verified
* Consent banner UX from Copilot repo is canonical

**Hard Rejections**

* Any competing component library/styles from older zips
* Inline ad-hoc styles that break the system
* Unstyled dashboard pages ported from legacy

---

## 2) Canonical Tooling / Stack (Frozen)

**Frontend**

* React 19 + TypeScript + Vite; Tailwind (tokens above) + shadcn/ui + Radix
* Router: keep whatever is in Copilot repo (wouter/React Router). Don't swap mid-phase.

**Backend**

* Node/Express + **tRPC v10** (all app APIs)
* **Drizzle ORM** (all data access + migrations)
* DB: MySQL/TiDB-compatible in dev; SQL portability respected
* ABN verification client is **server-only**, 24h cache for ABR responses (no keys client-side)

**Auth & Roles**

* Passwordless email/session cookies (as implemented)
* Roles: `buyer` (default), `business_owner`, `vendor`, `admin`
* No Supabase/Manus auth UIs in prod paths

**Payments**

* **Stripe Checkout Sessions (redirect)** for marketplace payments (Elements only if the SSOT changes)
* Connect application fee computed server-side (tier-based)

**PWA & AI**

* PWA manifest + service worker (from Suburbmates2, adapted to Vite)
* AI listing description generation **server-side** only (tRPC mutation wraps model call)

**Analytics**

* Keep the single analytics path currently wired (no double tracking).
* Consent gating enforced (no send before consent).

**Testing / Budgets**

* Vitest unit; Playwright smoke/E2E
* **Core Web Vitals budgets:** LCP ≤ 2.0s, INP ≤ 200ms, CLS ≤ 0.05
* **A11y:** axe CI 0 serious/critical

**Forbidden Without Abstraction**

* Manus-specific agent runtime, storage, or dashboards
* Any client-side AI key use
* Non-tRPC APIs, raw SQL in app code

---

## 3) Marketplace Operations (Decisions We Already Locked)

**Roles & Upgrades**

* Business Owner → (upgrade) Vendor **BASIC** → (subscription) Vendor **FEATURED**
* **FEATURED**: **$29/mo**, Stripe Billing subscription (price id env-driven)

**Fees (application_fee on Connect)**

* **BASIC:** **8.00% + $0.50**
* **FEATURED:** **6.00% + $0.50**

**Catalog & Limits**

* Kinds: **Physical / Digital / Service**
* Fulfillment: **Pickup / Delivery / Digital**
* Limits: **BASIC: 12 products**; **FEATURED: 48 products**
* Featured card height uses 2x sizing vs. Basic in the feed

**Ranking Boosts (search ordering multiplier)**

* Featured **1.25×** ; ABN Verified **1.05×**

**Claims**

* `/claim/:businessId` – user can request claim; **admin approval required**
* `businesses.claimStatus`: UNCLAIMED/PENDING/CLAIMED/REJECTED (append-only log in `business_claims`)

**Refunds & Disputes (Platform Stance)**

* **Platform is a facilitator only**. Vendor owns **fulfillment**, **refunds**, **chargeback evidence**.
* **Email/footer disclaimer required** in all buyer/vendor/admin emails.
* Refund UI = buyer request → vendor decision; orders update via **Stripe webhooks**
* Disputes tracked in `dispute_log` from **dispute.created/closed** webhooks

**Stripe Integration (locked)**

* **Checkout Sessions (redirect)** for order payment
* Billing for FEATURED ($29/mo)
* Webhooks handled: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`, `charge.dispute.created/closed`, `customer.subscription.updated`
* Env: `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FEATURED`, `STRIPE_SECRET_KEY`, `STRIPE_CONNECT` keys

**Order Lifecycle (minimum states)**

* `orders.status`: PENDING → PAID → REFUNDED | DISPUTED | CLOSED
* Timeline surfaced in `/orders/:orderId` (OrderTimeline component)

**Notifications (Phase 5)**

* In-app + optional email for: checkout success, vendor refund decisions, dispute updates, billing status changes
* User preferences stored in `notification_preferences`

---

## 4) Data Model (Additive Freeze)

**New / Confirmed Tables**

* `business_claims` (append-only)
* `products` (name, desc, price, kind, fulfillment, stock, status)
* `orders` (amounts, vendorId, buyerId, status, stripe refs)
* `refund_requests` (vendor decision log; buyer request)
* `dispute_log` (webhook-driven chargebacks)
* `notification_preferences` (user toggles)
* Existing: `businesses` (+ claimedByUserId, claimStatus, claimedAt, slug), `vendors_meta` (+ tier, stripeCustomerId, stripeSubscriptionId, subscriptionStatus, featuredSince), `agreements`, `consents`, `melbourne_postcodes`, `users`

**Router Namespaces (tRPC)**

* `claim`: request, getStatus, **approve/reject (admin)**
* `vendor`: upgradeToBasic, upgradeToFeatured.start/status
* `product`: create/update/deactivate/listByVendor/getById
* `checkout`: **createCheckoutSession(orderId)**
* `order`: getMine (buyer), getByVendor, getById
* `refund`: request (buyer), getMine/getByOrder
* `admin`: (Phase 8) claims/disputes listing (or extend claim/dispute routers)
* `notifications`: push/read/updatePrefs (Phase 5)

All writes must:

1. pass role/ownership guard,
2. write **AuditLog** within the same transaction,
3. avoid breaking schema (additive migrations only for v5.x).

---

## 5) Repository, Branching & Tags

**Repo of record:** the Copilot repo (the active codebase).
**Default branch:** `main` (protected).
**Phase branches:** `phase4-implementation`, `phase4-step8`, `phase5-step1`, etc.
**Tags:** `v4.8` (Step 8 complete), `v5.1` (Cart/Notifications release), etc.

**Merge rule:** no direct pushes to `main`. Phase branch → PR → QA checklist green → merge → tag.

---

## 6) Exact Phases & Verification Gates (Non-negotiable)

### Phase 0 — **Baseline Lock** (✅ COMPLETE)

**Goal:** Copilot repo runs & embodies the canonical design system.
**Gate:** App boots; core pages load; theme correct; no fatal console errors; tRPC wire-up ok; Drizzle migrations clean.

### Phase 1 — **Backend & Schema Alignment** (✅ COMPLETE)

**Goal:** Import MVP backend behavior to Copilot repo (ABN, consents, agreements, postcodes, role guards) via Drizzle+tRPC.
**Gate:** Migrations pass; tRPC endpoints callable; ABN + consent logging functional; no UI regressions.

### Phase 2 — **PWA + AI Surfaces** (✅ COMPLETE)

**Goal:** Bring PWA & AI listing description; adapt to Vite; keep UI consistent.
**Gate:** SW registered; manifest valid/installable; offline cache for key routes; AI description returns & injects text safely; single analytics path only.

### Phase 3 — **Agentic Logic (local)** (✅ COMPLETE)

**Goal:** Import agentic "helpers" that run locally (no Manus lock-in).
**Gate:** No Manus runtime calls in prod paths; helpers feature-flagged and stable; no auth/storage swaps.

### Phase 4 — **Orders + Claims + Refunds** (✅ **Delivered** to **v4.8**)

**UI Routes:**

* `/orders`, `/orders/:orderId`, `/claim/:businessId`, `/checkout/:orderId`, `/checkout/success`, `/checkout/cancel`
* Admin: `/admin/claims`, `/admin/disputes`
* Vendor: `/vendor/refunds`

**Gate:** `pnpm check` = 0; `pnpm build` = PASS; order timeline renders; refund request flow → vendor decision flow → webhook sync; email disclaimers; role guards enforced.

### Phase 5 — **Marketplace Expansion** (🟡 **In Progress**; Step 1 ✅ complete)

**Step 1: Cart & Notifications (✅ v5.1 complete)**

* 5.1 Cart Backend API → Drizzle model + tRPC CRUD ✅
* 5.2 Cart Frontend UI → Cart page/badge/context ✅
* 5.3 Notifications Backend API → push/read/updatePrefs ✅
* 5.4 Notifications UI → bell + center page ✅
* 5.5 Checkout & Inventory tie-in → stock sync on payment ✅
* 5.6 QA & Deployment → tag **v5.1** ✅

**Gate (Phase 5 Step 1 - v5.1):**

* TypeScript strict 0 errors; Vite build PASS ✅
* DB migrations clean, rollback tested locally ✅
* Cart persists per user across sessions ✅
* Notification preferences respected (no send before consent) ✅
* Stripe flows unchanged & passing smoke ✅
* Lighthouse mobile ≥ 90; a11y serious/critical = 0 ✅

**Step 2: Products & Inventory (NEXT)**

* 5.7 Product Creation Backend
* 5.8 Product Management Frontend
* 5.9 Inventory Sync
* 5.10 QA & Deployment → tag **v5.2**

**Step 3: Vendor Tier Upgrades & Subscriptions**

* 5.11 Upgrade Flow (BASIC → FEATURED)
* 5.12 Billing Management
* 5.13 Subscription Webhooks
* 5.14 QA & Deployment → tag **v5.3**

### Phase 6 — **Admin Automation & Reporting** (NEXT AFTER PHASE 5)

**Scope:** Unified admin dashboards (metrics, CSV/PDF exports), role management, audit viewer, weekly digest emails.
**Gate:** Admin RBAC ✓; exports ✓; background jobs ✓; no PII leakage; performance budgets ✓.

### Phase 7 — **Vendor Tools & Marketing**

**Scope:** Vendor analytics, coupons/promos, basic campaigns.
**Gate:** Abuse/cap controls; unsubscribe compliance; analytics integrity.

### Phase 8 — **AI Concierge & Personalisation**

**Scope:** AI Listing Assistant, AI Search Concierge (server-side); no client keys.
**Gate:** Safety filters; latency budgets; opt-out respected.

### Phase 9 — **Ecosystem Integrations**

**Scope:** Public API/webhooks; council feeds; partner modules.
**Gate:** API auth; rate limits; documentation; deprecation policy.

### Phase 10 — **Sustainability & Optimisation (LTS)**

**Scope:** CWV hardening; CDN/cost controls; incident runbooks.
**Gate:** Budgets hold in prod; error budgets green; SLO reports.

---

## 7) Deletion / Survival Matrix

| Source       | Keep                                                               | Delete/Quarantine                                               |
| ------------ | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Copilot repo | **Everything** (design system, UI, tRPC, Drizzle, pages)           | N/A                                                             |
| MVP zip      | **Behavior & schema** (via Drizzle+tRPC refactor)                  | Any REST/raw SQL; legacy auth                                   |
| Suburbmates2 | **PWA (manifest/SW)**, **AI description**, **suburb autocomplete** | Unfinished marketplace UIs; clashing styles                     |
| DeepAgent    | **Localizable helper logic** (feature-flagged)                     | Manus-bound codepaths, storage, dashboards, agent runtime calls |

**Policy:** If code cannot be adapted to **tRPC + Drizzle + current auth + design system**, it **does not** enter `main`.

---

## 8) Compliance, Legal, and Email Policy

* The platform is a **facilitator only**. Vendors own **fulfillment**, **refunds**, **chargeback evidence**.
* Every buyer/vendor/admin email includes the **facilitator disclaimer**.
* Refund requests do **not** auto-refund via platform; vendors decide; Stripe webhooks reconcile orders.
* ABN handling is server-only; badge only after verification.

---

## 9) Environment & Secrets

* `.env.example` must list: DB URL, Stripe keys, `STRIPE_PRICE_FEATURED`, `STRIPE_WEBHOOK_SECRET`, ABR key, Analytics key, AI key.
* **No secrets** in client bundles or repo.
* Server utilities enforce 24h cache for ABR.
* Webhooks: single endpoint, signature verified, idempotent inserts.

---

## 10) QA, Performance & A11y (Global Gates)

* **TypeScript strict:** 0 errors
* **Vite build:** PASS (warnings allowed if documented)
* **CWV budgets:** LCP ≤ 2.0s; INP ≤ 200ms; CLS ≤ 0.05 (mobile)
* **axe CI:** 0 serious/critical
* **Playwright smoke:** auth → list → profile → checkout (test mode) → orders → refunds → admin claims/disputes route render
* **PostHog/analytics:** consent-gated; events validated; no duplicate providers

---

## 11) Change Control

* SSOT changes require a **PR titled "SSOT Update"**, referencing the rationale and impacts.
* Breaking changes (schema, fees, pricing, role model) require **SSOT Owner approval** plus a migration plan, rollback, and comms entry in `/docs/changelog/`.

---

## 12) Immediate Next Steps (Operational)

1. **✅ Phase 5 Step 1 Complete** → Cart + Notifications working, tagged v5.1
2. **Next: Phase 5 Step 2–3** → Products, Inventory, Vendor Upgrades
3. **Phase 6 Planning** → Admin dashboards, audit logs, reporting
4. Run **PHASE_5_STEP1_QA_CHECKLIST_v1.md** end-to-end; fix to green; tag **`v5.1`**.
5. Prepare **PHASE_6_IMPLEMENTATION_PLAN.md** (Admin automation/reporting), lock, then execute.

---

### Final Word (Why this is safe)

* We froze the **UI & stack** to one high-quality base.
* We **import logic** (not chaos) from older sources, **only** when it fits tRPC+Drizzle+Auth+Design.
* We **encode marketplace decisions** (fees, tiers, claims, refunds, disputes) so they don't drift.
* We enforce **hard phase gates** so we never ship half-integrated features.
