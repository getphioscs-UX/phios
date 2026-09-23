BASELINE:
575884962b1aaef79ecc55dfbb5adbcceb540f80

EXECUTION CLASS:
Cross-method customer delivery successor

SEMANTIC SCOPE:
NONE

CALCULATION SCOPE:
NONE

INTERPRETATION SCOPE:
NONE

COMMERCE AUTHORITY:
EXISTING ONLY

HARD GOVERNANCE:
GLOBAL METHOD ISOLATION FREEZE R2.1

# 0｜MASTER OBJECTIVE

当前 PHI OS 已经存在：

```
Method Runtime
Specialist Renderer
Visual Report
Guided Report Successor
Commerce Products
Entitlements
Static Report Assets
PDF infrastructure
```

但它们仍然不是一条统一的客户路径。

本阶段目标不是新建 Report Engine。

本阶段目标是将现有能力连接成：

```
PERSONAL REALITY
        ↓
METHOD FREE REPORT
        ↓
FULL REPORT PREVIEW
        ↓
UNLOCK
        ↓
EXISTING COMMERCE
        ↓
SERVER-VERIFIED ENTITLEMENT
        ↓
FULL PREMIUM PUBLICATION
        ↓
OPTIONAL TECHNICAL / INTERACTIVE DETAIL
```

---

# 1｜FINAL OWNERSHIP MODEL

正式冻结五个 Owner。

```
OWNER 1
METHOD RUNTIME
```

拥有：

```
calculation
canonical facts
method structure
timing calculation
```

---

```
OWNER 2
METHOD INTERPRETATION
```

拥有：

```
governed interpretation
claim scope
method terminology
uncertainty
semantic relationships
```

---

```
OWNER 3
REPORT PUBLICATION
```

拥有：

```
report structure
page families
section openers
typography
visual composition
pagination
PDF
responsive report
```

---

```
OWNER 4
COMMERCE / ENTITLEMENT
```

拥有：

```
product
price
purchase
payment verification
entitlement
```

---

```
OWNER 5
SPECIALIST EXPLORER
```

拥有：

```
interactive detail
technical exploration
expanded method structures
diagnostic / developer-visible depth where allowed
```

它不能成为：

```
entitlement authority
```

也不能自动成为：

```
paid full report
```

---

# 2｜CURRENT SYSTEM DEFECT TO CLOSE

Codex 必须先登记当前断层。

当前大致：

```
Personal Reality
        ↓
renderProductRoute()
        ↓
Specialist Renderer
        ↓
Method Workspace
```

而另外存在：

```
Guided Report / Visual Report
        ↓
Free / Locked / Paid capable renderer
```

再另外存在：

```
Commerce
        ↓
REPORT_* entitlement
```

问题：

```
these three are not canonically orchestrated
```

因此出现：

```
FULL method content visible
without report journey

premium publication exists
but is not customer default

entitlement exists
but does not own report visibility

visual assets exist
but specialist workspace does not consume them
```

---

# 3｜DO NOT FIX THIS BY REWRITING METHOD RENDERERS

禁止采用：

```
edit BaZi renderer to add checkout
edit Astrology renderer to add checkout
edit Zi Wei renderer to add checkout
edit ECR renderer to add checkout
...
```

这种做法会导致：

```
8 commerce implementations
8 entitlement implementations
8 unlock UXs
8 report-routing policies
```

禁止。

---

# 4｜CREATE ONE SHARED DELIVERY ORCHESTRATOR

新增建议：

```
functions/report-delivery/
```

或服从 repo 现有 owner hierarchy 找到最合适位置。

建议模块：

```
report-delivery-contract.js
report-access-resolver.js
report-delivery-envelope.js
report-route-resolver.js
report-entitlement-adapter.js
```

不要新增：

```
calculation runtime
interpretation runtime
provider router
semantic runtime
```

---

# 5｜REPORT DELIVERY CONTRACT

建议 schema：

```
{
  "schemaVersion": "PHI-OS-REPORT-DELIVERY-R1",

  "methodId": "BZR",

  "reportProductId": "BAZI_FULL_REPORT",

  "commerceProductId": "COM-REPORT-BAZI-FULL",

  "entitlementKey": "report:bazi:full",

  "sourceReading": {
    "methodReadingRef": "...",
    "productionAdmitted": true
  },

  "availability": {
    "freeReport": true,
    "fullReport": true,
    "technicalExplorer": true
  },

  "access": {
    "state": "FREE"
  },

  "routes": {
    "free": "PUBLICATION_PREVIEW",
    "locked": "PUBLICATION_LOCKED",
    "full": "PUBLICATION_FULL",
    "technical": "SPECIALIST_EXPLORER"
  }
}
```

---

# 6｜ALLOWED ACCESS STATES

仅允许：

```
FREE
LOCKED
ENTITLED
UNAVAILABLE
DATA_REQUIRED
```

---

# 7｜FREE

表示：

```
customer does not own full report entitlement
```

但可看到：

```
meaningful free personal report
```

不是：

```
marketing-only page
```

---

# 8｜LOCKED

用于 Full Report 内容结构的 preview。

允许显示：

```
section title
page title
generic / anonymous visual silhouette
what the section adds
unlock CTA
price quote
```

禁止显示：

```
paid personal claim
paid customer value
paid exact finding
paid timing conclusion
paid detailed interpretation
```

---

# 9｜ENTITLED

必须来自：

```
server-verified active entitlement
```

客户端：

```
payment success page
query string
localStorage
DOM
button state
```

都不能作为 entitlement authority。

---

# 10｜REPORT ACCESS RESOLVER

新增共享：

```
resolveReportAccess({
    methodId,
    productId,
    subject,
    entitlement
})
```

输出：

```
FREE
LOCKED
ENTITLED
```

必须 fail closed。

---

# 11｜NO PRICE HARDCODE

UI 不得：

```
if bazi show RM39
```

价格必须来自：

```
existing Commerce quote
```

例如当前：

```
BAZI RM39
ZIWEI RM39
ASTROLOGY RM39
PROFILE RM39
NUMEROLOGY RM39
ECR RM39
HD RM129
CROSS RM299
```

是产品 authority 的结果，不是 renderer 常量。

---

# 12｜EXISTING COMMERCE MUST BE REUSED

不得新建 report product。

使用现有：

```
BAZI_FULL_REPORT
ZIWEI_FULL_REPORT
ASTROLOGY_FULL_REPORT
PROFILE_FULL_REPORT
NUMEROLOGY_FULL_REPORT
ECR_FULL_REPORT
HD_FULL_REPORT
CROSS_FULL_REPORT
```

及现有：

```
COM-REPORT-*
```

---

# 13｜LANGUAGE PRESENTATION MUST ALSO USE EXISTING CONTRACT

已有：

```
SINGLE
BILINGUAL
```

及：

```
reportLocale
```

继续沿用。

不得另建：

```
BAZI_LANGUAGE_PLAN_V2
```

---

# 14｜P01 COVER POLICY

继续冻结：

```
P01 = bilingual cover
```

不论最终：

```
zh-Hans
en
```

都使用相同 bilingual cover。

---

# 15｜FREE REPORT CONTRACT R1

Free Report 不是固定页数。

共享逻辑：

```
APPROVED INTRO
+
PERSONAL SNAPSHOT
+
HIGH-VALUE METHOD VISUAL PREVIEW
+
LIMITED GOVERNED INTERPRETATION
```

目标：

> 客户已经真正得到一份个人读取。

---

# 16｜FREE REPORT DOES NOT MEAN P01–P05 ONLY

P01–P05 很漂亮，但主要是：

```
method introduction
origin
PHI OS lens
how to read
```

真正个人价值必须来自：

```
P06+
```

所以 Free 至少要有：

```
personal snapshot
+
one or more method-native dynamic visuals
```

---

# 17｜BAZI FREE CONTRACT

建议：

```
P01 cover
P02 method intro
P03 origin
P04 PHI OS lens
P05 how to read
P06 personal snapshot
```

再允许 Free 展示：

```
Four Pillars summary
Five Elements overview
Ten-God overview
Function Groups preview
1–2 bounded insights
```

但：

```
deep section narrative
full timing interpretation
full life-domain analysis
full guidance
```

锁定。

---

# 18｜ASTROLOGY FREE CONTRACT

建议：

```
Natal chart snapshot
Ascendant / Sun / Moon where available
Planet distribution
House overview
Aspect overview
```

不开放：

```
full relationship narrative
career synthesis
timing/change
opportunity navigation
```

---

# 19｜ZI WEI FREE CONTRACT

建议：

```
Chart snapshot
12-palace overview
Life Palace
Primary stars
basic structural relationship preview
```

不开放完整宫位解释。

---

# 20｜NUMEROLOGY FREE CONTRACT

建议：

```
Core number snapshot
number architecture
pattern distribution
cycle preview
```

---

# 21｜PROFILE FREE CONTRACT

建议：

```
Evidence overview
Core structure
Six-domain overview
```

不得在 Free 层泄漏完整外部 evidence synthesis。

---

# 22｜ECR FREE CONTRACT

建议：

```
PHI Card overview
Core Question
Capability Region
Driver Priority
Motion preview
```

ECR 当前已有自己的：

```
FREE / PAID depth
```

必须迁移到共享 Report Delivery。

不得保留第二套 entitlement logic。

---

# 23｜HD FREE CONTRACT

建议：

```
Type
Strategy
Authority
Profile
basic BodyGraph summary
```

但：

```
Variables
PHS
advanced interpretation
environment/perspective
```

按照 HD 自己 authority 决定是否 locked。

---

# 24｜CROSS FREE CONTRACT

Cross Free 不能提前给完整 Cross synthesis。

建议只展示：

```
methods included
comparison availability
shared emphasis preview
tension count
open questions
```

Paid 才生成：

```
full Cross report
```

---

# 25｜LOCKED REPORT UX

所有 Method 统一：

```
FULL REPORT
```

下方显示：

```
What the full report includes
```

例如：

```
10 sections
method-specific visuals
timing where available
navigation
PDF
```

再显示：

```
Unlock Full Report
```

---

# 26｜LOCKED VISUAL PREVIEW

不得完全 blur。

应该显示：

```
anonymous geometry
layout silhouette
section structure
```

但不能显示客户 paid findings。

当前 `renderLockedStructure()` 可以保留作为基础。

---

# 27｜UNLOCK CTA

CTA：

```
Unlock Full BaZi Report
Unlock Full Astrology Report
...
```

价格：

```
Commerce quote
```

语言：

```
SINGLE / BILINGUAL
```

---

# 28｜ENTITLEMENT RESOLUTION

建立映射 registry：

```
BZR
→ report:bazi:full

AST
→ report:astrology:full

ZWR
→ report:ziwei:full

PROFILE
→ report:profile:full

NUM
→ report:numerology:full

ECR
→ report:ecr:full

HD
→ report:hd:full

CROSS
→ report:cross:full
```

实际 literal key 必须从现有 Commerce contract 读取。

不要根据本指令硬编码猜测。

---

# 29｜PAID FULL REPORT

Paid Customer 默认进入：

```
Publication Report
```

不是：

```
Specialist Workspace
```

---

# 30｜TECHNICAL EXPLORER

Full Report 可提供：

```
Explore details
Technical view
Interactive reading
```

再进入：

```
existing Specialist Renderer
```

---

# 31｜SPECIALIST RENDERER CONTRACT CHANGE

Specialist Renderer 的职责从：

```
PRIMARY CUSTOMER REPORT
```

调整为：

```
METHOD DETAIL EXPLORER
```

但：

```
DO NOT DELETE
DO NOT REWRITE SEMANTICS
DO NOT REDUCE CAPABILITY
```

---

# 32｜CURRENT SPECIALIST REGISTRY

当前已明确存在：

```
AST
BZR
NUM
ZWR
ECR
```

对应各自 specialist renderer。

必须继续保留。

---

# 33｜HD SPECIAL CASE

HD 当前并不完全走普通 specialist registry。

需要 inventory：

```
mountHumanDesignProfessionalReading()
```

并将它登记为：

```
HD_TECHNICAL_EXPLORER
```

而不是在当前阶段强行重构 HD runtime。

---

# 34｜PROFILE SPECIAL CASE

Profile 当前没有与其他五种完全相同的 specialist renderer。

不要因此：

```
create giant Profile workspace
```

只需要：

```
ProfileReportAdapter
```

以及如果需要：

```
lightweight evidence detail explorer
```

---

# 35｜PUBLICATION VISUAL MODULE CONTRACT

解决 BaZi 暴露的另一个核心问题：

```
Method visuals
```

不能只留在 Specialist 页面。

建立：

```
METHOD PUBLICATION VISUAL MODULE
```

通用 schema：

```
{
  "visualId": "BZR-VIS-TEN-GOD-OVERVIEW",

  "methodId": "BZR",

  "semanticOwner": "BZR_EXISTING_PROFESSIONAL_MODULE",

  "sourceRefs": [],

  "renderer": "PUBLICATION_SAFE",

  "allowedPageFamilies": [
    "STRUCTURED_ANALYSIS_PAGE"
  ],

  "free": true,

  "paid": true,

  "publicationCreatesMeaning": false
}
```

---

# 36｜METHOD VISUAL ≠ STATIC HERO

区分：

```
STATIC DECORATIVE VISUAL
```

例如：

```
BODY.webp
SECTION HERO.webp
MOTIF.svg
```

和：

```
DYNAMIC METHOD VISUAL
```

例如：

```
BaZi Ten Gods
Astrology Natal Wheel
Zi Wei Palace Chart
HD BodyGraph
```

两者不是同一类 asset。

---

# 37｜FINAL PAGE COMPOSITION

正确：

```
STATIC DECORATIVE BACKGROUND
+
DYNAMIC METHOD VISUAL
+
HTML TEXT
```

不是：

```
static screenshot containing customer numbers
```

---

# 38｜STATIC ASSETS LOCATION

继续：

```
SVG:
assets/images/report/
```

```
WebP:
images/reports/{method}/editorial/shared/
```

---

# 39｜DYNAMIC VISUALS LOCATION

动态 visual 不应该存客户结果图片。

保持：

```
runtime data
↓
publication renderer
↓
HTML / SVG / CSS
```

---

# 40｜BODY MUST BE ACTUALLY CONSUMED

全局 checker 必须验证：

```
body registered
AND
body appears in rendered DOM
```

仅 registry 存在不够。

---

# 41｜MOTIF MUST BE ACTUALLY CONSUMED

同样：

```
motif-1 exists
motif-2 exists
```

不够。

必须：

```
both appear in real report
```

---

# 42｜METHOD BATCH 0

以后所有 Method 在 Batch A 前先执行。

---

# METHOD BATCH 0-A｜OWNER INVENTORY

记录：

```
method
runtime owner
interpretation owner
timing owner
specialist renderer
publication renderer
free renderer
commerce product
entitlement
static asset registry
dynamic visual modules
```

---

# METHOD BATCH 0-B｜DUPLICATE OWNER AUDIT

检查是否同时存在：

```
legacy report
specialist full report
visual report
publication successor
```

不得直接删除。

先登记：

```
CURRENT
SUCCESSOR
DETAIL_ONLY
RETIRE_CANDIDATE
```

---

# METHOD BATCH 0-C｜CUSTOMER ROUTE AUDIT

实际追踪：

```
Personal Reality
↓
method result
↓
what renderer?
↓
what access state?
↓
what report?
↓
what checkout?
```

不得只看源码静态推断。

---

# METHOD BATCH 0-D｜FREE EXPOSURE AUDIT

未登录／无 entitlement：

检查：

```
paid personal claims exposed?
full method workspace exposed?
timing details exposed?
technical details exposed?
```

任何不应 Free 的内容：

```
FAIL
```

---

# METHOD BATCH 0-E｜COMMERCE MAPPING

验证：

```
method
→ product
→ price
→ entitlement
```

不得创建 duplicate product。

---

# METHOD BATCH 0-F｜VISUAL ASSET RECONCILIATION

检查：

```
cover
P02–P05
BODY
SECTION STYLE
10 HERO
motif 1
motif 2
```

登记真实 location。

---

# METHOD BATCH 0-G｜DYNAMIC VISUAL RECONCILIATION

检查当前 Specialist 是否拥有值得进入 Full Report 的 visual。

例如：

### BaZi

```
Five Elements
Ten Gods
Function Groups
Day Master carrying
Pattern paths
Relationships
Timing
Topics
```

### Astrology

```
Natal Wheel
planet distribution
houses
aspects
timing
```

### Zi Wei

```
12 palaces
stars
palace relationship
timing
```

### Numerology

```
core numbers
number relationships
distribution
cycles
```

### ECR

```
PHI Mandala
PHI Cards
driver
motion
activation
```

### HD

```
BodyGraph
centers
channels
gates
variables
```

### Profile

```
evidence matrix
six domains
core structure
```

### Cross

```
method contribution
common
complementary
tension
priority map
```

---

# METHOD BATCH 0-H｜PUBLICATION ADAPTER PLAN

每个 Method 建立：

```
MethodReadingIR
↓
MethodReportAdapter
↓
Publication IR
```

不得：

```
raw method data
↓
shared renderer semantic inference
```

---

# 43｜BAZI DELIVERY PILOT

BaZi 先跑通整个 shared contract。

原因不是：

```
BaZi semantics should be copied
```

而是：

```
BaZi currently has the most complete combination
of runtime + visuals + publication + commerce
```

---

# BAZI D-W0｜CURRENT PATH EVIDENCE

证明：

```
Personal Reality
→ Specialist workspace
```

是目前实际路径。

你的 PDF 已经直接显示，从方法入口进入后，页面继续展开完整命盘、五行十神及专业主题，而不是经过 commerce lock。

---

# BAZI D-W1｜CREATE FREE PUBLICATION

Free 必须真实生成。

---

# BAZI D-W2｜CREATE LOCKED FULL PREVIEW

必须：

```
not entitled
→ full report sections locked
```

---

# BAZI D-W3｜WIRE COMMERCE QUOTE

使用：

```
BAZI_FULL_REPORT
```

---

# BAZI D-W4｜WIRE ENTITLEMENT

只有：

```
active purchased report entitlement
```

才能进入 Full。

---

# BAZI D-W5｜FULL PUBLICATION

使用：

```
GUIDED REPORT SUCCESSOR R2
```

但继续：

```
successor active = false
```

直到 Human Acceptance。

---

# BAZI D-W6｜BRING SPECIALIST VISUALS INTO REPORT

优先：

```
Five Elements
Ten Gods
Function Groups
Carrying
Pattern
Relationships
Timing
```

---

# BAZI D-W7｜STATIC VISUAL SYSTEM

必须出现：

```
BODY
SECTION STYLE
section hero
motif 1
motif 2
```

---

# BAZI D-W8｜TECHNICAL DETAIL

购买后：

```
View technical detail
```

才进入现有：

```
cx-bazi-w12-workspace
```

---

# BAZI D-W9｜NO T3 BLOCKING

如果 T3：

```
REJECT
```

Full Report 仍应：

```
render with governed T2 fallback
```

不得：

```
hide report
```

---

# 44｜BAZI HUMAN ACCEPTANCE

检查：

```
Free useful?
Unlock clear?
Paid worth RM39?
P01–P05 continuity?
P06+ premium?
BODY visible?
Ten Gods visible?
Five Elements visible?
Technical workspace no longer default?
```

全部 accepted 后冻结：

```
REPORT_DELIVERY_R1
```

---

# 45｜ONLY THEN ROLL OUT OTHER METHODS

之后每个方法：

```
Batch 0
→ A
→ human acceptance
→ B
→ human acceptance
→ C
→ D
→ delivery cutover
```

---

# 46｜ASTROLOGY BATCH 0

必须 reconcile：

```
AST specialist surface V3
legacy astrology workspace
Astrology report assets
Astrology commerce
Astrology report blueprint
```

最终：

```
Free
Locked
Full Publication
Technical Explorer
```

---

# 47｜ZI WEI BATCH 0

必须保留：

```
W16
W17
existing customer activation gates
```

不得绕过。

Publication delivery 是：

```
additional customer presentation
```

不能跳过 Zi Wei 自己的 authority gate。

---

# 48｜NUMEROLOGY BATCH 0

当前：

```
chart-first specialist
```

作为 detail owner。

Report publication 另走：

```
NumerologyReportAdapter
```

---

# 49｜ECR BATCH 0

这是重点。

必须把 ECR 当前自己的：

```
FREE / PAID depth
disabled unlock
```

迁移到共享：

```
Report Access Resolver
```

不得长期保留两个 entitlement system。

---

# 50｜HD BATCH 0

先 inventory：

```
external confirmed chart
internal reference
professional reading
BodyGraph visuals
report blueprint
```

然后：

```
HD Report Adapter
```

不得改变 HD chart authority。

---

# 51｜PROFILE BATCH 0

由于 Profile 没有像 BZR/AST 一样成熟的 specialist owner：

不要先造 workspace。

优先完成：

```
Profile Report Adapter
+
Publication
+
Commerce delivery
```

---

# 52｜CROSS BATCH 0

必须区分：

```
FREE CROSS-PERSPECTIVE COMPARISON
```

和：

```
CROSS FULL REPORT RM299
```

两者不是同一产品。

---

# 53｜CROSS INPUT FREEZE

Cross paid report 只能消费：

```
CURRENT_PRODUCTION_ADMITTED_CLAIMS
```

禁止：

```
SHADOW
T3 candidate
rejected
repair
QA-only output
```

---

# 54｜SHARED CUSTOMER COMPONENTS

建议建立：

```
ReportAccessBanner
ReportUnlockCard
ReportLanguageSelector
ReportPreviewSection
ReportTechnicalDetailLink
```

但这些：

```
must contain zero method semantic logic
```

---

# 55｜CANONICAL CUSTOMER JOURNEY UI

客户进入 Method 后：

```
YOUR REPORT
```

顶部显示：

```
Free Reading
or
Full Report
```

---

# 56｜FREE CUSTOMER

显示：

```
Free report content
```

然后：

```
Continue with Full Report
```

---

# 57｜ENTITLED CUSTOMER

显示：

```
Open Full Report
Download PDF
Explore Details
```

---

# 58｜NO DUPLICATE “FULL” WORDING

禁止同时出现：

```
Full Reading
Full Report
Complete Reading
Professional Full
Unlock Full
```

却代表不同产品。

冻结：

```
FREE REPORT
FULL REPORT
TECHNICAL DETAIL
```

三个词。

---

# 59｜PDF RULE

Free 可选择：

```
web only
```

或者提供 limited PDF。

Full：

```
HTML
+
A4 PDF
```

必须同源。

---

# 60｜NO DASHBOARD PDF

禁止：

```
window.print()
```

直接把 Specialist Workspace 打印成 paid PDF。

Full PDF 必须来自：

```
Publication IR
```

---

# 61｜DYNAMIC VISUAL COLORS MUST SURVIVE PRINT

这点非常重要。

不得为了统一品牌把：

```
Five Elements
Ten Gods
method category colors
```

全部变成：

```
gold / navy monochrome
```

---

# 62｜COLOR SEMANTIC CONTRACT

如果颜色在 Method visual 中承担：

```
category distinction
```

可保留。

如果颜色只代表：

```
decorative emphasis
```

由 Publication style 控制。

---

# 63｜STATIC BODY IS BACKGROUND, NOT WHITEWASH

BODY 不得因为 opacity 太低变得：

```
effectively invisible
```

Browser QA 加：

```
BACKGROUND_VISIBILITY_CHECK
```

---

# 64｜VISUAL PAGE DENSITY

正式区分：

```
TEXT-LED
VISUAL-LED
BALANCED
```

Ten-God Overview：

```
VISUAL-LED
```

Narrative：

```
TEXT-LED
```

Section opener：

```
VISUAL-LED
```

---

# 65｜DO NOT FORCE EVERY PAGE TO CONTAIN HERO

Section Hero：

```
section opener only
```

BODY / motif：

```
body pages
```

Dynamic Visual：

```
where method meaning requires it
```

---

# 66｜VARIABLE PAGINATION

页数由内容决定。

禁止：

```
BAZI = 36 forever
ASTROLOGY = 25 forever
```

允许：

```
semantic pagination
```

---

# 67｜REPORT TOTAL

只有最终 expansion 后才计算：

```
TOTAL
```

---

# 68｜FREE / PAID SEMANTIC PARITY

Free 内容进入 Paid 后：

```
must remain semantically identical
```

Paid 可以：

```
expand
```

不能：

```
contradict Free
```

---

# 69｜LOCKED PREVIEW SECURITY

检查 DOM。

禁止：

```
paid content hidden with CSS
```

但仍在 DOM。

正确：

```
paid semantic payload not delivered
```

---

# 70｜SERVER ACCESS BOUNDARY

未 entitlement：

服务端不得返回：

```
paid personal narrative
paid detailed interpretation
paid timing output intended only for Full Report
```

---

# 71｜REPORT VISUAL PREVIEW CAN BE CLIENT SAFE

允许服务端返回：

```
section names
generic silhouettes
static report visuals
```

---

# 72｜SPECIALIST CONTENT EXPOSURE

这里必须按产品政策决定。

如果 Specialist detail 本身属于 paid full report：

```
entitlement required
```

不要认为：

```
specialist = always free
```

---

# 73｜REPORT DELIVERY CHECKER

新增建议：

```
scripts/check-report-customer-delivery.mjs
```

---

# 74｜CHECKER MATRIX

对每个 Method：

```
NO ENTITLEMENT
FREE
LOCKED

QA ENTITLEMENT
FULL

TECHNICAL
DETAIL
```

---

# 75｜NO ENTITLEMENT ASSERTIONS

必须：

```
free allowed content visible
paid personal content absent
unlock CTA visible
correct product selected
```

---

# 76｜ENTITLED ASSERTIONS

必须：

```
full report visible
locked shell removed
correct locale
correct static assets
correct dynamic visuals
PDF available
```

---

# 77｜TECHNICAL ASSERTIONS

必须：

```
technical explorer optional
not default paid landing
method-owned semantics preserved
```

---

# 78｜STATIC ASSET ASSERTIONS

每 Method：

```
cover rendered
BODY rendered
SECTION_STYLE fallback tested
10 HERO registered
2 motifs rendered
```

---

# 79｜DYNAMIC VISUAL ASSERTIONS

至少：

```
one high-value dynamic visual
```

必须实际出现。

最终 Full Report 不允许是：

```
beautiful background
+
only text
```

---

# 80｜BROWSER QA

至少：

```
390
768
1440
```

---

# 81｜ACCESS QA

测试：

```
anonymous
signed-in no entitlement
entitled
```

---

# 82｜LOCALE QA

测试：

```
zh-Hans
en
```

以及 Commerce 支持时：

```
bilingual
```

---

# 83｜PDF QA

检查：

```
A4
background graphics
colors
page breaks
footer
pagination
charts
font
hero
BODY
```

---

# 84｜PRINT COLOR QA

特别检查：

```
Five Elements colors
Ten-God function group colors
HD center colors where applicable
Astrology visual distinction
Zi Wei visual distinction
```

---

# 85｜NO SCREENSHOT QA

断言：

```
dynamic customer diagrams
are rendered from source data
```

不是页面截图。

---

# 86｜SEMANTIC QA

继续服从：

```
GLOBAL METHOD ISOLATION FREEZE R2.1
```

Presentation migration 后：

```
semantic snapshot unchanged
```

---

# 87｜COMMERCE QA

必须验证：

```
quote
checkout intent
payment
server verification
entitlement
report unlock
```

QA only。

不得自动触发 production payment cutover。

---

# 88｜DO NOT LET DELIVERY R1 ACTIVATE STRIPE PRODUCTION

本阶段：

```
delivery wiring
```

不等于：

```
Stripe production activation
```

---

# 89｜NO GLOBAL REPORT CUTOVER

即使 Delivery R1 完成：

不得：

```
allMethodsPublicationActive = true
```

---

# 90｜PER-METHOD CUTOVER

必须：

```
BAZI
then AST
then ZWR
then PROFILE
then ECR
then NUM
then HD
then CROSS
```

可依据实际 readiness 调整，但不得自动全部开启。

---

# 91｜HUMAN ACCEPTANCE

每个 Method：

```
FREE accepted
LOCKED accepted
FULL accepted
PDF accepted
DETAIL accepted
```

---

# 92｜FINAL DELIVERY RECORD

每个 Method 保存：

```
methodId
runtimeVersion
reportAdapterVersion
visualRegistryVersion
deliveryVersion
commerceProduct
entitlementKey
freeAccepted
fullAccepted
pdfAccepted
technicalAccepted
cutoverStatus
```

---

# 93｜RETIREMENT

旧 Specialist Workspace：

```
DO NOT DELETE
```

旧“作为默认 Full Report”的 ownership：

可以在 production acceptance 后：

```
RETIRE AS PRIMARY DELIVERY
```

保留：

```
DETAIL_OWNER
```

---

# 94｜OLD GUIDED REPORT REVIEWS

例如：

```
/docs/guided-report-successor-r2/
```

保留为：

```
governance / acceptance evidence
```

不要成为 public navigation。

---

# 95｜GLOBAL FINAL CUSTOMER MODEL

最终所有 Method 都必须表现成：

```
PERSONAL REALITY

Your BaZi Report
Free Reading

[personal visuals]

────────────

Continue deeper
Full BaZi Report
RM39

────────────
```

购买以后：

```
Your BaZi Full Report

Open Report
Download PDF
Explore Details
```

---

# 96｜WHAT “EXPLORE DETAILS” MEANS

BaZi：

```
current long specialist workspace
```

Astrology：

```
Astrology Specialist V3
```

Zi Wei：

```
Zi Wei specialist workspace
```

Numerology：

```
Numerology chart-first reading
```

ECR：

```
Mandala / cards / technical reading
```

HD：

```
professional reading detail
```

Profile：

```
evidence detail
```

Cross：

```
claim lineage / method contribution detail
```

---

# 97｜MOST IMPORTANT PRODUCT RULE

Customer should never have to understand:

```
PPR-R3
W12
W17
Guided Report R2
Visual Batch
T2
T3
IR
```

客户只看：

```
Free Report
Full Report
Explore Details
```

---

# 98｜MOST IMPORTANT ENGINEERING RULE

代码可以有多个内部 owner。

客户不能看到多个竞争的：

```
“main report”
```

必须只有一个 canonical report owner。

---

# 99｜FINAL SUCCESS CONDITION

完成以后：

```
Method Runtime
        ↓
Governed Reading
        ↓
Report Adapter
        ↓
Publication
        ↓
Access Resolver
        ↓
Free / Full
        ↓
Commerce entitlement
```

和：

```
Governed Reading
        ↓
Specialist Explorer
```

成为两个明确分支。

---

# 100｜FINAL CODEX HARD DIRECTIVE

直接把这一段放在任务结尾：

```
Do not solve the current report problem by rewriting each specialist renderer independently.

Create one shared Report Delivery R1 layer that determines FREE, LOCKED and ENTITLED customer states and routes an admitted method reading either into its publication adapter or its optional specialist detail surface.

Existing specialist renderers remain method-owned detail explorers.

Existing Commerce products and entitlement authorities must be reused.

Existing method runtimes, interpretations, timing owners and semantic authorities must not be changed.

A Full Report must be rendered through the publication system rather than by printing the current specialist workspace.

A Free Report must provide genuine personal value without exposing paid findings.

A Locked Report must not receive paid semantic payloads into the browser.

An Entitled customer must receive the premium full publication and may optionally open the existing specialist detail view.

Static report assets and dynamic method visuals are separate layers and both must appear where appropriate.

Do not screenshot specialist pages into reports.

Do not create a second entitlement system.

Do not create a second report engine.

Do not globally activate all methods.

BaZi is the first delivery pilot only.

After BaZi customer acceptance, freeze the Report Delivery R1 transport contract and migrate each remaining method through METHOD BATCH 0 before its existing A/B/C/D publication work.

Final customer vocabulary:

FREE REPORT
FULL REPORT
EXPLORE DETAILS
```