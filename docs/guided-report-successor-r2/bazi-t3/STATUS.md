# Addendum D — staged implementation and acceptance

Baseline: owner-deployed main `9f50857`; the owner's subsequent `5e077e09` includes the first versioned contract/writer additions from this work. Existing assets and R2 WebP bindings are complete. Production and historical T2 publications are unchanged.

## Canonical owners

| Responsibility | Existing owner / extension |
| --- | --- |
| Method facts and NOW | `bazi-method-native-reading-adapter.js`, `bazi-visual-report-projection.js` |
| Section registry, 36-page specimen | `bazi-section-publication.js`, `report-section-contract.js` |
| Writer and provider | `narrative-writer.js`, `narrative-provider.js` |
| Routing | `selectPaiRoute`, existing PAI provider registry |
| Evidence/editorial extension | `bazi-editorial-contract.js` |
| Section generation and frozen snapshot | `bazi-t3-composition.js` (exported by the existing writer) |
| Publication snapshot | existing `assemblePublicationSnapshot` and publication cache owner |
| Preview shadow evidence | fixed synthetic packs, existing D1 runtime artifacts for reservation/metadata, sandbox PRIVATE_REPORTS for result bytes |

No second method engine, report-release runtime or provider router is introduced. No migration is added. Preview 0007/0008 remain applied; Production migrations remain blocked by the separate Financial/Will acceptance gates.

## Implemented

- Versioned SectionEvidencePack; editorial bridges are not admitted as personal facts. Canonical facts, uncertainty, temporal snapshot and source references remain internal.
- Contextual vocabulary for Seven Killings / Direct Officer / Direct Resource. Structured JSON blocks carry source references, separately from customer text.
- Section-level composition through the existing PAI route, followed by an independent model semantic-verification request. PASS requires a reasoned entailment assessment for every nonempty block, no reported violations, and preserved conditions/counters/time. Reference membership alone fails.
- One repair attempt maximum; provider failure, semantic rejection, editorial defects, repetition or layout budget failure return to T2.
- Immutable, digest-bound section snapshots. Reopening an accepted snapshot does not invoke a model. Locale/evidence/version drift rejects reuse.
- Leak/banned-prose/completeness checks, cross-section similarity, trusted release gate, and explicit SHADOW / QA / CANARY / PRODUCTION separation.
- Preview-only, authenticated, same-origin fixed-benchmark generation. Arbitrary evidence, models and prompts are not accepted from the browser. Global D1 reservations bound generation to one attempt per fixed pack, including concurrent requests. Keys remain in Cloudflare.
- Bilingual review HTML with T2/Candidate comparison. Unavailable T3 is labelled explicitly; fallback text is never called accepted T3.

## Current gates — not accepted

Read `generation-evidence.json`, `acceptance.json`, and the deployed evidence record for current results. Local contract tests prove rejection/fallback behavior, not live writing quality.

The existing S07 source contains only generic editorial advice, with no admitted personal wellbeing interpretation. Its T3 pack deliberately falls back with `INSUFFICIENT_ADMITTED_INTERPRETATION`; a model must not invent medical or personal evidence to fill this gap.

The attachment specifies eight T3-capable sections (S02–S09) but asks for nine lanes in its shadow matrix. The explicit section policy remains authoritative: 12 profiles × 2 locales × 8 T3 sections = 192 composition cases, plus 24 deterministic S01 control cases = 216 checks. Do not convert S01 or S10 into T3 just to reach a count. The present deployed probe is one bilingual benchmark (16 fixed packs), not the completed 12-profile matrix.

Remaining release evidence: successful real provider composition and semantic verification, full high/low/open/mixed/CUSTOM/NOW shadow corpus, bilingual claim/condition parity, accepted candidate browser/PDF checks, explicit per-section human decisions bound to snapshot digests, canary outcomes. No human decisions are synthesized. Current review PDFs may contain T2 fallback and cannot satisfy T3 human acceptance.

`node scripts/check-bazi-t3-production-gate.mjs` tests fail-closed behavior and reports all remaining gates. Add `--require-accepted` for a release-blocking exit code. `BAZI_R2_T3_ACCEPTED` and `BAZI_PRODUCTION_SUCCESSOR_ACTIVE` remain false.

Auth0 login and authenticated refresh passed again on 2026-09-23. The real QA logout still returned `post_logout_redirect_uri` not registered for the exact `/account/` URL in application `eSmR58lhvWkRCTyo7RdMxTuQzLM85Axr`; owner confirmation alone is not substituted for that failed live result.
