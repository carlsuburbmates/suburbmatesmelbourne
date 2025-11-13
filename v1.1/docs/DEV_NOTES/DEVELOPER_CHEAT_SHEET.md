# Suburbmates V1.1 – Developer Cheat Sheet

**Quick reference for developers. Print this or bookmark it.**

---

## 1. Truth Hierarchy (SSOT)

If anything conflicts, follow this order:

1. `v1.1/docs/**` (SuburbmatesV1.1 specification)
2. `v1.1/docs/DEV_NOTES/00_BUILD_POLICY.md`
3. `v1.1/docs/DEV_NOTES/ARCHITECTURAL_GUARDS.md`
4. Phase 5 code → reference only

**Never reverse this order.**

---

## 2. Architecture (V1.1 Only)

**Stack:**
- Next.js 14 App Router
- Next.js API routes (not tRPC)
- Supabase PostgreSQL
- Supabase Auth (JWT)
- Stripe Payments + Stripe Connect **Standard**
- Sentry for error logging

**Architecture constraints:**
- Express-based (tRPC) backends are forbidden
- ORMs like Drizzle are forbidden
- SQL databases like MySQL are forbidden
- Manus SDK code is forbidden
- Platform-issued refunds are forbidden
- Platform-as-MoR logic is forbidden

---

## 3. Directory vs Marketplace (Core Concept)

### Directory
Shows business presence only:
- Business name
- Summary
- LGA/suburb
- Categories
- Contact info

**Does NOT contain:**
- Pricing
- Checkout
- Cart
- Product lists

### Marketplace
Shows products from **active vendors only**:
- `is_vendor = true`
- `vendor_status = 'active'`
- `product.published = true`

**Contains:**
- Product cards with pricing
- Checkout flow
- Vendor storefronts
- Order history

---

## 4. Vendor-as-Merchant-of-Record (MoR)

### Vendors control:
- Refunds (yes or no)
- Dispute responses
- Product listings
- Pricing
- Shipping methods
- Liable under Australian Consumer Law

### Suburbmates provides:
- Platform infrastructure
- Marketplace discovery
- Payment rails (Stripe)
- Logs and monitoring
- Policy enforcement
- `application_fee_amount` only

### Suburbmates does NOT:
- Issue refunds to customers
- Move money back to customer accounts
- Handle disputes directly
- Act as seller

---

## 5. Selective Hybrid Reuse (Safe to Use from Phase 5)

**Allowed:**
- UI components (shadcn/ui)
- Validation utilities (`zod`, `validate`)
- Formatters (`formatCurrency`, `formatDate`)
- Event sequencing patterns (Stripe webhook order)
- Error boundary patterns

**Not allowed from Phase 5:**
- Database query code
- Backend procedure code (tRPC-style)
- Authentication context/middleware
- Refund/dispute handling logic
- Merchant-of-record assumptions
- ORM-based queries

---

## 6. Feature Branch Workflow

```bash
# 1. Create branch
git checkout -b feat/feature-name

# 2. Make changes locally

# 3. Push
git push origin feat/feature-name

# 4. Open PR on GitHub
# (GitHub auto-attaches checklist)

# 5. CI runs 4 checks automatically:
```

- **Forbidden Strings Check**: No mysql, trpc, manus, drizzle
- **Required Strings Check**: Legal, schema, API docs complete
- **Architecture Enforcement**: Phase 5 code untouched, no forbidden imports
- **Schema Drift**: All required fields in schema reference

**PR must pass all 4 checks + get 1 approval before merge.**

---

## 7. Safe File Structure for V1.1

Create new code here:
```
/v1.1/
  /app/                    ← Next.js App Router pages + layouts
  /components/             ← React components
  /lib/                    ← Utilities, helpers
  /docs/
    /DEV_NOTES/            ← Policy + enforcement files (READ ONLY)
```

**Never modify:**
```
/client/          ← Phase 5 (frozen reference)
/server/          ← Phase 5 (frozen reference)
/drizzle/         ← Phase 5 (frozen reference)
/shared/          ← Phase 5 (frozen reference)
```

---

## 8. Stripe Checkout Pattern (Correct)

Vendor is the MoR. Platform takes application fee only.

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [
    { price: "price_xxx", quantity: 1 }
  ],
  payment_intent_data: {
    application_fee_amount: platformFeeInCents,
  },
  stripe_account: vendor.stripe_account_id,  // ← Vendor's Stripe account
  success_url: `${siteUrl}/orders/{CHECKOUT_SESSION_ID}`,
  cancel_url: `${siteUrl}/marketplace`,
});
```

**Key points:**
- `stripe_account` = vendor's Connect account
- `application_fee_amount` = platform's cut (platform payout)
- Remaining = vendor's payout

---

## 9. Supabase Query Safety

Always use Supabase JS client. Never import Drizzle or MySQL code.

```typescript
// ✅ CORRECT
const { data, error } = await supabase
  .from("products")
  .select("*")
  .eq("published", true);

if (error) throw error;
return data;

// ❌ WRONG - never do this
// import { db } from "@server/db";
// const products = await db.query.products...
```

---

## 10. Webhook Pattern (Correct)

Webhooks **never** initiate refunds or move money.

```typescript
switch (event.type) {
  case "checkout.session.completed":
    // Create order record in Supabase
    // Send confirmation email
    break;

  case "charge.refunded":
    // Vendor initiated refund (in Stripe Dashboard or Connect portal)
    // Log the refund in Supabase
    // Notify vendor + customer
    // Do NOT send money back to customer (vendor already did in Stripe)
    break;

  case "charge.dispute.created":
    // Vendor handles dispute (in Stripe)
    // Log the dispute in Supabase
    // Do NOT move money or resolve dispute
    break;
}
```

---

## 11. Copilot PR Review

When you open a PR, Copilot reviews it against:
- Build Policy
- Architectural Guards
- Archive Mode rules
- MoR model

If Copilot leaves comments, address them before merging.

---

## 12. Quick Debugging

**"CI check failed - Forbidden Strings"**
→ Check you haven't imported packages or patterns that are excluded

**"CI check failed - Required Strings"**
→ Check schema, legal, API docs have required terms

**"CI check failed - Architecture Enforcement"**
→ Check Phase 5 dirs (client/, server/, drizzle/, shared/) untouched

**"CI check failed - Schema Drift"**
→ Check schema reference has required fields (is_vendor, vendor_status, etc.)

---

## 13. Getting Help

1. **Read:** `v1.1/docs/00_README_MASTER_INDEX.md` (navigation hub)
2. **Quick questions:** Check `00_BUILD_POLICY.md` or `ARCHITECTURAL_GUARDS.md`
3. **Stuck on code:** Use VS Code snippets (prefix: `sm-`)
4. **Before PR:** Check against `.github/pull_request_template.md`

---

**End of Cheat Sheet**
