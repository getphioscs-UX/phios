import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const a=read('content/personal-reading/relationship/acceptance/rel-method-authority-successor-human-admission-v1.json');
const r=read('content/personal-reading/relationship/review/rel-method-authority-successor-human-review-results-v1.json');
assert.equal(a.status,'HUMAN_ADMITTED_72_OF_72');
assert.deepEqual(a.counts,{required:72,accepted:72,revised:0,rejected:0,pending:0});
for(const m of ['BZR','ZWR','ECR']){assert.equal(a.methodSplit[m].required,24);assert.equal(a.methodSplit[m].accepted,24)}
assert.equal(r.status,'HUMAN_ACCEPTED_72_OF_72');assert.equal(r.accepted,72);assert.equal(r.pending,0);assert.equal(r.results.every(x=>x.decision==='ACCEPT'),true);
assert.equal(a.reviewEvidence.casesSha256,sha(a.reviewEvidence.casesRef));
assert.equal(a.reviewEvidence.resultsSha256,sha(a.reviewEvidence.resultsRef));
assert.equal(a.boundaries.natalBaziMeaningPromotedIntoPairMeaning,false);assert.equal(a.boundaries.ziWeiCrossChartStarInteractionCreated,false);assert.equal(a.boundaries.compatibilityScoreCreated,false);assert.equal(a.boundaries.hdRelationshipAuthorityGrantedByThisAdmission,false);
console.log('✓ REL BZR/ZWR/ECR Human admission passed: 72/72 accepted; method scopes promoted without HD or compatibility authority drift.');
