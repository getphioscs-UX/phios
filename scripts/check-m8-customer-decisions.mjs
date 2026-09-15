import fs from 'node:fs';
import assert from 'node:assert/strict';
const c=JSON.parse(fs.readFileSync('docs/qa/customer-activation-r1/customer-review-contract-v1.json'));
function validate(d){
 assert.equal(d.sourceDigest,c.sourceDigest,'STALE_REVIEW');assert.equal(d.automaticWriteback,false);assert.ok(d.reviewer?.trim());
 assert.equal(d.decisions.length,c.items.length);assert.equal(new Set(d.decisions.map(x=>x.id)).size,c.items.length);
 for(const row of d.decisions){const item=c.items.find(x=>x.id===row.id);assert.ok(item,'UNKNOWN_ITEM');
  if(item.blocked)assert.equal(row.decision,'BLOCKED_PENDING_QA_DEPLOYMENT','DEPLOYMENT_CANNOT_BE_APPROVED_OFFLINE');
  else{assert.ok(['PENDING','APPROVE','REJECT'].includes(row.decision));if(row.decision!=='PENDING')assert.ok(row.evidence?.trim(),'OBSERVATION_REQUIRED');}
 }
}
const draft={sourceDigest:c.sourceDigest,reviewer:'CHECKER FIXTURE',automaticWriteback:false,decisions:c.items.map(i=>({id:i.id,decision:i.blocked?'BLOCKED_PENDING_QA_DEPLOYMENT':'PENDING',evidence:''}))};
validate(draft);assert.throws(()=>validate({...draft,sourceDigest:'old'}));
const bad=structuredClone(draft);bad.decisions.find(x=>x.id.startsWith('QA-')).decision='APPROVE';assert.throws(()=>validate(bad));
if(process.argv[2]){validate(JSON.parse(fs.readFileSync(process.argv[2])));console.log('Review draft valid; no acceptance applied or production changes made.');}
else console.log('PASS: customer review version, evidence and blocked-E2E rejection guards.');
