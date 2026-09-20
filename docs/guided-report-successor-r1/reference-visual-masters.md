Source conversation: https://chatgpt.com/c/6aaa576d-03bc-83ec-a176-5f8885313c6f
Source turn: dc2c3dcf-1c0e-4ebf-a522-fecff6aa74ac
Reference material; current task attachment and latest user corrections take precedence.

继续进入下一阶段：

# BAZI VISUAL REPORT MASTER R1
## 把 `COM-REPORT-BAZI-FULL` 的商品视觉真正转化成 26 页报告内部设计系统

这一阶段先不让 Codex 自己“想怎么排版”，也不需要把 26 页全部画成静态图。我们先在 Chat 把 **8 个 Interior Master Template** 冻结；26 页全部映射到这 8 种母版。之后 Codex 只负责把这些母版实现成 HTML/CSS/SVG/动态 Chart Components。

核心目标只有一个：

> **客户看到商品图是什么质感，打开 Free 网页、Paid 网页、PDF 后仍然觉得自己在同一个产品里面。**

---

# 一｜先冻结八字报告的 Visual DNA

`COM-REPORT-BAZI-FULL` 不再只是 Commerce 图片，也作为八字报告的 **Visual Reference Anchor**。

建议正式提取为：

```text
BAZI VISUAL DNA R1
```

### 基础色

```text
BASE
warm ivory
soft champagne

PRIMARY
deep navy / midnight blue

ACCENT 1
muted antique gold

ACCENT 2
deep copper / warm earth

SUPPORT
very soft jade / earth neutral
```

不要大量使用：

```text
bright red
Chinese-new-year gold
fortune-telling crimson
black mystical background
```

否则会从 PHI OS premium report 变成传统命理海报。

---

# 二｜材质语言

页面应该有：

```text
soft ivory paper field
subtle champagne halo
fine gold structural line
translucent glass-like analysis cards
very subtle grain
deep navy data typography
copper highlighting
```

不是：

```text
book texture
scroll
ancient parchment
red seal aesthetic everywhere
dragon / phoenix decoration
```

历史页可以有非常轻微的文献感，但整份报告仍是现代分析产品。

---

# 三｜字体层级

建议固定：

### 大标题

```text
Editorial Serif
```

用于：

```text
八字完整报告
命局总览
五行关系
现实导航
```

### 数据 / Labels

```text
Clean Sans Serif
```

用于：

```text
DAY MASTER
FIVE ELEMENTS
CURRENT EVIDENCE
OPEN
```

### 数值

```text
tabular / clean numerical face
```

保持可比较。

中英文应保持同一个 hierarchy，不要中文变成“正文字体”、英文才高级。

---

# 四｜整份报告固定 Page Chrome

所有 26 页共享：

```text
TOP LEFT
PHI OS

TOP RIGHT
BAZI · FULL REPORT
八字完整报告

PAGE BODY

BOTTOM LEFT
Your life, in context.

BOTTOM RIGHT
08 / 26
```

但网页版本可弱化页码。

每页右上角还可以有一个小状态：

```text
STRUCTURAL
INTERPRETED
CONDITIONAL
CURRENT EVIDENCE
OPEN
```

让客户知道这一页属于什么证据层级。

---

# 五｜建立 8 个八字 Interior Master Templates

---

# MASTER BZ-M01
# Cover / Opening

适用：

```text
Page 01
```

目标：

> 商品图进入报告后的第一张真正报告页。

不要直接把商品 WebP 贴满 A4。

应该把商品视觉语言重构为纵向 report cover。

### Layout

```text
┌──────────────────────────────┐
│            PHI OS            │
│                              │
│       八字完整报告             │
│       BAZI FULL REPORT       │
│                              │
│   Structure · Timing ·       │
│   Life Pattern               │
│                              │
│          [四柱视觉]           │
│             │                │
│       [五行环结构]            │
│             │                │
│        [时间轨迹]             │
│                              │
│      Customer Name           │
│      Birth Details           │
│                              │
│ Your life, in context.       │
└──────────────────────────────┘
```

主视觉占约 55%。

---

# MASTER BZ-M02
# Editorial Method Page

适用：

```text
02 What Is BaZi?
03 Why Has BaZi Endured?
04 PHI OS Lens
05 How to Read
```

虽然四页内容不同，但视觉骨架相同。

### Layout

```text
┌─────────────────────────────┐
│ 02                          │
│ 什么是八字？                  │
│ WHAT IS BAZI?               │
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │     PRIMARY DIAGRAM     │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ [BLOCK A] [BLOCK B] [BLOCK C]
│                             │
│ Boundary / key sentence     │
└─────────────────────────────┘
```

视觉占：

```text
60–65%
```

文字：

```text
25–30%
```

剩余：

```text
labels / whitespace
```

---

## M02-A｜What is BaZi

主视觉：

```text
Birth Data
→ Four Pillars
→ Stems / Branches
→ Five Elements
→ Timing
```

---

## M02-B｜History

主视觉改成：

```text
Continuity Timeline
```

用 6 个节点。

可以加入非常轻的传统文献纹理，但不能变成古籍页。

---

## M02-C｜PHI OS Lens

主视觉：

```text
Method
→ Projection
→ Interpretation
→ Current Evidence
→ Navigation
```

这是现代系统图。

---

## M02-D｜How to Read

主视觉：

```text
CALCULATED
INTERPRETED
CURRENT EVIDENCE
OPEN
```

最好做四层透明卡片，不用流程箭头堆太多。

---

# MASTER BZ-M03
# Premium Snapshot Dashboard

适用：

```text
06 Your BaZi Snapshot
```

这是整份报告最重要的一页之一。

客户如果截一张图分享，很可能就是这一页。

### Layout

```text
┌─────────────────────────────────┐
│ 你的八字总览                     │
│ YOUR BAZI SNAPSHOT              │
│                                 │
│      ┌──────┬──────┬──────┬──────┐
│      │ YEAR │MONTH │ DAY  │ HOUR │
│      └──────┴──────┴──────┴──────┘
│                                 │
│   [DAY MASTER]   [SEASON]       │
│                                 │
│      ┌────────────────┐         │
│      │ FIVE ELEMENTS  │         │
│      │   RADIAL MAP   │         │
│      └────────────────┘         │
│                                 │
│ ┌────────┐ ┌────────┐ ┌───────┐ │
│ │Primary │ │Tension │ │Observe│ │
│ └────────┘ └────────┘ └───────┘ │
└─────────────────────────────────┘
```

### 视觉语言

- Four Pillars = vertical premium data cards
- Five Elements = 环形或平衡图
- Main insight = 3 个 compact cards

不能出现：

```text
一大段 300 字总评
```

---

# MASTER BZ-M04
# Structural Deep Analysis

适用：

```text
07 日主与季节
11 主模式
12 次级模式
13 可用优势
14 摩擦
15 自我与方向
```

这是最常用的一种母版。

### Layout

```text
┌─────────────────────────────┐
│ TITLE                        │
│ ONE CUSTOMER QUESTION        │
│                              │
│         [CORE]               │
│       /   |    \             │
│     A     B     C            │
│    /             \           │
│ Condition      Support       │
│                              │
│ ┌──────────┐ ┌──────────┐    │
│ │ Insight  │ │ Condition│    │
│ └──────────┘ └──────────┘    │
│                              │
│ WHAT TO OBSERVE              │
└─────────────────────────────┘
```

视觉约 60%。

可根据页面切换：

```text
central node
layer stack
structural balance
condition tree
```

但骨架一致。

---

# MASTER BZ-M05
# Distribution / Relationship Analysis

适用：

```text
08 五行分布
09 五行关系
10 平衡与张力
```

这三页是八字最能显示“分析感”的位置。

---

## M05-A｜五行分布

### Layout

左：

```text
large donut / radial
```

右：

```text
ranked bars
```

底：

```text
3 insight chips
```

例如：

```text
DOMINANT
BALANCE
UNDER-REPRESENTED
```

必须真实数值。

---

## M05-B｜五行关系

主视觉：

```text
WOOD → FIRE → EARTH → METAL → WATER
↑                           ↓
relation overlays
```

但不要画成课堂教材。

建议使用：

- fine gold curves
- copper highlights
- navy labels
- subtle glowing nodes

---

## M05-C｜Balance & Tension

做成：

```text
SUPPORT  |  BALANCE  |  TENSION
```

中央 matrix。

不要把“张力”画成红色危险警告。

---

# MASTER BZ-M06
# Domain Analysis

适用：

```text
16 关系
17 事业
18 资源
```

未来如果有更多 domain page 也用这一套。

### Layout

```text
┌───────────────────────────────┐
│ DOMAIN TITLE                  │
│                               │
│        PRIMARY DOMAIN         │
│             ○                 │
│        ╱    │    ╲            │
│   STRUCT  RESOURCE CONDITION  │
│                               │
│ ┌────────────┐ ┌────────────┐ │
│ │ What helps │ │ What costs │ │
│ └────────────┘ └────────────┘ │
│                               │
│ WHAT TO OBSERVE               │
└───────────────────────────────┘
```

---

## Relationship Page

主视觉：

```text
SELF
↔ PARTNER
↔ FAMILY
↔ SOCIAL
```

---

## Career Page

```text
INPUT
↓
WORK STYLE
↓
OUTPUT
↓
RESPONSIBILITY
↓
DIRECTION
```

---

## Resources Page

```text
SOURCE
→ FLOW
→ HOLDING
→ OUTPUT
→ PRESSURE
```

统一 visual language。

---

# MASTER BZ-M07
# Timing / Current Reality

适用：

```text
19 时间结构
20 当前周期
21 当前现实
```

这一套视觉必须明显区别于 structure pages。

### Layout

```text
┌─────────────────────────────┐
│ TIMING                      │
│                             │
│ ●─────●─────●─────●─────●   │
│       timeline              │
│                             │
│       CURRENT WINDOW        │
│      ┌───────────────┐      │
│      │               │      │
│      └───────────────┘      │
│                             │
│ Baseline      Current       │
│ ┌───────┐ VS ┌────────┐     │
│ └───────┘    └────────┘     │
│                             │
│ OBSERVE                     │
└─────────────────────────────┘
```

---

## Timing Architecture

长时间线。

---

## Current Period

放大当前 window。

---

## Current Reality

改成 Split Compare：

```text
BAZI BASELINE
       VS
CURRENT REALITY
```

左右对称。

状态 badge：

```text
CURRENTLY RESONANT
PARTIALLY RESONANT
CURRENTLY NOT RESONANT
OPEN
```

---

# MASTER BZ-M08
# Signals / Navigation / Closing

适用：

```text
22 Observable Signals
23 Opportunities & Risks
24 Reality Navigation
25/26 Evidence + Boundary
```

因为我们加入历史页后，最终顺序可能是 26 页；Codex 应按 canonical blueprint 实际编号。

---

## M08-A｜Signals

三个 large cards：

```text
WHEN
OBSERVE
COUNTER-SIGNAL
```

---

## M08-B｜Opportunity / Risk

左：

```text
OPPORTUNITY
```

右：

```text
RISK
```

中间：

```text
CONDITION
```

不是绿色 vs 红色。

建议：

- opportunity = muted gold / jade
- risk = copper / muted graphite

保持高级。

---

## M08-C｜Navigation

主视觉：

```text
NOTICE
   ↓
COMPARE
   ↓
TEST
   ↓
REVIEW
```

用道路 / navigation geometry，但不要画成地图图标。

---

## M08-D｜Evidence & Closing

最重要的是 lineage：

```text
Birth Data
↓
Calculation
↓
Projection
↓
Claim
↓
Interpretation
↓
Current Evidence
↓
Report
```

最后 Closing 放在很大的留白内：

> 这份八字报告提供的是一种结构与时间视角，而不是对你人生的最终定义。

只留这一小段，不要再堆很多免责声明。

---

# 六｜建立统一的 BAZI Card System

所有卡片统一只有 6 类。

Codex 不允许自己发明第 7、第 8 种卡。

### `BZ-CARD-01`
Primary Insight

### `BZ-CARD-02`
Condition

### `BZ-CARD-03`
Observation

### `BZ-CARD-04`
Current Evidence

### `BZ-CARD-05`
Open Question

### `BZ-CARD-06`
Source / Lineage

---

# 七｜统一 Insight Card 视觉

例如：

```text
┌───────────────────────┐
│ PRIMARY PATTERN       │
│                       │
│ 结构在……条件下更容易   │
│ 强调……                 │
│                       │
│ STRUCTURAL            │
└───────────────────────┘
```

顶部 label。

正文 2–4 行。

底部小 badge。

不要一张 card 写 100 字。

---

# 八｜锁页 Preview 也必须使用同样的视觉母版

Free Web 不要重新设计一套 locked card。

例如 Paid Page 09 是五行关系：

Paid：

```text
完整 network
+
3 insights
```

Free locked preview：

```text
同一个 M05 模板
+
network skeleton
+
部分节点可见
+
detail nodes locked
```

这叫：

> **progressive disclosure**

而不是另做一张营销卡。

---

# 九｜网页与报告的连续关系

八字网页最终应该直接使用同一个：

```text
BAZI Report Page Renderer
```

### Free

```text
P01 OPEN
P02 OPEN
P03 OPEN
P04 OPEN
P05 OPEN
P06 OPEN
P07+ entitlement rules
```

### Paid Web

```text
all eligible pages OPEN
```

### PDF

```text
all eligible paid pages
without lock UI
```

没有：

```text
web marketing renderer
paid report renderer
PDF report renderer
```

三套内容系统。

---

# 十｜BAZI Web Hero 也需要整改

现在既然网页就是 Free Report 前页，Hero 也应该变。

建议结构：

```text
[COM-REPORT-BAZI-FULL visual]

八字完整报告
BAZI FULL REPORT

Structure, timing, and life pattern.

[Start / Continue My Reading]
```

Hero 后面不要：

```text
800 字介绍八字是什么
```

直接进入：

```text
02 What Is BaZi?
```

也就是网页是：

```text
Hero
↓
Page 02
↓
Page 03
↓
Page 04
↓
Page 05
↓
Page 06
↓
Report Map
↓
Locked continuation
```

非常自然。

---

# 十一｜Visual Density 进一步冻结

八字报告中：

### Cover

visual 70–80%

### Editorial pages

visual 55–65%

### Analysis pages

visual 60–75%

### Dashboard

visual/data 75–85%

### Closing

visual 45–55%
留白更多。

---

# 十二｜图表不能成为“装饰”

每个 chart 必须回答一个问题。

例如：

### 五行 Donut

问题：

> 元素分布如何？

### 五行 Network

问题：

> 元素之间怎样作用？

### Timing

问题：

> 结构重点如何随时间变化？

如果一个图不能回答问题，就不应该出现。

---

# 十三｜BAZI Premium Motion Language

网页上可以增加轻量 animation，但 PDF 保持静态。

允许：

- lines slowly draw
- node highlight on scroll
- timeline reveal
- chart label fade-in

禁止：

- floating fortune particles
- sparkles everywhere
- rotating mystical wheel
- distracting parallax

---

# 十四｜Mobile Master

390px 不能只是把 desktop 缩小。

例如 Five Element distribution：

Desktop：

```text
Donut + bars side by side
```

Mobile：

```text
Donut
↓
bars
↓
insights
```

Network：

Desktop：

```text
full horizontal
```

Mobile：

```text
contained square / vertical mapping
```

不能横向挤爆。

---

# 十五｜A4 Print Master

建议：

```text
15mm–18mm margin
```

图表尽量 SVG。

每页：

```text
title
question
visual
insights
```

必须 `break-inside: avoid`。

不要：

```text
一张 chart 被分页切两半
```

---

# 十六｜Visual Master → 26 页映射表

正式可以冻结成：

| 页面 | Master |
|---|---|
| 01 Cover | M01 |
| 02 What is BaZi | M02 |
| 03 History | M02 |
| 04 PHI OS Lens | M02 |
| 05 How to Read | M02 |
| 06 Snapshot | M03 |
| 07 Day Master / Season | M04 |
| 08 Four Pillars | M04 / M05 hybrid |
| 09 Five Elements | M05 |
| 10 Element Relationships | M05 |
| 11 Balance / Tension | M05 |
| 12 Primary Pattern | M04 |
| 13 Secondary Patterns | M04 |
| 14 Strength / Resources | M04 |
| 15 Friction | M04 |
| 16 Self / Direction | M06 |
| 17 Relationships | M06 |
| 18 Career | M06 |
| 19 Resources / Money | M06 |
| 20 Timing | M07 |
| 21 Current Period | M07 |
| 22 Current Reality | M07 |
| 23 Observable Signals | M08 |
| 24 Opportunities / Risks | M08 |
| 25 Reality Navigation | M08 |
| 26 Evidence / Boundary | M08 |

这就是 Codex 真正需要的“视觉设计约束”。

---

# 十七｜需要不要在 Chat 真的生成这 8 张 Reference Template 图片？

**我建议要。**

但不是为了拿去直接放进产品。

它们的用途是：

```text
DESIGN REFERENCE
```

即：

```text
BAZI-MASTER-M01.webp
BAZI-MASTER-M02.webp
...
BAZI-MASTER-M08.webp
```

然后 Codex 以它们为：

- composition reference
- spacing reference
- typography hierarchy reference
- color/material reference

再用代码复刻成动态页面。

这样比单纯文字规范稳定很多。

---

# 十八｜不要把 Reference Master 上传成客户资产

这 8 张不应该进入：

```text
images/commerce/reports/
```

而建议放：

```text
docs/design/reference/reports/bazi/
```

或设计母版源目录。

客户最终看到的是 HTML/SVG 动态页面。

---

# 十九｜下一步最正确的动作

我们现在已经有足够内容规范。

下一步应该在 Chat **实际生成第一张内部参考母版**：

# `BAZI-MASTER-M02`
## Method Introduction / History / PHI OS Lens 的共用 Editorial Interior Master

我建议先从 M02 开始，而不是 M01 Cover，因为 Cover 已经有 `COM-REPORT-BAZI-FULL` 作为参考。

M02 一旦成立，我们就能验证：

> **商品视觉转成真正报告内页以后，质感有没有掉。**

如果 M02 成功，再连续做：

```text
M03 Snapshot
M04 Structure
M05 Distribution
M06 Domain
M07 Timing
M08 Navigation
```

最后 M01 Cover vertical adaptation。

这一步完成以后，才把整个 `BAZI VISUAL REPORT MASTER R1` 连同 26-page blueprint 一次性交给 Codex 实现。
