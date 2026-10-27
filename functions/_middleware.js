import { maintenanceMode, guardD1Binding, d1ViolationCount, maintenanceResponse } from './_lib/d1-maintenance-guard.js';

// Tarot calculations are stateless and never grant persistence or payment rights.
// In READ_ONLY, admit only this exact same-origin JSON operation; all other POST
// routes remain blocked. D1 is still wrapped by the read-only SQL guard below.
async function isStatelessTarotExecution(request) {
  const url = new URL(request.url);
  if (request.method !== 'POST' || url.pathname !== '/api/symbolic-method-execute') return false;
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false;
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') return false;
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (!Number.isFinite(declaredLength) || declaredLength > 16384) return false;
  try {
    const raw = await request.clone().text();
    if (raw.length > 16384) return false;
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
    const allowed = new Set(['method', 'question', 'spreadId', 'spread', 'selectedCardIds', 'useCurrentRealityContext', 'currentRealityContextLabel', 'realityEvidence']);
    if (Object.keys(body).some(key => !allowed.has(key))) return false;
    if (body.method !== 'TAROT' || typeof body.question !== 'string' || !body.question.trim() || body.question.length > 800) return false;
    if (!Array.isArray(body.selectedCardIds) || ![1, 3, 5, 6, 7, 10].includes(body.selectedCardIds.length)) return false;
    if (new Set(body.selectedCardIds).size !== body.selectedCardIds.length) return false;
    if (body.selectedCardIds.some(id => typeof id !== 'string' || id.length > 128)) return false;
    if (body.useCurrentRealityContext !== undefined && typeof body.useCurrentRealityContext !== 'boolean') return false;
    return true;
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const mode = maintenanceMode(context.env.PHIOS_D1_MAINTENANCE_MODE);
  if (mode === 'OFF') return context.next();
  if (mode !== 'READ_ONLY') return maintenanceResponse();
  if (['POST','PUT','PATCH','DELETE'].includes(context.request.method) && !(await isStatelessTarotExecution(context.request))) return maintenanceResponse();
  try {
    // Pages next() captures this env object. Replacing context.env would NOT
    // propagate. Seal only the binding in that object before nested handlers.
    // Do not restore it after next(): waitUntil and concurrent requests must
    // never regain a write capability during this deployment's READ_ONLY mode.
    const guarded = guardD1Binding(context.env.RUNTIME_DB, mode);
    Object.defineProperty(context.env, 'RUNTIME_DB', {value:guarded,writable:false,configurable:false,enumerable:true});
    const before = d1ViolationCount(guarded);
    const response = await context.next();
    // Route-owned catches cannot turn a rejected write into success or leak
    // their diagnostics. A concurrent rejection may conservatively deny a read.
    return d1ViolationCount(guarded) === before ? response : maintenanceResponse();
  } catch {
    // Existing handlers may translate a guard error themselves; neither path
    // exposes SQL, topology or an original binding to a customer.
    return maintenanceResponse();
  }
}
