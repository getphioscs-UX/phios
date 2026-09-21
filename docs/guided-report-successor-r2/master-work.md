# PHI OS｜GUIDED REPORT SUCCESSOR R2

# Full Production Master Work

## P07+ Unified Publication Runtime + Governed LLM Composition + Temporal Default + Visual Continuity

**Status:** Production successor work  
**Execution type:** Existing-runtime enhancement only  
**Do not create parallel runtimes**  
**Reference implementation:** BaZi Batch 6  
**Successor scope:** BaZi / Zi Wei / Astrology / Profile / Numerology / ECR / Human Design / Cross

---

# 0｜MASTER EXECUTION BOUNDARY

基于当前 repo、当前 production architecture、现有：

```
Method Runtime
Model Router
LLM Composer
Knowledge / Evidence
Report Runtime
Guided Report Successor
Customer UI
Commerce / Unlock Full Report
```

继续升级。

## 禁止事项

不得新增：

```
Second LLM Composer
New Report Runtime
New Method Runtime
New Knowledge Master
Parallel Personal Reading Runtime
Parallel Translation Runtime
Independent PDF Engine
```

必须在现有 ownership 内补齐。

继续服从现有 AI Execution Class：

```
T0_DETERMINISTIC
T1_CANONICAL_ASSEMBLY
T2_LIGHT_COMPOSITION
T3_DEEP_COMPOSITION
```

---

# 1｜REFERENCE FAILURE TO FIX

BaZi Batch 6 当前已经证明：

```
P01–P05
premium publication quality

↓

P06+
dashboard-like generated report
```

从而形成：

```
VISUAL_PROMISE_MISMATCH
```

目前 P06 之后包含：

- 大量白底后台感 card
- 小字体
- 视觉密度骤降
- 方法视觉语言消失
- page numbering 重复
- 中文／英文 layout 漂移风险
- 内容偏 canonical/debug language
- 缺少真正 humanized interpretation
- conditional state 暴露给客户
- internal provenance 泄漏给客户

BaZi 当前 P06 已同时出现多个 `06` 与 `06 / 26` 类型编号；必须由唯一 pagination component 接管。

---

# 2｜P01–P06 FREEZE

这一点非常重要。

## 不重做 P01–P06

现有已完成的高视觉质量资产继续使用。

```
P01
BILINGUAL COVER ONLY

P02–P06
USE EXISTING APPROVED ASSET / TEMPLATE
DO NOT REDESIGN
```

允许存在：

```
ZH approved version
EN approved version
Bilingual approved version
```

但必须继续调用现有 canonical asset / template。

Codex 不应为了实现新的统一系统而把这些页转换成 P07+ layout。

---

# 3｜COVER POLICY FREEZE

所有 Method：

```
COVER_MODE = BILINGUAL_ONLY
```

不建立：

```
ZH-only Cover
EN-only Cover
```

无论：

```
reportLocale = zh-Hans
reportLocale = en
```

均调用同一 Method 的 bilingual cover。

例如：

```
BaZi Cover
Zi Wei Cover
Astrology Cover
HD Cover
Cross Cover
...
```

每个 Method 一个 canonical bilingual cover。

---

# 4｜P07+ UNIFIED REPORT SHELL

从 P07 起，所有 Method 使用统一 semantic layout。

不要建立：

```
BaZi page engine
Zi Wei page engine
Astrology page engine
...
```

建立或升级现有 shared report components，使之能够承载不同 method content。

Canonical structure：

```
ReportPage
├── ReportHeader
├── MethodIdentity
├── SectionLabel
├── PageTitle
├── LeadQuestion / LeadStatement
├── PrimaryVisualModule
├── CanonicalFacts
├── HumanInterpretation
├── ContextualObservation
├── CounterSignal
├── PracticalReflection
├── BoundaryNote
└── ReportFooter
```

不是所有页面必须显示全部 blocks。

Component 必须支持 optional rendering。

例如结构页可能是：

```
Title
Visual
CanonicalFacts
Interpretation
Boundary
```

领域阅读页则可能是：

```
Title
Lead
HumanInterpretation
Evidence Highlights
Contextual Observation
Practical Reflection
Boundary
```

---

# 5｜P07+ VISUAL CONTINUITY

P07 以后不能继续使用 generic white SaaS dashboard。

但也不能把每一页做成满版复杂 artwork。

目标：

```
Premium publication
+
data clarity
+
method identity
+
long-form readability
```

建立三层 Visual Skin contract：

```
METHOD_BODY_BACKGROUND
METHOD_SECTION_BACKGROUND
METHOD_MOTIF_LAYER
```

## METHOD_BODY_BACKGROUND

用于多数正文页。

要求：

- 极轻
- 不干扰正文
- method-specific
- 边缘／角落／底部使用
- 中央文字安全区域保持清晰
- 不含任何 baked-in text
- 不含 page number
- 不含 report title

## METHOD_SECTION_BACKGROUND

用于重大 section transition。

例如：

```
结构
自我
关系
事业
财富
时间
现实导航
结语
```

视觉稍强，但仍属于正文。

## METHOD_MOTIF_LAYER

透明 SVG / WebP decorative system。

例如：

```
BaZi
五行 / 干支 / 山水 / 环形关系

Zi Wei
宫位 / 星曜 / 宫格轨迹

Astrology
轨道 / 星体 / 宫位 / aspect geometry

Human Design
channel geometry / centers / gates

Numerology
number geometry / grid / sequence

ECR
layers / fields / reality networks

Profile
identity / pattern / layered self

Cross
intersection / four-direction / integration
```

---

# 6｜DO NOT BAKE CONTENT INTO VISUAL ASSETS

所有 P07+ visual assets 必须是：

```
BACKGROUND / MOTIF ONLY
```

禁止把：

```
page title
body copy
page number
method facts
customer data
translation
```

做进 PNG/WebP。

所有内容由 HTML/CSS/runtime render。

这样 ZH / EN 才可以共用同一 visual skin。

---

# 7｜GLOBAL PAGINATION FREEZE

从这一轮开始统一。

## P01

```
no visible page number
```

## P02+

统一：

```
NN / TOTAL
```

例如：

```
02 / 26
03 / 26
...
26 / 26
```

不要：

```
02
```

与：

```
02 / 26
```

混用。

不要出现：

```
06
06
06 / 26
```

page number 由：

```
GlobalReportPagination
```

唯一 owner 生成。

Pagination：

- 不进入 translation files
- 不由 page content 自行写入
- 不由 visual asset 提供
- 不由 individual method template 提供

---

# 8｜ZH / EN SEMANTIC PARITY

禁止建立两套独立页面系统。

使用：

```
ONE page schema
ONE visual grid
ONE component hierarchy
ONE pagination system
ONE method skin
```

然后：

```
locale = zh-Hans
```

或者：

```
locale = en
```

只允许 locale typography token 不同。

例如：

```
--report-title-size-zh
--report-title-size-en

--report-body-leading-zh
--report-body-leading-en

--report-tracking-zh
--report-tracking-en
```

但以下不得改变：

```
main grid
margin
header position
footer position
visual module position
page number position
section identity
```

---

# 9｜OVERFLOW / TEXT-FIT GOVERNANCE

绝对不能通过：

```
font-size: 9px
```

之类方式硬塞文字。

建立 controlled text fitting。

顺序：

```
1. use locale typography token
2. allow predefined compact variant
3. reduce decorative spacing
4. reflow approved modules
5. use alternate approved page composition
```

最后才允许非常有限的 typography compression。

建立最低字号 boundary。

例如：

```
BODY_MIN_FONT_SIZE
CAPTION_MIN_FONT_SIZE
FOOTNOTE_MIN_FONT_SIZE
```

低于阈值 checker fail。

---

# 10｜TIME INPUT SUCCESSOR

这是本轮重要修改。

客户在建立 report 时：

## Default

```
targetTimeMode = NOW
```

系统自动取得：

```
current local date
current local time
current timezone
```

作为报告的默认观察时间。

UI 不需要客户另外填写。

客户输入流程应该保持简单。

例如：

```
出生资料
地点
方法必要资料

[✓] 以现在作为当前观察时间
```

默认已经勾选。

---

# 11｜CUSTOM TIME OPTIONAL

只有客户主动希望研究：

```
过去
未来
特定日期
特定时期
```

才打开：

```
Explore another time
探索其他时间点
```

然后出现：

```
date
time
timezone
optional question/context
```

因此：

```
NOW = default
CUSTOM = opt-in
```

不是：

```
NONE = default
```

---

# 12｜NO EMPTY TEMPORAL REPORT STATE

生产 Full Report 不得因为客户没有主动选择目标日期而出现：

```
未选择目标时间
需要目标时间
不可用
所选大运不可用
所选流年不可用
```

当前 BaZi P20/P21 的这种状态必须退休。

默认必须使用：

```
reportGeneratedAt
+
customer timezone
```

解析当前时间层。

例如八字：

```
Natal baseline
→ current Da Yun
→ current year
→ where permitted: current month/day context
```

具体 method 只能使用它真实支持的时间层。

不得制造 method 不支持的时间逻辑。

---

# 13｜TEMPORAL SNAPSHOT RECORD

每份报告内部保存：

```
temporalContext: {
  mode: "NOW" | "CUSTOM",
  localDate:
  localTime:
  timezone:
  utcOffset:
  resolvedMethodLayers:
  generatedAt:
}
```

如果 CUSTOM：

```
requestedTarget:
```

也要保存。

这样未来重新生成报告时不会错误地把旧报告改成新的“今天”。

---

# 14｜CANONICAL INTERPRETATION OBJECT

真正解决目前内容太机械的问题。

Method Runtime 不应该直接给 UI 一段最终文字。

先形成 governed object，例如：

```
{
  method: "BAZI",

  topic: "CAREER",

  canonicalFacts: [...],

  evidence: [...],

  supportingSignals: [...],

  tensionSignals: [...],

  temporalContext: {...},

  allowedInterpretations: [...],

  prohibitedClaims: [...],

  counterSignals: [...],

  unresolvedItems: [...],

  realityQuestions: [...],

  provenance: [...]
}
```

这个 object 才是 LLM Composer 的输入。

---

# 15｜DO NOT ASK LLM TO CALCULATE METHOD FACTS

所有 deterministic / canonical method results：

```
四柱
天干
地支
藏干
日主
五行
大运
宫位
星曜
aspects
HD centers
channels
gates
profile values
numerology values
ECR canonical facts
```

必须来自 Method Runtime。

LLM 不允许自行：

```
recalculate
guess
complete missing method data
invent missing evidence
```

---

# 16｜MODEL ROUTER

继续使用现有 Model Router。

禁止：

```
if report == bazi:
    call Provider X directly
```

Report Runtime 只请求：

```
executionClass
taskType
evidencePack
language
compositionPolicy
```

由 Model Router 决定合资格 provider。

例如现有合资格 provider 可以包括：

```
OpenAI
DeepSeek
```

但必须服从 production routing / cost / availability / governance。

不要把 provider name 固定进客户报告。

---

# 17｜T0 / T1 / T2 / T3 OWNERSHIP

## T0_DETERMINISTIC

用于：

```
method calculation
date resolution
page numbering
data table
diagram values
canonical labels
```

## T1_CANONICAL_ASSEMBLY

用于：

```
canonical facts
evidence grouping
provenance
basic source-backed statement
```

## T2_LIGHT_COMPOSITION

用于：

```
short explanation
section lead
boundary explanation
simple observation prompt
```

## T3_DEEP_COMPOSITION

正式启动在真正需要个人化解释的地方：

```
self / identity
relationship
career
resource / money
life direction
timing interpretation
opportunity / tension
reality navigation
integration / synthesis
```

---

# 18｜GOVERNED HUMANIZATION

LLM Composer 不是普通 translation engine。

它的职责是：

```
canonical structured meaning
↓
natural human explanation
```

必须保持：

```
meaning
evidence
uncertainty
boundary
method vocabulary
```

同时减少：

```
backend language
machine syntax
repeated formula
generic disclaimers
developer-facing phrasing
```

---

# 19｜NARRATIVE CONTRACT

每个主要个人阅读页至少应包含以下逻辑中的若干项：

```
WHAT WE SEE
WHY IT MATTERS
HOW IT MAY APPEAR
WHEN IT MAY DIFFER
WHAT TO OBSERVE
WHAT NOT TO CONCLUDE
```

不是必须把这些英文 label 显示给客户。

这些是 composition contract。

最终应该形成自然出版文字。

---

# 20｜BAN TEMPLATE REPETITION

必须检测大量重复句式。

例如当前 P16–P19 连续出现：

```
主题组合并非预测；
计数不等于强弱或结果评分。
```

以及大量：

```
结构
条件
观察
```

这种后台 contract 可以继续存在于 data model，但不应每页机械重复成客户正文。

BaZi 当前 P16–P19 已显示领域页虽然主题不同，但 narrative pattern 高度重复。

---

# 21｜BOUNDARY DEDUPLICATION

边界必须保留，但不要每页变成：

```
不是预测
不是结果
不等于现实
保持开放
```

重复四五次。

改成分层治理。

## Page-level

只显示与本页真正有关的一句。

## Section-level

可以一次解释完整 boundary。

## Final report

再提供总的 Method & Reality boundary。

---

# 22｜P07–P15 STRUCTURAL PAGES

此类页面以：

```
T0
T1
T2
```

为主。

应保留数据可追溯性。

但加入：

```
short human explanation
why this structure matters
what not to infer
```

而不是把 dashboard raw metrics 直接放给客户。

---

# 23｜P16+ DOMAIN READING

例如 BaZi：

```
Self & Direction
Relationship
Career
Money / Resources
Timing
Opportunity & Risk
Reality Navigation
```

这些页面应进入真正个人化：

```
T3_DEEP_COMPOSITION
```

前提是 evidence admission 足够。

如果 evidence 不足：

```
T2
```

并明确保持开放。

禁止因为是 Full Report 就强行输出深度结论。

---

# 24｜CURRENT TIME NARRATIVE

因为默认目标就是现在，所以时间层应该真正进入 narrative。

例如：

```
Natal pattern
+
current timing layer
+
current year/context
```

形成：

```
baseline
current emphasis
possible tension
supporting condition
observation window
```

但只能在对应 method 支持这些层时执行。

---

# 25｜CUSTOM TIME COMPARISON

如果客户选择未来／过去：

报告不要完全重做为另一套结构。

保持：

```
Natal baseline
```

然后增加：

```
Selected Time Context
```

进行：

```
baseline
vs
selected time
```

这样客户仍然知道：

```
what is structural
what is temporal
```

---

# 26｜REALITY EVIDENCE MUST REMAIN SEPARATE

即使 LLM 已经提高 human readability，也不要把：

```
method inference
```

写成：

```
现实已经发生的事实
```

结构：

```
METHOD SIGNAL
≠
REALITY EVIDENCE
```

若客户没有提供现实 evidence，可以说：

```
值得观察……
可以回看……
如果你发现……
```

不能说：

```
你一定……
你最近正在……
你会……
```

---

# 27｜COUNTER-SIGNAL REQUIREMENT

深度 narrative 至少能够容纳：

```
supporting evidence
counter evidence
conditional explanation
```

例如：

```
结构上可见支持较少
```

不应直接写成：

```
你缺乏支持
```

而应解释：

```
命盘中的可见支持信号较少；
现实中的家庭、团队、资源和制度支持仍然可能改变实际体验。
```

---

# 28｜REPORT VALUE UPGRADE

Full Report 必须让客户感受到：

```
不是 Free Report 扩充版
不是 Data Dashboard
不是 20 页模板重复
```

每个 major domain 至少提供：

```
personalized explanation
context
conditional reading
reflection
practical next observation
```

---

# 29｜P20–P24 SUCCESSOR FOR BAZI

作为 Reference Implementation。

## P20

```
Time Structure
```

显示：

```
Natal baseline
Current Da Yun
Current year
Resolved at report generation time
```

## P21

```
Current Timing
```

使用 NOW 默认。

不再：

```
未选择目标时间
```

## P22

```
Reality Comparison
```

如果没有 customer reality evidence：

不要显示空状态 dashboard。

改成：

```
当前方法侧可以观察什么
哪些现实证据值得对照
```

## P23

```
Observable Signals
```

真正使用当前时间层＋本命结构生成观察窗口。

## P24

```
Opportunity & Risk
```

使用 evidence-bound interpretation。

不是 generic placeholder。

---

# 30｜P25 REALITY NAVIGATION

升级为真正的：

```
What to do with this reading
```

可以保留：

```
Observe
Compare
Test
Review
```

但 narrative 必须来自前面的个人读取。

不能所有客户看到完全相同的四句话。

---

# 31｜P26 CUSTOMER-FACING CLOSURE

当前 P26 暴露：

```
CMP...
hash
PPR-C1-W10
BAZI_FULL_REPORT:...
```

客户页面必须移除。

当前文件的最后一页确实存在内部 identifier / provenance code。

内部继续保留：

```
audit metadata
JSON
provenance object
QA artifact
```

客户只显示 human-readable provenance，例如：

```
命盘结构已建立
方法证据已追溯
解读边界已保留
当前时间层已确认
现实证据保持独立
```

---

# 32｜INTERNAL METADATA SEPARATION

建立明确字段：

```
customerVisible
internalOnly
```

例如：

```
hash
runtime id
checker id
pipeline id
model provider
model id
prompt version
internal evidence id
```

全部：

```
internalOnly = true
```

---

# 33｜METHOD PAGE COUNT CONTRACT

不同 method 可以有不同总页数。

不要强迫全部：

```
26 pages
```

但 P07+ 必须使用同一：

```
layout system
page number system
overflow system
narrative contract
visual skin contract
```

因此：

```
BaZi = N pages
Astrology = M pages
HD = X pages
```

都可以。

---

# 34｜PAGE REGISTRY

建立 / 升级 canonical：

```
report-page-registry
```

每页至少登记：

```
method
pageKey
sequence
section
contentType
executionClass
requiredEvidence
visualVariant
localeSupport
pagination
customerVisible
fallbackPolicy
```

不要靠 filename 推断 page semantic。

---

# 35｜PAGE CONTENT TYPE

建议至少支持：

```
INTRO_EXISTING
STRUCTURAL
DIAGRAM
DOMAIN_READING
TIMING
COMPARISON
NAVIGATION
SECTION_DIVIDER
CLOSURE
```

P01–P06：

```
INTRO_EXISTING
```

保持原调用。

---

# 36｜METHOD VISUAL SKIN REGISTRY

新增或补现有 registry：

```
methodVisualSkin
```

例如：

```
BAZI
bodyBackground
sectionBackground
motif
accentTokens
diagramTokens

ZIWEI
...

ASTROLOGY
...
```

不能在每页 hardcode URL。

---

# 37｜ASSET FAILURE FALLBACK

如果某 method 暂时没有 P07+ static asset：

不要：

```
broken image
blank slot
404
```

使用：

```
CSS-only canonical premium fallback
```

然后 QA 标：

```
VISUAL_ASSET_ENHANCEMENT_PENDING
```

而不是 blocking production。

---

# 38｜VISUAL PROMISE CHECKER

加入 automated checker。

检测：

```
P01–P06 approved asset preserved
P07+ has method skin
no generic debug shell
no missing background
no broken image
minimum font size
page number exactly once
header exactly once
footer exactly once
no overflowing block
```

---

# 39｜NARRATIVE QUALITY CHECKER

检测：

```
duplicate paragraphs
repeated disclaimers
machine-style labels
internal IDs
placeholder content
"不可用" empty-state repetition
provider name exposure
prompt leakage
hash exposure
```

---

# 40｜AI ADMISSION CHECKER

所有 T3 output 必须记录：

```
executionClass
evidence admission
model route outcome
composition version
fallback state
```

但不向客户显示 provider / internal model metadata。

---

# 41｜MODEL FAILURE FALLBACK

如果 T3 provider 不可用：

不得：

```
return blank page
show API error
show raw canonical object
```

fallback：

```
T3
↓
T2 canonical humanization
```

报告仍可完成。

内部记录：

```
DEEP_COMPOSITION_FALLBACK
```

---

# 42｜CACHE / REPRODUCIBILITY

Paid report 生成后应该 freeze narrative snapshot。

不能每次打开 PDF：

```
重新调用 LLM
```

否则客户同一份报告会不断改变。

保存：

```
canonical input snapshot
temporal snapshot
composition snapshot
locale
page registry version
visual system version
```

---

# 43｜REGENERATION POLICY

只有以下情况 regenerate：

```
customer explicitly regenerates
source facts corrected
locale changed
custom time selected
report version upgraded by permitted flow
```

不能普通 reload 就 regenerate。

---

# 44｜ZH / EN LLM FLOW

不要：

```
Generate English
↓
Translate Chinese
```

也不要强制：

```
Generate Chinese
↓
Translate English
```

Composer 输入同一个 canonical interpretation object。

然后：

```
compose(locale = zh-Hans)
compose(locale = en)
```

保持 semantic parity。

---

# 45｜SEMANTIC PARITY CHECK

同一 reading 的中英文必须共享：

```
facts
evidence
conditions
boundaries
counter-signals
recommendation scope
```

允许：

```
sentence structure
paragraph rhythm
word choice
```

不同。

不允许英文多一个结论或中文少一个 boundary。

---

# 46｜P02–P06 EXCEPTION

因为你已经完成高质量版本，所以：

```
P02–P06
```

本轮不强迫进新的 semantic page renderer。

它们可以继续是：

```
approved template / existing visual page
```

只需确保：

```
correct locale version selected
correct page order
correct page count metadata
pagination relationship correct
```

---

# 47｜P06→P07 CONTINUITY

原先我们打算改 P06 bridge。

现在正式取消该要求。

P06 保持现有高质量版本。

由 P07 负责视觉接续。

P07 第一页必须采用：

```
P07_ENTRY_VARIANT
```

它的视觉密度要比后续 ordinary body page 稍高。

目的：

```
P06 premium intro
↓
P07 personalized report
```

自然过渡。

---

# 48｜P07 ENTRY VARIANT

P07 建议：

```
30–35% method visual identity
65–70% personalized reading
```

之后普通页：

```
10–20% visual atmosphere
80–90% report content
```

避免断层。

---

# 49｜MOBILE / WEB / PDF CONSISTENCY

如果 guided report 同时有 HTML review 与 PDF export：

必须使用同一 semantic source。

不要：

```
Web Renderer
PDF Renderer
```

各维护一份内容逻辑。

允许 print-specific CSS。

---

# 50｜PRINT SAFETY

检查：

```
page break
widow / orphan
chart split
card split
footer overlap
background print
font loading
SVG rendering
WebP rendering
```

尤其 Cloudflare / headless browser production export。

---

# 51｜CUSTOMER INPUT UX

默认流程尽可能简单：

```
1. Method required data
2. Birth / source data
3. Location / timezone where required
4. NOW selected automatically
5. Generate
```

Advanced：

```
Explore another date / time
```

默认收起。

---

# 52｜NOW LABEL

客户界面可以显示：

中文：

```
✓ 以现在作为观察时间
```

英文：

```
✓ Use now as the observation time
```

旁边：

```
更改时间
Change
```

不要让客户理解什么是：

```
temporalContext
targetTimeMode
```

---

# 53｜TIMEZONE

不得单纯使用 server UTC。

必须优先：

```
customer confirmed timezone
```

或者由 location resolution 取得。

必须记录：

```
local date
local time
timezone
UTC offset
```

---

# 54｜REPORT GENERATION DATE

Report metadata 可以显示：

```
Generated for:
21 Sep 2026
Kajang time
```

如果符合现有 privacy / product design。

不是必须显示精确 location。

---

# 55｜METHOD CAPABILITY BOUNDARY

各 method 对时间的能力不同。

Codex 必须读取现有 method authority / runtime。

不能强制所有 method 使用：

```
year
month
day
hour
```

同样层级。

使用：

```
supportedTemporalLayers
```

驱动。

---

# 56｜CROSS METHOD

Cross 如果属于多方法综合报告：

必须先使用各 method 的 admitted canonical readings。

不能让 T3 直接从 raw birth data 自行做所有 method inference。

正确：

```
Method A canonical
Method B canonical
Method C canonical
...
↓
Cross admitted evidence pack
↓
T3 synthesis
```

---

# 57｜REPORT PRODUCT DIFFERENTIATION

现有价格结构下：

```
BaZi RM39
Zi Wei RM39
Astrology RM39
Profile RM39
Numerology RM39
ECR RM39
HD RM129
Cross RM299
```

这次架构应允许：

```
compositionDepth
visualDensity
pageCount
crossMethodSynthesis
```

按产品不同配置。

但不要 hardcode：

```
price = quality
```

Price / commerce 与 report semantic runtime 分离。

---

# 58｜QA FIXTURE

BaZi Batch 6 作为第一份 reference fixture。

必须验证：

```
P01–P06 unchanged

P07+
new unified visual system

NOW default resolves

P20–P24 populated

P26 internal IDs removed

ZH output

EN output

same semantic structure

page number single source

PDF export

HTML review
```

---

# 59｜BROWSER ACCEPTANCE

至少：

```
desktop
mobile report review
print preview
PDF export
ZH
EN
```

逐页检查。

不得只通过 DOM 判断视觉通过。

---

# 60｜VISUAL ACCEPTANCE

P07+ 每页检查：

```
background continuity
method identity
title hierarchy
font readability
chart clarity
white space
page number
footer
image decode
no clipping
```

---

# 61｜CONTENT ACCEPTANCE

检查：

```
Does this explain the customer?
or
Does this only describe the backend?
```

如果主要读起来像：

```
计数
状态
接口
来源
已准入
保持开放
```

没有人类解释，则 FAIL。

---

# 62｜DEEP COMPOSITION ACCEPTANCE

抽查至少：

```
self
relationship
career
money/resources
time
opportunity/risk
navigation
```

确认：

```
facts preserved
human readability improved
no hallucinated method fact
no deterministic prediction
context-specific
not generic filler
```

---

# 63｜STATIC ASSET REGISTRY ACCEPTANCE

任何新资产必须记录：

```
assetId
method
purpose
objectKey
localeIndependent = true
backgroundSafeArea
version
status
```

如果存在 R2 public URL，也登记 canonical URL。

---

# 64｜NO ASSET DUPLICATION BY LOCALE

不要产生：

```
bazi-body-zh.webp
bazi-body-en.webp
```

正确：

```
bazi-body.webp
```

因为 P07+ background 没有文字。

---

# 65｜PERFORMANCE

P07+ background 必须：

```
WebP where appropriate
SVG for motif where appropriate
reasonable dimensions
reasonable byte size
lazy load on web where applicable
```

PDF export 必须保证 print resolution。

---

# 66｜R2 / STATIC ASSET FAILURE

如果 R2 unavailable：

CSS premium fallback。

不要让 full report 变成：

```
broken blank background
```

---

# 67｜ACCESSIBILITY

HTML review：

```
semantic headings
sufficient contrast
decorative image alt=""
real diagram accessible label
logical reading order
```

背景图标记 decorative。

---

# 68｜DO NOT MODIFY METHOD CALCULATION TO FIT COPY

如果 LLM narrative 与 canonical method fact 冲突：

修 narrative / composer。

不能为了让文字好看而修改 deterministic engine。

---

# 69｜DO NOT MODIFY APPROVED P02–P06

除非：

```
broken asset
wrong language binding
wrong page ordering
technical rendering defect
```

否则：

```
NO VISUAL REDESIGN
```

---

# 70｜MIGRATION

现有 report pages 应：

```
retain backward compatibility where required
```

但新 report generation 使用 successor renderer。

旧报告不要 silently mutate。

---

# 71｜VERSIONING

建议：

```
GUIDED_REPORT_SUCCESSOR_R2
```

登记：

```
reportSchemaVersion
visualSystemVersion
composerPolicyVersion
temporalPolicyVersion
```

---

# 72｜CHECKERS

新增／升级 automated checks，名称服从现有 repo convention。

至少覆盖：

```
report page registry
P01–P06 frozen binding
P07+ unified layout
pagination
locale parity
NOW default
custom time
internal metadata exposure
LLM admission
fallback
asset decode
font minimum
overflow
duplicate narrative
```

---

# 73｜PRODUCTION REGRESSION MATRIX

必须覆盖所有 method：

```
BAZI
ZI_WEI
ASTROLOGY
PROFILE
NUMEROLOGY
ECR
HUMAN_DESIGN
CROSS
```

最少检查：

```
ZH
EN
NOW
CUSTOM_TIME where supported
PDF
review.html
```

---

# 74｜NO FAKE PASS

如果某 method：

```
canonical backend not ready
temporal engine unsupported
T3 admission unavailable
asset missing
```

必须标记真实状态。

不要生成 mock data 让 checker 通过。

---

# 75｜IMPLEMENTATION ORDER

必须按以下顺序：

```
R2-W0
Baseline + inventory

R2-W1
P01–P06 freeze

R2-W2
Global P07+ report shell

R2-W3
Pagination successor

R2-W4
Locale layout / typography

R2-W5
Method visual skin registry

R2-W6
NOW temporal default

R2-W7
Optional custom target time

R2-W8
Canonical Interpretation Object

R2-W9
Model Router / execution class binding

R2-W10
Governed LLM Composer

R2-W11
T3 domain reading activation

R2-W12
Boundary deduplication

R2-W13
Conditional / temporal content successor

R2-W14
Internal metadata isolation

R2-W15
BaZi reference implementation

R2-W16
BaZi ZH/EN parity

R2-W17
Remaining methods migration

R2-W18
Static asset binding

R2-W19
Automated checker suite

R2-W20
Browser + PDF QA

R2-W21
Human acceptance

R2-W22
Production cutover

R2-W23
Freeze + governance record
```

不要跳步。

---

# 76｜R2-W0 BASELINE

先记录：

```
HEAD
working tree status
existing report routes
existing report registry
existing visual asset registry
existing model router
existing LLM composer
existing temporal handling
existing report export path
```

不得凭假设修改。

---

# 77｜R2-W1 FREEZE MANIFEST

登记：

```
P01 canonical bilingual cover
P02 approved variants
P03 approved variants
P04 approved variants
P05 approved variants
P06 approved variants
```

对每个 method 记录：

```
asset / template source
locale variants
checksum where current repo convention uses it
```

---

# 78｜R2-W2–W5 VISUAL FOUNDATION

完成：

```
shared page schema
shared layout
pagination
typography
method skin registry
P07 entry variant
ordinary body variant
section variant
```

---

# 79｜R2-W6–W7 TEMPORAL FOUNDATION

完成：

```
NOW default
timezone resolution
report temporal snapshot
optional custom time
```

并确保输入 UX 不因此增加步骤。

---

# 80｜R2-W8–W13 CONTENT FOUNDATION

完成：

```
canonical interpretation object
model router
execution classes
LLM composer
deep composition
boundary deduplication
temporal interpretation
```

---

# 81｜R2-W14 INTERNAL SEPARATION

明确：

```
customer PDF
customer HTML
```

永远不出现：

```
hash
commit
pipeline code
runtime ID
internal evidence ID
model/provider identifier
debug label
```

---

# 82｜R2-W15 BAZI FIRST

必须先把当前 Batch 6 完整改造成 reference implementation。

不是一次修改所有方法后才看结果。

BaZi 通过以后再推广。

---

# 83｜R2-W16 HUMAN REVIEW

至少人工看：

```
P06 → P07
P07 → P08
structural → domain
domain → timing
timing → navigation
P25 → P26
```

确保没有新的 style cliff。

---

# 84｜R2-W17 METHOD ROLLOUT

按照当前 production readiness 分批 rollout。

不要因为某一个 method 尚未 ready 阻塞已经 ready 的 method。

但统一 contract 不得分叉。

---

# 85｜R2-W18 ASSET BINDING

绑定用户提供的 static visual assets。

若未提供：

```
CSS fallback
```

仍完成其余 runtime。

---

# 86｜R2-W19 CHECKER

checker 必须检测结果，不只检测文件存在。

例如：

```
render final PDF
inspect page count
inspect duplicate pagination
inspect missing image
inspect customer-visible internal IDs
```

---

# 87｜R2-W20 BROWSER + PDF

必须实际生成：

```
review.html
PDF
```

检查。

---

# 88｜R2-W21 HUMAN ACCEPTANCE

建立 acceptance checklist：

```
VISUAL_CONTINUITY
CONTENT_DEPTH
READABILITY
METHOD_ACCURACY
TEMPORAL_COMPLETENESS
LOCALE_PARITY
CUSTOMER_SAFETY
PROVENANCE_PRIVACY
```

---

# 89｜R2-W22 CUTOVER

只有：

```
automated pass
+
human accepted
```

才能成为 production default。

---

# 90｜R2-W23 FREEZE

记录：

```
production successor active
old default retired / preserved as governed history
version
commit
acceptance evidence
```

服从当前 repo governance。

---

# 91｜FINAL REQUIRED DELIVERABLES

Codex 必须完成代码，而不是只给建议。

最终至少包括：

```
1. P07+ shared report shell
2. global pagination
3. locale typography system
4. visual skin registry
5. NOW temporal default
6. optional custom time
7. temporal snapshot
8. canonical interpretation object
9. model router integration
10. governed LLM composition
11. T3 domain narrative
12. boundary deduplication
13. customer/internal provenance separation
14. BaZi upgraded reference report
15. ZH/EN parity
16. method rollout
17. checkers
18. QA evidence
19. production cutover record
```

---

# 92｜SUCCESS CRITERIA

最终客户从 P01 一路看到最后一页时，应感受到：

```
一本完整的 premium personalized publication
```

而不是：

```
前六页是设计稿
+
后二十页是 dashboard
```

并且报告文字应该做到：

```
后台负责算对
治理层负责限定
LLM 负责解释清楚
视觉系统负责让整本报告连贯
```

---

# 93｜DO NOT STOP AT SPEC

Codex 应直接：

```
inspect current repo
implement
run tests
run report generation
render review
render PDF
fix regression
produce acceptance evidence
```

不要只生成：

```
design proposal
markdown plan
TODO list
```

如发现现有架构名称与本 Master Work 不同，以 **现有 canonical runtime ownership 为准**，禁止为了匹配本文名称而建立平行系统。

---
