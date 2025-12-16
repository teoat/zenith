# MCP Workspace Configuration — Canonical

**Change impact (keep in sync):**
- If server names or priorities change, update `.mcp-workspace.json` examples here and ensure `docs/config/MCP_CONFIG.md` stub still points to this canonical file.
- Reflect workspace or repo naming changes in any onboarding docs (e.g., `docs/guides/GETTING_STARTED.md`).
- Rerun docs link check after edits; keep the archived original in `docs/archives/config/MCP_CONFIG.md`.

This file centralizes the MCP configuration guidance and points to the current detailed example in `docs/config/MCP_CONFIG.md` (original file preserved).

## Purpose
Define the workspace schema (`.mcp-workspace.json`) and common MCP server integration patterns (GitHub, Postgres, Chrome DevTools, context providers).

## Canonical Notes
- Keep `.mcp-workspace.json` in the workspace root to define MCP servers and priorities.
- Typical servers: `github`, `postgres`, `postgres_replicas`, `chrome-devtools`, `context7`.
- Provide per-server `enabled`, `priority`, `config` blocks and environment variable-driven secrets.

## Example (summary)
```json
{
  "workspace": { "name": "378x492-fraud-detection", "type": "fullstack-python-react" },
  "mcpServers": {
    "github": { "enabled": true, "priority": "high", "config": { "owner": "378x492" } },
    "postgres": { "enabled": true, "priority": "high", "config": { "connectionString": "${POSTGRES_URL}" } }
  }
}
```

## Preservation
- Full original file `docs/config/MCP_CONFIG.md` remains in place for now. When you're ready I can move it to `docs/archives/config/` or into `docs/developer/` as a verbatim copy and update internal links.
