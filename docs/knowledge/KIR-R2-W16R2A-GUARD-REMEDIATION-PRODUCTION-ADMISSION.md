# KIR-R2-W16R2A｜Guard Remediation & Production Admission

Baseline: `d49dd16b38d7f858c9bad861b788919d0dec4c33` (`B05`).

## Why this successor exists

W16R2 completed a real 100-case live model campaign. Human review accepted 93/100 with 0 critical failures, so the human acceptance threshold passed. Production nevertheless remains closed because the machine successor guard reported 100/100 pass while human review found seven false negatives.

This successor does not rewrite W16R2 or its historical review. It closes the observed guard gap and requires a focused 7-case live regression before production admission.

## Remediated failure classes

1. model artifact leakage such as `-reasoning, E4...`;
2. trailing underscore / model residue contamination;
3. unexpected English leakage in Simplified Chinese customer answers;
4. unsupported psychological or biological expansion;
5. self-diagnostic framing not present in admitted evidence;
6. unsupported strong-causal wording such as “只能…被迫…”, “反而会更…”, or “最终只…” when absent from evidence.

## Boundary

PHI OS remains the knowledge authority. Luna and DeepSeek remain composers only. The guard uses the question and admitted Evidence Pack to distinguish evidence-present terminology from model-added high-risk content.

## Admission sequence

Run the normal machine gates first, then run only the seven known false-negative cases:

```powershell
node scripts/check-kir-r2-w16r2-model-backed-successor.mjs
node scripts/run-kir-r2-w16r2a-targeted-regression.mjs
node scripts/check-kir-r2-w16r2a-targeted-regression.mjs
```

The targeted live result must then receive a 7/7 human spot review. The already completed 100-case human review does not need to be repeated. Wider `check:kir-r2:phase2`, `check:integrated-phase2`, and top-level `npm run check` remain required in the real Git checkout.

## Current state

`ENGINEERING_READY_TARGETED_LIVE_REVIEW_PENDING`

Production cutover remains closed until targeted live + human spot acceptance are complete.
