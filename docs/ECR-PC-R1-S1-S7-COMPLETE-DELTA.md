# ECR-PC-R1｜PHI Card Customer Presentation — S1–S7 Complete Delta

Baseline: `343773fd6fb61fbf1b37aa861537d7e8f091ec24`

This delta completes the ECR PHI Card productization implementation around the already-admitted ECR result. PHI Cards remain a presentation layer and do not replace the ECR report or create a second meaning authority.

## Current authority

- S1: 48-card registry remains six groups × eight cards. A v2 successor freezes the customer-approved naming corrections while preserving the historical v1 artifact.
- S2: customer copy contract v2 freezes card-front/customer-reading boundaries and explicitly forbids new ECR meaning, fortune prediction, current-reality invention and internal codes on the default surface.
- S3: deterministic mapping matrix v2 remains ECR `CUSTOMER_PUBLISHABLE` only. Random draw is forbidden.
- S4: 6-card visual pilot recorded complete.
- S5: 12-card second visual batch recorded complete and superseded for final visual authority by S6.
- S6: 48 illustrations recorded complete. `ecr-phi-card-asset-registry-v1.json` freezes the canonical WebP names under `images/phi-cards/`.
- S7: 12 deterministic six-card benchmark spreads are generated from admitted ECR human-review fixtures, balanced 6 English + 6 zh-Hans. Runtime card reading copy consumes frozen card meaning plus accepted ECR interpretation evidence and preserves the full report as authority.

## Current card-name corrections

Historical S1 contained three presentation-name drifts. They are corrected only in the v2 successor:

- `ECR-PC-D08`: `召唤 / CALLING` (not `牵引 / PULL`)
- `ECR-PC-G07`: `调整 / ADAPT` (customer-facing Chinese title)
- `ECR-PC-T07`: `封闭 / WITHDRAWAL` (avoids collision with PHASE `CLOSURE`)

The original v1 authority is preserved unchanged for history.

## Asset authority

Bucket: `phios-public-assets`

Canonical prefix:

```text
images/phi-cards/
```

Naming rule:

```text
phi-card-{card-id-lower}-{english-slug}-v1.webp
```

Examples:

```text
images/phi-cards/phi-card-c01-forming-v1.webp
images/phi-cards/phi-card-d08-calling-v1.webp
images/phi-cards/phi-card-t07-withdrawal-v1.webp
images/phi-cards/phi-card-p08-closure-v1.webp
```

R2 network/object verification is intentionally not part of this delta. The bucket infrastructure is treated as already verified, and upload of the 48 registered WebP objects is a deployment responsibility.

## S7 benchmark and human gate

Generated review package:

```text
content/ecr-phi-card/benchmark/ecr-phi-card-benchmark-v1.json
content/ecr-phi-card/review/ecr-phi-card-human-review-v1.html
content/ecr-phi-card/review/ecr-phi-card-human-review-results-v1.json
```

The benchmark currently has 12 cases and 72 card slots, selecting 37 unique cards from real admitted ECR fixtures. It is designed to review:

- card fit
- runtime-copy clarity
- non-repetition
- customer language
- tension boundary
- phase boundary
- report complementarity
- visual-meaning fit

Human acceptance is not fabricated. Current state is `0/12 accepted, 12 pending`.

Customer admission therefore remains fail-closed in:

```text
content/ecr-phi-card/admission/ecr-phi-card-customer-admission-v1.json
```

When the human review is actually `12/12 ACCEPTED`, update the results artifact and customer-admission artifact in a successor commit.

## Runtime

`functions/ecr-phi-card/ecr-card-reading.js` composes the six-group customer spread:

```text
Accepted CUSTOMER_PUBLISHABLE ECR result
  -> deterministic PHI Card selector
  -> one card from each of CORE / DRIVER / GIFT / TENSION / FIELD / PHASE
  -> canonical asset ref
  -> frozen card customer meaning
  -> accepted ECR contextual evidence
  -> customer card reading
```

Boundaries are explicit:

```text
random draw = false
new ECR meaning = false
current reality inference = false
tension rendered as current fact = false
phase rendered as future prediction = false
full ECR report remains authoritative = true
```

## Commands

```text
npm run generate:ecr-phi-card-r1-s7
npm run check:ecr-phi-card-r1
```

Historical S1–S3 checker remains available:

```text
npm run check:ecr-phi-card-r1-s1-s3
```

No full repository `npm run check` claim is made from the supplied ZIP because it does not contain `.git`; history-dependent repository gates must run in the real Git worktree.
