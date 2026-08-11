import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const VAP_W6_BASELINE = '1d4bc9e98d38c743b44f9659fd89d75bdbb1c0f7';
export const VAP_W6_CONTRACT = 'content/production/visual-article/contracts/vap-w6-batch-article-selection-production-brief-export-v1.json';
export const VAP_W6_POLICY = 'content/production/visual-article/policies/vap-w6-batch-selection-policy-v1.json';
export const VAP_W6_SCHEMA = 'content/production/visual-article/schemas/vap-w6-batch-selection-v1.schema.json';
export const VAP_W6_BATCH = 'content/production/visual-article/batches/vap-article-batch-001-selection-v1.json';
export const VAP_W6_ACTIVATION = 'content/production/visual-article/activation/vap-w6-batch-production-brief-export-v1.json';
export const VAP_W5R_PORTFOLIO = 'content/production/visual-article/portfolio/scalable-article-production-portfolio-v1.json';
export const VAP_W4R_EXECUTION = 'content/production/visual-article/eligibility/visual-article-execution-eligibility-v1.json';
export const VAP_W6A_EXECUTION = 'content/production/visual-article/eligibility/vap-article-batch-001-execution-eligibility-v1.json';
export const PJA_WAVE_CONTRACT = 'content/knowledge/production/waves/wave-production-contract.json';
export const LOCALE_PROJECTION_REGISTRY = 'content/knowledge/l10n/multilingual-node-projection-registry.json';
export const LOCALE_CONTROLLED_VALUES = 'content/knowledge/l10n/locale-controlled-values.json';
export const EXISTING_PJA_EXPORTER = 'scripts/export-knowledge-production-brief.mjs';
export const DEFAULT_BATCH_CODE = 'VAP-ARTICLE-BATCH-001';

const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
export const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;

const sourceDigest = (root, relative) => `sha256:${sha(fs.readFileSync(path.join(root, relative), 'utf8'))}`;

function localeRecordFor(registry, nodeCode, locale) {
  return (registry.records || []).find(record => record.nodeCode === nodeCode)?.locales?.[locale] || null;
}

export function isLocaleBriefReady(record) {
  return Boolean(
    record &&
    record.availability === 'available' &&
    record.authority && record.authority !== 'unassigned' &&
    record.translationMode && record.translationMode !== 'none' &&
    record.stalenessStatus !== 'stale'
  );
}

function executionEntryFor(w4r, nodeCode, locale) {
  return (w4r.entries || []).find(entry => entry.nodeCode === nodeCode && entry.locale === locale) || null;
}

function buildExportBlockers({ portfolioEntry, executionEntry, localeReady }) {
  const blockers = [];

  if (portfolioEntry.publication?.existingPublishedArticle) blockers.push('EXISTING_PUBLISHED_ARTICLE_REGENERATION_FORBIDDEN');
  if (portfolioEntry.productionDecision?.status === 'HUMAN_KPP_PRODUCTION_DECISION_REQUIRED' &&
      portfolioEntry.kppArticleEligibility?.status === 'ARTICLE_ELIGIBILITY_ASSESSMENT_REQUIRED_BEFORE_NEW_ARTICLE_DECISION') {
    blockers.push('KPP_ARTICLE_ELIGIBILITY_ASSESSMENT_REQUIRED');
  }
  if (portfolioEntry.productionDecision?.status === 'HUMAN_KPP_PRODUCTION_DECISION_REQUIRED') {
    blockers.push('HUMAN_KPP_PRODUCTION_DECISION_REQUIRED');
    blockers.push('FROZEN_ARTICLE_PRODUCTION_PLAN_REQUIRED');
    blockers.push('FROZEN_ARTICLE_PRODUCTION_WAVE_REQUIRED');
  }
  if ((portfolioEntry.readiness?.blocking || []).includes('C2_THESIS_BOUNDARY_NOT_FROZEN')) {
    blockers.push('C2_THESIS_BOUNDARY_NOT_FROZEN');
  }
  if (portfolioEntry.readiness?.productionReady !== true) blockers.push('C3_PRODUCTION_READINESS_NOT_PASSED');
  if (!executionEntry) {
    blockers.push('W4R_NEW_ARTICLE_EXECUTION_ELIGIBILITY_NOT_ESTABLISHED');
  } else if (executionEntry.articleExecutionEligible !== true) {
    blockers.push('W4R_NEW_ARTICLE_EXECUTION_ELIGIBILITY_NOT_PASSED');
    for (const reason of executionEntry.nonExecutionReasons || []) blockers.push(`W4R:${reason}`);
  }
  if (!localeReady) blockers.push('LOCALE_BRIEF_READINESS_NOT_PASSED');

  return [...new Set(blockers)];
}

function selectionCandidates(portfolio, policy) {
  const preferredIndex = new Map(policy.preferredPortfolioStatesInOrder.map((state, index) => [state, index]));
  return portfolio.entries
    .map((entry, canonicalIndex) => ({ entry, canonicalIndex }))
    .filter(({ entry }) => preferredIndex.has(entry.portfolioState))
    .filter(({ entry }) => !(policy.excludedPortfolioStates || []).includes(entry.portfolioState))
    .sort((a, b) => {
      const stateDelta = preferredIndex.get(a.entry.portfolioState) - preferredIndex.get(b.entry.portfolioState);
      return stateDelta || a.canonicalIndex - b.canonicalIndex;
    });
}

function selectedEntry({ portfolioEntry, selectionIndex, defaultLocale, localeRegistry, w4r }) {
  const localeRecord = localeRecordFor(localeRegistry, portfolioEntry.nodeCode, defaultLocale);
  const localeReady = isLocaleBriefReady(localeRecord);
  const executionEntry = executionEntryFor(w4r, portfolioEntry.nodeCode, defaultLocale);
  const blockers = buildExportBlockers({ portfolioEntry, executionEntry, localeReady });

  return {
    selectionIndex,
    nodeCode: portfolioEntry.nodeCode,
    bookCode: portfolioEntry.bookCode,
    partCode: portfolioEntry.partCode,
    chapterCode: portfolioEntry.chapterCode,
    titleZhHans: portfolioEntry.titleZhHans,
    titleEn: portfolioEntry.titleEn,
    canonicalVersion: portfolioEntry.canonicalVersion,
    portfolioState: portfolioEntry.portfolioState,
    selectionStatus: 'SELECTED_FOR_GOVERNED_ARTICLE_DECISION_REVIEW',
    selectionReason: portfolioEntry.portfolioState === 'EXPLICIT_ARTICLE_INTENT'
      ? 'EXPLICIT_ARTICLE_INTENT_PRIORITY'
      : 'BLUEPRINT_ARTICLE_REQUIRED_NOW_HIGH_SIGNAL',
    humanProductionDecisionRequired: portfolioEntry.productionDecision?.status === 'HUMAN_KPP_PRODUCTION_DECISION_REQUIRED',
    planningSignals: portfolioEntry.planningSignals,
    articleEligibility: {
      status: portfolioEntry.kppArticleEligibility?.status || null,
      articleRoleAutoAssigned: false
    },
    readiness: portfolioEntry.readiness,
    locale: {
      requestedLocale: defaultLocale,
      readyForBrief: localeReady,
      availability: localeRecord?.availability || null,
      authority: localeRecord?.authority || null,
      translationMode: localeRecord?.translationMode || null,
      stalenessStatus: localeRecord?.stalenessStatus || null
    },
    executionEligibility: executionEntry ? {
      evaluatedByW4r: true,
      articleIntent: executionEntry.articleIntent,
      newArticleExecutionEligible: executionEntry.articleExecutionEligible,
      status: executionEntry.articleExecutionStatus,
      nonExecutionReasons: executionEntry.nonExecutionReasons || []
    } : {
      evaluatedByW4r: false,
      articleIntent: null,
      newArticleExecutionEligible: false,
      status: 'NOT_YET_ESTABLISHED_FOR_SELECTED_BATCH',
      nonExecutionReasons: []
    },
    productionBriefExport: {
      ready: blockers.length === 0,
      status: blockers.length === 0 ? 'READY_FOR_EXISTING_PJA_EXPORTER' : 'BLOCKED_PENDING_GOVERNANCE',
      exporter: EXISTING_PJA_EXPORTER,
      blockers
    }
  };
}

export function buildVapW6BatchSelection(root) {
  const contract = readJson(root, VAP_W6_CONTRACT);
  const policy = readJson(root, VAP_W6_POLICY);
  const portfolio = readJson(root, VAP_W5R_PORTFOLIO);
  const w4r = readJson(root, VAP_W4R_EXECUTION);
  const waveContract = readJson(root, PJA_WAVE_CONTRACT);
  const localeRegistry = readJson(root, LOCALE_PROJECTION_REGISTRY);
  const localeValues = readJson(root, LOCALE_CONTROLLED_VALUES);

  if (contract.implementationBaselineCommit !== VAP_W6_BASELINE) throw new Error('VAP_W6_BASELINE_CONTRACT_MISMATCH');
  if (portfolio.status !== 'SCALABLE_ARTICLE_PRODUCTION_PORTFOLIO_ACTIVE') throw new Error('VAP_W6_W5R_PORTFOLIO_NOT_ACTIVE');
  if (w4r.status !== 'ARTICLE_INTENT_AND_EXECUTION_ELIGIBILITY_RECONCILED') throw new Error('VAP_W6_W4R_EXECUTION_RECONCILIATION_REQUIRED');
  if (policy.authority !== 'DECISION_SUPPORT_ONLY') throw new Error('VAP_W6_SELECTION_POLICY_MUST_BE_DECISION_SUPPORT_ONLY');
  if (policy.generalBacklogAutoFill !== false) throw new Error('VAP_W6_GENERAL_BACKLOG_AUTOFILL_FORBIDDEN');
  if (waveContract.maximumSizes?.mature !== policy.maximumBatchSize) throw new Error('VAP_W6_BATCH_SIZE_MUST_INHERIT_PJA_MATURE_WAVE_MAXIMUM');
  if (waveContract.bulkHumanApprovalAllowed !== false) throw new Error('VAP_W6_BULK_HUMAN_APPROVAL_MUST_REMAIN_FORBIDDEN');
  if (!(localeValues.supportedLocales || []).includes(policy.defaultLocale)) throw new Error('VAP_W6_DEFAULT_LOCALE_NOT_SUPPORTED');

  const candidates = selectionCandidates(portfolio, policy);
  const selected = candidates.slice(0, policy.maximumBatchSize).map(({ entry }, index) => selectedEntry({
    portfolioEntry: entry,
    selectionIndex: index + 1,
    defaultLocale: policy.defaultLocale,
    localeRegistry,
    w4r
  }));

  const exportReady = selected.filter(entry => entry.productionBriefExport.ready);
  const localeReady = selected.filter(entry => entry.locale.readyForBrief);
  const c2Blocked = selected.filter(entry => entry.productionBriefExport.blockers.includes('C2_THESIS_BOUNDARY_NOT_FROZEN'));
  const humanDecisionBlocked = selected.filter(entry => entry.humanProductionDecisionRequired);
  const w4rNotEstablished = selected.filter(entry => entry.productionBriefExport.blockers.includes('W4R_NEW_ARTICLE_EXECUTION_ELIGIBILITY_NOT_ESTABLISHED'));

  const result = {
    schemaVersion: 'PHI-OS-VAP-W6-BATCH-ARTICLE-SELECTION-v1.0.0',
    batchCode: DEFAULT_BATCH_CODE,
    batchVersion: '1.0.0',
    work: 'VAP-W6',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    status: exportReady.length > 0
      ? 'GOVERNED_ARTICLE_REVIEW_COHORT_WITH_EXPORTABLE_NODES'
      : 'GOVERNED_ARTICLE_REVIEW_COHORT_AWAITING_PRODUCTION_GATES',
    baselineCommit: VAP_W6_BASELINE,
    selectionAuthority: 'DERIVED_RECOMMENDATION_ONLY',
    contractReference: VAP_W6_CONTRACT,
    policyReference: VAP_W6_POLICY,
    schemaReference: VAP_W6_SCHEMA,
    portfolioReference: VAP_W5R_PORTFOLIO,
    executionEligibilityReference: VAP_W4R_EXECUTION,
    selection: {
      mode: policy.selectionMode,
      maximumBatchSize: policy.maximumBatchSize,
      preferredPortfolioStatesInOrder: policy.preferredPortfolioStatesInOrder,
      generalBacklogAutoFill: policy.generalBacklogAutoFill,
      canonicalOrderingRequired: true,
      defaultLocale: policy.defaultLocale,
      selectedNodeCodes: selected.map(entry => entry.nodeCode)
    },
    summary: {
      portfolioArticlePlanningBacklogCount: portfolio.summary.articlePlanningBacklogCount,
      preferredSignalCandidateCount: candidates.length,
      selectedNodeCount: selected.length,
      remainingUnselectedPreferredSignalCount: Math.max(0, candidates.length - selected.length),
      generalBacklogNotAutoSelectedCount: portfolio.summary.articleDecisionRequiredCount,
      localeReadyForDefaultBriefCount: localeReady.length,
      c2BlockedCount: c2Blocked.length,
      humanProductionDecisionRequiredCount: humanDecisionBlocked.length,
      w4rExecutionEligibilityNotEstablishedCount: w4rNotEstablished.length,
      productionBriefExportReadyCount: exportReady.length,
      productionBriefExportReadyNodeCodes: exportReady.map(entry => entry.nodeCode),
      currentBriefExportCount: 0
    },
    humanDecisionRequest: {
      required: humanDecisionBlocked.length > 0,
      requiredNodeCount: humanDecisionBlocked.length,
      bulkApprovalAllowed: false,
      requestedDecisionPerNode: 'ARTICLE | OTHER_KPP_ROLE | DEFERRED',
      selectedNodeCodes: selected.map(entry => entry.nodeCode),
      selectionItselfDoesNotApproveArticleProduction: true
    },
    entries: selected,
    productionBriefExport: {
      runtimeStatus: exportReady.length > 0 ? 'PARTIAL_OR_FULL_EXPORT_AVAILABLE' : 'NO_ELIGIBLE_NODES_FAIL_CLOSED',
      wrapperCommand: 'npm run vap:batch:export-briefs -- --locale zh-Hans',
      existingExporterCommand: 'npm run knowledge:export-brief -- <NODE_CODE> --locale <LOCALE> --json-report',
      existingExporterPath: EXISTING_PJA_EXPORTER,
      existingExporterReimplemented: false,
      zeroEligibleNodesIsValid: true
    },
    invariants: {
      selectionIsHumanProductionDecision: false,
      selectionAssignsArticleRole: false,
      selectionFreezesProductionPlan: false,
      selectionFreezesProductionWave: false,
      generalBacklogAutoFilled: false,
      publishedArticleRegenerationAllowed: false,
      explicitNonArticleWaveOutputSelected: false,
      c2ThesisBoundaryGatePreserved: true,
      c2ThesisBoundaryFailureCode: 'C2_THESIS_BOUNDARY_NOT_FROZEN',
      c3ProductionReadinessPreserved: true,
      humanProductionDecisionPreserved: true,
      w4rExecutionEligibilityRequiredForBriefExport: true,
      existingPjaExporterReimplemented: false,
      candidateCreationAllowed: false,
      providerInvocationAllowed: false,
      publicationAllowed: false
    },
    sourceDigests: {
      [VAP_W6_CONTRACT]: sourceDigest(root, VAP_W6_CONTRACT),
      [VAP_W6_POLICY]: sourceDigest(root, VAP_W6_POLICY),
      [VAP_W5R_PORTFOLIO]: sourceDigest(root, VAP_W5R_PORTFOLIO),
      [VAP_W4R_EXECUTION]: sourceDigest(root, VAP_W4R_EXECUTION),
      [PJA_WAVE_CONTRACT]: sourceDigest(root, PJA_WAVE_CONTRACT),
      [LOCALE_PROJECTION_REGISTRY]: sourceDigest(root, LOCALE_PROJECTION_REGISTRY),
      [LOCALE_CONTROLLED_VALUES]: sourceDigest(root, LOCALE_CONTROLLED_VALUES),
      [EXISTING_PJA_EXPORTER]: sourceDigest(root, EXISTING_PJA_EXPORTER)
    }
  };

  const digestInput = { ...result };
  delete digestInput.batchDigest;
  result.batchDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}

export function buildVapW6Activation(root, batch = buildVapW6BatchSelection(root)) {
  const result = {
    schemaVersion: 'PHI-OS-VAP-W6-BATCH-PRODUCTION-BRIEF-EXPORT-ACTIVATION-v1.0.0',
    activationCode: 'PHI-OS-VAP-W6-BATCH-PRODUCTION-BRIEF-EXPORT-ACTIVATION-v1',
    activationVersion: '1.0.0',
    work: 'VAP-W6',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    status: 'BATCH_SELECTION_AND_EXISTING_PJA_EXPORT_ORCHESTRATION_ACTIVE',
    baselineCommit: VAP_W6_BASELINE,
    contractReference: VAP_W6_CONTRACT,
    batchReference: VAP_W6_BATCH,
    batchDigest: batch.batchDigest,
    existingPjaRuntimeReuse: {
      exporterPath: EXISTING_PJA_EXPORTER,
      npmScript: 'knowledge:export-brief',
      batchWrapperScript: 'scripts/export-vap-w6-batch-production-briefs.mjs',
      batchWrapperNpmScript: 'vap:batch:export-briefs',
      singleNodeExporterReimplemented: false,
      wrapperAuthority: 'ORCHESTRATION_ONLY'
    },
    currentBatch: {
      batchCode: batch.batchCode,
      selectedNodeCount: batch.summary.selectedNodeCount,
      selectedNodeCodes: batch.selection.selectedNodeCodes,
      productionBriefExportReadyCount: batch.summary.productionBriefExportReadyCount,
      productionBriefExportReadyNodeCodes: batch.summary.productionBriefExportReadyNodeCodes,
      currentBriefExportCount: 0,
      currentStatus: batch.productionBriefExport.runtimeStatus
    },
    effects: {
      humanProductionDecisionCreated: false,
      productionPlanFrozen: false,
      productionWaveFrozen: false,
      productionBriefGeneratedByActivation: false,
      candidateCreated: false,
      providerInvoked: false,
      networkGenerationCallMade: false,
      publicationCreated: false
    },
    nextAction: 'Record per-node Human KPP Article decisions for the selected cohort, complete C2 thesis/boundary freeze and C3 readiness, freeze the Article production plan/wave, establish W4R new-Article execution eligibility, then run the batch brief exporter.',
    sourceDigests: {
      [VAP_W6_BATCH]: `sha256:${sha(stableJson(batch))}`,
      [EXISTING_PJA_EXPORTER]: sourceDigest(root, EXISTING_PJA_EXPORTER)
    }
  };
  const digestInput = { ...result };
  delete digestInput.activationDigest;
  result.activationDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}

export function buildVapW6ExportPlan(root, batch, locale) {
  const w4r = readJson(root, VAP_W4R_EXECUTION);
  const w6a = fs.existsSync(path.join(root, VAP_W6A_EXECUTION)) ? readJson(root, VAP_W6A_EXECUTION) : null;
  const localeRegistry = readJson(root, LOCALE_PROJECTION_REGISTRY);
  const supported = readJson(root, LOCALE_CONTROLLED_VALUES).supportedLocales || [];
  if (!supported.includes(locale)) throw new Error(`VAP_W6_UNSUPPORTED_LOCALE:${locale}`);

  const entries = batch.entries.map(entry => {
    const localeRecord = localeRecordFor(localeRegistry, entry.nodeCode, locale);
    const localeReady = isLocaleBriefReady(localeRecord);
    const w4rExecutionEntry = executionEntryFor(w4r, entry.nodeCode, locale);
    const w6aExecutionEntry = (w6a?.entries || []).find(item => item.nodeCode === entry.nodeCode && item.locale === locale) || null;
    const executionEntry = w6aExecutionEntry?.articleExecutionEligible === true ? w6aExecutionEntry : w4rExecutionEntry;
    const executionSource = w6aExecutionEntry?.articleExecutionEligible === true ? 'VAP-W6A' : 'VAP-W4R';
    const blockers = [];
    if (!localeReady) blockers.push('LOCALE_BRIEF_READINESS_NOT_PASSED');
    if (!executionEntry) blockers.push('W4R_NEW_ARTICLE_EXECUTION_ELIGIBILITY_NOT_ESTABLISHED');
    else if (executionEntry.articleExecutionEligible !== true) {
      blockers.push('W4R_NEW_ARTICLE_EXECUTION_ELIGIBILITY_NOT_PASSED');
      for (const reason of executionEntry.nonExecutionReasons || []) blockers.push(`W4R:${reason}`);
    }
    const unique = [...new Set(blockers)];
    return {
      nodeCode: entry.nodeCode,
      locale,
      exportReady: unique.length === 0,
      blockers: unique,
      executionEligibilitySource: executionSource,
      exporter: EXISTING_PJA_EXPORTER
    };
  });

  return {
    schemaVersion: 'PHI-OS-VAP-W6-BATCH-PRODUCTION-BRIEF-EXPORT-PLAN-v1.0.0',
    batchCode: batch.batchCode,
    locale,
    selectedNodeCount: batch.entries.length,
    exportReadyNodeCodes: entries.filter(entry => entry.exportReady).map(entry => entry.nodeCode),
    blockedNodeCodes: entries.filter(entry => !entry.exportReady).map(entry => entry.nodeCode),
    entries
  };
}
