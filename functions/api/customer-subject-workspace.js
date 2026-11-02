import {publicCountryProfile,publicSubjectCatalogue} from '../profile/public-country-profile-r1.js';
import {authenticate} from '../account/oidc-auth.js';
import {createUniversalRegistry} from '../pws/registry/universal-registry.js';
import {listSubjectWorkspaces,readSubjectWorkspace} from '../profile/subject-context-r1.js';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
// Not a production activation: both the explicit local switch and loopback are required.
export function createSubjectWorkspaceHandler(resolveIdentity=authenticate) {
 return async context=>{
  const u=new URL(context.request.url);
  if(u.searchParams.has('publicCountry')||u.searchParams.has('publicCountryCatalog')){
   if(context.request.method!=='GET')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);
   const allowed=['publicCountry','publicCountryCatalog','locale','year','compare','dimension'];if([...u.searchParams.keys()].some(k=>!allowed.includes(k)||u.searchParams.getAll(k).length!==1))return reply({ok:false,code:'PUBLIC_COUNTRY_FIELDS_ONLY'},400);
   try{const locale=u.searchParams.get('locale')==='zh-Hans'?'zh-Hans':'en',raw=u.searchParams.get('year'),year=raw?Number(raw):null;if(raw&&(!Number.isInteger(year)||year<1960||year>new Date().getUTCFullYear()))return reply({ok:false,code:'YEAR_INVALID'},400);const body=u.searchParams.has('publicCountryCatalog')?publicSubjectCatalogue(locale):await publicCountryProfile(context,{countryCode:u.searchParams.get('publicCountry'),locale,year,compare:u.searchParams.get('compare'),dimension:u.searchParams.get('dimension')||'identity'});return Response.json({ok:true,...body},{headers:{'Cache-Control':'public,max-age=300','X-Content-Type-Options':'nosniff'}});}catch(e){return reply({ok:false,code:e.message||'PUBLIC_COUNTRY_UNAVAILABLE'},e.status||503);}
  }
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
