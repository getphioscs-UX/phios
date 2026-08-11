import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildPortfolio as buildExistingPjaPortfolio } from '../knowledge-production/scalable-article-workflow.mjs';

export const VAP_W5R_BASELINE = '9c6ab5b198f6603a2e8ac3d95ef743b5b2694db9';
export const VAP_W5R_CONTRACT = 'content/production/visual-article/contracts/vap-w5r-scalable-article-production-portfolio-v1.json';
export const VAP_W5R_OUTPUT = 'content/production/visual-article/portfolio/scalable-article-production-portfolio-v1.json';
export const VAP_W4R_OUTPUT = 'content/production/visual-article/eligibility/visual-article-execution-eligibility-v1.json';

const PATHS = Object.freeze({
  nodes: 'content/knowledge/registry/nodes.json',
  blueprintRegistry: 'content/knowledge/blueprints/blueprint-registry.json',
  c3: 'content/knowledge/editorial/c3/universal-production-readiness-index.json',
  kppBaseline: 'content/knowledge/production-planning/audits/kpp-baseline-audit-v1.json',
  kppArticleGate: 'content/knowledge/production-planning/contracts/kpp-article-eligibility-gate-v1.json',
  kppNeedPolicy: 'content/knowledge/production-planning/policies/kpp-production-need-score-v2.json',
  wave1Plan: 'content/knowledge/production-planning/production/wave1/frozen-production-plan-v1.json',
  humanDecision: 'content/knowledge/production-planning/production/wave1/human-production-decision-v1.json',
  modernPublished: 'content/knowledge/public/authority/published-knowledge-authority.json',
  publishedArticles: 'content/knowledge/public/published-articles.json',
  pjaWaveContract: 'content/knowledge/production/waves/wave-production-contract.json'
});

const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
export const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;

function buildBlueprintNodeMap(root, registry) {
  const map = new Map();
  for (const book of registry.books || []) {
    const blueprint = readJson(root, book.blueprintPath);
    for (const node of blueprint.nodes || []) {
      if (map.has(node.nodeCode)) throw new Error(`VAP_W5R_DUPLICATE_BLUEPRINT_NODE:${node.nodeCode}`);
      map.set(node.nodeCode, {
        bookCode: book.bookCode,
        partCode: node.partCode || null,
        chapterCode: node.chapterCode || null,
        titleZhHans: node.titleZhHans || null,
        titleEn: node.titleEn || null,
        blueprintStatus: blueprint.status,
        articleRequiredNow: node.articleRequiredNow === true,
        productionPriority: node.productionPriority || null
      });
    }
  }
  return map;
}

function buildPublishedMap(modern, legacy) {
  const map = new Map();
  const add = (record, source) => {
    const published = source === 'modern'
      ? record.eligibility?.published === true
      : record.publicationStatus === 'published';
    if (!published) return;
    const item = map.get(record.nodeCode) || { locales: new Set(), sources: new Set(), articleCodes: new Set() };
    if (record.locale) item.locales.add(record.locale);
    item.sources.add(source === 'modern' ? 'PUBLISHED_KNOWLEDGE_AUTHORITY' : 'PUBLIC_PUBLISHED_ARTICLES');
    const articleCode = record.article?.articleCode || record.articleCode;
    if (articleCode) item.articleCodes.add(articleCode);
    map.set(record.nodeCode, item);
  };
  for (const record of modern.records || []) add(record, 'modern');
  for (const record of legacy.records || []) add(record, 'legacy');
  return map;
}

function stateFor({ published, planEntry, w4rEntry, blueprintSignal }) {
  if (published) return 'EXISTING_PUBLISHED_ARTICLE';
  if (planEntry && w4rEntry?.articleIntent === true) return 'EXPLICIT_ARTICLE_INTENT';
  if (planEntry) return 'EXPLICIT_NON_ARTICLE_WAVE_OUTPUT';
  if (blueprintSignal) return 'ARTICLE_DECISION_REQUIRED_HIGH_SIGNAL';
  return 'ARTICLE_DECISION_REQUIRED';
}

function countBy(entries, selector) {
  const counts = {};
  for (const entry of entries) {
    const key = selector(entry);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function summarizeGroups(entries, key) {
  const groups = new Map();
  for (const entry of entries) {
    const code = entry[key] || 'UNKNOWN';
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(entry);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([code, group]) => ({
    [key]: code,
    nodeCount: group.length,
    publishedArticleNodeCount: group.filter(entry => entry.portfolioState === 'EXISTING_PUBLISHED_ARTICLE').length,
    explicitArticleIntentCount: group.filter(entry => entry.portfolioState === 'EXPLICIT_ARTICLE_INTENT').length,
    explicitNonArticleWaveOutputCount: group.filter(entry => entry.portfolioState === 'EXPLICIT_NON_ARTICLE_WAVE_OUTPUT').length,
    articleDecisionRequiredHighSignalCount: group.filter(entry => entry.portfolioState === 'ARTICLE_DECISION_REQUIRED_HIGH_SIGNAL').length,
    articleDecisionRequiredCount: group.filter(entry => entry.portfolioState === 'ARTICLE_DECISION_REQUIRED').length,
    c3ProductionReadyCount: group.filter(entry => entry.readiness.productionReady).length
  }));
}

export function buildVapW5rPortfolio(root) {
  const nodes = readJson(root, PATHS.nodes);
  const blueprintRegistry = readJson(root, PATHS.blueprintRegistry);
  const c3 = readJson(root, PATHS.c3);
  const kppBaseline = readJson(root, PATHS.kppBaseline);
  const kppArticleGate = readJson(root, PATHS.kppArticleGate);
  const kppNeedPolicy = readJson(root, PATHS.kppNeedPolicy);
  const plan = readJson(root, PATHS.wave1Plan);
  const human = readJson(root, PATHS.humanDecision);
  const modernPublished = readJson(root, PATHS.modernPublished);
  const publishedArticles = readJson(root, PATHS.publishedArticles);
  const waveContract = readJson(root, PATHS.pjaWaveContract);
  const w4r = readJson(root, VAP_W4R_OUTPUT);

  if (!kppBaseline.invariants?.includes('716_CANONICAL_NODES_NOT_716_ARTICLES')) throw new Error('VAP_W5R_KPP_716_NOT_716_INVARIANT_MISSING');
  if (kppArticleGate.articleRequiredByDefault !== false) throw new Error('VAP_W5R_KPP_DEFAULT_ARTICLE_FORBIDDEN');
  if (kppNeedPolicy.autoAssignRole !== false || kppNeedPolicy.autoRequireArticle !== false) throw new Error('VAP_W5R_KPP_AUTOMATIC_ARTICLE_AUTHORITY_FORBIDDEN');
  if (plan.status !== 'FROZEN') throw new Error('VAP_W5R_WAVE1_PLAN_NOT_FROZEN');
  if (human.status !== 'APPROVED_FOR_PRODUCTION') throw new Error('VAP_W5R_HUMAN_DECISION_NOT_APPROVED');
  if (w4r.status !== 'ARTICLE_INTENT_AND_EXECUTION_ELIGIBILITY_RECONCILED') throw new Error('VAP_W5R_W4R_NOT_RECONCILED');

  const pjaPortfolio = buildExistingPjaPortfolio(root);
  if (pjaPortfolio.entries.length !== nodes.nodes.length) throw new Error('VAP_W5R_PJA_PORTFOLIO_NODE_COVERAGE_MISMATCH');

  const canonicalMap = new Map(nodes.nodes.map(node => [node.nodeCode, node]));
  const blueprintMap = buildBlueprintNodeMap(root, blueprintRegistry);
  const c3Map = new Map((c3.entries || []).map(entry => [entry.nodeCode, entry]));
  const pjaMap = new Map(pjaPortfolio.entries.map(entry => [entry.nodeCode, entry]));
  const planMap = new Map((plan.items || []).map(entry => [entry.nodeCode, entry]));
  const humanMap = new Map((human.entries || []).map(entry => [entry.nodeCode, entry]));
  const w4rMap = new Map((w4r.entries || []).map(entry => [entry.nodeCode, entry]));
  const publishedMap = buildPublishedMap(modernPublished, publishedArticles);

  if (blueprintMap.size !== nodes.nodes.length) throw new Error(`VAP_W5R_BLUEPRINT_COVERAGE_MISMATCH:${blueprintMap.size}:${nodes.nodes.length}`);

  const entries = nodes.nodes.map(node => {
    const blueprint = blueprintMap.get(node.nodeCode);
    const pja = pjaMap.get(node.nodeCode);
    const c3Entry = c3Map.get(node.nodeCode);
    const planEntry = planMap.get(node.nodeCode);
    const humanEntry = humanMap.get(node.nodeCode);
    const w4rEntry = w4rMap.get(node.nodeCode);
    const published = publishedMap.get(node.nodeCode);
    const portfolioState = stateFor({ published, planEntry, w4rEntry, blueprintSignal: blueprint.articleRequiredNow });

    return {
      nodeCode: node.nodeCode,
      bookCode: blueprint.bookCode,
      partCode: blueprint.partCode,
      chapterCode: blueprint.chapterCode,
      titleZhHans: blueprint.titleZhHans,
      titleEn: blueprint.titleEn,
      canonicalVersion: node.version || null,
      canonicalRegistryStatus: node.registryStatus || null,
      productionTier: node.productionTier || null,
      productionQueue: node.productionQueue || null,
      publicationPriority: node.publicationPriority || null,
      requiredPublicLanguages: node.requiredPublicLanguages || [],
      portfolioState,
      planningSignals: {
        canonicalPrimaryAssetType: node.primaryAssetType || null,
        canonicalPrimaryAssetTypeIsArticle: node.primaryAssetType === 'article',
        canonicalPrimaryAssetTypeAuthority: 'NON_AUTHORITATIVE_FOR_KPP_ROLE_ASSIGNMENT',
        blueprintArticleRequiredNow: blueprint.articleRequiredNow,
        blueprintSignalAuthority: 'PLANNING_SIGNAL_ONLY_NOT_PRODUCTION_DECISION'
      },
      productionDecision: planEntry ? {
        status: 'FROZEN_WAVE1_HUMAN_PRODUCTION_DECISION',
        productionRole: planEntry.productionRole,
        requiredOutputs: planEntry.requiredOutputs || [],
        dispatchTarget: planEntry.dispatchTarget,
        humanDecision: humanEntry?.decision || null,
        articleIntent: w4rEntry?.articleIntent ?? null
      } : published ? {
        status: 'NO_NEW_DECISION_REQUIRED_EXISTING_PUBLICATION',
        productionRole: null,
        requiredOutputs: [],
        dispatchTarget: null,
        humanDecision: null,
        articleIntent: null
      } : {
        status: 'HUMAN_KPP_PRODUCTION_DECISION_REQUIRED',
        productionRole: null,
        requiredOutputs: [],
        dispatchTarget: null,
        humanDecision: null,
        articleIntent: null
      },
      kppArticleEligibility: {
        status: published || (planEntry && w4rEntry?.articleIntent !== true)
          ? 'NOT_REQUIRED_FOR_CURRENT_STATE'
          : 'ARTICLE_ELIGIBILITY_ASSESSMENT_REQUIRED_BEFORE_NEW_ARTICLE_DECISION',
        articleRequiredByDefault: false,
        autoAssignedByW5r: false
      },
      readiness: {
        c3Indexed: Boolean(c3Entry),
        c3Status: c3Entry?.status || 'not_assessed',
        productionReady: c3Entry?.productionReady === true,
        blocking: c3Entry?.blocking || [],
        pjaPortfolioReadiness: pja?.readiness || 'not_assessed'
      },
      publication: {
        existingPublishedArticle: Boolean(published),
        locales: published ? [...published.locales].sort() : [],
        sources: published ? [...published.sources].sort() : [],
        articleCodes: published ? [...published.articleCodes].sort() : [],
        newCandidateRegenerationAllowedByPortfolio: false
      },
      execution: w4rEntry ? {
        evaluatedByW4r: true,
        articleIntent: w4rEntry.articleIntent,
        newArticleExecutionEligible: w4rEntry.articleExecutionEligible,
        status: w4rEntry.articleExecutionStatus,
        nonExecutionReasons: w4rEntry.nonExecutionReasons
      } : {
        evaluatedByW4r: false,
        articleIntent: null,
        newArticleExecutionEligible: false,
        status: 'NOT_IN_CURRENT_EXECUTION_WAVE',
        nonExecutionReasons: []
      }
    };
  });

  const stateCounts = countBy(entries, entry => entry.portfolioState);
  const publishedLocaleRecordCount = [...publishedMap.values()].reduce((sum, value) => sum + value.locales.size, 0);
  const articlePlanningBacklogCount = (stateCounts.ARTICLE_DECISION_REQUIRED_HIGH_SIGNAL || 0) + (stateCounts.ARTICLE_DECISION_REQUIRED || 0) + (stateCounts.EXPLICIT_ARTICLE_INTENT || 0);
  const blueprintSignalCount = entries.filter(entry => entry.planningSignals.blueprintArticleRequiredNow).length;
  const confirmedArticleIntentEntries = entries.filter(entry => entry.execution.evaluatedByW4r && entry.execution.articleIntent === true);
  const executionEligibleEntries = entries.filter(entry => entry.execution.newArticleExecutionEligible);

  const sourceFiles = [
    PATHS.nodes,
    PATHS.blueprintRegistry,
    ...blueprintRegistry.books.map(book => book.blueprintPath),
    PATHS.c3,
    PATHS.kppBaseline,
    PATHS.kppArticleGate,
    PATHS.kppNeedPolicy,
    PATHS.wave1Plan,
    PATHS.humanDecision,
    PATHS.modernPublished,
    PATHS.publishedArticles,
    PATHS.pjaWaveContract,
    VAP_W4R_OUTPUT
  ];

  const result = {
    schemaVersion: 'PHI-OS-VAP-W5R-SCALABLE-ARTICLE-PRODUCTION-PORTFOLIO-v1.0.0',
    portfolioCode: 'PHI-OS-VAP-W5R-SCALABLE-ARTICLE-PRODUCTION-PORTFOLIO-v1',
    portfolioVersion: '1.0.0',
    work: 'VAP-W5R',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION_RECONCILIATION',
    status: 'SCALABLE_ARTICLE_PRODUCTION_PORTFOLIO_ACTIVE',
    baselineCommit: VAP_W5R_BASELINE,
    contractReference: VAP_W5R_CONTRACT,
    authority: 'DERIVED_PRODUCTION_PLANNING_PROJECTION_ONLY',
    existingPjaRuntimeReuse: {
      builder: 'scripts/lib/knowledge-production/scalable-article-workflow.mjs#buildPortfolio',
      existingPortfolioSchemaVersion: pjaPortfolio.schemaVersion,
      existingPortfolioEntryCount: pjaPortfolio.entries.length,
      secondCanonicalRegistryCreated: false,
      pjaRuntimeReimplementedByW5r: false
    },
    summary: {
      canonicalNodeCount: entries.length,
      publishedArticleNodeCount: stateCounts.EXISTING_PUBLISHED_ARTICLE || 0,
      publishedArticleLocaleRecordCount: publishedLocaleRecordCount,
      frozenWave1ProductionDecisionCount: plan.items.length,
      confirmedArticleIntentCount: confirmedArticleIntentEntries.length,
      confirmedArticleIntentNodeCodes: confirmedArticleIntentEntries.map(entry => entry.nodeCode),
      newArticleExecutionEligibleCount: executionEligibleEntries.length,
      newArticleExecutionEligibleNodeCodes: executionEligibleEntries.map(entry => entry.nodeCode),
      explicitArticleIntentPendingProductionCount: stateCounts.EXPLICIT_ARTICLE_INTENT || 0,
      explicitNonArticleWaveOutputCount: stateCounts.EXPLICIT_NON_ARTICLE_WAVE_OUTPUT || 0,
      articleDecisionRequiredHighSignalCount: stateCounts.ARTICLE_DECISION_REQUIRED_HIGH_SIGNAL || 0,
      articleDecisionRequiredCount: stateCounts.ARTICLE_DECISION_REQUIRED || 0,
      articlePlanningBacklogCount,
      blueprintArticleRequiredNowSignalCount: blueprintSignalCount,
      canonicalPrimaryAssetTypeArticleSignalCount: entries.filter(entry => entry.planningSignals.canonicalPrimaryAssetTypeIsArticle).length,
      c3IndexedNodeCount: entries.filter(entry => entry.readiness.c3Indexed).length,
      c3ProductionReadyNodeCount: entries.filter(entry => entry.readiness.productionReady).length,
      c3NotAssessedNodeCount: entries.filter(entry => !entry.readiness.c3Indexed).length,
      maturePjaWaveMaximum: waveContract.maximumSizes?.mature || null
    },
    stateCounts,
    bookSummary: summarizeGroups(entries, 'bookCode'),
    partSummary: summarizeGroups(entries, 'partCode'),
    executionPolicy: {
      autoAssignArticleRole: false,
      autoApproveArticle: false,
      autoCreateProductionWave: false,
      candidateCreationAllowed: false,
      providerInvocationAllowed: false,
      publicationAllowed: false,
      maturePjaWaveMaximum: waveContract.maximumSizes?.mature || null,
      bulkHumanApprovalAllowed: waveContract.bulkHumanApprovalAllowed === true,
      nextAction: 'Select a governed Article cohort from the portfolio, complete KPP Article eligibility + Human Production Decision + C2/C3 readiness, then export briefs in a bounded PJA wave.'
    },
    entries,
    invariants: {
      canonicalNodeCountDoesNotEqualArticleCount: true,
      noDefaultArticle: true,
      humanProductionDecisionRequired: true,
      blueprintArticleRequiredNowIsNotProductionAuthority: true,
      canonicalPrimaryAssetTypeIsNotKppRoleAuthority: true,
      publishedArticleRegenerationForbidden: true,
      w4rExecutionEligibilityRequiredBeforeNewArticleExecution: true,
      secondCanonicalRegistryCreated: false,
      portfolioCreatesCandidate: false,
      portfolioInvokesProvider: false,
      portfolioPublishes: false
    },
    sourceDigests: Object.fromEntries(sourceFiles.map(relative => [
      relative,
      `sha256:${sha(fs.readFileSync(path.join(root, relative), 'utf8'))}`
    ]))
  };

  const digestInput = { ...result };
  delete digestInput.portfolioDigest;
  result.portfolioDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}
