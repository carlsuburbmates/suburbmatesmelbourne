# Architecture Translation Guide

## Problem Context

Work was accidentally completed in the wrong repository (SuburbmatesMelb) which uses a completely different technology stack. This document explains how features were translated from the original Next.js + Supabase architecture to the Manus + tRPC + Drizzle ORM architecture.

## Stack Comparison

| Aspect | SuburbmatesMelb (Source) | suburbmatesmelbourne (Target) |
|--------|-------------------------|------------------------------|
| **Framework** | Next.js 14 App Router | Manus Platform + React 19 |
| **Backend** | Next.js API Routes | Express + tRPC |
| **Database ORM** | Supabase Client | Drizzle ORM |
| **Database** | PostgreSQL (via Supabase) | MySQL |
| **Type System** | Supabase generated types | Drizzle inferred types |
| **API Pattern** | RESTful endpoints | tRPC procedures |
| **Auth** | Supabase Auth | Manus OAuth |
| **Routing** | Next.js App Router | wouter |

## Translation Patterns

### 1. Database Migrations

**Source (Supabase):**
```sql
-- supabase/migrations/021_create_reviews_table.sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ...
);
```

**Target (Drizzle):**
```typescript
// drizzle/schema.ts
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  ...
});
```

**Key Differences:**
- UUID → Auto-increment INT (MySQL standard)
- PostgreSQL functions → MySQL equivalents
- Supabase SQL → Drizzle schema definition
- Manual SQL → Generated via `drizzle-kit generate`

### 2. API Endpoints

**Source (Next.js API Route):**
```typescript
// src/app/api/business/[slug]/route.ts
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('slug', params.slug);
  return Response.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  // Update logic
}
```

**Target (tRPC):**
```typescript
// server/routers.ts
business: router({
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const business = await db.getBusinessById(input.id);
      return business;
    }),
  
  update: protectedProcedure
    .input(z.object({ businessId: z.number(), ... }))
    .mutation(async ({ ctx, input }) => {
      await db.updateBusiness(input.businessId, input);
      return { success: true };
    }),
})
```

**Key Differences:**
- HTTP methods → tRPC procedures (query/mutation)
- Manual routing → tRPC router definition
- Manual validation → Zod schemas
- Supabase client → Drizzle db functions
- Manual response formatting → Type-safe returns

### 3. Database Queries

**Source (Supabase):**
```typescript
const { data: reviews } = await supabase
  .from('reviews')
  .select('*')
  .eq('product_id', productId)
  .eq('status', 'approved');
```

**Target (Drizzle):**
```typescript
// server/db.ts
export async function getApprovedReviewsByProductId(productId: number) {
  const db = await getDb();
  return await db
    .select()
    .from(reviews)
    .where(and(
      eq(reviews.productId, productId),
      eq(reviews.status, "approved")
    ))
    .orderBy(desc(reviews.createdAt));
}
```

**Key Differences:**
- Supabase query builder → Drizzle query builder
- snake_case → camelCase
- Async/await pattern → Same
- Type inference → Drizzle schema types

### 4. Type Definitions

**Source (Supabase generated):**
```typescript
// src/lib/database.types.ts
export interface BusinessProfile {
  id: string;
  business_name: string;
  profile_image_url: string | null;
  phone: string | null;
}
```

**Target (Drizzle inferred):**
```typescript
// drizzle/schema.ts
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("businessName", { length: 255 }),
  profileImage: varchar("profileImage", { length: 500 }),
  phone: varchar("phone", { length: 20 }),
});

export type Business = typeof businesses.$inferSelect;
```

**Key Differences:**
- Generated types → Inferred from schema
- snake_case → camelCase (enforced by schema)
- Manual updates → Automatic from schema changes
- UUID → Auto-increment INT

### 5. Authentication & Authorization

**Source (Supabase Auth):**
```typescript
import { getUserFromRequest } from '@/middleware/auth';

const user = await getUserFromRequest(request);
if (!user) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Target (Manus OAuth + tRPC):**
```typescript
// Automatic via tRPC context
protectedProcedure
  .mutation(async ({ ctx, input }) => {
    // ctx.user is automatically available
    // Throws UNAUTHORIZED if not authenticated
    const userId = ctx.user.id;
  })
```

**Key Differences:**
- Manual auth check → Built into procedure type
- Manual error handling → Automatic TRPCError
- Request object → Context object
- Supabase Auth → Manus OAuth

### 6. Stripe Webhook Handling

**Source (Hypothetical Next.js):**
```typescript
// src/lib/stripe-config.js
export async function handleCheckoutSessionCompleted(session) {
  const { supabase } = createClient();
  await supabase
    .from('vendors')
    .update({ tier: 'pro' })
    .eq('id', session.metadata.vendor_id);
}
```

**Target (Express + Drizzle):**
```typescript
// server/webhooks/stripe.ts
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const vendorId = parseInt(session.metadata?.vendorId || "0", 10);
  
  await db.updateSubscriptionStatus(vendorId, "featured_active", renewsAt);
}
```

**Key Differences:**
- Supabase client → Drizzle db functions
- snake_case → camelCase
- Direct SQL → Type-safe functions
- Manual typing → Stripe SDK types

## Field Naming Conventions

| Supabase (snake_case) | Drizzle (camelCase) |
|----------------------|---------------------|
| profile_image_url | profileImage |
| business_name | businessName |
| customer_id | customerId |
| product_id | productId |
| created_at | createdAt |
| updated_at | updatedAt |

## Feature-Specific Adaptations

### Reviews System

**Changes:**
- UUID primary keys → INT auto-increment
- PostgreSQL TIMESTAMPTZ → MySQL TIMESTAMP
- Supabase RLS policies → tRPC procedures with authorization
- Direct table access → Query functions in db.ts
- CHECK constraints → Handled by Zod validation

### Business Updates

**Changes:**
- Next.js API route PUT → tRPC mutation
- Request body parsing → Zod input validation
- Supabase Auth → Manus OAuth via protectedProcedure
- Direct UPDATE queries → updateBusiness() function
- Manual response → Type-safe return

### Stripe Webhooks

**Changes:**
- Next.js API route → Express webhook router
- Supabase client updates → Drizzle db functions
- Manual metadata parsing → Type-safe Stripe objects
- PostgreSQL → MySQL syntax in updates

## Benefits of Target Architecture

1. **Type Safety:** End-to-end type inference from database to frontend
2. **Simplified API:** No manual route definitions, automatic RPC
3. **Developer Experience:** Better IntelliSense, compile-time errors
4. **Consistency:** Single source of truth for types (schema)
5. **Performance:** Direct MySQL queries, no intermediary service

## Challenges Overcome

1. **UUID to INT:** Required regenerating IDs, but more performant
2. **snake_case to camelCase:** Schema enforces consistency
3. **REST to RPC:** Better developer experience with tRPC
4. **Auth patterns:** Manus OAuth differs from Supabase
5. **Database differences:** PostgreSQL vs MySQL syntax

## Testing Strategy

1. **Type checking:** `npm run check` verifies all types
2. **Database migration:** `npm run db:push` applies schema
3. **Runtime testing:** Manual testing via tRPC client
4. **Webhook testing:** Stripe CLI for event simulation

## Future Considerations

- Consider adding review verification based on completed orders
- Implement caching for rating calculations at scale
- Add rate limiting for review creation
- Consider denormalizing ratings to avoid complex queries
- Add audit logging for subscription tier changes
