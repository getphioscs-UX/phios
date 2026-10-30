import {authenticate} from '../account/oidc-auth.js';
import {createUniversalRegistry} from '../pws/registry/universal-registry.js';
import {listSubjectWorkspaces,readSubjectWorkspace} from '../profile/subject-context-r1.js';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
// Not a production activation: both the explicit local switch and loopback are required.
export function createSubjectWorkspaceHandler(resolveIdentity=authenticate) {
 return async context=>{
  const u=new URL(context.request.url);
  if(context.env?.PHIOS_SUBJECT_PROFILE_LOCAL!=='true'||!['127.0.0.1','localhost','[::1]'].includes(u.hostname))return reply({ok:false,code:'SUBJECT_WORKSPACE_NOT_ENABLED'},503);
  if(context.request.method!=='GET')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);
  try{
   const identity=await resolveIdentity(context),actorId=identity?.verified?identity.userId:null;
   const registry=createUniversalRegistry({db:context.env.RUNTIME_DB}),locale=u.searchParams.get('locale')==='zh-Hans'?'zh-Hans':'en',subjectId=u.searchParams.get('subjectId');
   return reply({ok:true,...(subjectId?{workspace:await readSubjectWorkspace(registry,subjectId,actorId,{locale})}:await listSubjectWorkspaces(registry,actorId,{locale})),scope:'LOCAL_CANDIDATE'});
  }catch(e){return reply({ok:false,code:e.code||'SUBJECT_SERVICE_UNAVAILABLE'},e.status||503);}
 };
}
export const onRequestGet=createSubjectWorkspaceHandler();
