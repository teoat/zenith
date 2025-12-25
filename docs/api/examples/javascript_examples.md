# JavaScript Examples

## /auth/register

```javascript
const response = await fetch('https://api.Zenith.com/auth/register', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /auth/login

```javascript
const response = await fetch('https://api.Zenith.com/auth/login', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /auth/refresh

```javascript
const response = await fetch('https://api.Zenith.com/auth/refresh', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /auth/me

```javascript
const response = await fetch('https://api.Zenith.com/auth/me', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /cases

```javascript
const response = await fetch('https://api.Zenith.com/cases', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /cases/{case_id}

```javascript
const response = await fetch('https://api.Zenith.com/cases/{case_id}', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /cases/{case_id}/notes

```javascript
const response = await fetch('https://api.Zenith.com/cases/{case_id}/notes', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /cases/{case_id}/close

```javascript
const response = await fetch('https://api.Zenith.com/cases/{case_id}/close', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /evidence

```javascript
const response = await fetch('https://api.Zenith.com/evidence', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /evidence/{evidence_id}

```javascript
const response = await fetch('https://api.Zenith.com/evidence/{evidence_id}', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /evidence/upload/chunk

```javascript
const response = await fetch('https://api.Zenith.com/evidence/upload/chunk', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /evidence/upload/complete

```javascript
const response = await fetch('https://api.Zenith.com/evidence/upload/complete', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /fraud/analyze

```javascript
const response = await fetch('https://api.Zenith.com/fraud/analyze', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /fraud/analyze/batch

```javascript
const response = await fetch('https://api.Zenith.com/fraud/analyze/batch', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /fraud/risk-score

```javascript
const response = await fetch('https://api.Zenith.com/fraud/risk-score', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /ai/embeddings

```javascript
const response = await fetch('https://api.Zenith.com/ai/embeddings', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /ai/semantic-search

```javascript
const response = await fetch('https://api.Zenith.com/ai/semantic-search', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /ai/analyze

```javascript
const response = await fetch('https://api.Zenith.com/ai/analyze', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /ai/insights

```javascript
const response = await fetch('https://api.Zenith.com/ai/insights', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /reports/generate

```javascript
const response = await fetch('https://api.Zenith.com/reports/generate', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({key: 'value'})
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /reports/job/{job_id}

```javascript
const response = await fetch('https://api.Zenith.com/reports/job/{job_id}', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /reports/download/{report_id}

```javascript
const response = await fetch('https://api.Zenith.com/reports/download/{report_id}', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /admin/system/diagnostics

```javascript
const response = await fetch('https://api.Zenith.com/admin/system/diagnostics', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /admin/database/stats

```javascript
const response = await fetch('https://api.Zenith.com/admin/database/stats', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

## /admin/cache/stats

```javascript
const response = await fetch('https://api.Zenith.com/admin/cache/stats', {
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_API_TOKEN',
        'Content-Type': 'application/json'
    },
    
});

if (response.ok) {
    const data = await response.json();
    console.log('Success:', data);
} else {
    console.error('Error:', response.status, response.statusText);
}
```

