/**
 * Service Discovery for Railway Backend Services
 * Maps frontend API paths to Railway backend service URLs
 */

import { config } from "./config";

export interface ServiceEndpoint {
  name: string;
  baseUrl: string;
  healthPath: string;
}

export const services: Record<string, ServiceEndpoint> = {
  api: {
    name: "api-gateway",
    baseUrl: config.RAILWAY_API_GATEWAY_URL,
    healthPath: "/health",
  },
};

export function getServiceUrl(path: string): string {
  const pathParts = path.split("/").filter(Boolean);
  const basePath = pathParts[0];
  const remainingPath = pathParts.slice(1).join("/");
  
  // Map API paths to backend services
  const serviceRoutes: Record<string, string> = {
    auth: "api/v1/auth",
    cases: "api/v1/cases",
    ai: "api/v1/ai",
    fraud: "api/v1/fraud",
    workflow: "api/v1/workflow",
    regulatory: "api/v1/regulatory",
    search: "api/v1/search",
    diagnostics: "api/v1/diagnostics",
  };

  const servicePrefix = serviceRoutes[basePath];
  if (servicePrefix) {
    const finalPath = remainingPath ? `${servicePrefix}/${remainingPath}` : servicePrefix;
    return `${config.RAILWAY_API_GATEWAY_URL}/${finalPath}`;
  }
  
  // Default to API gateway
  return `${config.RAILWAY_API_GATEWAY_URL}/${path}`;
}

export function getServiceName(path: string): string {
  const pathParts = path.split("/").filter(Boolean);
  const serviceMap: Record<string, string> = {
    auth: "auth-service",
    cases: "case-service",
    ai: "ai-service",
    fraud: "fraud-service",
    workflow: "workflow-service",
    regulatory: "regulatory-service",
    search: "search-service",
    diagnostics: "diagnostics-service",
  };
  return serviceMap[pathParts[0]] || "api-gateway";
}

export function getAllServices(): ServiceEndpoint[] {
  return Object.values(services);
}

export function isValidServicePath(path: string): boolean {
  const validPrefixes = ["auth", "cases", "ai", "fraud", "workflow", "regulatory", "search", "diagnostics", "health"];
  const firstPart = path.split("/").filter(Boolean)[0];
  return validPrefixes.includes(firstPart);
}
