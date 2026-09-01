const RESPONSES_URL='https://api.openai.com/v1/responses';
function fail(code,details={}){const e=new Error(code);e.code=code;e.details=details;throw e;}
function clean(v){return typeof v==='string'?v.trim():'';}
function outputText(data){
  if(clean(data?.output_text))return clean(data.output_text);
  for(const item of Array.isArray(data?.output)?data.output:[]){
    if(item?.type!=='message')continue;
    for(const c of Array.isArray(item.content)?item.content:[]){
      if(c?.type==='refusal')fail('NARRATIVE_PROVIDER_REFUSAL',{message:clean(c.refusal)});
      if(c?.type==='output_text'&&clean(c.text))return clean(c.text);
    }
  }
  fail('NARRATIVE_PROVIDER_EMPTY_OUTPUT');
}
export async function invokeOpenAIStructured({env={},fetcher=globalThis.fetch,systemPrompt,userPayload,schema,schemaName,maxOutputTokens=5200}){
  if(!clean(env.OPENAI_API_KEY))fail('OPENAI_API_KEY_NOT_CONFIGURED');
  const model=clean(env.OPENAI_NARRATIVE_MODEL)||clean(env.OPENAI_MODEL);
  if(!model)fail('OPENAI_NARRATIVE_MODEL_NOT_CONFIGURED');
  if(typeof fetcher!=='function')fail('NARRATIVE_PROVIDER_FETCH_UNAVAILABLE');
  let response;
  try{response=await fetcher(RESPONSES_URL,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify({
    model,store:false,input:[{role:'system',content:String(systemPrompt||'')},{role:'user',content:typeof userPayload==='string'?userPayload:JSON.stringify(userPayload)}],
    text:{format:{type:'json_schema',name:schemaName,strict:true,schema}},max_output_tokens:maxOutputTokens
  })});}
  catch(error){const name=String(error?.name||'').toLowerCase(),code=String(error?.code||'').toUpperCase();if(name==='aborterror'||code==='ETIMEDOUT'||code==='UND_ERR_CONNECT_TIMEOUT')fail('NARRATIVE_PROVIDER_TIMEOUT');fail('NARRATIVE_PROVIDER_NETWORK_FAILED',{message:clean(error?.message)});}
  const raw=await response.text();let data;
  try{data=JSON.parse(raw)}catch{fail('NARRATIVE_PROVIDER_UNREADABLE_RESPONSE');}
  if(!response.ok)fail('NARRATIVE_PROVIDER_REQUEST_FAILED',{status:response.status,message:data?.error?.message||null});
  let output;try{output=JSON.parse(outputText(data))}catch(error){if(error?.code)throw error;fail('NARRATIVE_PROVIDER_SCHEMA_OUTPUT_UNREADABLE');}
  return Object.freeze({provider:'openai',model,output,usage:data?.usage&&typeof data.usage==='object'?data.usage:null});
}
export default Object.freeze({invokeOpenAIStructured});
