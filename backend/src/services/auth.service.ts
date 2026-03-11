export class AuthService {
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.API_KEY;
  }

  validateApiKey(key: string | undefined): boolean {
    if (!this.apiKey) {
      return true; // No API key configured, allow all
    }

    if (!key) {
      return false; // Key required but not provided
    }

    return this.apiKey === key;
  }
}
