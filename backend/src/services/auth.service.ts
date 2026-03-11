export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export interface SimulationParams {
  delay?: number;
  memoryStress?: number;
}

export class AuthService {
  private readonly adminApiKey: string | undefined;
  private readonly userApiKey: string | undefined;

  constructor() {
    this.adminApiKey = process.env.ADMIN_API_KEY || process.env.API_KEY;
    this.userApiKey = process.env.USER_API_KEY;
  }

  getRole(apiKey: string | undefined): Role {
    if (!this.adminApiKey && !this.userApiKey) {
      return Role.ADMIN; // Development mode
    }

    if (!apiKey) {
      return Role.GUEST;
    }

    if (this.adminApiKey && apiKey === this.adminApiKey) {
      return Role.ADMIN;
    }

    if (this.userApiKey && apiKey === this.userApiKey) {
      return Role.USER;
    }

    return Role.GUEST;
  }

  canSimulate(role: Role, params: SimulationParams): boolean {
    if (role === Role.ADMIN) {
      return true;
    }

    if (role === Role.USER) {
      if (params.delay !== undefined && params.delay < 0) {
        return false; // Users cannot simulate service failures
      }
      if (params.memoryStress !== undefined && params.memoryStress > 0) {
        return false; // Users cannot simulate memory stress
      }
      return true;
    }

    return false; // GUEST cannot simulate
  }

  canResetMetrics(role: Role): boolean {
    return role === Role.ADMIN; // Only admins can reset metrics
  }
}
