import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import { z } from 'zod';
import { getAuthProvider } from './authProviders.js';
import { config } from './config.js';
import { AppError, sanitiseError } from './errors.js';
import { decryptCredential, encryptCredential, normaliseDomain } from './security.js';
import { createSession, csrfMiddleware, sessionMiddleware, setSessionCookie, validateZendeskToken } from './session.js';
import { sectionKeys, syncSections } from './syncEngine.js';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const app = express();
const distDir = path.resolve(process.cwd(), 'dist');

app.disable('x-powered-by');
app.use(helmet({
  frameguard: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://static.zdassets.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'self'", 'https://*.zendesk.com']
    }
  }
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false, limit: '32kb' }));
app.use(express.json({ limit: '64kb' }));

app.get('/health', (_request, response) => response.json({ status: 'ok', demo: config.demoMode }));

app.post('/app', async (request, response, next) => {
  try {
    const token = String(request.body.token ?? '');
    if (!token) throw new AppError('Zendesk did not provide a signed app token.', 401, 'SESSION_INVALID');
    const claims = await validateZendeskToken(token);
    const session = await createSession({ userId: claims.sub, zendeskHost: claims.iss });
    setSessionCookie(response, session.token);
    response.sendFile(path.join(distDir, 'index.html'));
  } catch (error) {
    next(error);
  }
});

if (config.demoMode) {
  app.get('/app', async (_request, response, next) => {
    try {
      const session = await createSession({ userId: 'demo-user', zendeskHost: 'demo.zendesk.com', role: 'admin' });
      setSessionCookie(response, session.token);
      response.sendFile(path.join(distDir, 'index.html'));
    } catch (error) {
      next(error);
    }
  });
}

app.use('/api', sessionMiddleware, csrfMiddleware);

app.get('/api/session', (request, response) => {
  response.json({
    authenticated: true,
    demo: config.demoMode,
    csrfToken: request.identity?.csrf,
    user: config.demoMode ? { id: 'demo-user', name: 'Amina Dlamini', role: 'admin' } : undefined
  });
});

const credentialContextSchema = z.object({
  domain: z.string().min(4).max(255),
  email: z.string().email().max(255),
  authType: z.enum(['api_token', 'oauth'])
});

const inputSchema = credentialContextSchema.extend({
  clientId: z.string().min(1).max(128),
  clientName: z.string().min(1).max(255),
  credential: z.string().min(1).max(4096)
});

const storedSchema = credentialContextSchema.extend({ credentialEnvelope: z.string().min(1).max(12_000) });

app.post('/api/credentials/test-and-encrypt', async (request, response, next) => {
  const started = Date.now();
  try {
    const input = inputSchema.parse(request.body);
    const context = { domain: normaliseDomain(input.domain), email: input.email.trim(), authType: input.authType };
    const result = config.demoMode
      ? { httpStatus: 200, accountName: 'Demo Zendesk Administrator' }
      : await getAuthProvider(context.authType).test(context, input.credential);
    const credentialEnvelope = encryptCredential(input.credential, context);
    logger.info({ operation: 'credential.connect', userId: request.identity?.userId, clientId: input.clientId, httpStatus: result.httpStatus, durationMs: Date.now() - started, success: true });
    response.json({ credentialEnvelope, testedAt: new Date().toISOString(), ...result });
  } catch (error) {
    logger.warn({ operation: 'credential.connect', userId: request.identity?.userId, durationMs: Date.now() - started, success: false, error: sanitiseError(error) });
    next(error);
  }
});

app.post('/api/credentials/test', async (request, response, next) => {
  const started = Date.now();
  try {
    const connection = storedSchema.parse(request.body.connection);
    const context = { domain: normaliseDomain(connection.domain), email: connection.email.trim(), authType: connection.authType };
    const credential = connection.credentialEnvelope.startsWith('demo:') && config.demoMode ? 'demo' : decryptCredential(connection.credentialEnvelope, context);
    const result = config.demoMode ? { httpStatus: 200, accountName: 'Demo Zendesk Administrator' } : await getAuthProvider(context.authType).test(context, credential);
    logger.info({ operation: 'credential.test', userId: request.identity?.userId, httpStatus: result.httpStatus, durationMs: Date.now() - started, success: true });
    response.json({ testedAt: new Date().toISOString(), ...result });
  } catch (error) {
    logger.warn({ operation: 'credential.test', userId: request.identity?.userId, durationMs: Date.now() - started, success: false, error: sanitiseError(error) });
    next(error);
  }
});

app.post('/api/sync', async (request, response, next) => {
  const started = Date.now();
  try {
    const parsed = z.object({ connection: storedSchema, sections: z.array(z.enum(sectionKeys)).min(1).max(sectionKeys.length) }).parse(request.body);
    const context = { domain: normaliseDomain(parsed.connection.domain), email: parsed.connection.email.trim(), authType: parsed.connection.authType };
    const credential = parsed.connection.credentialEnvelope.startsWith('demo:') && config.demoMode ? 'demo' : decryptCredential(parsed.connection.credentialEnvelope, context);
    const sections = await syncSections(context, credential, parsed.sections);
    logger.info({ operation: 'configuration.sync', userId: request.identity?.userId, sectionCount: sections.length, itemCount: sections.reduce((sum, section) => sum + section.items.length, 0), durationMs: Date.now() - started, success: true });
    response.json({ sections });
  } catch (error) {
    logger.warn({ operation: 'configuration.sync', userId: request.identity?.userId, durationMs: Date.now() - started, success: false, error: sanitiseError(error) });
    next(error);
  }
});

if (config.demoMode) {
  app.use(express.static(distDir, { index: false, maxAge: 0 }));
  app.get('/{*path}', (_request, response) => response.sendFile(path.join(distDir, 'index.html')));
} else {
  app.use('/assets', express.static(path.join(distDir, 'assets'), { index: false, maxAge: '1h', immutable: true }));
}

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: { code: 'INVALID_INPUT', message: error.issues[0]?.message ?? 'Invalid input.' } });
    return;
  }
  const appError = error instanceof AppError ? error : new AppError('The request could not be completed safely.', 500, 'SERVICE_ERROR');
  response.status(appError.status).json({ error: { code: appError.code, message: appError.message, upstreamStatus: appError.upstreamStatus } });
});

app.listen(config.port, () => {
  logger.info({ port: config.port, demoMode: config.demoMode }, 'CXE Config Sync service started');
});
