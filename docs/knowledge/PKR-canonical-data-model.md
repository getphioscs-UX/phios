# PKR Canonical Data Model

Contract: `PHI-OS-PKR-Canonical-Data-Model-v1.0.0`

## 1. 数据结构

```text
Knowledge Collection
↓
Knowledge Theme
↓
Knowledge Node Core
↓
Localized Content
↓
Knowledge Assets
```

独立关系层：

- Source Registry
- Relationship Registry
- Service Reference Registry

## 2. Knowledge Node Core

Node Core 为语言中立资料，中文与英文共享同一个 `nodeCode`。

核心字段：

- nodeCode
- collectionCode
- themeCode
- canonicalQuestionKey
- nodeType
- knowledgeLevel
- productionTier
- primaryAssetType
- canonicalLanguage
- requiredPublicLanguages
- publicationPriority
- sourceReferences
- requiredClaims
- knowledgeBoundary
- prohibitedClaims
- evidenceStatus
- serviceRelevance
- relationships
- registryStatus
- version

## 3. Localized Content

每个 Node Core 下允许 `zh-Hans` 与 `en` 内容。

中文：

- contentRole: canonical
- displayQuestion
- slug
- shortAnswer
- summaryAnswer
- coreInsight
- keyConcepts
- seoTitle
- seoDescription
- contentStatus
- reviewStatus

英文额外记录：

- contentRole: localized
- localizationSourceLocale
- localizationSourceVersion
- terminologyReviewStatus
- semanticParityStatus

## 4. Asset Storage

完整文章不写入 `nodes.json`。Registry 只保存 Asset Code；正文使用 Markdown 独立保存。

```text
content/knowledge/assets/articles/zh-Hans/KN-*.md
content/knowledge/assets/articles/en/KN-*.md
```

## 5. 状态分离

Registry Status：

- proposed
- structured
- frozen
- deprecated

Content Status：

- not_started
- drafting
- drafted
- revision_required
- content_reviewed

Localization Status：

- not_required
- not_started
- localization_pending
- localized
- localization_reviewed

Publication Status：

- not_published
- scheduled
- published
- unpublished
- archived
