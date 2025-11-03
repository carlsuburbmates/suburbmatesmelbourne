# Phase 1 Context and Dependency Analysis

**Project:** Suburbmates SSOT  
**Date:** 3 November 2025  
**Analysis Method:** Manual filesystem MCP inspection  
**Scope:** Backend codebase dependency mapping

---

## Dependency Graph Overview

### Core Modules

#### **server/\_core/** (Manus Platform Framework)

- `context.ts` - tRPC context with Supabase auth integration
- `oauth.ts` - OAuth callback handler for Manus platform
- `supabase.ts` - Supabase client and authentication
- `trpc.ts` - tRPC server setup with procedures
- `systemRouter.ts` - Manus system endpoints
- `cookies.ts` - Session cookie management
- `env.ts` - Environment variable configuration
- `dataApi.ts` - Consent logging with immutable hashes
- `notification.ts` - PostHog analytics tracking
- `llm.ts` - OpenAI API integration
- `index.ts` - Express server initialization

**Purpose:** Framework layer provided by Manus platform. **DO NOT MODIFY** without platform compatibility check.

---

### Application Modules

#### **server/routers.ts** (Main API Surface)

- **Dependencies:**
  - `@shared/const` - Shared constants (COOKIE_NAME)
  - `./db` - Database operations
  - `./_core/trpc` - tRPC procedures
  - `./_core/cookies` - Session management
  - `./_core/notification` - Analytics tracking
  - `./_core/dataApi` - Consent logging
  - `zod` - Input validation
  - `crypto` - Token generation

**Export:** `appRouter` type for end-to-end type safety

---

#### **server/db.ts** (Data Access Layer)

- **Dependencies:**
  - `drizzle-orm` - ORM operations (eq, and, desc, like, isNull)
  - `drizzle-orm/mysql2` - MySQL driver
  - `./drizzle/schema` - Type-safe schema definitions
  - `./_core/env` - Database connection string

**Functions:**

- User operations: `getUserByOpenId`, `upsertUser`
- Business operations: `searchBusinesses`, `getBusinessById`, `createBusiness`, `updateBusinessABN`
- Agreement operations: `createAgreement`, `getAgreementsByBusinessId`, `getLatestAgreement`
- Consent operations: `getConsentsByUserId`, `getUserConsentActions`
- Email token operations: `createEmailToken`, `getEmailToken`, `markEmailTokenAsUsed`
- Location operations: `getMelbournSuburbs`, `getMelbournSuburbByName`

---

#### **server/lib/abr.ts** (ABN Verification)

- **Dependencies:**
  - `axios` - HTTP client for SOAP API
  - `xml2js` - XML parser for ABR responses

**Purpose:** Integration with Australian Business Register SOAP API for ABN lookup

---

### External Integrations

#### **Supabase** (Authentication)

- Used by: `_core/supabase.ts`, `_core/oauth.ts`, `_core/context.ts`
- Purpose: OAuth authentication via Manus platform
- **Status:** ✅ Active (Manus OAuth flow)

#### **PostHog** (Analytics)

- Used by: `_core/notification.ts`
- Purpose: Track business creation events
- **Status:** ✅ Active via MCP

#### **OpenAI** (LLM)

- Used by: `_core/llm.ts`
- Purpose: Generate business descriptions
- **Status:** ⚠️ Requires API key

#### **Australian Business Register** (ABN Verification)

- Used by: `lib/abr.ts`
- Purpose: Verify ABN validity and business details
- **Status:** ⚠️ Requires ABR GUID key

---

## Import Analysis

### Shared Dependencies

- `@shared/const` - Constants shared between client/server
- `@shared/types` - Type definitions

### Core Dependencies

- `drizzle-orm` - Database ORM
- `@trpc/server` - tRPC framework
- `zod` - Schema validation
- `express` - HTTP server
- `mysql2` - MySQL database driver

### External Services

- `@supabase/supabase-js` - Supabase client
- `axios` - HTTP client
- `xml2js` - XML parser

---

## Unused Imports / Orphaned Code

### ✅ No Orphaned Code Detected

**Analysis:**

- All imports in `server/routers.ts` are actively used
- `server/db.ts` functions are called by routers
- `_core/*` modules are properly integrated
- External services have dedicated integration modules

### Potential Duplicate Utilities

**None detected** - No utility function duplication across modules

---

## Module Cohesion

### High Cohesion Modules ✅

- `server/db.ts` - Pure data access layer
- `server/lib/abr.ts` - Single-purpose ABN integration
- `server/routers.ts` - Clean tRPC router definitions

### Framework Separation ✅

- `server/_core/*` - Manus platform code (isolated)
- `server/routers.ts` + `server/db.ts` - Application code
- Clear boundary between platform and application logic

---

## Circular Dependency Check

### ✅ No Circular Dependencies Detected

**Import Flow:**

```
routers.ts → db.ts → schema.ts
         ↓
    _core/trpc.ts → context.ts → supabase.ts
         ↓
    _core/dataApi.ts → db.ts
```

**Note:** Clean unidirectional dependency flow

---

## Environment Variable Dependencies

### Required Variables

- `DATABASE_URL` - MySQL connection string
- `SUPABASE_URL` - Supabase project URL (Manus OAuth)
- `SUPABASE_ANON_KEY` - Supabase anon key
- `OPENAI_API_KEY` - OpenAI API key (optional for LLM)
- `ABR_GUID` - Australian Business Register GUID (optional for ABN)
- `POSTHOG_API_KEY` - PostHog project key (optional for analytics)

### Optional Variables

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (defaults to 3000-3020 auto-detect)

---

## File Structure Health

### ✅ Organized Directory Structure

```
server/
├── _core/           # Manus framework (8 files)
│   ├── context.ts   # Auth context
│   ├── trpc.ts      # tRPC setup
│   └── ...
├── lib/             # Integrations (1 file)
│   └── abr.ts       # ABN verification
├── routers.ts       # Main API (475 lines)
└── db.ts            # Data access (300+ lines)
```

**Metrics:**

- Total backend files: ~15
- Average file size: 200-400 lines
- Separation of concerns: ✅ Excellent
- Manus framework isolation: ✅ Complete

---

## Type Safety Analysis

### ✅ End-to-End Type Safety

**Schema → Database:**

- Drizzle ORM provides full type inference
- `$inferSelect` and `$inferInsert` types exported

**Database → API:**

- tRPC procedures use Zod for input validation
- Database return types flow through to API responses

**API → Client:**

- `AppRouter` type exported for client usage
- React Query hooks get full type inference

**Example:**

```typescript
// Schema
export type Business = typeof businesses.$inferSelect;

// API
business.getById: publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input }) => {
    return await db.getBusinessById(input.id); // Returns Business
  })

// Client (automatic)
const { data } = trpc.business.getById.useQuery({ id: 123 });
// data is typed as Business | undefined
```

---

## Security Analysis

### ✅ Secure Patterns Detected

**Authentication:**

- Supabase OAuth via Manus platform
- HTTP-only cookies for session tokens
- Protected procedures enforce authentication

**Authorization:**

- Role-based access control (business_owner, vendor, admin)
- Ownership verification for business operations
- IP address and user agent tracking in agreements

**Cryptography:**

- SHA-256 immutable hashes for consent logs
- 32-byte random tokens for email verification
- Secure cookie options (httpOnly, sameSite, secure)

**Input Validation:**

- Zod schemas on all tRPC inputs
- ABN format validation (11 characters)
- Email format validation
- URL validation for websites

---

## Performance Considerations

### ✅ Optimized Queries

**Indexes:**

- `businesses.ownerId` - Indexed for owner lookups
- `businesses.abn` - Indexed for ABN searches
- `businesses.suburb` - Indexed for geofencing
- `consents.userId` - Indexed for consent retrieval
- `consents.timestamp` - Indexed for audit trails

**Lazy Loading:**

- ABN verification module: Dynamic import
- LLM module: Dynamic import
- Reduces startup time

**Connection Pooling:**

- Lazy database connection via `getDb()`
- Allows dev tools to run without DB

---

## Migration Path Notes

### When Merging MVP Schema:

1. **Check for missing tables:**
   - Compare `schema_current.json` with MVP schema
   - Add missing tables (e.g., `listings`, `reviews`, `transactions`)

2. **Check for missing columns:**
   - Compare column lists per table
   - Add missing fields (e.g., `businesses.featured`, `users.stripeCustomerId`)

3. **Check for enum changes:**
   - Verify enum values match across schemas
   - Plan enum migrations if values differ

4. **Check for relation changes:**
   - Verify foreign keys align
   - Add missing relations

5. **Preserve immutable consent system:**
   - ⚠️ **DO NOT MODIFY** `consents` table structure
   - Current system uses immutable hashes for GDPR compliance
   - If MVP has different consent table, migrate data to new schema

---

## Phase 1 Verdict

### ✅ Current Backend Status: **CLEAN AND WELL-STRUCTURED**

**Strengths:**

- ✅ No circular dependencies
- ✅ No unused imports or orphaned code
- ✅ Clear separation between framework and application
- ✅ End-to-end type safety
- ✅ Secure authentication and authorization
- ✅ Optimized database queries with indexes
- ✅ Compliance-ready consent tracking

**Ready for Phase 2:** Schema Diff and Merge Planning

**Next Steps:**

1. Obtain MVP `drizzle/schema.ts` from Suburbmates 1
2. Run side-by-side comparison with `schema_current.json`
3. Identify missing tables, columns, and relations
4. Create migration plan for Phase 2
