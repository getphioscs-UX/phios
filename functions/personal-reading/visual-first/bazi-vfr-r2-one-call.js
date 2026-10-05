import {composeVisualReportAttempt,planReportProviderRequest} from '../narrative/visual-report-provider-budget.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../narrative/ziwei-r5-provider-registry.js';
import {invokeOpenAIStructured} from '../narrative/narrative-provider.js';
import {assertTriLayerSections,VFR_BILINGUAL_SINGLE_CALL_V1} from '../../canonical-presentation-runtime/vfr-trilayer-bilingual-contract.js';
const model=ZIWEI_R5_PAI_REGISTRY.models.find(m=>m.modelId==='gpt-5.6-sol');
export const BAZI_VFR_R2_SYSTEM_PROMPT='Compose one complete professional BaZi report as JSON in Chinese and English, using the same supplied semantic source. Do not calculate pillars, hidden stems, Ten Gods, elements, relationships or timing. Do not change authority. Every section needs technical meaning, structural operation and lived meaning; write concise equivalent languages, 2–4 paragraphs and 3 takeaways. Never invent events, diagnose illness or expose internal codes. One report, one call; no diagrams or numeric data in your output.';
export function planBaziVfrR2(pack){
 const inputTokens=Math.ceil(JSON.stringify({system:BAZI_VFR_R2_SYSTEM_PROMPT,pack}).length/2),maxOutputTokens=8000;
 const budget=planReportProviderRequest({model,usage:{inputTokens,outputTokens:maxOutputTokens,cachedInputTokens:0}});
 return {model:model.modelId,inputTokens,maxOutputTokens,...VFR_BILINGUAL_SINGLE_CALL_V1,budget,allowed:inputTokens<=22000&&budget.allowed,tokenEstimator:'Conservative character/2 planning heuristic; not provider tokenizer',ratesStatus:'PLANNING_ONLY_REVALIDATE_BEFORE_LIVE'};
}
export function guardBaziVfrR2(ir,expected){
 assertTriLayerSections(ir.sections,ir.diagrams);
 if(JSON.stringify(ir.natal)!==JSON.stringify(expected.natal)||JSON.stringify(ir.timing)!==JSON.stringify(expected.timing)||JSON.stringify(ir.diagrams)!==JSON.stringify(expected.diagrams))throw Error('AUTHORITY_DATA_MUTATION');
 if(ir.pages.length>50)throw Error('PAGE_LIMIT_EXCEEDED');
 const text=JSON.stringify(ir.sections);
 if(/\d{4}年|\d+岁|甲己化土|甲戌|丙午|癸丑|戊午|必然升职|一定发财|guaranteed (?:promotion|wealth|illness)|will definitely|diagnosed with|transforms into Earth|strong Day Master/i.test(text))throw Error('FORBIDDEN_FACT_OR_PREDICTION');
 if(ir.providerUsage.providerCalls>2||ir.providerUsage.semanticReviewCalls!==0||ir.providerUsage.estimatedProviderCost>1)throw Error('PROVIDER_BUDGET_EXCEEDED');
 return ir;
}
// Deliberately unused in fixture builds. Explicit live + verified pricing gates precede transport.
export async function composeBaziVfrR2({pack,reference,env={},pricingVerified=false,ledger={calls:0,spent:0,requestId:'BAZI-VFR-R2'},fetcher=globalThis.fetch,cache=null,cacheKey}={}){
 if(cache&&cacheKey){const hit=await cache.get(cacheKey);if(hit)return guardBaziVfrR2(hit,reference);}
 const plan=planBaziVfrR2(pack);if(!plan.allowed)throw Error('BAZI_VFR_R2_PRELIVE_BLOCKED');
 const output=await composeVisualReportAttempt({env,pricingVerified,ledger,model,usage:{inputTokens:plan.inputTokens,outputTokens:8000,cachedInputTokens:0},payload:pack,invoke:async payload=>{
  const r=await invokeOpenAIStructured({env:{...env,OPENAI_NARRATIVE_MODEL:model.modelId},fetcher,systemPrompt:BAZI_VFR_R2_SYSTEM_PROMPT,userPayload:payload,schema:pack.outputSchema,schemaName:'bazi_vfr_r2_bilingual_report',maxOutputTokens:8000});return {output:r.output,usage:r.usage};
 }});
 if(output.sections?.length!==reference.sections.length)throw Error('BILINGUAL_STRUCTURE_REQUIRED');
 const ir=structuredClone(reference);ir.sections=reference.sections.map(s=>{const o=output.sections.find(x=>x.sectionId===s.id);if(!o)throw Error('BILINGUAL_STRUCTURE_REQUIRED');return {...s,...o};});
 ir.providerUsage={...ir.providerUsage,providerCalls:ledger.calls,estimatedProviderCost:ledger.spent,mode:'LIVE_CANDIDATE',cacheHit:false};guardBaziVfrR2(ir,reference);
 if(cache&&cacheKey)await cache.put(cacheKey,ir);return ir;
}
