import { Integration, IntegrationMetrics } from '../types/api';

export const integrationService = {
  getIntegrations: async (): Promise<Integration[]> => {
    // Placeholder for actual API call: return request('/integrations');
    // Using mock data until backend endpoint is implemented
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                  id: 'int_001',
                  name: 'Bank API Integration',
                  type: 'rest_api',
                  status: 'active',
                  endpoint: 'https://api.bank.com/v2',
                  lastUsed: '2 min ago',
                  successRate: 0.98,
                  requestCount: 15420,
                  category: 'Banking',
                  description: 'Real-time transaction data from primary banking partner'
                },
                {
                  id: 'int_002',
                  name: 'Credit Bureau Webhook',
                  type: 'webhook',
                  status: 'active',
                  lastUsed: '15 min ago',
                  successRate: 0.95,
                  requestCount: 8920,
                  category: 'Identity',
                  description: 'Automated credit score updates and alerts'
                },
                {
                  id: 'int_003',
                  name: 'Payment Processor',
                  type: 'graphql',
                  status: 'maintenance',
                  endpoint: 'https://payments.example.com/graphql',
                  lastUsed: '1 hour ago',
                  successRate: 0.87,
                  requestCount: 45670,
                  category: 'Payments',
                  description: 'GraphQL API for payment transaction analysis'
                },
                {
                  id: 'int_004',
                  name: 'Fraud Database Sync',
                  type: 'database',
                  status: 'active',
                  lastUsed: '5 min ago',
                  successRate: 0.99,
                  requestCount: 2340,
                  category: 'Security',
                  description: 'Direct database synchronization with global fraud database'
                }
            ]);
        }, 800); 
    });
  },

  getMetrics: async (): Promise<IntegrationMetrics> => {
      // Placeholder for actual API call: return request('/integrations/metrics');
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({
                totalIntegrations: 4,
                activeIntegrations: 3,
                totalRequests: 72350,
                successRate: 0.96,
                averageLatency: 245,
                errorRate: 0.04
              });
          }, 600);
      });
  }
};
