import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {subjectReportMethodBoundary} from '../../../functions/profile/subject-owner-integration-r2.js';
import {VISUAL_REPORT_PRODUCTS} from '../../../functions/canonical-presentation-runtime/visual-report-registry.js';
const paths=['functions/pws/commercial/stripe-product-registry.js','functions/pws/commercial/report-successor-contract.js','functions/account/person-use-policy.js','functions/customer-projection/canonical-navigation-handoff.js'];
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex'),before=Object.fromEntries(paths.map(p=>[p,hash(p)]));
const results=[];
for(const type of ['PERSONAL','FAMILY','TEAM','BUSINESS','INSTITUTION','COUNTRY']){
 const rows=subjectReportMethodBoundary(type);assert.equal(rows.length,6);assert(rows.some(r=>r.methodId==='ECR'));
 for(const r of rows){assert(VISUAL_REPORT_PRODUCTS.some(p=>p.methodId===r.methodId));assert.equal(r.rightsGranted,false);assert.equal(r.state,type==='PERSONAL'?'EXISTING_PERSON_CONSENT_INPUT_AND_ENTITLEMENT_REQUIRED':'NOT_APPLICABLE');}
 results.push({subjectType:type,status:'PASS',existingMethodIds:rows.map(r=>r.methodId)});
}
assert.throws(()=>subjectReportMethodBoundary('OTHER'),/SUBJECT_TYPE_INVALID/);
for(const p of paths)assert.equal(hash(p),before[p]);
fs.writeFileSync('content/production-closure/live-customer-commercial-convergence/subject-profile-r2/METHODS.json',JSON.stringify({status:'PASS',scope:'ADAPTER_BOUNDARY_ONLY_NOT_REPORT_DELIVERY_REPLAY',results,protectedFileHashes:before,production:'NOT_RUN'},null,2));console.log('PASS six subject method/report boundaries; native commercial owners unchanged during check.');
