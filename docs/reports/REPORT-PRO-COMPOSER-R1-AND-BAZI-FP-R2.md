# REPORT-PRO-COMPOSER-R1 + BAZI-FP-R2

Status: ACTIVE FOUNDATION SUCCESSORS
Date: 2026-10-04

## 1. BAZI-FP-R2 | FINAL STRUCTURAL VERDICT

Purpose: add a successor verdict layer above the frozen BaZi W1–W19 baseline without mutating historical accepted digests.

Runtime owner:
- `functions/bzr-full-production/bazi-final-structural-verdict-r2.js`

Successor API:
- `functions/api/bazi-full-reading-r2.js`

Resolved verdict families:
- three-harmony configuration vs full elemental transformation
- Day Master multi-factor strength
- Zi Ping month-command primary pattern + formation path
- school-qualified useful-god views
- Zi Ping / Ti-Yong / Tiaohou remain distinct

GEN-01 controlled result:
- 申子辰水局：configuration established
- 寅申冲：retained as a modifier; full elemental erasure is not allowed
- 日主强弱：中和偏弱
- 主格局：伤官格
- formation path：伤官生财，保留承载条件
- primary report useful-god view：土为首，金为辅
- Tiaohou：火为 winter warming candidate, not silently merged with the primary useful-god verdict

GEN-01 authority:
- `docs/acceptance/bazi-paid-report/editorial/GEN-01-AUTHORITY-PACK-R2.json`

Historical W1–W19 remains immutable predecessor evidence. R2 is a successor authority, not a rewrite of old acceptance.

## 2. REPORT-PRO-COMPOSER-R1 | REFERENCE-GOVERNED LLM COMPOSER

Shared runtime owner:
- `functions/personal-reading/narrative/report-pro-composer-r1.js`

Reference owner:
- `functions/personal-reading/narrative/report-pro-reference-registry.js`

Policy registry:
- `config/reports/report-pro-composer-r1.json`

Provider routing:
- existing PHI OS PAI router
- production composition class: `T3_DEEP_COMPOSITION`
- current admitted DEEP route resolves to the currently configured available deep provider/model; the report method never hardcodes a provider.

Required chain:

```
METHOD CALCULATION
→ METHOD AUTHORITY PACK
→ SECTION OWNERSHIP CONTRACT
→ HUMAN-ACCEPTED EDITORIAL REFERENCE
→ T3 DEEP LLM COMPOSITION
→ INDEPENDENT SEMANTIC VERIFICATION
→ REFERENCE QUALITY / SECTION ISOLATION
→ CROSS-SECTION DUPLICATION
→ BILINGUAL PARITY WHEN REQUIRED
→ IMMUTABLE CUSTOMER DELIVERY SNAPSHOT
```

Deterministic prose is not an accepted production fallback for this successor.

## 3. Method policy

The same policy is registered for:
- BZR
- ZWR
- AST
- NUM
- PROFILE
- ECR
- HD
- CROSS

Current reference readiness:
- BZR: ACTIVE
- ZWR: ACTIVE
- AST: HUMAN-ACCEPTED REFERENCE REQUIRED
- NUM: HUMAN-ACCEPTED REFERENCE REQUIRED
- PROFILE: HUMAN-ACCEPTED REFERENCE REQUIRED
- ECR: HUMAN-ACCEPTED REFERENCE REQUIRED
- HD: HUMAN-ACCEPTED REFERENCE REQUIRED
- CROSS: HUMAN-ACCEPTED REFERENCE REQUIRED

A method without an accepted reference must return `CONTROLLED_NOT_READY_REFERENCE_REQUIRED`; it must not silently downgrade to deterministic prose and present that result as reference-grade customer output.

## 4. BaZi accepted editorial exemplar

- `docs/acceptance/bazi-paid-report/editorial/GEN-01-S01-HUMAN-ACCEPTED.md`

This exemplar is an editorial authority only. Its subject-specific BaZi facts must never be copied into another customer's report.

## 5. Delivery governance

`REPORT-PRO-COMPOSER-R1` is bound into:
- `functions/report-delivery/report-delivery-contract.js`
- `functions/report-delivery/report-delivery-r2.js`

Full-report delivery exposes:
- `referenceGovernedComposerRequired=true`
- `requiredComposerId=REPORT-PRO-COMPOSER-R1`
- `deterministicProseFallbackAllowed=false`

## 6. Checks

- `npm run check:bazi-fp-r2`
- `npm run check:report-pro-composer-r1`

Both are also included in the repository-level `npm run check`; BaZi FP R2 is additionally included in `npm run check:bazi-full-production`.

