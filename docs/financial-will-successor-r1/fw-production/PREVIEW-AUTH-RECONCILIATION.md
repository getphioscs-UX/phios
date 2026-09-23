# Preview Auth0 reconciliation — 2026-09-23

Continuation from 30f60ae6. The owner supplied the public Preview provider, issuer, client ID and exact stable callback URL. These four values are now declared only in Wrangler env.preview.vars. AUTH_CLIENT_SECRET, AUTH_SESSION_SECRET and FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY remain external encrypted Secrets. No secret values are committed.

Production configuration, migrations and deployment are outside this change. Preview 0007/0008 remain applied; no new migration is introduced.

The initial deployment found duplicate bindings: the four public fields also existed as Dashboard Secrets. Only these four Preview entries were reconciled to plain_text with the owner's supplied values. The three actual encrypted Secrets were preserved. A before/after comparison confirmed Production deployment configuration unchanged.

Real Preview then exposed a workerd incompatibility: redirect:error is rejected before the provider request. This was reproduced in local workerd against the public QA discovery URL: error mode failed, manual mode returned 200. The existing authentication adapter now uses manual mode and rejects every non-2xx response without following redirects, including credential-bearing token requests. Safe error codes distinguish provider connectivity/JSON and transaction encryption failures without echoing provider payloads. OIDC regressions, Preview isolation/configuration checks and Pages build passed; new regression checks reject provider 302 responses.

Real stable Preview checks on 2026-09-23 returned providerConfigured:true and HTTP 302 to https://dev-2g55joboofph0ax7.us.auth0.com/authorize. The browser reached the actual PHI OS QA Auth0 login screen. No credential or authorization token was extracted or saved.

Deployed commit: `31f687ae29347c28a70218a6f07f6f4ba3db174b`. Deployment: https://042e7eb8.phios-github.pages.dev . Stable origin: https://qa.phios-github.pages.dev . HTTP evidence: [preview-auth-http-evidence.json](./preview-auth-http-evidence.json). Callback origin is intentionally the stable origin; random deployment hostnames are not login entry points.

The owner completed real Auth0 login on 2026-09-23. The same live browser displayed “已登录并验证”; refresh and a fresh Account navigation retained verified authentication. Real sign-out then removed account access: after returning to Account, purchase, draft and report status messages all required sign-in. No cookies, credentials or private identifiers were extracted.

Live testing exposed stale UI after the original form-based logout. The adapter now also supports a same-origin JSON POST response: it revokes the session and expires the cookie before the customer UI starts a top-level navigation to the trusted provider logout URL. This preserves the site's self-only form CSP. The ordinary POST fallback remains. OIDC session-revocation tests and all four local en/zh-Hans × 1440/390 browser scenarios passed after the fix.

Logout fix deployed as `0c8af3a0` to https://5fbf21c4.phios-github.pages.dev (stable alias unchanged). On this deployed fix, authenticated refresh passed; clicking sign-out reached Auth0, and subsequent Account access showed guest/sign-in-required state for purchases, drafts and reports.

Remaining external gate: Auth0 returned an explicit invalid_request because `https://qa.phios-github.pages.dev/account/` is missing from PHI OS QA's **Allowed Logout URLs**. The owner must register this exact URL including the trailing slash. Local PHI OS session revocation and private-data denial passed, but successful provider logout/automatic return is not yet accepted. Do not claim full Preview or FW production acceptance; Production was not modified.
