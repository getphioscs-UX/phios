import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildAps6DecisionBridge } from './lib/article-simplification/human-decision-bridge-v1.mjs';
import { assertFrozenPjaPublicationImplementation, FROZEN_PJA_PUBLICATION_SHA256 } from './lib/article-simplification/pja-publication-successor-v1.mjs';

const root = process.cwd();
const readJson = async rel => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const exists = rel => fs.access(path.join(root, rel)).then(() => true, () => false);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const contract = await readJson('content/production/article-simplification/contracts/aps-8-production-acceptance-freeze-contract-v1.json');
const acceptance = await readJson('content/production/article-simplification/acceptance/aps-8-production-acceptance-v1.json');
const freeze = await readJson('content/production/article-simplification/freeze/aps-8-production-freeze-v1.json');
const pkg = await readJson('package.json');

assert.equal(contract.work, 'APS-8');
assert.equal(contract.status, 'ACTIVE');
assert.equal(contract.baselineCommit, '94d5efa953ff83713505b133d0039764df577675');
assert.equal(acceptance.status, 'ACCEPTED_PRODUCTION_CAPABILITY');
assert.equal(acceptance.operatorSurface.operatorCommandCount, 2);
assert.equal(acceptance.baselineReality.acceptancePublishesCurrentBatch, false);
assert.equal(acceptance.authorityBoundary.apsOwnsOrchestrationOnly, true);
assert.equal(freeze.status, 'FROZEN');
assert.equal(freeze.freezeBoundary.pendingHumanDecisionsFrozenAsAuthority, false);
assert.equal(freeze.freezeBoundary.futurePublicationResultsFrozen, false);
assert.equal(freeze.freezeBoundary.underlyingAuthorityImplementationsReownedByAps, false);

assert.equal(pkg.scripts['article:batch'], 'node scripts/article-batch.mjs');
assert.equal(pkg.scripts['article:publish'], 'node scripts/article-publish.mjs');
for (const work of [1,2,3,4,5,6,7,8]) assert.equal(typeof pkg.scripts[`check:aps-${work}`], 'string', `APS-${work} checker must be registered.`);
const aggregate = pkg.scripts['check:aps'];
for (const token of ['check:aps-1','check:aps-2','check:aps-3','check:aps-4','check:aps-5','check:aps-6','check:aps-7','check:aps-l10n','check:aps-8']) assert(aggregate.includes(token), `check:aps missing ${token}`);
assert.equal(await assertFrozenPjaPublicationImplementation(root), FROZEN_PJA_PUBLICATION_SHA256);

for (const [rel, expected] of Object.entries(freeze.digests)) {
  const actual = sha(await fs.readFile(path.join(root, rel)));
  assert.equal(actual, expected, `APS-8 freeze digest mismatch: ${rel}`);
}

const l10nFreeze = await readJson('content/production/visual-article/l10n/freeze/VAP-L10N-R5-KN-PREFACE-001-EN.json');
assert.equal(l10nFreeze.status, 'FROZEN');
const apsL10n = await readJson('content/production/article-simplification/contracts/aps-l10n-same-route-locale-release-contract-v1.json');
assert.equal(apsL10n.sameRoute?.required ?? apsL10n.localeIntegration?.sameRouteLocaleReleaseRequired ?? true, true);

const current = await buildAps6DecisionBridge(root, 'BATCH-001');
assert.equal(current.bridge.errors.length, 0, JSON.stringify(current.bridge.errors));
assert(['AWAITING_EXPLICIT_TL_PUBLICATION_DECISIONS','READY_FOR_APS_7_PUBLICATION'].includes(current.bridge.status));
const runRel = 'content/production/article-simplification/batches/BATCH-001/publication-run.v1.json';
if (await exists(runRel)) {
  assert.equal(current.bridge.status, 'READY_FOR_APS_7_PUBLICATION');
  const run = await readJson(runRel);
  assert.equal(run.work, 'APS-7');
  assert.equal(run.humanDecisionCount, 6);
  assert(run.outcomes.every(outcome => outcome.decision === 'publish' ? outcome.publicReleaseCreated === true : outcome.publicationCreated === false));
} else {
  // APS-8 accepts/freezes capability only; absence of a run proves acceptance itself never published BATCH-001.
  assert.equal(acceptance.baselineReality.publicationRunPresentAtAcceptance, false);
}

const orchestrator = await fs.readFile(path.join(root, 'scripts/lib/article-simplification/publication-orchestrator-v1.mjs'), 'utf8');
assert(orchestrator.includes('APS7_VISUAL_ASSET_REQUIRES_CAR_PATH'));
assert(orchestrator.includes("carState: 'NOT_REQUIRED_NO_VISUAL_ASSET'"));
assert(orchestrator.includes('SAME_ROUTE_LOCALE_RELEASE') || orchestrator.includes('sameRouteLocaleReleaseRequired'));

console.log('✓ APS-8 Production Acceptance & Freeze passed.');
console.log('✓ The two-command operator surface is frozen as capability: article:batch → explicit TL decisions → article:publish.');
console.log(`✓ Current BATCH-001 state is ${current.bridge.status}; APS-8 itself infers or publishes nothing.`);
console.log('✓ Frozen PJA Publication W1 bytes, VAP-W11 authority, conditional CAR boundary, CPR/Visual Article projection and VAP-L10N same-route authority remain preserved.');
