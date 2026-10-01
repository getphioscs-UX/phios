# Canonical person owner and Zi Wei QA delivery

Current work: CPA-W0–W7 and QA-W0–W15. Production and Astrology remain closed.

The user's CPA-W0 acceptance freezes the V1 composer, publication adapter, generation adapter, 12-structure evidence, 24 browser reports, person-access evidence and full prior npm lifecycle evidence. `content/reports/ziwei/production-v1-acceptance.json` records 74 exact hashes. Earlier BaZi and Zi Wei R2 acceptance remains unchanged.

## Owner inventory and implementation

Existing `oidc-auth.js` owns verified account identity; it does not own birth data. `person-use-policy.js` owns person-use consent admission. `report-cover-subject.js` owns subject presentation and binding. Financial/will encrypted drafts are product drafts, not canonical birth profiles. Existing symbolic reading persistence stores reading projections. None supplied an account-owned, versioned canonical person loader.

The shared `functions/account/canonical-person-store.js` now provides that owner through `/api/account-persons`. It uses existing verified server identity, same-origin protection, the canonical birth validator and existing consent policy. Only SELF intake is enabled; dependent and third-party authority is not inferred. Birth values are explicit declarations, never recovered from charts or OIDC metadata. Person IDs, owner IDs, consent IDs and source references are server-owned. Names, birth data and consent are encrypted using AES-GCM with account/person/version authenticated data. Secrets remain outside Git.

Migration 0009 stores append-only encrypted person versions. Migration 0010 indexes rendered method report material alongside the existing immutable snapshot owner. Both are registered with the existing migration runner's normalized SQL checksums. Current migration-count checks now expect all ten files; none of the first eight migrations changed.

`ziwei-canonical-person-binding.js` injects this owner into the frozen V1 generator. Generation JSON accepts person ID, language and explicit observation target context; arbitrary birth/owner/entitlement substitutions are rejected. Other birth-based methods can consume the shared person contract without duplicating person persistence.

## QA deployment and evidence boundaries

Canonical QA: https://qa.phios-github.pages.dev. Pages deployment `636424de` is on branch `qa`, bound to the existing sandbox D1 and private report bucket. Production bindings are unchanged. The private browser verifier has no workers.dev endpoint or public preview URL and is bound only to Preview.

The real customer auth flow is authenticated. A governed synthetic person was created through the deployed account form, not inserted by SQL. `cpa-v1/qa-person-lineage.json` records only stable account/person IDs, version, creation time and digest. Its birth values derive from the explicitly synthetic controlled-subject mechanism; they are not the user's personal birth data or recovered historical provenance.

Actual QA observations so far:

- Account form persisted the controlled person and displayed active consent, version 1.
- Anonymous person and method-report GET requests returned 401.
- Generating Zi Wei without the product entitlement was rejected; no report material was created.
- The normal Stripe hosted sandbox checkout completed for the bilingual Zi Wei report (MYR 49 simulated). Read-only D1 evidence confirms purchased order and active entitlement.
- After the user configured `STRIPE_WEBHOOK_SECRET`, Pages Preview was redeployed. Both `payment_intent.succeeded` and `checkout.session.completed` have livemode 0, processed status and no error. Real checkout → verified webhook → entitlement is proven in `cpa-v1/qa-commerce-lineage.json`.

The release adapter accepts verification only from the private browser service, tied to the semantic snapshot and output digest. It requires actual 33-page PDF output, zero overflows, zero broken images and zero browser errors. Ordinary report open reads stored rendered bytes and the existing immutable snapshot; it does not invoke generation, composition or a provider.

Local SQL/calculation/access/versioning tests and isolated browser-service tests are separate evidence. They do not establish authenticated deployed positive delivery, cross-account QA isolation or logout/login release immutability. Those gates remain NOT_PROVEN until exercised through real QA accounts and entitlements.

## Cleanup and current verification

Nineteen obsolete diagnostic logs/results were removed after reference checks; their paths and hashes are in `cpa-v1/cleanup-manifest.json`. The successful prior lifecycle log and all accepted evidence remain. Similar-looking historical files with governance references or different contents were retained; deleting them would remove required provenance rather than a duplicate.

Current work evidence lives in `cpa-v1/` and the four `qa-*.json` files in this directory. `cpa-v1/npm-check.log` is the current full-lifecycle run; final status must be taken from its completed exit result and final-validation record, not from intermediate PASS lines.

No production mutations, production admission or Astrology work are authorized by these local/QA partial results.

## Current browser-service blocker

Private QA renderer version `1cd6ede4-b8e0-4278-853b-09e68eb9a279` is deployed with no public route. PDF verification now consumes bounded CDP chunks using native Buffer decoding and validates the actual page tree without retaining the whole image-heavy PDF. Local page-tree, truncation and count-mismatch tests pass. The latest remote fix is NOT_PROVEN: Cloudflare returns 429 with no active sessions, acquisition wait 0 and 649.891 browser seconds used. Deployment explicitly confirmed the account is on Workers Free. No plan upgrade was performed.

The authenticated account generation attempt displayed a release-unavailable message, and `cpa-v1/qa-material-lineage.json` confirms no released material. This is a failed-closed observation, not successful customer generation or delivery. Real payment/entitlement remains proven independently. After browser capacity is available, verify both locales, account library, immutable refresh and login, and deployed access negatives before promoting QA delivery.

Full-check maintenance also registered the already committed 48-position Atlas loader/state/URL changes (`f0ec9c91`, `403ddcae`, `a607867c`) as chained engineering successors. Historical hashes and human acceptance were preserved; no Atlas runtime edits or new acceptance were made.

Cloudflare reference for resumption: https://developers.cloudflare.com/browser-run/limits/ — Workers Free provides 10 browser minutes per day; paid-plan changes require redeployment. The user has been asked about existing plan status; this work did not buy or enable a paid plan.

## Final local verification

`npm run check` completed with exit code **0**, including precheck, main check and postcheck. See `cpa-v1/final-validation.json` for log digest and current source digests. The focused shared-person integration, frozen 74-file acceptance and bounded PDF page-tree tests also pass. This local PASS does not change the pending QA browser/delivery or production gates.
