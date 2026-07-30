# PHI OS Knowledge Runtime Registry v1.0

## 1. 定位

PHI OS Knowledge Runtime Registry，简称 PKR，是 PHI OS 公共知识系统的长期内容 Contract。它定义知识节点如何建立、如何引用书籍来源、如何生产中英文内容、如何连接学习资产与服务，以及什么状态的内容能够公开。

PKR 不是网页，不是文章集合，也不是每次原封不动贴给 ChatGPT 的长提示词。PKR 是固定规范；每次生产内容时，由节点资料生成较短的 Production Brief。

```text
PKR Contract
↓
Knowledge Node Record
↓
Production Brief
↓
Article／Media Post／Selected Video
```

## 2. 当前商业阶段

PHI OS 当前采用 Service-first 原则。Professional Services、报告与客户交付仍是首要收入主线；公共知识系统的目标，是吸引适合的公众、减少购买前误解，并降低服务过程中重复解释基础理论的成本。

建议阶段性资源配置：

```text
70% Professional Services
20% Knowledge Production
10% Distribution
```

## 3. 主要内容出口

序部及书籍节点默认采用文章作为 Canonical Asset。

```text
Book Source
↓
Knowledge Core
↓
Chinese Canonical Article
↓
English Localized Article
↓
Master Media Post
↓
Selected Video／Derived Audio
```

每个节点只设一个主要知识资产。视频只用于品牌核心、高公众共鸣、高服务解释价值或确实适合视觉表达的节点；音频默认从文章朗读或视频音轨衍生。

## 4. 语言原则

中文简体是 Canonical Source Language；英文是 Required Public Language，但属于同一个 Knowledge Core 的正式本地化表达，不得独立改变理论。

```text
canonicalLanguage: zh-Hans
requiredPublicLanguages:
  - zh-Hans
  - en
```

## 5. 分阶段边界

KH-W3.5 完成 PKR Contract、Schema、Production Instruction 与 Registry 基线。

最终大众页面不属于 KH-W3.5，而属于 KH-W6｜Public Knowledge Experience。
