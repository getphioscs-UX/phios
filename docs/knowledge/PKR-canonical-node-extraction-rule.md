# KH-W3.5F｜Canonical Node Extraction Rule

## 1. Contract

```text
Contract: PHI-OS-PKR-Canonical-Extraction-Rule-v1.2.0
Scope: All PHI OS books, prefaces, parts, chapters, appendices and future knowledge sources
Status: Frozen
```

本规则冻结 PHI OS Knowledge Runtime Registry 的正式节点抽取方式。后续任何书籍内容进入知识系统时，均不得再按照页数、标题数量、段落数量或问题数量线性建立节点。

正式抽取单位只有一个：**可以独立解释、可以跨来源复用、具有完整运行机制并拥有明确边界的知识机制。**

---

## 2. Frozen hierarchy

```text
Knowledge Domain
↓
Knowledge Theme
↓
Canonical Knowledge Node
↓
Supporting Question
↓
Search Alias
```

### Knowledge Domain

代表一个长期稳定的知识范围，例如现实形成、意识运行、关系生态、文明迁移。Domain 不是文章，也不是生产任务。

### Knowledge Theme

代表同一 Domain 内的一组相近机制，用于组织节点、学习路径与导航。Theme 不因一本书的章节顺序而自动建立。

### Canonical Knowledge Node

代表一个独立、完整、可复用的知识机制。它是唯一可以成为正式中文核心文章、英文正式本地化内容及主要衍生媒体的单位。

### Supporting Question

代表读者进入同一机制时可能提出的不同问题。Supporting Question 必须指向一个 Canonical Node，不独立产生完整文章与生产队列。

### Search Alias

代表搜索词、自然语言变体、常见表达或未来真实检索词。Search Alias 只用于发现与检索，不建立新知识内容。

---

## 3. Prohibited mappings

以下映射永久禁止：

```text
One Page = One Node
One Heading = One Node
One Question = One Node
One Paragraph = One Node
One Book Section = One Node
One Search Phrase = One Node
```

章节标题、页数与问题数量可以协助发现知识机制，但不得直接决定节点数量。

---

## 4. Canonical Node admission tests

候选内容只有同时通过以下七项测试，才可登记为 Canonical Knowledge Node。

### 4.1 Mechanism Independence

候选内容必须解释一个独立机制，而不只是现象、例子、立场、修辞或结论。

### 4.2 Causal or Operational Sequence

候选内容必须能够表达至少一个完整序列，例如：

```text
Condition
↓
Activation
↓
Interaction
↓
Settlement
↓
Observable Effect
```

不要求所有节点使用同一语法，但必须具有可说明的形成过程。

### 4.3 Reusability

该机制必须能够在至少两个不同语境中被引用，例如书籍、文章、服务解释、学习路径、报告边界或 Reality Journey 教育内容。

### 4.4 Source Boundary

必须能够指出机制来自哪些来源，并明确哪些内容仍未被来源支持。无法建立来源边界的内容不得成为正式节点。

### 4.5 Non-Duplication

候选机制不得与已有 Canonical Node 共享相同的核心主张、机制序列与知识边界。只有表达方式不同，不构成新节点。

### 4.6 Production Viability

该机制必须足以支持一篇独立中文核心文章，而不需要依赖另一节点才能成立。过窄内容应降为 Supporting Question；过宽内容应拆分。

### 4.7 Boundary Safety

该节点不得自动形成诊断、预测、医疗判断、法律判断、财务个案建议、宗教权威宣称或付费服务承诺。服务连接必须由独立 Registry 管理。

---

## 5. Classification decision

每个候选单位必须被分类为以下之一：

| Classification | Meaning | Production consequence |
|---|---|---|
| Canonical Node | 独立知识机制 | 可进入正式文章与衍生资产生产 |
| Supporting Question | 同一机制的读者问题 | 嵌入节点，不独立生产 |
| Search Alias | 检索表达变体 | 仅用于搜索与发现 |
| Source Note | 来源中的证据、例子或限定 | 保留来源关系，不公开为节点 |
| Terminology Entry | 专有词汇定义 | 进入术语表，不自动成为文章 |
| Deferred Candidate | 机制可能成立但资料不足 | 不进入正式生产 |
| Rejected Duplicate | 与既有节点重复 | 合并关系，不建立新编号 |

任何候选内容都不得在未分类的情况下直接写入 `nodes.json`。

---

## 6. Merge rules

以下情况必须合并为同一 Canonical Node：

1. 核心主张相同，只是问题角度不同；
2. 机制序列相同，只是例子或应用领域不同；
3. 其中一个候选内容只是另一个机制的结果或表现；
4. 两个候选内容无法各自形成完整边界文章；
5. 两个问题可以由同一知识核心完整回答；
6. 不同章节重复使用同一机制，但语言有所变化。

合并后，原问题应保留为 Supporting Question、Search Alias 或 Source Note，不得删除来源踪迹。

---

## 7. Split rules

只有以下情况允许拆分 Canonical Node：

1. 一个候选内容包含两个以上可独立运行的机制序列；
2. 两部分拥有不同的来源边界；
3. 两部分在服务、课程或学习路径中可以独立复用；
4. 两部分具有不同的知识边界与误用风险；
5. 单一文章无法在不牺牲清晰度的情况下完成解释。

不得因为文章太长、标题太多或媒体制作方便而拆分节点。

---

## 8. Node identity rules

Canonical Node 的身份由以下组合决定：

```text
Core Claim
+
Mechanism Sequence
+
Knowledge Boundary
+
Source Boundary
```

标题、语言与章节位置不属于节点身份。标题可以更新，中文与英文可以不同，节点编号仍保持不变。

---

## 9. Language rules

```text
Knowledge Core: Language-neutral
Canonical Article: zh-Hans
English Content: Localized, not independently canonical
```

英文内容不得新增中文核心没有的理论主张。若英文审校发现新的机制，必须回到中文 Knowledge Core 重新审查，而不是在英文版本中单独扩展。

---

## 10. Production tier separation

Production Tier 不决定节点是否成立。

```text
Node Validity ≠ Production Priority
```

Tier A、Tier B、Tier C 只决定投入程度、公开顺序与衍生资产数量。尚未进入生产队列的有效节点仍可保留在 Registry 中。

不得为了减少制作量而删除有效节点，也不得为了增加内容量而制造无效节点。

---

## 11. Extraction workflow

```text
Source Sections
↓
Candidate Mechanisms
↓
Duplicate Comparison
↓
Admission Tests
↓
Classification
↓
Merge or Split Audit
↓
Canonical Node Assignment
↓
Supporting Question Mapping
↓
Source Boundary Registration
↓
Production Tier Assignment
```

生产内容不得先于 Registry 审核。先写文章、再寻找节点归属的做法只允许用于旧内容迁移，不允许成为未来默认流程。

---

## 12. Minimum record requirements

每一个 Canonical Node 至少必须登记：

```text
nodeCode
canonicalQuestion
coreClaim
mechanismSequence
knowledgeBoundary
sourceRefs
themeCode
productionTier
registryStatus
version
```

每一个 Supporting Question 至少必须登记：

```text
questionCode
nodeCode
question
sourceRefs
status
```

---

## 13. Change control

已冻结节点发生变化时必须使用以下动作之一：

```text
Clarify
Expand Boundary
Merge
Split
Deprecate
Supersede
```

不得直接覆盖历史身份。Merge、Split、Deprecate 与 Supersede 必须保留 lineage。

---

## 14. Freeze statement

自 KH-W3.5F 起，PHI OS 所有后续知识抽取都必须以机制为单位。页数、问题数量、目录层级与章节长度只能作为来源导航信息，不能决定 Registry 的规模。
