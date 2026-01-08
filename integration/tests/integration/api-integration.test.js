const axios = require('axios');

// Configuration
const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
};

const api = axios.create(config);

describe('API Gateway Integration Tests', () => {
  test('Health check responds correctly', async () => {
    const response = await api.get('/health');
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('healthy');
  });

  test('Detailed health check includes all services', async () => {
    const response = await api.get('/health/detailed');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('api-gateway');
    expect(response.data).toHaveProperty('ai-service');
    expect(response.data).toHaveProperty('fraud-service');
    expect(response.data).toHaveProperty('workflow-service');
  });

  test('Rate limiting works', async () => {
    const requests = Array(105).fill().map(() => api.get('/health'));
    const results = await Promise.allSettled(requests);

    const rejectedCount = results.filter(r => r.status === 'rejected').length;
    expect(rejectedCount).toBeGreaterThan(0); // Some requests should be rate limited
  });
});

describe('Service Mesh Integration Tests', () => {
  test('AI service integration', async () => {
    const response = await api.post('/ai/analyze', {
      text: 'Test fraud analysis',
      type: 'text'
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('result');
  });

  test('Fraud detection integration', async () => {
    const response = await api.post('/fraud/detect', {
      transaction: {
        amount: 1000,
        merchant: 'suspicious-merchant.com'
      }
    });
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('risk_score');
  });

  test('Workflow integration', async () => {
    const response = await api.post('/workflow/cases/123/process');
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('workflow_id');
  });
});

describe('Database Integration Tests', () => {
  test('Case creation and retrieval', async () => {
    // Create a test case
    const createResponse = await api.post('/cases', {
      title: 'Integration Test Case',
      priority: 'HIGH',
      status: 'OPEN'
    });
    expect(createResponse.status).toBe(201);
    const caseId = createResponse.data.id;

    // Retrieve the case
    const getResponse = await api.get(`/cases/${caseId}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.data.title).toBe('Integration Test Case');
  });
});

describe('Caching Integration Tests', () => {
  test('Response caching works', async () => {
    const start = Date.now();
    await api.get('/cases'); // First request
    const firstRequest = Date.now() - start;

    const start2 = Date.now();
    await api.get('/cases'); // Second request (should be cached)
    const secondRequest = Date.now() - start2;

    // Second request should be faster due to caching
    expect(secondRequest).toBeLessThan(firstRequest);
  });
});