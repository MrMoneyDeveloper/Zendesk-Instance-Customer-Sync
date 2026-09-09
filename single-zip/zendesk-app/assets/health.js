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

  function summarizeTickets(tickets, metricByTicket) {
    var metrics = arr(tickets).map(function (ticket) { return metricByTicket[text(ticket.id)]; }).filter(Boolean);
    var ratings = arr(tickets).map(function (ticket) { return ticket && ticket.satisfaction_rating; }).filter(function (rating) { return rating && (rating.score === 'good' || rating.score === 'bad'); });
    var good = ratings.filter(function (rating) { return rating.score === 'good'; }).length;
    var solved = arr(tickets).filter(function (ticket) {
      var metric = metricByTicket[text(ticket.id)];
      return Boolean(metric && metric.solved_at) || ticket.status === 'solved' || ticket.status === 'closed';
    }).length;
    return {
      ticketsCreated: arr(tickets).length,
      solvedTickets: solved,
      firstReplyCalendar: durationSummary(metrics.map(function (metric) {
        var minutes = finite(metric && metric.reply_time_in_minutes && metric.reply_time_in_minutes.calendar);
        if (minutes != null) return minutes;
        var seconds = finite(metric && metric.reply_time_in_seconds && metric.reply_time_in_seconds.calendar);
        return seconds == null ? null : seconds / 60;
      })),
      fullResolutionCalendar: durationSummary(metrics.map(function (metric) { return metric && metric.full_resolution_time_in_minutes && metric.full_resolution_time_in_minutes.calendar; })),
      requesterWaitCalendar: durationSummary(metrics.map(function (metric) { return metric && metric.requester_wait_time_in_minutes && metric.requester_wait_time_in_minutes.calendar; })),
      oneTouchTickets: metrics.filter(function (metric) { return Number(metric.replies) === 1 && Boolean(metric.solved_at); }).length,
      ratedTickets: ratings.length,
      goodRatings: good,
      satisfactionPercent: percent(good, ratings.length),
      percentSolvedTicketsRated: percent(ratings.length, solved)
    };
  }

  function dimensionBreakdown(tickets, metricByTicket, key, nameMap) {
    var grouped = {};
    arr(tickets).forEach(function (ticket) {
      var id = text(ticket && ticket[key]) || 'unassigned';
      if (!grouped[id]) grouped[id] = [];
      grouped[id].push(ticket);
    });
    return Object.keys(grouped).map(function (id) {
      return Object.assign({ id: id, name: nameMap && nameMap[id] || (id === 'unassigned' ? 'Unassigned' : id) }, summarizeTickets(grouped[id], metricByTicket));
    }).sort(function (a, b) { return b.ticketsCreated - a.ticketsCreated; });
  }

  function aggregateOperational(input, options) {
    input = input || {};
    options = options || {};
    var months = rollingMonths(options.months || 12, options.now);
    var wanted = {}; months.forEach(function (month) { wanted[month] = true; });
    var metricByTicket = {};
    arr(input.metricSets).forEach(function (metric) { if (metric && metric.ticket_id != null) metricByTicket[text(metric.ticket_id)] = metric; });
    var tickets = arr(input.tickets).filter(function (ticket) { return wanted[monthKey(ticket && ticket.created_at)]; });
    var grouped = { email_web: [], messaging: [], other: [] };
    var monthly = {};
    months.forEach(function (month) { monthly[month] = { email_web: 0, messaging: 0, other: 0, solved: 0 }; });
    tickets.forEach(function (ticket) {
      var channel = classifyChannel(ticket), month = monthKey(ticket.created_at);
      grouped[channel].push(ticket);
      monthly[month][channel] += 1;
    });
    Object.keys(metricByTicket).forEach(function (ticketId) {
      var solvedMonth = monthKey(metricByTicket[ticketId] && metricByTicket[ticketId].solved_at);
      if (monthly[solvedMonth]) monthly[solvedMonth].solved += 1;
    });
    var allSummary = summarizeTickets(tickets, metricByTicket);
    var byChannel = {};
    Object.keys(grouped).forEach(function (key) {
      byChannel[key] = summarizeTickets(grouped[key], metricByTicket);
      byChannel[key].averageCreatedPerMonth = Math.round(grouped[key].length / months.length * 10) / 10;
    });
    var exactCounts=input.monthlyCounts||{},exactComplete={email_web:true,messaging:true},exactTotals={email_web:0,messaging:0};
    months.forEach(function(month){
      var exact=exactCounts[month]||{};
      ['email_web','messaging'].forEach(function(channel){
        var value=finite(exact[channel]);
        if(value==null){exactComplete[channel]=false;monthly[month][channel]=null;}
        else{monthly[month][channel]=value;exactTotals[channel]+=value;}
      });
    });
    ['email_web','messaging'].forEach(function(channel){
      if(exactComplete[channel]){
        byChannel[channel].ticketsCreated=exactTotals[channel];
        byChannel[channel].averageCreatedPerMonth=Math.round(exactTotals[channel]/months.length*10)/10;
      }
    });
    var exactVolumeComplete=exactComplete.email_web&&exactComplete.messaging;
    if(exactVolumeComplete)allSummary.ticketsCreated=exactTotals.email_web+exactTotals.messaging;
    var channelNames = {}, groupNames = {}, agentNames = {}, brandNames = {};
    arr(input.groups).forEach(function (item) { groupNames[text(item.id)] = item.name || item.title || text(item.id); });
    arr(input.agents).forEach(function (item) { agentNames[text(item.id)] = item.name || text(item.id); });
    arr(input.brands).forEach(function (item) { brandNames[text(item.id)] = item.name || text(item.id); });
    tickets.forEach(function (ticket) { var key = classifyChannel(ticket); channelNames[key] = key === 'email_web' ? 'Email / Web Form' : key === 'messaging' ? 'Messaging' : 'Other'; });
    return {
      periodMonths: months.length,
      months: months,
      monthly: monthly,
      byChannel: byChannel,
      overall: allSummary,
      byGroup: dimensionBreakdown(tickets, metricByTicket, 'group_id', groupNames),
      byAgent: dimensionBreakdown(tickets, metricByTicket, 'assignee_id', agentNames),
      byBrand: dimensionBreakdown(tickets, metricByTicket, 'brand_id', brandNames),
      counts: Object.assign({ unsolved: null, staleUnsolved: null, stalePending: null, negativeCsat: null, suspended: null }, input.counts || {}),
      agents: input.agentUsage || {},
      dataCoverage: {
        tickets: tickets.length,
        metricSets: tickets.filter(function (ticket) { return Boolean(metricByTicket[text(ticket && ticket.id)]); }).length,
        metricCoveragePercent: percent(tickets.filter(function (ticket) { return Boolean(metricByTicket[text(ticket && ticket.id)]); }).length, tickets.length),
        exactVolumeTickets: exactVolumeComplete ? exactTotals.email_web+exactTotals.messaging : null,
        exactVolumeComplete: exactVolumeComplete,
        sampled: Boolean(input.sampled),
        samplingDescription: text(input.samplingDescription),
        truncated: Boolean(input.truncated)
      }
    };
  }

  function result(status, evidence, source) {
    return { status: status, evidence: text(evidence), source: text(source || '') };
  }

  function detectScorecard(row, context) {
    var item = lower(row.item);
    var config = context.config || {};
    var extra = context.extra || {};
    var settings = context.accountSettings || {};
    var operational = context.operational || {};
    var views = arr(config.views), forms = arr(config.ticket_forms), automations = arr(config.automations), triggers = arr(config.triggers);
    var brands = arr(config.brands), fields = arr(config.ticket_fields), schedules = arr(config.business_hours);
    var macros = arr(config.macros), slas = arr(config.sla_policies), triggerCategories = arr(config.trigger_categories);
    var recipients = arr(config.recipient_addresses), agents = arr(config.agents), rulesText = deepText(automations.concat(triggers));
    var fieldText = fields.map(function (field) { return lower(field.title || field.raw_title || field.name); }).join(' ');
    var viewTitles = views.map(function (view) { return text(view.title || view.raw_title); });
    var ticketsByChannel = operational.byChannel || {};
    var channelEvidence = extra.channelEvidence || {};
    var activeFeatures = settings.active_features || {};
    var routing = settings.routing || {};

    if (item.indexOf('help centre present') >= 0) return arr(config.help_centre_categories).length || arr(config.help_centre_articles).length ? result('yes', arr(config.help_centre_categories).length + ' categories and ' + arr(config.help_centre_articles).length + ' articles detected.', 'Help Center API') : result('no', 'No Help Centre categories or articles were returned.', 'Help Center API');
    if (item.indexOf('redirected via cname') >= 0) {
      var mapped = brands.filter(function (brand) { return brand && brand.host_mapping; });
      return mapped.length ? result('yes', mapped.length + ' brand host mapping(s) detected.', 'Brands API') : result('no', 'No brand host mapping was detected.', 'Brands API');
    }
    if (item.indexOf('public profiles') >= 0) return result('manual', 'The API exposes end-user settings but cannot prove the intended portal permission experience.', 'Manual verification');
    if (item.indexOf('herlp centre branded') >= 0) return brands.some(function (brand) { return brand.logo || brand.brand_url || brand.host_mapping; }) ? result('yes', 'Brand logo, URL, or host mapping detected.', 'Brands API') : result('manual', 'Review the live Help Centre presentation.', 'Manual verification');
    if (item.indexOf('custom theme') >= 0) return result('manual', arr(extra.guideThemes).length + ' Guide theme record(s) were returned, but the API does not prove which theme is live or how extensively it is customised.', 'Guide Themes API and visual review');
    if (item.indexOf('bespoke help centre') >= 0) return result('manual', 'A visual and functional comparison with the company website is required.', 'Manual verification');
    if (item.indexOf('dynamic forms') >= 0) {
      var conditional = forms.filter(function (form) { return arr(form.agent_conditions).length || arr(form.end_user_conditions).length; });
      return conditional.length ? result('yes', conditional.length + ' form(s) contain conditional rules.', 'Ticket Forms API') : result('no', 'No form-level conditional rules were detected.', 'Ticket Forms API');
    }
    if (item.indexOf('on-hold tickets open') >= 0) return automations.some(function (rule) { var value=deepText(rule);return /hold|on-hold/.test(value) && /open/.test(value) && /hours|days/.test(value); }) ? result('yes', 'A single automation contains timed on-hold-to-open evidence.', 'Automations API') : result('no', 'No single automation contained timed on-hold-to-open evidence.', 'Automations API');
    if (item.indexOf('pending tickets solve') >= 0) return automations.some(function (rule) { var value=deepText(rule);return /pending/.test(value) && /solved|closed/.test(value) && /hours|days/.test(value); }) ? result('yes', 'A single automation contains timed pending-to-solved evidence.', 'Automations API') : result('no', 'No single automation contained timed pending-to-solved evidence.', 'Automations API');
    if (item.indexOf('omnichannel/automatic routing') >= 0) return routing.enabled === true ? result('yes', 'Omnichannel routing is enabled.', 'Account Settings API') : result('no', 'Omnichannel routing is not enabled.', 'Account Settings API');
    if (item.indexOf('predictive routing') >= 0) return result('manual', routing.skills_enabled === true ? 'Skills-based routing is enabled, but that is not proof of predictive routing.' : 'No reliable predictive-routing flag is exposed in the standard response.', 'Account Settings API and manual verification');
    if (item.indexOf('grouped using accordion') >= 0) return viewTitles.some(function (title) { return title.indexOf('::') >= 0; }) ? result('yes', 'Nested view naming using :: was detected.', 'Views API') : result('no', 'No nested view naming using :: was detected.', 'Views API');
    if (item.indexOf('emojis in your views') >= 0) return viewTitles.some(function (title) { return /[^\u0000-\u007f]/.test(title); }) ? result('yes', 'Non-ASCII visual markers were detected in view titles.', 'Views API') : result('no', 'No visual markers were detected in view titles.', 'Views API');
    if (item.indexOf('specific views for management/agents') >= 0) return viewTitles.some(function (title) { return /manager|management|supervisor|admin/i.test(title); }) && viewTitles.some(function (title) { return /agent|team|queue/i.test(title); }) ? result('yes', 'Management and agent/team view naming patterns were detected.', 'Views API') : result('manual', 'View audience cannot be confirmed from naming alone.', 'Views API');
    if (item.indexOf('play button') >= 0) return views.some(function (view) { return view.play_only === true; }) ? result('yes', 'A play-only view was detected.', 'Views API') : result('manual', 'The API response does not reliably prove day-to-day Play Button use.', 'Manual verification');
    if (item.indexOf('most important ticket at the top') >= 0) return views.some(function (view) { return /priority|sla/.test(deepText(view)) && /asc|desc/.test(deepText(view)); }) ? result('yes', 'Priority/SLA sorting evidence was detected in a view.', 'Views API') : result('manual', 'View sort intent needs a consultant review.', 'Views API');
    if (item.indexOf('custom views') >= 0) return views.length ? result('yes', views.length + ' active/custom view records were returned.', 'Views API') : result('no', 'No views were returned.', 'Views API');
    if (item.indexOf('guided mode') >= 0) return getPath(settings, 'agents.focus_mode') === true || getPath(settings, 'agents.focus_mode_enabled') === true ? result('yes', 'Focus/guided mode is enabled.', 'Account Settings API') : result('no', 'Focus/guided mode is not enabled.', 'Account Settings API');
    if (item.indexOf('phone connected') >= 0) return channelEvidence.voice ? result('yes', 'Voice ticket traffic was observed in the report window.', 'Incremental Tickets API') : activeFeatures.voice === true ? result('manual', 'Voice entitlement is enabled, but no recent voice traffic was observed to prove the channel is connected.', 'Account Settings API and manual verification') : result('no', 'No voice enablement or recent voice tickets were detected.', 'Account Settings and Tickets APIs');
    if (item.indexOf('email connected') >= 0) return recipients.length || (ticketsByChannel.email_web && ticketsByChannel.email_web.ticketsCreated) ? result('yes', recipients.length + ' recipient address(es) and recent email/web tickets were detected.', 'Recipient Addresses and Tickets APIs') : result('no', 'No inbound address or recent email/web tickets were detected.', 'Recipient Addresses and Tickets APIs');
    if (item.indexOf('messaging connected') >= 0) return ticketsByChannel.messaging && ticketsByChannel.messaging.ticketsCreated ? result('yes', ticketsByChannel.messaging.ticketsCreated + ' messaging ticket(s) were observed in the report window.', 'Tickets API') : anyTruthy(settings.messaging) ? result('yes', 'Messaging settings are active.', 'Account Settings API') : result('no', 'No messaging use was detected.', 'Account Settings and Tickets APIs');
    if (item.indexOf('whatsapp connected') >= 0) return channelEvidence.whatsapp ? result('yes', 'WhatsApp ticket traffic was observed.', 'Tickets API') : result('manual', 'No WhatsApp traffic was observed; verify the channel setup directly.', 'Tickets API');
    if (item.indexOf('social media messaging') >= 0) return channelEvidence.social ? result('yes', 'Social messaging traffic was observed.', 'Tickets API') : result('manual', 'No social messaging traffic was observed; verify channel setup directly.', 'Tickets API');
    if (item.indexOf('google reviews create') >= 0 || item.indexOf('app reviews create') >= 0) return result('manual', 'Channel-framework tickets can be detected, but the originating review integration needs confirmation.', 'Manual verification');
    if (item.indexOf('using the sdk') >= 0) return channelEvidence.sdk ? result('yes', 'SDK-originated ticket traffic was observed.', 'Tickets API') : result('manual', 'No recent SDK-originated ticket was observed.', 'Tickets API');
    if (item.indexOf('custom email addresses') >= 0) {
      var verified = recipients.filter(function (address) { return /verified|valid|pass/.test(lower(address.spf_status || address.cname_status || address.domain_verification_status)); });
      return verified.length ? result('yes', verified.length + ' recipient address(es) expose a passing verification status.', 'Recipient Addresses API') : result('manual', recipients.length + ' recipient address(es) are configured, but the returned data did not prove SPF/DNS/TXT health.', 'Recipient Addresses API and DNS verification');
    }
    if (item.indexOf('basic bot') >= 0) return result('manual', 'Bot flow configuration is not fully exposed by the standard Support APIs.', 'Manual verification');
    if (item.indexOf('advanced ai agent') >= 0) return result('manual', anyTruthy(settings.ai) ? 'AI-related settings are active, but they do not prove an Advanced AI Agent is deployed on a live channel.' : 'No reliable deployed AI Agent signal was returned.', 'Account Settings API and manual verification');
    if (item.indexOf('done training') >= 0 || item.indexOf('admins signed up') >= 0) return result('manual', 'This is a people/process question and requires confirmation.', 'Manual verification');
    if (item.indexOf('light agents') >= 0) {
      var light = agents.filter(function (agent) { return Number(agent.role_type) === 1; });
      return light.length ? result('yes', light.length + ' light agent(s) were detected.', 'Users API') : result('no', 'No light agents were detected.', 'Users API');
    }
    if (item.indexOf('custom-build crm zaf') >= 0) return result('manual', /crm/.test(deepText(extra.appInstallations)) ? 'An installed app has CRM-related naming, but metadata cannot prove it is a custom-built ZAF CRM.' : 'Installed app metadata does not identify a custom-built CRM integration.', 'App Installations API and implementation review');
    if (item.indexOf('notification triggers customised') >= 0) return result('manual', /ticket\.id|ticket\.title|ticket\.url|current_user\.name|sla/.test(rulesText) ? 'Notification-rule placeholders were detected, but the exact customer-facing wording and SLA expectation must be reviewed.' : 'Notification wording needs a content review.', 'Triggers API and content review');
    if (item.indexOf('inside and outside of business hours') >= 0) return triggers.concat(automations).some(function (rule) { return /within_business_hours|outside_business_hours|business hours/.test(deepText(rule)); }) ? result('yes', 'A single rule contains a business-hours condition.', 'Triggers and Automations APIs') : result('no', 'No rule contained a business-hours condition.', 'Triggers and Automations APIs');
    if (item.indexOf('toolbar color') >= 0) return getPath(settings, 'branding.header_color') ? result('yes', 'A toolbar/header colour is configured.', 'Account Settings API') : result('no', 'No toolbar/header colour was returned.', 'Account Settings API');
    if (item.indexOf('all the licenses') >= 0) {
      return result('manual', 'Active seats are counted by licence type and Zendesk/custom role. Inactive-user analysis is intentionally excluded from this report.', 'Users API and manual commercial review');
    }
    if (item.indexOf('qa process') >= 0 || item.indexOf('automatic qiality') >= 0) return result('manual', 'QA product entitlement does not prove an active operational QA process.', 'Manual verification');
    if (item.indexOf('intent, sentiment') >= 0) return result('manual', /intent/.test(fieldText) && /sentiment/.test(fieldText) && /language/.test(fieldText) ? 'Intent, sentiment, and language fields were detected, but field presence does not prove active mapping and reporting.' : 'The standard fields do not prove that all three signals are actively mapped.', 'Ticket Fields API and workflow review');
    if (item.indexOf('macro suggestions') >= 0 || item.indexOf('suggesting respondses') >= 0) return result('manual', 'Copilot feature configuration requires product-specific verification.', 'Manual verification');
    if (item.indexOf('workforce management') >= 0) return result('manual', /workforce|wfm/.test(deepText(extra.appInstallations).concat(' ', deepText(settings))) ? 'WFM-related settings or an installation were detected, but active operational use cannot be proven from installation metadata.' : 'No reliable WFM deployment signal was returned.', 'Account Settings and Apps APIs plus usage review');
    if (item.indexOf('single sign-on') >= 0) return extra.securitySettings ? (anyTruthy(extra.securitySettings.sso || extra.securitySettings.saml || extra.securitySettings.jwt) ? result('yes', 'SSO configuration was detected.', 'Security Settings API') : result('no', 'No SSO configuration was detected.', 'Security Settings API')) : result('manual', 'Security Settings API evidence was not available.', 'Manual verification');
    if (item.indexOf('schedule(s)') >= 0) return schedules.length ? result('yes', schedules.length + ' business-hours schedule(s) were detected.', 'Business Hours API') : result('no', 'No business-hours schedule was detected.', 'Business Hours API');
    if (item.indexOf('make use of macros') >= 0) return macros.length ? result('yes', macros.length + ' macro record(s) were detected.', 'Macros API') : result('no', 'No macros were detected.', 'Macros API');
    if (item.indexOf('triggers classified') >= 0) return triggerCategories.length ? result('yes', triggerCategories.length + ' trigger categor' + (triggerCategories.length === 1 ? 'y' : 'ies') + ' detected.', 'Trigger Categories API') : result('no', 'No trigger categories were detected.', 'Trigger Categories API');
    if (item.indexOf('custom html header') >= 0) return /html|header|footer|template/.test(deepText(settings.email)) ? result('yes', 'Custom email template/header/footer settings were returned.', 'Account Settings API') : result('manual', 'Email branding requires template review.', 'Manual verification');
    if (item.indexOf('automatic agent signatures') >= 0) {
      var signatures = agents.filter(function (agent) { return text(agent.signature).trim(); });
      return signatures.length ? result('yes', signatures.length + ' agent(s) have signatures.', 'Users API') : result('no', 'No agent signatures were detected.', 'Users API');
    }
    if (item.indexOf("sla's been set up") >= 0) return slas.length ? result('yes', slas.length + ' SLA polic' + (slas.length === 1 ? 'y' : 'ies') + ' detected.', 'SLA Policies API') : result('no', 'No SLA policies were detected.', 'SLA Policies API');
    if (item.indexOf("escalation automations for sla") >= 0) return /sla|breach/.test(rulesText) && /notify|email|group|assignee/.test(rulesText) ? result('yes', 'SLA escalation rule evidence was detected.', 'Triggers and Automations APIs') : result('no', 'No SLA escalation rule evidence was detected.', 'Triggers and Automations APIs');
    if (item.indexOf('side-conversations') >= 0) return anyTruthy(settings.side_conversations) ? result('yes', 'Side Conversations settings are active.', 'Account Settings API') : result('no', 'Side Conversations are not active.', 'Account Settings API');
    if (item.indexOf('custom agent roles') >= 0) return arr(extra.customRoles).length ? result('yes', arr(extra.customRoles).length + ' custom role(s) were detected.', 'Custom Roles API') : result('no', 'No custom agent roles were detected.', 'Custom Roles API');
    if (item.indexOf('capturing csat on all channels') >= 0) {
      var emailRated = ticketsByChannel.email_web && ticketsByChannel.email_web.ratedTickets || 0;
      var messagingSeen = ticketsByChannel.messaging && ticketsByChannel.messaging.ticketsCreated || 0;
      var messagingRated = ticketsByChannel.messaging && ticketsByChannel.messaging.ratedTickets || 0;
      if (!activeFeatures.customer_satisfaction && !activeFeatures.customer_satisfaction_survey) return result('no', 'CSAT is not enabled.', 'Account Settings API');
      if (messagingSeen && !messagingRated) return result('manual', 'CSAT is enabled, but no rated Messaging tickets were observed in the sample; Email/Web has ' + emailRated + ' rated ticket(s). This does not prove survey configuration is absent.', 'Account Settings and Incremental Tickets APIs');
      return result('yes', 'CSAT is enabled and rating evidence was observed for active report channels.', 'Account Settings and Tickets APIs');
    }
    if (item.indexOf('capturing contact drivers') >= 0) return result('manual', /contact driver|contact reason|reason for contact|issue type|inquiry type/.test(fieldText) ? 'A contact-driver style field was detected, but field presence alone does not prove agents populate it consistently.' : 'No clearly named contact-driver field was found.', 'Ticket Fields API and data-quality review');
    if (item.indexOf('reporting on contact drivers') >= 0) return result('manual', 'Explore dashboard contents and schedules are not available through the standard Support API.', 'Manual verification');
    if (item.indexOf('tracking/monitoring kpio') >= 0) return result('manual', operational.dataCoverage && operational.dataCoverage.metricSets ? 'This report calculated first reply, full resolution, and requester wait metrics from ' + operational.dataCoverage.metricSets + ' in-window metric sets, but it cannot prove the client was already monitoring them.' : 'No ticket metric sets were available for the report window.', 'Incremental Tickets API and reporting-process review');
    if (item.indexOf('exporting reports automatically') >= 0) return result('manual', 'Explore delivery schedules are not exposed by the standard Support API.', 'Manual verification');
    if (item.indexOf('systems requests') >= 0) return result('manual', /system request|systems request|technical request|incident category/.test(fieldText) ? 'A systems-request style field was detected, but field presence does not prove consistent capture or reporting.' : 'No clearly named systems-request field was detected.', 'Ticket Fields API and reporting-process review');
    if (item.indexOf('time-tracking app') >= 0) return /time.?track/.test(deepText(extra.appInstallations)) ? result('yes', 'A time-tracking app installation was detected.', 'App Installations API') : result('no', 'No time-tracking app installation was detected.', 'App Installations API');
    return result('manual', 'This question needs consultant confirmation.', 'Manual verification');
  }

  function scorecardAssessment(context, overrides) {
    context = context || {};
    overrides = overrides || {};
    var assessed = SCORECARD.map(function (row) {
      var detected = detectScorecard(row, context), override = overrides[row.id];
      var status = override === 'yes' || override === 'no' || override === 'na' ? override : detected.status;
      return Object.assign({}, row, detected, {
        detectedStatus: detected.status,
        status: status,
        overridden: Boolean(override === 'yes' || override === 'no' || override === 'na')
      });
    });
    var totalPoints = assessed.reduce(function (sum, row) { return sum + row.weight; }, 0);
    var achievedPoints = assessed.filter(function (row) { return row.status === 'yes'; }).reduce(function (sum, row) { return sum + row.weight; }, 0);
    var failedPoints = assessed.filter(function (row) { return row.status === 'no'; }).reduce(function (sum, row) { return sum + row.weight; }, 0);
    var excludedPoints = assessed.filter(function (row) { return row.status === 'na'; }).reduce(function (sum, row) { return sum + row.weight; }, 0);
    var assessedPoints = achievedPoints + failedPoints;
    function breakdown(key) {
      var grouped = {};
      assessed.forEach(function (row) {
        var name = row[key];
        if (!grouped[name]) grouped[name] = { name: name, score: 0, outOf: 0, assessed: 0, yes: 0, no: 0, manual: 0 };
        grouped[name].outOf += row.weight;
        if (row.status === 'yes') { grouped[name].score += row.weight; grouped[name].assessed += row.weight; grouped[name].yes += 1; }
        else if (row.status === 'no') { grouped[name].assessed += row.weight; grouped[name].no += 1; }
        else if (row.status === 'manual' || row.status === 'unavailable') grouped[name].manual += 1;
      });
      return Object.keys(grouped).map(function (name) {
        var item = grouped[name];
        item.percentOfTotal = percent(item.score, item.outOf);
        item.percentWithinAssessed = percent(item.score, item.assessed);
        return item;
      });
    }
    return {
      rows: assessed,
      totalPoints: totalPoints,
      achievedPoints: achievedPoints,
      failedPoints: failedPoints,
      assessedPoints: assessedPoints,
      excludedPoints: excludedPoints,
      achievedPercentOfTotal: percent(achievedPoints, totalPoints - excludedPoints),
      scoreWithinAssessed: percent(achievedPoints, assessedPoints),
      automationCoveragePercent: percent(assessedPoints, totalPoints - excludedPoints),
      manualQuestionCount: assessed.filter(function (row) { return row.status === 'manual' || row.status === 'unavailable'; }).length,
      byCategory: breakdown('category'),
      byPhase: breakdown('phase')
    };
  }

  function channelEvidence(tickets) {
    var evidence = { voice: false, whatsapp: false, social: false, sdk: false };
    arr(tickets).forEach(function (ticket) {
      var channel = lower(ticket && ticket.via && ticket.via.channel);
      if (/voice|phone|call/.test(channel)) evidence.voice = true;
      if (/whatsapp/.test(channel)) evidence.whatsapp = true;
      if (/facebook|instagram|twitter|x_channel/.test(channel)) evidence.social = true;
      if (/sdk|mobile/.test(channel)) evidence.sdk = true;
    });
    return evidence;
  }

  function buildReport(input) {
    input = input || {};
    var operational = aggregateOperational(input, { months: input.months || 12, now: input.now });
    var extra = Object.assign({}, input.extra || {}, {
      guideThemes: arr(input.guideThemes),
      customRoles: arr(input.customRoles),
      appInstallations: arr(input.appInstallations),
      securitySettings: input.securitySettings || null,
      agentUsage: input.agentUsage || {},
      channelEvidence: channelEvidence(input.tickets)
    });
    var scorecard = scorecardAssessment({
      config: input.config || {},
      operational: operational,
      accountSettings: input.accountSettings || {},
      extra: extra
    }, input.manualAnswers || {});
    return {
      version: 'health-v1',
      generatedAt: input.now ? new Date(input.now).toISOString() : new Date().toISOString(),
      periodMonths: input.months || 12,
      operational: operational,
      adminSignals: {
        topMacros: arr(input.config && input.config.macros).map(function (macro) {
          return { id: macro && macro.id, title: text(macro && (macro.title || macro.name)) || 'Untitled macro', usage30d: finite(macro && macro.usage_30d) || 0, active: macro && macro.active !== false };
        }).sort(function (a, b) { return b.usage30d - a.usage30d; }).slice(0, 10)
      },
      scorecard: scorecard,
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
