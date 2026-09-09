import { describe, expect, it } from 'vitest';
import { sanitizeForAI, sectionToCsv, sectionToMarkdown } from './formatters';

describe('AI-safe output', () => {
  it('removes secrets and email addresses recursively', () => {
    const result = sanitizeForAI({ api_token: 'abc', owner_email: 'admin@example.com', nested: { authorization: 'Bearer abc', body: 'Contact help@example.com' } });
    expect(JSON.stringify(result)).not.toContain('abc');
    expect(JSON.stringify(result)).not.toContain('@example.com');
    expect(result.api_token).toBe('[REDACTED]');
  });

  it('renders intentional markdown', () => {
    const markdown = sectionToMarkdown('Acme', { key: 'groups', label: 'Groups', syncedAt: '2026-08-15T10:00:00Z', durationMs: 10, items: [{ id: 1, name: 'Support', active: true }] }, true);
    expect(markdown).toContain('# Zendesk Configuration');
    expect(markdown).toContain('## Support');
  });

  it('escapes nested CSV values', () => {
    const csv = sectionToCsv({ key: 'groups', label: 'Groups', syncedAt: '', durationMs: 0, items: [{ name: 'One, Two', rules: [{ value: 'x' }] }] });
    expect(csv).toContain('"One, Two"');
    expect(csv).toContain('"[{""value"":""x""}]"');
  });
});
