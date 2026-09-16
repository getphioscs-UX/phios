# `PHI-OS-PIS-R1`

# Public Index Surface Successor

## 全站入口页面、品牌信息与视觉资产整合

## Master Work Step v1.0.0

这轮的核心不动后端 Runtime，不重做 Knowledge Master，不重写 Ask，也不重新发明 Visual Authority；它只负责：

> **Public Information Architecture + Editorial Quality + Commercial Discovery + Visual Consumption + Customer Language**

---

# PHASE PIS-0｜Baseline & Authority Reconciliation

## PIS-W0｜唯一执行基线

以当前 `about.zip` 作为唯一文件基线，首先记录：

```
baseline commit
source zip digest
current route registries
current visual registry pointer
current R2 public base
current seven-volume architecture
current product / commerce routes
```

不得：

```
checkout stale main
恢复 retired pages
恢复 five-volume architecture
复制旧页面重新命名
```

输出：

```
docs/public-index-successor/
pis-r1-w0-baseline-audit-v1.json
```

---

# PIS-W1｜全部 Index Surface Census

不要只找：

```
/index.html
/about/index.html
/founder/index.html
/thesis.html
```

必须扫描所有：

```
**/index.html
```

以及仍承担 canonical landing / thesis / public entry 功能的 standalone HTML。

每个页面标记：

```
surfaceId
path
routeId
canonicalPath
audience
purpose
currentStatus
currentContentDepth
commercialRole
visualCoverage
languageQuality
internalLanguageLeak
sevenVolumeAlignment
ctaState
routeAuthority
```

`audience` 固定：

```
PUBLIC_DISCOVERY
PUBLIC_KNOWLEDGE
PUBLIC_PRODUCT
CUSTOMER_WORKSPACE
PROFESSIONAL
RESEARCH
FUNCTIONAL_TRANSACTION
REVIEW_INTERNAL
COMPATIBILITY_ONLY
```

关键原则：

> **不是所有 index.html 都要变成营销页面。**

例如支付成功页、账户页、专业预约页需要提升清晰度，但不应该变成长篇品牌介绍。

---

# PIS-W2｜Canonical Route Reconciliation

先对照当前：

```
canonical-customer-route-registry
wpr route registry
current public route authority
```

再决定页面用途。

每一个页面只能是：

```
CANONICAL
ACTIVE_SECONDARY
FUNCTIONAL_CHILD
COMPATIBILITY
HISTORICAL
RETIRE
```

禁止因为本轮提升网页品质而重新建立：

```
/services
/books
/readings
旧 my-reality
旧 financial-reality
旧 personal-runtime
```

等已经被 successor/route governance 改掉的路径。

这一步尤其重要，因为目前 repo 中不同年代 registry 仍保存过历史路径；本轮只能读取 current authority，不能把历史声明重新当现役。

---

# PHASE PIS-1｜Customer Language Authority

这是这轮最重要的规则之一。

# PIS-W3｜Internal Language Ban

所有面向大众的入口型页面禁止出现内部工程语言。

例如客户界面不得出现：

```
canonical
registry
runtime owner
authority registry
projection registry
cutover
successor
freeze
admission
resolver
contract
execution class
fixture
checker
consumer state
pipeline
binding state
IR
R2 object authority
```

除非词语本身就是客户真正需要理解的公共概念，而且已经被翻译成自然语言。

例如：

```
Canonical Knowledge
```

公共页面改成：

```
经过整理与审阅的 PHI OS 知识
```

```
Runtime
```

若不是书籍理论正文，公共页面优先改成：

```
持续变化的现实
当前处境
现实状态
持续过程
```

```
Projection
```

优先：

```
方法给出的观察结果
一种可能的解释
模型所呈现的视角
```

```
Unknown
```

优先：

```
目前仍不知道的部分
现有资料无法确认的部分
```

---

# PIS-W4｜Public Vocabulary Canon

建立：

```
content/web/public-language/
public-language-canon-v1.json
```

至少维护三层：

```
INTERNAL TERM
PUBLIC ENGLISH
PUBLIC ZH-HANS
```

例如：

```
RRE
→ Reality Reading
→ 现实读取

RNE
→ Navigation
→ 现实导航

LRM
→ Continuity over time
→ 随时间保留现实变化

Evidence
→ Evidence
→ 证据 / 可核对依据

Method Projection
→ Method perspective
→ 方法提供的观察视角
```

这不是改底层变量名。

只控制：

```
customer-visible copy
aria labels
headings
CTA
helper text
empty states
```

---

# PIS-W5｜Editorial Quality Standard

所有一级入口页必须满足：

```
第一屏 5 秒内知道：
1. 这里是什么
2. 对我有什么用
3. 我下一步可以做什么
```

页面正文必须进一步回答：

```
为什么存在
解决什么问题
与其他入口有什么关系
什么情况下适合我
什么情况下不适合
从这里下一步去哪
```

不得出现只有：

```
标题
一句说明
几个按钮
```

的“空壳首页”。

---

# PHASE PIS-2｜Global Information Architecture

# PIS-W6｜全站首页职责重建

`/index.html` 只承担六个工作：

```
1. PHI OS 是什么
2. 为什么现在需要它
3. 七册知识体系是什么
4. 我现在可以怎样使用
5. 哪些是免费 / 哪些可以深入付费
6. 下一步去哪
```

首页不要继续承担：

```
完整 Founder biography
完整 Thesis
完整方法解释
完整专业治理说明
完整七册章节介绍
```

这些内容应该分别进入各自 landing page。

首页必须成为：

> **Orientation + Discovery + Conversion**

而不是百科全书。

---

# PIS-W7｜全站一级导航

建议 Public primary：

```
Explore
My Reality
Perspectives
Knowledge
Professional
```

Utility：

```
Search
Ask PHI OS
Account
Language
```

同时在 Explore / footer / contextual navigation 内开放：

```
Books
About
Founder
Thesis
Research
Academy
Membership / paid experience
```

避免把 15 个入口全部塞进顶栏。

---

# PHASE PIS-3｜Homepage Successor

# PIS-W8｜首页 Hero

保留这次原型最成功的方向：

> **答案越来越多，真正困难的是下一步怎么办。**

Hero 必须同时出现两个动作：

```
免费问一个真实问题
查看 PHI OS 可以怎样帮助我
```

第二 CTA 不直接叫：

```
Products
Pricing
Buy
```

而是客户语言：

```
看看适合我的入口
```

---

# PIS-W9｜Need-Based Entry

首页正式设置：

```
我有一个问题
→ Ask

我想先了解
→ Explore / Books

我想了解自己的处境
→ My Reality / Reports

我想从另一个视角看
→ Perspectives

我希望持续记录变化
→ Membership / Account continuity

我需要专业协助
→ Professional
```

这里优先使用“人正在经历什么”，而不是产品 SKU。

---

# PIS-W10｜Seven-Volume Public Story

首页只展示七册的“一句话意义”：

```
形成
运行
维持
扩展
分化
观察
导航与延续
```

不能在首页显示：

```
Registry
Structured Knowledge Successor
Layer IDs
Runtime components
```

点击后再进入 Books。

---

# PIS-W11｜Commercial Gateway

首页必须第一次正式存在：

```
Books
Reports / Readings
Membership
Professional
Academy
```

但不做成商城式价目表。

正确逻辑：

```
What you need
↓
What depth fits
↓
What product helps
↓
Product detail
↓
Price / purchase
```

价格只在 product context 出现。

---

# PHASE PIS-4｜About Family

这里正是你提到的重点。

# PIS-W12｜`/about/` 重建

About 不能只是：

> PHI OS 是什么。

它应该回答：

```
为什么存在
它观察什么问题
它不是什么
七册如何形成
Books / Platform / Academy / Professional 如何构成完整生态
为什么 Reality Navigation 与一般 AI 不一样
```

结构建议：

```
Hero
Why PHI OS exists
The problem of fragmented answers
Seven-book intellectual arc
From knowledge to lived reality
Books / Platform / Academy / Professional
Responsible boundaries
Founder bridge
Thesis bridge
Start route
```

视觉：

```
HERO Reality Navigation
reality ecosystem
runtime / system architecture 的公共化版本
reading path
navigation infrastructure
```

---

# PIS-W13｜`/about/founder/` 重建

Founder 页面目前信息量明显不够。

正式页面应包括：

```
Teresa Lee
Founder & Principal Architect

为什么开始 PHI OS
现实经验来自哪里
为什么从理财 / 组织 / 系统问题走到 Reality Navigation
为什么研究传统读取系统
为什么不把任何一种方法当绝对真理
为什么人工智能反而让 Navigation 更重要
七册是怎样逐渐形成
她现在正在建立什么
```

不要出现：

```
internal phase
commit
runtime owner
registry architect
production pipeline
```

Founder 页应该是：

> **人 + 问题 + 长期研究路径 + 建立 PHI OS 的理由**

而不是技术履历。

视觉可以使用：

```
Founder portrait / mark
from-intelligence-to-reality-navigation
reality-navigation-thesis overview
reality ecosystem
professional / research scenes
```

---

# PIS-W14｜`/about/reality-navigation/` 重建

这是公共定义页。

必须回答：

```
Reality Navigation 是什么
为什么 AI 之后需要它
为什么不是预测
为什么不是人生指令
为什么 Observation 在 Navigation 之前
为什么行动以后还要回来观察结果
什么叫 Continuity
```

把内部：

```
Reading Runtime
RNE
LRM
Outcome Event
Reality Diff
```

翻译成人类语言：

```
看清现在
理解限制
比较方向
采取可逆行动
观察后来发生什么
根据结果重新判断
```

---

# PHASE PIS-5｜Thesis Successor

# PIS-W15｜`thesis.html` 全面升级

当前 Thesis 已经有七册 successor，但仍明显保留系统实施语言，例如：

```
Runtime Layer
implementation
architecture
```

这一轮公共 Thesis 要回到思想与研究命题。

结构：

```
01 为什么“更多智能”并不等于“更会导航”
02 人类技术能力如何不断扩大
03 新瓶颈为什么从答案移动到方向
04 Reality Navigation 提出的研究问题
05 Reality 为什么必须随时间更新
06 观察、行动与结果为什么必须连续
07 七册怎样构成完整思想路径
08 PHI OS 与 AI 的关系
09 PHI OS 不主张什么
10 继续阅读 / Books / Research
```

不要在公共 Thesis 页面讲：

```
API
resolver
canonical registry
database
pipeline
production cutover
```

这些进入 developer / governance 文档，不进入品牌论述。

---

# PIS-W16｜Thesis Visual Story

把目前尚未充分使用的 Thesis 视觉正式定位：

```
from-intelligence-to-reality-navigation
→ Thesis opening / Home supporting visual

phios-runtime-architecture
→ How PHI OS connects knowledge → observation → navigation
  但标题与周围 copy 必须公共化

reality-ecosystem
→ About ecosystem

reality-navigation-economy
→ Thesis / Research：智能丰富之后，导航能力的价值

reality-navigation-infrastructure
→ Thesis final proposition

reality-navigation-thesis-overview
→ Thesis overview / downloadable thesis context
```

英文与中文版 Thesis overview 按 locale 使用，不同时堆叠。

---

# PHASE PIS-6｜Explore Family

# PIS-W17｜`/explore/`

职责：

> “我还不知道 PHI OS 是什么，带我看看。”

顺序：

```
What is PHI OS
Why does it exist
How is it different
How it helps real situations
Seven books
Products / ways in
Where should I start
```

---

# PIS-W18｜`/explore/why-phios/`

必须吸收这几天已经完成的《为什么需要 PHI OS》出版逻辑，但做网页版本，不整篇复制书籍前言。

重点：

```
答案变多
系统变复杂
局部知识增加
整体定位变困难
AI 扩大智能
Navigation becomes the next problem
```

避免工程术语。

---

# PIS-W19｜`/explore/how-it-works/`

公共化成：

```
看清发生了什么
↓
区分事实与解释
↓
理解限制
↓
比较可以采取的方向
↓
行动
↓
回来看看现实发生了什么变化
```

而不是：

```
pipeline
runtime composition
authority resolution
```

---

# PIS-W20｜`/explore/start/`

改成真正的 decision page：

```
我只是想问一个问题
我想学习
我想理解自己
我想看关系
我想了解传统读取方法
我想获得一份报告
我想长期使用
我需要专业协助
```

每个选择直接去 canonical route。

---

# PHASE PIS-7｜Knowledge Family

# PIS-W21｜`/knowledge/`

首页职责：

```
Ask
Articles
Concepts
Figures
Books
Research
```

不要显示内部：

```
canonical knowledge
publication registry
node
article runtime
```

客户看到的是：

```
经过整理的知识
已发布文章
概念
图解
书籍
研究
```

---

# PIS-W22｜`/knowledge/ask/`

Ask 页面第一屏必须像真正的 Google + ChatGPT 入口。

不是解释系统内部怎么 route。

客户只需要：

```
写下问题
```

下面给：

```
事业
关系
金钱
自我
文明
某个方法
某篇文章
```

等示例。

回答以后再显示：

```
为什么这样回答
来自哪些知识
还可以去哪里
```

---

# PIS-W23｜Articles / Concepts / Figures

三个 index 必须有不同角色：

```
Articles
→ 深入解释一个问题

Concepts
→ 快速理解一个核心概念

Figures
→ 用视觉看见关系与结构
```

不能三个页面只是相同卡片换标题。

---

# PHASE PIS-8｜Books Family

# PIS-W24｜`/books/`

要成为真正的七册旗舰入口。

每一本：

```
封面
一句核心问题
这一册解决什么
适合什么读者
Explore / Preview / Buy
```

如果目前还不可购买：

```
Read / Preview
```

不要显示假购买按钮。

---

# PIS-W25–W31｜七册 Index

分别：

```
W25 Book I
W26 Book II
W27 Book III
W28 Book IV
W29 Book V
W30 Book VI
W31 Book VII
```

统一骨架：

```
Hero
Core question
Why this volume exists
What this book explores
Key ideas
Visual map
Where it sits in seven-volume arc
Related articles / figures
Next volume
Purchase / preview / reading
```

但不要七册只是模板换词。

每册真正拥有不同视觉语言：

```
I   Formation
II  Interaction
III Continuity
IV  Expansion
V   Civilization Atlas
VI  Observation
VII Navigation
```

---

# PHASE PIS-9｜Perspectives Family

# PIS-W32｜Perspectives Index

不要首先解释：

```
method runtime
projection governance
method authority
```

而要说：

> **同一个现实，可以从不同角度看。**

然后分别：

```
Personal
Relationship
Profile
I Ching
Tarot
Astrology
BaZi
Zi Wei
Human Design
Numerology
```

如果方法暂未开放，清楚写：

```
即将开放
```

而不是显示内部 production status。

---

# PIS-W33｜Method Icons Placement

目前未充分利用的：

```
Astrology
BaZi
Human Design
I Ching
Numerology
Tarot
Zi Wei
```

图标应该正式绑定：

```
Perspectives index
method-specific landing
method selector
```

不应该为了“用资产”放到 About / Thesis。

---

# PIS-W34｜Governance / Interpretation / Unknown Icons

这些 global icons：

```
Governance
Interpretation
Navigation Threshold
Projection
Unknown
```

建议分别进入：

```
About / responsible use
Observation page
How it works
Perspectives
Reality Navigation
```

但前台 label 必须是客户语言：

```
边界
解释
什么时候适合行动
方法视角
仍然未知
```

---

# PHASE PIS-10｜Reality / Paid Product Discovery

# PIS-W35｜Reality Entry Index

`/reality/` 不应该像系统控制台。

应该是：

> **把一个真实处境带进 PHI OS。**

入口：

```
开始一个新的现实
继续之前的现实
查看已有报告
回来看行动后的变化
```

---

# PIS-W36｜Reports Commerce Entry

在适当的 public route 增加：

```
Personal Reality Report
Relationship Report
Profile / Method-specific Report
Financial Reality / planning where active
```

所有报告显示：

```
这份报告回答什么
需要什么输入
会得到什么
不会做什么
是否需要专业参与
购买
```

---

# PIS-W37｜Membership

会员页需要完整解释：

> 为什么一次报告不等于持续导航。

展示：

```
保存过去
比较变化
持续读取
行动后回来复核
会员可获得什么
非会员仍可使用什么
```

使用：

```
PHIOS-ILLUSTRATION-MEMBERSHIP-EXPERIENCE-LANDSCAPE
PHIOS-ILLUSTRATION-REALITY-WORKSPACE-CONTINUITY
```

---

# PIS-W38｜Academy

Academy 不是：

```
training pipeline
learning runtime
assessment registry
```

客户看到：

```
学什么
为什么值得学
从入门到进阶怎样走
适合普通读者 / practitioner / professional 的不同路径
```

使用 Academy learning visual。

---

# PHASE PIS-11｜Professional Family

# PIS-W39｜Professional Index

首先回答：

```
什么情况需要真人专业参与
哪些问题 PHI OS 自己不会替你决定
有哪些专业服务
如何预约
```

不能第一屏显示内部 authority 层。

---

# PIS-W40｜Professional Child Pages

统一提升：

```
services
appointments
reports
financial
external readers
authority / boundary page
```

但 Authority 页公共标题建议改成：

> **什么时候应该交给专业人士**

而不是：

> Authority Architecture

---

# PHASE PIS-12｜Research Family

# PIS-W41｜Research Index

定位：

> PHI OS 不要求读者相信它；它应该允许自己的主张被比较、检验与修正。

内容：

```
Research questions
Human reading systems
Reality Navigation thesis
Validation direction
Published / available research
Limitations
```

---

# PIS-W42｜Traditional Reading Systems Research

把：

```
易经
占星
八字
紫微
人类图
塔罗
数字学
```

的研究定位统一成：

> **这些系统在试图观察什么？**

而不是：

```
哪个最准
哪一个是真理
```

---

# PHASE PIS-13｜Visual Asset Authority & Allocation

这是这一轮第二大重点。

# PIS-W43｜Visual Registry Reconciliation

Current pointer 必须继续读取现有：

```
current-client-visual-registry
```

不能创建第二套 visual authority。

新建的只是：

```
INDEX VISUAL ALLOCATION
```

即：

```
content/web/index-surfaces/
public-index-visual-allocation-v1.json
```

字段：

```
assetCode
canonicalAssetRef
semanticRole
primarySurface
secondarySurfaces
placement
localeRule
consumerState
sevenVolumeCompatibility
reason
```

---

# PIS-W44｜全资产 Coverage Rule

对当前 Visual Registry 中每个 asset 执行：

```
ACTIVE_CURRENT
→ 必须至少拥有一个合适 consumer

ACTIVE_SPECIALIZED
→ 至少绑定对应 method / product index

FUNCTIONAL_ONLY
→ 可只绑定 checkout / account / state page

HISTORICAL_SEMANTIC_STALE
→ 不得重新用于当前 Public Surface

UNVERIFIED
→ 不得声称 live

PLANNED
→ 不得假装已有文件
```

这比要求“152 个资产全部硬塞进网页”正确得多。

---

# PIS-W45｜旧五册 Visual Quarantine

当前至少存在一组旧五册语义资产，例如：

```
Five-Volume System
Five-Volume Architecture
Five-Volume Knowledge Map
Five-Volume Academy Path
Five Books icon
```

这一轮必须全部重新审计。

结果只能是：

```
REPLACE_WITH_7V_SUCCESSOR
SEMANTICALLY_NEUTRAL_REUSE_AFTER_REVIEW
HISTORICAL_ONLY
```

禁止：

```
CURRENT_7V_PAGE_USES_5V_LABEL
```

尤其要检查目前仍有 actual consumer 的旧五册 Academy visual。

---

# PIS-W46｜41 Remaining Assets 正式定位

你刚才附件里的 41 个未完全定位资源不能继续作为“剩余清单”。

这轮必须逐一进入页面分配。

建议分配：

```
Thesis branding / figures
→ thesis / about / research

Logo mark
→ brand utility / footer / special compact placements

Global interpretation icons
→ about / observation / how-it-works / perspectives

Method icons
→ perspectives

Status icons
→ availability / reports / methods / service state

Personal Reality scene
→ reality / report / membership

Professional workspace scene
→ professional

Academy scene
→ academy

Financial Reality scene
→ professional financial / relevant product

Membership landscape
→ membership

Reading Path landscape
→ books / knowledge / explore

Reality Workspace Continuity
→ membership / reality / navigation

Visual Knowledge Discovery
→ knowledge / figures / books
```

---

# PIS-W47｜R2 Path Integrity

所有 index 页面必须：

```
resolve asset through existing visual resolver / registry
```

优先禁止直接硬编码：

```
https://pub-....r2.dev/...
```

除非现有 architecture 明确允许。

Checker 验证：

```
asset exists
registry knows it
R2 path valid
consumer binding valid
fallback valid
alt text exists
dark/light logo correct
```

---

# PHASE PIS-14｜Visual Composition Quality

# PIS-W48｜No Poster-as-Page Rule

避免把一整张已有 poster 当网页内容。

优先：

```
HTML true text
+
SVG/data
+
WebP atmosphere / visual recognition
```

图片负责：

```
emotion
recognition
identity
visual rhythm
```

HTML 负责：

```
meaning
CTA
labels
details
accessibility
```

---

# PIS-W49｜Full-Bleed Hero Standard

一级入口页：

```
HOME
ABOUT
FOUNDER
THESIS
EXPLORE
BOOKS
BOOK V
BOOK VI
BOOK VII
PROFESSIONAL
ACADEMY
MEMBERSHIP
```

允许使用 full-bleed / edge-led visual。

不要全部塞入：

```
card
box
rounded container
```

否则又回到你之前不喜欢的“Hero 被框住”。

---

# PIS-W50｜Logo Context Rule

自动选择：

```
dark surface → light / gold-compatible logo
light surface → dark logo
favicon → canonical favicon
```

禁止再出现暗底错误使用不合适 logo。

---

# PHASE PIS-15｜Commercial Conversion Without Cheapening Brand

# PIS-W51｜Commercial Ladder

正式定义：

```
FREE
Ask / Explore / Articles / selected book content

LOW-COMMITMENT PAID
Book / digital reading

PERSONAL DEPTH
Report / reading

CONTINUITY
Membership / subscription

HUMAN DEPTH
Professional service

CAPABILITY
Academy
```

这只是页面 IA，不把价格写死。

---

# PIS-W52｜CTA Contract

禁止所有页面都只有：

```
Explore
Learn more
```

CTA 必须具体。

例如：

```
问一个问题
阅读第一册
查看文明图谱
看看个人报告
继续我的现实
查看会员方案
预约专业协助
开始学习
```

---

# PIS-W53｜Cross-Surface Conversion

任何旗舰内容最后必须有自然下一步。

例如：

```
Why PHI OS
→ Ask / About

Founder
→ Thesis / Books

Thesis
→ Seven Books

Books
→ Preview / Purchase

Book VI
→ Ask / Observation

Book VII
→ Reality

Perspectives
→ Run method / report

Report
→ Membership

Membership
→ Account / Reality

Professional
→ Appointment
```

---

# PHASE PIS-16｜Content Density & SEO

# PIS-W54｜Information Density

旗舰 landing page 不允许低于最小信息结构：

```
Hero
Problem
Meaning
How it helps
Related system
Trust / boundary
CTA
```

同时避免“百科级长墙”。

每节：

```
一个问题
一个主要观点
一个 visual
一个明确下一步
```

---

# PIS-W55｜Metadata

每个 canonical index：

```
unique title
unique meta description
canonical URL
OG title
OG description
OG image
structured data where appropriate
```

Books：

```
Book schema
```

Founder：

```
Person / Organization relationship
```

Products：

```
Product schema only when product truly exists
```

不得伪造 rating / review / price。

---

# PHASE PIS-17｜Bilingual Quality

# PIS-W56｜Semantic Parity

英语与中文不是逐字翻译。

要求：

```
same meaning
same promise
same boundary
same CTA destination
```

中文避免：

```
Reality State
Case
Constraint
Authority
Projection
Current Runtime
```

这种中英夹杂。

如果品牌术语必须保留英文：

第一次：

```
现实导航（Reality Navigation）
```

后面直接中文。

---

# PIS-W57｜Customer Chinese Review

专门 checker 搜索：

```
Runtime
Canonical
Authority
Projection
Registry
Successor
Cutover
Freeze
Binding
Resolver
```

Public copy 出现即进入 review。

不是所有出现都自动失败，因为 Book 理论中可能有正式术语；但：

```
navigation
button
marketing copy
helper copy
commercial copy
```

不得使用内部工程词。

---

# PHASE PIS-18｜Accessibility / Responsive

# PIS-W58｜Viewport

真实验收：

```
360
390
768
1440
```

Hero、视觉、商品卡、七册结构不得 desktop-only。

---

# PIS-W59｜Accessibility

全部 index：

```
keyboard
focus
skip link
semantic headings
alt
contrast
reduced motion
locale toggle
touch targets
```

装饰图：

```
alt=""
```

内容图：

```
真实说明
```

---

# PHASE PIS-19｜Checker Architecture

建议新增：

```
check:pis-r1:baseline
check:pis-r1:routes
check:pis-r1:public-language
check:pis-r1:content-depth
check:pis-r1:commercial
check:pis-r1:visual-allocation
check:pis-r1:r2
check:pis-r1:seven-volume
check:pis-r1:locale
check:pis-r1:a11y
check:pis-r1:complete
```

---

# PIS-W60｜Internal Language Checker

扫描所有 PUBLIC / DISCOVERY / PRODUCT index。

失败条件：

```
customer-visible internal phase name
registry status
checker status
runtime implementation language
successor status
commit / SHA
internal authority classes
```

---

# PIS-W61｜Visual Coverage Checker

验证：

```
每个 ACTIVE_CURRENT asset
至少一个合法 consumer

每个 index
不超过合理 visual density

所有 consumer
引用 canonical asset

旧五册 asset
不进入 current seven-volume surface

R2 unverified asset
不冒充 live
```

---

# PIS-W62｜Commercial Integrity Checker

检查：

```
不存在不存在的产品
不存在假价格
不存在假订阅权益
不存在未建 checkout
不存在 misleading CTA
```

即：

> 可购买才显示购买。

否则：

```
了解
预览
即将开放
```

---

# PHASE PIS-20｜Human Acceptance

不要再做一张只有 checkbox 的 HTML。

必须真实浏览。

# PIS-W63｜Desktop Human Review

逐页实际检查：

```
Home
Explore
Why PHI OS
How it Works
Start
About
Founder
Reality Navigation
Thesis
Knowledge
Ask
Books
7 Books
Perspectives
Reality
Membership
Academy
Professional
Research
```

---

# PIS-W64｜Customer Questions

每个页面让人可以回答：

```
我在哪里？
这一页告诉我什么？
为什么跟我有关？
下一步是什么？
```

如果不能，页面失败。

---

# PIS-W65｜Visual Human Review

每个 visual 评：

```
适合这个主题吗
重复吗
抢文字吗
太像装饰吗
是否提高理解
是否有时代错误
是否是旧五册
是否 logo 不匹配
```

---

# PHASE PIS-21｜Production Cutover

# PIS-W66｜Wave 1 — Brand & Discovery

先改：

```
/
explore/
explore/why-phios/
explore/how-it-works/
explore/start/
about/
about/founder/
about/reality-navigation/
thesis
```

这是最高优先。

---

# PIS-W67｜Wave 2 — Knowledge & Books

```
knowledge/
ask/
articles/
concepts/
figures/
books/
Book I–VII
```

---

# PIS-W68｜Wave 3 — Commercial & Continuity

```
reality/
membership
reports / purchasable products
academy/
professional/
appointments/
```

---

# PIS-W69｜Wave 4 — Perspectives & Research

```
perspectives/
method index pages
research/
human-reading-systems/
why-reality-navigation/
```

---

# PIS-W70｜Functional Index Pass

最后才处理：

```
account
checkout
payment
professional workflow
review pages
```

只提升：

```
clarity
visual quality
language
navigation
```

不塞营销内容。

---

# PHASE PIS-22｜Regression

# PIS-W71｜No Functional Regression

不得改坏：

```
Ask
Reality
Perspectives
method calculations
payments
account
professional workflows
locale
storage
APIs
```

这是 presentation successor。

---

# PIS-W72｜No Retired Page Resurrection

全仓检查：

```
deleted retired pages
legacy routes
old five-volume pages
```

不能为了“丰富 index”重新创建。

---

# PIS-W73｜npm run check

最终必须：

```
new PIS checks
existing route checks
visual checks
CX checks
npm run check
```

如果 `about.zip` 不含 `.git` 而某历史 checker 强依赖 Git：

```
报告环境限制
```

不能弱化 checker。

---

# PHASE PIS-23｜Production Browser Acceptance

# PIS-W74｜真实 Production E2E

至少：

```
Home
→ Ask
→ answer
→ appropriate deeper route

Home
→ Books
→ Book
→ preview / product

Home
→ Personal Report
→ product / service

Home
→ Membership
→ membership detail

About
→ Founder
→ Thesis
→ Books

Perspectives
→ method
→ customer experience

Professional
→ service
→ appointment
```

---

# PIS-W75｜Final Visual Consumption Audit

最终必须输出：

```
TOTAL visual assets
ACTIVE used
ACTIVE specialized used
HISTORICAL quarantined
UNVERIFIED not activated
PLANNED not fabricated
zero orphan current accepted assets
```

也就是说你要的“所有 visual asset 都可以在适合的 index 用上”，正式验收标准应该是：

> **所有仍属于当前架构的视觉资产都有语义正确的消费者；不适合七册体系的旧资产明确退役，而不是错误复活。**

---

# PIS-W76｜Production Freeze

输出：

```
content/web/index-surfaces/freeze/
pis-r1-production-freeze-v1.json
```

保存：

```
baseline commit
route map digest
public language canon digest
visual allocation digest
page inventory digest
commercial entry digest
checker digest
human acceptance
production URL
```

状态：

```
PUBLIC_INDEX_SURFACE_SUCCESSOR_FROZEN
```

---

## 这一轮完成后的客户结构

最终不再是很多互相独立的 `index.html`，而是一套非常明确的公开网站：

```
HOME
│
├── 我有问题
│   └── Ask PHI OS
│
├── 我想理解
│   ├── Explore
│   ├── Why PHI OS
│   ├── About
│   ├── Founder
│   └── Thesis
│
├── 我想学习
│   ├── Knowledge
│   ├── Articles
│   ├── Figures
│   ├── Seven Books
│   └── Academy
│
├── 我想理解自己的现实
│   ├── Reality
│   ├── Reports
│   └── Membership
│
├── 我想换一个视角
│   └── Perspectives
│
├── 我需要专业协助
│   └── Professional
│
└── 我想知道它是否可靠
    └── Research
```

这一次我会把重点定义得非常明确：

> **不是“把旧页面变漂亮”。**

而是同时完成：

> **内容增密、品牌统一、商业转化、七册更新、客户语言清理、视觉资产消化、跨页叙事和导航统一。**

而且从 `about.zip` 当前状态看，这个 successor 是有必要的：目前首页已经比旧版先进很多，但 About、Founder、Thesis、Books、Knowledge、Professional 等仍然处在不同建设年代，客户会明显感觉信息密度、语言、视觉使用程度和商业目的并不统一；现有 visual registry 也远远没有真正转化成“网站视觉系统”。

我建议接下来正式按这个顺序执行：

```
PIS-W0–W7
Foundation / page census / language / IA

↓

PIS-W8–W16
Home + About + Founder + Reality Navigation + Thesis

↓

PIS-W17–W23
Explore + Knowledge

↓

PIS-W24–W31
Seven Books

↓

PIS-W32–W42
Perspectives + Reality + Commerce + Professional + Research

↓

PIS-W43–W50
全部 Visual Asset reconciliation + R2 binding

↓

PIS-W51–W57
Commercial + SEO + bilingual

↓

PIS-W58–W65
Responsive + checker + human review

↓

PIS-W66–W70
4-wave production implementation

↓

PIS-W71–W76
Regression + live browser acceptance + freeze
```

这会比单独继续修改 `index.html` 更值得，因为下一轮开始以后，**首页、About、Founder、Thesis、Explore、Books、Knowledge、Research、Professional 与付费入口会第一次真正成为同一个 PHI OS 网站，而不是多个阶段分别建设出来的页面集合。**