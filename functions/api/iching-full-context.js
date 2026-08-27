import {resolveIChingFullProductionAuthority,ensureIChingGuestSession,guestPersistenceIdentity} from '../iching-full-production/iching-full-production-v1.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
function json(body,status=200,setCookie=null){const h=new Headers(headers);if(setCookie)h.append('set-cookie',setCookie);return new Response(JSON.stringify(body),{status,headers:h});}
export async function onRequestGet(context){
  const production=await resolveIChingFullProductionAuthority(context);if(!production.authorized)return json({ok:true,method:'I_CHING',production,guest:{saveContractAvailable:false,guestPersistenceAllowed:false},realityContext:{usingCurrentRealityContext:false,label:'Current Reality context is not being used',contextItems:[],silentPrivateContextConsumption:false}});
  const guest=await ensureIChingGuestSession(context);const identity=guestPersistenceIdentity(guest.session);
  return json({ok:true,method:'I_CHING',entryCopy:'Explore a symbolic perspective',contextCopy:'This method provides a structured interpretive lens. It does not establish facts or predict guaranteed outcomes.',production,
    productRuntime:{sourceReady:true,humanApprovedDepth:'448/448',bilingualRuntime:'896/896',automaticPersistence:false},
    guest:{state:'GUEST',guestPersistenceAllowed:true,verifiedSignedSession:Boolean(identity),saveContractAvailable:true,retentionConsentRequired:true,retentionPolicyVersion:'ICHING-GUEST-RETENTION-v1',retentionDays:production.guestRetentionDays,hiddenAutomaticHistory:false,localBrowserFallback:false,deleteApiAvailable:true},
    realityContext:{usingCurrentRealityContext:false,label:'Current Reality context is not being used',contextItems:[],silentPrivateContextConsumption:false}},200,guest.setCookie);
}
