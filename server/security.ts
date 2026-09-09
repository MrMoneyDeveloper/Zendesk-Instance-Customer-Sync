import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';
import { AppError } from './errors.js';
import type { CredentialContext } from './types.js';

const VERSION = 'v1';

function aad(context: CredentialContext): Buffer {
  return Buffer.from(`${normaliseDomain(context.domain)}|${context.email.trim().toLowerCase()}|${context.authType}`, 'utf8');
}

export function encryptCredential(credential: string, context: CredentialContext): string {
  if (!credential) throw new Error('Credential is required');
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', config.encryptionKey, nonce);
  cipher.setAAD(aad(context));
  const ciphertext = Buffer.concat([cipher.update(credential, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, config.encryptionKeyId, nonce.toString('base64url'), ciphertext.toString('base64url'), tag.toString('base64url')].join(':');
}

export function decryptCredential(envelope: string, context: CredentialContext): string {
  const [version, keyId, nonceText, ciphertextText, tagText, ...extra] = envelope.split(':');
  if (version !== VERSION || keyId !== config.encryptionKeyId || !nonceText || !ciphertextText || !tagText || extra.length) {
    throw new Error('Credential envelope is not supported');
  }
  const nonce = Buffer.from(nonceText, 'base64url');
  const ciphertext = Buffer.from(ciphertextText, 'base64url');
  const tag = Buffer.from(tagText, 'base64url');
  if (nonce.length !== 12 || tag.length !== 16) throw new Error('Credential envelope is malformed');
  const decipher = createDecipheriv('aes-256-gcm', config.encryptionKey, nonce);
  decipher.setAAD(aad(context));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function normaliseDomain(value: string): string {
  const input = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zendesk\.com$/.test(input)) {
    throw new AppError('Enter a valid client domain ending in .zendesk.com.', 400, 'INVALID_INPUT');
  }
  return input;
}

export function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
