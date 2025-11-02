# Suburbmates - AI Coding Agent Instructions

## Workspace Context

**Active Project:** `suburbmates/` - This is our primary development project
**Reference:** `suburbmates2/` - Reference/backup project (read-only context)

**Context Setting:** Entire Workspace - AI agents have full visibility across both projects for reference and comparison, but active development occurs in `suburbmates/`.

## Project Overview

Suburbmates is a Melbourne hyper-local marketplace and business directory built on the **Manus platform**. This is a full-stack TypeScript application with a React frontend and Express backend, using tRPC for end-to-end type safety.

**Stack:** React 19, TypeScript, Express 4, tRPC 11, Drizzle ORM, MySQL, Tailwind CSS 4, shadcn/ui, wouter (routing)

**Package Manager:** pnpm with patches (see `patches/` directory for wouter modifications)

## Architecture & Key Patterns

### Monorepo Structure

- `client/` - React SPA with Vite
- `server/` - Express backend with tRPC API
- `drizzle/` - Database schema and migrations
- `shared/` - Shared constants and types between client/server

**Critical:** Use path aliases consistently:

- `@/` → `client/src/` (frontend only)
- `@shared/` → `shared/` (both frontend and backend)
- `@assets/` → `attached_assets/` (Manus platform assets)

### tRPC API Pattern

All API routes live in `server/routers.ts` using tRPC router pattern. The backend exports a single `appRouter` type that provides full type safety to the frontend.

**Example router structure:**

```typescript
export const appRouter = router({
  business: router({
    list: publicProcedure.input(z.object({...})).query(async ({ input }) => {...}),
    create: protectedProcedure.input(z.object({...})).mutation(async ({ ctx, input }) => {...}),
  }),
});
```

**Frontend usage:** Import `trpc` from `@/lib/trpc` and use React Query hooks:

```typescript
const { data, isLoading } = trpc.business.list.useQuery({ suburb: "Carlton" });
const createMutation = trpc.business.create.useMutation();
```

### Authentication Flow

**Backend:** Manus OAuth with passwordless email verification

- OAuth callback at `/api/oauth/callback` (see `server/_core/oauth.ts`)
- Session tokens stored in HTTP-only cookies (`COOKIE_NAME` from `@shared/const`)
- Context middleware in `server/_core/context.ts` authenticates requests via `sdk.authenticateRequest()`

**Frontend:** `useAuth()` hook from `@/_core/hooks/useAuth.ts`

- Returns `{ user, loading, error, isAuthenticated, logout }`
- Auto-redirects to login on 401 errors via global QueryClient error handler in `client/src/main.tsx`

**Procedures:**

- `publicProcedure` - No auth required
- `protectedProcedure` - Requires authenticated user (throws UNAUTHORIZED)
- `adminProcedure` - Requires admin role (throws FORBIDDEN)

### Database with Drizzle ORM

**Schema:** `drizzle/schema.ts` defines all tables with camelCase columns

- Core tables: `users`, `businesses`, `agreements`, `consents`, `emailTokens`, `melbournSuburbs`
- User roles: `"user" | "admin" | "buyer" | "business_owner" | "vendor"`
- Business verification: `abnVerifiedStatus` enum tracks ABN verification state
- **Melbourne-specific:** `melbournSuburbs` table provides geofencing data with latitude/longitude for local marketplace functionality

**Database functions:** `server/db.ts` exports query functions like:

- `getUserByOpenId()`, `upsertUser()`
- `getBusinessById()`, `searchBusinesses()`, `createBusiness()`
- `getMelbournSuburbs()`, `getMelbournSuburbByName()` - for location-based features

**Migrations:** Run `pnpm db:push` to generate and apply schema changes (runs `drizzle-kit generate && drizzle-kit migrate`)

**Connection:** Lazy database connection initialization via `getDb()` allows local tooling to run without DB

### Development Workflow

**Commands:**

- `pnpm dev` - Start dev server with HMR (tsx watch mode)
- `pnpm build` - Production build (Vite + esbuild bundle)
- `pnpm start` - Run production server
- `pnpm check` - TypeScript type checking
- `pnpm db:push` - Generate and apply database migrations

**Dev server:** `server/_core/index.ts` auto-finds available port (3000-3020), serves Vite dev server in development, static files in production

## Project-Specific Conventions

### UI Components

All UI components from shadcn/ui live in `client/src/components/ui/`. These are Radix UI primitives styled with Tailwind CSS.

**Pattern:** Import from `@/components/ui/<component-name>`, use composition:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

**Styling:** Use `cn()` utility from `@/lib/utils` for conditional classes:

```tsx
<div className={cn("base-classes", condition && "conditional-classes")} />
```

### Routing

Uses `wouter` (not React Router) with custom patches. Define routes in `client/src/App.tsx`:

```tsx
<Route path="/business/:id" component={BusinessProfile} />
```

Navigate with `<Link href="/path">` or `useLocation()` hook.

**Important:** The project uses a patched version of wouter (`patches/wouter@3.7.1.patch`) that exposes route paths to `window.__WOUTER_ROUTES__` for debugging/tooling purposes.

### Error Handling

- tRPC errors use standard codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`
- Global error boundaries in `client/src/components/ErrorBoundary.tsx`
- Unauthorized requests auto-redirect to Manus OAuth login (see `main.tsx`)

### Environment Variables

Backend requires `DATABASE_URL` for MySQL connection. Frontend uses Vite env vars prefixed with `VITE_`:

- `VITE_APP_TITLE` - App display name
- `VITE_APP_LOGO` - Logo URL
- `VITE_OAUTH_PORTAL_URL` - Manus OAuth portal
- `VITE_APP_ID` - Manus app identifier

### Manus Platform Integration

This project runs on the Manus platform, which provides:

- Built-in OAuth authentication (`server/_core/sdk.ts`)
- Vite plugin runtime features (`vite-plugin-manus-runtime`)
- System router utilities (`server/_core/systemRouter.ts`)

**Important:** The `server/_core/` directory contains Manus framework code. Avoid modifying these files unless extending platform functionality.

### AI Agent Autonomy Configuration

This workspace is configured for **full AI agent autonomy** with MCP Desktop Commander:

**Autonomous Operations Enabled:**

- **File System Access:** Read/write files throughout entire home directory (`/Users/carlg/`)
- **Terminal Operations:** Execute ALL commands without restrictions (`blockedCommands: []`)
- **Process Management:** Start/stop development servers, background processes
- **Database Operations:** Run migrations, queries, schema modifications via `pnpm db:push`
- **Git Operations:** Commit, push, pull, branch management autonomously
- **Package Management:** Install/update dependencies, manage lockfiles

**Key Autonomous Workflows:**

- Start development server: `pnpm dev` (auto-finds available port 3000-3020)
- Database migrations: `pnpm db:push` (generates and applies schema changes)
- Type checking: `pnpm check` (validates TypeScript across monorepo)
- Build production: `pnpm build` (Vite + esbuild bundle)

**VS Code Integration:**

- `.vscode/tasks.json` provides quick access to common commands
- `.vscode/launch.json` enables debugging of backend processes
- Path aliases configured for IntelliSense (`@/`, `@shared/`, `@assets/`)

Agents can autonomously modify code, run tests, apply database changes, and manage the full development lifecycle.

## Current Development Phase

**Phase 1 (Foundation)** - In progress, see `todo.md`:

- ✅ Core data models, authentication, business directory
- ✅ UI/UX with shadcn/ui components
- 🚧 ABN verification integration pending

**Phase 2 (Marketplace)** - Planned:

- Vendor features, listings, reviews, payments via Stripe

**Phase 3 (Post-Transaction)** - Planned:

- Refunds, disputes, AI automation

## Key Files Reference

- **Entry points:** `server/_core/index.ts`, `client/src/main.tsx`
- **API routes:** `server/routers.ts`
- **Database schema:** `drizzle/schema.ts`
- **Database queries:** `server/db.ts`
- **Auth context:** `server/_core/context.ts`
- **Frontend auth:** `client/src/_core/hooks/useAuth.ts`
- **Routing:** `client/src/App.tsx`
- **tRPC client:** `client/src/lib/trpc.ts`

## Common Tasks

**Add a new API endpoint:**

1. Add procedure to appropriate router in `server/routers.ts`
2. Define Zod input schema if needed
3. Use `publicProcedure`, `protectedProcedure`, or `adminProcedure`
4. Access authenticated user via `ctx.user` in protected procedures
5. Frontend gets instant type safety via `trpc.<router>.<procedure>.useQuery/useMutation()`

**Add a new database table:**

1. Define table in `drizzle/schema.ts` with foreign keys and indexes
2. Export TypeScript types: `export type TableName = typeof tableName.$inferSelect`
3. Add query functions in `server/db.ts`
4. Run `pnpm db:push` to migrate

**Add a new page:**

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Use `useAuth()` if authentication required
4. Fetch data with tRPC hooks

**Style a component:**
Use Tailwind utility classes. For custom design tokens, check `vite.config.ts` and Tailwind config. The project uses mobile-first responsive design with smooth animations.
