/**
 * AI Services API Client
 * Frontend client for AI-powered services
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

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

    // Auth is handled by cookies or HttpOnly tokens via client configuration
  }

  // Cognitive Automation
  async makeCognitiveDecision(decisionType: string, data: Record<string, unknown>, context: Record<string, unknown> = {}) {
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
  async generatePredictiveInsights(forecastType: string, data: Record<string, unknown>) {
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
  async processInteraction(input: string, context: Record<string, unknown> = {}) {
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
    } catch (error: unknown) {
      console.error('AI health check failed:', error);
      return { overall_status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Real-time subscriptions (if WebSocket is implemented)
  subscribeToAIUpdates(_callback: (data: Record<string, unknown>) => void) {
    // Placeholder for WebSocket subscription
    // TODO: Implement AI update subscription
  }

  // Error handling
  handleError(error: unknown) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    if (axiosError.response) {
      // Server responded with error status
      const { status, data } = axiosError.response;
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
          throw new Error(data?.detail || 'AI service error');
      }
    } else if (axiosError.request) {
      // Network error
      throw new Error('Network error - unable to connect to AI services');
    } else {
      // Other error
      const message = error instanceof Error ? error.message : 'Unknown AI service error';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const aiService = new AIServiceClient();
export default aiService;
