#!/usr/bin/env bash
set -euo pipefail

echo "=== Suburbmates V1.1: Archive Mode Enforcement Setup (SAFE VERSION) ==="

REPO_ROOT="$(pwd)"
echo "Repo root: $REPO_ROOT"

###############################################################################
# 1. SANITY CHECKS
###############################################################################

if [ ! -d "v1.1" ]; then
  echo "❌ v1.1 directory not found. Run this from /suburbmates repo root."
  exit 1
fi

if [ ! -d "v1.1/docs" ]; then
  echo "❌ v1.1/docs not found. Make sure V1.1 docs are copied before running this."
  exit 1
fi

###############################################################################
# 2. CLEANUP OLD / CONFLICTING FILES (SAFE VERSION)
###############################################################################

echo "=== Step 2: SAFE cleanup of old Phase 5-era documentation ==="

# REMOVE ONLY known Phase-5 debris at repo root (whitelist approach)
echo "-> Removing known obsolete markdown files..."
rm -f AI_AGENT_SETUP.md \
      FEATURE_FREEZE*.md \
      PROJECT_CLEANUP*.md \
      PHASE_*.md \
      SSOT*.md \
      QUICK_REFERENCE*.md \
      RELEASE*.md \
      BUILD_REPORT*.md \
      V1_1_*.md \
      userGuide.md \
      suburbmatesprompts.md \
      2>/dev/null || true

echo "-> Preserved: root README.md, .PHASE5_README.md, all v1.1/ content"

# CLEAR workflows (we will re-add official ones)
echo "-> Clearing .github/workflows..."
mkdir -p .github/workflows
rm -f .github/workflows/* 2>/dev/null || true

# REMOVE stray copilot rule files (we'll rebuild canonical one)
echo "-> Cleaning up stray .copilot_rules.md files..."
find . -type f -name ".copilot_rules.md" \
  ! -path "./.github/copilot/.copilot_rules.md" \
  -exec rm -f {} \; 2>/dev/null || true

# REMOVE leftover automation directories except canonical v1.1/docs path
echo "-> Removing stray automation/ci/checks directories..."
find . -maxdepth 4 -type d \
  \( -name "automation" -o -name "ci" -o -name "checks" -o -name "RULES" \) \
  ! -path "./v1.1/docs/DEV_NOTES/automation" \
  -exec rm -rf {} \; 2>/dev/null || true

echo "✅ Cleanup completed safely."

###############################################################################
# 3. ENSURE REQUIRED DIRECTORIES
###############################################################################

echo "=== Step 3: Creating required directories ==="
mkdir -p .github/workflows
mkdir -p .github/copilot
mkdir -p v1.1/docs/DEV_NOTES/automation

###############################################################################
# 4. WRITE POLICY FILES
###############################################################################

echo "=== Step 4: Writing V1.1 policy files ==="

cat > v1.1/docs/DEV_NOTES/00_BUILD_POLICY.md << 'POLICY_EOF'
# Suburbmates V1.1 Build Policy (Selective Hybrid Reuse)

This document defines the **locked** build policy for Suburbmates V1.1.

It exists to:
- Keep the codebase aligned with the V1.1 specs.
- Allow **selective hybrid reuse** of Phase 5 code where it is genuinely safe.
- Prevent reintroduction of old assumptions about money flow, auth, or deadlines.

If any code or document conflicts with this file, **this file and the V1.1 specs win**.

---

## 1. Architecture – V1.1 Only

**Canonical stack:**

- Framework: Next.js (App Router)
- Backend: Next.js API routes (no tRPC)
- Database: Supabase PostgreSQL
- Auth: Supabase Auth (JWT-based)
- Payments: Stripe Payments + Stripe Connect **Standard**
- Storage: Supabase Storage
- Monitoring: Sentry

**Not allowed:**
- tRPC (any usage)
- Drizzle ORM (any usage)
- MySQL (any usage)
- Legacy "Manus" platform-specific code

---

## 2. Truth Hierarchy (SSOT)

When there is any disagreement:

1. **SuburbmainsV1.1 markdown specs** (SSOT)
2. This `00_BUILD_POLICY.md`
3. `DEV_NOTES/ARCHITECTURAL_GUARDS.md`
4. Phase 5 code (reference only)
5. Phase 5 architecture (learning only)

Phase 5 code is **not** authoritative.

---

## 3. Selective Hybrid Reuse – Allowed and Forbidden

### 3.1 What We CAN Reuse from Phase 5

1. **UI Components and Layouts**
   - shadcn/ui components and styling patterns
   - Presentational React components that do not embed Phase 5 domain assumptions

2. **Schema-Agnostic Helpers**
   - Validation utilities (email, URL format)
   - Pure functions (formatters, string/number/date helpers)
   - General utilities (debounce, throttle, sorting)

3. **Integration Patterns (Form, Not Substance)**
   - Event sequencing and retry patterns
   - Handler structure and idempotency patterns
   - **NOT:** Old business rules around MoR, refunds, or disputes

4. **Error Handling and Logging**
   - Global error boundaries
   - Logging wrappers and Sentry setup
   - **NOT:** Error messages implying old MoR or refund model

---

### 3.2 What We CANNOT Reuse from Phase 5

These are **forbidden** to reuse directly:

1. **Refund and Dispute Logic**
   - Any code treating platform as Merchant of Record
   - Any code initiating refunds on behalf of platform

2. **Database Queries and ORM Logic**
   - MySQL + Drizzle-based queries
   - Any DB code assuming Phase 5 schema

3. **tRPC Procedures**
   - No tRPC routers or procedures
   - All backend must be **Next.js API routes**

4. **Auth Context and Session Logic**
   - No Manus-specific OAuth
   - No Phase 5 auth providers
   - Must use **Supabase Auth + JWT**

5. **MoR Model Code**
   - Any logic treating platform as Merchant of Record
   - Any platform-issued refunds

6. **Hard Deadline Logic**
   - No references to Phase 5 launch dates
   - No calendar-based behavior triggers

---

## 4. Legal & Compliance Alignment (Non-Negotiable)

- **Vendors are Merchant of Record** for marketplace transactions
- Vendors own refunds, warranties, and dispute responses
- Suburbmates provides platform, discovery, and payment rails
- Suburbmates charges commission and subscription/featured fees
- Suburbmates does **not** issue refunds or move money to customers

---

## 5. Directory vs Marketplace Separation

- **Directory** – businesses and their presence
- **Marketplace** – digital products and orders

Rules:
- Directory pages must **not** show prices, carts, or checkout
- Marketplace must **only** list vendors with `is_vendor = true` and `vendor_status = 'active'`
- Schema and workflows must keep Directory and Marketplace conceptually distinct

---

## 6. How to Use This Policy

- When writing code: check against V1.1 specs and this policy
- When using AI tools: explicitly state: "Apply V1.1 Build Policy. Do not reuse Phase 5 code touching schema, auth, refunds, or MoR."

This file is **locked**. Changes require Founder approval.
POLICY_EOF

cat > v1.1/docs/DEV_NOTES/ARCHITECTURAL_GUARDS.md << 'GUARDS_EOF'
# Suburbmates V1.1 – Architectural Guards (Non-Negotiable)

This document defines **hard constraints** that must not be violated.

---

## 1. Merchant of Record and Money Flow

- Vendors are the **Merchant of Record (MoR)** for all marketplace transactions
- Vendors are responsible for:
  - Product quality and descriptions
  - Pricing
  - Compliance with Australian Consumer Law
  - Refunds, warranties, and remedies
- Suburbmates:
  - Provides platform, discovery, and payment rails via Stripe
  - Charges commission via `application_fee_amount` and subscription/featured fees
  - Does **not** become a party to sales contracts
  - Does **not** issue refunds

**Forbidden:**
- Any code suggesting Suburbmates is MoR
- Any code suggesting Suburbmates "sells" directly
- Any code guaranteeing product performance

---

## 2. Refunds and Disputes

- Refunds and disputes are **vendor-owned**
- Vendors manage refunds in Stripe as Merchant of Record
- Suburbmates does **not** initiate or process refunds
- Suburbmates may surface dispute tools and enforce policy

**Forbidden:**
- Suburbmates issuing refunds directly to customers
- Suburbmates moving money back to customer accounts
- UX copy implying Suburbmates handles refunds

---

## 3. Directory vs Marketplace Boundaries

- **Directory**: "Who exists in this area?"
- **Marketplace**: "What can I buy?"

**Directory rules:**
- No prices, carts, or checkout
- Surfaces business presence only

**Marketplace rules:**
- Only lists products from vendors with `is_vendor = true` and `vendor_status = 'active'`
- All purchasing flows in Marketplace layer

**Forbidden:**
- Directory embedding Stripe checkout
- Directory displaying product-level pricing
- Marketplace treating non-vendor businesses as sellers

---

## 4. Technology Constraints

**Allowed:**
- Next.js App Router
- Next.js API routes
- Supabase PostgreSQL
- Supabase Auth (JWT)
- Supabase Storage
- Stripe Payments, Billing, and Connect **Standard**
- Sentry for monitoring

**Forbidden:**
- tRPC (any usage)
- Drizzle ORM (any usage)
- MySQL (any usage)
- Legacy "Manus" stack code

---

## 5. Phase 5 Code Constraints

Phase 5 code is **reference only**, not implementation target.

**Forbidden to reuse directly:**
- Database access logic (queries, migrations, schema)
- tRPC procedures
- Auth context and session handling
- Refund and dispute logic
- Money-flow logic assuming platform-as-MoR
- Any code encoding Phase 5 legal/compliance posture

---

## 6. Deadlines and Time-Based Behavior

V1.1 is **quality-first**, **gate-based**, and **not** tied to:
- Phase 5 launch dates
- Any hard-coded cutover date

**Forbidden:**
- Hard-coding launch deadlines as behavior triggers
- Calendar-based behavior changes referencing Phase 5

---

## 7. Schema-Level Guards (High-Level)

**On business entity:**
- `is_vendor` – boolean, default `false`
- `vendor_tier` – enum: `'none' | 'basic' | 'pro'`, default `'none'`
- `vendor_status` – enum: `'inactive' | 'active' | 'suspended'`, default `'inactive'`

**On product entity:**
- `published` – boolean, default `false`
- `delivery_type` – enum: `'download' | 'license_key'`
- LGA association (e.g. `lga_id` / `lga_code`)

**Functional rule:**
- Only products with `published = true` from vendors with `is_vendor = true` and `vendor_status = 'active'` are visible in Marketplace queries

---

## 8. Change Control

These guards are **non-negotiable** by default.

Changes require:
- Founder approval
- Update to SuburbmainsV1.1 specs and BUILD_POLICY.md

PRs violating these guards should be **rejected** by:
- CI checks
- AI PR reviewer rules
- Human code review
GUARDS_EOF

echo "✅ Policy files written"

###############################################################################
# 5. WRITE AUTOMATION CONFIGS
###############################################################################

echo "=== Step 5: Writing automation guard configs ==="

cat > v1.1/docs/DEV_NOTES/automation/forbidden.txt << 'FORBIDDEN_EOF'
# Forbidden patterns (if found in V1.1 → FAIL CI immediately)

platform-issued refund
Suburbmates issues a refund
Merchant of Record: Suburbmates
Merchant of Record: Platform

mysql
drizzle
trpc
manus

chargeback handled by platform
platform handles chargebacks

hard deadline
launch date
December 1
Phase 5 launch

refund issued by platform
"platform refund"

from phase 5
schema: mysql
FORBIDDEN_EOF

cat > v1.1/docs/DEV_NOTES/automation/required.txt << 'REQUIRED_EOF'
# If ANY of these are missing in their corresponding files → FAIL CI

# Schema reference required terms (v1.1/docs/03_ARCHITECTURE/03.3_SCHEMA_REFERENCE.md):
is_vendor
vendor_status
vendor_tier
delivery_type
published
Directory vs Marketplace in the Schema

# Legal/compliance required terms (v1.1/docs/07_QUALITY_AND_LEGAL/07.1_LEGAL_COMPLIANCE_AND_DATA.md):
Vendor is the Merchant of Record
Suburbmates does not issue refunds

# API spec required terms (v1.1/docs/04_API/04.1_API_SPECIFICATION.md):
Scope: DIRECTORY
Scope: MARKETPLACE
application_fee_amount

# Policy alignment (v1.1/docs/DEV_NOTES/00_BUILD_POLICY.md):
Selective Hybrid Reuse
REQUIRED_EOF

cat > v1.1/docs/DEV_NOTES/automation/schema_guard.json << 'SCHEMA_GUARD_EOF'
{
  "required_fields": [
    "is_vendor",
    "vendor_status",
    "vendor_tier",
    "published",
    "delivery_type"
  ],
  "schema_file": "v1.1/docs/03_ARCHITECTURE/03.3_SCHEMA_REFERENCE.md"
}
SCHEMA_GUARD_EOF

cat > v1.1/docs/DEV_NOTES/automation/architecture_guard.json << 'ARCH_GUARD_EOF'
{
  "forbidden_packages_in_v1_1": [
    "trpc",
    "drizzle",
    "mysql",
    "manus"
  ],
  "archived_dirs": [
    "client",
    "server",
    "drizzle",
    "shared"
  ],
  "forbidden_import_patterns_in_v1_1": [
    "../client",
    "../server",
    "../drizzle",
    "../shared",
    "client/",
    "server/",
    "drizzle/",
    "shared/"
  ]
}
ARCH_GUARD_EOF

echo "✅ Automation configs written"

###############################################################################
# 6. WRITE GITHUB ACTION WORKFLOWS
###############################################################################

echo "=== Step 6: Writing GitHub Actions workflows ==="

cat > .github/workflows/forbidden-strings.yml << 'WF_FORBIDDEN_EOF'
name: Forbidden Strings Check (V1.1)

on:
  pull_request:

jobs:
  forbidden-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Scan v1.1/ for forbidden patterns
        run: |
          if [ ! -d "v1.1" ]; then
            echo "No v1.1 directory found. Skipping."
            exit 0
          fi

          cd v1.1

          if grep -R -n -f docs/DEV_NOTES/automation/forbidden.txt . 2>/dev/null; then
            echo "❌ Forbidden pattern found in v1.1/."
            exit 1
          else
            echo "✅ No forbidden patterns found in v1.1/."
          fi
WF_FORBIDDEN_EOF

cat > .github/workflows/required-strings.yml << 'WF_REQUIRED_EOF'
name: Required Strings Check (V1.1 Docs)

on:
  pull_request:

jobs:
  required-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Verify required strings exist in key V1.1 docs
        run: |
          set -e

          if [ ! -d "v1.1/docs" ]; then
            echo "❌ v1.1/docs not found."
            exit 1
          fi

          SCHEMA_FILE="v1.1/docs/03_ARCHITECTURE/03.3_SCHEMA_REFERENCE.md"
          LEGAL_FILE="v1.1/docs/07_QUALITY_AND_LEGAL/07.1_LEGAL_COMPLIANCE_AND_DATA.md"
          API_FILE="v1.1/docs/04_API/04.1_API_SPECIFICATION.md"
          POLICY_FILE="v1.1/docs/DEV_NOTES/00_BUILD_POLICY.md"

          while read -r pattern; do
            [ -z "$pattern" ] && continue

            case "$pattern" in
              is_vendor|vendor_status|vendor_tier|delivery_type|published|"Directory vs Marketplace in the Schema")
                target="$SCHEMA_FILE"
                ;;
              "Vendor is the Merchant of Record"|"Suburbmates does not issue refunds")
                target="$LEGAL_FILE"
                ;;
              "Scope: DIRECTORY"|"Scope: MARKETPLACE"|application_fee_amount)
                target="$API_FILE"
                ;;
              "Selective Hybrid Reuse")
                target="$POLICY_FILE"
                ;;
              *)
                echo "⚠️  Warning: Pattern '$pattern' unknown. Skipping."
                continue
                ;;
            esac

            if ! grep -q "$pattern" "$target"; then
              echo "❌ Required pattern missing: '$pattern' in $target"
              exit 1
            fi
          done < v1.1/docs/DEV_NOTES/automation/required.txt

          echo "✅ All required patterns found in their target files."
WF_REQUIRED_EOF

cat > .github/workflows/architecture-enforcement.yml << 'WF_ARCH_EOF'
name: Architecture Enforcement (Archive Mode)

on:
  pull_request:

jobs:
  architecture-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Fail if archived Phase 5 dirs are modified
        run: |
          git fetch origin ${{ github.base_ref }} --depth=1

          MODIFIED_FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD 2>/dev/null || echo "")

          if echo "$MODIFIED_FILES" | grep -E '^(client/|server/|drizzle/|shared/)' >/dev/null 2>&1; then
            echo "❌ Archived Phase 5 directory modified (client/server/drizzle/shared)."
            exit 1
          else
            echo "✅ No modifications detected in archived Phase 5 dirs."
          fi

      - name: Fail if forbidden packages are used in v1.1
        run: |
          if [ ! -d "v1.1" ]; then
            echo "No v1.1 directory found, skipping."
            exit 0
          fi

          FORBIDDEN_PKGS=$(jq -r '.forbidden_packages_in_v1_1[]' v1.1/docs/DEV_NOTES/automation/architecture_guard.json)

          cd v1.1
          for pkg in $FORBIDDEN_PKGS; do
            if grep -R -q "$pkg" . 2>/dev/null; then
              echo "❌ Forbidden package/string detected in v1.1/: $pkg"
              exit 1
            fi
          done

          echo "✅ No forbidden packages found in v1.1/."

      - name: Fail if v1.1 imports from Phase 5 dirs
        run: |
          if [ ! -d "v1.1" ]; then
            echo "No v1.1 directory found, skipping."
            exit 0
          fi

          PATTERNS=$(jq -r '.forbidden_import_patterns_in_v1_1[]' v1.1/docs/DEV_NOTES/automation/architecture_guard.json)

          cd v1.1
          for pat in $PATTERNS; do
            if grep -R -q "$pat" . 2>/dev/null; then
              echo "❌ Forbidden import from Phase 5 detected in v1.1/: $pat"
              exit 1
            fi
          done

          echo "✅ No forbidden imports from Phase 5 found in v1.1/."
WF_ARCH_EOF

cat > .github/workflows/schema-drift.yml << 'WF_SCHEMA_EOF'
name: Schema Drift Detector (V1.1 Docs)

on:
  pull_request:

jobs:
  schema-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate schema reference fields
        run: |
          if [ ! -f "v1.1/docs/DEV_NOTES/automation/schema_guard.json" ]; then
            echo "❌ schema_guard.json not found."
            exit 1
          fi

          SCHEMA_FILE=$(jq -r '.schema_file' v1.1/docs/DEV_NOTES/automation/schema_guard.json)
          if [ ! -f "$SCHEMA_FILE" ]; then
            echo "❌ Schema reference file not found: $SCHEMA_FILE"
            exit 1
          fi

          jq -r '.required_fields[]' v1.1/docs/DEV_NOTES/automation/schema_guard.json |
          while read -r field; do
            [ -z "$field" ] && continue
            if ! grep -q "$field" "$SCHEMA_FILE"; then
              echo "❌ Missing required schema field in $SCHEMA_FILE: $field"
              exit 1
            fi
          done

          echo "✅ Schema guard passed for $SCHEMA_FILE."
WF_SCHEMA_EOF

echo "✅ GitHub Actions workflows written"

###############################################################################
# 7. WRITE COPILOT PR RULES
###############################################################################

echo "=== Step 7: Writing Copilot PR reviewer rules ==="

mkdir -p .github/copilot

cat > .github/copilot/.copilot_rules.md << 'COPILOT_RULES_EOF'
# Suburbmates V1.1 – Copilot PR Reviewer Rules (Archive Mode, Strict)

When reviewing pull requests for Suburbmates V1.1, you MUST enforce these rules.

## 1. Truth Hierarchy

Treat the following as authoritative, in order:

1. `v1.1/docs/` (SuburbmainsV1.1 markdown specs)
2. `v1.1/docs/DEV_NOTES/00_BUILD_POLICY.md`
3. `v1.1/docs/DEV_NOTES/ARCHITECTURAL_GUARDS.md`
4. Phase 5 code under `client/`, `server/`, `drizzle/`, `shared/` as **reference only**

If a PR includes changes conflicting with these documents, **request changes** and instruct the author to align their code with V1.1 docs and policies.

---

## 2. Archive Mode Rules (Phase 5)

Phase 5 directories are **archived**:
- `client/`
- `server/`
- `drizzle/`
- `shared/`

They must:
- Not be modified
- Not be imported by any V1.1 code

**If a PR violates Archive Mode:**
- **Reject the PR**
- Instruct the author to move all development into `v1.1/`
- Reference `ARCHITECTURAL_GUARDS.md`

---

## 3. V1.1 Architecture Rules

**Reject PRs that, in `v1.1/`, introduce or use:**

- tRPC
- Drizzle ORM
- MySQL drivers or queries
- Manus-specific auth or logic

**Reject PRs that implement:**

- Platform-issued refunds
- Platform as Merchant of Record
- Blurred Directory vs Marketplace separation

---

## 4. Money Flow & Legal Posture (Non-Negotiable)

Confirm that new code in `v1.1/`:

- Treats **vendors** as Merchant of Record
- Keeps refunds/disputes **vendor-owned**:
  - Vendors manage refunds in Stripe
  - Suburbmates logs, automates, and enforces policy (no refund issuance)
- Uses Stripe Connect **Standard**, direct charges, and platform revenue via `application_fee_amount`

**Reject PRs that:**

- Suggest the platform issues refunds
- Move money from platform to customers
- Describe Suburbmates as Merchant of Record

---

## 5. Hybrid Reuse Enforcement

Enforce Selective Hybrid Reuse (see `00_BUILD_POLICY.md`):

**Allowed reuse from Phase 5:**
- UI components (React, shadcn/ui) — presentational, no embedded domain assumptions
- Schema-agnostic helpers (validation, formatting, utilities)
- Integration patterns (event ordering, handler structure — not business rules)

**Forbidden reuse:**
- Any Phase 5 code touching:
  - DB schema or queries
  - Auth context/session
  - Refund or dispute logic
  - Old MoR or refund model

**If the PR copies forbidden Phase 5 logic:**
- **Reject it**
- Instruct the author to re-implement according to V1.1 specs

---

## 6. Directory vs Marketplace Separation

In `v1.1/` code:

- **Directory** must **not** include:
  - Pricing
  - Carts
  - Checkout logic

- **Marketplace** must:
  - Only show products from vendors where `is_vendor = true` and `vendor_status = 'active'` and `published = true`

**Reject PRs that blur these boundaries.**

---

## 7. Deadlines

**Reject PRs that:**

- Reintroduce hard launch dates
- Change behavior based on historic deadlines (e.g., "after December 1, do X")

V1.1 is quality-first and gate-based, not date-driven.

---

## Summary

**If uncertain whether a change conforms to policy:**

→ Err on the side of rejecting and recommending alignment with:
  - `v1.1/docs/DEV_NOTES/00_BUILD_POLICY.md`
  - `v1.1/docs/DEV_NOTES/ARCHITECTURAL_GUARDS.md`

Your role is to catch policy violations early and guide authors toward compliant implementation.
COPILOT_RULES_EOF

echo "✅ Copilot PR rules written"

###############################################################################
# 8. FINAL SUMMARY
###############################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Archive Mode Enforcement Setup Complete (SAFE VERSION)    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Files created:"
echo "  ✓ v1.1/docs/DEV_NOTES/00_BUILD_POLICY.md"
echo "  ✓ v1.1/docs/DEV_NOTES/ARCHITECTURAL_GUARDS.md"
echo "  ✓ v1.1/docs/DEV_NOTES/automation/forbidden.txt"
echo "  ✓ v1.1/docs/DEV_NOTES/automation/required.txt"
echo "  ✓ v1.1/docs/DEV_NOTES/automation/schema_guard.json"
echo "  ✓ v1.1/docs/DEV_NOTES/automation/architecture_guard.json"
echo "  ✓ .github/workflows/forbidden-strings.yml"
echo "  ✓ .github/workflows/required-strings.yml"
echo "  ✓ .github/workflows/architecture-enforcement.yml"
echo "  ✓ .github/workflows/schema-drift.yml"
echo "  ✓ .github/copilot/.copilot_rules.md"
echo ""
echo "Next steps:"
echo "  1) Review all files (especially policy files)"
echo "  2) Run: git status (verify expected changes only)"
echo "  3) Commit: git commit -am 'Add V1.1 Archive Mode enforcement suite'"
echo "  4) Push: git push origin phase5-step2"
echo "  5) In GitHub:"
echo "     - Go to Settings → Branches"
echo "     - Enable branch protection on phase5-step2"
echo "     - Require these checks:"
echo "       * Forbidden Strings Check (V1.1)"
echo "       * Required Strings Check (V1.1 Docs)"
echo "       * Architecture Enforcement (Archive Mode)"
echo "       * Schema Drift Detector (V1.1 Docs)"
echo "     - Enable Copilot PR reviewer"
echo ""
echo "Suburbmates V1.1 Archive Mode is now fully enforced. 🎯"
