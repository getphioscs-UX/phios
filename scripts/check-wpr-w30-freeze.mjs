import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = file => crypto.createHash('sha256')
  .update(normalize(fs.readFileSync(file, 'utf8')), 'utf8')
  .digest('hex');

const BASE = '021007b80fa20739a726fb28bcda4a9369af48e4';
const RECONCILIATION = 'docs/wpr/reconciliation/wpr-w30-post-freeze-checker-reconciliation-v2.json';

const contract = readJson('content/web-production/contracts/wpr-freeze-contract-v1.json');
assert.equal(contract.work, 'WPR-W30');
assert.equal(contract.baselineCommit, BASE);
assert.equal(contract.freezeScope, 'WPR-W0-W30');
assert.equal(contract.frozenAuthority.projectionOnly, true);
assert.equal(contract.frozenAuthority.professionalJudgmentAuthority, false);
assert.equal(contract.operationalState.currentProductionState, 'LIMITED_PRODUCTION');
assert.equal(contract.operationalState.freezePromotesProductionState, false);

const w29 = readJson('content/web-production/acceptance/wpr-w29-full-production-acceptance-v1.json');
assert.equal(w29.accepted, true);
assert.equal(w29.fullProductionPromotion, false);

const reconciliation = readJson(RECONCILIATION);
assert.equal(reconciliation.reconciliationCode, 'PHI-OS-WPR-W30-POST-FREEZE-CHECKER-RECONCILIATION-v2');
assert.equal(reconciliation.status, 'ACCEPTED_SUCCESSOR_RECONCILIATION');
assert.equal(reconciliation.reconciliationVersion, '2.0.0');
assert.equal(reconciliation.predecessorReconciliation, 'docs/wpr/reconciliation/wpr-w30-post-freeze-checker-reconciliation-v1.json');
assert.equal(reconciliation.baselineCommit, BASE);
assert.equal(reconciliation.wprFreezeRewritten, false);
assert.equal(reconciliation.checkerManifestRewritten, false);
assert.equal(reconciliation.authorityExpansionGranted, false);
assert.equal(reconciliation.rules.wprDoesNotOwnFuturePostcheckTail, true);

const manifest = readJson('content/web-production/registries/wpr-checker-manifest-v1.json');
assert.equal(manifest.freezeCode, 'WPR-v1.0.0-FROZEN');
assert.equal(manifest.entries.length, 31);
for (const entry of manifest.entries) {
  assert.ok(fs.existsSync(entry.implementationFile), entry.implementationFile);
  const actualDigest = digest(entry.implementationFile);
  if (actualDigest === entry.sha256) continue;

  const successor = reconciliation.entries.find(item =>
    item.implementationFile === entry.implementationFile
  );
  assert.ok(successor, `WPR_CHECKER_DIGEST:${entry.workCode}`);
  assert.equal(successor.workCode, entry.workCode);
  assert.equal(successor.frozenDigest, entry.sha256, `WPR_FROZEN_CHECKER_DIGEST:${entry.workCode}`);
  assert.equal(successor.successorDigest, actualDigest, `WPR_SUCCESSOR_CHECKER_DIGEST:${entry.workCode}`);
  assert.equal(successor.runtimeSemanticAuthorityChanged, false);
  assert.equal(successor.freezeDecisionChanged, false);
  assert.equal(successor.authorityExpansionGranted, false);
}

const freeze = readJson('content/web-production/freeze/wpr-v1-freeze-v1.json');
assert.equal(freeze.freezeCode, 'WPR-v1.0.0-FROZEN');
assert.equal(freeze.scope, 'WPR-W0-W30');
assert.equal(freeze.productionStateAtFreeze, 'LIMITED_PRODUCTION');
assert.equal(freeze.productionPromotionPerformed, false);
assert.equal(freeze.checkerManifestReference, 'content/web-production/registries/wpr-checker-manifest-v1.json');
assert.equal(freeze.deploymentObservationFrozenAsAuthority, false);
assert.ok(freeze.openOperationalGates.includes('DEPLOYMENT_SHA_REVALIDATION_REQUIRED'));

const pkg = readJson('package.json');
assert.equal(pkg.scripts['check:wpr-w30'], 'node scripts/check-wpr-w30-freeze.mjs');
assert.equal(pkg.scripts['check:wpr-freeze'], 'npm run check:wpr-w30');
assert.equal(pkg.scripts['check:wpr-final'], 'npm run check:wpr');
assert.equal(pkg.scripts['check:web-production-runtime'], 'npm run check:wpr-final');

const post = String(pkg.scripts.postcheck)
  .split('&&')
  .map(value => value.trim())
  .filter(Boolean);
const neutralAlias = 'npm run check:web-production-runtime';
assert.equal(post.filter(value => value === neutralAlias).length, 1);
assert.ok(post.indexOf(neutralAlias) >= 0, 'WPR neutral postcheck alias missing.');
assert.equal(
  String(pkg.scripts.postcheck).includes('check:wpr'),
  false,
  'Historical WPR pre-W30 guard string remains untouched by neutral final alias.'
);

const acceptance = readJson('content/web-production/acceptance/wpr-w30-freeze-acceptance-v1.json');
assert.equal(acceptance.accepted, true);
assert.equal(acceptance.productionPromotionPerformed, false);
assert.equal(acceptance.centralPostcheckIntegrated, true);
assert.equal(acceptance.authorityExpansionGranted, false);

console.log('✓ WPR-W30 WPR v1 Freeze passed through post-freeze checker reconciliation.');
console.log('  WPR-W0-W30 authority remains frozen; the neutral web-production-runtime alias must exist exactly once, while later governed runtimes may append checker commands after it.');
