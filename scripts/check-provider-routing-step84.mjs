import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {loadProviderRouting,routePublicKnowledge} from './lib/provider/provider-routing-v1.mjs';
const root=process.cwd();const read=async f=>fs.readFile(path.join(root,f),'utf8');
const cfg=await loadProviderRouting();
assert.equal(cfg.contract.principles.deterministicFirst,true);assert.equal(cfg.contract.principles.cacheBeforeBudget,true);assert.equal(cfg.contract.principles.budgetBeforeProvider,true);assert.equal(cfg.contract.principles.paidFallbackAllowed,false);assert.equal(cfg.contract.principles.providerMayBypassCoverage,false);
assert.deepEqual(cfg.contract.requiredOrder,['deterministic_rule_engine','published_multilingual_index','local_coverage_evaluation','translation_cache','budget_gate','google_query_translation_candidate','deterministic_rematch','workers_ai_eligibility','workers_ai_candidate_reranking','final_coverage_gate','published_projection']);
assert.equal(cfg.policy.translationFallback.enabled,false);assert.equal(cfg.policy.workersAi.enabled,false);assert.equal(cfg.policy.openAiPublicKnr.enabled,false);assert.equal(cfg.policy.openAiPublicKnr.budgetUnits,0);assert.equal(cfg.policy.openAiPublicKnr.paidFallbackAllowed,false);
assert.equal(cfg.budgetPolicy.internalHardLimits.google_query_translation,0);assert.equal(cfg.budgetPolicy.internalHardLimits.workers_ai_reranking,0);assert.equal(cfg.budgetPolicy.internalHardLimits.openai_public_knr,0);
const direct=await routePublicKnowledge({query:'人工智能如何从文明能力中形成？',locale:'zh-Hans'});assert.equal(direct.initialOutcome,'direct_match');assert.equal(direct.providerUsed,false);assert.equal(direct.networkCalls,0);assert.equal(direct.routingCode,'KRA-W1-DETERMINISTIC-RETURN');
const none=await routePublicKnowledge({query:'完全没有已发布支持的问题',locale:'zh-Hans'});assert.equal(none.providerUsed,false);assert.equal(none.networkCalls,0);assert.equal(none.budgetReserved,0);assert.equal(none.paidFallbackUsed,false);assert.equal(none.providerEnhancementAvailable,false);assert.equal(none.deterministicResultsAvailable,true);assert.equal(none.trace.find(x=>x.stage==='translation_cache').status,'miss');assert.equal(none.trace.find(x=>x.stage==='budget_gate').status,'blocked');assert.equal(none.trace.find(x=>x.stage==='final_coverage_gate').providerMayBypassCoverage,false);
for(const f of ['scripts/lib/provider/provider-routing-v1.mjs','scripts/run-provider-routing-step84.mjs']){const t=await read(f);assert.doesNotMatch(t,/\bfetch\s*\(/);assert.doesNotMatch(t,/OPENAI_API_KEY|GOOGLE_APPLICATION_CREDENTIALS|CLOUDFLARE_API_TOKEN/);}
console.log('✓ STEP84 deterministic-first Provider Eligibility and Routing Order passed.');
console.log('✓ Cache-first, Budget-before-Provider and Coverage Recheck passed.');
console.log('✓ Google Translation and Workers AI remain disabled foundations.');
console.log('✓ OpenAI Public KNR, paid overage and paid fallback remain blocked.');
console.log('✓ No network call, credential read, Provider content authority or Coverage bypass passed.');
