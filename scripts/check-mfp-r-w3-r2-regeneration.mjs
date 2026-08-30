import assert from 'node:assert/strict';
import {BASELINE,ROOT,readJson,list,assertCoreRefSet} from './mfp-r-support.mjs';
const c=readJson(`${ROOT}/mfp-r-w2-selective-fp-closure-v1.json`), r=readJson(`${ROOT}/mfp-r-r2-regeneration-regression-v1.json`);
assert.equal(r.baselineCommit,BASELINE);assert.equal(r.workCode,'MFP-R-W3');assert.deepEqual(r.requiredPipeline,['Full Production Result','AcceptedMethodReadingEnvelope','Claim IR','Theme','Semantic Dedup','Information Gain','Narrative IR','Customer Reading']);assert.ok(r.requiredDimensions.length>=13);
const closed=c.closures.filter(x=>x.status==='CLOSED');assert.equal(r.regressions.length,closed.length,'every CLOSED gap needs regeneration regression');
for(const x of list(r.regressions)){assert.ok(['IMPROVED','NO_MATERIAL_CHANGE','REGRESSED'].includes(x.decision));assert.notEqual(x.decision,'REGRESSED');assert.equal(x.rendererMeaningRegression,false);assert.equal(x.lineageRegression,false);assert.equal(x.dedupRegression,false)}
assert.deepEqual(new Set(r.pendingGapIds),new Set(c.closures.filter(x=>x.status!=='CLOSED').map(x=>x.gapId)));assertCoreRefSet(r);
console.log(`✓ MFP-R-W3 regeneration gate is coherent: ${closed.length} closed method gaps require/contain regression records; ${r.pendingGapIds.length} open gap is not falsely regenerated or marked improved.`);
