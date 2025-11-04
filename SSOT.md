Locked in.
Below is the **SSOT (Single Source of Truth)** for Suburbmates going forward.

This document is now the source of authority for:

- design system
- tools and stack
- what codebase we trust
- what survives and what gets deleted
- the exact merge phases (in order)
- what must be verified at each phase before we’re allowed to move

If we deviate from this, we introduce chaos. So we don’t.

---

## 0. Canonical Context

We are merging 3 historical codebases into 1 active codebase:

1. **`suburbmatesmelbourne` (Copilot repo on GitHub)**
   - This is the working base we just pulled into GitHub.
   - React + Tailwind + Framer Motion + tRPC + Drizzle + MySQL.
   - Has UI pages like `Home`, `Directory`, `BusinessProfile`, `ListBusiness`, login/auth screens, vendor flow.
   - Uses our newer design system (forest green / emerald / gold), mobile-first, animated, vendor CTA, verified badge concept.
   - Has tRPC, Drizzle, role-based business creation, consent logging, ABN verification flow, Melbourne suburb/postcode dataset, and analytics hooks.

   **This is our BASELINE.**
   Everything else gets merged _into this_.
   We do not “replace” this repo with older code.

2. **`suburbmates` (original MVP zip)**
   - Contains the original functional backend logic and data model.
   - Has working flows: business creation, consent logging, agreements, geofencing via postcodes, ABN verification plan, role model (`buyer`, `business_owner`, `vendor`, `admin`).
   - This version is where core logic was first working end-to-end.
   - Less polished UI.

   We treat this as: **canonical source of truth for backend behaviour and schema.**

3. **`suburbmates2` (partial / PWA / AI zip)**
   - Started layering PWA (manifest + service worker), AI description generator UI, AI suburb/autocomplete, some vendor UX ideas.
   - Also started “Stripe, marketplace, dashboard” but did not finish them.
   - Incomplete. Some parts are broken.

   We treat this as: **a donor for specific completed features only.**
   Nothing comes in wholesale.

4. **`suburbmates-deepagent` (deepagent zip)**
   - Adds autonomous/agentic workflows and Manus platform integration concepts (task automation, “agent does things for vendor”, etc.).
   - Includes platform-locked assumptions (Manus auth sessions, Manus file store, Manus dashboards).

   We treat this as: **reference only**.
   We do NOT directly import any Manus-dependent code until we’ve wrapped it in neutral abstractions (because Manus-specific code will break portability).

---

### Rule of Rules

- The only active codebase is `suburbmatesmelbourne` (the Copilot repo).
- We never “switch base” midstream.
- We only merge _into_ that codebase in controlled phases.
- After every phase we must re-run the app locally and verify it by hand.

This protects us from losing working behaviour.

---

## 1. Canonical Design System (Frozen)

This is permanently our design language unless we explicitly update this SSOT.

**Colors / Tone**

- Dark forest green as primary surface/accent
- Emerald highlight / success state
- Gold / warm accent for trust badges and CTA highlights
- Neutral greys/charcoal for text and borders
  (This matches what was implemented in the Copilot repo and discussed in campaign enhancement notes.)

**Typography**

- Modern sans (we’ve been using Inter-style system)
- Strong weight for headings and CTA
- High contrast, large tap targets on mobile

**Components**

- All UI components from `suburbmatesmelbourne` under `client/src/components/ui/*` are canonical:
  - Buttons, Cards, Inputs, Badges, Modals, Banners, Skeletons, etc.
  - Framer Motion is allowed for micro-interactions and subtle motion.
  - Radix / shadcn-style primitives drive consistency (menus, dialogs, popovers).

**Layout**

- Mobile-first. Everything must render comfortably on phone first.
- Card grids for directory.
- Vendor CTA surfaces early, not buried.

**Badges / Trust Indicators**

- “ABN Verified” badge styling from the Copilot repo is canonical.
- We must keep surfaces that reassure end users (this is core to Suburbmates’ pitch: “legit local businesses”).

**Consent / Compliance UI**

- The consent/privacy banner from the Copilot repo is canonical.
- If older code has different consent UX, we ignore it.

**What we reject**

- Random inline styles from older versions.
- Any dashboard / vendor view that does not match this system.
- Any pre-shadcn component set from `suburbmates2` that doesn’t meet polish or accessibility.

Lock: the Copilot repo design system is now the master.
We are not letting older UI overwrite it.

---

## 2. Canonical Tooling / Stack (Frozen)

This is the tech stack going forward. If older code does not align, it gets adapted or dropped.

**Frontend**

- React (as in Copilot repo)
- Vite build
- Tailwind + our tokens
- Framer Motion for animation
- shadcn/Radix component primitives
- Wouter or similar lightweight router if that’s what the Copilot repo uses (we keep whatever the repo uses for routing now)

**Backend**

- Node/Express server
- tRPC for all app-facing API procedures
- Drizzle ORM for database access and migrations
- MySQL / TiDB-compatible SQL schema
- Consent logging, ABN verification, and postcode filtering logic live in server code — not in client

**Auth**

- Passwordless / session-cookie auth that is already in `suburbmatesmelbourne`
- Role model is: `buyer` (default), `business_owner`, `vendor`, `admin`
- No Supabase auth, no Manus auth UI components in production build unless we explicitly wrap them
- If legacy code calls Supabase or Manus tokens directly, that code is not allowed to ship as-is

**AI**

- Server-side OpenAI calls via a tRPC mutation for:
  - business description generator

- AI logic always runs server-side, never exposes raw API key in the client

**PWA**

- Web App Manifest
- Service Worker
- Offline cache for core routes
- Add-to-home-screen readiness

We will adopt PWA pieces from `suburbmates2` if they are technically sound and standalone (manifest.json, service worker registration). If any of that code assumes a different build setup, we adapt it to match the Copilot repo’s Vite pipeline.

**Analytics**

- We keep what’s already wired in the Copilot repo:
  - Event tracking on important flows (e.g. business created)
  - Page analytics script

- We do not activate a second analytics path from older code unless we unify them. No double analytics.
- Consent gating applies to analytics.

**Testing**

- Vitest for unit tests and smoke tests.
- We accept server-side tests from DeepAgent or MVP **only if** they run under Vitest without rewriting half the stack. Otherwise they get rewritten.

**Forbidden without abstraction**

- Manus “agents” that assume Manus runtime
- Manus file storage calls
- Manus dashboard components that render internal Manus panels
- Supabase magic-link login flows from much older code if they conflict with the now-active passwordless flow

Lock: this is the tooling contract.
Anything coming from other zips must conform to this toolchain.

---

## 3. Phase Plan (This is the execution order. Non-negotiable.)

Each phase ends with a verification checklist.
If verification fails, we are not allowed to continue.

We work in branches. We never touch `main`/`stable` until a phase’s branch passes verification.

### Phase 0. Baseline Lock

**Goal:** Confirm that `suburbmatesmelbourne` is runnable and visually correct. This becomes `main`.

**Inputs:**

- The GitHub repo (`suburbmatesmelbourne`).

**Actions:**

1. Run the project locally.
2. Load core routes:
   - `/` (home / landing)
   - `/directory`
   - `/business/:id`
   - login / auth screen
   - “add your business” flow (wherever that lives in current routing)

3. Visually confirm:
   - Tailwind theme (forest/emerald/gold) is applied.
   - Cards, trust badge surfaces, vendor CTA visible.
   - Consent banner / compliance element exists.

4. Confirm no runtime crashes in console.
5. Confirm tRPC client calls succeed (even if they’re mocked or hitting a dev server).
6. Confirm Drizzle schema is present and migrations don’t throw at boot.

**What stays after Phase 0:**

- All code from `suburbmatesmelbourne` that successfully ran.
- Its design system and component library. This is our canonical UI layer.

**What is explicitly not imported yet:**

- No code from MVP zip.
- No code from Suburbmates2.
- No code from DeepAgent.

**Verification gate (must all be true):**

- App boots locally without fatal errors.
- We can navigate through the main screens without white screens or crashes.
- The theme matches the locked design system.
- We have working role model in code (buyer/vendor/admin is defined in the codebase even if we haven’t tested the full flow yet).

If any of those fail: fix locally in the baseline branch until they pass.
We do not continue until this is green.

---

### Phase 1. Backend & Schema Alignment (import from original MVP)

**Goal:** Bring over backend logic and database structure from the MVP zip (the one that had working agreements, consents, ABN verification plan, postcode seeding). We strengthen the Copilot repo’s backend using MVP’s proven logic.

**Inputs:**

- `suburbmates` (original MVP zip)

**Actions:**

1. Diff Drizzle schema in `suburbmatesmelbourne` vs schema/tables from MVP:
   - `users`
   - `businesses`
   - `agreements`
   - `consents`
   - `melbourne_postcodes` (or equivalent postcode table)
   - `vendors_meta`

2. For any table/column that exists in MVP but is missing in Copilot:
   - Add it to Drizzle schema in the Copilot repo format.
   - Write or update migration so Drizzle can create it.

3. For any critical server logic from MVP that isn’t in Copilot yet (examples we know exist from prior analysis):
   - ABN verification flow (business.submitABN mutation and ABR client util).
   - Consent logging / immutable consent event trail.
   - Agreements/terms tracking for vendors.
   - Business creation guardrails (role check, audit/event tracking).
     Add these into Copilot repo’s `server` code as tRPC procedures and helpers.
     Everything must use tRPC + Drizzle style already in Copilot repo.

4. DO NOT copy any frontend from MVP in this phase. Phase 1 is backend/schema only.

**What stays after Phase 1:**

- Copilot repo’s UI (untouched).
- Copilot repo’s server code, now enhanced with:
  - robust role-aware business creation
  - ABN verification mutation
  - consent logging router/utilities
  - postcode-aware filtering

**What gets rejected:**

- Any REST endpoints or raw SQL from MVP that bypass tRPC or Drizzle. They do not get merged unless refactored.
- Any auth flow from MVP that contradicts the Copilot repo’s current login/session (for example, older Supabase/Manus shortcuts).

**Verification gate (must all be true):**

- The app still boots after schema changes.
- Migrations run without error on a local DB.
- We can call (in dev) the tRPC endpoints:
  - list businesses
  - create business
  - submit ABN
  - log consent
    without runtime crashes.

- Business objects in the DB now include ABN + verification status and location/suburb info.

If something breaks (like Drizzle fails to compile, or tRPC can’t find types), Phase 1 is not done.
We fix it in the Phase 1 branch until those behaviours work.

We do not move to Phase 2 until Phase 1 verifies.

---

### Phase 2. PWA + AI Surface (import selectively from Suburbmates2)

**Goal:** Add high-value “wow” features that are largely standalone:

- AI business description generator (for vendors creating a listing)
- PWA install/offline capability (manifest + service worker)
- suburb autocomplete / geofence assist if that logic is available and clean

We do NOT import half-built dashboards or marketplace stubs from Suburbmates2 here.

**Inputs:**

- `suburbmates2` zip

**Actions:**

1. AI Business Description:
   - Identify the client component in `suburbmates2` that lets a vendor click “Generate Description”.
   - Wire it to the server-side AI tRPC mutation that already exists / that we added in Phase 1 if missing.
   - The AI button becomes part of the existing “create / edit business” UI in our Copilot repo.
   - The AI call runs server-side. The client never directly hits OpenAI.

2. PWA:
   - Bring in `manifest.json` and `service worker` from Suburbmates2.
   - Adapt them to our current build (Vite + current file paths).
   - Register the service worker in the Copilot repo client entrypoint.
   - Confirm offline cache of the home/directory/profile pages works without throwing.

3. Suburb / Postcode Suggest:
   - If Suburbmates2 shipped a usable client-side autocomplete for suburb/postcode field, and it doesn’t conflict with what we already have:
     - Integrate it into the “Add business” and “Search directory” forms.
     - It must use our existing Melbourne suburb/postcode dataset from Phase 1.

We do not merge:

- unfinished payment dashboards
- half-implemented vendor dashboards that clash with our design system
- any broken navigation that duplicates pages we already have

**What stays after Phase 2:**

- The Copilot repo UI remains visually consistent
- “Add Business” form now has:
  - AI “Generate Description” button
  - possibly postcode/suburb smart assist

- The app is PWA-capable (manifest present, service worker registered, offline works for cached pages)

**What is rejected:**

- Any UI shells from Suburbmates2 that ignore the design system (wrong colors/components/layout)
- Any marketplace/payment code that isn’t production-ready

**Verification gate (must all be true):**

- App builds and runs and still looks like Suburbmates (design system intact)
- Service worker is registered in dev or preview build without runtime exceptions
- `manifest.json` is valid and browser recognizes installability
- AI “Generate Description” actually returns text and inserts into the listing form without error
- No duplication of analytics / no double consent banners

If PWA or AI integration destabilizes routing or crashes the app, Phase 2 is not complete.

We do not move to Phase 3 until Phase 2 verifies.

---

### Phase 3. DeepAgent / Agentic Layer (guarded integration)

**Goal:** Carefully introduce the “agentic / autonomous helper” concepts from `suburbmates-deepagent` _without_ importing Manus lock-in or breaking portability.

DeepAgent is the riskiest. We assume:

- It contains logic like “after vendor creates a listing, automatically do X for them”
- It assumes Manus infra (auth, file store, automations)

We only accept logic that:

- runs inside our server
- does not depend on a proprietary Manus runtime call
- does not force us to change auth/storage stack immediately

**Inputs:**

- `suburbmates-deepagent` zip

**Actions:**

1. Identify any post-create vendor workflows that are pure logic (e.g. auto-generate onboarding checklist, auto-scan listing quality, auto-summarize listing for marketing).
   - These can become server-side utilities triggered after `business.create` succeeds.
   - They must log actions internally (for example, write an event record) rather than calling Manus “tasks”.

2. Any code that attempts to hit Manus API endpoints, Manus agent runtime, Manus “workflows”, or Manus storage:
   - That code is quarantined in a new folder like `server/agents/drafts/` for reference.
   - It is not executed in production.
   - We wrap it in feature flags or leave it disabled, but we keep it for future reference.

3. Any UI surfaces from DeepAgent (for example, “Your AI Assistant is setting up your listing...”):
   - We can bring in the _concept_, but we must restyle it using our current design system.
   - That UI must not show Manus branding or Manus buttons.

4. We do not alter auth in this phase. We stay with the Copilot repo’s auth (Phase 0/1).
   We do not introduce a new provider unless we explicitly decide to in a later governance update.

**What stays after Phase 3:**

- We gain post-action intelligence: things like “after you submit your business, the system prepares your marketing blurb / compliance checklist automatically.”
- We keep an internal structure for background helpers, but LOCAL to our code.

**What is rejected:**

- Direct Manus integration points (auth calls, file storage linked to Manus, Manus-managed dashboards)
- Any code that forces us to depend on Manus to run locally

**Verification gate (must all be true):**

- App still boots, runs, and allows business creation.
- After business creation, any new helper logic runs without throwing (or is feature-flagged off cleanly).
- No runtime reference to Manus-only services that would crash outside Manus.
- No new UI breaks the design system.

If any DeepAgent import forces Manus coupling or breaks portability, that code is not merged.

---

### Phase 4. Hard Merge / Reconciliation

**Goal:** Bring all passing phases together into `main` (our golden branch), with documentation.

**Actions:**

1. Merge Phase 1 branch into `main`.
2. Merge Phase 2 branch into `main`.
3. Merge Phase 3 branch into `main`.
4. Resolve conflicts file-by-file, never by “accept both blindly”.
5. Update README:
   - Architecture (React + Vite + Tailwind + tRPC + Drizzle)
   - Feature set (Directory, Vendor listing, ABN verify, PWA offline, AI description, Consent logging)
   - Deployment notes
   - Role model
   - Where future marketplace lives

6. Add `.env.example` that lists required secrets (DB URL, OpenAI key, ABR key, analytics key).
   No secrets hardcoded.

**What stays after Phase 4:**

- Final unified Suburbmates app:
  - Strong backend from MVP
  - Polished UI + ABN verify + compliance + analytics from Copilot repo
  - PWA + AI vendor helpers from Suburbmates2
  - Agentic post-actions (as portable logic) from DeepAgent

- Clean design system
- Clean stack
- Working local deploy story

**What is rejected permanently:**

- Any legacy view that violates the design system
- Any old auth that bypasses our passwordless+role scheme
- Any Manus-only dependency that cannot run locally
- Any Stripe/marketplace dashboard that was never finished and would just add dead code

**Verification gate (must all be true):**

- Local run is stable
- PWA manifest valid
- AI description works
- ABN verification still works
- Consent logging still works
- No Manus hard dependency in runtime
- No TODO stubs in production paths that crash if clicked

Only then do we call this app “merged."

---

## 4. Allowed vs Not Allowed (Global Guardrails)

**Allowed**

- Importing logic from older zips IF it is adapted to:
  - Drizzle ORM
  - tRPC
  - current auth roles
  - current design system

- Adding new server helpers that run locally with no Manus dependency.

- Adding UI that fits our Tailwind/shadcn/Framer style and respects mobile-first.

**Not Allowed**

- Dropping in whole folders from old zips without review.
- Reintroducing competing design systems.
- Shipping two analytics systems at once without consent gating.
- Downgrading auth to some older mechanism that isn’t in current code.
- Copying Manus-only codepaths that assume their runtime.

---

## 5. Why This Plan Is Safe (and why we’re freezing it)

- Phase 0 locks the working Copilot repo as reality. We confirm it runs and visually matches what we want to ship. That becomes ground truth.
- Phase 1 imports ONLY data model + backend logic we know is proven (ABN, consent, roles, postcodes). Nothing UI yet. Schema first, because schema changes later are painful.
- Phase 2 adds high-value features that are mostly additive and self-contained (PWA, AI assist). We do this after backend is stable, so AI has endpoints to talk to.
- Phase 3 pulls the DeepAgent “smart assistant” ideas in a controlled, sandboxed way, not breaking portability.
- Phase 4 is the reconciliation checkpoint. Nothing merges to main until all verification gates are green.

That sequence prevents:

- design drift
- auth drift
- analytics drift
- Manus lock-in leaking into our local build
- premature marketplace features that aren’t ready

This is the SSOT.
All further work must reference this document and prove it does not violate:

1. the canonical design system,
2. the canonical tool/stack contract,
3. the phase order,
4. the phase verification gates.

If something proposed doesn’t fit, it does not ship.
