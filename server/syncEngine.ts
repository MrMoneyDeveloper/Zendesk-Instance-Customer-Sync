import { getAuthProvider } from './authProviders.js';
import { config } from './config.js';
import { demoConfig } from './demoConfig.js';
import { AppError, fromZendeskStatus } from './errors.js';
import { normaliseDomain } from './security.js';
import type { CredentialContext } from './types.js';

export const sectionKeys = [
  'groups', 'views', 'agents', 'inbound_channels', 'operating_hours', 'custom_objects', 'custom_object_fields',
  'ticket_forms', 'ticket_fields', 'custom_statuses', 'sla_policies', 'automations', 'triggers', 'trigger_categories',
  'macros', 'brands', 'user_fields', 'organization_fields', 'help_centre'
] as const;

export type SectionKey = (typeof sectionKeys)[number];

const endpoints: Record<Exclude<SectionKey, 'custom_object_fields'>, { path: string; keys: string[]; optional?: boolean }> = {
  groups: { path: '/api/v2/groups.json?per_page=100', keys: ['groups'] },
  views: { path: '/api/v2/views.json?per_page=100', keys: ['views'] },
  agents: { path: '/api/v2/users/search.json?query=role:agent%20role:admin&per_page=100', keys: ['users'] },
  inbound_channels: { path: '/api/v2/channels.json?per_page=100', keys: ['channels'], optional: true },
  operating_hours: { path: '/api/v2/business_hours/schedules.json?per_page=100', keys: ['schedules'], optional: true },
  custom_objects: { path: '/api/v2/custom_objects?per_page=100', keys: ['custom_objects'], optional: true },
  ticket_forms: { path: '/api/v2/ticket_forms.json?per_page=100', keys: ['ticket_forms'] },
  ticket_fields: { path: '/api/v2/ticket_fields.json?per_page=100', keys: ['ticket_fields'] },
  custom_statuses: { path: '/api/v2/custom_statuses.json?per_page=100', keys: ['custom_statuses'], optional: true },
  sla_policies: { path: '/api/v2/slas/policies.json?per_page=100', keys: ['sla_policies'], optional: true },
  automations: { path: '/api/v2/automations.json?per_page=100', keys: ['automations'] },
  triggers: { path: '/api/v2/triggers.json?per_page=100', keys: ['triggers'] },
  trigger_categories: { path: '/api/v2/trigger_categories.json?per_page=100', keys: ['trigger_categories'], optional: true },
  macros: { path: '/api/v2/macros.json?per_page=100', keys: ['macros'] },
  brands: { path: '/api/v2/brands.json?per_page=100', keys: ['brands'] },
  user_fields: { path: '/api/v2/user_fields.json?per_page=100', keys: ['user_fields'] },
  organization_fields: { path: '/api/v2/organization_fields.json?per_page=100', keys: ['organization_fields'] },
  help_centre: { path: '/api/v2/help_center/articles.json?per_page=100', keys: ['articles'], optional: true }
};

const labels: Record<SectionKey, string> = {
  groups: 'Groups', views: 'Views', agents: 'Agents', inbound_channels: 'Inbound Channels', operating_hours: 'Operating Hours',
  custom_objects: 'Custom Objects', custom_object_fields: 'Custom Object Fields', ticket_forms: 'Ticket Forms', ticket_fields: 'Ticket Fields',
  custom_statuses: 'Custom Statuses', sla_policies: 'SLA Policies', automations: 'Automations', triggers: 'Triggers',
  trigger_categories: 'Trigger Categories', macros: 'Macros', brands: 'Brands', user_fields: 'User Fields',
  organization_fields: 'Organisation Fields', help_centre: 'Help Centre'
};

interface Page {
  [key: string]: unknown;
  next_page?: string | null;
  links?: { next?: string | null };
  meta?: { has_more?: boolean; after_cursor?: string };
}

export interface SyncedSection {
  key: SectionKey;
  label: string;
  items: Array<Record<string, unknown>>;
  syncedAt: string;
  durationMs: number;
  warning?: string;
}

export async function syncSections(context: CredentialContext, credential: string, requested: SectionKey[]): Promise<SyncedSection[]> {
  const unique = Array.from(new Set(requested));
  if (config.demoMode) {
    return unique.map((key, index) => ({
      key,
      label: labels[key],
      items: structuredClone(demoConfig[key]),
      syncedAt: new Date().toISOString(),
      durationMs: 84 + index * 17
    }));
  }

  const results: SyncedSection[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(3, unique.length) }, async () => {
    while (cursor < unique.length) {
      const index = cursor++;
      results[index] = await syncSection(context, credential, unique[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function syncSection(context: CredentialContext, credential: string, key: SectionKey): Promise<SyncedSection> {
  const started = Date.now();
  try {
    const items = key === 'custom_object_fields'
      ? await fetchCustomObjectFields(context, credential)
      : await fetchAll(context, credential, endpoints[key].path, endpoints[key].keys);
    return { key, label: labels[key], items, syncedAt: new Date().toISOString(), durationMs: Date.now() - started };
  } catch (error) {
    const optional = key === 'custom_object_fields' || endpoints[key as Exclude<SectionKey, 'custom_object_fields'>]?.optional;
    if (optional && error instanceof AppError && (error.code === 'FEATURE_UNAVAILABLE' || error.code === 'PERMISSION_DENIED')) {
      return { key, label: labels[key], items: [], syncedAt: new Date().toISOString(), durationMs: Date.now() - started, warning: error.message };
    }
    throw error;
  }
}

async function fetchCustomObjectFields(context: CredentialContext, credential: string): Promise<Array<Record<string, unknown>>> {
  const objects = await fetchAll(context, credential, endpoints.custom_objects.path, endpoints.custom_objects.keys);
  const fields: Array<Record<string, unknown>> = [];
  for (const object of objects) {
    const key = String(object.key ?? '');
    if (!key) continue;
    try {
      const objectFields = await fetchAll(context, credential, `/api/v2/custom_objects/${encodeURIComponent(key)}/fields?per_page=100`, ['custom_object_fields']);
      fields.push(...objectFields.map((field) => ({ object_key: key, ...field })));
    } catch (error) {
      if (!(error instanceof AppError && (error.code === 'FEATURE_UNAVAILABLE' || error.code === 'PERMISSION_DENIED'))) throw error;
    }
  }
  return fields;
}

async function fetchAll(context: CredentialContext, credential: string, initialPath: string, collectionKeys: string[]): Promise<Array<Record<string, unknown>>> {
  const domain = normaliseDomain(context.domain);
  const provider = getAuthProvider(context.authType);
  const items: Array<Record<string, unknown>> = [];
  let nextUrl: string | null = `https://${domain}${initialPath}`;
  let pageCount = 0;
  while (nextUrl && pageCount < 100) {
    const url = new URL(nextUrl);
    if (url.protocol !== 'https:' || url.hostname !== domain) throw new AppError('Zendesk returned an unsafe pagination URL.', 502, 'SERVICE_ERROR');
    const response = await fetchWithRetry(url, provider.authorizationHeader(context, credential));
    const page = await response.json() as Page;
    const collection = collectionKeys.map((key) => page[key]).find(Array.isArray) as Array<Record<string, unknown>> | undefined;
    if (collection) items.push(...collection.map(stripUnsafeFields));
    nextUrl = nextPageUrl(page, url, domain);
    pageCount += 1;
  }
  if (pageCount >= 100 && nextUrl) throw new AppError('This section exceeded the safe pagination limit.', 502, 'SERVICE_ERROR');
  return items;
}

function nextPageUrl(page: Page, current: URL, domain: string): string | null {
  const supplied = page.next_page ?? page.links?.next;
  if (supplied) return supplied;
  if (page.meta?.has_more && page.meta.after_cursor) {
    const next = new URL(current);
    next.searchParams.set('page[after]', page.meta.after_cursor);
    return next.toString();
  }
  return null;
}

async function fetchWithRetry(url: URL, authorization: string): Promise<Response> {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json', Authorization: authorization, 'User-Agent': 'CXE-Config-Sync/0.1' },
        redirect: 'error',
        signal: AbortSignal.timeout(20_000)
      });
    } catch {
      if (attempt === maxAttempts) throw new AppError('Connection could not be completed. Credential status has not been changed.', 502, 'NETWORK_ERROR');
      await delay(250 * 2 ** (attempt - 1));
      continue;
    }
    if (response.ok) return response;
    if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
      const retryAfter = Number(response.headers.get('retry-after'));
      await delay(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 10_000) : 250 * 2 ** (attempt - 1));
      continue;
    }
    throw fromZendeskStatus(response.status);
  }
  throw new AppError('Zendesk request failed after retries.', 502, 'SERVICE_ERROR');
}

function stripUnsafeFields(item: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(item).filter(([key]) => !/(password|credential|access_token|refresh_token|api_token|authorization)/i.test(key)));
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
