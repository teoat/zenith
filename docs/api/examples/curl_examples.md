# curl Examples

## /auth/register

```bash
curl -X POST 'https://api.Zenith.com/auth/register' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /auth/login

```bash
curl -X POST 'https://api.Zenith.com/auth/login' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /auth/refresh

```bash
curl -X POST 'https://api.Zenith.com/auth/refresh' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /auth/me

```bash
curl -X GET 'https://api.Zenith.com/auth/me' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /cases

```bash
curl -X POST 'https://api.Zenith.com/cases' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /cases/{case_id}

```bash
curl -X GET 'https://api.Zenith.com/cases/{case_id}' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /cases/{case_id}/notes

```bash
curl -X GET 'https://api.Zenith.com/cases/{case_id}/notes' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /cases/{case_id}/close

```bash
curl -X GET 'https://api.Zenith.com/cases/{case_id}/close' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /evidence

```bash
curl -X GET 'https://api.Zenith.com/evidence' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /evidence/{evidence_id}

```bash
curl -X GET 'https://api.Zenith.com/evidence/{evidence_id}' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /evidence/upload/chunk

```bash
curl -X POST 'https://api.Zenith.com/evidence/upload/chunk' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /evidence/upload/complete

```bash
curl -X POST 'https://api.Zenith.com/evidence/upload/complete' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /fraud/analyze

```bash
curl -X POST 'https://api.Zenith.com/fraud/analyze' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /fraud/analyze/batch

```bash
curl -X POST 'https://api.Zenith.com/fraud/analyze/batch' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /fraud/risk-score

```bash
curl -X POST 'https://api.Zenith.com/fraud/risk-score' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /ai/embeddings

```bash
curl -X POST 'https://api.Zenith.com/ai/embeddings' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /ai/semantic-search

```bash
curl -X POST 'https://api.Zenith.com/ai/semantic-search' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /ai/analyze

```bash
curl -X POST 'https://api.Zenith.com/ai/analyze' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /ai/insights

```bash
curl -X POST 'https://api.Zenith.com/ai/insights' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /reports/generate

```bash
curl -X POST 'https://api.Zenith.com/reports/generate' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"key": "value"}'
```

## /reports/job/{job_id}

```bash
curl -X GET 'https://api.Zenith.com/reports/job/{job_id}' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /reports/download/{report_id}

```bash
curl -X GET 'https://api.Zenith.com/reports/download/{report_id}' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /admin/system/diagnostics

```bash
curl -X GET 'https://api.Zenith.com/admin/system/diagnostics' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /admin/database/stats

```bash
curl -X GET 'https://api.Zenith.com/admin/database/stats' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

## /admin/cache/stats

```bash
curl -X GET 'https://api.Zenith.com/admin/cache/stats' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json'
```

