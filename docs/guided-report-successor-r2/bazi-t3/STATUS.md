# Addendum E — licensed explanatory authority and staged acceptance

## Current checkpoint — 2026-09-23

Implementation commit `1e708ba4` is deployed to QA at https://baba8ef8.phios-github.pages.dev (stable alias https://qa.phios-github.pages.dev). Production is unchanged. The following results are real authenticated Preview model calls, with frozen result bytes retrieved from sandbox PRIVATE_REPORTS; they are not local fixture acceptance.

| S02 stage | English | Chinese | Bilingual parity |
| --- | --- | --- | --- |
| BASELINE_NOW | PASS | PASS | PASS |
| HIGH_EVIDENCE / BAZI-FP-W17-005 | PASS | PASS | REJECT: verifier returned PASS with nonempty differences; strict zero-difference contract rejected the inconsistent output |
| LOW_EVIDENCE / BAZI-FP-W17-033 | PASS | FALLBACK: NARRATIVE_PROVIDER_SCHEMA_OUTPUT_UNREADABLE | Blocked: accepted Chinese snapshot missing |
| MIXED / BAZI-FP-W17-006 | PASS | SEMANTIC_REJECTED: UNLICENSED_SEQUENCE at lead | Blocked: accepted Chinese snapshot missing |

The mixed Chinese candidate changed reading emphasis into “阅读顺序”; the independent verifier rejected this as an unlicensed sequence. The low-evidence failure records an unreadable structured provider output; the retained record does not establish whether the writer or verifier produced it, or whether truncation caused it. Do not invent a more specific diagnosis.

The high-evidence bilingual verifier described equivalent wording differences while also returning PASS. The strict consumer rejected this contradictory response; it has not been manually promoted. A future contract revision should distinguish nonmaterial observations from actual semantic differences, preserving fail-closed handling and digest-bound evidence.

S03–S09 and the 216-check full matrix remain blocked by S02 strata quality. No identical failed reservation was cleared or retried. The one-repair ceiling is unchanged. BASELINE_NOW S02 is admitted into the bilingual 36-page review; all other baseline chapters retain T2 fallback. Browser/PDF checks do not mean human acceptance.

Implemented: deterministic `BAZI_EXPLANATORY_AUTHORITY_V1` from the existing professional modules; V3 evidence packs; licensed relation/operator checks; evidence-adaptive empty lists; distinct claim/question blocks; source-bound temporal and integrated-guidance IR; server-enforced staged generation; bilingual structural coverage; digest-bound human review export. No new method engine, provider router, persistence authority or migration was introduced.

Release gates still outstanding: all S02 strata, baseline S03–S09, full live matrix, all bilingual pairs, accepted-candidate browser/PDF coverage for the remaining sections, explicit human ACCEPT decisions for both locales and every section, then canary. `BAZI_R2_T3_ACCEPTED` and `BAZI_PRODUCTION_SUCCESSOR_ACTIVE` remain false. Human decisions must be made by the reviewer; the export form does not itself activate a release.

Validation: the complete `npm.cmd run check` command exited 0 in this checkpoint. The bilingual review passed 1440/390 and print geometry checks, with no overflow or footer overlap. Both PDFs contain 36 A4 pages; only S02 is an accepted live candidate. See `addendum-e-evidence.json` for exact pack hashes, snapshot digests, provider failure code and verifier defects. The real full-matrix button returned `STAGED_QUALITY_GATE`, naming low-evidence Chinese and mixed Chinese as missing; it did not run the matrix.

## Historical Addendum D checkpoint

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
- Authenticated bilingual-pair verification resolves both accepted snapshots from private R2, compares every claim in both directions through the existing provider, and binds the result to both snapshot digests. A missing accepted locale returns 409 without a model call. This implementation has synthetic regression coverage; live bilingual parity remains unaccepted because no accepted pair exists.

## Current gates — not accepted

Read `generation-evidence.json`, `acceptance.json`, and the deployed evidence record for current results. Local contract tests prove rejection/fallback behavior, not live writing quality.

The old S07 page used generic editorial advice. The evidence adapter now reuses the existing method's PRESSURE topic (standards, responsibility and available support) and its source-bound counterexample prompts. This permits bounded daily-rhythm writing, never medical or personal health inference. A policy-only source reference supports the symbolic boundary and cannot support a personal claim.

The attachment specifies eight T3-capable sections (S02–S09) but asks for nine lanes in its shadow matrix. The explicit section policy remains authoritative: 12 profiles × 2 locales × 8 T3 sections = 192 composition cases, plus 24 deterministic S01 control cases = 216 checks. Do not convert S01 or S10 into T3 just to reach a count. `shadow-matrix.json` registers the existing NOW benchmark plus eleven independent governed downstream campaign profiles, including incomplete hour, transition, absent annual/cycle, and mixed relationships. The incomplete-hour profile is rejected by the existing publication authority (18 checks); 176 section packs are callable. This generated inventory is not live acceptance. The runner stops on provider/infrastructure errors and records semantic rejections separately.

Real Preview probe at `fd7f65b9` / `https://4f239f5a.phios-github.pages.dev`: authenticated S02 English generation reached the existing model and semantic verifier, which rejected the candidate. The result was written to sandbox PRIVATE_REPORTS; reopening returned `cacheHit:true` with the same generation timestamp and no second model call. This validates connectivity and fail-closed private persistence, not T3 narrative acceptance. The first probe exposed omitted canonical counterexample prompts; the next evidence-pack revision includes them and retains detailed verifier diagnostics privately.

Remaining release evidence: successful real provider composition and semantic verification, full high/low/open/mixed/CUSTOM/NOW shadow corpus, bilingual claim/condition parity, accepted candidate browser/PDF checks, explicit per-section human decisions bound to snapshot digests, canary outcomes. No human decisions are synthesized. Current review PDFs may contain T2 fallback and cannot satisfy T3 human acceptance.

### Latest real Preview checkpoint — 2026-09-23

The owner-confirmed Preview OPENAI_API_KEY was used successfully through the existing route. This is no longer a credential/configuration blocker. The latest provider revision was deployed at `4ca07b4e` / `https://b72d8d8b.phios-github.pages.dev`.

| Probe | Outcome | Remaining defect |
| --- | --- | --- |
| English S02, expanded canonical evidence (`a7e9a912`) | REPAIR_EXHAUSTED after one repair | Individual claims were supported, but the text flattened ranked themes into an equal list. |
| English S02, explicit rank-preservation policy (`4ca07b4e`) | REPAIR_EXHAUSTED after one repair | Rank was preserved, but the candidate invented an ordered capability-development path, causal effects and an expanded counterexample; one block retained technical prose. |
| Chinese S02, same policy | SEMANTIC_REJECTED | Unsupported developmental sequence, causal support effects and a new counterexample. |

All results were retrieved from `phios-private-reports-sandbox`; no rejected narrative is admitted to customer pages. The current policy revision participates in the evidence digest, so old results cannot silently satisfy a changed contract. Further identical retries are blocked by the existing reservation; the one-repair ceiling has not been increased. The 216-check inventory is registered, but the full live matrix is **not complete**: expansion stopped at failed baseline quality. Current review/PDF content remains T2 fallback.

The current bilingual 36-page PDFs were rendered and visually inspected across all 72 pages; browser checks passed at 1440 and 390, with no page overflow, duplicate dynamic folios or footer overlap. These are layout/fallback checks, not accepted-T3 evidence. Targeted composition/parity/Preview regressions and the Pages build pass. See deployed-evidence.json for deployment and full-check evidence.

All `npm run check` phases passed: precheck and the main chain completed in the original run; the postcheck lifecycle fixture was manually interrupted because its old copy filter included `.tmp` deployment archives. After pruning scratch/dependency directories, the **entire postcheck phase** was rerun and exited 0. The initial interrupted command itself exited 1, so this is recorded as phased completion, not a fabricated uninterrupted exit 0. The fixture now cleans up its own temporary directory. Final QA runtime deployment: `49ed9d13` at `https://12dcee8f.phios-github.pages.dev`; its real authenticated bilingual-pair request returned 409 `BILINGUAL_ACCEPTED_PAIR_REQUIRED`, without a model call.

`node scripts/check-bazi-t3-production-gate.mjs` tests fail-closed behavior and reports all remaining gates. Add `--require-accepted` for a release-blocking exit code. `BAZI_R2_T3_ACCEPTED` and `BAZI_PRODUCTION_SUCCESSOR_ACTIVE` remain false.

Auth0 login and authenticated refresh passed again on 2026-09-23. The real QA logout still returned `post_logout_redirect_uri` not registered for the exact `/account/` URL in application `eSmR58lhvWkRCTyo7RdMxTuQzLM85Axr`; owner confirmation alone is not substituted for that failed live result.
