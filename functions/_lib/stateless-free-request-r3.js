// Server-owned transport policy, not a client-declared free/readOnly capability.
const MAX_BYTES = 16384;
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
const bounded = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const symbolicPaths=['/api/symbolic-method-execute','/api/iching-full-cast','/api/iching-full-execute'];
export function symbolicFreeTransportCapability(method,env={}){
  const mode=env.PHIOS_D1_MAINTENANCE_MODE;
  if(mode!==undefined&&mode!==''&&mode!=='OFF'&&mode!=='READ_ONLY')return {allowed:false,state:'MAINTENANCE_UNAVAILABLE'};
  if(mode==='READ_ONLY'&&typeof env.RUNTIME_DB?.prepare!=='function')return {allowed:false,state:'READ_ONLY_GUARD_UNAVAILABLE'};
  return {allowed:['TAROT','I_CHING'].includes(method),state:mode==='READ_ONLY'?'READ_ONLY_STATELESS_FREE_ONLY':'NORMAL_TRANSPORT',maintenanceMode:mode||'OFF',saveTransportAllowed:mode!=='READ_ONLY'};
}
function date(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0,10) === value;
}
async function limitedJson(request) {
  const reader = request.clone().body?.getReader();
  if (!reader) return null;
  let size = 0; const chunks = [];
  try {
    for (;;) {
      const {value,done} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { void reader.cancel(); return null; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  } catch { return null; }
}
export async function classifyStatelessFreeRequest(request, env = {}) {
  const url = new URL(request.url);
  if (request.method !== 'POST' || url.search ||
      !['/api/location-resolve',...symbolicPaths].includes(url.pathname)) return null;
  // Browser POSTs must be same origin. Missing Origin is deliberately denied.
  if (request.headers.get('origin') !== url.origin) return null;
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return null;
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return null;
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) return null;
  const body = await limitedJson(request);
  if (!plain(body)) return null;
  if (url.pathname === '/api/location-resolve') {
    // These exact existing non-paid public lookup endpoints are the only audited configuration.
    if (env.PHIOS_GEOCODING_LOOKUP_ENDPOINT && env.PHIOS_GEOCODING_LOOKUP_ENDPOINT !== 'https://nominatim.openstreetmap.org/lookup') return null;
    if (env.PHIOS_TIMEZONE_ENDPOINT && env.PHIOS_TIMEZONE_ENDPOINT !== 'https://timeapi.io/api/TimeZone/coordinate') return null;
    return keysOnly(body,['providerRef','birthDate','birthTime','locale']) &&
      /^[NWR]\d{1,20}$/.test(body.providerRef || '') && date(body.birthDate) &&
      (body.birthTime == null || /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(body.birthTime)) &&
      ['en','zh-Hans'].includes(body.locale) ? 'LOCATION' : null;
  }
  if(url.pathname!=='/api/symbolic-method-execute'){
    if(body.method!=='I_CHING'||!bounded(body.question,800))return null;
    if(url.pathname==='/api/iching-full-cast')return keysOnly(body,['method','intent','question'])&&body.intent==='CREATE_NEW_CAST'?'ICHING_CAST':null;
    const common=['method','question','inputMode','sessionId','timestamp','projectionVersion','useCurrentRealityContext','locale'];
    const six=v=>Array.isArray(v)&&v.length===6&&v.every(n=>Number.isInteger(n)&&n>=6&&n<=9);
    if(!bounded(body.sessionId,128)||!/^[-A-Za-z0-9_]+$/.test(body.sessionId)||!bounded(body.timestamp,64)||!Number.isFinite(Date.parse(body.timestamp))||body.projectionVersion!=='1.0.0'||!['en','zh-Hans'].includes(body.locale)||(body.useCurrentRealityContext!==undefined&&body.useCurrentRealityContext!==false))return null;
    if(body.inputMode==='MANUAL_LINES')return keysOnly(body,[...common,'lines'])&&six(body.lines)?'ICHING_MANUAL':null;
    if(body.inputMode==='COIN_CAST')return keysOnly(body,[...common,'coinLines'])&&Array.isArray(body.coinLines)&&body.coinLines.length===6&&body.coinLines.every(line=>Array.isArray(line)&&line.length===3&&line.every(n=>n===2||n===3))?'ICHING_COINS':null;
    const r=body.randomSelectionEvidence;
    if(body.inputMode!=='SYSTEM_RANDOM'||!keysOnly(body,[...common,'randomSelectionEvidence','governedCast'])||!plain(r)||!plain(body.governedCast))return null;
    const c=body.governedCast;
    const shapes={questionBinding:['digest','algorithm','rawQuestionStoredByCastingAdapter'],algorithm:['code','version','randomSource','samplingModel','coinValues','lineOrder'],selection:['inputMode','selectionMode','aiSelected','favorableOutcomeSelection','rerolledInsideCalculation','selectedSymbols','coinGroups'],randomSelectionEvidence:['selectedSymbols','seed','entropyEvidence','replayToken'],evidenceBoundary:['symbolicSamplingEvidenceOnly','realityEvidence','fateEvidence','predictionAuthority','diagnosticAuthority','professionalDirectiveAuthority','decisionAuthority']};
    if(!keysOnly(c,['schemaVersion','method','castId','createdAt',...Object.keys(shapes)])||Object.entries(shapes).some(([key,keys])=>!plain(c[key])||!keysOnly(c[key],keys))||!plain(c.randomSelectionEvidence.entropyEvidence)||!keysOnly(c.randomSelectionEvidence.entropyEvidence,['source','digest']))return null;
    return keysOnly(r,['selectedSymbols','seed','entropyEvidence','replayToken'])&&Array.isArray(r.selectedSymbols)&&six(r.selectedSymbols.map(Number))&&r.selectedSymbols.every(n=>/^[6-9]$/.test(String(n)))&&/^ICHING-CSPRNG-[a-f0-9]{24}$/.test(r.seed||'')&&plain(r.entropyEvidence)&&keysOnly(r.entropyEvidence,['source','digest'])&&r.entropyEvidence.source==='SERVER_CSPRNG_THREE_COIN_OUTCOME'&&/^[a-f0-9]{64}$/.test(r.entropyEvidence.digest||'')&&/^ICH-CAST-[a-f0-9]{64}$/.test(r.replayToken||'')?'ICHING_REPLAY':null;
  }
  // Existing manual Tarot contract stays unchanged; no save or paid inputs.
  return keysOnly(body,['method','question','spreadId','selectedCardIds','useCurrentRealityContext']) &&
    body.method === 'TAROT' && bounded(body.question,800) &&
    bounded(body.spreadId,96) && /^[A-Z0-9_]+$/.test(body.spreadId) &&
    Array.isArray(body.selectedCardIds) && [1,3,5,6,7,10].includes(body.selectedCardIds.length) &&
    new Set(body.selectedCardIds).size === body.selectedCardIds.length &&
    body.selectedCardIds.every(id => bounded(id,128) && /^[A-Za-z0-9_-]+$/.test(id)) &&
    (body.useCurrentRealityContext === undefined || body.useCurrentRealityContext === false)
      ? 'TAROT' : null;
}

// A Free exception never receives private storage, AI, Renderer or queue capabilities.
// Count violations even if a downstream catch tries to translate one into success.
const sealedEnvironments = new WeakMap();
export function sealStatelessFreeBindings(env) {
  // Pages may reuse an env object. Reuse its sealed capabilities and counter.
  if (sealedEnvironments.has(env)) return sealedEnvironments.get(env);
  let violations = 0;
  const deny = () => { violations++; throw new Error('STATELESS_FREE_CAPABILITY_DENIED'); };
  for (const name of ['AI','PRIVATE_REPORTS','MANUSCRIPTS','BOOKS','METHOD_REPORT_RENDERER','PERSONAL_EVIDENCE_PDF_RENDERER','PAID_REPORT_QUEUE']) {
    if (!(name in env)) continue;
    const blocked = Object.freeze(Object.assign(Object.create(null), {
      fetch:deny, run:deny, get:deny, head:deny, list:deny, put:deny, delete:deny,
      createMultipartUpload:deny, resumeMultipartUpload:deny, send:deny, sendBatch:deny
    }));
    Object.defineProperty(env,name,{value:blocked,writable:false,configurable:false,enumerable:true});
  }
  const count = () => violations;
  sealedEnvironments.set(env,count);
  return count;
}
