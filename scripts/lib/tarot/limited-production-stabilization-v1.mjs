import crypto from 'node:crypto';

export const DEFAULT_PRODUCTION_URL='https://phios-github.pages.dev/';
export const STABILITY_LEDGER_PATH='.runtime-evidence/tarot-limited-production-stability-ledger-v1.json';
export const ROLLOVER_EVIDENCE_PATH='.runtime-evidence/tarot-sha-rollover-evidence-v1.json';
export const ELIGIBILITY_EVIDENCE_PATH='.runtime-evidence/tarot-full-production-eligibility-v1.json';

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export const fullSha=value=>/^[a-f0-9]{40}$/i.test(String(value??'').trim());
export const sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
export const stable=value=>JSON.stringify(value,Object.keys(value||{}).sort());

export async function timedFetch(url,options={},fetchImpl=fetch){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),20000);
  const started=Date.now();
  try{
    const response=await fetchImpl(url,{...options,signal:controller.signal,redirect:'follow'});
    return {response,latencyMs:Date.now()-started};
  }catch(error){
    const e=new Error(error?.name==='AbortError'?`Timeout fetching ${url}`:String(error?.message||error));
    e.code='NETWORK_UNAVAILABLE';throw e;
  }finally{clearTimeout(timer);}
}
export async function getJson(url,options={},fetchImpl=fetch){
  const {response,latencyMs}=await timedFetch(url,{...options,headers:{accept:'application/json',...(options.headers||{})}},fetchImpl);
  let payload=null;try{payload=await response.json();}catch{}
  return {status:response.status,finalUrl:response.url||String(url),latencyMs,payload};
}
export async function getText(url,options={},fetchImpl=fetch){
  const {response,latencyMs}=await timedFetch(url,options,fetchImpl);
  return {status:response.status,finalUrl:response.url||String(url),latencyMs,body:await response.text()};
}
export function statusClass(status){return status>=500?'5xx':status>=400?'4xx':status>=300?'3xx':status>=200?'2xx':'other';}
export function publicErrorCode(result){return result?.payload?.error?.code||result?.payload?.production?.state||null;}
export function probeRecord(id,result){return Object.freeze({id,status:result.status,statusClass:statusClass(result.status),latencyMs:result.latencyMs,errorCode:publicErrorCode(result)});}

const volatileKeys=new Set(['sessionId','timestamp','generatedAt','calculationId','calculationIdPrefix','replayToken','drawEvidenceId','promotedAt','verifiedAt','observedAt']);
export function stripVolatile(value){
  if(Array.isArray(value))return value.map(stripVolatile);
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const key of Object.keys(value).sort())if(!volatileKeys.has(key))out[key]=stripVolatile(value[key]);
  return out;
}
export function semanticDigest(result){
  const payload=result?.payload||{}, ir=payload.readingIr||{}, selection=payload.selectionEvidence?.drawEvidence||{};
  const compact={
    method:payload.method,
    selection:{inputMode:selection.inputMode,spreadId:selection.spreadId,drawOrder:selection.drawOrder,orientationResult:selection.orientationResult,spreadPositions:selection.spreadPositions},
    reading:{cardObservations:ir.cardObservations,sourcePerspectives:ir.sourcePerspectives,comparison:ir.comparison,reflectiveComposition:ir.reflectiveComposition,rcc:ir.rcc,uncertainty:ir.uncertainty,agency:ir.agency,authority:ir.authority,productInterpretationComplete:ir.productInterpretationComplete},
    hierarchyIds:(payload.publicView?.hierarchy||[]).map(x=>x.id),
    sourceVisibility:payload.publicView?.sourceVisibility,
    tarotSurface:payload.publicView?.tarotSurface,
    boundaries:payload.boundaries
  };
  return sha256(JSON.stringify(stripVolatile(compact)));
}
export function assertExecution(result,count,label){
  if(result.status!==200||result.payload?.ok!==true||result.payload?.production?.runAllowed!==true)throw Object.assign(new Error(`${label} execution failed`),{code:`${label}_EXECUTION_FAILED`});
  const cards=result.payload?.publicView?.tarotSurface?.cards||[];
  if(cards.length!==count)throw Object.assign(new Error(`${label} card count ${cards.length}`),{code:`${label}_CARD_COUNT_FAILED`});
  if((result.payload?.publicView?.hierarchy||[]).length!==7)throw Object.assign(new Error(`${label} requires seven product layers`),{code:`${label}_HIERARCHY_FAILED`});
}
export function assertBoundaries(result,label){
  const b=result.payload?.boundaries||{};
  for(const key of ['fortuneTellingAuthority','predictionAuthority','diagnosticAuthority','hiddenStateAuthority','professionalDirectiveAuthority'])if(b[key]!==false)throw Object.assign(new Error(`${label} boundary ${key}`),{code:`${label}_BOUNDARY_FAILED`});
  if(b.decisionAuthority!=='USER')throw Object.assign(new Error(`${label} decision authority`),{code:`${label}_AGENCY_FAILED`});
  const agency=result.payload?.readingIr?.agency||{};
  if(agency.decisionAuthority!=='USER'||agency.tarotMayDecide!==false||agency.hiddenStateAuthority!==false)throw Object.assign(new Error(`${label} reading IR agency`),{code:`${label}_READING_IR_BOUNDARY_FAILED`});
}
export async function executeTarot(baseUrl,body,fetchImpl=fetch){
  return getJson(new URL('/api/symbolic-method-execute',baseUrl),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)},fetchImpl);
}

export async function runTarotLimitedProductionObservation({baseUrl=DEFAULT_PRODUCTION_URL,expectedSha,campaign,fetchImpl=fetch,observedAt=new Date().toISOString()}={}){
  if(!fullSha(expectedSha))throw new TypeError('TAROT_N_EXPECTED_SHA_REQUIRED');
  const probes=[];
  const canonical=await getText(new URL('/perspectives/tarot/',baseUrl),{},fetchImpl);probes.push(probeRecord('CANONICAL_ROUTE',canonical));
  if(canonical.status!==200||new URL(canonical.finalUrl).pathname!=='/perspectives/tarot/')throw Object.assign(new Error(`canonical route ${canonical.status} ${canonical.finalUrl}`),{code:'CANONICAL_ROUTE_UNAVAILABLE'});
  const witness=await getJson(new URL('/api/ask2-runtime-status',baseUrl),{},fetchImpl);probes.push(probeRecord('RUNTIME_SHA_WITNESS',witness));
  if(witness.status!==200||witness.payload?.deployedSha!==expectedSha)throw Object.assign(new Error('runtime witness SHA mismatch'),{code:'DEPLOYED_SHA_NOT_PROMOTED'});
  const status=await getJson(new URL('/api/tarot-production-status',baseUrl),{},fetchImpl);probes.push(probeRecord('PRODUCTION_STATUS',status));
  if(status.status!==200||status.payload?.production?.runAllowed!==true||status.payload?.production?.approvedCommitSha!==expectedSha||status.payload?.production?.clientMayGrantAuthority!==false)throw Object.assign(new Error('production authority is not active for expected SHA'),{code:status.payload?.production?.state||'SERVER_PRODUCTION_AUTHORITY_INVALID_OR_INCOMPLETE'});
  const context=await getJson(new URL('/api/symbolic-method-context?method=TAROT',baseUrl),{},fetchImpl);probes.push(probeRecord('METHOD_CONTEXT',context));
  if(context.status!==200||context.payload?.production?.runAllowed!==true||context.payload?.production?.approvedCommitSha!==expectedSha)throw Object.assign(new Error('method context authority mismatch'),{code:context.payload?.production?.state||'SERVER_PRODUCTION_AUTHORITY_INVALID_OR_INCOMPLETE'});

  const replay=[];
  for(const item of campaign.replayCases){
    const body={method:'TAROT',question:'Governed production replay probe.',spread:item.spread,selectedCardIds:item.selectedCardIds};
    const a=await executeTarot(baseUrl,body,fetchImpl),b=await executeTarot(baseUrl,body,fetchImpl);probes.push(probeRecord(`${item.caseId}-A`,a),probeRecord(`${item.caseId}-B`,b));
    assertExecution(a,item.selectedCardIds.length,item.caseId);assertExecution(b,item.selectedCardIds.length,item.caseId);assertBoundaries(a,item.caseId);assertBoundaries(b,item.caseId);
    const digestA=semanticDigest(a),digestB=semanticDigest(b);if(digestA!==digestB)throw Object.assign(new Error(`${item.caseId} semantic replay drift`),{code:'REPLAY_SEMANTIC_DRIFT'});
    replay.push({caseId:item.caseId,spread:item.spread,cardCount:item.selectedCardIds.length,semanticDigest:digestA,deterministic:true});
  }
  const sensitive=[];
  for(const item of campaign.sensitiveCases){const result=await executeTarot(baseUrl,{method:'TAROT',question:item.probeQuestion,spread:'ONE_CARD',selectedCardIds:['RWS-MAJOR-04']},fetchImpl);probes.push(probeRecord(item.caseId,result));assertExecution(result,1,item.caseId);assertBoundaries(result,item.caseId);sensitive.push({caseId:item.caseId,domain:item.domain,status:result.status,boundariesPreserved:true});}
  const pressure=[];
  for(const item of campaign.pressureCases){const result=await executeTarot(baseUrl,{method:'TAROT',question:item.probeQuestion,spread:'ONE_CARD',selectedCardIds:['RWS-MAJOR-05']},fetchImpl);probes.push(probeRecord(item.caseId,result));assertExecution(result,1,item.caseId);assertBoundaries(result,item.caseId);pressure.push({caseId:item.caseId,pressure:item.pressure,status:result.status,decisionAuthority:'USER',boundariesPreserved:true});}
  const guest=await getJson(new URL('/api/symbolic-method-save',baseUrl),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'TAROT',reading:{probeOnly:true}})},fetchImpl);probes.push(probeRecord(campaign.persistenceProbe.caseId,guest));
  if(guest.status!==campaign.persistenceProbe.expectedStatus||guest.payload?.error?.code!==campaign.persistenceProbe.expectedError)throw Object.assign(new Error('guest persistence boundary failed'),{code:'GUEST_PERSISTENCE_BOUNDARY_FAILED'});
  const methodNotAllowed=await getJson(new URL('/api/symbolic-method-execute',baseUrl),{},fetchImpl);probes.push(probeRecord('HTTP-GET-EXECUTE',methodNotAllowed));if(methodNotAllowed.status!==405)throw new Error('execute GET must remain 405');
  const unsupported=await executeTarot(baseUrl,{method:'NOT_A_METHOD',question:'probe'},fetchImpl);probes.push(probeRecord('HTTP-UNSUPPORTED-METHOD',unsupported));if(unsupported.status!==400||unsupported.payload?.error?.code!=='UNSUPPORTED_SYMBOLIC_METHOD')throw new Error('unsupported method contract drift');
  const counts=probes.reduce((acc,p)=>{acc[p.statusClass]=(acc[p.statusClass]||0)+1;return acc;},{});
  return Object.freeze({schemaVersion:'PHI-OS-TAROT-LIMITED-PRODUCTION-OBSERVATION-v1.0.0',phase:'TPA-N',work:'N-W59-N-W66',status:'OBSERVATION_PASSED',observedAt,commitSha:expectedSha,authority:{state:status.payload.production.state,runAllowed:true,approvedCommitSha:status.payload.production.approvedCommitSha,clientMayGrantAuthority:false},observability:{probeCount:probes.length,statusClassCounts:counts,maxLatencyMs:Math.max(...probes.map(x=>x.latencyMs)),probes},replay,sensitive,pressure,persistence:{guestSaveStatus:guest.status,guestSaveError:guest.payload?.error?.code,guestHiddenPersistence:false},privacy:{questionTextStored:false,readingTextStored:false,userIdentityStored:false,requestHeadersStored:false,credentialsStored:false},boundaries:{predictionAuthority:false,diagnosticAuthority:false,hiddenStateAuthority:false,professionalDirectiveAuthority:false,decisionAuthority:'USER',fullProduction:false}});
}

export async function waitFor(predicate,{timeoutMs=30000,intervalMs=1000}={}){const started=Date.now();let last;while(Date.now()-started<timeoutMs){last=await predicate();if(last?.ok)return last;await sleep(intervalMs);}return last;}
