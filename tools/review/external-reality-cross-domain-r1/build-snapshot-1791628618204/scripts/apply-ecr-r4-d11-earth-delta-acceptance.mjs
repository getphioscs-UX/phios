import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const CASES='content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-cases-v1.json';
const RESULTS='content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-human-review-results-v1.json';
const ACCEPTANCE='content/customer-experience-rebuild/r12r4b/cx-r12r4b-r4-acceptance-v1.json';
const RECEIPT='content/customer-experience-rebuild/r12r4b/review/ecr-v1/ecr-r4-d11-earth-delta-owner-acceptance-v1.json';
const TARGETS=['ECR-HR-12','ECR-HR-25','ECR-HR-38'];
const dims=['methodFidelityAccepted','customerClarityAccepted','nonFortuneTellingBoundaryAccepted','lineageAccepted'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?`[${v.map(stable).join(',')}]`:`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
const sha=v=>crypto.createHash('sha256').update(stable(v)).digest('hex');

const cases=read(CASES),results=read(RESULTS),acceptance=read(ACCEPTANCE);
assert.equal(cases.requiredCaseCount,48);
assert.equal(results.requiredCaseCount,48);
assert.equal(results.rejectedCaseCount,0);
const preDeltaState=results.acceptedCaseCount===45&&results.pendingCaseCount===3;
const alreadyAcceptedState=results.acceptedCaseCount===48&&results.pendingCaseCount===0;
assert(preDeltaState||alreadyAcceptedState,'Expected either 45 inherited + 3 pending or an idempotent 48/48 accepted state');

const caseById=new Map(cases.cases.map(x=>[x.caseId,x]));
const resultById=new Map(results.results.map(x=>[x.caseId,x]));
for(const id of TARGETS){
 const c=caseById.get(id),r=resultById.get(id);
 assert(c, `Missing review case ${id}`);
 assert(r, `Missing review result ${id}`);
 assert(c.reviewCaseDigest&&/^[a-f0-9]{64}$/.test(c.reviewCaseDigest),`Missing digest for ${id}`);
 if(preDeltaState)assert(dims.some(k=>r[k]!==true),`${id} is not pending`);
 if(alreadyAcceptedState)assert(dims.every(k=>r[k]===true),`${id} lost accepted dimensions`);
 const drivers=(c.coordinate?.ECR_DRIVER_PRIORITY||[]).slice().sort((a,b)=>(a.meta?.rank||99)-(b.meta?.rank||99));
 assert.equal(drivers[0]?.code,'D11',`${id} must be D11-primary`);
 const unit=(c.interpretationUnits||[]).find(u=>(u.ruleRefs||[]).includes('CX-COMP-ECR-DRIVER-PRIORITY-v1'));
 assert(unit,`${id} driver interpretation missing`);
 const text=JSON.stringify(unit);
 assert.equal(drivers[0]?.meta?.label,'Earth',`${id} D11 primary identity is not Earth`);
 assert.equal(drivers[0]?.meta?.labelZhHans,'地球驱动',`${id} D11 Chinese identity is not 地球驱动`);
 const expectedDefinition=c.locale==='zh-Hans'
  ?'把方向、责任与回应落实到载体所处的具体现实与条件之中。'
  :'Grounds orientation, responsibility and response into embodied reality and concrete conditions.';
 assert(String(unit.constructiveExpression||'').includes(expectedDefinition),`${id} does not contain the admitted Earth/Embodiment definition`);
 assert(!/Recovery|Restores capacity after load|恢复容量|凯龙星驱动|Chiron/.test(text),`${id} retains retired D11 Recovery/Chiron meaning`);
 assert((unit.meaningRefs||[]).includes('ECR-D-D11@1.0.0'),`${id} lost D11 meaning lineage`);
}

const reviewedAt='2026-09-29';
const receiptSeed={
 schemaVersion:'PHI-OS-ECR-R4-D11-EARTH-DELTA-OWNER-ACCEPTANCE-v1.0.0',
 work:'CX-R12R4B-R4-W33R-D11-EARTH-SUCCESSOR',
 decision:'ACCEPT',
 ownerInstruction:'ACCEPT ECR-HR-12 / 25 / 38',
 reviewedAt,
 correction:{driver:'D11',identity:'Earth',canonicalRole:'Embodiment',retiredIdentity:'Chiron',retiredMeaning:'Recovery'},
 cases:TARGETS.map(id=>({caseId:id,reviewCaseDigest:caseById.get(id).reviewCaseDigest,decision:'ACCEPT',dimensions:Object.fromEntries(dims.map(k=>[k,true]))})),
 scope:'Only the three D11-primary review cases whose human-reviewed semantic content changed after the owner-approved Earth/Embodiment correction. The other 45 cases retain prior acceptance by unchanged review digest.',
 productionActivated:false
};
const receipt={...receiptSeed,acceptanceDigest:sha(receiptSeed)};
fs.writeFileSync(RECEIPT,JSON.stringify(receipt,null,2)+'\n');

// Bind every retained/inherited acceptance to the current human-review content digest.
for(const currentCase of cases.cases){
 const r=resultById.get(currentCase.caseId);
 assert(r,`Missing review result ${currentCase.caseId}`);
 assert(currentCase.reviewCaseDigest&&/^[a-f0-9]{64}$/.test(currentCase.reviewCaseDigest),`Missing digest for ${currentCase.caseId}`);
 r.reviewCaseDigest=currentCase.reviewCaseDigest;
}

for(const id of TARGETS){
 const r=resultById.get(id);
 Object.assign(r,Object.fromEntries(dims.map(k=>[k,true])),{
  reviewCaseDigest:caseById.get(id).reviewCaseDigest,
  reviewerRef:'TL',
  reviewedAt,
  notes:'OWNER_ACCEPTED_D11_EARTH_EMBODIMENT_DELTA'
 });
}
results.schemaVersion='PHI-OS-ECR-HUMAN-REVIEW-RESULTS-v1.1.0';
results.status='HUMAN_REVIEW_COMPLETE';
results.acceptedCaseCount=48;
results.rejectedCaseCount=0;
results.pendingCaseCount=0;
results.aggregateAttestation={
 reviewedBy:'TL',
 reviewedAt,
 statement:'45 unchanged ECR review cases retain prior acceptance by review digest; ECR-HR-12, ECR-HR-25 and ECR-HR-38 were re-reviewed and accepted after the D11 Earth / Embodiment correction.',
 deltaAcceptanceRef:RECEIPT,
 reviewCaseDigestsBound:true
};
assert(results.results.every(x=>dims.every(k=>x[k]===true)));
fs.writeFileSync(RESULTS,JSON.stringify(results,null,2)+'\n');

acceptance.status='W31R_W32R_W33R_MACHINE_HUMAN_ACCEPTED_READY_FOR_R5_PRODUCTION_ADMISSION';
acceptance.completed.W33R.humanReviewStatus='ACCEPTED_48_OF_48_D11_EARTH_SUCCESSOR_BOUND';
acceptance.completed.W33R.humanReviewEvidenceRef=RESULTS;
acceptance.completed.W33R.deltaOwnerAcceptanceRef=RECEIPT;
acceptance.completed.W33R.d11EarthSuccessorAccepted=true;
acceptance.completed.W33R.d11RecoveryRetired=true;
fs.writeFileSync(ACCEPTANCE,JSON.stringify(acceptance,null,2)+'\n');

console.log('PASS: D11 Earth delta owner acceptance applied.');
console.log('  45 inherited + 3 delta accepted = 48/48; all 48 results are reviewCaseDigest-bound.');
console.log('  Receipt: '+RECEIPT);
console.log('  Production admission remains a separate R5 step.');
