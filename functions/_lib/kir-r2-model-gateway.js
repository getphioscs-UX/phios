const OPENAI_RESPONSES_URL='https://api.openai.com/v1/responses';
const DEEPSEEK_CHAT_URL='https://api.deepseek.com/chat/completions';
const DEFAULT_OPENAI_MODEL='gpt-5.6-luna';
const DEFAULT_DEEPSEEK_MODEL='deepseek-v4-flash';
const clean=v=>String(v??'').normalize('NFKC').replace(/\u000c/g,'\n').replace(/[\t ]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
const yes=v=>['1','true','yes','on','enabled'].includes(clean(v).toLowerCase());
function fail(code,details={}){const error=new Error(code);error.code=code;error.details=details;throw error;}
function parseJson(raw,code){try{return JSON.parse(raw)}catch{fail(code)}}
function openAIText(data){if(clean(data?.output_text))return clean(data.output_text);for(const item of Array.isArray(data?.output)?data.output:[]){if(item?.type!=='message')continue;for(const c of Array.isArray(item.content)?item.content:[]){if(c?.type==='refusal')fail('KIR_R2_MODEL_PROVIDER_REFUSAL',{provider:'OPENAI_LUNA'});if(c?.type==='output_text'&&clean(c.text))return clean(c.text)}}fail('KIR_R2_MODEL_PROVIDER_EMPTY_OUTPUT',{provider:'OPENAI_LUNA'});}
function deepSeekText(data){const text=clean(data?.choices?.[0]?.message?.content);if(text)return text;fail('KIR_R2_MODEL_PROVIDER_EMPTY_OUTPUT',{provider:'DEEPSEEK_V4_FLASH'});}
function evidenceText(evidencePack){const rows=[...(evidencePack?.primaryEvidence||[]),...(evidencePack?.supportingEvidence||[])];return rows.map((row,index)=>`[E${index+1}] ${clean(row.text)}`).filter(x=>x.length>5).join('\n\n');}
function systemPrompt(locale='zh-Hans'){
  if(locale!=='zh-Hans')return 'You are the PHI OS answer composer. PHI OS, not the language model, owns knowledge authority. Answer only from supplied evidence. Explain the user question directly and naturally. Do not expose internal registry, canonical-node, runtime-governance, routing, provider, benchmark, or evidence-pack terminology. Do not invent external facts, examples, methods, diagnoses, scores, or claims. If evidence is insufficient, say so. Return answer text only.';
  return '你是 PHI OS 的答案组织层，不是知识权威。只能使用随请求提供的证据正文回答。直接回答用户的问题，用自然、清晰、面向客户的简体中文解释机制与关系；不要复述问题，不要把文章标题或知识节点串成流程。不得暴露内部 registry、canonical node、Runtime、KIR、KAP、模型路由、benchmark、Evidence Pack、governance 等技术词。不得自行补充外部事实、案例、医学断言、方法结论、评分或来源中没有的具体因果。证据不足时明确说明不足。只输出最终答案正文。';
}
function userPrompt(payload={}){const locale=payload?.locale||'zh-Hans';const question=clean(payload?.question);const evidence=evidenceText(payload?.evidencePack);const contract=payload?.answerContract||{};return `${locale==='zh-Hans'?'用户问题':'User question'}:\n${question}\n\n${locale==='zh-Hans'?'仅可使用的 PHI OS 证据':'Only admitted PHI OS evidence'}:\n${evidence}\n\n${locale==='zh-Hans'?'输出要求':'Output requirements'}:\n${locale==='zh-Hans'?'- 先给直接解释，再补充必要机制；通常 180–520 个中文字符，证据需要时可稍长。\n- 不要使用“根据系统框架”“前一状态成为后一状态输入”“这个问题首先指向”等模板。\n- 不要输出内部英文术语或元说明。':'- Direct answer first, then only necessary mechanism.\n- Avoid framework/meta templates and internal terminology.'}\n- questionType=${clean(contract.questionType||'OTHER')}`;}
function normalizeUsageOpenAI(usage={}){return {input:Number(usage.input_tokens||0),cachedInput:Number(usage.input_tokens_details?.cached_tokens||0),output:Number(usage.output_tokens||0),total:Number(usage.total_tokens||0)};}
function normalizeUsageDeepSeek(usage={}){return {input:Number(usage.prompt_tokens||0),cachedInput:Number(usage.prompt_cache_hit_tokens||0),output:Number(usage.completion_tokens||0),total:Number(usage.total_tokens||0)};}
export function kirR2ModelGatewayEnabled(env={}){return yes(env.PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED);}
export function evaluateKirR2ModelBackedRoute({understanding,evidencePack,env={},forceProvider=null}={}){
  if(forceProvider)return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-W16R2-MODEL-ROUTE-v1.0.0',tier:'FORCED',providerId:forceProvider,reasonCodes:['FORCED_BY_SUCCESSOR_OR_TEST'],knowledgeAuthorityOwnedByProvider:false});
  const rows=[...(evidencePack?.primaryEvidence||[]),...(evidencePack?.supportingEvidence||[])];
  const nodes=new Set(rows.map(x=>x.nodeCode).filter(Boolean));
  const professional=understanding?.professionalDepth==='HIGH';
  const personalized=understanding?.personalizationNeed!=='NONE_REQUIRED';
  const multiNode=nodes.size>=2;
  const comparison=understanding?.questionType==='COMPARISON';
  const ambiguity=understanding?.ambiguity==='HIGH';
  const deepSeekAvailable=Boolean(clean(env.DEEPSEEK_API_KEY));
  const reasons=[];
  if(professional)reasons.push('PROFESSIONAL_DEPTH');
  if(comparison&&multiNode)reasons.push('MULTI_NODE_COMPARISON');
  if(personalized&&multiNode)reasons.push('MULTI_NODE_PERSONALIZED_SYNTHESIS');
  if(ambiguity&&multiNode)reasons.push('AMBIGUOUS_MULTI_NODE_SYNTHESIS');
  const escalate=deepSeekAvailable&&reasons.length>0;
  return Object.freeze({schemaVersion:'PHI-OS-KIR-R2-W16R2-MODEL-ROUTE-v1.0.0',tier:escalate?'T2_COMPLEX':'T1_DEFAULT',providerId:escalate?'DEEPSEEK_V4_FLASH':'OPENAI_LUNA',reasonCodes:reasons.length?reasons:['DEFAULT_CUSTOMER_COMPOSER'],knowledgeAuthorityOwnedByProvider:false});
}
export function createKirR2ModelGateway({env={},fetcher=globalThis.fetch,forceProvider=null}={}){
  if(typeof fetcher!=='function')fail('KIR_R2_MODEL_FETCH_UNAVAILABLE');
  return async ({model,payload}={})=>{
    const route=evaluateKirR2ModelBackedRoute({understanding:{questionType:payload?.answerContract?.questionType,professionalDepth:payload?.routingContext?.professionalDepth,personalizationNeed:payload?.routingContext?.personalizationNeed,ambiguity:payload?.routingContext?.ambiguity},evidencePack:payload?.evidencePack,env,forceProvider});
    if(route.providerId==='OPENAI_LUNA'){
      if(!clean(env.OPENAI_API_KEY))fail('KIR_R2_OPENAI_API_KEY_NOT_CONFIGURED');
      const providerModel=clean(env.PHIOS_KIR_R2_OPENAI_MODEL)||DEFAULT_OPENAI_MODEL;
      let response;try{response=await fetcher(OPENAI_RESPONSES_URL,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify({model:providerModel,store:false,reasoning:{effort:'none'},input:[{role:'system',content:systemPrompt(payload?.locale)},{role:'user',content:userPrompt(payload)}],max_output_tokens:900})});}catch(error){fail('KIR_R2_MODEL_PROVIDER_NETWORK_FAILED',{provider:'OPENAI_LUNA',message:clean(error?.message)})}
      const raw=await response.text();const data=parseJson(raw,'KIR_R2_OPENAI_UNREADABLE_RESPONSE');if(!response.ok)fail('KIR_R2_MODEL_PROVIDER_REQUEST_FAILED',{provider:'OPENAI_LUNA',status:response.status,message:data?.error?.message||null});
      return Object.freeze({text:openAIText(data),providerId:'OPENAI_LUNA',providerModel,route,usage:normalizeUsageOpenAI(data?.usage),rawId:data?.id||null});
    }
    if(route.providerId==='DEEPSEEK_V4_FLASH'){
      if(!clean(env.DEEPSEEK_API_KEY))fail('KIR_R2_DEEPSEEK_API_KEY_NOT_CONFIGURED');
      const providerModel=clean(env.PHIOS_KIR_R2_DEEPSEEK_MODEL)||DEFAULT_DEEPSEEK_MODEL;
      let response;try{response=await fetcher(DEEPSEEK_CHAT_URL,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${env.DEEPSEEK_API_KEY}`},body:JSON.stringify({model:providerModel,messages:[{role:'system',content:systemPrompt(payload?.locale)},{role:'user',content:userPrompt(payload)}],thinking:{type:'disabled'},max_tokens:900})});}catch(error){fail('KIR_R2_MODEL_PROVIDER_NETWORK_FAILED',{provider:'DEEPSEEK_V4_FLASH',message:clean(error?.message)})}
      const raw=await response.text();const data=parseJson(raw,'KIR_R2_DEEPSEEK_UNREADABLE_RESPONSE');if(!response.ok)fail('KIR_R2_MODEL_PROVIDER_REQUEST_FAILED',{provider:'DEEPSEEK_V4_FLASH',status:response.status,message:data?.error?.message||null});
      return Object.freeze({text:deepSeekText(data),providerId:'DEEPSEEK_V4_FLASH',providerModel,route,usage:normalizeUsageDeepSeek(data?.usage),rawId:data?.id||null});
    }
    fail('KIR_R2_MODEL_PROVIDER_UNSUPPORTED',{provider:route.providerId,requestedModel:model});
  };
}
export const KIR_R2_W16R2_DEFAULT_OPENAI_MODEL=DEFAULT_OPENAI_MODEL;
export const KIR_R2_W16R2_DEFAULT_DEEPSEEK_MODEL=DEFAULT_DEEPSEEK_MODEL;
