import { components } from './openapi';

/**
 * SSOT-compliant User type derived from Backend OpenAPI schema.
 */
export type User = components['schemas']['UserProfileResponse'];

/**
 * SSOT-compliant Login Response.
 */
export type TokenResponse = components['schemas']['TokenResponse'];

/**
 * SSOT-compliant Register Request.
 */
export type RegisterRequest = components['schemas']['RegisterRequest'];

/**
 * SSOT-compliant Health Check Response.
 */
export type HealthStatus = any;
