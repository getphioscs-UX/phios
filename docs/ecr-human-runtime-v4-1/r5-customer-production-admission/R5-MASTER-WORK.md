# ECR V4.1A｜Customer Production Admission R5

Baseline: `120f2968d55ecd245abc214ada40c964f9b479ac`

## 0｜Current conclusion

Do **not** set `customerProductionAdmitted=true` yet.

R4 correctly records:
- 5 bilingual ACCEPT / 9 REVISE;
- 43 card ACCEPT / 5 REVISE;
- M + A ACCEPT / D REVISE.

R5 converts that checkpoint into the final production-admission closure plan.

## 1｜R5-A — second owner review

Review the revised candidates only:

```text
Bilingual:
ORIENTATION
CARRIER_ARCHITECTURE
C1
C2
C3
C4
C5
CURRENT_REALITY
EVIDENCE

Phi Cards:
D06 BREAKTHROUGH
T01 OVERLOAD
T03 STALL
T06 LOOP
T07 WITHDRAWAL

Topic:
D selector revised rule
```

Do not re-review the already accepted unchanged material.

## 2｜R5-B — compositional semantic admission

Current repo state is intentionally empty:

```text
64 Gate bases        meaningRef=null / tags=[]
6 Line modifiers     meaningRef=null / tags=[]
12 Driver roles      meaningRef=null / tags=[]
2 Layer roles        meaningRef=null / tags=[]
tagRules             0
runtimeOwnerRules    0
```

The repo Gate/Line source registry is identity coverage, not canonical meaning.

An existing owner-curated source audit records a source workbook `Human Design Summary.xlsx`
with:
- Gene Key base spectrum 64/64;
- long form 64/64;
- Gate × Line source keywords 384/384;
- line × sphere-role source 6 × 14.

That source is still a `USER_CURATED_INTERPRETATION_SOURCE_CANDIDATE`.
Do not promote it automatically.

Required order:

```text
source provenance / permission
→ bilingual normalization
→ Gate base candidate
→ generic Line modifier candidate
→ Driver role candidate
→ Personality / Design role candidate
→ semantic tags
→ compositional tag rules
→ runtime-owner rules
→ human admission
→ runtime projection
```

## 3｜R5-C — Phi Card operational admission

Keep all 48 cards.

Owner eligibility decisions are not yet enough to select cards. Each selectable
row still needs:

```text
runtimeSlots
requiredSemanticTags
deterministic priority
digest-bound human admission
```

A selector with missing tag or priority evidence must return `UNKNOWN`.

## 4｜R5-D — Topic selection

Keep:

```text
M = P64 upper trigram structural evidence
A = independent A8 structural evidence
```

For D:

```text
physical body binding
!= personal topic salience
```

Required revised rule:

```text
physical body binding
+ admitted semantic composition
and/or explicit governed salience
→ personal D topic selection
```

D11 remains UNKNOWN while Chiron is unavailable.

## 5｜R5-E — rendered visual human acceptance

Required real rendered review:

```text
EN desktop
EN mobile
zh-Hans desktop
zh-Hans mobile
print / A4
Mandala 238° anchor
41 → 19 → 13 counterclockwise
all UNKNOWN disclosures
six runtime slots / Phi Card presentation
Current Reality observation + comparison only
```

Machine/local browser evidence is not human acceptance.

## 6｜R5-F — deployed Preview E2E

Required on an actually deployed Preview:

```text
customer route
locale switch
report entitlement state
free / paid boundaries
report rendering
Phi Card surface
Current Reality boundary
no internal IDs / debug prose
Back / Refresh
390px
1440px
print
```

Mark anything not executed `NOT_RUN`.

## 7｜R5-G — final cutover

Only when all remaining gates pass:

```text
14/14 bilingual ACCEPT
compositional semantic admission PASS
48-card operational binding PASS
D/M/A personal selector admission PASS
rendered visual human acceptance PASS
deployed Preview E2E PASS
```

then create a separate final release delta that changes:

```text
customerProductionAdmitted = true
structuralCustomerSurfaceAdmitted = true
production admission evidence refs
release decision
```

Do not combine that irreversible cutover with source canonicalization work.

## Verification

After extracting this delta:

```powershell
node scripts/check-ecr-v41-customer-production-admission-r5.mjs
npm run check
```

The R5 checker must PASS while still proving customer production is closed.
