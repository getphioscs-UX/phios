import {retrieveCurrentFacts} from '../current-facts-gateway/current-facts-gateway.js';
import {retrievePublicCompany} from '../current-facts-gateway/world-company-projection.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
export async function onRequestPost(context){let body;try{body=await context.request.json()}catch{return json({ok:false,error:'INVALID_JSON'},400)};const question=String(body?.question||body?.q||'').trim();if(!question)return json({ok:false,error:'QUESTION_REQUIRED'},400);const result=await retrieveCurrentFacts({question,env:context.env||{},fetcher:fetch});return json({ok:true,result});}
const requests=new Map(); // Ephemeral abuse counters only, never D1/queries/credentials.
export async function onRequestGet({request}={}){
 if(!request)return json({ok:false,error:'CURRENT_FACTS_POST_ONLY'},405);
 try{
  const u=new URL(request.url);if(u.search.length>240||[...u.searchParams.keys()].some(k=>u.searchParams.getAll(k).length!==1))throw Error();
  if(u.searchParams.get('operation')!=='company')return json({ok:false,error:'CURRENT_FACTS_POST_ONLY'},405);
  const result=retrievePublicCompany(Object.fromEntries(u.searchParams));
  const now=Date.now(),bucket=Math.floor(now/60000),address=request.headers.get('cf-connecting-ip')||'UNSPECIFIED_SHARED_BUCKET';
  const key=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(address+':'+bucket)))).slice(0,12).join('.');
  for(const[k,v]of requests)if(v.bucket!==bucket)requests.delete(k);
  if(requests.size>=512&&!requests.has(key))return json({ok:false,error:'PUBLIC_QUERY_CAPACITY'},429);
  const count=(requests.get(key)?.count||0)+1;requests.set(key,{bucket,count});
  if(count>60)return new Response(JSON.stringify({ok:false,error:'PUBLIC_QUERY_RATE_LIMIT'}),{status:429,headers:{...H,'retry-after':'60'}});
  return new Response(JSON.stringify({ok:true,result}),{headers:{...H,'cache-control':'public,max-age=300','vary':'Accept-Encoding'}});
 }catch{return json({ok:false,error:'PUBLIC_COMPANY_QUERY_INVALID'},400);}
}
