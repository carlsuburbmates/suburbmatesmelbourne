# Phase 5.9 Backend API Reference — Frontend Integration Guide

## Available Endpoints

### 1. `product.categories.listAll`

**Type:** `publicProcedure` (query)  
**Purpose:** Fetch all available categories with product counts

**Usage:**
```typescript
const { data: categories, isLoading } = trpc.product.categories.listAll.useQuery();
```

**Response Type:**
```typescript
{
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  createdAt: Date
  updatedAt: Date
  productCount: number  // Count of products in this category
}[]
```

**Example Response:**
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and gadgets",
    "icon": "⚡",
    "createdAt": "2025-11-07T10:00:00Z",
    "updatedAt": "2025-11-07T10:00:00Z",
    "productCount": 24
  },
  {
    "id": 2,
    "name": "Furniture",
    "slug": "furniture",
    "description": "Home and office furniture",
    "icon": "🪑",
    "createdAt": "2025-11-07T10:00:00Z",
    "updatedAt": "2025-11-07T10:00:00Z",
    "productCount": 18
  }
]
```

---

### 2. `product.categories.create`

**Type:** `adminProcedure` (mutation)  
**Purpose:** Create a new category (admin only)

**Usage:**
```typescript
const createMutation = trpc.product.categories.create.useMutation();

createMutation.mutate({
  name: "Electronics",
  slug: "electronics",
  description: "Electronic devices and gadgets",
  icon: "⚡"
});

// Handle response
createMutation.data  // { success: true, category: Category }
createMutation.error // TRPCError or null
```

**Input Schema:**
```typescript
{
  name: string              // 1-100 chars, required
  slug: string              // 1-100 chars, lowercase + hyphens only (/^[a-z0-9-]+$/)
  description?: string      // Optional, any length
  icon?: string             // Optional, emoji or icon reference
}
```

**Response Type:**
```typescript
{
  success: true
  category: {
    id: number
    name: string
    slug: string
    description: string | null
    icon: string | null
    createdAt: Date
    updatedAt: Date
  }
}
```

**Error Codes:**
- `FORBIDDEN` - User is not admin
- `BAD_REQUEST` - Duplicate slug or invalid input

---

### 3. `product.categories.getProductsByCategory`

**Type:** `publicProcedure` (query)  
**Purpose:** Fetch products filtered by category with pagination

**Usage:**
```typescript
const { data: result, isLoading } = trpc.product.categories.getProductsByCategory.useQuery({
  slug: "electronics",
  limit: 20,
  offset: 0
});

// Access paginated data
result?.products  // Product[]
result?.category  // Category object
result?.total     // Total count of products in category
```

**Input Schema:**
```typescript
{
  slug: string           // Category slug (required)
  limit?: number         // 1-100, default 20
  offset?: number        // ≥ 0, default 0
}
```

**Response Type:**
```typescript
{
  category: {
    id: number
    name: string
    slug: string
    description: string | null
    icon: string | null
    createdAt: Date
    updatedAt: Date
  }
  products: Product[]       // Paginated product list
  total: number             // Total products in this category (for pagination)
}
```

**Error Codes:**
- `NOT_FOUND` - Category with given slug not found

---

### 4. `product.categories.updateProductCategories`

**Type:** `protectedProcedure` (mutation)  
**Purpose:** Update product category assignments (vendor only, ownership enforced)

**Usage:**
```typescript
const updateMutation = trpc.product.categories.updateProductCategories.useMutation();

updateMutation.mutate({
  productId: 42,
  categoryIds: [1, 5, 7]
});
```

**Input Schema:**
```typescript
{
  productId: number           // Must be positive integer
  categoryIds: number[]       // Array of category IDs (can be empty)
}
```

**Response Type:**
```typescript
{
  success: true
  message: "Product categories updated"
}
```

**Authorization:**
- User must be authenticated
- User must own the product (product.vendorId === ctx.user.id)

**Error Codes:**
- `UNAUTHORIZED` - Not authenticated
- `NOT_FOUND` - Product not found
- `FORBIDDEN` - User doesn't own this product
- `INTERNAL_SERVER_ERROR` - Database error

---

## Component Integration Examples

### CategorySelector Component
```typescript
import { trpc } from '@/lib/trpc';
import { Checkbox } from '@/components/ui/checkbox';

export function CategorySelector({ selected, onChange }) {
  const { data: categories } = trpc.product.categories.listAll.useQuery();
  
  return (
    <div className="space-y-2">
      {categories?.map(cat => (
        <label key={cat.id} className="flex items-center gap-2">
          <Checkbox
            checked={selected.includes(cat.id)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selected, cat.id]);
              } else {
                onChange(selected.filter(id => id !== cat.id));
              }
            }}
          />
          <span>{cat.name}</span>
          <span className="text-sm text-gray-500">({cat.productCount})</span>
        </label>
      ))}
    </div>
  );
}
```

### CategoryFilterBar Component
```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CategoryFilterBar({ onCategoryChange }) {
  const { data: categories } = trpc.product.categories.listAll.useQuery();
  
  return (
    <Select onValueChange={onCategoryChange}>
      <SelectTrigger>
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories?.map(cat => (
          <SelectItem key={cat.id} value={cat.slug}>
            {cat.name} ({cat.productCount})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Marketplace with Filtering
```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { CategoryFilterBar } from '@/components/CategoryFilterBar';

export function Marketplace() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { data: products, isLoading } = 
    selectedCategory === 'all'
      ? trpc.product.list.useQuery()  // Fetch all products
      : trpc.product.categories.getProductsByCategory.useQuery({
          slug: selectedCategory,
          limit: 20,
          offset: 0,
        });
  
  return (
    <div>
      <CategoryFilterBar onCategoryChange={setSelectedCategory} />
      
      {isLoading && <div>Loading...</div>}
      
      <div className="grid gap-4 mt-4">
        {products?.products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### Product Form with Categories
```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useForm } from 'react-hook-form';
import { CategorySelector } from '@/components/CategorySelector';

export function ProductForm({ productId }) {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      categories: []
    }
  });
  
  const createMutation = trpc.product.create.useMutation();
  const updateCategoriesMutation = trpc.product.categories.updateProductCategories.useMutation();
  
  const selectedCategories = watch('categories');
  
  const onSubmit = async (data) => {
    // Create/update product
    const product = await createMutation.mutateAsync({
      title: data.title,
      // ... other fields
    });
    
    // Update categories
    await updateCategoriesMutation.mutateAsync({
      productId: product.id,
      categoryIds: selectedCategories,
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      
      <label>Categories:</label>
      <CategorySelector 
        selected={selectedCategories}
        onChange={(categories) => {
          // Update form state
        }}
      />
      
      <button type="submit">Save Product</button>
    </form>
  );
}
```

---

## Type Definitions

```typescript
// Import from generated types
import type { AppRouter } from '@/server';

type CategoriesRouter = AppRouter['product']['categories'];

// Query types
type ListAllOutput = Awaited<ReturnType<CategoriesRouter['listAll']['query']>>;
type GetBySlugOutput = Awaited<ReturnType<CategoriesRouter['getProductsByCategory']['query']>>;

// Mutation types
type CreateOutput = Awaited<ReturnType<CategoriesRouter['create']['mutate']>>;
type UpdateCategoriesOutput = Awaited<ReturnType<CategoriesRouter['updateProductCategories']['mutate']>>;
```

---

## Testing Checklist

- [ ] `listAll` returns all categories with product counts
- [ ] `create` (admin) successfully creates new category
- [ ] `create` (non-admin) returns FORBIDDEN error
- [ ] `getProductsByCategory` returns correct products + category info
- [ ] `getProductsByCategory` with invalid slug returns NOT_FOUND
- [ ] `updateProductCategories` updates product categories
- [ ] `updateProductCategories` prevents non-owner updates
- [ ] Pagination works: `limit`, `offset` parameters respected
- [ ] No N+1 queries in getAllCategories
- [ ] Category slugs are URL-safe (validated by Zod)

---

## Deployment Notes

- Backend endpoints are production-ready ✅
- Type safety enabled across all layers
- Error handling follows tRPC conventions
- Database indices optimized for category queries
- Cascading deletes configured (product deletion removes category associations)
- Ready for frontend wiring and integration testing

