# Sequential Thinking MCP Master Document

## 📍 Location
This master document has been moved to the **global MCP configuration directory** to reflect its IDE-wide scope:

**Path:** `~/.config/mcp/docs/Sequential_Thinking_MCP_Operational_Manual.md`

## 📖 Access
```bash
# View the master document
cat ~/.config/mcp/docs/Sequential_Thinking_MCP_Operational_Manual.md

# Or open in your default editor
open ~/.config/mcp/docs/Sequential_Thinking_MCP_Operational_Manual.md
```

## 🎯 Why Global?
This document covers the **entire Sequential Thinking MCP ecosystem** that applies to all VS Code workspaces:

- Global system configuration (`~/.config/mcp/`)
- IDE-wide MCP server management
- Cross-project decision logging workflows
- Enterprise governance and compliance policies

## 📋 Quick Reference

### For New Projects
```bash
# 1. Create workspace structure
mkdir -p .vscode docs/decisions

# 2. Link global MCP config
ln -sf ~/.config/mcp/mcp.json .vscode/mcp.json

# 3. Reload VS Code
# Cmd+Shift+P → "Developer: Reload Window"
```

### Decision Logging Workflow
1. **Reason** with Sequential Thinking MCP in VS Code
2. **Export** via VS Code tasks: "MCP: Sync Decisions & Commit"
3. **Reference** generated logs in `docs/decisions/`

### Maintenance
- **Weekly**: `~/.config/mcp/setup-hardening.sh audit`
- **Daily**: Automatic trace cleanup (cron job)
- **Emergency**: See master document troubleshooting section

## 🔗 Related Documents

- **Global Setup Guide**: `~/.config/mcp/README.md`
- **Project Integration**: `docs/MCP_GLOBAL_SETUP.md`
- **Decision-Sync Plugin**: `~/.config/mcp/plugins/README.md`
- **Implementation Report**: `docs/MCP_DECISION_SYNC_IMPLEMENTATION.md`

---

*For complete operational details, refer to the master document at `~/.config/mcp/docs/Sequential_Thinking_MCP_Operational_Manual.md`*"