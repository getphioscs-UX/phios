import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));const t=p=>fs.readFileSync(p,'utf8');
const stable=o=>JSON.stringify(o,Object.keys(o).sort());
const canonical=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const sha=s=>createHash('sha256').update(s).digest('hex');
const baseline='0692037d3a3f522de9f0eb11d37f738df3a2bae6';
const contract=j('content/professional/ast-full-production/contracts/ast-fp-r4a-professional-semantic-human-admission-contract-v1.json');
const claims=j('content/professional/ast-full-production/claims/ast-fp-r4a-professional-semantic-candidate-claims-v1.json');
const cases=j('content/professional/ast-full-production/review/ast-fp-r4a-professional-semantic-human-review-cases-v1.json');
const results=j('content/professional/ast-full-production/review/ast-fp-r4a-professional-semantic-human-review-results-v1.json');
const admission=j('content/professional/ast-full-production/admission/ast-fp-r4a-professional-semantic-human-admission-v1.json');
assert.equal(contract.baselineCommit,baseline);assert.equal(contract.admissionRule.modelMayApprove,false);assert.equal(contract.admissionRule.requiredAcceptedCount,21);
assert.equal(claims.baselineCommit,baseline);assert.equal(claims.claimCount,21);assert.equal(claims.claims.length,21);assert.equal(new Set(claims.claims.map(x=>x.claimCode)).size,21);
const families=new Map;for(const c of claims.claims){const body={claimCode:c.claimCode,family:c.family,label:c.label,candidateText:c.candidateText,evidenceRefs:c.evidenceRefs,structuralRefs:c.structuralRefs,boundaries:c.boundaries};assert.equal(c.claimDigest,sha(canonical(body)),`${c.claimCode} digest drift`);families.set(c.family,(families.get(c.family)||0)+1);assert.ok(c.candidateText.en.length>40&&c.candidateText['zh-Hans'].length>20);}
assert.deepEqual(Object.fromEntries([...families].sort()),{ANGLE_SEMANTICS:4,ASPECT_DYNAMICS_SEMANTICS:4,ASPECT_PATTERN_SEMANTICS:5,ELEMENT_MODALITY_SEMANTICS:4,RULERSHIP_AND_DISPOSITOR_SEMANTICS:4});
assert.equal(claims.bundleDigest,sha(canonical(claims.claims.map(x=>x.claimDigest))));
assert.equal(cases.status,'READY_FOR_21_CLAIM_HUMAN_ACCEPTANCE');assert.equal(cases.requiredCaseCount,21);assert.equal(cases.cases.length,21);assert.equal(cases.claimBundleDigest,claims.bundleDigest);
for(const c of cases.cases){const source=claims.claims.find(x=>x.claimCode===c.caseId);assert(source);assert.equal(c.claimDigest,source.claimDigest);assert.deepEqual(c.reviewCriteria,contract.requiredCriteria)}
assert.equal(results.status,'PENDING_HUMAN_REVIEW');assert.equal(results.requiredCaseCount,21);assert.equal(results.accepted,0);assert.equal(results.pending,21);assert(results.decisions.every(x=>x.decision==='PENDING'&&x.decisionBindingDigest===null));
assert.equal(admission.status,'HUMAN_ADMISSION_READY_PENDING_USER_DECISION');assert.equal(admission.modelMayApprove,false);assert.equal(admission.humanAccepted,0);assert.equal(admission.pending,21);assert.equal(admission.customerPublicationAllowed,false);assert.equal(admission.productionAllowed,false);assert.equal(admission.customerCutoverAllowed,false);
const ui=t('content/professional/ast-full-production/review/ast-fp-r4a-professional-semantic-human-review.html');for(const token of ['R4A 专业语义人工准入','全部标记 ACCEPT','导出审核 JSON','NEEDS_REVISION','decisionBindingDigest','21'])assert.ok(ui.includes(token),token);
console.log(JSON.stringify({status:'PASS',workCode:'AST-FP-R4A',claimCount:21,families:Object.fromEntries(families),claimBundleDigest:claims.bundleDigest,humanAccepted:0,pending:21,modelMayApprove:false,r5EngineeringMayProceed:true,customerPublicationAllowed:false},null,2));
