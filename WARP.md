# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev          # Start dev server (tsx watch mode, auto-finds port 3000-3020)
pnpm build        # Production build (Vite frontend + esbuild backend)
pnpm start        # Run production server
pnpm check        # TypeScript type checking across monorepo
pnpm format       # Format code with Prettier
pnpm test         # Run tests with Vitest
```

### Database
```bash
pnpm db:push      # Generate and apply Drizzle migrations
```

### Testing
```bash
# Run single test file
pnpm test server/path/to/test.spec.ts

# Watch mode
pnpm test --watch
```

## Architecture

### Monorepo Structure

**Type:** Full-stack TypeScript monorepo with shared code

```
client/         → React 19 SPA (Vite)
server/         → Express backend with tRPC
  ├── routers/  → Domain-specific tRPC routers
  ├── _core/    → Framework code (Manus platform)
  ├── lib/      → Utilities (ABN verification, etc.)
  ├── integrations/ → External services (Stripe, etc.)
  └── webhooks/ → Webhook handlers
drizzle/        → Database schema and migrations (MySQL)
shared/         → Shared types/constants between client/server
```

**Path Aliases:**
- `@/` → `client/src/` (frontend only)
- `@shared/` → `shared/` (both frontend and backend)

### Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, shadcn/ui (Radix), wouter (routing), TanStack Query  
**Backend:** Express 4, tRPC 11, Drizzle ORM, MySQL/TiDB  
**Auth:** Passwordless email (Manus OAuth)  
**Payments:** Stripe (Checkout Sessions + webhooks)  
**Package Manager:** pnpm with patches

### Data Flow & tRPC Pattern

**Critical:** This project uses **tRPC** for end-to-end type safety. All API communication flows through typed procedures.

**Backend router structure:**
```typescript
// server/routers.ts (main router)
export const appRouter = router({
  business: router({ ... }),
  cart: cartRouter,
  product: productRouter,
  notifications: notificationsRouter,
  // ...
});
```

**Domain routers:** Located in `server/routers/` for separation (cart, product, notifications)

**Frontend usage:**
```typescript
import { trpc } from "@/lib/trpc";

// Query
const { data } = trpc.business.list.useQuery({ suburb: "Carlton" });

// Mutation
const createMutation = trpc.business.create.useMutation();
```

**Adding new endpoints:**
1. Add procedure to appropriate router in `server/routers.ts` or `server/routers/<domain>.ts`
2. Define Zod input schema
3. Use `publicProcedure`, `protectedProcedure`, or `adminProcedure`
4. Frontend gets instant type safety via `appRouter` type export

### Database Architecture (Drizzle ORM)

**Schema:** `drizzle/schema.ts` defines all tables with camelCase columns  
**Queries:** `server/db.ts` exports typed query functions

**Key tables:**
- `users` - Auth + roles (`buyer`, `business_owner`, `vendor`, `admin`)
- `businesses` - Directory entities + ABN verification
- `vendors_meta` - Vendor-specific data (Stripe accounts, subscriptions)
- `products` - Marketplace listings (kind, fulfillment, inventory)
- `orders` - Purchase records + payment tracking
- `carts` - User shopping carts
- `notifications` - In-app notifications
- `agreements` - Legal compliance tracking
- `consents` - GDPR/privacy audit logs
- `melbourne_postcodes` - Geofencing data (lat/long for Melbourne)

**Migration workflow:**
1. Modify schema in `drizzle/schema.ts`
2. Export types: `export type TableName = typeof tableName.$inferSelect`
3. Add query functions in `server/db.ts`
4. Run `pnpm db:push`

### Authentication & Authorization

**Flow:** Manus OAuth → passwordless email → session cookie (`COOKIE_NAME` from `@shared/const`)

**Context middleware:** `server/_core/context.ts` authenticates requests  
**Frontend hook:** `useAuth()` from `@/_core/hooks/useAuth.ts`

**Procedures:**
- `publicProcedure` - No auth required
- `protectedProcedure` - Requires authenticated user (ctx.user available)
- `adminProcedure` - Requires admin role

**Role hierarchy:** 
- `buyer` → Default role
- `business_owner` → Can create businesses
- `vendor` → Can sell on marketplace (upgrades: BASIC → FEATURED)
- `admin` → Platform management

### Marketplace Logic

**Vendor tiers:**
- **BASIC:** 8% + $0.50 fee, 12 products max
- **FEATURED:** 6% + $0.50 fee, 48 products max, $29/mo subscription

**Product fields:** kind (Physical/Digital/Service), fulfillment (Pickup/Delivery/Digital), stock management

**Payment flow:** Stripe Checkout Sessions (redirect) → webhook reconciliation → order status updates

**Webhooks:** `server/webhooks/` handles Stripe events (payment, refund, dispute, subscription)

### Design System

**UI Components:** `client/src/components/ui/` (shadcn/ui patterns)  
**Styling:** Tailwind utility classes via `cn()` from `@/lib/utils`

**Color palette:**
- Forest Green `#2D5016` (primary)
- Emerald `#50C878` (success/active)
- Gold `#FFD700` (trust/CTA)

**Patterns:**
- Mobile-first responsive design
- 44px minimum tap targets
- WCAG 2.2 AA compliance
- Framer Motion for micro-interactions only

### Routing (wouter)

**Pattern:** Uses patched wouter (not React Router)

```tsx
// client/src/App.tsx
<Route path="/business/:id" component={BusinessProfile} />
```

**Navigation:** `<Link href="/path">` or `useLocation()` hook

### Project Phases (SSOT.md)

**Current:** Phase 5 (Marketplace Expansion) - Step 1 complete (v5.1)  
**Next:** Phase 5 Step 2 - Products & Inventory (v5.2)

**Phase gates:** TypeScript strict 0 errors, Vite build pass, Playwright smoke tests, CWV budgets (LCP ≤2.0s, INP ≤200ms, CLS ≤0.05)

**Critical files:**
- `SSOT.md` - Single source of truth (frozen decisions)
- `docs/SSOT_AMBIGUITY_TRACKER.md` - Open technical decisions
- `todo.md` - Task tracking

**Merge policy:** No direct pushes to `main`. Phase branch → PR → QA checklist → tag

### Special Integrations

**ABN Verification:** `server/lib/abr.ts` - Australian Business Register lookup (server-only, 24h cache)

**Stripe:** `server/integrations/stripe.ts` - Checkout Sessions + Connect for vendor payouts

**PWA:** Service worker registration in `client/src/registerSW.ts`

**Analytics:** PostHog (consent-gated, configured in main.tsx)

### Common Patterns

**Error handling:**
- tRPC errors use codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`
- Global error boundaries in `client/src/components/ErrorBoundary.tsx`

**Consent tracking:** Must log in `consents` table with immutable hash (compliance requirement)

**Audit logging:** All writes must create `AuditLog` entries within same transaction

**Geofencing:** Use `melbourne_postcodes` table for Melbourne-specific features

## Development Notes

### Manus Platform
This project runs on Manus platform (`server/_core/` contains framework code). Avoid modifying `_core/` unless extending platform functionality.

### Environment Variables
- Backend: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FEATURED`, `ABR_API_KEY`
- Frontend (Vite): `VITE_APP_TITLE`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`

### Testing
Tests located in `server/**/*.test.ts` and `server/**/*.spec.ts` (Vitest, Node environment)

### Performance Budgets
- Lighthouse mobile ≥90
- Core Web Vitals: LCP ≤2.0s, INP ≤200ms, CLS ≤0.05
- axe CI: 0 serious/critical

### Compliance Requirements
- ABN verification server-only (no keys client-side)
- Consent banner required before analytics
- Email disclaimer in all transactional emails (platform is facilitator only)
- Refunds are vendor-managed (not auto-refunded)
