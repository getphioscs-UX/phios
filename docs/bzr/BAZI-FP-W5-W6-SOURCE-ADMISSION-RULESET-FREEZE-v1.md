# BAZI-FP W5/W6 · BZR-R1 Source Admission + Ruleset Freeze

Baseline: `07d01b39a98d07ff237f1516852f3b29d058a47e` (`ast-W2`).

## Human source admission

BZR-R1 claim batch 001 has a completed human review by TL. All 12 claim IDs are ADMIT. The original extracted batch and protected W0-W4/current-authority predecessors remain unchanged; the admitted state is carried by successor files.

Current source chain:

`v1 extracted claims -> human review result -> admission record -> v1.1 admitted claims -> v1.1 source/admission/coverage successors -> frozen W5/W6 rulesets`

Admission is source-fidelity + school-attribution admission only. It does not assert empirical truth and does not authorize unsupported prediction or rule gap filling.

## W5 freeze

Frozen ruleset: `content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v1.json`.

It authorizes month-command starting context, candidate-family classification, 顺用/逆用/special treatment exposure, explicit variation stage, 建禄/月劫 special routing, and no automatic quality score. Batch 001 does **not** contain exhaustive 成败救应 condition tables, so automatic primary-pattern formation remains unresolved/fail-closed.

## W6 freeze

Three school-specific foundation rulesets are frozen separately:

- `bazi-zi-ping-month-command-use-ruleset-v1.json`
- `bazi-di-tian-sui-ti-yong-ruleset-v1.json`
- `bazi-di-tian-sui-tiaohou-ruleset-v1.json`

The runtime may now expose source-admitted school-qualified rule evaluation. It still may not invent a final useful-god element, priority list, moisture verdict, or tiaohou element where Batch 001 lacks element-specific selection authority. No cross-school majority vote or silent merge is allowed.

## Successor-only protection

The AST/SMR W0-W2 package on this baseline freezes historical W0-W4 files. This delivery therefore does not mutate `bazi-source-admission-registry-v1.json`, `bazi-source-registry-v1.json`, `bazi-source-coverage-matrix-v1.json`, the protected W0-W4 roadmap/checker, or `package.json`; current authority is published through v1.1 successor files.

## Next

W7 Da Yun successor integration can proceed. In parallel, later source batches should fill (1) detailed W5 formation/support-damage-rescue conditions and (2) W6 element-selection/priority rules before automatic final W5/W6 verdicts are exposed to W9-W15 composition.
