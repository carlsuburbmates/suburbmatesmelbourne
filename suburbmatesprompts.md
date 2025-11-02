Here’s your **Suburbmates Enhancement Merge Plan** — integrating the best elements from `suburbmates2` into the main `suburbmates` project, ready for Copilot-assisted implementation in VS Code.

---

## 🧭 0. Overall Strategy

Keep **`suburbmates`** as the base branch (`main`).
Create separate **feature branches** for each enhancement; this lets Copilot work incrementally and keeps merges clean.
Each feature group below lists:

- Target branch name
- Files to create or modify
- Tasks and Copilot prompt you can paste into VS Code’s chat.

---

## 1. **ABN Verification Flow**

**Branch:** `feature/abn-verification`

### Files

```
server/lib/abr.ts                 ← new SOAP client
server/routers/business.ts        ← add submitABN mutation
server/_core/context.ts           ← expose abr helper
client/src/pages/BusinessProfile.tsx
client/src/pages/ListBusiness.tsx
client/src/components/ui/Badge.tsx
```

### Copilot prompt

```
@workspace Create lib/abr.ts using axios and xml2js to call the ABR SOAP endpoint
SearchByABNv202001. Cache results 24h in memory. Expose getABNDetails(abn: string).
Add tRPC mutation submitABN(abn) in server/routers/business.ts that updates abnVerifiedStatus.
Show verified badge in BusinessProfile.tsx.
```

### Outcome

Business verification badge shown for validated ABNs.

---

## 2. **AI Profile Builder**

**Branch:** `feature/ai-profile-builder`

### Files

```
server/_core/llm.ts               ← implement OpenAI call
client/src/components/AIChatBox.tsx
```

### Copilot prompt

```
@workspace Replace placeholder llm.ts with OpenAI API call using process.env.OPENAI_API_KEY.
Expose generateBusinessDescription(name, category).
In AIChatBox.tsx, add button "Generate Description with AI" that calls llm endpoint and fills textarea.
```

### Outcome

Vendors can auto-generate SEO descriptions for their listings.

---

## 3. **PWA + Offline Caching**

**Branch:** `feature/pwa`

### Files

```
public/manifest.json              ← new
public/icons/*                    ← add PWA icons
client/src/registerSW.ts          ← new
client/src/main.tsx               ← register service worker
vite.config.ts                    ← ensure service worker is included
```

### Copilot prompt

```
@workspace Add PWA support: create manifest.json with name "Suburbmates".
Generate registerSW.ts to register service-worker.js.
Add service-worker.js caching homepage, directory, profile pages.
Link manifest in index.html and register SW in main.tsx.
```

### Outcome

Offline mode and “Add to Home Screen” capability.

---

## 4. **Analytics + Monitoring**

**Branch:** `feature/analytics`

### Files

```
client/src/main.tsx
server/_core/notification.ts
```

### Copilot prompt

```
@workspace Initialize PostHog in main.tsx using process.env.NEXT_PUBLIC_POSTHOG_KEY.
Track page views and button clicks.
In notification.ts, add server-side hook to send event logs to PostHog API when new business created.
```

### Outcome

Analytics dashboard in PostHog; visibility into user behavior.

---

## 5. **Enhanced Design System**

**Branch:** `feature/design-enhancements`

### Files

```
client/src/index.css
client/src/components/ui/*        ← extend with Framer Motion transitions
client/src/components/ui/Button.tsx
```

### Copilot prompt

```
@workspace Update Tailwind theme colors to Forest Green (#2D5016), Emerald (#50C878), Gold (#FFD700).
Add subtle Framer Motion transitions to cards and modals.
Apply hover scale and fade-in for primary buttons.
```

### Outcome

Premium, responsive, motion-enhanced look and feel.

---

## 6. **Data Governance & Consent Logging**

**Branch:** `feature/compliance`

### Files

```
server/db.ts
server/_core/dataApi.ts
server/routers/consent.ts
```

### Copilot prompt

```
@workspace Extend Drizzle schema with consents table:
(id, userId, action, timestamp, immutableHash).
Add logConsent(userId, action) helper in dataApi.ts.
Create tRPC router consent.ts to record and fetch consents.
```

### Outcome

Audit-ready consent logs with immutable hashes.

---

## 7. **Testing & CI**

**Branch:** `feature/tests`

### Files

```
tests/auth.test.ts
tests/llm.test.ts
vitest.config.ts
```

### Copilot prompt

```
@workspace Add Vitest unit tests for Supabase Auth flow and llm.ts.
Use vitest.mock for network calls. Ensure tests run via pnpm test.
```

### Outcome

Baseline test coverage for new logic.

---

## 8. **Deployment Setup**

**Branch:** `feature/deploy-config`

### Files

```
vercel.json
render.yaml
.env.example
```

### Copilot prompt

```
@workspace Create vercel.json for frontend (Vite) and render.yaml for backend Node server.
Generate .env.example listing required keys.
```

### Outcome

One-click deploy to Vercel + Render.

---

## ✅ Final Merge Order

1. `feature/abn-verification`
2. `feature/ai-profile-builder`
3. `feature/pwa`
4. `feature/analytics`
5. `feature/design-enhancements`
6. `feature/compliance`
7. `feature/tests`
8. `feature/deploy-config`

Merge each branch into `main` after testing locally.
Run `pnpm dev` to confirm UI integrity before proceeding to the next.

---

Here’s your **Copilot Prompt Batch File** — a plain text script you can paste piece-by-piece into **Copilot Chat in VS Code**.
Each section builds one enhancement branch from the merge plan, in the right sequence.

---

## 🧾 COPILOT PROMPT BATCH FILE — _Suburbmates Enhancement Refactor_

_(copy one block at a time into Copilot Chat with “Context: Entire Workspace” enabled)_

---

### 🔹 1. ABN Verification Flow

```
# Branch: feature/abn-verification

@workspace Create lib/abr.ts using axios and xml2js.
Implement function getABNDetails(abn: string) that calls the Australian Business Register SOAP endpoint
(SearchByABNv202001). Cache responses in memory for 24 hours.

Add a new tRPC mutation submitABN(abn) in server/routers/business.ts that:
- Calls getABNDetails
- Updates abnVerifiedStatus in database
- Returns ABN details and status

Expose abr helper in server/_core/context.ts.
In client/src/pages/BusinessProfile.tsx and ListBusiness.tsx,
display a small "ABN Verified" badge when abnVerifiedStatus = 'verified'.
```

---

### 🔹 2. AI Profile Builder

```
# Branch: feature/ai-profile-builder

@workspace Replace placeholder llm.ts with OpenAI API call using process.env.OPENAI_API_KEY.
Add function generateBusinessDescription(name, category).

In AIChatBox.tsx:
- Add a button labeled "Generate Description with AI"
- When clicked, call the llm endpoint
- Insert the generated text into the description textarea
Show a toast message if generation fails.
```

---

### 🔹 3. Progressive Web App (PWA)

```
# Branch: feature/pwa

@workspace Create public/manifest.json with:
{
  "name": "Suburbmates",
  "short_name": "Suburbmates",
  "display": "standalone",
  "theme_color": "#2D5016",
  "background_color": "#ffffff",
  "start_url": "/",
  "icons": [{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" }]
}

Generate registerSW.ts in client/src to register service-worker.js.
Add service-worker.js with caching for index.html, CSS, JS, and /directory pages.
Link manifest in index.html and register service worker in main.tsx.
Ensure Vite build includes service worker.
```

---

### 🔹 4. Analytics + Monitoring

```
# Branch: feature/analytics

@workspace Initialize PostHog analytics.
In main.tsx, import posthog-js and initialize with process.env.VITE_POSTHOG_KEY.
Track route changes and button clicks.

In server/_core/notification.ts, add server-side function logEvent(type, data)
that sends JSON payloads to PostHog API endpoint using POST fetch.
```

---

### 🔹 5. Enhanced Design System

```
# Branch: feature/design-enhancements

@workspace Update Tailwind config and index.css:
- Add primary colors: Forest Green (#2D5016), Emerald (#50C878), Gold (#FFD700)
- Apply gradient backgrounds for hero sections
- Replace default button colors with the new palette

Add Framer Motion transitions:
- Animate cards and modals with fade-in and slight scale
- Animate hover states on Button.tsx

Review all components in components/ui and wrap key containers with motion.div.
```

---

### 🔹 6. Data Governance + Consent Logging

```
# Branch: feature/compliance

@workspace Extend Drizzle schema:
create table consents (
  id serial primary key,
  userId varchar(255),
  action text,
  timestamp timestamp default now(),
  immutableHash text
)

In server/_core/dataApi.ts, add helper logConsent(userId, action)
that computes sha256(action + timestamp) for immutableHash.

Create new tRPC router consent.ts exposing recordConsent(userId, action) and listConsents(userId).
Import router into main app router.
```

---

### 🔹 7. Testing & CI

```
# Branch: feature/tests

@workspace Add Vitest unit tests:
tests/auth.test.ts - mocks Supabase Auth and validates login flow.
tests/llm.test.ts - mocks OpenAI API and verifies response format.

Run with pnpm test. Ensure both suites pass.
```

---

### 🔹 8. Deployment Setup

```
# Branch: feature/deploy-config

@workspace Create vercel.json for frontend:
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite"
}

Create render.yaml for backend Node server:
services:
  - type: web
    name: suburbmates-api
    env: node
    buildCommand: "pnpm build"
    startCommand: "node dist/index.js"

Generate .env.example listing all environment variables:
DATABASE_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY, VITE_POSTHOG_KEY.
```

---

### 🧩 Usage Tip

After each accepted Copilot edit:

```bash
git add .
git commit -m "Applied Copilot enhancement: <feature>"
git push
```

---
