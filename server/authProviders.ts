import { AppError, fromZendeskStatus } from './errors.js';
import { normaliseDomain } from './security.js';
import type { AuthType, CredentialContext } from './types.js';

export interface AuthTestResult {
  httpStatus: number;
  accountName?: string;
}

export interface ZendeskAuthProvider {
  readonly type: AuthType;
  authorizationHeader(context: CredentialContext, credential: string): string;
  test(context: CredentialContext, credential: string): Promise<AuthTestResult>;
}

abstract class BaseProvider implements ZendeskAuthProvider {
  abstract readonly type: AuthType;
  abstract authorizationHeader(context: CredentialContext, credential: string): string;

  async test(context: CredentialContext, credential: string): Promise<AuthTestResult> {
    const domain = normaliseDomain(context.domain);
    let response: Response;
    try {
      response = await fetch(`https://${domain}/api/v2/users/me.json`, {
        headers: { Accept: 'application/json', Authorization: this.authorizationHeader(context, credential), 'User-Agent': 'CXE-Config-Sync/0.1' },
        redirect: 'error',
        signal: AbortSignal.timeout(15_000)
      });
    } catch (error) {
      throw new AppError('Connection could not be completed. Credential status has not been changed.', 502, 'NETWORK_ERROR');
    }
    if (!response.ok) throw fromZendeskStatus(response.status);
    const data = await response.json() as { user?: { name?: string } };
    return { httpStatus: response.status, accountName: data.user?.name };
  }
}

export class ApiTokenProvider extends BaseProvider {
  readonly type = 'api_token' as const;

  authorizationHeader(context: CredentialContext, credential: string): string {
    if (!context.email.trim()) throw new AppError('API email is required for token authentication.', 400, 'INVALID_INPUT');
    return `Basic ${Buffer.from(`${context.email.trim()}/token:${credential}`).toString('base64')}`;
  }
}

export class OAuthProvider extends BaseProvider {
  readonly type = 'oauth' as const;

  authorizationHeader(_context: CredentialContext, credential: string): string {
    return `Bearer ${credential}`;
  }
}

const providers: Record<AuthType, ZendeskAuthProvider> = {
  api_token: new ApiTokenProvider(),
  oauth: new OAuthProvider()
};

export function getAuthProvider(type: AuthType): ZendeskAuthProvider {
  return providers[type];
}
