import readline from 'node:readline';

const [domainArg, emailArg] = process.argv.slice(2);
const domain = String(domainArg || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
const email = String(emailArg || '').trim();

if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zendesk\.com$/.test(domain) || !email) {
  console.error('Usage: node scripts/probe-health.mjs client.zendesk.com admin@example.com');
  process.exit(2);
}

let token = String(process.env.CXE_HEALTH_PROBE_TOKEN || '').trim();
if (!token && process.stdin.isTTY) {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  token = await new Promise((resolve) => {
    rl.once('line', (line) => resolve(String(line || '').trim()));
  });
  rl.close();
}
if (!token) {
  console.error('Expected the API token on standard input.');
  process.exit(2);
}

const base = `https://${domain}`;
const auth = `Basic ${Buffer.from(`${email}/token:${token}`).toString('base64')}`;
const startedAt = Date.now();
const report = {
  domain,
  probedAt: new Date().toISOString(),
  endpoints: {},
  operational: null,
};

async function request(pathOrUrl) {
  const url = new URL(pathOrUrl, base);
  if (url.protocol !== 'https:' || url.hostname !== domain) throw new Error('Unsafe Zendesk URL');
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: { Authorization: auth, Accept: 'application/json' },
      redirect: 'manual',
    });
    const responseText = await response.text();
    let body = {};
    try { body = responseText ? JSON.parse(responseText) : {}; } catch { body = { parse_error: true }; }
    if (response.ok) return body;
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      const retryAfter = Number(response.headers.get('retry-after'));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 60000) : [5000, 15000, 40000][attempt];
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const error = new Error(`HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
}

function countOf(body, root) {
  if (Array.isArray(body?.[root])) return body[root].length;
  if (typeof body?.count === 'number') return body.count;
  return null;
}

async function probe(name, path, root, summarize) {
  const at = Date.now();
  try {
    const body = await request(path);
    report.endpoints[name] = {
      ok: true,
      status: 200,
      ms: Date.now() - at,
      ...(summarize ? summarize(body) : { sampleCount: countOf(body, root) }),
    };
    return body;
  } catch (error) {
    report.endpoints[name] = {
      ok: false,
      status: Number(error.status || 0),
      ms: Date.now() - at,
      error: error.status ? `HTTP ${error.status}` : String(error.message || error),
    };
    return null;
  }
}

function nextUrl(body) {
  if (body?.end_of_stream === true) return '';
  return body?.next_page || body?.after_url || body?.links?.next || '';
}

async function collect(path, root, { maxPages = 100, maxRecords = 25000 } = {}) {
  const rows = [];
  let url = path;
  let pages = 0;
  let truncated = false;
  while (url && pages < maxPages && rows.length < maxRecords) {
    const body = await request(url);
    rows.push(...(Array.isArray(body?.[root]) ? body[root] : []));
    pages += 1;
    url = nextUrl(body);
  }
  if (url || rows.length >= maxRecords) truncated = true;
  return { rows: rows.slice(0, maxRecords), pages, truncated };
}

function isoMonths(count) {
  const now = new Date();
  const values = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    values.push(d.toISOString().slice(0, 7));
  }
  return values;
}

function classifyChannel(ticket) {
  const channel = String(ticket?.via?.channel || '').toLowerCase();
  if (ticket?.from_messaging_channel === true || /messaging|whatsapp|sunshine|chat|facebook|instagram|wechat|line/.test(channel)) return 'messaging';
  if (channel === 'email' || channel === 'web') return 'email_web';
  return 'other';
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percentile(values, fraction) {
  const sorted = values.filter((value) => value != null).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function summarizeDuration(values) {
  const clean = values.filter((value) => value != null);
  if (!clean.length) return { count: 0, averageMinutes: null, medianMinutes: null };
  return {
    count: clean.length,
    averageMinutes: Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length),
    medianMinutes: Math.round(percentile(clean, 0.5)),
  };
}

await probe('current_user', '/api/v2/users/me.json', 'user', (body) => ({
  role: body?.user?.role || null,
  active: body?.user?.active !== false,
}));
await probe('account_settings', '/api/v2/account/settings.json', 'settings', (body) => ({
  hasSettings: Boolean(body?.settings),
  settingGroups: body?.settings ? Object.keys(body.settings).sort() : [],
  healthFlags: {
    helpCentre: Boolean(body?.settings?.active_features?.help_center || body?.settings?.knowledge?.enabled),
    businessHours: Boolean(body?.settings?.active_features?.business_hours),
    chat: Boolean(body?.settings?.active_features?.chat || body?.settings?.chat?.enabled),
    messaging: Boolean(body?.settings?.messaging?.enabled || body?.settings?.active_features?.messaging),
    customerSatisfaction: Boolean(body?.settings?.active_features?.customer_satisfaction || body?.settings?.active_features?.customer_satisfaction_survey),
    explore: Boolean(body?.settings?.active_features?.explore),
    lightAgents: Boolean(body?.settings?.active_features?.light_agents),
    ticketForms: Boolean(body?.settings?.active_features?.ticket_forms),
    voice: Boolean(body?.settings?.active_features?.voice || body?.settings?.voice?.enabled),
    sideConversations: Boolean(body?.settings?.side_conversations?.enabled),
    sandbox: Boolean(body?.settings?.active_features?.sandbox),
    toolbarCustomized: Boolean(body?.settings?.branding?.header_color || body?.settings?.branding?.header_logo_url),
    routingKeys: body?.settings?.routing ? Object.keys(body.settings.routing).sort() : [],
    surveyKeys: body?.settings?.surveys ? Object.keys(body.settings.surveys).sort() : [],
  },
}));
await probe('groups', '/api/v2/groups.json?per_page=1', 'groups');
await probe('agents', '/api/v2/users.json?role%5B%5D=agent&role%5B%5D=admin&per_page=1', 'users');
await probe('recipient_addresses', '/api/v2/recipient_addresses.json?per_page=1', 'recipient_addresses');
await probe('views', '/api/v2/views.json?per_page=1', 'views');
await probe('ticket_forms', '/api/v2/ticket_forms.json?per_page=1', 'ticket_forms');
await probe('ticket_fields', '/api/v2/ticket_fields.json?per_page=1', 'ticket_fields');
await probe('business_hours', '/api/v2/business_hours/schedules.json?per_page=1', 'schedules');
await probe('macros', '/api/v2/macros.json?sort_by=usage_30d&sort_order=desc&per_page=10', 'macros');
await probe('automations', '/api/v2/automations.json?active=true&per_page=1', 'automations');
await probe('triggers', '/api/v2/triggers.json?active=true&per_page=1', 'triggers');
await probe('trigger_categories', '/api/v2/trigger_categories?page%5Bsize%5D=1', 'trigger_categories');
await probe('sla_policies', '/api/v2/slas/policies.json?per_page=1', 'sla_policies');
await probe('custom_roles', '/api/v2/custom_roles.json?per_page=1', 'custom_roles');
await probe('app_installations', '/api/v2/apps/installations.json?per_page=1', 'installations');
await probe('brands', '/api/v2/brands.json?per_page=1', 'brands');
await probe('suspended_tickets', '/api/v2/suspended_tickets.json?per_page=1', 'suspended_tickets');
await probe('help_centre_locales', '/api/v2/help_center/locales.json', 'locales');
await probe('help_centre_categories', '/api/v2/help_center/en-us/categories.json?per_page=1', 'categories');
await probe('guide_themes', '/api/v2/guide/theming/themes', 'themes');

const yearStart = Math.floor(new Date(Date.now() - 366 * 86400000).getTime() / 1000);
const cutoff7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
for (const [name, query] of [
  ['unsolved_count', 'type:ticket status<solved'],
  ['stale_unsolved_count', `type:ticket status<solved updated<${cutoff7}`],
  ['stale_pending_count', `type:ticket status:pending updated<${cutoff7}`],
  ['negative_csat_count', 'type:ticket satisfaction:bad'],
]) {
  await probe(name, `/api/v2/search/count.json?query=${encodeURIComponent(query)}`, 'count', (body) => ({ count: Number(body?.count || 0) }));
}

const agentAt = Date.now();
try {
  const agents = await collect('/api/v2/users.json?role%5B%5D=agent&role%5B%5D=admin&per_page=100', 'users', { maxPages: 100 });
  const now = Date.now();
  const inactive = (days) => agents.rows.filter((user) => !user.last_login_at || now - new Date(user.last_login_at).getTime() > days * 86400000).length;
  report.endpoints.agent_usage = {
    ok: true,
    status: 200,
    ms: Date.now() - agentAt,
    records: agents.rows.length,
    active: agents.rows.filter((user) => user.active !== false).length,
    lightAgents: agents.rows.filter((user) => Number(user.role_type) === 1).length,
    inactive30d: inactive(30),
    inactive60d: inactive(60),
    inactive90d: inactive(90),
    withSignature: agents.rows.filter((user) => String(user.signature || '').trim()).length,
    truncated: agents.truncated,
  };
} catch (error) {
  report.endpoints.agent_usage = { ok: false, status: Number(error.status || 0), ms: Date.now() - agentAt, error: error.status ? `HTTP ${error.status}` : String(error.message || error) };
}

const incrementalAt = Date.now();
try {
  let url = `/api/v2/incremental/tickets/cursor.json?start_time=${yearStart}&include=metric_sets&support_type_scope=all&exclude_deleted=true&per_page=250`;
  let pages = 0;
  let truncated = false;
  const tickets = [];
  const metricByTicket = new Map();
  while (url && pages < 100 && tickets.length < 25000) {
    const body = await request(url);
    tickets.push(...(Array.isArray(body?.tickets) ? body.tickets : []));
    for (const metric of (Array.isArray(body?.metric_sets) ? body.metric_sets : [])) {
      if (metric?.ticket_id != null) metricByTicket.set(String(metric.ticket_id), metric);
    }
    pages += 1;
    url = nextUrl(body);
  }
  if (url || tickets.length >= 25000) truncated = true;
  report.endpoints.incremental_tickets_with_metrics = {
    ok: true,
    status: 200,
    ms: Date.now() - incrementalAt,
    records: tickets.length,
    metricSets: metricByTicket.size,
    pages,
    truncated,
  };

  const months = isoMonths(12);
  const monthSet = new Set(months);
  const channels = { email_web: [], messaging: [], other: [] };
  const monthly = Object.fromEntries(months.map((month) => [month, { email_web: 0, messaging: 0, other: 0 }]));
  for (const ticket of tickets) {
    const month = String(ticket?.created_at || '').slice(0, 7);
    if (!monthSet.has(month)) continue;
    const channel = classifyChannel(ticket);
    channels[channel].push(ticket);
    monthly[month][channel] += 1;
  }

  const byChannel = {};
  for (const channel of ['email_web', 'messaging', 'other']) {
    const rows = channels[channel];
    const metrics = rows.map((ticket) => metricByTicket.get(String(ticket.id))).filter(Boolean);
    const rated = rows.map((ticket) => ticket?.satisfaction_rating).filter((rating) => rating && (rating.score === 'good' || rating.score === 'bad'));
    const good = rated.filter((rating) => rating.score === 'good').length;
    const solved = metrics.filter((metric) => Boolean(metric.solved_at)).length;
    byChannel[channel] = {
      ticketsCreated: rows.length,
      averageCreatedPerMonth: Math.round(rows.length / 12),
      firstReplyCalendar: summarizeDuration(metrics.map((metric) => finiteNumber(metric?.reply_time_in_minutes?.calendar))),
      fullResolutionCalendar: summarizeDuration(metrics.map((metric) => finiteNumber(metric?.full_resolution_time_in_minutes?.calendar))),
      requesterWaitCalendar: summarizeDuration(metrics.map((metric) => finiteNumber(metric?.requester_wait_time_in_minutes?.calendar))),
      oneTouchTickets: metrics.filter((metric) => Number(metric?.replies) === 1).length,
      ratedTickets: rated.length,
      goodRatings: good,
      satisfactionPercent: rated.length ? Number((good * 100 / rated.length).toFixed(1)) : null,
      percentSolvedTicketsRated: solved ? Number((rated.length * 100 / solved).toFixed(1)) : null,
    };
  }
  report.operational = { months, monthly, byChannel };
} catch (error) {
  report.endpoints.incremental_tickets_with_metrics = {
    ok: false,
    status: Number(error.status || 0),
    ms: Date.now() - incrementalAt,
    error: error.status ? `HTTP ${error.status}` : String(error.message || error),
  };
}

report.totalMs = Date.now() - startedAt;
console.log(JSON.stringify(report, null, 2));
