import assert from 'node:assert/strict';
import { makeFixtureRoot, removeFixtureRoot, progressFixtureTo, readAbl, verifyKnrL10nFreeze, exists } from './lib/article-bilingual-production/check-fixture-v1.mjs';
const source = process.cwd(); const fixture = makeFixtureRoot(source, 'abl2');
try {
  const result = await progressFixtureTo(fixture, 'ABL-2');
  assert.equal(result.status, 'AWAITING_ENGLISH_CANDIDATE_AUTHORING');
  const authority = await readAbl(fixture, 'BATCH-001', 'identityAuthority');
  const batch = await readAbl(fixture, 'BATCH-001', 'productionBatch');
  assert.equal(authority.recordCount, 6); assert.equal(batch.entryCount, 6);
  for (const entry of batch.entries) {
    const brief = await (await import('./lib/article-bilingual-production/abl-v1.mjs')).readJson(fixture, entry.briefPath);
    const prompt = await (await import('./lib/article-bilingual-production/abl-v1.mjs')).readJson(fixture, entry.promptPath);
    assert.equal(brief.locale, 'en'); assert.equal(brief.governance.independentAuthoringRequired, true); assert.equal(brief.governance.translationOfZhArticleRequired, false);
    assert.equal(prompt.authoringMode, 'independent_english_authoring'); assert.equal(prompt.writingContract.translationProhibited, true);
    assert.equal(exists(fixture, `content/knowledge/production/candidates/en/${entry.nodeCode}/candidate.v1.json`), false);
  }
  verifyKnrL10nFreeze(fixture);
  console.log('✓ ABL-2 Independent English Brief + Prompt Batch passed.');
  console.log('✓ Six TL-reviewed locale identities produce six governed English briefs/prompts with zero Candidate authority creation.');
  console.log('✓ No automatic zh-Hans article translation and no implicit paid-AI/network call is introduced.');
} finally { removeFixtureRoot(fixture); }
