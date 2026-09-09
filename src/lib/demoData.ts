import type { ClientRecord, ConnectionRecord } from '../types';

export const demoClients: ClientRecord[] = [
  { id: '01J8ABC123XYZ', name: 'BetterMeRX', externalId: 'bmrx', fields: { plan_level: 'Enterprise', cx_experts_account_manager: 'Maya Jacobs', licenses: 86 } },
  { id: '01J8ABC234XYZ', name: 'Aquasure', externalId: 'aquasure', fields: { plan_level: 'Professional', cx_experts_account_manager: 'Leo Williams', licenses: 42 } },
  { id: '01J8ABC345XYZ', name: 'Inspire Uplift', externalId: 'inspire-uplift', fields: { plan_level: 'Growth', cx_experts_account_manager: 'Nadia Khan', licenses: 24 } },
  { id: '01J8ABC456XYZ', name: 'Atlas Mobility', externalId: 'atlas', fields: { plan_level: 'Enterprise', cx_experts_account_manager: 'Maya Jacobs', licenses: 110 } },
  { id: '01J8ABC567XYZ', name: 'Lumen Health', externalId: 'lumen', fields: { plan_level: 'Professional', cx_experts_account_manager: 'Leo Williams', licenses: 58 } },
  { id: '01J8ABC678XYZ', name: 'Northstar Retail', externalId: 'northstar', fields: { plan_level: 'Enterprise', cx_experts_account_manager: 'Nadia Khan', licenses: 132 } },
  { id: '01J8ABC789XYZ', name: 'Oak & Stone', externalId: 'oak-stone', fields: { plan_level: 'Growth', cx_experts_account_manager: 'Maya Jacobs', licenses: 18 } },
  { id: '01J8ABC890XYZ', name: 'ParcelPilot', externalId: 'parcel-pilot', fields: { plan_level: 'Professional', cx_experts_account_manager: 'Leo Williams', licenses: 66 } }
];

const recent = new Date(Date.now() - 42 * 60_000).toISOString();
const yesterday = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

export const demoConnections: ConnectionRecord[] = [
  {
    id: 'conn-bmrx', clientId: demoClients[0].id, clientName: demoClients[0].name,
    externalId: `cxe-config:${demoClients[0].id}`, domain: 'bettermrx.zendesk.com', email: 'zd-admin@bettermrx.example',
    authType: 'api_token', credentialEnvelope: 'demo:v1:bmrx', enabled: true, status: 'connected',
    lastTestAt: recent, lastSyncAt: recent, lastHttpStatus: 200, credentialUpdatedAt: yesterday, authVersion: 'v1'
  },
  {
    id: 'conn-aqua', clientId: demoClients[1].id, clientName: demoClients[1].name,
    externalId: `cxe-config:${demoClients[1].id}`, domain: 'aquasure.zendesk.com', email: 'support-admin@aquasure.example',
    authType: 'oauth', credentialEnvelope: 'demo:v1:aqua', enabled: true, status: 'connected',
    lastTestAt: yesterday, lastSyncAt: yesterday, lastHttpStatus: 200, credentialUpdatedAt: yesterday, authVersion: 'v1'
  },
  {
    id: 'conn-atlas', clientId: demoClients[3].id, clientName: demoClients[3].name,
    externalId: `cxe-config:${demoClients[3].id}`, domain: 'atlas-mobility.zendesk.com', email: 'zendesk@atlas.example',
    authType: 'api_token', credentialEnvelope: 'demo:v1:atlas', enabled: true, status: 'invalid',
    lastTestAt: yesterday, lastSyncAt: null, lastHttpStatus: 401, lastError: 'The saved credential is no longer accepted.', credentialUpdatedAt: yesterday, authVersion: 'v1'
  },
  {
    id: 'conn-lumen', clientId: demoClients[4].id, clientName: demoClients[4].name,
    externalId: `cxe-config:${demoClients[4].id}`, domain: 'lumen-health.zendesk.com', email: 'ops@lumen.example',
    authType: 'api_token', credentialEnvelope: 'demo:v1:lumen', enabled: false, status: 'disabled',
    lastTestAt: yesterday, lastSyncAt: yesterday, lastHttpStatus: 200, credentialUpdatedAt: yesterday, authVersion: 'v1'
  },
  {
    id: 'conn-north', clientId: demoClients[5].id, clientName: demoClients[5].name,
    externalId: `cxe-config:${demoClients[5].id}`, domain: 'northstar-retail.zendesk.com', email: 'platform@northstar.example',
    authType: 'oauth', credentialEnvelope: 'demo:v1:north', enabled: true, status: 'permission_issue',
    lastTestAt: yesterday, lastSyncAt: null, lastHttpStatus: 403, lastError: 'The user cannot read one or more configuration areas.', credentialUpdatedAt: yesterday, authVersion: 'v1'
  }
];
