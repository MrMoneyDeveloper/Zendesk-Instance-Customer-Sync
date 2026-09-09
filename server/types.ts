export type AuthType = 'api_token' | 'oauth';

export interface CredentialContext {
  domain: string;
  email: string;
  authType: AuthType;
}

export interface StoredConnection extends CredentialContext {
  credentialEnvelope: string;
}

export interface RequestIdentity {
  userId: string;
  zendeskHost: string;
  csrf: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      identity?: RequestIdentity;
    }
  }
}
