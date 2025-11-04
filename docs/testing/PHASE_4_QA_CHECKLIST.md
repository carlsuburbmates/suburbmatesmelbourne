# Phase 4 – QA / UAT Checklist  
Scope: Vendor Products, Orders, Checkout, Claims, Refund UI

## 1. Environment Sanity

- [ ] `pnpm install` completes without errors.
- [ ] `pnpm check` passes.
- [ ] `pnpm build` passes.
- [ ] `.env` contains valid Stripe test keys and API base URLs.

---

## 2. Vendor Product Management

As a logged-in vendor:

- [ ] Navigate to `/vendor/products`.
- [ ] List of products loads or shows an empty state.
- [ ] "Add product" opens ProductForm.
- [ ] Creating a valid product:
  - [ ] Succeeds.
  - [ ] New product appears in list without page reload.
- [ ] Editing an existing product:
  - [ ] Prefills with correct values.
  - [ ] Updates persist after save and refresh.
- [ ] Deactivating a product:
  - [ ] Product disappears from public views if applicable.
  - [ ] Product remains visible in vendor view with correct status if designed that way.
- [ ] Invalid input (blank title, negative price) shows inline validation errors.

---

## 3. Orders List

As a buyer:

- [ ] Navigate to `/orders`.
- [ ] Orders list shows entries that belong to the logged-in user only.
- [ ] Status badges render properly.
- [ ] Manual refresh button works.
- [ ] Switching browser tab away and back triggers a refetch (if focus refetch is enabled).

As a vendor:

- [ ] Navigate to `/orders` (vendor tab or view).
- [ ] Only orders related to this vendor's products are shown.
- [ ] Status badges and totals render correctly.

---

## 4. Checkout Flow

- [ ] Starting from a product, create an order and initiate checkout.
- [ ] User is redirected to Stripe Checkout Session.
- [ ] Test card (`4242 4242 4242 4242`) completes payment.
- [ ] After payment:
  - [ ] User lands on `/checkout/success`.
  - [ ] Order appears in `/orders` with correct payment status.
- [ ] Cancelling payment:
  - [ ] Returns to `/checkout/cancel`.
  - [ ] No paid order created.

---

## 5. Order Detail and Refund

As a buyer:

- [ ] From `/orders`, click into `/orders/:orderId`.
- [ ] Order detail shows:
  - [ ] Items list.
  - [ ] Total amount.
  - [ ] Payment status.
  - [ ] Fulfillment status.
  - [ ] Fulfillment mode.
  - [ ] Vendor info block.
- [ ] Timeline shows key points (created, paid, etc.).
- [ ] Refund UI:
  - [ ] Visible when order is refundable.
  - [ ] Hidden or disabled when not refundable (if implemented).
  - [ ] Submitting a refund request:
    - [ ] Shows success message.
    - [ ] Prevents second submission.
- [ ] Disclaimer text states:
  - [ ] Vendor is responsible for fulfillment and refunds.
  - [ ] Suburbmates is a facilitator, not a fulfiller.

As a non-owner:

- [ ] Trying to open `/orders/:orderId` for an order that is not mine returns:
  - [ ] Access denied page or 404.

---

## 6. Claims UI

As an anonymous user or logged-in user:

- [ ] Open a business profile.
- [ ] "I am the owner of this business" link is visible.
- [ ] Link navigates to `/claim/:businessId`.

On `/claim/:businessId`:

- [ ] Business info is displayed.
- [ ] If no claim exists:
  - [ ] Claim form is visible.
  - [ ] Required fields: name, email, message.
  - [ ] ABN optional.
- [ ] Submitting a valid claim:
  - [ ] Shows a success message.
  - [ ] On reload, page shows "pending" status instead of form.
- [ ] If backend has an approved/denied claim:
  - [ ] UI reflects approved/rejected state correctly.

---

## 7. Vendor View of Refunds (Surface Only)

As a vendor:

- [ ] In orders view, orders with refund requests are clearly marked.
- [ ] No UI claims that Suburbmates decides refunds.

---

## 8. Error Handling and Edge Cases

- [ ] Network failure during any tRPC request:
  - [ ] Shows toast or visible error message.
  - [ ] UI does not crash.
- [ ] Unauthorized state:
  - [ ] Protected pages redirect to login or show access denied.
- [ ] Invalid route parameters:
  - [ ] `/orders/abc` does not crash; shows error or redirect.
  - [ ] `/claim/abc` handled similarly.

---

## 9. Regression Checks

- [ ] Home page still loads and links correctly.
- [ ] Directory and BusinessProfile still function as before.
- [ ] Marketplace and vendor setup pages still compile and load.
- [ ] No visual breakage of DashboardLayout.

---

## 10. Sign-off

Phase 4 Frontend is acceptable when:

- [ ] All checkboxes in sections 2–9 pass.
- [ ] No critical or high severity defects remain.
- [ ] TypeScript and build stay green.
- [ ] Stripe test flows work end-to-end.
