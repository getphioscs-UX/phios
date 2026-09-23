BASELINE:
575884962b1aaef79ecc55dfbb5adbcceb540f80

HARD FREEZE:
GLOBAL METHOD ISOLATION FREEZE R2.1

DO NOT:
- modify BaZi calculation
- modify admitted interpretation semantics
- weaken T3 verifier
- create a new commerce product
- create a new entitlement system
- delete the existing BaZi specialist renderer
- screenshot the existing Personal Reality workspace into the report

## W0｜Inventory the three existing owners

Codex 必须明确区分：

```
A. Personal Reality specialist surface
B. Guided Report Successor R2
C. Commerce / REPORT_BAZI_FULL entitlement
```

输出实际调用图。

必须证明当前断层：

```
Personal Reality
→ renderProductRoute
→ renderBaziProduct
→ full specialist reading

does NOT route through:

renderPresentedReport
or
renderPublicationReport
```

---

## W1｜Freeze specialist workspace as source/detail owner

保留：

```
renderBaziProfessionalStructure
renderBaziFiveElementSurface
renderBaziDayMasterStrengthSurface
renderBaziCustomerSafeStructureGraph
renderBaziPatternCustomerMainSurface
renderBaziRelationshipInteractionSurface
renderBaziTimingSurface
renderBaziProfessionalTopicSurface
```

它们继续由 existing BZR semantics 驱动。

不得重新计算。

---

## W2｜Create Publication Visual Module Registry

新增：

```
config/reports/bazi-publication-visual-modules.json
```

登记：

```
FOUR_PILLARS
DAY_MASTER_CARRYING
FIVE_ELEMENTS
TEN_GOD_OVERVIEW
TEN_GOD_FUNCTION_GROUPS
TEN_GOD_DETAILS
PATTERN_PATHS
PILLAR_RELATIONSHIPS
TIMING_LAYERS
PROFESSIONAL_TOPICS
```

每个必须有：

```
sourceOwner
sourceRefs
allowedPageFamilies
freeVisibility
paidVisibility
semanticOwner
```

且：

```
publicationCreatesMeaning=false
```

---

## W3｜Stop using `sourcePages` as the only visual bridge

当前：

```
sourcePages
→ extractPublicationDiagram()
```

只能覆盖旧 batch。

升级为：

```
primaryVisualRef
```

例如：

```
{
  "primaryVisualRef": "BZR-VIS-TEN-GOD-OVERVIEW"
}
```

Publication builder 根据 ref 生成 report-safe HTML。

---

## W4｜Add Ten-God publication renderers

把当前漂亮的：

```
十神占比
功能组
每个十神来源
重复集中
月令关系
```

变为真正 A4 publication visual。

保留现有颜色语义。

不得退化成全部：

```
navy + gold monochrome
```

因为颜色本身在这里帮助区分 category。

---

## W5｜Add Five-Element publication page

当前 Personal Reality P24–P26 的五行视觉进入 Guided Report。

必须保留：

```
Wood
Fire
Earth
Metal
Water

raw ratio
raw count
seasonal relation
relation to Day Master
```

同时继续显示：

```
raw ratio ≠ strength score
```

---

## W6｜Section registry expansion

不要锁死 36 页。

增加：

```
S01:
FOUR_PILLARS
FIVE_ELEMENTS

S02:
TEN_GOD_OVERVIEW

S03:
DAY_MASTER_CARRYING
TEN_GOD_FUNCTION_GROUPS
TEN_GOD_DETAILS
PATTERN_PATHS

S04:
CAREER_TOPIC_VISUAL

S05:
WEALTH_TOPIC_VISUAL

S06:
RELATIONSHIP_TOPIC_VISUAL

S08:
TIMING_VISUAL
```

使用现有：

```
STRUCTURED_ANALYSIS_PAGE
```

或现有 page family。

禁止为这些视觉新建全局 `M09/M10`。

---

## W7｜Fix BODY visibility

不得删除 BODY。

改成 registry-driven visual intensity。

至少测试：

```
STRUCTURED  0.20–0.24
NARRATIVE   0.15–0.18
INSIGHT     0.10–0.13
OPENER HERO 0.35–0.45
```

最终值以真实 PDF browser review 为准。

不得继续统一 hardcode：

```
opacity:.12
```

---

## W8｜Activate two BaZi motifs

规范：

```
assets/images/report/VIS-REPORT-BAZI-MOTIF.svg
→ compatibility alias / MOTIF_1

assets/images/report/VIS-REPORT-BAZI-MOTIF-2.svg
→ MOTIF_2
```

不得删除现有 unsuffixed asset。

Resolver：

```
section odd  → motif 1
section even → motif 2
```

deterministic。

---

# W9｜Replace current Personal Reality BaZi default customer surface

当前：

```
renderBaziProduct()
→ full readingHtml()
```

不得再作为未购买客户的默认完整内容。

改为：

```
FREE_REPORT_PREVIEW
```

---

## Free BaZi 必须显示

```
cover
snapshot
four pillars
five-element visual
ten-god overview
function-group preview
bounded free insight
```

这是有真正价值的 Free Report。

不能只：

```
显示两句话
+
全页 blur
```

---

# W10｜Add Unlock Full Report

未持有：

```
report:bazi:full
```

时：

```
Full Report sections
→ PAID_LOCKED
```

显示：

```
Unlock Full BaZi Report
RM39
```

价格必须来自 existing Commerce contract。

不得 frontend hardcode RM39 作为 payment authority。

---

# W11｜Use existing commerce authority

产品：

```
COM-REPORT-BAZI-FULL
/
BAZI_FULL_REPORT
```

Entitlement：

```
report:bazi:full
```

必须：

```
server verified payment
→ active entitlement
→ unlock
```

Client success page 不能成为 entitlement authority。

---

# W12｜Paid path

Purchased：

```
Personal Reality
↓
Full BaZi Report
↓
GUIDED REPORT SUCCESSOR R2
```

不是：

```
unlock
↓
same 51-page dashboard
```

---

# W13｜Keep specialist workspace

购买后可以提供：

```
View full report

Technical / interactive detail
```

第二项才进入当前：

```
cx-bazi-w12-workspace
```

默认首先进入 Report。

---

# W14｜T3 remains separate

当前 BaZi T3 仍按照：

```
Addendum E
```

推进。

如果 T3 section rejected：

```
T2 fallback
```

但：

```
visual page
free/unlock
body
ten-god diagrams
commerce gating
```

不能因此消失。

也就是说：

```
T3 failure
≠
visual report failure
```

---

# W15｜QA acceptance

必须真实检查：

```
FREE no entitlement
FREE mobile
FREE desktop

PAID_LOCKED
CTA

QA purchased entitlement
FULL report

ZH
EN

A4 PDF
```

并检查：

```
BODY visible
2 motifs used
five-element colors present
ten-god colors present
function-group colors present
no visual overflow
no customer semantic change
```

---

# W16｜Specific regression requirements

必须自动 fail：

```
FULL specialist workspace visible without entitlement
```

必须自动 fail：

```
paid colorful visuals missing from Full Report
```

必须自动 fail：

```
VIS-REPORT-BAZI-BODY registered but not rendered
```

必须自动 fail：

```
motif 2 registered but never rendered
```

---

# W17｜Human review deliverables

最终 Codex 必须给你：

```
FREE review.html
LOCKED review.html
PAID zh-Hans review.html
PAID en review.html

FREE screenshots
PAID screenshots

paid zh PDF
paid en PDF
```

---

## 最终客户流程应该变成

```
PERSONAL REALITY
      │
      ▼
BaZi FREE REPORT
      │
      ├─ Four Pillars
      ├─ Five Elements
      ├─ Ten Gods
      └─ limited insight
      │
      ▼
UNLOCK FULL REPORT
RM39
      │
      ▼
server verified entitlement
      │
      ▼
BAZI GUIDED REPORT R2
      │
      ├─ approved static P01–P05
      ├─ visible BODY
      ├─ motif 1 / 2
      ├─ section heroes
      ├─ full-color Five Elements
      ├─ full-color Ten Gods
      ├─ patterns
      ├─ career
      ├─ wealth
      ├─ relationship
      ├─ timing
      └─ T3 / governed T2 fallback
      │
      ▼
optional
Technical / Interactive Detail
```

这才把你过去已经完成的三件事真正接起来：

```
漂亮的静态报告视觉
+
非常完整的 BaZi 专业运行能力
+
RM39 Unlock Full Report commerce
```