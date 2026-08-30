import assert from 'node:assert/strict';
import {ROOT,readJson,list,assertCoreRefSet} from './mfp-r-support.mjs';
const CURRENT='7c6126404fe8e257b44937a0149bf23c837c538f';
const c=readJson(`${ROOT}/mfp-r-w2-selective-fp-closure-v1.json`), r=readJson(`${ROOT}/mfp-r-r2-regeneration-regression-v1.json`);
assert.equal(r.baselineCommit,CURRENT);assert.equal(r.workCode,'MFP-R-W3');assert.equal(r.status,'R2_REGENERATION_COMPLETE');assert.deepEqual(r.requiredPipeline,['Full Production Result','AcceptedMethodReadingEnvelope','Claim IR','Theme','Semantic Dedup','Information Gain','Narrative IR','Customer Reading']);assert.ok(r.requiredDimensions.length>=13);
const closed=c.closures.filter(x=>x.status==='CLOSED');assert.equal(r.regressions.length,closed.length,'every CLOSED gap needs regeneration regression');assert.deepEqual(r.pendingGapIds,[]);
for(const x of list(r.regressions)){
 assert.equal(x.decision,'IMPROVED');assert.equal(x.rendererMeaningRegression,false);assert.equal(x.lineageRegression,false);assert.equal(x.dedupRegression,false);assert.ok(x.beforeReadingRef&&x.afterReadingRef);
 const before=readJson(x.beforeReadingRef),after=readJson(x.afterReadingRef);assert.equal(before.kind,'BEFORE_MFP_R_AST_001');assert.equal(after.kind,'AFTER_MFP_R_AST_001');assert.equal(before.counts.claims,3);assert.equal(after.counts.claims,6);assert.equal(after.recovery?.totalAdmittedEvidenceUnits,10);assert.equal(after.counts.visibleRecoveryClaims,3);
 assert.deepEqual(after.firstScreenClaimRefs,before.firstScreenClaimRefs,'MFP recovery must not displace original first-screen priorities');assert.equal(before.counts.renderedDuplicateParagraphs,0);assert.equal(after.counts.renderedDuplicateParagraphs,0);assert.ok(after.counts.sourceLineage>before.counts.sourceLineage);assert.ok(after.counts.ruleLineage>before.counts.ruleLineage);assert.equal(after.readability.internalTokenLeakCount,0);assert.equal(after.readability.firstScreenBlocks<=8,true);assert.equal(after.readability.firstScreenThemes<=3,true);
 const dims=x.dimensions;for(const k of ['claimCount','uniqueSemanticOwnerCount','evidenceCoverage','counterEvidencePreservation','tensionPreservation','priorityStability','dedupRate','paragraphRepetition','informationGain','sourceLineage','ruleLineage','timingBoundaries','customerReadability'])assert.ok(dims[k],`missing W3 dimension ${k}`);
 assert.equal(dims.counterEvidencePreservation.preserved,true);assert.equal(dims.tensionPreservation.preserved,true);assert.equal(dims.priorityStability.stable,true);assert.equal(dims.timingBoundaries.stable,true);assert.equal(dims.customerReadability.passed,true);assert.ok(dims.informationGain.after>dims.informationGain.before);
}
assertCoreRefSet(r);
console.log('✓ MFP-R-W3 R2 regeneration passed: AST before→after is IMPROVED through the existing Envelope→Claim→Theme→Dedup→Information Gain→Narrative→Customer Reading chain; priority, contradiction, timing and renderer boundaries do not regress.');
