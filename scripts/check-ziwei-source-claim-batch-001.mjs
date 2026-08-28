import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {_test as placementTest} from '../functions/zi-wei-full-production/ziwei-complete-star-placement-runtime.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='content/professional/zi-wei-full-production/source-admission';
const j=(rel)=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const text=(rel)=>fs.readFileSync(path.join(ROOT,rel),'utf8');
const required=[
 `${BASE}/authority/ziwei-source-admission-strategy-v1.json`,
 `${BASE}/registries/ziwei-source-registry-v1.json`,
 `${BASE}/registries/ziwei-source-admission-registry-v1.json`,
 `${BASE}/contracts/ziwei-source-claim-contract-v1.json`,
 `${BASE}/claims/ziwei-source-claim-batch-001-v1.json`,
 `${BASE}/review/ziwei-source-claim-batch-001-human-review-v1.json`,
 `${BASE}/acceptance/ziwei-source-claim-batch-001-extraction-acceptance-v1.json`,
 'docs/ziwei/review/ZIWEI-SOURCE-CLAIM-BATCH-001-review.html'
];
for(const rel of required) assert.ok(fs.existsSync(path.join(ROOT,rel)),`missing ${rel}`);

const strategy=j(required[0]);
assert.equal(strategy.baselineCommit,'07d01b39a98d07ff237f1516852f3b29d058a47e');
assert.equal(strategy.status,'CLAIM_BATCH_EXTRACTED_HUMAN_SOURCE_FIDELITY_REVIEW_PENDING');
assert.equal(strategy.principles.modelMaySelfAdmitClaims,false);
assert.deepEqual(strategy.scope,{w3PlacementClaims:8,w4StarStateRowClaims:21,totalClaims:29});

const sources=j(required[1]);
const sourceIds=new Set(sources.sources.map(x=>x.sourceId));
const witnessIds=new Set(sources.sources.flatMap(x=>x.witnesses.map(w=>w.witnessId)));
assert.ok(sourceIds.has('ZWR-SRC-ZIWEI-DOUSHU-QUANSHU'));
assert.ok(witnessIds.has('ZWR-WIT-WIKISOURCE-ZWDS-V2'));
assert.ok(witnessIds.has('ZWR-WIT-WIKISOURCE-ZWDS-FULL'));
assert.ok(witnessIds.has('ZWR-WIT-IZTRO-STAR-LOCATION'));

const batch=j(required[4]);
assert.equal(batch.batchId,'ZIWEI-SOURCE-CLAIM-BATCH-001');
assert.equal(batch.claims.length,29);
assert.deepEqual(batch.counts,{total:29,w3Placement:8,w4StarStateRows:21,pendingHumanReview:29,humanAdmitted:0,runtimeUseAllowed:0});
assert.equal(new Set(batch.claims.map(x=>x.claimId)).size,29);
for(const c of batch.claims){
 assert.equal(c.schemaVersion,'PHI-OS-ZIWEI-SOURCE-CLAIM-v1.0.0');
 assert.ok(sourceIds.has(c.primarySourceId),`unknown source ${c.claimId}`);
 assert.ok(c.witnessRefs.length>=1,`no witness ${c.claimId}`);
 for(const wid of c.witnessRefs) assert.ok(witnessIds.has(wid),`unknown witness ${wid}`);
 assert.equal(c.reviewState,'EXTRACTED_PENDING_HUMAN_REVIEW');
 assert.equal(c.runtimeUseAllowed,false);
 assert.equal(c.reviewEvidenceRef,null);
 assert.ok(c.locator.witnessUrl.startsWith('https://'));
}

const w3=batch.claims.filter(c=>c.work==='ZIWEI-FP-W3');
const w4=batch.claims.filter(c=>c.work==='ZIWEI-FP-W4');
assert.equal(w3.length,8);assert.equal(w4.length,21);
const extensionStars=['LU_CUN','QING_YANG','TUO_LUO','HUO_XING','LING_XING','DI_KONG','DI_JIE','TIAN_MA'];
assert.deepEqual(new Set(w3.map(c=>c.normalizedPayload.starCode)),new Set(extensionStars));
const byStar=Object.fromEntries(w3.map(c=>[c.normalizedPayload.starCode,c]));
assert.deepEqual(byStar.LU_CUN.normalizedPayload.yearStemToBranch,placementTest.LU_CUN_BY_STEM);
assert.deepEqual(byStar.TIAN_MA.normalizedPayload.yearBranchToBranch,placementTest.TIAN_MA_BY_YEAR_BRANCH);
assert.equal(byStar.QING_YANG.normalizedPayload.branchOffset,1);
assert.equal(byStar.TUO_LUO.normalizedPayload.branchOffset,-1);
assert.equal(byStar.DI_KONG.normalizedPayload.startBranch,'HAI');
assert.equal(byStar.DI_KONG.normalizedPayload.hourDirection,'REVERSE');
assert.equal(byStar.DI_JIE.normalizedPayload.startBranch,'HAI');
assert.equal(byStar.DI_JIE.normalizedPayload.hourDirection,'FORWARD');
for(const star of ['HUO_XING','LING_XING']){
 const got=byStar[star].normalizedPayload.yearBranchGroupStarts;
 const expected=Object.fromEntries(Object.entries(placementTest.FIRE_BELL_START).map(([branch,row])=>[branch,row[star]]));
 assert.deepEqual(got,expected,`${star} start table drift`);
 assert.equal(byStar[star].normalizedPayload.hourDirection,'FORWARD');
 assert.ok(byStar[star].reviewFlags.includes('SCHOOL_VARIANT_RISK'));
 assert.ok(byStar[star].witnessRefs.includes('ZWR-WIT-IZTRO-STAR-LOCATION'));
}
assert.ok(byStar.DI_KONG.reviewFlags.includes('SOURCE_RUNTIME_NAME_ALIAS_REQUIRES_HUMAN_CONFIRMATION'));

const stateRegistry=j('content/professional/zi-wei-full-production/registries/ziwei-star-state-registry-v1.json');
assert.equal(Object.keys(stateRegistry.states).length,21);
const stateClaimMap=Object.fromEntries(w4.map(c=>[c.normalizedPayload.starCode,c]));
assert.deepEqual(new Set(Object.keys(stateClaimMap)),new Set(Object.keys(stateRegistry.states)));
let cells=0;
for(const [star,row] of Object.entries(stateRegistry.states)){
 const claim=stateClaimMap[star];
 const expected=Object.fromEntries(Object.entries(row).map(([branch,v])=>[branch,{sourceTerm:v.sourceTerm,normalizedStateCode:v.stateCode}]));
 assert.deepEqual(claim.normalizedPayload.explicitStateCells,expected,`${star} state row drift`);
 assert.equal(claim.normalizedPayload.unlistedBranchPolicy,'UNSPECIFIED');
 assert.equal(claim.normalizedPayload.numericStrengthScoreAllowed,false);
 cells+=Object.keys(expected).length;
}
assert.equal(cells,190);

const review=j(required[5]);
assert.equal(review.status,'PENDING_HUMAN_REVIEW');
assert.equal(review.decisions.length,29);
assert.deepEqual(new Set(review.decisions),new Set(batch.claims.map(x=>x.claimId)));
const admission=j(required[2]);
assert.equal(admission.claimBatches[0].extractedClaims,29);
assert.equal(admission.claimBatches[0].humanAdmittedClaims,0);
assert.equal(admission.claimBatches[0].runtimeUseAllowedClaims,0);
for(const v of Object.values(admission.productionGates)) if(typeof v==='boolean') assert.equal(v,false);
const acceptance=j(required[6]);
assert.equal(acceptance.gates.HUMAN_SOURCE_FIDELITY_REVIEW_COMPLETE,false);
assert.equal(acceptance.gates.W5_START_ALLOWED,false);
assert.equal(acceptance.gates.W6_START_ALLOWED,false);

const historical=j('content/professional/zi-wei-full-production/acceptance/ziwei-fp-w0-w4-engineering-acceptance-v1.json');
assert.equal(historical.gates.NEW_RULE_SOURCE_CLAIMS_HUMAN_ADMITTED,false);
assert.equal(historical.gates.CURRENT_PRODUCTION_STAR_SCOPE_CHANGED,false);
assert.equal(historical.gates.CUSTOMER_INTERPRETATION_CHANGED,false);
assert.equal(historical.gates.PRODUCTION_GATE_OPEN,false);

const html=text(required[7]);
for(const c of batch.claims) assert.ok(html.includes(c.claimId),`review html missing ${c.claimId}`);
assert.ok(html.includes('全部 ADMIT'));
assert.ok(html.includes('ziwei-source-claim-batch-001-human-review-result.json'));
assert.ok(html.includes('PHI-OS-ZIWEI-SOURCE-CLAIM-HUMAN-REVIEW-RESULT-v1.0.0'));

const pkg=j('package.json');
assert.equal(pkg.scripts['check:ziwei-source-claims'],'node scripts/check-ziwei-source-claim-batch-001.mjs');
console.log('✓ ZIWEI Source-Claim Batch 001 extraction/admission packet passed.');
console.log('  W3 placement claims: 8/8 source-bound and runtime-matched.');
console.log('  W4 star-state rows: 21/21 source-bound, 190 explicit cells preserved.');
console.log('  Human admission: 0/29; production and W5/W6 gates remain closed by design.');
