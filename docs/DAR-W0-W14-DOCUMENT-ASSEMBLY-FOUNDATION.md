# DAR-W0–W14 Document Assembly Foundation

Baseline: `812d7c820318be5bc4376888f15447a5cf05fb88`

This batch establishes DAR as document assembly governance, not legal judgment, clause generation, or execution authority.

## Frozen boundary

`DAR = approved structured inputs + approved clause authority + deterministic assembly + document lifecycle`.

DAR cannot invent legal clauses, change legal effect, infer jurisdiction or people, silently fill missing data, or rebalance shares.

## Current production posture

- No clause has approved legal text.
- Malaysia is registered as `LEGAL_VALIDATION_REQUIRED_BEFORE_PRODUCTION`.
- Export is blocked by jurisdiction eligibility until later legal admission exists.
- W13 execution observations are reference-template observations only and are not a claim of Malaysian legal requirements.
- Will data is `HIGHLY_SENSITIVE`, private by default, no public R2 Will object, no URL/query PII, no analytics payload leakage.
- The current aligned archive does not contain `Full Set of Will Example.docx`; W9 therefore registers only the section inventory supplied in the work step. It does not claim a text-level source audit.

## Check

```bash
node scripts/check-dar-w0-w14-document-assembly-foundation.mjs
```

`check:dar` is intentionally not added to `package.json`; that remains DAR-W24 final acceptance/freeze work.
