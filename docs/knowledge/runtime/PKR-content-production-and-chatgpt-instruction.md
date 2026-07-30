# KH-W3.5C｜PKR Content Production & ChatGPT Instruction Freeze

Contract: `PHI-OS-PKR-Content-Production-v1.0.0`

## 1. 固定生产链

```text
Source Material
↓
Knowledge Core Extraction
↓
Chinese Canonical Article
↓
Chinese Review
↓
English Localization
↓
Localization Review
↓
Master Media Post
↓
Selected Derivative Assets
```

任何阶段不得跳过 Knowledge Core，直接让模型从书籍自由生成多种媒体。

## 2. ChatGPT 固定规则

每次任务都必须引用：

```text
PHI-OS-PKR-v1.0.0
```

ChatGPT 必须：

- 只处理指定 Node
- 使用指定来源范围
- 保持 Required Claims
- 保持 Knowledge Boundary
- 遵守 Prohibited Claims
- 明确区分 PHI OS 作者框架、观察、推论与研究证据
- 避免把公共知识写成个案诊断
- 避免命令式建议与保证结果
- 不以强制销售作为文章结尾
- 不大段复制付费书籍

## 3. Prompt 1｜Knowledge Core Extraction

```text
你正在为 PHI OS Knowledge Runtime 建立 Knowledge Core。

固定 Contract：PHI-OS-PKR-v1.0.0

任务：extract_knowledge_core
节点：{{nodeCode}}
Canonical Question：{{canonicalQuestion}}
来源：{{sourceReferences}}
节点类型：{{nodeType}}
知识层级：{{knowledgeLevel}}

请只根据指定来源，建立语言中立的 Knowledge Core。

必须输出：
1. canonicalQuestion
2. shortAnswerCore
3. coreInsight
4. requiredClaims
5. mechanismSequence
6. keyConcepts
7. realityExamples
8. commonMisunderstandings
9. knowledgeBoundary
10. prohibitedClaims
11. sourceCoverage
12. relatedNodeSuggestions
13. serviceExplanationUse
14. unresolvedQuestions

规则：
- 不写完整文章；
- 不补充来源未支持的 PHI OS 理论；
- 可指出资料不足，不得以合理推测填补；
- 将作者框架、一般观察与研究证据分开；
- 不进行个人诊断、医疗判断、法律判断或财务个案建议；
- 不以购买服务作为答案。
```

## 4. Prompt 2｜Chinese Canonical Article

```text
你正在为 PHI OS Knowledge Runtime 制作中文 Canonical Article。

固定 Contract：PHI-OS-PKR-v1.0.0
任务：create_chinese_canonical_article
节点：{{nodeCode}}
问题：{{displayQuestionZh}}
Knowledge Core：{{knowledgeCore}}
来源：{{sourceReferences}}
生产等级：{{productionTier}}
目标读者：{{audience}}

请制作一篇中文公开知识文章。

必须保持：
- Core Insight 不变；
- Required Claims 全部可辨认；
- Mechanism Sequence 不被打乱；
- Knowledge Boundary 明确；
- 不加入 Prohibited Claims；
- 与付费书籍保持来源边界。

默认结构：
1. 问题入口
2. Short Answer
3. 现象为什么容易被误解
4. PHI OS 所辨识的形成机制
5. 一个或两个非个案化现实例子
6. 这项理解改变了什么
7. Knowledge Boundary
8. Related Question／Next Node

写作要求：
- 使用自然、清晰、成熟的中文；
- 兼顾哲学与系统论，但不堆叠术语；
- 避免连续短句与英文翻译腔；
- 不使用夸大、神秘化、治疗承诺或预测语气；
- 不把文章写成服务广告；
- 不大段复制书籍原文；
- 未确认的信息必须保留为未知或边界。

默认长度：
- Tier A：1200–1800 中文字
- Tier B：1600–2400 中文字
- Tier C：2200–3200 中文字

同时输出：
- shortAnswer
- summaryAnswer
- coreInsight
- keyConcepts
- seoTitle
- seoDescription
- articleMarkdown
- reviewChecklist
```

## 5. Prompt 3｜English Localization

```text
You are localizing an approved PHI OS Chinese canonical article into English.

Fixed contract: PHI-OS-PKR-v1.0.0
Task: localize_english_article
Node: {{nodeCode}}
Knowledge Core: {{knowledgeCore}}
Approved Chinese version: {{approvedChineseArticle}}
Terminology registry: {{terminologyRegistry}}

Create a natural English publication for an international reader while preserving semantic parity.

You must preserve:
- the same core insight;
- the same required claims;
- the same mechanism sequence;
- the same knowledge boundary;
- the same degree of certainty;
- the same source scope.

You may adapt:
- sentence structure;
- paragraph rhythm;
- title wording;
- culture-specific transitions;
- examples only when the mechanism remains unchanged.

You must not:
- add a new PHI OS theory;
- remove an important limitation;
- turn an inference into a fact;
- present PHI OS as therapy, prediction, religion, or guaranteed guidance;
- translate terminology inconsistently;
- reproduce long passages from the paid book.

Output:
- displayQuestion
- shortAnswer
- summaryAnswer
- coreInsight
- keyConcepts
- seoTitle
- seoDescription
- articleMarkdown
- terminologyNotes
- semanticParityChecklist
```

## 6. Prompt 4｜Master Media Post

```text
根据已经审核的 Knowledge Article 制作一个平台中立的 Master Media Post。

固定 Contract：PHI-OS-PKR-v1.0.0
节点：{{nodeCode}}
语言：{{locale}}
文章：{{approvedArticle}}

结构：
1. 一个真实而非煽动性的问题入口；
2. 一个 Core Insight；
3. 一段简短机制说明；
4. 指向完整 Knowledge Node 的自然入口。

限制：
- 不制造焦虑；
- 不夸大结果；
- 不增加文章没有的理论；
- 不把贴文写成硬性销售；
- 不使用未经确认的统计数字；
- 不因平台传播而牺牲知识边界。

默认长度：
- 中文：180–350字
- 英文：100–220 words
```

## 7. Prompt 5｜Selected Video Script

仅在 Asset Requirement 标记为 `required` 或 `optional` 且已经决定生产时使用。

```text
根据已审核的 Knowledge Article 制作视频脚本，不得从零重写理论。

固定 Contract：PHI-OS-PKR-v1.0.0
节点：{{nodeCode}}
语言：{{locale}}
视频类型：{{short_or_long}}
文章：{{approvedArticle}}
Figure Brief：{{figureBrief}}

Short Video：45–90秒
Long Video：5–10分钟

输出：
- openingHook
- narration
- visualDirection
- onScreenText
- closingBridge

规则：
- Hook 不可制造虚假危机；
- 画面只帮助理解，不替代知识边界；
- 不将公共视频变成个案解读；
- 不增加文章没有的主张；
- Audio 可从最终 narration 衍生。
```

## 8. 文章结构要求

公开文章不是书籍章节复制，也不是 SEO 拼接文本。文章必须围绕一个问题完成一个认知转移。

```text
Question
↓
Misunderstanding
↓
Mechanism
↓
Reality Example
↓
Knowledge Shift
↓
Boundary
↓
Next Understanding
```

## 9. 内容长度

长度是默认范围，不是硬性字数指标。完整性优先于填充字数。

- Tier A 中文：1200–1800字
- Tier B 中文：1600–2400字
- Tier C 中文：2200–3200字
- 英文长度以自然表达为准，不强制逐字对应
- Master Media Post 不重复完整文章

## 10. 审核门槛

内容只有在以下项目全部通过后，才能进入 `content_reviewed`：

- Node identity 正确
- 来源范围正确
- Core Insight 没有漂移
- Required Claims 没有遗漏
- Prohibited Claims 没有出现
- 作者框架没有被冒充为科学定论
- 没有个人诊断或保证结果
- 没有替代付费书籍
- 没有强迫购买
- Related／Next Node 合理
- 中文语气自然

英文还必须通过：

- Terminology Review
- Semantic Parity Review
- Certainty Level Review
- Boundary Preservation Review

## 11. ChatGPT 不得自动完成的动作

ChatGPT 不得自行：

- 将草稿标记为 approved
- 将内容标记为 published
- 修改 productionTier
- 修改 canonicalQuestion
- 修改 requiredClaims
- 扩大来源页码
- 自动加入新的 Service Reference
- 把 optional Asset 改成 required

这些动作必须由 PKR 管理者明确批准。
