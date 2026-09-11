import assert from 'node:assert/strict';import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const p11=j('content/product-visual-platform-r1/freeze/pvp-r1-vis-relationship-phase11-freeze-v1.json');
const rec=j('content/integrated-master-work/phase12/p12-current-reconciliation-v1.json');
assert.equal(p11.status,'PVP_R1_VIS_RELATIONSHIP_PHASE11_FROZEN');assert.equal(p11.frozenExit.phase12Authorized,true);
assert.equal(rec.status,'W29_W30_COMPLETE_W31_REMOTE_EXECUTION_REQUIRED');assert.equal(rec.phase12Frozen,false);assert.equal(rec.phase13Authorized,false);assert.equal(rec.boundaries.ownerUploadClaimPromotedToRemoteVerification,false);assert.equal(rec.boundaries.unverifiedBackgroundActivated,false);
console.log('✓ Integrated Phase 12 preflight passed: W29/W30 are ready, W31 remains fail-closed, and Phase 13 is not authorized before live remote evidence.');
