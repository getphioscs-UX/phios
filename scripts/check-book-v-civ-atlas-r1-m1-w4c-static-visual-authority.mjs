import fs from 'node:fs';
import path from 'node:path';

const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'));
const assert = (condition, message) => {
  if (!condition) throw new Error(`W4C_ASSERTION_FAILED: ${message}`);
};

const casePath = 'content/civilization-atlas/cases/civilization-case-registry-v1.json';
const assetPath = 'content/civilization-atlas/visuals/civilization-visual-asset-registry-v1.json';
const promptPath = 'content/civilization-atlas/visuals/civilization-visual-prompt-canon-v1.json';
const batchPath = 'content/civilization-atlas/visuals/civilization-visual-batch-manifest-v1.json';

const casesDoc = readJson(casePath);
const assetDoc = readJson(assetPath);
const promptDoc = readJson(promptPath);
const batchDoc = readJson(batchPath);

const cases = casesDoc.cases || [];
const assets = assetDoc.assets || [];
const batches = batchDoc.batches || [];
const templates = promptDoc.templates || [];

assert(cases.length === 120, `expected 120 source cases, got ${cases.length}`);
assert(cases.every(c => /^CA-T\d{2}-\d{2}$/.test(c.caseId)), 'all source cases must use CA-Txx-yy IDs');

const periods = new Map();
for (const c of cases) {
  const period = c.caseId.slice(3, 6);
  periods.set(period, (periods.get(period) || 0) + 1);
}
assert(periods.size === 20, `expected 20 case periods, got ${periods.size}`);
assert([...periods.values()].every(v => v === 6), 'each T00-T19 period must contain exactly 6 cases');

assert(assets.length === 436, `expected 436 planned assets, got ${assets.length}`);
const assetIds = assets.map(a => a.assetId);
assert(new Set(assetIds).size === 436, 'asset IDs must be unique');

const expectedFamilyCounts = {
  TIMELINE_ANCHOR: 20,
  CASE_HERO: 120,
  CASE_SECONDARY: 120,
  WORLD_SNAPSHOT_ATMOSPHERE: 15,
  COMPARISON_FAMILY: 6,
  TRAJECTORY_MOTIF: 16,
  TRANSITION_WINDOW: 32,
  SCALE_SHIFT: 7,
  LOSS_FAMILY: 6,
  LOSS_TYPE_VIGNETTE: 24,
  CIVILIZATION_INFRASTRUCTURE: 20,
  GEOGRAPHIC_BASE: 10,
  HISTORICAL_FIGURE: 16,
  MODERN_FLAG: 24
};
const familyCounts = {};
for (const a of assets) familyCounts[a.family] = (familyCounts[a.family] || 0) + 1;
assert(Object.keys(familyCounts).length === 14, `expected 14 asset families, got ${Object.keys(familyCounts).length}`);
for (const [family, count] of Object.entries(expectedFamilyCounts)) {
  assert(familyCounts[family] === count, `${family} expected ${count}, got ${familyCounts[family] || 0}`);
}

const sourceCaseIds = cases.map(c => c.caseId);
const heroIds = assets.filter(a => a.family === 'CASE_HERO').map(a => a.subjectId);
const secondaryIds = assets.filter(a => a.family === 'CASE_SECONDARY').map(a => a.subjectId);
assert(JSON.stringify(heroIds) === JSON.stringify(sourceCaseIds), 'CASE_HERO order must exactly preserve source case registry order');
assert(JSON.stringify(secondaryIds) === JSON.stringify(sourceCaseIds), 'CASE_SECONDARY order must exactly preserve source case registry order');
assert(!JSON.stringify(assetDoc).match(/\bC\d{3}\b/), 'second C001-C120 case ID system is forbidden');

for (const a of assets) {
  assert(a.containsText === false, `${a.assetId}: containsText must be false`);
  assert(a.historicalAuthority === false, `${a.assetId}: historicalAuthority must be false`);
  assert(a.canonicalAuthority === false, `${a.assetId}: canonicalAuthority must be false`);
  assert(a.registryWriteAuthority === false, `${a.assetId}: registryWriteAuthority must be false`);
  assert(a.ocrWriteBackAllowed === false, `${a.assetId}: ocrWriteBackAllowed must be false`);
  assert(a.fallback === 'STRUCTURED_HTML_SVG', `${a.assetId}: structured fallback required`);
  assert(a.status === 'PLANNED', `${a.assetId}: initial status must be PLANNED`);
  assert(a.reviewState === 'NOT_PRODUCED', `${a.assetId}: initial reviewState must be NOT_PRODUCED`);
  assert(a.bindingState === 'UNBOUND', `${a.assetId}: initial bindingState must be UNBOUND`);
  assert(a.bucketKey === null, `${a.assetId}: unaccepted asset must not have bucketKey`);
}

assert(templates.length === 14, `expected 14 prompt templates, got ${templates.length}`);
assert(new Set(templates.map(t => t.templateId)).size === 14, 'prompt template IDs must be unique');

assert(batches.length === 48, `expected 48 batches, got ${batches.length}`);
const batchIds = batches.map(b => b.batchId);
assert(new Set(batchIds).size === 48, 'batch IDs must be unique');

const covered = [];
for (const b of batches) {
  assert(b.assetIds.length <= 10, `${b.batchId}: batch may not exceed 10 assets`);
  if (b.assetIds.length < 6) {
    assert(b.productionRule?.approvedSmallBatchException === true, `${b.batchId}: small batch requires explicit exception`);
  }
  covered.push(...b.assetIds);
}
assert(covered.length === 436, `batch coverage expected 436, got ${covered.length}`);
assert(new Set(covered).size === 436, 'every asset must appear in exactly one batch');
assert([...new Set(covered)].every(id => assetIds.includes(id)), 'batch manifest references unknown asset');
assert(assetIds.every(id => covered.includes(id)), 'every registry asset must be batch-controlled');

const heroBatchOrder = batches.filter(b => b.family === 'CASE_HERO').flatMap(b => b.assetIds);
const secondaryBatchOrder = batches.filter(b => b.family === 'CASE_SECONDARY').flatMap(b => b.assetIds);
assert(JSON.stringify(heroBatchOrder) === JSON.stringify(sourceCaseIds.map(id => `VIS-CIV-${id}-HERO`)), 'CASE_HERO batch order must preserve source registry order');
assert(JSON.stringify(secondaryBatchOrder) === JSON.stringify(sourceCaseIds.map(id => `VIS-CIV-${id}-SECONDARY`)), 'CASE_SECONDARY batch order must preserve source registry order');

console.log('PASS BOOK-V-CIV-ATLAS-R1-M1-W4C Static Visual Authority');
console.log(`  Source cases: ${cases.length}`);
console.log(`  Visual assets: ${assets.length}`);
console.log(`  Asset families: ${Object.keys(familyCounts).length}`);
console.log(`  Prompt templates: ${templates.length}`);
console.log(`  Batches: ${batches.length}`);
console.log('  Second Case ID system: ZERO');
console.log('  Image/OCR historical write authority: ZERO');
