## Current checkpoint: deployment repaired; S02/S03 review

S04 and S05 remain owner-accepted. S03 bilingual review passed and awaits owner acceptance: [S03](bazi/s03-market-v1/review.html). S02 English passed; Chinese remains unaccepted after readability/concision rejection. A local 1,316-Han revision is ready for a fresh independent review: [draft](bazi/s02-market-v1/LOCAL-REVISION.md). Nine authorized calls completed (4 writers + 5 reviewers), no regeneration; further paid calls require authorization.

Wrangler 3 JSON-import parser failure fixed using digest-checked JS receipts. New and old source builds passed, as did repeat builds with an existing root Worker. QA deployed at https://202289fc.phios-github.pages.dev. Production Git deployment has not been retried.

## Current S05 handoff

S04 V4 and S05 final edited bilingual candidates are owner-accepted. S05 accepted reading: [review](bazi/s05-market-v1/review.html). Chinese 1,409 Han characters; English 669 words. Two writers plus four reviewers; no regeneration. QA only, no production activation. S02/S03 reconciled briefs now pass local preflight; see bazi/s02-s03-reconciliation/IMPLEMENTATION.md. Fresh generation and review remain pending scoped authorization and QA integration.

> Current successor: S04 V4 final edited zh-Hans and en are OWNER_ACCEPTED. See bazi/s04-csd-v4/OWNER-ACCEPTANCE.json. Continue with S05 under the accepted market-style approach. The predecessor status below is historical.

# REPORT-NARRATIVE-T2-R1 continuation — 2026-09-28

## Status

> Successor notice (2026-09-28): the owner explicitly rejected the predecessor S04 editorial quality in the RNT2-W30+ attachment. Its technical PASS remains historical evidence, not acceptance. Continue with bazi/s04-csd-v2/PREDECESSOR-REJECTION.json and IMPLEMENTATION.md.


S04 bilingual real T2 candidates are **READY_FOR_OWNER_ACCEPTANCE**. Both locales passed independent semantic verification with full claim coverage and locale parity. The broader implementation remains partial: this is not W0–W29 completion, owner acceptance, canary acceptance, or eight-method production admission.

Original attachment baseline HEAD: `6ce925dacb0d3e21fc419cbb3f05ddf480e42de3`.
Resume first observed HEAD: `496efce52e3b5b6e70daab82e468fe16eec2d201`.
Stable implementation start HEAD: `a8bf5f1f92a9b86446c62c05f86de4b431c58874`.
Last verified end HEAD: `75b7ace4d4855aaaa9aa3c440b4516b6a20ea4b3`, plus remaining working-tree edits. External commits incorporated most of this work during validation; this task itself did not run git commit/push.
Concurrent edits were observed; the user confirmed the other editor was paused, but later external commits/merges resumed. They introduced literal conflict markers in check-rnt2-core.mjs. Both the two-provider-call assertion and the added Publication IR test were retained while removing those markers. Core, adversarial, delivery, section publication and Functions compatibility checks passed again after that merge. Final changes are in `C:/phios`. An isolation worktree was created during the audit; its one governance change was also applied to the main workspace.

## IMPLEMENTED

- The section composer is now a compatibility export of the existing `narrative-writer.js`. BaZi S04 enters through `composePublicationNarrative({sectionBrief})`; no second writer owns composition.
- Complete claim transport enters source digests, including conditions, counterweights, operators, licenses, rank, direction, basis, open conditions and boundaries. Brief changes invalidate candidate cache keys. Reflection questions inherit sources only through their actual claim references.
- Candidate paragraphs carry claim and support references and a Brief digest. Deterministic checks are followed by an independent provider semantic review, bound to both the Brief and candidate digests. Missing semantic review fails closed. Citation presence is no longer reported as meaningful claim coverage.
- Semantic review checks facts, boundaries, conditions, counterweights, uncertainty, timing, invented reality, additional facts, operators, rank and direction. This remains a machine assessment requiring human review; it is not a proof that an LLM cannot make mistakes.
- Missing local credentials produce `providerCalled:false`, `providerAttemptCount:0`, and `DETERMINISTIC_FALLBACK`. Injected provider tests are distinguished from live adapters. Reviewer usage is recorded separately from generation/repair usage.
- HTTP 429 and transient 5xx classification, bounded provider calls, and at most one semantic repair. Unavailable semantic review does not trigger semantic repair.
- Cache reads verify generation identity, Brief lineage and composition content digest.
- Name is included in the presentation fingerprint. Trusted report input, overlay and semantic subject fingerprints must match before the BaZi paid overlay path accepts a binding. Unknown time and precision mismatches fail closed. The name remains outside canonical calculation input.
- Delivery R2 requires method/locale/subject/input binding and explicit snapshot-specific production admission. A purchased report without a snapshot is not advertised as a full report. This helper is not a replacement for authentication or Commerce.
- Eight existing cover bases retained. Typography and bounded text fitting added to the existing overlay/print path. The proposed 10–16px font range still requires design-owner acceptance. Human Design mask height reduced to avoid masking labels. Zi Wei, Astrology and Profile field positions were adjusted after PDF visual inspection; BaZi separator masks were corrected.
- Locale checks now compare source lineage and semantic scope, candidate claim sets and Brief bindings. Two absent candidates are `NOT_RUN`, not accepted parity.
- Core CI includes adversarial regressions. Narrative-writer changes trigger the S04 workflow.
- Existing publication browser bundle rebuilt using `scripts/sync-bazi-publication-browser.mjs`; no parallel renderer added.
- Added action `rnt2-s04` to the existing authenticated `/api/qa-bazi-t3` route. It uses the Cloudflare `OPENAI_API_KEY` binding, accepts only the fixed S04 source and en/zh-Hans, requires QA opt-in and a server-side reviewer allowlist, and stores digest-bound immutable QA results in PRIVATE_REPORTS. D1 reserves each Brief/version identity before any provider call. Missing credentials do not reserve; interrupted calls remain reserved to prevent automatic duplicate spending. This is a review snapshot, not customer production admission.
- Removed unresolved merge markers from the core CI workflow while preserving both sides' tests. Added the private-review regression to CI.

## VERIFIED

Commands completed successfully:

- `node scripts/check-rnt2-core.mjs`
- `node scripts/check-rnt2-adversarial.mjs`
- `node scripts/check-rnt2-bazi-s04-authority.mjs`
- `node scripts/check-report-customer-delivery.mjs`
- `node scripts/check-bazi-section-publication.mjs`
- `node scripts/check-report-editorial-quality.mjs`
- `node scripts/check-cloudflare-function-import-compat.mjs`
- `git diff --check`
- `node scripts/check-rnt2-private-review.mjs` (mock storage/provider; authentication, CSRF, input limits, concurrency, frozen reopen, tamper rejection and interrupted-run reservation)
- `node scripts/check-bazi-t3-preview.mjs` (existing QA route regression)
- `node scripts/build-cloudflare-pages.mjs --check-only` (Worker 13,761,018 bytes; gzip 2,552,041 bytes; no deployment)
- Cover builder and headless Edge audit: 8 methods × 8 fixtures, **64 logical / 64 physical PDF pages**, no machine field/parity/clipping failures. Includes short/long Latin and Chinese names, mixed name, exact time, approximate time and unknown time. Reproducible screenshots and PDF were subsequently removed at the user's request; the compact result remains in `COVER-QA.json`. These tests used fixture data, not customer production reports.

Core composition tests inject both the writer and reviewer responses. They establish control flow and rejection behavior, **not live provider quality**. Regression checks of the previous BaZi publication path establish non-regression, not activation of the new paid T2 path.

## NOT_RUN / BLOCKED

- Cloudflare inspection confirmed `OPENAI_API_KEY` exists as a secret in production and preview. Its value was not requested, retrieved or logged. QA has the protected S04 action, preview opt-in and encrypted reviewer allowlist for the verified existing account. The read-only model probe returned HTTP 200.
- Initial provider failures are retained as immutable historical snapshots. Removing unsupported schema `uniqueItems` resolved generation; local duplicate-reference validation remains mandatory. Later snapshots contain real model prose and independent semantic review. Current results are recorded in `bazi/s04/MACHINE-EVIDENCE.json`; importing digest-validated private snapshots performs no model calls.
- Production persistent snapshot-store wiring, trusted report-subject binding construction in authenticated middleware, live entitlement/reopen/Explore integration and production activation remain incomplete. Strict helpers deliberately reject missing bindings.
- Full report HTML/PDF semantic parity, mobile report navigation/reopen, per-method adapters/calibration/acceptance, canary and production are not verified by cover QA.
- Full per-method editorial calibration remains pending. Section specificity is explicitly unmeasured rather than reusing claim coverage as a substitute.
- The protected S04 review entry was deployed to the existing **QA preview only**. No push, production switch, owner acceptance or additional method rollout was performed.

## READY_FOR_OWNER_ACCEPTANCE

S04 Chinese and English frozen candidates are ready in `bazi/s04/review-s04-zh-Hans.html` and `bazi/s04/review-s04-en.html`. Both record LIVE_ADAPTER, actual T2, fallbackUsed false, accepted verification, claim coverage 1 and accepted locale parity. The attachment's sections 61, 63 and 124–125 require separate **S04 zh-Hans ACCEPT** and **S04 en ACCEPT** before S05 rollout. Owner acceptance remains PENDING; productionActivated remains false.

Frozen private QA keys: English `qa/rnt2/s04/47a90e3370ae0a6a7b7750a57f9a797dcb31ab47421837b6174972347d6b9be0.json`; Chinese `qa/rnt2/s04/e6b953e43de838bd20ea91ef527484b1d99ddeaa15b8ce9555478ee5bc72e342.json`. Exact identities, timestamps, digests, provider attempts, repair counts, reviewer calls and usage are retained in MACHINE-EVIDENCE.json. English uses verifier v1.3.0 (also passed read-only v1.3.1 revalidation); Chinese uses v1.3.1. No successful snapshot was overwritten or relabeled.

## PRE-EXISTING_FAILURE

`check-bazi-section-publication.mjs` referenced nonexistent `shorter` while writing evidence. Replaced that stale field with the actual `withoutLegacyCareerItems` fixture and reran successfully. This repair does not change report content.

## Evidence and remaining sequence

- S04 Claim IR / Brief / candidate / verification / quality: `bazi/s04/`.
- Eight-cover registration: `functions/canonical-presentation-runtime/report-cover-overlay-registry.js`.
- PII source: existing `RDG_ACCOUNT_PERSON_REFERENCE` for name; `MCD3_CANONICAL_BIRTH_INPUT` for birth fields. The helper consumes those owners; deployment-side authenticated binding remains outstanding.
- Admission matrix: `METHOD-ADMISSION-MATRIX.json`. All eight methods remain unadmitted in this successor.
- File manifest: `CHANGED-FILES.txt`.

Next: obtain the two S04 owner decisions, then proceed within the attachment's sequence. Production subject binding, persistent delivery integration and full-report browser/PDF parity remain outstanding and must be completed before production admission. Do not label the partial infrastructure as production-ready.

### Protected S04 execution

After deploying the reviewed changes to the existing QA preview, configure preview-only `RNT2_S04_REVIEW=enabled` and `RNT2_REVIEWER_IDS` as a comma-separated list of existing authenticated account userIds. Retain the existing account authentication and sandbox D1/R2 bindings. Using that account's normal same-origin session, POST to `/api/qa-bazi-t3` with `{"action":"rnt2-s04","locale":"en","sectionKey":"S04_CAREER"}`, then repeat for `zh-Hans`. The request does not accept user identity, source, model, prompt or secret overrides. Reopening returns the same frozen result and digest. A failed/interrupted reservation requires operator investigation; do not delete it and blindly repeat paid calls. Each result retains owner acceptance PENDING and productionActivated false.

The user supplied the account's Auth0 subject after the email lookup failed. A read-only QA query confirmed its active existing PHI OS account mapping. Its userId is now configured in the preview's encrypted RNT2_REVIEWER_IDS binding; OPENAI_API_KEY was retained and production configuration was verified unchanged. Existing OIDC login succeeded in the browser. The user explicitly authorized the BaZi S04 source/Brief transfer to OpenAI and the real bilingual generation/review API costs after automatic approval review initially blocked the generation click. The rejected click did not execute.

QA review UI: https://qa.phios-github.pages.dev/docs/acceptance/report-narrative-t2-r1/bazi/s04/private-review . The UI exposes saved text and machine evidence without granting owner acceptance. Added an authenticated read-only model-access probe: it sends no chart/Brief, calls no generation endpoint, and returns only status plus allowlisted error codes. Raw provider error messages are not persisted. The original failed snapshots remain immutable; diagnostic changes do not invalidate their reservation keys.

The clean build initially exposed a missing temporary output directory. `build-cloudflare-pages.mjs` now creates it before invoking Wrangler. Clean build and private-review/adversarial regressions passed. Deployment staging copies and temporary downloaded snapshots are removed after verification.

The live read-only model probe returned HTTP 200 for gpt-5.6-luna. Unsupported `uniqueItems` was removed from the provider schema; uniqueness remains enforced locally. Composer v1.3.0 / prompt v2.2.0 constrain references to the actual Brief, explicitly require source boundaries, and include the previous candidate and concrete review defects in the single permitted repair. Input no longer duplicates the Brief. The independent reviewer returns rejection defects only, with no praise in its reasons array. Verifier v1.3.1 distinguishes tested negative certainty constructions from affirmative guarantees; the independent reviewer receives unmodified prose and remains mandatory. Positive guarantees and mixed negative/positive claims still fail regression tests. Source authority and model route were unchanged. Schema reference: https://developers.openai.com/api/docs/guides/structured-outputs .

Latest QA deployment: https://301de467.phios-github.pages.dev (alias `qa`). English passed live review under verifier v1.3.0 and was additionally revalidated read-only under v1.3.1 with its original digest-bound semantic review; its immutable identity is preserved, avoiding another paid generation. Usage estimates use the existing planning registry and are not final billed costs. Historical usage events retain the pre-existing `requestType: PRODUCTION` default even though execution was QA only.

## Final cover visual review

All 64 fixture PDF pages were rasterized and their field strips inspected. After finding raster-label overlap, affected overlays were corrected and the full 64-case HTML/PDF machine audit rerun successfully. The final affected pages were rendered and visually rechecked. All 152 reproducible files in artifacts/rnt2-cover and the temporary bazi-t3-test bundle were then removed at the user's request (190.87 MiB total). Generated cover outputs are now ignored by Git. To recreate them, run the cover fixture builder and audit scripts; historical machine results remain in COVER-QA.json. Design-owner acceptance of typography/masks remains pending.

After the final live bilingual PASS, removed 15,205 additional temporary files (602.65 MiB): this task's QA deployment staging, Pages build output and duplicate downloaded private snapshots. Resolved paths were checked to remain in C:/phios and contain no reparse points. Source, compact review records and private immutable R2 snapshots remain. Total removed across these cleanup passes: approximately 793.52 MiB. Unrelated active task directories were preserved.
