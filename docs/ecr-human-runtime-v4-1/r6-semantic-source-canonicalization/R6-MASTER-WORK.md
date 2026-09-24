# ECR V4.1A｜SEMANTIC SOURCE CANONICALIZATION R6

Baseline: `e04c34cc5cc3248f7a0dc96a6cfc184ef4f54568`

Source: `人类图总结(4).xlsx`  
Workbook SHA256: `315833ed395989a9d79e633159d49bc4bf2038491b3a6341851e85a43f9fe823`

## R6 decision

R6 canonicalizes **source ownership and source identities**, not customer meaning.

The uploaded workbook is owner-provided for this work. It may be processed internally,
but this work does not grant public verbatim reuse of source text and does not turn the
workbook into calculation, medical, or automatic customer-meaning authority.

## R6 source ownership

```text
Gate base bilingual spectrum
→ 基因天命!A1:H65
→ 64 / 64

Gate long-form source
→ 基因天命!I1:L124
→ 64 / 64 zh-Hans
→ stored as digests, not copied verbatim into this delta

Gate × Line keywords
→ BG5!F2:K65
→ 384 / 384 zh-Hans
→ English Gate-specific keyword source NOT PRESENT in this workbook

Generic Line × sphere-role matrix
→ 爻!A1:O15
→ 6 × 14 bilingual
```

The duplicated BG5 spectrum columns do not own Gate base meaning. This resolves the
Gate 56 drift (`分心 / Distraction` vs BG5 `不安`) in favor of the primary bilingual
`基因天命` source without rewriting the source workbook.

## R6 completed

- 64/64 Gate base source canon.
- 64/64 Chinese long-form digest binding.
- 384/384 Chinese Gate×Line keyword source canon.
- 6/6 bilingual Line archetype source canon.
- 6×14 bilingual Line/sphere-role matrix.
- Purpose/Purpose duplicate English header recorded and disambiguated by the two distinct Chinese headers.
- 27-sheet workbook reality replaces the stale prior 23-sheet audit statement.
- Source conflicts separated from authority ownership.

## R6 intentionally NOT completed

The workbook does not provide a governed generic semantic definition for all ECR
planetary Drivers D1–D12.

Scoped occurrences such as:

```text
PERSONALITY SUN
Design Mars Line
North/South Node career-astrology material
```

cannot be generalized into D1–D12 runtime meaning.

Likewise, Personality and Design identities occur in the workbook, but a generic
semantic role definition for the two ECR layers is not source-canonicalized.

Therefore do not populate:

```text
planetaryDriverRoles meaningRef/tags
layerRoles meaningRef/tags
tagRules
runtimeOwnerRules
```

from guesswork.

## R6 authority boundary

Do NOT yet change:

```text
content/embodied-configuration/v4-1/semantic-admission-r2/composition-policy.json
customerProductionAdmitted
card selector runtime policy
topic customer narrative
```

R6 source canon feeds the next admission stage. It does not make
`resolveEcrSemanticComposition()` return admitted customer meaning.

## Next work

`ECR-V4.1A-R7-DRIVER-LAYER-TAG-OWNER-CANONICALIZATION`

R7 must create governed candidates for:

```text
12 Driver semantic roles
2 Layer semantic roles
semantic tag canon
tag composition rules
runtime-owner rules
```

Only after those are human admitted should R7/R8 bind the source-canon references into
the operational composition policy.

## Checks

```powershell
node scripts/check-ecr-v41-semantic-source-r6.mjs
npm run check
```

R6 PASS must still prove customer production remains closed.
