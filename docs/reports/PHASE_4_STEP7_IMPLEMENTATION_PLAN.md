# Phase 4 – Step 7 Implementation Plan

**Scope:** Claims UI, Order Details UI, Refund UI  
**Status:** Planned, backend assumed ready (claims, orders, refunds tRPC)

## 1. Objectives

1. Business owners can:
   - View a clear path to claim an existing directory listing.
   - Submit a claim with minimal friction.
   - See claim status (pending / approved / rejected).

2. Buyers can:
   - View full order details for each order.
   - See fulfillment and payment status clearly.
   - Submit a refund request per order.

3. Vendors can:
   - View refund requests for their orders in their existing orders view.
   - See that platform does not own fulfillment or refunds.

4. System:
   - No change to ownership of fulfillment or refunds.
   - UI makes vendor responsibility explicit.
   - No breaking changes to existing Phase 3–4 flows.

---

## 2. In-Scope vs Out-of-Scope

### In scope

- `/claim/:businessId` page.
- `/orders/:orderId` page.
- Inline refund request UI for buyer on order detail.
- Integration with existing tRPC procedures for:
  - `claim` (request + status).
  - `order` (getById / getMine / getByVendor).
  - `refund` (request / getMine).
- Minor additions to:
  - Sidebar / navigation (links to Orders and Claims where logical).
  - Existing Orders page (link to detail view).

### Out of scope

- New backend migrations (assume claims, orders, refunds tables already defined).
- Admin dispute UI.
- Automated notifications (email) beyond what is already implemented.
- Real-time updates (no websockets; reuse fetch and refetch patterns).

---

## 3. User Stories

### 3.1 Business Owner – Claim

1. As a business owner, I can open `/claim/:businessId` from a call-to-action on a business profile.
2. As a business owner, I can submit a claim with:
   - My name
   - Email
   - Optional ABN
   - A short justification message
3. As a business owner, I see:
   - Current status of my existing claim.
   - Clear text that Suburbmates does not intervene in operations, only verifies listing ownership.

### 3.2 Buyer – Order and Refund

1. As a buyer, I can:
   - Navigate from `/orders` to `/orders/:orderId`.
2. On `/orders/:orderId` I can:
   - See order summary (items, total, createdAt).
   - See payment status (paid / refunded / disputed).
   - See fulfillment status (pending / ready / completed / cancelled).
   - See fulfillment mode (pickup / delivery / digital).
   - See vendor contact and ABN / verification badges if available.
3. As a buyer, I can:
   - Submit one refund request per order with reason + description.
   - See that refunds are handled by the vendor, not Suburbmates.

### 3.3 Vendor – Refund Awareness

1. As a vendor, in my orders view, I can:
   - See which orders have refund requests.
   - See refund status (requested / resolved).
2. Text makes clear that:
   - Vendor decides refund.
   - Platform only logs and forwards.

---

## 4. Routes and Components

### 4.1 New Routes

- `/claim/:businessId`
  - Component: `ClaimBusinessPage`
- `/orders/:orderId`
  - Component: `OrderDetailPage`

No new top-level refund route. Refund is nested under order detail.

### 4.2 Components to Add

**Claims**

- `client/src/components/claims/ClaimForm.tsx`
  - Controlled form with react-hook-form + zod.
  - Fields:
    - name: string, required.
    - email: string, required, email format.
    - abn: string, optional.
    - message: string, required, min length.
  - Uses `claim.request` mutation.
- `client/src/pages/ClaimBusiness.tsx`
  - Reads `businessId` param.
  - Uses `business.getById` to show basic business info.
  - Uses `claim.getStatus` to show current claim if present.
  - Renders `ClaimForm` if no approved claim.

**Orders**

- `client/src/components/orders/OrderTimeline.tsx`
  - Visual timeline for:
    - Created
    - Payment succeeded
    - Fulfillment status changes
    - Refund / dispute flags
- `client/src/components/orders/RefundRequestForm.tsx`
  - Form fields:
    - reason: enum or string.
    - description: text.
  - Uses `refund.request` mutation.
  - Disabled if refund already requested.
- `client/src/pages/OrderDetail.tsx`
  - Reads `orderId`.
  - Uses `order.getById`.
  - Shows:
    - Order summary card.
    - Timeline (OrderTimeline).
    - Vendor card with contact info.
    - Fulfillment info.
    - RefundRequestForm (buyer-only).

---

## 5. Data and API Integration

### 5.1 Claims

Assume tRPC:

- `claim.request`  
  Input: `{ businessId: number; name: string; email: string; abn?: string; message: string }`  
  Output: `{ success: boolean }`

- `claim.getStatus`  
  Input: `{ businessId: number }`  
  Output: `{ status: "none" | "pending" | "approved" | "rejected"; lastUpdatedAt?: string; message?: string }`

UI behaviour:

- If `status === "none"` → show form.
- If `status === "pending"` → show non-editable status with info text.
- If `status === "approved"` → show success state and direct user to dashboard.
- If `status === "rejected"` → show rejection state and an option to resubmit (optional, Phase 5).

### 5.2 Orders

Assume tRPC:

- `order.getById`  
  Input: `{ orderId: number }`  
  Output: order object with:
  - buyer and vendor visibility filtered by auth.
  - fields: id, items, totalAmount, paymentStatus, fulfillmentStatus, fulfillmentMode, createdAt, updatedAt, vendor, business.

- `order.getMine` and `order.getByVendor` already used in `/orders`.

Order detail page:

- Uses `order.getById`.
- If user is not buyer or vendor for that order → show 404 or access denied.

### 5.3 Refunds

Assume tRPC:

- `refund.request`  
  Input: `{ orderId: number; reason: string; description?: string }`  
  Output: `{ success: boolean }`

- `refund.getMine` (optional read-only view, likely already implemented).

Refund rules:

- Frontend must:
  - Prevent multiple requests for the same order.
  - Show current refund status when available (from order payload or a nested refund object).
  - Never say Suburbmates issues refunds.

---

## 6. UI / UX Guidelines

### 6.1 Claims

- Use same design system: Forest Green / Emerald accents.
- Place claim CTA on BusinessProfile:
  - Link text: "I am the owner of this business".
  - Route to `/claim/:businessId`.
- On the claim page:
  - Show clear heading: "Claim this business".
  - Show a short paragraph describing:
    - Ownership verification only.
    - No operational responsibilities shift to platform.

### 6.2 Order Detail

- Layout:
  - Left column (mobile first): order summary + items.
  - Below or right: timeline and vendor details.
- Use StatusBadge component for:
  - paymentStatus.
  - fulfillmentStatus.
- Show a static disclaimer block:
  - "Orders are fulfilled directly by the vendor. Suburbmates does not deliver or issue refunds."

### 6.3 Refund UI

- Place refund form in a card labelled "Request a refund".
- Disable form when:
  - refund already requested, or
  - order is not in a refundable state (optional business rule).
- After submission:
  - Show non-editable success message.
  - Make it clear vendor will decide.

---

## 7. Work Packets

### Packet 7.1 – Claims UI

1. Create `ClaimForm.tsx`.
2. Create `ClaimBusiness.tsx` page.
3. Add route in `App.tsx`:
   - `path={"/claim/:businessId"}` → `ClaimBusiness`.
4. Add CTA on `BusinessProfile.tsx` to link to claim page.
5. Wire up tRPC hooks:
   - `trpc.claim.getStatus.useQuery`.
   - `trpc.claim.request.useMutation`.
6. Add Sonner toasts for success / error.

### Packet 7.2 – Order Detail UI

1. Create `OrderTimeline.tsx`.
2. Create `RefundRequestForm.tsx`.
3. Create `OrderDetail.tsx` page.
4. Add route in `App.tsx`:
   - `path={"/orders/:orderId"}` → `OrderDetail`.
5. Update `Orders.tsx`:
   - Add link on OrderCard to detail page.
6. Wire up tRPC:
   - `trpc.order.getById.useQuery`.
   - `trpc.refund.request.useMutation`.
7. Add appropriate guards:
   - Show access denied if order not owned by user.

### Packet 7.3 – Final Integration and Polish

1. Run `pnpm check`.
2. Run `pnpm build`.
3. Manual smoke test:
   - Claim flow.
   - Orders list → detail → refund.
4. Update docs:
   - Append Step 7 to Phase 4 summary.
5. Create 2–3 focused commits:
   - `feat: add business claim UI`.
   - `feat: add order detail and refund UI`.
   - `chore: docs and minor fixes`.

---

## 8. Acceptance Criteria

Phase 4 Step 7 is "done" when:

1. `/claim/:businessId`:
   - Loads business info.
   - Shows claim form if no claim.
   - Submits and shows "pending" state on next visit.

2. Business profile:
   - Has a visible link to claim page.

3. `/orders/:orderId`:
   - Accessible only for buyer or vendor.
   - Shows order summary, payment status, fulfillment status, vendor info.
   - Shows disclaimer about vendor responsibilities.

4. Refund UI:
   - Visible for buyer on eligible orders.
   - Submits a refund request through tRPC.
   - Prevents duplicate requests.
   - Confirms that vendor handles refund, not Suburbmates.

5. Codebase:
   - `pnpm check` passes.
   - `pnpm build` passes.
   - No changes to database schema required.
   - No regression on existing Orders and Checkout flows.

---
