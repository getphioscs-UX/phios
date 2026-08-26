# I Ching Limited Production activation

Baseline: `fc2c3dd6ab4910581fd9c859dc303e8c89697ec0`.

This successor does not change the frozen stable I Ching handler, structural Runtime, 448/448 admitted depth corpus, or Tarot production authority. `/functions/api/_middleware.js` only promotes a verified beta session to `symbolic-method-execute-v4`, which is the already accepted depth-v2 execution candidate.

## Cloudflare Access

Protect only `/api/iching-limited-session` with a Cloudflare Access self-hosted application. The application must pass `Cf-Access-Jwt-Assertion` to Pages Functions. Do not trust the browser `CF_Authorization` cookie inside application code; the server validates the assertion signature against the team JWKS endpoint.

## Required production variables / secrets

- `ICHING_LIMITED_PRODUCTION_ENABLED=true`
- `ICHING_LIMITED_PRODUCTION_DEPLOYMENT_SHA=<current 40-char commit SHA>`
- `ICHING_LIMITED_PRODUCTION_LIVE_BROWSER_ACCEPTED_SHA=<same current SHA after read-only live acceptance>`
- `ICHING_LIMITED_PRODUCTION_COUNTRIES=MY,US` (or a narrower reviewed scope)
- `ICHING_LIMITED_PRODUCTION_EMAILS=<comma-separated beta tester email allowlist>`
- `ICHING_LIMITED_PRODUCTION_SESSION_SECRET=<32+ character secret>`
- `ICHING_LIMITED_PRODUCTION_RIGHTS_REVIEW_ID=<operator-controlled rights review reference>`
- `PHIOS_ACCESS_TEAM_DOMAIN=https://<team>.cloudflareaccess.com`
- `PHIOS_ACCESS_AUD=<Access application AUD>`

The rights review ID is an explicit deployment attestation. The repository does not infer a legal conclusion and does not treat this operational scope as legal advice.

## Deployment sequence

1. Commit this delta and deploy the same commit with `ICHING_LIMITED_PRODUCTION_ENABLED=false` (or without the variable).
2. Run the existing read-only SHA/browser gate against the new commit:
   - `PHIOS_ICHING_BASE_URL=https://phios-github.pages.dev`
   - `PHIOS_ICHING_EXPECTED_SHA=<new commit SHA>`
   - `npm run check:iching-live-activation`
3. After that exact SHA passes, configure the variables above with both SHA variables equal to that deployed commit and redeploy the same commit.
4. Obtain a real Access `CF_Authorization` cookie for an allowlisted beta tester.
5. Run:
   - `node scripts/check-iching-limited-production-live.mjs`
6. Only a successful live checker constitutes live `LIMITED_PRODUCTION` evidence. It does not grant `FULL_PRODUCTION`.

## Local/static acceptance

Run:

`node scripts/check-iching-limited-production-static.mjs`

The static checker cryptographically signs and validates an RS256 Access JWT, exercises D1 write/read/cleanup behavior, verifies the signed beta session, executes the stable public path through the admitted 448-depth runtime, confirms guest 423 behavior, and confirms save is still blocked without explicit retention consent.
