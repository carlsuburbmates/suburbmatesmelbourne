# Suburbmates V1.1 – Pull Request Checklist

## Summary
(Explain what this PR does and which part of V1.1 it touches.)

---

## 1. V1.1 Architectural Compliance
- [ ] No imports from Phase 5 (`client/`, `server/`, `drizzle/`, `shared/`)
- [ ] No tRPC, Drizzle ORM, MySQL, or Manus code introduced
- [ ] Code matches Next.js App Router + Supabase + Stripe Connect Standard architecture

---

## 2. Directory vs Marketplace Rules
- [ ] Directory pages contain **no pricing, checkout, cart, or product lists**
- [ ] Marketplace pages only show products from active vendors (`is_vendor = true`, `vendor_status = 'active'`)

---

## 3. Merchant of Record (MoR) Model
- [ ] Vendors are treated as the MoR (they control refunds, disputes, compliance)
- [ ] No platform refund logic added
- [ ] No platform-as-seller behavior introduced

---

## 4. Selective Hybrid Reuse Rules
- [ ] Only UI components, validators, formatters, or patterns reused from Phase 5 (if any)
- [ ] No Phase 5 database logic, tRPC procedures, auth context, or refund flows brought in

---

## 5. Compliance With Enforcement (CI Checks)
- [ ] No forbidden strings detected (mysql, trpc, manus, drizzle)
- [ ] Required strings preserved in schema, legal, and API docs
- [ ] Phase 5 directories (client/, server/, drizzle/, shared/) not modified
- [ ] Schema reference unchanged unless intentionally updated with new required fields

---

## 6. Testing
- [ ] Local testing completed
- [ ] Affected pages/components tested in browser
- [ ] No console errors or warnings introduced

---

## 7. Notes for Reviewer
(Any special context for Copilot or human reviewers?)
