import fs from 'node:fs';
import assert from 'node:assert/strict';
const campaign=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/review/cx-r12r3b-96-case-human-review-campaign-v2.json','utf8'));
const path=process.argv[2]||'content/customer-experience-rebuild/review/cx-r12r3b-human-review-results-template-v1.json';
const results=JSON.parse(fs.readFileSync(path,'utf8'));
assert.equal(results.cases.length,96,'CX_R12R3B_REVIEW_RESULTS_CASE_COUNT');
const byId=new Map(campaign.cases.map(x=>[x.caseId,x]));
let dual=0;
for(const result of results.cases){
 const c=byId.get(result.caseId);assert(c,`CX_R12R3B_UNKNOWN_CASE:${result.caseId}`);
 if(result.methodFidelityAccepted===true||result.customerClarityAccepted===true){
   assert.equal(c.candidateMaterialization?.machinePreflightPassed,true,`CX_R12R3B_CASE_NOT_MACHINE_PREFLIGHTED:${result.caseId}`);
   assert.equal(c.reviewEligible,true,`CX_R12R3B_CASE_NOT_REVIEW_ELIGIBLE:${result.caseId}`);
   assert.ok(String(result.reviewerRef||'').trim(),`CX_R12R3B_REVIEWER_REF_REQUIRED:${result.caseId}`);
   assert.ok(String(result.evidenceRef||'').trim(),`CX_R12R3B_EVIDENCE_REF_REQUIRED:${result.caseId}`);
 }
 if(result.methodFidelityAccepted===true&&result.customerClarityAccepted===true){dual++;}
}
if(dual)console.log(`Validated ${dual} dual-accepted case(s).`); else console.log('✓ Review results template remains unaccepted; no human acceptance was fabricated.');
