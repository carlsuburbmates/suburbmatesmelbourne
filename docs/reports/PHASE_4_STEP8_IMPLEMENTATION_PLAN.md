# **PHASE 4 STEP 8 IMPLEMENTATION PLAN**

**Title:** _Admin Dashboard & Dispute Management System_
**Version:** 1.0 (locked for execution)
**Date:** 2025-11-04
**Branch:** `phase4-step8`
**Previous Milestone:** ✅ Phase 4 Step 7 (Claims + Refund UI Complete)

---

## 🎯 1. Objectives

| Role       | Objective                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------- |
| **Admin**  | Manage and audit claims, refunds, and disputes across the marketplace with full transparency.     |
| **Vendor** | Respond to refund requests and view resolution outcomes without platform liability.               |
| **System** | Maintain immutable audit trail via existing tRPC logging and ensure zero cross-role data leakage. |

---

## 🧩 2. Scope

**In Scope**

- Admin UIs for Claims and Refund Disputes
- Vendor Refund Response UI
- Role-based routing and authorization guards
- tRPC integration for admin.claims, admin.refunds, disputes procedures
- Toast feedback and status badges
- Documentation + QA checklist update

**Out of Scope**

- Email automation (batched for Step 9)
- Payment reversals (Stripe server hook only placeholder)
- Analytics dashboard metrics (batched for Phase 5)

---

## 📜 3. User Stories

### Admin

- As an admin, I can see all business claims with status filters.
- As an admin, I can review a claim, approve or reject it with notes.
- As an admin, I can see refund and dispute tickets by status and resolve them.
- As an admin, I can record final decisions with immutable logs.

### Vendor

- As a vendor, I can view refund requests for my orders.
- As a vendor, I can submit a response (accept/reject/offer partial).

---

## 🗺️ 4. Routes & Pages

| Route                 | Purpose                         | Component(s)               |
| --------------------- | ------------------------------- | -------------------------- |
| `/admin/claims`       | Claims overview (list + filter) | `AdminClaimsPage`          |
| `/admin/claims/:id`   | Claim detail & decision         | `ClaimDetailModal`         |
| `/admin/disputes`     | Refund/dispute overview         | `AdminDisputesPage`        |
| `/admin/disputes/:id` | Dispute resolution view         | `DisputeDetailModal`       |
| `/vendor/refunds`     | Vendor refund responses         | `VendorRefundResponsePage` |

---

## 🧱 5. Component Architecture

```
components/
├─ admin/
│  ├─ AdminClaimsPage.tsx
│  ├─ ClaimDetailModal.tsx
│  ├─ AdminDisputesPage.tsx
│  └─ DisputeDetailModal.tsx
├─ vendor/
│  └─ VendorRefundResponseForm.tsx
└─ shared/
   ├─ StatusBadge.tsx (reuse)
   └─ DecisionBadge.tsx (new)
```

---

## ⚙️ 6. tRPC Integration

**Admin Procedures**

- `admin.claims.list` → All claims with filters (status)
- `admin.claims.updateStatus` → Approve/Reject with notes
- `admin.refunds.list` → All refund requests with status
- `admin.disputes.resolve` → Set decision (buyer_refund | vendor_keeps | split)

**Vendor Procedures**

- `vendor.refunds.getMine` → Vendor's own refunds
- `vendor.refunds.respond` → Vendor response payload

---

## 🎨 7. UI/UX Guidelines

- Maintain Forest Green / Emerald palette consistency.
- Use DashboardLayout for all admin pages.
- Decision actions use Dialog + confirmation pattern.
- Color codes: Approved 🟢 Rejected 🔴 Pending 🟡 Resolved 🔵.
- Vendor Refund page mirrors Order Detail layout for continuity.

---

## 🧮 8. Work Packets (Execution Phases)

| Packet  | Focus                    | Deliverables                                                | Est. Time |
| ------- | ------------------------ | ----------------------------------------------------------- | --------- |
| **8.1** | Admin Claims             | AdminClaimsPage + ClaimDetailModal + stats header           | 1.5 h     |
| **8.2** | Admin Disputes & Refunds | AdminDisputesPage + DisputeDetailModal + tRPC integration   | 2 h       |
| **8.3** | Vendor Responses         | VendorRefundResponseForm + VendorRefundResponsePage + route | 1.5 h     |
| **8.4** | Verification & Polish    | TypeScript check, QA Checklist v2, Docs update, 3 commits   | 1 h       |

---

## 🧩 9. Acceptance Criteria

- [ ] `/admin/claims` loads list with filters and pagination
- [ ] `/admin/claims/:id` approves/rejects claim and persists decision
- [ ] `/admin/disputes` lists refund and dispute requests
- [ ] `/admin/disputes/:id` resolves case with notes
- [ ] `/vendor/refunds` shows only vendor's orders
- [ ] Vendor can respond once per refund request
- [ ] Toast feedback visible on actions
- [ ] TypeScript and build pass zero errors
- [ ] No schema changes required
- [ ] Regression tests (pass QA Checklist v2 sections 1-4)

---

## 🧪 10. Testing & QA Checklist v2 (Preview)

| Area               | Checks                                       |
| ------------------ | -------------------------------------------- |
| **Environment**    | `pnpm check && pnpm build` clean             |
| **Admin Claims**   | Load filters, approve/reject actions persist |
| **Admin Disputes** | View and resolve refund cases                |
| **Vendor Refunds** | Response form validation, duplicate guard    |
| **Authorization**  | Admin vs Vendor vs Buyer access tested       |
| **Regression**     | Claims, Orders, Checkout flows intact        |

---

## 🧾 11. Commits Structure

| Commit                                      | Purpose    |
| ------------------------------------------- | ---------- |
| `feat: add admin claims dashboard`          | Packet 8.1 |
| `feat: add admin disputes and refund pages` | Packet 8.2 |
| `feat: add vendor refund response UI`       | Packet 8.3 |
| `chore: docs and QA checklist v2`           | Packet 8.4 |

---

## 🧱 12. Dependencies

- shadcn/ui (Dialog, Tabs, Card, Table)
- react-hook-form (available)
- tRPC admin procedures (backend verified)
- Sonner for feedback

---

## 🪜 13. Execution Flow

1. Copilot verifies schemas → creates components by packet.
2. Run `pnpm check && pnpm build`.
3. Commit after each packet.
4. Run QA Checklist v2.
5. Push branch `phase4-step8` for merge.

---

## 🏁 14. Deliverables After Completion

| Deliverable       | Description                                   |
| ----------------- | --------------------------------------------- |
| `/admin/claims`   | Claims management UI                          |
| `/admin/disputes` | Dispute + refund management UI                |
| `/vendor/refunds` | Vendor refund response UI                     |
| Docs              | Updated implementation plan + QA Checklist v2 |
| Tag               | `v4.8 – Admin & Dispute Dashboard Complete`   |

---

## 📊 15. Status & Execution Notes

**Status:** 🔒 LOCKED FOR EXECUTION

**Next Step:** Copilot proceeds with Packet 8.1 upon approval.

**Branch:** Create `phase4-step8` from `main` before execution.

---

### **🔒 Plan Locked — Ready for Execution**
