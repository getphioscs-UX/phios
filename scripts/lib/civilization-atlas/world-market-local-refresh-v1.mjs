// Operational LOCAL_FIXTURE orchestration. Source authority/calculation remain
// with existing Moomoo, W8A/B/C, CWA and World owners. No production adapter.
import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';import {randomUUID} from 'node:crypto';
import {digest,normalizeMarketProviderPayload} from './runtime-position-w8a-p2-market-provider-v1.mjs';
import {assertNoSecrets,normalizeHistoryKlinePage} from './moomoo-first-live-import-v1.mjs';
import {normalizeCapitalFlow,normalizeValuation,normalizeFinancials,normalizeRevenueBreakdown} from './moomoo-gap-closure-import-v1.mjs';
import {providerSnapshotToW8aSource} from './moomoo-first-data-package-v1.mjs';
import {buildFirstProviderClaims} from './moomoo-first-provider-claim-extraction-v1.mjs';
import {validateW8aSourceIntake} from './runtime-position-w8a-source-production-v1.mjs';
import {validateW8bClaimIntake,toW8bCwaReadyClaim} from './runtime-position-w8b-claim-extraction-v1.mjs';
import {buildMoomooProviderAuthorityDecisions} from './moomoo-provider-w8c-admission-v1.mjs';
import {runW8cAdmission} from './runtime-position-w8c-cwa-admission-v1.mjs';
import registry from '../../../content/civilization-atlas/reconfiguration/market-data-provider-registry-v1.json';
import requestPlan from '../../../content/civilization-atlas/reconfiguration/moomoo-first-data-request-plan-v1.json';
import readiness from '../../../content/civilization-atlas/reconfiguration/runtime-position-w7-readiness-v1.json';
import {discoverWorldFiling,retrieveWorldFiling,parseWorldFiling,verifyWorldFiling,admitWorldFiling,makeFilingCustomerEligible,filingToCompanyPacket} from '../../../functions/current-facts-gateway/world-company-filing-intake.js';
import {analyzeWorldCompany} from '../../../functions/_lib/world-company-analysis.js';

export function refreshContextKey(r){return digest({sourceId:r.sourceId,issuerId:r.issuerId,instrumentId:r.instrumentId,dataFamily:r.dataFamily,statementType:r.dataFamily==='FINANCIAL_STATEMENTS'?(r.statementType??1):null,valuationType:r.dataFamily==='VALUATION'?(r.valuationType??'PE'):null,financialType:r.financialType??null,flowBasis:r.flowBasis??null,requestedPeriod:r.requestedPeriod,periodKind:r.periodKind,statementBasis:r.statementBasis,accountingStandards:r.accountingStandards||null,currency:r.currency,shareClass:r.shareClass});}
export function refreshIdempotencyKey(r,contentHash){return digest({context:refreshContextKey(r),sourceVersion:r.sourceVersion,contentHash});}
export function openLocalMarketLedger(file,{environment='LOCAL_FIXTURE'}={}){
 if(environment!=='LOCAL_FIXTURE')throw Error('PRODUCTION_PERSISTENCE_NOT_AUTHORIZED');
 if(file!==':memory:'){const allowed=path.resolve('tools/review/world-market-integration-r1/wmda-r2/local-state'),absolute=path.resolve(file);if(!absolute.startsWith(allowed+path.sep))throw Error('LOCAL_STATE_PATH_OUTSIDE_QA');fs.mkdirSync(path.dirname(absolute),{recursive:true});let p=path.dirname(absolute);while(p!==path.dirname(p)){if(fs.lstatSync(p).isSymbolicLink())throw Error('LOCAL_STATE_REPARSE_REJECTED');p=path.dirname(p);}}
 const db=new DatabaseSync(file);db.exec('PRAGMA busy_timeout=2000; CREATE TABLE IF NOT EXISTS wmda_jobs(job_id TEXT PRIMARY KEY,context_key TEXT NOT NULL,record_json TEXT NOT NULL,lease_token TEXT,lease_until INTEGER);CREATE TABLE IF NOT EXISTS wmda_versions(version_ref TEXT PRIMARY KEY,idempotency_key TEXT NOT NULL UNIQUE,context_key TEXT NOT NULL,record_json TEXT NOT NULL);CREATE TABLE IF NOT EXISTS wmda_daily_requests(source_id TEXT,day TEXT,used INTEGER NOT NULL,PRIMARY KEY(source_id,day));CREATE TABLE IF NOT EXISTS wmda_run_receipts(receipt_id TEXT PRIMARY KEY,source_id TEXT,record_json TEXT NOT NULL);');
 const get=id=>{const r=db.prepare('SELECT record_json FROM wmda_jobs WHERE job_id=?').get(id);return r?JSON.parse(r.record_json):null;};
 return {db,get,reserveRequest(sourceId,day,cap){db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT OR IGNORE INTO wmda_daily_requests VALUES(?,?,0)').run(sourceId,day);const r=db.prepare('UPDATE wmda_daily_requests SET used=used+1 WHERE source_id=? AND day=? AND used<?').run(sourceId,day,cap);db.exec('COMMIT');return Number(r.changes)===1;}catch(e){db.exec('ROLLBACK');throw e;}},close:()=>db.close(),versions:()=>db.prepare('SELECT record_json FROM wmda_versions ORDER BY rowid').all().map(r=>JSON.parse(r.record_json)),save(job){assertNoSecrets(job);db.prepare('UPDATE wmda_jobs SET record_json=? WHERE job_id=?').run(JSON.stringify(job),job.jobId);},ensure(job){db.prepare('INSERT OR IGNORE INTO wmda_jobs(job_id,context_key,record_json) VALUES(?,?,?)').run(job.jobId,job.contextKey,JSON.stringify(job));return get(job.jobId);},claim(id,now){const token=randomUUID(),result=db.prepare('UPDATE wmda_jobs SET lease_token=?,lease_until=? WHERE job_id=? AND (lease_until IS NULL OR lease_until<?)').run(token,now+60000,id,now);return Number(result.changes)?token:null;},release(id,token){db.prepare('UPDATE wmda_jobs SET lease_token=NULL,lease_until=NULL WHERE job_id=? AND lease_token=?').run(id,token);}};
}
function initialJob(request,policy){const contextKey=refreshContextKey(request);return {jobId:'WMDA-'+contextKey,contextKey,sourceId:request.sourceId,issuerId:request.issuerId,instrumentId:request.instrumentId,dataFamily:request.dataFamily,requestedPeriod:request.requestedPeriod,providerEntitlementVersion:policy.providerEntitlementVersion||null,rightsDecisionId:policy.rights?.decisionId||null,lastAttemptAt:null,lastSuccessAt:null,lastVerifiedSourceId:null,lastAcceptedSourceHash:null,status:'IDLE',attemptCount:0,nextEligibleAttemptAt:null,changeType:null,previousVersionRef:null,candidateVersionRef:null,publicationState:'WITHHELD',errorCode:null,budgetClass:'LOCAL_FIXTURE_ZERO_COST',etag:null,lastModified:null};}
function normalizer(r,body){const o={symbol:r.instrumentId,response:body,statementType:r.statementType||1,valuationType:r.valuationType||'PE'};switch(r.dataFamily){case 'HISTORY_KLINE':return normalizeHistoryKlinePage(o);case 'CAPITAL_FLOW':return normalizeCapitalFlow(o);case 'VALUATION':return normalizeValuation(o);case 'FINANCIAL_STATEMENTS':return normalizeFinancials(o);case 'REVENUE_BREAKDOWN':return normalizeRevenueBreakdown(o);default:throw Error('MARKET_UNSUPPORTED');}}
function moomooAdmission(request,body,now){
 let normalizedRecords=normalizer(request,body);
 if(request.dataFamily==='FINANCIAL_STATEMENTS'){const period=String(request.requestedPeriod).replaceAll(/[^A-Za-z0-9]/g,'').toUpperCase();normalizedRecords=normalizedRecords.filter(r=>String(r.meta?.periodText).replaceAll(/[^A-Za-z0-9]/g,'').toUpperCase()===period);if(normalizedRecords.some(r=>r.meta.currencyCode!==request.currency||(request.accountingStandards&&r.meta.accountingStandards!==request.accountingStandards)))throw Error('SCHEMA_MISMATCH');}
 if(!normalizedRecords.length||normalizedRecords.some(r=>typeof r.value!=='number'||!Number.isFinite(r.value)||!r.timestamp))throw Error('SCHEMA_MISMATCH');
 const normalized=normalizeMarketProviderPayload({registry,payload:{payloadId:'SYNTHETIC-WMDA-'+digest(body),providerId:'MOOMOO_OPENAPI',capability:request.dataFamily,retrievedAt:request.retrievedAt||now,request:{market:'US',symbols:[request.instrumentId],statementType:request.statementType||1},rawResponse:body,normalizedRecords}});if(!normalized.record)throw Error('SCHEMA_MISMATCH');
 const snapshot=normalized.record,source=providerSnapshotToW8aSource(snapshot);if(source.url!==request.sourceUrl)throw Error('SCHEMA_MISMATCH');const sources=validateW8aSourceIntake({intake:{producedAt:now,sources:[source]},readiness});if(sources.rejected.length)throw Error('SCHEMA_MISMATCH');
 const handoff={records:sources.records.map(r=>({...r,providerSnapshotId:snapshot.snapshotId}))};
 const extracted=buildFirstProviderClaims({snapshots:{records:[snapshot]},sources:handoff});if(!extracted.claims.length)throw Error('SCHEMA_MISMATCH');
 const claimValidation=validateW8bClaimIntake({intake:{producedAt:now,claims:extracted.claims},validatedSources:sources});if(claimValidation.rejected.length)throw Error('SCHEMA_MISMATCH');
 const claims={records:claimValidation.records.map(toW8bCwaReadyClaim)},decisions=buildMoomooProviderAuthorityDecisions({claims,providerRegistry:registry,sourceHandoff:handoff,producedAt:now});
 const admission=runW8cAdmission({cwaReadyClaims:claims,decisionIntake:{producedAt:now,decisions:decisions.decisions}});
 if(!admission.currentEvidence.length)throw Error(admission.admissionResults.some(r=>r.admissionState==='STALE')?'STALE':'SCHEMA_MISMATCH');
 return {contentHash:digest({capability:request.dataFamily,records:snapshot.records}),snapshot,evidence:admission.currentEvidence,rreEligibility:admission.rreEligible.length,rrePromotions:0,financialReadModel:null};
}
async function filingAdmission(request,body,policy,now){
 let record=discoverWorldFiling(request.filing);if(record.sourceId!==request.sourceId||record.sourceUrl!==request.sourceUrl||record.instrumentId!==request.instrumentId||record.currency!==request.currency||record.statementBasis!==request.statementBasis||(request.accountingStandards&&record.accountingStandards!==request.accountingStandards)||record.periodKind!==request.periodKind||record.sourceVersion!==request.sourceVersion)throw Error('SCHEMA_MISMATCH');record=await retrieveWorldFiling(record,body.text,{rights:policy.rights,retrievedAt:request.retrievedAt||now});record=await parseWorldFiling(record,body.text);
 // Mock decisions must be supplied explicitly and bound to actual document hash.
 record=verifyWorldFiling(record,body.verification);record=admitWorldFiling(record,{now});let customerEligible=false;
 if(policy.publicationDecision){record=makeFilingCustomerEligible(record,{rights:policy.rights,publicationDecision:policy.publicationDecision,environment:'LOCAL_FIXTURE'});customerEligible=true;}
 return {contentHash:record.contentHash,filing:record,evidence:[record.evidence],rrePromotions:0,customerEligible,financialReadModel:analyzeWorldCompany(filingToCompanyPacket(record),{now})};
}
async function bounded(promise,ms=1500){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('SOURCE_UNAVAILABLE')),ms);})]);}finally{clearTimeout(timer);}}
const errorCode=e=>/^[A-Z][A-Z0-9_]+$/.test(e?.message||'')?e.message:'SOURCE_UNAVAILABLE';
async function executeLocalMarketRefresh({ledger,request,policy={},transport,now=new Date().toISOString()}={}){
 if(policy.environment!=='LOCAL_FIXTURE')return {status:'PRODUCTION_DISABLED',actualNetworkCalls:0,paidProviderCalls:0,productionWrites:0};
 assertNoSecrets(request);const stamp=Date.parse(now);if(!Number.isFinite(stamp))throw Error('REFRESH_TIME_INVALID');let job=ledger.ensure(initialJob(request,policy));const token=ledger.claim(job.jobId,stamp);if(!token)return {status:'ALREADY_RUNNING',jobId:job.jobId,actualNetworkCalls:0};
 const priorSuccess=Object.fromEntries(['lastSuccessAt','lastVerifiedSourceId','lastAcceptedSourceHash','candidateVersionRef','previousVersionRef','publicationState'].map(k=>[k,job[k]]));let committed=false;
 const history=['IDLE'];let mockCalls=0;const persist=stage=>{job.status=stage;history.push(stage);ledger.save(job);};
 const previousError=job.errorCode,previousAuthorization=job.policyFingerprint;job.lastAttemptAt=now;job.attemptCount++;job.errorCode=null;
 const fail=(code,delay=0)=>{if(!committed)Object.assign(job,priorSuccess);job.errorCode=code;job.status=code;job.nextEligibleAttemptAt=delay?new Date(stamp+delay).toISOString():null;ledger.save(job);return {status:code,job,history,mockCalls,actualNetworkCalls:0,paidProviderCalls:0,actualCostUSD:0,productionWrites:0};};
 try{
  if(policy.killSwitch!==false)return fail('KILL_SWITCH');
  if(job.nextEligibleAttemptAt&&Date.parse(job.nextEligibleAttemptAt)>stamp)return fail('RATE_LIMITED',Date.parse(job.nextEligibleAttemptAt)-stamp);
  if(policy.estimatedCostUSD!==0)return fail('BUDGET_BLOCKED');
  job.policyFingerprint=digest({entitlement:policy.providerEntitlementVersion||null,rights:policy.rights||null,credentialPresent:policy.credentialPresent===true,credentialExpiresAt:policy.credentialExpiresAt||null,budget:policy.estimatedCostUSD});job.providerEntitlementVersion=policy.providerEntitlementVersion||null;job.rightsDecisionId=policy.rights?.decisionId||null;
  if(['RIGHTS_PENDING','MARKET_UNSUPPORTED','NO_CREDENTIAL','EXPIRED_CREDENTIAL','BUDGET_BLOCKED'].includes(previousError)&&previousAuthorization===job.policyFingerprint)return {...fail(previousError),requiresPolicyChange:true};
  const rights=policy.rights;if(!rights?.decisionId||rights.sourceId!==request.sourceId||rights.sourceUrl!==request.sourceUrl||rights.derivedUseAllowed!==true)return fail('RIGHTS_PENDING');
  if(request.provider==='MOOMOO_OPENAPI'){
   if(!/^US\./.test(request.instrumentId)||!requestPlan.requests.some(r=>r.capability===request.dataFamily&&r.instruments.includes(request.instrumentId)))return fail('MARKET_UNSUPPORTED');
   if(policy.credentialPresent!==true)return fail('NO_CREDENTIAL');if(!Number.isFinite(Date.parse(policy.credentialExpiresAt))||Date.parse(policy.credentialExpiresAt)<=stamp)return fail('EXPIRED_CREDENTIAL');
   if(rights.automatedRetrievalAllowed!==true)return fail('RIGHTS_PENDING');
  }else if(request.provider!=='ISSUER_FILING')return fail('MARKET_UNSUPPORTED');
  if(transport?.fixtureOnly!==true)return fail('SOURCE_UNAVAILABLE');
  const url=new URL(request.sourceUrl);if(url.protocol!=='https:'||url.username||url.password||(request.provider==='MOOMOO_OPENAPI'&&url.hostname!=='webapi.moomoo.com'))return fail('RIGHTS_PENDING');
  persist('AUTHORIZED');persist('CHECKING');const headers={Accept:'application/json'};if(job.etag)headers['If-None-Match']=job.etag;if(job.lastModified)headers['If-Modified-Since']=job.lastModified;
  const cap=policy.perSourceDailyRequestCap??3;if(!Number.isInteger(cap)||cap<1||cap>10)return fail('BUDGET_BLOCKED');if(!ledger.reserveRequest(request.sourceId,now.slice(0,10),cap))return fail('DAILY_REQUEST_CAP');
  mockCalls++;let response;try{response=await bounded(transport(request.sourceUrl,{headers,redirect:'error',signal:AbortSignal.timeout(1500)}));}catch{return fail('SOURCE_UNAVAILABLE');}
  if(response.status===429||response.status>=500){const seconds=Number(response.headers.get('retry-after'));return fail(response.status===429?'RATE_LIMITED':'SOURCE_UNAVAILABLE',Math.min(3600000,Number.isFinite(seconds)&&seconds>0?seconds*1000:60000));}
  if(response.status===401)return fail('EXPIRED_CREDENTIAL');if(response.status===403)return fail('RIGHTS_PENDING');
  if(response.status===304){if(!job.lastAcceptedSourceHash)return fail('SCHEMA_MISMATCH');job.changeType='NO_CHANGE';job.status='NO_CHANGE';ledger.save(job);return {status:'NO_CHANGE',job,mockCalls,history,actualNetworkCalls:0,paidProviderCalls:0,productionWrites:0};}
  if(!response.ok)return fail('SOURCE_UNAVAILABLE');
  if(Number(response.headers.get('content-length'))>262144)return fail('SCHEMA_MISMATCH');const reader=response.body.getReader(),parts=[],bodyDeadline=Date.now()+1500;let size=0;while(true){let chunk;try{chunk=await bounded(reader.read(),Math.max(1,bodyDeadline-Date.now()));}catch{reader.cancel().catch(()=>{});return fail('SOURCE_UNAVAILABLE');}const {done,value}=chunk;if(done)break;size+=value.byteLength;if(size>262144){await reader.cancel();return fail('SCHEMA_MISMATCH');}parts.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return fail('SCHEMA_MISMATCH');}assertNoSecrets(body);persist('FETCHED');
  const candidate=request.provider==='MOOMOO_OPENAPI'?moomooAdmission(request,body,now):await filingAdmission(request,body,policy,now);persist('NORMALIZED');persist('VALIDATED');
  if(candidate.contentHash===job.lastAcceptedSourceHash){job.changeType='NO_CHANGE';job.status='NO_CHANGE';job.etag=response.headers.get('etag')||job.etag;ledger.save(job);return {status:'NO_CHANGE',job,mockCalls,history,actualNetworkCalls:0,paidProviderCalls:0,productionWrites:0};}
  const key=refreshIdempotencyKey(request,candidate.contentHash),same=ledger.db.prepare('SELECT version_ref FROM wmda_versions WHERE idempotency_key=?').get(key);
  if(same&&same.version_ref!==job.candidateVersionRef)return fail('SUPERSEDED_SOURCE_VERSION');
  if(same){job.changeType='NO_CHANGE';job.status='NO_CHANGE';job.etag=response.headers.get('etag')||job.etag;ledger.save(job);return {status:'NO_CHANGE',job,mockCalls,history,actualNetworkCalls:0,paidProviderCalls:0,productionWrites:0};}
  persist('ADMITTED');const previous=ledger.db.prepare('SELECT version_ref,record_json FROM wmda_versions WHERE context_key=? ORDER BY rowid DESC LIMIT 1').get(job.contextKey),versionRef='LOCAL-WMDA-'+key;
  const version={versionRef,previousVersionRef:previous?.version_ref||null,idempotencyKey:key,contextKey:job.contextKey,contentHash:candidate.contentHash,sourceVersion:request.sourceVersion,sourceId:request.sourceId,instrumentId:request.instrumentId,period:request.requestedPeriod,createdAt:now,environment:'LOCAL_FIXTURE',candidate,publicationState:candidate.customerEligible===true?'ELIGIBLE_LOCAL_FIXTURE_ONLY':'WITHHELD_HUMAN_PUBLICATION_REVIEW'};
  ledger.db.exec('BEGIN IMMEDIATE');try{ledger.db.prepare('INSERT INTO wmda_versions VALUES(?,?,?,?)').run(versionRef,key,job.contextKey,JSON.stringify(version));job.changeType=previous?'RESTATED':'NEW';job.previousVersionRef=previous?.version_ref||null;job.candidateVersionRef=versionRef;job.lastSuccessAt=now;job.lastVerifiedSourceId=request.sourceId;job.lastAcceptedSourceHash=candidate.contentHash;job.publicationState=version.publicationState;job.status='ADMITTED';job.nextEligibleAttemptAt=null;job.etag=response.headers.get('etag');job.lastModified=response.headers.get('last-modified');ledger.save(job);ledger.db.exec('COMMIT');committed=true;}catch(e){ledger.db.exec('ROLLBACK');throw e;}
  return {status:'ADMITTED',changeType:job.changeType,job,version,mockCalls,history,actualNetworkCalls:0,paidProviderCalls:0,actualCostUSD:0,productionWrites:0,publicationWithheld:true};
 }catch(e){return fail(errorCode(e));}finally{ledger.release(job.jobId,token);}
}

// Local QA publication is a distinct explicit gate; never alters World catalog,
// RRE evidence registries, D1/R2 or an external customer route.
export function publishLocalFixtureVersion(ledger,versionRef,decision){
 const row=ledger.db.prepare('SELECT record_json FROM wmda_versions WHERE version_ref=?').get(versionRef);if(!row)throw Error('VERSION_NOT_FOUND');const v=JSON.parse(row.record_json);
 if(v.environment!=='LOCAL_FIXTURE'||v.candidate.customerEligible!==true||decision?.approved!==true||decision.scope!=='LOCAL_FIXTURE'||decision.contentHash!==v.contentHash||decision.reviewHash!==v.candidate.filing?.reviewHash||!decision.id)throw Error('LOCAL_PUBLICATION_GATE_REQUIRED');
 const job=ledger.get('WMDA-'+v.contextKey);if(job?.candidateVersionRef!==versionRef)throw Error('SUPERSEDED_SOURCE_VERSION');
 v.publicationState='PUBLISHED_LOCAL_FIXTURE_NOT_CUSTOMER';ledger.db.prepare('UPDATE wmda_versions SET record_json=? WHERE version_ref=?').run(JSON.stringify(v),versionRef);job.status='PUBLISHED';job.publicationState=v.publicationState;ledger.save(job);return {versionRef,status:'PUBLISHED',environment:'LOCAL_FIXTURE',customerPublication:false,productionWrites:0};
}

export async function runLocalMarketRefresh(options){
 const result=await executeLocalMarketRefresh(options);
 if(options.policy?.environment==='LOCAL_FIXTURE'&&options.ledger){const receipt={at:options.now||new Date().toISOString(),jobId:result.jobId||result.job?.jobId||null,status:result.status,changeType:result.changeType||null,mockTransportCalls:result.mockCalls||0,actualNetworkCalls:0,paidProviderCalls:0,productionWrites:0,environment:'LOCAL_FIXTURE'};options.ledger.db.prepare('INSERT INTO wmda_run_receipts VALUES(?,?,?)').run(randomUUID(),options.request.sourceId,JSON.stringify(receipt));}
 return result;
}
export async function runLocalMarketSchedule({ledger,watchlist=[],policy={},transportForSource,now=new Date().toISOString()}={}){
 if(policy.environment!=='LOCAL_FIXTURE'||policy.scheduleEnabled!==true)return {status:'SCHEDULE_DISABLED',productionSchedule:'DISABLED',results:[],actualNetworkCalls:0,productionWrites:0};
 if(policy.killSwitch!==false)return {status:'KILL_SWITCH',productionSchedule:'DISABLED',results:[],actualNetworkCalls:0,productionWrites:0};
 if(!Array.isArray(watchlist)||watchlist.length>10)throw Error('WATCHLIST_BUDGET_INVALID');
 const results=[];let next=Infinity;for(const item of watchlist){
  const minutes=item.minimumIntervalMinutes??(item.request.provider==='ISSUER_FILING'?1440:60);if(!Number.isInteger(minutes)||minutes<60||minutes>10080)throw Error('SOURCE_INTERVAL_INVALID');
  const at=Date.parse(now),previous=ledger.get('WMDA-'+refreshContextKey(item.request)),due=previous?.lastAttemptAt?Date.parse(previous.lastAttemptAt)+minutes*60000:at;next=Math.min(next,Math.max(at,due)+minutes*60000);
  if(due>at){results.push({sourceId:item.request.sourceId,status:'NOT_DUE',nextEligibleAttemptAt:new Date(due).toISOString()});continue;}
  if(item.policy?.rights?.automatedRetrievalAllowed!==true){results.push({sourceId:item.request.sourceId,status:'HUMAN_REVIEW_REMINDER',reason:'Automated source rights unknown; no link fetched or notification sent'});continue;}
  const result=await runLocalMarketRefresh({ledger,request:item.request,policy:{...policy,...item.policy,environment:'LOCAL_FIXTURE',killSwitch:item.policy?.killSwitch===true,perSourceDailyRequestCap:Math.min(2,policy.perSourceDailyRequestCap??2)},transport:transportForSource?.(item.request.sourceId),now});results.push(result);
 }
 const metrics={eligibleChecks:results.filter(r=>!['NOT_DUE','HUMAN_REVIEW_REMINDER'].includes(r.status)).length,changedSourceCount:results.filter(r=>['NEW','RESTATED'].includes(r.changeType)).length,sourceFailures:results.filter(r=>!['ADMITTED','NO_CHANGE','NOT_DUE','HUMAN_REVIEW_REMINDER'].includes(r.status)).length,deduplicatedResults:results.filter(r=>r.status==='NO_CHANGE').length,admissionCount:results.filter(r=>r.status==='ADMITTED').length,withheldPublications:results.filter(r=>r.publicationWithheld===true).length,staleRecordsInThisRun:results.filter(r=>r.status==='STALE').length,mockTransportCalls:results.reduce((n,r)=>n+(r.mockCalls||0),0),estimatedCostUSD:0,actualCostUSD:0,lastHealthyRefresh:results.map(r=>r.job?.lastSuccessAt).filter(Boolean).sort().at(-1)||null,nextScheduledCheck:Number.isFinite(next)?new Date(next).toISOString():null};
 return {status:'LOCAL_SIMULATION',environment:'LOCAL_FIXTURE',productionSchedule:'DISABLED',automaticTriggerInstalled:false,concurrency:1,results,metrics,actualNetworkCalls:0,paidProviderCalls:0,productionWrites:0,scheduleTimesAreProposals:true,displayTimeZone:'Asia/Kuala_Lumpur',utcOffsetHours:8};
}
