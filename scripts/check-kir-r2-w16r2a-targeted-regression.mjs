import assert from 'node:assert/strict';
import fs from 'node:fs';
const p='review/KIR-R2-W16R2A-7-CASE-TARGETED-LIVE-RESULTS.json';
assert.ok(fs.existsSync(p),'W16R2A targeted live result is required before production admission.');
const doc=JSON.parse(fs.readFileSync(p,'utf8'));
assert.equal(doc.schemaVersion,'PHI-OS-KIR-R2-W16R2A-7-CASE-TARGETED-LIVE-REGRESSION-v1.0.0');
assert.equal(doc.baselineCommit,'d49dd16b38d7f858c9bad861b788919d0dec4c33');
assert.equal(doc.status,'TARGETED_LIVE_COMPLETED_HUMAN_SPOT_REVIEW_REQUIRED');
assert.equal(doc.summary.caseCount,7);assert.equal(doc.summary.applied,7);assert.equal(doc.summary.guardPassed,7);
for(const c of doc.cases){
  assert.equal(c.applied,true,`${c.caseId} must be applied`);assert.equal(c.successorGuard?.passed,true,`${c.caseId} successor guard must pass`);
  assert.doesNotMatch(c.answer,/(?:^|\s)(?:-?reasoning|analysis|assistant|final)\b/i,`${c.caseId} model artifact`);
  assert.doesNotMatch(c.answer,/\bE\d+(?:\s*,\s*E\d+){1,}\b/,`${c.caseId} evidence-label artifact`);
  assert.doesNotMatch(c.answer,/_[\p{L}\p{N}]{2,16}\s*$/u,`${c.caseId} underscore artifact`);
  assert.doesNotMatch(c.answer,/\bConsciousness\b/i,`${c.caseId} unexpected English`);
  assert.doesNotMatch(c.answer,/(?:灾难化|压抑|识别自己.{0,18}卡在|自己当前.{0,18}卡在|你当前.{0,18}卡在)/u,`${c.caseId} unsupported psychological/self-diagnostic expansion`);
  assert.doesNotMatch(c.answer,/(?:只能通过.{0,28}(?:被迫|显现|现身)|反而会更.{0,24}(?:清晰|明显|容易|强烈)|最终只(?:会)?(?:留|剩)|并未消失.{0,36}(?:隐性|需求|残余))/u,`${c.caseId} unsupported strong-causal expansion`);
}
console.log('✓ KIR-R2-W16R2A targeted live machine regression passed 7/7.');
console.log('  Human spot review of the 7 regenerated answers is still required before production admission.');
