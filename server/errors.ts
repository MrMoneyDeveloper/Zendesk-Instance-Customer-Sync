export type ErrorCode = 'AUTH_FAILED' | 'PERMISSION_DENIED' | 'FEATURE_UNAVAILABLE' | 'RATE_LIMITED' | 'SERVICE_ERROR' | 'NETWORK_ERROR' | 'INVALID_INPUT' | 'SESSION_INVALID';

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: ErrorCode,
    readonly upstreamStatus?: number,
    readonly retryAfter?: number
  ) {
    super(message);
  }
}

export function fromZendeskStatus(status: number, fallback?: string): AppError {
  if (status === 401) return new AppError('The saved credential is invalid, expired, revoked, or no longer accepted.', 401, 'AUTH_FAILED', 401);
  if (status === 403) return new AppError('The credential is valid, but its Zendesk user cannot read this configuration area.', 403, 'PERMISSION_DENIED', 403);
  if (status === 404) return new AppError('This feature or endpoint is not available for the client account.', 404, 'FEATURE_UNAVAILABLE', 404);
  if (status === 429) return new AppError('Zendesk is rate limiting this request. Try again shortly.', 429, 'RATE_LIMITED', 429);
  if (status >= 500) return new AppError('Zendesk is temporarily unavailable. The saved credential has not been changed.', 502, 'SERVICE_ERROR', status);
  return new AppError(fallback ?? `Zendesk returned HTTP ${status}.`, 502, 'SERVICE_ERROR', status);
}

export function sanitiseError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return message
    .replace(/Basic\s+[A-Za-z0-9+/=._-]+/gi, 'Basic [REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9+/=._-]+/gi, 'Bearer [REDACTED]')
    .replace(/([?&](?:token|access_token|api_key)=)[^&\s]+/gi, '$1[REDACTED]')
    .slice(0, 500);
}
