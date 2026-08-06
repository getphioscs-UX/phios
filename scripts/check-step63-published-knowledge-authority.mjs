import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildPublishedKnowledgeAuthority, stable } from './lib/knowledge-public/published-authority-v1.mjs';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const sha = source => crypto.createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');

const contractPath = 'content/knowledge/contracts/published-knowledge-authority-v1.json';
const schemaPath = 'content/knowledge/production/schemas/published-knowledge-record-v1.schema.json';
const registryPath = 'content/knowledge/public/authority/published-knowledge-authority.json';
const freezePath = 'content/knowledge/production/freeze/pja-published-knowledge-authority-w1-freeze-v1.json';

const contract = json(contractPath);
const freeze = json(freezePath);
const actualRegistry = json(registryPath);
const expected = buildPublishedKnowledgeAuthority(root);

assert.equal(contract.policy.allThreeConditionsRequired, true);
assert.equal(contract.policy.registryPresenceEqualsPublicAvailability, false);
assert.equal(contract.policy.publicationPackageEqualsPublicProjection, false);
assert.equal(contract.policy.localeAuthorityIndependent, true);
for (const forbidden of ['modify_candidate','modify_review','modify_approval','modify_publication','modify_knowledge_registry','publish_without_package','project_unreviewed_content']) {
  assert.ok(contract.forbiddenOperations.includes(forbidden));
}

assert.equal(read(registryPath), stable(expected.registry), 'Published Knowledge Authority Registry must rebuild deterministically.');
assert.equal(actualRegistry.recordCount, actualRegistry.records.length);
assert.equal(actualRegistry.recordCount, 2);

const identities = new Set();
for (const record of actualRegistry.records) {
  const identity = `${record.nodeCode}:${record.locale}`;
  assert.equal(identities.has(identity), false, `Duplicate Published Knowledge Authority identity: ${identity}`);
  identities.add(identity);

  assert.deepEqual(record.eligibility, { contentReviewed:true, approved:true, published:true });
  assert.equal(record.publicStatus, 'eligible_for_public_projection');
  assert.match(record.authorityDigest, /^[a-f0-9]{64}$/);
  assert.match(record.lineage.candidateDigest, /^[a-f0-9]{64}$/);
  assert.match(record.lineage.reviewDigest, /^[a-f0-9]{64}$/);
  assert.match(record.lineage.approvalDigest, /^[a-f0-9]{64}$/);
  assert.match(record.lineage.publicationDigest, /^[a-f0-9]{64}$/);

  const publication = json(`content/knowledge/production/publications/${record.locale}/${record.nodeCode}/publication.v1.json`);
  assert.equal(publication.review.decision, 'accept');
  assert.equal(publication.approval.decision, 'approve');
  assert.equal(publication.decision, 'publish');
  assert.equal(publication.governance.publicRuntimeProjectionWritten, false);
  assert.equal(record.lineage.publicationDigest, publication.publicationDigest);
  assert.equal(record.lineage.approvalDigest, publication.approval.approvalDigest);
  assert.equal(record.lineage.reviewDigest, publication.review.reviewDigest);
  assert.equal(record.lineage.candidateDigest, publication.candidate.candidateDigest);

  const articlePath = `content/knowledge/public/authority/articles/${record.locale}/${record.nodeCode}.json`;
  assert.equal(read(articlePath), stable(record));
  assert.equal(JSON.stringify(record).includes('reviewerCode'), false);
  assert.equal(JSON.stringify(record).includes('approverCode'), false);
  assert.equal(JSON.stringify(record).includes('publisherCode'), false);
}

assert.ok(identities.has('KN-PREFACE-001:zh-Hans'));
assert.ok(identities.has('KN-PREFACE-001:en'));

const legacyCatalog = json('content/knowledge/public/public-knowledge-catalog.json');
assert.equal(legacyCatalog.records[0].publishedArticleCount, 6, 'STEP36 frozen Public Foundation must remain unchanged.');
assert.equal(legacyCatalog.records[0].publishedNodeCount, 3, 'STEP36 frozen Public Foundation must remain unchanged.');

for (const [rel, digest] of Object.entries(freeze.digests)) {
  assert.equal(sha(read(rel)), digest, `STEP63 freeze digest mismatch: ${rel}`);
}
assert.equal(freeze.acceptance.eligiblePublicationCount, 2);
assert.equal(freeze.acceptance.uniqueCanonicalNodeCount, 1);
assert.deepEqual(freeze.acceptance.locales, ['en','zh-Hans']);
assert.equal(freeze.acceptance.publicFoundationMutated, false);
assert.equal(freeze.acceptance.reviewAuthorityChanged, false);
assert.equal(freeze.acceptance.approvalAuthorityChanged, false);
assert.equal(freeze.acceptance.publicationAuthorityChanged, false);

console.log('✓ STEP63 Published Knowledge Authority contract passed.');
console.log('✓ Only content_reviewed + approved + published locale packages entered the authority layer.');
console.log(`✓ ${actualRegistry.recordCount} locale publications / ${new Set(actualRegistry.records.map(r=>r.nodeCode)).size} Canonical Node eligible for public projection.`);
console.log('✓ STEP36 frozen Public Foundation remained unchanged; STEP64 indexing is not performed.');
