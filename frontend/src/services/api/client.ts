/**
 * API Service Client
 * Provides a unified API client with Axios-like interface for type-safe API calls
 */

import { request } from "@/services/client";

export interface AxiosLikeResponse<T> {
  data: T;
  status: number;
}

/**
 * API Service with Axios-compatible interface
 * Used for type-safe API calls throughout the application
 */
export const apiService = {
  async get<T>(url: string): Promise<AxiosLikeResponse<T>> {
    const data = await request<T>(url, { method: "GET" });
    return { data, status: 200 };
  },

  async post<T>(url: string, payload?: unknown): Promise<AxiosLikeResponse<T>> {
    const data = await request<T>(url, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return { data, status: 200 };
  },

  async put<T>(url: string, payload?: unknown): Promise<AxiosLikeResponse<T>> {
    const data = await request<T>(url, {
      method: "PUT",
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return { data, status: 200 };
  },

  async delete<T>(url: string): Promise<AxiosLikeResponse<T>> {
    const data = await request<T>(url, { method: "DELETE" });
    return { data, status: 200 };
  },

  async patch<T>(
    url: string,
    payload?: unknown,
  ): Promise<AxiosLikeResponse<T>> {
    const data = await request<T>(url, {
      method: "PATCH",
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return { data, status: 200 };
  },
};

export default apiService;
