import fs from 'node:fs';
import path from 'node:path';

export const D_ROOT = 'content/knowledge/editorial/d';
export const D_CONTRACT = `${D_ROOT}/book-i-batch-production.contract.json`;
export const D_STATE = `${D_ROOT}/book-i-batch-production-state.json`;
export const BATCH_OUTPUT_ROOT = 'content/knowledge/production/batches';

export function buildBatchPlan(root) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const registry = read('content/knowledge/registry/nodes.json');
  const c3 = read('content/knowledge/editorial/c3/universal-production-readiness-index.json');
  const contract = read(D_CONTRACT);
  const registryByCode = new Map(registry.nodes.map(node => [node.nodeCode, node]));
  const codes = c3.entries.map(entry => entry.nodeCode);
  if (new Set(codes).size !== codes.length || codes.some(code => !registryByCode.has(code))) throw coded('C3_TOPOLOGY_CONFLICT');
  const scopedNodes = codes.map(code => registryByCode.get(code));
  const assessments = new Map(c3.entries.map(entry => [entry.nodeCode, read(entry.assessmentFile)]));
  const eligible = selectEligible(scopedNodes, c3.entries, assessments);
  const batches = groupEligible(eligible, contract.grouping.maximumBatchSize);
  return {
    schemaVersion: 'PHI-OS-PJA-W2F-D-PLAN-v1.0.0', stage: 'PJA-W2F-D',
    status: eligible.length ? 'planned' : 'no_eligible_nodes',
    bookINodes: codes.length,
    productionReadyNodes: c3.entries.filter(entry => entry.productionReady).length,
    productionBlockedNodes: c3.entries.filter(entry => !entry.productionReady).length,
    eligibleNodes: eligible.map(item => item.nodeCode),
    plannedBatches: batches,
    filesThatWouldChange: batches.map(batch => `${BATCH_OUTPUT_ROOT}/${batch.batchId}/production-manifest.json`),
    generatedArticles: 0, generatedProductionExports: 0, published: 0
  };
}

export function selectEligible(nodes, entries, assessments) {
  const entryByCode = new Map(entries.map(entry => [entry.nodeCode, entry]));
  return nodes.flatMap((node, canonicalIndex) => {
    const entry = entryByCode.get(node.nodeCode), assessment = assessments.get(node.nodeCode);
    const eligible = entry?.productionReady === true && entry.status === 'production_ready' && entry.exportability === 'allowed' &&
      Array.isArray(entry.blocking) && entry.blocking.length === 0 && assessment?.productionReady === true && assessment.exportability === 'allowed' &&
      assessment.gates?.humanProductionApproval?.status === 'passed' && assessment.gates?.c2FrozenThesisBoundary?.status === 'passed' &&
      assessment.authority?.c2FreezeHashMatched === true;
    return eligible ? [{ nodeCode: node.nodeCode, canonicalIndex, part: partOf(node), compatibility: `${node.primaryAssetType || 'article'}:${node.canonicalLanguage || 'zh-Hans'}`, assessmentFile: entry.assessmentFile, c2ContentHash: assessment.authority.c2ContentHash }] : [];
  });
}

export function groupEligible(eligible, maximumBatchSize) {
  const groups = new Map();
  for (const item of eligible) { const key = `${item.part}|${item.compatibility}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); }
  const batches = [];
  for (const [key, items] of groups) {
    items.sort((a, b) => a.canonicalIndex - b.canonicalIndex);
    for (let offset = 0; offset < items.length; offset += maximumBatchSize) {
      const slice = items.slice(offset, offset + maximumBatchSize), [part, compatibility] = key.split('|');
      batches.push({ batchId: `book-i-${part.toLowerCase()}-${String(Math.floor(offset / maximumBatchSize) + 1).padStart(3, '0')}`, part, compatibility, nodeCount: slice.length, nodeCodes: slice.map(item => item.nodeCode), canonicalIndexes: slice.map(item => item.canonicalIndex), packageType: 'governed_production_input', articleBodyGenerated: false, productionExportGenerated: false });
    }
  }
  return batches.sort((a, b) => a.canonicalIndexes[0] - b.canonicalIndexes[0]);
}

export function expectedEmptyState(plan) {
  return { schemaVersion: 'PHI-OS-PJA-W2F-D-BATCH-STATE-v1.0.0', stage: 'PJA-W2F-D', systemStatus: 'frozen', freezeLabel: 'PJA-W2F-D-v1.0.0-Frozen', bookIBatchState: 'empty', reason: 'No C3 production-ready nodes', bookINodes: plan.bookINodes, productionReadyNodes: plan.productionReadyNodes, productionBlockedNodes: plan.productionBlockedNodes, eligibleNodes: [], plannedBatches: [], generatedProductionPackages: 0, generatedArticles: 0, generatedProductionExports: 0, published: 0 };
}

export function buildPackageManifest(batch, plan) {
  return { schemaVersion: 'PHI-OS-PJA-W2F-D-PRODUCTION-PACKAGE-v1.0.0', stage: 'PJA-W2F-D', batchId: batch.batchId, part: batch.part, nodeCodes: batch.nodeCodes, canonicalOrder: batch.canonicalIndexes, packageType: batch.packageType, inputs: batch.nodeCodes.map(nodeCode => ({ nodeCode, c3AssessmentRequired: true, c2FreezeHashRequired: true, productionBriefReference: null, sourceClaimBoundaryBindingsRequired: true })), expectedOutputPaths: batch.nodeCodes.map(nodeCode => `content/knowledge/production/articles/${nodeCode.toLowerCase()}`), validationRequirements: ['C3 production_ready remains valid', 'C2 freeze hash remains matched', 'human production approval remains valid', 'Article body requires independent human review'], effects: { articleBodyGenerated: false, productionExportGenerated: false, published: false } };
}

export function findBatchConflicts(root, batches) {
  return batches.filter(batch => fs.existsSync(path.join(root, BATCH_OUTPUT_ROOT, batch.batchId, 'production-manifest.json'))).map(batch => batch.batchId);
}

export function validateBatchSystem(root) {
  const plan = buildBatchPlan(root), errors = [];
  const state = JSON.parse(fs.readFileSync(path.join(root, D_STATE), 'utf8'));
  if (!plan.eligibleNodes.length && JSON.stringify(state) !== JSON.stringify(expectedEmptyState(plan))) errors.push('EMPTY_STATE_CONFLICT');
  if (plan.eligibleNodes.length === 0 && plan.filesThatWouldChange.length !== 0) errors.push('ZERO_READY_WRITE_PLAN');
  return { valid: errors.length === 0, errors, plan };
}

function partOf(node) { const match = node.nodeCode.match(/^KN-B1-(P\d+)-/); return match ? match[1] : node.nodeCode.startsWith('KN-PREFACE-') ? 'P0' : 'UNMAPPED'; }
function coded(code) { const error = new Error(code); error.code = code; return error; }
