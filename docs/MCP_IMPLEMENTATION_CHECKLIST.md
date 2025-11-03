# 🧩 MCP Free Implementation Plan for Suburbmates

This document defines the **free, open-source MCP stack** for the Suburbmates SSOT. It ensures all workflow automation, testing, and governance tools operate locally without paid APIs or proprietary dependencies.

---

## 🎯 Objectives

- 100% open-source and offline-compatible.
- Zero vendor lock-in (no Manus, no SaaS).
- Seamless alignment with SSOT Phases 0–4.
- Compatible with Claude Desktop, VS Code, and Copilot.

---

## 🧱 Core Stack (All Free)

| Purpose                      | MCP                   | Source                                                                      | Description                                                                  |
| ---------------------------- | --------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Code Context & Search**    | Context7 (Community)  | [context7-ai/context7-mcp](https://github.com/context7-ai/context7-mcp)     | Local semantic code search + dependency graph.                               |
| **Git Diffing & Logs**       | GitMCP                | [jmorganca/gitmcp](https://github.com/jmorganca/gitmcp)                     | Analyzes commits and branches locally for audit and phase verification.      |
| **Database Schema Insight**  | SQLLens-Lite          | [quevenco/sqllens-mcp-lite](https://github.com/quevenco/sqllens-mcp-lite)   | Reads Drizzle or Prisma schema, shows tables, relationships, and data types. |
| **API / tRPC Mapping**       | tRPC-Lens             | [zenstackhq/trpc-lens-mcp](https://github.com/zenstackhq/trpc-lens-mcp)     | Auto-indexes routers and endpoints for typed autocompletion.                 |
| **Design System Tokens**     | DesignToken MCP       | [shiftux/tailwind-token-mcp](https://github.com/shiftux/tailwind-token-mcp) | Exports Tailwind theme tokens to JSON for use in Copilot and MCP automation. |
| **UI & Integration Testing** | Playwright MCP        | [microsoft/playwright](https://github.com/microsoft/playwright)             | Runs automated UI smoke tests for Phase 0 and Phase 2 verification.          |
| **Performance Audits**       | Lighthouse MCP        | [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci) | Checks Core Web Vitals and PWA readiness locally.                            |
| **SSOT Parsing / Docs**      | SpecKit (Open Source) | [speckit-ai/speckit-mcp](https://github.com/speckit-ai/speckit-mcp)         | Converts markdown SSOT docs into structured prompt context for MCPs.         |
| **Audit Trail**              | AuditLog MCP          | [grayhatter/auditlog-mcp](https://github.com/grayhatter/auditlog-mcp)       | Writes every merge or MCP execution to `docs/audit-log.jsonl`.               |

---

## ⚙️ Minimal Setup (Recommended for Weeks 1–2)

1. **Context7** → semantic project graph
2. **GitMCP** → audit & version tracking
3. **SQLLens-Lite** → schema diffing
4. **DesignToken MCP** → UI consistency
5. **Playwright MCP** → test gates

### Expected Benefits

- Real-time awareness of code & schema changes.
- Automatic audit and rollback tracking.
- Full design token verification.
- One-command smoke testing per phase.

---

## 📁 VS Code / Claude Desktop Configuration

```json
{
  "servers": {
    "context7": { "path": "/usr/local/bin/context7-mcp", "args": [] },
    "gitmcp": { "path": "/usr/local/bin/gitmcp", "args": [] },
    "sqllens": { "path": "/usr/local/bin/sqllens-mcp-lite", "args": [] },
    "designtoken": { "path": "/usr/local/bin/tailwind-token-mcp", "args": [] },
    "playwright": { "path": "/usr/local/bin/playwright", "args": ["test"] }
  }
}
```

### Verification Commands

```bash
context7 status
gitmcp status
sqllens status
designtoken status
playwright test --list
```

All should return a status message or a short list of available actions.

---

## 🧩 SSOT Phase Mapping

| Phase                      | MCPs                                 | Outcome                                          |
| -------------------------- | ------------------------------------ | ------------------------------------------------ |
| **Phase 0 – Baseline**     | DesignToken + Playwright             | Confirm UI, design system, and smoke tests       |
| **Phase 1 – Foundation**   | SQLLens-Lite + GitMCP                | Validate schema + backend merges                 |
| **Phase 2 – Marketplace**  | Context7 + SQLLens-Lite + Playwright | Confirm PWA and AI features run cleanly          |
| **Phase 3 – Optimization** | Lighthouse MCP                       | Measure Core Web Vitals                          |
| **Phase 4 – Merge**        | GitMCP + SpecKit                     | Final SSOT reconciliation + changelog generation |

---

## 🛠️ Maintenance Checklist

- [ ] Add `~/mcp_bin/` to PATH.
- [ ] Run `pnpm run mcp:update` weekly (updates from GitHub).
- [ ] Verify `docs/audit-log.jsonl` grows after every MCP run.
- [ ] Backup `.vscode/mcp.json` monthly.

---

## ✅ Governance Alignment

| File                                   | Role                                      |
| -------------------------------------- | ----------------------------------------- |
| `.github/copilot-instructions.md`      | Primary SSOT reference for Copilot & MCPs |
| `docs/audit-log.jsonl`                 | Immutable audit history                   |
| `docs/MCP_FREE_IMPLEMENTATION_PLAN.md` | This file – operational guide             |
| `docs/reports/phase-{0–4}.md`          | Verification reports per SSOT phase       |

---

## 📅 Implementation Timeline

| Week       | Tasks                                              | Deliverables                     |
| ---------- | -------------------------------------------------- | -------------------------------- |
| **Week 1** | Install 5-core MCPs, test connectivity             | `MCP_VALIDATION_LOG.md`          |
| **Week 2** | Integrate Playwright tests + DesignToken outputs   | Phase 0 verification screenshots |
| **Week 3** | Activate SQLLens + GitMCP logs for Phase 1 merge   | `audit-log.jsonl` entries        |
| **Week 4** | Add Lighthouse + SpecKit for optimization and docs | Phase 3–4 reports                |

---

**Prepared for:** Suburbmates SSOT (Phases 0–4)
**Maintainer:** carlsuburbmates
**Last Updated:** {{CURRENT_DATE}}
