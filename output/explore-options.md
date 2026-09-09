# Explore reporting: practical next steps

Research checked against Zendesk documentation on 8 September 2026. These are available Zendesk features and proposed extensions; no client export schedules, mailboxes, webhooks, or new services were configured during this research.

## Recommendation for Dave

The app can supply the configuration and directly reported counts that its connected account can verify. Response times, resolution times, requester wait time, satisfaction and rating percentages should remain marked **Explore dependent** until the original Explore reports supply them. Small ticket samples cannot stand in for those figures.

The most practical next phase is to have **each client's Explore instance email a small set of agreed report results to a shared CX reporting inbox**. Explore would continue doing the performance calculations. An additional inbox process could check the client and reporting period, read the attached results, and feed the approved figures into the health report. This would be a separate piece of work outside the current single-ZIP app. Manual CSV export and import is an alternative if the team prefers to keep the workflow inside the app without an unattended inbox service.

A small CSV can contain a figure calculated from every eligible ticket. The number of rows in that CSV is not the number of tickets used to calculate the result. Exporting the completed Explore measures is preferable to exporting millions of ticket rows and trying to reproduce Explore's calculations ourselves.

## Option 1 — Scheduled Explore report results to the CX inbox

Zendesk supports emailing reports by adding them to a dashboard and scheduling that dashboard. [Automatically emailing an Explore report](https://support.zendesk.com/hc/en-us/articles/5816082010010-How-do-I-automatically-email-my-Explore-report)

An Explore user with dashboard edit rights shares it, opens **Share → Schedule delivery**, chooses CSV and recipients, and sets the recurrence. CSVs are zipped by dashboard tab. Schedules can run for up to 12 months and need renewal; five consecutive export failures suspend them. Email attachments have a 25 MB limit, with oversized deliveries split across emails; a single export above 25 MB is not sent. Limited viewers/editors cannot receive scheduled dashboards. These requirements apply separately in each client's instance. [Scheduling dashboard deliveries](https://support.zendesk.com/hc/en-us/articles/4408843602714-Scheduling-dashboard-deliveries)

Enterprise supports end-user recipients. A shared reporting address can be represented by an end-user profile if the client enables **Scheduled dashboard deliveries to end users** in Explore's Sharing settings and adds the `explore` tag to that profile. Otherwise an eligible agent/admin recipient is needed. PDI's Enterprise entitlement does not establish the client's entitlement; confirm recipient availability on every client account. [End-user deliveries](https://support.zendesk.com/hc/en-us/articles/4408835716378-Scheduling-dashboard-deliveries-with-end-users)

Proposed rollout:

1. The success team agrees the existing report definitions, channel groups, dates, calendar/business hours and time zone.
2. An Explore editor/admin creates or checks the same compact report pack in one pilot client and tests an exported file against its dashboard.
3. CX sets up a shared inbox and a client-to-export register; every delivery must identify the client, metric, reporting period and source report.
4. A separate mailbox automation receives attachments, checks expected columns and dates, rejects duplicates or incomplete packs, and flags late/missing reports to CX support. It must preserve the actual exported values rather than averaging monthly medians or percentages.
5. Once the pilot matches Explore, the same setup is repeated for each participating client. This is proposed work, not a feature already installed in the app.

## Option 2 — Manual Explore CSV handoff

An editor can export the agreed report and supply its CSV for review/import. CSV exports contain report data without display formatting; date and metric formats do not carry over. Zendesk also warns that applied filters may not carry into a report export, so validate the actual exported date/channel population before treating it as approved. PDF/PNG exports can omit content hidden behind scrollbars. [Exporting dashboard tabs and reports](https://support.zendesk.com/hc/en-us/articles/4483481898266-Exporting-dashboard-tabs-and-reports)

This is the lowest-effort pilot for validating definitions. A future local file importer could keep processing in the Zendesk app; somebody would still export/download the files. The report must say when the evidence came from Explore and the period covered.

## Option 3 — Full dataset exports for deeper analysis

Explore admins can export unfiltered datasets, including **Support – Tickets** and **Chat and Messaging – Messaging tickets**, for up to the last 12 months. Dataset exports avoid the report-level 50,000-row limit. One-time export slots are limited; recurring exports may run daily, weekly or monthly, with a first run covering the past year and later runs covering the preceding interval. Up to 14 recurring exports are allowed. These exports produce email **download notifications**, not a guarantee of attached CSV delivery to any inbox. Only the creating admin and account owner receive notifications. Files expire after seven days and can be downloaded up to three times. [Dataset exports](https://support.zendesk.com/hc/en-us/articles/6037992005914-Exporting-datasets-from-Explore)

This is useful for a separate data-analysis project. It is more work than sending the completed Explore measures: storage, incremental changes, duplicate handling, full-population checks and definition reconciliation would all need design. It should not be promised as the immediate fix for these reports.

## Webhooks and direct Explore access

Zendesk webhooks send HTTP notifications when configured activity occurs, such as ticket creation. They require a receiving endpoint. They are not a supported way to ask Explore for an existing historical report, nor do they backfill a year's results. A webhook-based data store would be a separate ongoing integration with history and reconciliation work. [Zendesk webhooks](https://developer.zendesk.com/documentation/webhooks/)

No supported public Explore report-results endpoint was found in the current [Zendesk API reference](https://developer.zendesk.com/api-reference/). Zendesk's earlier official product response said it did not plan APIs for exporting Explore results; because that response dates to 2021, treat it as historical evidence rather than a current contractual guarantee. The current documented route is exports/deliveries. An undocumented browser endpoint should not be the basis of the promised client reporting solution. [Zendesk product response](https://community.zendesk.com/ideas/explore-api-1592)

## Wording for API counts in the current report

Use **“Zendesk Search count for the stated filters, retrieved at [time]”**, rather than “guaranteed total across the entire instance.” `search/count` returns the number matching the query without downloading the ticket rows; the normal 1,000-result listing limit is not a reason to label this count as a sample. Search can lag new data by a few minutes. Permissions, dates, channel mapping and successful query completion must be verified. [Search API](https://developer.zendesk.com/api-reference/ticketing/ticket-management/search/)

Search supports archived tickets. The ordinary List Tickets, List Ticket Metrics and Count Tickets endpoints have different archive behaviour, so do not substitute their totals or assume they cover the same population. [Zendesk archive guidance](https://support.zendesk.com/hc/en-us/articles/4408887617050-About-ticket-archiving), [Search includes archived tickets](https://support.zendesk.com/hc/en-us/articles/4408827565338-Admin-s-guide-to-the-Zendesk-API)

API and Explore figures can differ because of calculations, processing and refresh timing. The generic `tickets/count` endpoint is approximate. A successful API count is evidence of its stated query, not proof of equivalence to the supplied Explore report. If channel/date definitions have not been reconciled, label the result **API count; Explore reconciliation pending**, and exclude it from any claim of fully validated report coverage. [API versus Explore](https://support.zendesk.com/hc/en-us/articles/6037100273690-Why-do-I-see-a-difference-between-the-data-I-get-through-APIs-and-the-results-from-my-Explore-reports-and-dashboards)

Coverage percentages should count original requested items with fully supported evidence; they are completeness figures, not accuracy scores. Any unresolved criterion remains outstanding. Do not combine unrelated report percentages using an invented equal weighting.

## Current monthly-count implementation: accuracy decision

Inspection of `single-zip/src/app.js` found `via:mail via:web` for Email/Web and `via:native_messaging` for Messaging. Native Messaging does not encompass every messaging source: Zendesk lists separate sources for WhatsApp, LINE, WeChat, SMS, Instagram and others. Therefore the current second column must say **Native Messaging**, and cannot be promised as the original template's complete Messaging population without a definition check. [Via types](https://developer.zendesk.com/documentation/ticketing/reference-guides/via-types/)

The current month-window builder includes the current partial month and eleven preceding months, with date-only search boundaries constructed from UTC month starts. That is an implementation observation, not proof of the source report's intended period/time zone. Say **“12 displayed calendar months, including the current month to date”** if keeping that behaviour. Do not describe it as twelve complete months or an annual average.

Deletion policies also matter: Zendesk says most Explore reports exclude deleted tickets by default, while deletion-event and SLA data can be retained elsewhere. No current official source checked establishes that ordinary Search Count is an all-time deletion-inclusive ticket ledger. A deleted-ticket count should not be inferred or patched from the separate thirty-day Deleted Tickets endpoint. [Deleting tickets](https://support.zendesk.com/hc/en-us/articles/4408883872538-Deleting-tickets)

For the current source documents, the conservative coverage is **0 of 6 operational KPI families fully reconciled to the requested Explore definitions**. One family has unsampled, scoped API query results available as additional evidence. That evidence can be included with its precise title and filters, but does not justify calling the operational template 16.7% Explore validated. The earlier 16.7%/approximately 30% blended claim should be withdrawn until the original definitions and exported results are reconciled.
