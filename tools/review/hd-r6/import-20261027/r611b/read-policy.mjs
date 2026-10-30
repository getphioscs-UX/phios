// Existing OAuth owner, single sequential read, terminal auth/rate-limit stop.
// No renewal, generated token, S3 credential substitution or automatic retry.
import fs from'node:fs';import path from'node:path';
export function stopDecision(status,retryAfter,now=Date.now()){
 if(status===401||status===403)return {stop:true,reason:'AUTH_OR_SCOPE_REJECTED',retryAutomatically:false};
 if(status===429){let ms=/^\d+$/.test(retryAfter||'')?Number(retryAfter)*1000:Date.parse(retryAfter||'')-now;return {stop:true,reason:'RATE_LIMITED',retryAutomatically:false,notBefore:new Date(now+Math.max(60000,Number.isFinite(ms)?ms:60000)).toISOString()};}
 return {stop:status>=400,reason:status>=400?'READ_FAILED':'OK',retryAutomatically:false};
}
export async function readExactContentsObjects(objects,{fetchImpl=fetch,authFile=path.join(process.env.APPDATA||'','xdg.config/.wrangler/config/default.toml'),now=Date.now()}={}){
 const cfg=fs.existsSync(authFile)?fs.readFileSync(authFile,'utf8'):'';const expiry=cfg.match(/^expiration_time\s*=\s*"([^"]+)"/m)?.[1];
 if(expiry&&Date.parse(expiry)<=now)return {status:'R2_REMOTE_BYTES_UNVERIFIED',cause:'MANAGED_OAUTH_EXPIRED_NO_NETWORK_REQUEST',requests:0,rows:[]};
 const token=cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];if(!token)return {status:'R2_REMOTE_BYTES_UNVERIFIED',cause:'EXISTING_MANAGED_AUTH_NOT_AVAILABLE',requests:0,rows:[]};
 const rows=[];let requests=0;
 for(const object of objects){if(!object.objectKey){rows.push({methodId:object.methodId,status:'EXACT_KEY_UNCONFIRMED_NO_REQUEST'});continue;}
  const url='https://api.cloudflare.com/client/v4/accounts/0b9f36bdf56f38d7d09aebe388f15204/r2/buckets/phios-public-assets/objects/'+object.objectKey;
  try{const r=await fetchImpl(url,{method:'GET',headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)});requests++;const decision=stopDecision(r.status,r.headers.get('retry-after'),now);rows.push({methodId:object.methodId,objectKey:object.objectKey,httpStatus:r.status,...decision});if(decision.stop)break;
   // Return bytes only in memory; the caller must decode/hash/cache them before
   // any verified-source evidence or publication plan can be produced.
   rows.at(-1).bytes=Buffer.from(await r.arrayBuffer());
  }catch(e){rows.push({methodId:object.methodId,status:'TRANSPORT_FAILED',errorClass:e.name});break;}
 }
 return {status:rows.every(r=>r.httpStatus===200)?'BYTES_PENDING_DECODE':'R2_REMOTE_BYTES_UNVERIFIED',requests,rows,tokenValueRecorded:false};
}
