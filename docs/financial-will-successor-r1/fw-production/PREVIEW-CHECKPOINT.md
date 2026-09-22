# FW customer continuity and released private delivery

Continuation from main c50d336b; FW-S1–FW-S10 is not restarted.

## Remote migration evidence

Owner attachment 65b63a61-3338-4ad6-bd45-d6f0d514405c records remote `phios-runtime-sandbox`, environment `preview`: 0007 and 0008 applied successfully, final list says “No migrations to apply!”.

- PREVIEW_REMOTE_D1_0007_APPLIED = YES (owner-provided evidence).
- PREVIEW_REMOTE_D1_0008_APPLIED = YES (owner-provided evidence).
- No migration 0009 is introduced by this checkpoint.
- Production migration is NOT_APPLIED and remains blocked until deployed Preview E2E acceptance. No Production migration command is requested or executed.

## Persistence census and ownership

- RR `report-release-runtime.js` owns explicit release assertions and status transitions; it does not have its own durable repository.
- `runtime_artifacts` in existing migration 0002 can hold typed, owner-scoped metadata joined to `runtimes.user_id`. Existing symbolic-reading and narrative adapters already use this owner. It is sufficient; no new table is needed.
- The PWS universal registry stores professional/capability/product registry objects and lifecycle versions, not private customer report bytes. It is not repurposed as a customer report store.
- `account/released-report-material-store.js` is a typed adapter under existing runtime persistence. It consumes the existing RR assertion/transition and CPR customer PDF projection. It creates no separate release authority.
- D1 holds the requested export/material metadata plus opaque R2 material references and current consent authorization metadata. Canonical report JSON and PDF bytes reside only in private R2. No PDF bytes or report body are stored in D1.
- Server-only `persistTrustedReleasedReport` requires the governed signed/authorized report bundle, explicit RR release action and consent. There is no Production browser materialization or metadata-write endpoint. Existing RR/PFR owners must call this adapter after their gates pass; a payment entitlement is never consumed as release authority.
- `persistTrustedReleaseTransition` reuses RR transitions. `persistTrustedConsentState` stores updates supplied by the professional consent owner; all reads reload current consent. Revocation is effective for previously issued download grants.

## APIs and UI

- Financial, Will and Account consume only `/api/account-financial-will-drafts` for drafts. First save requires distinct save/retention choices; no autosave. Restore loads the server payload and never restores processing consent implicitly. Subsequent writes carry expectedVersion. Delete and withdrawal require confirmation.
- Continuity URLs carry only a draft identifier and type; reload/back re-fetch authenticated server data. No draft payload, grant or account identity is put into browser storage.
- `/api/account-reports`, `/api/account-report-download-grant` and `/api/account-report-download` accept only an opaque report ID. The latter two are same-origin POSTs. A 15-minute Secure/HttpOnly/SameSite cookie transports the grant; tokens never appear in query strings or response JSON.
- Each download revalidates server account ownership, the current release and consent, trusted material digest, export binding and actual PDF byte digest. R2 keys, consent, canonical report and release material cannot be submitted by the browser.
- Local fixtures are clearly marked synthetic QA material, not actual professional reports. They do not satisfy PFR or other production acceptance gates.
- The owner-requested live Preview fixture helper is restricted to the exact `https://qa.phios-github.pages.dev` origin, `PHIOS_ENVIRONMENT=qa`, an explicit Preview-only fixture flag, and a verified account. It accepts no report content or private material fields. Its fixed synthetic content is labelled QA in Account; it can only revoke QA fixtures owned by that account. Production rejects the endpoint and rejects QA material at the persistence boundary. The helper executes real deployed rendering, PRIVATE_REPORTS.put and D1 persistence so live infrastructure can be exercised without inventing an actual professional sign-off. It is capped at eight reports per account.

## Deployment mapping and drift

Actual Pages project: `phios-github`; existing stable Preview branch: `qa` (`https://qa.phios-github.pages.dev`). Wrangler name is reconciled with that project.

| Environment | Binding | Resource |
| --- | --- | --- |
| Production | RUNTIME_DB | phios-runtime-production / 073639fa-01e4-4868-af10-6ed032637dab |
| Production | MANUSCRIPTS | phios-private-manuscripts |
| Production | PRIVATE_REPORTS | phios-private-reports (owner-confirmed name) |
| Preview | RUNTIME_DB | phios-runtime-sandbox / c2c6e313-9bc8-4fd4-89b1-36f3d764dad8 |
| Preview | BOOKS | phios-private-books-sandbox (preserved) |
| Preview | MANUSCRIPTS | Intentionally absent; manuscript retrieval is disabled for this Preview checkpoint |
| Preview | PRIVATE_REPORTS | phios-private-reports-sandbox (owner-confirmed name) |

The only runtime manuscript consumer is `_lib/knowledge-access-api.js`. It now returns `disabled_in_preview` before reading any manuscript binding when PHIOS_ENVIRONMENT=qa and manuscript retrieval is not explicitly enabled. Public knowledge remains available. The older separate `getphios-qa` QA blueprint is not evidence that this Pages Preview can access production manuscripts. Wrangler may still warn about the intentionally absent non-inherited binding; no fake sandbox or production alias is added to suppress it.

Both encryption keys remain encrypted Cloudflare Secrets, absent from wrangler.jsonc. Initial read-only metadata on 2026-09-22 showed PRIVATE_REPORTS missing from both deployed configurations and only STRIPE_SECRET_KEY among Preview secret names. Owner-confirmed intended configuration is kept distinct from this observation; post-deployment reconciliation and actual Auth0/secret behavior must be verified before acceptance.

## Acceptance status

Local checks completed on 2026-09-22: targeted FW privacy/auth/private-binding/report-material checks, eight-migration checksum/order/idempotence checks, and Pages build (Worker gzip 1,981,691 bytes; all 14,674 tracked assets below 25 MiB). Actual local browser handlers passed en/zh-Hans at 1440/390 including consent, Financial and Will refresh restore, return navigation, optimistic version conflict, account cards, sign-out/sign-in, delete/withdraw and private download. These use synthetic OIDC, local SQLite and fake R2 and are explicitly NOT deployed Preview evidence.

`npm.cmd run check` completed with exit code 0, including precheck, main check and postcheck. The KAP maintenance successor records the narrowly scoped Preview manuscript isolation change; historical hashes and runtime freezes are preserved.

Repository work and local regression are tracked separately from DEPLOYED_PREVIEW_ACCEPTED. The latter remains false until actual Auth0 login, remote encrypted draft lifecycle, isolation, private report materialization/download/revocation and the bilingual 1440/390 browser matrix run against the stable deployed Preview.

FW-S2, FW-S3, FW-S5, FW-S6 and FW-S7 remain unresolved production work: specialized Will completeness/assembly, full Financial revisions/scenarios, canonical FDR–DAR persistent synchronization, professional eligibility/signatures and entitlement-to-governed-release integration. This checkpoint does not grant or fabricate those authorities. FINANCIAL_WILL_PRODUCTION_SUCCESSOR_ACCEPTED remains false.

References: https://developers.cloudflare.com/pages/functions/wrangler-configuration/ and the installed Wrangler 4.120.0 configuration schema.
