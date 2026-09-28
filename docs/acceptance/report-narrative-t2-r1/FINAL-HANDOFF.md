# REPORT-NARRATIVE-T2-R1 continuation — 2026-09-28

## Status

Partial implementation and local verification. This is **not** W0–W29 completion, owner acceptance, canary acceptance, or eight-method production admission.

Original attachment baseline HEAD: `6ce925dacb0d3e21fc419cbb3f05ddf480e42de3`.
Resume first observed HEAD: `496efce52e3b5b6e70daab82e468fe16eec2d201`.
Stable start / end HEAD: `a8bf5f1f92a9b86446c62c05f86de4b431c58874` (changes remain uncommitted).
Concurrent edits were observed; the user confirmed the other editor was paused. Final changes are in `C:/phios`. An isolation worktree was created during the audit; its one governance change was also applied to the main workspace.

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
- Eight existing cover bases retained. Typography and bounded text fitting added to the existing overlay/print path. The proposed 10–16px font range still requires design-owner acceptance. Human Design mask height reduced to avoid masking labels.
- Locale checks now compare source lineage and semantic scope, candidate claim sets and Brief bindings. Two absent candidates are `NOT_RUN`, not accepted parity.
- Core CI includes adversarial regressions. Narrative-writer changes trigger the S04 workflow.

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
- Cover builder and headless Edge audit: 8 methods × 8 fixtures, **64 logical / 64 physical PDF pages**, no machine field/parity/clipping failures. Includes short/long Latin and Chinese names, mixed name, exact time, approximate time and unknown time. Screenshots and PDF are under `artifacts/rnt2-cover/`; these are synthetic fixture artifacts, not customer production reports.

Core composition tests inject both the writer and reviewer responses. They establish control flow and rejection behavior, **not live provider quality**. Regression checks of the previous BaZi publication path establish non-regression, not activation of the new paid T2 path.

## NOT_RUN / BLOCKED

- User confirmed the API key is configured in **Cloudflare Secrets**. The local process and Windows User/Machine environments have no API key; no `.env`/`.dev.vars` exists in this checkout. The existing S04 builder only reads local process environment. No deployed protected S04 successor entry point was found. Cloudflare secret values were not requested, retrieved or logged.
- Actual S04 writer and semantic-review provider calls: **NOT_RUN**. Current `bazi/s04/MACHINE-EVIDENCE.json` records this honestly. Both T2 candidates remain null; neither locale is ready for owner acceptance.
- Production persistent snapshot-store wiring, trusted report-subject binding construction in authenticated middleware, live entitlement/reopen/Explore integration and production activation remain incomplete. Strict helpers deliberately reject missing bindings.
- Full report HTML/PDF semantic parity, mobile report navigation/reopen, per-method adapters/calibration/acceptance, canary and production are not verified by cover QA.
- Full per-method editorial calibration remains pending. Section specificity is explicitly unmeasured rather than reusing claim coverage as a substitute.
- No deployment, push, production switch, owner acceptance or additional method rollout was performed.

## READY_FOR_OWNER_ACCEPTANCE

None for S04. Once a protected environment executes the updated builder successfully, review the actual Chinese and English candidates separately. The attachment's owner gate still requires **S04 zh-Hans ACCEPT** and **S04 en ACCEPT** before S05 rollout. Do not request acceptance of the current null candidates.

## PRE-EXISTING_FAILURE

`check-bazi-section-publication.mjs` referenced nonexistent `shorter` while writing evidence. Replaced that stale field with the actual `withoutLegacyCareerItems` fixture and reran successfully. This repair does not change report content.

## Evidence and remaining sequence

- S04 Claim IR / Brief / candidate / verification / quality: `bazi/s04/`.
- Eight-cover registration: `functions/canonical-presentation-runtime/report-cover-overlay-registry.js`.
- PII source: existing `RDG_ACCOUNT_PERSON_REFERENCE` for name; `MCD3_CANONICAL_BIRTH_INPUT` for birth fields. The helper consumes those owners; deployment-side authenticated binding remains outstanding.
- Admission matrix: `METHOD-ADMISSION-MATRIX.json`. All eight methods remain unadmitted in this successor.
- File manifest: `CHANGED-FILES.txt`.

Next: finish authenticated server-side execution/binding and persistence; run actual S04 composition and review in the protected environment; verify full-report browser/PDF parity; then present valid frozen candidates for the two owner decisions. Do not label the partial infrastructure as production-ready.
