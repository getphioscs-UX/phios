import {selectPaiRoute,selectPaiFailureFallback} from '../../_lib/pai-r1-economics.js';
import {invokeOpenAIStructured} from './narrative-provider.js';
import {textSize} from '../../canonical-presentation-runtime/visual-report-page-runtime.js';
// Until paraphrase entailment has an admitted authority, this composition lane
// selects/reorders complete governed statements. It cannot rewrite their facts.
const schema={type:'object',additionalProperties:false,required:['slots'],properties:{slots:{type:'array',maxItems:3,items:{type:'object',additionalProperties:false,required:['sourceRef','text'],properties:{sourceRef:{type:'string'},text:{type:'string'}}}}}};
export function verifyVisualMicrocopy(output,allowed,locale){
 if(!output||Object.keys(output).some(x=>x!=='slots')||!Array.isArray(output.slots)||output.slots.length>3||!output.slots.length)return false;
 if(new Set(output.slots.map(x=>x.text)).size!==output.slots.length)return false;
 if(output.slots.some(x=>Object.keys(x).some(k=>!['text','sourceRef'].includes(k))||!allowed.some(a=>a.sourceRef===x.sourceRef&&a.text===x.text)))return false;
 return textSize(output.slots.map(x=>x.text).join(' '),locale)<=(locale==='zh-Hans'?180:110);
}
export async function composeVisualMicrocopy({page,allowedStatements,registry={},env={},fetcher=globalThis.fetch,cache=null,aiExecutionClass='T1_CANONICAL_ASSEMBLY',timeoutMs=8000}){
 if(!Array.isArray(allowedStatements)||!allowedStatements.length)throw Error('VRPT_CANONICAL_FALLBACK_REQUIRED');
 if(!['T1_CANONICAL_ASSEMBLY','T2_LIGHT_COMPOSITION','T3_DEEP_COMPOSITION'].includes(aiExecutionClass))throw Error('VRPT_COMPOSITION_CLASS_INVALID');
 if(aiExecutionClass==='T3_DEEP_COMPOSITION'&&page.methodId!=='CROSS')throw Error('VRPT_T3_CROSS_ONLY');
 const fallback={slots:allowedStatements.slice(0,3).map(({sourceRef,text})=>({sourceRef,text}))};
 if(!verifyVisualMicrocopy(fallback,allowedStatements,page.locale))throw Error('VRPT_SHORT_CANONICAL_COPY_REQUIRED');
 const route=selectPaiRoute({aiExecutionClass,deterministicFallbackAvailable:true},registry);
 const key=JSON.stringify({version:'VRPT-EXTRACTIVE-1',pageId:page.pageId,locale:page.locale,sourceReportRef:page.sourceReportRef,allowedStatements,aiExecutionClass,model:route.selectedModel});
 const cached=cache?await cache.get(key):null;if(cached&&verifyVisualMicrocopy(cached.output,allowedStatements,page.locale))return {...cached,cacheHit:true};
 const deterministic=reason=>({output:fallback,route,disposition:'CANONICAL_FALLBACK',reason,providerCalls:0,cacheHit:false});
 if(!route.providerRequired||!route.selectedModel||route.selectedProvider!=='openai')return deterministic(route.routingReason);
 const alternatives=[{modelId:route.selectedModel,providerId:route.selectedProvider},selectPaiFailureFallback(route,route.selectedModel,registry)].filter(x=>x?.providerId==='openai');
 let calls=0;
 for(const model of alternatives){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{
  calls++;
  const result=await invokeOpenAIStructured({env:{...env,OPENAI_NARRATIVE_MODEL:model.modelId},fetcher:(url,options)=>fetcher(url,{...options,signal:controller.signal}),systemPrompt:'Select up to three complete supplied statements for this report page. Copy text and sourceRef exactly. Do not paraphrase, add facts, change numbers, infer personality, give forecasts or remove qualifications. Return structured slots only.',userPayload:{question:page.question,locale:page.locale,allowedStatements,claimRefs:page.claims,evidenceRefs:page.evidenceRefs,boundaryRefs:page.boundaryRefs,textBudget:page.quality?.textBudget},schema,schemaName:'phi_visual_microcopy',maxOutputTokens:650});
  if(!verifyVisualMicrocopy(result.output,allowedStatements,page.locale))continue;
  const accepted={output:result.output,route,disposition:'VERIFIED_EXTRACTIVE_COMPOSITION',providerCalls:calls,model:result.model,usage:result.usage,cacheHit:false};if(cache)await cache.set(key,accepted);return accepted;
 }catch{/* Fail closed to the same canonical copy. */}finally{clearTimeout(timer);}}
 return {...deterministic('PROVIDER_OR_VERIFICATION_FAILED'),providerCalls:calls};
}
