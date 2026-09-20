# BATCH 0｜Visual Reference Freeze

## 只登记，不做页面

把以下附件一起给 Codex：

```
BAZI P01–P05 final static references

M03 Snapshot
M04 Structure
M05 Distribution
M06 Domain
M07 Timing
M08 Navigation
```

然后下：

> 基于我提供的 BaZi P01–P05 最终静态页，以及 M03–M08 动态视觉参考，先做 `BAZI-DYNAMIC-VISUAL-REFERENCE-FREEZE-R1`。
> 
> 本批不得生成完整报告页，不得自行重新设计。
> 
> P01–P05 是 production visual quality anchor；M03–M08 是 dynamic composition reference only。
> 
> 请从这些 reference 中提取并冻结：
> 
> `typography hierarchy / spacing / page chrome / border / panel / line / icon family / visual density / background material / illustration treatment / chart styling / bilingual hierarchy / single-language hierarchy / mobile stacking / print behavior`
> 
> 建立唯一 reusable report visual token set，不建立平行 design system。
> 
> 禁止从 reference 图片复制任何姓名、出生资料、比例、年份、干支、结论、时间曲线或示例 interpretation。
> 
> 输出：
> 
> 1. visual token registry
> 2. M03–M08 component ownership
> 3. page-to-master mapping
> 4. prohibited drift list
> 5. machine checker
> 
> 本批完成后停止，不继续制作动态报告页面。

### 你验收这一批主要看

Codex 有没有真的登记：

```
same header
same footer
same serif/sans hierarchy
same gold/navy/ivory language
same border style
same card style
same icon treatment
same background material
same whitespace rhythm
```

而不是只写一句：

> “use premium styling”。

---

# BATCH 1｜BaZi P06–P10

## Snapshot + first structural pages

下：

> 继续 `BAZI-DYNAMIC-R1-BATCH-01`。
> 
> 严格基于已经冻结的 visual tokens、BaZi P01–P05 visual DNA、M03/M04/M05 references。
> 
> 只实现：
> 
> ```
> P06 Your BaZi Snapshot
> P07 Day Master & Seasonal Context
> P08 Four Pillars Structure
> P09 Five Elements Distribution
> P10 Five Element Relationships
> ```
> 
> Mapping:
> 
> ```
> P06 → M03
> P07 → M04
> P08 → M04
> P09 → M05
> P10 → M05
> ```
> 
> 不得新增新的 card family、chart language、icon style 或 page chrome。
> 
> 必须使用真实 runtime data。
> 
> 不得把 M03–M05 reference 中的 sample values 当 production defaults。
> 
> 输出并截图：
> 
> ```
> 1440px zh-Hans
> 1440px en
> 1440px bilingual
> 390px zh-Hans
> 390px en
> 390px bilingual
> A4 PDF
> ```
> 
> 与对应 reference 做 side-by-side visual review。
> 
> 本批结束后停止，不继续 P11+。

---

# BATCH 2｜BaZi P11–P15

## Balance + patterns + strength/friction

下：

> 继续 `BAZI-DYNAMIC-R1-BATCH-02`。
> 
> 前提：不得修改 Batch 01 已冻结的 shared visual tokens，除非发现可证明的全局 defect。
> 
> 只实现：
> 
> ```
> P11 Structural Balance & Tension
> P12 Primary Structural Pattern
> P13 Secondary Patterns & Conditions
> P14 Available Strengths & Resources
> P15 Structural Pressure & Friction
> ```
> 
> Mapping:
> 
> ```
> P11 → M05
> P12 → M04
> P13 → M04
> P14 → M04
> P15 → M04
> ```
> 
> 每页必须保持：
> 
> ```
> 1 customer question
> 1 primary visual
> max 3 core insights
> visual/data dominant
> prose secondary
> ```
> 
> 不允许变成连续文章页。
> 
> 不得为了页面不同而发明新的装饰语言。
> 
> 完成后执行 desktop/mobile/PDF visual diff，并停止。

---

# BATCH 3｜BaZi P16–P19

## Domain pages

下：

> 继续 `BAZI-DYNAMIC-R1-BATCH-03`。
> 
> 只实现：
> 
> ```
> P16 Self & Direction
> P17 Relationships
> P18 Career & Work
> P19 Resources & Money
> ```
> 
> 全部使用 M06 Domain master。
> 
> 每页只允许改变：
> 
> ```
> domain data
> domain-specific diagram
> labels
> approved insights
> ```
> 
> 不允许改变：
> 
> ```
> page chrome
> typography hierarchy
> panel anatomy
> border system
> background treatment
> icon family
> footer
> spacing rhythm
> ```
> 
> Relationship / Career / Resources 必须看起来属于同一本报告，而不是三套独立 UI。
> 
> 完成后停止。

---

# BATCH 4｜BaZi P20–P22

## Timing + Current Reality

下：

> 继续 `BAZI-DYNAMIC-R1-BATCH-04`。
> 
> 只实现：
> 
> ```
> P20 Timing Architecture
> P21 Current / Selected Period
> P22 Current Reality Comparison
> ```
> 
> 使用 M07。
> 
> 必须严格区分：
> 
> ```
> natal baseline
> admitted timing layer
> selected/current period
> current Reality evidence
> ```
> 
> 禁止生成没有 governed numeric basis 的“能量曲线”。
> 
> 如果没有真实连续数值，使用：
> 
> ```
> phase timeline
> period bands
> emphasis markers
> ```
> 
> 不允许伪造 smooth line chart。
> 
> Current Reality page 必须显示：
> 
> ```
> METHOD PROJECTION
> CURRENT EVIDENCE
> COUNTER-EVIDENCE
> STATUS
> WHY
> ```
> 
> 不显示百分比准确率。
> 
> 完成后停止。

---

# BATCH 5｜BaZi P23–P26

## Signals + Navigation + Evidence

下：

> 继续 `BAZI-DYNAMIC-R1-BATCH-05`。
> 
> 只实现：
> 
> ```
> P23 Observable Signals
> P24 Opportunities & Risks
> P25 Reality Navigation
> P26 Evidence, Boundary & Closing
> ```
> 
> 使用 M08。
> 
> 必须保持：
> 
> ```
> Observable Signals
> → WHEN / OBSERVE / COUNTER-SIGNAL
> 
> Opportunity / Risk
> → OPPORTUNITY / CONDITION / RISK
> 
> Navigation
> → NOTICE / COMPARE / TEST / REVIEW
> 
> Evidence
> → lineage visualization
> ```
> 
> 不得把这些页重新做成普通 checklist。
> 
> 完成后停止。

---

# BATCH 6｜BaZi Whole-Book Visual Freeze

## 这是最重要的一批

下：

> 执行 `BAZI-FULL-REPORT-VISUAL-FREEZE-R1`。
> 
> 当前不得新增页面。
> 
> 对完整 P01–P26 执行整本视觉一致性审核。
> 
> 检查：
> 
> ```
> P01–P05 static → P06 dynamic transition
> typography continuity
> color continuity
> panel continuity
> icon continuity
> visual density
> whitespace
> page numbering
> footer
> mobile
> A4
> zh-Hans
> en
> bilingual
> ```
> 
> 特别检查 P05 → P06：
> 
> 客户不得感觉从 premium editorial report 突然进入 generic dashboard。
> 
> 任何动态页如果明显低于 P01–P05 的视觉质量，标记：
> 
> ```
> VISUAL_PROMISE_MISMATCH
> ```
> 
> 不得自动判定 ACCEPTED。
> 
> 输出所有 review screenshots。
> 
> 本批完成后停止，等待人工确认。

这一批通过以后，才真正值得把：

```
BAZI REPORT DESIGN SYSTEM R1
```

冻结为 successor 基线。

---

# 然后才做其他方法

不要同时跑 Astrology / Zi Wei / Numerology。

推荐顺序：

```
ASTROLOGY
↓
ZI WEI
↓
NUMEROLOGY
↓
PROFILE
↓
ECR
↓
HUMAN DESIGN
↓
CROSS
```

---

# 每个后续方法也分 3 批就够

因为 BaZi 已经把共享系统证明了，所以后续不需要每个都 5 批。

## METHOD BATCH A

### Method Skin + first 5 dynamic pages

例如 Astrology：

> 基于已经冻结的 `PHI OS REPORT DESIGN SYSTEM R1` 和 Astrology P01–P05 static final references，先做 Astrology skin reconciliation。
> 
> 共享 layout grammar 不得改变，只允许 method-specific：
> 
> ```
> accent
> symbolic geometry
> chart family
> method iconography
> background motif
> ```
> 
> 然后只实现 P06–P10。
> 
> 完成后停止。

## METHOD BATCH B

### Middle pages

> 继续当前方法中段页面。
> 
> 不得新增 visual primitives。
> 
> 所有页面必须从已冻结的 M03–M08 families 派生。
> 
> 完成后停止。

## METHOD BATCH C

### Final pages + whole-book freeze

> 完成剩余页面并执行整本视觉一致性审核。
> 
> 比较：
> 
> ```
> P01–P05 static
> vs
> P06+ dynamic
> ```
> 
> 若动态页无法达到同等 premium quality，不能 production-accept。

---

# 另外建议加一个 Design Drift Guard

这一段可以放进你的最终 Master Work，Codex 每一批都必须遵守：

```
DESIGN DRIFT GUARD

Once PHI OS Report Design System R1 is frozen:

1. No new card family without explicit approval.
2. No new border system.
3. No new shadow system.
4. No new icon family.
5. No new page chrome.
6. No new typography hierarchy.
7. No arbitrary new accent colors.
8. No generic dashboard components if an approved report component exists.
9. No page may exceed the approved text-density range.
10. No page may reduce the primary visual below the approved threshold.
11. No method-specific page may break shared footer/header rules.
12. No sample reference data may enter production.
13. No fake charts may be generated for visual fullness.
14. Every batch must provide side-by-side screenshots against its master reference.
15. Every batch must stop for review before the next batch begins.
```

---

# 最好再做一个 machine checker

让 Codex 建：

```
check-report-design-drift.mjs
```

至少检查：

```
approved template ID only
approved card types only
approved CSS token use
no inline random colors
no unregistered icon set
no unknown border radius
no unknown font size class
primary visual exists
max insight count
page status present
page number present
report identity present
```

这不能代替人工视觉审核，但可以拦住最常见的漂移。

---

# 你交给 Codex 时到底要附什么

我建议第一次正式执行时附：

```
1. 当前 Final Master Work

2. BAZI P01–P05
   五张 static final reference

3. M03 Snapshot
4. M04 Structure
5. M05 Distribution
6. M06 Domain
7. M07 Timing
8. M08 Navigation
```

也就是 **11 张 reference**。

P01–P05 是“这本书应该长什么样”。

M03–M08 是“后续动态页应该怎样构图”。

以后 Astrology 开始时，再附：

```
Astrology P01–P05
+
已经冻结的 M03–M08
```

不需要重新设计 Astrology 专属 M03–M08 reference，除非实际跑出来发现某一类视觉无法承载 Astrology 的结构。

---

最后一个非常重要的点：**不要让 Codex把你生成的 M03–M08 图当成 pixel-perfect target。** 它们应该是 composition / hierarchy / density reference，而不是要求 CSS 复制图片中的每一个山水位置。真正需要严格冻结的是：

> 页面骨架、视觉层级、材质语言、组件语言、信息密度和 premium finish。

这样既可以保持一致，又不会把动态报告做成“截图复刻工程”。