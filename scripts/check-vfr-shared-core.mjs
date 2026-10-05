import assert from 'node:assert/strict';
import {planVfrProviderBudget,assertVfrCallCount} from '../functions/personal-reading/visual-first/report-provider-budget.js';

const model={inputPricePerMillion:2.5,cachedInputPricePerMillion:.25,outputPricePerMillion:15};
const input='x'.repeat(12000);
const allow=planVfrProviderBudget({model,input,maxOutputTokens:8000,spentUsd:0,nextCallKind:'PRIMARY'});
assert.equal(allow.allowed,true);
assert.equal(allow.budgetLimitUsd,1);
const blocked=planVfrProviderBudget({model,input:'x'.repeat(900000),maxOutputTokens:12000,spentUsd:0,nextCallKind:'PRIMARY'});
assert.equal(blocked.allowed,false);
assert.equal(blocked.status,'PROVIDER_BUDGET_PRECHECK_BLOCKED');
const repairDenied=planVfrProviderBudget({model,input:'x'.repeat(12000),maxOutputTokens:8000,spentUsd:.91,nextCallKind:'REPAIR'});
assert.equal(repairDenied.allowed,false);
const repairAllowed=planVfrProviderBudget({model,input:'x'.repeat(12000),maxOutputTokens:8000,spentUsd:.5,nextCallKind:'REPAIR'});
assert.equal(repairAllowed.allowed,true);
assert.doesNotThrow(()=>assertVfrCallCount({providerCalls:1,semanticReviewCalls:0}));
assert.throws(()=>assertVfrCallCount({providerCalls:3,semanticReviewCalls:0}),/VFR_PROVIDER_CALL_LIMIT_EXCEEDED/);
assert.throws(()=>assertVfrCallCount({providerCalls:1,semanticReviewCalls:1}),/VFR_SEMANTIC_AI_REVIEW_FORBIDDEN/);
console.log('PASS PHI-OS-VFR-R1 shared core: <=USD1 budget governor, <=2 absolute calls, zero semantic-AI review in customer hot path.');
