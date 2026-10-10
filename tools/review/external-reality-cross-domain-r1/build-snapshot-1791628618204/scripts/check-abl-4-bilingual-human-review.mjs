import assert from 'node:assert/strict';
import { makeFixtureRoot, removeFixtureRoot, progressFixtureTo, readAbl, json, exists, verifyKnrL10nFreeze } from './lib/article-bilingual-production/check-fixture-v1.mjs';
const source = process.cwd(); const fixture = makeFixtureRoot(source, 'abl4');
try {
  const result = await progressFixtureTo(fixture, 'ABL-4');
  assert.equal(result.status, 'READY_FOR_ABL_5_PUBLICATION');
  const bridge = await readAbl(fixture, 'BATCH-001', 'decisionBridge');
  assert.equal(bridge.entryCount, 6); assert.equal(bridge.pendingNodeCodes.length, 0); assert.equal(bridge.entries.every(entry => entry.explicitHumanDecisionComplete), true);
  for (const entry of bridge.entries) {
    const review = json(fixture, entry.review.path); const approval = json(fixture, entry.approval.path);
    assert.equal(review.decision, 'accept'); assert.equal(review.reviewer.reviewerCode, 'TL'); assert.equal(approval.decision, 'approve'); assert.equal(approval.approver.approverCode, 'TL');
    assert.equal(entry.humanInput.publicationDecision, 'publish'); assert.equal(entry.humanInput.publisherCode, 'TL');
    assert.equal(exists(fixture, `content/knowledge/production/publications/en/${entry.nodeCode}/publication.v1.json`), false);
  }
  verifyKnrL10nFreeze(fixture);
  console.log('✓ ABL-4 Bilingual Human Review / Approval / Publication Decision Bridge passed.');
  console.log('✓ English Review, Approval and Publication decision are explicit TL evidence per node/locale; zh-Hans Human evidence is not inherited.');
  console.log('✓ READY_FOR_ABL_5_PUBLICATION creates no Publication record by itself.');
} finally { removeFixtureRoot(fixture); }
