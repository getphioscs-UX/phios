import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const BASELINE = '65fe9cb7f039ca8672c3af20d44879baf8ed267b';
const REGISTRY = 'content/web-production/registries/wpr-production-drift-registry-v2.json';
const ACCEPTANCE = 'content/web-production/acceptance/wpr-pf0-production-drift-registry-successor-acceptance-v1.json';
const EXPECTED_TYPES = [
  'SOURCE_DRIFT',
  'ROUTE_DRIFT',
  'BOOK_DRIFT',
  'ASSET_DRIFT',
  'CPR_DRIFT',
  'LOCALE_DRIFT',
  'RUNTIME_ORPHAN',
  'DEPLOYMENT_DRIFT',
  'VOCABULARY_DRIFT',
  'VISUAL_DRIFT',
  'PRIVACY_DRIFT'
];

const registry = readJson(REGISTRY);
assert.equal(registry.registryCode, 'PHI-OS-WPR-PF-PRODUCTION-DRIFT-REGISTRY-v2');
assert.equal(registry.registryVersion, '2.0.0');
assert.equal(registry.phase, 'WPR-PF');
assert.equal(registry.work, 'WPR-PF0');
assert.equal(registry.baselineCommit, BASELINE);
assert.equal(registry.status, 'ACTIVE_POST_FREEZE_SUCCESSOR');

const actualTypes = registry.driftTypes.map(entry => entry.code);
assert.deepEqual(actualTypes, EXPECTED_TYPES);
assert.equal(new Set(actualTypes).size, EXPECTED_TYPES.length);
for (const entry of registry.driftTypes) {
  assert.equal(typeof entry.definition, 'string');
  assert(entry.definition.length >= 40, `${entry.code} requires a stable definition`);
  assert.match(entry.primaryDetectionWork, /^(WPR-PF\d+|WPR-PF12)$/);
}

assert.equal(registry.authorityBoundary.ownsDriftTypeVocabularyOnly, true);
for (const [key, value] of Object.entries(registry.authorityBoundary)) {
  if (key === 'ownsDriftTypeVocabularyOnly') continue;
  assert.equal(value, false, `${key} must remain false`);
}
assert.equal(registry.rules.driftCodeMustComeFromThisRegistry, true);
assert.equal(registry.rules.unknownDriftCodeFailsClosed, true);
assert.equal(registry.rules.detectorOwnsEvidence, true);
assert.equal(registry.rules.detectorOwnsContextualFailureDecision, true);
assert.equal(registry.rules.deploymentDriftClassificationDoesNotEqualDeploymentAcceptance, true);
assert.equal(registry.rules.wprV1FrozenAuthorityRemainsHistoricalAuthority, true);

const freeze = readJson(registry.predecessor.wprFreeze);
assert.equal(freeze.freezeCode, 'WPR-v1.0.0-FROZEN');
assert.equal(freeze.status, 'FROZEN');
assert.equal(freeze.scope, 'WPR-W0-W30');
assert.equal(freeze.successorRules.authorityExpansionRequiresSuccessor, true);
assert.equal(registry.predecessor.wprFreezeRewritten, false);
assert.equal(registry.predecessor.predecessorAuthorityRewritten, false);

const w28 = readJson(registry.predecessor.wprW28Contract);
assert.equal(w28.work, 'WPR-W28');
assert.equal(w28.authority.wprMayMutateDeployment, false);
assert.equal(w28.authority.wprMayDeploy, false);
assert.equal(w28.rules.driftMustRemainExplicit, true);
const obsRegistry = readJson(registry.predecessor.wprW28ObservabilityRegistry);
assert.equal(obsRegistry.work, 'WPR-W28');
const observation = readJson(registry.predecessor.wprW28Observation);
assert.equal(observation.work, 'WPR-W28');

const acceptance = readJson(ACCEPTANCE);
assert.equal(acceptance.phase, 'WPR-PF');
assert.equal(acceptance.work, 'WPR-PF0');
assert.equal(acceptance.baselineCommit, BASELINE);
assert.equal(acceptance.accepted, true);
assert.equal(acceptance.registry, REGISTRY);
assert.equal(acceptance.driftTypeCount, EXPECTED_TYPES.length);
assert.deepEqual(acceptance.driftTypes, EXPECTED_TYPES);
assert.equal(acceptance.result.wprV1FreezeRewritten, false);
assert.equal(acceptance.result.wprW28ObservabilityRewritten, false);
assert.equal(acceptance.result.wprV2Created, false);
assert.equal(acceptance.result.productionPromotionPerformed, false);
assert.equal(acceptance.result.deploymentAcceptancePerformed, false);
assert.equal(acceptance.result.authorityExpansionGranted, false);

const pkg = readJson('package.json');
assert.equal(pkg.scripts['check:wpr-pf0'], 'node scripts/check-wpr-pf0-production-drift-registry-successor.mjs');
assert.equal(pkg.scripts['check:wpr-production-assurance'], 'npm run check:wpr-pf0');
assert.equal(pkg.scripts['check:wpr-final'], 'npm run check:wpr');
assert.equal(pkg.scripts['check:web-production-runtime'], 'npm run check:book-w1-web-production-runtime');
assert(!pkg.scripts['check:wpr'].includes('check:wpr-pf0'));
assert(!pkg.scripts['check:wpr'].includes('check:wpr-production-assurance'));

console.log('✓ WPR-PF0 Production Drift Registry Successor passed.');
console.log(`✓ ${EXPECTED_TYPES.length} canonical drift types registered exactly once.`);
console.log('✓ WPR v1 freeze and WPR-W28 observability remain predecessor authority; PF0 adds taxonomy only, with no production or deployment grant.');
