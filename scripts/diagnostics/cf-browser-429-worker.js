// Diagnostic entry point ONLY for `wrangler dev --remote`, never the deployed
// report service. Uses the same QA BROWSER binding and SDK acquisition path.
import puppeteer from '@cloudflare/puppeteer';
import {Buffer} from 'node:buffer';
let attempted=false;
export default {async fetch(request,env){
 if(env.PHIOS_ENVIRONMENT!=='qa'||request.method!=='POST'||new URL(request.url).pathname!=='/diagnose')return new Response(null,{status:404});
 if(attempted)return Response.json({code:'DIAGNOSTIC_ALREADY_ATTEMPTED_NO_RETRY'},{status:409});
 attempted=true;
 const evidence={observedAt:new Date().toISOString(),scope:'QA_BROWSER_BINDING_REMOTE_PREVIEW',acquisitionAttempts:0,retries:0,upstream:null};
 const capture=async response=>{
  const bytes=new Uint8Array(await response.clone().arrayBuffer());
  const headers=Object.fromEntries([...response.headers].filter(([name])=>/retry-after|ratelimit|rate-limit|^cf-ray$|^cf-mitigated$|^server$|^date$|^content-type$/.test(name)));
  return {status:response.status,statusText:response.statusText,bodyText:new TextDecoder().decode(bytes),bodyBase64:Buffer.from(bytes).toString('base64'),bodyByteLength:bytes.length,bodySha256:Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex'),headers,headerNames:[...response.headers.keys()],retryAfter:response.headers.get('retry-after'),ratelimitHeaders:Object.fromEntries([...response.headers].filter(([name])=>/ratelimit|rate-limit/.test(name)))};
 };
 const observedBinding={async fetch(input,init){
  const url=new URL(typeof input==='string'?input:input.url);
  const response=await env.BROWSER.fetch(input,init);
  if(url.pathname==='/v1/devtools/browser'){
   evidence.acquisitionAttempts++;
   evidence.upstream={endpointPath:url.pathname,method:init?.method??'GET',...await capture(response)};
  }
  return response;
 }};
 let browser;
 try{
  evidence.limitsBefore=await puppeteer.limits(env.BROWSER);
  browser=await puppeteer.launch(observedBinding);
  evidence.outcome='ACQUIRED_NO_429_REPRODUCED';
 }catch(error){evidence.outcome='ACQUISITION_BLOCKED';evidence.sdkError=String(error.message);}
 finally{
  if(browser)await browser.close();
  evidence.limitsAfter=await puppeteer.limits(env.BROWSER).catch(error=>({error:String(error.message)}));
 }
 return Response.json(evidence,{headers:{'Cache-Control':'no-store'}});
}};
