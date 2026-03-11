import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth.service';

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

  it('should validate API key successfully when it matches process.env.API_KEY', () => {
    process.env.API_KEY = 'secret-key-123';
    authService = new AuthService();

    expect(authService.validateApiKey('secret-key-123')).toBe(true);
  });

  it('should fail validation when API key does not match', () => {
    process.env.API_KEY = 'secret-key-123';
    authService = new AuthService();

    expect(authService.validateApiKey('wrong-key')).toBe(false);
  });

  it('should fail validation when no API key is provided', () => {
    process.env.API_KEY = 'secret-key-123';
    authService = new AuthService();

    expect(authService.validateApiKey(undefined)).toBe(false);
  });

  it('should pass validation for any key if API_KEY env variable is not set (development mode)', () => {
    delete process.env.API_KEY;
    authService = new AuthService();

    expect(authService.validateApiKey('any-key')).toBe(true);
    expect(authService.validateApiKey(undefined)).toBe(true);
  });
});
