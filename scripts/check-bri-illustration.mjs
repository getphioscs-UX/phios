import assert from 'node:assert/strict'; import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync('content/web-production/registries/phios-bri-illustration-reconciliation-v1.json','utf8'));
assert.equal(r.records.length,10); assert.equal(r.summary.keep+r.summary.reframe,10); assert.equal(r.summary.generatedNow,0);
assert.equal(r.authority.illustrationIsNotHero,true); assert.equal(r.authority.illustrationIsNotFigure,true); assert.equal(r.authority.illustrationIsNotInstruction,true);
for (const x of r.records) { assert.match(x.sequence,/^ILL-0(?:0[1-9]|10)$/); assert.ok(['KEEP','REFRAME'].includes(x.decision)); assert.equal(x.state,'BRIEF_FROZEN_NOT_GENERATED'); }
console.log(`✓ BRI-2 Illustration Reconciliation passed: ${r.summary.keep} KEEP + ${r.summary.reframe} REFRAME; 0 generated.`);
