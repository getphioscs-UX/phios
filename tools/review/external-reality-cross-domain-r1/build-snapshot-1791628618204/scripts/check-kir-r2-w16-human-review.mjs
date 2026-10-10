import assert from 'node:assert/strict';import fs from 'node:fs';
const p='content/knowledge/knowledge-intelligence-r2/review/kir-r2-w16-100-question-human-review-v1.json';const d=JSON.parse(fs.readFileSync(p,'utf8'));
const accepted=d.cases.filter(c=>c.humanReview.status==='ACCEPTED').length;const rejected=d.cases.filter(c=>c.humanReview.status==='REJECTED').length;const pending=d.cases.length-accepted-rejected;const critical=d.cases.filter(c=>c.humanReview.criticalFailure===true).length;
console.log(`KIR-R2 W16 human review: ${accepted}/100 accepted, ${rejected} rejected, ${pending} pending, ${critical} critical.`);
assert.equal(pending,0,'KIR-R2 W16 human acceptance remains pending.');assert.ok(accepted>=d.threshold.minimumAccepted,`KIR-R2 W16 requires >=${d.threshold.minimumAccepted} accepted cases.`);assert.ok(critical<=d.threshold.criticalFailuresAllowed,'KIR-R2 W16 critical failure threshold exceeded.');console.log('✓ KIR-R2 W16 human acceptance passed.');
