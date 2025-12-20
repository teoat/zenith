# Zenith Fraud Detection API Documentation

## Overview

**Total Endpoints**: 339
**Total Routers**: 49
**Base URL**: `https://api.Zenith.com`

## API Statistics

| Method | Count |
|--------|-------|
| DELETE | 11 |
| GET | 175 |
| PATCH | 1 |
| POST | 144 |
| PUT | 8 |

## Endpoints by Router

### Admin

#### GET /database/performance

**Handler**: `None`

#### GET /database/stats

**Handler**: `None`

#### POST /database/optimize

**Handler**: `None`

#### POST /database/analyze-query

**Handler**: `None`

#### GET /cache/stats

**Handler**: `None`

#### DELETE /cache/namespace/{namespace}

**Handler**: `None`

#### DELETE /cache/all

**Handler**: `None`

#### GET /system/diagnostics

**Handler**: `None`

#### GET /system/metrics/current

**Handler**: `None`

#### GET /plugins

**Handler**: `None`

#### POST /plugins/{plugin_id}/toggle

**Handler**: `None`

#### GET /plugins/metrics

**Handler**: `None`


### Advanced_Ai

#### POST /advanced-ai/rag/query

**Handler**: `None`

#### POST /advanced-ai/rag/add

**Handler**: `None`

#### POST /advanced-ai/multimodal/image

**Handler**: `None`

#### POST /advanced-ai/multimodal/text

**Handler**: `None`

#### POST /advanced-ai/red-team/generate

**Handler**: `generate_red_team_prompts`

#### GET /advanced-ai/stats

**Handler**: `None`


### Ai

#### POST /embeddings

**Handler**: `None`

#### POST /semantic-search

**Handler**: `None`

#### POST /search

**Handler**: `None`

#### POST /analyze

**Handler**: `None`

#### POST /insights

**Handler**: `None`

#### POST /documents

**Handler**: `None`

#### DELETE /documents/{doc_id}

**Handler**: `None`

#### POST /multi-persona-analysis

**Handler**: `None`

#### POST /investigate/{subject_id}

**Handler**: `None`

#### POST /proactive-suggestions

**Handler**: `None`

#### GET /status

**Handler**: `None`

#### POST /analyze/case

**Handler**: `None`

#### GET /health

**Handler**: `None`

#### GET /models/status

**Handler**: `None`

#### GET /insights/{case_id}

**Handler**: `None`

#### POST /feedback/{transaction_id}

**Handler**: `None`

#### POST /federated/update

**Handler**: `None`

#### GET /performance

**Handler**: `None`

#### POST /anomaly-detection

**Handler**: `None`

#### POST /chat

**Handler**: `None`

#### POST /code-review

**Handler**: `None`

#### POST /chat/multi-persona

**Handler**: `None`

#### POST /analyze/multimodal

**Handler**: `None`

#### GET /llm/status

**Handler**: `None`

#### GET /deprecated/usage

**Handler**: `None`

#### POST /analyze/batch

**Handler**: `None`


### Ai_Voice

#### POST /voice-command

**Handler**: `None`

#### POST /chat/regulatory

**Handler**: `None`


### Alerts

#### GET 

**Handler**: `None`

#### PUT /{alert_id}

**Handler**: `None`


### Analytics

#### GET /cases

**Handler**: `None`

#### GET /transactions

**Handler**: `None`

#### GET /overview

**Handler**: `None`

#### GET /temporal-flow

**Handler**: `None`

#### GET /behavioral

**Handler**: `None`

#### GET /case-metrics

**Handler**: `None`

#### GET /fraud-stats

**Handler**: `None`


### Apm

#### GET /summary

**Handler**: `None`

#### GET /metrics

**Handler**: `None`

#### GET /spans

**Handler**: `None`

#### GET /alerts

**Handler**: `None`

#### POST /metrics

**Handler**: `None`

#### POST /spans/start

**Handler**: `None`

#### POST /spans/{span_id}/finish

**Handler**: `None`

#### POST /alerts

**Handler**: `None`

#### PUT /alerts/{alert_id}/resolve

**Handler**: `None`

#### GET /system-metrics

**Handler**: `None`

#### GET /aggregated-metrics

**Handler**: `None`

#### POST /export

**Handler**: `None`

#### GET /summary

**Handler**: `None`

#### GET /metrics

**Handler**: `None`

#### GET /dashboard

**Handler**: `None`

#### GET /health/live

**Handler**: `None`

#### GET /health/ready

**Handler**: `None`

#### GET /health/deep

**Handler**: `None`

#### GET /health/status

**Handler**: `None`

#### GET /health/history

**Handler**: `None`

#### GET /health/degradation

**Handler**: `None`

#### POST /trace/start

**Handler**: `None`

#### POST /trace/{trace_id}/span/start

**Handler**: `None`

#### POST /trace/{trace_id}/span/{span_id}/end

**Handler**: `None`

#### POST /trace/{trace_id}/end

**Handler**: `None`

#### GET /trace/{trace_id}

**Handler**: `None`

#### GET /trace/{trace_id}/summary

**Handler**: `None`

#### GET /traces/recent

**Handler**: `None`


### Audit

#### GET /

**Handler**: `get_audit_logs`


### Auth

#### POST /register

**Handler**: `None`

#### POST /login

**Handler**: `None`

#### GET /mfa/setup

**Handler**: `None`

#### POST /mfa/verify

**Handler**: `None`

#### POST /refresh

**Handler**: `None`

#### GET /me

**Handler**: `None`


### Auth_Biometric

#### POST /register/start

**Handler**: `None`

#### POST /register/complete

**Handler**: `None`

#### POST /login/start

**Handler**: `None`

#### POST /login/complete

**Handler**: `None`


### Auth_Social

#### GET /{provider}

**Handler**: `None`

#### GET /{provider}/callback

**Handler**: `None`


### Backup

#### POST /create

**Handler**: `None`

#### POST /restore

**Handler**: `None`

#### GET /status

**Handler**: `None`

#### GET /list

**Handler**: `None`

#### GET /verify/{backup_id}

**Handler**: `None`

#### DELETE /{backup_id}

**Handler**: `None`

#### POST /cleanup

**Handler**: `None`

#### GET /config

**Handler**: `None`

#### PUT /config

**Handler**: `None`

#### GET /health

**Handler**: `None`


### Cases

#### POST 

**Handler**: `None`

#### POST /

**Handler**: `None`

#### GET 

**Handler**: `None`

#### GET /search

**Handler**: `None`

#### GET /{case_id}

**Handler**: `None`

#### PATCH /{case_id}

**Handler**: `None`

#### PUT /{case_id}/status

**Handler**: `None`

#### POST /{case_id}/notes

**Handler**: `None`

#### POST /{case_id}/close

**Handler**: `None`

#### PUT /{case_id}

**Handler**: `None`

#### DELETE /{case_id}

**Handler**: `None`

#### POST /bulk-delete

**Handler**: `None`

#### POST /bulk-update

**Handler**: `None`


### Compliance

#### GET /dashboard

**Handler**: `None`

#### GET /monitoring/dashboard

**Handler**: `None`

#### GET /regulatory-reports

**Handler**: `None`

#### GET /regional-compliance

**Handler**: `None`

#### GET /data-residency-rules

**Handler**: `None`

#### POST /audit/log

**Handler**: `None`


### Cost_Optimization

#### GET /infrastructure/costs

**Handler**: `None`

#### POST /optimization/{optimization_id}/apply

**Handler**: `None`

#### GET /savings/projection

**Handler**: `None`


### Csrf

#### GET /csrf-token

**Handler**: `None`

#### POST /validate-csrf

**Handler**: `None`

#### POST /cleanup-tokens

**Handler**: `None`


### Deprecation

#### GET /stats

**Handler**: `None`

#### GET /warnings

**Handler**: `None`

#### GET /endpoints

**Handler**: `None`

#### POST /reset-stats

**Handler**: `None`

#### GET /migration-guide

**Handler**: `None`

#### GET /health

**Handler**: `None`


### Diagnostics

#### GET /health

**Handler**: `None`

#### GET /ai-ml-performance

**Handler**: `None`

#### GET /data-quality

**Handler**: `None`

#### GET /user-experience

**Handler**: `None`

#### GET /scalability

**Handler**: `None`

#### GET /compliance

**Handler**: `None`

#### GET /integration-health

**Handler**: `None`

#### GET /business-impact

**Handler**: `None`

#### POST /scoring/run

**Handler**: `None`

#### GET /scoring/history

**Handler**: `None`

#### GET /scoring/current

**Handler**: `None`

#### GET /sync/status

**Handler**: `None`

#### POST /sync/trigger/{protocol_name}/{action}

**Handler**: `None`

#### GET /sync/history

**Handler**: `None`

#### POST /investigation/check-triggers

**Handler**: `None`

#### GET /investigation/active

**Handler**: `None`

#### GET /investigation/{investigation_id}

**Handler**: `None`

#### GET /investigation/history

**Handler**: `None`

#### POST /pipeline/create

**Handler**: `None`

#### POST /pipeline/{pipeline_id}/execute

**Handler**: `None`

#### GET /pipeline/active

**Handler**: `None`

#### GET /pipeline/{pipeline_id}

**Handler**: `None`

#### POST /pipeline/{pipeline_id}/cancel

**Handler**: `None`

#### POST /pipeline/{pipeline_id}/approve/{step_index}

**Handler**: `None`

#### POST /notifications/check-alerts

**Handler**: `None`

#### GET /notifications/recent

**Handler**: `None`


### Entities

#### POST 

**Handler**: `None`

#### POST /

**Handler**: `None`

#### GET /{entity_id}

**Handler**: `None`


### Evidence

#### GET 

**Handler**: `None`

#### GET /{evidence_id}/download/stream

**Handler**: `None`

#### GET /processing/metrics

**Handler**: `None`

#### POST /processing/cleanup

**Handler**: `None`

#### POST /upload/chunk

**Handler**: `None`

#### POST /upload/complete

**Handler**: `None`

#### POST /upload

**Handler**: `None`

#### GET /{evidence_id}/highlights

**Handler**: `None`

#### POST /{evidence_id}/highlights

**Handler**: `None`

#### POST /bulk-delete

**Handler**: `None`


### Forensic_Intelligence

#### POST /triangulate

**Handler**: `None`

#### POST /libr-analysis

**Handler**: `None`

#### POST /attribute-intent

**Handler**: `None`

#### GET /mirror-detection/{account_id}

**Handler**: `None`

#### GET /zenith-score/{project_id}

**Handler**: `None`

#### POST /validate-imputation

**Handler**: `None`

#### GET /aml/structuring/{account_id}

**Handler**: `None`

#### GET /aml/ubo-trace/{entity_name}

**Handler**: `None`

#### POST /sign-report

**Handler**: `None`

#### POST /zenith/federated-sync

**Handler**: `None`

#### GET /zenith/shield-verify/{artifact_id}

**Handler**: `None`

#### POST /zenith/autonomous-hunt

**Handler**: `None`

#### GET /evidence/{evidence_id}/coc

**Handler**: `None`

#### POST /evidence/{evidence_id}/coc

**Handler**: `None`

#### GET /aml/behavior-baseline/{account_id}

**Handler**: `None`

#### POST /aml/behavior-check/{account_id}

**Handler**: `None`


### Fraud

#### POST /analyze

**Handler**: `None`

#### POST /analyze/batch

**Handler**: `None`

#### POST /alerts

**Handler**: `None`

#### GET /rules

**Handler**: `None`

#### POST /analyze/{case_id}

**Handler**: `None`

#### GET /alerts/{case_id}

**Handler**: `None`

#### PUT /alerts/{alert_id}/status

**Handler**: `None`

#### GET /stats

**Handler**: `None`

#### POST /accounts/freeze

**Handler**: `None`


### Fraud_Rules

#### GET /

**Handler**: `None`

#### GET /{rule_name}

**Handler**: `None`

#### POST /evaluate

**Handler**: `None`

#### GET /config/status

**Handler**: `None`

#### POST /

**Handler**: `None`

#### DELETE /{rule_id}

**Handler**: `None`


### Graph

#### POST /snapshot/{case_id}

**Handler**: `None`

#### GET /snapshots/{case_id}

**Handler**: `None`

#### GET /snapshot/{snapshot_id}

**Handler**: `None`

#### POST /build

**Handler**: `None`

#### GET /data

**Handler**: `None`

#### GET /communities

**Handler**: `None`

#### GET /central-entities

**Handler**: `None`

#### GET /suspicious-patterns

**Handler**: `None`

#### GET /entity/{entity_id}

**Handler**: `None`

#### GET /path/{source}/{target}

**Handler**: `None`

#### GET /export/{format}

**Handler**: `None`

#### DELETE /clear

**Handler**: `None`

#### GET /search

**Handler**: `None`

#### GET /{case_id}/correlations

**Handler**: `None`


### Graphql

#### POST /graphql

**Handler**: `None`

#### GET /graphql/playground

**Handler**: `None`


### Health

#### GET /health

**Handler**: `None`

#### GET /health/uptime

**Handler**: `None`

#### POST /health/alerts/{alert_id}/acknowledge

**Handler**: `None`

#### GET /health/live

**Handler**: `None`

#### GET /health/circuit-breakers

**Handler**: `None`

#### GET /health/startup

**Handler**: `None`


### Logging

#### GET /status

**Handler**: `None`

#### GET /telemetry

**Handler**: `None`

#### POST /telemetry/reset

**Handler**: `None`

#### POST /telemetry/export

**Handler**: `None`

#### POST /log

**Handler**: `None`

#### POST /log/user-action

**Handler**: `None`

#### POST /log/api-request

**Handler**: `None`

#### POST /log/security-event

**Handler**: `None`

#### POST /log/performance-metric

**Handler**: `None`

#### GET /logs/search

**Handler**: `None`

#### GET /pii-scrubbing/test

**Handler**: `None`

#### GET /config

**Handler**: `None`

#### PUT /config

**Handler**: `None`


### Macros

#### POST /macros/execute

**Handler**: `None`


### Metadata

#### POST /extract

**Handler**: `None`

#### GET /hash/{file_id}

**Handler**: `None`

#### POST /compare

**Handler**: `None`

#### POST /forensic-scan

**Handler**: `None`

#### GET /supported-types

**Handler**: `None`


### Metrics

#### GET /metrics

**Handler**: `None`

#### GET /health/detailed

**Handler**: `None`


### Multimodal

#### POST /analyze

**Handler**: `None`

#### POST /analyze/upload

**Handler**: `None`

#### POST /analyze/path

**Handler**: `None`

#### POST /analyze/batch

**Handler**: `None`

#### GET /capabilities

**Handler**: `None`

#### GET /status

**Handler**: `None`


### Notifications

#### GET /

**Handler**: `None`

#### POST /{notification_id}/read

**Handler**: `None`

#### POST /mark-all-read

**Handler**: `None`

#### POST /trigger

**Handler**: `None`

#### GET /stats

**Handler**: `None`

#### POST /test

**Handler**: `None`

#### DELETE /clear

**Handler**: `None`

#### GET /types

**Handler**: `None`

#### GET /channels

**Handler**: `None`


### Onboarding

#### GET /roles

**Handler**: `get_roles`

#### GET /rookie-checklist/{user_id}

**Handler**: `get_rookie_checklist`

#### POST /rookie-checklist

**Handler**: `submit_rookie_checklist`


### Phase6B

#### POST /phase6b/metadata-correlation

**Handler**: `None`

#### POST /phase6b/temporal-burst

**Handler**: `None`


### Projects

#### GET 

**Handler**: `None`

#### POST 

**Handler**: `None`

#### GET /{project_id}

**Handler**: `None`


### Proof

#### GET /metadata-correlations/{case_id}

**Handler**: `get_metadata_correlations`

#### GET /temporal-bursts/{case_id}

**Handler**: `detect_temporal_bursts`

#### POST /temporal-bursts/analyze

**Handler**: `analyze_transactions_for_bursts`

#### GET /audit-chain/verify

**Handler**: `verify_audit_chain`

#### GET /audit-chain/export

**Handler**: `export_audit_chain_proof`

#### GET /audit-chain/stats

**Handler**: `get_audit_chain_stats`

#### POST /audit-chain/append

**Handler**: `append_audit_entry`

#### GET /community-detection/{case_id}

**Handler**: `detect_shell_networks`

#### GET /summary/{case_id}

**Handler**: `get_proof_summary`


### Realtime_Sync

#### GET /status

**Handler**: `None`

#### GET /documents

**Handler**: `None`

#### GET /documents/{document_id}

**Handler**: `None`

#### POST /documents/{document_id}/operations

**Handler**: `None`

#### GET /stats

**Handler**: `None`

#### POST /broadcast

**Handler**: `None`

#### DELETE /documents/{document_id}

**Handler**: `None`


### Reconciliation

#### GET /items

**Handler**: `None`

#### POST /cash-float

**Handler**: `None`

#### POST /batch-match

**Handler**: `None`

#### POST /temporal-analysis

**Handler**: `None`

#### POST /batch/save

**Handler**: `None`

#### POST /batch/analyze-sequence

**Handler**: `None`

#### POST /reconcile/{transaction_id}

**Handler**: `None`

#### POST /ingest-mapped

**Handler**: `None`


### Regulatory_Rag

#### POST /ingest

**Handler**: `None`

#### POST /search

**Handler**: `None`


### Reporting

#### POST /generate

**Handler**: `None`

#### GET /job/{job_id}

**Handler**: `None`

#### GET /download/{report_id}

**Handler**: `None`

#### GET /summary/{case_id}

**Handler**: `None`

#### GET /templates

**Handler**: `None`

#### GET /scheduled

**Handler**: `None`

#### POST /scheduled

**Handler**: `None`

#### DELETE /scheduled/{schedule_id}

**Handler**: `None`

#### GET /financial-health/{case_id}

**Handler**: `None`

#### GET /project-tracker/{case_id}

**Handler**: `None`


### Search

#### POST 

**Handler**: `None`

#### GET /stats

**Handler**: `None`

#### POST /semantic

**Handler**: `None`

#### GET /semantic/stats

**Handler**: `None`


### Self_Healing

#### POST /execute

**Handler**: `None`

#### GET /approvals

**Handler**: `None`


### Semantic_Search

#### POST /index

**Handler**: `None`

#### POST /index/batch

**Handler**: `None`

#### GET /search

**Handler**: `None`

#### DELETE /index/{document_id}

**Handler**: `None`

#### GET /stats

**Handler**: `None`

#### POST /rebuild

**Handler**: `None`

#### GET /backends

**Handler**: `None`

#### POST /switch-backend

**Handler**: `None`


### Stats

#### GET /locations

**Handler**: `None`

#### GET /metrics

**Handler**: `get_dashboard_metrics`

#### GET /predictive

**Handler**: `None`


### Streaming

#### POST /ai/stream

**Handler**: `None`

#### POST /ai/analyze/stream

**Handler**: `None`

#### GET /ai/stream/test

**Handler**: `None`


### Time_Travel

#### GET /{case_id}/history

**Handler**: `None`

#### GET /{case_id}/graph/snapshot/{snapshot_id}

**Handler**: `None`


### Users

#### PUT /users/me/preferences

**Handler**: `None`

#### GET /users

**Handler**: `None`

#### POST /users/bulk

**Handler**: `None`

#### GET /me

**Handler**: `None`

#### GET /users/{user_id}

**Handler**: `None`


### Websocket

#### POST /broadcast_alert

**Handler**: `None`


### Xai

#### GET /explain/{score_id}

**Handler**: `None`

#### GET /explain/{score_id}/features

**Handler**: `None`


## API Models

### Error_Responses

**Classes**:
- `ErrorDetail`
- `APIErrorResponse`
- `ValidationErrorResponse`
- `RateLimitErrorResponse`
