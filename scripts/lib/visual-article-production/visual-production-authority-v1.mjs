import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const VAP_W3_BASELINE = 'bdd9adf0dd28a6de47488089507228eb165e72db';
export const VAP_W3_CONTRACT = 'content/production/visual-article/contracts/vap-w3-visual-production-authority-v1.json';
export const VAP_W3_AUTHORITY = 'content/production/visual-article/authority/vap-w3-visual-production-authority-v1.json';

export const VAP_W3_SOURCES = [
  'content/production/visual-article/deployment/vap-w2-cloudflare-production-sha-verification-v1.json',
  'content/knowledge/production-planning/freeze/kpp-w29-knowledge-production-planning-v2-freeze.json',
  'content/knowledge/production-planning/activation/wave1-production-authorized-v1.json',
  'content/knowledge/production-planning/production/wave1/execution-authority-reconciliation-v1.json',
  'content/knowledge/production-planning/production/wave1/frozen-production-plan-v1.json',
  'content/knowledge/production-planning/production/wave1/frozen-production-wave-v1.json',
  'content/knowledge/production-planning/production/wave1/handoffs/pja-handoff-v1.json',
  'content/knowledge/production-planning/production/wave1/handoffs/car-handoff-v1.json',
  'content/knowledge/editorial/c3/assessments/kn-preface-004-production-readiness.json',
  'content/knowledge/articles/zh-Hans/why-phi-os-is-needed.json',
  'content/knowledge/articles/en/why-phi-os-is-needed.json',
  'content/knowledge/public/authority/published-knowledge-authority.json',
  'content/knowledge/public/retrieval/fragments.json',
  'content/professional/canonical-meaning-runtime/registries/canonical-meaning-knowledge-map-v1.2.json',
  'content/professional/canonical-asset-runtime/freeze/car-w18-freeze-v1.json',
  'content/professional/canonical-asset-runtime/contracts/canonical-asset-brief-runtime-v1.json',
  'content/professional/canonical-asset-runtime/contracts/car-asset-candidate-runtime-v1.json',
  'content/professional/canonical-asset-runtime/policies/car-provider-execution-policy-v1.json',
  'content/professional/canonical-asset-runtime/contracts/car-asset-publication-runtime-v1.json',
  'content/professional/canonical-asset-runtime/contracts/car-article-reconciliation-contract-v1.json',
  'content/professional/canonical-asset-runtime/registries/canonical-asset-type-registry-v1.json',
  'content/professional/canonical-asset-runtime/registries/canonical-article-reference-registry-v1.json',
  'content/professional/canonical-presentation-runtime/freeze/cpr-w7-w30-full-freeze-v1.json',
  'content/professional/canonical-presentation-runtime/registries/canonical-presentation-registry-v1.json',
  'scripts/export-knowledge-production-brief.mjs',
  'scripts/lib/canonical-asset-runtime/canonical-asset-brief-v1.mjs'
];

const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
export const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;
export const valueDigest = value => `sha256:${crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex')}`;

function hasGit(root) {
  return fs.existsSync(path.join(root, '.git'));
}

export function readBaselineText(root, relative, baseline = VAP_W3_BASELINE) {
  if (hasGit(root)) {
    try {
      return normalize(execFileSync('git', ['show', `${baseline}:${relative}`], { cwd: root, encoding: 'utf8', windowsHide: true }));
    } catch (error) {
      throw new Error(`VAP_W3_BASELINE_SOURCE_UNAVAILABLE:${relative}:${error.message}`);
    }
  }
  return normalize(fs.readFileSync(path.join(root, relative), 'utf8'));
}

export const readBaselineJson = (root, relative) => JSON.parse(readBaselineText(root, relative));

function findMeaningCandidates(map, nodeCode) {
  return (map.mappings || [])
    .filter(entry => {
      const authority = entry.knowledgeAuthority || {};
      return (authority.primaryNodeCodes || []).includes(nodeCode) || (authority.supportingNodeCodes || []).includes(nodeCode);
    })
    .map(entry => entry.meaningCode)
    .sort();
}

function publishedFragmentCount(fragments, nodeCode, locale = 'zh-Hans') {
  const records = fragments.fragments || fragments.records || [];
  return records.filter(record => record.nodeCode === nodeCode && record.locale === locale).length;
}

function publishedAuthorityCount(authority, nodeCode) {
  return (authority.records || []).filter(record => record.nodeCode === nodeCode).length;
}

function articleReferenceCount(registry, nodeCode) {
  return (registry.records || []).filter(record => record.nodeCode === nodeCode).length;
}

function assertSourceShape({ w2, kpp, authorized, reconciliation, plan, pja, car, carFreeze, carBrief, candidate, provider, publication, cprFreeze, cprRegistry }) {
  if (w2.status !== 'VERIFIED_CURRENT_MAIN_DEPLOYED' || w2.vapW3Allowed !== true) throw new Error('VAP_W3_W2_NOT_VERIFIED');
  if (kpp.status !== 'frozen' || kpp.productionStatus !== 'validation_only' || kpp.authority?.productionPlanningAuthority !== true) throw new Error('VAP_W3_KPP_AUTHORITY_INVALID');
  if (authorized.status !== 'AUTHORIZED_FOR_GOVERNED_PRODUCTION_BRIEF_GENERATION') throw new Error('VAP_W3_WAVE1_BRIEF_AUTHORIZATION_MISSING');
  if (authorized.gateSnapshot?.candidateCreationAllowed !== false || authorized.gateSnapshot?.providerInvocationAllowed !== false || authorized.gateSnapshot?.publicationAllowed !== false) throw new Error('VAP_W3_WAVE1_BOUNDARY_WIDENED');
  if (reconciliation.executionAuthority?.scope !== 'GOVERNED_HANDOFF_AND_BRIEF_GENERATION_ONLY') throw new Error('VAP_W3_EXECUTION_SCOPE_INVALID');
  if (reconciliation.executionAuthority?.candidateMaterializationAllowed !== false || reconciliation.executionAuthority?.providerInvocationAllowed !== false || reconciliation.executionAuthority?.networkCallAllowed !== false || reconciliation.executionAuthority?.publicationAllowed !== false) throw new Error('VAP_W3_EXECUTION_BOUNDARY_WIDENED');
  if (plan.status !== 'FROZEN' || plan.items?.length !== 4) throw new Error('VAP_W3_FROZEN_PLAN_INVALID');
  if (pja.authorityMode !== 'readiness_handoff_only' || pja.createsCandidate !== false || pja.createsArticle !== false || pja.createsPublication !== false) throw new Error('VAP_W3_PJA_HANDOFF_BOUNDARY_INVALID');
  if (car.authorityMode !== 'asset_need_handoff_only' || car.createsAssetBrief !== false || car.createsCandidate !== false || car.createsAsset !== false || car.createsPublication !== false) throw new Error('VAP_W3_CAR_HANDOFF_BOUNDARY_INVALID');
  if (carFreeze.productionStatus !== 'validation_only' || carFreeze.productionActivationAllowed !== false) throw new Error('VAP_W3_CAR_FREEZE_INVALID');
  if (!carBrief.gateOrder?.includes('publishedCoverageSufficient')) throw new Error('VAP_W3_CAR_PUBLISHED_COVERAGE_GATE_MISSING');
  if (candidate.invariants?.candidateMaySelfApprove !== false || candidate.invariants?.candidateMaySelfPublish !== false) throw new Error('VAP_W3_CAR_CANDIDATE_BOUNDARY_INVALID');
  if (provider.mode !== 'disabled' || provider.providersEnabled !== false || provider.networkCallsEnabled !== false) throw new Error('VAP_W3_PROVIDER_BOUNDARY_INVALID');
  if (publication.invariants?.publicationFailClosed !== true) throw new Error('VAP_W3_PUBLICATION_BOUNDARY_INVALID');
  if (cprFreeze.productionStatus !== 'contract_frozen' || cprFreeze.invariants?.productionPresentationRecordsCreated !== false) throw new Error('VAP_W3_CPR_FREEZE_INVALID');
  if ((cprRegistry.productionRecords || []).length !== 0) throw new Error('VAP_W3_CPR_PRODUCTION_RECORDS_NOT_EMPTY');
}

export function buildVapW3Authority(root) {
  const sourceDigests = Object.fromEntries(VAP_W3_SOURCES.map(relative => [relative, `sha256:${sha(readBaselineText(root, relative))}`]));
  const load = relative => readBaselineJson(root, relative);
  const w2 = load(VAP_W3_SOURCES[0]);
  const kpp = load(VAP_W3_SOURCES[1]);
  const authorized = load(VAP_W3_SOURCES[2]);
  const reconciliation = load(VAP_W3_SOURCES[3]);
  const plan = load(VAP_W3_SOURCES[4]);
  const wave = load(VAP_W3_SOURCES[5]);
  const pja = load(VAP_W3_SOURCES[6]);
  const car = load(VAP_W3_SOURCES[7]);
  const prefaceReadiness = load(VAP_W3_SOURCES[8]);
  const prefaceZh = load(VAP_W3_SOURCES[9]);
  const prefaceEn = load(VAP_W3_SOURCES[10]);
  const publishedAuthority = load(VAP_W3_SOURCES[11]);
  const fragments = load(VAP_W3_SOURCES[12]);
  const meaningMap = load(VAP_W3_SOURCES[13]);
  const carFreeze = load(VAP_W3_SOURCES[14]);
  const carBrief = load(VAP_W3_SOURCES[15]);
  const candidate = load(VAP_W3_SOURCES[16]);
  const provider = load(VAP_W3_SOURCES[17]);
  const publication = load(VAP_W3_SOURCES[18]);
  const articleReconciliation = load(VAP_W3_SOURCES[19]);
  const assetTypes = load(VAP_W3_SOURCES[20]);
  const articleRefs = load(VAP_W3_SOURCES[21]);
  const cprFreeze = load(VAP_W3_SOURCES[22]);
  const cprRegistry = load(VAP_W3_SOURCES[23]);
  const pjaExporter = readBaselineText(root, VAP_W3_SOURCES[24]);
  const carBuilder = readBaselineText(root, VAP_W3_SOURCES[25]);

  assertSourceShape({ w2, kpp, authorized, reconciliation, plan, pja, car, carFreeze, carBrief, candidate, provider, publication, cprFreeze, cprRegistry });

  const pjaExporterArticleOnly = pjaExporter.includes('Canonical Article Production Brief') && pjaExporter.includes("briefType: 'canonical_article_production_brief'");
  const carBuilderRequiresPublishedCoverage = carBuilder.includes('publishedCoverageSufficient') && carBuilder.includes('matchingFragments') && carBuilder.includes('meaningReferences.length > 0');
  if (!pjaExporterArticleOnly) throw new Error('VAP_W3_PJA_EXPORTER_ARTICLE_ONLY_ASSERTION_FAILED');
  if (!carBuilderRequiresPublishedCoverage) throw new Error('VAP_W3_CAR_BUILDER_GATE_ASSERTION_FAILED');

  const planByNode = new Map(plan.items.map(item => [item.nodeCode, item]));
  const authorizedByNode = new Map(authorized.selectedExecutionScope.map(item => [item.nodeCode, item]));
  const pjaNodes = new Set(pja.items.map(item => item.nodeCode));
  const carNodes = new Set(car.items.map(item => item.nodeCode));
  const figureType = (assetTypes.assetTypes || []).find(item => item.assetType === 'FIGURE');
  const diagramType = (assetTypes.assetTypes || []).find(item => item.assetType === 'DIAGRAM');
  const articleType = (assetTypes.assetTypes || []).find(item => item.assetType === 'ARTICLE');

  const p4Meaning003 = findMeaningCandidates(meaningMap, 'KN-B1-P4-003');
  const p4Meaning004 = findMeaningCandidates(meaningMap, 'KN-B1-P4-004');
  const prefaceMeaning = findMeaningCandidates(meaningMap, 'KN-PREFACE-004');

  const matrix = [
    {
      nodeCode: 'KN-PREFACE-004',
      productionRole: planByNode.get('KN-PREFACE-004')?.productionRole,
      primaryAuthority: 'PJA',
      kppDispatchConfirmed: pjaNodes.has('KN-PREFACE-004') && authorizedByNode.get('KN-PREFACE-004')?.briefGenerationAllowed === true,
      requiredOutputs: planByNode.get('KN-PREFACE-004')?.requiredOutputs || [],
      locale: 'zh-Hans',
      executionMode: 'EXISTING_ARTICLE_RECONCILIATION_FOR_VISUAL_RELEASE',
      existingPublication: {
        mode: planByNode.get('KN-PREFACE-004')?.existingPublicationMode,
        newArticleCandidateRequired: planByNode.get('KN-PREFACE-004')?.newArticleCandidateRequired,
        c3Reconciliation: prefaceReadiness.authority?.existingPublicationReconciliation,
        references: prefaceReadiness.authority?.existingPublishedContentReferences || [],
        zhHansPublicationStatus: prefaceZh.publicationStatus,
        enPublicationStatus: prefaceEn.publicationStatus,
        modernPublishedKnowledgeAuthorityRecords: publishedAuthorityCount(publishedAuthority, 'KN-PREFACE-004'),
        carArticleReferenceRecords: articleReferenceCount(articleRefs, 'KN-PREFACE-004')
      },
      primaryBriefAdapter: 'PJA_EXISTING_ARTICLE_RECONCILIATION_BRIEF_ADAPTER_REQUIRED',
      standardPjaArticleDraftExporterAllowed: false,
      secondaryVisualNeed: {
        required: true,
        requirementCode: planByNode.get('KN-PREFACE-004')?.visualReleaseRequirement,
        handoffSequence: ['KPP_PJA_PRIMARY_HANDOFF', 'PJA_RECONCILIATION_BRIEF', 'DERIVED_CAR_ASSET_NEED', 'CAR_DETERMINISTIC_ASSET_BRIEF'],
        target: 'CAR',
        changesKppPrimaryDispatch: false,
        meaningCandidates: prefaceMeaning,
        meaningSelectionResolved: false,
        currentPublishedFragmentCount: publishedFragmentCount(fragments, 'KN-PREFACE-004'),
        carDirectBriefExecutionReady: false
      },
      directBriefExecutionReady: false,
      candidateCreationAllowed: false
    },
    {
      nodeCode: 'KN-B1-P1-003',
      productionRole: planByNode.get('KN-B1-P1-003')?.productionRole,
      primaryAuthority: 'PJA',
      kppDispatchConfirmed: pjaNodes.has('KN-B1-P1-003') && authorizedByNode.get('KN-B1-P1-003')?.briefGenerationAllowed === true,
      requiredOutputs: planByNode.get('KN-B1-P1-003')?.requiredOutputs || [],
      locale: 'zh-Hans',
      executionMode: 'NEW_FRAGMENT_PRODUCTION_BRIEF',
      primaryBriefAdapter: 'PJA_FRAGMENT_PRODUCTION_BRIEF_ADAPTER_REQUIRED',
      standardPjaArticleDraftExporterAllowed: false,
      reason: 'The existing exporter is explicitly a canonical_article_production_brief and must not silently reinterpret a KPP FRAGMENT role as ARTICLE.',
      directBriefExecutionReady: false,
      candidateCreationAllowed: false
    },
    {
      nodeCode: 'KN-B1-P4-003',
      productionRole: planByNode.get('KN-B1-P4-003')?.productionRole,
      primaryAuthority: 'CAR',
      kppDispatchConfirmed: carNodes.has('KN-B1-P4-003') && authorizedByNode.get('KN-B1-P4-003')?.briefGenerationAllowed === true,
      requiredOutputs: planByNode.get('KN-B1-P4-003')?.requiredOutputs || [],
      locale: 'zh-Hans',
      executionMode: 'PREPUBLICATION_FIGURE_ASSET_BRIEF',
      primaryBriefAdapter: 'CAR_PREPUBLICATION_ASSET_BRIEF_ADAPTER_REQUIRED',
      registeredOutputAuthority: { FIGURE: figureType?.productionAuthority || null },
      currentPublishedFragmentCount: publishedFragmentCount(fragments, 'KN-B1-P4-003'),
      carPublishedCoverageGateRequired: carBrief.gateOrder.includes('publishedCoverageSufficient'),
      meaningCandidates: p4Meaning003,
      meaningSelectionResolved: false,
      directBriefExecutionReady: false,
      candidateCreationAllowed: false
    },
    {
      nodeCode: 'KN-B1-P4-004',
      productionRole: planByNode.get('KN-B1-P4-004')?.productionRole,
      primaryAuthority: 'CAR',
      kppDispatchConfirmed: carNodes.has('KN-B1-P4-004') && authorizedByNode.get('KN-B1-P4-004')?.briefGenerationAllowed === true,
      requiredOutputs: planByNode.get('KN-B1-P4-004')?.requiredOutputs || [],
      locale: 'zh-Hans',
      executionMode: 'PREPUBLICATION_MULTI_ASSET_BRIEF',
      primaryBriefAdapter: 'CAR_PREPUBLICATION_ASSET_BRIEF_ADAPTER_REQUIRED',
      registeredOutputAuthority: { FIGURE: figureType?.productionAuthority || null, DIAGRAM: diagramType?.productionAuthority || null },
      currentPublishedFragmentCount: publishedFragmentCount(fragments, 'KN-B1-P4-004'),
      carPublishedCoverageGateRequired: carBrief.gateOrder.includes('publishedCoverageSufficient'),
      meaningCandidates: p4Meaning004,
      meaningSelectionResolved: false,
      directBriefExecutionReady: false,
      candidateCreationAllowed: false
    }
  ];

  if (matrix.some(entry => entry.kppDispatchConfirmed !== true)) throw new Error('VAP_W3_DISPATCH_MATRIX_INCOMPLETE');
  if (articleType?.authorityMode !== 'reference_only' || articleType?.productionAuthority !== 'PJA') throw new Error('VAP_W3_ARTICLE_AUTHORITY_INVALID');
  if (figureType?.authorityMode !== 'car_native' || diagramType?.authorityMode !== 'car_native') throw new Error('VAP_W3_VISUAL_ASSET_AUTHORITY_INVALID');
  if (articleReconciliation.authorityMode !== 'reference_only' || articleReconciliation.invariants?.pjaAuthorityTransferred !== false) throw new Error('VAP_W3_ARTICLE_RECONCILIATION_BOUNDARY_INVALID');

  const findings = [
    {
      findingCode: 'VAP-W3-PJA-ARTICLE-RECONCILIATION-BRIEF-ADAPTER-REQUIRED',
      severity: 'P0',
      status: 'OPEN_FOR_VAP_W4',
      nodeCodes: ['KN-PREFACE-004'],
      reason: 'KPP requires reuse of an existing published article and no new ARTICLE candidate; the current PJA exporter is a new canonical article draft brief path.'
    },
    {
      findingCode: 'VAP-W3-PJA-FRAGMENT-BRIEF-ADAPTER-REQUIRED',
      severity: 'P0',
      status: 'OPEN_FOR_VAP_W4',
      nodeCodes: ['KN-B1-P1-003'],
      reason: 'The current PJA production brief exporter is ARTICLE-specific and cannot silently reinterpret FRAGMENT authority.'
    },
    {
      findingCode: 'VAP-W3-CAR-PREPUBLICATION-ASSET-BRIEF-ADAPTER-REQUIRED',
      severity: 'P0',
      status: 'OPEN_FOR_VAP_W4',
      nodeCodes: ['KN-B1-P4-003', 'KN-B1-P4-004', 'KN-PREFACE-004'],
      reason: 'CAR-W2 requires published fragment coverage, while these Wave 1 visual needs are authorized before matching Published Fragment coverage exists.'
    },
    {
      findingCode: 'VAP-W3-PREFACE004-MODERN-PUBLISHED-AUTHORITY-REFERENCE-GAP',
      severity: 'P1',
      status: 'OPEN_FOR_VAP_W4_RECONCILIATION',
      nodeCodes: ['KN-PREFACE-004'],
      observed: {
        legacyZhHansPublished: prefaceZh.publicationStatus === 'published',
        legacyEnPublished: prefaceEn.publicationStatus === 'published',
        modernPublishedKnowledgeAuthorityRecords: publishedAuthorityCount(publishedAuthority, 'KN-PREFACE-004'),
        carArticleReferenceRecords: articleReferenceCount(articleRefs, 'KN-PREFACE-004')
      },
      reason: 'The existing published article must be reconciled into modern reference lineage without duplicate publication or body mutation before CAR/CPR visual integration.'
    },
    {
      findingCode: 'VAP-W3-CAR-MEANING-SELECTION-GAP',
      severity: 'P1',
      status: 'OPEN_FOR_VAP_W4',
      nodeCodes: ['KN-PREFACE-004', 'KN-B1-P4-003', 'KN-B1-P4-004'],
      observed: {
        preface004MeaningCandidates: prefaceMeaning,
        p4_003MeaningCandidates: p4Meaning003,
        p4_004MeaningCandidates: p4Meaning004
      },
      reason: 'CAR brief construction requires governed meaningReferences. W3 records candidates but does not invent or silently select Canonical Meaning authority.'
    }
  ];

  const body = {
    authorityCode: 'PHI-OS-VAP-W3-VISUAL-PRODUCTION-AUTHORITY-v1',
    authorityVersion: '1.0.0',
    work: 'VAP-W3',
    status: 'VISUAL_PRODUCTION_AUTHORITY_FROZEN_READY_FOR_VAP_W4_ADAPTERS',
    implementationBaselineCommit: VAP_W3_BASELINE,
    contractReference: VAP_W3_CONTRACT,
    sourceDigestMode: 'GIT_BASELINE_CANONICAL_TEXT_LF',
    sourceDigests,
    prerequisiteEvidence: {
      vapW2Status: w2.status,
      vapW3Allowed: w2.vapW3Allowed,
      wave1AuthorizationStatus: authorized.status,
      wave1PlanStatus: plan.status,
      wave1WaveStatus: wave.status,
      executionAuthorityOwner: reconciliation.executionAuthority.owner,
      executionAuthorityScope: reconciliation.executionAuthority.scope
    },
    authorityAssignments: {
      productionDecisionAndPrimaryDispatch: 'KPP_WAVE1_PRODUCTION_OVERLAY',
      articleAndFragmentProduction: 'PJA',
      governedFigureAndDiagramProduction: 'CAR',
      presentationProjection: 'CPR_AFTER_GOVERNED_SOURCE_ASSET',
      publication: 'UNCHANGED_INDEPENDENT_GOVERNED_PUBLICATION_AUTHORITIES'
    },
    dispatchMatrix: matrix,
    compatibility: {
      kppBriefGenerationAuthorized: true,
      pjaBriefAuthorityAssigned: true,
      carAssetAuthorityAssigned: true,
      directBriefExecutionReady: false,
      adapterImplementationRequired: true,
      pjaStandardExporterArticleOnly: pjaExporterArticleOnly,
      carExistingBuilderRequiresPublishedCoverage: carBuilderRequiresPublishedCoverage,
      carProviderMode: provider.mode,
      carProvidersEnabled: provider.providersEnabled,
      carNetworkCallsEnabled: provider.networkCallsEnabled,
      cprProductionRecordCount: (cprRegistry.productionRecords || []).length
    },
    findings,
    gates: {
      actualProductionBriefGenerationAllowedByW3: false,
      candidateCreationAllowed: false,
      providerInvocationAllowed: false,
      networkCallAllowed: false,
      assetCandidateMaterializationAllowed: false,
      binaryAssetGenerationAllowed: false,
      cprProductionRecordCreationAllowed: false,
      publicationAllowed: false,
      vapW4Allowed: true
    },
    invariants: {
      kppPlanOrWaveMutated: false,
      humanProductionDecisionMutated: false,
      pjaOrCarFrozenAuthorityMutated: false,
      kppPrimaryDispatchRewrittenBySecondaryVisualNeed: false,
      canonicalMeaningInvented: false,
      duplicatePreface004ArticleCandidateAllowed: false,
      englishLocaleContaminationRepairedByW3: false
    },
    deferredFailClosedFindings: ['EN_LOCALE_CJK_CONTAMINATION', 'EN_HEADING_CJK_CONTAMINATION', 'EN_BODY_CJK_CONTAMINATION'],
    checkerIntegration: {
      wave1AggregateMustIncludeHumanProductionDecision: true,
      wave1AggregateMustIncludeProductionAuthorization: true,
      vapHistoricalAggregateScriptMustRemainW0Only: true
    },
    nextWork: 'VAP-W4_GOVERNED_BRIEF_ADAPTERS_AND_WAVE1_BRIEF_GENERATION'
  };
  return { ...body, authorityDigest: valueDigest(body) };
}
