import { request } from './client';

export const authService = {
  login: async (credentials: { email: string; password: string; mfa_code?: string }): Promise<{ access_token: string }> => {
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
    // Clear token first
    localStorage.removeItem('token');
    try {
      return await request('/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      // Return success even if API call fails
      return { message: 'Logged out successfully' };
    }
  },

  getCurrentUser: async (): Promise<any> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    return request('/auth/me');
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
