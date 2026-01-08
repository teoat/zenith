// Configuration for Zenith Fraud Detection
export const API_BASE = process.env.REACT_APP_API_URL ||
  process.env.VITE_API_URL ||
  'https://zenith-gateway.zenith-platform-v1.workers.dev/api/v1';

// For development, use local backend
if (process.env.NODE_ENV === 'development') {
  // Use local backend or Railway URL
}

export const config = {
  api: {
    baseUrl: API_BASE,
    timeout: 10000,
  },
  features: {
    enableEdgeGateway: true,
    enableCaching: true,
    enablePWA: true,
  },
};