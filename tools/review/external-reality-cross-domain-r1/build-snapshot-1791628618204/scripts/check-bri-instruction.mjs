import assert from 'node:assert/strict'; import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync('content/web-production/registries/phios-bri-instruction-briefs-v1.json','utf8'));
assert.equal(r.records.length,14); assert.equal(new Set(r.records.map(x=>x.sequence)).size,14); assert.equal(r.authority.generationDeferredByUser,true);
for (let i=1;i<=14;i++){ const seq=`INS-${String(i).padStart(3,'0')}`; const x=r.records.find(y=>y.sequence===seq); assert.ok(x,`Missing ${seq}`); assert.equal(x.state,'BRIEF_FROZEN_NOT_GENERATED'); assert.ok(x.canonicalSteps.length>=3); }
console.log('✓ BRI-3 Instruction Brief Freeze passed: 14/14 canonical briefs, generation deferred.');
