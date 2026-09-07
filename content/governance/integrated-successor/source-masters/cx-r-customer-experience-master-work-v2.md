CX-R11  Perspectives Hub + Relationship + Profile / Assessment

↓

CX-R14  Professional

↓

CX-R15  Account

↓

CX-R16  Academy

↓

CX-R17  I18N

↓

CX-R18  Responsive

↓

CX-R19  Accessibility

↓

CX-R21  Consent UX

↓

CX-R22  Future Runtime Slots

↓

CX-R23  Visual QA

↓

CX-R24  Performance

↓

CX-R25  Full Route Cutover

↓

CX-R26  Mandatory Physical Legacy Retirement

↓

CX-R27  Production Parity

↓

CX-R28  Full Regression

↓

CX-R29  Final Freeze

↓

CX-R30  Post-Cutover Protection

MASTER WORK STEP v2 — CONTEXTUAL ASK / RELATIONSHIP / PROFILE SUCCESSOR

**Status:** GOVERNING CUSTOMER EXPERIENCE SUCCESSOR

**Companion product authority:** `PHI-OS-PPR-R2-REL-PROFILE-ASSESSMENT-SUCCESSOR-MASTER-WORK-v2`

**Critical boundary:** CX owns routes, shell, components, consent presentation and context selection. It does **not** own method meaning, Profile scoring truth, Relationship semantics, Narrative truth, commerce entitlement or Current Reality truth.

Successor principle:

```text
MANY KNOWLEDGE SOURCES / PRODUCT IRs
        ↓
EXPLICIT CONTEXT SELECTION
        ↓
ONE ASK PHI OS
        ↓
SOURCE-AWARE ANSWER
        ↓
REALITY / READING / RELATIONSHIP / PROFILE / PROFESSIONAL NEXT STEP

```

The canonical Ask route is:

```text
/knowledge/ask/

```

Compatibility only:

```text
/ask
ask.html
legacy Ask URLs
→ 308 /knowledge/ask/

```

No active production UI authority may remain at the compatibility URLs after cutover.

---

```
```

```
Baseline
CURRENT main = reconcile at execution start; do not hard-code a stale SHA in this governing plan

Program Code
CX-R

Program Type
CUSTOMER EXPERIENCE REBUILD PROGRAM

NOT:
new Runtime authority
new Meaning authority
new Knowledge authority
new Report authority
new Professional authority

Consumes:
CPR
WPR
PDS
CKA / KAP
RMO
RRE
JR
RNE
PR
RR
Financial runtimes
Method runtimes
Knowledge runtimes
Account
RDG

```

最终目标：

```
```

```
BACKEND CANONICAL AUTHORITY
        ↓
CUSTOMER PROJECTION
        ↓
ONE CUSTOMER UI SYSTEM
        ↓
ONE GLOBAL SHELL
        ↓
COHERENT SURFACES
        ↓
PRODUCTION

```

绝对禁止再次变成：

```
```

```
old CSS
+
new CSS
+
page-specific patch
+
runtime-specific patch
+
WPR patch
+
production patch
+
!important

```

---

# GLOBAL INVARIANTS｜整个 CX-R 期间不能违反

## GI-1｜Backend authority 不重建

以下保留原 authority：

```
```

```
RDG
RMO
MPA
Method Runtime
CMR
Knowledge Authority
RRE
JR
RNE
PR
RR
CPR
WPR
FDR
FCR
FAR
HFP
PFR
KAU
KPP
PJA
KI
CAR
ALR
ORC
MRM-S

```

CX-R 只能消费。

不能建立：

```
```

```
CX Meaning Authority
CX Report Authority
CX Knowledge Authority
CX Reality Authority
CX Professional Authority
CX Navigation Authority

```

---

# GI-2｜客户界面不显示后台架构缩写

Production customer UI 禁止把：

```
```

```
RMO
CMR
RRE
JR
RNE
RDG
FDR
FCR
FAR
HFP
PFR
CPR
WPR
MRM-S

```

作为主要客户导航语言。

允许：

```
```

```
debug
internal inspector
admin
developer docs
professional evidence panel where justified

```

客户语言冻结为：

```
```

```
Understand
My Reality
Perspectives
Navigation
Actions
Review
Continuity
Knowledge
Professional
Reports
History

```

---

# GI-3｜新 Customer Surface 禁止旧 CSS 进入

新 Surface 不得加载：

```
```

```
/assets/css/tokens.css
/assets/css/design/foundation.css
/assets/css/design/typography.css
/assets/css/design/layout.css
/assets/css/design/components.css
/assets/css/public-experience.css
/assets/css/runtime-spine.css
/assets/css/client-production-surfaces.css
/assets/css/wpr-public-production.css

```

以及：

```
```

```
ast-production-meaning.css
bzr-production-meaning.css
num-production-meaning.css
zi-wei-dynamic-runtime.css

```

等 method-global CSS。

这些只能：

```
```

```
LEGACY pages

```

暂时消费。

**任何已经迁移到 CX-R 的 route：零旧 CSS dependency。**

---

# GI-4｜禁止旧 class namespace

新 Customer UI 禁止出现：

```
```

```
puxr-
public-
rs-
pr-
px2-
wpr-
phi-public-

```

作为新布局 component namespace。

统一：

```
```

```
cx-

```

例如：

```
```

```
cx-shell
cx-header
cx-hero
cx-workspace
cx-card
cx-stage
cx-runtime-panel
cx-report

```

---

# GI-5｜不复制旧 HTML Composition

旧页面允许提取：

```
```

```
copy
links
semantic content
runtime binding
data contract
asset ID
locale string

```

禁止：

```
```

```
copy old section HTML
copy old DOM tree
copy old CSS classes
copy old responsive structure
copy old hero composition

```

原则：

> **Content may migrate. Composition does not migrate.**

---

# GI-6｜只有一个 Customer Shell

最终：

```
```

```
Header
Navigation
Locale
Account
Search / Ask entry
Main
Footer
Modal / Drawer
Toast
Accessibility

```

只能有一套实现。

禁止：

```
```

```
homepage header
reality header
professional header
personal runtime header
academy header
financial header

```

各自发展。

---

# GI-7｜只有一个 Customer Design System

最终 production customer CSS：

```
```

```
assets/customer-ui/

```

拥有唯一客户 visual authority。

PDS 仍是 upstream design authority。

CX UI 是：

```
```

```
PDS
↓
customer implementation

```

不是第二 PDS。

---

# GI-8｜新首页不得出现开发者解释

禁止：

```
```

```
this runtime should be visible
this page should not...
we moved...
this surface...
production runtime
authority
frozen
canonical registry

```

客户看到的全部必须是产品语言。

---

# GI-9｜不存在的能力不能伪装上线

未来：

```
```

```
LRM
RCL
VAL
RME
AIR
CIV

```

可以预留 UI contract。

不能显示：

```
```

```
Reality Stability Score
Validated Insight
AI Navigation
Longitudinal Pattern
Research-backed

```

除非相应 Runtime / MRM evidence 真正达到所需状态。

---

# GI-10｜最终 Cutover Gate

Production active route 必须满足：

```
```

```
0 legacy stylesheet
0 legacy shell
0 old logo
0 legacy header
0 old hero composition
0 duplicate CTA architecture
0 placeholder asset
0 broken R2 image
0 internal reconciliation copy
0 duplicated customer navigation

```

---

# PHASE CX-R0｜CURRENT AUTHORITY & SURFACE RECONCILIATION

目的：

> 在动任何 UI 前明确：什么属于 backend truth，什么属于 presentation，什么是旧界面债务。

---

## CX-R0-W0｜Baseline Freeze

建立：

```
```

```
content/customer-experience-rebuild/
  authority/
    cx-r-baseline-v1.json

```

记录：

```
```

```
baselineCommit
customerRoutes
currentShells
currentCSSBundles
currentJSBundles
currentAssets
currentLogos
runtimeConsumers
productionRoutes

```

必须固定：

```
```

```
baselineCommit = 3ccbb604...

```

Exit：

```
```

```
baseline captured
no source changed

```

---

## CX-R0-W1｜Current Customer Surface Inventory

扫描所有客户页面。

建立：

```
```

```
surface-inventory-v1.json

```

每个页面保存：

```
```

```
route
htmlPath
surfaceType
currentHeader
currentFooter
css[]
js[]
runtimeDependencies[]
assetDependencies[]
authRequirement
localeSupport
productionStatus
migrationPriority

```

至少覆盖：

```
```

```
/
about/*
books/*
articles/*
knowledge-search
search/*
readings/*
personal-runtime
professional/personal-runtime/*
professional/financial/*
reality/*
reality-dashboard
services
academy/*
account*
reports*
appointments*

```

---

## CX-R0-W2｜CSS Dependency Audit

建立：

```
```

```
css-dependency-audit-v1.json

```

统计：

```
```

```
stylesheet
numberOfConsumers
selectors
globalSelectors
importantCount
duplicateTokens
duplicateLayoutRules
duplicateTypography
duplicateHeaderRules
duplicateCardRules
duplicateHeroRules

```

必须特别列：

```
```

```
tokens.css
foundation.css
typography.css
layout.css
components.css
public-experience.css
wpr-public-production.css
runtime-spine.css
client-production-surfaces.css
method CSS
reality-dashboard.css
phios-public-v2.css

```

输出：

```
```

```
legacy-css-retirement-map-v1.json

```

---

## CX-R0-W3｜JavaScript Composition Audit

审计：

```
```

```
global shell
locale
header injection
footer injection
asset loading
runtime hydration
account
search
ask
reality
method runtime
navigation

```

建立：

```
```

```
js-dependency-audit-v1.json
legacy-js-retirement-map-v1.json

```

---

## CX-R0-W4｜Customer Language Audit

抓取所有 visible copy。

分类：

```
```

```
CUSTOMER
INTERNAL
DEVELOPER
GOVERNANCE
PLACEHOLDER
LEGACY

```

禁止新的 production UI 继续出现 INTERNAL / DEVELOPER。

输出：

```
```

```
customer-copy-audit-v1.json

```

---

## CX-R0-W5｜Logo / Identity Audit

扫描：

```
```

```
logo
favicon
header mark
footer mark
legacy φ
old PNG
old SVG
text-logo

```

建立：

```
```

```
customer-brand-asset-authority-v1.json

```

最终每个 production customer page 只能消费 canonical logo authority。

---

## CX-R0-W6｜Asset Availability Audit

审计所有：

```
```

```
Hero
Illustration
Book cover
Figure
Icon
Article image
Professional image
Runtime image

```

验证：

```
```

```
exists
R2 reachable
correct MIME
correct dimensions
correct version
correct path

```

建立：

```
```

```
customer-asset-availability-v1.json

```

禁止：

```
```

```
HTML says asset exists
but image silently disappears

```

---

## CX-R0-W7｜Backend → Customer Projection Matrix

建立核心文件：

```
```

```
backend-customer-projection-map-v1.json

```

映射：

```
```

```
CKA/KAP
→ Ask

ICR/RDG/RMO
→ My Reality

MPA + Methods + CMR
→ Perspectives

RRE
→ Reading / Understanding

JR
→ Progress

RNE
→ Navigation

PR/PFR
→ Professional Review

RR
→ Report

CPR
→ Presentation

WPR
→ Web Delivery

LRM future
→ History

RCL future
→ Case / Learning / Research projection

VAL future
→ Validation disclosure

RME future
→ Metrics

```

---

## CX-R0-W8｜Do-Not-Rebuild Authority Contract

建立：

```
```

```
cx-r-no-second-authority-contract-v1.json

```

禁止 CX-R：

```
```

```
calculate method
create meaning
decide knowledge truth
create reality state
make professional judgment
assemble canonical report
determine validation
create metric

```

---

## CX-R0-W9｜R0 Acceptance

Checker：

```
```

```
scripts/check-cx-r0-baseline.mjs

```

package：

```
```

```
npm run check:cx-r0

```

Exit：

```
```

```
CURRENT_SURFACE_INVENTORY_COMPLETE
LEGACY_DEPENDENCIES_MAPPED
NO_SECOND_AUTHORITY
READY_FOR_QUARANTINE

```

---

# PHASE CX-R1｜LEGACY PRESENTATION QUARANTINE

这一阶段决定这次会不会再次失败。

目的：

> 旧 UI 可以暂时存在，但绝不能继续进入新的 Customer Surface。

---

## CX-R1-W0｜Legacy Namespace

建立：

```
```

```
content/customer-experience-rebuild/legacy/

```

registry：

```
```

```
legacy-customer-presentation-registry-v1.json

```

所有现有 Customer UI 标记：

```
```

```
LEGACY_ACTIVE
LEGACY_MIGRATING
LEGACY_RETIRED

```

---

## CX-R1-W1｜Legacy CSS Freeze

给旧 stylesheet 建立 freeze inventory。

禁止：

```
```

```
继续增加新 design
继续增加新 component
继续增加新 general layout

```

从此以后：

> legacy CSS 只允许 defect fix，不允许新增未来 UI。

---

## CX-R1-W2｜New Surface Import Guard

建立 checker：

```
```

```
scripts/check-cx-no-legacy-css.mjs

```

扫描 `data-cx-surface` 页面。

如果发现：

```
```

```
/assets/css/tokens.css
/assets/css/design/*
public-experience.css
runtime-spine.css
wpr-*.css
method CSS

```

直接 fail。

---

## CX-R1-W3｜Legacy Class Guard

建立：

```
```

```
scripts/check-cx-no-legacy-selectors.mjs

```

禁止新页面：

```
```

```
class="puxr-..."
class="rs-..."
class="pr-..."
class="public-..."

```

---

## CX-R1-W4｜No Old Component Copy

生成：

```
```

```
legacy-component-signature-registry-v1.json

```

保存典型旧结构 fingerprint：

```
```

```
old header
old hero
old pillar
old product grid
old journey shell
old reality card

```

检查新页面不得只是 rename class 后复制。

---

## CX-R1-W5｜Legacy Route Isolation

旧页面仍需要临时运行时：

```
```

```
legacy=true

```

新 route：

```
```

```
cx=true

```

两者不能：

```
```

```
cross-import styles
cross-import layout

```

---

## CX-R1-W6｜Acceptance

```
```

```
npm run check:cx-r1

```

Exit：

```
```

```
LEGACY_PRESENTATION_QUARANTINED
NEW_CUSTOMER_SURFACES_CLEAN_ROOM_READY

```

---

# PHASE CX-R2｜CUSTOMER MAIN CHAIN & INFORMATION ARCHITECTURE

这是整次 rebuild 的 UX authority。

---

## CX-R2-W0｜Customer Experience Spine

建立：

```
```

```
customer-experience-spine-v1.json

```

冻结：

```
```

```
UNDERSTAND
↓
ESTABLISH
↓
READ
↓
NAVIGATE
↓
ACT
↓
OBSERVE
↓
REVIEW
↓
CONTINUE

```

对客户可以压缩显示为：

```
```

```
Understand
Read
Choose
Act
Observe
Review
Continue

```

---

## CX-R2-W1｜Customer Intent Model

入口不是产品目录。

定义三种主 intent：

```
```

```
QUESTION
PERSPECTIVE
REALITY_WORK

```

客户语言：

```
```

```
I have a question
I want another perspective
I need to work through something real

```

---

## CX-R2-W2｜Global IA

冻结一级导航：

```
```

```
Explore
My Reality
Perspectives
Knowledge
Professional

```

Utilities：

```
```

```
Search
Ask PHI OS
Account
Locale

```

禁止新增一级：

```
```

```
Reality Journey
Readings
Services
Academy
Reports
Financial
Books

```

这些必须进入正确 domain。

---

## CX-R2-W3｜Explore IA

```
```

```
Explore
├── What is PHI OS
├── How it works
├── Start here
├── Five Books
├── Articles
└── About

```

---

## CX-R2-W4｜My Reality IA

```
```

```
My Reality
├── Overview
├── Current Reality
├── Perspectives
├── Navigation
├── Actions
├── Review
├── History
└── Reports

```

History：

```
```

```
future LRM gated

```

---

## CX-R2-W5｜Perspectives IA

```
```

```
Perspectives
├── Personal Reality
├── Relationship
├── Current Context
├── Astrology
├── BaZi
├── Zi Wei
├── Human Design
├── Numerology
├── I Ching
└── Tarot

```

显示状态必须读取 MPA / activation。

不能 hard-code “available”。

---

## CX-R2-W6｜Knowledge IA

```
```

```
Knowledge
├── Ask PHI OS
├── Search
├── Articles
├── Five Books
├── Figures
├── Concepts / Glossary
└── Academy

```

---

## CX-R2-W7｜Professional IA

```
```

```
Professional
├── Financial Reality
├── Professional Review
├── Reports
├── Services
└── Appointments

```

---

## CX-R2-W8｜Account IA

现在：

```
```

```
Account
├── Continue
├── My Reality
├── Recent Perspectives
├── Reports
├── Saved Knowledge
└── Settings

```

未来 LRM：

```
```

```
History
Observations
Outcomes
Continuity

```

---

## CX-R2-W9｜Journey De-promotion

冻结：

```
```

```
Reality Journey ≠ first-level product

```

JR 只表现为：

```
```

```
workspace progress
stage
continuation
handoff

```

可以保留兼容 route。

但不再进入 top navigation。

---

## CX-R2-W10｜Customer Surface Registry

建立：

```
```

```
customer-surface-registry-v1.json

```

例如：

```
```

```
HOME
EXPLORE
MY_REALITY
PERSONAL_REALITY
FINANCIAL_REALITY
PERSPECTIVES
KNOWLEDGE
ASK
PROFESSIONAL
ACCOUNT
REPORT

```

字段：

```
```

```
surfaceId
route
customerPurpose
runtimeConsumers
authRequirement
primaryAction
secondaryAction
futureDependencies

```

---

## CX-R2-W11｜Acceptance

```
```

```
npm run check:cx-r2

```

Exit：

```
```

```
CUSTOMER_MAIN_CHAIN_FROZEN
GLOBAL_IA_FROZEN
REALITY_JOURNEY_DEMOTED

```

---

# PHASE CX-R3｜CUSTOMER DESIGN SYSTEM v1

这次不能边做页面边发明风格。

先完整建立 UI system。

目录：

```
```

```
assets/customer-ui/

  tokens.css
  base.css
  typography.css
  layout.css
  components.css
  motion.css
  utilities.css

  surfaces/

```

---

## CX-R3-W0｜Design Principles

冻结：

```
```

```
quiet
editorial
spacious
precise
premium
human
evidence-aware
non-mystical
non-dashboard-heavy
non-SaaS-template

```

---

## CX-R3-W1｜Color Authority

建立客户 palette。

需要角色，不按页面乱选：

```
```

```
canvas
surface
surface-raised
ink
ink-muted
border
accent
accent-soft
success
warning
critical
unknown
professional

```

Book / Method 可以有 domain accent。

但不能改变整个 UI architecture。

---

## CX-R3-W2｜Typography

最多：

```
```

```
Display
Body
Mono / Data optional

```

冻结：

```
```

```
display-xl
display-lg
heading-1
heading-2
heading-3
body-lg
body
body-sm
label
caption

```

不允许页面各自定义 `font-size: clamp(...)`。

---

## CX-R3-W3｜Spacing

建立：

```
```

```
space-1
space-2
space-3
...
space-12

```

统一：

```
```

```
section padding
card padding
grid gap
hero spacing
workspace spacing

```

---

## CX-R3-W4｜Layout System

建立：

```
```

```
cx-container
cx-container--wide
cx-container--reading
cx-stack
cx-cluster
cx-grid
cx-split
cx-sidebar-layout

```

---

## CX-R3-W5｜Radius / Shadow / Border

统一。

禁止页面自己：

```
```

```
border-radius: 17px
24px
28px
32px

```

无限扩张。

---

## CX-R3-W6｜Buttons

只允许：

```
```

```
Primary
Secondary
Quiet
Text
Critical
Icon

```

每种：

```
```

```
default
hover
focus
disabled
loading

```

---

## CX-R3-W7｜Cards

建立：

```
```

```
Content Card
Perspective Card
Reality Card
Navigation Option Card
Evidence Card
Unknown Card
Book Card
Professional Card
Report Card

```

不同 semantic。

不是所有东西都变成一样的白色圆角卡。

---

## CX-R3-W8｜Form System

统一：

```
```

```
input
textarea
select
date
time
segmented
radio
checkbox
consent
error
helper

```

Personal / Financial / Reality 不得再各写一套表单。

---

## CX-R3-W9｜Status System

统一：

```
```

```
Available
Limited
Unavailable
In Review
Unknown
Needs Attention
Professional Required

```

---

## CX-R3-W10｜Evidence UI

必须建立：

```
```

```
Evidence
Source
Unknown
Confidence
Assumption
Limitation
Professional note

```

视觉语言。

这是 PHI OS 与普通 chatbot 的关键差异。

---

## CX-R3-W11｜Runtime Result System

建立通用 result primitives：

```
```

```
cx-result-section
cx-result-finding
cx-result-context
cx-result-evidence
cx-result-unknown
cx-result-perspective
cx-result-action

```

Method 只能消费这些。

不能自创整个 UI。

---

## CX-R3-W12｜Workspace Components

建立：

```
```

```
Workspace Header
Context Summary
Stage Rail
Progress
Tab Navigation
Side Context
Main Content
Continuation CTA

```

---

## CX-R3-W13｜Motion

只允许：

```
```

```
fade
reveal
expand
drawer
modal
stage transition

```

禁止 decorative motion overpower information。

---

## CX-R3-W14｜Accessibility

基础要求：

```
```

```
WCAG AA contrast
keyboard
visible focus
reduced motion
semantic headings
labels
aria for interactive controls

```

---

## CX-R3-W15｜Design System Acceptance

建立：

```
```

```
/customer-ui-preview/

```

内部 component showcase。

Checker：

```
```

```
npm run check:cx-r3

```

Exit：

```
```

```
CUSTOMER_UI_SYSTEM_READY
NO_PAGE_SPECIFIC_DESIGN_AUTHORITY

```

---

# PHASE CX-R4｜CANONICAL VISUAL ASSET SYSTEM

你已经做了大量好图。

这次必须真正被消费。

---

## CX-R4-W0｜Asset Registry Reconciliation

建立：

```
```

```
customer-visual-asset-registry-v1.json

```

类型：

```
```

```
HERO
ILLUSTRATION
BOOK_COVER
FIGURE
ICON
PROFESSIONAL
ARTICLE

```

---

## CX-R4-W1｜Hero Mapping

每个 surface 最多一个 canonical hero role。

例如：

```
```

```
HOME
MY_REALITY
PERSONAL
FINANCIAL
KNOWLEDGE
PROFESSIONAL
ACADEMY

```

---

## CX-R4-W2｜Five Book Cover Mapping

Book I–V 必须使用真实 canonical covers。

禁止再使用纯 CSS gradient card 代替已经存在的书封面。

---

## CX-R4-W3｜Illustration Mapping

绑定：

```
```

```
ILL-001 Knowledge Landscape
ILL-002 Reading Path
ILL-003 Knowledge Discovery
ILL-004 Membership
ILL-005 Personal Reality
ILL-006 Financial Reality
ILL-007 Academy
ILL-008 Professional Workspace
ILL-009 Digital Reading
ILL-010 Reality Workspace Continuity

```

按 semantic role 使用。

---

## CX-R4-W4｜Image Delivery

建立统一 helper：

```
```

```
resolveCustomerAsset(assetId)

```

负责：

```
```

```
R2 URL
MIME
fallback
loading
decoding
fetchpriority
availability

```

---

## CX-R4-W5｜Broken Image Gate

Production 页面：

```
```

```
img expected
+
asset unavailable
=
check failure

```

禁止 silent blank。

---

## CX-R4-W6｜Acceptance

```
```

```
npm run check:cx-r4

```

---

# PHASE CX-R5｜SINGLE CUSTOMER SHELL

这是最重要的代码基础之一。

---

## CX-R5-W0｜Shell Files

建立：

```
```

```
assets/customer-ui/shell.js
assets/customer-ui/navigation.js
assets/customer-ui/locale.js
assets/customer-ui/dialog.js
assets/customer-ui/assets.js

```

---

## CX-R5-W1｜Header

Header：

```
```

```
PHI OS

Explore
My Reality
Perspectives
Knowledge
Professional

Search
Ask
Account
Locale

```

Desktop / mobile 同 authority。

---

## CX-R5-W2｜Mobile Navigation

不是 desktop menu 缩小。

建立真正 mobile drawer。

---

## CX-R5-W3｜Search

Global Search 使用现有 search backend。

UI 统一。

---

## CX-R5-W4｜Ask Entry

Header 提供：

```
```

```
Ask PHI OS

```

打开 global Ask drawer / page。

---

## CX-R5-W5｜Account Entry

统一状态：

```
```

```
Guest
Authenticated
Professional

```

---

## CX-R5-W6｜Footer

只保留有意义的信息：

```
```

```
Explore
Knowledge
Professional
Books
Privacy
Terms
Accessibility
Language

```

---

## CX-R5-W7｜Locale

EN / zh-Hans。

禁止页面自己实现 locale toggle。

---

## CX-R5-W8｜Shell Isolation

新 shell：

```
```

```
does not inject legacy header
does not consume old public header placeholder

```

---

## CX-R5-W9｜Acceptance

```
```

```
npm run check:cx-r5

```

Exit：

```
```

```
ONE_GLOBAL_CUSTOMER_SHELL

```

---

# PHASE CX-R6｜HOMEPAGE TOTAL REBUILD

不是编辑当前首页。

**新建 Composition。**

---

## CX-R6-W0｜Homepage Authority

建立：

```
```

```
homepage-customer-composition-v1.json

```

只允许 H01–H09。

---

# CX-R6-W1｜H01 Hero

内容：

```
```

```
Reality keeps changing.

Understand where you are.
See what matters.
Choose what comes next.

```

中文：

```
```

```
现实一直在变化。

看清你在哪里。
理解什么正在发生。
决定下一步怎样走。

```

Primary：

```
```

```
Start with my reality

```

Secondary：

```
```

```
Ask PHI OS

```

禁止：

```
```

```
five mode grid
product structure card
three additional CTA
developer copy

```

Hero 必须使用 canonical visual。

---

# CX-R6-W2｜H02 One Reality

表达：

```
```

```
One life.
Many kinds of information.
One place to bring them together.

```

视觉围绕：

```
```

```
work
money
relationships
family
health context
decisions
patterns
time

```

汇入：

```
```

```
My Reality

```

---

# CX-R6-W3｜H03 Three Ways to Begin

三种入口：

```
```

```
I have a question
→ Ask PHI OS

I want another perspective
→ Explore Perspectives

I need to work through something real
→ Start My Reality

```

---

# CX-R6-W4｜H04 Flagship Runtime Experiences

两张大型视觉 surface：

```
```

```
Personal Reality
Financial Reality

```

必须：

```
```

```
large image
clear customer value
one CTA

```

不能变成小 pillar。

---

# CX-R6-W5｜H05 Perspectives

显示 production eligible methods。

每个：

```
```

```
name
lens
short explanation
availability

```

不显示 fortune language。

---

# CX-R6-W6｜H06 Five Books

真实五册封面。

支持：

```
```

```
Book I → V

```

每本：

```
```

```
title
one-line role
open book page

```

---

# CX-R6-W7｜H07 Knowledge Landscape

显示：

```
```

```
Books
Articles
Figures
Concepts
Ask

```

让客户理解：

> Ask 背后有 Knowledge System。

---

# CX-R6-W8｜H08 How PHI OS Works

主 visual：

```
```

```
UNDERSTAND
↓
CHOOSE
↓
ACT
↓
OBSERVE
↓
REVIEW
↓
CONTINUE
↺

```

可加入：

```
```

```
Read

```

但保持易懂。

---

# CX-R6-W9｜H09 Continuity

文案：

```
```

```
Reality will keep changing.

Your understanding
should be able to change with it.

```

Primary：

```
```

```
Start with my reality

```

Secondary：

```
```

```
Ask PHI OS

```

---

## CX-R6-W10｜Homepage Content Removal

必须删除：

```
```

```
“should be visible”
“should not be hidden”
“bring runtime back to front”
“Reality Journey should not...”

```

等内部修复语言。

---

## CX-R6-W11｜Homepage Acceptance

检查：

```
```

```
desktop
tablet
mobile
EN
ZH
guest
account
assets
CTA

```

```
```

```
npm run check:cx-home

```

---

# PHASE CX-R7｜EXPLORE EXPERIENCE

---

## CX-R7-W0｜Explore Landing

回答：

```
```

```
What is PHI OS?
Why does it exist?
How is it different?
Where do I start?

```

---

## CX-R7-W1｜Why PHI OS

迁移 v8 有价值内容：

```
```

```
AI can answer
fragmentation
market gap
self-discovery → reality navigation
PHI OS position

```

但重新排版。

不复制旧 page。

---

## CX-R7-W2｜How It Works

客户链：

```
```

```
Understand
Read
Navigate
Act
Review
Continue

```

---

## CX-R7-W3｜Start Here

根据 intent：

```
```

```
Question
Perspective
Reality
Professional
Learning

```

---

## CX-R7-W4｜Acceptance

```
```

```
npm run check:cx-explore

```

---

# PHASE CX-R8｜KNOWLEDGE EXPERIENCE

---

## CX-R8-W0｜Knowledge Home

不能只是列表。

组成：

```
```

```
Search
Ask
Featured Articles
Books
Figures
Concepts
Learning

```

---

## CX-R8-W1｜Search

统一 result：

```
```

```
title
type
book / node
summary
source
related

```

---

## CX-R8-W2｜Articles

把现有 published PJA article 真正展示。

支持：

```
```

```
latest
volume
topic
related

```

---

## CX-R8-W3｜Books

五册系统完整 landing。

使用真实封面。

---

## CX-R8-W4｜Figures

建立 Visual Knowledge Library。

---

## CX-R8-W5｜Knowledge → Ask

文章 / figure / book 都允许：

```
```

```
Ask about this

```

传入 explicit context。

不能 silent context consume。

---

# PHASE CX-R9-R2｜CONTEXTUAL ASK PHI OS

Ask PHI OS is one contextual answer surface. It is not a generic chatbot product and does not become a new answer authority.

---

## CX-R9R2-W0｜Ask Contract v2

Establish:

```text
contextual-ask-contract-v2.json

```

Consumes:

```text
CKA
KAP
Knowledge
Current Facts Gateway
Current Reality Customer View
Governed Personal Reading
Stored NarrativeReadingIR
Governed Relationship Reading
Stored Relationship Narrative
ProfileSignalEnvelope
SelfAssessmentResultIR
Continuity Context when entitled

```

Ask owns:

```text
question intake
explicit context selection
context disclosure
answer composition shell
provenance display
next-step handoff

```

Ask does not own:

```text
calculation
meaning admission
Profile scoring truth
Relationship semantics
Current Reality truth
Narrative factual authority
professional recommendation
entitlement truth

```

Gate: `check:cx-r9-r2:w0-contract`.

---

## CX-R9R2-W1｜Context Source Registry

Establish:

```text
ask-context-source-registry-v1.json

```

Context types:

```text
KNOWLEDGE
CURRENT_FACTS
CURRENT_REALITY
PERSONAL_GOVERNED_READING
PERSONAL_PAID_NARRATIVE
RELATIONSHIP_GOVERNED_READING
RELATIONSHIP_PAID_NARRATIVE
EXTERNAL_PROFILE
PHI_SELF_ASSESSMENT
REASONING_TASK_PERFORMANCE
CONTINUITY_CONTEXT
PROFESSIONAL_CASE_CONTEXT

```

Each source declares:

```text
contextType
sourceAuthority
sourceClass
participantScope
caseScope
consentRequired
entitlementRequired
freshnessPolicy
answerUseBoundary
customerDisclosureLabel

```

No silent account-wide context sweep.

Gate: `check:cx-r9-r2:w1-context-registry`.

---

## CX-R9R2-W2｜Ask Drawer + Explicit Context Selector

Global entry remains:

```text
What are you trying to understand?

```

Before submit, customer can see / change:

```text
Using:
[ Knowledge ]
[ My current reality ]
[ My reading ]
[ My narrative ]
[ This relationship ]
[ My profile / assessment ]
[ None / question only ]

```

Only available and authorized contexts are shown. MPA / entitlement / consent controls availability.

For Person B or Relationship context, display participant and case scope explicitly.

Gate: `check:cx-r9-r2:w2-context-selector`.

---

## CX-R9R2-W3｜Answer Structure v2

Fixed customer answer composition:

```text
Answer
What this is based on
What is current vs stable
Unknown / limits
Related knowledge or reading
Possible next step

```

When multiple source classes are used, `What this is based on` groups them rather than flattening them.

Example:

```text
Based on:
- your self-reported assessment
- your Astrology reading
- your current-reality note

```

Never imply these sources have equal scientific status.

Gate: `check:cx-r9-r2:w3-answer-structure`.

---

## CX-R9R2-W4｜Quick Answer

Knowledge-only by default.

```text
question
→ KAP
→ governed Knowledge answer

```

No personal context is added unless the customer explicitly selects it.

---

## CX-R9R2-W5｜Guided Contextual Answer

Small explicit context may be used when the customer chooses it.

Examples:

```text
Ask about this article
Ask about this reading
Ask about this relationship
Ask about this assessment result

```

Every handoff carries an explicit source ref / context token, not a copied hidden blob.

---

## CX-R9R2-W6｜Reality Escalation + No Generic AI Surface

If KAP decides the question would benefit from current situation context:

```text
This question would benefit from understanding your current situation.
[Continue with My Reality]

```

Then:

```text
explicit consent
→ RealityEntrySeed

```

Forbidden UI identity:

```text
big chatbot landing
chat bubbles dominating platform
AI personality becoming PHI OS brand identity
silent account context injection

```

---

## CX-R9R2-W7｜Current Facts Gateway

For:

```text
FX / exchange rates
market data
weather
current events
current regulations
current prices
current public facts

```

Ask must not pretend governed PHI OS knowledge is current.

Establish / preserve:

```text
server-side Current Facts Gateway

```

Flow:

```text
Question
↓
KAP classification
↓
CURRENT_FACT_REQUIRED
↓
server-side retrieval
↓
source / timestamp disclosure
↓
bounded answer

```

Current facts:

```text
≠ canonical PHI OS knowledge

```

Must expose:

```text
source
retrievedAt
freshness
limitations

```

Browser-side arbitrary scraping is prohibited.

Gate: `check:cx-r9-r2:w7-current-facts`.

---

## CX-R9R2-W8｜Ask This Reading

Consumes only selected / authorized refs from:

```text
GovernedPersonalReading
stored NarrativeReadingIR
NarrativeBrief refs needed for verification
selected governed claim refs
explicit Current Reality additions

```

Reopening / asking does not regenerate the paid report.

Customer sees exactly which reading is being used.

Gate: `check:cx-r9-r2:w8-ask-this-reading`.

---

## CX-R9R2-W9｜Ask This Relationship

Consumes only:

```text
relationshipIntentId
selected RelationshipReadingIR refs
stored Relationship Narrative
selected ProfileSignalEnvelope refs when customer chooses them
explicit Relationship Current Reality additions
participant scope

```

Must not infer Person B hidden feelings, intentions or private mental state.

New context never silently rewrites the purchased Relationship Narrative.

Gate: `check:cx-r9-r2:w9-ask-this-relationship`.

---

## CX-R9R2-W10｜External Profile Context

Supported context families are registry-controlled, for example:

```text
MBTI_OFFICIAL result import
16P_NERIS result import
IPIP_BIG_FIVE / admitted Big Five
OTHER_EXTERNAL_PROFILE

```

Ask consumes canonical `ProfileSignalEnvelope`, not raw proprietary item banks.

Customer disclosure must say the source family and assessment date when known.

Forbidden:

```text
16P result relabeled as official MBTI
external profile = objective personality fact
profile convergence = proof of symbolic method

```

Gate: `check:cx-r9-r2:w10-external-profile-context`.

---

## CX-R9R2-W11｜PHI Self-Assessment Context

Consumes:

```text
SelfAssessmentResultIR
ProfileSignalEnvelope
ReasoningTaskPerformanceIR optional

```

UI distinguishes:

```text
Self-reported profile
Reasoning task performance

```

Do not display unvalidated quotient language or IQ percentile.

Gate: `check:cx-r9-r2:w11-self-assessment-context`.

---

## CX-R9R2-W12｜Consent + Person / Case Scope

Before using personal context, Ask must show:

```text
what context is being used
why it is used
which person it belongs to
which relationship / case it belongs to
whether it is saved

```

Third-party Person B data:

```text
explicit relationship purpose
minimal collection
no hidden persistence
no unrelated product reuse

```

Gate: `check:cx-r9-r2:w12-scope-consent`.

---

## CX-R9R2-W13｜Entitlement + Continuity Context

Recurring usage is server-authoritative.

Possible entitled contexts:

```text
Ask This Reading
Ask This Relationship
Ask this month
Ask about a saved observation
Ask about changed timing
Ask about selected profile signals

```

The CX surface displays entitlement state but does not own it.

Gate: `check:cx-r9-r2:w13-entitlement`.

---

## CX-R9R2-W14｜Provenance + Source-Class Disclosure

Every answer can expose a collapsed provenance drawer.

For each used source:

```text
label
sourceClass
source authority
participant
assessment / generated date
freshness when applicable
limitations

```

Customer-default wording is human-readable. Internal lifecycle codes remain hidden unless technical details are opened.

Gate: `check:cx-r9-r2:w14-provenance`.

---

## CX-R9R2-W15｜Acceptance + Freeze

Machine acceptance must cover at least 32 Ask scenarios:

```text
knowledge only
current fact
current reality
personal reading
paid narrative
relationship
profile import
self-assessment
reasoning task
multiple source classes
source contradiction
no context
unauthorized context
expired entitlement
Person B scope
freshness disclosure

```

Human review:

```text
Ask is useful but not dominant
context selection is obvious
no hidden context
source classes are understandable
relationship scope is clear
no partner mind-reading
no pseudo-scientific Profile wording
current facts show freshness
mobile works
EN / zh-Hans work

```

Freeze:

```text
contextual-ask-contract-freeze-v2.json
ask-context-source-registry-freeze-v1.json
ask-context-consent-freeze-v1.json
ask-provenance-freeze-v1.json
cx-r9-r2-human-acceptance-v1.json

```

Gate:

```text
npm run check:cx-r9-r2

```

Exit:

```text
ONE_CONTEXTUAL_ASK
ZERO_GENERIC_AI_SURFACE
ZERO_SILENT_CONTEXT_INJECTION

```

---

# PRIORITY PRODUCT TRANCHE P1｜FIRST REAL PRODUCTION CUTOVER

P1 requires these four customer surfaces:

```text
My Reality
Personal Reality
Financial Reality
Ask PHI OS /knowledge/ask/

```

When all four have replacement accepted + route cutover + npm checks + browser smoke, perform the first real cutover. Do not wait for CX-R25.

Establish:

```text
priority-route-cutover-registry-v2.json

```

Verify:

```text
My Reality → new shell
Personal → new shell
Financial → new shell
/knowledge/ask/ → new shell
/ask → 308 /knowledge/ask/
ask.html → compatibility only

0 old logo
0 old header
0 old shell
0 legacy CSS
0 dead CTA
0 legacy Ask UI authority

```

Physical legacy delete happens only after production browser acceptance. Runtime functions, canonical registries, method calculation, Knowledge, Financial, Reality, Report and governance evidence remain intact.

---

# PHASE CX-R10｜MY REALITY WORKSPACE

这将成为整个平台真正核心。

---

## CX-R10-W0｜Workspace Contract

建立：

```
```

```
my-reality-workspace-contract-v1.json

```

Backend：

```
```

```
RMO
RRE
JR
RNE
RDG
RR
future LRM

```

---

## CX-R10-W1｜Workspace Layout

Desktop：

```
```

```
Header
Context Summary
Stage / Progress
Main content
Side context
Continuation

```

Mobile：

```
```

```
stacked

```

---

## CX-R10-W2｜Overview

显示：

```
```

```
What is happening now
What has been established
What remains unknown
Current stage
What may be useful next

```

---

## CX-R10-W3｜Current Reality

显示 canonical Reality。

客户语言：

```
```

```
Current situation
Important facts
Constraints
Open questions
Evidence
Unknowns

```

---

## CX-R10-W4｜Perspectives Tab

所有 method output 都回到一个 workspace。

不是让客户在多个孤立页面间跳。

---

## CX-R10-W5｜Reading

RRE 输出。

呈现：

```
```

```
What stands out
Patterns
Tensions
Dependencies
Unknowns

```

---

## CX-R10-W6｜Navigation

RNE 输出：

```
```

```
Current position
Possible directions
Trade-offs
Risks
Dependencies
Reversibility
Observation points

```

---

## CX-R10-W7｜Actions

由客户 / professional 确认。

不能 AI 自动决定。

---

## CX-R10-W8｜Observe

记录：

```
```

```
what happened
new evidence
change

```

---

## CX-R10-W9｜Review

比较：

```
```

```
previous
current
what changed
what remains

```

---

## CX-R10-W10｜Continuity

现在先支持：

```
```

```
continue journey
resume
next review

```

未来接 LRM。

---

## CX-R10-W11｜Journey UI Migration

旧 Reality Journey 页面功能迁入 workspace。

JR 仍运行。

客户只看到 progression。

---

## CX-R10-W12｜Dashboard Retirement

旧：

```
```

```
reality-dashboard.html

```

迁移后标记：

```
```

```
LEGACY_RETIRED

```

生产 route 指向新 Workspace。

---

# PHASE CX-R11｜PERSPECTIVES HUB — SOURCE-AWARE SUCCESSOR

---

## CX-R11-W0｜Perspective Contract v2

All perspectives project into the shared customer UI.

Fields:

```text
perspectiveId
perspectiveFamily
sourceClass
methodOrInstrument
lens
availability
requiredInput
currentContext
result
evidenceBoundary
limitations

```

---

## CX-R11-W1｜Perspective Hub Information Architecture

Top-level customer groups:

```text
Personal
Relationship
Profile & Assessment
Current Context
Symbolic Reflection

```

Do not visually imply that every group is the same kind of evidence.

---

## CX-R11-W2｜Perspective Families

```text
MEASURED / STANDARDIZED / SELF-REPORTED
- Big Five / admitted profile instruments
- PHI Self-Assessment
- Reasoning Task Performance
- Imported external profile results

SYMBOLIC / INTERPRETIVE
- ECR
- Astrology
- BaZi
- Zi Wei
- Human Design when admitted
- Numerology

REFLECTIVE
- I Ching
- Tarot

```

Availability is MPA / product-authority controlled.

---

## CX-R11-W3｜No Method or Instrument UI Kingdom

No method, assessment or profile provider owns:

```text
own global header
own typography
own card system
own main navigation
own account context system
own Ask surface

```

They produce bounded customer projections into the shared CX system.

---

## CX-R11-W4｜Relationship Surface

Canonical route:

```text
/perspectives/relationship/

```

Consumes governed Relationship product outputs only.

Required states:

```text
no relationship intent
self relationship pattern
specific Person B
missing Person B precision
partial method availability
profile evidence available / unavailable
Current Reality available / unavailable
paid narrative unavailable / ready

```

CX does not calculate relationship meaning.

---

## CX-R11-W5｜Profile & Assessment Surface

Canonical route:

```text
/perspectives/profile/

```

Customer entry options:

```text
Import an external profile
Quick Profile
Full PHI Self-Assessment
Reasoning Tasks
View my Profile signals
Compare with Current Reality

```

Visual language must distinguish:

```text
self-reported
external result
measured task performance
symbolic interpretation

```

Assessment is optional and must not block Personal Reality.

---

## CX-R11-W6｜Unified-Language Legend

Provide a compact reusable UI component explaining:

```text
Measured / task-based
Self-reported
External profile
Symbolic / interpretive
Current Reality
Professional evidence

```

This is the public expression of PHI OS as a unified language without pretending all sources have equal empirical status.

---

## CX-R11-W7｜Acceptance

```text
npm run check:cx-r11

```

Must verify Relationship and Profile routes, MPA availability, source-class labels, no duplicate shell and no method/instrument UI kingdom.

---

# PHASE CX-R12｜PERSONAL REALITY TOTAL MIGRATION

---

## CX-R12-W0｜Personal Surface Identity

客户产品名称：

```
```

```
Personal Reality

```

内部仍可：

```
```

```
Personal Runtime

```

---

## CX-R12-W1｜Input Experience

不要一开始就是技术表格。

分成：

```
```

```
About you
Birth information
What you want to explore
Optional: Deepen my profile
Consent

```

---

Profile / Assessment is never a mandatory prerequisite for symbolic Personal Reality. If selected, use the canonical PRF contracts from the companion Product Master; do not recreate assessment scoring in CX.

---

## CX-R12-W2｜Processing

客户只看到合理状态：

```
```

```
Preparing your perspectives

```

不显示：

```
```

```
MPA
projection runtime
canonical method dispatch

```

---

## CX-R12-W3｜Results Overview

先显示：

```
```

```
How you tend to operate
Decision context
Patterns
Environment
Current timing/context

```

---

## CX-R12-W4｜Perspective Source Disclosure

下面显示：

```
```

```
Perspectives used
Astrology
BaZi
Human Design
Numerology
Zi Wei

```

---

## CX-R12-W5｜Tabs

建议：

```
```

```
Overview
Structure
Current Context
Patterns
Details

```

不要 method 名就是一级 tabs。

---

## CX-R12-W6｜Method Detail

用户主动打开才看到 technical method output。

---

## CX-R12-W7｜Return to Reality

结果可以：

```
```

```
Add this perspective to My Reality

```

必须 explicit。

---

## CX-R12-W8｜Legacy CSS Removal

`personal-runtime.html` 完成迁移后：

必须不再加载当前那一长串 CSS。

这项单独做 acceptance。

---

# PHASE CX-R13｜FINANCIAL REALITY TOTAL MIGRATION

后台：

```
```

```
FDR
→ FCR
→ FAR
→ HFP
→ PFR

```

全部保留。

---

## CX-R13-W0｜Financial Customer Contract

客户 projection：

```
```

```
Current position
Cashflow
Assets
Liabilities
Protection
Goals
Constraints
Findings
Priorities
Options
Professional Review

```

---

## CX-R13-W1｜Financial Intake

分阶段：

```
```

```
Household
Income
Expenses
Assets
Liabilities
Protection
Goals
Documents
Unknowns

```

---

## CX-R13-W2｜Verification Status

每项显示：

```
```

```
Reported
Verified
Assumed
Missing
Outdated

```

---

## CX-R13-W3｜Financial Overview

主视觉不是 calculator。

显示：

```
```

```
Where you are
What is strong
What requires attention
What is unknown

```

---

## CX-R13-W4｜Calculations

FCR 数字可 drill down。

不得让数字自动变建议。

---

## CX-R13-W5｜Findings

FAR：

```
```

```
Strength
Gap
Exposure
Dependency
Mismatch
Shortfall

```

翻译为客户可读语言。

---

## CX-R13-W6｜Planning

HFP：

```
```

```
Priorities
Planning options
Action sequence
Assumptions

```

---

## CX-R13-W7｜Professional Review

PFR / PR：

清楚区分：

```
```

```
System analysis
Professional review
Professional recommendation

```

---

## CX-R13-W8｜Financial Report

进入 RR → Release → CPR。

不得页面自行拼报告。

---

# PHASE CX-R14｜PROFESSIONAL EXPERIENCE

---

## CX-R14-W0｜Professional Home

产品：

```
```

```
Financial Planning
Professional Review
Reports
Services
Appointments

```

---

## CX-R14-W1｜Professional Boundary

所有专业建议清楚显示：

```
```

```
professional name
role
scope
review status
date

```

---

## CX-R14-W2｜Reports

Report list：

```
```

```
Title
Version
Date
Status
Professional

```

---

## CX-R14-W3｜Report Viewer

消费：

```
```

```
Released Report
→ CPR

```

不能读内部 draft。

---

## CX-R14-W4｜Services

重新设计成：

```
```

```
what help is available
who it is for
what happens
what is delivered

```

不要 runtime architecture language。

---

# PHASE CX-R15｜ACCOUNT & CONTINUITY

---

## CX-R15-W0｜Account Home

改名体验：

```
```

```
Your PHI OS

```

组成：

```
```

```
Continue
Current Reality
Recent Perspectives
Reports
Saved Knowledge
Settings

```

---

## CX-R15-W1｜No Hidden History for Guest

保持现有 privacy boundary。

---

## CX-R15-W2｜Future LRM Slot

预留：

```
```

```
History

```

feature gate：

```
```

```
LRM_AVAILABLE

```

false 时完全不显示。

不是显示：

```
```

```
Coming soon

```

占空间。

---

## CX-R15-W3｜Future RCL

客户 account 不暴露：

```
```

```
RCL
CASE-M
Research Eligibility

```

除非未来有真正 client-facing purpose。

---

# PHASE CX-R16｜ACADEMY EXPERIENCE

Academy 不占主导航第一层。

---

## CX-R16-W0｜Academy Placement

```
```

```
Knowledge
→ Learn

```

---

## CX-R16-W1｜Learning Home

显示：

```
```

```
Courses
Reading paths
Lessons
Practice
Progress

```

---

## CX-R16-W2｜ALR Projection

ALR 仍拥有 learning runtime。

Customer UI render。

---

# PHASE CX-R17｜I18N REBUILD

---

## CX-R17-W0｜Locale Authority

继续：

```
```

```
en
zh-Hans

```

但 UI component 不能自己 hard-code双语 span。

---

## CX-R17-W1｜Customer Locale Registry

建立：

```
```

```
assets/js/locales/customer-ui/

```

或 reconcile 当前 locale authority。

---

## CX-R17-W2｜No Dual DOM Language Duplication

禁止：

```
```

```
<span class="zh">...</span>
<span class="en">...</span>

```

在整个 DOM 重复。

改用 locale resolution。

---

## CX-R17-W3｜Layout Testing

必须测试中文长度和英文长度。

---

# PHASE CX-R18｜RESPONSIVE SYSTEM

---

## CX-R18-W0｜Breakpoints

统一。

不允许页面定义自己的 breakpoint universe。

---

## CX-R18-W1｜Mobile First Interaction

移动端：

```
```

```
Hero
Primary CTA
Main product
Workspace
Forms
Results
Navigation

```

全部独立验证。

---

## CX-R18-W2｜No Horizontal Overflow

所有 production customer page：

```
```

```
320
360
390
430
768
1024
1440
1920

```

检查。

---

# PHASE CX-R19｜ACCESSIBILITY & INTERACTION QA

---

## CX-R19-W0｜Keyboard

全部 action keyboard accessible。

---

## CX-R19-W1｜Focus

统一 focus。

---

## CX-R19-W2｜Screen Reader

验证：

```
```

```
header
nav
forms
dialogs
tabs
progress
result sections

```

---

## CX-R19-W3｜Reduced Motion

支持：

```
```

```
prefers-reduced-motion

```

---

# PHASE CX-R20｜RUNTIME PROJECTION ADAPTERS

这是避免 UI 再和 backend 紧耦合的关键。

不要：

```
```

```
page reads raw AST output
page reads raw FAR
page reads raw RMO

```

建立 adapter。

---

## CX-R20-W0｜Projection Boundary

```
```

```
Runtime output
↓
Customer Projection Adapter
↓
Customer View Model
↓
CX UI

```

---

## CX-R20-W1｜Reality Adapter

```
```

```
RMO
→ RealityCustomerView

```

---

## CX-R20-W2｜Readout Adapter

```
```

```
RRE
→ ReadoutCustomerView

```

---

## CX-R20-W3｜Navigation Adapter

```
```

```
RNE
→ NavigationCustomerView

```

---

## CX-R20-W4｜Method Adapter

```
```

```
Canonical Method Projection
+
CMR
→ PerspectiveCustomerView

```

---

## CX-R20-W5｜Financial Adapter

```
```

```
FDR/FCR/FAR/HFP/PFR
→ FinancialCustomerView

```

---

## CX-R20-W6｜Report Adapter

```
```

```
Released RR
→ CPR
→ ReportCustomerView

```

---

## CX-R20-W7｜Knowledge Adapter

```
```

```
KI/PJA
→ KnowledgeCustomerView

```

---

## CX-R20-W8｜No Truth Mutation

Adapter 只能：

```
```

```
rename
group
order
format
localize
hide unauthorized fields

```

不能：

```
```

```
change meaning
infer new finding
calculate
recommend

```

---

# PHASE CX-R21｜CUSTOMER DATA / CONSENT UX

---

## CX-R21-W0｜Consent Interaction

客户必须知道：

```
```

```
what is being used
why
for which case
whether saved

```

---

## CX-R21-W1｜Context Disclosure

Ask / Reality / Professional 均显示：

```
```

```
Using:
Current Reality
Personal Perspective
Financial Context
etc.

```

---

## CX-R21-W2｜No Silent Context

禁止后台自动把 Account 里的所有信息注入 Ask。

---

# PHASE CX-R22｜FUTURE LRM / RCL READINESS

这阶段**只做 integration slot**。

不建立未来 Runtime。

---

## CX-R22-W0｜LRM UI Handoff Contract

未来：

```
```

```
LRM
→ HistoryCustomerView

```

预留 contract。

---

## CX-R22-W1｜RCL UI Handoff

未来 RCL 只允许：

```
```

```
Academy case
Research case
Published case

```

通过 governed publication 后进入客户 UI。

---

## CX-R22-W2｜VAL Disclosure Slot

未来如果某 capability 有 validation：

可以显示：

```
```

```
Validation status
Evidence level
Limitations

```

现在不显示假 badge。

---

## CX-R22-W3｜RME Slot

未来 metrics：

```
```

```
Metric
Confidence
Explanation
Version
Validation

```

现在绝不预造 RSI/RLI/RDI/RRI 卡片。

---

# PHASE CX-R23｜VISUAL QUALITY ACCEPTANCE

这一步之前你过去做得不够严格。

机器 check 通过 ≠ 页面好看。

---

## CX-R23-W0｜Visual Review Matrix

每个 surface：

```
```

```
Desktop EN
Desktop ZH
Mobile EN
Mobile ZH
Guest
Account
Empty
Loaded
Error
Unavailable

```

---

## CX-R23-W1｜Screenshot Corpus

建立 canonical screenshots：

```
```

```
content/customer-experience-rebuild/visual-baseline/

```

至少：

```
```

```
HOME
EXPLORE
MY_REALITY
PERSONAL
RELATIONSHIP
PROFILE_ASSESSMENT
FINANCIAL
KNOWLEDGE
ASK
PROFESSIONAL
ACCOUNT
REPORT

```

---

## CX-R23-W2｜Human Visual Gate

人工必须检查：

```
```

```
brand quality
hierarchy
spacing
asset quality
visual balance
copy quality
mobile quality
no legacy visual residue

```

不能只 machine pass。

---

## CX-R23-W3｜Legacy Shadow Gate

专项检查：

```
```

```
Does this still look like old PHI OS?

```

检查：

```
```

```
old header
old pill buttons
old generic cards
old giant white sections
old runtime terminology
old journey composition
old logo
old CSS typography
old gradient book cards

```

任何一项明显存在：

```
```

```
FAIL

```

---

# PHASE CX-R24｜PERFORMANCE

---

## CX-R24-W0｜CSS Budget

新 Customer UI 不允许再次膨胀。

记录：

```
```

```
base bundle
surface bundle

```

---

## CX-R24-W1｜JS Budget

Shell / page / runtime adapter 分离。

---

## CX-R24-W2｜Images

WebP / SVG。

Hero responsive source。

---

## CX-R24-W3｜Fonts

减少 external dependency。

---

# PHASE CX-R25｜LEGACY ROUTE CUTOVER

这一步才真正把旧影子从生产 UI 清掉。

---

## CX-R25-W0｜Cutover Registry

建立：

```
```

```
customer-route-cutover-registry-v1.json

```

每个 route：

```
```

```
legacyPath
newSurface
newPath
cutoverState
rollbackReference

```

---

## CX-R25-W1｜Wave A

先迁：

```
```

```
/
Explore
Knowledge
Books
Articles

```

---

## CX-R25-W2｜Wave B

```
```

```
Ask
Personal
Perspectives

```

---

## CX-R25-W3｜Wave C

```
```

```
My Reality
Reality Dashboard
Journey

```

---

## CX-R25-W4｜Wave D

```
```

```
Financial
Professional
Reports
Services

```

---

## CX-R25-W5｜Wave E

```
```

```
Account
Academy
secondary pages

```

---

# PHASE CX-R26｜LEGACY PRESENTATION RETIREMENT

这一步是确保你说的：

> “不要留下旧的影子。”

---

## CX-R26-W0｜Zero Active Legacy Imports

扫描所有 production route。

必须：

```
```

```
legacy CSS references = 0
legacy shell references = 0
legacy customer JS layout references = 0

```

---

## CX-R26-W1｜Legacy Stylesheet State

旧 CSS：

```
```

```
RETIRED_NOT_CONSUMED

```

之后可选择物理删除。

但第一步必须先保证：

```
```

```
zero active consumer

```

---

## CX-R26-W2｜Legacy HTML

旧 HTML：

```
```

```
redirect
archive
delete

```

三选一。

禁止 production 同时存在两个实际入口。

---

## CX-R26-W3｜Old Logo Purge

production customer tree：

```
```

```
old logo consumer = 0

```

---

## CX-R26-W4｜Old Asset Purge

旧 hero / obsolete placeholder 不再消费。

---

## CX-R26-W5｜Old Navigation Purge

禁止再出现：

```
```

```
old menu
old Journey primary navigation
old Readings hierarchy

```

---

# PHASE CX-R27｜PRODUCTION PARITY

---

## CX-R27-W0｜Customer Surface Matrix

所有正式 runtime：

```
```

```
Backend capability
→ Customer surface
→ current availability

```

确保高价值后台没有再次消失。

特别检查：

```
```

```
Personal
Relationship
Profile / Assessment
Financial
Knowledge
Books
Articles
Ask
Professional
Reports
Reality

```

---

## CX-R27-W1｜Frontend Parity

已有 PCM / parity governance继续消费。

不能建立第二套 backend readiness authority。

---

# PHASE CX-R28｜FULL REGRESSION

必须跑：

```
```

```
npm run check:cx-rebuild

```

然后：

```
```

```
npm run check

```

另外重点：

```
```

```
check:cpr
check:wpr
check:pds
check:rdg
check:rmo
check:rre
check:rne
check:jr
check:pr
check:rr
check:fdr
check:fcr
check:far
check:hfp
check:pfr
check:kap
check:cka
check:knowledge-runtime
check:mpa

```

实际 script 名按当前 package 保留，不要猜不存在的旧 script。

---

# PHASE CX-R29｜FINAL CUSTOMER EXPERIENCE FREEZE

建立：

```
```

```
content/customer-experience-rebuild/freeze/
  customer-experience-v1-freeze.json

```

必须记录：

```
```

```
customerMainChain
navigation
surfaceRegistry
designSystemVersion
shellVersion
assetRegistry
runtimeProjectionAdapters
localeVersion
cutoverRegistry
legacyRetirementState
visualAcceptance
productionAcceptance

```

状态：

```
```

```
PHI_OS_CUSTOMER_EXPERIENCE_V1_FROZEN

```

---

# PHASE CX-R30｜POST-CUTOVER PROTECTION

防止几周以后又开始乱补。

---

## CX-R30-W0｜No Direct Page Styling

以后任何 developer 禁止：

```
```

```
<style>

```

在 production customer page 加重大 layout。

---

## CX-R30-W1｜No New Global CSS

新的 visual requirement 必须先进入：

```
```

```
Customer UI component

```

不是：

```
```

```
new-random-page.css

```

---

## CX-R30-W2｜No Runtime-Owned UI Framework

新 Tarot / I Ching / Psychology / future Runtime：

只能提交：

```
```

```
Customer Projection Contract

```

不能带一整套：

```
```

```
tarot.css
tarot-header
tarot-card-system
tarot-layout

```

成为另一个 UI 王国。

---

## CX-R30-W3｜Visual Regression Required

任何 customer UI change：

```
```

```
machine acceptance
+
visual acceptance

```

---

# 建议最终目录

最终客户界面代码应逐渐收敛为：

```
```

```
assets/

└── customer-ui/
    ├── tokens.css
    ├── base.css
    ├── typography.css
    ├── layout.css
    ├── components.css
    ├── motion.css
    ├── utilities.css
    │
    ├── surfaces/
    │   ├── home.css
    │   ├── explore.css
    │   ├── knowledge.css
    │   ├── ask.css
    │   ├── reality.css
    │   ├── perspectives.css
    │   ├── personal.css
    │   ├── financial.css
    │   ├── professional.css
    │   ├── account.css
    │   └── academy.css
    │
    └── js/
        ├── shell.js
        ├── navigation.js
        ├── locale.js
        ├── assets.js
        ├── dialog.js
        ├── ask.js
        └── workspace.js

```

Runtime adapters：

```
```

```
functions/customer-projection/

├── reality-customer-projection.js
├── readout-customer-projection.js
├── navigation-customer-projection.js
├── method-customer-projection.js
├── financial-customer-projection.js
├── knowledge-customer-projection.js
└── report-customer-projection.js

```

Governance：

```
```

```
content/customer-experience-rebuild/

├── authority/
├── contracts/
├── registries/
├── migration/
├── acceptance/
├── visual-baseline/
├── legacy/
└── freeze/

```

---

# 最终 Customer Route Architecture

我建议最后收敛到：

```
```

```
/
│
├── /explore/
│   ├── /why-phios/
│   ├── /how-it-works/
│   └── /start/
│
├── /reality/
│   ├── /overview/
│   ├── /current/
│   ├── /perspectives/
│   ├── /navigation/
│   ├── /actions/
│   ├── /review/
│   └── /history/        future LRM
│
├── /perspectives/
│   ├── /personal/
│   ├── /relationship/
│   ├── /profile/
│   ├── /astrology/
│   ├── /bazi/
│   ├── /zi-wei/
│   ├── /human-design/
│   ├── /numerology/
│   ├── /i-ching/
│   └── /tarot/
│
├── /knowledge/
│   ├── /ask/
│   ├── /search/
│   ├── /articles/
│   ├── /books/
│   ├── /figures/
│   └── /learn/
│
├── /professional/
│   ├── /financial/
│   ├── /review/
│   ├── /reports/
│   ├── /services/
│   └── /appointments/
│
└── /account/

```

旧 route 可以 redirect。

Canonical Ask authority:

```text
/knowledge/ask/ = production UI authority
/ask = 308 compatibility redirect
ask.html = compatibility / migration only

```

Profile route:

```text
/perspectives/profile/

```

External MBTI / 16P / Big Five results are contexts within Profile, not separate top-level route kingdoms.

不需要因为重构而破坏 SEO / external links。

---

# Homepage 最终顺序冻结

最终首页不要再变：

```
```

```
H01 HERO
Reality keeps changing

H02 ONE REALITY
many parts of life → one reality

H03 THREE WAYS TO START
Question / Perspective / Reality

H04 FLAGSHIP EXPERIENCES
Personal Reality + Financial Reality

H05 PERSPECTIVES
AST / BZR / ZW / HDR / NUM / I Ching / Tarot

H06 FIVE BOOKS
真实五册封面

H07 KNOWLEDGE LANDSCAPE
Books / Articles / Figures / Ask

H08 HOW PHI OS WORKS
Understand → Choose → Act → Observe → Review → Continue

H09 CONTINUITY
Final CTA

```

不要第十、第十一、第十二 section 再把所有东西塞回来。

---

# My Reality 最终体验

这是整个 rebuild 的中心：

```
```

```
MY REALITY
────────────────────────

Overview

Current Reality

Perspectives

Reading

Navigation

Actions

Review

History

Reports

```

而用户真正经历：

```
```

```
UNDERSTAND
↓
READ
↓
CHOOSE
↓
ACT
↓
OBSERVE
↓
REVIEW
↓
CONTINUE
↺

```

后台：

```
```

```
RDG
RMO
Methods
CMR
Knowledge
RRE
JR
RNE
PR
RR

```

继续严格执行。

这就是最终要达到的：

> **后台复杂，前台简单。**

不是现在这种：

> 后台复杂，前台也把复杂性全部泄漏出来。

---

# 第一个 Pilot 后的 UI 扩展顺序

你之前定义的未来 Runtime 顺序继续保留：

```
```

```
FIRST QUALIFYING PILOT
↓
LRM Foundation
+
RCL Foundation
↓
VAL Foundation
↓
real case accumulation
↓
Longitudinal evidence
↓
Validation execution
↓
RME
↓
AIR validated expansion
↓
CIV

```

Customer UI 对应：

```
```

```
LRM
→ History

RCL
→ governed learning / published case

VAL
→ validation disclosure

RME
→ metric visualization

AIR
→ assistant capability

CIV
→ future collective experience

```

它们全部接入新的 CX UI。

**以后不允许未来 Runtime 再另建一套客户页面架构。**

---

# 最终 Definition of Done

这次不能以：

```
```

```
npm run check passes

```

就宣布完成。

CX-R 完成必须同时满足：

```
```

```
ARCHITECTURE

✓ final customer main chain
✓ one IA
✓ one surface registry
✓ one shell
✓ one design system
✓ one asset authority
✓ governed runtime projections

```

```
```

```
LEGACY

✓ zero legacy CSS on active customer routes
✓ zero legacy customer shell
✓ zero old logo
✓ zero old hero composition
✓ zero old Journey-first composition
✓ zero duplicated navigation
✓ zero developer reconciliation copy

```

```
```

```
PRODUCT

✓ Five Books genuinely visible
✓ Articles genuinely visible
✓ Personal Reality is flagship
✓ Financial Reality is flagship
✓ My Reality is platform center
✓ Ask PHI OS is useful but not dominant
✓ Reality Journey becomes progression, not competing product
✓ Professional layer is clearly visible

```

```
```

```
VISUAL

✓ real canonical assets
✓ intentional whitespace
✓ strong visual hierarchy
✓ premium typography
✓ coherent cards
✓ coherent forms
✓ responsive
✓ bilingual
✓ no broken image
✓ no placeholder visual

```

```
```

```
RUNTIME

✓ backend authority untouched
✓ no second Meaning
✓ no second Report
✓ no second Reality
✓ no second Navigation
✓ no second Professional authority
✓ no method-specific frontend kingdom

```

```
```

```
ACCEPTANCE

✓ npm run check:cx-rebuild
✓ npm run check
✓ human visual review passed
✓ desktop visual corpus passed
✓ mobile visual corpus passed
✓ EN passed
✓ zh-Hans passed
✓ production route cutover passed

```

最后 freeze：

```
```

```
PHI OS CUSTOMER EXPERIENCE v1
=
FINAL CUSTOMER EXPERIENCE BASELINE

```

---

### Final machine gates

At minimum:

```text
npm run check:cx-r9-r2
npm run check:cx-r11
npm run check:cx-rebuild
npm run check

```

Also execute currently existing product checkers for:

```text
PRF / Profile
REL / Relationship
PPR-R2
Current Reality
CKA / KAP
Knowledge Runtime
MPA
Financial
Report / Professional

```

Do not guess nonexistent historical npm aliases; reconcile against the current package.json.

# FINAL DEFINITION OF DONE — SUCCESSOR

```text
ARCHITECTURE
✓ one IA
✓ one route authority
✓ one surface registry
✓ one design system
✓ one global shell
✓ one asset authority
✓ projection adapters
✓ backend authority untouched

CONTEXTUAL ASK
✓ /knowledge/ask/ is canonical
✓ /ask is redirect only
✓ explicit context selector
✓ no silent account context
✓ Ask This Reading
✓ Ask This Relationship
✓ Profile / Assessment context
✓ Current Facts freshness disclosure
✓ source-class provenance on demand

PERSPECTIVES
✓ Personal
✓ Relationship
✓ Profile & Assessment
✓ Current Context
✓ Symbolic Reflection
✓ MPA-controlled availability
✓ no method / instrument UI kingdom

EPISTEMIC UX
✓ measured / task-based is distinguishable
✓ self-reported is distinguishable
✓ external profile is distinguishable
✓ symbolic / interpretive is distinguishable
✓ Current Reality is distinguishable
✓ no cross-source convergence presented as proof

LEGACY
✓ zero active legacy Ask UI
✓ zero active legacy CSS on cutover routes
✓ zero old shell / header / logo consumers
✓ old routes redirect or are physically retired

ACCEPTANCE
✓ Desktop EN / ZH
✓ Mobile EN / ZH
✓ Guest / Account
✓ Relationship states
✓ Profile states
✓ Ask context states
✓ production click-through
✓ human visual acceptance
✓ npm run check:cx-rebuild
✓ npm run check

```

Final state:

```text
PHI OS CUSTOMER EXPERIENCE v2
=
ONE CUSTOMER SYSTEM
+
ONE CONTEXTUAL ASK
+
SOURCE-AWARE PERSPECTIVES
+
VISIBLE CORE RUNTIMES
+
ZERO ACTIVE LEGACY PRESENTATION

```

This CX Master Work does not replace the Product Master. It provides the one customer system through which the Product Master becomes visible.