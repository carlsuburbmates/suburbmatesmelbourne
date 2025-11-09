# Phase 5.3 QA Checklist - Vendor Tiers & Subscriptions with Stripe Integration

**Project:** Suburbmates  
**Phase:** 5 Step 3 (Vendor Tiers & Subscriptions)  
**Date:** November 10, 2025  
**Status:** Ready for QA  
**Target:** v5.3 Release

---

## 🎯 QA Objectives

Verify that all Phase 5.3 deliverables are production-ready:

- ✅ Backend subscription system (6 tRPC procedures, 5 webhook handlers)
- ✅ Frontend billing UI (BillingCard, TierUpgradeModal, SubscriptionStatus)
- ✅ Stripe integration (checkout, webhooks, portal)
- ✅ Database schema and migrations
- ✅ Design system compliance (v5.2)
- ✅ Responsive design (375px, 768px, 1024px)
- ✅ WCAG 2.2 AA accessibility

---

## 1️⃣ Backend Verification

### 1.1 Subscription Router - Procedures

**Test Cases:**

- [ ] **getStatus (Query)**
  - [ ] Vendor can retrieve current tier (featured/basic/none)
  - [ ] Returns correct product limits (48/12/3)
  - [ ] Shows current product count
  - [ ] Displays subscription renewal date
  - [ ] Non-vendors get FORBIDDEN error
  - [ ] Unauthenticated users get UNAUTHORIZED error

- [ ] **upgradeToFeatured (Mutation)**
  - [ ] Vendor receives checkout URL
  - [ ] Stripe customer created successfully
  - [ ] Session ID stored with vendor ID metadata
  - [ ] checkoutUrl points to valid Stripe session
  - [ ] Can call multiple times without duplicating customers
  - [ ] Non-vendors get FORBIDDEN error

- [ ] **verifyCheckoutSession (Mutation)**
  - [ ] Post-checkout verification returns correct status
  - [ ] `status === "paid"` on successful payment
  - [ ] `subscriptionId` field populated after payment
  - [ ] `customerId` matches Stripe customer
  - [ ] Rejects sessions from other vendors
  - [ ] Handles unpaid sessions gracefully

- [ ] **cancelSubscription (Query)**
  - [ ] Cancels active subscription
  - [ ] Updates tier to "free"
  - [ ] Sets subscriptionStatus to "free"
  - [ ] Vendors can no longer use tier benefits
  - [ ] Cancellation timestamp recorded

- [ ] **getBillingHistory (Query)**
  - [ ] Returns array of past invoices (up to 12)
  - [ ] Each invoice has: id, number, amount, currency, status, paidAt, dueDate, pdf
  - [ ] Upcoming invoice displayed separately
  - [ ] Returns empty arrays for free-tier vendors
  - [ ] Handles missing Stripe customer gracefully

- [ ] **getPortalUrl (Mutation)**
  - [ ] Returns valid Stripe Customer Portal URL
  - [ ] URL functional and redirects to correct portal
  - [ ] Rejects for vendors without Stripe account
  - [ ] Portal allows payment method updates
  - [ ] Return URL goes to `/vendor/billing`

### 1.2 Database Functions

- [ ] **getVendorSubscription(vendorId)**
  - [ ] Returns correct subscription data from vendors_meta
  - [ ] Fields: subscriptionStatus, stripeAccountId, subscriptionRenewsAt
  - [ ] Returns null for non-existent vendors

- [ ] **upsertStripeCustomer(vendorId, stripeCustomerId)**
  - [ ] Creates new vendor_meta row if needed
  - [ ] Updates existing stripeAccountId
  - [ ] Handles duplicate calls without errors

- [ ] **updateSubscriptionStatus(vendorId, status, renewsAt)**
  - [ ] Updates vendors_meta.subscriptionStatus
  - [ ] Updates vendors_meta.subscriptionRenewsAt
  - [ ] Syncs businesses.tier correctly:
    - [ ] status="featured_active" → tier="featured"
    - [ ] status="basic_active" → tier="basic"
    - [ ] status="free" → tier="none"

- [ ] **getVendorTierLimitInfo(vendorId)**
  - [ ] Returns correct productLimit per tier
  - [ ] Current products counted accurately
  - [ ] canAdd = true when currentProducts < limit
  - [ ] expiresAt matches subscriptionRenewsAt

- [ ] **getVendorBusiness(vendorId)**
  - [ ] Retrieves business record with tier
  - [ ] Handles missing business gracefully

- [ ] **getActiveVendorsForBilling()**
  - [ ] Returns all vendors with active subscriptions
  - [ ] Used for scheduled renewal jobs

### 1.3 Stripe Webhook Handlers

- [ ] **handleSubscriptionCreated**
  - [ ] Fires on checkout success
  - [ ] Updates vendors_meta.subscriptionStatus to "featured_active"
  - [ ] Updates businesses.tier to "featured"
  - [ ] Sets subscriptionRenewsAt to renewal date
  - [ ] Stores Stripe subscription ID

- [ ] **handleSubscriptionUpdated**
  - [ ] Handles status changes (active → past_due, etc.)
  - [ ] Updates vendors_meta.subscriptionStatus
  - [ ] Handles pause/resume correctly
  - [ ] Updates renewal date on interval changes

- [ ] **handleSubscriptionDeleted**
  - [ ] Fires on cancellation
  - [ ] Sets subscriptionStatus to "free"
  - [ ] Resets businesses.tier to "none"
  - [ ] Clears renewal date

- [ ] **handleInvoicePaymentSucceeded**
  - [ ] Logs payment receipt
  - [ ] Updates invoice status
  - [ ] (TODO: Send confirmation email)

- [ ] **handleInvoicePaymentFailed**
  - [ ] Logs failed payment
  - [ ] Updates invoice status
  - [ ] (TODO: Send retry notification)

---

## 2️⃣ Frontend Component Verification

### 2.1 BillingCard Component

**Visual Design:**

- [ ] Displays current tier name and price
- [ ] Shows product slot progress bar
- [ ] Progress bar colors correct:
  - [ ] Red when ≥90% full
  - [ ] Amber when ≥75% full
  - [ ] Green when <75% full
- [ ] Expiration warning visible if renews within 7 days
- [ ] Tier benefits list displayed with icons
- [ ] Upgrade/Manage buttons visible and clickable

**Functionality:**

- [ ] onUpgrade callback triggered on click
- [ ] onManage callback triggered on click
- [ ] Tier information updates correctly
- [ ] Product limit updates when tier changes
- [ ] Loading state shows spinner

**Design System Compliance (v5.2):**

- [ ] Forest Green (#2D5016) for primary elements
- [ ] Emerald (#50C878) for success states
- [ ] Gold (#FFD700) for premium features
- [ ] 14px base typography maintained
- [ ] 4.5:1 contrast ratio verified

### 2.2 TierUpgradeModal Component

**Visual Design:**

- [ ] Modal title and description visible
- [ ] 2-column layout (BASIC vs FEATURED)
- [ ] Each tier card shows:
  - [ ] Tier name and price
  - [ ] Product count
  - [ ] Platform fee percentage
  - [ ] Feature list
- [ ] "Best Value" badge on FEATURED
- [ ] "Currently Active" indicator on current tier
- [ ] Billing information alert visible
- [ ] Security note with Lock icon

**Functionality:**

- [ ] Radio-style selection works
- [ ] onConfirm callback passes selected tier
- [ ] Confirm button initiates checkout
- [ ] Cancel button closes modal
- [ ] Disable confirm button during loading

**Responsive Design:**

- [ ] 375px: Cards stack vertically ✅
- [ ] 768px: 2-column grid ✅
- [ ] 1024px: Full 2-column with padding ✅

### 2.3 SubscriptionStatus Component

**Visual Design:**

- [ ] Next renewal date displayed with countdown
- [ ] Upcoming invoice amount shown
- [ ] Payment method management link present
- [ ] Billing history table visible
- [ ] Table columns: Date, Invoice #, Amount, Status, Action

**Billing History Table:**

- [ ] Invoices listed in reverse chronological order
- [ ] Status badges: Emerald (paid), Amber (open), Stone (draft)
- [ ] PDF download links functional
- [ ] Handles null values gracefully

**Empty State:**

- [ ] Message shown for free-tier vendors
- [ ] No data displayed incorrectly

**Responsive Design:**

- [ ] 375px: Table scrolls horizontally
- [ ] 768px: Table readable with smaller font
- [ ] 1024px: Full table visible

### 2.4 BillingPage Dashboard

**Page Layout:**

- [ ] Header with title and description
- [ ] Quick stats sidebar (tier, slots, price, fees)
- [ ] Main billing card section
- [ ] Subscription status section
- [ ] Info cards at bottom

**Checkout Session Handling:**

- [ ] Post-checkout verification displays success message
- [ ] Session ID correctly extracted from URL
- [ ] Subscription status refetches after verification
- [ ] URL params cleared after verification
- [ ] Error messages displayed on failure

**Modal Interaction:**

- [ ] "Upgrade" button opens modal
- [ ] Modal closes on cancel
- [ ] Tier selection triggers checkout
- [ ] Checkout redirects to Stripe

**Error Handling:**

- [ ] Error boundary catches exceptions
- [ ] Error messages displayed to user
- [ ] Portal access errors handled gracefully

**Access Control:**

- [ ] Non-vendors redirected to /
- [ ] Unauthenticated users redirected to login
- [ ] Loading skeleton shown while fetching

---

## 3️⃣ Stripe Integration Verification

### 3.1 Checkout Flow

**Test Mode Setup:**

- [ ] STRIPE*SECRET_KEY uses test key (sk_test*...)
- [ ] STRIPE*PUBLISHABLE_KEY uses test key (pk_test*...)
- [ ] STRIPE_PRICE_FEATURED configured with test product
- [ ] STRIPE_WEBHOOK_SECRET set to test webhook endpoint

**Checkout Session:**

- [ ] Session created with correct price ($29)
- [ ] Session metadata includes vendorId
- [ ] Session includes return URLs
- [ ] Success URL: `/vendor/billing?session_id=...`
- [ ] Cancel URL: `/vendor/billing`

**Payment Processing:**

- [ ] Test card (4242 4242 4242 4242) accepted
- [ ] Payment status changes to "paid"
- [ ] Subscription created automatically
- [ ] Webhook event fires within 5 seconds

### 3.2 Webhook Event Handling

**Webhook Delivery:**

- [ ] Stripe webhook endpoint accessible at `/api/webhooks/stripe`
- [ ] Endpoint verifies webhook signature
- [ ] Rejects invalid signatures
- [ ] Rejects unsigned requests

**Event Processing:**

- [ ] Events processed idempotently (safe to replay)
- [ ] Events logged for debugging
- [ ] Errors logged but don't block other events
- [ ] Dead letter queue for failed events (if implemented)

**Subscription Events:**

- [ ] customer.subscription.created → tier updated to "featured_active"
- [ ] customer.subscription.updated → status synced
- [ ] customer.subscription.deleted → tier reset to "free"

**Invoice Events:**

- [ ] invoice.payment_succeeded → logged
- [ ] invoice.payment_failed → logged

### 3.3 Customer Portal

**Portal URL Generation:**

- [ ] Portal URL accessible and loads
- [ ] Customer can update payment method
- [ ] Customer can view invoices
- [ ] Customer can cancel subscription
- [ ] Return URL redirects to `/vendor/billing`

---

## 4️⃣ Database & Schema Verification

### 4.1 Schema Integrity

- [ ] `vendors_meta` table exists with columns:
  - [ ] vendorId (PK)
  - [ ] subscriptionStatus (enum)
  - [ ] stripeAccountId (string)
  - [ ] subscriptionRenewsAt (date)

- [ ] `businesses` table has `tier` column:
  - [ ] Type: enum(featured, basic, none)
  - [ ] Synchronized with subscription status

- [ ] Indexes present on:
  - [ ] vendors_meta.stripeAccountId
  - [ ] businesses.ownerId
  - [ ] businesses.tier

### 4.2 Migrations

- [ ] Latest migration applied: `pnpm db:push`
- [ ] No pending migrations
- [ ] Schema matches Drizzle definition
- [ ] Foreign key constraints valid

### 4.3 Data Integrity

- [ ] No orphaned vendors_meta records
- [ ] tier always matches subscriptionStatus
- [ ] stripeAccountId never null for active subscriptions
- [ ] subscriptionRenewsAt is future date for active subs

---

## 5️⃣ Design System & Styling

### 5.1 Color Palette (v5.2 Locked)

- [ ] Forest Green (#2D5016):
  - [ ] Used for primary buttons ✅
  - [ ] Used for headings ✅
  - [ ] Used for active states ✅

- [ ] Emerald (#50C878):
  - [ ] Used for success badges ✅
  - [ ] Used for "paid" invoices ✅
  - [ ] Used for tier highlights ✅

- [ ] Gold (#FFD700):
  - [ ] Used for "Best Value" badge ✅
  - [ ] Used for premium indicators ✅

- [ ] Stone palette:
  - [ ] Stone-600 for secondary text ✅
  - [ ] Stone-50 for backgrounds ✅
  - [ ] Stone-200 for borders ✅

### 5.2 Typography (v5.2 Locked)

- [ ] Base size: 14px maintained ✅
- [ ] Hierarchy:
  - [ ] H1: 32px (headings)
  - [ ] H2: 24px (section titles)
  - [ ] H3: 18px (subsections)
  - [ ] Body: 14px
  - [ ] Small: 12px
- [ ] Line height: 1.5× maintained ✅
- [ ] Font weight hierarchy: 400, 500, 600, 700 ✅

### 5.3 Contrast Ratios (WCAG 2.2 AA)

- [ ] All text ≥4.5:1 ratio:
  - [ ] Forest text on white ✅
  - [ ] Stone-600 on white (≥4.5:1) ✅
  - [ ] White on Forest (≥4.5:1) ✅

- [ ] UI components ≥3:1 ratio:
  - [ ] Borders and decorative elements ✅

### 5.4 Spacing & Layout

- [ ] 4px grid base used consistently ✅
- [ ] Padding: 8px, 16px, 24px, 32px ✅
- [ ] Gaps between components: 16px, 24px ✅
- [ ] Mobile padding: 16px ✅

---

## 6️⃣ Responsive Design Verification

### 6.1 Mobile (375px)

- [ ] **BillingCard:**
  - [ ] Single column layout
  - [ ] Text readable at 14px
  - [ ] Buttons 44px touch target ✅
  - [ ] Progress bar full width
  - [ ] No horizontal scroll

- [ ] **TierUpgradeModal:**
  - [ ] Tier cards stack vertically
  - [ ] Modal has max width but responsive
  - [ ] Buttons full width
  - [ ] Text remains readable

- [ ] **SubscriptionStatus:**
  - [ ] Table scrolls horizontally (if needed)
  - [ ] Column widths responsive
  - [ ] Action buttons touch-friendly
  - [ ] Padding adjusted for mobile

- [ ] **BillingPage:**
  - [ ] Sidebar moved below main content
  - [ ] All sections single column
  - [ ] Quick stats cards stack
  - [ ] Navigation accessible

### 6.2 Tablet (768px)

- [ ] **BillingPage:**
  - [ ] 2-column layout starts
  - [ ] Main content + sidebar side-by-side
  - [ ] Buttons properly spaced
  - [ ] Text readable

- [ ] **TierUpgradeModal:**
  - [ ] Tier cards side-by-side
  - [ ] Full pricing visible
  - [ ] No wrapping issues

- [ ] **Tables:**
  - [ ] All columns visible (or horizontally scroll)
  - [ ] Touch targets 44px+
  - [ ] PDF links clickable

### 6.3 Desktop (1024px+)

- [ ] **Full Layout:**
  - [ ] All components fully visible
  - [ ] Sidebar width correct
  - [ ] Max-width constraints applied
  - [ ] Spacing optimal

- [ ] **Tables:**
  - [ ] All columns visible without scroll
  - [ ] Hover effects on rows
  - [ ] Cursor changes on clickable elements

---

## 7️⃣ Accessibility (WCAG 2.2 AA)

### 7.1 Keyboard Navigation

- [ ] Tab order logical and visible ✅
- [ ] All buttons keyboard accessible ✅
- [ ] Modal trap focus correctly ✅
- [ ] Links underlined or have sufficient contrast ✅
- [ ] No keyboard traps ✅

### 7.2 Screen Reader Support

- [ ] Headings properly structured (h1 → h2 → h3) ✅
- [ ] Form labels associated with inputs ✅
- [ ] Buttons have descriptive text or aria-labels ✅
- [ ] Icons have aria-labels or text alternatives ✅
- [ ] Table headers properly marked ✅
- [ ] List items properly marked ✅

### 7.3 Visual Indicators

- [ ] Focus indicators visible (≥3px outline) ✅
- [ ] Color not only way to convey info:
  - [ ] Status badges have text ✅
  - [ ] Progress indicators have numbers ✅
  - [ ] Errors have icons + text ✅

### 7.4 Form Elements

- [ ] All form fields have labels ✅
- [ ] Error messages associated with fields ✅
- [ ] Required fields marked ✅
- [ ] Radio buttons properly grouped ✅
- [ ] Dropdowns keyboard accessible ✅

---

## 8️⃣ Performance & Security

### 8.1 Performance

- [ ] **Page Load:**
  - [ ] LCP ≤2s
  - [ ] FID ≤100ms
  - [ ] CLS ≤0.05

- [ ] **Bundle Size:**
  - [ ] Frontend <2MB gzipped
  - [ ] Backend <200KB
  - [ ] No large unused libraries

- [ ] **API Response:**
  - [ ] getStatus ≤200ms
  - [ ] getBillingHistory ≤500ms
  - [ ] upgradeToFeatured ≤1s (includes Stripe call)

### 8.2 Security

- [ ] **API:**
  - [ ] All procedures use protectedProcedure ✅
  - [ ] Role checks in place ✅
  - [ ] Input validation with Zod ✅
  - [ ] No sensitive data logged ✅

- [ ] **Stripe:**
  - [ ] Webhook signature verified ✅
  - [ ] Secret keys not exposed in frontend ✅
  - [ ] PCI compliance: no card data stored ✅

- [ ] **Database:**
  - [ ] SQL injection prevented by Drizzle ORM ✅
  - [ ] Parameterized queries only ✅
  - [ ] No raw SQL ✅

- [ ] **Session:**
  - [ ] Session cookies HTTP-only ✅
  - [ ] Session cookies secure ✅
  - [ ] Session timeout implemented ✅

---

## 9️⃣ Error Handling & Edge Cases

### 9.1 Error Scenarios

- [ ] **Network Failures:**
  - [ ] Checkout interrupted: user sees error
  - [ ] Webhook delivery fails: retry logic works
  - [ ] API timeout: graceful fallback

- [ ] **Validation Errors:**
  - [ ] Invalid sessionId rejected
  - [ ] Missing vendorId rejected
  - [ ] Invalid Stripe responses handled

- [ ] **Authorization Errors:**
  - [ ] Non-vendor cannot call procedures
  - [ ] Unauthenticated user redirected
  - [ ] Wrong vendor cannot view other's subscription

### 9.2 Edge Cases

- [ ] **Multiple Upgrades:**
  - [ ] Calling upgradeToFeatured twice doesn't create 2 customers
  - [ ] Existing customer ID reused

- [ ] **Rapid Cancellation:**
  - [ ] Canceling then immediately subscribing works
  - [ ] State transitions correctly

- [ ] **Webhook Replay:**
  - [ ] Processing same event twice is safe
  - [ ] Idempotency keys prevent duplicates

- [ ] **Timezone Handling:**
  - [ ] Renewal dates stored in UTC
  - [ ] Displayed in local timezone on frontend

---

## 🔟 Browser Compatibility

- [ ] **Chrome:** Latest + 2 versions back
- [ ] **Firefox:** Latest + 2 versions back
- [ ] **Safari:** Latest + 2 versions back
- [ ] **Edge:** Latest version

**Test Sites:**

- [ ] caniuse.com - CSS features ✅
- [ ] browserstack.com - Device testing (if available)

---

## 1️⃣1️⃣ Documentation & Knowledge Transfer

- [ ] Code comments clear and helpful ✅
- [ ] Function signatures well-documented ✅
- [ ] Error messages actionable ✅
- [ ] README updated with billing section ✅
- [ ] API documentation generated ✅

---

## ✅ Sign-Off Checklist

**Backend:**

- [ ] All 6 procedures tested end-to-end
- [ ] All 5 webhook handlers verified
- [ ] Database functions working correctly
- [ ] No console errors or warnings

**Frontend:**

- [ ] All 4 components render correctly
- [ ] Page layout responsive at 375/768/1024px
- [ ] Interactive elements functional
- [ ] No console errors or warnings

**Integration:**

- [ ] Stripe checkout flow works end-to-end
- [ ] Webhook events processed successfully
- [ ] Subscription state synced to database
- [ ] Billing history displays accurately

**Design & Accessibility:**

- [ ] v5.2 design tokens applied consistently
- [ ] WCAG 2.2 AA compliance verified
- [ ] Responsive design tested
- [ ] No accessibility violations

**Production Readiness:**

- [ ] TypeScript: 0 errors ✅
- [ ] Build: SUCCESS ✅
- [ ] No security vulnerabilities
- [ ] Performance: within targets
- [ ] Error handling: comprehensive

---

## 📝 Sign-Off

**QA Lead:** ************\_************  
**Date:** ************\_\_************  
**Status:** ⏳ Pending

**Approved for v5.3 Release:** ⏳ Pending

---

## 📋 Test Results Log

| Test Case | Expected | Actual | Status | Notes |
| --------- | -------- | ------ | ------ | ----- |
| ...       | ...      | ...    | ⏳     | ...   |

---

**Phase 5.3 QA Checklist Created:** November 10, 2025  
**Target Release Date:** November 10, 2025 (after QA completion)
