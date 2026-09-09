import { describe, expect, it } from 'vitest';
import { decryptCredential, encryptCredential, normaliseDomain } from './security.js';

const context = { domain: 'acme.zendesk.com', email: 'admin@acme.example', authType: 'api_token' as const };

describe('credential envelope', () => {
  it('round trips without storing plaintext', () => {
    const envelope = encryptCredential('secret-token-value', context);
    expect(envelope).toMatch(/^v1:key01:/);
    expect(envelope).not.toContain('secret-token-value');
    expect(decryptCredential(envelope, context)).toBe('secret-token-value');
  });

  it('binds ciphertext to connection context', () => {
    const envelope = encryptCredential('secret-token-value', context);
    expect(() => decryptCredential(envelope, { ...context, domain: 'other.zendesk.com' })).toThrow();
  });

  it('rejects tampered ciphertext', () => {
    const envelope = encryptCredential('secret-token-value', context);
    const parts = envelope.split(':');
    parts[3] = `${parts[3][0] === 'A' ? 'B' : 'A'}${parts[3].slice(1)}`;
    expect(() => decryptCredential(parts.join(':'), context)).toThrow();
  });
});

describe('domain validation', () => {
  it('normalises HTTPS Zendesk domains', () => expect(normaliseDomain('https://Acme.zendesk.com/')).toBe('acme.zendesk.com'));
  it('blocks non-Zendesk destinations', () => expect(() => normaliseDomain('localhost:3000')).toThrow(/zendesk\.com/));
});
