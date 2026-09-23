# PHI OS｜GUIDED REPORT SUCCESSOR R2 — ADDENDUM D

# LIVE T3 COMPOSITION + EDITORIAL CANON + PRODUCTION CUTOVER

## BaZi Reference Implementation

**Asset status:** COMPLETE / R2 BOUND  
**Asset work is no longer a blocker.**

```
VISUAL_ASSET_PENDING = false
R2_WEBP_BINDING = complete
```

本阶段不得继续把 WebP / R2 asset inventory 当成未完成项。

---

# D0｜目标

把目前：

```
Canonical Facts
↓
T2 template explanation
↓
customer page
```

升级成：

```
Canonical Method Facts
↓
Canonical Interpretation Object
↓
Section Evidence Pack
↓
T3 Deep Composition
↓
Semantic Verification
↓
Editorial Normalization
↓
Customer Narrative
↓
Section Layout
↓
Frozen Report Snapshot
```

最终报告必须满足：

```
method is responsible for being correct
governance is responsible for boundaries
T3 is responsible for making meaning understandable
editorial layer is responsible for making it publishable
```

---

# D1｜不要把现有问题误诊成“英文不好”

当前最大问题不是 grammar。

而是：

```
INTERNAL SEMANTIC LANGUAGE
```

直接泄漏进：

```
CUSTOMER NARRATIVE
```

以下类型全部应该退出主要正文：

```
leading functional group
23.1%
46.2%
carried mainly by
reconnects to 2 themes
reconnects to 4 themes
self anchor ↔ later expression
environment ↔ self anchor
roots 1
support 0
output cost 4
visible paths / recorded paths
```

这些信息不是全部删除。

而是重新分层：

```
Customer Narrative
Method Detail
Internal Evidence
```

---

# D2｜三层信息模型

## LEVEL 1 — Customer Narrative

客户真正阅读。

应该出现：

```
what this pattern means
why it matters
how it may appear
what conditions change it
what to observe
```

---

## LEVEL 2 — Method Detail

只在：

- structured page
- technical card
- appendix
- optional detail

显示。

允许：

```
Seven Killings
Indirect Wealth
Direct Officer
root record
element count
candidate path
```

但要有自然语言 explanation。

---

## LEVEL 3 — Internal Evidence

不得进入 customer PDF。

包括：

```
functionalGroupId
semantic weight
23.1%
46.2%
topic count
internal relation aliases
fact IDs
evidence IDs
model routing
provider
prompt version
verification result
```

---

# D3｜正式建立 Customer Vocabulary Map

新增 canonical mapping，例如：

```
Seven Killings
→ Seven Killings (七杀)
→ responsibility / pressure / decisive action context

Direct Officer
→ Direct Officer (正官)
→ rules / structure / responsibility context

Direct Resource
→ Direct Resource (正印)
→ learning / support / absorption context
```

但不要简单把术语固定翻译成一个人格性格。

必须仍由 canonical evidence pack 决定上下文。

### 客户正文第一次出现

可以：

> The chart places noticeable emphasis on responsibility, standards and structured demands.

然后技术 note：

> In BaZi terminology, part of this evidence comes from the Seven Killings and Direct Officer relationships.

而不是：

> The leading functional group is rules, responsibility and pressure at about 46.2%, carried mainly by Seven Killings...

---

# D4｜禁止百分比进入 Narrative

当前 P11、P15、P17、P20、P23 都出现类似：

```
23.1%
46.2%
```

这些数值如果是内部计算权重，就不能假装成为传统八字中的客观量化强度。

默认：

```
narrativeVisible = false
```

若某 structured diagram 确实需要：

```
methodTechnicalVisible = true
```

必须标明它是什么：

```
internal normalized composition
```

或干脆只显示分类，不显示百分比。

---

# D5｜T3 的输入不能是 raw method JSON

T3 只能收到经过治理的：

```
SectionEvidencePack
```

建议：

```
{
  "sectionKey": "S04_CAREER",
  "locale": "en",
  "facts": [],
  "admittedInterpretations": [],
  "supportingSignals": [],
  "tensionSignals": [],
  "openConditions": [],
  "counterSignals": [],
  "temporalContext": {},
  "allowedClaims": [],
  "prohibitedClaims": [],
  "technicalTerms": [],
  "reflectionTargets": [],
  "sourceFactIds": []
}
```

---

# D6｜T3 输出必须是结构化 JSON

不要让 provider 直接返回完整 HTML。

建议：

```
{
  "headline": "",
  "lead": "",
  "interpretation": [
    ""
  ],
  "supportingConditions": [
    ""
  ],
  "tensionConditions": [
    ""
  ],
  "howThisMayShowUp": [
    ""
  ],
  "counterSignals": [
    ""
  ],
  "realityCheck": [
    ""
  ],
  "closingInsight": "",
  "technicalNote": "",
  "boundaryNote": "",
  "factRefs": []
}
```

然后现有 Renderer 决定页面布局。

---

# D7｜T3 Narrative Contract

真正的 T3 每个 domain 必须回答：

```
WHAT IS THE MAIN PATTERN?

WHY DOES IT MATTER?

HOW COULD IT SHOW UP IN REAL LIFE?

WHAT SUPPORTS IT?

WHAT MAKES IT HARDER?

WHEN MIGHT THIS READING NOT FIT?

WHAT IS WORTH OBSERVING NOW?
```

不是每页把这些问题直接显示出来。

这是模型写作 contract。

---

# D8｜Section-level composition

继续沿用 Addendum A/B：

**一次生成一个 section。**

不要：

```
1 page
→ 1 LLM call
```

应该：

```
Career evidence pack
↓
T3 career section
↓
career opener intro
career analysis
career insights
optional timing context
↓
layout engine
↓
2–4 pages
```

这样上下文才连贯。

---

# D9｜哪些 section 必须 T3

BaZi：

```
S01 Overview
T1/T2

S02 Personality
T3

S03 Life Structure
T2 + T3

S04 Career
T3

S05 Wealth
T3

S06 Relationships
T3

S07 Wellbeing
T3 bounded

S08 Timing
T3 bounded

S09 Guidance
T3 synthesis

S10 Method
T1/T2
```

---

# D10｜P11 Personality 当前需要怎样改

当前 P11 的核心问题是：

```
data dump
+
method vocabulary
+
reflection exercise
```

缺乏：

```
actual human interpretation
```

目标应该更接近：

> Your chart places noticeable emphasis on learning through structure rather than through improvisation alone. You may find that a capability becomes reliable only after you have had time to absorb the rules, test them in practice and repeat the process often enough to make it your own.
> 
> This does not mean you behave the same way everywhere. The chart also contains pressure and output signals, so your expression may change when expectations become stronger or support becomes thinner. In one setting this can look disciplined and dependable; in another, the same pattern may feel demanding or overly constrained.
> 
> A useful question is not “Am I naturally good at this?” but “Under what conditions does this ability become sustainable?”

注意：

这类文字仍然必须由真正的 canonical evidence 约束。

不是把这段 hardcode。

---

# D11｜P17 Career 当前问题

目前 Career 的正文仍然是：

```
leading functional group...
46.2%
Seven Killings...
Wealth pattern path...
self anchor ↔ later expression...
```

这不是 RM39 Full Report 应该给客户的主叙事。

T3 应转换为：

```
responsibility pattern
+
role clarity
+
available support
+
resource exchange
+
conditions under which workload becomes sustainable
```

技术词放到 Method Detail。

---

# D12｜Career Narrative Target

目标风格类似：

> Your career reading points less toward a single “correct profession” and more toward the conditions under which you work well. Responsibility is a recurring theme in the chart, but responsibility alone is not the issue. The more important question is whether expectations, authority and available resources are clear enough for you to carry that responsibility sustainably.
> 
> In roles where the standard is explicit and you have room to understand the system before acting, pressure can become focus. When responsibility increases without matching clarity or support, the same pattern can become costly to maintain.
> 
> This is why two jobs with similar titles may feel completely different to you. The chart is more useful for comparing the structure of those roles than for naming one profession as your destiny.

这才是 T3 humanization。

---

# D13｜Wealth 当前问题

P20 已经正确避免 windfall / income promise。

这是好的。

但仍然太像：

```
method disclaimer
+
financial compliance
```

而不是个人财富阅读。

应保留：

```
no income promise
no investment recommendation
no windfall prediction
```

但主要正文要谈：

```
resource generation
resource retention
exchange
responsibility attached to money
decision conditions
```

边界只需最后 1 句。

---

# D14｜Relationship 当前问题

P23 有一个明显语言问题：

> recurring relationships between pillar positions between self-position...

属于生成式句法污染。

这类问题必须由：

```
Editorial Validator
```

直接拦截。

不能进入 production。

---

# D15｜Health / Wellbeing 不要硬补预测

你现在这一部分虽然比较“空”，但 Codex 的处理边界是对的。

当前明确写：

- 不建立疾病
- 不建立 vulnerable organ
- 不建议 treatment

正文也明确将 symbolic reading 与 medical cause 分开。

这个不要为了“内容更丰富”而破坏。

但名称建议从：

```
Health Analysis
```

更稳定地使用：

```
Wellbeing & Daily Rhythm
```

可以 T3 化：

```
workload rhythm
rest/recovery context
support
repetition
daily pressure
```

而不是 medical BaZi claims。

---

# D16｜Timing 是目前最大内容缺口之一

P29 已经正确有：

```
2026-09-21
Asia/Kuala_Lumpur
甲戌
丙午
```

说明 NOW resolver 已经工作。

但是 P30 的所谓：

**Current-Year Insights**

其实没有多少 “insight”。

主要仍然是：

> compare this time window...
> 
> which experience contradicts...
> 
> what stayed consistent...

也就是说：

```
Temporal Resolver = working

Temporal T3 Interpretation = not yet working
```

---

# D17｜真正 Timing T3 应输出

在不预测具体事件的情况下，至少应该生成：

```
Natal baseline

Current luck-cycle emphasis

Current-year emphasis

Where they reinforce each other

Where they create tension

What becomes more noticeable now

What support matters more now

What observation could contradict this reading
```

例如：

```
CURRENT EMPHASIS

SUPPORTING CONDITION

TENSION

WHAT TO WATCH

COUNTER-SIGNAL
```

这才叫 Current-Year Insights。

---

# D18｜Guidance 当前也只是摘要

P32 基本重新引用：

```
Work is read...
Wealth is read...
Relationships are read...
```

真正 S09 应该是：

```
Cross-section synthesis
```

不是复制前三章。

---

# D19｜S09 必须使用 Cross-Section Evidence Pack

建立：

```
IntegratedGuidancePack
```

输入：

```
top admitted personality theme
top life-structure condition
career pattern
resource pattern
relationship pattern
current timing
counter-signals
open conditions
```

然后 T3 输出：

```
3 major recurring patterns

1 current priority

2 supporting conditions

2 watch-outs

1 reversible next step

1 counter-example to retain
```

---

# D20｜Semantic Verifier 是 live T3 的真正 gate

Codex 记录里写得很准确：

> writer still requires an admitted semantic verifier

这就是现在生产切换前必须补的东西。

实现：

```
T3 GENERATOR
↓
SEMANTIC VERIFIER
↓
PASS / REPAIR / REJECT
```

---

# D21｜Verifier 不检查“写得漂亮吗”

它首先检查：

```
Every factual claim maps to admitted evidence

No invented BaZi fact

No changed stem / branch / cycle / year

No unsupported pattern verdict

No event prediction

No health diagnosis

No income promise

No marriage timing claim

No profession guarantee

No new factual claim about customer reality
```

---

# D22｜Sentence-level fact references

强烈建议 T3 输出每个 substantive block 同时给：

```
{
  "text": "...",
  "factRefs": [
    "BAZI_FACT_...",
    "BAZI_REL_..."
  ]
}
```

Verifier 检查：

```
factRefs ⊆ admittedFacts
```

如果模型写了一个没有任何支持 ref 的实质性结论：

```
REJECT
```

---

# D23｜Semantic Verifier 结果 schema

```
{
  "status": "PASS | REPAIR | REJECT",
  "unsupportedClaims": [],
  "scopeViolations": [],
  "factConflicts": [],
  "terminologyIssues": [],
  "repairInstructions": []
}
```

---

# D24｜最多一次自动 Repair

流程：

```
T3 output
↓
verify

PASS
→ editorial

REPAIR
→ one repair request
→ verify again

REJECT
→ T2 fallback
```

不要无限重试。

---

# D25｜Editorial Validator

Semantic PASS 后还不能直接 production。

必须再跑：

```
EDITORIAL_VALIDATOR
```

检查客户语言。

---

# D26｜Editorial Canon EN v1

英文版禁止客户正文出现：

```
leading functional group
reconnects to X themes
carried mainly by
source-designated emphasis
admitted path
interface count
output cost
root record
self anchor
later expression
```

除非处于明确的：

```
TECHNICAL NOTE
```

---

# D27｜English prose standard

目标：

```
native editorial English
clear
warm-neutral
precise
not mystical advertising
not academic paper
not software UI
not compliance memo
```

句子优先：

```
human concept
→ condition
→ example
→ boundary
```

而不是：

```
method ID
→ percentage
→ label
→ disclaimer
```

---

# D28｜禁止每一页重复安全语言

当前多个 section 都用相似：

```
does not establish...
does not guarantee...
does not predict...
```

边界必须存在，但改成：

```
one compact boundary note per section
```

而不是吞掉 narrative。

---

# D29｜Section-level boundary

例如 Career：

> This reading describes work dynamics, not a guaranteed profession or outcome.

够了。

不需要正文里面再重复 3 次。

---

# D30｜T3 Content Minimum

每个 major T3 section 至少应该提供：

```
1 primary interpretation

2 supporting details

1 conditional alternative

1 real-world manifestation

1 counter-signal

1 grounded reflection
```

否则 T3 quality fail。

---

# D31｜禁止 Generic Reflection 伪装成 Personalization

例如现在：

> Compare one easy learning experience with one difficult experience...

这种可以保留为：

```
REFLECTION
```

但不能成为主要“Strengths & Challenges”。

真正 Strengths & Challenges 应该首先写：

```
what the admitted structure suggests
```

然后才：

```
how the customer can test it
```

---

# D32｜Current Strengths & Challenges 页面要重构

从：

```
01 Look for...
02 Compare...
03 Notice...
```

改成：

```
STRENGTH 01
interpretation

STRENGTH 02
interpretation

WATCH-OUT 01
interpretation

REALITY CHECK
one question
```

---

# D33｜Relationship Advice 同样处理

当前 P24 几乎全部是 generic communication advice。

应该：

```
relationship pattern
↓
what supports it
↓
what complicates it
↓
practical observation
```

而不是让 BaZi 报告变成普通关系 self-help。

---

# D34｜T3 Provider Router

沿用现有：

```
Model Router
```

不要另建 provider route。

请求：

```
{
  "taskType": "REPORT_SECTION_COMPOSITION",
  "executionClass": "T3_DEEP_COMPOSITION",
  "locale": "en",
  "evidencePack": {},
  "compositionPolicy": "BAZI_EDITORIAL_V1"
}
```

Router 决定：

```
OpenAI
DeepSeek
or another admitted provider
```

---

# D35｜Provider 不得成为 authority

即使 provider 是更强模型：

```
Provider
≠
BaZi engine
```

它只负责：

```
composition
```

---

# D36｜T3 Snapshot Cache

通过 semantic verifier 的最终版本必须 freeze：

```
reportSectionCompositionSnapshot
```

保存：

```
section key
locale
canonical evidence hash
temporal snapshot
composition version
verifier version
final narrative
```

普通 reopening 不重新生成。

---

# D37｜Production Cutover Strategy

不要从：

```
T3 OFF
```

直接切：

```
T3 ON FOR ALL USERS
```

按照四阶段。

---

# D38｜Stage 1 — SHADOW

```
T3_SHADOW = true
CUSTOMER_T3 = false
```

真实生成：

```
T3
```

但用户仍看到 T2。

内部比较：

```
T2
vs
T3
```

验证：

- hallucination
- semantic preservation
- writing quality
- latency
- cost
- provider error

---

# D39｜Shadow fixtures

至少跑：

```
12 BaZi profiles
×
2 locales
×
9 T3-capable sections
```

不要求每份都人工逐字，但必须覆盖：

```
high evidence
low evidence
open pattern
mixed signals
custom time
NOW
```

---

# D40｜Stage 2 — QA T3

```
T3_QA_ACTIVE = true
PRODUCTION = false
```

仅：

```
preview / QA report
```

使用 T3。

这时生成真正：

```
bazi-t3-en.pdf
bazi-t3-zh.pdf
```

做 human acceptance。

---

# D41｜Human acceptance 不只看“有没有错误”

必须逐 section 判：

```
ACCEPT
REVISE
REJECT
```

指标：

```
Method fidelity
Human readability
Personal specificity
No internal language
No boilerplate repetition
Boundary quality
Narrative value
Locale-native quality
```

---

# D42｜Stage 3 — Canary Production

先：

```
BAZI_T3_PRODUCTION_PERCENT = small cohort
```

或仅：

```
staff / test purchase
```

不需要一开始所有人。

检查：

```
report generation completion
provider errors
repair rate
T2 fallback rate
PDF rendering
customer-visible leakage
```

---

# D43｜Stage 4 — BaZi Production Default

只有：

```
semantic verifier PASS
editorial validator PASS
browser/PDF PASS
human accepted
fallback PASS
```

以后才：

```
BAZI_GUIDED_REPORT_R2_ACTIVE = true
BAZI_T3_DEFAULT = true
```

这时：

```
Production successor active = true
```

---

# D44｜不要把 fallback 当 production failure

如果 provider temporarily fail：

```
T3 failed
↓
T2 governed fallback
↓
report still delivered
```

记录：

```
T3_FALLBACK_USED
```

客户不要看到 API error。

---

# D45｜Production gate

建议写成 checker：

```
check-bazi-t3-production-gate.mjs
```

必须验证：

```
semantic verifier exists

editorial validator exists

T3 snapshot exists

T2 fallback exists

no internal terms leaked

no unsupported claims

NOW interpretation populated

ZH/EN semantic parity

human acceptance record exists
```

否则：

```
CUTOVER FAIL
```

---

# D46｜文字质量自动 checker

新增：

```
check-report-editorial-quality.mjs
```

查找禁止客户正文：

```
leading functional group

carried mainly by

reconnects to

source-designated

self anchor

later expression

interface count

output cost

root record

admitted path

provider

model

prompt

hash
```

technical appendix 允许白名单。

---

# D47｜重复句检测

如果两个不同 section 出现过度类似：

```
For X, the leading functional group...
It also connects to...
It directly reconnects...
so this is best read together...
```

直接 FAIL。

---

# D48｜Boilerplate similarity

给主要 narrative block 做 similarity check。

例如：

```
S02
S03
S04
S05
S06
```

如果结构和文字高度重复：

```
EDITORIAL_TEMPLATE_REPETITION
```

---

# D49｜T3 semantic parity

中英文不是互译链。

继续：

```
same evidence pack
↓
compose en

same evidence pack
↓
compose zh-Hans
```

然后比对：

```
claims
conditions
boundaries
counter-signals
```

语气与句法可以不同。

---

# D50｜Chinese editorial standard

中文版不要变成技术中文：

```
可见路径
接口
承载支持
来源指定重点
优先主题
```

除非是技术表。

主文使用：

```
你目前可以从这组结构中观察到……
更值得留意的是……
当……时，这一倾向可能表现得更明显……
如果现实经验与这里不同，应保留那个差异……
```

不是把英文 internal terminology 直译成中文。

---

# D51｜Section opener 文字也需要 T2/T3 升级

现在 opener 的文字已经比旧版好很多。

例如 Career：

> Work brings responsibility, output and support into a concrete setting...

可以继续。

但不要每个 opener 都：

```
This chapter...
This chapter...
This chapter...
```

建立三种 opener pattern：

```
question-led
concept-led
context-led
```

交替使用。

---

# D52｜Method appendix 当前可以保留为基线

P35–P36 的方法边界其实已经相对成熟。

例如 P35 明确区分：

```
recorded symbol / count
interpretation
independent evidence
```

P36 也明确说明：

```
visible stems
branches
hidden stems
element counts
open patterns remain open
timing layers do not replace natal structure
```

所以这里不是本轮重点。

---

# D53｜优先重写页面

第一轮 T3 不需要把 36 页全部推翻。

优先：

```
P11 Personality Analysis

P12 Strengths & Challenges

P15 Life Structure Narrative

P17 Career Outlook

P18 Work Patterns

P20 Wealth Analysis

P21 Resources

P23 Relationship Patterns

P24 Relationship Advice

P26 Wellbeing

P29 Current Timing

P30 Current-Year Insights

P32 Integrated Guidance

P33 Next Steps
```

也就是主要的：

```
NARRATIVE
INSIGHT
TIMING
SUMMARY
```

页面。

---

# D54｜Structured pages继续 deterministic

例如：

```
P08 Your BaZi Chart
P14 Chart Structure
P29 temporal factual header
```

不要为了 T3 而让模型重新生成 deterministic facts。

---

# D55｜建议新的 Composition Version

登记：

```
BAZI_EDITORIAL_COMPOSITION_V1
```

以及：

```
BAZI_SEMANTIC_VERIFIER_V1
BAZI_EDITORIAL_VALIDATOR_V1
```

不要继续把旧 T2 template overwrite 后还叫同一 version。

---

# D56｜Codex Implementation Order

按：

```
D-W0
Inventory current T2/T3 path

D-W1
Customer/Internal vocabulary separation

D-W2
SectionEvidencePack schema

D-W3
T3 output schema

D-W4
T3 section composer

D-W5
Semantic verifier

D-W6
Repair/reject/fallback path

D-W7
Editorial Canon EN

D-W8
Editorial Canon zh-Hans

D-W9
Editorial validator

D-W10
Personality T3

D-W11
Life Structure T3

D-W12
Career T3

D-W13
Wealth T3

D-W14
Relationship T3

D-W15
Wellbeing bounded T3

D-W16
Timing T3

D-W17
Integrated Guidance T3

D-W18
Section snapshot cache

D-W19
Shadow generation

D-W20
EN/zh human QA

D-W21
Canary

D-W22
BaZi production cutover

D-W23
Freeze
```

---

# D57｜必须生成新的 review

Codex 最后不能只报告：

```
tests pass
```

必须实际产出：

```
docs/guided-report-successor-r2/
bazi-t3/
en/
review.html

zh-Hans/
review.html
```

以及：

```
bazi-t3-en.pdf
bazi-t3-zh-Hans.pdf
```

---

# D58｜Human Review 页面增加 side-by-side

非常建议 Codex 增加：

```
T2 CURRENT
|
T3 CANDIDATE
```

只在 QA review 页面。

至少针对：

```
Personality
Career
Wealth
Relationship
Timing
Guidance
```

这样你一眼就能判断：

> 新的 T3 到底有没有比现在真正提升。

---

# D59｜Production Acceptance

BaZi production cutover 前必须人工通过：

```
P11
P15
P17
P20
P23
P26
P29
P30
P32
```

这是最关键的 9 个页面。

---

# D60｜最终完成定义

只有以下都成立：

```
Live T3 provider succeeded

Semantic verifier passed

Editorial validator passed

T2 fallback passed

T3 snapshot frozen

EN accepted

ZH accepted

PDF/browser passed

No internal wording leakage

Production gate passed
```

才可以写：

```
BAZI_R2_T3_ACCEPTED
BAZI_PRODUCTION_SUCCESSOR_ACTIVE
```

---

## 我对你现在这份 36 页报告的判断

现在其实已经不应该再重做大的 architecture 了。

**结构已经可以保留。**

尤其这些已经正确：

- 10 个章节
- section opener
- 36 页动态 pagination
- NOW 时间
- 中英文架构
- HTML/PDF 同 source
- unsupported claims 保持开放
- no internal IDs
- fallback
- checker

真正拖累成品感的是：

```
T2 semantic prose
```

仍然太接近机器内部语言。

最典型就是这一套反复出现：

```
leading functional group
↓
percentage
↓
carried mainly by
↓
pattern path
↓
pillar relationship
↓
reconnects to X themes
```

这应该完整退出客户 narrative。