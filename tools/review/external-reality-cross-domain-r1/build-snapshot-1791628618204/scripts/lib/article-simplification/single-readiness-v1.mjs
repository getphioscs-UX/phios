import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const APS2_BASELINE = 'b7df645a7c4a5ab2fa5e80f5cae57a26e2803e39';
export const APS2_CONTRACT = 'content/production/article-simplification/contracts/aps-2-single-readiness-contract-v1.json';
export const APS2_DEFAULT_OUTPUT = 'content/production/article-simplification/readiness/book-1.zh-Hans.article-readiness.v1.json';

const PORTFOLIO = 'content/production/visual-article/portfolio/scalable-article-production-portfolio-v1.json';
const NODES = 'content/knowledge/registry/nodes.json';
const L10N = 'content/knowledge/l10n/multilingual-node-projection-registry.json';
const PUBLICATIONS = 'content/knowledge/production/registry/publication-registry.json';
const W6A_DECISIONS_DIR = 'content/production/visual-article/decisions';
const PLANNING_DIR = 'content/knowledge/production-planning/production';

const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
export const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;

const abs = (root, relative) => path.join(root, relative);
const exists = (root, relative) => fs.existsSync(abs(root, relative));
const readJson = (root, relative) => JSON.parse(fs.readFileSync(abs(root, relative), 'utf8'));
const readJsonIfExists = (root, relative) => exists(root, relative) ? readJson(root, relative) : null;
const fileDigest = (root, relative) => exists(root, relative)
  ? `sha256:${sha(fs.readFileSync(abs(root, relative), 'utf8'))}`
  : null;

function listJsonFiles(root, relativeDir, predicate = () => true) {
  const base = abs(root, relativeDir);
  if (!fs.existsSync(base)) return [];
  const out = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isFile() && entry.name.endsWith('.json')) {
        const relative = path.relative(root, target).split(path.sep).join('/');
        if (predicate(relative)) out.push(relative);
      }
    }
  };
  walk(base);
  return out.sort();
}

function collectProductionDecisions(root) {
  const paths = listJsonFiles(root, W6A_DECISIONS_DIR, relative => /vap-w6a-batch-.*-human-decisions-v1\.json$/i.test(relative));
  const map = new Map();
  for (const relative of paths) {
    const envelope = readJson(root, relative);
    for (const entry of envelope.entries || []) {
      const current = map.get(entry.nodeCode);
      const approved = entry.decisionState === 'human_approved' &&
        entry.productionDecision === 'approve_for_production' &&
        entry.productionRole === 'ARTICLE';
      if (!current || approved) map.set(entry.nodeCode, { ...entry, sourcePath: relative, envelopeStatus: envelope.status });
    }
  }
  return { map, paths };
}

function collectExecutionBundles(root) {
  const authorityPaths = listJsonFiles(root, PLANNING_DIR, relative => /execution-authority-v1\.json$/i.test(relative));
  const byNode = new Map();
  const bundlePaths = new Set();
  for (const authorityPath of authorityPaths) {
    const authority = readJson(root, authorityPath);
    const planPath = authority.planReference || null;
    const wavePath = authority.waveReference || null;
    const plan = planPath ? readJsonIfExists(root, planPath) : null;
    const wave = wavePath ? readJsonIfExists(root, wavePath) : null;
    bundlePaths.add(authorityPath);
    if (planPath) bundlePaths.add(planPath);
    if (wavePath) bundlePaths.add(wavePath);
    for (const item of authority.items || []) {
      const candidate = { authorityPath, authority, planPath, plan, wavePath, wave, item };
      const current = byNode.get(item.nodeCode);
      const valid = authority.status === 'ACTIVE' && authority.executionAuthority?.dispatchAllowed === true && item.productionRole === 'ARTICLE';
      const currentValid = current?.authority?.status === 'ACTIVE' && current?.authority?.executionAuthority?.dispatchAllowed === true && current?.item?.productionRole === 'ARTICLE';
      if (!current || (valid && !currentValid)) byNode.set(item.nodeCode, candidate);
    }
  }
  return { byNode, paths: [...bundlePaths].filter(Boolean).sort() };
}

function c2Evidence(root, nodeCode) {
  const relative = `content/knowledge/editorial/c2/frozen/${nodeCode.toLowerCase()}.json`;
  const record = readJsonIfExists(root, relative);
  return {
    path: record ? relative : null,
    digest: record ? fileDigest(root, relative) : null,
    record,
    passed: Boolean(record && record.status === 'frozen' && record.thesisState === 'frozen' && record.boundaryState === 'frozen' && record.humanFreezeState === 'approved')
  };
}

function c3Evidence(root, nodeCode) {
  const relative = `content/knowledge/editorial/c3/assessments/${nodeCode.toLowerCase()}-production-readiness.json`;
  const record = readJsonIfExists(root, relative);
  return {
    path: record ? relative : null,
    digest: record ? fileDigest(root, relative) : null,
    record,
    passed: Boolean(record && record.productionReady === true && record.status === 'production_ready' && (record.blocking || []).length === 0)
  };
}

const BLOCKERS = [
  ['canonicalNodePresent', 'CANONICAL_NODE_NOT_PRESENT'],
  ['articleIntentApproved', 'HUMAN_ARTICLE_PRODUCTION_DECISION_REQUIRED'],
  ['c2Frozen', 'C2_THESIS_BOUNDARY_NOT_FROZEN'],
  ['manuscriptMappingHumanVerified', 'MANUSCRIPT_MAPPING_HUMAN_VERIFICATION_REQUIRED'],
  ['c3ProductionReady', 'C3_PRODUCTION_NOT_READY'],
  ['productionPlanFrozen', 'PRODUCTION_PLAN_NOT_FROZEN'],
  ['productionWaveFrozen', 'PRODUCTION_WAVE_NOT_FROZEN'],
  ['executionAuthorityValid', 'EXECUTION_AUTHORITY_NOT_VALID'],
  ['localeReady', 'LOCALE_NOT_READY'],
  ['notAlreadyPublished', 'ARTICLE_ALREADY_PUBLISHED_FOR_LOCALE']
];

function titleFor(portfolioEntry, l10nRecord, locale) {
  const display = l10nRecord?.locales?.[locale]?.displayQuestion;
  if (display) return display.startsWith('为什么') ? display : portfolioEntry.titleZhHans || display;
  return locale === 'zh-Hans' ? portfolioEntry.titleZhHans : portfolioEntry.titleEn || portfolioEntry.titleZhHans || null;
}

export function buildArticleReadiness(root, { bookCode = 'BOOK-1', locale = 'zh-Hans' } = {}) {
  const portfolio = readJson(root, PORTFOLIO);
  const nodes = readJson(root, NODES);
  const l10n = readJson(root, L10N);
  const publications = readJson(root, PUBLICATIONS);
  const nodeMap = new Map((nodes.nodes || []).map(entry => [entry.nodeCode, entry]));
  const l10nMap = new Map((l10n.records || []).map(entry => [entry.nodeCode, entry]));
  const { map: decisionMap, paths: decisionPaths } = collectProductionDecisions(root);
  const { byNode: executionMap, paths: executionPaths } = collectExecutionBundles(root);

  const portfolioEntries = (portfolio.entries || []).filter(entry => entry.bookCode === bookCode);
  const entries = portfolioEntries.map((portfolioEntry, index) => {
    const node = nodeMap.get(portfolioEntry.nodeCode) || null;
    const decision = decisionMap.get(portfolioEntry.nodeCode) || null;
    const c2 = c2Evidence(root, portfolioEntry.nodeCode);
    const c3 = c3Evidence(root, portfolioEntry.nodeCode);
    const execution = executionMap.get(portfolioEntry.nodeCode) || null;
    const planItem = execution?.plan?.items?.find(item => item.nodeCode === portfolioEntry.nodeCode) || null;
    const waveItem = execution?.wave?.items?.find(item => item.nodeCode === portfolioEntry.nodeCode) || null;
    const l10nRecord = l10nMap.get(portfolioEntry.nodeCode) || null;
    const localeRecord = l10nRecord?.locales?.[locale] || null;
    const publicationRecord = (publications.records || []).find(record => record.nodeCode === portfolioEntry.nodeCode && record.locale === locale && record.decision === 'publish') || null;
    const portfolioPublishedForLocale = portfolioEntry.publication?.existingPublishedArticle === true && (portfolioEntry.publication?.locales || []).includes(locale);

    const gates = {
      canonicalNodePresent: Boolean(node),
      articleIntentApproved: Boolean(decision && decision.productionDecision === 'approve_for_production' && decision.productionRole === 'ARTICLE' && decision.decisionState === 'human_approved'),
      c2Frozen: c2.passed,
      manuscriptMappingHumanVerified: Boolean(decision && decision.manuscriptMappingDecision === 'range_approved'),
      c3ProductionReady: c3.passed,
      productionPlanFrozen: Boolean(execution?.plan && execution.plan.status === 'FROZEN' && planItem?.planStatus === 'FROZEN' && planItem?.productionRole === 'ARTICLE'),
      productionWaveFrozen: Boolean(execution?.wave && execution.wave.status === 'FROZEN' && waveItem?.productionRole === 'ARTICLE'),
      executionAuthorityValid: Boolean(execution?.authority && execution.authority.status === 'ACTIVE' && execution.authority.executionAuthority?.dispatchAllowed === true && execution.item?.productionRole === 'ARTICLE' && execution.item?.dispatchTarget === 'PJA'),
      localeReady: Boolean(localeRecord && localeRecord.availability === 'available' && localeRecord.stalenessStatus === 'current' && localeRecord.authority !== 'unassigned'),
      notAlreadyPublished: !(publicationRecord || portfolioPublishedForLocale)
    };
    const blockers = BLOCKERS.filter(([key]) => gates[key] !== true).map(([, code]) => code);
    const state = blockers.length === 0 ? 'ARTICLE_READY' : 'ARTICLE_NOT_READY';

    return {
      readinessIndex: index + 1,
      nodeCode: portfolioEntry.nodeCode,
      bookCode: portfolioEntry.bookCode,
      partCode: portfolioEntry.partCode || null,
      locale,
      title: titleFor(portfolioEntry, l10nRecord, locale),
      state,
      blockers,
      gates,
      authorityEvidence: {
        canonicalNode: node ? NODES : null,
        humanProductionDecision: decision?.sourcePath || null,
        c2FrozenRecord: c2.path,
        c2Digest: c2.digest,
        c3Assessment: c3.path,
        c3Digest: c3.digest,
        productionPlan: execution?.planPath || null,
        productionWave: execution?.wavePath || null,
        executionAuthority: execution?.authorityPath || null,
        localeRegistry: L10N,
        publicationRegistry: PUBLICATIONS,
        publicationRecordCode: publicationRecord?.publicationCode || null,
        portfolioPublishedForLocale
      }
    };
  });

  const ready = entries.filter(entry => entry.state === 'ARTICLE_READY');
  const notReady = entries.filter(entry => entry.state === 'ARTICLE_NOT_READY');
  const result = {
    schemaVersion: 'PHI-OS-APS-2-SINGLE-ARTICLE-READINESS-v1.0.0',
    work: 'APS-2',
    status: 'SINGLE_READINESS_PROJECTION_ACTIVE',
    baselineCommit: APS2_BASELINE,
    contractReference: APS2_CONTRACT,
    request: { bookCode, locale },
    interface: {
      readyState: 'ARTICLE_READY',
      notReadyState: 'ARTICLE_NOT_READY',
      failClosed: true,
      derivedOnly: true
    },
    summary: {
      evaluatedCount: entries.length,
      readyCount: ready.length,
      notReadyCount: notReady.length,
      readyNodeCodes: ready.map(entry => entry.nodeCode)
    },
    entries,
    governance: {
      canonicalKnowledgeMutationAllowed: false,
      c2OrC3MutationAllowed: false,
      humanDecisionCreationAllowed: false,
      productionAuthorityCreationAllowed: false,
      candidateCreationAllowed: false,
      providerInvocationAllowed: false,
      publicationAllowed: false,
      readinessEqualsAuthority: false
    },
    sourceAuthorityDigests: Object.fromEntries([
      PORTFOLIO,
      NODES,
      L10N,
      PUBLICATIONS,
      ...decisionPaths,
      ...executionPaths
    ].filter((value, index, array) => array.indexOf(value) === index).map(relative => [relative, fileDigest(root, relative)]))
  };

  const digestInput = structuredClone(result);
  result.readinessDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}
