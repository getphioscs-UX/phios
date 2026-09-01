import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const cases=j('content/personal-reading/relationship/review/rel-w4-human-review-cases-v1.json');
const results=j('content/personal-reading/relationship/review/rel-w4-human-review-results-v1.json');
const readiness=j('content/personal-reading/relationship/acceptance/rel-w4-human-review-readiness-v1.json');
assert.equal(cases.requiredCases,48);assert.equal(cases.cases.length,48);assert.equal(cases.cases.filter(x=>x.methodId==='AST').length,24);assert.equal(cases.cases.filter(x=>x.methodId==='NUM').length,24);
assert.equal(cases.cases.filter(x=>x.methodId==='AST'&&x.state==='MACHINE_COMPOSED_HUMAN_ADMISSION_PENDING').length,16);
assert.equal(cases.cases.filter(x=>x.methodId==='AST'&&x.state==='SUPPRESSED_PRECISION').length,7);
assert.equal(cases.cases.filter(x=>x.methodId==='AST'&&x.state==='NO_RULE_HIT').length,1);
assert.equal(cases.cases.filter(x=>x.methodId==='NUM'&&x.state==='MACHINE_COMPOSED_HUMAN_ADMISSION_PENDING').length,24);
for(const c of cases.cases){assert.equal(c.reviewRubric.length,8);assert.equal(c.decision,'PENDING');for(const r of c.representativeClaims||[]){assert.ok(!/compatible|compatibility percentage|soulmate|will leave|secretly wants/i.test(r.summary.replace('compatibility score','')));}}
assert.equal(results.requiredCases,48);assert.equal(results.pending,48);assert.equal(results.results.length,48);assert.equal(readiness.humanAdmissionGranted,false);assert.ok(fs.existsSync(readiness.reviewSurface));
console.log('✓ REL-W4 Human review readiness passed: 48 review cases (AST 24 + NUM 24), official Human admission remains pending.');
