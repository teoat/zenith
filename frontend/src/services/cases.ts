import type { Note } from "@/types/note";
import { request } from "./client";
import type { Case } from "@/types/schema";
import type { PaginationInfo } from "@/types/api";
import type { ApiResponse, CollectionResponse } from "@/types/api-responses";

/**
 * Service for managing fraud investigation cases.
 * Provides CRUD operations and case management functionality.
 */
export const caseService = {
  /**
   * Retrieves a paginated list of cases with optional filtering.
   *
   * @param params - Optional query parameters for filtering and pagination
   * @returns Promise resolving to a collection of cases with pagination info
   */
  getCases: async (
    params?: Record<string, unknown>,
  ): Promise<CollectionResponse<Case> & { pagination: PaginationInfo }> => {
    const query = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return request(`/cases${query}`);
  },

  /**
   * Retrieves a single case by its ID.
   *
   * @param caseId - The unique identifier of the case
   * @returns Promise resolving to the case data
   */
  getCase: async (caseId: string): Promise<ApiResponse<Case>> => {
    return request(`/cases/${caseId}`);
  },

  /**
   * Creates a new fraud investigation case.
   *
   * @param caseData - The case data to create (partial Case object)
   * @returns Promise resolving to the created case with its ID
   */
  createCase: async (
    caseData: Partial<Case>,
  ): Promise<ApiResponse<{ id: string; case: Case }>> => {
    return request("/cases", {
      method: "POST",
      body: JSON.stringify(caseData),
    });
  },

  /**
   * Updates an existing case with new data.
   *
   * @param caseId - The unique identifier of the case to update
   * @param data - The partial case data to update
   * @returns Promise resolving to the updated case
   */
  updateCase: async (
    caseId: string,
    data: Partial<Case>,
  ): Promise<ApiResponse<Case>> => {
    return request(`/cases/${caseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Deletes a case by its ID.
   *
   * @param caseId - The unique identifier of the case to delete
   * @returns Promise resolving to a confirmation message
   */
  deleteCase: async (caseId: string): Promise<{ message: string }> => {
    return request(`/cases/${caseId}`, { method: "DELETE" });
  },

  getCaseNotes: async (caseId: string): Promise<{ notes: Note[] }> => {
    return request(`/cases/${caseId}/notes`);
  },

  addCaseNote: async (
    caseId: string,
    note: { title: string; content: string; tags: string[] },
  ): Promise<{ note: Note }> => {
    return request(`/cases/${caseId}/notes`, {
      method: "POST",
      body: JSON.stringify(note),
    });
  },

  updateCaseNote: async (
    caseId: string,
    noteId: string,
    note: { title: string; content: string; tags: string[] },
  ): Promise<{ note: Note }> => {
    return request(`/cases/${caseId}/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(note),
    });
  },

  deleteCaseNote: async (
    caseId: string,
    noteId: string,
  ): Promise<{ message: string }> => {
    return request(`/cases/${caseId}/notes/${noteId}`, {
      method: "DELETE",
    });
  },

  getAllCases: async (params?: Record<string, unknown>): Promise<Case[]> => {
    const query = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    const result = await request(`/cases${query}`);
    const cases = Array.isArray(result) ? result : (result as any).cases || [];

    return cases;
  },

  getCaseStatistics: async (): Promise<{
    total: number;
    open: number;
    in_progress: number;
    closed: number;
    by_priority: { high: number; medium: number; low: number };
  }> => {
    return request("/stats/cases");
  },
};
