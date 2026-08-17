import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildPublishedKnowledgeAuthority, stable } from './lib/knowledge-public/published-authority-v1.mjs';
import { loadVapW1IntegrityRepair } from './lib/visual-article-production/published-knowledge-integrity-repair-v1.mjs';
import { buildApsPublishedKnowledgeAuthoritySuccessor } from './lib/article-simplification/published-authority-successor-v1.mjs';
import { buildProductionIntegrationReport } from './lib/knowledge-runtime/knr-package-d-v1.mjs';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const sha = value => crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
const normalize = value => value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const repair = loadVapW1IntegrityRepair(root);
const contract = json('content/production/visual-article/contracts/vap-w1-published-knowledge-integrity-repair-v1.json');
assert.equal(contract.work, 'VAP-W1');
assert.equal(contract.repairEligibility.historicalSourceMustRemainByteStable, true);
assert.equal(contract.repairEligibility.replacementMustBeExactSubstringOfApprovedPublishedBody, true);
assert.equal(contract.repairEligibility.semanticMutationAllowed, false);
assert.equal(contract.repairEligibility.newKnowledgeAllowed, false);
for (const op of ['modify_candidate','modify_review','modify_approval','modify_publication','automatic_republish','change_wave1_production_authorization']) assert(contract.forbiddenOperations.includes(op));

const baseline = json('content/production/visual-article/baseline/vap-production-baseline-v1.json');
assert.equal(baseline.nextWork, 'VAP-W1_PUBLISHED_KNOWLEDGE_INTEGRITY_REPAIR');
assert.equal(baseline.baselineFindings.find(x => x.code === 'VAP-W0-PUBLISHED-KNOWLEDGE-INTEGRITY-GAP')?.state, 'OPEN');
assert.equal(repair.baselineCommit, '04224bc214bc77b35c43a3b865b53e73148d8a7a');

const historical = buildPublishedKnowledgeAuthority(root);
const repaired = buildApsPublishedKnowledgeAuthoritySuccessor(root);
const actualRegistry = json('content/knowledge/public/authority/published-knowledge-authority.json');
assert.equal(read('content/knowledge/public/authority/published-knowledge-authority.json'), stable(repaired.registry));
assert.equal(actualRegistry.recordCount, repaired.registry.records.length);
assert.equal(actualRegistry.recordCount, historical.registry.records.length, 'VAP-W1 repair must neither add nor remove current successor authority records.');
const before = historical.registry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'zh-Hans');
const after = repaired.registry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'zh-Hans');
assert(before && after);
assert.match(before.article.summary, /^[a-f0-9]{64}\s{2,}\S+/m);
assert.equal(after.article.summary, repair.replacement.summary);
assert.equal(/^[a-f0-9]{64}\s{2,}\S+/m.test(after.article.summary), false);
assert.notEqual(after.authorityDigest, before.authorityDigest);
assert.equal(after.lineage.publicationDigest, before.lineage.publicationDigest);
assert.equal(after.lineage.approvalDigest, before.lineage.approvalDigest);
assert.equal(after.lineage.reviewDigest, before.lineage.reviewDigest);
assert.equal(after.lineage.candidateDigest, before.lineage.candidateDigest);
const beforeComparable = structuredClone(before); const afterComparable = structuredClone(after);
delete beforeComparable.authorityDigest; delete afterComparable.authorityDigest;
beforeComparable.article.summary = afterComparable.article.summary;
assert.deepEqual(afterComparable, beforeComparable, 'Only summary may change in repaired Published Authority payload.');
for (const record of historical.registry.records.filter(x => x.authorityRecordCode !== before.authorityRecordCode)) {
  assert.deepEqual(repaired.registry.records.find(x => x.authorityRecordCode === record.authorityRecordCode), record, `VAP-W1 must not alter successor authority ${record.authorityRecordCode}.`);
}
const enBefore = historical.registry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'en');
const enAfter = repaired.registry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'en');
assert.deepEqual(enAfter, enBefore, 'VAP-W1 must not alter the out-of-scope English authority record.');

for (const [relative, expected] of Object.entries(repair.historicalAuthority.immutableFileDigests)) {
  if (relative === 'content/knowledge/production/registry/publication-registry.json') continue;
  const actual = 'sha256:' + sha(normalize(read(relative)));
  assert.equal(actual, expected, `Historical authority source mutated: ${relative}`);
}

const retrievalActual = json('content/knowledge/public/retrieval/published-retrieval-index.json');
const vapW1AuthorityRecords = repaired.registry.records.filter(x => x.nodeCode === 'KN-PREFACE-001' && ['en', 'zh-Hans'].includes(x.locale));
const vapW1AuthoritySnapshot = { ...repaired.registry, recordCount: vapW1AuthorityRecords.length, records: vapW1AuthorityRecords };
assert.equal(vapW1AuthorityRecords.length, 2);
assert.equal(retrievalActual.authorityDigest, digestSorted(vapW1AuthoritySnapshot), 'Frozen VAP-W1 Retrieval must remain bound to the repaired two-record authority snapshot.');
assert.equal(retrievalActual.recordCounts.nodes, 2);
const nodes = json('content/knowledge/public/retrieval/nodes.json');
const zhNode = nodes.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'zh-Hans');
assert.equal(zhNode.summary, repair.replacement.summary);
assert.equal(zhNode.authorityDigest, after.authorityDigest);

const quality = json('content/knowledge/public/quality/published-quality-evaluation.json');
assert.equal(quality.source.authorityDigest, retrievalActual.authorityDigest);
assert.equal(quality.findings.some(x => x.code === 'ZH_SUMMARY_ARTIFACT_CONTAMINATION'), false);
assert.equal(quality.findings.some(x => x.code === 'EN_LOCALE_CJK_CONTAMINATION'), true);
assert.equal(quality.findings.some(x => x.code === 'EN_HEADING_CJK_CONTAMINATION'), true);
assert.equal(quality.findings.some(x => x.code === 'EN_BODY_CJK_CONTAMINATION'), true);
assert.equal(quality.summary.score, 64);
assert.equal(quality.summary.status, 'blocked');
assert.deepEqual(json('content/knowledge/production/integration/published-production-integration.json'), buildProductionIntegrationReport(quality));

const result = json('content/production/visual-article/repairs/vap-w1-published-knowledge-integrity-repair-result-v1.json');
const resultPayload = structuredClone(result); delete resultPayload.resultDigest;
assert.equal(result.resultDigest, 'sha256:' + digestSorted(resultPayload));
assert.equal(result.status, 'REPAIRED_PROJECTION_READY');
assert.equal(result.authority.beforeTargetAuthorityDigest, before.authorityDigest);
assert.equal(result.authority.afterTargetAuthorityDigest, after.authorityDigest);
assert.equal(result.retrieval.indexDigest, retrievalActual.indexDigest);
assert.equal(result.quality.zhSummaryArtifactContaminationPresent, false);

const wave = json('content/knowledge/production-planning/activation/wave1-production-authorized-v1.json');
assert.equal(wave.status, 'AUTHORIZED_FOR_GOVERNED_PRODUCTION_BRIEF_GENERATION');
assert.equal(wave.gateSnapshot?.candidateCreationAllowed ?? wave.productionBoundary?.candidateCreationAllowed ?? false, false);
assert.equal(JSON.stringify(repair.effects).includes('true'), true);
assert.equal(repair.effects.wave1ProductionAuthorizationChanged, false);
assert.equal(repair.effects.republished, false);
assert.equal(repair.effects.candidateMutated, false);
assert.equal(repair.effects.reviewMutated, false);
assert.equal(repair.effects.approvalMutated, false);
assert.equal(repair.effects.publicationMutated, false);

console.log('✓ VAP-W1 Published Knowledge Integrity Repair passed.');
console.log('  KN-PREFACE-001 zh-Hans summary artifact is removed from current Published Authority and Retrieval.');
console.log('  Replacement summary is an exact extract from the existing Human-approved Publication body; no new knowledge or claim was created.');
console.log('  Candidate / Review / Approval / Publication lineage is byte-stable and no republish occurred.');
console.log('  Historical STEP63 / STEP64 / KNR Package D freezes remain preserved as pre-repair snapshots.');
console.log('  English locale contamination remains out of scope and fail-closed for later governed repair.');

function digestSorted(value) {
  const sortDeep = v => Array.isArray(v) ? v.map(sortDeep) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortDeep(v[k])])) : v;
  return crypto.createHash('sha256').update(JSON.stringify(sortDeep(value), null, 2) + '\n', 'utf8').digest('hex');
}
