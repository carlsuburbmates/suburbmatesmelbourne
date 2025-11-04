# 📦 Phase 5 Step 2 — Packet 5.7: Product Creation Backend

**Phase:** Phase 5 (Marketplace Expansion)  
**Step:** Step 2 (Products & Inventory)  
**Packet:** 5.7 (Product Creation Backend)  
**Target Tag:** v5.2 (after Step 2 QA)  
**Estimated Effort:** 3-4 hours  
**Date Started:** 4 November 2025

---

## 🎯 Objective

Build the complete **tRPC backend for product CRUD operations** using existing Drizzle schema + role guards, enabling vendors to create, update, list, and deactivate products within tier limits (BASIC = 12, FEATURED = 48).

---

## 📋 Scope

### What's Included

✅ **tRPC Router Extensions** (`server/routers/product.ts`)
- `product.create(input)` — vendor creates product
- `product.update(id, input)` — vendor updates own product
- `product.listByVendor(vendorId)` — list vendor's products
- `product.getById(id)` — public read (for directory)
- `product.deactivate(id)` — soft delete (vendor only)
- `product.checkTierLimit(vendorId)` — validate against tier limits

✅ **Database Queries** (extensions to `server/db.ts`)
- `createProduct(vendorId, input)` → Drizzle insert + AuditLog
- `updateProduct(id, input)` → update (ownership check)
- `listProductsByVendor(vendorId)` → paginated query
- `getProductById(id)` → public read
- `deactivateProduct(id)` → soft delete (mark `isActive = false`)
- `countProductsByVendor(vendorId)` → for tier validation
- `getTierLimit(vendorId)` → lookup from `vendors_meta.tier`

✅ **Role Guards & Validation**
- Vendor ownership validation (can only edit own products)
- Tier limit enforcement (BASIC vs FEATURED product count)
- Input schema validation (Zod)
- AuditLog writes on all mutations

✅ **Schema Extensions** (if needed)
- Confirm `products` table has: `vendorId`, `isActive`, `createdAt`, `updatedAt`
- Confirm `vendors_meta` table has: `tier` (BASIC | FEATURED)
- Verify indexes on `products(vendorId, isActive)`

---

## 🛠️ Implementation Checklist

### Step 1: Schema Verification (5 min)
- [ ] Read `drizzle/schema.ts` to confirm `products` and `vendors_meta` structure
- [ ] Verify columns: `id`, `vendorId`, `title`, `description`, `price`, `kind`, `fulfillmentMethod`, `stockQuantity`, `imageUrl`, `isActive`, `createdAt`, `updatedAt`
- [ ] Verify `vendors_meta` has `tier` column (BASIC | FEATURED)
- [ ] Add indexes if missing: `products(vendorId, isActive)` for performance

### Step 2: Zod Input Schemas (10 min)
- [ ] Create `shared/types.ts` with:
  - `ProductCreateInput` — title, description, price, kind, fulfillmentMethod, stockQuantity, imageUrl
  - `ProductUpdateInput` — all fields optional (except id)
  - Add validation: title min 3 chars, price ≥ 0, stock ≥ 0, imageUrl valid URL

### Step 3: Database Query Layer (20 min)
- [ ] Extend `server/db.ts`:
  - `createProduct(vendorId, input)` — insert + return full product + write AuditLog
  - `updateProduct(id, input)` — update + ownership check + AuditLog
  - `listProductsByVendor(vendorId, limit?, offset?)` — paginated
  - `getProductById(id)` — public read (no auth needed)
  - `deactivateProduct(id)` — set `isActive = false` + AuditLog
  - `countProductsByVendor(vendorId)` — count active products
  - `getTierLimit(vendorId)` — lookup tier, return limit (12 or 48)

### Step 4: tRPC Router (25 min)
- [ ] Create `server/routers/product.ts`:
  - Import tRPC router, protectedProcedure, Zod inputs, db queries
  - `product.create` — validate tier limit, create, return product
  - `product.update` — ownership check, update, return product
  - `product.listByVendor(vendorId)` — public procedure, paginated
  - `product.getById(id)` — public procedure
  - `product.deactivate(id)` — ownership check, soft delete
  - `product.checkTierLimit(vendorId)` — helper (returns { current, limit, canAdd })
  - All mutations use `protectedProcedure` (require auth)
  - All mutations pass role/ownership guards

### Step 5: Main Router Integration (5 min)
- [ ] Update `server/routers.ts` to include product router:
  ```typescript
  export const appRouter = router({
    // ...existing routers...
    product: productRouter,
  });
  ```

### Step 6: TypeScript Verification (5 min)
- [ ] Run `pnpm check` → must be 0 errors
- [ ] Verify all procedures return correct types
- [ ] Verify frontend can reference types via `trpc` import

### Step 7: Database Migration (5 min)
- [ ] Run `pnpm db:push` to generate/apply schema changes (if any)
- [ ] Verify migration file created in `drizzle/`
- [ ] Test rollback locally

### Step 8: Manual Testing (10 min)
- [ ] Start dev server: `pnpm dev`
- [ ] Use tRPC playground or REST call to test:
  - Create product (as vendor) → should succeed
  - Create 13th product on BASIC tier → should fail with tier limit error
  - Update own product → should succeed
  - Update someone else's product → should fail (ownership guard)
  - Deactivate product → should mark `isActive = false`
  - List products by vendor → should show only active

### Step 9: Build & QA (10 min)
- [ ] `pnpm build` → must pass
- [ ] `pnpm check` → 0 errors
- [ ] No console warnings related to products

### Step 10: Commit (5 min)
- [ ] Stage all files: `git add -A`
- [ ] Commit with clear message: `feat: add product creation backend (5.7)`
- [ ] Push to `phase5-step1` branch

---

## 📁 Files to Create/Modify

| File | Action | Lines Est. |
| --- | --- | --- |
| `drizzle/schema.ts` | Verify/extend (indexes) | +5 |
| `shared/types.ts` | Add ProductCreateInput, ProductUpdateInput | +30 |
| `server/db.ts` | Add 7 product query functions | +150 |
| `server/routers/product.ts` | **NEW** tRPC product router | +200 |
| `server/routers.ts` | Import & add product router | +2 |
| `drizzle/` | Migration file (auto-generated) | varies |

**Total estimated lines:** 387 (core logic)

---

## 🧪 Testing Scenarios (Manual)

### Scenario 1: BASIC Tier Product Creation Limit
```
1. Login as vendor (BASIC tier, 0 products)
2. Create product #1 → ✅ Success
3. Create product #12 → ✅ Success
4. Create product #13 → ❌ Tier limit error ("12 products max for BASIC")
```

### Scenario 2: FEATURED Tier Limit
```
1. Login as vendor (FEATURED tier, 0 products)
2. Create product #48 → ✅ Success
3. Create product #49 → ❌ Tier limit error ("48 products max for FEATURED")
```

### Scenario 3: Ownership Validation
```
1. Vendor A creates product X (vendorId = A)
2. Vendor B attempts to update product X → ❌ Unauthorized ("Not product owner")
3. Admin attempts to update product X → ❌ Unauthorized (admin not vendor)
```

### Scenario 4: Deactivation & List Filtering
```
1. Vendor A creates product X (isActive = true)
2. Vendor A deactivates product X (isActive = false)
3. List products → ❌ Should NOT appear (filters by isActive = true)
4. Get by ID → ✅ Should return (public read, no filter)
```

### Scenario 5: Update Validation
```
1. Create product with price = 10.50
2. Update price to -5 → ❌ Validation error ("price must be ≥ 0")
3. Update title to "X" → ❌ Validation error ("title must be ≥ 3 chars")
4. Update to valid data → ✅ Success
```

---

## 🔒 SSOT Compliance Checklist

| SSOT Rule | Implementation | ✅ |
| --- | --- | --- |
| Use tRPC routers | `product` router in tRPC namespace | — |
| Drizzle ORM | All queries via Drizzle, no raw SQL | — |
| Role guards | `protectedProcedure` + ownership check | — |
| AuditLog writes | All mutations write to AuditLog | — |
| Tier limits locked | BASIC=12, FEATURED=48 (from SSOT §3) | — |
| No auth drift | Use existing passwordless + session model | — |
| Type safety | Zod input validation, TypeScript strict | — |

---

## ⚠️ Known Dependencies / Risks

| Risk | Mitigation |
| --- | --- |
| Tier data missing | Verify `vendors_meta.tier` column exists; add migration if needed |
| Image URL storage | Use placeholder or URL-only (no file upload in 5.7) |
| Inventory stock field | Exists in schema; will be used in 5.9 (webhook sync) |
| Concurrent product creates | Drizzle handles; AuditLog ensures tracking |

---

## 🎯 Success Criteria

✅ **All procedures callable & return correct types**  
✅ **TypeScript strict: 0 errors**  
✅ **Build: PASS (pnpm build)**  
✅ **Tier limits enforced (manual test)**  
✅ **Ownership guards enforced**  
✅ **AuditLog writes on all mutations**  
✅ **Migrations clean & rollback-able**  

---

## 📝 Notes

- **Image URLs:** Store as string URL only; no file upload in this packet (defer to future UI)
- **Pagination:** Use `offset` & `limit` for listByVendor (standard REST paging)
- **Soft delete:** Use `isActive` flag; never hard-delete products (audit trail)
- **Next packet (5.8):** Will build UI (ProductForm, ProductsList) consuming these procedures

---

## 🚀 Ready to Proceed?

Once approved, I will:
1. Verify schema integrity
2. Create/extend database queries
3. Build tRPC product router
4. Run full QA (TypeScript, build, manual tests)
5. Commit to `phase5-step1` branch
6. Push to origin

**Estimated total time:** 3-4 hours end-to-end  
**Next step:** 5.8 (Product Management Frontend UI)
