import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const phase3=read('content/product-visual-platform-r1/freeze/pvp-r1-vis-foundation-w0-w5-freeze-v1.json');
const reconciliation=read('content/integrated-master-work/phase4/p4-current-reconciliation-v1.json');
const phase4=read('content/ai-economics/freeze/pai-r1-w0-w10-freeze-v1.json');
assert.equal(phase3.status,'PVP_R1_VIS_FOUNDATION_FROZEN');
assert.equal(reconciliation.baselineCommit,'454a7d1771feec5e2f6ab00bffdde46a5aa661f0');
assert.equal(reconciliation.status,'CURRENT_MAIN_RECONCILED_FOR_PAI_R1');
assert.equal(reconciliation.scope.paidAskPilot,false);
assert.equal(reconciliation.scope.cxR31,false);
assert.equal(reconciliation.scope.pvpW6Plus,false);
assert.equal(phase4.status,'PAI_R1_READY_FOR_PAID_ASK_PILOT');
assert.equal(phase4.authorityBoundary.newParallelRuntimeCreated,false);
assert.equal(phase4.deferred.productionEconomics,true);
console.log('✓ Integrated Successor PHASE 4 PAI-R1-W0–W10 passed.');
console.log('  Phase 5 Paid Ask Pilot is next; CX-R31 and PVP W6+ remain deferred.');
