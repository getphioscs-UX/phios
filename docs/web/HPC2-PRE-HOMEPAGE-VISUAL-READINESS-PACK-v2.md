# PHI OS｜HPC2-PRE Homepage Visual Readiness Pack｜Master Work Step v2.0｜FINAL CANONICAL

> Status：FINAL CANONICAL ALIGNMENT
>  Current reconciliation baseline：`203edecf98763e27897c35aae2768d1a69b674d2`
>  Purpose：把原 HPC2-PRE v2.0 完整对齐 Hero / Figure canonical asset contract，同时保留 R2 Truth、RJX Phase 19、Public Asset Resolver、Actual Homepage Consumption 与 Browser Acceptance 的既有边界。
>  Rule：本文件更新的是 **Visual Asset Contract / Production / Consumption**，不是提前建立 HPC2 final narrative 或 9-scene DOM composition。

---

# 0｜Role Freeze

HPC2-PRE 只负责：

```
Visual Readiness
R2 Truth
Asset Production
Asset Verification
Canonical Asset Registration
Public Asset Delivery
Actual Homepage Consumption
Browser Visual Acceptance

```

HPC2-PRE 不负责：

```
final Homepage narrative
final 9-scene composition
V8 semantic migration
CKA authority
Reality authority
Reading authority
Method authority
Professional Judgment

```

最终必须形成：

```
Canonical Governed Asset
↓
Human Accepted
↓
R2 Uploaded
↓
Remote Verified
↓
Canonical Registry Member
↓
Public Asset Resolver
↓
Actual Homepage Consumer
↓
Browser Visible
↓
Human Visual Accepted

```

并冻结：

```
CUSTOMER_VISIBLE_DELTA = true

```

如果只产生：

```
JSON
checker
registry entry
R2 object

```

但 Homepage 肉眼没有明显变化：

```
HPC2-PRE = NOT COMPLETE

```

---

# 0A｜Hero / Figure Canonical Asset Contract Freeze

这是本版相对原 HPC2-PRE v2.0 最重要的更新。

## 0A-1｜Hero Canonical Contract

所有 canonical Hero 一律：

```
family = HERO
canonicalFormat = WebP
masterSize = 2560 × 1440
aspectRatio = 16:9
localePolicy = LOCALE_NEUTRAL_BY_DEFAULT

```

并冻结：

```
No embedded long copy
No button
No fake UI
No logo
No embedded CTA

```

Hero 可以使用：

```
complex raster
light
texture
scene
landscape
depth
atmosphere

```

但：

```
HTML owns:
title
body copy
CTA
button
label
locale-specific text

```

因此：

```
Hero Image Authority
≠
Homepage Copy Authority
≠
CTA Authority

```

Canonical filename：

```
PHIOS-HERO-{SEMANTIC-NAME}-v1.webp

```

Global / Homepage Hero R2 path：

```
images/hero/

```

Book Hero R2 path：

```
images/hero/books/

```

---

## 0A-2｜Figure Canonical Contract

本最终清单中的 **所有 Figure canonical master = SVG**。

冻结：

```
family = FIGURE
canonicalFormat = SVG
canonicalMaster = .svg

```

Figure 优先承担：

```
structure
flow
architecture
relationship
boundary
system map
cycle
framework

```

Figure 内文字：

```
label-light
locale-neutral whenever possible
no long explanation
no paragraph
no bilingual long copy

```

优先：

```
geometry
number
short structural label
HTML legend
HTML explanation

```

如果某个 surface 需要 raster fallback：

```
Canonical SVG
↓
Derived WebP fallback

```

但：

```
Derived WebP
≠ second canonical asset
≠ new Figure authority
≠ replacement identity

```

若视觉本质是：

```
portrait
scene illustration
complex painterly raster
non-vector texture artwork

```

应优先归类：

```
ILLUSTRATION family → WebP

```

而不是把这 57 个 canonical Figure 改回 raster master。

Canonical filename：

```
PHIOS-FIGURE-{SEMANTIC-NAME}-v1.svg

```

Canonical R2 Figure domains：

```
images/figures/global/
images/figures/books/
images/figures/journey/
images/figures/knowledge/
images/figures/personal/
images/figures/financial/
images/figures/academy/
images/figures/professional/
images/figures/account/

```

---

## 0A-3｜Canonical Asset Record Contract

每个 Hero / Figure 必须至少记录：

```
assetCode
family
semanticName
officialFilename
canonicalFormat
masterSize
aspectRatio
r2ObjectKey
primaryConsumers
secondaryConsumers
visualPurpose
embeddedTextPolicy
localePolicy
forbiddenElements
notes

```

Figure 为 SVG 时：

```
masterSize

```

记录 canonical SVG 的：

```
viewBox / intrinsic dimensions

```

而不是强行伪造成 Hero 的 `2560 × 1440`。

---

## 0A-4｜Count Semantics Freeze

三个数字必须严格分开。

### A. Canonical Hero / Figure Set

```
Hero = 23
Figure = 57
Hero + Figure = 80

```

### B. Whole Visual Registry Planning

保留原 registry 的：

```
148 existing asset identities
+
4 Homepage successor Figure identities
=
152 planned registry identities

```

这里的 `152` 包含 Hero / Figure 之外的既有视觉资产族、legacy identities、icons、illustrations、instructions、cover-related records 等。

因此：

```
80 canonical Hero/Figure
≠
152 whole visual registry identities

```

不得为了把 Hero/Figure 总数变成 80 而错误删除其他 registry identities。

### C. HPC2-PRE Blocking Visual Set

真正阻断进入 HPC2-P0 的仍然只是：

```
1 Hero
+
5 existing book covers
+
10 Figures
=
16 critical assets

```

因此：

```
80 canonical Hero/Figure set
≠
16 HPC2-PRE blockers

```

---

# HPC2-PRE-0｜Baseline & Authority Freeze

读取：

```
BFR-H0–H14
INV-01–INV-10
public-assets.json
client-visual-asset-registry-v1.1.json
index.html
home-production.js
public-surface-data.js
asset-resolver.js
RJX Phase 19 route strategy
RJX Phase 19 technical freeze
Hero/Figure canonical asset contract

```

输出：

```
content/web/homepage/hpc2-pre/
  hpc2-pre-baseline-reconciliation-v1.json
  hpc2-pre-authority-boundary-v1.json
  hpc2-pre-hero-figure-canonical-contract-v1.json

```

必须明确：

```
baselineCommit = 203edecf98763e27897c35aae2768d1a69b674d2
historicalBaselineEvidencePreserved = true

```

Exit Gate：

```
No duplicate authority
No second asset resolver
No premature HPC2 composition
No V8 deletion
Hero canonical contract frozen
Figure canonical contract frozen

```

---

# HPC2-PRE-1｜R2 Actual Object Truth Reconciliation

先扫描真实 R2，而不是相信旧 registry。

至少扫描：

```
books/covers/book-1/
books/covers/book-2/
books/covers/book-3/
books/covers/book-4/
books/covers/book-5/

books/previews/book-1/
books/previews/book-2/

images/hero/
images/hero/books/

images/figures/global/
images/figures/books/
images/figures/journey/
images/figures/knowledge/
images/figures/personal/
images/figures/financial/
images/figures/academy/
images/figures/professional/
images/figures/account/

images/icons/
images/illustrations/
images/instructions/

```

每个 object 记录：

```
objectKey
assetCode
family
contentType
size
etag/checksum
width
height
viewBox
registryState
ownerReportedState
remoteObjectState
publicReachabilityState
canonicalFormatMatch
officialFilenameMatch
verifiedAt

```

Hero MIME：

```
image/webp

```

Figure MIME：

```
image/svg+xml

```

必须解决目前已知 drift：

```
BOOK-5-HARDCOVER

repo:
planned

actual R2:
already exists

→ remote verify
→ registry correction

```

以及：

```
BOOK-2-PREVIEW

actual R2:
exists

repo:
missing/incomplete registration

→ inventory pages
→ register collection truth

```

同时检查：

```
Hero stored as PNG master
Figure stored only as PNG/WebP
wrong filename
wrong R2 domain
duplicate canonical copies
unregistered fallback

```

这些都必须进入 drift reconciliation。

Output：

```
r2-actual-object-inventory-v1.json
r2-public-asset-registry-reconciliation-v1.json
hero-figure-format-drift-report-v1.json

```

Exit Gate：

```
R2 truth known
No assumed object existence
No duplicate canonical object
Canonical MIME verified where object already exists

```

---

# HPC2-PRE-2｜Visual Registry v1.2 + RJX Phase 19 Consumer Reconciliation

当前 Reality Journey successor：

```
/reality/

UNDERSTAND
CHOOSE
REVIEW

```

但：

```
Human UX acceptance = pending
Production route activation = false
Legacy redirects = inactive
Legacy routes = preserved

```

因此建立：

```
client-visual-asset-registry-v1.2.json

```

保留：

```
148 existing asset identities

```

新增：

```
FIG-054 CURRENT-REALITY-MAP
FIG-055 MANY-LENSES-FRAGMENTATION
FIG-056 PHIOS-RUNTIME-CYCLE
FIG-057 CONTINUITY-LOOP

```

最终 planning：

```
152 planned registry identities

```

每个 Hero / Figure registry member 必须补齐 canonical fields：

```
assetCode
family
semanticName
officialFilename
canonicalFormat
masterSize
aspectRatio
r2ObjectKey
primaryConsumers
secondaryConsumers
embeddedTextPolicy
localePolicy
forbiddenElements
canonicalState
remoteVerificationState

```

## HERO-006

保留 identity：

```
HERO-006
REALITY-JOURNEY

```

consumer metadata 更新：

```
primarySemantic = REALITY_WORKSPACE
candidateConsumer = /reality/
legacyCompatibilityConsumer = /reality-journey
routeActivationDependency = RJX_PHASE19_HUMAN_UX_ACCEPTANCE

```

Canonical asset contract：

```
PHIOS-HERO-REALITY-JOURNEY-v1.webp
WebP
2560 × 1440
16:9
locale-neutral

```

## HERO-007～011

继续保留：

```
HERO-007 Reality Entry
HERO-008 Reality Reconstruction
HERO-009 Reality Reading
HERO-010 Reality Navigation Stage
HERO-011 Reality Continuity

```

但：

```
homepagePreRequired = false
consumerMode = LEGACY_COMPATIBILITY_OR_DEFERRED

```

因此：

```
HPC2-PRE does not require HERO-007～011 production before HPC2-P0

```

但 identities 与 canonical metadata 不得删除。

## FIG-002

从旧 client navigation model：

```
Entry
→ Reconstruction
→ Reading
→ Navigation
→ Review

```

更新 visual brief：

```
One Reality Workspace
↓
Understand
↓
Choose
↓
Review

```

旧 runtime lineage 可作为 technical context，但不能继续成为默认 client navigation model。

FIG-002 canonical asset：

```
PHIOS-FIGURE-REALITY-JOURNEY-OVERVIEW-v1.svg
SVG canonical master

```

---

# HPC2-PRE-3｜Homepage Visual Slot Coverage Audit

先为未来 9 scenes 准备正确视觉，但不提前建立最终 DOM composition。

| Scene Required visual Canonical Asset  |                                            |                                                 |
| -------------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| H01 Hero                               | Reality Navigation                         | HERO-001                                        |
| H02 One Reality                        | Current Reality map                        | FIG-054                                         |
| H03 Many Lenses                        | Fragmentation                              | FIG-055                                         |
| H04 PHI OS Runtime                     | Runtime cycle                              | FIG-056                                         |
| H05 First Interaction                  | Real HTML UI                               | NO FAKE UI IMAGE                                |
| H06 Reality Surfaces                   | Journey / Personal / Financial / Knowledge | FIG-002 / FIG-003 / FIG-004 / knowledge support |
| H07 Five Volumes                       | Covers + architecture                      | 5 covers + FIG-001                              |
| H08 Academy / Services / Professional  | Support architecture                       | FIG-006 + icons                                 |
| H09 Continuity                         | Reality feedback loop                      | FIG-057                                         |

现有 registry 没有精确覆盖：

```
Current Reality
Many Lenses / Fragmentation
PHI OS Runtime Cycle
Homepage Continuity Loop

```

禁止硬拿不相关 Figure 顶替。

新增：

```
FIG-054
CURRENT-REALITY-MAP
PHIOS-FIGURE-CURRENT-REALITY-MAP-v1.svg
images/figures/global/

```

```
FIG-055
MANY-LENSES-FRAGMENTATION
PHIOS-FIGURE-MANY-LENSES-FRAGMENTATION-v1.svg
images/figures/global/

```

```
FIG-056
PHIOS-RUNTIME-CYCLE
PHIOS-FIGURE-PHIOS-RUNTIME-CYCLE-v1.svg
images/figures/global/

```

```
FIG-057
CONTINUITY-LOOP
PHIOS-FIGURE-CONTINUITY-LOOP-v1.svg
images/figures/global/

```

四张都必须：

```
canonicalFormat = SVG
longCopyEmbedded = false
HTMLLegendPreferred = true
localeNeutralPreferred = true

```

Exit Gate：

```
9 Homepage slots have semantically correct visual coverage
No fake UI
No irrelevant Figure substitution
No raster master for FIG-054～057

```

---

# HPC2-PRE-4｜16-Asset Critical Homepage Batch Freeze

HPC2-PRE **不是完成全部 80 Hero/Figure，也不是完成全部 152 registry identities。**

进入 HPC2-P0 前真正必须完成：

## Hero

```
HERO-001
REALITY-NAVIGATION

PHIOS-HERO-REALITY-NAVIGATION-v1.webp
images/hero/
2560 × 1440
16:9

```

## Five real covers

```
BOOK-1-HARDCOVER
BOOK-2-HARDCOVER
BOOK-3-HARDCOVER
BOOK-4-HARDCOVER
BOOK-5-HARDCOVER

```

保持现有 canonical cover ownership：

```
books/covers/book-X/

```

不要复制为第二套 Hero / Branding authority。

## Existing Homepage Figures

```
FIG-001 FIVE-VOLUME-ARCHITECTURE
FIG-002 REALITY-JOURNEY-OVERVIEW
FIG-003 PERSONAL-REALITY-FLOW
FIG-004 FINANCIAL-REALITY-SYSTEM
FIG-005 READING-EVIDENCE-NAVIGATION
FIG-006 PROFESSIONAL-GUIDANCE

```

全部：

```
canonicalFormat = SVG

```

## New Homepage Figures

```
FIG-054 CURRENT-REALITY-MAP
FIG-055 MANY-LENSES-FRAGMENTATION
FIG-056 PHIOS-RUNTIME-CYCLE
FIG-057 CONTINUITY-LOOP

```

全部：

```
canonicalFormat = SVG

```

总计：

```
1 Hero
+
5 Covers
+
6 Existing Figures
+
4 New Figures
=
16 critical assets

```

Blocking rule：

```
HPC2-P0 blocked
until
16/16 Human Accepted
AND
16/16 Remote Verified
AND
required Homepage members actually consumed

```

---

# HPC2-PRE-5｜Reusable Icon Family

现有：

```
ICON-001 → ICON-018

```

继续生产统一 reusable family。

Homepage subset 优先：

```
ICON-003 FIVE-BOOKS
ICON-006 KNOWLEDGE
ICON-007 PERSONAL-REALITY
ICON-008 FINANCIAL-REALITY
ICON-009 REALITY-WORKSPACE
ICON-010 READING
ICON-011 EVIDENCE
ICON-012 NAVIGATION
ICON-013 CONTINUITY
ICON-014 ACADEMY
ICON-015 PROFESSIONAL
ICON-018 SEARCH

```

Canonical：

```
Icons = SVG

```

但：

```
ICON family
≠ FIGURE family

```

状态：

```
P1_PARALLEL

```

不因为 18 个 icon 尚未全部完成而阻断 HPC2-P0。

---

# HPC2-PRE-6｜Canonical Asset Brief + Human Visual Review

每个 critical asset 必须有：

```
assetCode
family
semanticName
officialFilename
canonicalFormat
masterSize
aspectRatio
r2ObjectKey
primaryConsumers
secondaryConsumers
semanticPurpose
visualPurpose
visualVocabulary
authorityBoundary
embeddedTextPolicy
localePolicy
responsiveCropPolicy
forbiddenElements
accessibilityIntent
notes

```

## HERO-001 Brief Freeze

```
assetCode = HERO-001
family = HERO
semanticName = REALITY-NAVIGATION
officialFilename = PHIOS-HERO-REALITY-NAVIGATION-v1.webp
canonicalFormat = WebP
masterSize = 2560 × 1440
aspectRatio = 16:9
r2ObjectKey = images/hero/PHIOS-HERO-REALITY-NAVIGATION-v1.webp
embeddedTextPolicy = NO_LONG_COPY
localePolicy = LOCALE_NEUTRAL

```

禁止：

```
logo
button
fake UI
embedded CTA
long paragraph
locale-specific marketing copy

```

视觉 vocabulary：

```
Reality landscape
navigation path
horizon
subtle knowledge network
PHI OS compass geometry
restrained five-volume spectrum

```

## FIG-001～006 / FIG-054～057 Brief Freeze

全部：

```
family = FIGURE
canonicalFormat = SVG
longCopyEmbedded = false
localeNeutralPreferred = true
HTMLLegendPreferred = true
privateDataAllowed = false
authorityClaimAllowed = false

```

禁止：

```
long embedded copy
fake product UI
customer private data
publication authority claim
method result fabrication
decorative text pretending to be evidence

```

Lifecycle：

```
GENERATED
↓
TL HUMAN REVIEW
↓
ACCEPTED

or

REVISION_REQUIRED

```

Human Accepted 只代表：

```
visual asset accepted

```

不代表：

```
knowledge approved
method approved
professional judgment approved
route activated

```

---

# HPC2-PRE-7｜Production Format & Responsive Variants

最终 canonical production format：

```
Hero            WebP canonical master
Figure          SVG canonical master
Book Covers     existing canonical WebP
Icons           SVG
Illustration    WebP
Instruction     WebP / SVG according to asset type

```

删除旧规则：

```
Raster Figure WebP
Structural Figure SVG

```

对于本 canonical Figure List 不再成立。

现在冻结：

```
ALL 57 canonical Figures = SVG master

```

Figure raster fallback：

```
SVG canonical master
↓
derived WebP fallback

```

必须登记：

```
derivedFromAssetCode
variantType
canonical = false

```

Hero responsive：

```
same canonical asset
OR
registered mobile variant derived from same semantic asset

```

禁止：

```
desktop one art
mobile unrelated art

```

Delivery：

```
Hero eager / high priority
Above-fold critical Figure according to composition priority
Below-fold lazy
width / height / aspect-ratio declared
SVG viewBox valid
No master PNG served directly

```

不得：

```
PNG source
→ silently become canonical Hero/Figure

```

---

# HPC2-PRE-8｜R2 Upload + Remote Verification

必须：

```
HUMAN_ACCEPTED
↓
PRODUCTION_READY
↓
UPLOAD
↓
REMOTE HEAD / GET
↓
MIME verification
↓
size / checksum verification
↓
REMOTE_VERIFIED

```

至少完成 HERO-001：

```
images/hero/
PHIOS-HERO-REALITY-NAVIGATION-v1.webp

```

必须：

```
content-type = image/webp
width = 2560
height = 1440
aspectRatio = 16:9

```

Homepage 10 Figure：

```
images/figures/global/PHIOS-FIGURE-FIVE-VOLUME-ARCHITECTURE-v1.svg
images/figures/global/PHIOS-FIGURE-REALITY-JOURNEY-OVERVIEW-v1.svg
images/figures/global/PHIOS-FIGURE-PERSONAL-REALITY-FLOW-v1.svg
images/figures/global/PHIOS-FIGURE-FINANCIAL-REALITY-SYSTEM-v1.svg
images/figures/global/PHIOS-FIGURE-READING-EVIDENCE-NAVIGATION-v1.svg
images/figures/global/PHIOS-FIGURE-PROFESSIONAL-GUIDANCE-v1.svg
images/figures/global/PHIOS-FIGURE-CURRENT-REALITY-MAP-v1.svg
images/figures/global/PHIOS-FIGURE-MANY-LENSES-FRAGMENTATION-v1.svg
images/figures/global/PHIOS-FIGURE-PHIOS-RUNTIME-CYCLE-v1.svg
images/figures/global/PHIOS-FIGURE-CONTINUITY-LOOP-v1.svg

```

必须：

```
content-type = image/svg+xml
valid SVG
valid viewBox / intrinsic geometry
no script
no external active content

```

5 book covers 保留：

```
books/covers/book-X/

```

禁止为了视觉 registry 再复制到：

```
images/branding/books/
images/hero/books/

```

除非它本来就是独立 `HERO-019～023` Book Hero，而不是 hardcover copy。

---

# HPC2-PRE-9｜Public Asset Delivery Activation

当前必须关闭的最大 gap：

```
R2 exists
but
publicBaseUrlConfigured = false

```

Production 正确配置：

```
PHIOS_PUBLIC_ASSET_BASE_URL

```

并通过：

```
/api/public-asset-config

```

继续使用既有：

```
assets/js/runtime/web-production/asset-resolver.js

```

禁止建立第二套 resolver。

同时：

```
Asset Group
≠
Renderable Asset Member

```

不能只登记：

```
BOOK-1-FIGURES
→ folder prefix

```

然后页面自己读取：

```
repository-relative web_file

```

每个正式 Homepage visual 必须有 concrete member：

```
assetCode
family
semanticName
officialFilename
objectKey
canonicalFormat
contentType
verification
variant
dimensions / viewBox
canonicalState

```

Resolver 输出必须指向：

```
REMOTE_VERIFIED canonical member

```

或明确登记的：

```
derived fallback variant

```

不得：

```
local file silently overrides R2 canonical member

```

---

# HPC2-PRE-10｜Actual Homepage Visual Integration

这是最重要的一步。

必须真的修改客户实际页面，而不是只写 manifest。

至少进入：

```
index.html
home-production.js
public-surface-data.js
Homepage PDS-compatible CSS

```

## Hero

从：

```
CSS decoration
+
HTML copy

```

升级：

```
HERO-001 WebP
↓
Asset Resolver
↓
Actual Homepage visual
+
HTML title/body copy
+
HTML CTA

```

冻结：

```
Hero image contains no long copy
Hero image contains no CTA
Hero image contains no button
Hero image contains no fake UI
Hero image contains no logo

```

所以 locale switch 只改变：

```
HTML text

```

不需要生成第二张中英文 Hero。

## Five Volumes

最终 PRE acceptance：

```
5/5 real covers visible
0 unexpected Φ fallback

```

## Visual Knowledge

修掉：

```
repository-relative figure file

```

必须：

```
Canonical SVG Figure
↓
Concrete R2 Member
↓
Resolver
↓
Homepage visual

```

Figure 长说明：

```
HTML legend / HTML copy

```

不写进 SVG。

## Existing capability sections

正式 HPC2 narrative 之前，先让当前 Homepage：

```
Journey
Personal Reality
Financial Reality
Knowledge
Academy
Professional
Visual Knowledge

```

真正获得 Figure / Icon treatment。

这样客户立即看见：

```
CUSTOMER_VISIBLE_DELTA = true

```

---

# HPC2-PRE-11｜RJX Route Safety

由于 `/reality/` 当前仍是 technical candidate：

```
HPC2-PRE
MUST NOT
silently change all public CTA
to /reality/

```

直到：

```
TL Human UX Acceptance
+
Production Route Activation

```

通过。

因此：

```
visual semantics
→ adopt Understand / Choose / Review

route production activation
→ remain independently gated

```

这两个问题必须继续分开。

Hero / Figure consumer metadata 可以先支持：

```
candidateConsumer = /reality/

```

但：

```
routeActivation = false

```

时不得把 candidate consumer 误当成 active public route。

---

# HPC2-PRE-12｜Production Browser Visual Acceptance

最低 browser matrix：

```
390 EN
390 ZH

768 EN
768 ZH

1440 EN
1440 ZH

```

必须实际检查：

```
Hero loads from R2
Hero MIME = image/webp
Hero aspect ratio correct
Hero crop acceptable
No embedded duplicate copy

Figures load from R2
Figure MIME = image/svg+xml
SVG scales without distortion
SVG labels remain readable
HTML legend remains aligned

No 404
No CORS
No resolver error
5 covers visible
No stretching
No overflow
No large layout shift
Chinese wraps correctly
CTA remains usable
No master PNG served
No local governed-asset bypass

```

记录 network evidence：

```
assetCode
family
objectKey
requestedURL
HTTP status
content-type
content-length
etag/checksum
surface
viewport
locale
verifiedAt

```

TL Human Visual Review 必须回答：

```
Does Homepage clearly look materially different?

Does HERO-001 feel like PHI OS?

Can the five-volume system be recognized visually?

Can Personal / Financial / Knowledge / Professional be distinguished?

Do structural Figures feel like one coherent visual grammar?

Is the page richer without becoming cluttered?

Does EN/ZH work without needing separate Hero artwork?

Do SVG Figures remain clean on mobile and desktop?

```

---

# HPC2-PRE-13｜Final Readiness Acceptance & Freeze

最终状态只能是：

```
BLOCKED

VISUAL_ASSETS_READY_NOT_CONSUMED

CONSUMED_NOT_BROWSER_ACCEPTED

HPC2_PRE_READY

```

只有：

```
HPC2_PRE_READY

```

才进入：

```
HPC2-P0
BFR-H Homepage Capability Intake

```

最终 DoD：

```
R2 truth reconciled
RJX Phase 19 consumers reconciled
Visual Registry v1.2 frozen
152 planned registry identities represented

23 Hero canonical identities represented
57 Figure canonical identities represented
80 Hero/Figure canonical identities represented

Hero canonical = WebP
Hero canonical master = 2560 × 1440
Hero aspect ratio = 16:9
Hero no embedded long copy
Hero no fake UI
Hero no button
Hero no logo

All 57 Figure canonical masters = SVG
Figure long explanation remains HTML-owned
Figure locale-neutral whenever possible
Any WebP Figure fallback is derived, not canonical

16 critical assets Human Accepted
16 critical assets Remote Verified

Public asset delivery operational
HERO-001 actually visible
5/5 covers actually visible
Governed Figures actually visible

No local governed-asset bypass
No duplicate canonical object
No second asset resolver
No V8 deletion
No premature /reality/ activation
No duplicate authority
Browser acceptance passed

CUSTOMER_VISIBLE_DELTA = true

```

---

# Updated Batch Strategy

## Batch 01A｜HPC2-PRE Critical

必须先完成：

```
1 Hero
5 Covers
10 Figures
=
16 critical visual assets

```

Hero：

```
HERO-001

```

Figures：

```
FIG-001
FIG-002
FIG-003
FIG-004
FIG-005
FIG-006
FIG-054
FIG-055
FIG-056
FIG-057

```

Canonical format：

```
HERO-001 = WebP 2560×1440
10 Figures = SVG

```

## Batch 01B｜Reusable Global Family

并行：

```
Homepage priority icons
secondary heroes
secondary canonical figures

```

状态：

```
P1_PARALLEL

```

不阻断 Batch 01A。

## Batch 02｜Five Volumes

Homepage 先要求：

```
5 covers
+
FIG-001

```

Book Hero `HERO-019～023` 属于 canonical 80 set，但不是 HPC2-PRE blocking set。

## Batch 03｜Reality Journey

先：

```
RECONCILE WITH RJX PHASE 19

```

优先：

```
HERO-006
FIG-002

```

其余：

```
HERO-007～011
FIG-012～021

```

保留 canonical identity，但：

```
DEFERRED_PENDING_RJX_ACCEPTANCE

```

## Batch 04｜Personal

Homepage 先：

```
FIG-003

```

其余 `FIG-022～028` 后续。

## Batch 05｜Financial

Homepage 先：

```
FIG-004

```

其余 `FIG-029～036` 后续。

## Batch 06｜Academy

Homepage 先：

```
ICON-014

```

Academy Figures `FIG-037～042` 后续。

## Batch 07｜Professional

Homepage 先：

```
FIG-006
ICON-015

```

其余 `FIG-043～052` 后续。

## Batch 08｜Account / Commerce

```
NOT A HOMEPAGE PRE BLOCKER

```

`FIG-053` canonical identity 继续保留。

---

# Final Execution Order

```
PRE-0
Baseline + Authority + Canonical Contract Freeze
↓
PRE-1
R2 Actual Object Truth
↓
PRE-2
Visual Registry v1.2 + RJX Consumer Reconciliation
↓
PRE-3
Homepage Visual Slot Coverage Audit
↓
PRE-4
16 Critical Asset Freeze
↓
PRE-5
Reusable Icon Family [parallel]
↓
PRE-6
Canonical Asset Brief + Human Visual Review
↓
PRE-7
Production Format + Responsive Variants
↓
PRE-8
R2 Upload + Remote Verification
↓
PRE-9
Public Asset Delivery Activation
↓
PRE-10
Actual Homepage Visual Integration
↓
PRE-11
RJX Route Safety
↓
PRE-12
Production Browser Visual Acceptance
↓
PRE-13
Final Readiness Acceptance + Freeze
↓
HPC2-P0

```

最终规则：

```
Asset planned
→ JSON written
→ checker green

IS NOT DONE

```

必须：

```
Canonical Asset
↓
Human Accepted
↓
R2
↓
Remote Verified
↓
Registry
↓
Resolver
↓
Actual Homepage
↓
Browser Visible
↓
Human Accepted

```

这才允许：

```
HPC2_PRE_READY
→
HPC2-P0

```

---

# Appendix A｜Canonical Hero Registry Freeze｜23

## A1｜Global / Surface Hero｜HERO-001～018

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                          |                                             |      |              |                                                               |
| -------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------- | ---- | ------------ | ------------------------------------------------------------- |
| HERO-001                                                                         | REALITY-NAVIGATION       | PHIOS-HERO-REALITY-NAVIGATION-v1.webp       | WebP | images/hero/ | index.html, about.html                                        |
| HERO-002                                                                         | KNOWLEDGE-LIBRARY        | PHIOS-HERO-KNOWLEDGE-LIBRARY-v1.webp        | WebP | images/hero/ | library.html                                                  |
| HERO-003                                                                         | FIVE-VOLUME-SYSTEM       | PHIOS-HERO-FIVE-VOLUME-SYSTEM-v1.webp       | WebP | images/hero/ | books / homepage support                                      |
| HERO-004                                                                         | KNOWLEDGE-READING        | PHIOS-HERO-KNOWLEDGE-READING-v1.webp        | WebP | images/hero/ | articles.html, glossary.html                                  |
| HERO-005                                                                         | VISUAL-KNOWLEDGE         | PHIOS-HERO-VISUAL-KNOWLEDGE-v1.webp         | WebP | images/hero/ | figures.html, figure.html                                     |
| HERO-006                                                                         | REALITY-JOURNEY          | PHIOS-HERO-REALITY-JOURNEY-v1.webp          | WebP | images/hero/ | reality-journey.html / future reality workspace compatibility |
| HERO-007                                                                         | REALITY-ENTRY            | PHIOS-HERO-REALITY-ENTRY-v1.webp            | WebP | images/hero/ | reality-entry.html                                            |
| HERO-008                                                                         | REALITY-RECONSTRUCTION   | PHIOS-HERO-REALITY-RECONSTRUCTION-v1.webp   | WebP | images/hero/ | reality-reconstruction.html                                   |
| HERO-009                                                                         | REALITY-READING          | PHIOS-HERO-REALITY-READING-v1.webp          | WebP | images/hero/ | reality-reading.html                                          |
| HERO-010                                                                         | REALITY-NAVIGATION-STAGE | PHIOS-HERO-REALITY-NAVIGATION-STAGE-v1.webp | WebP | images/hero/ | reality-navigation.html                                       |
| HERO-011                                                                         | REALITY-CONTINUITY       | PHIOS-HERO-REALITY-CONTINUITY-v1.webp       | WebP | images/hero/ | reality-review\.html / continuity-oriented reality surfaces   |
| HERO-012                                                                         | PERSONAL-REALITY         | PHIOS-HERO-PERSONAL-REALITY-v1.webp         | WebP | images/hero/ | personal-runtime.html, my-reality.html                        |
| HERO-013                                                                         | ACADEMY                  | PHIOS-HERO-ACADEMY-v1.webp                  | WebP | images/hero/ | academy.html                                                  |
| HERO-014                                                                         | PROFESSIONAL             | PHIOS-HERO-PROFESSIONAL-v1.webp             | WebP | images/hero/ | professional-workspace.html                                   |
| HERO-015                                                                         | FINANCIAL-REALITY        | PHIOS-HERO-FINANCIAL-REALITY-v1.webp        | WebP | images/hero/ | financial / services-aligned surfaces                         |
| HERO-016                                                                         | SERVICES                 | PHIOS-HERO-SERVICES-v1.webp                 | WebP | images/hero/ | services.html                                                 |
| HERO-017                                                                         | ACCOUNT-CONTINUITY       | PHIOS-HERO-ACCOUNT-CONTINUITY-v1.webp       | WebP | images/hero/ | account.html, account-my-reality.html                         |
| HERO-018                                                                         | DIGITAL-BOOK-ACCESS      | PHIOS-HERO-DIGITAL-BOOK-ACCESS-v1.webp      | WebP | images/hero/ | membership.html, checkout.html, book-one-preview\.html        |

## A2｜Book Hero｜HERO-019～023

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                             |                                                |      |                    |                                             |
| -------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- | ---- | ------------------ | ------------------------------------------- |
| HERO-019                                                                         | BOOK-1-REALITY-FORMATION    | PHIOS-HERO-BOOK-1-REALITY-FORMATION-v1.webp    | WebP | images/hero/books/ | book-one.html                               |
| HERO-020                                                                         | BOOK-2-REALITY-RUNTIME      | PHIOS-HERO-BOOK-2-REALITY-RUNTIME-v1.webp      | WebP | images/hero/books/ | future book-two page / book runtime context |
| HERO-021                                                                         | BOOK-3-REALITY-CONTINUITY   | PHIOS-HERO-BOOK-3-REALITY-CONTINUITY-v1.webp   | WebP | images/hero/books/ | future book-three page                      |
| HERO-022                                                                         | BOOK-4-REALITY-CIVILIZATION | PHIOS-HERO-BOOK-4-REALITY-CIVILIZATION-v1.webp | WebP | images/hero/books/ | future book-four page                       |
| HERO-023                                                                         | BOOK-5-REALITY-NAVIGATION   | PHIOS-HERO-BOOK-5-REALITY-NAVIGATION-v1.webp   | WebP | images/hero/books/ | future book-five page                       |

Hero global freeze：

```
ALL HERO = WebP
ALL HERO master = 2560 × 1440
ALL HERO aspect ratio = 16:9
NO embedded long copy
NO button
NO fake UI
NO logo
locale-neutral by default

```

---

# Appendix B｜Canonical Figure Registry Freeze｜57

## B1｜Global / Homepage Core

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                             |                                                 |     |                        |                               |
| -------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------- | --- | ---------------------- | ----------------------------- |
| FIG-001                                                                          | FIVE-VOLUME-ARCHITECTURE    | PHIOS-FIGURE-FIVE-VOLUME-ARCHITECTURE-v1.svg    | SVG | images/figures/global/ | homepage, books, library      |
| FIG-002                                                                          | REALITY-JOURNEY-OVERVIEW    | PHIOS-FIGURE-REALITY-JOURNEY-OVERVIEW-v1.svg    | SVG | images/figures/global/ | homepage, reality surfaces    |
| FIG-003                                                                          | PERSONAL-REALITY-FLOW       | PHIOS-FIGURE-PERSONAL-REALITY-FLOW-v1.svg       | SVG | images/figures/global/ | homepage, personal surfaces   |
| FIG-004                                                                          | FINANCIAL-REALITY-SYSTEM    | PHIOS-FIGURE-FINANCIAL-REALITY-SYSTEM-v1.svg    | SVG | images/figures/global/ | homepage, financial surfaces  |
| FIG-005                                                                          | READING-EVIDENCE-NAVIGATION | PHIOS-FIGURE-READING-EVIDENCE-NAVIGATION-v1.svg | SVG | images/figures/global/ | homepage, knowledge / reading |
| FIG-006                                                                          | PROFESSIONAL-GUIDANCE       | PHIOS-FIGURE-PROFESSIONAL-GUIDANCE-v1.svg       | SVG | images/figures/global/ | homepage, professional        |
| FIG-054                                                                          | CURRENT-REALITY-MAP         | PHIOS-FIGURE-CURRENT-REALITY-MAP-v1.svg         | SVG | images/figures/global/ | homepage                      |
| FIG-055                                                                          | MANY-LENSES-FRAGMENTATION   | PHIOS-FIGURE-MANY-LENSES-FRAGMENTATION-v1.svg   | SVG | images/figures/global/ | homepage                      |
| FIG-056                                                                          | PHIOS-RUNTIME-CYCLE         | PHIOS-FIGURE-PHIOS-RUNTIME-CYCLE-v1.svg         | SVG | images/figures/global/ | homepage                      |
| FIG-057                                                                          | CONTINUITY-LOOP             | PHIOS-FIGURE-CONTINUITY-LOOP-v1.svg             | SVG | images/figures/global/ | homepage                      |

## B2｜Books

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                           |                                               |     |                       |                |
| -------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------- | --- | --------------------- | -------------- |
| FIG-007                                                                          | FIVE-VOLUME-KNOWLEDGE-MAP | PHIOS-FIGURE-FIVE-VOLUME-KNOWLEDGE-MAP-v1.svg | SVG | images/figures/books/ | library, books |
| FIG-008                                                                          | P1-P15-ARCHITECTURE       | PHIOS-FIGURE-P1-P15-ARCHITECTURE-v1.svg       | SVG | images/figures/books/ | books, academy |

## B3｜Knowledge

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                               |                                                   |     |                           |                             |
| -------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------- | --- | ------------------------- | --------------------------- |
| FIG-009                                                                          | CROSS-VOLUME-READING-PATH     | PHIOS-FIGURE-CROSS-VOLUME-READING-PATH-v1.svg     | SVG | images/figures/knowledge/ | library, academy, knowledge |
| FIG-010                                                                          | KNOWLEDGE-NODE-ARTICLE-FIGURE | PHIOS-FIGURE-KNOWLEDGE-NODE-ARTICLE-FIGURE-v1.svg | SVG | images/figures/knowledge/ | library, article, figure    |
| FIG-011                                                                          | KNOWLEDGE-DISCOVERY-MODEL     | PHIOS-FIGURE-KNOWLEDGE-DISCOVERY-MODEL-v1.svg     | SVG | images/figures/knowledge/ | library, knowledge search   |

## B4｜Reality / Journey / Workspace

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                          |                                              |     |                         |                                              |
| -------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------- | --- | ----------------------- | -------------------------------------------- |
| FIG-012                                                                          | REALITY-JOURNEY-FULL-MAP | PHIOS-FIGURE-REALITY-JOURNEY-FULL-MAP-v1.svg | SVG | images/figures/journey/ | reality-journey.html                         |
| FIG-013                                                                          | REALITY-ENTRY            | PHIOS-FIGURE-REALITY-ENTRY-v1.svg            | SVG | images/figures/journey/ | reality-entry.html                           |
| FIG-014                                                                          | REALITY-RECONSTRUCTION   | PHIOS-FIGURE-REALITY-RECONSTRUCTION-v1.svg   | SVG | images/figures/journey/ | reality-reconstruction.html                  |
| FIG-015                                                                          | REALITY-READING-MAP      | PHIOS-FIGURE-REALITY-READING-MAP-v1.svg      | SVG | images/figures/journey/ | reality-reading.html                         |
| FIG-016                                                                          | EVIDENCE-FORMATION       | PHIOS-FIGURE-EVIDENCE-FORMATION-v1.svg       | SVG | images/figures/journey/ | reality-reading.html, explore.html           |
| FIG-017                                                                          | REALITY-NAVIGATION       | PHIOS-FIGURE-REALITY-NAVIGATION-v1.svg       | SVG | images/figures/journey/ | reality-navigation.html                      |
| FIG-018                                                                          | ACTION-DIRECTION         | PHIOS-FIGURE-ACTION-DIRECTION-v1.svg         | SVG | images/figures/journey/ | reality-navigation.html                      |
| FIG-019                                                                          | REALITY-REVIEW           | PHIOS-FIGURE-REALITY-REVIEW-v1.svg           | SVG | images/figures/journey/ | reality-review\.html                         |
| FIG-020                                                                          | FEEDBACK-CONTINUITY      | PHIOS-FIGURE-FEEDBACK-CONTINUITY-v1.svg      | SVG | images/figures/journey/ | reality-review\.html, reality-dashboard.html |
| FIG-021                                                                          | KNOWN-UNKNOWN-BOUNDARY   | PHIOS-FIGURE-KNOWN-UNKNOWN-BOUNDARY-v1.svg   | SVG | images/figures/journey/ | reality surfaces                             |

## B5｜Personal Reality

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                              |                                                  |     |                          |                                                 |
| -------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------ | --- | ------------------------ | ----------------------------------------------- |
| FIG-022                                                                          | BIRTH-INPUT-ARCHITECTURE     | PHIOS-FIGURE-BIRTH-INPUT-ARCHITECTURE-v1.svg     | SVG | images/figures/personal/ | personal-runtime.html                           |
| FIG-023                                                                          | INPUT-METHOD-CALCULATION     | PHIOS-FIGURE-INPUT-METHOD-CALCULATION-v1.svg     | SVG | images/figures/personal/ | personal-runtime.html                           |
| FIG-024                                                                          | CALCULATION-PROJECTION       | PHIOS-FIGURE-CALCULATION-PROJECTION-v1.svg       | SVG | images/figures/personal/ | personal-runtime.html                           |
| FIG-025                                                                          | PERSONAL-REALITY-MAP         | PHIOS-FIGURE-PERSONAL-REALITY-MAP-v1.svg         | SVG | images/figures/personal/ | my-reality.html                                 |
| FIG-026                                                                          | KNOWN-UNKNOWN-INTERPRETATION | PHIOS-FIGURE-KNOWN-UNKNOWN-INTERPRETATION-v1.svg | SVG | images/figures/personal/ | my-reality.html                                 |
| FIG-027                                                                          | PERSONAL-CONTINUITY          | PHIOS-FIGURE-PERSONAL-CONTINUITY-v1.svg          | SVG | images/figures/personal/ | my-reality.html, reality-dashboard.html         |
| FIG-028                                                                          | SAVED-REALITY-JOURNEY-STATE  | PHIOS-FIGURE-SAVED-REALITY-JOURNEY-STATE-v1.svg  | SVG | images/figures/personal/ | account-my-reality.html, reality-dashboard.html |

## B6｜Financial Reality

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                              |                                                  |     |                           |                                  |
| -------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------ | --- | ------------------------- | -------------------------------- |
| FIG-029                                                                          | FINANCIAL-REALITY-SYSTEM-MAP | PHIOS-FIGURE-FINANCIAL-REALITY-SYSTEM-MAP-v1.svg | SVG | images/figures/financial/ | financial surfaces               |
| FIG-030                                                                          | INCOME-EXPENSE-FLOW          | PHIOS-FIGURE-INCOME-EXPENSE-FLOW-v1.svg          | SVG | images/figures/financial/ | financial surfaces               |
| FIG-031                                                                          | ASSETS-LIABILITIES-STRUCTURE | PHIOS-FIGURE-ASSETS-LIABILITIES-STRUCTURE-v1.svg | SVG | images/figures/financial/ | financial surfaces               |
| FIG-032                                                                          | CASHFLOW-RUNTIME             | PHIOS-FIGURE-CASHFLOW-RUNTIME-v1.svg             | SVG | images/figures/financial/ | financial surfaces               |
| FIG-033                                                                          | RISK-CONSTRAINT-MAP          | PHIOS-FIGURE-RISK-CONSTRAINT-MAP-v1.svg          | SVG | images/figures/financial/ | financial surfaces               |
| FIG-034                                                                          | FINANCIAL-DECISION-FLOW      | PHIOS-FIGURE-FINANCIAL-DECISION-FLOW-v1.svg      | SVG | images/figures/financial/ | financial surfaces               |
| FIG-035                                                                          | FINANCIAL-CONTINUITY         | PHIOS-FIGURE-FINANCIAL-CONTINUITY-v1.svg         | SVG | images/figures/financial/ | financial surfaces               |
| FIG-036                                                                          | EVIDENCE-DECISION-BOUNDARY   | PHIOS-FIGURE-EVIDENCE-DECISION-BOUNDARY-v1.svg   | SVG | images/figures/financial/ | financial / professional overlap |

## B7｜Academy

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                           |                                               |     |                         |                                   |
| -------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------- | --- | ----------------------- | --------------------------------- |
| FIG-037                                                                          | LEARNING-ARCHITECTURE     | PHIOS-FIGURE-LEARNING-ARCHITECTURE-v1.svg     | SVG | images/figures/academy/ | academy.html                      |
| FIG-038                                                                          | KNOWLEDGE-LESSON-PRACTICE | PHIOS-FIGURE-KNOWLEDGE-LESSON-PRACTICE-v1.svg | SVG | images/figures/academy/ | academy.html, academy-lesson.html |
| FIG-039                                                                          | EVIDENCE-INFERENCE        | PHIOS-FIGURE-EVIDENCE-INFERENCE-v1.svg        | SVG | images/figures/academy/ | academy                           |
| FIG-040                                                                          | CAPABILITY-PROGRESSION    | PHIOS-FIGURE-CAPABILITY-PROGRESSION-v1.svg    | SVG | images/figures/academy/ | academy                           |
| FIG-041                                                                          | LEARNING-CONTINUITY       | PHIOS-FIGURE-LEARNING-CONTINUITY-v1.svg       | SVG | images/figures/academy/ | academy                           |
| FIG-042                                                                          | FIVE-VOLUME-ACADEMY-PATH  | PHIOS-FIGURE-FIVE-VOLUME-ACADEMY-PATH-v1.svg  | SVG | images/figures/academy/ | academy                           |

## B8｜Professional / Services / Reports

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                                 |                                                     |     |                              |                                              |
| -------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------- | --- | ---------------------------- | -------------------------------------------- |
| FIG-043                                                                          | EVIDENCE-INTERPRETATION         | PHIOS-FIGURE-EVIDENCE-INTERPRETATION-v1.svg         | SVG | images/figures/professional/ | professional-workspace.html                  |
| FIG-044                                                                          | UNCERTAINTY-BOUNDARY            | PHIOS-FIGURE-UNCERTAINTY-BOUNDARY-v1.svg            | SVG | images/figures/professional/ | professional surfaces                        |
| FIG-045                                                                          | PROVENANCE-LINEAGE              | PHIOS-FIGURE-PROVENANCE-LINEAGE-v1.svg              | SVG | images/figures/professional/ | professional surfaces                        |
| FIG-046                                                                          | PROFESSIONAL-JUDGMENT-BOUNDARY  | PHIOS-FIGURE-PROFESSIONAL-JUDGMENT-BOUNDARY-v1.svg  | SVG | images/figures/professional/ | professional-boundary.html                   |
| FIG-047                                                                          | CONSENT-SHARING                 | PHIOS-FIGURE-CONSENT-SHARING-v1.svg                 | SVG | images/figures/professional/ | professional-consent-sharing.html            |
| FIG-048                                                                          | APPROVAL-FLOW                   | PHIOS-FIGURE-APPROVAL-FLOW-v1.svg                   | SVG | images/figures/professional/ | professional surfaces                        |
| FIG-049                                                                          | PROFESSIONAL-ACTION             | PHIOS-FIGURE-PROFESSIONAL-ACTION-v1.svg             | SVG | images/figures/professional/ | professional surfaces                        |
| FIG-050                                                                          | OUTCOME-REVIEW                  | PHIOS-FIGURE-OUTCOME-REVIEW-v1.svg                  | SVG | images/figures/professional/ | professional-reports.html                    |
| FIG-051                                                                          | PROFESSIONAL-GUIDANCE-FULL-FLOW | PHIOS-FIGURE-PROFESSIONAL-GUIDANCE-FULL-FLOW-v1.svg | SVG | images/figures/professional/ | professional-workspace.html, services.html   |
| FIG-052                                                                          | PRIVACY-DATA-BOUNDARY           | PHIOS-FIGURE-PRIVACY-DATA-BOUNDARY-v1.svg           | SVG | images/figures/professional/ | professional-data-privacy.html, privacy.html |

## B9｜Account / Membership / Continuity

| Code Semantic Name Official Filename Canonical Format R2 Path Primary Consumers  |                           |                                               |     |                         |                               |
| -------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------- | --- | ----------------------- | ----------------------------- |
| FIG-053                                                                          | ACCOUNT-REALITY-STRUCTURE | PHIOS-FIGURE-ACCOUNT-REALITY-STRUCTURE-v1.svg | SVG | images/figures/account/ | account.html, membership.html |

Figure global freeze：

```
ALL 57 canonical Figures = SVG
HTML owns long explanation
Figure remains label-light
locale-neutral whenever possible
WebP fallback may be derived from SVG
derived fallback never becomes second canonical authority

```

---

# Appendix C｜Companion Assets That Must Stay Separate

## C1｜Book Covers / Branding

继续保留：

```
BRAND-001 VOLUME-I-REALITY-FORMATION
BRAND-002 VOLUME-II-REALITY-RUNTIME
BRAND-003 VOLUME-III-REALITY-CONTINUITY
BRAND-004 VOLUME-IV-REALITY-CIVILIZATION
BRAND-005 VOLUME-V-REALITY-NAVIGATION

```

Canonical cover storage 继续：

```
books/covers/book-X/

```

不要为了 Homepage registry 复制第二套 cover authority。

## C2｜Book Previews

继续：

```
books/previews/book-1/
books/previews/book-2/

```

## C3｜Homepage Critical Icon Subset

优先：

```
ICON-003 FIVE-BOOKS
ICON-006 KNOWLEDGE
ICON-007 PERSONAL-REALITY
ICON-008 FINANCIAL-REALITY
ICON-009 REALITY-WORKSPACE
ICON-010 READING
ICON-011 EVIDENCE
ICON-012 NAVIGATION
ICON-013 CONTINUITY
ICON-014 ACADEMY
ICON-015 PROFESSIONAL
ICON-018 SEARCH

```

Canonical：

```
SVG

```

Icon 不计入：

```
23 Hero
57 Figure
80 Hero/Figure total

```

---

# Final Freeze Summary

```
FINAL HERO COUNT = 23
FINAL FIGURE COUNT = 57
FINAL HERO/FIGURE TOTAL = 80

WHOLE VISUAL REGISTRY PLANNING = 152 identities

HPC2-PRE BLOCKING VISUAL SET = 16

```

```
HERO
= WebP
= 2560 × 1440
= 16:9
= no embedded long copy
= no fake UI
= no buttons
= no logo
= locale-neutral by default

```

```
FIGURE
= canonical SVG
= HTML carries long explanation
= label-light
= locale-neutral whenever possible
= WebP only as registered derivative fallback

```

```
NEW HOMEPAGE SUCCESSOR FIGURES

FIG-054 CURRENT-REALITY-MAP
FIG-055 MANY-LENSES-FRAGMENTATION
FIG-056 PHIOS-RUNTIME-CYCLE
FIG-057 CONTINUITY-LOOP

```

最终 acceptance：

```
R2
→ Registry
→ Resolver
→ Actual Homepage
→ Browser Visible
→ Human Accepted

```

**只有完成这条链，HPC2-PRE 才等于完成。**