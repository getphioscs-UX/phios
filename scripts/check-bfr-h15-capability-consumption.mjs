import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const inventoryPath = 'content/web-production/bfr-backend-capability-inventory-v1.json';
const acceptancePath = 'content/web-production/acceptance/bfr-capability-consumption-acceptance-v1.json';
const publicAssetsPath = 'content/registry/public-assets.json';
const visualRegistryPath = 'content/web-production/registries/client-visual-asset-registry-v1.2.json';

const inventory = readJson(inventoryPath);
const acceptance = readJson(acceptancePath);
const publicAssets = readJson(publicAssetsPath);
const visualRegistry = readJson(visualRegistryPath);

assert.equal(acceptance.work, 'BFR-H15');
assert.equal(acceptance.status, 'BFR_H15_CAPABILITY_CONSUMPTION_ACCEPTED_CURRENT_SUCCESSOR');
assert.equal(acceptance.globalProductionAccepted, false);
assert.equal(acceptance.historicalInventory.path, inventoryPath);
assert.equal(acceptance.historicalInventory.sha256, sha256(inventoryPath));
assert.equal(acceptance.historicalInventory.recordCount, inventory.recordCount);
assert.equal(acceptance.historicalInventory.rewritten, false);
assert.equal(inventory.recordCount, 56);
assert.equal(acceptance.recordCount, 56);

const historicalCodes = new Set(inventory.records.map((record) => record.capabilityCode));
const currentCodes = new Set(acceptance.records.map((record) => record.capabilityCode));
assert.equal(historicalCodes.size, 56);
assert.equal(currentCodes.size, 56);
assert.deepEqual([...currentCodes].sort(), [...historicalCodes].sort());

let active = 0;
let noneByDesign = 0;
for (const record of acceptance.records) {
  assert.ok(['ACTIVE_CLIENT_CONSUMER', 'NONE_BY_DESIGN'].includes(record.currentConsumptionState), `${record.capabilityCode}: unresolved current state`);
  assert.ok(Array.isArray(record.evidence) && record.evidence.length > 0, `${record.capabilityCode}: evidence missing`);
  for (const evidencePath of record.evidence) {
    assert.ok(existsSync(evidencePath), `${record.capabilityCode}: evidence path missing: ${evidencePath}`);
  }
  if (record.currentConsumptionState === 'ACTIVE_CLIENT_CONSUMER') {
    active += 1;
    assert.equal(record.productionEligibleForCurrentClient, true, `${record.capabilityCode}: active consumer must be client-eligible`);
    assert.ok(Array.isArray(record.actualClientConsumers) && record.actualClientConsumers.length > 0, `${record.capabilityCode}: active consumer list empty`);
    assert.ok(record.actualClientConsumers.every((consumer) => consumer !== 'NONE_BY_DESIGN'), `${record.capabilityCode}: invalid active consumer`);
    assert.equal(record.noneByDesignReason, null);
  } else {
    noneByDesign += 1;
    assert.equal(record.productionEligibleForCurrentClient, false, `${record.capabilityCode}: NONE_BY_DESIGN may not masquerade as active production`);
    assert.deepEqual(record.actualClientConsumers, []);
    assert.ok(typeof record.noneByDesignReason === 'string' && record.noneByDesignReason.length > 0, `${record.capabilityCode}: NONE_BY_DESIGN reason missing`);
  }
}

assert.equal(active, acceptance.summary.activeClientConsumerCount);
assert.equal(noneByDesign, acceptance.summary.noneByDesignCount);
assert.equal(active + noneByDesign, 56);
assert.equal(acceptance.summary.silentProductionRuntimeOrphanCount, 0);
assert.equal(acceptance.summary.unknownConsumptionStateCount, 0);
assert.equal(acceptance.exitGate.everyCapabilitySettled, true);
assert.equal(acceptance.exitGate.accepted, true);

const byCode = new Map(acceptance.records.map((record) => [record.capabilityCode, record]));
for (const code of ['BOOK_REGISTRY', 'FIVE_VOLUME_OWNERSHIP', 'PUBLISHED_KNOWLEDGE']) {
  assert.ok(byCode.get(code).actualClientConsumers.includes('HOMEPAGE'), `${code}: current Homepage successor not reconciled`);
}
assert.ok(byCode.get('FIGURES').actualClientConsumers.includes('ARTICLE_CONTENT_DEPENDENT'));
assert.ok(byCode.get('ICONS').actualClientConsumers.includes('HOMEPAGE'));

const diagramMembers = publicAssets.assets.filter((asset) => String(asset.category || '').toLowerCase() === 'diagram');
assert.equal(diagramMembers.length, 0, 'DIAGRAMS may be NONE_BY_DESIGN only while no concrete current public member exists');
assert.equal(byCode.get('DIAGRAMS').currentConsumptionState, 'NONE_BY_DESIGN');

const illustrations = visualRegistry.assets.filter((asset) => asset.assetType === 'ILLUSTRATION');
assert.ok(illustrations.length > 0);
assert.ok(illustrations.every((asset) => asset.state === 'PLANNED' && asset.r2?.remoteVerified === false), 'ILLUSTRATIONS may not be silently promoted before production readiness');
assert.equal(byCode.get('ILLUSTRATIONS').currentConsumptionState, 'NONE_BY_DESIGN');

const thesis = publicAssets.assets.find((asset) => asset.asset_code === 'THESIS-PUBLIC-ASSETS');
assert.ok(thesis, 'THESIS-PUBLIC-ASSETS inventory record missing');
assert.ok(String(thesis.object_key).endsWith('/'), 'Thesis placeholder must remain a directory group until concrete members are inventoried');
assert.notEqual(thesis.verification, 'verified-remote-head-get');
assert.equal(byCode.get('THESIS_VISUALS').currentConsumptionState, 'NONE_BY_DESIGN');

assert.equal(byCode.get('CANONICAL_KNOWLEDGE').currentConsumptionState, 'NONE_BY_DESIGN');
assert.equal(byCode.get('CALCULATION_RUNTIME').currentConsumptionState, 'NONE_BY_DESIGN');

console.log(`✓ BFR-H15 Capability Consumption Acceptance passed: ${active} active client-consumed + ${noneByDesign} NONE_BY_DESIGN = 56/56; silent production runtime orphan count 0.`);
