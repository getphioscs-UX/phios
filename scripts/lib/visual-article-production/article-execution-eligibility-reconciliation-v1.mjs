import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const VAP_W4R_BASELINE = '9c6ab5b198f6603a2e8ac3d95ef743b5b2694db9';
export const VAP_W4R_CONTRACT = 'content/production/visual-article/contracts/vap-w4r-article-execution-eligibility-reconciliation-v1.json';
export const VAP_W4R_OUTPUT = 'content/production/visual-article/eligibility/visual-article-execution-eligibility-v1.json';
export const VAP_W4_HISTORICAL = 'content/production/visual-article/eligibility/visual-article-production-eligibility-v1.json';
export const VAP_W3_AUTHORITY = 'content/production/visual-article/authority/vap-w3-visual-production-authority-v1.json';

const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
export const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;

const ARTICLE_OUTPUTS = new Set(['ARTICLE']);
const articleOutputRequired = entry => entry.productionRole === 'ARTICLE' || (
  entry.productionRole === 'MULTI_ASSET' &&
  (entry.requiredOutputs || []).some(output => ARTICLE_OUTPUTS.has(output) || /^ARTICLE_(?!RECONCILIATION)/.test(output))
);

const governanceGateNames = [
  'canonicalNodeExists',
  'canonicalThesisFrozen',
  'boundaryFrozen',
  'productionReadinessPassed',
  'humanProductionDecisionApproved',
  'productionPlanFrozen',
  'productionWaveFrozen',
  'executionAuthorityValid',
  'dispatchAllowed',
  'localeSupported'
];

function articleIntentReason(entry) {
  if (entry.productionRole === 'ARTICLE') return 'KPP_ARTICLE_ROLE';
  if (entry.productionRole === 'MULTI_ASSET' && articleOutputRequired(entry)) return 'KPP_MULTI_ASSET_REQUIRES_ARTICLE_OUTPUT';
  if (entry.productionRole === 'MULTI_ASSET') return 'MULTI_ASSET_WITHOUT_ARTICLE_OUTPUT';
  return 'PRODUCTION_ROLE_NOT_ARTICLE';
}

function executionReasons(entry, w3Entry, governancePassed, articleIntent) {
  const reasons = [];
  if (!articleIntent) return [articleIntentReason(entry)];
  if (!governancePassed) reasons.push('NON_ROLE_GOVERNANCE_GATE_BLOCKED');
  if (w3Entry?.executionMode === 'EXISTING_ARTICLE_RECONCILIATION_FOR_VISUAL_RELEASE' || (entry.requiredOutputs || []).includes('ARTICLE_RECONCILIATION_FOR_VISUAL_RELEASE')) {
    reasons.push('EXISTING_ARTICLE_RECONCILIATION_NOT_NEW_ARTICLE');
  }
  if (entry.dispatchTarget !== 'PJA') reasons.push('ARTICLE_DISPATCH_NOT_PJA');
  if (w3Entry?.executionMode !== 'NEW_ARTICLE_PRODUCTION') reasons.push('PJA_NEW_ARTICLE_EXECUTION_MODE_REQUIRED');
  if (w3Entry?.standardPjaArticleDraftExporterAllowed !== true) reasons.push('PJA_STANDARD_ARTICLE_EXPORTER_NOT_ALLOWED');
  if (w3Entry?.directBriefExecutionReady !== true) reasons.push('PJA_DIRECT_BRIEF_EXECUTION_NOT_READY');
  return [...new Set(reasons)];
}

function executionStatus({ articleIntent, articleExecutionEligible, reasons }) {
  if (articleExecutionEligible) return 'NEW_ARTICLE_EXECUTION_ELIGIBLE';
  if (!articleIntent) return 'NOT_AN_ARTICLE_OUTPUT';
  if (reasons.includes('EXISTING_ARTICLE_RECONCILIATION_NOT_NEW_ARTICLE')) return 'EXISTING_ARTICLE_RECONCILIATION_ONLY';
  if (reasons.includes('ARTICLE_DISPATCH_NOT_PJA')) return 'ARTICLE_INTENT_NON_PJA_DISPATCH_BLOCKED';
  if (reasons.includes('NON_ROLE_GOVERNANCE_GATE_BLOCKED')) return 'ARTICLE_EXECUTION_BLOCKED_BY_GOVERNANCE';
  return 'ARTICLE_INTENT_PJA_EXECUTION_NOT_READY';
}

export function buildVapW4rReconciliation(root) {
  const historical = readJson(root, VAP_W4_HISTORICAL);
  const w3 = readJson(root, VAP_W3_AUTHORITY);
  const w3Map = new Map((w3.dispatchMatrix || []).map(entry => [entry.nodeCode, entry]));

  const entries = historical.entries.map(entry => {
    const w3Entry = w3Map.get(entry.nodeCode) || {};
    const articleIntent = articleOutputRequired(entry);
    const governancePassed = governanceGateNames.every(name => entry.gates?.[name] === true);
    const reasons = executionReasons(entry, w3Entry, governancePassed, articleIntent);
    const articleExecutionEligible = articleIntent && governancePassed &&
      entry.dispatchTarget === 'PJA' &&
      w3Entry.executionMode === 'NEW_ARTICLE_PRODUCTION' &&
      w3Entry.standardPjaArticleDraftExporterAllowed === true &&
      w3Entry.directBriefExecutionReady === true;

    return {
      nodeCode: entry.nodeCode,
      knowledgeVersion: entry.knowledgeVersion,
      locale: entry.locale,
      productionRole: entry.productionRole,
      requiredOutputs: entry.requiredOutputs,
      dispatchTarget: entry.dispatchTarget,
      historicalVapW4ArticleProductionEligible: entry.articleProductionEligible === true,
      governanceGatePassed: governancePassed,
      governanceGates: Object.fromEntries(governanceGateNames.map(name => [name, entry.gates?.[name] === true])),
      articleIntent,
      articleIntentStatus: articleIntent ? 'ARTICLE_INTENT_CONFIRMED' : 'NO_ARTICLE_INTENT',
      articleIntentReason: articleIntentReason(entry),
      existingArticleReconciliation: w3Entry.executionMode === 'EXISTING_ARTICLE_RECONCILIATION_FOR_VISUAL_RELEASE' || (entry.requiredOutputs || []).includes('ARTICLE_RECONCILIATION_FOR_VISUAL_RELEASE'),
      articleExecutionEligible,
      articleExecutionStatus: executionStatus({ articleIntent, articleExecutionEligible, reasons }),
      nonExecutionReasons: reasons,
      executionBoundary: {
        w3ExecutionMode: w3Entry.executionMode || null,
        w3PrimaryAuthority: w3Entry.primaryAuthority || null,
        standardPjaArticleDraftExporterAllowed: w3Entry.standardPjaArticleDraftExporterAllowed === true,
        directBriefExecutionReady: w3Entry.directBriefExecutionReady === true,
        adapterRequirement: w3Entry.primaryBriefAdapter || null,
        candidateCreationAllowed: w3Entry.candidateCreationAllowed === true
      }
    };
  });

  const articleIntentEntries = entries.filter(entry => entry.articleIntent);
  const executionEligibleEntries = entries.filter(entry => entry.articleExecutionEligible);
  const historicalSemanticOverreach = entries.filter(entry => entry.historicalVapW4ArticleProductionEligible && !entry.articleIntent);
  const reconciliations = entries.filter(entry => entry.existingArticleReconciliation);

  const result = {
    schemaVersion: 'PHI-OS-VAP-W4R-ARTICLE-EXECUTION-ELIGIBILITY-RECONCILIATION-v1.0.0',
    reconciliationCode: 'PHI-OS-VAP-W4R-ARTICLE-EXECUTION-ELIGIBILITY-RECONCILIATION-v1',
    reconciliationVersion: '1.0.0',
    work: 'VAP-W4R',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION_RECONCILIATION',
    status: 'ARTICLE_INTENT_AND_EXECUTION_ELIGIBILITY_RECONCILED',
    baselineCommit: VAP_W4R_BASELINE,
    contractReference: VAP_W4R_CONTRACT,
    historicalEligibilityReference: VAP_W4_HISTORICAL,
    w3AuthorityReference: VAP_W3_AUTHORITY,
    summary: {
      evaluatedNodeCount: entries.length,
      historicalVapW4ArticleEligibleCount: entries.filter(entry => entry.historicalVapW4ArticleProductionEligible).length,
      articleIntentCount: articleIntentEntries.length,
      articleIntentNodeCodes: articleIntentEntries.map(entry => entry.nodeCode),
      newArticleExecutionEligibleCount: executionEligibleEntries.length,
      newArticleExecutionEligibleNodeCodes: executionEligibleEntries.map(entry => entry.nodeCode),
      existingArticleReconciliationCount: reconciliations.length,
      existingArticleReconciliationNodeCodes: reconciliations.map(entry => entry.nodeCode),
      historicalSemanticOverreachCount: historicalSemanticOverreach.length,
      historicalSemanticOverreachNodeCodes: historicalSemanticOverreach.map(entry => entry.nodeCode),
      nonArticleOutputCount: entries.filter(entry => !entry.articleIntent).length
    },
    entries,
    invariants: {
      historicalVapW4OutputMutated: false,
      multiAssetWithoutArticleOutputCreatesArticleIntent: false,
      articleIntentDoesNotEqualExecutionEligibility: true,
      existingArticleReconciliationDoesNotCreateNewArticleCandidate: true,
      c2ThesisBoundaryGatePreserved: true,
      c2ThesisBoundaryFailureCode: 'C2_THESIS_BOUNDARY_NOT_FROZEN',
      candidateAuthorityOpenedByW4r: false,
      providerAuthorityOpenedByW4r: false,
      publicationAuthorityOpenedByW4r: false
    },
    sourceDigests: {
      [VAP_W4_HISTORICAL]: `sha256:${sha(fs.readFileSync(path.join(root, VAP_W4_HISTORICAL), 'utf8'))}`,
      [VAP_W3_AUTHORITY]: `sha256:${sha(fs.readFileSync(path.join(root, VAP_W3_AUTHORITY), 'utf8'))}`
    }
  };

  const digestInput = { ...result };
  delete digestInput.reconciliationDigest;
  result.reconciliationDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}
