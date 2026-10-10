import assert from 'node:assert/strict';
import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('content/personal-reading/relationship/review/rel-method-authority-successor-human-review-cases-v1.json','utf8'));
const r=JSON.parse(fs.readFileSync('content/personal-reading/relationship/review/rel-method-authority-successor-human-review-results-v1.json','utf8'));
assert.equal(p.cases.length,72);
for(const m of ['BZR','ZWR','ECR'])assert.equal(p.cases.filter(x=>x.methodId===m).length,24);
assert.equal(p.cases.every(x=>x.claims.every(c=>!/compatibility percentage|soulmate|will last|secretly|hidden feeling/i.test(c.summary))),true);
const ids=new Set(p.cases.map(x=>x.caseId));
assert.equal(r.results.length,72);
assert.equal(r.results.every(x=>ids.has(x.caseId)),true);
if(r.status==='PENDING'){assert.equal(r.accepted,0);assert.equal(r.pending,72);assert.equal(r.results.every(x=>x.decision==='PENDING'),true);console.log('✓ REL method authority successor Human review readiness passed: 72 cases pending Human decision.')}
else if(r.status==='HUMAN_ACCEPTED_72_OF_72'){assert.equal(r.accepted,72);assert.equal(r.revised,0);assert.equal(r.rejected,0);assert.equal(r.pending,0);assert.equal(r.results.every(x=>x.decision==='ACCEPT'),true);console.log('✓ REL method authority successor Human review passed: 72/72 Human accepted.')}
else throw new Error(`REL_METHOD_AUTHORITY_HUMAN_RESULT_STATUS_UNRECOGNIZED:${r.status}`);
