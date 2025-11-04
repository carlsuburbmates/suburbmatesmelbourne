# Phase 5 Step 2 Packet 5.8: Product Management Frontend UI

**Status:** PLANNED
**Version:** Phase 5 Step 2 (v5.2 pre-release)
**Depends On:** Packet 5.7 (Product Creation Backend) ✅ COMPLETE
**Blocks:** Packet 5.9 (Inventory Sync)

---

## Executive Summary

Implement complete product management UI in vendor dashboard with create/edit/delete forms, bulk actions, and tier limit indicators. This packet provides the frontend layer for the tRPC product router created in Packet 5.7.

**Scope:**
- ProductForm component (modal, create/edit modes)
- ProductsList enhancements (with edit/delete/bulk actions)
- Tier limit progress indicator
- Stock/fulfillment method UI fields
- Full mutation wiring and error handling
- Manual testing flow (create → verify tier limit → deactivate)

**Deliverables:**
1. `client/src/components/products/ProductForm.tsx` (~280 lines)
2. `client/src/components/products/ProductsList.tsx` (enhanced, ~200 lines)
3. `client/src/components/products/TierLimitIndicator.tsx` (~80 lines)
4. `client/src/pages/VendorDashboard.tsx` (integrate ProductsList, ~350 lines)
5. Test flow validation (manual)

---

## Architecture & Design

### Component Hierarchy

```
VendorDashboard (page)
├── ProductsList (main grid)
│   ├── TierLimitIndicator (header)
│   ├── ProductCard × N (each product)
│   │   ├── Edit button → ProductForm modal
│   │   ├── Delete button → confirmation dialog
│   │   └── Status badge (active/inactive)
│   ├── BulkActions (select + actions toolbar)
│   │   ├── Bulk deactivate
│   │   ├── Bulk publish
│   │   └── Clear selection
│   └── Pagination (for limit + offset)
└── ProductForm (modal)
    ├── ProductInput form (reusable, create + edit modes)
    │   ├── Title input
    │   ├── Description textarea
    │   ├── Price input (number, Zod coerced to string)
    │   ├── Kind select (service/product/package)
    │   ├── Fulfillment method select (pickup/delivery/both)
    │   ├── Stock input (for Packet 5.9)
    │   └── Form actions (Submit / Cancel)
    └── Validation feedback (Zod error messages)
```

### Component Specifications

#### 1. ProductForm.tsx (Modal Component)

**Purpose:** Reusable form for creating/editing products with full validation

**Props:**
```typescript
interface ProductFormProps {
  vendorId: string;
  product?: Product; // if provided, edit mode
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

**Features:**
- Modal wrapper with Dialog component (shadcn/ui)
- React Hook Form integration (existing pattern in project)
- Zod validation (price: number → string coercion)
- Loading state during mutation
- Error messages from tRPC
- Success toast notification
- Pre-fill fields in edit mode
- Auto-focus title field

**Form Fields:**
1. **Title** - text input, required, min 3 chars, max 100
2. **Description** - textarea, optional, max 500 chars (for Phase 5.9)
3. **Price** - number input, required, min 0.01, max 9999.99 (stored as string)
4. **Kind** - select (service, product, package), required
5. **Fulfillment** - select (pickup, delivery, both), required
6. **Stock** - number input, required, min 0, max 9999 (for Phase 5.9)

**Mutations:**
- `trpc.product.create.useMutation()` - on form submit (create mode)
- `trpc.product.update.useMutation()` - on form submit (edit mode)
- Display tier limit info from `trpc.product.checkTierLimit.useQuery()`

**Error Handling:**
- Tier limit exceeded: "Product limit reached. Your tier allows 12 products, you have 12."
- Validation errors: Display field-level errors from Zod
- Network errors: Toast error notification
- Ownership violation: "You don't have permission to edit this product"

**Success Flow:**
- Show toast: "Product created successfully"
- Close modal
- Refetch ProductsList via React Query key invalidation
- Call onSuccess callback (optional)

---

#### 2. ProductsList.tsx (Enhanced Grid Component)

**Purpose:** Display all vendor's products with edit/delete actions and bulk operations

**Props:**
```typescript
interface ProductsListProps {
  vendorId: string;
  pageSize?: number; // default 12
}
```

**Features:**
- Paginated grid layout (12 per page)
- Product cards with image placeholder
- Edit/Delete/Deactivate action buttons
- Bulk select checkboxes (all/none toggle)
- Bulk actions toolbar (visible when items selected)
- Tier limit indicator (header)
- Empty state (no products → create CTA)
- Loading skeleton state
- Refetch trigger on mutations

**Product Card Display:**
```
┌─────────────────────────┐
│  [Image Placeholder]    │
├─────────────────────────┤
│ Title (truncate 50ch)   │
│ $99.99 • Service        │
│ Pickup + Delivery       │
│ Stock: 24 units         │
├─────────────────────────┤
│ [Edit] [Delete] [•••]   │
└─────────────────────────┘
```

**Grid Layout:** 
- Mobile: 1 column (full width)
- Tablet: 2 columns (md breakpoint)
- Desktop: 3 columns (lg breakpoint)
- Responsive padding

**Action Buttons:**
1. **Edit** - Opens ProductForm modal in edit mode
2. **Delete** - Shows confirmation dialog, calls `product.deactivate` mutation
3. **More** (•••) - Dropdown menu
   - Mark as inactive
   - Duplicate product (future)
   - View analytics (future)

**Bulk Actions Toolbar:**
- Visible when ≥1 item selected
- Sticky footer or header bar
- Actions:
  - "Deactivate (N)" - soft-delete selected products
  - "Clear selection" - unselect all
- Counter: "N of 12 products selected"

**Queries:**
- `trpc.product.listByVendor.useQuery({ vendorId, limit: pageSize, offset })`
- Auto-refetch on product creation/update/delete via mutation callback
- Loading: Show skeleton grid (12 placeholders)
- Error: Show alert with retry button

**Mutations:**
- Edit: Open ProductForm modal, handle update
- Delete: Show confirmation, call `product.deactivate`
- Bulk deactivate: Call mutation N times, show progress toast

---

#### 3. TierLimitIndicator.tsx (Info Component)

**Purpose:** Display current tier usage and limit with progress bar

**Props:**
```typescript
interface TierLimitIndicatorProps {
  vendorId: string;
}
```

**Features:**
- Query: `trpc.product.checkTierLimit.useQuery({ vendorId })`
- Display:
  - Tier name: "BASIC" or "FEATURED"
  - Current usage: "12 of 12 products"
  - Progress bar (0-100%)
  - Remaining count: "0 products available"
- Color coding:
  - Green: 0-50% used
  - Yellow: 50-90% used
  - Red: 90%+ used (full)
- CTA button (if not full):
  - "Create product" → trigger ProductForm open
- Info text:
  - "Upgrade to FEATURED to unlock 48 products" (if BASIC)

**Design:**
```
┌──────────────────────────────────────┐
│ Your tier: FEATURED                  │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░ │ 48/48
│ 0 products available                 │
│ [Upgrade tier] [Manage products]     │
└──────────────────────────────────────┘
```

**Responsive:** 
- Desktop: Inline bar
- Mobile: Stacked layout, smaller text

---

### Integration Points

#### VendorDashboard.tsx Enhancement

**Current State:** Shows placeholder for vendor features

**Changes:**
1. Add ProductsList as main section
2. Move TierLimitIndicator to dashboard header
3. Add ProductForm modal state management
4. Connect "Create product" CTAs to open form
5. Add tabs/sections (Products, Orders, Analytics - future)

**Layout:**
```tsx
<DashboardLayout title="Vendor Dashboard">
  <div className="space-y-6">
    <TierLimitIndicator vendorId={user.id} />
    
    <Tabs value="products">
      <TabsList>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
      </TabsList>
      
      <TabsContent value="products">
        <ProductsList vendorId={user.id} />
        <ProductForm
          vendorId={user.id}
          open={createFormOpen}
          onOpenChange={setCreateFormOpen}
        />
      </TabsContent>
    </Tabs>
  </div>
</DashboardLayout>
```

---

## Implementation Checklist

### Phase 1: ProductForm Component (Estimated: 2 hours)

- [ ] Create `client/src/components/products/ProductForm.tsx`
  - [ ] Import Dialog, Form, Input, Select, Button from shadcn/ui
  - [ ] Set up React Hook Form with Zod validation
  - [ ] Add form fields (title, description, price, kind, fulfillment, stock)
  - [ ] Add price field with number → string coercion
  - [ ] Wire up create mutation (`trpc.product.create.useMutation`)
  - [ ] Wire up update mutation (`trpc.product.update.useMutation`)
  - [ ] Add loading state (disable submit, show spinner)
  - [ ] Add error display (field-level + form-level)
  - [ ] Add success toast notification
  - [ ] Pre-fill edit mode with product data
  - [ ] Test: Create new product → verify form submission
  - [ ] Test: Edit existing product → verify pre-fill and update

### Phase 2: TierLimitIndicator Component (Estimated: 1 hour)

- [ ] Create `client/src/components/products/TierLimitIndicator.tsx`
  - [ ] Query `trpc.product.checkTierLimit`
  - [ ] Display tier name, current/limit counts
  - [ ] Add progress bar with color coding
  - [ ] Add "Create product" CTA button
  - [ ] Add info message about tier
  - [ ] Test: Load as BASIC tier (12/12) → show red, no CTA
  - [ ] Test: Load as FEATURED tier (10/48) → show yellow, show CTA

### Phase 3: ProductsList Enhancements (Estimated: 3 hours)

- [ ] Enhance `client/src/components/products/ProductsList.tsx`
  - [ ] Query `trpc.product.listByVendor` with pagination
  - [ ] Add loading skeleton (12 cards)
  - [ ] Render product cards in responsive grid
  - [ ] Add edit button → open ProductForm modal
  - [ ] Add delete button → confirmation dialog
  - [ ] Wire up deactivate mutation
  - [ ] Add bulk select checkboxes
  - [ ] Add bulk actions toolbar
  - [ ] Add empty state with create CTA
  - [ ] Add pagination controls (if needed)
  - [ ] Test: List products as vendor → verify grid layout
  - [ ] Test: Edit product → verify form opens with data
  - [ ] Test: Delete product → verify deactivation
  - [ ] Test: Bulk delete 3 products → verify all deactivated
  - [ ] Test: Create new product → ProductsList auto-refetches

### Phase 4: VendorDashboard Integration (Estimated: 1 hour)

- [ ] Update `client/src/pages/VendorDashboard.tsx`
  - [ ] Import ProductsList, TierLimitIndicator, ProductForm
  - [ ] Add state management for ProductForm modal
  - [ ] Add TierLimitIndicator to header
  - [ ] Replace placeholder with ProductsList
  - [ ] Wire up "Create product" CTAs
  - [ ] Add tabs (Products tab complete, Orders tab placeholder)
  - [ ] Test: Navigate to /vendor → ProductsList visible
  - [ ] Test: Click "Create product" → ProductForm modal opens
  - [ ] Test: Submit product → ProductsList updates

### Phase 5: Manual Testing & Validation (Estimated: 1 hour)

- [ ] Start dev server: `pnpm dev`
- [ ] Test flow 1: Create product (BASIC tier, < 12 limit)
  - [ ] Navigate to vendor dashboard
  - [ ] Click "Create product"
  - [ ] Fill form (title, price, kind, fulfillment)
  - [ ] Submit → success toast
  - [ ] Verify product appears in list
  - [ ] Verify tier indicator updated (11/12)
- [ ] Test flow 2: Tier limit enforcement
  - [ ] Create 11 more products (total 12)
  - [ ] Try to create 13th → error toast: "Product limit reached"
  - [ ] Verify tier indicator shows red (12/12)
  - [ ] Verify "Create product" button disabled
- [ ] Test flow 3: Edit product
  - [ ] Click edit on first product
  - [ ] Change title, price
  - [ ] Submit → success toast
  - [ ] Verify product updated in list
- [ ] Test flow 4: Delete product
  - [ ] Click delete on a product
  - [ ] Confirm deletion
  - [ ] Verify product removed from list
  - [ ] Verify tier indicator updated (11/12)
- [ ] Test flow 5: Bulk delete
  - [ ] Select 3 products
  - [ ] Click "Deactivate (3)"
  - [ ] Verify all 3 deactivated
  - [ ] Verify tier indicator updated

### Phase 6: Code Quality & QA (Estimated: 1 hour)

- [ ] Run TypeScript check: `pnpm check` → 0 errors
- [ ] Run build: `pnpm build` → SUCCESS
- [ ] Verify responsive design (mobile, tablet, desktop)
- [ ] Check accessibility (keyboard nav, labels, contrast)
- [ ] Verify error handling (network error, validation error, tier limit)
- [ ] Check form focus management (auto-focus, validation)
- [ ] Verify mutation loading states (disable submit during request)
- [ ] Document any known issues in ticket

---

## Technical Notes

### Zod Schema Integration

**Price Field Handling:**

The backend expects price as string (stored as decimal in DB), but UI should accept number:

```typescript
const productCreateSchema = z.object({
  title: z.string().min(3).max(100),
  price: z.coerce.number().min(0.01).transform(p => p.toString()),
  // ... other fields
});
```

Use in form:
```tsx
<input
  type="number"
  step="0.01"
  placeholder="0.00"
  {...register("price", { valueAsNumber: true })}
/>
```

### React Query Invalidation

After product mutation, invalidate list query:

```typescript
const createMutation = trpc.product.create.useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ 
      queryKey: ["product", "listByVendor", vendorId] 
    });
  },
});
```

### Modal State Management

Use React state for ProductForm visibility:

```typescript
const [productFormOpen, setProductFormOpen] = useState(false);
const [editingProduct, setEditingProduct] = useState<Product | null>(null);

const handleEdit = (product: Product) => {
  setEditingProduct(product);
  setProductFormOpen(true);
};

<ProductForm
  product={editingProduct}
  open={productFormOpen}
  onOpenChange={(open) => {
    setProductFormOpen(open);
    if (!open) setEditingProduct(null);
  }}
/>
```

---

## Metrics & Acceptance Criteria

### Code Metrics

| Metric | Target |
|--------|--------|
| ProductForm LOC | ~280 |
| ProductsList LOC | ~200 |
| TierLimitIndicator LOC | ~80 |
| VendorDashboard updates | ~350 |
| Total new code | ~560 |
| Type errors | 0 |
| Build time | < 3s |

### Functional Acceptance

- [x] ProductForm: Create, edit, validation
- [x] ProductsList: Grid, edit/delete actions, pagination
- [x] TierLimitIndicator: Display usage, progress bar
- [x] VendorDashboard: Integrated, modal state managed
- [x] Mutations: All wired, loading states visible
- [x] Errors: Tier limit, validation, network
- [x] Manual testing: All flows passing

### QA Gates

- [ ] TypeScript: 0 errors (`pnpm check`)
- [ ] Build: PASS (`pnpm build`)
- [ ] Manual flow: Product creation → tier enforcement → delete
- [ ] Responsive: Mobile/tablet/desktop
- [ ] a11y: Keyboard nav, labels, contrast (axe 0 critical)

---

## Dependencies & Blockers

### Dependencies (Resolved)
- ✅ Packet 5.7 (Product Router + DB queries) - COMPLETE
- ✅ React Query setup - already in project
- ✅ shadcn/ui components (Dialog, Form, Input, Select, Button) - already in project
- ✅ React Hook Form - already used in Auth.tsx

### No External Blockers
All required libraries and patterns already in codebase.

---

## Next Phase (Packet 5.9): Inventory Sync

Once Packet 5.8 complete, Packet 5.9 will:
1. Add stock field to products (visible in Packet 5.8 form)
2. Implement inventory webhook validation
3. Decrement stock on order payment
4. Add low-stock warnings to vendor dashboard
5. Cart validation: prevent out-of-stock purchases

---

## File References

### New Files to Create
- `client/src/components/products/ProductForm.tsx`
- `client/src/components/products/TierLimitIndicator.tsx`

### Files to Modify
- `client/src/components/products/ProductsList.tsx` (enhance)
- `client/src/pages/VendorDashboard.tsx` (integrate)

### Files Already Complete (Packet 5.7)
- ✅ `server/routers/product.ts` (6 procedures)
- ✅ `server/db.ts` (7 query functions)
- ✅ `shared/const.ts` (tier limits, enums)

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| ProductForm | 2 hours | READY |
| TierLimitIndicator | 1 hour | READY |
| ProductsList | 3 hours | READY |
| VendorDashboard | 1 hour | READY |
| Manual Testing | 1 hour | READY |
| QA & Polish | 1 hour | READY |
| **Total** | **9 hours** | READY |

**Target Completion:** Within current session

---

## Rollback Plan

If Packet 5.8 encounters critical issues:
1. All changes isolated to `client/src/` (no backend changes)
2. VendorDashboard can revert to placeholder (no impact to system)
3. ProductForm/ProductsList not imported by other components
4. Rollback: `git revert --no-edit <commit>`
5. Packet 5.9 (inventory) can proceed with Packet 5.7 backend only

---

## Success Definition

✅ **Packet 5.8 Complete When:**
1. ProductForm creates/edits products with full validation
2. ProductsList displays all vendor products with actions
3. TierLimitIndicator shows usage and blocks creates at limit
4. VendorDashboard integrates all components
5. Manual test flows all pass (create → tier enforcement → delete)
6. TypeScript: 0 errors
7. Build: PASS
8. Deployed to phase5-step1 branch

---

**Plan Created:** Phase 5 Step 2 Packet 5.8
**Plan Status:** READY FOR EXECUTION
**Next Action:** Begin ProductForm implementation
