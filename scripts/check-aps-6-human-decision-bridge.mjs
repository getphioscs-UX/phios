import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildAps6DecisionBridge } from './lib/article-simplification/human-decision-bridge-v1.mjs';
import { validatePublicationDecisionEnvelope, VAP_W11_PUBLICATION_AUTHORITY } from './lib/visual-article-production/publication-handoff-decision-v1.mjs';

const root = process.cwd();
const current = await buildAps6DecisionBridge(root, 'BATCH-001');
assert.equal(current.bridge.errors.length, 0, JSON.stringify(current.bridge.errors));
assert.equal(current.bridge.expectedDecisionCount, 6);
assert.equal(current.bridge.publicationAuthorityCreatedByAps6, false);
assert.equal(current.bridge.bulkPublicationAuthorityCreated, false);
assert(current.bridge.humanDecisionCount >= 0 && current.bridge.humanDecisionCount <= 6);
if (current.bridge.status === 'AWAITING_EXPLICIT_TL_PUBLICATION_DECISIONS') {
  assert(current.bridge.humanDecisionCount < 6);
  assert(current.bridge.entries.some(entry => !entry.explicitHumanDecisionComplete));
  assert.equal(validatePublicationDecisionEnvelope(current.vapEnvelope, current.queue, { requireAllDecided: false }).valid, true);
} else {
  assert.equal(current.bridge.status, 'READY_FOR_APS_7_PUBLICATION');
  assert.equal(current.bridge.humanDecisionCount, 6);
  assert(current.bridge.entries.every(entry => entry.explicitHumanDecisionComplete));
  assert.equal(validatePublicationDecisionEnvelope(current.vapEnvelope, current.queue, { requireAllDecided: true }).valid, true);
}

const fixture = structuredClone(current.humanDecisions);
const decisions = ['publish', 'publish', 'publish', 'publish', 'defer', 'do_not_publish'];
fixture.entries.forEach((entry, index) => {
  entry.publicationDecision = decisions[index];
  entry.publisherCode = 'TL';
  entry.decidedAt = `2026-08-16T0${index + 1}:00:00.000Z`;
  entry.summary = `APS-6 fixture explicit TL decision for ${entry.nodeCode}: ${decisions[index]}.`;
});
const ready = await buildAps6DecisionBridge(root, 'BATCH-001', { humanDecisionsOverride: fixture });
assert.equal(ready.bridge.errors.length, 0, JSON.stringify(ready.bridge.errors));
assert.equal(ready.bridge.status, 'READY_FOR_APS_7_PUBLICATION');
assert.equal(ready.bridge.humanDecisionCount, 6);
assert.equal(ready.bridge.publishCount, 4);
assert.equal(ready.bridge.deferCount, 1);
assert.equal(ready.bridge.doNotPublishCount, 1);
assert(ready.bridge.entries.every(entry => entry.explicitHumanDecisionComplete));
assert(ready.vapEnvelope.entries.every(entry => entry.decisionState === 'human_decided'));
assert(ready.vapEnvelope.entries.every(entry => entry.publisherCode === 'TL' && entry.publisherAuthority === VAP_W11_PUBLICATION_AUTHORITY));
assert.equal(validatePublicationDecisionEnvelope(ready.vapEnvelope, ready.queue, { requireAllDecided: true }).valid, true);

const invalid = structuredClone(fixture);
invalid.entries[0].publisherCode = 'ChatGPT';
const rejected = await buildAps6DecisionBridge(root, 'BATCH-001', { humanDecisionsOverride: invalid });
assert.notEqual(rejected.bridge.status, 'READY_FOR_APS_7_PUBLICATION');
assert(rejected.bridge.entries[0].blockers.includes('INCOMPLETE_EXPLICIT_HUMAN_PUBLICATION_DECISION'));

const decisionsFile = JSON.parse(await fs.readFile(path.join(root, 'content/production/visual-article/decisions/vap-w11-batch-001-human-publication-decisions-v1.json'), 'utf8'));
if (decisionsFile.status === 'PENDING_HUMAN_PUBLICATION_DECISION') {
  assert(decisionsFile.entries.every(entry => entry.decision === null && entry.decisionState === 'pending_human'));
} else {
  assert.equal(decisionsFile.status, 'HUMAN_PUBLICATION_DECISIONS_RECORDED');
  assert(decisionsFile.entries.every(entry => entry.decisionState === 'human_decided'));
  assert.equal(current.bridge.status, 'READY_FOR_APS_7_PUBLICATION', 'Recorded W11 decisions require a complete APS-6 explicit input lineage.');
}

console.log('✓ APS-6 Human Decision Bridge passed.');
console.log(`✓ Current BATCH-001 Human decision state is ${current.bridge.status} (${current.bridge.humanDecisionCount}/6 complete); no decision is inferred.`);
console.log('✓ Fixture proves publish / defer / do_not_publish map independently into the existing VAP-W11 Human Publication authority shape.');
console.log('✓ APS-6 creates no bulk authority, no Publication record, and no Candidate / Review / Approval / locale mutation.');
