// Local integration library only. No production route imports this adapter.
// Account and PWS remain the only identity/access owners; no grants or writes.
import {authenticate} from '../account/oidc-auth.js';
import {createUniversalRegistry} from '../pws/registry/universal-registry.js';
import {authorizeSubject,listSubjectWorkspaces,readSubjectWorkspace,issue} from './subject-context-r1.js';
import {VISUAL_REPORT_PRODUCTS} from '../canonical-presentation-runtime/visual-report-registry.js';

export const SUBJECT_OWNER_INTEGRATION_R2='SUBJECT_OWNER_INTEGRATION_R2';
export const SUBJECT_OWNER_BLOCKERS=Object.freeze({
 provisioning:'SUBJECT_PRODUCTION_OWNER_POLICY',
 financial:'BUSINESS_FINANCIAL_READ_OWNER_NOT_ADMITTED',
 reading:'SUBJECT_READING_RUNTIME_BINDING_NOT_ADMITTED',
 navigation:'SUBJECT_NAVIGATION_RUNTIME_BINDING_NOT_ADMITTED',
 continuity:'FORMAL_SUBJECT_CONTINUITY_RETENTION_AND_IDEMPOTENCY_NOT_ADMITTED',
 multiparty:'MULTIPARTY_AND_GUARDIAN_OWNER'
});
const need=(v,c,s=403)=>{if(!v)throw issue(c,s);};
function isolated(context){
 const host=new URL(context.request.url).hostname;
 need(context.env?.PHIOS_SUBJECT_R2_MODE==='ISOLATED_OWNER_REVIEW'&&['localhost','127.0.0.1','[::1]','continuity-local.example.invalid'].includes(host),'SUBJECT_R2_NOT_ENABLED',503);
}
async function resolveAccount(context){
 isolated(context);
 // Ignore caller-supplied identity objects: verify the real session owner.
 const identity=await authenticate(context);
 return identity?.verified&&identity.authenticated?identity:null;
}
function registry(context){return createUniversalRegistry({db:context.env.RUNTIME_DB});}
const blocked=(code,owner)=>({status:'BLOCKED',code,owner});
export function subjectReportMethodBoundary(subjectType){
 need(['PERSONAL','FAMILY','TEAM','BUSINESS','INSTITUTION','COUNTRY'].includes(subjectType),'SUBJECT_TYPE_INVALID',422);
 return VISUAL_REPORT_PRODUCTS.filter(p=>['BZR','ZWR','AST','NUM','HD','ECR'].includes(p.methodId)).map(p=>({methodId:p.methodId,registryOwner:'functions/canonical-presentation-runtime/visual-report-registry.js',state:subjectType==='PERSONAL'?'EXISTING_PERSON_CONSENT_INPUT_AND_ENTITLEMENT_REQUIRED':'NOT_APPLICABLE',rightsGranted:false}));
}
export async function subjectR2Catalogue(context,{locale='en'}={}){
 const who=await resolveAccount(context),result=await listSubjectWorkspaces(registry(context),who?.userId,{locale});
 return {...result,items:result.items.filter(x=>['PERSONAL','BUSINESS','COUNTRY'].includes(x.subjectType)),accountVerified:Boolean(who),provisioning:blocked(SUBJECT_OWNER_BLOCKERS.provisioning,'ACCOUNT / PWS / Consent'),productionAdmission:false};
}
async function worldBinding(context,workspace){
 const evidence=workspace.worldContext.filter(x=>x.kind==='OBSERVED_FACT'&&x.sourceUrl&&x.period&&x.unit&&x.geography&&x.version&&x.revision);
 if(!evidence.length)return blocked('WORLD_SUBJECT_CONTEXT_NOT_BOUND','Existing World');
 const response=await context.env.ASSETS?.fetch(new Request(new URL('/content/civilization-atlas/geography/world-selection-geometry-r2.json',context.request.url)));
 if(!response?.ok)return blocked('WORLD_GEOGRAPHY_UNAVAILABLE','Existing World');
 const geography=await response.json();
 const countries=[...new Set(evidence.map(x=>x.geography))].map(iso2=>geography.features.find(x=>x.iso2===iso2)).filter(Boolean);
 need(countries.length===new Set(evidence.map(x=>x.geography)).size,'WORLD_GEOGRAPHY_RECHECK_REQUIRED',409);
 return {status:'PASS',scope:'EXISTING_ARCHIVED_PUBLIC_CONTEXT_ONLY',owner:'Existing World Registry / world-measurement-observations',countries:countries.map(x=>({id:x.id,iso2:x.iso2,name:x.name,href:'/world/?country='+encodeURIComponent(x.iso2)})),evidence:evidence.map(x=>({...x,indicatorDefinition:x.unit==='index_2010_100'?'Consumer price index, base 2010=100':x.unit==='persons'?'Population, persons':'Use original source definition',latestClaim:false})),descriptiveTrend:workspace.worldTrend,ownsCountry:false,causalOrForecastConclusion:false};
}
export async function readSubjectOwnerIntegration(context,subjectId,{locale='en',worldSubjectId=null}={}){
 const who=await resolveAccount(context),r=registry(context);
 const auth=await authorizeSubject(r,subjectId,who?.userId);
 need(!['FAMILY','TEAM','INSTITUTION'].includes(auth.object.metadata.subjectType),SUBJECT_OWNER_BLOCKERS.multiparty);
 const workspace=await readSubjectWorkspace(r,subjectId,who?.userId,{locale});
 let worldWorkspace=workspace;
 if(worldSubjectId){
  const object=await r.query.getObject(worldSubjectId);
  need(object?.metadata?.subjectType==='COUNTRY'&&object.metadata.visibility==='PUBLIC'&&object.metadata.canonicalSubjectRef?.owner==='WORLD','PUBLIC_WORLD_REFERENCE_REQUIRED',422);
  worldWorkspace=await readSubjectWorkspace(r,worldSubjectId,who?.userId,{locale});
 }
 const world=await worldBinding(context,worldWorkspace);
 if(worldSubjectId&&world.status==='PASS'){
  world.subjectConnection='USER_SELECTED_PUBLIC_CONTEXT_NOT_RESIDENCE';world.sourceSubjectId=worldSubjectId;world.sourceVersion=worldWorkspace.sourceVersion;world.geographyInferred=false;
  workspace.worldContext=world.evidence.map(x=>({...x,relationship:'USER_SELECTED_PUBLIC_CONTEXT'}));
 }
 // R1 fixture summaries must never masquerade as a formal Financial read.
 // The current account Financial API admits PERSONAL saved intakes, not a
 // Business ledger/statement read. No second calculator or invented zeros.
 workspace.financial={state:'FORMAL_OWNER_NOT_BOUND',metrics:[],derived:[],code:SUBJECT_OWNER_BLOCKERS.financial,sourceRef:null,sourceVersion:null,updatedAt:null};
 const integration={schemaVersion:SUBJECT_OWNER_INTEGRATION_R2,subjectId:workspace.subjectId,profileVersion:workspace.profileVersion,evidenceSourceVersion:workspace.sourceVersion,consentScope:auth.grant?{purpose:'SUBJECT_PROFILE_DISPLAY',grantId:auth.grant.id,version:auth.grant.version,scopes:auth.scopes}:null,accountOwner:'functions/account/oidc-auth.js',subjectOwner:'functions/pws/registry/universal-registry.js',syntheticAccountOrSubject:workspace.dataNature==='SYNTHETIC_EXAMPLE',world,financial:blocked(SUBJECT_OWNER_BLOCKERS.financial,'functions/api/account-financial-summary.js'),reading:blocked(SUBJECT_OWNER_BLOCKERS.reading,'Existing Reality Runtime'),navigation:blocked(SUBJECT_OWNER_BLOCKERS.navigation,'functions/customer-projection/canonical-navigation-handoff.js'),continuity:blocked(SUBJECT_OWNER_BLOCKERS.continuity,'Existing canonical-navigation-handoff / report-context owner'),provisioning:blocked(SUBJECT_OWNER_BLOCKERS.provisioning,'ACCOUNT / PWS / Consent'),productionAdmission:false};
 workspace.integration=integration;
 integration.methods=subjectReportMethodBoundary(workspace.subjectType);
 workspace.navigation.formalReadingEstablished=false;
 workspace.navigation.persistenceAllowed=false;
 workspace.navigation.optionsAreR1ReviewPrompts=true;
 return {workspace,integration};
}
export async function rejectUnadmittedSubjectOperation(context,subjectId,operation){
 const who=await resolveAccount(context);
 need(who,'AUTH_REQUIRED',401);
 await authorizeSubject(registry(context),subjectId,who.userId);
 throw issue(operation==='SAVE'||operation==='REOPEN'?SUBJECT_OWNER_BLOCKERS.continuity:SUBJECT_OWNER_BLOCKERS.provisioning,503);
}
