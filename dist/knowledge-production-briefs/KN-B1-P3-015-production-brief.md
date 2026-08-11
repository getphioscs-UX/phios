# KN-B1-P3-015 Canonical Article Production Brief

> Controlled input snapshot only. This document is not a Source of Truth,
> approval record, publication record, or public article body.

## 1. Brief Identity

```json
{
  "briefType": "canonical_article_production_brief",
  "briefSchemaVersion": "PHI-OS-KNOWLEDGE-PRODUCTION-BRIEF-v1.1.0",
  "generatedAt": "2026-08-11T05:23:49.622Z",
  "generatorVersion": "PJA-W2E-R1-v1.0.0-Frozen",
  "repositoryCommit": "1ebd26901fb63db0753a8fc737ea6423155cf8b0",
  "nodeCode": "KN-B1-P3-015",
  "locale": "zh-Hans",
  "productionTarget": "governance_compatible_draft_package"
}
```

## 2. Canonical Node Identity

```json
{
  "nodeCode": "KN-B1-P3-015",
  "domainCode": null,
  "themeCode": "TH-BOOK1-P3-01",
  "canonicalTitle": "运行网络如何形成状态、反馈、重组与连续性",
  "canonicalQuestion": "运行网络如何形成状态、反馈、重组与连续性",
  "nodeType": "mechanism_question",
  "status": "planned",
  "previousNode": "KN-B1-P3-014",
  "nextNode": [
    "KN-B1-P4-001"
  ],
  "relationships": {
    "prerequisiteNodeCodes": [
      "KN-B1-P3-014"
    ],
    "nextNodeCodes": [
      "KN-B1-P4-001"
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
  "localizedTitle": "运行网络如何形成状态、反馈、重组与连续性",
  "localizedQuestion": "运行网络如何形成状态、反馈、重组与连续性",
  "localizedSummary": null,
  "searchAliases": [],
  "slug": "runtime-networks-form-state-feedback-reorganization-and-continuity"
}
```

## 4. Canonical Thesis

运行网络之所以能够形成状态、反馈、重组与连续性，是因为当前现实不是由单一节点决定，而是由多个运行关系在同一时间窗口中的激活、权重、约束与反馈共同形成，并在变化后保留足够结构继续运行。

## 5. Article Boundary

### Must Establish

- 当前状态由多个节点与关系共同形成。
- 反馈把运行结果重新带回网络并改变后续状态。
- 重组可以改变连接、权重或边界而不必摧毁全部结构。
- 连续性来自变化中仍被维持的关键关系与约束。

### Required Distinctions

- State ≠ Single Cause
- Feedback ≠ Simple Loop
- Reorganization ≠ Total Reset
- Continuity ≠ No Change

### Must Not Claim

- 不得把网络状态归因于单一中央控制器。
- 不得把反馈写成必然稳定或必然自我修复。
- 不得声称连续性要求结构完全不变。
- 网络必然自动稳定。
- 反馈总能恢复原状态。

### Included Scope

- 网络状态、节点参与、关系权重、反馈、重组与连续性。

### Excluded Scope

- 不展开具体神经网络、社会网络或计算机网络技术细节。
- 不提前进入第四部生命载体的生理机制。

### Previous / Next / Supporting Question Boundary

```json
{
  "previousNode": "KN-B1-P3-014",
  "nextNode": {
    "nodeCode": "KN-B1-P4-001",
    "semanticBridge": "进入 KN-B1-P4-001，解释持续 Runtime 为什么需要进一步压缩并承载为生命组织。"
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
      "content/knowledge/manuscripts/book-1/node-manuscript-mapping.json#KN-B1-P3-015"
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
  "previousNode": "KN-B1-P3-014",
  "nextNode": [
    "KN-B1-P4-001"
  ],
  "availableSourceReferences": [],
  "whyThisNodeExists": "没有状态整合，网络只能是离散活动；没有反馈，运行无法根据结果调整；没有重组，网络会在条件变化后失配；没有连续性，系统无法把前后状态连接为持续 Runtime。",
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
