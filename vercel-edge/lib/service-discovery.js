// Service discovery for Railway backend services
const services = {
  api: process.env.RAILWAY_API_URL || 'https://api-gateway.railway.app',
  auth: process.env.RAILWAY_AUTH_URL || 'https://auth-service.railway.app',
  cases: process.env.RAILWAY_CASE_URL || 'https://case-service.railway.app',
  ai: process.env.RAILWAY_AI_URL || 'https://ai-service.railway.app',
};

export function getServiceUrl(serviceName: string): string {
  const url = services[serviceName as keyof typeof services];
  if (!url) {
    throw new Error(`Service ${serviceName} not configured`);
  }
  return url;
}

export async function healthCheck(serviceName: string): Promise<boolean> {
  try {
    const url = getServiceUrl(serviceName);
    const response = await fetch(`${url}/health`, {
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error(`Health check failed for ${serviceName}:`, error);
    return false;
  }
}

export async function discoverServices(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const [name] of Object.entries(services)) {
    results[name] = await healthCheck(name);
  }

  return results;
}