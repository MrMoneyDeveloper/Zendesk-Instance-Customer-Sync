import type { ConfigItem, SectionResult } from '../types';

const SENSITIVE_KEY = /(credential|authorization|api.?token|access.?token|refresh.?token|password|secret)/i;
const EMAIL_KEY = /(^|_)(email|recipient|address)(_|$)/i;
const EMAIL_VALUE = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;

export function itemTitle(item: ConfigItem): string {
  return String(item.title ?? item.name ?? item.display_name ?? item.key ?? `Item ${item.id ?? ''}`).trim();
}

export function formatDate(value?: string | null): string {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return new Intl.DateTimeFormat('en-ZA', {
    ...(sameDay ? {} : { day: '2-digit', month: 'short' }),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

export function sanitizeForAI<T>(value: T): T {
  const walk = (input: unknown, key = ''): unknown => {
    if (SENSITIVE_KEY.test(key)) return '[REDACTED]';
    if (EMAIL_KEY.test(key) && typeof input === 'string') return '[EMAIL REDACTED]';
    if (Array.isArray(input)) return input.map((entry) => walk(entry));
    if (input && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input).map(([childKey, child]) => [childKey, walk(child, childKey)]));
    }
    if (typeof input === 'string') return input.replace(EMAIL_VALUE, '[EMAIL REDACTED]');
    return input;
  };
  return walk(value) as T;
}

function renderValue(value: unknown, depth = 0): string[] {
  const indent = '  '.repeat(depth);
  if (value === null || value === undefined || value === '') return [`${indent}None`];
  if (Array.isArray(value)) {
    if (!value.length) return [`${indent}None`];
    return value.flatMap((entry, index) => {
      if (entry && typeof entry === 'object') {
        return [`${indent}${index + 1}.`, ...renderValue(entry, depth + 1)];
      }
      return [`${indent}${index + 1}. ${String(entry)}`];
    });
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
      if (child && typeof child === 'object') return [`${indent}${humanize(key)}:`, ...renderValue(child, depth + 1)];
      return [`${indent}${humanize(key)}: ${formatPrimitive(child)}`];
    });
  }
  return [`${indent}${formatPrimitive(value)}`];
}

function formatPrimitive(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value ?? 'None');
}

export function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function itemToMarkdown(item: ConfigItem, headingLevel = 2): string {
  const title = itemTitle(item);
  const body = Object.entries(item)
    .filter(([key]) => !['title', 'name'].includes(key))
    .flatMap(([key, value]) => {
      if (value && typeof value === 'object') {
        return [`${'#'.repeat(Math.min(headingLevel + 1, 6))} ${humanize(key)}`, '', ...renderValue(value), ''];
      }
      return [`**${humanize(key)}:** ${formatPrimitive(value)}`, ''];
    });
  return [`${'#'.repeat(headingLevel)} ${title}`, '', ...body].join('\n').trim();
}

export function sectionToMarkdown(clientName: string, section: SectionResult, sanitized = false): string {
  const source = sanitized ? sanitizeForAI(section.items) : section.items;
  return [
    '# Zendesk Configuration',
    '',
    `**Client:** ${clientName}`,
    `**Section:** ${section.label}`,
    `**Synced:** ${section.syncedAt.slice(0, 10)}`,
    `**Items:** ${section.items.length}`,
    '',
    ...source.flatMap((item) => [itemToMarkdown(item), ''])
  ].join('\n').trim();
}

export function sectionToText(clientName: string, section: SectionResult): string {
  const lines = [
    'ZENDESK CONFIGURATION',
    `Client: ${clientName}`,
    `Section: ${section.label}`,
    `Synced: ${section.syncedAt}`,
    ''
  ];
  section.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${itemTitle(item)}`);
    Object.entries(item)
      .filter(([key]) => !['title', 'name'].includes(key))
      .forEach(([key, value]) => lines.push(`   ${humanize(key)}: ${typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}`));
    lines.push('');
  });
  return lines.join('\n').trim();
}

function csvEscape(value: unknown): string {
  const stringValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function sectionToCsv(section: SectionResult): string {
  const keys = Array.from(new Set(section.items.flatMap((item) => Object.keys(item))));
  return [keys.map(csvEscape).join(','), ...section.items.map((item) => keys.map((key) => csvEscape(item[key])).join(','))].join('\r\n');
}

export function downloadFile(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
