import { createHash, randomBytes } from 'node:crypto';

const demoMode = process.env.DEMO_MODE !== 'false';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when DEMO_MODE=false`);
  return value;
}

function encryptionKey(): Buffer {
  if (demoMode) return createHash('sha256').update('cxe-config-sync-demo-key-not-for-production').digest();
  const decoded = Buffer.from(required('CXE_ENCRYPTION_KEY'), 'base64');
  if (decoded.length !== 32) throw new Error('CXE_ENCRYPTION_KEY must decode to exactly 32 bytes');
  return decoded;
}

export const config = {
  demoMode,
  port: Number(process.env.PORT ?? 8787),
  encryptionKey: encryptionKey(),
  encryptionKeyId: process.env.CXE_ENCRYPTION_KEY_ID ?? 'key01',
  sessionSecret: demoMode ? createHash('sha256').update('cxe-demo-session-secret').digest() : Buffer.from(required('SESSION_SECRET')),
  zendeskPublicKey: process.env.ZENDESK_APP_PUBLIC_KEY?.replace(/\\n/g, '\n'),
  zendeskAudience: process.env.ZENDESK_APP_AUDIENCE,
  zendeskExpectedIssuer: process.env.ZENDESK_EXPECTED_ISSUER,
  sessionTtlSeconds: 60 * 60,
  randomCsrf: () => randomBytes(24).toString('base64url')
};
