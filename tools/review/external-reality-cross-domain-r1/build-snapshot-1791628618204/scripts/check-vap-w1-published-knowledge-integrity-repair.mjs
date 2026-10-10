import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildPublishedKnowledgeAuthority, stable, hashValue } from './lib/knowledge-public/published-authority-v1.mjs';
import { loadVapW1IntegrityRepair } from './lib/visual-article-production/published-knowledge-integrity-repair-v1.mjs';
import { buildApsPublishedKnowledgeAuthoritySuccessor } from './lib/article-simplification/published-authority-successor-v1.mjs';
import { buildProductionIntegrationReport } from './lib/knowledge-runtime/knr-package-d-v1.mjs';
import { activeEditorialRevisions, validateEditorialRevisionAgainstAuthority } from './lib/article-editorial-revision/article-editorial-revision-v1.mjs';

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
const editorialRevisionByKey = new Map(activeEditorialRevisions(root).map(revision => [`${revision.nodeCode}:${revision.locale}`, revision]));
const historicalRepairedTarget = structuredClone(before);
historicalRepairedTarget.article.summary = repair.replacement.summary;
const historicalRepairedTargetBase = structuredClone(historicalRepairedTarget); delete historicalRepairedTargetBase.authorityDigest;
historicalRepairedTarget.authorityDigest = hashValue(historicalRepairedTargetBase);
const targetRevision = editorialRevisionByKey.get(`${before.nodeCode}:${before.locale}`);
assert.deepEqual(
  after,
  expectedAuthorityRecordWithEditorialRevision(historicalRepairedTarget, targetRevision),
  targetRevision
    ? `VAP-W1 repaired target may change further only through governed public editorial revision ${targetRevision.revisionCode}.`
    : 'Only the repaired summary and recomputed authorityDigest may change in the VAP-W1 target authority payload.'
);
for (const record of historical.registry.records.filter(x => x.authorityRecordCode !== before.authorityRecordCode)) {
  const current = repaired.registry.records.find(x => x.authorityRecordCode === record.authorityRecordCode);
  const revision = editorialRevisionByKey.get(`${record.nodeCode}:${record.locale}`);
  assert.deepEqual(
    current,
    expectedAuthorityRecordWithEditorialRevision(record, revision),
    revision
      ? `VAP-W1 must preserve ${record.authorityRecordCode} except for its independently governed public editorial revision ${revision.revisionCode}.`
      : `VAP-W1 must not alter successor authority ${record.authorityRecordCode}.`
  );
}
const enBefore = historical.registry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'en');
const enAfter = repaired.registry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'en');
const enRevision = editorialRevisionByKey.get(`${enBefore.nodeCode}:${enBefore.locale}`);
assert.deepEqual(
  enAfter,
  expectedAuthorityRecordWithEditorialRevision(enBefore, enRevision),
  enRevision
    ? `VAP-W1 must not alter the out-of-scope English authority except for governed public editorial revision ${enRevision.revisionCode}.`
    : 'VAP-W1 must not alter the out-of-scope English authority record.'
);

for (const [relative, expected] of Object.entries(repair.historicalAuthority.immutableFileDigests)) {
  if (relative === 'content/knowledge/production/registry/publication-registry.json') continue;
  const actual = 'sha256:' + sha(normalize(read(relative)));
  assert.equal(actual, expected, `Historical authority source mutated: ${relative}`);
}

const retrievalActual = json('content/knowledge/public/retrieval/published-retrieval-index.json');
const nodes = json('content/knowledge/public/retrieval/nodes.json');
const zhNode = nodes.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'zh-Hans');
assert(zhNode, 'Current retrieval successor must retain the VAP-W1 repaired zh-Hans Preface node.');
assert.equal(zhNode.summary, repair.replacement.summary);
assert.equal(zhNode.authorityDigest, after.authorityDigest);
assert.equal(/^[a-f0-9]{64}\s{2,}\S+/m.test(String(zhNode.summary ?? '')), false);

// VAP-W1 result is historical evidence. Rebuild only its two-record repaired authority snapshot;
// later additive Publications / public editorial overlays are current-successor state and must not rewrite this evidence.
const historicalPostRepairRecords = historical.registry.records
  .filter(x => x.nodeCode === 'KN-PREFACE-001' && ['en', 'zh-Hans'].includes(x.locale))
  .map(x => structuredClone(x));
const historicalPostRepairZh = historicalPostRepairRecords.find(x => x.locale === 'zh-Hans');
historicalPostRepairZh.article.summary = repair.replacement.summary;
const historicalPostRepairZhBase = structuredClone(historicalPostRepairZh); delete historicalPostRepairZhBase.authorityDigest;
historicalPostRepairZh.authorityDigest = hashValue(historicalPostRepairZhBase);
const historicalPostRepairRegistry = { ...historical.registry, recordCount: historicalPostRepairRecords.length, records: historicalPostRepairRecords };

const result = json('content/production/visual-article/repairs/vap-w1-published-knowledge-integrity-repair-result-v1.json');
const resultPayload = structuredClone(result); delete resultPayload.resultDigest;
assert.equal(result.resultDigest, 'sha256:' + digestSorted(resultPayload));
assert.equal(result.status, 'REPAIRED_PROJECTION_READY');
assert.equal(result.authority.recordCount, 2);
assert.equal(result.authority.beforeTargetAuthorityDigest, before.authorityDigest);
assert.equal(result.authority.afterTargetAuthorityDigest, historicalPostRepairZh.authorityDigest);
assert.equal(result.authority.afterTargetAuthorityDigest, historicalRepairedTarget.authorityDigest);
assert.equal(result.retrieval.authorityDigest, digestSorted(historicalPostRepairRegistry), 'Historical VAP-W1 result must remain bound to its repaired two-record authority snapshot.');
assert.equal(result.retrieval.nodeCount, 2);
assert.equal(result.quality.zhSummaryArtifactContaminationPresent, false);
assert.equal(result.quality.status, 'blocked');
assert.equal(result.quality.score, 64);
assert.deepEqual(result.quality.findings, ['EN_LOCALE_CJK_CONTAMINATION','EN_HEADING_CJK_CONTAMINATION','EN_BODY_CJK_CONTAMINATION']);
if ((retrievalActual.recordCounts?.nodes ?? 0) > result.retrieval.nodeCount) {
  assert.notEqual(retrievalActual.authorityDigest, result.retrieval.authorityDigest, 'Additive successor retrieval must not masquerade as the historical VAP-W1 snapshot.');
}

// The Package D files may later acquire their own current successor. If they still represent the VAP-W1
// two-record snapshot, require exact historical binding; otherwise VAP-W1 only owns the closed zh summary finding.
const quality = json('content/knowledge/public/quality/published-quality-evaluation.json');
if (quality.source?.authorityDigest === result.retrieval.authorityDigest) {
  assert.equal(quality.source.indexDigest, result.retrieval.indexDigest);
  assert.equal(quality.findings.some(x => x.code === 'ZH_SUMMARY_ARTIFACT_CONTAMINATION'), false);
  assert.equal(quality.summary.score, 64);
  assert.equal(quality.summary.status, 'blocked');
  assert.deepEqual(json('content/knowledge/production/integration/published-production-integration.json'), buildProductionIntegrationReport(quality));
} else {
  assert.equal(quality.findings.some(x => x.code === 'ZH_SUMMARY_ARTIFACT_CONTAMINATION' && x.nodeCode === 'KN-PREFACE-001'), false, 'Any Package D successor must preserve closure of the VAP-W1 zh-Hans Preface contamination finding.');
}

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


function expectedAuthorityRecordWithEditorialRevision(baseRecord, revision) {
  if (!revision) return structuredClone(baseRecord);
  const validation = validateEditorialRevisionAgainstAuthority(revision, baseRecord);
  assert.equal(validation.valid, true, `Governed editorial revision ${revision.revisionCode} is invalid against ${baseRecord.authorityRecordCode}: ${validation.errors.join(',')}`);
  const expected = structuredClone(baseRecord);
  expected.article.bodyMarkdown = revision.replacementBodyMarkdown;
  expected.editorialRevision = {
    revisionCode: revision.revisionCode,
    revisionClass: revision.revisionClass,
    sourcePublicationDigest: revision.sourcePublicationDigest,
    baseBodyDigest: revision.baseBodyDigest,
    replacementBodyDigest: revision.replacementBodyDigest,
    authorizedBy: revision.authorization.authorizedBy,
    authorizedAt: revision.authorization.authorizedAt,
    semanticChangeAllowed: false,
    scope: revision.scope
  };
  const expectedBase = structuredClone(expected); delete expectedBase.authorityDigest;
  expected.authorityDigest = hashValue(expectedBase);
  return expected;
}

function digestSorted(value) {
  const sortDeep = v => Array.isArray(v) ? v.map(sortDeep) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortDeep(v[k])])) : v;
  return crypto.createHash('sha256').update(JSON.stringify(sortDeep(value), null, 2) + '\n', 'utf8').digest('hex');
}
