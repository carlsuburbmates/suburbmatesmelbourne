# 🩺 SuburbMates — SSOT Ambiguity Tracker (v 5.2 Companion)

**Purpose:**
Track and neutralize ambiguities or technical decisions that could cause drift, regressions, or misalignment with the authoritative **SSOT.md (v 5.2)**.
Each row must either be **resolved**, **documented**, or **verified** before Phase 6 implementation.

---

## 1. Architectural Ambiguities

|  #  | Area                 | Ambiguity / Risk                               | Required Action                                         | Owner            | Target Phase |
| :-: | -------------------- | ---------------------------------------------- | ------------------------------------------------------- | ---------------- | ------------ |
|  1  | Database engine      | Dual references to MySQL/TiDB vs Postgres.     | Confirm single engine; update Drizzle + `.env.example`. | Planner / DevOps | 5.2 → 5.3    |
|  2  | Stripe webhook model | Order vs Subscription webhooks share endpoint. | Split endpoints or tag events with metadata.            | Backend          | 5.2          |
|  3  | ABN cache layer      | Undefined storage (memory vs DB).              | Implement `abr_cache` table with TTL 24 h.              | Backend          | 5.3          |
|  4  | tRPC versioning      | Future router drift risk.                      | Introduce `/routers/v1/*`; freeze schemas after tag.    | Backend          | 5.3          |
|  5  | AI model choice      | Provider unspecified.                          | Lock model + parameters in `.env.example`.              | Planner          | 5.3          |
|  6  | PWA cache scope      | Risk of caching checkout/auth routes.          | Restrict SW scope to home/directory/profile only.       | Frontend         | 5.2          |

---

## 2. Codebase Integration Ambiguities

|  #  | Theme             | Ambiguity / Risk                               | Required Action                             | Owner    | Target |
| :-: | ----------------- | ---------------------------------------------- | ------------------------------------------- | -------- | ------ |
|  7  | Auth propagation  | Preview deployments need JWT fallback.         | Add JWT option in `/lib/auth.ts`.           | Backend  | 5.3    |
|  8  | Role guards       | Duplicated role checks across routers.         | Centralize in `actions/_guards.ts`.         | Backend  | 5.2    |
|  9  | Vendor upgrade UX | Free vs Featured unclear.                      | Two CTAs + discrete mutations.              | Frontend | 5.3    |
|  10 | Claim model       | Duplicate fields (`claimedByUserId` vs table). | Make table authoritative; update triggers.  | Backend  | 5.3    |
|  11 | Refund authority  | Admin override rules unclear.                  | Define state machine + docstring in router. | Backend  | 5.3    |

---

## 3. Governance & Deployment Ambiguities

|  #  | Area               | Ambiguity / Risk               | Required Action                            | Owner   | Target  |
| :-: | ------------------ | ------------------------------ | ------------------------------------------ | ------- | ------- |
|  12 | Branch naming      | Mixed conventions.             | Enforce `phase{n}-step{m}` pattern.        | Planner | Ongoing |
|  13 | Tag discipline     | Hotfix tags missing.           | Adopt semantic: `v5.1.x` for patches.      | DevOps  | 5.2     |
|  14 | QA doc versioning  | SSOT not linked to QA version. | Add "QA vX required for tag" line in SSOT. | Planner | 5.2     |
|  15 | Env parity         | Local ↔ Vercel drift.          | Add `/scripts/sync-env.mjs`.               | DevOps  | 5.3     |
|  16 | Analytics provider | Dual provider risk.            | Env flag `ANALYTICS_PROVIDER=posthog\|ga4`.| Backend | 5.2     |

---

## 4. Human / Process Ambiguities

|  #  | Aspect           | Ambiguity / Risk                   | Required Action                                             | Owner             | Target  |
| :-: | ---------------- | ---------------------------------- | ----------------------------------------------------------- | ----------------- | ------- |
|  17 | Copilot autonomy | May execute outdated phase.        | Add `readSSOTVersion()` pre-run check.                      | Planner / Copilot | 5.2     |
|  18 | QA ownership     | Sign-off unclear.                  | Add `QA_OWNER` field in plans.                              | Planner           | 5.2     |
|  19 | File naming      | Similar doc names cause confusion. | Prefix with phase/step (`PHASE_#_STEP#_…`).                 | Planner           | Ongoing |
|  20 | Audit logging    | Not enforced in tests.             | Add Playwright test validating `AuditLog.create` on writes. | QA / Backend      | 5.3     |

---

## 5. Long-Term Decisions to Finalize Before Phase 6

| Category        | Topic                                        | Decision Needed By |
| --------------- | -------------------------------------------- | ------------------ |
| Admin RBAC      | Enum vs granular permissions                 | 5.3                |
| Reporting       | Choose export libs (`pdfkit` / `csv-writer`) | 5.3                |
| Background Jobs | Vercel Cron vs self-hosted worker            | 5.3                |
| Campaign Emails | Platform sender vs vendor sender             | 6.0                |
| AI Logging      | Create `ai_logs` table schema                | 5.3                |
| Inventory Sync  | Stripe webhook decrement logic validation    | 5.2 (Phase 5 Step 2) |

---

## 6. Verification Summary

| Category      | Count |   Status   |
| ------------- | :---: | :--------: |
| Architectural |   6   |   🟡 Open  |
| Integration   |   5   |   🟡 Open  |
| Governance    |   5   |   🟡 Open  |
| Human/Process |   4   |   🟡 Open  |
| Long-Term     |   6   | 🟡 Planned |

All 26 items must reach **✅ Resolved** or **🧩 Documented exception** before **Phase 6 tag (v 6.0)**.

---

### Maintenance Rules

* Update this tracker whenever a new ambiguity is logged or resolved.
* Reference the corresponding commit or PR that closes each item.
* The SSOT remains the single source of policy; this tracker is only a mirror of its gray zones.
