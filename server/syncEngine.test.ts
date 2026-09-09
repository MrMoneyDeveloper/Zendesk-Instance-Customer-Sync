import { describe, expect, it } from 'vitest';
import { sectionKeys, syncSections } from './syncEngine.js';

describe('configuration sync', () => {
  it('supports every POC configuration area in demo mode', async () => {
    const sections = await syncSections({ domain: 'demo.zendesk.com', email: 'admin@example.com', authType: 'api_token' }, 'demo', [...sectionKeys]);
    expect(sections).toHaveLength(19);
    expect(sections.find((section) => section.key === 'triggers')?.items).toHaveLength(42);
    expect(sections.find((section) => section.key === 'ticket_fields')?.items).toHaveLength(28);
    expect(sections.every((section) => section.syncedAt && section.durationMs >= 0)).toBe(true);
  });
});
