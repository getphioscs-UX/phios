# KN-B1-P1-006 Canonical Article Production Brief

> Controlled input snapshot only. This document is not a Source of Truth,
> approval record, publication record, or public article body.

## 1. Brief Identity

```json
{
  "briefType": "canonical_article_production_brief",
  "briefSchemaVersion": "PHI-OS-KNOWLEDGE-PRODUCTION-BRIEF-v1.1.0",
  "generatedAt": "2026-08-11T05:23:48.483Z",
  "generatorVersion": "PJA-W2E-R1-v1.0.0-Frozen",
  "repositoryCommit": "1ebd26901fb63db0753a8fc737ea6423155cf8b0",
  "nodeCode": "KN-B1-P1-006",
  "locale": "zh-Hans",
  "productionTarget": "governance_compatible_draft_package"
}
```

## 2. Canonical Node Identity

```json
{
  "nodeCode": "KN-B1-P1-006",
  "domainCode": null,
  "themeCode": "TH-BOOK1-P1-01",
  "canonicalTitle": "为什么导航需要方向、位置与坐标",
  "canonicalQuestion": "方向、位置与坐标如何共同形成导航",
  "nodeType": "mechanism_question",
  "status": "planned",
  "previousNode": "KN-B1-P1-005",
  "nextNode": [
    "KN-B1-P1-007"
  ],
  "relationships": {
    "prerequisiteNodeCodes": [
      "KN-B1-P1-005"
    ],
    "nextNodeCodes": [
      "KN-B1-P1-007"
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
  "localizedTitle": "为什么导航需要方向、位置与坐标",
  "localizedQuestion": "方向、位置与坐标如何共同形成导航",
  "localizedSummary": null,
  "searchAliases": [],
  "slug": "direction-position-and-coordinates-form-navigation"
}
```

## 4. Canonical Thesis

导航之所以需要方向、位置与坐标，是因为任何从当前状态走向另一状态的行动，都必须同时知道“现在在哪里”“朝哪里变化”以及“这些差异在什么共同参照中被比较”。

## 5. Article Boundary

### Must Establish

- 导航同时依赖当前位置、变化方向与共同坐标参照。
- 坐标不是附加标签，而是让位置与方向可以重复比较的关系结构。
- 导航是持续比较与修正，而不是一次性的目标选择。

### Required Distinctions

- 位置 ≠ 方向
- 坐标 ≠ 地理坐标的单一形式
- 导航 ≠ 预测未来
- 结构分辨率 ≠ 导航本身

### Must Not Claim

- 不得把 PHI OS 的坐标概念等同于 GPS、物理空间或任何单一技术坐标系统。
- 不得声称只要拥有坐标就能保证正确决策或确定未来。
- 不得从一般导航机制直接推断个人状态或给出专业建议。
- 坐标能够消除不确定性。
- 导航必然产生唯一正确路径。

### Included Scope

- 方向、位置、参照系、坐标比较、状态更新与导航修正。

### Excluded Scope

- 不展开具体导航算法、测绘学、控制工程或定位设备原理。
- 不进入个人 Reading、诊断、预测或服务建议。

### Previous / Next / Supporting Question Boundary

```json
{
  "previousNode": "KN-B1-P1-005",
  "nextNode": {
    "nodeCode": "KN-B1-P1-007",
    "semanticBridge": "进入 KN-B1-P1-007，说明坐标与结构的分辨率如何进一步限制导航精度。"
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
      "content/knowledge/manuscripts/book-1/node-manuscript-mapping.json#KN-B1-P1-006"
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
  "previousNode": "KN-B1-P1-005",
  "nextNode": [
    "KN-B1-P1-007"
  ],
  "availableSourceReferences": [],
  "whyThisNodeExists": "如果缺少位置，系统无法确认起点；缺少方向，无法判断变化是否趋近目标；缺少坐标，位置与方向无法稳定比较，导航就退化为局部反应而不是可连续修正的过程。",
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
