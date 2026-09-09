(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CXEHealth = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var SCORECARD = [
  {
    "id": "hc001",
    "item": "Is there a Zendesk Help Centre present?",
    "plan": "No",
    "weight": 10,
    "phase": "Set Strong Foundations",
    "category": "Self-Service Centre",
    "benefit": "Enables customer self-service, deflected ticket volumes, and 24/7 support availability."
  },
  {
    "id": "hc002",
    "item": "Has the URL been redirected via CNAME to a recognisable URL (support.experts.co.za)?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Good",
    "category": "Self-Service Centre",
    "benefit": "Maintains brand consistency and trust; prevents security warnings and improves user experience."
  },
  {
    "id": "hc003",
    "item": "Are you making use of public profiles, giving access to tickets to logged in users?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Good",
    "category": "Self-Service Centre",
    "benefit": "Ensures end-users can transparently track their ticket history while validating security boundaries."
  },
  {
    "id": "hc004",
    "item": "Is the Herlp Centre Branded?",
    "plan": "No",
    "weight": 5,
    "phase": "Getting Good",
    "category": "Self-Service Centre",
    "benefit": "Aligns the customer support experience with corporate branding guidelines for a seamless user journey."
  },
  {
    "id": "hc005",
    "item": "Are you using a custom theme?",
    "plan": "No",
    "weight": 5,
    "phase": "Getting Great",
    "category": "Self-Service Centre",
    "benefit": "Allows for bespoke UX/UI layouts that standard out-of-the-box templates cannot support."
  },
  {
    "id": "hc006",
    "item": "Do you have a custom built, bespoke Help Centre that matches their actual website?",
    "plan": "No",
    "weight": 5,
    "phase": "Becoming Best in Class",
    "category": "Self-Service Centre",
    "benefit": "Provides a highly tailored, friction-free transition between the main product/website and support portal."
  },
  {
    "id": "hc007",
    "item": "Are you using Dynamic forms?",
    "plan": "No",
    "weight": 6,
    "phase": "Getting Good",
    "category": "Self-Service Centre",
    "benefit": "Reduces form clutter by showing fields conditionally, improving end-user ticket accuracy and data hygiene."
  },
  {
    "id": "hc008",
    "item": "Do On-Hold Tickets open up after a specified time?",
    "plan": "No",
    "weight": 5,
    "phase": "Getting Good",
    "category": "Business Rules",
    "benefit": "Prevents tickets from being forgotten or lost when waiting on external third parties or internal development."
  },
  {
    "id": "hc009",
    "item": "Do Pending tickets solve after a specified amount of time?",
    "plan": "No",
    "weight": 5,
    "phase": "Getting Good",
    "category": "Business Rules",
    "benefit": "Automates ticket closure hygiene when customers stop responding, keeping agent queues clean."
  },
  {
    "id": "hc010",
    "item": "Omnichannel/Automatic Routing present?",
    "plan": "No",
    "weight": 9,
    "phase": "Getting Good",
    "category": "Business Rules",
    "benefit": "Optimizes agent utilization and reduces cherry-picking by automatically pushing tickets to available staff."
  },
  {
    "id": "hc011",
    "item": "Predictive routing enabled?",
    "plan": "No",
    "weight": 4,
    "phase": "Becoming Best in Class",
    "category": "Business Rules",
    "benefit": "Leverages machine learning to route tickets to the most capable agent, reducing handling times."
  },
  {
    "id": "hc012",
    "item": "Grouped using accordion?",
    "plan": "No",
    "weight": 1,
    "phase": "Set Strong Foundations",
    "category": "Empowered Employees",
    "benefit": "Cleans up the agent interface, preventing cognitive overload from too many open list views."
  },
  {
    "id": "hc013",
    "item": "Do you use Emojis in your views?",
    "plan": "No",
    "weight": 1,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Improves scannability and visual prioritization for agents under high-pressure queues."
  },
  {
    "id": "hc014",
    "item": "Are there specific views for management/agents?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Segregates day-to-day operational queues from high-level escalation or oversight queues."
  },
  {
    "id": "hc015",
    "item": "Are you using the Play Button?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Enforces \"Next-In-Queue\" processing, optimizing response order and eliminating ticket cherry-picking."
  },
  {
    "id": "hc016",
    "item": "Are your views set up to put the most important ticket at the top?",
    "plan": "No",
    "weight": 3,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Ensures critical or SLA-breaching issues are surfaced instantly to the team."
  },
  {
    "id": "hc017",
    "item": "Are there custom views?",
    "plan": "No",
    "weight": 7,
    "phase": "Set Strong Foundations",
    "category": "Empowered Employees",
    "benefit": "Accommodates unique workflows or specific team/department tracking needs."
  },
  {
    "id": "hc018",
    "item": "Are you using Guided Mode?",
    "plan": "Enterprise",
    "weight": 5,
    "phase": "Getting Great",
    "category": "Empowered Employees",
    "benefit": "Forces agents to follow the established ticket order via the play button without skipping items."
  },
  {
    "id": "hc019",
    "item": "Phone Connected?",
    "plan": "No",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Omnichannel",
    "benefit": "Ensures voice-based real-time escalations are integrated seamlessly into the omnichannel record."
  },
  {
    "id": "hc020",
    "item": "Email Connected?",
    "plan": "No",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Omnichannel",
    "benefit": "Verifies standard support intake is operational and flowing into ticket queues properly."
  },
  {
    "id": "hc021",
    "item": "Messaging Connected?",
    "plan": "No",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Omnichannel",
    "benefit": "Validates presence of modern asynchronous live chat widgets for immediate web/app support."
  },
  {
    "id": "hc022",
    "item": "WhatsApp Connected?",
    "plan": "No",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Omnichannel",
    "benefit": "Meets regional preferences for mobile-first communication, logging conversations centrally."
  },
  {
    "id": "hc023",
    "item": "Social Media Messaging Channels Connected?",
    "plan": "No",
    "weight": 5,
    "phase": "Getting Good",
    "category": "Omnichannel",
    "benefit": "Consolidates brand reputation management (Facebook, Instagram, X) into unified ticket streams."
  },
  {
    "id": "hc024",
    "item": "Do Google Reviews create tickets?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Great",
    "category": "Omnichannel",
    "benefit": "Enables rapid responses to public feedback, helping protect the brand reputation."
  },
  {
    "id": "hc025",
    "item": "Do App reviews create tickets?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Great",
    "category": "Omnichannel",
    "benefit": "Surfaces mobile app bugs and user dissatisfaction directly to support and product teams."
  },
  {
    "id": "hc026",
    "item": "If you have an app, are you using the SDK? (Native in-app chat and knowledge surfacing)",
    "plan": "No",
    "weight": 2,
    "phase": "Becoming Best in Class",
    "category": "Omnichannel",
    "benefit": "Keeps users inside the application, driving higher engagement and lowering friction for help."
  },
  {
    "id": "hc027",
    "item": "Have custom email addresses been set up correctly or at all? (SPF, DNS, TXT)",
    "plan": "No",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Omnichannel",
    "benefit": "Prevents outbound support emails from landing in customer spam folders, preserving deliverability."
  },
  {
    "id": "hc028",
    "item": "Is there a Basic Bot set up to handle all messaging channels?",
    "plan": "No",
    "weight": 4,
    "phase": "Getting Good",
    "category": "Move to Messaging",
    "benefit": "Handles upfront categorization, triage, and basic FAQs automatically before human intervention."
  },
  {
    "id": "hc029",
    "item": "Is there an Advanced AI Agent in place?",
    "plan": "AI Agents Advanced",
    "weight": 5,
    "phase": "Becoming Best in Class",
    "category": "Move to Messaging",
    "benefit": "Drives sophisticated, human-like resolutions autonomously through generative AI reasoning."
  },
  {
    "id": "hc030",
    "item": "Have Agents done training?",
    "plan": "No",
    "weight": 10,
    "phase": "Set Strong Foundations",
    "category": "Empowered Employees",
    "benefit": "Minimizes manual errors, boosts platform navigation speed, and directly improves CSAT."
  },
  {
    "id": "hc031",
    "item": "Have Admins done training?",
    "plan": "No",
    "weight": 10,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Ensures safe backend modifications, proper trigger logic, and optimized instance health."
  },
  {
    "id": "hc032",
    "item": "Admins signed up to receive important updates via Zendesk thread? (Ask) | This Link",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Great",
    "category": "Empowered Employees",
    "benefit": "Keeps the system engineering team updated on critical product changes, deprecations, and outages."
  },
  {
    "id": "hc033",
    "item": "Making use of Light Agents?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Great",
    "category": "Empowered Employees",
    "benefit": "Leverages cost-efficient internal collaboration from non-support staff (e.g., product, billing) without license bloat."
  },
  {
    "id": "hc034",
    "item": "Custom-build CRM ZAF?",
    "plan": "No",
    "weight": 1,
    "phase": "Becoming Best in Class",
    "category": "Empowered Employees",
    "benefit": "Surfaces customer context from proprietary databases directly in the agent's sidebar app framework."
  },
  {
    "id": "hc035",
    "item": "Are notification triggers customised to include your name, ticket number and SLA expectations?",
    "plan": "No",
    "weight": 3,
    "phase": "Getting Good",
    "category": "Business Rules",
    "benefit": "Builds customer trust and sets clear transparency around resolution timeframes."
  },
  {
    "id": "hc036",
    "item": "Are notification triggers optimised for inside and outside of business hours?",
    "plan": "No",
    "weight": 3,
    "phase": "Getting Good",
    "category": "Business Rules",
    "benefit": "Manages customer expectations accurately dynamically based on when they reach out."
  },
  {
    "id": "hc037",
    "item": "Has the toolbar color been customised?",
    "plan": "No",
    "weight": 1,
    "phase": "Getting Good",
    "category": "Business Rules",
    "benefit": "Helps multi-instance admins easily distinguish between Sandbox/Staging and Production environments."
  },
  {
    "id": "hc038",
    "item": "Are all the licenses being used?",
    "plan": "No",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Reporting & Insights",
    "benefit": "Identifies wasted expenditure or underutilized seat allocations to optimize software spend."
  },
  {
    "id": "hc039",
    "item": "Is there currently a QA process in place?",
    "plan": "No",
    "weight": 5,
    "phase": "Getting Great",
    "category": "Reporting & Insights",
    "benefit": "Ensures quality standards are upheld consistently across teams for brand alignment."
  },
  {
    "id": "hc040",
    "item": "Are you leveraging Zendesk's Automatic Qiality Assurance Tool?",
    "plan": "Zendesk QA",
    "weight": 5,
    "phase": "Becoming Best in Class",
    "category": "Reporting & Insights",
    "benefit": "Automates code-free conversation reviews and flags underperforming tickets using AI directly inside Zendesk."
  },
  {
    "id": "hc041",
    "item": "Are Intent, Sentiment, and Language detection being mapped?",
    "plan": "CoPilot",
    "weight": 5,
    "phase": "Getting Great",
    "category": "Reporting & Insights",
    "benefit": "Powers intelligent triage, routing, and deep analytical tracking without relying on manual agent tagging."
  },
  {
    "id": "hc042",
    "item": "Is Macro Suggestions for agents turned on?",
    "plan": "CoPilot",
    "weight": 3,
    "phase": "Getting Great",
    "category": "Empowered Employees",
    "benefit": "Reduces ticket resolution times by predicting the fastest workflows for agents automatically."
  },
  {
    "id": "hc043",
    "item": "Is Zendesk suggesting respondses for agents based on availabl;e knowledge sources and Procedures?",
    "plan": "CoPilot",
    "weight": 5,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Empowers agents with Copilot tools to answer tickets rapidly using verified institutional knowledge."
  },
  {
    "id": "hc044",
    "item": "Are you leveraging Zendesk's Workforce Management Tool?",
    "plan": "Zendesk WFM",
    "weight": 5,
    "phase": "Becoming Best in Class",
    "category": "Reporting & Insights",
    "benefit": "Optimizes staffing schedules, tracks real-time adherence, and accurately forecasts inbound volumes."
  },
  {
    "id": "hc045",
    "item": "Is SSO (Single Sign-On) enabled?",
    "plan": "No",
    "weight": 1,
    "phase": "Getting Great",
    "category": "Empowered Employees",
    "benefit": "Secures agent access through corporate identity management and speeds up login provisioning."
  },
  {
    "id": "hc046",
    "item": "Do you have a schedule(s) set-up?",
    "plan": "No",
    "weight": 2,
    "phase": "Set Strong Foundations",
    "category": "Business Rules",
    "benefit": "Ensures SLAs calculation pauses accurately over weekends and outside of designated business hours."
  },
  {
    "id": "hc047",
    "item": "Do you make use of Macros?",
    "plan": "No",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Empowered Employees",
    "benefit": "Standardizes official responses, reducing typing time and ensuring message consistency."
  },
  {
    "id": "hc048",
    "item": "Are your triggers classified into categories?",
    "plan": "No",
    "weight": 1,
    "phase": "Set Strong Foundations",
    "category": "Business Rules",
    "benefit": "Prevents trigger conflict / \"race conditions\" and makes administration and updates easier."
  },
  {
    "id": "hc049",
    "item": "Do emails have a custom html header and footer?",
    "plan": "No",
    "weight": 2,
    "phase": "Getting Great",
    "category": "Business Rules",
    "benefit": "Ensures system communication matches corporate email branding and legal disclaimer requirements."
  },
  {
    "id": "hc050",
    "item": "Do you have automatic Agent Signatures set up?",
    "plan": "No",
    "weight": 1,
    "phase": "Set Strong Foundations",
    "category": "Business Rules",
    "benefit": "Enforces professional standards uniformly across all agent communications."
  },
  {
    "id": "hc051",
    "item": "Have SLA's been set up?",
    "plan": "Professional",
    "weight": 4,
    "phase": "Set Strong Foundations",
    "category": "Reporting & Insights",
    "benefit": "Establishes accountability and measurable commitment levels for customer resolution speeds."
  },
  {
    "id": "hc052",
    "item": "Escalation Automations for SLA's",
    "plan": "Professional",
    "weight": 2,
    "phase": "Getting Good",
    "category": "Business Rules",
    "benefit": "Proactively loops in managers or alerts teams before an SLA target formally breaches."
  },
  {
    "id": "hc053",
    "item": "Are you using Side-Conversations?",
    "plan": "Professional",
    "weight": 2,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Enables agents to collaborate with internal teams or vendors without exposing that dialogue to the customer."
  },
  {
    "id": "hc054",
    "item": "Are you making use of custom Agent Roles?",
    "plan": "Enterprise",
    "weight": 1,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Adheres to the principle of least privilege, restricting sensitive settings to authorized staff."
  },
  {
    "id": "hc055",
    "item": "Are you capturing CSAT on all channels?",
    "plan": "Growth",
    "weight": 10,
    "phase": "Set Strong Foundations",
    "category": "Reporting & Insights",
    "benefit": "Provides a comprehensive view of customer satisfaction score patterns across different contact methods."
  },
  {
    "id": "hc056",
    "item": "Are you capturing Contact Drivers?",
    "plan": "Professional",
    "weight": 5,
    "phase": "Set Strong Foundations",
    "category": "Reporting & Insights",
    "benefit": "Identifies the root causes behind customer inquiries, informing product changes or self-service expansions."
  },
  {
    "id": "hc057",
    "item": "Are you reporting on Contact Drivers through a pie chart, daily, weekly and monthly?",
    "plan": "Professional",
    "weight": 10,
    "phase": "Set Strong Foundations",
    "category": "Reporting & Insights",
    "benefit": "Visualizes volume trends over time to guide managerial strategy and resource planning."
  },
  {
    "id": "hc058",
    "item": "Are you tracking/monitoring KPIO's such as First Reply, Full REsolution and REquester Wait times?",
    "plan": "Professional",
    "weight": 10,
    "phase": "Set Strong Foundations",
    "category": "Reporting & Insights",
    "benefit": "Monitors the underlying operational metrics that dictate customer frustration or satisfaction."
  },
  {
    "id": "hc059",
    "item": "Exporting reports automatically?",
    "plan": "Professional",
    "weight": 3,
    "phase": "Getting Good",
    "category": "Reporting & Insights",
    "benefit": "Keeps executive stakeholders informed seamlessly without manual data-pull efforts."
  },
  {
    "id": "hc060",
    "item": "Are you capturing systems Requests and reporting on these?",
    "plan": "No",
    "weight": 5,
    "phase": "Getting Good",
    "category": "Empowered Employees",
    "benefit": "Tracks technical bugs or system failures causing spikes in customer contacts."
  },
  {
    "id": "hc061",
    "item": "Time-Tracking app",
    "plan": "Professional",
    "weight": 5,
    "phase": "Getting Great",
    "category": "Reporting & Insights",
    "benefit": "Measures exactly how much effort/time unique ticket types consume to pinpoint hidden bottlenecks."
  }
];

  function arr(value) { return Array.isArray(value) ? value : []; }
  function text(value) { return value == null ? '' : String(value); }
  function lower(value) { return text(value).toLowerCase(); }
  function percent(value, total) { return total ? Math.round(value * 1000 / total) / 10 : null; }
  function finite(value) { if (value == null || value === '') return null; var number = Number(value); return Number.isFinite(number) ? number : null; }
  function deepText(value) { try { return JSON.stringify(value || {}).toLowerCase(); } catch (error) { return ''; } }
  function hasAny(value, terms) { var haystack = lower(value); return arr(terms).some(function (term) { return haystack.indexOf(lower(term)) >= 0; }); }
  function getPath(value, path) {
    return text(path).split('.').reduce(function (current, key) { return current == null ? undefined : current[key]; }, value);
  }
  function anyTruthy(value) {
    if (value === true) return true;
    if (Array.isArray(value)) return value.some(anyTruthy);
    if (value && typeof value === 'object') return Object.keys(value).some(function (key) { return anyTruthy(value[key]); });
    return false;
  }

  function monthKey(value) {
    var date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 7) : '';
  }

  function rollingMonths(count, nowValue) {
    var now = nowValue ? new Date(nowValue) : new Date();
    var output = [];
    for (var index = Number(count || 12) - 1; index >= 0; index -= 1) {
      output.push(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1)).toISOString().slice(0, 7));
    }
    return output;
  }

  function classifyChannel(ticket) {
    var channel = lower(ticket && ticket.via && ticket.via.channel);
    if (ticket && ticket.from_messaging_channel === true || /messaging|whatsapp|sunshine|chat|facebook|instagram|wechat|line/.test(channel)) return 'messaging';
    if (channel === 'email' || channel === 'web') return 'email_web';
    return 'other';
  }

  function percentile(values, fraction) {
    var sorted = arr(values).filter(function (value) { return value != null && Number.isFinite(Number(value)); }).map(Number).sort(function (a, b) { return a - b; });
    if (!sorted.length) return null;
    var position = (sorted.length - 1) * fraction;
    var low = Math.floor(position), high = Math.ceil(position);
    return low === high ? sorted[low] : sorted[low] + (sorted[high] - sorted[low]) * (position - low);
  }

  function durationSummary(values) {
    var clean = arr(values).map(finite).filter(function (value) { return value != null; });
    if (!clean.length) return { count: 0, averageMinutes: null, medianMinutes: null, p90Minutes: null };
    return {
      count: clean.length,
      averageMinutes: Math.round(clean.reduce(function (sum, value) { return sum + value; }, 0) / clean.length),
      medianMinutes: Math.round(percentile(clean, 0.5)),
      p90Minutes: Math.round(percentile(clean, 0.9))
    };
  }

  function exactCount(value) {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  }

  var SEARCH_SCOPE = 'Counts matching the stated Zendesk search query at collection time. Historical, archived, deleted, and channel populations have not been reconciled to the supplied Explore report.';
  var EXPLORE_REASON = 'Explore dependent: a complete dataset with the agreed reporting period, channel definitions, and metric filters is required. No value is calculated from a ticket subset.';

  function unavailableSummary() {
    return {
      ticketsCreated: null, solvedTickets: null, averageCreatedPerMonth: null,
      firstReplyCalendar: { count: null, averageMinutes: null, medianMinutes: null, p90Minutes: null },
      fullResolutionCalendar: { count: null, averageMinutes: null, medianMinutes: null, p90Minutes: null },
      requesterWaitCalendar: { count: null, averageMinutes: null, medianMinutes: null, p90Minutes: null },
      oneTouchTickets: null, ratedTickets: null, goodRatings: null,
      satisfactionPercent: null, percentSolvedTicketsRated: null
    };
  }

  function aggregateOperational(input, options) {
    input = input || {};
    options = options || {};
    var months = rollingMonths(options.months || 12, options.now);
    var monthly = {}, monthlyCompleteness = {}, searchCountsComplete = true;
    months.forEach(function (month) {
      monthly[month] = { email_web: null, messaging: null, other: null, solved: null };
      monthlyCompleteness[month] = { email_web: false, messaging: false };
      ['email_web', 'messaging'].forEach(function (channel) {
        var value = exactCount(input.monthlyCounts && input.monthlyCounts[month] && input.monthlyCounts[month][channel]);
        var marker = input.monthlyCountCompleteness && input.monthlyCountCompleteness[month];
        var complete = value != null && (!marker || marker[channel] === true);
        if (complete) monthly[month][channel] = value;
        monthlyCompleteness[month][channel] = complete;
        if (!complete) searchCountsComplete = false;
      });
    });
    var counts = {}, countCompleteness = {};
    ['unsolved', 'staleUnsolved', 'stalePending', 'negativeCsat', 'suspended'].forEach(function (key) {
      var value = exactCount(input.counts && input.counts[key]);
      var complete = Boolean(input.countCompleteness && input.countCompleteness[key] === true && value != null);
      counts[key] = complete ? value : null;
      countCompleteness[key] = complete;
    });
    var sourceCompleteness = input.sourceCompleteness || {};
    var agentsComplete = sourceCompleteness.agents === true && sourceCompleteness.customRoles === true;
    var requestedMetrics = [
      { id: 'tickets_created_monthly', label: 'Tickets Created Monthly (in the last year)' },
      { id: 'first_reply_time', label: 'First Reply Time' },
      { id: 'full_resolution_time', label: 'Full Resolution Time (Calendar)' },
      { id: 'requester_wait_time', label: 'Requester Wait Time' },
      { id: 'satisfaction_score', label: 'Satisfaction Score' },
      { id: 'percent_tickets_rated', label: '% Tickets Rated' }
    ].map(function (row) {
      return Object.assign({}, row, {
        status: 'explore_dependent', source: 'Zendesk Explore', value: null,
        email_web: null, messaging: null,
        reason: row.id === 'tickets_created_monthly'
          ? 'Explore dependent: monthly search query counts are supplied separately as scoped observations. Their historical and channel population has not been reconciled to the original report, so they do not fill this requirement.'
          : EXPLORE_REASON
      });
    });
    return {
      periodMonths: months.length, months: months, monthly: monthly,
      monthlyCompleteness: monthlyCompleteness,
      monthlyScope: SEARCH_SCOPE,
      channelScopes: { email_web: 'via:mail OR via:web', messaging: 'via:native_messaging' },
      byChannel: { email_web: unavailableSummary(), messaging: unavailableSummary(), other: unavailableSummary() },
      overall: unavailableSummary(), byGroup: [], byAgent: [], byBrand: [],
      counts: counts, countCompleteness: countCompleteness,
      countScopes: {
        unsolved: 'Search query: type:ticket status<solved; current matching indexed tickets.',
        staleUnsolved: 'Search query: type:ticket status<solved updated before the stated cutoff; current matching indexed tickets.',
        stalePending: 'Search query: type:ticket status:pending updated before the stated cutoff; current matching indexed tickets.',
        negativeCsat: 'Search query: type:ticket satisfaction:bad; current matching indexed tickets, without a reporting-period filter.',
        suspended: 'Current suspended-ticket queue, counted only after every page was retrieved.'
      },
      agents: agentsComplete ? input.agentUsage || {} : {},
      agentsComplete: agentsComplete,
      requestedMetrics: requestedMetrics,
      coverage: {
        requestedCount: requestedMetrics.length, availableCount: 0,
        exploreDependentCount: requestedMetrics.length, unavailableCount: requestedMetrics.length,
        availablePercent: 0, denominator: 'The six KPI rows in the supplied operational template.',
        note: 'Supplemental configuration and search-query facts do not increase fulfilment of the original operational KPI requirements.'
      },
      dataCoverage: {
        tickets: 0, metricSets: 0, metricCoveragePercent: null,
        exactVolumeTickets: null, exactVolumeComplete: false,
        searchCountsComplete: searchCountsComplete, ticketSamplingUsed: false,
        sampled: false, samplingDescription: '', truncated: false,
        policy: 'Only complete source observations are reported. Ticket subsets and derived performance calculations are excluded.'
      }
    };
  }

  function sourceValue(context, key) {
    if (key === 'accountSettings') return context.accountSettings;
    if (['customRoles', 'guideThemes', 'appInstallations', 'securitySettings'].indexOf(key) >= 0) return context.extra && context.extra[key];
    return context.config && context.config[key];
  }

  function sourcesComplete(context, keys) {
    return keys.every(function (key) {
      var value = sourceValue(context, key);
      return context.sourceCompleteness && context.sourceCompleteness[key] === true &&
        (key === 'accountSettings' || key === 'securitySettings'
          ? value && typeof value === 'object' && !Array.isArray(value)
          : Array.isArray(value));
    });
  }

  function result(status, evidence, source) {
    return { status: status, evidence: text(evidence), source: text(source || ''), answerVerified: status === 'yes' || status === 'no' };
  }

  function review(reason, source, status) {
    return Object.assign(result(status || 'manual', '', source || 'Consultant review'), {
      reason: reason, outstandingReason: reason, answerVerified: false
    });
  }

  function activeAgents(context) {
    return arr(context.config && context.config.agents).filter(function (agent) {
      return agent && agent.active === true && agent.suspended !== true && (agent.role === 'agent' || agent.role === 'admin');
    });
  }

  function detectScorecard(row, context) {
    var config = context.config || {}, settings = context.accountSettings || {}, extra = context.extra || {};
    function requireSources(keys) {
      return sourcesComplete(context, keys) ? null :
        review('The required source was missing, failed, or did not finish pagination. No answer is inferred from incomplete records. Contact Farhaan / CX Experts Support.', 'Source collection', 'unavailable');
    }
    var missing, values, matched, flag;
    switch (row.id) {
      case 'hc001':
        missing = requireSources(['help_centre_categories', 'help_centre_articles']);
        if (missing) return missing;
        if (config.help_centre_categories.length || config.help_centre_articles.length)
          return result('yes', 'Help Centre content was returned by the Help Center API for the accessible locale.', 'Help Center API');
        return review('An empty accessible content list does not prove that a Help Centre is absent. Review the live Help Centre.');
      case 'hc007':
        missing = requireSources(['ticket_forms']); if (missing) return missing;
        matched = config.ticket_forms.filter(function (form) { return form && form.active !== false && (arr(form.agent_conditions).length || arr(form.end_user_conditions).length); });
        if (matched.length) return result('yes', matched.length + ' active form(s) contain explicit conditional field rules.', 'Ticket Forms API');
        return review('No native conditional form rules were returned. Custom Help Centre form behaviour requires a functional review.');
      case 'hc010':
        missing = requireSources(['accountSettings']); if (missing) return missing;
        flag = getPath(settings, 'routing.enabled');
        if (typeof flag === 'boolean') return result(flag ? 'yes' : 'no', 'The account routing.enabled setting is ' + flag + '.', 'Account Settings API');
        return review('The response did not contain an explicit routing.enabled boolean. Verify the current routing configuration.');
      case 'hc013':
        missing = requireSources(['views']); if (missing) return missing;
        values = config.views.filter(function (view) { return view && view.active !== false; });
        matched = values.filter(function (view) { return /\p{Extended_Pictographic}|\p{Regional_Indicator}|[0-9#*]\uFE0F?\u20E3/u.test(text(view.title || view.raw_title)); });
        return result(matched.length ? 'yes' : 'no', matched.length + ' active view title(s) contain recognised emoji characters, across the complete retrieved view list.', 'Views API');
      case 'hc018':
        missing = requireSources(['accountSettings']); if (missing) return missing;
        flag = getPath(settings, 'agents.focus_mode_enabled');
        if (typeof flag !== 'boolean') flag = getPath(settings, 'agents.focus_mode');
        if (typeof flag === 'boolean') return result(flag ? 'yes' : 'no', 'The explicit Guided/Focus Mode setting is ' + flag + '.', 'Account Settings API');
        return review('The response did not expose an explicit Guided Mode setting. Verify Guided Mode in Admin Center.');
      case 'hc033':
        missing = requireSources(['agents', 'customRoles']); if (missing) return missing;
        values = activeAgents(context);
        matched = values.filter(function (agent) {
          var role = arr(extra.customRoles).find(function (item) { return text(item.id) === text(agent.custom_role_id); });
          return finite(agent.role_type) === 1 || role && finite(role.role_type) === 1;
        });
        return result(matched.length ? 'yes' : 'no', matched.length + ' active, unsuspended light-agent account(s) are assigned. This confirms assigned accounts, not billing utilisation.', 'Users and Custom Roles APIs');
      case 'hc045':
        missing = requireSources(['securitySettings']); if (missing) return missing;
        var flags = ['sso.enabled', 'saml.enabled', 'jwt.enabled'].map(function (path) { return getPath(extra.securitySettings, path); });
        if (flags.some(function (value) { return value === true; }))
          return result('yes', 'An explicit SSO, SAML, or JWT enabled setting was returned.', 'Security Settings API');
        return review('An explicit active SSO setting was not returned. Missing or partial settings do not prove that SSO is disabled.');
      case 'hc046':
        missing = requireSources(['business_hours']); if (missing) return missing;
        return result(config.business_hours.length ? 'yes' : 'no', config.business_hours.length + ' business-hours schedule(s) are configured.', 'Business Hours API');
      case 'hc047':
        missing = requireSources(['macros']); if (missing) return missing;
        values = config.macros.filter(function (macro) { return macro && macro.active !== false; });
        matched = values.filter(function (macro) { return exactCount(macro.usage_30d) != null && macro.usage_30d > 0; });
        if (matched.length) return result('yes', matched.length + ' active macro(s) have positive usage_30d values returned directly by Zendesk.', 'Macros API');
        return review('Macro configuration alone does not prove usage. No positive direct usage counter was available.');
      case 'hc048':
        missing = requireSources(['triggers', 'trigger_categories']); if (missing) return missing;
        values = config.triggers.filter(function (trigger) { return trigger && trigger.active !== false; });
        if (!values.length) return review('There are no active triggers in the retrieved list; applicability of this question needs review.');
        matched = values.filter(function (trigger) {
          return trigger.category_id != null && config.trigger_categories.some(function (category) { return text(category.id) === text(trigger.category_id); });
        });
        return result(matched.length === values.length ? 'yes' : 'no', matched.length + ' of ' + values.length + ' active triggers reference a returned trigger category.', 'Triggers and Trigger Categories APIs');
      case 'hc050':
        missing = requireSources(['agents']); if (missing) return missing;
        matched = activeAgents(context).filter(function (agent) { return text(agent.signature).trim(); });
        if (matched.length) return result('yes', matched.length + ' active, unsuspended agent account(s) have a signature configured.', 'Users API');
        return review('No active agent signature was returned. Verify whether shared templates provide signatures.');
      case 'hc051':
        missing = requireSources(['sla_policies']); if (missing) return missing;
        values = config.sla_policies.filter(function (policy) { return policy && policy.active !== false; });
        return result(values.length ? 'yes' : 'no', values.length + ' SLA policy record(s) are configured. This does not measure SLA achievement.', 'SLA Policies API');
      case 'hc054':
        missing = requireSources(['agents', 'customRoles']); if (missing) return missing;
        matched = activeAgents(context).filter(function (agent) {
          return arr(extra.customRoles).some(function (role) { return finite(role.role_type) === 0 && text(role.id) === text(agent.custom_role_id); });
        });
        return result(matched.length ? 'yes' : 'no', matched.length + ' active, unsuspended agent account(s) are assigned to a role identified by Zendesk as a custom agent role (role_type 0).', 'Users and Custom Roles APIs');
      case 'hc055':
        return review('Survey configuration and complete response data must be checked for every channel. Account-level CSAT enablement alone cannot answer this question.', 'Explore and channel configuration review');
      case 'hc057':
      case 'hc058':
      case 'hc059':
        return review('The client Explore dashboards, metric definitions, and delivery schedules require review in Explore; the Support API does not verify the requested reporting practice.', 'Zendesk Explore');
      case 'hc038':
        return review('Active accounts are supplied separately by role. Purchased licences and actual licence utilisation require the subscription record and commercial review.');
      case 'hc030':
      case 'hc031':
      case 'hc032':
      case 'hc039':
        return review('This question concerns training, subscriptions, or working practices and requires confirmation from the client.');
      default:
        return review('The collected API records do not prove this exact requirement. A consultant must verify the relevant configuration or working practice.');
    }
  }

  function scorecardAssessment(context, overrides) {
    context = context || {};
    overrides = overrides || {};
    var assessed = SCORECARD.map(function (row) {
      var detected = detectScorecard(row, context);
      return Object.assign({}, row, detected, {
        detectedStatus: detected.status,
        overridden: false,
        reviewerAnswer: ['yes', 'no', 'na'].indexOf(overrides[row.id]) >= 0 ? overrides[row.id] : null
      });
    });
    var verified = assessed.filter(function (row) { return row.answerVerified === true; });
    var originalWeight = assessed.reduce(function (sum, row) { return sum + row.weight; }, 0);
    var verifiedWeight = verified.reduce(function (sum, row) { return sum + row.weight; }, 0);
    function breakdown(key) {
      var grouped = {};
      assessed.forEach(function (row) {
        var name = row[key];
        if (!grouped[name]) grouped[name] = { name: name, requestedCount: 0, verifiedCount: 0, outstandingCount: 0 };
        grouped[name].requestedCount += 1;
        if (row.answerVerified) grouped[name].verifiedCount += 1;
        else grouped[name].outstandingCount += 1;
      });
      return Object.keys(grouped).map(function (name) { return grouped[name]; });
    }
    return {
      rows: assessed,
      coverage: {
        requestedCount: assessed.length, verifiedCount: verified.length,
        outstandingCount: assessed.length - verified.length,
        originalWeight: originalWeight, verifiedWeight: verifiedWeight,
        outstandingWeight: originalWeight - verifiedWeight,
        percent: percent(verified.length, assessed.length),
        weightedPercent: percent(verifiedWeight, originalWeight),
        denominator: 'All 61 questions and the original 258 weighting points remain in the denominator. This measures verified coverage, not a health or performance score.'
      },
      totalPoints: originalWeight, achievedPoints: null, failedPoints: null,
      assessedPoints: verifiedWeight, excludedPoints: 0,
      achievedPercentOfTotal: null, scoreWithinAssessed: null,
      automationCoveragePercent: percent(verifiedWeight, originalWeight),
      manualQuestionCount: assessed.length - verified.length,
      byCategory: breakdown('category'), byPhase: breakdown('phase')
    };
  }

  function channelEvidence() {
    return {};
  }

  function configurationObservations(input, context) {
    var definitions = [
      ['groups', 'Groups', 'Groups API'], ['views', 'Views', 'Views API'],
      ['ticket_forms', 'Ticket forms', 'Ticket Forms API'], ['ticket_fields', 'Ticket fields', 'Ticket Fields API'],
      ['triggers', 'Triggers', 'Triggers API'], ['trigger_categories', 'Trigger categories', 'Trigger Categories API'],
      ['automations', 'Automations', 'Automations API'], ['macros', 'Macros', 'Macros API'],
      ['brands', 'Brands', 'Brands API'], ['business_hours', 'Business-hours schedules', 'Business Hours API'],
      ['sla_policies', 'SLA policies', 'SLA Policies API'], ['recipient_addresses', 'Recipient email addresses', 'Recipient Addresses API'],
      ['custom_objects', 'Custom objects', 'Custom Objects API'], ['custom_object_fields', 'Custom object fields', 'Custom Object Fields API']
    ];
    return definitions.filter(function (definition) { return sourcesComplete(context, [definition[0]]); }).map(function (definition) {
      var records = arr(input.config && input.config[definition[0]]);
      return {
        key: definition[0], label: definition[1], count: records.length, source: definition[2], complete: true,
        scope: 'All records returned for the authenticated account by the named configuration endpoint after pagination completed. This is an inventory count and does not prove effective use or quality.'
      };
    });
  }

  function buildReport(input) {
    input = input || {};
    var operational = aggregateOperational(input, { months: input.months || 12, now: input.now });
    var extra = Object.assign({}, input.extra || {}, {
      guideThemes: arr(input.guideThemes), customRoles: arr(input.customRoles),
      appInstallations: arr(input.appInstallations), securitySettings: input.securitySettings || null,
      agentUsage: input.agentUsage || {}
    });
    var context = {
      config: input.config || {}, operational: operational, accountSettings: input.accountSettings || {},
      extra: extra, sourceCompleteness: input.sourceCompleteness || {}
    };
    return {
      version: 'health-v2-exact',
      generatedAt: input.now ? new Date(input.now).toISOString() : new Date().toISOString(),
      periodMonths: input.months || 12, operational: operational,
      adminSignals: { topMacros: [] },
      configurationObservations: configurationObservations(input, context),
      scorecard: scorecardAssessment(context, input.manualAnswers || {}),
      sourceCompleteness: Object.assign({}, input.sourceCompleteness || {}),
      limitations: arr(input.limitations)
    };
  }

  function formatMinutes(value) {
    if (value == null) return 'No data';
    var minutes = Math.round(Number(value));
    if (minutes < 60) return minutes + ' min';
    if (minutes < 1440) return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
    return Math.floor(minutes / 1440) + 'd ' + Math.floor((minutes % 1440) / 60) + 'h';
  }

  return {
    SCORECARD: SCORECARD,
    rollingMonths: rollingMonths,
    classifyChannel: classifyChannel,
    durationSummary: durationSummary,
    aggregateOperational: aggregateOperational,
    scorecardAssessment: scorecardAssessment,
    channelEvidence: channelEvidence,
    buildReport: buildReport,
    formatMinutes: formatMinutes
  };
});
