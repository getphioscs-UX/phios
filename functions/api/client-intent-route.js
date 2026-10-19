import {routeClientIntent} from '../public/client-intent-router.js';
import {handlePublicKnowledgeRequest} from '../_lib/public-knowledge-api.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
export async function onRequestPost({request,env={}}){
 let body;try{const raw=await request.text();if(raw.length>6000)return reply({ok:false,error:'INPUT_TOO_LARGE'},413);body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}catch{return reply({ok:false,error:'CLIENT_INTENT_ROUTE_INVALID'},400);}
 const route=routeClientIntent(body),locale=body.locale==='zh-Hans'?'zh-Hans':'en',zh=locale==='zh-Hans';
 if(route.outcome!=='KNOWLEDGE_LOOKUP')return reply({ok:true,route});
 const query=String(route.retrievalQuery??route.query??body.question??body.q??'').trim();
 if(query.length>500)return reply({ok:true,route:{...route,outcome:'NEEDS_CLARIFICATION',candidates:[],clarification:zh?'请先选一个具体问题（500 字以内）。':'Choose one specific question (up to 500 characters).'}});
 try{
  const url=new URL('/api/public-knowledge',request.url);url.searchParams.set('q',query);url.searchParams.set('locale',locale);
  const response=await handlePublicKnowledgeRequest(new Request(url),env),knowledge=await response.json();if(!response.ok||!knowledge.ok)throw Error('KNOWLEDGE_RETRIEVAL_FAILED');
  const sufficient=['exact','strong'].includes(knowledge.coverage?.level)&&knowledge.projection?.fragments?.some(f=>f.text?.trim());
  if(sufficient)return reply({ok:true,route:{...route,outcome:'KNOWLEDGE_RESULTS',candidates:[],knowledge:{coverage:knowledge.coverage,indexDigest:knowledge.indexDigest,results:knowledge.results.slice(0,3),fragments:knowledge.projection.fragments.slice(0,2).map(f=>({text:f.text.slice(0,800),fragmentCode:f.fragmentCode,digest:f.digest}))},primaryAction:{href:knowledge.results[0].href,label:zh?'阅读匹配来源':'Read the matching source'}}});
  const topic=query.replace(/^(?:请|请问|人们?|人|people|humans?)\s*/i,'').replace(/为什么|为何|为啥|解释一下|解释|\b(?:why|explain|do|does|are|is)\b/gi,'').trim().slice(0,80);
  return reply({ok:true,route:{...route,outcome:knowledge.coverage?.level==='none'?'KNOWLEDGE_SOURCE_INSUFFICIENT':'NEEDS_CLARIFICATION',candidates:[],knowledge:{coverage:knowledge.coverage,indexDigest:knowledge.indexDigest,results:[]},clarification:zh?`关于“${topic||'这个问题'}”，你想了解概念含义、一般形成原因，还是某个具体情境？现有来源不足以给出可靠解释。`:`For “${topic||'this question'}”, do you mean its definition, general causes, or a specific situation? The available sources do not yet support an explanation.`,primaryAction:{kind:'CLARIFY',label:zh?'补充问题':'Clarify the question'},auxiliaryActions:[{href:'/knowledge/',label:zh?'浏览现有知识':'Browse existing knowledge'}]}});
 }catch(error){const indexFailure=/PUBLIC_KNOWLEDGE_(?:ASSETS|PROJECTION)_UNAVAILABLE|Unexpected token|JSON/.test(error.message||'');return reply({ok:true,route:{...route,outcome:indexFailure?'INDEX_LOADING_FAILED':'SERVICE_FAILURE',candidates:[],clarification:null,primaryAction:{kind:'RETRY',label:zh?'重试':'Retry'},providerCalls:0}});}
}
// Read-only discovery; no account, quota, database or model execution. POST policy remains unchanged.
export async function onRequestGet({request,env={}}){const u=new URL(request.url),question=u.searchParams.get('q')||'';if(question.length>500)return reply({ok:false,error:'QUESTION_TOO_LONG'},400);return onRequestPost({env,request:new Request(new URL('/api/client-intent-route',u),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({question,locale:u.searchParams.get('locale'),topicId:u.searchParams.get('topicId')||undefined,task:u.searchParams.get('task')||undefined,capabilityId:u.searchParams.get('capabilityId')||undefined,selectedMethodId:u.searchParams.get('selectedMethodId')||undefined,selectionConfirmed:u.searchParams.get('selectionConfirmed')==='true'})})});}
