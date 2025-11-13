# Migration Strategy: Phase 5 (Current) → V1.1 (New)

**Date:** November 12, 2025  
**Context:** Shift from current MySQL + tRPC + Express project to Supabase + Next.js architecture

---

## Terminology (Clear)

| Term | Meaning | Location |
|------|---------|----------|
| **Phase 5 (Current)** | Existing project in workspace | `/Users/carlg/Documents/suburbmates/` |
| **V1.1 (New)** | New architecture + merged features | `/Users/carlg/Documents/suburbmates-v1.1/` (to create) |

---

## What You Have Now

### Phase 5 Project (Current - `/Documents/suburbmates/`)

**Status:** On branch `phase5-step2`

**Complete (Phase 1-4):**
- ✅ User authentication (OAuth via Manus)
- ✅ Business directory (ABN verified, listings)
- ✅ Marketplace (vendor upgrades, product listings, orders)
- ✅ Payments (Stripe integration)
- ✅ Database (13 tables, MySQL + Drizzle)

**In Progress (Phase 5):**
- 🚧 **Phase 5 Step 4:** Refund system (~80% complete)
  - Backend: 8 procedures (request, approve, reject, process, webhook)
  - Frontend: Components started, dashboard partial
  - Stripe refund integration: Working
  
- 🚧 **Phase 5 Step 5:** Dispute resolution (~20% complete)
  - Backend: Router stubbed, evidence handling, messaging
  - Frontend: UI minimal
  
- ⏳ **Phase 5 Step 6:** AI Automation (0% - not started)
  - OpenAI integration planned
  - Auto-categorization, dispute suggestions

**Tech Stack (Phase 5):**
- Frontend: React 19 + wouter + Tailwind + shadcn/ui
- Backend: Express 4 + tRPC 11 + Drizzle ORM
- Database: MySQL (hosted where?)
- Auth: Custom OAuth (Manus platform)
- Payments: Stripe ✅

**Code Quality:**
- tRPC provides end-to-end type safety
- Zod schemas for validation
- Modular routers (auth, business, vendor, etc.)
- ~40 procedures total

---

## What V1.1 Requires

### V1.1 Architecture (New - to build)

**Same Scope as Phase 5 + Simplified:**
- ✅ Directory (free entry, optional paid upgrade)
- ✅ Marketplace (products, orders, checkout)
- ✅ Payments (Stripe, Connect, refunds)
- ✅ **Phase 5 Features:**
  - ✅ Refunds (bring from Phase 5)
  - ✅ Disputes (bring from Phase 5)
- ✅ AI (chatbot-heavy support, Claude Haiku)
- ✅ Support (no SLAs, <1 hr/week founder load)

**Tech Stack (V1.1):**
- Frontend: React 19 + Next.js 14 App Router + Tailwind + shadcn/ui
- Backend: Next.js API Routes (serverless)
- Database: Supabase PostgreSQL + RLS
- Auth: Supabase Auth (JWT tokens, managed)
- Payments: Stripe ✅
- AI: Claude Haiku 3.5

**Key Differences from Phase 5:**
| Aspect | Phase 5 | V1.1 |
|--------|---------|------|
| Backend | Express + tRPC | Next.js API Routes |
| Database | MySQL | PostgreSQL (Supabase) |
| Auth | Custom OAuth | Supabase Auth |
| AI | OpenAI (24+ integrations) | Claude Haiku (5 critical) |
| Deployment | Custom Node.js | Vercel (auto git deploy) |
| Support Model | Tier-based SLAs | Chatbot-only, no SLAs |

---

## The Shift: Three Options

### Option A: Abandon Phase 5, Build V1.1 from Scratch ❌

```
Phase 5 (current)  → Archive
                        ↓
                   Start fresh V1.1
                        ↓
                   13 weeks to build
                   (MISS Dec 1 by 9 weeks)
```

**Pros:** Clean architecture, no legacy code  
**Cons:** Lose all Phase 5 work, miss deadline by 2+ months  
**Recommendation:** ❌ Don't do this

---

### Option B: Migrate Phase 5 to Supabase (Adapt) ❌

```
Phase 5 (current)
    ↓
MySQL → Supabase (data migration)
    ↓
Express + tRPC → ??? (incompatible with Vercel)
    ↓
8-10 weeks total
(MISS Dec 1 by 3-5 weeks)
```

**Pros:** Reuse most business logic  
**Cons:** tRPC doesn't work well with Vercel serverless, full rewrite anyway  
**Recommendation:** ❌ Not viable (architectural mismatch)

---

### Option C: Hybrid Approach (RECOMMENDED) ✅

```
Phase 5 (current)
    ├─ Extract: Stripe integration (100% reuse)
    ├─ Extract: Refund logic (85% reuse)
    ├─ Extract: Dispute logic (80% reuse)
    ├─ Extract: UI components (100% reuse)
    └─ Extract: Zod schemas (90% reuse)
         ↓
    Build V1.1 (fresh architecture)
         ├─ Adopt: Next.js + Supabase
         ├─ Paste: Refund procedures
         ├─ Paste: Dispute workflows
         ├─ Paste: Stripe webhook logic
         ├─ Paste: shadcn/ui components
         └─ Add: Claude AI + chatbot support
         ↓
    4.5 weeks to build
    (HIT Dec 1 deadline)
```

**Pros:** Reuse 60-70% of existing work, hit deadline, modern architecture  
**Cons:** Requires focused execution, no scope creep  
**Recommendation:** ✅ **This is the way**

---

## What Gets Reused from Phase 5

### 1. Stripe Integration (100% Reusable)
```typescript
// From: server/integrations/stripe.ts
// To: app/lib/stripe.ts

// Reuse entirely:
- Stripe client initialization
- Payment intent creation
- Connect account onboarding
- Webhook signature verification
- Refund processing logic
```

### 2. Refund Workflow (85% Reusable)
```typescript
// From: server/routers.ts → refund.*
// To: app/api/refunds/*

Reusable logic:
  ✅ Refund request validation (Zod schema)
  ✅ Stripe refund API calls
  ✅ Vendor approval/rejection workflow
  ✅ Refund status state machine
  ✅ Webhook handling for refund completion

Minor changes needed:
  ⚠️ Database queries (tRPC → Next.js)
  ⚠️ Auth middleware (Express → Next.js)
  ⚠️ Error handling (tRPC codes → HTTP codes)
```

### 3. Dispute Escalation (80% Reusable)
```typescript
// From: server/routers.ts → (implied from Phase 5 Step 5)
// To: app/api/disputes/*

Reusable logic:
  ✅ Dispute resolution state machine
  ✅ Admin decision-making workflow
  ✅ Evidence attachment handling
  ✅ Messaging/notification logic
  ✅ Chargeback risk assessment

Minor changes needed:
  ⚠️ Database schema (adjust for Supabase RLS)
  ⚠️ API contract (tRPC → REST)
```

### 4. UI Components (100% Reusable)
```typescript
// From: client/src/components/*
// To: app/components/*

Copy directly:
  ✅ shadcn/ui components (Button, Card, Dialog, Form, etc.)
  ✅ Form components (RefundForm, DisputeForm)
  ✅ Layouts (DashboardLayout, VendorLayout)
  ✅ Styling (Tailwind config)
  ✅ CSS variables & design tokens
```

### 5. Zod Schemas (90% Reusable)
```typescript
// From: server/routers.ts (input validation)
// To: app/lib/schemas.ts

Reuse:
  ✅ createBusinessSchema
  ✅ createProductSchema
  ✅ requestRefundSchema
  ✅ approveRefundSchema
  ✅ openDisputeSchema
```

### 6. React Hooks (70% Reusable)
```typescript
// From: client/src/_core/hooks/*
// To: app/hooks/*

Reuse patterns:
  ✅ useAuth() hook logic (adapt for Supabase)
  ✅ useMutation() patterns (migrate to React Query)
  ✅ useQuery() patterns (same React Query)
```

---

## What Doesn't Transfer (New in V1.1)

### 1. Architecture Foundation
- ❌ Express → Next.js API Routes (completely new)
- ❌ tRPC → REST API Routes (complete rewrite)
- ❌ MySQL → Supabase PostgreSQL (schema migration, RLS)
- ❌ Custom OAuth → Supabase Auth (managed auth)

### 2. Support Model (New)
- ❌ No SLAs/tiers → Chatbot-heavy (new system)
- ❌ No AI automation → Claude Haiku integration (new)
- ❌ No Sentry/error handling → Sentry read-only (new)

### 3. Deployment
- ❌ Custom Node.js → Vercel (serverless)
- ❌ Manual deployment → Git auto-deploy

---

## Step-by-Step Migration Plan

### Phase: Extract (Days -2 to 0)

**Goal:** Inventory what to reuse from Phase 5

#### 1. Audit Stripe Integration
```bash
# Location in Phase 5 project:
/Documents/suburbmates/server/integrations/stripe.ts

# What to copy:
- Stripe client initialization
- Payment intent creation helpers
- Connect account functions
- Webhook handlers
- Refund processing logic
```

**Deliverable:** `stripe-reuse.ts` (documented)

#### 2. Extract Refund Procedures
```bash
# Location in Phase 5 project:
/Documents/suburbmates/server/routers.ts
# Search for: refund.*

# What to copy:
- Request validation schemas
- Approval/rejection logic
- Stripe API integration
- Status tracking state machine
```

**Deliverable:** `refund-logic.ts` (documented, adapted)

#### 3. Extract Dispute Logic
```bash
# Location in Phase 5 project:
/Documents/suburbmates/server/routers.ts
# Search for: dispute.* (or in another router)

# What to copy:
- Escalation workflow
- Admin resolution logic
- Evidence handling
- Messaging patterns
```

**Deliverable:** `dispute-logic.ts` (documented, adapted)

#### 4. Export UI Components
```bash
# Location in Phase 5 project:
/Documents/suburbmates/client/src/components/ui/*

# What to copy:
- All shadcn/ui button, card, dialog, form, etc.
- Custom form components
- Layouts
```

**Deliverable:** `components/` folder (copy entire)

#### 5. Document Zod Schemas
```bash
# Location in Phase 5 project:
/Documents/suburbmates/server/routers.ts
# Extract all z.object() definitions

# What to copy:
- Business creation schema
- Product schema
- Refund request schema
- Dispute schema
```

**Deliverable:** `schemas.ts` (all schemas consolidated)

---

### Phase: Plan (Day 1)

**Goal:** Create V1.1 project structure with extracted code

#### 1. Create V1.1 Repository
```bash
mkdir -p /Users/carlg/Documents/suburbmates-v1.1
cd /Users/carlg/Documents/suburbmates-v1.1
git init
```

#### 2. Initialize Next.js 14
```bash
npx create-next-app@latest . --typescript --tailwind --app
```

#### 3. Paste Extracted Components
```bash
# Copy from Phase 5:
cp -r ../suburbmates/client/src/components/ui ./app/components/ui
cp ../suburbmates/client/src/const.ts ./app/const.ts
cp ../suburbmates/client/index.css ./app/globals.css
```

#### 4. Set Up Environment
```bash
# Create .env.local
NEXT_PUBLIC_SUPABASE_URL=<from Supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase>
STRIPE_SECRET_KEY=<from current Phase 5>
STRIPE_PUBLISHABLE_KEY=<from current Phase 5>
```

---

### Phase: Build V1.1 (Days 2-20)

#### Week 1: Foundation + Schema (Days 1-5)
- [ ] Supabase PostgreSQL setup
- [ ] Database schema (copy from V1.1_COMPLETE_SPEC.md)
- [ ] First API route working
- [ ] **Checkpoint:** Can run `npm run dev` locally?

#### Week 2: Core API (Days 6-10)
- [ ] Business CRUD endpoints
- [ ] Product CRUD endpoints
- [ ] Search/filter endpoints
- [ ] Paste Stripe integration
- [ ] **Checkpoint:** Can create business + products?

#### Week 3: Phase 5 Features (Days 11-15)
- [ ] Paste refund logic (from extracted code)
- [ ] Paste dispute logic (from extracted code)
- [ ] Stripe webhook handlers
- [ ] Test end-to-end refund flow
- [ ] **Checkpoint:** Can request + approve refund?

#### Week 4: AI + Deploy (Days 16-20)
- [ ] Claude Haiku integration
- [ ] Chatbot support endpoints
- [ ] Support chat widget (from extracted components)
- [ ] Final testing + Vercel deploy
- [ ] **Checkpoint:** December 1 launch ✅

---

## File Mapping: Phase 5 → V1.1

| Component | Phase 5 Location | V1.1 Location | Reuse % |
|-----------|-----------------|---------------|---------|
| **Stripe** | `server/integrations/stripe.ts` | `app/lib/stripe.ts` | 100% |
| **Refund logic** | `server/routers.ts` | `app/api/refunds/[id]/approve/route.ts` | 85% |
| **Dispute logic** | `server/routers.ts` | `app/api/disputes/[id]/resolve/route.ts` | 80% |
| **UI Components** | `client/src/components/ui/*` | `app/components/ui/*` | 100% |
| **Tailwind config** | `tailwind.config.ts` | `tailwind.config.ts` | 100% |
| **Zod schemas** | `server/routers.ts` | `app/lib/schemas.ts` | 90% |
| **Auth hook** | `client/src/_core/hooks/useAuth.ts` | `app/hooks/useAuth.ts` | 70% |
| **Forms** | `client/src/components/forms/*` | `app/components/forms/*` | 90% |
| **React Query** | `client/src/lib/trpc.ts` | `app/lib/queryClient.ts` | 80% |

---

## Risk Mitigation

### Risk 1: Refund Logic Doesn't Port Cleanly
**Mitigation:**
- [ ] Document all refund state transitions in Phase 5 first
- [ ] Create visual flowchart (pending → approved → processing → completed)
- [ ] Test ported logic with same test cases as Phase 5

### Risk 2: Stripe Integration Breaks
**Mitigation:**
- [ ] Test Stripe webhooks locally with `stripe listen` CLI
- [ ] Use Stripe API v same version (check Phase 5 package.json)
- [ ] Test with test card 4242 4242 4242 4242

### Risk 3: Data Loss During Migration
**Mitigation:**
- [ ] Export Phase 5 MySQL data to CSV first
- [ ] Validate row counts (MySQL vs Supabase)
- [ ] Compare foreign key integrity

### Risk 4: Timeline Slippage
**Mitigation:**
- [ ] Daily standups (15 mins)
- [ ] Day 5 checkpoint: No-go if major blocker
- [ ] Defer disputes to Phase 1.5 if needed (ship refunds only)

---

## Decision Points

### Today (Now)
**Decision:** Proceed with Hybrid Approach?
- ✅ YES → Start extraction phase
- ⏸️ MAYBE → Need clarity on Phase 5 status?
- ❌ NO → What's blocking?

### Day 5 (Infrastructure Checkpoint)
**Decision:** First API route working?
- ✅ GO → Proceed to Week 2
- 🟡 CAUTION → Fix and continue
- ❌ NO-GO → Defer to Dec 8 or Q1 2026

### Day 15 (Phase 5 Features Checkpoint)
**Decision:** Refunds + disputes ported successfully?
- ✅ GO → Proceed to AI + deploy
- 🟡 CAUTION → Defer disputes, ship refunds only
- ❌ NO-GO → Extend timeline to Dec 8

### Day 20 (Launch Checkpoint)
**Decision:** All systems tested, ready for production?
- ✅ GO → Deploy to Vercel, go-live December 1
- 🟡 CAUTION → Stage to Vercel Preview first, go-live Dec 2
- ❌ NO-GO → Contingency plan (defer features)

---

## Timeline Summary

```
NOW             Day 0   Extract Phase 5 code (Stripe, refunds, disputes, UI)
                        Create V1.1 project structure
                        
Week 1          Day 1-5 Infrastructure + Schema (Foundation checkpoint)
Week 2          Day 6-10 Marketplace API (Marketplace checkpoint)
Week 3          Day 11-15 Phase 5 Features (Refunds + Disputes checkpoint)
Week 4          Day 16-20 AI + Deploy (Launch checkpoint)

December 1      🚀 LIVE
```

---

## Success Definition

### V1.1 Ships with:
✅ User authentication (Supabase)  
✅ Business directory (free entry)  
✅ Marketplace (vendor upgrades)  
✅ Product listings + orders  
✅ **Stripe payments** (from Phase 5)  
✅ **Refund system** (from Phase 5)  
✅ **Dispute escalation** (from Phase 5)  
✅ Claude chatbot support  
✅ Deployed to Vercel + Supabase  

### Phase 5 Project:
📦 Archived for reference  
🔍 Used to extract code snippets  
📚 Kept for knowledge base  

---

## Next Steps

### Right Now (Next 30 mins)
1. [ ] Confirm: Proceed with Hybrid Approach?
2. [ ] Create: V1.1 project folder
3. [ ] Start: Code extraction from Phase 5

### Today (Next 4 hours)
1. [ ] Extract Stripe integration → document
2. [ ] Extract Refund procedures → document
3. [ ] Extract UI components → copy
4. [ ] List all Zod schemas → consolidate

### Tomorrow (Day 1)
1. [ ] Initialize V1.1 Next.js project
2. [ ] Paste extracted components
3. [ ] Start Week 1 infrastructure tasks

---

## Questions?

**"How do I extract Stripe from Phase 5?"**  
→ Open `/Documents/suburbmates/server/integrations/stripe.ts`, copy entire file, adapt imports for Next.js

**"What if refund logic is tightly coupled to tRPC?"**  
→ Extract business logic (refund state machine), separate from API transport layer

**"How do I handle Stripe webhook signatures changing?"**  
→ Use same Stripe API version, test locally with `stripe listen`, webhook signature verification is identical

**"Do I need to keep Phase 5 running?"**  
→ Yes, as reference. Once V1.1 ships and validates, Phase 5 can be archived.

---

**Ready to shift? Let's do this.** 🚀
