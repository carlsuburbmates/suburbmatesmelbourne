# Suburbmates — V1.1 Repository

A dual-mode monorepo containing:

1. **Phase 5 (Archived)** — read-only reference
2. **V1.1 (Active)** — the new platform build, fully enforced by CI & guardrails

This repository implements a strict **Archive Mode**, **Vendor-as-Merchant-of-Record** model, and **Selective Hybrid Reuse** rules.

---

# 1. Repository Structure

```
/suburbmates
│
├── client/                         # Phase 5 (ARCHIVED)
├── server/                         # Phase 5 (ARCHIVED)
├── drizzle/                        # Phase 5 (ARCHIVED)
├── shared/                         # Phase 5 (ARCHIVED)
├── .PHASE5-FROZEN-REFERENCE-ONLY   # Marker: do not modify Phase 5
├── .PHASE5_README.md               # Phase 5 reference documentation
│
└── v1.1/                           # ACTIVE V1.1 DEVELOPMENT
    ├── app/                        # Next.js App Router project
    ├── components/                 # UI + reusable components
    ├── lib/                        # Supabase, Stripe, utils
    ├── docs/                       # Single Source of Truth (SSOT)
    │   ├── 00_README_MASTER_INDEX.md
    │   ├── 01_STRATEGY/
    │   ├── 02_DESIGN_AND_UX/
    │   ├── 03_ARCHITECTURE/
    │   ├── 04_API/
    │   ├── 05_FEATURES_AND_WORKFLOWS/
    │   ├── 06_OPERATIONS_AND_DEPLOYMENT/
    │   ├── 07_QUALITY_AND_LEGAL/
    │   ├── 08_REFERENCE_MATERIALS/
    │   ├── 09_ARCHIVE/
    │   └── DEV_NOTES/
    │       ├── 00_BUILD_POLICY.md
    │       ├── ARCHITECTURAL_GUARDS.md
    │       └── automation/
    │           ├── forbidden.txt
    │           ├── required.txt
    │           ├── schema_guard.json
    │           └── architecture_guard.json
│
└── .github/
    ├── workflows/                  # CI enforcement suite (4 checks)
    │   ├── forbidden-strings.yml
    │   ├── required-strings.yml
    │   ├── architecture-enforcement.yml
    │   └── schema-drift.yml
    └── copilot/
        └── .copilot_rules.md       # AI PR reviewer enforcement
```

---

# 2. Architectural Overview (V1.1)

### Canonical Tech Stack

- **Next.js App Router**
- **Supabase Postgres** (database)
- **Supabase Auth (JWT)** (authentication)
- **Stripe Connect Standard** (payments)
- **Stripe Billing** (subscriptions)
- **Supabase Storage** (uploads)
- **Sentry** (logging/monitoring)

### Core Constraints

- **NO** tRPC
- **NO** Drizzle ORM
- **NO** MySQL
- **NO** Manus auth or legacy flows
- **NO** platform-issued refunds
- **NO** platform-as-Merchant-of-Record logic

V1.1 follows a clean, modern architecture with minimal external state inheritance.

---

# 3. Archive Mode (Phase 5)

The Phase 5 codebase (`client/`, `server/`, `drizzle/`, `shared/`) is:

- **Read-only**
- **Not modifiable**
- **Not importable**
- **Not referenceable by active code**

CI automatically fails if:

- Any file in Phase 5 changes
- Any import references Phase 5

Phase 5 exists as a **reference-only artifact** for:

- UI patterns
- Helper structure
- Integration sequencing

Never reuse:

- DB logic
- Auth logic
- Refund logic
- MoR logic
- tRPC procedures

---

# 4. Selective Hybrid Reuse (V1.1)

### Allowed Reuse (Safe)

- UI components (shadcn/ui)
- Validation helpers
- Formatters/utilities
- Integration _patterns_ (never business rules)

### Forbidden Reuse (Unsafe)

- MySQL queries
- Drizzle ORM
- tRPC routers
- Auth providers
- Refund/dispute logic
- Platform-as-MoR logic
- Manus integrations

All V1.1 business logic must be implemented fresh.

---

# 5. Directory vs Marketplace Separation

### Directory

- Business presence only
- LGA, categories, contact
- **No prices, no checkout, no cart**

### Marketplace

- Digital products only
- Vendors with:
  - `is_vendor = true`
  - `vendor_status = 'active'`
  - `product.published = true`

- Product cards, checkout, orders

### Enforcement

CI + PR reviewer enforce:

- No pricing logic in directory pages
- No non-vendor products appearing in marketplace

---

# 6. Merchant of Record Model (Critical)

### V1.1 Model

- **Vendors** are Merchant of Record
- Suburbmates is **never** MoR
- Vendors own:
  - Refunds
  - Dispute responses
  - Product compliance

- Suburbmates:
  - Logs events
  - Applies policy
  - Collects commission via `application_fee_amount`

### Checkout (Correct)

Stripe Checkout **direct charge**:

```ts
payment_intent_data: {
  application_fee_amount: platformFee,
},
stripe_account: vendor.stripe_account_id,
```

Webhook:

- Never refunds
- Never modifies money flow

---

# 7. CI Enforcement Suite (4-Layer Guardrail)

All PRs must pass:

### 1) Forbidden Strings Check

Blocks:

- mysql
- trpc
- drizzle
- "platform-issued refund"
- Manus references

### 2) Required Strings Check

Ensures SSOT includes:

- Vendor is the Merchant of Record
- Suburbmates does not issue refunds
- `is_vendor`, `vendor_tier`, `vendor_status`, etc.

### 3) Architecture Enforcement (Archive Mode)

Fails if:

- Phase 5 code is modified
- V1.1 imports Phase 5
- Forbidden packages appear in V1.1

### 4) Schema Drift Detector

Ensures core schema fields remain present.

---

# 8. GitHub Copilot PR Reviewer Rules

Copilot automatically enforces:

- Truth hierarchy
- Archive Mode
- Vendor MoR model
- Directory/Marketplace boundaries
- No platform refunds
- No Phase 5 imports
- No forbidden stacks

If uncertain, Copilot rejects PR by default.

---

# 9. Developer Workflow

### 1. Create feature branch

```bash
git checkout -b feat/feature-name
```

### 2. Develop under `/v1.1/`

Never modify Phase 5 folders.

### 3. Commit & push

```bash
git push origin feat/feature-name
```

### 4. Open PR to `phase5-step2`

CI auto-runs 4 checks.
Copilot reviews for policy compliance.

### 5. Fix issues (if any), push again

### 6. Merge when:

- All checks pass
- Copilot approves
- Reviewer approves

---

# 10. Developer Aids (Optional)

### A) Developer Cheat Sheet

Located at:

```
v1.1/docs/DEV_NOTES/DEVELOPER_CHEAT_SHEET.md
```

### B) PR Template

```
.github/pull_request_template.md
```

### C) VS Code Snippet Pack

```
.vscode/suburbmates.code-snippets
```

---

# 11. Environment Setup

### Required environment variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

# 12. Development Commands

### Install dependencies

```bash
cd v1.1
npm install
```

### Run dev server

```bash
npm run dev
```

### Lint

```bash
npm run lint
```

---

# 13. Contributing

All contributions must:

- Follow V1.1 architecture
- Respect Archive Mode
- Pass all CI guardrails
- Adhere to SuburbmainsV1.1 SSOT
- Follow the PR template checklist

Any PR that violates guardrails will fail CI + be rejected automatically.

---

# 14. License

Proprietary — All rights reserved.
Redistribution or reuse requires written permission.

---

# End of Document
