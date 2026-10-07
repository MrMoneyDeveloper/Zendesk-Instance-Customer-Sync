# Configuration Sync + Account Health — Technical Handover

Documentation review: 7 October 2026. Live deployment, secret inventory and transfer completion remain to be verified by the receiving owner.

## Scope and operational boundary

React/ZAF client plus stateless Express service. Zendesk stores encrypted connection envelopes. The service reads connected client configuration; OAuth bearer use exists, but the full authorization-code and refresh lifecycle remains a separate implementation task.

See [README.md](README.md) for the operator/developer guide and [DEPENDENCIES.md](DEPENDENCIES.md) for setup and integration requirements.

## Setup and release handover

Follow [.env.example](.env.example) and README production setup. Run `npm ci` and `npm run check`. Configure the receiving owner's host and signed-app values, then use the existing Zendesk create/update flow. Run Setup / Repair to validate object schemas. Inventory every encrypted client connection before rotating encryption material.

## Required credential and ownership transition

All API keys/tokens, OAuth client secrets and grants, service-account keys, webhook/shared secrets and deployment credentials actually used by this project must be inventoried, rotated or reissued under the receiving organization, configured and tested during handover. This document records requirements; it does not certify that rotation or ownership transfer has happened. Session-authenticated integrations require successor access and fresh authorization rather than an invented application secret. Public IDs, URLs and public keys are configuration, not confidential values.

1. Assign an accountable technical owner and backup. Record the live environment, release commit, host/project, deployment identity, billing owner, scheduled jobs and recovery contact in the private operations register.
2. Inventory every enabled integration, including fallback providers, CI/CD tokens, webhook senders and receivers. Record credential **names**, provider/project, scope, storage location and expiry; never record secret values in Git, screenshots or this document.
3. Grant successor access and preserve backups before changes. Create replacement credentials with the required least privilege and configure the company's secret store, backend environment or Apps Script Script Properties. Keep permanent credentials out of frontend bundles and Google Sheet cells.
4. For each OAuth integration in use, transfer/recreate the registered client under company ownership, confirm consent branding, scopes, authorized origins and exact redirect URIs; replace client secrets where applicable and obtain fresh grants under the receiving account. Test renewal if supported, or document expiry and reauthorization where it is not. Apps Script authorization must be renewed for the execution identity; inspect and recreate installable triggers under the receiving owner as needed.
5. Coordinate sender/receiver shared-secret changes and rebuild/redeploy consumers when configuration changes require it. Test in the correct sandbox or with a controlled non-destructive example before cutover. Do not rotate data-encryption keys by simply overwriting them: migrate protected data and retain recovery access until verified.
6. Verify the project-specific checks below and a scheduled cycle where applicable. Then revoke superseded keys/grants and departing-user access, confirm new access still works, and record non-secret evidence and completion date privately. If cutover fails, pause affected jobs and restore the last compatible deployment/configuration without restoring a compromised credential.

## Acceptance checklist

- [ ] Primary and backup owners accept the service, repository, hosting and billing responsibilities.
- [ ] Dependencies and actual live configuration reconciled with [DEPENDENCIES.md](DEPENDENCIES.md).
- [ ] All enabled API/OAuth/shared/deployment credentials replaced, configured and tested; inapplicable items marked with a reason.
- [ ] Source, data, configuration and recovery access are backed up; restore procedure checked.
- [ ] Successor can build/release and operate without the departing account.
- [ ] Old credentials/grants revoked after successful cutover; scheduled jobs observed where applicable.
- [ ] Outstanding issues, evidence and sign-off recorded in the private operations register.

## Project-specific verification

Test signed launch, successor session, one connection per authentication type in use, read-only sync/export, and rejected invalid credentials. Confirm all existing envelopes remain decryptable after key migration.

## Recovery and open risks

Do not overwrite or discard CXE_ENCRYPTION_KEY without migrating existing envelopes. Session-secret rotation logs users out. Do not claim automatic OAuth renewal until its callback, consent and renewal lifecycle is implemented and tested.
