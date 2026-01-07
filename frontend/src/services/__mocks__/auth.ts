// Mock implementation for auth service
export const authService = {
  login: jest.fn().mockResolvedValue({ access_token: "mock-token" }),
  logout: jest.fn().mockResolvedValue({ message: "Logged out" }),
  getCurrentUser: jest.fn().mockResolvedValue(null),
  refreshToken: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue({ access_token: "mock-token" }),
  verifyEmail: jest.fn().mockResolvedValue({ message: "Email verified" }),
  resetPassword: jest.fn().mockResolvedValue({ message: "Password reset" }),
  changePassword: jest.fn().mockResolvedValue({ message: "Password changed" }),
};
