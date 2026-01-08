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
  }
};
