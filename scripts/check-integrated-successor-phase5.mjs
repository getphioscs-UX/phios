import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const phase4=read('content/ai-economics/freeze/pai-r1-w0-w10-freeze-v1.json');
const phase5=read('content/ai-economics/paid-ask/acceptance/paid-ask-pilot-gate-v1.json');
assert.equal(phase4.status,'PAI_R1_READY_FOR_PAID_ASK_PILOT');
assert.equal(phase5.status,'PAID_ASK_PILOT_PENDING_REAL_EVIDENCE');
assert.equal(phase5.phase6Authorized,false);
assert.equal(phase5.freezeCreated,false);
console.log('✓ Integrated Successor PHASE 5 current boundary passed.');
console.log('  Paid Ask is pilot-ready but not accepted; CX-R31 cannot start from this evidence state.');
