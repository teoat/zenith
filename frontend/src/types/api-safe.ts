import { apiService } from "@/services/api/client";
import { isApiErrorResponse } from "./guards";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Type-safe API client wrapper
 * Enforces strictly typed responses and unified error handling
 */
export const safeApi = {
  get: async <T>(url: string): Promise<ApiResponse<T>> => {
    try {
      const response = await apiService.get<T>(url);
      return {
        data: response.data,
        error: null,
        status: response.status,
      };
    } catch (error: any) {
      if (isApiErrorResponse(error.response?.data)) {
        return {
          data: null,
          error: error.response.data.message || "Unknown API Error",
          status: error.response?.status || 500,
        };
      }
      return {
        data: null,
        error: error.message || "Network Error",
        status: error.response?.status || 500,
      };
    }
  },

  post: async <T>(url: string, payload: unknown): Promise<ApiResponse<T>> => {
    try {
      const response = await apiService.post<T>(url, payload);
      return {
        data: response.data,
        error: null,
        status: response.status,
      };
    } catch (error: any) {
      if (isApiErrorResponse(error.response?.data)) {
        return {
          data: null,
          error: error.response.data.message || "Unknown API Error",
          status: error.response?.status || 500,
        };
      }
      return {
        data: null,
        error: error.message || "Network Error",
        status: error.response?.status || 500,
      };
    }
  },
};
