# KN-B1-P4-006 Canonical Article Production Brief

> Controlled input snapshot only. This document is not a Source of Truth,
> approval record, publication record, or public article body.

## 1. Brief Identity

```json
{
  "briefType": "canonical_article_production_brief",
  "briefSchemaVersion": "PHI-OS-KNOWLEDGE-PRODUCTION-BRIEF-v1.1.0",
  "generatedAt": "2026-08-11T05:23:49.983Z",
  "generatorVersion": "PJA-W2E-R1-v1.0.0-Frozen",
  "repositoryCommit": "1ebd26901fb63db0753a8fc737ea6423155cf8b0",
  "nodeCode": "KN-B1-P4-006",
  "locale": "zh-Hans",
  "productionTarget": "governance_compatible_draft_package"
}
```

## 2. Canonical Node Identity

```json
{
  "nodeCode": "KN-B1-P4-006",
  "domainCode": null,
  "themeCode": "TH-BOOK1-P4-01",
  "canonicalTitle": "运行成本、恢复与内部连接如何维持身体稳定",
  "canonicalQuestion": "运行成本、恢复与内部连接如何维持身体",
  "nodeType": "mechanism_question",
  "status": "planned",
  "previousNode": "KN-B1-P4-005",
  "nextNode": [
    "KN-B1-P4-007"
  ],
  "relationships": {
    "prerequisiteNodeCodes": [
      "KN-B1-P4-005"
    ],
    "nextNodeCodes": [
      "KN-B1-P4-007"
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
  "localizedTitle": "运行成本、恢复与内部连接如何维持身体稳定",
  "localizedQuestion": "运行成本、恢复与内部连接如何维持身体",
  "localizedSummary": null,
  "searchAliases": [],
  "slug": "runtime-cost-recovery-and-internal-connection-sustain-body"
}
```

## 4. Canonical Thesis

身体稳定不是零成本的静止状态，而是运行成本、恢复能力与内部连接持续协调的结果：载体必须支付资源以维持活动，又必须通过恢复补充可用能力，并依赖内部连接把局部状态与整体需要持续交换。

## 5. Article Boundary

### Must Establish

- 身体持续运行会产生资源与调节成本。
- 恢复用于重建可用容量与调节余量。
- 内部连接使局部状态能够被更大范围的载体协调。
- 稳定是动态维持结果，不是无变化。

### Required Distinctions

- Stability ≠ Inactivity
- Recovery ≠ Guaranteed Restoration
- Runtime Cost ≠ Moral Weakness
- Carrier mechanism ≠ Medical diagnosis

### Must Not Claim

- 不得诊断疾病、疲劳原因、营养状态或心理状态。
- 不得给出睡眠、饮食、运动、治疗或医疗建议。
- 不得把一般 Runtime Cost 模型声称为具体生理机制的完整解释。
- PHI OS 可以从一般模型诊断个人身体状态。
- 恢复机制保证恢复到原状态。

### Included Scope

- 有限资源、运行成本、恢复窗口、内部连接、反馈与动态稳定。

### Excluded Scope

- 不讨论具体疾病、器官诊断、药物、治疗、营养方案或健康个案。
- 不把一般模型用于个人风险判断。

### Previous / Next / Supporting Question Boundary

```json
{
  "previousNode": "KN-B1-P4-005",
  "nextNode": {
    "nodeCode": "KN-B1-P4-007",
    "semanticBridge": "进入 KN-B1-P4-007，讨论感官、环境与摄取条件如何改变载体接收的现实输入。"
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
      "content/knowledge/manuscripts/book-1/node-manuscript-mapping.json#KN-B1-P4-006"
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
  "previousNode": "KN-B1-P4-005",
  "nextNode": [
    "KN-B1-P4-007"
  ],
  "availableSourceReferences": [],
  "whyThisNodeExists": "如果成本长期超过恢复，载体的可用能力会下降；如果内部连接失效，局部变化难以被整体读取与协调；稳定因此依赖成本、恢复与连接之间持续而非一次性的平衡。",
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
