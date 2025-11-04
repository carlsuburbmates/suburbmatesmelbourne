# **PHASE 4 QA CHECKLIST v2**

**Title:** *Admin & Dispute Dashboard Verification*
**Version:** 2.0 (locked)
**Date:** 2025-11-04
**Scope:** Phase 4 Step 8 (Admin Claims + Disputes + Vendor Refund Responses)

---

## 🧩 1. Environment Sanity

| Check | Expected Result | Status |
|-------|-----------------|--------|
| `pnpm check` | No TypeScript errors | ⬜ |
| `pnpm build` | Build completes successfully | ⬜ |
| Dev server `pnpm dev` | Launches with no runtime errors | ⬜ |
| tRPC routes | admin.claims, admin.refunds, vendor.refunds respond | ⬜ |

---

## 🧾 2. Admin Claims Dashboard

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Visit `/admin/claims` | Claims table loads with pagination | ⬜ |
| Filter by status | Pending/Approved/Rejected filters work | ⬜ |
| Open `/admin/claims/:id` | Claim details and business info load | ⬜ |
| Approve Claim | Sets status to Approved → toast success | ⬜ |
| Reject Claim | Sets status to Rejected → toast success | ⬜ |
| Audit trail visible | Decision metadata (date + admin ID) displayed | ⬜ |

---

## ⚖️ 3. Admin Disputes & Refunds

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Visit `/admin/disputes` | List of refund/dispute tickets loads | ⬜ |
| Open `/admin/disputes/:id` | Refund details + order info shown | ⬜ |
| Decision Buttons | Buyer Refund / Vendor Keeps / Split operate | ⬜ |
| Submit Decision | tRPC mutation fires → toast success | ⬜ |
| Decision Badge | Color and label reflect chosen outcome | ⬜ |
| Unauthorized User Test | Buyer/Vendor cannot access admin routes | ⬜ |

---

## 🧮 4. Vendor Refund Responses

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Visit `/vendor/refunds` | Vendor's refunds load only their orders | ⬜ |
| Open Response Form | Form validates required fields | ⬜ |
| Submit Response | Mutation fires → toast success | ⬜ |
| Duplicate Submission | Prevented gracefully | ⬜ |
| Refund Status Update | Reflects "Responded" state | ⬜ |

---

## 🔒 5. Authorization & Security

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Admin routes guarded | Non-admin users redirected / denied | ⬜ |
| Vendor refund guard | Vendor only → own orders | ⬜ |
| Buyer visibility | Buyers cannot see admin/vendor panels | ⬜ |
| tRPC error handling | Graceful 403/401 fallbacks | ⬜ |

---

## 🧠 6. UX & Design Consistency

| Check | Expected Result | Status |
|-------|-----------------|--------|
| DashboardLayout | Consistent padding + typography | ⬜ |
| Forest Green/Emerald palette | Used for buttons and badges | ⬜ |
| DecisionBadge colors | Approved 🟢 Rejected 🔴 Pending 🟡 Resolved 🔵 | ⬜ |
| Dialogs/Modals | Smooth open/close, focus trap active | ⬜ |

---

## 🧾 7. Regression Tests

| Area | Test | Status |
|------|------|--------|
| Claims workflow | Business claim submission still works | ⬜ |
| Orders detail | Loads and renders timeline correctly | ⬜ |
| Refund submission | Buyer flow intact (no duplicate mutations) | ⬜ |
| Checkout flow | Stripe redirect functional | ⬜ |
| Product CRUD | Vendor product management intact | ⬜ |

---

## 🧩 8. Documentation & Comms

| Check | Expected Result | Status |
|-------|-----------------|--------|
| Implementation Plan v1.0 | Updated with "Implemented" flag | ⬜ |
| Execution Summary v8 | Auto-generated and linked | ⬜ |
| Release tag v4.8 | Created after merge to main | ⬜ |
| Team announcement | Internal note sent with build summary | ⬜ |

---

## ✅ 9. Sign-off Criteria

| Criterion | Pass Condition |
|-----------|----------------|
| All checks above marked ✅ | UAT complete |
| Build & TypeScript pass | No blocking errors |
| QA report attached | `docs/testing/QA_REPORT_v4.8.md` |
| Merge approved | `phase4-step8` → `main` |
| Tag `v4.8` pushed | Deployment ready |

---

## 📝 10. Execution Notes

**Checked by:** _________________
**Date:** _________________
**Sign-off:** _________________

---

### **🔒 Checklist Locked**
