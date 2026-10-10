import assert from 'node:assert/strict';
import { makeFixtureRoot, removeFixtureRoot, progressFixtureTo, json, verifyKnrL10nFreeze, exists } from './lib/article-bilingual-production/check-fixture-v1.mjs';
const source = process.cwd(); const fixture = makeFixtureRoot(source, 'abl3');
try {
  const result = await progressFixtureTo(fixture, 'ABL-3');
  assert.equal(result.status, 'AWAITING_TL_ENGLISH_REVIEW_APPROVAL_PUBLICATION');
  const batch = json(fixture, 'content/production/article-simplification/batches/BATCH-001/batch-plan.v1.json');
  const registry = json(fixture, 'content/knowledge/production/registry/candidate-registry.json');
  for (const sourceEntry of batch.entries) {
    const candidate = json(fixture, `content/knowledge/production/candidates/en/${sourceEntry.nodeCode}/candidate.v1.json`);
    assert.equal(candidate.locale, 'en'); assert.equal(candidate.candidateState, 'ready_for_human_review'); assert.equal(candidate.authority.candidateContent, 'candidate_only'); assert.equal(candidate.authority.publication, 'not_published'); assert.equal(candidate.provenance.independentLocaleAuthoring, true);
    assert.equal(/[\u3400-\u9FFF\uF900-\uFAFF]/u.test(JSON.stringify(candidate.article)), false);
    assert.equal(registry.records.some(record => record.nodeCode === sourceEntry.nodeCode && record.locale === 'en' && record.candidateDigest === candidate.candidateDigest), true);
    assert.equal(exists(fixture, `content/knowledge/production/reviews/en/${sourceEntry.nodeCode}/review.v1.json`), false);
    assert.equal(exists(fixture, `content/knowledge/production/approvals/en/${sourceEntry.nodeCode}/approval.v1.json`), false);
    assert.equal(exists(fixture, `content/knowledge/production/publications/en/${sourceEntry.nodeCode}/publication.v1.json`), false);
  }
  verifyKnrL10nFreeze(fixture);
  console.log('✓ ABL-3 Independent English Candidate Batch passed.');
  console.log('✓ Six independently authored English submissions become digest-bound Candidate-only PJA records; no Review / Approval / Publication is inferred.');
} finally { removeFixtureRoot(fixture); }
