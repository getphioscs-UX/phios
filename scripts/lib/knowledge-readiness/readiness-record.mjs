import fs from 'node:fs/promises';
import path from 'node:path';
import {
  PRODUCTION_TOOL_VERSION,
  SCHEMA_VERSIONS
} from '../knowledge-production/production-config.mjs';
import { contextForNode } from './authority-loader.mjs';
import {
  ARTICLE_TREATMENTS,
  DEFAULT_READINESS_LOCALE,
  READINESS_CONTRACT_VERSION,
  READINESS_SCHEMA_VERSION,
  READINESS_STATUSES,
  ReadinessError,
  finding,
  readinessRelativePath
} from './readiness-config.mjs';

function localizedQuestion(question, locale) {
  return question.locales?.[locale]?.displayQuestion ?? null;
}

function supportingQuestionSkeleton(question, locale) {
  return {
    questionCode: question.questionCode,
    questionText: localizedQuestion(question, locale),
    primaryNodeCode: question.canonicalNodeCode,
    relatedNodeCodes: [],
    relationshipType: question.questionType,
    coverageRole: null,
    articleTreatment: null,
    searchAliasEligibility: null,
    supportingContentEligibility: null,
    fieldSemantics: {
      primaryNodeCode: 'Canonical ownership derived from canonicalNodeCode.',
      sourceNodeCode:
        'Legacy, consolidation, or origin trace only; never a second Canonical owner.'
    }
  };
}

function hierarchy(authority, context) {
  const membership = context.membership;
  return {
    bookCode: context.node.bookCode ?? membership?.bookCode ?? null,
    bookTitle: membership?.bookTitle ?? null,
    partCode: context.node.partCode ?? membership?.blueprintNode?.partCode ?? null,
    partTitle: membership?.part?.title ?? null,
    domainCode: context.node.domainCode ?? null,
    themeCode: context.node.themeCode ?? null,
    nodeCode: context.node.nodeCode,
    nodeType: context.node.nodeType
  };
}

function versionBinding(authority, membership) {
  return {
    registryVersion: authority.versions.registryVersion,
    registryHash: authority.versions.registryHash,
    blueprintVersion: membership
      ? (
          membership.blueprint.contract ??
          membership.blueprint.version ??
          null
        )
      : null,
    blueprintPath: membership?.blueprintPath ?? null,
    editorialContractVersion: authority.versions.editorialContractVersion,
    articleSchemaVersion: SCHEMA_VERSIONS.article,
    claimGovernanceVersion: authority.versions.claimGovernanceVersion,
    exporterVersion: PRODUCTION_TOOL_VERSION
  };
}

function deterministicMissingFields(context) {
  const missing = [
    'canonicalThesis.statement',
    'canonicalThesis.mechanism',
    'canonicalThesis.necessity',
    'canonicalThesis.systemRole',
    'canonicalThesis.continuity.fromPreviousNode',
    'canonicalThesis.continuity.toNextNode',
    'articleBoundary.mustEstablish',
    'articleBoundary.requiredDistinctions',
    'articleBoundary.mustNotClaim',
    'articleBoundary.includedScope',
    'articleBoundary.excludedScope',
    'claimBoundary',
    'sourceBoundary.sourceRequirement',
    'figureBoundary.figureRequirement',
    'publicContentBoundary',
    'review.humanFreezeCompleted'
  ];
  if (context.questions.length) {
    missing.push('supportingQuestionBoundary.articleTreatment');
  }
  return missing;
}

export function buildReadinessSkeleton(authority, nodeCode, locale) {
  const context = contextForNode(authority, nodeCode, locale);
  if (!context.localized) {
    throw new ReadinessError(
      'LOCALIZED_CONTENT_NOT_READY',
      `${nodeCode}/${locale} has no Localized Content record.`
    );
  }
  if (!context.membership) {
    throw new ReadinessError(
      'BLUEPRINT_MEMBERSHIP_MISMATCH',
      `${nodeCode} is registered but has no registered Blueprint membership.`
    );
  }
  const previousNodes = context.node.relationships?.prerequisiteNodeCodes ?? [];
  const nextNodes = context.node.relationships?.nextNodeCodes ?? [];
  const missingFields = deterministicMissingFields(context);
  const blockingFindings = [
    finding(
      'CANONICAL_THESIS_NOT_READY',
      'Canonical Thesis requires a separate human editorial decision.',
      'canonicalThesis'
    ),
    finding(
      'PRODUCTION_BOUNDARY_NOT_READY',
      'Article Boundary requires a separate human editorial decision.',
      'articleBoundary'
    ),
    finding(
      'CLAIM_BOUNDARY_NOT_READY',
      'Claim Plan has not been established.',
      'claimBoundary'
    ),
    finding(
      'SOURCE_BOUNDARY_NOT_READY',
      'Source Plan has not been established.',
      'sourceBoundary'
    ),
    finding(
      'FIGURE_BOUNDARY_NOT_READY',
      'Figure requirement has not been decided.',
      'figureBoundary'
    ),
    finding(
      'PUBLIC_BOUNDARY_NOT_READY',
      'Public, paid, Runtime and professional boundaries require human review.',
      'publicContentBoundary'
    )
  ];
  if (context.questions.length) {
    blockingFindings.push(finding(
      'SUPPORTING_QUESTION_MAPPING_INCOMPLETE',
      'Supporting Question treatment and eligibility require editorial decisions.',
      'supportingQuestionBoundary'
    ));
  }
  return {
    readinessSchemaVersion: READINESS_SCHEMA_VERSION,
    recordType: 'canonical_production_readiness',
    nodeCode,
    locale,
    canonicalIdentity: {
      nodeCode,
      canonicalQuestionKey: context.node.canonicalQuestionKey,
      canonicalTitle:
        context.membership.blueprintNode.titleZhHans ??
        context.localized.displayQuestion ??
        null,
      canonicalQuestion: context.localized.displayQuestion,
      nodeType: context.node.nodeType,
      registryStatus: context.node.registryStatus,
      registryVersion: context.node.version
    },
    hierarchy: hierarchy(authority, context),
    canonicalThesis: {
      thesisVersion: null,
      statement: null,
      mechanism: null,
      necessity: null,
      systemRole: null,
      continuity: {
        fromPreviousNode: null,
        toNextNode: null
      }
    },
    articleBoundary: {
      boundaryVersion: null,
      mustEstablish: [],
      requiredDistinctions: [],
      mustNotClaim: {
        global: [],
        partSpecific: [],
        nodeSpecific: []
      },
      includedScope: [],
      excludedScope: [],
      assumptions: [],
      unresolvedQuestions: []
    },
    supportingQuestionBoundary: context.questions.map(
      question => supportingQuestionSkeleton(question, locale)
    ),
    sequenceBoundary: {
      previousNode: previousNodes[0] ?? null,
      previousNodes,
      nextNode: nextNodes,
      previousNodeContribution: null,
      currentNodeTransformation: null,
      nextNodePreparation: null,
      partContribution: null,
      bookContribution: null,
      systemContribution: null
    },
    claimBoundary: {
      requiredClaimFamilies: [],
      allowedClaimTypes: [],
      sourceRequiredClaims: [],
      internalCanonicalClaims: [],
      interpretiveClaims: [],
      analogyOnlyStatements: [],
      prohibitedClaims: [],
      qualificationRequirements: []
    },
    sourceBoundary: {
      sourcePlanVersion: null,
      sourceRequirement: null,
      internalCanonicalSources: (context.node.sourceReferences ?? []).map(
        reference => reference.sourceCode
      ),
      externalSourceDomains: [],
      preferredSourceTypes: [],
      prohibitedSourceTypes: [],
      knownSources: context.sources.map(source => source.sourceCode),
      researchNeeded: true,
      verificationNeeded: true,
      citationSensitivity: null
    },
    figureBoundary: {
      figureRequirement: null,
      requiredFigures: [],
      optionalFigures: [],
      visualMechanism: null,
      prohibitedVisualClaims: [],
      accessibilityRequirements: [],
      assetSourceBoundary: null,
      sequence: ['media_brief', 'asset_registry', 'article_figure']
    },
    publicContentBoundary: {
      publicKnowledgeBoundary: null,
      paidBookBoundary: null,
      runtimeJourneyBoundary: null,
      professionalServiceBoundary: null,
      enterpriseBoundary: null,
      developerBoundary: null
    },
    localizationReadiness: {
      localizedTitle:
        context.membership.blueprintNode.titleZhHans ??
        context.localized.displayQuestion,
      localizedQuestion: context.localized.displayQuestion,
      canonicalThesisReady: false,
      articleBoundaryReady: false,
      supportingQuestionsReady: context.questions.length === 0,
      searchAliases: context.aliases.map(alias => alias.alias ?? alias),
      terminologyReview: locale === DEFAULT_READINESS_LOCALE ? 'not_applicable' : 'pending',
      languageStatus: context.localized.contentStatus ?? 'not_started'
    },
    productionReadiness: {
      status: 'production_blocked',
      productionPriority: context.membership.blueprintNode.productionPriority ?? null,
      registryStatus: context.node.registryStatus,
      blueprintMembership: 'registered',
      exportability: 'blocked',
      blockingFindings,
      missingFields
    },
    contentVersions: {
      thesisVersion: null,
      boundaryVersion: null,
      sourcePlanVersion: null,
      readinessVersion: '1.0.0'
    },
    versionBinding: versionBinding(authority, context.membership),
    review: {
      status: 'not_assessed',
      humanFreezeCompleted: false,
      humanReviewerId: null,
      humanReviewedAt: null,
      decisions: []
    }
  };
}

function deterministicArticleTreatment(question) {
  if (question.publicationPolicy === 'embedded_or_search_entry') return 'integrate';
  return 'briefly_address';
}

export function normalizeReadinessRecord(authority, context, raw) {
  if (raw.readinessSchemaVersion) return { ...raw, compatibilityMode: false };
  const base = buildReadinessSkeleton(authority, context.node.nodeCode, raw.articleIdentity.canonicalLanguage);
  const previousNodes = context.node.relationships?.prerequisiteNodeCodes ?? [];
  const nextNodes = context.node.relationships?.nextNodeCodes ?? [];
  return {
    ...base,
    compatibilityMode: true,
    legacyRecordVersion: raw.recordVersion ?? null,
    canonicalIdentity: {
      ...base.canonicalIdentity,
      canonicalTitle: raw.publicTitle,
      canonicalQuestion: raw.canonicalQuestion
    },
    canonicalThesis: {
      thesisVersion: raw.recordVersion ?? '1.0.0',
      statement: raw.centralThesis,
      mechanism: raw.requiredMechanisms.map(item => item.requirement).join(' '),
      necessity: raw.readerTransformation?.from ?? null,
      systemRole: raw.readerTransformation?.to ?? null,
      continuity: {
        fromPreviousNode: previousNodes.length
          ? `Continues from ${previousNodes.join(', ')}.`
          : 'Canonical entry node.',
        toNextNode: raw.nextNodeRequirement?.semanticBridge ?? (
          nextNodes.length ? `Prepares ${nextNodes.join(', ')}.` : 'Canonical terminal node.'
        )
      }
    },
    articleBoundary: {
      boundaryVersion: raw.recordVersion ?? '1.0.0',
      mustEstablish: raw.requiredMechanisms.map(item => ({
        mechanismCode: item.mechanismCode,
        statement: `${item.label}: ${item.requirement}`
      })),
      requiredDistinctions: raw.requiredDistinctions,
      mustNotClaim: {
        global: [],
        partSpecific: [],
        nodeSpecific: raw.prohibitedClaims
      },
      includedScope: raw.articleBoundary,
      excludedScope: raw.prohibitedClaims,
      assumptions: [],
      unresolvedQuestions: raw.sourceRequirement?.externalSourceNeeds ?? []
    },
    supportingQuestionBoundary: context.questions.map(question => ({
      ...supportingQuestionSkeleton(question, raw.articleIdentity.canonicalLanguage),
      coverageRole: 'canonical_support',
      articleTreatment: deterministicArticleTreatment(question),
      searchAliasEligibility: true,
      supportingContentEligibility: true
    })),
    sequenceBoundary: {
      previousNode: previousNodes[0] ?? null,
      previousNodes,
      nextNode: nextNodes,
      previousNodeContribution: previousNodes.length
        ? `Continues registered input from ${previousNodes.join(', ')}.`
        : 'Canonical entry node.',
      currentNodeTransformation: raw.readerTransformation?.to ?? null,
      nextNodePreparation: raw.nextNodeRequirement?.semanticBridge ?? null,
      partContribution: raw.centralThesis,
      bookContribution: raw.centralThesis,
      systemContribution: raw.centralThesis
    },
    claimBoundary: {
      requiredClaimFamilies: [...new Set(
        (raw.claimDossier?.claims ?? []).map(claim => claim.claimType)
      )],
      allowedClaimTypes: authority.claimGovernance.claimGovernance.claimTypes,
      sourceRequiredClaims: (raw.claimDossier?.claims ?? [])
        .filter(claim => claim.sourceRequired)
        .map(claim => claim.claimId),
      internalCanonicalClaims: (raw.claimDossier?.claims ?? [])
        .filter(claim => claim.claimType === 'phi_os_interpretation')
        .map(claim => claim.claimId),
      interpretiveClaims: (raw.claimDossier?.claims ?? [])
        .filter(claim => claim.claimType === 'phi_os_interpretation')
        .map(claim => claim.claimId),
      analogyOnlyStatements: [],
      prohibitedClaims: raw.prohibitedClaims,
      qualificationRequirements: (raw.claimDossier?.claims ?? [])
        .map(claim => claim.qualification)
        .filter(Boolean)
    },
    sourceBoundary: {
      sourcePlanVersion: raw.recordVersion ?? '1.0.0',
      sourceRequirement: raw.sourceRequirement,
      internalCanonicalSources: raw.sourceRequirement?.registeredPrimarySourceCodes ?? [],
      externalSourceDomains: raw.sourceRequirement?.externalSourceNeeds ?? [],
      preferredSourceTypes: raw.sourceRequirement?.externalSourcePreference ?? [],
      prohibitedSourceTypes: [],
      knownSources: raw.sourceRequirement?.registeredPrimarySourceCodes ?? [],
      researchNeeded: Boolean(raw.sourceRequirement?.externalSourceNeeds?.length),
      verificationNeeded: true,
      citationSensitivity: 'high'
    },
    figureBoundary: {
      figureRequirement: raw.visualRequirement?.visualRequired ? 'required' : 'not_required',
      requiredFigures: raw.visualRequirement?.visualRequired ? [raw.visualRequirement] : [],
      optionalFigures: [],
      visualMechanism: raw.visualRequirement?.purpose ?? null,
      prohibitedVisualClaims: raw.visualRequirement?.mustNotDo ?? [],
      accessibilityRequirements:
        raw.visualRequirement?.registryRequirement?.requiredFields ?? [],
      assetSourceBoundary: raw.visualRequirement?.registryRequirement ?? null,
      sequence: ['media_brief', 'asset_registry', 'article_figure']
    },
    publicContentBoundary: {
      publicKnowledgeBoundary: raw.articleBoundary,
      paidBookBoundary: 'Public article must not reproduce restricted paid content.',
      runtimeJourneyBoundary: 'Public article must not create or replace a Runtime Reading.',
      professionalServiceBoundary:
        'Public article must not diagnose, recommend, or replace Professional Review.',
      enterpriseBoundary: 'Public article is not an enterprise implementation.',
      developerBoundary: 'Public article is not internal developer documentation.'
    },
    localizationReadiness: {
      ...base.localizationReadiness,
      canonicalThesisReady: true,
      articleBoundaryReady: true,
      supportingQuestionsReady: true
    },
    productionReadiness: {
      status: 'production_ready',
      productionPriority: context.membership?.blueprintNode.productionPriority ?? null,
      registryStatus: context.node.registryStatus,
      blueprintMembership: 'registered',
      exportability: 'exportable',
      blockingFindings: [],
      missingFields: []
    },
    contentVersions: {
      thesisVersion: raw.recordVersion ?? '1.0.0',
      boundaryVersion: raw.recordVersion ?? '1.0.0',
      sourcePlanVersion: raw.recordVersion ?? '1.0.0',
      readinessVersion: raw.recordVersion ?? '1.0.0'
    },
    versionBinding: versionBinding(authority, context.membership),
    review: {
      status: 'canonical_thesis_frozen',
      humanFreezeCompleted: true,
      humanReviewerId: null,
      humanReviewedAt: null,
      decisions: [
        {
          authority: raw.contract,
          decision: 'Production Brief input authorized; article approval not granted.'
        }
      ]
    }
  };
}

export async function readReadinessRecord(authority, nodeCode, locale) {
  const relativePath = readinessRelativePath(nodeCode, locale);
  try {
    const raw = JSON.parse(await fs.readFile(path.join(authority.root, relativePath), 'utf8'));
    const context = contextForNode(authority, nodeCode, locale);
    return {
      relativePath,
      raw,
      normalized: normalizeReadinessRecord(authority, context, raw),
      context,
      legacy: !raw.readinessSchemaVersion
    };
  } catch (error) {
    if (error instanceof ReadinessError) throw error;
    if (error.code === 'ENOENT') {
      throw new ReadinessError(
        'READINESS_FILE_NOT_FOUND',
        `Readiness file is missing for ${nodeCode}/${locale}.`,
        `Run knowledge:init-readiness for ${nodeCode}.`
      );
    }
    throw new ReadinessError(
      'READINESS_SCHEMA_INVALID',
      `Readiness file is invalid JSON for ${nodeCode}/${locale}.`,
      null,
      error.message
    );
  }
}

function present(value) {
  return value !== null && value !== undefined && (
    typeof value !== 'string' || value.trim().length > 0
  );
}

function comparable(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

function addOnce(findings, value) {
  if (!findings.some(item => item.code === value.code && item.field === value.field)) {
    findings.push(value);
  }
}

export function validateReadinessRecord(authority, record) {
  const { context, normalized } = record;
  const findings = [];
  const structuralErrors = [];
  if (
    normalized.nodeCode !== context.node.nodeCode ||
    normalized.canonicalIdentity?.nodeCode !== context.node.nodeCode ||
    normalized.canonicalIdentity?.canonicalQuestionKey !== context.node.canonicalQuestionKey
  ) {
    structuralErrors.push(finding(
      'CANONICAL_IDENTITY_MISMATCH',
      'Readiness Canonical Identity differs from Registry.',
      'canonicalIdentity'
    ));
  }
  const expectedHierarchy = hierarchy(authority, context);
  for (const field of [
    'bookCode', 'partCode', 'domainCode', 'themeCode', 'nodeCode', 'nodeType'
  ]) {
    if ((normalized.hierarchy?.[field] ?? null) !== (expectedHierarchy[field] ?? null)) {
      structuralErrors.push(finding(
        'CANONICAL_HIERARCHY_MISMATCH',
        `Hierarchy ${field} differs from Registry/Blueprint.`,
        `hierarchy.${field}`
      ));
    }
  }
  if (!context.membership) {
    structuralErrors.push(finding(
      'BLUEPRINT_MEMBERSHIP_MISMATCH',
      'Registered Node has no registered Blueprint membership.',
      'hierarchy'
    ));
  }
  const statement = normalized.canonicalThesis?.statement;
  if (!present(statement)) {
    addOnce(findings, finding(
      'CANONICAL_THESIS_NOT_READY',
      'Canonical Thesis statement is missing.',
      'canonicalThesis.statement'
    ));
  } else if (
    comparable(statement) === comparable(normalized.canonicalIdentity.canonicalQuestion) ||
    comparable(statement) === comparable(normalized.canonicalIdentity.canonicalTitle)
  ) {
    addOnce(findings, finding(
      'CANONICAL_THESIS_NOT_READY',
      'Canonical Thesis cannot be the title or question restated.',
      'canonicalThesis.statement'
    ));
  }
  for (const field of ['mechanism', 'necessity', 'systemRole']) {
    if (!present(normalized.canonicalThesis?.[field])) {
      addOnce(findings, finding(
        'CANONICAL_THESIS_NOT_READY',
        `Canonical Thesis ${field} is missing.`,
        `canonicalThesis.${field}`
      ));
    }
  }
  for (const field of ['fromPreviousNode', 'toNextNode']) {
    if (!present(normalized.canonicalThesis?.continuity?.[field])) {
      addOnce(findings, finding(
        'CANONICAL_THESIS_NOT_READY',
        `Canonical Thesis continuity ${field} is missing.`,
        `canonicalThesis.continuity.${field}`
      ));
    }
  }
  const articleBoundary = normalized.articleBoundary ?? {};
  if (!(articleBoundary.mustEstablish?.length)) {
    addOnce(findings, finding(
      'MUST_ESTABLISH_MISSING',
      'Must Establish contains no independent mechanism.',
      'articleBoundary.mustEstablish'
    ));
  }
  const mustNotClaim = [
    ...(articleBoundary.mustNotClaim?.global ?? []),
    ...(articleBoundary.mustNotClaim?.partSpecific ?? []),
    ...(articleBoundary.mustNotClaim?.nodeSpecific ?? [])
  ];
  if (!mustNotClaim.length) {
    addOnce(findings, finding(
      'MUST_NOT_CLAIM_MISSING',
      'Must Not Claim is missing.',
      'articleBoundary.mustNotClaim'
    ));
  }
  if (!(articleBoundary.includedScope?.length)) {
    addOnce(findings, finding(
      'INCLUDED_SCOPE_MISSING',
      'Included Scope is missing.',
      'articleBoundary.includedScope'
    ));
  }
  if (!(articleBoundary.excludedScope?.length)) {
    addOnce(findings, finding(
      'EXCLUDED_SCOPE_MISSING',
      'Excluded Scope is missing.',
      'articleBoundary.excludedScope'
    ));
  }
  const mappings = normalized.supportingQuestionBoundary ?? [];
  const expectedQuestions = new Map(
    context.questions.map(question => [question.questionCode, question])
  );
  if (
    mappings.length !== expectedQuestions.size ||
    mappings.some(mapping => (
      !expectedQuestions.has(mapping.questionCode) ||
      mapping.primaryNodeCode !== context.node.nodeCode ||
      !ARTICLE_TREATMENTS.includes(mapping.articleTreatment) ||
      typeof mapping.searchAliasEligibility !== 'boolean' ||
      typeof mapping.supportingContentEligibility !== 'boolean'
    ))
  ) {
    addOnce(findings, finding(
      'SUPPORTING_QUESTION_MAPPING_INCOMPLETE',
      'Supporting Question primary ownership or treatment is incomplete.',
      'supportingQuestionBoundary'
    ));
  }
  const expectedPrevious = context.node.relationships?.prerequisiteNodeCodes ?? [];
  const expectedNext = context.node.relationships?.nextNodeCodes ?? [];
  if (
    normalized.sequenceBoundary?.previousNode !== (expectedPrevious[0] ?? null) ||
    JSON.stringify(normalized.sequenceBoundary?.previousNodes ?? []) !==
      JSON.stringify(expectedPrevious)
  ) {
    structuralErrors.push(finding(
      'PREVIOUS_NODE_MISMATCH',
      'Previous Node differs from Registry.',
      'sequenceBoundary.previousNode'
    ));
  }
  if (
    JSON.stringify(normalized.sequenceBoundary?.nextNode ?? []) !==
    JSON.stringify(expectedNext)
  ) {
    structuralErrors.push(finding(
      'NEXT_NODE_MISMATCH',
      'Next Node differs from Registry.',
      'sequenceBoundary.nextNode'
    ));
  }
  for (const field of [
    'previousNodeContribution',
    'currentNodeTransformation',
    'nextNodePreparation',
    'partContribution',
    'bookContribution',
    'systemContribution'
  ]) {
    if (!present(normalized.sequenceBoundary?.[field])) {
      addOnce(findings, finding(
        'NODE_CONTINUITY_MISMATCH',
        `Sequence contribution ${field} is not ready.`,
        `sequenceBoundary.${field}`
      ));
    }
  }
  if (
    !(normalized.claimBoundary?.requiredClaimFamilies?.length) ||
    !(normalized.claimBoundary?.allowedClaimTypes?.length) ||
    !(normalized.claimBoundary?.qualificationRequirements?.length)
  ) {
    addOnce(findings, finding(
      'CLAIM_BOUNDARY_NOT_READY',
      'Claim Boundary is incomplete.',
      'claimBoundary'
    ));
  }
  if (
    !present(normalized.sourceBoundary?.sourceRequirement) ||
    !present(normalized.sourceBoundary?.citationSensitivity)
  ) {
    addOnce(findings, finding(
      'SOURCE_BOUNDARY_NOT_READY',
      'Source Boundary is incomplete.',
      'sourceBoundary'
    ));
  }
  if (
    !present(normalized.figureBoundary?.figureRequirement) ||
    JSON.stringify(normalized.figureBoundary?.sequence) !==
      JSON.stringify(['media_brief', 'asset_registry', 'article_figure'])
  ) {
    addOnce(findings, finding(
      'FIGURE_BOUNDARY_NOT_READY',
      'Figure Boundary is incomplete or has an invalid sequence.',
      'figureBoundary'
    ));
  }
  const publicBoundary = normalized.publicContentBoundary ?? {};
  if ([
    'publicKnowledgeBoundary',
    'paidBookBoundary',
    'runtimeJourneyBoundary',
    'professionalServiceBoundary',
    'enterpriseBoundary',
    'developerBoundary'
  ].some(field => !present(publicBoundary[field]))) {
    addOnce(findings, finding(
      'PUBLIC_BOUNDARY_NOT_READY',
      'Public, paid, Runtime, professional, enterprise or developer boundary is incomplete.',
      'publicContentBoundary'
    ));
  }
  if (
    !normalized.localizationReadiness?.canonicalThesisReady ||
    !normalized.localizationReadiness?.articleBoundaryReady ||
    !normalized.localizationReadiness?.supportingQuestionsReady
  ) {
    addOnce(findings, finding(
      'LOCALIZED_CONTENT_NOT_READY',
      'Locale-specific Thesis, Boundary or Supporting Questions are not ready.',
      'localizationReadiness'
    ));
  }
  const binding = normalized.versionBinding ?? {};
  if ([
    'registryVersion',
    'registryHash',
    'blueprintVersion',
    'blueprintPath',
    'editorialContractVersion',
    'articleSchemaVersion',
    'claimGovernanceVersion',
    'exporterVersion'
  ].some(field => !present(binding[field]))) {
    addOnce(findings, finding(
      'VERSION_BINDING_MISSING',
      'One or more required version bindings are missing.',
      'versionBinding'
    ));
  }
  const declaredStatus = normalized.productionReadiness?.status;
  if (!READINESS_STATUSES.includes(declaredStatus)) {
    structuralErrors.push(finding(
      'PRODUCTION_STATUS_INVALID',
      `Unsupported Production Readiness status: ${declaredStatus}.`,
      'productionReadiness.status'
    ));
  }
  if (
    normalized.productionReadiness?.blockingFindings?.length &&
    declaredStatus === 'production_ready'
  ) {
    addOnce(findings, finding(
      'BLOCKING_FINDINGS_PRESENT',
      'A production_ready record cannot contain Blocking Findings.',
      'productionReadiness.blockingFindings'
    ));
  }
  const productionReady = (
    structuralErrors.length === 0 &&
    findings.length === 0 &&
    declaredStatus === 'production_ready' &&
    normalized.review?.humanFreezeCompleted === true
  );
  if (declaredStatus === 'production_ready' && !productionReady) {
    addOnce(findings, finding(
      'PRODUCTION_READY_REQUIREMENTS_NOT_MET',
      'Declared production_ready state does not satisfy all requirements.',
      'productionReadiness.status'
    ));
  }
  return {
    nodeCode: context.node.nodeCode,
    locale: normalized.locale,
    relativePath: record.relativePath,
    legacy: record.legacy,
    normalized,
    structurallyValid: structuralErrors.length === 0,
    structuralErrors,
    findings,
    productionReady,
    exportability: productionReady ? 'exportable' : 'blocked',
    productionStatus: productionReady
      ? 'production_ready'
      : declaredStatus === 'ready_for_editorial_review'
        ? declaredStatus
        : 'production_blocked'
  };
}

function bigrams(value) {
  const normalized = comparable(value);
  if (normalized.length < 2) return new Set([normalized]);
  return new Set([...normalized].slice(0, -1).map((character, index) => (
    `${character}${normalized[index + 1]}`
  )));
}

function jaccard(left, right) {
  const intersection = [...left].filter(value => right.has(value)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export function auditThesisDuplication(results) {
  const findings = [];
  const withThesis = results.filter(
    result => present(result.normalized.canonicalThesis?.statement)
  );
  for (let leftIndex = 0; leftIndex < withThesis.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < withThesis.length;
      rightIndex += 1
    ) {
      const left = withThesis[leftIndex];
      const right = withThesis[rightIndex];
      const exact = comparable(left.normalized.canonicalThesis.statement) ===
        comparable(right.normalized.canonicalThesis.statement);
      const similarity = jaccard(
        bigrams(left.normalized.canonicalThesis.statement),
        bigrams(right.normalized.canonicalThesis.statement)
      );
      if (exact || similarity >= 0.92) {
        findings.push({
          code: 'CANONICAL_THESIS_DUPLICATED',
          classification: 'canonical_duplication',
          leftNodeCode: left.nodeCode,
          rightNodeCode: right.nodeCode,
          similarity
        });
      }
    }
  }
  return findings;
}

export function auditAuthorityIntegrity(authority) {
  const findings = [];
  const nodeCodes = new Set(authority.registeredNodes.map(node => node.nodeCode));
  const questionOwners = new Map();
  for (const question of authority.supportingQuestions.supportingQuestions) {
    if (questionOwners.has(question.questionCode)) {
      findings.push(finding(
        'SUPPORTING_QUESTION_MULTI_ASSIGNED',
        `Supporting Question ${question.questionCode} appears more than once.`,
        question.questionCode
      ));
    }
    questionOwners.set(question.questionCode, question.canonicalNodeCode);
    if (!nodeCodes.has(question.canonicalNodeCode)) {
      findings.push(finding(
        'SUPPORTING_QUESTION_NOT_FOUND',
        `Supporting Question ${question.questionCode} has an unregistered Canonical owner.`,
        question.questionCode
      ));
    }
  }
  for (const node of authority.registeredNodes) {
    for (const nextNodeCode of node.relationships?.nextNodeCodes ?? []) {
      const next = authority.registeredNodes.find(item => item.nodeCode === nextNodeCode);
      if (
        !next ||
        !(next.relationships?.prerequisiteNodeCodes ?? []).includes(node.nodeCode)
      ) {
        findings.push(finding(
          'NODE_CONTINUITY_MISMATCH',
          `${node.nodeCode} → ${nextNodeCode} is not reciprocal in Registry.`,
          node.nodeCode
        ));
      }
    }
  }
  for (const learningPath of authority.learningPaths.learningPaths) {
    for (const nodeCode of learningPath.nodeCodes) {
      if (!nodeCodes.has(nodeCode)) {
        findings.push(finding(
          'LEARNING_PATH_MISMATCH',
          `${learningPath.pathCode} references unregistered ${nodeCode}.`,
          learningPath.pathCode
        ));
      }
    }
  }
  return findings;
}
