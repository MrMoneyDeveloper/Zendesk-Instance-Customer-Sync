import { demoClients, demoConnections } from './demoData';
import type { ClientRecord, ConnectionRecord, SchemaCheck } from '../types';

const CONNECTION_OBJECT = 'cxe_zd_sync_connection';
const CLIENT_OBJECT = 'client';

export interface AppDataSource {
  readonly mode: 'demo' | 'zendesk';
  listClients(): Promise<ClientRecord[]>;
  listConnections(): Promise<ConnectionRecord[]>;
  saveConnection(connection: ConnectionRecord): Promise<ConnectionRecord>;
  deleteConnection(connection: ConnectionRecord): Promise<void>;
  checkSchema(): Promise<SchemaCheck>;
  repairSchema(): Promise<SchemaCheck>;
  getCurrentUser(): Promise<{ id: string; name: string; role: string }>;
}

const STORAGE_KEY = 'cxe-config-sync-demo-connections-v1';

export class DemoDataSource implements AppDataSource {
  readonly mode = 'demo' as const;

  async listClients() {
    return structuredClone(demoClients);
  }

  async listConnections() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) as ConnectionRecord[] : structuredClone(demoConnections);
  }

  async saveConnection(connection: ConnectionRecord) {
    const records = await this.listConnections();
    const saved = { ...connection, id: connection.id ?? `conn-${connection.clientId}` };
    const index = records.findIndex((record) => record.externalId === connection.externalId);
    if (index >= 0) records[index] = saved;
    else records.push(saved);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return saved;
  }

  async deleteConnection(connection: ConnectionRecord) {
    const records = (await this.listConnections()).filter((record) => record.externalId !== connection.externalId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  async checkSchema(): Promise<SchemaCheck> {
    return demoSchemaCheck();
  }

  async repairSchema(): Promise<SchemaCheck> {
    return demoSchemaCheck();
  }

  async getCurrentUser() {
    return { id: 'demo-user', name: 'Amina Dlamini', role: 'admin' };
  }
}

function demoSchemaCheck(): SchemaCheck {
  return {
    ready: true,
    canRepair: true,
    checks: [
      { key: 'client', label: 'Existing client object found', ok: true },
      { key: 'connection', label: 'Connection object found', ok: true },
      { key: 'lookup', label: 'Client lookup targets client', ok: true },
      { key: 'fields', label: 'Required field keys found', ok: true },
      { key: 'read', label: 'Connection records readable', ok: true },
      { key: 'compatibility', label: 'App schema compatible', ok: true }
    ]
  };
}

interface ZendeskRecord {
  id: string;
  name: string;
  external_id?: string | null;
  custom_object_fields?: Record<string, unknown>;
}

const REQUIRED_FIELDS = [
  { key: 'cxe_client', title: 'CXE Client', type: 'lookup', relationship_target_type: 'zen:custom_object:client' },
  { key: 'cxe_domain', title: 'Zendesk Domain', type: 'text' },
  { key: 'cxe_api_email', title: 'API Email', type: 'text' },
  { key: 'cxe_auth_type', title: 'Authentication Type', type: 'dropdown', custom_field_options: [{ name: 'API token', value: 'api_token' }, { name: 'OAuth', value: 'oauth' }] },
  { key: 'cxe_credential_envelope', title: 'Encrypted Credential Envelope', type: 'textarea' },
  { key: 'cxe_enabled', title: 'Enabled', type: 'checkbox' },
  { key: 'cxe_connection_status', title: 'Connection Status', type: 'dropdown', custom_field_options: [
    { name: 'Connected', value: 'connected' }, { name: 'Invalid', value: 'invalid' }, { name: 'Disabled', value: 'disabled' },
    { name: 'Permission Issue', value: 'permission_issue' }, { name: 'Error', value: 'error' }
  ] },
  { key: 'cxe_last_test_at', title: 'Last Test At', type: 'text' },
  { key: 'cxe_last_sync_at', title: 'Last Sync At', type: 'text' },
  { key: 'cxe_last_http_status', title: 'Last HTTP Status', type: 'integer' },
  { key: 'cxe_last_error', title: 'Last Error', type: 'textarea' },
  { key: 'cxe_credential_updated_at', title: 'Credential Updated At', type: 'text' },
  { key: 'cxe_auth_version', title: 'Authentication Version', type: 'text' }
] as const;

export class ZendeskDataSource implements AppDataSource {
  readonly mode = 'zendesk' as const;

  constructor(private readonly client: ZafClient) {}

  async listClients(): Promise<ClientRecord[]> {
    const records = await this.listRecords(CLIENT_OBJECT);
    return records.map((record) => ({
      id: record.id,
      name: record.name,
      externalId: record.external_id,
      fields: record.custom_object_fields ?? {}
    }));
  }

  async listConnections(): Promise<ConnectionRecord[]> {
    const records = await this.listRecords(CONNECTION_OBJECT);
    return records.map(recordToConnection);
  }

  async saveConnection(connection: ConnectionRecord): Promise<ConnectionRecord> {
    const fields = {
      cxe_client: connection.clientId,
      cxe_domain: connection.domain,
      cxe_api_email: connection.email,
      cxe_auth_type: connection.authType,
      cxe_credential_envelope: connection.credentialEnvelope,
      cxe_enabled: connection.enabled,
      cxe_connection_status: connection.status,
      cxe_last_test_at: connection.lastTestAt ?? '',
      cxe_last_sync_at: connection.lastSyncAt ?? '',
      cxe_last_http_status: connection.lastHttpStatus ?? null,
      cxe_last_error: connection.lastError ?? '',
      cxe_credential_updated_at: connection.credentialUpdatedAt ?? '',
      cxe_auth_version: connection.authVersion
    };
    const response = await this.request<{ custom_object_record: ZendeskRecord }>({
      url: `/api/v2/custom_objects/${CONNECTION_OBJECT}/records?external_id=${encodeURIComponent(connection.externalId)}`,
      type: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({ custom_object_record: { name: `${connection.clientName} Config Connection`, custom_object_fields: fields } })
    });
    return recordToConnection(response.custom_object_record);
  }

  async deleteConnection(connection: ConnectionRecord): Promise<void> {
    await this.request({
      url: `/api/v2/custom_objects/${CONNECTION_OBJECT}/records?external_id=${encodeURIComponent(connection.externalId)}`,
      type: 'DELETE'
    });
  }

  async getCurrentUser() {
    const context = await this.client.get('currentUser');
    const value = context.currentUser as { id?: string | number; name?: string; role?: string } | undefined;
    return { id: String(value?.id ?? ''), name: value?.name ?? 'Zendesk user', role: value?.role ?? 'agent' };
  }

  async checkSchema(): Promise<SchemaCheck> {
    const user = await this.getCurrentUser();
    let objects: Array<{ key: string }> = [];
    let fields: Array<{ key: string; type: string; relationship_target_type?: string }> = [];
    let readable = true;
    try {
      const result = await this.request<{ custom_objects: Array<{ key: string }> }>('/api/v2/custom_objects');
      objects = result.custom_objects ?? [];
    } catch {
      objects = [];
    }
    if (objects.some((object) => object.key === CONNECTION_OBJECT)) {
      try {
        const result = await this.request<{ custom_object_fields: typeof fields }>(`/api/v2/custom_objects/${CONNECTION_OBJECT}/fields`);
        fields = result.custom_object_fields ?? [];
        await this.listRecords(CONNECTION_OBJECT);
      } catch {
        readable = false;
      }
    }
    const clientExists = objects.some((object) => object.key === CLIENT_OBJECT);
    const connectionExists = objects.some((object) => object.key === CONNECTION_OBJECT);
    const lookup = fields.find((field) => field.key === 'cxe_client');
    const missing = REQUIRED_FIELDS.filter((required) => !fields.some((field) => field.key === required.key));
    const checks = [
      { key: 'client', label: 'Existing client object found', ok: clientExists, detail: clientExists ? undefined : 'Missing custom object: client' },
      { key: 'connection', label: 'Connection object found', ok: connectionExists, detail: connectionExists ? undefined : `Missing custom object: ${CONNECTION_OBJECT}` },
      { key: 'lookup', label: 'Client lookup targets client', ok: lookup?.type === 'lookup' && lookup.relationship_target_type === 'zen:custom_object:client', detail: lookup ? undefined : 'Missing field: cxe_client' },
      { key: 'fields', label: 'Required field keys found', ok: missing.length === 0, detail: missing.length ? `Missing: ${missing.map((field) => field.key).join(', ')}` : undefined },
      { key: 'read', label: 'Connection records readable', ok: readable, detail: readable ? undefined : 'Connection object or fields could not be read' },
      { key: 'compatibility', label: 'App schema compatible', ok: Boolean(clientExists && connectionExists && !missing.length), detail: undefined }
    ];
    return { ready: checks.every((check) => check.ok), canRepair: user.role === 'admin', checks };
  }

  async repairSchema(): Promise<SchemaCheck> {
    const user = await this.getCurrentUser();
    if (user.role !== 'admin') throw new Error('Only Zendesk administrators can run Setup / Repair.');
    const objects = await this.request<{ custom_objects: Array<{ key: string }> }>('/api/v2/custom_objects').catch(() => ({ custom_objects: [] }));
    if (!objects.custom_objects.some((object) => object.key === CONNECTION_OBJECT)) {
      await this.request({
        url: '/api/v2/custom_objects', type: 'POST', contentType: 'application/json',
        data: JSON.stringify({ custom_object: { key: CONNECTION_OBJECT, title: 'CXE Zendesk Config Connection', title_pluralized: 'CXE Zendesk Config Connections', include_in_list_view: false } })
      });
    }
    const current = await this.request<{ custom_object_fields: Array<{ key: string }> }>(`/api/v2/custom_objects/${CONNECTION_OBJECT}/fields`).catch(() => ({ custom_object_fields: [] }));
    for (const field of REQUIRED_FIELDS) {
      if (!current.custom_object_fields.some((existing) => existing.key === field.key)) {
        await this.request({
          url: `/api/v2/custom_objects/${CONNECTION_OBJECT}/fields`, type: 'POST', contentType: 'application/json',
          data: JSON.stringify({ custom_object_field: field })
        });
      }
    }
    return this.checkSchema();
  }

  private async listRecords(objectKey: string): Promise<ZendeskRecord[]> {
    const records: ZendeskRecord[] = [];
    let url: string | null = `/api/v2/custom_objects/${objectKey}/records?page[size]=100`;
    while (url) {
      const page: { custom_object_records?: ZendeskRecord[]; links?: { next?: string | null }; meta?: { has_more?: boolean; after_cursor?: string } } = await this.request(url);
      records.push(...(page.custom_object_records ?? []));
      if (page.meta?.has_more && page.meta.after_cursor) {
        url = `/api/v2/custom_objects/${objectKey}/records?page[size]=100&page[after]=${encodeURIComponent(page.meta.after_cursor)}`;
      } else {
        url = page.links?.next ? new URL(page.links.next).pathname + new URL(page.links.next).search : null;
      }
    }
    return records;
  }

  private request<T = unknown>(options: string | Record<string, unknown>): Promise<T> {
    return this.client.request(options) as Promise<T>;
  }
}

class UnavailableDataSource implements AppDataSource {
  readonly mode = 'zendesk' as const;
  private unavailable(): never { throw new Error('The Zendesk Apps Framework could not be loaded. Reopen Config Sync from Zendesk.'); }
  listClients(): Promise<ClientRecord[]> { return Promise.reject(this.unavailable()); }
  listConnections(): Promise<ConnectionRecord[]> { return Promise.reject(this.unavailable()); }
  saveConnection(_connection: ConnectionRecord): Promise<ConnectionRecord> { return Promise.reject(this.unavailable()); }
  deleteConnection(_connection: ConnectionRecord): Promise<void> { return Promise.reject(this.unavailable()); }
  checkSchema(): Promise<SchemaCheck> { return Promise.reject(this.unavailable()); }
  repairSchema(): Promise<SchemaCheck> { return Promise.reject(this.unavailable()); }
  getCurrentUser(): Promise<{ id: string; name: string; role: string }> { return Promise.reject(this.unavailable()); }
}

function recordToConnection(record: ZendeskRecord): ConnectionRecord {
  const fields = record.custom_object_fields ?? {};
  const clientId = String(fields.cxe_client ?? '');
  const clientName = record.name.replace(/ Config Connection$/, '');
  return {
    id: record.id,
    clientId,
    clientName,
    externalId: record.external_id ?? `cxe-config:${clientId}`,
    domain: String(fields.cxe_domain ?? ''),
    email: String(fields.cxe_api_email ?? ''),
    authType: fields.cxe_auth_type === 'oauth' ? 'oauth' : 'api_token',
    credentialEnvelope: String(fields.cxe_credential_envelope ?? ''),
    enabled: Boolean(fields.cxe_enabled),
    status: isConnectionStatus(fields.cxe_connection_status) ? fields.cxe_connection_status : 'error',
    lastTestAt: optionalString(fields.cxe_last_test_at),
    lastSyncAt: optionalString(fields.cxe_last_sync_at),
    lastHttpStatus: fields.cxe_last_http_status ? Number(fields.cxe_last_http_status) : null,
    lastError: optionalString(fields.cxe_last_error),
    credentialUpdatedAt: optionalString(fields.cxe_credential_updated_at),
    authVersion: String(fields.cxe_auth_version ?? 'v1')
  };
}

function isConnectionStatus(value: unknown): value is ConnectionRecord['status'] {
  return ['connected', 'invalid', 'disabled', 'permission_issue', 'error'].includes(String(value));
}

function optionalString(value: unknown): string | null {
  return value ? String(value) : null;
}

export function createDataSource(): AppDataSource {
  const query = new URLSearchParams(window.location.search);
  const localDemo = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  if (query.get('demo') === 'true' || localDemo) return new DemoDataSource();
  if (!window.ZAFClient) return new UnavailableDataSource();
  return new ZendeskDataSource(window.ZAFClient.init());
}
