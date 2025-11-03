# 🧩 Phase 4 Gap Analysis Report

**Project:** Suburbmates Marketplace
**Version:** 1.0 (3 Nov 2025)
**Scope:** Comparison between current Phase 3 implementation and the target Phase 4 Role + Tier Architecture.

---

## 1️⃣ High-Level Alignment

| Area              | Phase 3 State                                            | Phase 4 Goal                                       | Gap / Required Action                                                                                        |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Role Model        | Single user type (`users`, `businesses`, `vendors_meta`) | Distinct roles: Business Owner vs Vendor (+ Admin) | ➤ Add `role` enum → `'OWNER' \| 'VENDOR' \| 'ADMIN'` in `users` table.<br>➤ Update auth guards & dashboards. |
| Listing Ownership | `businesses.isClaimed` (boolean)                         | Claim assigns `claimedByUserId → users.id`         | ➤ Add FK `claimedByUserId`.                                                                                  |
| Upgrade Path      | Direct vendor onboarding                                 | Two-step: Owner → Vendor                           | ➤ Add `/join-vendor` flow → Stripe Connect.                                                                  |
| Stripe Flows      | Vendor onboarding only                                   | + Subscription checkout for Featured Vendors       | ➤ Add `/api/stripe/create-subscription` and webhook handlers.                                                |

---

## 2️⃣ Directory Layer – Business Owners

| Feature           | Current       | Enhancement Needed                                    | Priority  |
| ----------------- | ------------- | ----------------------------------------------------- | --------- |
| Directory Listing | Implemented   | ✅ Retain                                              | —         |
| Claim Flow        | Manual flag   | Add "Claim this listing" form + OTP/email link        | 🔴 High   |
| ABN Verification  | Global toggle | Optional + encouraged for owners                      | 🟡 Low    |
| Owner Dashboard   | None          | `/dashboard/owner` → manage listings & upgrade prompt | 🟠 Medium |
| Upgrade to Vendor | Not coded     | Button → Stripe onboarding                            | 🔴 High   |

---

## 3️⃣ Marketplace Layer – Vendors (Basic + Featured)

| Component             | Current     | Target                              | Gap                                      |
| --------------------- | ----------- | ----------------------------------- | ---------------------------------------- |
| `subscriptionTier`    | Placeholder | Activate `BASIC / FEATURED` logic   | 🟢 Minor                                 |
| Commission            | Fixed 8 %   | Dynamic 8 % / 6 %                   | 🟠 Add conditional fee calc in checkout. |
| Product Limit         | Unlimited   | 5 vs 15 listings                    | 🟠 Add server-side limit check.          |
| Profile Size          | 128 px      | 256 px for Featured                 | 🟢 UI update.                            |
| Featured Badge        | None        | ⭐ Gold badge                        | 🟡 Add UI token & component.             |
| Analytics Tab         | Placeholder | Enable for Featured                 | 🟠 Add metrics gate.                     |
| Promo Posts           | None        | 1 per 7 days                        | 🟠 Create `promotions` table.            |
| Rank Boost            | Static      | +25 % for Featured                  | 🟠 Adjust search query weight.           |
| Subscription Webhooks | TODO        | Implement `customer.subscription.*` | 🔴 High                                  |

---

## 4️⃣ ABN Verification

| Item               | Current      | Required                             | Gap |
| ------------------ | ------------ | ------------------------------------ | --- |
| ABR API            | Exists       | ✅ Retain                             | —   |
| UI Placement       | Profile only | Add on cards + vendor setup page     | 🟡  |
| Encouragement Copy | Missing      | "Verify ABN → increase trust" banner | 🟡  |

---

## 5️⃣ Fulfilment & Orders

| Subsystem         | Current     | Target                                           | Gap                |
| ----------------- | ----------- | ------------------------------------------------ | ------------------ |
| Orders Table      | Not present | `orders`, `order_logs`                           | 🔴 Add migrations. |
| Fulfilment Fields | None        | `fulfilmentMode`, `pickupAddress`, `deliveryFee` | 🔴                 |
| Order Dashboard   | None        | `/dashboard/vendor/orders`                       | 🔴                 |
| Stripe Webhooks   | Basic sales | Extend to refund/dispute/payout                  | 🟠                 |

---

## 6️⃣ Notifications & Email System

| Trigger         | Current    | Target                   | Gap |
| --------------- | ---------- | ------------------------ | --- |
| Order Confirmed | None       | Buyer + Vendor           | 🔴  |
| Refund Events   | None       | Buyer + Vendor + Admin   | 🔴  |
| Disputes        | None       | Vendor + Admin           | 🔴  |
| Stripe KYC      | None       | Vendor + Admin           | 🟠  |
| Logging         | Audit only | Add `EMAIL_SENT` entries | 🟠  |

---

## 7️⃣ UI / Design System

| Element           | Current     | Target                               | Gap |
| ----------------- | ----------- | ------------------------------------ | --- |
| Badge Tokens      | None        | `.badge-featured`, `.badge-verified` | 🟡  |
| Card Variants     | One layout  | Directory vs Marketplace             | 🟠  |
| Responsive Sizing | Static      | Tier-based sizing                    | 🟡  |
| Dashboard Menu    | Vendor-only | Add Owner tabs                       | 🟠  |

---

## 8️⃣ Compliance & Terms

| Area           | Status          | Gap                                   |    |
| -------------- | --------------- | ------------------------------------- | -- |
| Vendor Terms   | Phase 3 present | Update for vendor = fulfilment logic  | 🟠 |
| Owner Terms    | None            | Draft new section for directory users | 🔴 |
| Privacy Policy | Phase 1 draft   | Add email logging disclosure          | 🟡 |

---

## 9️⃣ Critical Gaps Summary (Priority Matrix)

| Priority | Domain               | Task                                        |
| -------- | -------------------- | ------------------------------------------- |
| 🔴 P1    | Role Model           | Add Owner/Vendor distinction + claim system |
| 🔴 P1    | Stripe Subscriptions | Activate Featured ($29/mo) Billing flow     |
| 🟠 P2    | Commission Logic     | Implement 6 % / 8 % dynamic fee             |
| 🟠 P2    | Fulfilment           | Add orders schema + dashboard               |
| 🟡 P3    | ABN UI               | Add badge and banner                        |
| 🟡 P3    | Notifications        | Integrate Resend email hooks                |
| 🟢 P4    | Tier Visuals         | Larger photos + ⭐ badge + rank boost        |

---

## 🔟 Readiness Scorecard

| Category              | Readiness % | Status                         |
| --------------------- | ----------- | ------------------------------ |
| Database Schema       | 70 %        | Needs Orders + Claim fields    |
| Stripe Integration    | 60 %        | Add Billing + commission logic |
| Fulfilment System     | 20 %        | To be built                    |
| Notification System   | 30 %        | Planned                        |
| UI/UX Tier Support    | 55 %        | Partial                        |
| Compliance Docs       | 50 %        | Requires Owner Terms           |
| **Overall Readiness** | **55 %**    | Transition (Phase 3 → 4)       |

---

### ✅ Next Step
Write and lock this implementation plan into Phase 4 structure.
