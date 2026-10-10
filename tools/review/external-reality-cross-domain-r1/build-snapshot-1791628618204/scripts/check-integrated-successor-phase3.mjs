import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const final = read('content/knowledge/knowledge-intelligence-r2/acceptance/kir-r2-w16r-final-human-acceptance-v1.json');
const acceptance = read('content/governance/integrated-successor/acceptance/integrated-phase3-pvp-foundation-v1.json');
const freeze = read('content/product-visual-platform-r1/freeze/pvp-r1-vis-foundation-w0-w5-freeze-v1.json');
assert.equal(final.productionGate.productionAdmissionAllowed, true);
assert.equal(final.effectiveSuccessorAcceptance.effectiveAccepted, 100);
assert.equal(acceptance.status, 'PVP_R1_VIS_FOUNDATION_FROZEN');
assert.deepEqual(acceptance.completed, [
  'W0_VISUAL_REGISTRY_CENSUS','W1_ASSET_CLASSIFICATION','W2_LOGO_COMPLIANCE',
  'W3_DESIGN_TOKEN_EXTRACTION','W4_SHARED_CUSTOMER_VISUAL_TOKENS','W5_PVP_COMPONENTS_FOUNDATION'
]);
assert.equal(acceptance.authorityBoundary.foundationOnly, true);
assert.equal(acceptance.authorityBoundary.dynamicProductVisualProductionOpened, false);
assert.equal(freeze.status, 'PVP_R1_VIS_FOUNDATION_FROZEN');
assert.equal(freeze.successorBoundary.PAI_REQUIRED_NEXT, true);
assert.match(freeze.nextGate, /^PAI-R1-W0/);
console.log('✓ Integrated Successor PHASE 3 PVP foundation freeze passed.');
console.log('  W0–W5 are frozen as Foundation Only; no W6+ product visual cutover is admitted.');
console.log('  PHASE 4 / PAI-R1-W0 is the next authorised execution gate.');
