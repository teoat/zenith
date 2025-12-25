import { request } from './client';

export const authService = {
  login: async (credentials: { email: string; password: string; mfa_code?: string }): Promise<any> => {
    // Returns User Profile now
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: credentials.email,
        password: credentials.password,
        mfa_code: credentials.mfa_code
      }),
    });
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      return await request('/auth/logout', {
        method: 'POST'
      });
    } catch {
      // Return success even if API call fails
      return { message: 'Logged out successfully' };
    }
  },

  getCurrentUser: async (): Promise<{ id: string; email: string; role: string } | null> => {
    try {
      return await request('/auth/me');
    } catch {
      return null;
    }
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    return request('/auth/refresh', {
      method: 'POST'
    });
  },

  register: async (userData: { email: string; password: string; fullName: string }): Promise<{ message: string }> => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        full_name: userData.fullName
      }),
    });
  },

  validateToken: async (token: string): Promise<boolean> => {
    try {
      await request('/auth/validate', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return true;
    } catch {
      return false;
    }
  },

  resetPassword: async (email: string): Promise<{ message: string }> => {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      }),
    });
  }
};
