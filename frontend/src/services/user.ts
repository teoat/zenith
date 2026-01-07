import { request } from "./client";

export const userService = {
  saveUserPreferences: async (
    preferences: Record<string, unknown>,
  ): Promise<{ success: boolean }> => {
    return request("/users/me/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    });
  },

  getMe: async (): Promise<any> => {
    return request("/users/me", {
      method: "GET",
    });
  },
};
