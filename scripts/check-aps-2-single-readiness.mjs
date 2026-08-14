import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APS2_BASELINE, APS2_CONTRACT, APS2_DEFAULT_OUTPUT, buildArticleReadiness } from './lib/article-simplification/single-readiness-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const expectedReady = [
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
];

assert.equal(fs.existsSync(path.join(root, APS2_CONTRACT)), true, `${APS2_CONTRACT} must exist`);
const contract = readJson(APS2_CONTRACT);
assert.equal(contract.work, 'APS-2');
assert.equal(contract.status, 'ACTIVE');
assert.equal(contract.baselineCommit, APS2_BASELINE);
assert.deepEqual(contract.interface.readyState, 'ARTICLE_READY');
assert.deepEqual(contract.interface.notReadyState, 'ARTICLE_NOT_READY');
assert.equal(contract.governance.derivedProjectionOnly, true);
assert.equal(contract.governance.mayCreateOrChangeHumanDecision, false);
assert.equal(contract.governance.mayPublish, false);

const built = buildArticleReadiness(root, { bookCode: 'BOOK-1', locale: 'zh-Hans' });
assert.deepEqual(built.summary.readyNodeCodes, expectedReady);
assert.equal(built.summary.readyCount, 6);
assert.equal(built.governance.humanDecisionCreationAllowed, false);
assert.equal(built.governance.candidateCreationAllowed, false);
assert.equal(built.governance.publicationAllowed, false);
for (const nodeCode of expectedReady) {
  const entry = built.entries.find(item => item.nodeCode === nodeCode);
  assert.ok(entry, `${nodeCode} readiness missing`);
  assert.equal(entry.state, 'ARTICLE_READY');
  assert.deepEqual(entry.blockers, []);
  for (const value of Object.values(entry.gates)) assert.equal(value, true, `${nodeCode} must pass every APS-2 gate`);
}

assert.equal(fs.existsSync(path.join(root, APS2_DEFAULT_OUTPUT)), true, `${APS2_DEFAULT_OUTPUT} must exist`);
const snapshot = readJson(APS2_DEFAULT_OUTPUT);
assert.equal(snapshot.readinessDigest, built.readinessDigest, 'Committed APS-2 readiness snapshot must equal derived runtime result');
assert.deepEqual(snapshot.summary.readyNodeCodes, expectedReady);

const preface4 = built.entries.find(item => item.nodeCode === 'KN-PREFACE-004');
if (preface4) {
  assert.equal(preface4.state, 'ARTICLE_NOT_READY');
  assert.equal(preface4.gates.notAlreadyPublished, false);
  assert.ok(preface4.blockers.includes('ARTICLE_ALREADY_PUBLISHED_FOR_LOCALE'));
}

console.log('✓ APS-2 Single Readiness Contract passed.');
console.log('✓ 6 current BOOK-1 zh-Hans nodes collapse to ARTICLE_READY; all other evaluated nodes fail closed with explicit blockers.');
console.log('✓ APS-2 reads existing authorities only and creates no Human, C2/C3, Candidate, Provider or Publication authority.');
console.log('→ Next: APS-3 Batch Orchestrator consumes ARTICLE_READY only.');
