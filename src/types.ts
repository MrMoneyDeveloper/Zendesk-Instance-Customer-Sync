export type AuthType = 'api_token' | 'oauth';

export type ConnectionStatus =
  | 'connected'
  | 'not_connected'
  | 'invalid'
  | 'disabled'
  | 'permission_issue'
  | 'error';

export interface ClientRecord {
  id: string;
  name: string;
  externalId?: string | null;
  fields: Record<string, unknown>;
}

export interface ConnectionRecord {
  id?: string;
  clientId: string;
  clientName: string;
  externalId: string;
  domain: string;
  email: string;
  authType: AuthType;
  credentialEnvelope: string;
  enabled: boolean;
  status: Exclude<ConnectionStatus, 'not_connected'>;
  lastTestAt?: string | null;
  lastSyncAt?: string | null;
  lastHttpStatus?: number | null;
  lastError?: string | null;
  credentialUpdatedAt?: string | null;
  authVersion: string;
}

export interface ClientWithConnection extends ClientRecord {
  connection?: ConnectionRecord;
  status: ConnectionStatus;
}

export const sectionDefinitions = [
  { key: 'groups', label: 'Groups', singular: 'Group' },
  { key: 'views', label: 'Views', singular: 'View' },
  { key: 'agents', label: 'Agents', singular: 'Agent' },
  { key: 'inbound_channels', label: 'Inbound Channels', singular: 'Channel' },
  { key: 'operating_hours', label: 'Operating Hours', singular: 'Schedule' },
  { key: 'custom_objects', label: 'Custom Objects', singular: 'Custom object' },
  { key: 'custom_object_fields', label: 'Custom Object Fields', singular: 'Object field' },
  { key: 'ticket_forms', label: 'Ticket Forms', singular: 'Ticket form' },
  { key: 'ticket_fields', label: 'Ticket Fields', singular: 'Ticket field' },
  { key: 'custom_statuses', label: 'Custom Statuses', singular: 'Custom status' },
  { key: 'sla_policies', label: 'SLA Policies', singular: 'SLA policy' },
  { key: 'automations', label: 'Automations', singular: 'Automation' },
  { key: 'triggers', label: 'Triggers', singular: 'Trigger' },
  { key: 'trigger_categories', label: 'Trigger Categories', singular: 'Trigger category' },
  { key: 'macros', label: 'Macros', singular: 'Macro' },
  { key: 'brands', label: 'Brands', singular: 'Brand' },
  { key: 'user_fields', label: 'User Fields', singular: 'User field' },
  { key: 'organization_fields', label: 'Organisation Fields', singular: 'Organisation field' },
  { key: 'help_centre', label: 'Help Centre', singular: 'Article' }
] as const;

export type SectionKey = (typeof sectionDefinitions)[number]['key'];

export interface ConfigItem extends Record<string, unknown> {
  id?: string | number;
  name?: string;
  title?: string;
  active?: boolean;
}

export interface SectionResult {
  key: SectionKey;
  label: string;
  items: ConfigItem[];
  syncedAt: string;
  durationMs: number;
  warning?: string;
}

export type SyncResults = Partial<Record<SectionKey, SectionResult>>;

export interface SchemaCheck {
  ready: boolean;
  canRepair: boolean;
  checks: Array<{ key: string; label: string; ok: boolean; detail?: string }>;
}

export interface SessionInfo {
  authenticated: boolean;
  demo: boolean;
  csrfToken: string;
  user?: { id: string; name: string; role: string };
}

export interface ConnectionInput {
  clientId: string;
  clientName: string;
  domain: string;
  email: string;
  authType: AuthType;
  credential: string;
}

export interface SyncProgress {
  completed: number;
  total: number;
  label: string;
}
