# PHASE PR v2｜Professional Runtime

Baseline: `9cd28c6ad24ebffeeb553cfe65fb572ef562d3ed`

Status: `UPGRADED`

## Authority

PR preserves the existing Professional authority and upgrades it into one canonical
case-bound lifecycle. It does not replace PWS, RDG, RRE, JR, RR, ALR or the Method
Shared Professional Runtime.

The canonical sequence is:

```text
PWS Assignment + Consent + Service + Capability/Credential
        ↓
PR Case Context
        ↓
Governed Evidence Package
        ↓
Professional Observation
        ↓
Professional Judgment
        ↓
Professional Recommendation
        ↓
Decision Package
        ↓
Review
        ↓
Approval
        ↓
Signature
        ↓
Release
```

Strict lifecycle:

```text
DRAFT → REVIEWED → APPROVED → SIGNED → RELEASED
```

No state may be skipped.

## Key boundaries

- Raw Data is not Evidence.
- Reality Readout is not Professional Judgment.
- Metric is not Professional Judgment.
- Professional Observation is not System Readout.
- Only PR-W4 creates `PROFESSIONAL_JUDGMENT_RECORD`.
- Observation, Recommendation, Review, Approval, Signature, Audit and Release use
  bounded `OUTCOME_RECORD` subtypes under the existing RDG PR write authority.
- `caseId` is a canonical PR context identifier bound to an active PWS Assignment.
  It does not create or promote a PWS canonical `Case` object.
- ALR learning capability may be lineage/evidence, but Professional permission must
  come from Capability/Credential authority.
- Account role never grants Professional competence.

## Checks

```powershell
node scripts/apply-pr-v2-package-scripts.mjs
npm run check:pr
npm run check:rr
npm run check:rre
npm run check
```
