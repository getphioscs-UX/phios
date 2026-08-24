import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { inspectIChingExecutionAuthority } from '../functions/iching-product-runtime/iching-execution-authority-v1.js';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const run = path => {
  const result = spawnSync(process.execPath, ['--no-warnings', path], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(result.status, 0, `${path}\n${result.stdout}\n${result.stderr}`);
  process.stdout.write(result.stdout);
};

for (const checker of [
  'scripts/check-iching-product-runtime-current-v2.mjs',
  'scripts/check-iching-machine-campaign.mjs',
  'scripts/check-iching-persistence.mjs',
  'scripts/check-symbolic-browser.mjs',
  'scripts/check-iching-live-activation.mjs'
]) run(checker);

const readiness = read('content/production/symbolic-method/reconciliation/iching-production-activation-readiness-v1.json');
const successor = read('content/production/symbolic-method/reconciliation/iching-activation-readiness-current-successor-v1.json');
const human = read('content/production/symbolic-method/human-review/iching-human-review-campaign-v1.json');
const protocol = read('content/production/symbolic-method/human-review/symbolic-human-review-protocol-v1.json');
const pcm = read('content/governance/production-capability-matrix/registries/production-capability-registry-v6.json');
const catalog = read('content/web-production/px2/successors/public-method-catalog-v2.json');

assert.equal(readiness.baselineCommit, '40cb9e71450ebb817998cde8222225cd941c0aa0');
assert.equal(readiness.status, 'SOURCE_AND_MACHINE_READY_EXTERNAL_AND_CONTENT_GATES_PENDING');
assert.equal(successor.status, 'CURRENT_SOURCE_MACHINE_PERSISTENCE_AND_LIVE_GATE_STRUCTURE_FROZEN');
assert.equal(successor.historicalEvidenceMutated, false);
for (const item of successor.artifacts) assert.equal(sha(item.path), item.sha256, `I Ching activation successor drift: ${item.path}`);
for (const value of Object.values(successor.authorityBoundary)) assert.equal(value, false);
for (const value of Object.values(readiness.sourceGates)) assert.equal(value, true);
assert.equal(readiness.contentReadiness.canonicalStructureCoverage, '64/64');
assert.equal(readiness.contentReadiness.sourceBoundCommentaryCoverage, '2/64');
assert.equal(readiness.contentReadiness.sourceGapsExplicit, true);
assert.equal(readiness.contentReadiness.modelMayFillSourceGap, false);
assert.equal(readiness.contentReadiness.fullCommercialContentReadiness, false);
assert.equal(human.sessions.length, readiness.externalGates.targetHumanSessions);
assert.equal(human.sessions.filter(item => item.humanReviewed && item.accepted).length, readiness.externalGates.acceptedHumanSessions);
assert.equal(protocol.minimumAcceptedSessionsPerMethod, readiness.externalGates.minimumHumanAcceptedSessions);
assert.equal(readiness.externalGates.acceptedHumanSessions, 0);
for (const key of ['globalVerifiedAccountProviderConnected','verifiedLiveD1AccountPersistence','liveBrowserAccepted','liveProductionShaAligned']) {
  assert.equal(readiness.externalGates[key], false);
}
for (const value of Object.values(readiness.currentAuthority)) {
  if (typeof value === 'boolean') assert.equal(value, false);
}

const ich = pcm.capabilities.find(item => item.methodRuntime?.methodCode === 'I_CHING');
assert.ok(ich);
assert.equal(ich.userExecutable, false);
assert.equal(ich.productionAccepted, false);
const publicIch = catalog.methods.find(item => item.methodCode === 'I_CHING');
assert.ok(publicIch);
assert.equal(publicIch.runAllowed, false);
assert.equal(inspectIChingExecutionAuthority({
  data: { symbolicExecutionAuthority: { I_CHING: { methodCode: 'I_CHING', state: 'LIMITED_PRODUCTION', runAllowed: true } } },
  env: { CF_PAGES_COMMIT_SHA: readiness.baselineCommit }
}).authorized, false);

console.log('✓ ICH-PROD-W16 activation readiness gate passed.');
console.log('  Source Runtime, 64/64 machine pipeline, replay, safety, shared D1 source persistence, static UX and live smoke structure are closed.');
console.log('  Fully activated remains false: 0/24 human sessions, global verified account provider, live D1/browser/SHA and full 64-source commentary are not complete.');
