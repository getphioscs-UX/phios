import {invokeOpenAIStructured,safeProviderFailure} from '../functions/personal-reading/narrative/narrative-provider.js';
import {ZIWEI_R5_PAI_REGISTRY} from '../functions/personal-reading/narrative/ziwei-r5-provider-registry.js';

const key=String(process.env.OPENAI_API_KEY||'').trim();
if(!key)throw Error('ZIWEI_R5_OPENAI_API_KEY_REQUIRED');
const model=ZIWEI_R5_PAI_REGISTRY.models[0]?.modelId;
if(!model)throw Error('ZIWEI_R5_MODEL_ROUTE_MISSING');
const schema={type:'object',additionalProperties:false,required:['ok'],properties:{ok:{type:'boolean'}}};
try{
 const result=await invokeOpenAIStructured({
  env:{OPENAI_API_KEY:key,OPENAI_NARRATIVE_MODEL:model},
  systemPrompt:'Return the required JSON only. Set ok to true.',
  userPayload:{task:'PHI OS Zi Wei R5 provider connectivity probe. No customer data.'},
  schema,schemaName:'ziwei_r5_provider_probe',maxOutputTokens:64
 });
 if(result?.output?.ok!==true)throw Error('ZIWEI_R5_PROVIDER_PROBE_OUTPUT_INVALID');
 console.log(JSON.stringify({status:'PASS',provider:result.provider,model:result.model,keyConfigured:true,usage:result.usage||null},null,2));
}catch(error){
 console.error(JSON.stringify({status:'FAIL',model,keyConfigured:true,errorCode:error?.code||error?.message||'UNKNOWN',...safeProviderFailure(error)},null,2));
 process.exitCode=1;
}
