/**
 * AI Services API Client
 * Frontend client for AI-powered services
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class AIServiceClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/v1/ai`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Cognitive Automation
  async makeCognitiveDecision(decisionType: string, data: any, context: any = {}) {
    try {
      const response = await this.client.post('/cognitive/decision', {
        decision_type: decisionType,
        data,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Cognitive decision failed:', error);
      throw error;
    }
  }

  // Predictive Intelligence
  async generatePredictiveInsights(forecastType: string, data: any) {
    try {
      const response = await this.client.post('/predictive/insights', {
        forecast_type: forecastType,
        data
      });
      return response.data;
    } catch (error) {
      console.error('Predictive insights failed:', error);
      throw error;
    }
  }

  // Human-AI Collaboration
  async processInteraction(input: string, context: any = {}) {
    try {
      const response = await this.client.post('/collaboration/interact', {
        input,
        context
      });
      return response.data;
    } catch (error) {
      console.error('AI interaction failed:', error);
      throw error;
    }
  }

  // Autonomous Scaling
  async optimizeScaling(resourceType: string = 'all') {
    try {
      const response = await this.client.post('/scaling/optimize', {
        resource_type: resourceType
      });
      return response.data;
    } catch (error) {
      console.error('Scaling optimization failed:', error);
      throw error;
    }
  }

  // Health Check
  async getAIHealthStatus() {
    try {
      const response = await this.client.get('/health/ai');
      return response.data;
    } catch (error: any) {
      console.error('AI health check failed:', error);
      return { overall_status: 'unhealthy', error: error.message };
    }
  }

  // Real-time subscriptions (if WebSocket is implemented)
  subscribeToAIUpdates(callback: (data: any) => void) {
    // Placeholder for WebSocket subscription
    console.log('AI update subscription not implemented yet');
  }

  // Error handling
  handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      switch (status) {
        case 401:
          // Redirect to login
          window.location.href = '/login';
          break;
        case 403:
          throw new Error('Access denied to AI services');
        case 429:
          throw new Error('AI service rate limit exceeded');
        default:
          throw new Error(data.detail || 'AI service error');
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error - unable to connect to AI services');
    } else {
      // Other error
      throw new Error(error.message || 'Unknown AI service error');
    }
  }
}

// Export singleton instance
export const aiService = new AIServiceClient();
export default aiService;
