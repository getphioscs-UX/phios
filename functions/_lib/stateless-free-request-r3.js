// Server-owned transport policy, not a client-declared free/readOnly capability.
const MAX_BYTES = 16384;
const plain = value => value && typeof value === 'object' && !Array.isArray(value);
const keysOnly = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
const bounded = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
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
      !['/api/location-resolve','/api/symbolic-method-execute'].includes(url.pathname)) return null;
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
  // Manual card selection only: no I Ching, save, order, entitlement or provider inputs.
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
  for (const name of ['AI','PRIVATE_REPORTS','MANUSCRIPTS','BOOKS','METHOD_REPORT_RENDERER']) {
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
