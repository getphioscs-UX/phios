import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prioritizeHumanDesignR3WholeChart} from '../functions/external-profile/human-design-r3-whole-chart-priority.js';
import {buildHumanDesignR3RealityCompositionV2,HD_R3_REALITY_VERSION,HD_R3_REALITY_RESPONSE_STATES} from '../functions/external-profile/human-design-r3-reality-composition-v2.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const contract=read(`${ROOT}/reality/HD-PRO-R3-W17-reality-composition-v2-contract.json`);
const fixture=read(`${ROOT}/reality/HD-PRO-R3-W17-reality-fixture-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v14.json`);
const historical=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v13.json`);

assert.equal(contract.baselineCommit,'ba3ac00864644f7ac7861df59ce8c35db7ebad97');
assert.deepEqual(contract.categories,['DECISION','ENGAGEMENT','WORK_ENERGY','RELATIONSHIP','OPENNESS_PRESSURE','ENVIRONMENT','ROLE','CONTRADICTION']);
assert.deepEqual(contract.responseStates,HD_R3_REALITY_RESPONSE_STATES);
assert.equal(contract.genericTraitQuestionAllowed,false);

const priority=prioritizeHumanDesignR3WholeChart(fixture.facts,{customerIntent:fixture.facts.customerIntent});
const first=buildHumanDesignR3RealityCompositionV2(fixture.facts,{priorityResult:priority});
const second=buildHumanDesignR3RealityCompositionV2(JSON.parse(JSON.stringify(fixture.facts)),{priorityResult:priority});
assert.equal(first.schemaVersion,HD_R3_REALITY_VERSION);
assert.deepEqual(first,second);
assert.deepEqual(new Set(first.questions.map(x=>x.category)),new Set(contract.categories));
assert.equal(first.questions.length,8);
for(const q of first.questions){
  assert(q.question?.en&&q.question?.zhHans);
  assert.deepEqual(q.responseStates,HD_R3_REALITY_RESPONSE_STATES);
  assert(q.technicalRefs.findingIds.length>=1);
  assert(q.technicalRefs.claimIds.length>=1);
  assert(q.technicalRefs.sourceRefs.length>=1);
  assert(q.technicalRefs.compositionRuleIds.length>=1);
}
const decision=first.questions.find(x=>x.category==='DECISION');
assert.match(decision.question.zhHans,/几个小时|隔天|变化|保留/);
const relationship=first.questions.find(x=>x.category==='RELATIONSHIP');
assert.match(relationship.question.zhHans,/关系|对方/);
const allText=JSON.stringify(first.questions).toLowerCase();
assert(!allText.includes('这个特质在哪里出现'));
assert(!allText.includes('is your emotional authority obvious'));
assert.equal(first.policy.genericTraitQuestionAllowed,false);
assert.equal(first.policy.contradictionExplicitlyInvited,true);
assert.equal(first.publication.customerPublishableR3,false);

assert.equal(status.updatedByWork,'HD-PRO-R3-W17');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v13.json`);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W16');
assert.equal(status.aggregate.realityCompositionV2Active,true);
assert.equal(status.aggregate.realityCompositionCategories,8);
assert.equal(status.aggregate.realityCompositionResponseStates,5);
assert.equal(status.aggregate.realityGenericTraitQuestionsAllowed,false);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W18 Relationship Composition');

console.log('✓ HD-PRO-R3-W17 Reality Composition v2 passed.');
console.log('  Eight semantic-specific Reality categories are bound to prioritized findings with five customer evidence states and explicit contradiction handling; generic trait questions are rejected.');
