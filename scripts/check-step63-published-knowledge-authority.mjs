import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { buildPublishedKnowledgeAuthority, stable } from './lib/knowledge-public/published-authority-v1.mjs';
import { buildVapW1RepairedPublishedKnowledgeAuthority, loadVapW1IntegrityRepair } from './lib/visual-article-production/published-knowledge-integrity-repair-v1.mjs';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const sha = source => crypto.createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
const contractPath = 'content/knowledge/contracts/published-knowledge-authority-v1.json';
const schemaPath = 'content/knowledge/production/schemas/published-knowledge-record-v1.schema.json';
const registryPath = 'content/knowledge/public/authority/published-knowledge-authority.json';
const freezePath = 'content/knowledge/production/freeze/pja-published-knowledge-authority-w1-freeze-v1.json';
const zhArticlePath = 'content/knowledge/public/authority/articles/zh-Hans/KN-PREFACE-001.json';
const checkerPath = 'scripts/check-step63-published-knowledge-authority.mjs';

const contract = json(contractPath);
const freeze = json(freezePath);
const repair = loadVapW1IntegrityRepair(root);
const actualRegistry = json(registryPath);
const historical = buildPublishedKnowledgeAuthority(root);
const expected = buildVapW1RepairedPublishedKnowledgeAuthority(root);

assert.equal(contract.policy.allThreeConditionsRequired, true);
assert.equal(contract.policy.registryPresenceEqualsPublicAvailability, false);
assert.equal(contract.policy.publicationPackageEqualsPublicProjection, false);
assert.equal(contract.policy.localeAuthorityIndependent, true);
for (const forbidden of ['modify_candidate','modify_review','modify_approval','modify_publication','modify_knowledge_registry','publish_without_package','project_unreviewed_content']) assert.ok(contract.forbiddenOperations.includes(forbidden));

assert.equal(read(registryPath), stable(expected.registry), 'Published Knowledge Authority must rebuild deterministically with the governed VAP-W1 projection repair.');
assert.equal(actualRegistry.recordCount, 2);
const identities = new Set();
for (const record of actualRegistry.records) {
  const identity = `${record.nodeCode}:${record.locale}`;
  assert.equal(identities.has(identity), false, `Duplicate Published Knowledge Authority identity: ${identity}`);
  identities.add(identity);
  assert.deepEqual(record.eligibility, { contentReviewed:true, approved:true, published:true });
  assert.equal(record.publicStatus, 'eligible_for_public_projection');
  assert.match(record.authorityDigest, /^[a-f0-9]{64}$/);
  const publication = json(`content/knowledge/production/publications/${record.locale}/${record.nodeCode}/publication.v1.json`);
  assert.equal(record.lineage.publicationDigest, publication.publicationDigest);
  assert.equal(record.lineage.approvalDigest, publication.approval.approvalDigest);
  assert.equal(record.lineage.reviewDigest, publication.review.reviewDigest);
  assert.equal(record.lineage.candidateDigest, publication.candidate.candidateDigest);
  const articlePath = `content/knowledge/public/authority/articles/${record.locale}/${record.nodeCode}.json`;
  assert.equal(read(articlePath), stable(record));
}
assert.ok(identities.has('KN-PREFACE-001:zh-Hans'));
assert.ok(identities.has('KN-PREFACE-001:en'));

const historicalZh = historical.registry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'zh-Hans');
const repairedZh = actualRegistry.records.find(x => x.nodeCode === 'KN-PREFACE-001' && x.locale === 'zh-Hans');
assert.equal(historicalZh.authorityDigest, repair.historicalProjectionSnapshots.step63ZhAuthorityDigest);
assert.equal(sha(stable(historical.registry)), freeze.digests[registryPath], 'Historical STEP63 registry must remain reproducible from immutable Publication Packages.');
assert.equal(sha(stable(historical.articleFiles[zhArticlePath])), freeze.digests[zhArticlePath], 'Historical STEP63 zh-Hans article must remain reproducible.');
assert.equal(historicalZh.article.summary.includes('INSTALL.md'), true);
assert.equal(repairedZh.article.summary, repair.replacement.summary);
assert.equal(repairedZh.article.summary.includes('INSTALL.md'), false);
const historicalComparable = structuredClone(historicalZh); const repairedComparable = structuredClone(repairedZh);
delete historicalComparable.authorityDigest; delete repairedComparable.authorityDigest;
historicalComparable.article.summary = repairedComparable.article.summary;
assert.deepEqual(repairedComparable, historicalComparable, 'VAP-W1 may change only the repaired summary field before authorityDigest recomputation.');
assert.notEqual(repairedZh.authorityDigest, historicalZh.authorityDigest);

const supersededCurrentOutputs = new Set([registryPath, zhArticlePath, checkerPath]);
for (const [rel, digest] of Object.entries(freeze.digests)) {
  if (rel === registryPath) continue;
  if (rel === zhArticlePath) continue;
  if (rel === checkerPath) {
    verifyHistoricalCheckerDigest(rel, digest, repair.baselineCommit);
    continue;
  }
  assert.equal(sha(read(rel)), digest, `STEP63 historical freeze implementation digest mismatch: ${rel}`);
}
assert.equal(supersededCurrentOutputs.size, 3);
assert.equal(freeze.acceptance.publicFoundationMutated, false);
assert.equal(freeze.acceptance.reviewAuthorityChanged, false);
assert.equal(freeze.acceptance.approvalAuthorityChanged, false);
assert.equal(freeze.acceptance.publicationAuthorityChanged, false);

console.log('✓ STEP63 Published Knowledge Authority compatibility passed with VAP-W1 integrity repair.');
console.log('✓ Historical Publication Packages and STEP63 freeze remain immutable and reproducible.');
console.log('✓ KN-PREFACE-001 zh-Hans summary is repaired only at Published Projection; lineage is unchanged and authorityDigest is recomputed.');

function verifyHistoricalCheckerDigest(rel, digest, ref) {
  try {
    const source = execFileSync('git', ['show', `${ref}:${rel}`], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
    assert.equal(sha(source), digest, `STEP63 historical checker digest mismatch: ${rel}`);
  } catch (error) {
    if (hasGitRepository()) throw error;
    assert.match(digest, /^[a-f0-9]{64}$/);
  }
}
function hasGitRepository() {
  try { execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: root, stdio: 'pipe' }); return true; } catch { return false; }
}
