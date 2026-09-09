import type { SectionKey } from './syncEngine.js';

const now = () => new Date().toISOString();

export const demoConfig: Record<SectionKey, Array<Record<string, unknown>>> = {
  groups: [
    { id: 1101, name: 'Customer Care', default: true, deleted: false, created_at: '2024-01-16T08:30:00Z', updated_at: now() },
    { id: 1102, name: 'Clinical Escalations', default: false, deleted: false, created_at: '2024-02-02T09:00:00Z', updated_at: now() },
    { id: 1103, name: 'Billing Operations', default: false, deleted: false, created_at: '2024-02-18T11:15:00Z', updated_at: now() },
    { id: 1104, name: 'Management', default: false, deleted: false, created_at: '2024-03-04T06:45:00Z', updated_at: now() },
    { id: 1105, name: 'Technical Support', default: false, deleted: false, created_at: '2024-03-11T13:20:00Z', updated_at: now() },
    { id: 1106, name: 'Retention', default: false, deleted: false, created_at: '2024-04-01T10:00:00Z', updated_at: now() },
    { id: 1107, name: 'Quality Assurance', default: false, deleted: false, created_at: '2024-05-12T07:40:00Z', updated_at: now() },
    { id: 1108, name: 'After Hours', default: false, deleted: false, created_at: '2024-06-03T14:10:00Z', updated_at: now() }
  ],
  views: [
    { id: 2101, title: '01 · Unassigned & urgent', active: true, position: 1, all_conditions: [{ field: 'status', operator: 'less_than', value: 'solved' }], any_conditions: [{ field: 'priority', operator: 'is', value: 'urgent' }] },
    { id: 2102, title: '02 · My open tickets', active: true, position: 2, all_conditions: [{ field: 'assignee_id', operator: 'is', value: 'current_user' }, { field: 'status', operator: 'less_than', value: 'solved' }] },
    { id: 2103, title: '03 · Clinical queue', active: true, position: 3, all_conditions: [{ field: 'group_id', operator: 'is', value: '1102' }] },
    { id: 2104, title: '04 · Pending customer', active: true, position: 4, all_conditions: [{ field: 'status', operator: 'is', value: 'pending' }] },
    { id: 2105, title: '05 · SLA at risk', active: true, position: 5, all_conditions: [], any_conditions: [{ field: 'sla_status', operator: 'is', value: 'active' }] },
    { id: 2106, title: '06 · Recently solved', active: true, position: 6, all_conditions: [{ field: 'status', operator: 'is', value: 'solved' }] },
    { id: 2107, title: '07 · QA review', active: true, position: 7, all_conditions: [{ field: 'tags', operator: 'includes', value: 'qa_review_required' }] }
  ],
  agents: [
    { id: 3101, name: 'Amelia Jacobs', role: 'admin', active: true, email: 'amelia.jacobs@bettermrx.example', default_group_id: 1101 },
    { id: 3102, name: 'Daniel Okafor', role: 'agent', active: true, email: 'daniel.okafor@bettermrx.example', default_group_id: 1102 },
    { id: 3103, name: 'Mei Santos', role: 'agent', active: true, email: 'mei.santos@bettermrx.example', default_group_id: 1101 },
    { id: 3104, name: 'Noah Williams', role: 'agent', active: true, email: 'noah.williams@bettermrx.example', default_group_id: 1103 },
    { id: 3105, name: 'Priya Naidoo', role: 'agent', active: true, email: 'priya.naidoo@bettermrx.example', default_group_id: 1105 }
  ],
  inbound_channels: [
    { id: 'email-support', name: 'support@bettermrx.example', type: 'email', active: true, brand: 'BetterMeRX' },
    { id: 'web-form', name: 'Help Centre request form', type: 'web', active: true, brand: 'BetterMeRX' },
    { id: 'messaging', name: 'Web messaging', type: 'messaging', active: true, brand: 'BetterMeRX' }
  ],
  operating_hours: [{ id: 4101, name: 'SA Business Hours', time_zone: 'Africa/Johannesburg', intervals: [{ days: 'Mon–Fri', start: '08:00', end: '17:00' }], holidays: 12 }],
  custom_objects: [
    { id: 'co-1', key: 'prescription', title: 'Prescription', title_pluralized: 'Prescriptions', active: true, fields_count: 6 },
    { id: 'co-2', key: 'treatment_program', title: 'Treatment Program', title_pluralized: 'Treatment Programs', active: true, fields_count: 4 }
  ],
  custom_object_fields: [
    { id: 5101, object_key: 'prescription', key: 'prescription_id', title: 'Prescription ID', type: 'text', active: true },
    { id: 5102, object_key: 'prescription', key: 'product', title: 'Product', type: 'dropdown', active: true, options: ['Semaglutide', 'Tirzepatide', 'Other'] },
    { id: 5103, object_key: 'prescription', key: 'status', title: 'Status', type: 'dropdown', active: true, options: ['Pending', 'Approved', 'Fulfilled', 'Cancelled'] },
    { id: 5104, object_key: 'treatment_program', key: 'program_name', title: 'Program name', type: 'text', active: true }
  ],
  ticket_forms: [
    { id: 6101, name: 'General Support', active: true, position: 1, ticket_field_ids: [7101, 7102, 7103, 7105] },
    { id: 6102, name: 'Clinical Support', active: true, position: 2, ticket_field_ids: [7101, 7102, 7104, 7105] },
    { id: 6103, name: 'Billing Query', active: true, position: 3, ticket_field_ids: [7101, 7102, 7106] },
    { id: 6104, name: 'Product Feedback', active: true, position: 4, ticket_field_ids: [7101, 7107] }
  ],
  ticket_fields: Array.from({ length: 28 }, (_, index) => ({
    id: 7101 + index,
    title: ['Query type', 'Product', 'Order number', 'Clinical priority', 'Contact reason', 'Payment status', 'Feedback category'][index] ?? `Workflow field ${index + 1}`,
    type: index % 4 === 0 ? 'dropdown' : index % 4 === 1 ? 'text' : index % 4 === 2 ? 'checkbox' : 'multiselect',
    active: true,
    required: index < 4,
    position: index + 1
  })),
  custom_statuses: [
    { id: 8101, name: 'Waiting for patient', agent_label: 'Waiting for patient', status_category: 'pending', active: true },
    { id: 8102, name: 'Clinical review', agent_label: 'Clinical review', status_category: 'open', active: true },
    { id: 8103, name: 'Pharmacy processing', agent_label: 'Pharmacy processing', status_category: 'hold', active: true },
    { id: 8104, name: 'Awaiting payment', agent_label: 'Awaiting payment', status_category: 'pending', active: true }
  ],
  sla_policies: [
    { id: 9101, title: 'Standard support', position: 1, active: true, policy_metrics: [{ metric: 'first_reply_time', priority: 'normal', target: 480 }] },
    { id: 9102, title: 'Clinical urgent', position: 2, active: true, policy_metrics: [{ metric: 'first_reply_time', priority: 'urgent', target: 30 }] },
    { id: 9103, title: 'VIP care', position: 3, active: true, policy_metrics: [{ metric: 'first_reply_time', priority: 'high', target: 60 }] }
  ],
  automations: Array.from({ length: 11 }, (_, index) => ({
    id: 10101 + index,
    title: ['A01 · Pending reminder — 24h', 'A02 · Pending reminder — 72h', 'A03 · Solve inactive — 5d'][index] ?? `A${String(index + 1).padStart(2, '0')} · Workflow automation`,
    active: true,
    position: index + 1,
    conditions: { all: [{ field: 'status', operator: 'is', value: index % 2 ? 'hold' : 'pending' }] },
    actions: [{ field: 'notification_user_email', value: 'Follow-up required' }]
  })),
  triggers: [
    { id: 11101, title: 'P00 — Public ACK', active: true, position: 1, category: 'Notifications', all_conditions: [{ field: 'ticket_is_public', operator: 'is', value: true }], any_conditions: [], actions: [{ field: 'notification_user_email', value: 'We have received your request' }], updated_at: now() },
    { id: 11102, title: 'I04 — Manager Authorisation', active: true, position: 4, category: 'Internal routing', all_conditions: [{ field: 'tags', operator: 'includes', value: 'bmrx_manager_auth' }], any_conditions: [], actions: [{ field: 'priority', value: 'high' }, { field: 'tags', value: 'bmrx_manager_review_required' }, { field: 'notification_group_email', value: 'Management' }], updated_at: now() },
    { id: 11103, title: 'I05 — Safety Escalation', active: true, position: 5, category: 'Clinical', all_conditions: [{ field: 'custom_field_7104', operator: 'is', value: 'urgent' }], any_conditions: [{ field: 'tags', operator: 'includes', value: 'adverse_event' }], actions: [{ field: 'group_id', value: 'Clinical Escalations' }, { field: 'priority', value: 'urgent' }], updated_at: now() },
    { id: 11104, title: 'R01 — Route billing queries', active: true, position: 6, category: 'Routing', all_conditions: [{ field: 'ticket_form_id', operator: 'is', value: 'Billing Query' }], any_conditions: [], actions: [{ field: 'group_id', value: 'Billing Operations' }], updated_at: now() },
    { id: 11105, title: 'R02 — Route clinical queries', active: true, position: 7, category: 'Routing', all_conditions: [{ field: 'ticket_form_id', operator: 'is', value: 'Clinical Support' }], any_conditions: [], actions: [{ field: 'group_id', value: 'Clinical Escalations' }], updated_at: now() },
    ...Array.from({ length: 37 }, (_, index) => ({ id: 11106 + index, title: `W${String(index + 1).padStart(2, '0')} — ${['Assign by product', 'Add workflow tag', 'Notify care team', 'Set query type'][index % 4]}`, active: index % 9 !== 0, position: index + 8, category: ['Routing', 'Tagging', 'Notifications'][index % 3], all_conditions: [{ field: 'status', operator: 'is', value: 'new' }], any_conditions: [], actions: [{ field: 'tags', value: `bmrx_workflow_${index + 1}` }], updated_at: now() }))
  ],
  trigger_categories: [
    { id: 'tc-1', name: 'Notifications', position: 1 }, { id: 'tc-2', name: 'Internal routing', position: 2 },
    { id: 'tc-3', name: 'Clinical', position: 3 }, { id: 'tc-4', name: 'Routing', position: 4 }, { id: 'tc-5', name: 'Tagging', position: 5 }
  ],
  macros: Array.from({ length: 46 }, (_, index) => ({ id: 12101 + index, title: `${['Clinical', 'Billing', 'General', 'Retention'][index % 4]} · ${['Request more information', 'Resolved response', 'Internal escalation', 'Follow-up'][index % 4]} ${index + 1}`, active: index % 13 !== 0, actions: [{ field: 'comment_value_html', value: `<p>Approved response template ${index + 1}</p>` }, { field: 'tags', value: `macro_${index + 1}` }] })),
  brands: [{ id: 13101, name: 'BetterMeRX', active: true, default: true, subdomain: 'bettermrx', has_help_center: true }],
  user_fields: [
    { id: 14101, key: 'patient_id', title: 'Patient ID', type: 'text', active: true },
    { id: 14102, key: 'consent_status', title: 'Consent status', type: 'dropdown', active: true },
    { id: 14103, key: 'preferred_contact_channel', title: 'Preferred contact channel', type: 'dropdown', active: true }
  ],
  organization_fields: [
    { id: 15101, key: 'partner_type', title: 'Partner type', type: 'dropdown', active: true },
    { id: 15102, key: 'account_tier', title: 'Account tier', type: 'dropdown', active: true }
  ],
  help_centre: Array.from({ length: 27 }, (_, index) => ({ id: 16101 + index, title: ['How your treatment plan works', 'Managing your subscription', 'Delivery and tracking', 'Contacting the clinical team'][index] ?? `Patient guide ${index + 1}`, draft: index % 11 === 0, promoted: index < 4, section_id: 1700 + (index % 4), locale: 'en-gb', updated_at: now(), html_url: `https://bettermrx.zendesk.com/hc/en-gb/articles/${16101 + index}` }))
};
