import { z } from "zod";

/**
 * Common API Response Types
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  metadata?: Record<string, any>;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Utility to validate API responses using Zod
 */
export async function validateResponse<T>(
  response: any,
  schema: z.ZodType<T>,
): Promise<ApiResponse<T>> {
  if (!response.success) {
    return {
      success: false,
      error: response.error || {
        code: "UNKNOWN_ERROR",
        message: "An unknown error occurred",
      },
    };
  }

  try {
    const validatedData = schema.parse(response.data);
    return {
      success: true,
      data: validatedData,
      metadata: response.metadata,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation Error:", error.issues);
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Response data did not match expected schema",
          details: error.issues.map((issue) => issue.message) || error.message,
        },
      };
    }
    return {
      success: false,
      error: {
        code: "PARSING_ERROR",
        message: "Failed to parse response data",
      },
    };
  }
}
