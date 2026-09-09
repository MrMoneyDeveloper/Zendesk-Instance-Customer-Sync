# CXE Zendesk Success Management

Private Zendesk Support navigation-bar app for configuration sync and client health reporting. The installable artifact is one ZIP. It requires no separately hosted API, database, relay, Render, Vercel, or Express process.

## Runtime architecture

The ZIP contains the React 18 production runtime, the application code, CSS, images, the ZAF SDK loader, and `manifest.json`. Node.js is used only to build, test, validate, and package the source project; Zendesk does not execute Node.js from an uploaded app ZIP.

At runtime:

1. The Support app uses the signed-in PDI administrator's ZAF session.
2. Setup / Repair registers the private `cxe_config_sync` integration in Zendesk Integration Services (ZIS), uploads its bundle, and installs its JobSpec.
3. Connect creates either a ZIS Basic Authentication connection for a Zendesk API email/token pair, or a ZIS Bearer Token connection for an existing Zendesk OAuth access token. In both cases `allowed_domain` is restricted to the exact client Zendesk hostname.
4. Zendesk redacts the token after submission. The app's connection record stores only the ZIS connection name and non-secret metadata.
5. A config sync or health report creates temporary job records and temporary ZIS configs. Each job causes a short ZIS flow to read one allowlisted Zendesk API page from the client instance.
6. The app polls the temporary result configs, validates pagination URLs, aggregates the result in the browser, and deletes the job records and configs.

This avoids browser CORS because the cross-instance HTTP request is executed inside Zendesk's hosted ZIS service, not by the iframe.

## Zendesk requirements

- Zendesk Suite Growth, Professional, or Enterprise, or Support Professional/Enterprise
- An administrator to run Setup / Repair and manage credentials
- API access enabled on each client Zendesk instance
- Either a client Zendesk API email and API token, or a Zendesk OAuth access token
- The existing PDI custom object with key `client`

The app provisions:

- `cxe_zd_sync_connection` for non-secret connection metadata
- `cxe_zd_sync_job` for short-lived sync requests
- A private ZIS integration, per-client redacted ZIS connections, a bundle, flow, and JobSpec

## Configuration sync

The app reads groups, views, agents, inbound channels, operating hours, custom objects and fields, ticket forms and fields, tags, custom statuses, SLA policies, automations, triggers and categories, macros, brands, user fields, organisation fields, and Help Centre categories, sections, and articles.

Configuration is held in the current browser session only; the app does not create configuration snapshots.

## Health Reports

The same saved client connection can produce a rolling 12-month report with:

- ticket volume split into Email/Web Form, Messaging, and Other
- first reply, full resolution, and requester wait times using Zendesk calendar-time ticket metrics
- satisfaction score and the percentage of solved tickets that were rated
- monthly created-versus-solved volume
- brand, group, and agent breakdowns
- unsolved, stale-unsolved, stale-pending, negative-CSAT, and suspended-ticket counts
- agent activity and configuration evidence
- active seats by licence type and active people by Zendesk/custom role for role-based pricing
- the supplied 61-question, 258-point capability scorecard

Questions that cannot be proved through Zendesk's public APIs remain **Manual review** rather than being scored as failures. Verified consultants can save Yes, No, or N/A overrides on the client connection record. The app creates three report packages: Operational Health, Capability Scorecard, and a Combined Executive Report. Each is downloadable as a styled PDF and CSV; sanitized source JSON and AI-ready Markdown are also available.

Failed or changed Zendesk sources are recorded as report/sync diagnostics with a timestamp, source path, available HTTP status, and a CXE reference ID. Partial reports retain these limitations in the screen, PDF, and CSV and direct the user to Farhaan / CX Experts Support at `support@cxexperts.co.za`.

The report reads ticket metadata, channel, satisfaction status, and ticket metric sets. It does not read comments, ticket bodies/descriptions, ticket audits, or requester profiles. Raw ticket-level data is used only during the browser session and is not persisted in PDI; only connection metadata, the last report timestamp, and manual scorecard answers are stored.

## Build and verify

From this directory with Node.js 20 or newer:

```powershell
npm ci
npm run build
npm test
npm run validate:local
npm run zendesk:validate
```

The official ZCLI package command is:

```powershell
npm run zendesk:package
```

## Install or update in PDI

Upload the packaged ZIP in **Admin Center → Apps and integrations → Apps → Zendesk Support apps**. For an existing installation, select the app and upload the new ZIP as an update. Restrict access to the intended CX Experts administrators.

After installation:

1. Open **CXE Zendesk Success Management** from the Support navigation bar.
2. Open **Setup / Repair** and run it once as an administrator.
3. Select a Client record.
4. Choose **Connect Zendesk**.
5. Choose **Zendesk API token** or **Zendesk OAuth access token**, then enter the exact `client.zendesk.com` hostname and the fields for that method.
6. The app creates the ZIS connection and tests `/api/v2/users/me.json` before it saves the connection record.
7. Choose **Run Health Report** for the operational and capability reports, or **Sync config** for the configuration-only workflow.

There are no app-installation settings and no hosting URL or shared secret to enter.

## Error behavior

- `401`: marks the credential invalid
- `403`: reports insufficient API permissions
- `429` and transient `5xx`: retries with bounded backoff before reporting a failure
- optional/unsupported endpoints: recorded per section without aborting the entire sync
- pagination: limited to 100 pages and rejected if Zendesk supplies a different host
- ZIS timeout: temporary jobs/results are cleaned up before the error is shown

## Project layout

- `src/` — React/ZAF application, ZIS bundle builder, and styles
- `zendesk-app/` — installable Zendesk app directory
- `scripts/` — build and local structural validation
- `tests/` — architecture, security-boundary, pagination, and manifest tests
- `dev/` — local ZAF test harness

See `SECURITY.md` for credential handling and trust boundaries.
