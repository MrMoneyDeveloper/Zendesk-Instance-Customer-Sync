import type { NextFunction, Request, Response } from 'express';
import { SignJWT, jwtVerify, importSPKI } from 'jose';
import { config } from './config.js';
import { AppError } from './errors.js';
import { safeEqual } from './security.js';
import type { RequestIdentity } from './types.js';

const COOKIE_NAME = 'cxe_sync_session';

export async function validateZendeskToken(token: string): Promise<{ sub: string; iss: string }> {
  if (!config.zendeskPublicKey || !config.zendeskAudience) {
    throw new AppError('Zendesk signed-request validation is not configured.', 503, 'SESSION_INVALID');
  }
  const key = await importSPKI(config.zendeskPublicKey, 'RS256');
  const verified = await jwtVerify(token, key, {
    algorithms: ['RS256'],
    audience: config.zendeskAudience,
    issuer: config.zendeskExpectedIssuer || undefined
  });
  const sub = String(verified.payload.sub ?? '');
  const iss = String(verified.payload.iss ?? '');
  if (!sub || !iss || !iss.endsWith('.zendesk.com')) throw new AppError('Zendesk session claims are invalid.', 401, 'SESSION_INVALID');
  return { sub, iss };
}

export async function createSession(identity: Omit<RequestIdentity, 'csrf'>): Promise<{ token: string; csrf: string }> {
  const csrf = config.randomCsrf();
  const token = await new SignJWT({ zendeskHost: identity.zendeskHost, csrf, role: identity.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(identity.userId)
    .setIssuer('cxe-config-sync')
    .setAudience('cxe-config-sync-ui')
    .setIssuedAt()
    .setExpirationTime(`${config.sessionTtlSeconds}s`)
    .sign(config.sessionSecret);
  return { token, csrf };
}

export function setSessionCookie(response: Response, token: string): void {
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: !config.demoMode,
    sameSite: config.demoMode ? 'lax' : 'none',
    maxAge: config.sessionTtlSeconds * 1000,
    path: '/'
  });
}

export async function sessionMiddleware(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    if (config.demoMode && !request.cookies?.[COOKIE_NAME]) {
      request.identity = { userId: 'demo-user', zendeskHost: 'demo.zendesk.com', csrf: 'demo-csrf', role: 'admin' };
      next();
      return;
    }
    const token = request.cookies?.[COOKIE_NAME];
    if (!token) throw new AppError('This app session has expired. Reopen the app from Zendesk.', 401, 'SESSION_INVALID');
    const verified = await jwtVerify(token, config.sessionSecret, { issuer: 'cxe-config-sync', audience: 'cxe-config-sync-ui', algorithms: ['HS256'] });
    request.identity = {
      userId: String(verified.payload.sub),
      zendeskHost: String(verified.payload.zendeskHost),
      csrf: String(verified.payload.csrf),
      role: verified.payload.role ? String(verified.payload.role) : undefined
    };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('This app session is invalid.', 401, 'SESSION_INVALID'));
  }
}

export function csrfMiddleware(request: Request, _response: Response, next: NextFunction): void {
  if (request.method === 'GET' || request.method === 'HEAD') return next();
  const supplied = request.header('X-CXE-CSRF') ?? '';
  if (!request.identity || !safeEqual(supplied, request.identity.csrf)) return next(new AppError('Request verification failed.', 403, 'SESSION_INVALID'));
  next();
}
