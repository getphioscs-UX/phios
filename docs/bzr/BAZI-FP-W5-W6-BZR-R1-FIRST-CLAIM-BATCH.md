# BaZi Full Production｜BZR-R1 first claim batch + W5/W6 engineering

Baseline: `abab6b358bff574c65b9dfacc7985d5de564d674`

## What changed

BZR-R1 now has a first 12-claim extraction batch covering month-command pattern logic, conditional pattern formation, pattern variation, climate cross-checking, Ti-Yong useful-god semantics, cold/warm and dry/wet climate separation, non-single-factor strength, and a San Ming Tong Hui Ten-God structural witness.

The claims remain **pending human source-fidelity review**. This is intentional: the existing BZR-R1 governance says a model may not self-admit rule claims. Source extraction therefore does not silently open production verdicts.

## W5

`bazi-pattern-runtime.js` now builds a deterministic month-command pattern candidate IR from the canonical BaZi chart, W4 Ten-God structure and W3 stem/branch relations. It records hidden-stem candidates, visible-stem matches and month-branch relation evidence. It does **not** establish a final 格局, transformation, quality score or life outcome before admitted rules exist.

## W6

Three school-qualified authority views are now registered:

1. `ZI_PING_MONTH_COMMAND_USE_v1`
2. `DI_TIAN_SUI_TI_YONG_BALANCE_v1`
3. `DI_TIAN_SUI_CLIMATE_TIAOHOU_v1`

The runtime exposes their evidence separately. It does not merge the different meanings of 用神, does not choose a useful god, and does not infer a tiaohou element from season alone.

## Human admission stop point

Review `content/interpretation/bazi/review/bzr-r1-claim-batch-001-human-review-v1.json` against the claim batch and cited source sections. Once human decisions are supplied, the admission registry and claim states can be promoted and W5/W6 production rule sets can be frozen.
