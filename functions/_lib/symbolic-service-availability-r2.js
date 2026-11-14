// Availability projection of existing authority, transport and source gates.
// It grants no authority, persistence permission or provider capability.
import {symbolicFreeTransportCapability} from './stateless-free-request-r3.js';
export async function symbolicServiceAvailability(context,method,authority,paths){
 const transport=symbolicFreeTransportCapability(method,context.env||{});
 let content={state:'NOT_CHECKED_AUTHORITY_CLOSED',available:false,checked:0};
 if(authority.runAllowed&&transport.allowed){
  if(!context.env?.ASSETS?.fetch)content={state:'SOURCE_UNAVAILABLE',available:false,checked:0};
  else{const results=await Promise.all(Object.values(paths).map(async path=>{try{const r=await context.env.ASSETS.fetch(new Request(new URL(path,context.request.url)));if(!r.ok)return false;const data=await r.json();return data!==null&&typeof data==='object';}catch{return false;}}));content={state:results.every(Boolean)?'REQUIRED_ASSETS_READABLE':'SOURCE_UNAVAILABLE',available:results.every(Boolean),checked:results.length};}
 }
 const allowed=authority.runAllowed===true&&transport.allowed&&content.available;
 return {method,execution:{allowed,state:allowed?'AVAILABLE':!authority.runAllowed?authority.state:!transport.allowed?transport.state:content.state},authority:{state:authority.state,runAllowed:authority.runAllowed===true},transport,content,persistence:{writeTransportAllowed:transport.saveTransportAllowed===true,requiresExplicitConsent:true,requiresVerifiedIdentity:true,automaticPersistence:false},providerCalls:0};
}
