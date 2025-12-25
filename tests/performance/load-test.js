// Load Testing Script for k6
// Tests API performance under various load conditions
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const requestCount = new Counter('request_count');

// Test configuration
export const options = {
  stages: [
    // Ramp-up
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 1000 },  // Ramp to 1000 users
    { duration: '5m', target: 1000 },  // Stay at 1000 users
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'], // 95% < 200ms, 99% < 500ms
    'http_req_failed': ['rate<0.01'],  // Error rate < 1%
    'errors': ['rate<0.05'],           // Custom error rate < 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

// Test setup
export function setup() {
  console.log('Starting load test against:', BASE_URL);
  
  // Create test user / get auth token if needed
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'test123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const authToken = loginRes.json('access_token');
  return { authToken };
}

// Main test scenario
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
  };

  group('API Endpoints', () => {
    // Health check
    group('Health Check', () => {
      const res = http.get(`${BASE_URL}/health`);
      check(res, {
        'health check is 200': (r) => r.status === 200,
        'health check response time < 50ms': (r) => r.timings.duration < 50,
      });
      apiDuration.add(res.timings.duration);
      requestCount.add(1);
      errorRate.add(res.status !== 200);
    });

    // Cases API
    group('Cases API', () => {
      const res = http.get(`${BASE_URL}/api/v1/cases`, { headers });
      check(res, {
        'cases list is 200': (r) => r.status === 200,
        'cases response time < 200ms': (r) => r.timings.duration < 200,
        'cases returns array': (r) => Array.isArray(r.json('cases')),
      });
      apiDuration.add(res.timings.duration);
      requestCount.add(1);
      errorRate.add(res.status !== 200);
    });

    // Case details
    group('Case Details', () => {
      const caseId = 'test-case-id'; // Replace with actual ID
      const res = http.get(`${BASE_URL}/api/v1/cases/${caseId}`, { headers });
      check(res, {
        'case detail status ok': (r) => r.status === 200 || r.status === 404,
        'case detail response time < 100ms': (r) => r.timings.duration < 100,
      });
      apiDuration.add(res.timings.duration);
      requestCount.add(1);
      errorRate.add(res.status >= 500);
    });

    // AI Chat endpoint
    group('AI Chat', () => {
      const payload = JSON.stringify({
        message: 'Analyze this transaction',
        context: { case_id: 'test-case-id' }
      });
      
      const res = http.post(`${BASE_URL}/api/v1/ai/chat`, payload, { headers });
      check(res, {
        'AI chat responds': (r) => r.status === 200 || r.status === 401,
        'AI chat response time < 2s': (r) => r.timings.duration < 2000,
      });
      apiDuration.add(res.timings.duration);
      requestCount.add(1);
      errorRate.add(res.status >= 500);
    });

    // Transaction analysis
    group('Transaction Analysis', () => {
      const payload = JSON.stringify({
        transaction_id: 'txn-123',
        amount: 15000.00,
        currency: 'USD',
        from_account: 'ACC001',
        to_account: 'ACC002',
        timestamp: new Date().toISOString()
      });
      
      const res = http.post(`${BASE_URL}/api/v1/ai/analyze`, payload, { headers });
      check(res, {
        'analysis responds': (r) => r.status === 200 || r.status === 401,
        'analysis response time < 1s': (r) => r.timings.duration < 1000,
      });
      apiDuration.add(res.timings.duration);
      requestCount.add(1);
      errorRate.add(res.status >= 500);
    });
  });

  // Think time between requests
  sleep(1);
}

// Teardown
export function teardown(data) {
  console.log('Load test completed');
}

// Handle summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '';
  const enableColors = options?.enableColors || false;
  
  let summary = `
${indent}Performance Test Summary
${indent}=======================
${indent}
${indent}Total Requests: ${data.metrics.request_count.values.count}
${indent}Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
${indent}
${indent}Response Times:
${indent}  p(50): ${data.metrics.api_duration.values['p(50)']}ms
${indent}  p(95): ${data.metrics.api_duration.values['p(95)']}ms
${indent}  p(99): ${data.metrics.api_duration.values['p(99)']}ms
${indent}
${indent}Pass/Fail:
`;

  for (const [threshold, result] of Object.entries(data.thresholds)) {
    const status = result.ok ? '✓ PASS' : '✗ FAIL';
    summary += `${indent}  ${threshold}: ${status}\n`;
  }

  return summary;
}
