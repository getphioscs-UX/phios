# KH-W3.5F｜Future Part Scaling Freeze

## 1. Contract

```text
Contract: PHI-OS-PKR-Future-Part-Scaling-v1.2.0
Scope: All current and future PHI OS volumes and knowledge sources
Status: Frozen
```

本文件冻结未来每一部内容进入 PKR 时的规模控制方式。目标不是人为限制理论，而是阻止 Registry 随页数线性膨胀，并确保每个正式节点都具有长期维护价值。

---

## 2. Scaling principle

节点数量必须随独立机制数量变化，而不是随页数变化。

```text
Page Growth
≠
Node Growth
```

一本书增加案例、叙事、证明、历史背景、过渡段与解释深度时，页数可以显著增长，但 Canonical Node 数量可能保持不变。

---

## 3. Planning ranges

以下范围是规划与审计基准，不是机械配额：

| Source size | Expected Domains | Expected Themes | Expected Canonical Nodes | Expected Supporting Questions |
|---|---:|---:|---:|---:|
| Up to 30 pages | 1–2 | 2–4 | 4–8 | 8–20 |
| 31–60 pages | 1–3 | 3–6 | 6–12 | 15–35 |
| 61–100 pages | 2–4 | 4–8 | 10–18 | 25–55 |
| 101–180 pages | 3–6 | 6–12 | 16–28 | 40–90 |
| More than 180 pages | Must be divided by Domain | Must be audited | No linear extrapolation | No linear extrapolation |

超出范围不自动代表错误，但必须触发 Granularity Audit。

---

## 4. Part-level limits

每一部内容默认采用以下控制：

```text
Soft Review Threshold: 18 Canonical Nodes
Mandatory Audit Threshold: 24 Canonical Nodes
Hard Freeze Threshold: 30 Canonical Nodes
```

### Soft Review Threshold

超过十八个节点时，必须检查是否存在：

- 同一机制的不同问题被重复登记；
- 结果、例子或应用被误登记为机制；
- 章节结构被错误复制为 Registry 结构；
- 术语定义被误登记为完整文章。

### Mandatory Audit Threshold

超过二十四个节点时，不得继续进入生产队列，必须完成 Relationship、Duplication 与 Boundary Audit。

### Hard Freeze Threshold

单一 Part 超过三十个 Canonical Nodes 时，Registry Population 必须暂停。只有在确认该 Part 实际包含多个 Knowledge Domain，并完成 Domain 拆分后，才可继续。

Hard Freeze 不允许通过提高阈值绕过。

---

## 5. Volume-level planning

一册由约五部组成时，建议规模为：

```text
Canonical Nodes: 60–100
Supporting Questions: 150–350
```

三册整体的长期建议规模为：

```text
Canonical Nodes: 180–280
Supporting Questions: 450–1,000
```

这些数字用于系统规划，不要求全部公开，也不要求同步生产。

---

## 6. Production queue limits

Registry 可以保存尚未生产的有效节点，但正式生产必须采用需求驱动方式。

单一发布周期建议：

```text
Active Tier C Nodes: 1–3
Active Tier B Nodes: 2–5
Active Tier A Nodes: 0–5
Total Active Article Production: Maximum 8
```

“Active”表示已经进入写作、审校、本地化或媒体衍生阶段，不包括只登记在 Registry 中的节点。

不得因为 Registry 中存在大量节点，就把所有节点同时转为生产任务。

---

## 7. Density indicators

每次完成一个 Part 的抽取后，应计算：

```text
Canonical Density = Canonical Nodes / Source Pages
Question Density = Supporting Questions / Canonical Nodes
Reuse Density = Cross-source References / Canonical Nodes
```

审计参考：

- Canonical Density 高于 `0.30` 时，通常表示节点过度拆分；
- Question Density 低于 `1.0` 时，通常表示问题仍被错误保留为节点；
- Reuse Density 长期接近 `0` 时，通常表示节点过度依赖单一章节结构。

这些指标只触发审查，不自动删除节点。

---

## 8. Cross-part duplication rule

后续 Part 发现已有机制时，必须：

```text
Reuse Existing Node
+
Add New Source Reference
+
Add Supporting Question if needed
```

不得因为它出现在新章节或新书中，就建立新的 Canonical Node。

只有新内容改变了 Core Claim、Mechanism Sequence 或 Knowledge Boundary，才可以提出新节点或 Split Proposal。

---

## 9. Source completeness rule

一个 Part 完成抽取，不代表其中每个段落都必须映射到 Canonical Node。

来源内容可以合法归入：

```text
Narrative Context
Historical Context
Example
Evidence
Transition
Terminology
Boundary Note
Supporting Question
```

Registry 的目标是保存可复用知识结构，而不是复制整本书。

---

## 10. Review gates

每一个 Part 进入冻结前必须通过：

```text
Gate 1: Source Coverage
Gate 2: Canonical Admission
Gate 3: Duplicate Comparison
Gate 4: Supporting Question Mapping
Gate 5: Boundary Review
Gate 6: Scaling Review
Gate 7: Production Tier Review
```

任何 Gate 失败时，Part 可以保留为 Draft Registry，但不得标记为 Frozen。

---

## 11. Scaling exceptions

以下情况可以超出建议范围，但必须记录理由：

- Part 实际包含多个独立 Domain；
- 大量节点来自此前未注册的基础理论；
- 节点需要满足独立法规、专业边界或安全边界；
- 多册内容被集中迁移到同一 Registry 批次。

以下理由不得作为例外：

- 原书章节很多；
- 每一节都想制作文章；
- 希望增加搜索页面数量；
- 希望提高媒体发布频率；
- 不想进行合并审计。

---

## 12. Frozen operating model

```text
Source Volume
↓
Domain Mapping
↓
Mechanism Extraction
↓
Canonical Consolidation
↓
Supporting Question Mapping
↓
Scaling Audit
↓
Registry Freeze
↓
Demand-led Production
```

自本规则冻结后，未来任何“100页等于100个节点”的设计都视为违反 PKR Contract。
