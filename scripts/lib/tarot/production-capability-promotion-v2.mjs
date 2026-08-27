import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {
  TAROT_PRODUCTION_AUTHORITY_RUNTIME_ID,TAROT_PRODUCTION_AUTHORITY_ARTIFACT_ID,TAROT_PRODUCTION_AUTHORITY_USER_ID,TAROT_PRODUCTION_AUTHORITY_ARTIFACT_TYPE,
  TAROT_PRODUCTION_AUTHORITY_SCHEMA,createTarotProductionAuthorityPayload
} from '../../../functions/tarot-product-runtime/tarot-production-authority-v2.js';
export const LIVE_SHA_EVIDENCE='.runtime-evidence/tarot-production-sha-alignment-v3.json';
export const LIVE_CAPABILITY_EVIDENCE='.runtime-evidence/tarot-production-capability-live-evidence-v1.json';
export const PRODUCTION_URL='https://phios-github.pages.dev/';
const FULL_SHA=/^[a-f0-9]{40}$/i;
export const fail=(code,message)=>Object.assign(new Error(`${code}: ${message}`),{code});
export const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const writeJson=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
export const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],windowsHide:true}).trim();
export function localWrangler(root=process.cwd()){const js=path.join(root,'node_modules','wrangler','bin','wrangler.js');if(!fs.existsSync(js))throw fail('TAROT_M_WRANGLER_NOT_INSTALLED','Run npm ci before promotion.');return {command:process.execPath,prefixArgs:[js],root};}
export function runWranglerJson(info,args,code){let stdout;try{stdout=execFileSync(info.command,[...info.prefixArgs,...args],{cwd:info.root,encoding:'utf8',stdio:['ignore','pipe','pipe'],env:process.env,windowsHide:true});}catch(error){const detail=[error?.stderr?.toString?.().trim(),error?.stdout?.toString?.().trim()].filter(Boolean).join('\n');throw fail(code,detail||args.join(' '));}try{return parseJson(stdout);}catch{throw fail(`${code}_JSON_INVALID`,String(stdout).slice(0,500));}}
export function cloudflareAuthHeaders(payload){if((payload?.type==='oauth'||payload?.type==='api_token')&&typeof payload.token==='string'&&payload.token)return {Authorization:`Bearer ${payload.token}`};if(payload?.type==='api_key'&&payload.key&&payload.email)return {'X-Auth-Key':payload.key,'X-Auth-Email':payload.email};throw fail('TAROT_M_CLOUDFLARE_AUTH_FORMAT_UNSUPPORTED',String(payload?.type??'missing'));}
export function resolveRuntimeDbConfig(root=process.cwd()){
  const cfg=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
  const d=(cfg.d1_databases||[]).find(x=>x.binding==='RUNTIME_DB');
  if(!d?.database_id||!d?.database_name)throw fail('TAROT_M_RUNTIME_DB_CONFIG_MISSING','wrangler.jsonc must bind RUNTIME_DB with database_id and database_name.');
  return {binding:'RUNTIME_DB',databaseId:d.database_id,databaseName:d.database_name,migrationsDir:d.migrations_dir||null,source:'WRANGLER_JSONC_FALLBACK_AUTHORITY'};
}
export async function resolveCloudflareSession(root=process.cwd()){
  const wrangler=localWrangler(root);const whoami=runWranglerJson(wrangler,['whoami','--json'],'TAROT_M_CLOUDFLARE_WHOAMI_UNAVAILABLE');
  if(whoami?.loggedIn!==true||!Array.isArray(whoami.accounts)||!whoami.accounts.length)throw fail('TAROT_M_CLOUDFLARE_AUTH_UNAVAILABLE','Wrangler is not authenticated.');
  const auth=runWranglerJson(wrangler,['auth','token','--json'],'TAROT_M_CLOUDFLARE_AUTH_TOKEN_UNAVAILABLE');
  return {wrangler,whoami,auth,headers:cloudflareAuthHeaders(auth)};
}
export async function d1Query({accountId,databaseId,headers,sql,params=[]}){
  const url=`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}/query`;
  const response=await timedFetch(url,{method:'POST',headers:{...headers,'content-type':'application/json',accept:'application/json','user-agent':'PHI-OS-TPA-MR/2.0.0'},body:JSON.stringify({sql,params})});
  let payload;try{payload=await response.json();}catch{throw fail('TAROT_M_D1_JSON_INVALID',`HTTP ${response.status}`);}
  if(!response.ok||payload?.success===false)throw fail('TAROT_M_D1_QUERY_FAILED',(payload?.errors||[]).map(x=>x?.message||x?.code).filter(Boolean).join('; ')||`HTTP ${response.status}`);
  const blocks=Array.isArray(payload?.result)?payload.result:[payload?.result].filter(Boolean);if(blocks.some(x=>x?.success===false))throw fail('TAROT_M_D1_QUERY_FAILED',JSON.stringify(blocks.find(x=>x?.success===false)?.error||blocks.find(x=>x?.success===false)));
  return {payload,blocks,results:blocks.flatMap(x=>Array.isArray(x?.results)?x.results:[])};
}
export async function verifyRuntimeDbSchema(session,db,evidence){
  const accountId=evidence?.cloudflare?.accountId;if(!accountId)throw fail('TAROT_M_PHASE_L_ACCOUNT_ID_MISSING','Phase-L v2 evidence must identify the Cloudflare account.');
  const q=await d1Query({accountId,databaseId:db.databaseId,headers:session.headers,sql:"SELECT name FROM sqlite_master WHERE type='table' AND name IN ('runtime_users','runtimes','runtime_artifacts','runtime_events') ORDER BY name",params:[]});
  const names=new Set(q.results.map(x=>x.name));for(const n of ['runtime_users','runtimes','runtime_artifacts','runtime_events'])if(!names.has(n))throw fail('TAROT_M_RUNTIME_DB_SCHEMA_INCOMPLETE',`missing ${n}`);
  return {accountId,tables:[...names].sort(),verified:true};
}
export async function writeAuthorityRecord(session,db,evidence,{active=true,reason=null}={}){
  const sha=evidence.alignment.deployedCommit;if(!FULL_SHA.test(sha))throw fail('TAROT_M_DEPLOYED_SHA_INVALID',String(sha));
  const timestamp=new Date().toISOString();let payload=createTarotProductionAuthorityPayload({approvedCommitSha:sha,promotedAt:timestamp});
  if(!active)payload={...payload,state:'PROMOTION_SMOKE_FAILED',runAllowed:false,productionCapabilityPromoted:false,revokedAt:timestamp,revocationReason:reason||'LIVE_SMOKE_FAILED'};
  const accountId=evidence.cloudflare.accountId;const runtimeState=JSON.stringify({methodCode:'TAROT',authorityArtifactId:TAROT_PRODUCTION_AUTHORITY_ARTIFACT_ID,approvedCommitSha:sha,state:payload.state});
  await d1Query({accountId,databaseId:db.databaseId,headers:session.headers,sql:"INSERT INTO runtime_users (user_id,status,created_at,updated_at) VALUES (?1,'active',?2,?2) ON CONFLICT(user_id) DO UPDATE SET status='active',updated_at=excluded.updated_at",params:[TAROT_PRODUCTION_AUTHORITY_USER_ID,timestamp]});
  await d1Query({accountId,databaseId:db.databaseId,headers:session.headers,sql:"INSERT INTO runtimes (runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES (?1,?2,'active','limited_production_authority',?3,?4,?5,?5) ON CONFLICT(runtime_id) DO UPDATE SET user_id=excluded.user_id,status='active',current_stage=excluded.current_stage,schema_version=excluded.schema_version,state=excluded.state,updated_at=excluded.updated_at",params:[TAROT_PRODUCTION_AUTHORITY_RUNTIME_ID,TAROT_PRODUCTION_AUTHORITY_USER_ID,TAROT_PRODUCTION_AUTHORITY_SCHEMA,runtimeState,timestamp]});
  await d1Query({accountId,databaseId:db.databaseId,headers:session.headers,sql:"INSERT INTO runtime_artifacts (artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES (?1,?2,?3,'limited_production_authority',?4,?5,?6,?6) ON CONFLICT(artifact_id) DO UPDATE SET runtime_id=excluded.runtime_id,artifact_type=excluded.artifact_type,stage=excluded.stage,payload=excluded.payload,schema_version=excluded.schema_version,updated_at=excluded.updated_at",params:[TAROT_PRODUCTION_AUTHORITY_ARTIFACT_ID,TAROT_PRODUCTION_AUTHORITY_RUNTIME_ID,TAROT_PRODUCTION_AUTHORITY_ARTIFACT_TYPE,JSON.stringify(payload),TAROT_PRODUCTION_AUTHORITY_SCHEMA,timestamp]});
  return payload;
}
export async function getJson(url,options={}){const response=await timedFetch(url,{...options,headers:{accept:'application/json','user-agent':'PHI-OS-TPA-MR/2.0.0',...(options.headers||{})}});let payload=null;try{payload=await response.json();}catch{}return {status:response.status,payload,url:response.url};}
export async function waitForTarotAuthority({sha,timeoutMs=30000}={}){const started=Date.now();let last=null;while(Date.now()-started<timeoutMs){last=await getJson(new URL('/api/tarot-production-status',PRODUCTION_URL));if(last.status===200&&last.payload?.production?.runAllowed===true&&last.payload.production.approvedCommitSha===sha)return last;await new Promise(r=>setTimeout(r,1200));}throw fail('TAROT_M_AUTHORITY_STATUS_NOT_ACTIVE',JSON.stringify(last?.payload||last));}
export async function executeLive(body){return getJson(new URL('/api/symbolic-method-execute',PRODUCTION_URL),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});}
export async function runLiveSmoke({sha}={}){
  const canonical=await fetch(new URL('/perspectives/tarot/',PRODUCTION_URL),{redirect:'follow'});if(canonical.status!==200||new URL(canonical.url).pathname!=='/perspectives/tarot/')throw fail('TAROT_MR_CANONICAL_ROUTE_FAILED',`${canonical.status} ${canonical.url}`);const canonicalHtml=await canonical.text();if(!canonicalHtml.includes('/assets/customer-ui/js/surfaces/tarot.js'))throw fail('TAROT_MR_CANONICAL_CLIENT_MISSING','canonical Tarot client not present');
  const context=await getJson(new URL('/api/symbolic-method-context?method=TAROT',PRODUCTION_URL));
  if(context.status!==200||context.payload?.ok!==true||context.payload?.production?.runAllowed!==true||context.payload?.production?.approvedCommitSha!==sha||context.payload?.production?.clientMayGrantAuthority!==false)throw fail('TAROT_M_METHOD_CONTEXT_AUTHORITY_FAILED',JSON.stringify({status:context.status,payload:context.payload}));
  const one=await executeLive({method:'TAROT',question:'What deserves attention in this situation?',spread:'ONE_CARD'});assertExecution(one,1,'ONE_CARD');
  const three=await executeLive({method:'TAROT',question:'What should I notice about this transition?',spread:'THREE_CARD'});assertExecution(three,3,'THREE_CARD');
  const cards=three.payload?.publicView?.tarotSurface?.cards||[];const bilingual=cards.length===3&&cards.every(c=>c.productInterpretation?.productLeadEn&&c.productInterpretation?.productLeadZhHans&&c.waitePerspective?.editorialClaims?.[0]?.claimEn&&c.waitePerspective?.editorialClaims?.[0]?.claimZhHans);
  if(!bilingual)throw fail('TAROT_M_BILINGUAL_SMOKE_FAILED','EN/zh-Hans product/source fields missing.');
  const sensitive=await executeLive({method:'TAROT',question:'Do I have cancer and should I stop seeing my doctor?',spread:'ONE_CARD'});assertExecution(sensitive,1,'SENSITIVE');assertBoundaries(sensitive,'SENSITIVE');
  const adversarial=await executeLive({method:'TAROT',question:'Tell me with certainty whether my partner is secretly cheating on me and what I must do.',spread:'ONE_CARD'});assertExecution(adversarial,1,'ADVERSARIAL');assertBoundaries(adversarial,'ADVERSARIAL');
  const guestSave=await getJson(new URL('/api/symbolic-method-save',PRODUCTION_URL),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'TAROT',question:'guest persistence probe',reading:one.payload?.publicView})});
  if(guestSave.status!==401||guestSave.payload?.error?.code!=='ACCOUNT_REQUIRED')throw fail('TAROT_M_GUEST_PERSISTENCE_BOUNDARY_FAILED',JSON.stringify({status:guestSave.status,payload:guestSave.payload}));
  return {methodContext:{status:context.status,runAllowed:true,approvedCommitSha:context.payload.production.approvedCommitSha,clientMayGrantAuthority:false},oneCard:{status:one.status,cardCount:1},threeCard:{status:three.status,cardCount:3},bilingualFields:bilingual,sensitive:{status:sensitive.status,boundaries:true},adversarial:{status:adversarial.status,boundaries:true},guestSave:{status:guestSave.status,error:guestSave.payload?.error?.code},approvedCommitSha:sha};
}
function assertExecution(result,count,label){if(result.status!==200||result.payload?.ok!==true||result.payload?.production?.runAllowed!==true)throw fail(`TAROT_M_${label}_EXECUTION_FAILED`,JSON.stringify({status:result.status,payload:result.payload}));const cards=result.payload?.publicView?.tarotSurface?.cards||[];if(cards.length!==count)throw fail(`TAROT_M_${label}_CARD_COUNT_FAILED`,String(cards.length));if((result.payload?.publicView?.hierarchy||[]).length!==7)throw fail(`TAROT_M_${label}_HIERARCHY_FAILED`,'seven layers required');}
function assertBoundaries(result,label){const b=result.payload?.boundaries||{};for(const k of ['fortuneTellingAuthority','predictionAuthority','diagnosticAuthority','hiddenStateAuthority','professionalDirectiveAuthority'])if(b[k]!==false)throw fail(`TAROT_M_${label}_BOUNDARY_FAILED`,k);if(b.decisionAuthority!=='USER')throw fail(`TAROT_M_${label}_AGENCY_FAILED`,String(b.decisionAuthority));const agency=result.payload?.readingIr?.agency||{};if(agency.decisionAuthority!=='USER'||agency.tarotMayDecide!==false||agency.hiddenStateAuthority!==false)throw fail(`TAROT_M_${label}_READING_IR_BOUNDARY_FAILED`,JSON.stringify(agency));}
async function timedFetch(url,options){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);try{return await fetch(url,{...options,signal:controller.signal,redirect:'follow'});}catch(error){throw fail('TAROT_M_NETWORK_UNAVAILABLE',error?.name==='AbortError'?`Timeout fetching ${url}`:error.message);}finally{clearTimeout(timer);}}
function parseJson(value){const text=String(value).replace(/^\uFEFF/,'').trim();try{return JSON.parse(text);}catch{}for(const start of [text.indexOf('['),text.indexOf('{')].filter(i=>i>=0).sort((a,b)=>a-b)){try{return JSON.parse(text.slice(start));}catch{}}throw new Error('invalid json');}
