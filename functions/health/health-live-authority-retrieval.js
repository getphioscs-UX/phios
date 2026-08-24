import { admitHealthSource } from './health-authority-runtime.js';
import { evaluateHealthSourceFreshness } from './health-source-versioning.js';
const enc=new TextEncoder();
const hex=bytes=>[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
const clean=v=>String(v??'').trim();
export async function sha256Bytes(bytes){return hex(await crypto.subtle.digest('SHA-256',bytes));}
export async function retrieveApprovedHealthSource(input={}, {fetchImpl=globalThis.fetch, registry={}, now=Date.now()}={}){
  if(typeof fetchImpl!=='function') throw new Error('HRX_LIVE_FETCH_REQUIRED');
  let url; try{url=new URL(input.url);}catch{throw new Error('HRX_SOURCE_URL_INVALID');}
  if(url.protocol!=='https:') throw new Error('HRX_SOURCE_HTTPS_REQUIRED');
  const provisional={sourceId:clean(input.sourceId),authorityId:clean(input.authorityId),url:url.href,title:clean(input.title||url.pathname),retrievedAt:new Date(now).toISOString(),contentDigest:'sha256:'+'0'.repeat(64),locale:clean(input.locale||'en'),claimTypes:Array.isArray(input.claimTypes)?input.claimTypes:[]};
  const pre=admitHealthSource(provisional,registry); if(!pre.admitted) return {ok:false,state:'REJECTED_BEFORE_FETCH',admission:pre};
  const response=await fetchImpl(url.href,{method:'GET',redirect:'manual',headers:{accept:'text/html,application/json,text/plain,application/pdf;q=0.8,*/*;q=0.1','user-agent':'PHI-OS-Health-Authority/1.0'}});
  if(response.status>=300&&response.status<400) throw new Error('HRX_CROSS_REDIRECT_NOT_AUTO_FOLLOWED');
  if(!response.ok) throw new Error(`HRX_SOURCE_FETCH_${response.status}`);
  const declared=Number(response.headers.get('content-length')||0); if(declared>2_000_000) throw new Error('HRX_SOURCE_TOO_LARGE');
  const bytes=await response.arrayBuffer(); if(bytes.byteLength>2_000_000) throw new Error('HRX_SOURCE_TOO_LARGE');
  const digest='sha256:'+await sha256Bytes(bytes);
  const source={...provisional,contentDigest:digest,etag:response.headers.get('etag'),lastModified:response.headers.get('last-modified'),contentType:response.headers.get('content-type')||'application/octet-stream'};
  const admission=admitHealthSource(source,registry); if(!admission.admitted) return {ok:false,state:'REJECTED_AFTER_FETCH',admission};
  const freshness=evaluateHealthSourceFreshness(admission.source,now);
  return {ok:freshness.fresh,state:freshness.fresh?'ADMITTED_LIVE_SOURCE':'STALE_SOURCE',source:{...admission.source,etag:source.etag,lastModified:source.lastModified,contentType:source.contentType,byteLength:bytes.byteLength},freshness,snapshot:{contentDigest:digest,bytesRetained:false},governance:{rawSourceBodyPersisted:false,generalModelAuthorityCreated:false,claimApprovalAutomatic:false}};
}
