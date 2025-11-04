# Phase 4 Implementation Plan — Marketplace Ops, Subscriptions & Claims

**Status:** Draft to Lock
**Source of Truth:** `phase-4-gap-analysis.md` (locked)
**Scope Window:** Phase 4 (MVP+), zero breaking changes, additive migrations only
**Principle:** Platform = facilitator. Vendors own fulfillment/refunds/disputes. ABN verification encouraged & visible.

---

## 0) Scope & Non-Scope

**In Scope (Phase 4 MVP+)**

- Business Owner → list/claim workflow (no profile, ABN optional, can verify ABN).
- Upgrade path: **Business Owner → Vendor (Basic)** (profile + ability to sell).
- **Featured Vendor** ($29/mo) via Stripe Billing; 6% fee (vs 8%) + UI perks.
- Product catalog (physical/digital/service); **vendor fulfills** (pickup/delivery/digital).
- Checkout via Stripe Connect (application_fee based on tier).
- Notifications (buyer/vendor/admin) for checkout, refund request, dispute lifecycle.
- UI clarity: ABN Verified badges, Vendor/Featured badges, ranking boost for Featured.

**Out of Scope (Phase 4)**

- Platform-led logistics or refunds.
- Cart/multi-item checkout (single-product "Buy Now" only).
- Reviews/ratings (Phase 5+).
- Complex tax rules (basic Stripe tax settings only, if enabled in Stripe).

---

## 1) Data Model Changes (Drizzle)

All changes are additive; no column deletions. Naming follows existing conventions.

### 1.1 Businesses (claims & ownership)

```ts
// drizzle/schema.ts (additive)
export const businesses = mysqlTable("businesses", {
  // existing cols...
  claimedByUserId: int("claimedByUserId"), // FK users.id (nullable)
  claimStatus: mysqlEnum("claimStatus", [
    "UNCLAIMED",
    "PENDING",
    "CLAIMED",
    "REJECTED",
  ])
    .default("UNCLAIMED")
    .notNull(),
  claimedAt: timestamp("claimedAt"),
  slug: varchar("slug", { length: 160 }),
});
```

**Indexes**

- `idx_businesses_slug` (unique)
- `idx_businesses_claimStatus`

### 1.2 Claims (append-only)

```ts
export const businessClaims = mysqlTable("business_claims", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"])
    .default("PENDING")
    .notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  decidedAt: timestamp("decidedAt"),
});
```

### 1.3 Vendors Meta (extend for tiers)

```ts
export const vendorsMeta = mysqlTable("vendors_meta", {
  // existing cols…
  tier: mysqlEnum("tier", ["BASIC", "FEATURED"]).default("BASIC").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", [
    "ACTIVE",
    "PAST_DUE",
    "CANCELED",
    "NONE",
  ])
    .default("NONE")
    .notNull(),
  // optional convenience for pricing UI
  featuredSince: timestamp("featuredSince"),
});
```

### 1.4 Products

```ts
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description"),
  priceCents: int("priceCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("AUD").notNull(),
  kind: mysqlEnum("kind", ["PHYSICAL", "DIGITAL", "SERVICE"])
    .default("PHYSICAL")
    .notNull(),
  fulfillment: mysqlEnum("fulfillment", [
    "PICKUP",
    "DELIVERY",
    "DIGITAL",
  ]).notNull(),
  imageUrl: varchar("imageUrl", { length: 255 }),
  stockQty: int("stockQty"), // nullable for service/digital
  status: mysqlEnum("status", ["ACTIVE", "DRAFT", "ARCHIVED"])
    .default("ACTIVE")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const idxProductsBusiness = index("idx_products_business").on(
  products.businessId
);
```

### 1.5 Orders (record only; vendor fulfills)

```ts
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  productId: int("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  amountCents: int("amountCents").notNull(),
  feeCents: int("feeCents").notNull(), // app fee charged
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  status: mysqlEnum("status", [
    "PENDING",
    "PAID",
    "REFUNDED",
    "DISPUTED",
    "FULFILLED",
    "CLOSED",
  ])
    .default("PENDING")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### 1.6 Refund Request Log (optional, vendor-owned decision)

```ts
export const refundRequests = mysqlTable("refund_requests", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  buyerEmail: varchar("buyerEmail", { length: 320 }).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["OPEN", "VENDOR_DECIDED", "CLOSED"])
    .default("OPEN")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  decidedAt: timestamp("decidedAt"),
});
```

### 1.7 Dispute Log (webhook-driven)

```ts
export const disputeLog = mysqlTable("dispute_log", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").references(() => orders.id, { onDelete: "set null" }),
  stripeChargeId: varchar("stripeChargeId", { length: 255 }),
  amountCents: int("amountCents"),
  status: mysqlEnum("status", ["OPEN", "WON", "LOST", "CLOSED"])
    .default("OPEN")
    .notNull(),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});
```

### 1.8 Migrations (SQL)

- `ALTER TABLE businesses ADD claimedByUserId INT NULL, ADD claimStatus ENUM('UNCLAIMED','PENDING','CLAIMED','REJECTED') NOT NULL DEFAULT 'UNCLAIMED', ADD claimedAt TIMESTAMP NULL, ADD slug VARCHAR(160) NULL;`
- `CREATE TABLE business_claims (…)`
- `ALTER TABLE vendors_meta ADD tier ENUM('BASIC','FEATURED') NOT NULL DEFAULT 'BASIC', ADD stripeCustomerId VARCHAR(255), ADD stripeSubscriptionId VARCHAR(255), ADD subscriptionStatus ENUM('ACTIVE','PAST_DUE','CANCELED','NONE') NOT NULL DEFAULT 'NONE', ADD featuredSince TIMESTAMP NULL;`
- `CREATE TABLE products (…)`
- `CREATE TABLE orders (…)`
- `CREATE TABLE refund_requests (…)`
- `CREATE TABLE dispute_log (…)`

---

## 2) API & Router Additions (tRPC)

### 2.1 Claims

- `claim.request(businessId)` → creates `business_claims` PENDING; flips business.claimStatus → PENDING.
- `claim.approve(claimId)` (admin) → set `CLAIMED`, set `claimedByUserId`, `claimedAt`, close others `REJECTED`.
- `claim.reject(claimId)` (admin) → set `REJECTED`.

### 2.2 Vendor Upgrade

- `vendor.upgradeToBasic(businessId)` → creates `vendors_meta` if missing; sets tier=BASIC.
- `vendor.upgradeToFeatured.start(businessId, returnUrl)` → Stripe Billing Checkout (uses `STRIPE_PRICE_FEATURED`).
- `vendor.upgradeToFeatured.status(businessId)` → reads `vendors_meta.subscriptionStatus`.

### 2.3 Products

- `product.create(businessId, payload)` (vendor of that business)
- `product.update(productId, patch)` (vendor)
- `product.archive(productId)` (vendor)
- `product.listPublic({ businessId, status='ACTIVE', limit, cursor })` (public)

### 2.4 Checkout

- `checkout.create({ productId, buyerEmail })` → Creates Stripe Checkout Session on **connected account** with `application_fee_amount`:
  - **BASIC:** 8% + 50c
  - **FEATURED:** 6% + 50c
    Compute fee in cents server-side using `vendors_meta.tier`.

### 2.5 Orders (recording)

- `order.getMine(businessId)` (vendor) → list of their orders (read-only).
- Status transitions come from webhooks (paid/refunded/disputed), not manual.

### 2.6 Refund Requests

- `refund.request({ orderId, reason })` (buyer) → create `refund_requests` OPEN, email vendor, no platform decision.

---

## 3) Stripe Integration

**Env**

```
STRIPE_SECRET_KEY=
STRIPE_PRICE_FEATURED=price_FEATURED_29_AUD
NEXT_PUBLIC_APP_URL=
STRIPE_WEBHOOK_SECRET=
```

**Connect Checkout (one-off product)**

- Use vendor's **connected account**.
- Set `application_fee_amount` computed by tier.
- Metadata: `{ businessId, productId, tier, feeBasisPct, buyerEmail }`

**Billing (Featured $29/mo)**

- Product: "Featured Vendor Subscription"
- Price: `price_FEATURED_29_AUD`
- On `checkout.session.completed` → set `vendors_meta.tier='FEATURED'`, `subscriptionStatus='ACTIVE'`, store `stripeCustomerId`, `stripeSubscriptionId`, `featuredSince=now()`.
- On `customer.subscription.updated` → update `subscriptionStatus` accordingly; if non-active, revert `tier='BASIC'` after grace (optional 7 days).

**Webhooks**

- `payment_intent.succeeded` → create/mark `orders` as PAID; send buyer/vendor emails.
- `charge.refunded` → update `orders.status='REFUNDED'`; reverse fee in ledger; send emails.
- `charge.dispute.created` → upsert `dispute_log OPEN`; notify vendor (+ optional admin).
- `charge.dispute.closed` → set `WON|LOST|CLOSED`; notify vendor (+ optional admin).
- `payout.paid` → optional vendor payout notice.
- `account.updated` → vendor KYC status email if restricted.

---

## 4) UI & Routing

### 4.1 Directory & Claim

- Business card: **"Claim this listing"** CTA when `claimStatus='UNCLAIMED'`.
- Detail page: ABN badge (`verified|pending|failed`), claim status chip.
- Route: `/claim/[businessId]` → form & status.

### 4.2 Vendor Profiles

- **Basic Vendor**
  - Badge: "Vendor"
  - Profile photo: standard size
  - Products grid (limit e.g., 12 active)
  - Fee disclosure: "Vendor fulfills orders"

- **Featured Vendor ($29)**
  - Badge: **Featured** (gold)
  - **Bigger hero image**, highlight card, ranking boost in lists
  - Products grid: higher limit (e.g., 48)
  - Promo ribbon on Market listing

### 4.3 Marketplace

- Filters: Suburb/Region, Kind (Physical/Digital/Service), **Featured first** ordering.
- Card microcopy: "Pickup | Delivery | Digital" indicators.

### 4.4 Dashboards

- **Owner Dashboard**: My Listings, **Upgrade to Vendor**, ABN verify CTA, Claim status.
- **Vendor Dashboard**:
  - Products CRUD
  - Orders (read-only statuses)
  - Upgrade to Featured (Billing) + status indicator
  - Notifications center

---

## 5) Notifications (Email)

Use `/lib/email.ts` with provider (Resend/Postmark). Log each send to `AuditLog`.

**Events**

- Checkout success (buyer + vendor)
- Refund request created (buyer ack + vendor action)
- Refund processed (buyer + vendor)
- Dispute created/closed (vendor + optional admin)
- Billing status change (vendor)

**Footers (legal):**
"Suburbmates is a facilitator only. Vendors are solely responsible for fulfillment, refunds, and disputes."

---

## 6) Access Control & Guards

- Claim endpoints: **authenticated user**; approval requires **admin**.
- Product endpoints: **vendor must own businessId**.
- Checkout: Only `status='ACTIVE'` product.
- Featured perks in UI & fee calculation require `vendors_meta.tier==='FEATURED' && subscriptionStatus==='ACTIVE'`.
- Rate-limit refund.request by order & email.

---

## 7) Search & Ranking

- Featured ranking boost multiplier (e.g., `1.25`).
- ABN verified subtle boost (e.g., `1.05`).
- Keep **suburb/region scoping** primary.

---

## 8) Legal & Policy Inserts

- Vendor Terms: independent operator; assumes all liabilities for fulfillment/refunds/disputes.
- Buyer Terms: transaction is with vendor; platform is facilitator.
- **At checkout:** inline disclosure + link to vendor policy (if provided).
- Claim flow: representation & authority statements checkbox.

---

## 9) Acceptance Criteria (AC)

1. **Claim Workflow**
   - Create PENDING claim; admin can APPROVE/REJECT; business updates to CLAIMED and binds `claimedByUserId`.

2. **Upgrade**
   - Owner can become Vendor (BASIC) without ABN; ABN verification surfaced as encouraged.
   - Featured purchase completes via Stripe Billing, toggles tier & subscriptionStatus.

3. **Products**
   - Vendor can create/edit/archive products; kind & fulfillment visible publicly.

4. **Checkout**
   - "Buy Now" opens Stripe; **application_fee** = 8%/6% + $0.50 by tier.

5. **Orders**
   - Orders stored on `payment_intent.succeeded`; statuses reflect webhooks.

6. **Notifications**
   - Emails fire for checkout success, refund request, refund processed, dispute opened/closed, billing changes.

7. **UI**
   - ABN Verified badges; Vendor vs Featured visual distinction; Featured larger photo and badge; featured-first ordering.

8. **Compliance**
   - No platform-initiated refunds; vendor-only; disclosures present.

---

## 10) Test Plan (Happy & Edge)

- Claims: create/approve/reject; check business state & exclusivity.
- Upgrade paths: owner→vendor (BASIC) then → Featured via Stripe test; subscription status changes.
- Fee math: $100 → BASIC fee $8.50; FEATURED fee $6.50.
- Webhooks: simulate `payment_intent.succeeded`, `charge.refunded`, dispute open/close.
- Product visibility by status.
- ABN badge display matrix.
- Access: vendor can only manage own business/products.

---

## 11) Rollout & Toggles

- Feature flag: `FEATURED_SUBSCRIPTIONS=true`.
- Graceful fallback: If billing disabled, show marketing CTA not purchase.
- Data backfill: set `tier='BASIC'` for any existing vendors.
- Observability: log **Stripe event id** on order/dispute/refund entities.

---

## 12) Work Packets & Order (safe sequence)

1. **DB migrations** (claims, vendors_meta ext, products, orders, logs).
2. **Query helpers** (claims, products, orders).
3. **Routers** (claims, products, checkout, vendor upgrade).
4. **Stripe** (Billing price, checkout flow, webhooks).
5. **UI** (claim pages, vendor dashboards, marketplace updates).
6. **Notifications** (email utility + event hooks).
7. **Docs** (Terms inserts, help pages).
8. **E2E smoke** (Playwright or manual matrix).

---

## 13) Config Matrix

- **Featured price:** `$29/mo` (`STRIPE_PRICE_FEATURED`)
- **Fees:** `BASIC 8% + $0.50`, `FEATURED 6% + $0.50`
- **Badges:** `Vendor`, `Featured` (gold)
- **Photo sizes:** Featured hero 2x height vs Basic
- **Limits:** Basic 12 active products, Featured 48 (configurable)

---

## 14) Done = Locked (Definition)

- All ACs pass.
- Billing toggles Featured and fee correctly.
- Emails delivered for all events (visible in logs).
- Featured vendors visually distinct + ranked above basic.
- Claim flow enforces single owner with audit trail.
- Legal language present in checkout & policy pages.

---
