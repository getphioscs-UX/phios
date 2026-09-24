# ECR V4.1A R4｜Owner Admission Apply Delta

Baseline: `228594a13148c8e0bca655be5813392388a6cb29`

This delta applies the owner's explicit R4 decisions as canonical **owner-decision
authorities** while preserving the existing fail-closed operational admission.

## Applied owner decisions

- Bilingual pairs: `5 ACCEPT / 9 REVISE / 0 REJECT`
- Phi Card eligibility: `43 ACCEPT / 5 REVISE / 0 REJECT`
- Topic D/M/A selector rules: `2 ACCEPT / 1 REVISE / 0 REJECT`

The nine revised bilingual texts are now live in
`functions/ecr-full-report/ecr-human-runtime-report-v4-1.js`.

## Important governance boundary

`REVISE` does not mean the revised candidate is silently ACCEPTED.

Therefore:
- the nine revised bilingual pairs require a new digest-bound owner acceptance;
- the five revised card mappings require a new owner acceptance;
- the revised D selector rule requires a new owner acceptance;
- the operational `semantic-admission-r2/card-eligibility.json` is intentionally
  unchanged because required semantic tags and deterministic priorities are still
  not admitted;
- Current Reality remains observation + comparison only;
- Chiron D11 remains UNKNOWN;
- customer production admission remains false.

This avoids converting an owner revision request into an accidental release.

## Files added

Canonical owner-decision registries:
- `content/embodied-configuration/v4-1/admission/ecr-bilingual-review-owner-decisions-r4.json`
- `content/embodied-configuration/v4-1/admission/ecr-phi-card-runtime-slot-owner-decisions-r4.json`
- `content/embodied-configuration/v4-1/admission/ecr-topic-personal-selection-owner-decisions-r4.json`
- `content/embodied-configuration/v4-1/admission/ecr-owner-admission-ledger-r4.json`

Modified:
- `functions/ecr-full-report/ecr-human-runtime-report-v4-1.js`
- `scripts/check-ecr-v41a-admission-workspace.mjs`

## Verification

After extracting to repo root:

```powershell
npm run check
```

No separate authority-bundle regeneration is required because this R4 delta does
not mutate an authority-bundled operational registry.

If `npm run check` passes, Commit & Push the delta.

## Next gate

After R4:
1. re-review the 9 revised bilingual pairs;
2. re-review the 5 revised card mappings;
3. re-review the revised D selector;
4. complete compositional semantic admission;
5. rendered visual human acceptance;
6. deployed Preview E2E;
7. only then make a release decision.
