# BOOK-V-CIV-ATLAS-R1-M1-W4C

# Civilization Static Visual Asset Authority

## Canonical Master Work Step v1.0.0

Status: **READY FOR IMPLEMENTATION**  
Scope: Book V / Civilization Atlas / Static Visual Authority  
Authority mode: **Registry-first, image-non-authoritative**  
Canonical asset population target: **436 planned assets**  
Canonical production batches: **48 batches**  
Case authority: **existing** `**CA-***` **Registry only**  
Schema freeze and asset production are intentionally decoupled.

---

# 0. Canonical Placement

```
W4A Structured Dynamic Projection
        ↓
W4B Premium Dynamic Visual Styling
        ↓
W4C Civilization Static Visual Asset Authority
        ↓
W4D Visual Binding & Composition
        ↓
W5–W6 Ask Recovery / Regression
        ↓
W7 Customer Acceptance / Freeze
```

If W5–W6 already exist, do not roll them back.

After W4C and W4D:

```
re-run W5–W6 regression
        ↓
W7 acceptance
```

---

# 1. Non-negotiable Authority Rule

> **Image illustrates Registry. Registry never learns from Image.**

All static visuals MUST satisfy:

```
historicalAuthority = false
canonicalAuthority = false
registryWriteAuthority = false
ocrWriteBackAllowed = false
containsCanonicalText = false
localeDependency = NONE
```

Allowed:

```
historical atmosphere
civilization recognition
editorial illustration
background support
visual orientation
case recognition
map base
conceptual motif
```

Forbidden:

```
image text becoming historical evidence
reverse-inference of facts from generated images
AI image deciding civilization borders
AI image deciding trade routes
AI image deciding population
AI image deciding dates
AI image deciding rankings
OCR writing generated-image content back into Registry
```

---

# 2. Canonical W4C Execution Order

This section is the only authoritative W0–W9 sequence.  
Any earlier alternate numbering is retired.

## W4C-W0｜Authority Boundary Freeze

Freeze the image/registry authority boundary above.

Acceptance:

```
zero historical authority from image
zero registry write-back from image or OCR
zero geography authority from generated image
zero canonical text authority from image
```

## W4C-W1｜Asset Registry Freeze

W1 owns all three structural contracts:

1. canonical asset taxonomy;
    
2. canonical asset ID contract;
    
3. planned asset registry records.
    

### W1.1 Canonical Asset Taxonomy

There are **14**, not 13, canonical families:

```
TIMELINE_ANCHOR
CASE_HERO
CASE_SECONDARY
WORLD_SNAPSHOT_ATMOSPHERE
COMPARISON_FAMILY
TRAJECTORY_MOTIF
TRANSITION_WINDOW
SCALE_SHIFT
LOSS_FAMILY
LOSS_TYPE_VIGNETTE
CIVILIZATION_INFRASTRUCTURE
GEOGRAPHIC_BASE
HISTORICAL_FIGURE
MODERN_FLAG
```

Do not create uncontrolled families such as:

```
random-poster
misc-image
history-image
book5-picture
```

### W1.2 Canonical Asset ID Contract

Timeline:

```
VIS-CIV-T00-HERO
...
VIS-CIV-T19-HERO
```

Case assets MUST bind existing Case Registry IDs:

```
VIS-CIV-<existing-CA-ID>-HERO
VIS-CIV-<existing-CA-ID>-SECONDARY
```

Example only:

```
CA-T07-05
→ VIS-CIV-CA-T07-05-HERO
→ VIS-CIV-CA-T07-05-SECONDARY
```

**Never persist** `**C001–C120**` **as a second Case authority.**

The prior `C001–C120` list is production-planning prose only.

World Snapshot:

```
VIS-CIV-WS-M3000-ATMOSPHERE
...
VIS-CIV-WS-2026-ATMOSPHERE
```

Comparison / Trajectory / Loss IDs MUST preserve the IDs already present in their current canonical registries.

Transition:

```
VIS-CIV-TW-01
...
VIS-CIV-TW-32
```

Scale Shift:

```
VIS-CIV-SS-01
...
VIS-CIV-SS-07
```

### W1.3 Registry File

Create / maintain:

```
content/civilization-atlas/visuals/
  civilization-visual-asset-registry-v1.json
```

Minimum authority block:

```
{
  "schemaVersion": "PHI-OS-CIVILIZATION-VISUAL-ASSET-REGISTRY-v1.0.0",
  "status": "ACTIVE",
  "authority": {
    "visualIsHistoricalAuthority": false,
    "registryIsSourceOfTruth": true,
    "ocrMayWriteRegistry": false,
    "generatedImageMayDefineGeography": false,
    "generatedImageMayDefineHistoricalClaim": false
  }
}
```

Minimum per-asset fields:

```
assetId
family
subjectId
visualRole
aspectRatio
containsText
localeDependency
historicalAuthority
preferredOverlayZone
status
reviewState
bindingState
bucketKey
fallback
```

Canonical planned population: **436 assets**.

## W4C-W2｜Prompt Canon Freeze

Create / maintain:

```
content/civilization-atlas/visuals/
  civilization-visual-prompt-canon-v1.json
```

Store **14 reusable templates**, not hundreds of one-off prompts:

```
TIMELINE_ANCHOR_TEMPLATE
CASE_HERO_TEMPLATE
CASE_SECONDARY_TEMPLATE
WORLD_SNAPSHOT_TEMPLATE
COMPARISON_TEMPLATE
TRAJECTORY_TEMPLATE
TRANSITION_TEMPLATE
SCALE_SHIFT_TEMPLATE
LOSS_FAMILY_TEMPLATE
LOSS_TYPE_TEMPLATE
INFRASTRUCTURE_TEMPLATE
MAP_BASE_TEMPLATE
HISTORICAL_FIGURE_TEMPLATE
FLAG_TEMPLATE
```

Per asset, parameterize only governed subject data such as:

```
subject
historicalPeriod
visualFocus
mustInclude
mustAvoid
```

Global generation rule:

```
no canonical text in image
no poster-like body copy
no invented labels
no modern anachronism unless subject requires modernity
leave usable overlay/readability space
```

## W4C-W3｜Batch Manifest Freeze

Create / maintain:

```
content/civilization-atlas/visuals/
  civilization-visual-batch-manifest-v1.json
```

Each batch MUST contain **6–10 assets**, except a naturally smaller terminal/family batch.

Canonical production manifest: **48 batches**.

Case batching MUST be generated by:

```
read current civilization-case-registry-v1.json
        ↓
preserve current Registry order
        ↓
chunk 10 records per batch
        ↓
derive VIS-CIV-<CA-ID>-HERO / SECONDARY
```

Do not manually recreate case ordering from prose.

## W4C-W4｜Core Pack Production

W4 is the first production wave.

### W4A｜Atlas Shell Core

Produce first because these immediately improve the Atlas shell:

```
Timeline Anchors
World Snapshots
Comparison Families
Transition Windows
Loss Families
Geographic Bases
```

### W4B｜Case Hero Core

Then produce all 120 Case Hero assets directly from the current Case Registry.

No Case Hero may be generated from a prose-only `C001–C120` ID.

## W4C-W5｜Extended Pack Production

Produce the supporting library:

```
120 Case Secondary
16 Trajectory Motifs
7 Scale Shift visuals
24 Loss Type vignettes
20 Infrastructure visuals
16 Historical Figures
24 Modern Flags
```

Historical figures and flags remain assistive, not narrative authority.

## W4C-W6｜Human Review

Every produced visual receives exactly one of:

```
ACCEPT
REVISE
REJECT
```

Review six criteria:

```
1. Subject identity correct
2. Period plausibility
3. No obvious anachronism
4. No unwanted text
5. Good overlay/readability space
6. Fits PHI OS premium visual language
```

Only `ACCEPT` may advance to binding.

## W4C-W7｜R2 Upload & Binding Authority

Do not upload production assets before human acceptance.

Canonical object layout:

```
images/civilization-atlas/
  timeline/
  cases/
  cases-secondary/
  snapshots/
  comparison/
  trajectories/
  transitions/
  scale-shifts/
  loss/
  loss-types/
  infrastructure/
  maps/
  figures/
  flags/
```

Examples:

```
images/civilization-atlas/timeline/VIS-CIV-T06-HERO.webp
images/civilization-atlas/cases/VIS-CIV-CA-T06-02-HERO.webp
images/civilization-atlas/transitions/VIS-CIV-TW-18.webp
```

Accepted asset transition:

```
reviewState = ACCEPTED
        ↓
bucketKey = resolved canonical R2 key
        ↓
bindingState = READY_TO_BIND / BOUND
```

## W4C-W8｜HTML/SVG Binding & Regression

Bind only human-accepted assets into:

```
atlas shell
timeline layer
case registry cards
world snapshots
comparison views
trajectory views
transition windows
loss atlas
map layers
```

Images remain subordinate to structured HTML/SVG.

Every binding MUST retain:

```
fallback = STRUCTURED_HTML_SVG
```

After W8:

```
re-run W5–W6 Ask regression
re-run visual/binding checker
verify all active bucket keys
verify locale independence
verify no generated-image text is treated as data
```

## W4C-W9｜Static Visual Authority Freeze

Freeze conditions:

```
436 planned asset records exist
all records bind canonical subject IDs
zero second Case ID system
zero poster authority
zero OCR authority
all 14 prompt templates versioned
all 48 batches manifest-controlled
all uploaded assets are human accepted
all active bucket keys resolve
structured HTML/SVG fallback exists
```

Important:

```
Registry schema = FROZEN
Asset population = CONTINUOUS
```

The schema may freeze before all 436 visuals are produced.

---

# 3. Canonical Asset Population

|Family|Planned assets|
|---|---|
|`TIMELINE_ANCHOR`|20|
|`CASE_HERO`|120|
|`CASE_SECONDARY`|120|
|`WORLD_SNAPSHOT_ATMOSPHERE`|15|
|`COMPARISON_FAMILY`|6|
|`TRAJECTORY_MOTIF`|16|
|`TRANSITION_WINDOW`|32|
|`SCALE_SHIFT`|7|
|`LOSS_FAMILY`|6|
|`LOSS_TYPE_VIGNETTE`|24|
|`CIVILIZATION_INFRASTRUCTURE`|20|
|`GEOGRAPHIC_BASE`|10|
|`HISTORICAL_FIGURE`|16|
|`MODERN_FLAG`|24|
|**TOTAL**|**436**|

The previously stated total of 416 is retired because the listed family counts sum to **436**.

---

# 4. Canonical 48-Batch Manifest

|Batch range|Family|Batches|Assets|
|---|---|---|---|
|B01–B02|`TIMELINE_ANCHOR`|2|20|
|B03–B14|`CASE_HERO`|12|120|
|B15–B26|`CASE_SECONDARY`|12|120|
|B27–B28|`WORLD_SNAPSHOT_ATMOSPHERE`|2|15|
|B29|`COMPARISON_FAMILY`|1|6|
|B30–B31|`TRAJECTORY_MOTIF`|2|16|
|B32–B35|`TRANSITION_WINDOW`|4|32|
|B36|`SCALE_SHIFT`|1|7|
|B37|`LOSS_FAMILY`|1|6|
|B38–B40|`LOSS_TYPE_VIGNETTE`|3|24|
|B41–B42|`CIVILIZATION_INFRASTRUCTURE`|2|20|
|B43|`GEOGRAPHIC_BASE`|1|10|
|B44–B45|`HISTORICAL_FIGURE`|2|16|
|B46–B48|`MODERN_FLAG`|3|24|
|**TOTAL**||**48**|**436**|

All batches remain capped at 10 assets, except naturally smaller batches.

---

# 5. Authority Chain

The Book V content authority chain is:

```
Book V Manuscript
        ↓
Canonical / governed extraction
        ↓
Timeline / Case / Comparison / Snapshot /
Trajectory / Transition / Loss Registries
        ↓
Dynamic HTML / SVG Atlas
        ↓
Static Visual Projection
        ↓
Ask PHI OS / Explorer / Comparison / Deep Link
        ↓
Selective Articles where useful
```

Article is a derivative projection, never the source from which Atlas authority is reconstructed.

Correct:

```
Manuscript / governed extraction
        ↓
Atlas Registries
        ↓
Dynamic HTML / SVG Atlas
        ↓
optional Article projection
```

Incorrect:

```
Manuscript
        ↓
full Article conversion
        ↓
Atlas reconstruction from Article
```

---

# 6. Implementation Guardrails

The implementation MUST fail closed if any of the following occurs:

```
a generated image attempts to write a historical fact
OCR output attempts to update a registry
a case asset references a non-canonical C001-style ID
an uploaded asset lacks ACCEPT review state
a bucket key is active but unresolved
an asset with containsText=true is promoted as canonical data
an image is used when structured HTML/SVG fallback is absent
a batch exceeds 10 assets without an explicit approved exception
the manifest total diverges from registry planned population
```

---

# 7. Checker Contract

Recommended checker:

```
scripts/check-book-v-civ-atlas-r1-m1-w4c.mjs
```

It SHOULD assert at minimum:

```
14 canonical families
436 planned asset records
48 batches
all batches <= 10 assets except explicit governed exception
120 CASE_HERO records derived from current CA-* registry
120 CASE_SECONDARY records derived from current CA-* registry
zero C001–C120 persisted IDs
zero historicalAuthority=true
zero canonicalAuthority=true
zero registryWriteAuthority=true
zero ocrWriteBackAllowed=true
all prompt templates versioned
all uploaded/bound assets reviewState=ACCEPTED
all bound assets have resolvable bucketKey
all assets have structured fallback
```

Do not hardcode invented Case IDs. Read the current Registry and compare by identity/order.

---

# 8. Definition of Done

W4C is complete when:

```
authority boundary frozen
asset taxonomy + IDs frozen
asset registry schema frozen
prompt canon frozen
48-batch manifest frozen
production workflow defined
human review gate enforced
R2 upload authority enforced
HTML/SVG binding authority enforced
checker passes
schema frozen with continuous population allowed
```

This does **not** require all 436 images to have already been generated.

End state:

> **A maintainable Civilization Visual Asset Library whose images enrich the Atlas without ever becoming a second historical authority.**