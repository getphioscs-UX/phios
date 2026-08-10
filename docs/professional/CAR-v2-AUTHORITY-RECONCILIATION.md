# PHASE CAR｜Canonical Asset Runtime v2 Authority Reconciliation

Baseline: `d5266251b43fc1497ab60959203c7a21b129acdf`

Status: `PRESERVED`

This reconciliation is a delta-only authority interpretation. It does not rebuild CAR, replace the CAR-W18 freeze, activate production, write Published Asset records, enable providers, implement ALR, or rebuild CPR.

## Canonical authority model

| Runtime | Canonical role | Owns | Does not own |
| --- | --- | --- | --- |
| CAR | Asset Production Authority | Asset Brief → Candidate → Review → Approval → Rights/Accessibility → Published Asset eligibility/projection | Learning state, capability state, canonical presentation, layout, rendering |
| ALR | Learning Runtime | Lesson, practice, assessment, progression and capability runtime state when ALR is implemented | Asset production, approval or publication |
| CPR | Presentation Runtime | Canonical presentation, composition, layout, responsive/accessibility projection, PDS mapping and rendering | Asset production, review, approval or publication eligibility |

## Reconciled interpretation

### CAR-W7｜Slides and Academy

The following outputs remain CAR Asset Briefs:

- Lesson Brief
- Slides Brief
- Quiz Brief
- Assignment Brief

`CAR Lesson Brief != ALR Lesson Runtime`. A CAR brief cannot enroll a learner, create an assessment result, advance progression, or promote capability.

### CAR-W8｜Website Module Projection

Website Module Projection remains a published-only asset projection input. It is not Canonical Presentation and cannot own layout or rendering.

### CAR-W9｜Provider Routing

The preserved effective policy remains:

```text
providersEnabled = false
networkCallsEnabled = false
paidOverageDisabled = true
providerMayCreatePublishedContent = false
```

### CAR-W10-W14｜Candidate to Publication

The independent fail-closed lifecycle remains:

```text
Asset Brief
→ Candidate
→ Independent Review
→ Independent Approval
→ Rights Gate
→ Accessibility Gate
→ Published Asset
```

### CAR-W15-W17｜Surface Projection

Legacy CAR labels are preserved in their frozen files, but their authority interpretation is narrowed:

- `CAR Surface Composition` means a Published Asset Projection Bundle only.
- `CAR Presentation Type` means asset lineage or eligibility classification only.
- `CAR PDS Integration` means PDS eligibility and reference validation only.

CAR may decide whether an already Published Asset is eligible for a surface and may project its references. CPR alone creates Canonical Presentation, composition, layout, responsive/accessibility presentation, PDS mapping and rendering.

### CAR-W18｜Freeze

`content/professional/canonical-asset-runtime/freeze/car-w18-freeze-v1.json` remains the existing CAR freeze. This reconciliation creates no replacement freeze.

## Validation

Run:

```powershell
npm run check:car-reconciliation
npm run check:car-preserved
npm run check
```

The checker verifies the baseline SHA, authority map, W7-W18 semantics, provider flags, lifecycle separation, CPR boundary and byte digests of protected CAR/CPR/governance artifacts.
