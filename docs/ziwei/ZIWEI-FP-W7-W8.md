# ZIWEI-FP-W7 / W8 checkpoint

Baseline: `c9f0970d7f3148924e85ee1735139558f0cad140` (`ast full`).

## W7 | Star Combination Runtime

W7 is now a deterministic structural layer over the already-governed W3–W6 outputs. It does not create a second Zi Wei projection and it does not translate co-presence into customer meaning.

The runtime binds:

- all 28 stars in the current Full Production engineering scope;
- same-palace star pairs;
- opposite-palace, triad-palace and adjacent-palace star pairs;
- the 12 palace relationship networks from W6;
- explicit W4 star-state classifications;
- natal, Da Xian and Liu Nian W5 transformation bindings;
- flank context and empty-palace opposite references without copying stars into an empty palace.

The deterministic validation fixture produces 25 same-palace star pairs and 160 network-related star pairs. These counts are fixture evidence, not universal chart constants.

W7 explicitly does not create traditional 格局 names, numeric combination strength, good/bad classification, fortune outcome or customer interpretation.

## W8 | Pattern Runtime

The W8 matcher is implemented as a registry-driven predicate engine. It separates two things that must not be conflated:

1. `structuralCandidates`: engineering-visible features such as multiple main stars in one palace, an empty main-star palace, or the same star carrying transformations across time layers. These are **not** traditional 格局.
2. `traditionalPatterns`: only rules from a versioned registry whose source claims have been Human-admitted may qualify here.

Supported predicate vocabulary in v1:

- `SAME_PALACE_STARS`
- `STAR_IN_PALACE`
- `STAR_IN_PALACE_BRANCH`
- `STAR_STATE_IN`
- `FLANK_STARS_AROUND_PALACE`
- `NETWORK_HAS_STARS`
- `TRANSFORMATIONS_IN_NETWORK`

Pending or unreviewed rule registries fail closed. `TEST_ONLY` rules may execute only under `INTERNAL_VALIDATION` so the matcher can be mechanically verified without opening Production authority.

## Pattern Source-Claim Batch 002

Eleven classical structural pattern claims have been extracted as review candidates from the existing `紫微斗数全书` witness lineage:

- 紫府同宫
- 禄马交驰
- 贪铃并守
- 贪火相逢
- 君臣庆会
- 金舆扶驾
- 巨机同宫
- 武曲守垣
- 日出扶桑
- 月朗天门
- 财禄夹马

The extracted claims intentionally omit rank, wealth, disaster, longevity, status and other outcome language found in the classical text. Batch 002 currently remains `EXTRACTED_PENDING_HUMAN_REVIEW`, with `runtimeUseAllowed=false` for all 11 claims.

Human review therefore confirms only source fidelity, rule normalization and school attribution. It does not validate Zi Wei doctrine empirically and does not approve customer interpretation.

## Current stop point

- W0–W6: previous governed checkpoint retained.
- W7: `ENGINEERING_COMPLETE_STRUCTURAL_COMBINATION_FROZEN`.
- W8 matcher: `MATCHER_ENGINEERING_COMPLETE`.
- W8 traditional pattern rules: `PENDING_SOURCE_ADMISSION`.
- Customer cutover: blocked.
- Next gate: Human Source-Fidelity Review for `ZIWEI-SOURCE-CLAIM-BATCH-002-PATTERNS`.

## Validation

Run:

```sh
npm run check:ziwei-fp-w7-w8
npm run check:ziwei-full-production
npm run check:zwr-batch9
npm run check:zwd-w0-w9
npm run check:cx-r12r4b:smr-zwr
```

On a ZIP without `.git`, full `npm run check` is expected to stop when a legacy checker invokes `git rev-parse`; that environment failure must not be reported as a W7/W8 assertion failure.
