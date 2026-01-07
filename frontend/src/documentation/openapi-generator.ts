// OpenAPI Schema Generation - Phase 5 Implementation
// Generate OpenAPI/Swagger schemas from TypeScript types

// @ts-ignore
import type { OpenAPIV3 } from 'openapi-types';

// ==========================================
// TYPE TO SCHEMA CONVERTERS
// ==========================================

// Convert TypeScript types to OpenAPI schemas
export function generateOpenAPISchema<T>(
  _type: T,
  title?: string
): any {
  // This would be a comprehensive implementation
  // For now, providing basic structure

  return {
    type: 'object',
    title,
    properties: {},
    required: []
  };
}

// ==========================================
// API ENDPOINT DOCUMENTATION
// ==========================================

export const apiDocumentation = {
  openapi: '3.0.3',
  info: {
    title: 'Fraud Detection Platform API',
    version: '1.0.0',
    description: 'Comprehensive API for fraud detection and investigation'
  },
  servers: [
    {
      url: 'http://localhost:8000/api/v1',
      description: 'Development server'
    },
    {
      url: 'https://api.fraudplatform.com/v1',
      description: 'Production server'
    }
  ],
  paths: {
    // User endpoints
    '/users': {
      get: {
        summary: 'Get users',
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1 },
            description: 'Page number'
          },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100 },
            description: 'Items per page'
          }
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    },
                    meta: { $ref: '#/components/schemas/PaginationMeta' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUserRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        summary: 'Get user by ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    // Case endpoints
    '/cases': {
      get: {
        summary: 'Get cases',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['open', 'in_progress', 'closed', 'suspended']
            }
          },
          {
            name: 'assigneeId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Cases retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Case' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create case',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCaseRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Case created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Case' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      // User schemas
      User: {
        type: 'object',
        required: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          role: {
            type: 'string',
            enum: ['admin', 'investigator', 'analyst', 'viewer']
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean', default: true },
          lastLogin: { type: 'string', format: 'date-time' }
        }
      },
      CreateUserRequest: {
        type: 'object',
        required: ['email', 'name', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          role: {
            type: 'string',
            enum: ['admin', 'investigator', 'analyst', 'viewer']
          }
        }
      },

      // Case schemas
      Case: {
        type: 'object',
        required: ['id', 'title', 'description', 'status', 'priority', 'createdById', 'createdAt', 'updatedAt'],
        properties: {
          id: { type: 'string', pattern: '^CASE-\\d{4}-\\d{6}$' },
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', minLength: 1, maxLength: 2000 },
          status: {
            type: 'string',
            enum: ['open', 'in_progress', 'closed', 'suspended']
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical']
          },
          assigneeId: { type: 'string', format: 'uuid' },
          createdById: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          closedAt: { type: 'string', format: 'date-time' },
          tags: {
            type: 'array',
            items: { type: 'string', maxLength: 50 },
            maxItems: 20
          }
        }
      },
      CreateCaseRequest: {
        type: 'object',
        required: ['title', 'description', 'priority'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', minLength: 1, maxLength: 2000 },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical']
          },
          assigneeId: { type: 'string', format: 'uuid' },
          tags: {
            type: 'array',
            items: { type: 'string', maxLength: 50 },
            maxItems: 20
          }
        }
      },

      // Common schemas
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1 },
          pageSize: { type: 'integer', minimum: 1, maximum: 100 },
          total: { type: 'integer', minimum: 0 },
          hasMore: { type: 'boolean' }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },
  security: [
    { bearerAuth: [] },
    { apiKeyAuth: [] }
  ]
} as const;

// ==========================================
// TYPE-DRIVEN DOCUMENTATION GENERATOR
// ==========================================

// Generate documentation from TypeScript types
export function generateTypeDrivenDocs<T>(
  _endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  options: {
    summary: string;
    requestType?: T;
    responseType?: any;
    parameters?: Array<{
      name: string;
      in: 'query' | 'path' | 'header';
      required?: boolean;
      schema: any;
    }>;
  }
): OpenAPIV3.OperationObject {
  const operation: OpenAPIV3.OperationObject = {
    summary: options.summary,
    parameters: options.parameters || [],
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                data: options.responseType ? { $ref: `#/components/schemas/${options.responseType}` } : { type: 'object' }
              }
            }
          }
        }
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      '404': {
        description: 'Not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    }
  };

  // Add request body for non-GET methods
  if (method !== 'GET' && options.requestType) {
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${options.requestType}` }
        }
      }
    };
  }

  return operation;
}

// ==========================================
// API CLIENT WITH TYPE-DRIVEN DOCUMENTATION
// ==========================================

// Type-safe API client that generates documentation
export class DocumentedApiClient {
  private docs: any;

  constructor(_baseUrl: string) {
    this.docs = { ...apiDocumentation };
  }

  // Add endpoint to documentation
  addEndpoint(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    operation: OpenAPIV3.OperationObject
  ) {
    if (!this.docs.paths![path]) {
      this.docs.paths![path] = {};
    }
    (this.docs.paths![path] as any)[method.toLowerCase()] = operation;
  }

  // Get OpenAPI documentation
  getDocumentation(): OpenAPIV3.Document {
    return this.docs;
  }

  // Export to JSON
  exportToFile(filename: string) {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(this.docs, null, 2));
  }
}