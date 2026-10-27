import {publicProfileNetworkFixture} from '../profile/profile-context-network-r2.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
const reply=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function onRequestGet(context){
 if(new URL(context.request.url).searchParams.get('scope')==='private')return onRequestPost(context);
 return reply({ok:true,network:publicProfileNetworkFixture()});
}
export async function onRequestPost(context){
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 if(!identity)return reply({ok:false,code:'ACCOUNT_REQUIRED'},401);
 // Financial purpose owner currently admits REPORT/WILL_ASSEMBLY/PROFESSIONAL_REVIEW,
 // not Profile graph use. Never treat a report grant or client boolean as this consent.
 // Relationship intake is session-only and has no established private graph reader.
 return reply({ok:false,code:'CONSENT_REQUIRED',domains:{RELATIONSHIP:'SOURCE_UNAVAILABLE',FINANCIAL:'PROFILE_PURPOSE_NOT_ADMITTED',ESTATE:'PROFILE_PURPOSE_NOT_ADMITTED'},privateRecordsRead:0},403);
}
