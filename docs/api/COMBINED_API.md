# Combined API Reference — Summary

This combined summary centralizes the API reference and points to existing full documents. It preserves all original files; use this as the canonical entry while we migrate details to a single file.

Primary sources:
- `docs/api/README.md` (full API reference)
- `docs/api/README.md` (human-friendly API guide)
- `docs/api/openapi.yaml` (OpenAPI spec)

Quick links:
- Full reference: `../api/README.md`
- Human guide: `../api/README.md`
- OpenAPI spec: `openapi.yaml`

Summary of content (synchronization notes):

- Authentication: combine the JWT and API-key sections from both sources. Keep examples for both `Authorization: Bearer <token>` and API key header examples.
- Cases endpoints: canonicalize request/response schemas using OpenAPI types in `openapi.yaml`.
- Rate limiting & security: unify identical sections and add a single 'Security' heading referencing the system-wide `docs/security/SECURITY_SUMMARY.md`.

Suggested next (merge) actions:
1. Create a single `docs/api/README.md` that contains the full human reference and copies the OpenAPI excerpts in a `spec/` sub-section.
2. Remove `api-docs/` after verification and update internal references to `docs/api/COMBINED_API.md` during the transition.

Preservation: no files were removed. The combined file is an index and migration checklist.
