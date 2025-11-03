---
phase: 2
status: planning
created_on: 2025-11-03
---

# Phase 2: Schema Diff & Merge Planning - Preparation Document

## 🎯 Objective

Compare the Phase 1 Copilot backend schema with the legacy Suburbmates MVP schema to identify:
- Missing tables
- Missing columns
- Missing relations
- Enum value changes
- Migration path for Phase 3 (PWA + AI features)

---

## 📊 Current State (Copilot)

**Phase 1 Baseline Tables (6):**
1. `users` - OAuth identity (9 columns)
2. `businesses` - Directory listings (17 columns)
3. `agreements` - Legal compliance (8 columns)
4. `consents` - GDPR audit trail (5 columns)
5. `email_tokens` - Passwordless auth (6 columns)
6. `melbourne_suburbs` - Geofencing reference (6 columns)

**Total:** 56 columns, 10 indexes, 4 foreign keys

---

## 🔄 Expected MVP Schema Tables

Based on typical Suburbmates 1 (MVP) structure, we expect:

### Core Tables (Already Have)
- ✅ `users`
- ✅ `businesses`
- ⚠️ May have different columns or enums

### Missing Tables (Likely)
- 🔴 `listings` - Vendor product/service listings
- 🔴 `reviews` - Customer reviews and ratings
- 🔴 `transactions` - Purchase records
- 🔴 `payments` - Stripe payment tracking
- 🔴 `disputes` - Post-transaction disputes (Phase 3)
- 🔴 `refunds` - Refund management (Phase 3)

### Additional Tables (Possible)
- `categories` - Business/listing categories
- `vendors` - Vendor-specific metadata
- `tags` - Tagging system for listings
- `favorites` - User favorites/wishlist
- `notifications` - In-app notifications
- `subscription_plans` - Subscription tiers

---

## 📝 Analysis Template

Once MVP schema is provided, fill this for each table:

### Table: `[name]`

**Copilot Version:**
```
Exists: YES/NO
Columns: [list]
Indexes: [list]
Relations: [list]
```

**MVP Version:**
```
Exists: YES/NO
Columns: [list]
Indexes: [list]
Relations: [list]
```

**Diff Summary:**
- New columns: [list]
- Removed columns: [list]
- Changed columns: [list]
- New indexes: [list]
- New relations: [list]

**Migration Plan:**
- [ ] Add new columns
- [ ] Add new indexes
- [ ] Add new relations
- [ ] Data migration (if needed)
- [ ] Enum changes (if needed)

---

## 🚀 Phase 2 Workflow

### Step 1: Obtain MVP Schema
**Required:** `suburbmates/drizzle/schema.ts` from Suburbmates 1 codebase
- Location: `/Users/carlg/Documents/suburbmates2/drizzle/schema.ts` (if available)
- Or: Paste MVP schema content directly

### Step 2: Parse MVP Schema
- List all tables in MVP
- Extract column definitions
- Document indexes and relations

### Step 3: Generate Diff Report
- Side-by-side comparison
- Categorize changes (added, removed, modified)
- Flag breaking changes

### Step 4: Create Migration Plan
- Order tables for creation (respect FK constraints)
- Plan data migrations (if combining tables)
- Identify Drizzle migration strategy

### Step 5: Execute Migrations
- Generate Drizzle SQL migrations
- Apply to development database
- Verify schema integrity

### Step 6: Update tRPC API
- Add endpoints for new tables
- Update existing endpoints with new fields
- Test end-to-end type safety

---

## 📋 Data to Request

When you provide the MVP schema, include:

1. **File:** `drizzle/schema.ts` (or equivalent ORM schema file)
2. **Format:** Raw TypeScript/SQL or JSON equivalent
3. **Context:** Any notes about:
   - Schema version
   - Previous migrations
   - Breaking changes from earlier versions
   - Known issues or technical debt

---

## ✅ Phase 2 Readiness Checklist

- [ ] Phase 1 report committed and locked (✅ Done)
- [ ] Dev server running cleanly
- [ ] Database accessible and healthy
- [ ] Drizzle migrations up-to-date
- [ ] TypeScript compiling (0 errors)
- [ ] **Awaiting:** MVP schema.ts file

---

## 📌 Next Action

**Please provide:**

> The MVP `schema.ts` file (or equivalent schema definition) from Suburbmates 1
>
> You can either:
> 1. Upload/paste the file content directly
> 2. Provide path to reference repository
> 3. Describe the tables verbally (schema will be reconstructed)

Once received, Phase 2 analysis begins immediately.

---

**Status:** 🔄 WAITING FOR MVP SCHEMA INPUT

