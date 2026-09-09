import type { ConnectionInput, ConnectionRecord, SectionKey, SectionResult, SessionInfo } from '../types';

class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

let sessionPromise: Promise<SessionInfo> | null = null;

export async function getSession(): Promise<SessionInfo> {
  sessionPromise ??= fetch('/api/session', { credentials: 'include' }).then(async (response) => {
    if (!response.ok) throw new ApiError('This app session is not authorised.', response.status);
    return response.json() as Promise<SessionInfo>;
  });
  return sessionPromise;
}

async function apiRequest<T>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const session = await getSession();
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CXE-CSRF': session.csrfToken
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string; code?: string } };
  if (!response.ok) {
    throw new ApiError(payload.error?.message ?? 'The request could not be completed.', response.status, payload.error?.code);
  }
  return payload as T;
}

export interface TestedCredential {
  credentialEnvelope: string;
  testedAt: string;
  httpStatus: number;
  accountName?: string;
}

export function testAndEncrypt(input: ConnectionInput): Promise<TestedCredential> {
  return apiRequest('/api/credentials/test-and-encrypt', input);
}

export function testSavedCredential(connection: ConnectionRecord): Promise<{ testedAt: string; httpStatus: number; accountName?: string }> {
  return apiRequest('/api/credentials/test', { connection: connectionPayload(connection) });
}

export function syncConfiguration(connection: ConnectionRecord, sections: SectionKey[]): Promise<{ sections: SectionResult[] }> {
  return apiRequest('/api/sync', { connection: connectionPayload(connection), sections });
}

function connectionPayload(connection: ConnectionRecord) {
  return {
    domain: connection.domain,
    email: connection.email,
    authType: connection.authType,
    credentialEnvelope: connection.credentialEnvelope
  };
}

export { ApiError };
