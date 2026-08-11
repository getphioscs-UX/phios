import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const VAP_W4_BASELINE = 'cdcb11be3e2db494fa1c40c7814604e2de31f34e';
export const VAP_W4_CONTRACT = 'content/production/visual-article/contracts/vap-w4-node-production-eligibility-v1.json';
export const VAP_W4_ELIGIBILITY = 'content/production/visual-article/eligibility/visual-article-production-eligibility-v1.json';

export const WAVE1_NODES = [
  'KN-PREFACE-004',
  'KN-B1-P1-003',
  'KN-B1-P4-003',
  'KN-B1-P4-004'
];

const C2_PATHS = Object.freeze({
  'KN-PREFACE-004': 'content/knowledge/editorial/c2/frozen/kn-preface-004.json',
  'KN-B1-P1-003': 'content/knowledge/editorial/c2/frozen/kn-b1-p1-003.json',
  'KN-B1-P4-003': 'content/knowledge/editorial/c2/frozen/kn-b1-p4-003.json',
  'KN-B1-P4-004': 'content/knowledge/editorial/c2/frozen/kn-b1-p4-004.json'
});

const C3_PATHS = Object.freeze({
  'KN-PREFACE-004': 'content/knowledge/editorial/c3/assessments/kn-preface-004-production-readiness.json',
  'KN-B1-P1-003': 'content/knowledge/editorial/c3/assessments/kn-b1-p1-003-production-readiness.json',
  'KN-B1-P4-003': 'content/knowledge/editorial/c3/assessments/kn-b1-p4-003-production-readiness.json',
  'KN-B1-P4-004': 'content/knowledge/editorial/c3/assessments/kn-b1-p4-004-production-readiness.json'
});

export const VAP_W4_SOURCES = [
  'content/production/visual-article/authority/vap-w3-visual-production-authority-v1.json',
  'content/knowledge/registry/nodes.json',
  'content/knowledge/l10n/multilingual-node-projection-registry.json',
  'content/knowledge/production-planning/production/wave1/human-production-decision-v1.json',
  'content/knowledge/production-planning/production/wave1/frozen-production-plan-v1.json',
  'content/knowledge/production-planning/production/wave1/frozen-production-wave-v1.json',
  'content/knowledge/production-planning/production/wave1/execution-authority-reconciliation-v1.json',
  'content/knowledge/production-planning/activation/wave1-production-authorized-v1.json',
  ...Object.values(C2_PATHS),
  ...Object.values(C3_PATHS)
];

const GIT_SHOW_MAX_BUFFER = 128 * 1024 * 1024;
const baselineTextCache = new Map();

const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
export const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;

function gitAvailable(root) {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { cwd: root, stdio: 'ignore', windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

function readBaselineText(root, relative) {
  const cacheKey = `${path.resolve(root)}\0${relative}`;
  if (baselineTextCache.has(cacheKey)) return baselineTextCache.get(cacheKey);

  let source;
  if (gitAvailable(root)) {
    try {
      source = execFileSync('git', ['show', `${VAP_W4_BASELINE}:${relative}`], {
        cwd: root,
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: GIT_SHOW_MAX_BUFFER
      });
    } catch (error) {
      throw new Error(`VAP_W4_BASELINE_SOURCE_UNAVAILABLE: ${relative}: ${error.message}`);
    }
  } else {
    source = fs.readFileSync(path.join(root, relative), 'utf8');
  }

  baselineTextCache.set(cacheKey, source);
  return source;
}

const readBaselineJson = (root, relative) => JSON.parse(readBaselineText(root, relative));
const entryByNode = (items, code) => (items || []).find(item => item.nodeCode === code);

function localeProjectionAvailable(registry, nodeCode, locale) {
  const record = entryByNode(registry.records, nodeCode);
  return record?.locales?.[locale]?.availability === 'available';
}

function gateFailureCodes(gates) {
  const failures = [];
  if (!gates.canonicalNodeExists) failures.push('CANONICAL_NODE_NOT_FOUND');
  if (!gates.canonicalThesisFrozen || !gates.boundaryFrozen) failures.push('C2_THESIS_BOUNDARY_NOT_FROZEN');
  if (!gates.productionReadinessPassed) failures.push('PRODUCTION_READINESS_NOT_PASSED');
  if (!gates.humanProductionDecisionApproved) failures.push('HUMAN_PRODUCTION_DECISION_NOT_APPROVED');
  if (!gates.productionPlanFrozen) failures.push('PRODUCTION_PLAN_NOT_FROZEN');
  if (!gates.productionWaveFrozen) failures.push('PRODUCTION_WAVE_NOT_FROZEN');
  if (!gates.executionAuthorityValid) failures.push('EXECUTION_AUTHORITY_INVALID');
  if (!gates.dispatchAllowed) failures.push('DISPATCH_NOT_ALLOWED');
  if (!gates.productionRoleEligible) failures.push('KPP_ROLE_NOT_ARTICLE_OR_MULTI_ASSET');
  if (!gates.localeSupported) failures.push('LOCALE_NOT_SUPPORTED');
  return failures;
}

export function buildVapW4Eligibility(root) {
  const sourceDigests = Object.fromEntries(VAP_W4_SOURCES.map(relative => [
    relative,
    `sha256:${sha(readBaselineText(root, relative))}`
  ]));

  const w3 = readBaselineJson(root, VAP_W4_SOURCES[0]);
  const nodes = readBaselineJson(root, VAP_W4_SOURCES[1]);
  const locales = readBaselineJson(root, VAP_W4_SOURCES[2]);
  const human = readBaselineJson(root, VAP_W4_SOURCES[3]);
  const plan = readBaselineJson(root, VAP_W4_SOURCES[4]);
  const wave = readBaselineJson(root, VAP_W4_SOURCES[5]);
  const execution = readBaselineJson(root, VAP_W4_SOURCES[6]);
  const authorized = readBaselineJson(root, VAP_W4_SOURCES[7]);

  const nodeMap = new Map((nodes.nodes || []).map(node => [node.nodeCode, node]));
  const humanMap = new Map(human.entries.map(entry => [entry.nodeCode, entry]));
  const planMap = new Map(plan.items.map(entry => [entry.nodeCode, entry]));
  const waveMap = new Map(wave.items.map(entry => [entry.nodeCode, entry]));
  const authMap = new Map(authorized.selectedExecutionScope.map(entry => [entry.nodeCode, entry]));
  const w3Map = new Map(w3.dispatchMatrix.map(entry => [entry.nodeCode, entry]));

  if (w3.status !== 'VISUAL_PRODUCTION_AUTHORITY_FROZEN_READY_FOR_VAP_W4_ADAPTERS') {
    throw new Error('VAP_W4_W3_AUTHORITY_NOT_READY');
  }
  if (human.status !== 'APPROVED_FOR_PRODUCTION') throw new Error('VAP_W4_HUMAN_DECISION_NOT_APPROVED');
  if (plan.status !== 'FROZEN') throw new Error('VAP_W4_PLAN_NOT_FROZEN');
  if (wave.status !== 'FROZEN') throw new Error('VAP_W4_WAVE_NOT_FROZEN');
  if (execution.status !== 'CLOSED') throw new Error('VAP_W4_EXECUTION_AUTHORITY_NOT_CLOSED');
  if (authorized.status !== 'AUTHORIZED_FOR_GOVERNED_PRODUCTION_BRIEF_GENERATION') throw new Error('VAP_W4_PREFLIGHT_NOT_AUTHORIZED');

  const entries = WAVE1_NODES.map(nodeCode => {
    const canonical = nodeMap.get(nodeCode);
    const planEntry = planMap.get(nodeCode);
    const waveEntry = waveMap.get(nodeCode);
    const humanEntry = humanMap.get(nodeCode);
    const authorizedEntry = authMap.get(nodeCode);
    const w3Entry = w3Map.get(nodeCode);
    const c2 = readBaselineJson(root, C2_PATHS[nodeCode]);
    const c3 = readBaselineJson(root, C3_PATHS[nodeCode]);
    const locale = planEntry?.localeRequirements?.[0] || waveEntry?.localeRequirement || c2.locale || c3.locale || null;

    const gates = {
      canonicalNodeExists: Boolean(canonical),
      canonicalThesisFrozen: c2.status === 'frozen' && c2.thesisState === 'frozen',
      boundaryFrozen: c2.status === 'frozen' && c2.boundaryState === 'frozen',
      productionReadinessPassed:
        c3.status === 'production_ready' &&
        c3.productionReady === true &&
        c3.gates?.c2FrozenThesisBoundary?.status === 'passed' &&
        c3.gates?.noBlockingFindings?.status === 'passed' &&
        Array.isArray(c3.blocking) && c3.blocking.length === 0,
      humanProductionDecisionApproved:
        humanEntry?.decision === 'approve_for_production' &&
        humanEntry?.c2ContentHash === c2.contentHash,
      productionPlanFrozen:
        plan.status === 'FROZEN' &&
        planEntry?.planStatus === 'FROZEN' &&
        planEntry?.productionReadiness === 'production_ready',
      productionWaveFrozen:
        wave.status === 'FROZEN' &&
        Boolean(waveEntry) &&
        wave.replay?.replayVerified === true,
      executionAuthorityValid:
        execution.status === 'CLOSED' &&
        execution.executionAuthority?.scope === 'GOVERNED_HANDOFF_AND_BRIEF_GENERATION_ONLY' &&
        execution.executionAuthority?.dispatchAllowed === true,
      dispatchAllowed:
        authorized.gateSnapshot?.dispatchAllowed === true &&
        authorized.gateSnapshot?.briefGenerationAllowed === true &&
        authorizedEntry?.productionReady === true &&
        authorizedEntry?.briefGenerationAllowed === true,
      productionRoleEligible: ['ARTICLE', 'MULTI_ASSET'].includes(planEntry?.productionRole),
      localeSupported:
        Boolean(locale) &&
        planEntry?.localeRequirements?.includes(locale) === true &&
        localeProjectionAvailable(locales, nodeCode, locale)
    };

    const failureCodes = gateFailureCodes(gates);
    const articleProductionEligible = failureCodes.length === 0;
    const allAuthorityGatesExceptRole = Object.entries(gates)
      .filter(([key]) => key !== 'productionRoleEligible')
      .every(([, value]) => value === true);

    return {
      nodeCode,
      knowledgeVersion: canonical?.version || planEntry?.knowledgeVersion || null,
      locale,
      productionRole: planEntry?.productionRole || null,
      dispatchTarget: planEntry?.dispatchTarget || null,
      requiredOutputs: planEntry?.requiredOutputs || [],
      canonicalNodeStatus: canonical?.registryStatus || null,
      c2ContentHash: c2.contentHash,
      c3AssessmentReference: humanEntry?.c3AssessmentReference || null,
      gates,
      authorityGatePassed: allAuthorityGatesExceptRole && gates.productionRoleEligible,
      articleProductionEligible,
      eligibilityStatus: articleProductionEligible
        ? 'ARTICLE_PRODUCTION_ELIGIBLE'
        : gates.productionRoleEligible
          ? 'ARTICLE_PRODUCTION_BLOCKED'
          : 'WAVE1_SUPPORTING_OUTPUT_NOT_ARTICLE_ELIGIBLE',
      failureCodes,
      executionBoundary: {
        w3ExecutionMode: w3Entry?.executionMode || null,
        w3PrimaryAuthority: w3Entry?.primaryAuthority || null,
        directBriefExecutionReady: w3Entry?.directBriefExecutionReady === true,
        standardPjaArticleDraftExporterAllowed: w3Entry?.standardPjaArticleDraftExporterAllowed === true,
        adapterRequirement: w3Entry?.primaryBriefAdapter || null,
        eligibilityDoesNotOverrideW3AdapterRequirement: true
      }
    };
  });

  const articleEligibleEntries = entries.filter(entry => entry.articleProductionEligible);
  const result = {
    schemaVersion: 'PHI-OS-VAP-W4-VISUAL-ARTICLE-PRODUCTION-ELIGIBILITY-v1.0.0',
    eligibilityCode: 'PHI-OS-VAP-W4-VISUAL-ARTICLE-PRODUCTION-ELIGIBILITY-v1',
    eligibilityVersion: '1.0.0',
    work: 'VAP-W4',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    status: 'ARTICLE_PRODUCTION_ELIGIBILITY_ACTIVE',
    baselineCommit: VAP_W4_BASELINE,
    contractReference: VAP_W4_CONTRACT,
    scope: {
      waveCode: wave.waveCode,
      evaluatedNodeCount: entries.length,
      articleEligibleNodeCount: articleEligibleEntries.length,
      articleEligibleNodeCodes: articleEligibleEntries.map(entry => entry.nodeCode),
      supportingWaveOutputNodeCodes: entries.filter(entry => !entry.gates.productionRoleEligible).map(entry => entry.nodeCode),
      eligibleProductionRoles: ['ARTICLE', 'MULTI_ASSET'],
      evaluatedLocale: 'zh-Hans'
    },
    gateOrder: [
      'canonicalNodeExists',
      'canonicalThesisFrozen',
      'boundaryFrozen',
      'productionReadinessPassed',
      'humanProductionDecisionApproved',
      'productionPlanFrozen',
      'productionWaveFrozen',
      'executionAuthorityValid',
      'dispatchAllowed',
      'productionRoleEligible',
      'localeSupported'
    ],
    authorityGate: {
      sequence: [
        'C2_FROZEN',
        'C3_PRODUCTION_READY',
        'HUMAN_PRODUCTION_DECISION',
        'PRODUCTION_PLAN_FROZEN',
        'PRODUCTION_WAVE_FROZEN',
        'EXECUTION_AUTHORITY_VALID',
        'DISPATCH_ALLOWED_TRUE'
      ],
      dispatchAllowed: authorized.gateSnapshot?.dispatchAllowed === true,
      candidateCreationAllowed: false,
      providerInvocationAllowed: false,
      publicationAllowed: false
    },
    entries,
    invariants: {
      c2ThesisBoundaryGatePreserved: true,
      c2ThesisBoundaryFailureCode: 'C2_THESIS_BOUNDARY_NOT_FROZEN',
      eligibilityDoesNotCreateProductionBrief: true,
      eligibilityDoesNotCreateCandidate: true,
      eligibilityDoesNotInvokeProvider: true,
      eligibilityDoesNotPublish: true,
      eligibilityDoesNotResolveW3AdapterGaps: true,
      fragmentAndFigureRemainWaveOutputsButNotArticleEligible: true,
      kppRoleMustBeArticleOrMultiAsset: true,
      localeAvailabilityMustBeExplicit: true
    },
    sourceDigests
  };

  const digestInput = { ...result };
  delete digestInput.eligibilityDigest;
  result.eligibilityDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}
