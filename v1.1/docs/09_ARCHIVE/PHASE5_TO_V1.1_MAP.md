# Phase 5 → V1.1 Transition Map

**Date:** November 12, 2025  
**Purpose:** Visual clarity on current project (Phase 5) vs new project (V1.1)

---

## Two Projects, One Goal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CURRENT STATE (Now)                                │
└─────────────────────────────────────────────────────────────────────────────┘

Location: /Users/carlg/Documents/suburbmates/
Branch: phase5-step2
Status: On-going development

┌──────────────────────────────────────────────────────────────────────────────┐
│                            PHASE 5 PROJECT                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Tech Stack                          Status                                 │
│  ├─ Frontend: React 19               ✅ Phase 1-4: Complete                 │
│  ├─ Backend: Express + tRPC          🚧 Phase 5: In Progress                │
│  ├─ Database: MySQL + Drizzle                                              │
│  ├─ Auth: Custom OAuth (Manus)       Phase 5 Step 4: Refunds (~80%)        │
│  ├─ Payments: Stripe ✅              Phase 5 Step 5: Disputes (~20%)        │
│  ├─ Routing: wouter                  Phase 5 Step 6: AI (0%)               │
│  └─ Deployment: Custom Node.js                                             │
│                                                                              │
│  Key Code Assets                                                            │
│  ├─ server/integrations/stripe.ts    (Stripe integration - 100% reuse)      │
│  ├─ server/routers.ts                (Refund + dispute logic - 80% reuse)   │
│  ├─ client/src/components/ui/*       (shadcn/ui - 100% reuse)              │
│  ├─ client/src/_core/hooks/          (Hooks - 70% reuse)                   │
│  └─ (All Zod schemas - 90% reuse)                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
         │
         │  EXTRACT CODE
         │  ├─ Stripe integration
         │  ├─ Refund procedures
         │  ├─ Dispute logic
         │  ├─ UI components
         │  └─ Zod schemas
         │
         ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FUTURE STATE (Dec 1)                               │
└──────────────────────────────────────────────────────────────────────────────┘

Location: /Users/carlg/Documents/suburbmates-v1.1/ (to create)
Branch: main (new repo)
Status: Fresh build with reused components

┌──────────────────────────────────────────────────────────────────────────────┐
│                              V1.1 PROJECT                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Tech Stack                          Features                               │
│  ├─ Frontend: React 19 + Next.js    ✅ Directory (free entry)              │
│  ├─ Backend: Next.js API Routes    ✅ Marketplace (vendor upgrades)        │
│  ├─ Database: Supabase PostgreSQL  ✅ Products + Orders                   │
│  ├─ Auth: Supabase Auth (JWT)      ✅ Stripe Payments                     │
│  ├─ Payments: Stripe ✅ (from P5)   ✅ Refunds (from P5)                  │
│  ├─ Routing: Next.js App Router    ✅ Disputes (from P5)                 │
│  ├─ AI: Claude Haiku               ✅ Claude Chatbot Support              │
│  └─ Deployment: Vercel + Supabase                                          │
│                                                                              │
│  Reused Code (from Phase 5)                                                 │
│  ├─ app/lib/stripe.ts               (100% reuse)                           │
│  ├─ app/api/refunds/                (85% reuse)                            │
│  ├─ app/api/disputes/               (80% reuse)                            │
│  ├─ app/components/ui/*             (100% reuse)                           │
│  ├─ app/lib/schemas.ts              (90% reuse)                            │
│  └─ app/hooks/useAuth.ts            (70% reuse)                            │
│                                                                              │
│  New Code (V1.1 specific)                                                   │
│  ├─ app/api/* (all Next.js routes - fresh)                                │
│  ├─ Supabase migrations (PostgreSQL schema)                                │
│  ├─ RLS policies (row-level security)                                      │
│  ├─ Claude integration                                                      │
│  ├─ Support chatbot endpoints                                              │
│  └─ Vercel deployment config                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Project Comparison Matrix

| Aspect | Phase 5 (Current) | V1.1 (New) | Implication |
|--------|---|---|---|
| **Location** | `/Documents/suburbmates/` | `/Documents/suburbmates-v1.1/` | Separate repos |
| **Branch** | `phase5-step2` on main repo | `main` on new repo | Independent |
| **Database** | MySQL (unknown host) | Supabase PostgreSQL | Full migration |
| **Backend** | Express + tRPC | Next.js API Routes | Complete rewrite |
| **Frontend** | React + wouter | React + Next.js App Router | Routing changes |
| **Auth** | Custom OAuth (Manus) | Supabase Auth | New system |
| **Deployment** | Custom Node.js | Vercel | New platform |
| **Stripe** | ✅ Working | ✅ Copy from P5 | Direct reuse |
| **Refunds** | 🚧 80% done | ✅ Paste from P5 | 85% reuse |
| **Disputes** | 🚧 20% done | ✅ Paste from P5 | 80% reuse |
| **AI** | ❌ OpenAI (24+ auto) | ✅ Claude Haiku (5 critical) | Simplified |
| **Support SLAs** | ✅ Tiered, complex | ❌ Chatbot-only, no SLAs | Simpler model |
| **Timeline** | On-going | 4.5 weeks (Dec 1) | Aggressive sprint |

---

## What Happens to Phase 5?

### Option A: Keep Running (Reference)
```
Phase 5 continues in /Documents/suburbmates/
  ├─ Stay on phase5-step2 branch
  ├─ Used for code extraction + reference
  ├─ NOT deployed to production
  └─ Archived once V1.1 validated
```

### Option B: Archive (After V1.1 launches)
```
Phase 5 archived in /Documents/suburbmates-archive/
  ├─ Moved off main repo
  ├─ Kept for historical reference
  ├─ No longer active development
  └─ Available if V1.1 rollback needed
```

**Recommendation:** Keep Phase 5 accessible during V1.1 dev (reference), archive after Dec 15 (post-launch buffer).

---

## Extraction Checklist: Phase 5 → V1.1

### Code to Extract from Phase 5

- [ ] **Stripe Integration**
  - [ ] Location: `server/integrations/stripe.ts`
  - [ ] Copy to: `V1.1/app/lib/stripe.ts`
  - [ ] Reuse: 100%
  - [ ] Time: 1 hour

- [ ] **Refund Logic**
  - [ ] Location: `server/routers.ts` (search `refund.*`)
  - [ ] Copy to: `V1.1/app/api/refunds/`
  - [ ] Reuse: 85%
  - [ ] Adapt: Database queries, HTTP layer
  - [ ] Time: 4 hours

- [ ] **Dispute Logic**
  - [ ] Location: `server/routers.ts` (search `dispute.*`)
  - [ ] Copy to: `V1.1/app/api/disputes/`
  - [ ] Reuse: 80%
  - [ ] Adapt: Database queries, HTTP layer
  - [ ] Time: 4 hours

- [ ] **UI Components**
  - [ ] Location: `client/src/components/ui/*`
  - [ ] Copy to: `V1.1/app/components/ui/`
  - [ ] Reuse: 100%
  - [ ] Time: 30 mins

- [ ] **Zod Schemas**
  - [ ] Location: `server/routers.ts` (all `z.object()`)
  - [ ] Copy to: `V1.1/app/lib/schemas.ts`
  - [ ] Reuse: 90%
  - [ ] Time: 1 hour

- [ ] **Tailwind Config**
  - [ ] Location: `tailwind.config.ts`
  - [ ] Copy to: `V1.1/tailwind.config.ts`
  - [ ] Reuse: 100%
  - [ ] Time: 15 mins

- [ ] **React Hooks**
  - [ ] Location: `client/src/_core/hooks/*`
  - [ ] Copy to: `V1.1/app/hooks/`
  - [ ] Reuse: 70%
  - [ ] Adapt: Auth (Supabase), TanStack Query
  - [ ] Time: 2 hours

- [ ] **Form Components**
  - [ ] Location: `client/src/components/forms/*`
  - [ ] Copy to: `V1.1/app/components/forms/`
  - [ ] Reuse: 90%
  - [ ] Time: 1 hour

---

## Timeline: Parallel Development

```
NOW (Day 0)          Extract Phase 5 code into V1.1 structure
                     ├─ Stripe integration (1 hour)
                     ├─ UI components (30 mins)
                     ├─ Zod schemas (1 hour)
                     └─ Refund + dispute logic (outlined, not integrated yet)
                     
                     Phase 5 continues: Still on phase5-step2 branch
                     (No conflicts, separate repos)

Week 1 (Days 1-5)    V1.1 Infrastructure sprint
                     ├─ Supabase PostgreSQL + RLS
                     ├─ Next.js 14 scaffold
                     ├─ First API route
                     └─ Phase 5 → checkpoint day 5: No-go if blocked

Week 2 (Days 6-10)   V1.1 Marketplace API
                     ├─ Business, Products, Orders endpoints
                     ├─ Paste Stripe integration
                     └─ Phase 5 → continues in background (reference)

Week 3 (Days 11-15)  V1.1 Phase 5 Features
                     ├─ Integrate refund logic (from extracted code)
                     ├─ Integrate dispute logic (from extracted code)
                     ├─ Stripe webhook handlers
                     └─ Phase 5 → can be archived after code extracted

Week 4 (Days 16-20)  V1.1 AI + Deploy
                     ├─ Claude integration
                     ├─ Support chatbot
                     ├─ Final testing
                     └─ December 1: Go-live ✅

Dec 1-15            V1.1 in production
                     ├─ Monitor metrics
                     ├─ Fix critical bugs
                     ├─ Validate product-market fit
                     └─ Phase 5: Archive after validation

Dec 15+             Phase 5 fully archived
                     ├─ Moved to /Documents/suburbmates-archive/
                     ├─ Used for reference only
                     └─ Focus 100% on V1.1 scale
```

---

## Critical Decision Points

### Now: Approve the Shift?
**Question:** Ready to start V1.1 development while Phase 5 continues?

- ✅ **YES** → Proceed with extraction + parallel development
- ⏸️ **WAIT** → Need more time to assess Phase 5 status?
- ❌ **NO** → Continue Phase 5 only, defer V1.1 to Q1 2026?

---

### Day 5: Infrastructure Ready?
**Question:** First API route working in V1.1?

- ✅ **GO** → Proceed to marketplace API
- 🟡 **CAUTION** → Fix blockers, continue
- ❌ **NO-GO** → Pivot plan (defer features or timeline)

---

### Day 15: Phase 5 Features Integrated?
**Question:** Refunds + disputes working in V1.1?

- ✅ **GO** → Proceed to AI + deploy
- 🟡 **REFUNDS ONLY** → Defer disputes to Phase 1.5
- ❌ **NO-GO** → Extend to Dec 8 or roll back features

---

### Day 20: Production Ready?
**Question:** All systems tested, Vercel deployment ready?

- ✅ **LAUNCH** → Go-live December 1
- 🟡 **STAGING** → Stage to Preview, go-live Dec 2
- ❌ **HOLD** → Contingency plan (defer or scale back)

---

## Next Steps (Right Now)

1. **Confirm Direction**
   - [ ] Proceed with Hybrid Approach (extract from Phase 5)?
   - [ ] Yes → Go to step 2
   - [ ] No → What's the blocker?

2. **Plan Extraction**
   - [ ] Schedule 2-hour extraction session with codebase open
   - [ ] Document what's in Phase 5 (Stripe, refunds, disputes)
   - [ ] Create extraction checklist

3. **Set Up V1.1 Project**
   - [ ] Create `/Documents/suburbmates-v1.1/` folder
   - [ ] Initialize Next.js 14
   - [ ] Create git repo
   - [ ] Paste extracted code

4. **Week 1 Planning**
   - [ ] Book developer time (4.5 weeks full-time)
   - [ ] Set daily standup (10 AM, 15 mins)
   - [ ] Schedule checkpoints (Day 5, 15, 20)
   - [ ] Create Supabase + Vercel accounts

---

## Success Criteria

✅ **V1.1 Launches December 1 with:**
- All Phase 5 features (refunds, disputes)
- 60-70% reused code from Phase 5
- Modern Next.js + Supabase architecture
- Claude Haiku chatbot support
- <1 hr/week founder support ops

✅ **Phase 5 Project:**
- Code extracted and integrated into V1.1
- Archived for reference
- No data loss

✅ **Timeline:**
- 4.5 weeks (Dec 1 deadline)
- Daily standups + checkpoints
- No major blockers

---

**Ready to start?** 🚀
