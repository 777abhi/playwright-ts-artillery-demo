import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService, Role, SimulationParams } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getRole', () => {
    it('should return ADMIN when no keys are set (development mode)', () => {
      delete process.env.API_KEY;
      delete process.env.ADMIN_API_KEY;
      delete process.env.USER_API_KEY;
      authService = new AuthService();

      expect(authService.getRole('any-key')).toBe(Role.ADMIN);
      expect(authService.getRole(undefined)).toBe(Role.ADMIN);
    });

    it('should return ADMIN when matching API_KEY (backward compatibility)', () => {
      process.env.API_KEY = 'admin-secret';
      authService = new AuthService();

      expect(authService.getRole('admin-secret')).toBe(Role.ADMIN);
      expect(authService.getRole('wrong-key')).toBe(Role.GUEST);
      expect(authService.getRole(undefined)).toBe(Role.GUEST);
    });

    it('should return ADMIN when matching ADMIN_API_KEY', () => {
      process.env.ADMIN_API_KEY = 'admin-secret-new';
      authService = new AuthService();

      expect(authService.getRole('admin-secret-new')).toBe(Role.ADMIN);
    });

    it('should return USER when matching USER_API_KEY', () => {
      process.env.ADMIN_API_KEY = 'admin-secret';
      process.env.USER_API_KEY = 'user-secret';
      authService = new AuthService();

      expect(authService.getRole('user-secret')).toBe(Role.USER);
    });

    it('should return GUEST for invalid keys', () => {
      process.env.ADMIN_API_KEY = 'admin-secret';
      process.env.USER_API_KEY = 'user-secret';
      authService = new AuthService();

      expect(authService.getRole('wrong-key')).toBe(Role.GUEST);
      expect(authService.getRole(undefined)).toBe(Role.GUEST);
    });
  });

  describe('canSimulate', () => {
    beforeEach(() => {
      authService = new AuthService(); // Env vars don't matter for these tests
    });

    it('should allow ADMIN to simulate anything', () => {
      expect(authService.canSimulate(Role.ADMIN, { delay: 100 })).toBe(true);
      expect(authService.canSimulate(Role.ADMIN, { delay: -1 })).toBe(true); // Service fail
      expect(authService.canSimulate(Role.ADMIN, { memoryStress: 50 })).toBe(true);
    });

    it('should allow USER to simulate normal delay and cpu load', () => {
      expect(authService.canSimulate(Role.USER, { delay: 100, memoryStress: 0 })).toBe(true);
      expect(authService.canSimulate(Role.USER, { delay: 0, memoryStress: 0 })).toBe(true);
    });

    it('should restrict USER from simulating negative delay (service fail)', () => {
      expect(authService.canSimulate(Role.USER, { delay: -1, memoryStress: 0 })).toBe(false);
    });

    it('should restrict USER from simulating memory stress', () => {
      expect(authService.canSimulate(Role.USER, { delay: 100, memoryStress: 50 })).toBe(false);
    });

    it('should restrict GUEST from simulating anything', () => {
      expect(authService.canSimulate(Role.GUEST, { delay: 100 })).toBe(false);
      expect(authService.canSimulate(Role.GUEST, { delay: 0 })).toBe(false);
    });
  });

  describe('canResetMetrics', () => {
    beforeEach(() => {
      authService = new AuthService();
    });

    it('should allow ADMIN to reset metrics', () => {
      expect(authService.canResetMetrics(Role.ADMIN)).toBe(true);
    });

    it('should restrict USER from resetting metrics', () => {
      expect(authService.canResetMetrics(Role.USER)).toBe(false);
    });

    it('should restrict GUEST from resetting metrics', () => {
      expect(authService.canResetMetrics(Role.GUEST)).toBe(false);
    });
  });
});
