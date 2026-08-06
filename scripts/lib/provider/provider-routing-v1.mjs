import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {runKnowledgeRuleEngine} from '../../lib/knowledge-rule-engine/knowledge-rule-engine-v1.mjs';
import {loadAdapterFoundation,runGoogleQueryTranslationAdapter,runWorkersAiAdapter,runOpenAiPublicKnrAdapter} from './provider-adapter-foundation-v1.mjs';
const root=process.cwd();
const readJson=async f=>JSON.parse(await fs.readFile(path.join(root,f),'utf8'));
const stable=v=>JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
export async function loadProviderRouting(){const [contract,policy,registry,budgetPolicy,ledger,cacheContract,adapterFoundation]=await Promise.all([
 readJson('content/provider/contracts/provider-routing-v1.json'),readJson('content/provider/routing/provider-routing-policy-v1.json'),readJson('content/provider/routing/provider-routing-registry-v1.json'),readJson('content/provider/policies/zero-cost-provider-policy.json'),readJson('content/provider/ledger/public-knr-usage-ledger.json'),readJson('content/provider/contracts/translation-cache-v1.json'),loadAdapterFoundation()]);return {contract,policy,registry,budgetPolicy,ledger,cacheContract,adapterFoundation};}
const event=(stage,status,detail={})=>({stage,status,...detail});
export async function routePublicKnowledge({query,locale='zh-Hans',purpose='auto',cacheHit=false}={}){
 const cfg=await loadProviderRouting();const trace=[];const initial=await runKnowledgeRuleEngine({query,locale,intent:purpose});
 trace.push(event('deterministic_rule_engine','completed',{outcome:initial.outcome,resultDigest:initial.resultDigest}));
 trace.push(event('published_multilingual_index','completed',{publishedOnly:true}));
 trace.push(event('local_coverage_evaluation','completed',{outcome:initial.outcome}));
 if(cfg.policy.localCoverageSufficientOutcomes.includes(initial.outcome))return finalize({routingCode:'KRA-W1-DETERMINISTIC-RETURN',query:String(query??''),locale,initialOutcome:initial.outcome,finalOutcome:initial.outcome,trace,providerEligible:false,providerUsed:false,networkCalls:0,budgetReserved:0,paidFallbackUsed:false,result:initial});
 trace.push(event('translation_cache',cacheHit?'hit':'miss',{providerCalls:0,usageUnits:0}));
 if(cacheHit){trace.push(event('deterministic_rematch','skipped',{reason:'cache_payload_not_supplied_in_foundation'}));return finalize({routingCode:'KRA-W1-CACHE-FOUNDATION',query:String(query??''),locale,initialOutcome:initial.outcome,finalOutcome:initial.outcome,trace,providerEligible:false,providerUsed:false,networkCalls:0,budgetReserved:0,paidFallbackUsed:false,result:initial});}
 const translationLimit=cfg.budgetPolicy.internalHardLimits.google_query_translation??0;
 const translationBudgetAvailable=translationLimit>0;
 trace.push(event('budget_gate',translationBudgetAvailable?'eligible':'blocked',{providerCode:'google_query_translation',internalHardLimit:translationLimit,paidOverageDisabled:true}));
 const google=runGoogleQueryTranslationAdapter({query,purpose:'unmatched_query_translation_fallback'},cfg.adapterFoundation);
 trace.push(event('google_query_translation_candidate',google.allowed?'candidate':'blocked',{reason:google.reason,networkCall:google.networkCall}));
 trace.push(event('deterministic_rematch','skipped',{reason:'no_translation_candidate'}));
 const workersLimit=cfg.budgetPolicy.internalHardLimits.workers_ai_reranking??0;
 const workersEligible=workersLimit>0&&cfg.policy.workersAi.enabled;
 trace.push(event('workers_ai_eligibility',workersEligible?'eligible':'blocked',{internalHardLimit:workersLimit,coverageGateBypassAllowed:false}));
 const workers=runWorkersAiAdapter({operation:'candidate_reranking',query,candidates:initial.articleRecommendations??[]},cfg.adapterFoundation);
 trace.push(event('workers_ai_candidate_reranking',workers.allowed?'candidate':'blocked',{reason:workers.reason,networkCall:workers.networkCall}));
 trace.push(event('final_coverage_gate','completed',{outcome:initial.outcome,providerMayBypassCoverage:false}));
 const openai=runOpenAiPublicKnrAdapter({operation:'fallback'},cfg.adapterFoundation);
 trace.push(event('openai_public_knr','blocked',{reason:openai.reason,budgetUnits:0}));
 trace.push(event('published_projection_or_fail_closed','fail_closed',{deterministicResultsAvailable:true}));
 return finalize({routingCode:'KRA-W1-FAIL-CLOSED',query:String(query??''),locale,initialOutcome:initial.outcome,finalOutcome:initial.outcome,trace,providerEligible:true,providerUsed:false,networkCalls:0,budgetReserved:0,paidFallbackUsed:false,providerEnhancementAvailable:false,deterministicResultsAvailable:true,result:initial});
}
function finalize(v){return {...v,routingDigest:sha(v)};}
export {stable,sha};
