# Security notes

## Credential storage

Client API tokens are submitted from the administrator-only app UI directly to the Zendesk Integration Services Basic Authentication Connections API. Existing Zendesk OAuth access tokens use the Bearer Token Connections API. Both use the signed-in PDI Zendesk session; Zendesk stores and redacts the credential in subsequent responses.

The `cxe_zd_sync_connection` record stores the client id, exact Zendesk hostname, authentication type, optional API integration email, status metadata, and the ZIS connection name. It stores neither API nor OAuth tokens. There is no vault passphrase, client-side encryption key, app installation secret, or external relay secret.

## Request boundary

Each ZIS credential has `allowed_domain` set to the exact client hostname. The app accepts only HTTPS `*.zendesk.com` hosts and rejects pagination URLs whose hostname differs from the configured client. ZIS sends the Basic Authorization header only to the allowed hostname.

The API surface is a fixed read-only allowlist. The app does not accept arbitrary paths from users. Health reporting reads ticket metadata, channel, satisfaction status, and metric sets from Zendesk's incremental tickets API, but does not read ticket bodies/descriptions, comments, audits, or requester profiles.

## Temporary data

A sync or health report uses short-lived `cxe_zd_sync_job` records and ZIS configs as a Zendesk-hosted request/result channel. The app deletes both after success or failure. Configuration and raw ticket-level inputs remain in the current browser session and are not persisted as snapshots. The connection record stores only timestamps, status/error metadata, and consultant-entered scorecard overrides.

## Access control

Restrict the private app to authorised CX Experts administrators. Only Zendesk admins can register ZIS integrations or create and manage ZIS connections. Rotate any exposed API or OAuth token immediately, then use **Replace credential** in the app.

Zendesk does not provide a delete operation for a registered ZIS integration. To stop it, uninstall its JobSpec and remove its connections/resources through the ZIS APIs. Removing a client in the app deletes that client's ZIS connection and metadata record without deleting the Client record.
