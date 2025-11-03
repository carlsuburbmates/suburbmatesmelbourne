# Phase 2: Schema Diff & Merge Planning Framework

**Project:** Suburbmates SSOT  
**Date:** 3 November 2025  
**Status:** Ready to Begin - Awaiting MVP Schema Input  
**Goal:** Compare MVP schema with current baseline and plan feature integration

---

## 🎯 Phase 2 Objectives

1. ✅ Extract MVP schema from `suburbmates2/` reference project
2. ✅ Run automated schema diff comparison
3. ✅ Identify missing tables (listings, reviews, transactions, etc.)
4. ✅ Identify missing columns in existing tables
5. ✅ Document enum value differences
6. ✅ Plan migration path for Phase 3 (PWA + AI features)
7. ✅ Generate Phase 2 alignment report

---

## 📋 Current Schema Baseline (Phase 1 Analysis)

### Existing Tables (6)

- `users` - Authentication & roles
- `businesses` - Directory core
- `agreements` - Terms acceptance
- `consents` - GDPR compliance logs
- `email_tokens` - Passwordless auth
- `melbourne_suburbs` - Geofencing

### Statistics

- **Tables:** 6
- **Columns:** 56
- **Indexes:** 10
- **Foreign Keys:** 4
- **Relations:** 8
- **Total Procedures:** 19

---

## 🔄 Expected MVP Schema Components

Based on marketplace patterns, the MVP likely includes:

### Core Tables (Already Have)

- ✅ `users` - User accounts and authentication
- ✅ `businesses` - Business directory listings

### Marketplace Tables (Likely Missing)

- ❓ `listings` - Product/service listings
- ❓ `reviews` - Business and product reviews
- ❓ `ratings` - Review ratings (1-5 stars)
- ❓ `images` - Listing and business images
- ❓ `categories` - Service/product categories
- ❓ `tags` - Searchable tags

### Transaction Tables (Likely Missing)

- ❓ `orders` - Transactions/bookings
- ❓ `order_items` - Line items in orders
- ❓ `payments` - Payment records
- ❓ `invoices` - Billing/invoices
- ❓ `refunds` - Refund tracking

### Communication Tables (Likely Missing)

- ❓ `messages` - Direct messaging
- ❓ `inquiries` - Customer inquiries
- ❓ `notifications` - User notifications
- ❓ `favorites` - Saved listings

### Admin/Analytics Tables (Likely Missing)

- ❓ `audit_logs` - Admin activity tracking
- ❓ `analytics_events` - Extended analytics
- ❓ `disputes` - Transaction disputes
- ❓ `vendors_meta` - Extended vendor info

---

## 📥 How to Provide MVP Schema

### Option 1: Copy from Reference Project

```bash
# In terminal at /Users/carlg/Documents/
cp suburbmates2/drizzle/schema.ts ./suburbmates/docs/schema_mvp.ts
cd suburbmates
git add docs/schema_mvp.ts
git commit -m "docs: Add MVP schema for Phase 2 comparison"
```

### Option 2: Export as JSON

If schema.ts is too large, convert to JSON:

```bash
# Python script to parse schema.ts and extract structure
python3 scripts/extract_schema.py suburbmates2/drizzle/schema.ts > docs/schema_mvp.json
```

### Option 3: Manual Documentation

Create `docs/schema_mvp_tables.md` with format:

```markdown
## MVP Schema Tables

### listings table

- id (int, primary key)
- businessId (int, foreign key)
- title (varchar)
- description (text)
- price (decimal)
- category (varchar)
- status (enum: active, inactive, sold)
- createdAt (timestamp)
- updatedAt (timestamp)
```

---

## 🔍 Schema Comparison Framework

### Step 1: Extract MVP Tables

```json
{
  "mvp_tables": [
    "users",
    "businesses",
    "listings",
    "reviews",
    "orders",
    "payments",
    "images",
    "categories"
  ],
  "current_tables": [
    "users",
    "businesses",
    "agreements",
    "consents",
    "email_tokens",
    "melbourne_suburbs"
  ]
}
```

### Step 2: Identify Differences

**Missing in Current (Need to Add):**

```
- listings
- reviews
- orders
- payments
- images
- categories
```

**Missing in MVP (New Features):**

```
- consents (GDPR compliance - added in Phase 0)
- email_tokens (passwordless - added in Phase 0)
- melbourne_suburbs (geofencing - Phase 1 enhancement)
```

### Step 3: Column-Level Diff

For each existing table, compare columns:

```
USERS TABLE:
✅ Current has: id, openId, name, email, role, createdAt, updatedAt, lastSignedIn
❓ MVP might have: id, openId, name, email, phone, role, avatar, lastSignedIn, createdAt, updatedAt
  - Missing in current: phone, avatar
  - New in current: lastSignedIn, updatedAt
```

### Step 4: Enum Comparison

```
role enum:
- Current: ["user", "admin", "buyer", "business_owner", "vendor"]
- MVP: ["user", "admin", "business_owner"] (likely)
- Action: ADD "buyer" and "vendor" for marketplace phases
```

---

## 📊 Expected Phase 2 Output Files

### 1. `docs/schema_mvp.json` (Input)

MVP schema extracted and documented

### 2. `docs/schema_diff_phase2.json` (Analysis)

```json
{
  "analysis": {
    "tablesInMvp": 15,
    "tablesInCurrent": 6,
    "tablesOnlyInMvp": [
      "listings",
      "reviews",
      "orders",
      "payments",
      "images",
      "categories"
    ],
    "tablesOnlyInCurrent": ["consents", "email_tokens", "melbourne_suburbs"],
    "commonTables": ["users", "businesses", "agreements"]
  },
  "columnDiffs": {
    "users": {
      "inMvpOnly": ["phone", "avatar"],
      "inCurrentOnly": ["lastSignedIn"],
      "typeChanges": []
    }
  },
  "enumDiffs": {
    "role": {
      "mvpValues": ["user", "admin", "business_owner"],
      "currentValues": ["user", "admin", "buyer", "business_owner", "vendor"],
      "added": ["buyer", "vendor"],
      "removed": []
    }
  }
}
```

### 3. `docs/migration_plan_phase2.md` (Strategy)

Migration steps, rollback procedures, feature integration plan

### 4. `docs/reports/phase-2.md` (Official Report)

Executive summary with recommendations

---

## 🚀 Phase 2 Timeline

| Step | Task                             | Duration  | Owner    |
| ---- | -------------------------------- | --------- | -------- |
| 1    | Obtain MVP schema                | 1-2 hours | User     |
| 2    | Upload to `docs/schema_mvp.json` | 5 min     | User     |
| 3    | Run schema diff analysis         | 30 min    | AI Agent |
| 4    | Generate comparison report       | 30 min    | AI Agent |
| 5    | Create migration plan            | 1-2 hours | AI Agent |
| 6    | Review and approve plan          | 30 min    | User     |
| 7    | Lock Phase 2                     | 5 min     | User     |

**Total Time:** 4-6 hours (mostly waiting for MVP schema)

---

## 📋 Pre-Flight Checklist for Phase 2

Before starting actual comparison:

- [ ] MVP schema file ready (JSON or .ts format)
- [ ] Current schema baseline verified (✅ Complete - docs/schema_current.json)
- [ ] Phase 1 analysis reviewed (✅ Complete - docs/context_report_phase1.md)
- [ ] Git status clean (no uncommitted changes)
- [ ] Backup created of current schema
- [ ] Team consensus on feature priorities

---

## 🎯 Success Criteria for Phase 2

✅ **Phase 2 Complete When:**

1. MVP schema successfully analyzed
2. All tables and columns mapped
3. Enum values reconciled
4. Type changes identified
5. Foreign key changes documented
6. Migration path defined
7. Rollback plan documented
8. Timeline for Phase 3 estimated
9. Report approved by stakeholders
10. Phase 2 results committed to main branch

---

## 🔄 Next Actions

### Immediate (User)

1. **Locate MVP schema** from `/Users/carlg/Documents/suburbmates2/drizzle/schema.ts`
2. **Copy or export** the MVP schema
3. **Paste content** here or save to `docs/schema_mvp.json`
4. **Notify** when ready for analysis

### After Receiving MVP Schema (AI Agent)

1. Parse and validate MVP schema structure
2. Run automated column-by-column comparison
3. Analyze enum value differences
4. Generate detailed diff report
5. Create migration strategy
6. Document feature integration plan
7. Prepare Phase 2 executive report

---

## 📞 Contact for Questions

**Phase 2 Coordinator:** GitHub Copilot AI Agent  
**Expected Analysis Time:** 2-4 hours after MVP schema received  
**Status Updates:** Commit-based progress tracking

---

## Appendix: Schema Extraction Script

If you need to convert MVP schema.ts to JSON format:

**Using jq + Node.js:**

```bash
# Install required tools
npm install -g @swc/core typescript

# Create extraction script
cat > extract_schema.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Read MVP schema
const mvpSchema = fs.readFileSync('suburbmates2/drizzle/schema.ts', 'utf-8');

// Extract table names using regex
const tableRegex = /export const (\w+) = mysqlTable\("([^"]+)"/g;
const tables = [];
let match;

while ((match = tableRegex.exec(mvpSchema)) !== null) {
  tables.push({
    name: match[1],
    sqlName: match[2],
  });
}

console.log(JSON.stringify({ tables }, null, 2));
EOF

node extract_schema.js
```

---

**Status:** ✅ Phase 2 Framework Ready  
**Awaiting:** MVP schema input  
**Next Step:** Upload MVP schema to proceed with analysis
