import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const results=read('content/production/symbolic-method/human-review/tarot-human-review-results-v2.json');
const rubric=read('content/production/symbolic-method/human-review/tarot-human-review-rubric-v2.json');
const freeze=read('content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v2.json');
const critical=rubric.criteria.filter(x=>x.critical).map(x=>x.id);
assert.equal(results.planned,24,'TPA-W42 requires 24 planned sessions');
assert.equal(results.machinePreflightPassed,24,'machine preflight must pass all 24 before human signoff');
assert.equal(results.sessions.length,24);
for(const row of results.sessions){
 assert.equal(row.humanReviewed,true,`${row.sessionId}: real human review pending`);
 assert.equal(row.decision,'ACCEPTED',`${row.sessionId}: must be ACCEPTED`);
 assert.ok(String(row.reviewerId||'').trim(),`${row.sessionId}: reviewerId required`);
 assert.ok(String(row.reviewedAt||'').trim(),`${row.sessionId}: reviewedAt required`);
 for(const id of critical)assert.equal(row.criteria?.[id],true,`${row.sessionId}: critical criterion ${id} not accepted`);
}
assert.equal(results.humanReviewed,24);assert.equal(results.accepted,24);assert.equal(results.rejected,0);assert.equal(results.needsFix,0);assert.equal(results.productionPromotionAllowed,false,'human acceptance alone may not promote product');
assert.equal(freeze.status,'ACCEPTED_24_OF_24_HUMAN_REVIEW_ZERO_CRITICAL_FAILURES');assert.equal(freeze.current.humanReviewed,24);assert.equal(freeze.current.accepted,24);assert.equal(freeze.humanAcceptanceComplete,true);assert.equal(freeze.productionPromotionAllowed,false);assert.equal(freeze.runAllowedMayChange,false);
console.log('✓ TPA-W42 Tarot human acceptance passed: 24/24 real human reviews accepted, zero critical boundary failures.');
console.log('  Human acceptance alone does not promote PCM or runAllowed; live browser and live production SHA remain separate gates.');
