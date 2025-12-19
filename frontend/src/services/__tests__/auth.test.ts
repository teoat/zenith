import { authService } from '../auth';

describe('authService', () => {
  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should have login method', () => {
    expect(authService.login).toBeDefined();
  });
});
