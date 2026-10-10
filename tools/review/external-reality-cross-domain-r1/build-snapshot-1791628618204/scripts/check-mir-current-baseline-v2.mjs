import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
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
const successor=j('content/reconciliation/mir/mir-current-baseline-successor-v2.json');
assert.equal(successor.status,'CURRENT_SUCCESSOR_RECONCILED_WITH_HISTORICAL_MIR8_PAGE_HASH_PRESERVED');
assert.equal(sha(successor.predecessor.checker),successor.predecessor.checkerSha256,'historical MIR current checker was rewritten');
assert.equal(sha(successor.predecessor.mir8Reconciliation),successor.predecessor.mir8ReconciliationSha256,'historical MIR-8 reconciliation was rewritten');
const mir8=j(successor.predecessor.mir8Reconciliation);
assert.equal(mir8.artifactSha256['guided-reading.html'],successor.predecessor.historicalGuidedReadingSha256,'historical guided-reading hash fact changed');
assert.equal(sha(successor.currentSuccessor.surface),successor.currentSuccessor.sha256,'current guided-reading successor drift');
assert.equal(sha(successor.currentSuccessor.routeSuccessor),successor.currentSuccessor.routeSuccessorSha256,'MIR-11 route successor drift');
const route=j(successor.currentSuccessor.routeSuccessor);
const guided=route.routes.find(x=>x.surface==='guided-reading.html');
assert.ok(guided,'MIR-11 guided-reading route missing');
assert.equal(guided.state,'MIR11_CURRENT_SUCCESSOR_ROUTE');
assert.equal(guided.acceptedCanonicalInterpretationResultRequired,true);
assert.equal(guided.historicalKapGuidedReadingMutated,false);
// Preserve historical authority artifacts. MIR-8 alone permits the accepted current page successor.
const mir4=j(records[3][1]);for(const [p,h] of Object.entries(mir4.createdArtifactSha256||{}))assert.equal(sha(p),h,`MIR4 authority artifact drift: ${p}`);
const mir5=j(records[4][1]);for(const [p,h] of Object.entries(mir5.artifactSha256||{})){if(p==='scripts/check-mir-5-canonical-interpretation-foundation.mjs')continue;assert.equal(sha(p),h,`MIR5 artifact drift: ${p}`);}
for(const idx of [5,6]){const d=j(records[idx][1]);for(const [p,h] of Object.entries(d.artifactSha256||{}))assert.equal(sha(p),h,`${records[idx][0]} artifact drift: ${p}`);}
for(const [p,h] of Object.entries(mir8.artifactSha256||{})){if(p==='guided-reading.html')continue;assert.equal(sha(p),h,`MIR-8 non-page authority artifact drift: ${p}`);}
const mir9=j(records[8][1]);for(const v of Object.values(mir9.exitGate||{}))assert.equal(v,true,'MIR9 exit gate drift');
const mir10Successor=j('content/reconciliation/mir/mir-10-to-mir-11-successor-revalidation-v1.json');assert.equal(mir10Successor.status,'SUCCESSOR_REVALIDATED_PUBLICATION_COVERAGE_GROWTH_ONLY');
for(const command of successor.currentSuccessor.semanticAcceptanceChecks){const r=spawnSync(command,{shell:true,stdio:'inherit'});assert.equal(r.status,0,`MIR-8 current semantic acceptance failed: ${command}`);}
const pkg=j('package.json');for(const k of ['check:mir-1','check:mir-2','check:mir-3','check:mir-4','check:mir-5','check:mir-6','check:mir-7','check:mir-8','check:mir-9','check:mir-10'])assert.equal(typeof pkg.scripts[k],'string',`${k} missing`);
console.log('✓ MIR current baseline v2 successor passed: historical MIR-8 bytes remain historical authority; current guided-reading successor is semantically accepted without method or interpretation authority drift.');
