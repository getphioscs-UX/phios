# I Ching Limited Production activation v2

## Why v2 exists

The first real Cloudflare Pages POST reached the protected Limited Production handler, but the runtime rejected the Access JWKS subrequest option `redirect: "error"` with an edge-runtime compatibility error requiring `follow` or `manual`.

This successor does **not** rewrite the frozen v1 verifier, D1 probe, beta-session contract, middleware, admitted 448-depth corpus, stable execute route, or Full Production boundary. It adds `/api/iching-limited-session-v2`, which injects an edge-safe fetch adapter into the existing `createIChingLimitedSession(...)` function. The adapter maps only `redirect: "error"` to `redirect: "manual"`; the frozen verifier still requires `response.ok`, so any 3xx response remains fail-closed and no redirected JWKS body is trusted.

## Cloudflare Access change

Edit the existing self-hosted Access application destination from:

`phios-github.pages.dev/api/iching-limited-session`

to:

`phios-github.pages.dev/api/iching-limited-session-v2`

Keep the existing Allow policy and beta tester email. If the same Access application is edited rather than recreated, retain its current Application Audience (AUD) Tag and `PHIOS_ACCESS_AUD` secret.

## Deployment sequence

1. Commit the v2 successor and deploy the new commit.
2. Update both `ICHING_LIMITED_PRODUCTION_DEPLOYMENT_SHA` and `ICHING_LIMITED_PRODUCTION_LIVE_BROWSER_ACCEPTED_SHA` to the **new** deployed 40-character commit SHA (the browser-accepted value only after the read-only gate passes).
3. Run `npm run check:iching-live-activation` against that exact SHA.
4. Visit `/api/iching-limited-session-v2` in the browser and confirm Access login succeeds; browser GET should finish at `METHOD_NOT_ALLOWED`.
5. Copy the real `CF_Authorization` cookie locally.
6. Run `node scripts/check-iching-limited-production-live-v2.mjs`.
7. Only a PASS from the v2 live checker constitutes live `LIMITED_PRODUCTION`. `FULL_PRODUCTION` remains false.

## Static acceptance

Run:

`node scripts/check-iching-limited-production-static-v2.mjs`

The v2 checker first requires the historical v1 static acceptance to remain green, then verifies that the successor sends the Access JWKS subrequest with `redirect: "manual"`, preserves D1 write/read/cleanup, and produces a beta cookie accepted by the frozen v1 middleware verifier.
