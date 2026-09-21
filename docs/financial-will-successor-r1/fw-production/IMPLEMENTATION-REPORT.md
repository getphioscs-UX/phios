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
| FW-S4 | OIDC discovery, Authorization Code + PKCE, nonce/state/signature/issuer/audience/verified-email validation, server subject mapping and revocable encrypted session cookies implemented. Account login/register/logout controls added. People storage and encrypted Financial/Will drafts are not yet implemented. |
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

The owner confirmed `FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY` and private R2 binding `PRIVATE_REPORTS` in both environments, with independent Preview resources. Neither has been read, copied, renamed or claimed integrated. Do not send secret values. Private Will/report assets must never use the public visual-asset bucket.

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
