# KN-B1-P3-005 Canonical Article Production Brief

> Controlled input snapshot only. This document is not a Source of Truth,
> approval record, publication record, or public article body.

## 1. Brief Identity

```json
{
  "briefType": "canonical_article_production_brief",
  "briefSchemaVersion": "PHI-OS-KNOWLEDGE-PRODUCTION-BRIEF-v1.1.0",
  "generatedAt": "2026-08-11T05:23:49.361Z",
  "generatorVersion": "PJA-W2E-R1-v1.0.0-Frozen",
  "repositoryCommit": "1ebd26901fb63db0753a8fc737ea6423155cf8b0",
  "nodeCode": "KN-B1-P3-005",
  "locale": "zh-Hans",
  "productionTarget": "governance_compatible_draft_package"
}
```

## 2. Canonical Node Identity

```json
{
  "nodeCode": "KN-B1-P3-005",
  "domainCode": null,
  "themeCode": "TH-BOOK1-P3-01",
  "canonicalTitle": "无限现实如何压缩为有限问题",
  "canonicalQuestion": "无限现实如何压缩为有限问题",
  "nodeType": "mechanism_question",
  "status": "planned",
  "previousNode": "KN-B1-P3-004",
  "nextNode": [
    "KN-B1-P3-006"
  ],
  "relationships": {
    "prerequisiteNodeCodes": [
      "KN-B1-P3-004"
    ],
    "nextNodeCodes": [
      "KN-B1-P3-006"
    ],
    "relatedNodeCodes": [],
    "parentNodeCodes": [],
    "childNodeCodes": []
  }
}
```

## 3. Localized Identity

```json
{
  "localizedTitle": "无限现实如何压缩为有限问题",
  "localizedQuestion": "无限现实如何压缩为有限问题",
  "localizedSummary": null,
  "searchAliases": [],
  "slug": "infinite-reality-compresses-into-finite-problems"
}
```

## 4. Canonical Thesis

无限开放的现实之所以会被压缩为有限问题，是因为任何实际运行都必须从无数可能差异中选择当前可处理的边界、变量与关系；问题就是这种压缩后的可操作结构。

## 5. Article Boundary

### Must Establish

- 问题是对开放现实的结构化压缩，而不是现实本身。
- 压缩通过边界、变量、时间窗口、资源与目标限制处理范围。
- 任何有限问题都会保留盲区与未覆盖现实。

### Required Distinctions

- Question ≠ Reality
- Compression ≠ Complete Explanation
- Operational Boundary ≠ Ontological Boundary
- Finite Problem ≠ Simple Problem

### Must Not Claim

- 不得声称现实能够被有限问题完全穷尽。
- 不得把问题分类当作自然界唯一结构。
- 不得在本节点提前宣称十六个问题是唯一可能分类。
- 有限问题可以穷尽现实。
- 问题边界天然等于现实边界。

### Included Scope

- 问题形成、复杂度压缩、边界选择、可操作变量与未覆盖空间。

### Excluded Scope

- 不完整展开十六基础问题的内容。
- 不讨论具体求解算法、个人问诊或专业诊断。

### Previous / Next / Supporting Question Boundary

```json
{
  "previousNode": "KN-B1-P3-004",
  "nextNode": {
    "nodeCode": "KN-B1-P3-006",
    "semanticBridge": "进入 KN-B1-P3-006，说明一组基础问题如何进一步组织现实辨认、建立、共存与延续。"
  },
  "supportingQuestions": [],
  "supportingQuestionFieldSemantics": {
    "canonicalNodeCode": "Authoritative Canonical Node ownership.",
    "sourceNodeCode": "Consolidation origin only; it does not override canonicalNodeCode."
  },
  "paidContentBoundary": "Public article must not reproduce restricted paid content.",
  "runtimeBoundary": "No Runtime read or write, Provider invocation, or case input.",
  "professionalBoundary": "No personal diagnosis, recommendation, or professional conclusion."
}
```

## 6. Editorial Contract

```json
{
  "articlePurpose": "public_knowledge_explanation",
  "audience": "public_reader",
  "humanApprovalAuthority": "Human editorial authority only"
}
```

## 7. Structured Article Contract

```json
{
  "articleSchemaPath": "content/knowledge/schemas/article-v2.schema.json",
  "articleSchemaVersion": "PHI-OS-KNOWLEDGE-ARTICLE-v2.0.0",
  "requiredFiles": [
    "article.zh-Hans.json",
    "claims.zh-Hans.json",
    "source-dossier.zh-Hans.json",
    "review.zh-Hans.json",
    "media-brief.zh-Hans.json",
    "package-manifest.json"
  ],
  "requiredRootFields": [
    "contract",
    "assetCode",
    "nodeCode",
    "locale",
    "contentRole",
    "version",
    "contentStatus",
    "reviewStatus",
    "publicationStatus",
    "publishedAt",
    "publicationOrder",
    "slug",
    "title",
    "displayQuestion",
    "shortAnswer",
    "summary",
    "seo",
    "keyConcepts",
    "sections",
    "knowledgeBoundary",
    "sourceReferences",
    "connections",
    "masterMediaPost"
  ],
  "allowedBlockTypes": [
    "paragraph",
    "lead",
    "question",
    "insight",
    "mechanism",
    "timeline",
    "comparison",
    "figure",
    "transition",
    "next_node"
  ],
  "blockRestrictions": [
    "No rawHtml, script, style, iframe, arbitrary embed or javascript URL",
    "All blockCode and sectionCode values are unique and ordered",
    "No external image URL or Base64 image"
  ],
  "connectionRules": "previousNode and nextNode must match the Canonical Registry",
  "figureRules": "Every figure reference must map to the package Media Brief; no binary media is accepted",
  "accessibilityRequirements": "Figure alt text is mandatory",
  "rendererRestrictions": "PJA-W2D allowlist and safe DOM behavior remain authoritative"
}
```

## 8. Claim Governance

```json
{
  "claimTypes": [
    "externally_verifiable",
    "phi_os_interpretation",
    "editorial_inference",
    "mixed",
    "canonical_transition",
    "boundary_statement"
  ],
  "materialityLevels": [
    "low",
    "medium",
    "high",
    "critical"
  ],
  "evidenceRequirements": "Externally verifiable claims and source-required claims require mapped sources",
  "qualificationRules": "Interpretation and inference must be explicitly qualified",
  "unresolvedClaimHandling": "Retain as draft finding; never approve automatically",
  "canonicalInterpretationRules": true,
  "externalFactDraftRules": {
    "sourceRequired": true,
    "factualReviewRequired": true,
    "generatedPackageMayNotApprove": true,
    "unresolvedFactsMustRemainQualified": true
  },
  "futurePublicationGate": {
    "requiredClaimStateForHighAndCritical": "approved",
    "informationalOnlyForGeneratedPackage": true
  },
  "contraryEvidenceRules": true
}
```

## 9. Source Governance

```json
{
  "sourceTypes": "Defined by the formal Source Schema",
  "authorityRequirements": [
    "primary",
    "authoritative_secondary",
    "reputable_secondary",
    "contextual",
    "reference_only"
  ],
  "reliabilityRequirements": "Record quality assessment; reference-only cannot support high/critical claims",
  "sourceVerificationRules": "Validator checks structure and mappings only; it does not browse or verify truth",
  "publicCitationRules": [
    "public_citation_allowed",
    "public_metadata_only"
  ],
  "noFabricationRules": {
    "internalCanonicalSources": [
      "content/knowledge/manuscripts/book-1/node-manuscript-mapping.json#KN-B1-P3-005"
    ],
    "externalSourceNeeds": [],
    "preferredSourceTypes": [
      "primary research",
      "official technical source",
      "canonical PHI OS manuscript"
    ],
    "sourceCodesMayBeInvented": false
  },
  "unavailableSourceHandling": "Mark unresolved, identify missing metadata, and create a blocking review finding"
}
```

## 10. Review Governance

```json
{
  "reviewDimensions": [
    "canonicalReview",
    "factualReview",
    "sourceReview",
    "boundaryReview",
    "languageReview",
    "readabilityReview",
    "crossNodeReview",
    "continuityReview",
    "visualReview",
    "localizationReadinessReview"
  ],
  "allowedDraftStatus": [
    "draft",
    "ready_for_human_review",
    "changes_required"
  ],
  "forbiddenStatus": [
    "approved",
    "publication_ready",
    "published",
    "human_approved"
  ],
  "blockingFindingRules": [
    "major",
    "critical"
  ],
  "humanApprovalRequirement": true,
  "versionBindingRequirement": [
    "articleVersion",
    "claimSetVersion",
    "sourceSetVersion"
  ]
}
```

## 11. Node-specific Inputs

```json
{
  "supportingQuestions": [],
  "searchAliases": [],
  "previousNode": "KN-B1-P3-004",
  "nextNode": [
    "KN-B1-P3-006"
  ],
  "availableSourceReferences": [],
  "whyThisNodeExists": "如果没有问题压缩，有限 Runtime 无法在无限可能中形成明确输入、判断条件或行动范围；有限问题让复杂现实进入可持续处理，同时也必然留下未被当前问题覆盖的部分。",
  "knownUnresolvedQuestions": [],
  "requiredFigures": [],
  "figureProductionContract": {
    "figureRequirement": "not_required_by_c2",
    "mediaBriefRequired": false,
    "articleFigureBlockAllowed": false,
    "assetRegistryRequiredBeforeArticleReference": true,
    "binaryAssetAllowedInPackage": false,
    "remoteAssetAllowed": false
  },
  "optionalFigures": [],
  "productionReadinessFindings": {
    "recordVersion": "1.0.0",
    "productionInputStatus": "production_ready",
    "centralThesisPresent": true,
    "outlineStatus": "approved",
    "articleBodyCreated": false,
    "generatedPackageAllowedState": {
      "contentStatus": "draft",
      "reviewStatus": "not_reviewed",
      "publicationStatus": "not_published"
    },
    "futureHumanPublicationTarget": null,
    "futurePublicationTargetIsInformationalOnly": true
  }
}
```

## 12. Package Output Contract

```json
{
  "packageManifestContract": {
    "packageType": "canonical_article_package",
    "packageSchemaVersion": "PHI-OS-KNOWLEDGE-PACKAGE-v1.0.0",
    "requiredFields": [
      "packageType",
      "packageSchemaVersion",
      "nodeCode",
      "locale",
      "status",
      "files"
    ],
    "allowedStatus": [
      "draft",
      "ready_for_human_review",
      "changes_required"
    ],
    "checksumAlgorithm": "sha256",
    "checksumInput": "original_file_bytes",
    "requiredFiles": [
      "article.zh-Hans.json",
      "claims.zh-Hans.json",
      "source-dossier.zh-Hans.json",
      "review.zh-Hans.json",
      "media-brief.zh-Hans.json",
      "package-manifest.json"
    ],
    "generatedPackageMayNotUseFinalPublicationStates": true
  }
}
```

- Validation means structurally valid and governance-compatible draft only.

## 13. Forbidden Actions

- Do not modify Schema, Registry, Blueprint, Canonical Thesis, Previous Node or Next Node.
- Do not create a Canonical Node or fabricate a Source.
- Do not output raw HTML, iframe, script, executable content, remote embeds, or binary media.
- Do not set approved, publication_ready, published, or human_approved.
- Do not commit, push, deploy, invoke an AI API, or write to Runtime.
