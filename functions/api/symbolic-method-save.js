import { normalizeTrustedCkaAccess } from '../_lib/client-knowledge-ask-c.js';
import { assertVerifiedSymbolicAccountIdentity } from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import { createSymbolicReadingPersistenceEnvelope } from '../symbolic-method-persistence/symbolic-reading-envelope-v1.js';
import { createSymbolicReadingD1Store } from '../symbolic-method-persistence/symbolic-reading-store-d1-v1.js';

const headers = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers});

export async function onRequestPost(context) {
  const access = normalizeTrustedCkaAccess(context?.data?.ckaAccess || {});
  if (access.accountState !== 'ACCOUNT') return json({ok:false,error:{code:'ACCOUNT_REQUIRED'},governance:{guestHiddenHistoryPersisted:false,localStorageFallbackAllowed:false}},401);
  if (!access.retentionPolicyAccepted) return json({ok:false,error:{code:'RETENTION_POLICY_REQUIRED'},governance:{retentionExplicit:false}},403);

  let identity;
  try { identity = assertVerifiedSymbolicAccountIdentity(context?.data?.symbolicAccountIdentity || {}); }
  catch (error) { return json({ok:false,error:{code:error.code||'VERIFIED_SYMBOLIC_ACCOUNT_IDENTITY_REQUIRED'},governance:{requestIdentityTrusted:false,localStorageFallbackAllowed:false}},error.status||503); }

  if (!context?.env?.RUNTIME_DB || typeof context.env.RUNTIME_DB.prepare !== 'function') return json({ok:false,error:{code:'SYMBOLIC_RUNTIME_DB_NOT_CONFIGURED'},governance:{d1Required:true,localStorageFallbackAllowed:false}},503);

  let body;
  try { body = await context.request.json(); }
  catch { return json({ok:false,error:{code:'INVALID_JSON'}},400); }

  try {
    const envelope = createSymbolicReadingPersistenceEnvelope(body);
    const store = createSymbolicReadingD1Store({db:context.env.RUNTIME_DB});
    const saved = await store.save({identity,envelope});
    return json({
      ok:true,
      saved:true,
      recordId:saved.recordId,
      provider:saved.provider,
      governance:{
        verifiedIdentityUsed:true,
        retentionPolicyAccepted:true,
        runtimeDbD1Used:true,
        guestHiddenHistoryPersisted:false,
        browserLocalFallbackUsed:false,
        canonicalRealityCreated:false,
        canonicalRawReadingIrPersisted:false,
        publicReadingIrProjectionPersisted:true
      }
    });
  } catch (error) {
    return json({ok:false,error:{code:error.code||error.message||'SYMBOLIC_SAVE_FAILED'}},error.status||400);
  }
}
