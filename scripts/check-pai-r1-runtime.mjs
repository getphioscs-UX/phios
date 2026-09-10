import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  disciplinePaiEvidence,estimatePaiProviderCost,enforcePaiCostCeiling,createPaiUsageRecord,
  applyPaiCreditTransaction,evaluatePaiAbuse,projectPaiUsageUx
} from '../functions/_lib/pai-r1-economics.js';

const read = path => JSON.parse(fs.readFileSync(path,'utf8'));
const prompt = read('content/ai-economics/contracts/pai-prompt-evidence-discipline-v1.json');
const disciplined = disciplinePaiEvidence([
  {canonicalMeaningId:'M1',sourceClass:'CANONICAL_NODE',text:'a'.repeat(100),authorized:true},
  {canonicalMeaningId:'M1',sourceClass:'ARTICLE',text:'duplicate',authorized:true},
  {canonicalMeaningId:'BOOK',sourceClass:'FULL_BOOK',text:'whole book',authorized:true},
  {canonicalMeaningId:'CTX',sourceClass:'CONTEXT',text:'private',authorized:false}
],prompt.budgets);
assert.equal(disciplined.admitted.length,1);
assert.deepEqual(disciplined.rejected.map(item=>item.reason),['DUPLICATE_MEANING','WHOLE_BOOK_FORBIDDEN','UNAUTHORIZED_CONTEXT']);
const providers = read('content/ai-economics/providers/ai-provider-cost-registry-v1.json');
const cost = estimatePaiProviderCost(providers.models[0],{inputTokens:1800,cachedInputTokens:800,outputTokens:450});
assert.ok(cost > 0);
assert.equal(enforcePaiCostCeiling({estimatedCost:0.2,ceiling:0.03,evidenceCanReduce:true}).disposition,'REDUCE_EVIDENCE_AND_REPRICE');
assert.equal(enforcePaiCostCeiling({estimatedCost:0.2,ceiling:0.03,deterministicFallbackAvailable:true}).disposition,'USE_DETERMINISTIC_FALLBACK');
const usage = createPaiUsageRecord({requestId:'REQ-1',aiExecutionClass:'T2_LIGHT_COMPOSITION',provider:'OPENAI',model:'gpt-5.6-luna',inputTokens:1800,cachedInputTokens:800,outputTokens:450,estimatedProviderCost:cost,customerTier:'PLUS',entitlementClass:'PLUS',creditsCharged:1,requestType:'PRODUCTION',providerAttemptCount:1,success:true});
const observation = read('content/ai-economics/contracts/pai-runtime-observability-contract-v1.json');
for(const field of observation.requiredFields) assert.ok(Object.hasOwn(usage,field),field);
assert.throws(()=>createPaiUsageRecord({requestId:'REQ-2',aiExecutionClass:'T2_LIGHT_COMPOSITION',requestType:'PRODUCTION',providerAttemptCount:2}),/PAI_MULTI_PROVIDER_WITHOUT_RECORDED_FAILURE/);
const debit = applyPaiCreditTransaction({transactionId:'TX-1',requestId:'REQ-1',balance:3,amount:2,kind:'DEBIT',reason:'DEEP_ASK',entitlementClass:'CREDIT_PACK',usageClass:'T3'});
assert.deepEqual([debit.beforeBalance,debit.afterBalance,debit.debitStatus],[3,1,'APPLIED']);
assert.equal(applyPaiCreditTransaction({transactionId:'TX-2',requestId:'REQ-2',balance:1,amount:2,kind:'DEBIT'}).debitStatus,'INSUFFICIENT_BALANCE');
const entitlement = read('content/ai-economics/registries/pai-entitlement-matrix-v1.json');
assert.deepEqual(entitlement.entitlements.map(item=>item.code),['FREE','CREDIT_PACK','PLUS','REALITY','ONE_OFF','PROFESSIONAL']);
assert.deepEqual(entitlement.entitlements[0].allowedExecutionClasses,['T0_DETERMINISTIC','T1_CANONICAL_ASSEMBLY']);
const pricing = read('content/ai-economics/registries/pai-pricing-consumption-registry-v1.json');
assert.equal(pricing.invariants.paiOwnsProductionPrice,false);
const ux = projectPaiUsageUx({credits:2});
assert.equal(ux.status,'2 PHI Credits');
assert.equal(JSON.stringify(ux).includes('token'),false);
const abusePolicy = read('content/ai-economics/registries/pai-abuse-protection-policy-v1.json');
const abuse = evaluatePaiAbuse({monthlyRequests:500,identicalDeepReplay:true},abusePolicy);
assert.equal(abuse.allowed,false);
assert.equal(abuse.reuseCachedGroundedResultFirst,true);
console.log('✓ PAI-R1-W1/W3–W9 usage, prompt discipline, ceilings, credits, entitlements, pricing consumption, UX and abuse gates passed.');
