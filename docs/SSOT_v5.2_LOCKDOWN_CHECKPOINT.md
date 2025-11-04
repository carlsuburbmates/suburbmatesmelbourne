# 📋 SSOT v5.2 Lockdown Checkpoint

**Date:** 4 November 2025  
**Commit:** `62cf8b9` (SSOT_AMBIGUITY_TRACKER.md)  
**Previous:** `faaed84` (Phase 5 Step 1 work saved)  
**Branch:** `phase5-step1`  
**Status:** ✅ **COMPLETE & LOCKED**

---

## Executive Summary

The SuburbMates Single Source of Truth (SSOT) has been **upgraded from v1.0 → v5.2** with comprehensive governance for all upcoming phases. The SSOT is now **frozen and locked** pending explicit SSOT Owner approval for any changes. A companion ambiguity tracker has been created to surface and resolve 25 items before Phase 6 execution.

### Governance Framework Locked

✅ **Design System** (Tailwind palette, typography, components frozen)  
✅ **Stack** (React 19/TS/tRPC/Drizzle/MySQL frozen)  
✅ **Marketplace Operations** (fees, tiers, refunds, disputes, claims frozen)  
✅ **Data Model** (all tables, routers, compliance specified)  
✅ **Phase Gates** (Phase 0–10 with verification criteria)  
✅ **QA/Performance/A11y** (budgets and gates documented)  
✅ **Change Control** (PR approval workflow for SSOT changes)  
🟡 **Ambiguity Tracking** (25 items to resolve by Phase 6)

---

## Documents Committed

| Document | Commit | Lines | Purpose |
| --- | --- | --- | --- |
| `SSOT.md` v5.2 | `51b8001` | 390 | Authoritative governance; marketplace operations, phases 0-10, compliance |
| `SSOT_AMBIGUITY_TRACKER.md` | `62cf8b9` | 88 | Mirrors gray zones; 25 items with resolution targets |
| **This checkpoint** | `62cf8b9` | — | Transition record for Phase 6 planning |

---

## Key Decisions Locked in SSOT v5.2

### 1. Marketplace Operations (Non-Negotiable)

| Decision | Value | Authority |
| --- | --- | --- |
| BASIC tier fee | 8.00% + $0.50 | SSOT §3 |
| FEATURED tier fee | 6.00% + $0.50 | SSOT §3 |
| FEATURED subscription | $29/mo (Stripe Billing) | SSOT §3 |
| BASIC product limit | 12 products | SSOT §3 |
| FEATURED product limit | 48 products | SSOT §3 |
| Ranking boost (Featured) | 1.25× | SSOT §3 |
| Ranking boost (ABN Verified) | 1.05× | SSOT §3 |
| Refund authority | **Vendor owns decision** | SSOT §3 |
| Dispute source | Stripe chargebacks (webhooks) | SSOT §3 |
| Claims authority | **Admin approval required** | SSOT §3 |
| Platform role | **Facilitator only** (vendor owns fulfillment) | SSOT §3 |

### 2. Technical Stack (Immutable for v5.x)

| Component | Choice | Rationale |
| --- | --- | --- |
| Frontend framework | React 19 + TypeScript + Vite | High DX; bundling perf |
| State management | React Context + localStorage + DB | Optimal for cart/notifications |
| UI primitives | shadcn/ui (Radix) | Accessible, composable, themeable |
| CSS framework | Tailwind CSS 4 | Consistency with design system |
| Backend framework | Node/Express + tRPC v10 | Type-safe APIs; end-to-end TS |
| ORM | Drizzle | Type-safe schema; MySQL/TiDB compatible |
| Payments | Stripe Checkout Sessions (redirect) | PCI-compliant; no client keys |
| Auth | Passwordless (email) + session cookies | Modern UX; server-side session control |
| PWA | Manifest + Service Worker (Vite adapted) | Offline support; installable |
| Analytics | Single provider (consent-gated) | No tracking creep; privacy-first |
| AI (server-side only) | Provider locked in env | No client-side keys |

### 3. Phase Gates (Execution Checkpoints)

**Phase 0 (✅ COMPLETE):** Baseline Lock  
**Phase 1 (✅ COMPLETE):** Backend & Schema Alignment  
**Phase 2 (✅ COMPLETE):** PWA + AI Surfaces  
**Phase 3 (✅ COMPLETE):** Agentic Logic (local)  
**Phase 4 (✅ v4.8):** Orders + Claims + Refunds  
**Phase 5 Step 1 (✅ v5.1):** Cart + Notifications  
**Phase 5 Steps 2–3 (⏳ NEXT):** Products, Inventory, Vendor Upgrades → v5.3  
**Phase 6 (📋 PLANNED):** Admin Automation & Reporting → v6.0  
**Phase 7–10 (📋 PLANNED):** Vendor tools, AI concierge, ecosystem, LTS  

All phase gates include **verification checklist** (TypeScript 0 errors, build success, smoke tests, CWV budgets, a11y gates).

### 4. QA / Performance / A11y (Global, Mandatory)

| Gate | Target | Enforced From |
| --- | --- | --- |
| TypeScript strict | 0 errors | v5.1+ |
| Vite build | PASS (warnings logged) | v5.1+ |
| LCP (mobile) | ≤ 2.0s | v5.1+ |
| INP (mobile) | ≤ 200ms | v5.1+ |
| CLS (mobile) | ≤ 0.05 | v5.1+ |
| axe CI (a11y) | 0 serious/critical | v5.1+ |
| Playwright smoke | Auth → List → Profile → Checkout → Orders → Refunds → Admin | v5.1+ |
| Analytics consent | 100% opt-in gating | v5.1+ |

### 5. Compliance (Non-Negotiable)

| Policy | Requirement | Authority |
| --- | --- | --- |
| Facilitator stance | All emails state: "Platform is a facilitator only. Vendor owns fulfillment/refunds." | SSOT §8 |
| ABN verification | Server-only; 24h cache; badge only post-verification | SSOT §2 |
| Refund decision | Vendor authoritative; platform reconciles via Stripe webhooks | SSOT §3 |
| Dispute handling | Webhook-driven from Stripe chargebacks; no platform override | SSOT §3 |
| AI deployment | Server-side only; no client-side keys; opt-out respected | SSOT §2 |
| Auth storage | Session cookies HTTP-only; no JWT without approval | SSOT §2 |
| PII handling | Audit logs on all writes; no leakage to exports | SSOT §8 |

---

## Ambiguity Tracker Status (25 Items)

All 25 ambiguities documented in `SSOT_AMBIGUITY_TRACKER.md` with:
- Specific corrective actions
- Assigned owners (Planner, Backend, Frontend, DevOps, QA)
- Target resolution phases (5.2 → 5.3 → 6.0)

**Categories:**
- 🟡 **Architectural** (6 items): DB engine, webhooks, ABN cache, tRPC versioning, AI model, PWA scope
- 🟡 **Integration** (5 items): Auth propagation, role guards, vendor UX, claim model, refund authority
- 🟡 **Governance** (5 items): Branch naming, tag discipline, QA docs, env parity, analytics provider
- 🟡 **Human/Process** (4 items): Copilot autonomy, QA ownership, file naming, audit logging
- 🟡 **Long-Term** (5 items): Admin RBAC, reporting libs, background jobs, campaign email sender, AI logging

**Verification Rule:** All 25 must reach ✅ **Resolved** or 🧩 **Documented exception** before **Phase 6 tag (v6.0)**.

---

## Change Control Framework (Locked)

**SSOT Changes Require:**

1. **PR titled "SSOT Update"** with clear rationale
2. **SSOT Owner approval** (for breaking changes: fees, roles, schema, workflows)
3. **Impact analysis** (which phases affected? which teams notified?)
4. **Migration plan + rollback** (if schema or role changes)
5. **Entry in `/docs/changelog/`** (version bump, announcement)

**This process prevents drift and ensures all stakeholders stay aligned.**

---

## Immediate Next Steps (Phase 6 Planning)

### Week 1: Resolve Quick Wins (5 Ambiguity Items)

- [ ] **Item #2:** Split Stripe webhooks (order endpoint vs subscription endpoint)
- [ ] **Item #6:** Restrict PWA scope (home/directory/profile only, exclude checkout/auth)
- [ ] **Item #8:** Centralize role guards in `actions/_guards.ts`
- [ ] **Item #12:** Enforce branch naming `phase{n}-step{m}`
- [ ] **Item #16:** Add `ANALYTICS_PROVIDER` env flag (PostHog vs GA4)

### Week 2–3: Phase 6 Design (Admin Automation & Reporting)

- [ ] Create `PHASE_6_IMPLEMENTATION_PLAN.md` with:
  - Scope: dashboards, CSV/PDF exports, role management, audit viewer, digest emails
  - Gate requirements: Admin RBAC ✓, exports ✓, background jobs ✓, no PII leakage, CWV ✓
  - File structure: `/admin` pages, `/api/exports`, `/services/reports`, `/jobs/digest`
  - Estimated effort & timeline
- [ ] Lock Phase 6 ambiguities (items #1, #3, #4, #5, #7, #9, #10, #11, #13, #14, #15, #17, #18, #19, #20)
- [ ] Prepare Phase 6 branch (`phase6-planning`) for design review

### Month 2: Phase 5 Steps 2–3 Execution (Products, Inventory, Vendor Upgrades)

- [ ] Complete ambiguity resolution for items targeted to 5.2 → 5.3
- [ ] Implement `/products` backend + frontend
- [ ] Implement inventory sync on payment
- [ ] Implement vendor tier upgrade flow (BASIC → FEATURED)
- [ ] Tag **v5.3** with QA gates passing

---

## Verification Checklist (This Checkpoint)

| Item | Status | Evidence |
| --- | --- | --- |
| SSOT.md v5.2 committed | ✅ | Commit `51b8001` |
| SSOT_AMBIGUITY_TRACKER.md committed | ✅ | Commit `62cf8b9` |
| All 25 ambiguities documented | ✅ | Tracker table complete |
| Phase gates 0–10 locked | ✅ | SSOT §6 |
| Marketplace ops locked | ✅ | SSOT §3 |
| QA/performance/a11y gates locked | ✅ | SSOT §10 |
| Change control process defined | ✅ | SSOT §11 |
| Phase 5 Step 1 (v5.1) tagged & pushed | ✅ | v5.1 tag on `7df4c52` |
| Checkpoint documentation complete | ✅ | This file |
| Pushed to origin/phase5-step1 | ✅ | Delta: 2 commits |

---

## Files for Phase 6 Planning Review

**Essential Reads Before Phase 6 Execution:**

1. `/SSOT.md` — Authoritative governance (all decisions locked)
2. `/docs/SSOT_AMBIGUITY_TRACKER.md` — 25 items requiring resolution
3. `/PHASE_5_STEP_1_COMPLETION_REPORT.md` — What v5.1 delivered
4. `/PHASE_5_STEP_1_QA_REPORT.md` — Verification evidence for v5.1
5. `/todo.md` — Product roadmap overview (legacy; update post-Phase 6 design)

---

## Summary: What's Locked, What's Open

### ✅ Frozen & Locked (No Changes Without SSOT PR)

- Design system (palette, typography, components)
- Stack (React/TS/tRPC/Drizzle/Stripe)
- Marketplace operations (fees, tiers, refund stance, dispute handling)
- Phase 0–5 verification gates
- QA/performance/a11y budgets
- Change control process
- Admin RBAC model (enum vs granular): **DECISION PENDING**

### 🟡 Open & Tracked (25 Ambiguities)

- Exact admin RBAC schema
- Export library choice (pdfkit, csv-writer)
- Background job infrastructure (Vercel Cron vs self-hosted)
- Campaign email sender model
- AI logging table schema
- 20 other integration, governance, and process items

### 📋 Next Phase (Phase 6 Planning)

- Admin dashboard design
- Export/reporting UI specs
- Audit logging implementation
- Role-based access control enforcement
- Background job scheduling

---

## Commit Summary (SSOT Governance Update)

```
51b8001 docs: Update SSOT to v5.2 - marketplace operations, phases, data model, compliance locked
62cf8b9 docs: Add SSOT_AMBIGUITY_TRACKER.md - 25 items to resolve before Phase 6
```

**Total:** 2 commits, 478 lines added, 0 lines deleted, 0 conflicts  
**Branch:** `phase5-step1` (ready for merge to `main` post-Phase 6 planning)  
**Owner:** Planner / SSOT Owner  
**Status:** ✅ **LOCKED & AUTHORITATIVE**

---

## Continuation Instructions (For Next AI Agent Session)

If resuming Phase 6 planning or Phase 5 Steps 2–3:

1. **Always read `/SSOT.md` first** — it's the single source of truth
2. **Cross-reference ambiguities** in `/docs/SSOT_AMBIGUITY_TRACKER.md` for context
3. **Use phase branch pattern:** `phase{n}-step{m}` (e.g., `phase6-planning`)
4. **Verify QA gates** from SSOT §10 before tagging
5. **PR any SSOT changes** with SSOT Owner approval
6. **Update ambiguity tracker** when resolving items (reference commit)

---

**🎯 Phase 5 Step 1 (v5.1) COMPLETE. SSOT v5.2 LOCKED. Ready for Phase 6 Planning.**

