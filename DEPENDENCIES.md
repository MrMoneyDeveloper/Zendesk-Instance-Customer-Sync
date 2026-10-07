# Configuration Sync + Account Health — Dependencies and Configuration

Companion to [HANDOVER.md](HANDOVER.md). Based on repository documentation and configuration/source inspected on 7 October 2026; the live deployment must be reconciled before sign-off. Package manifests and lockfiles remain authoritative for exact transitive versions; this is the operational dependency list, not a frozen software bill of materials.

| Dependency | Required setup / configuration | Source or handover action |
| --- | --- | --- |
| Runtime/build | Node.js >=22; npm; React/TypeScript and Express | package.json and package-lock.json; README production setup |
| Encryption | CXE_ENCRYPTION_KEY, CXE_ENCRYPTION_KEY_ID | Host secret manager; planned decrypt/re-encrypt migration is required before retiring an encryption key. |
| Session and signed app | SESSION_SECRET; ZENDESK_APP_PUBLIC_KEY; ZENDESK_APP_AUDIENCE; ZENDESK_EXPECTED_ISSUER; ZENDESK_FRAME_ANCESTORS | Configure from the actual Zendesk installation. Public key/audience/issuer are configuration, not secrets to rotate indiscriminately. |
| Client connections | Per-client API tokens or OAuth bearer tokens; client custom object and cxe_zd_sync_connection access | Reauthorize/reconnect every affected client. Test replacement credentials before replacing an envelope. |
| Hosting | APP_URL, PORT; DEMO_MODE=false in production | Transfer host, domain, app installation, release pipeline and secret-manager access. |

## API and OAuth completion requirements

For **every enabled API/OAuth integration**, record its accountable owner, provider/project, credential name, scopes, secret-store location, endpoint/redirect URI, expiry/renewal behavior and dependent consumers in the private operations register. Rotate/reissue all applicable keys, client secrets, tokens, grants and deployment credentials; configure each consumer; test the new identity; then revoke the superseded credentials. See the ordered procedure in [HANDOVER.md](HANDOVER.md).

Never put secret values in this file. If the live environment has additional integrations, add their non-secret dependency details before handover sign-off. Items absent from inspected source are unverified, not automatically unnecessary. This documentation update does not perform credential rotation or modify runtime settings.
