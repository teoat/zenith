# Documentation Migration & Duplicate Resolution Guide (Updated Dec 10, 2025)

Use this as the authoritative checklist. Every doc should list affected files and remind editors to update them; run the docs link check after changes.

## Completed (canonicalized)
- API: `docs/api/README.md` (canonical) — archives at `docs/archives/api/README.md`, `docs/archives/api/api_docs_index.md`; `docs/api-docs/` removed.
- Core architecture: `docs/architecture/CORE_ARCHITECTURE.md` — archives at `docs/archives/architecture/00_DATA_MODELS.md`, `00_FRAUD_LOGIC.md`, `00_TECH_STACK.md`.
- Electron architecture: `docs/architecture/ELECTRON_ARCHITECTURE.md` — prior summary archived at `docs/archives/architecture/ELECTRON_ARCHITECTURE.md`.
- Getting Started: `docs/guides/GETTING_STARTED.md` — archives at `docs/archives/guides/GETTING_STARTED.md`, `docs/archives/guides/getting-started.md`.
- Security: `docs/security/SECURITY.md` — originals remain; archive to `docs/archives/security/` after review.
- MCP config: `docs/developer/MCP_CONFIG.md` — archive at `docs/archives/config/MCP_CONFIG.md`; stub at `docs/config/MCP_CONFIG.md`.
- Troubleshooting: renamed to `docs/deployment/TROUBLESHOOTING_DEPLOYMENT.md` (ops) and `docs/guides/TROUBLESHOOTING_USER.md` (user).
- Strategy: originals moved to `docs/planning/strategy/`.
- Temp `_MERGED`/`_FULL` files removed after promotion.

## Pending cleanup
1) Monitoring/Diagnostics
- Files: `docs/developer/MONITORING_AGUIDE.md`, `docs/deployment/monitoring.md`, `docs/diagnostics/PLAN.md`, `docs/diagnostics/README.md`.
- Action: create `docs/monitoring/IMPLEMENTATION.md` with Operator vs Developer sections; link and/or archive the above.

2) Security archives
- Action: move security originals into `docs/archives/security/` after sign-off.

## Link rewrite status
- Completed: `api-docs/index.md` → `api/README.md`; `guides/getting-started.md` → `guides/GETTING_STARTED.md`; `docs/strategy/` → `docs/planning/strategy/`.
- Verification: run `rg "api-docs/index.md" docs`, `rg "getting-started.md" docs`, `rg "docs/strategy/" docs` — expected 0.

## Required steps for any doc change
1) Add/maintain a “Change impact” block listing affected files and remind editors to update them.
2) Update cross-links in those affected files.
3) Run the docs link check (GitHub Action `docs-link-check` or `lychee`).
4) Preserve or update archives under `docs/archives/` for provenance.

## Archive policy
Keep archives under `docs/archives/` for 90 days before pruning or moving off main. Archives already exist for API, core architecture, guides, MCP config; pending for security/monitoring once finalized.
