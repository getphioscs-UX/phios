import fs from 'node:fs'; import assert from 'node:assert/strict';
const p='content/runtime/journey-runtime/registries/canonical-node-rule-eligibility-v1.json'; const d=JSON.parse(fs.readFileSync(p,'utf8'));
const allowed=new Set(['EXECUTABLE_RULE','STATE_PRIMITIVE','EVIDENCE_QUESTION','EXPLANATION_FRAGMENT','RETRIEVAL_ONLY','CONTEXT_ONLY','PROFESSIONAL_GATED','NON_EXECUTABLE','DEFER']);
assert.equal(d.accounting.canonicalNodeCount,931); assert.equal(d.entries.length,931); assert.equal(new Set(d.entries.map(x=>x.nodeCode)).size,931);
for(const e of d.entries){assert.ok(allowed.has(e.proposedDisposition),e.nodeCode);assert.equal(e.activeRule,false,e.nodeCode);assert.equal(e.productionEffect,'none',e.nodeCode);assert.equal(e.canonicalMutation,false,e.nodeCode);assert.equal(e.humanAcceptance?.accepted,true,e.nodeCode);if(e.proposedDisposition==='EXECUTABLE_RULE'||e.proposedDisposition==='PROFESSIONAL_GATED') assert.equal(e.reviewPriority,'TL_REVIEW_REQUIRED',e.nodeCode);}
assert.equal(d.accounting.automaticActiveRuleCount,0); assert.equal(d.authority.eligibilityHumanAccepted,true); assert.equal(d.entries.filter(x=>x.activeRule===true).length,0);
console.log('✓ RJX 931 Rule Eligibility Classification passed.'); console.log(`  931/931 classified; 0 active rules; TL review required: ${d.accounting.byReviewPriority.TL_REVIEW_REQUIRED}.`);
