# CX Experts Zendesk Configuration Sync

A private, read-only Zendesk Support app for connecting an existing CX Experts `client` record to that client's Zendesk instance, inspecting current configuration, and producing safe reusable exports.

The repository contains:

- an embedded React workbench served inside Zendesk's navigation bar;
- a stateless Express service for signed-session validation, credential encryption and client Zendesk API calls;
- a Zendesk `requirements.json` that provisions the app-owned `cxe_zd_sync_connection` object;
- a complete demo mode with representative configuration for UI and workflow validation.

## Run the demo

Requirements: Node.js 22 or newer.

```powershell
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:5173](http://localhost:5173). Demo mode is the default and never calls an external Zendesk account. It includes connected, unconnected, disabled, invalid and permission-issue clients, plus all 19 configuration sections.

Run verification with:

```powershell
npm.cmd run check
```

## Architecture

```text
CX Experts Zendesk
  ├── existing client custom object (authoritative registry)
  ├── cxe_zd_sync_connection (encrypted metadata only)
  └── iframe app / ZAF client
          │ signed initial request + short-lived session
          ▼
Stateless Node service
  ├── validates the Zendesk RS256 signed URL
  ├── tests API-token or OAuth credentials
  ├── encrypts/decrypts with AES-256-GCM
  ├── runs bounded read-only configuration requests
  └── returns current-session data; does not persist it
          │
          ▼
Client Zendesk APIs (GET only)
```

The browser reads and writes the main CX Experts Zendesk custom objects through the authenticated ZAF client. The service never needs a persistent credential for the CX Experts instance. The service receives an encrypted credential envelope only when it needs to test or sync a client.

## Security properties

- AES-256-GCM with a unique 96-bit nonce for every credential write.
- Additional authenticated data binds an envelope to its domain, email and authentication type.
- Encryption keys are supplied only through the service environment.
- Zendesk's RS256 signed initial URL is exchanged for a short-lived, HttpOnly, `SameSite=None` session cookie.
- Mutating service calls require a per-session CSRF value.
- Outbound destinations are restricted to HTTPS `*.zendesk.com` hosts, including pagination URLs.
- Retries are bounded; `Retry-After` is respected for HTTP 429 responses.
- Logs contain operation metadata and sanitised errors, never credentials or authorization headers.
- Sync endpoints contain only GET requests and no ticket, comment, requester, attachment or audit endpoints.
- Exports are built only from in-memory session results. Connection metadata and credential envelopes are not part of export payloads.

Demo keys are deterministic and intentionally unsafe. The service refuses to start in production mode without explicit key and signed-request configuration.

## Production configuration

Copy `.env.example` into your deployment platform's secret configuration. Do not commit `.env`.

Generate the two secrets separately:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Set:

| Variable | Purpose |
| --- | --- |
| `DEMO_MODE=false` | Enables signed Zendesk sessions and real client requests. |
| `CXE_ENCRYPTION_KEY` | Exactly 32 random bytes, Base64 encoded. |
| `CXE_ENCRYPTION_KEY_ID` | Stable identifier in the envelope, initially `key01`. |
| `SESSION_SECRET` | Independent high-entropy service session secret. |
| `ZENDESK_APP_PUBLIC_KEY` | PEM public key from the installed Zendesk app. |
| `ZENDESK_APP_AUDIENCE` | Installation URL used as the signed token audience. |
| `ZENDESK_EXPECTED_ISSUER` | CX Experts Zendesk hostname, for example `cxexperts.zendesk.com`. |

Keep encryption keys and session secrets in the hosting provider's secret manager. Key rotation requires a planned decrypt/re-encrypt migration because the connection records live in Zendesk while the key does not.

## Build and deploy

1. Build both deployable artifacts.

   ```powershell
   npm.cmd run build
   npm.cmd run build:server
   ```

2. Deploy the repository to an HTTPS Node host. The runtime command is `npm.cmd start`; `/health` is the health check.

3. Create an initial private app in the CX Experts Zendesk account and obtain its app public key. Configure the service's signed-request variables.

4. Package the Zendesk app for manual upload. The package keeps the service URL as an installation setting, so the Zendesk administrator enters the deployed HTTPS URL during installation.

   ```powershell
   npm.cmd run zendesk:package
   ```

   ZCLI writes the ZIP to `zendesk/tmp`. Upload that ZIP from **Admin Center → Apps and integrations → Zendesk Support apps → Upload private app**. Enter the deployed service URL for `service_url`, then apply the approved role/group restrictions.

   To package, upload and install directly with ZCLI instead, authenticate once and run:

   ```powershell
   npm.cmd run zendesk:login
   $env:APP_URL = 'https://your-config-sync-service.example.com'
   npm.cmd run zendesk:create
   ```

   `zendesk:create` validates, packages, uploads and installs the private app, and records its app id in the ignored `zendesk/zcli.apps.config.json` file. Subsequent releases use the same `APP_URL` with `npm.cmd run zendesk:update`.

5. Restrict the installed app to the approved admin, Customer Success and implementation roles/groups.

6. Open the app. The requirements file should create the connection object and fields. Use **Setup / Repair** to verify the existing `client` object, lookup target, field keys and record access.

Zendesk includes the signed token only on the initial app page POST. The service validates it and creates its own expiring browser session for subsequent API requests.

## Operational model

- Client discovery is always a live list of `custom_objects/client/records`.
- Connections are left-joined in memory using `cxe_client`.
- `cxe-config:{CLIENT_RECORD_ID}` is the deterministic external ID used by Zendesk's create-or-update endpoint.
- Replacement credentials do not overwrite the current envelope until the new credential passes its test.
- Disable retains the envelope; remove deletes only the connection record.
- Setup / Repair creates missing resources one at a time and never deletes or renames persisted schema.
- Full sync uses at most three concurrent section workers; section sync reads only the selected area.
- Optional 403/404 sections become warnings rather than failing an otherwise valid complete sync.

## Authentication roadmap

`ApiTokenProvider` and `OAuthProvider` share the same sync engine. OAuth bearer tokens work with the credential test and sync paths today. A complete OAuth authorization-code/refresh-token lifecycle is intentionally a follow-on deployment task because it requires client registration, redirect handling and refresh policy decisions for each connected Zendesk account. API-token authentication should be treated as legacy compatibility.

## Key files

- `src/App.tsx` — client browser, sync workspace, section viewer, exports and connection flows.
- `src/lib/dataSource.ts` — demo/ZAF data adapters and idempotent schema checks.
- `server/security.ts` — AES-256-GCM envelope implementation.
- `server/session.ts` — Zendesk signed-request and app-session validation.
- `server/syncEngine.ts` — read-only endpoints, pagination, retries and section isolation.
- `zendesk/requirements.json` — additive app-owned custom-object schema.
