# Sequential Thinking MCP – Global Setup for Suburbmates

**Status:** ✅ Active (2025-11-04)  
**Scope:** IDE-wide (all VS Code workspaces)  
**Config Location:** `~/.vscode/mcp.json` → `~/.config/mcp/mcp.json`

## Quick Reference

This project now inherits a **global Sequential Thinking MCP configuration** that applies to all VS Code workspaces on this machine.

### What's Configured

- **Sequential Thinking MCP** – Capped at 100 thoughts, 10 depth levels, 10-minute timeout
- **Filesystem MCP** – Workspace-relative file operations
- **Git MCP** – Workspace-relative repository operations

### Local Workspace Features

This workspace has additional Sequential Thinking integration:

- **Config Symlink:** `.vscode/mcp.json` → `~/.config/mcp/mcp.json`
- **Decision Logs:** `docs/decisions/TEMPLATE.md` for documenting reasoning traces

## Usage in Suburbmates

### Decision Logging Workflow

When using Sequential Thinking for architectural decisions or complex problem-solving:

1. **During reasoning:** Traces automatically saved to `~/.config/mcp/traces/sequential-thinking/`
2. **After completion:** Copy relevant trace file to `docs/decisions/`
3. **Document:** Fill out `TEMPLATE.md` with key insights and implementation checklist
4. **Commit:** Add decision log to version control

Example:

```bash
# Find latest trace
ls -lt ~/.config/mcp/traces/sequential-thinking/ | head -5

# Copy to decisions directory
cp ~/.config/mcp/traces/sequential-thinking/session-2025-11-04.json \
   docs/decisions/phase-4-stripe-integration.json

# Create decision log
cp docs/decisions/TEMPLATE.md docs/decisions/stripe-payment-flow.md
# Edit stripe-payment-flow.md with trace insights
```

### Validating Reasoning Sessions

Use the global validator to check trace quality:

```bash
node ~/.config/mcp/scripts/mcp-validator.js \
  ~/.config/mcp/traces/sequential-thinking/<session-file>.json
```

### Health Check

Verify MCP configuration is active:

```bash
~/.config/mcp/setup-hardening.sh audit
```

## Configuration Details

See global documentation: `~/.config/mcp/README.md`

## Key Benefits for Suburbmates

1. **Consistent Reasoning:** Same MCP environment across all development sessions
2. **Audit Trail:** All architectural decisions traceable via reasoning logs
3. **GDPR Compliance:** 7-day retention policy, user-controlled trace deletion
4. **Security:** Traces protected with 700 permissions (user-only access)
5. **Automation:** Daily cleanup via cron (02:00), no manual maintenance

## Decision Logs Directory

```
docs/decisions/
├── TEMPLATE.md           # Template for new decision logs
└── [future logs here]    # Add reasoning-backed decisions
```

### When to Create Decision Logs

Use Sequential Thinking + decision logs for:

- **Architecture changes:** Phase 4 marketplace, payment flows
- **Complex refactoring:** tRPC router restructuring, database schema migrations
- **Security decisions:** Authentication flows, data validation strategies
- **Performance optimization:** Caching strategies, database indexing
- **Third-party integrations:** Stripe, ABN verification, OAuth flows

## Maintenance

**Automated:**
- Trace cleanup: Daily at 02:00 (cron job)
- Retention: 7 days

**Manual:**
```bash
# Force cleanup now
~/.config/mcp/setup-hardening.sh cleanup

# Re-run setup (idempotent)
~/.config/mcp/setup-hardening.sh setup
```

## Troubleshooting

### MCP Not Loading

```bash
# Check VS Code detected the config
ls -la .vscode/mcp.json

# Should show symlink: .vscode/mcp.json -> ~/.config/mcp/mcp.json

# Verify global config
cat ~/.config/mcp/mcp.json | grep SequentialThinking
```

### Trace Directory Full

```bash
# Manual cleanup (deletes traces >7 days)
~/.config/mcp/setup-hardening.sh cleanup

# Check trace count
ls ~/.config/mcp/traces/sequential-thinking/ | wc -l
```

## Related Documentation

- **Global MCP Setup:** `~/.config/mcp/README.md`
- **Consent Notice:** `~/.config/mcp/CONSENT.txt`
- **Retention Policy:** `~/.config/mcp/traces/sequential-thinking/RETENTION_POLICY.txt`
- **Validator Script:** `~/.config/mcp/scripts/mcp-validator.js`
- **Setup Script:** `~/.config/mcp/setup-hardening.sh`

---

**Note:** This is a global configuration that applies to **all VS Code workspaces**. Changes to `~/.config/mcp/mcp.json` affect every project.
