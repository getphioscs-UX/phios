# Deployment repair and FW production successor

Status: **IMPLEMENTATION_IN_PROGRESS — not full FW-S1–FW-S10 acceptance**.

## Baseline and deployment repair

- Actual starting HEAD: `df24926beafd0a7777df1254c3fdfccc0844ec0a`, branch `main`, clean. The attachment's `d9e727d` is historical authority, not the current checkout.
- Supplied failed build compiled its Worker successfully, then rejected `bazi-en.pdf` at 44.1 MiB. This was a static asset limit failure, not an authentication or Worker compilation failure.
- Re-encoded embedded PDF raster images; preserved all page text, geometry and 36 pages per language. English: 7,018,314 bytes; Chinese: 7,867,011 bytes. Both remain at the existing review URLs.
- `check:pages-build` now also checks every tracked static deployment asset against the 25 MiB limit. This closes the previous gap where a Worker-only build could pass while static upload failed.
- PDF verification rendered all 72 pages and checked A4, dynamic folios and internal identifier leakage. Representative new contact sheets were visually inspected; this is not a claim of human acceptance of all pages.

## FW results

| Stage | Current result |
| --- | --- |
| FW-S1 | Persisted DAR Person Role v2, ephemeral finalization contract and three RDG person-reference contracts added. Policy tests pass. v1 and testamentary security unchanged. Production consumer cutover is not yet installed. |
| FW-S2 | Not complete. Existing testamentary subset remains; full specialized schema/UI/assembly/private-render round trip is pending. |
| FW-S3 | Not complete. Existing inventory/FCR/FAR/HFP integration remains. Full revisions, scenarios and remaining field coverage are pending. |
| FW-S4 | OIDC account bridge and login controls implemented. Added account-isolated AES-GCM Financial/Will working-draft API with explicit save/retention consent, version checks, restore and withdrawal. People storage, draft customer UI, canonical consent/retention-owner integration and scheduled expiry deletion remain pending. |
| FW-S5 | Not complete. Canonical persistent FDR→DAR lineage and versioned reverse sync remain pending. |
| FW-S6 | Not complete. Existing PFR human authority gate remains closed. No eligibility or signatures invented. |
| FW-S7 | Not complete. Existing Commerce/entitlement and RR release gates remain. |
| FW-S8 | Not complete. Account identity entry is installed; People/Drafts/Reports/private PDF/Ask integration still pending. |
| FW-S9 | New privacy and signed OIDC tests; local HTTPS browser authentication matrix covers both languages at 1440/390, sign-in, refresh, HttpOnly cookie and sign-out. Full Financial/Will/People fixture and browser matrix remains pending. |
| FW-S10 | Not run. No preview/production deployment, remote migration or live account login acceptance has been claimed. |

## Authentication configuration and migration

The owner reports Auth0 secrets configured. Public discovery was directly checked on 2026-09-21:

- Production `https://auth.getphios.com/`: HTTP 200; exact issuer match; discovered authorization, token, JWKS and logout endpoints on the configured issuer origin.
- Preview `https://dev-2g55joboofph0ax7.us.auth0.com/`: same checks pass.
- No Auth0 canonical domain is hardcoded in runtime code. Provider tokens and claims remain server-side. There is no password table or browser identity authority.
- Authentication does not grant purpose consent, retention, PFR permission, professional eligibility or paid entitlement. Existing CKA privacy/entitlement gates remain closed.
- Migration `0007_account_oidc_sessions.sql` adds only provider-subject mapping and hashed session records under existing `users`. Existing migrations 0001–0006 are unchanged. Runtime migration registry and current migration inventory assertions include 0007.
- Local SQLite migration ordering/checksums/idempotence and foreign-key-aware identity operations are tested. Remote D1 state is **NOT_VERIFIED**.
- Session cookies use AES-GCM through JOSE, `Secure`, `HttpOnly`, `SameSite=Lax`, `__Host-` scope. Keys are separated by purpose, issuer, client and origin. DB revocation, user deletion and expiry deny access. Auth0 back-channel logout is not implemented in this checkpoint.

## Owner configuration checklist

Existing configured names consumed by code:

```text
AUTH_PROVIDER=auth0
AUTH_ISSUER
AUTH_CLIENT_ID
AUTH_CLIENT_SECRET
AUTH_SESSION_SECRET
RUNTIME_DB
```

`AUTH_SESSION_SECRET` must be independent per environment, randomly generated and at least 32 characters. Do not print or commit values.

Optional `AUTH_CALLBACK_URL` must exactly equal the current application origin plus `/api/auth/callback`. Without it, code derives that URL from the request origin. Register these provider-console URLs:

- Production callback: `https://getphios.com/api/auth/callback`
- Production post-logout: `https://getphios.com/account/`
- Preview: the explicitly selected stable Preview origin with the same paths. Do not substitute the production issuer or client in Preview.

The attachment assigns external configuration and D1 application to the owner. Review the migration, backup/recovery point and bindings, then apply to Preview before production:

```powershell
npx wrangler d1 migrations list RUNTIME_DB --remote --env preview
npx wrangler d1 migrations apply RUNTIME_DB --remote --env preview
# Only after Preview acceptance and production binding verification:
npx wrangler d1 migrations list RUNTIME_DB --remote
npx wrangler d1 migrations apply RUNTIME_DB --remote
```

No command above has been executed against remote D1 by this implementation. Login remains unavailable until the new tables exist. Keep old tables on code rollback; do not delete user mappings to resolve a deployment problem. Restore the prior application version, revoke new sessions if required, and use the database recovery procedure for data rollback. Expired session rows may be removed by an owner-approved retention job; automated cleanup is not yet installed.

The owner confirmed `FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY` (encrypted Secret) and `PRIVATE_REPORTS` (private R2 binding) in Production and Preview/QA, with an independent Preview secret and sandbox bucket. Implementation and local acceptance checks use exactly these names. No deployment secret values were requested, printed, logged, persisted or committed. Configuration confirmation is owner-provided; live environment acceptance has not been performed.

## Private binding implementation follow-up

- `functions/account/financial-will-draft-store.js` consumes `FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY` only at runtime for AES-256-GCM. Supported encodings are a 32-byte base64/base64url value, 64 hexadecimal characters, or exactly 32 UTF-8 bytes; no key material is returned. Key rotation is not implemented in this checkpoint.
- `/api/account-financial-will-drafts` requires verified server account context, same-origin writes, explicit save and retention consent, an explicit purpose and a future expiry no longer than 366 days. The working-intake schema preserves unknown/range/declined values and rejects structured full identity-number fields. This is not canonical FDR/DAR authority.
- Migration `0008_financial_will_encrypted_drafts.sql` adds encrypted immutable versions and metadata-only withdrawal/deletion records. The migration registry and current inventory checks include 0008. Remote application has not been performed; apply through the same owner migration procedure above.
- AES-GCM authenticated data binds account, draft type, draft ID, schema, version and expiry. Stale writes and cross-account access are denied. Expired drafts cannot be read. Withdrawal deletes all versions unless a legal hold requires review. Automated physical expiry cleanup and governed consent/retention records remain pending.
- `functions/account/private-report-delivery.js` consumes only `PRIVATE_REPORTS`; it reuses existing RR release checks and DAR short-lived download grants. Each request rechecks owner, active release and consent, then verifies the retrieved bytes against the bound PDF digest. Responses are private/no-store and do not expose a permanent object URL.
- This private-delivery adapter is **not yet wired to a public API or a trusted persisted RR material loader**. Customer private PDF delivery is therefore not accepted or advertised as available.
- `private-bindings-evidence.json` records synthetic local tests using an in-memory SQLite database and a fake private R2 binding. Production/Preview resources and their actual secret values are never accessed by these tests. Draft customer UI and full live save/reload/download journeys remain pending.
- Follow-up implementation is included in `f9d299fc` (`financial & R2`). The complete `npm run check` lifecycle, including precheck and postcheck, exited 0. Final Pages compilation exited 0 (Worker 6,415,087 bytes; gzip 1,301,857 bytes). `private-bindings-checks.json` and the adjacent logs record these results separately from the earlier authentication checkpoint.

## Evidence and remaining acceptance

- `s1-evidence.json`: privacy contract/policy tests, frozen v1 SHA256.
- `auth-evidence.json`: actual RSA signed synthetic-provider tests, two issuer origins, pending verification, wrong audience/issuer/nonce, expired/tampered/revoked sessions, deleted users, CSRF and account isolation.
- `auth-browser-evidence.json`: local HTTPS actual auth handlers; external provider synthetic; unrelated Account APIs deliberately unavailable, not accepted.
- `checks.json`: final repository/build results for this checkpoint.
- Original Financial fixture coverage remains the previous partial set; no claim of all 22 Financial, 19 Will and shared People cases.
- Native print dialog: **HUMAN_REQUIRED**. Rockwills: **NOT_RUN**.
- Production deployment URL targeted by attachment: `https://getphios.com`; new code's deployed SHA and E2E status: **NOT_VERIFIED**.

Remaining work includes substantial repository implementation as well as external and human gates. The entire attachment is not blocked solely on owner configuration. Do not mark it `CODE_COMPLETE` or `FINANCIAL_WILL_PRODUCTION_SUCCESSOR_ACCEPTED` at this checkpoint.

References: [Pages file limits](https://developers.cloudflare.com/pages/platform/limits/), [Auth0 issuer consistency](https://support.auth0.com/center/s/article/Auth0-sessions-not-terminating-when-logging-out-with-custom-domains).
