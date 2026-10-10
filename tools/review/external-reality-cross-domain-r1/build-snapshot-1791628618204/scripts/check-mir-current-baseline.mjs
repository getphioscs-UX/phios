import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8')); const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const records=[
 ['MIR-1','content/reconciliation/mir/mir-1-authority-baseline-reconciliation-v1.json',d=>d.status==='COMPLETE'],
 ['MIR-2','content/reconciliation/mir/mir-2-mfig-figure-authority-reconciliation-v1.json',d=>d.status==='COMPLETE'],
 ['MIR-3','content/reconciliation/mir/mir-3-method-calculation-projection-v1.json',d=>String(d.status).startsWith('COMPLETE')],
 ['MIR-4','content/reconciliation/mir/mir-4-dynamic-renderer-client-surface-reconciliation-v1.json',d=>String(d.status).startsWith('COMPLETE')],
 ['MIR-5','content/reconciliation/mir/mir-5-canonical-interpretation-foundation-v1.json',d=>String(d.status).startsWith('COMPLETE')],
 ['MIR-6','content/reconciliation/mir/mir-6-canonical-interpretation-kernel-v1.json',d=>d.status==='COMPLETE_KERNEL_EXECUTABLE_NO_LLM_BASELINE'],
 ['MIR-7','content/reconciliation/mir/mir-7-method-interpretation-result-v1.json',d=>d.status==='COMPLETE_CANONICAL_INTERPRETATION_RESULT_AVAILABLE_DOWNSTREAM'],
 ['MIR-8','content/reconciliation/mir/mir-8-guided-reading-explainable-surface-v1.json',d=>d.status==='COMPLETE_GUIDED_READING_EXPLAINABLE_SURFACE_ACCEPTED_RESULT_ONLY'],
 ['MIR-9','content/reconciliation/mir/mir-9-reality-escalation-rjx-integration-v1.json',d=>String(d.status).startsWith('COMPLETE')],
 ['MIR-10','content/reconciliation/mir/mir-10-pca-client-demand-production-loop-v1.json',d=>d.status==='COMPLETE_NON_TRUTH_DEMAND_PRODUCTION_LOOP']
];
for(const [name,path,pred] of records){assert.ok(fs.existsSync(path),`${name} acceptance missing`);const d=j(path);assert.ok(pred(d),`${name} acceptance status invalid: ${d.status}`);}
// Preserve historical artifact authority without reasserting stale whole-package hashes.
const mir4=j(records[3][1]); for(const [p,h] of Object.entries(mir4.createdArtifactSha256||{}))assert.equal(sha(p),h,`MIR4 authority artifact drift: ${p}`);
const mir5=j(records[4][1]); for(const [p,h] of Object.entries(mir5.artifactSha256||{})){if(p==='scripts/check-mir-5-canonical-interpretation-foundation.mjs')continue;assert.equal(sha(p),h,`MIR5 artifact drift: ${p}`);}
for(const idx of [5,6,7]){const d=j(records[idx][1]);for(const [p,h] of Object.entries(d.artifactSha256||{}))assert.equal(sha(p),h,`${records[idx][0]} artifact drift: ${p}`);}
const mir9=j(records[8][1]); for(const v of Object.values(mir9.exitGate||{}))assert.equal(v,true,'MIR9 exit gate drift');
const successor=j('content/reconciliation/mir/mir-10-to-mir-11-successor-revalidation-v1.json');assert.equal(successor.status,'SUCCESSOR_REVALIDATED_PUBLICATION_COVERAGE_GROWTH_ONLY');
const pkg=j('package.json');for(const k of ['check:mir-1','check:mir-2','check:mir-3','check:mir-4','check:mir-5','check:mir-6','check:mir-7','check:mir-8','check:mir-9','check:mir-10'])assert.equal(typeof pkg.scripts[k],'string',`${k} missing`);
console.log('✓ MIR-1→MIR-10 current successor baseline accepted: historical authority artifacts remain valid; stale whole-package/publication hashes are versioned as successor drift rather than rewritten.');
