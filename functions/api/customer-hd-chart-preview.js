// Local-only R4.1 request adapter; no production activation, storage or PDF reader.
import {resolveBirthPlace} from '../location/place-resolver.js';
import {calculateInternalChartPreview,acknowledgeInternalPreview} from '../external-profile/hd-internal-chart-candidate.js';
import {issueHdConfirmationSnapshot,buildHdReportAutomationPlan,createHdConfirmationHeadStore} from '../external-profile/hd-report-automation-candidate.js';
const H={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
export function createHdChartPreviewHandler({resolvePlace=resolveBirthPlace,calculate=calculateInternalChartPreview,reportResources=null}={}){
 return async context=>{
  const url=new URL(context.request.url),host=url.hostname;
  if(context.env?.PHIOS_HD_INTERNAL_CONFIRMATION_LOCAL!=='true'||!['localhost','127.0.0.1','[::1]'].includes(host))return json({ok:false,error:'HD_INTERNAL_PREVIEW_NOT_ENABLED'},403);
  const origin=context.request.headers.get('origin');if(origin&&origin!==url.origin)return json({ok:false,error:'HD_PREVIEW_ORIGIN_REJECTED'},403);
  if(!context.request.headers.get('content-type')?.startsWith('application/json'))return json({ok:false,error:'HD_PREVIEW_JSON_REQUIRED'},415);
  let x;try{const text=await context.request.text();if(text.length>4096)return json({ok:false,error:'HD_PREVIEW_REQUEST_TOO_LARGE'},413);x=JSON.parse(text)}catch{return json({ok:false,error:'HD_PREVIEW_INVALID_JSON'},400)}
  const keys=new Set(['action','birthDate','birthTime','placeRef','locale','consent','chartDigest','confirmed','confirmationToken','reportLanguage','previewGeneration']);
  if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.has(k)))return json({ok:false,error:'HD_COMPUTED_FIELDS_NOT_EDITABLE'},422);
  const snapshotEnabled=!!(context.data?.symbolicAccountIdentity?.sessionId&&context.env?.PHIOS_HD_LOCAL_SNAPSHOT_KEY&&context.env?.PHIOS_HD_CALCULATION_INPUT_DIGEST&&context.env?.RUNTIME_DB?.prepare);
  if(x.action==='invalidate'){try{if(snapshotEnabled)await(await createHdConfirmationHeadStore(context.env,context.data.symbolicAccountIdentity)).invalidate();return json({ok:true,reportConfirmationInvalidated:true})}catch{return json({ok:false,error:'HD_CONFIRMATION_INVALIDATION_UNAVAILABLE'},503)}}
  if(!['preview','confirm','readiness'].includes(x.action)||x.consent!==true||!/^\d{4}-\d{2}-\d{2}$/.test(x.birthDate)||!/^\d{2}:\d{2}(?::\d{2})?$/.test(x.birthTime)||typeof x.placeRef!=='string'||!x.placeRef||!['en','zh-Hans'].includes(x.locale))return json({ok:false,error:'HD_EXACT_CONSENTED_BIRTH_INPUT_REQUIRED'},422);
  try{
   const heads=snapshotEnabled?await createHdConfirmationHeadStore(context.env,context.data.symbolicAccountIdentity):null;
   const generation=heads?(x.action==='preview'?await heads.invalidate():x.previewGeneration):null;
   const location=await resolvePlace(x.placeRef,{birthDate:x.birthDate,birthTime:x.birthTime,locale:x.locale,env:context.env});
   const input={birthDate:x.birthDate,birthTime:x.birthTime.length===5?x.birthTime+':00':x.birthTime,birthPlace:{displayName:location.displayName,countryCode:location.countryCode,latitude:location.latitude,longitude:location.longitude},timezone:{iana:location.timezone.iana,utcOffsetAtBirth:location.timezone.utcOffsetAtBirth,source:'GOVERNED_RESOLUTION',confidence:'HIGH'},timeAccuracy:'EXACT',locale:x.locale,consent:{recordId:'HD-R41-LOCAL-PREVIEW',granted:true,hdrInternalValidation:true,persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
   const calculated=await calculate(input),preview=x.action==='preview'?calculated:acknowledgeInternalPreview(calculated,{chartDigest:x.chartDigest,confirmed:x.confirmed});
   if(heads){await heads.assertGeneration(generation);preview.sessionGeneration=generation;}
   const snapshotOptions={identity:context.data?.symbolicAccountIdentity,secret:context.env?.PHIOS_HD_LOCAL_SNAPSHOT_KEY,runtimeDependencyDigest:context.env?.PHIOS_HD_CALCULATION_INPUT_DIGEST};
   if(x.action==='readiness'){
    if(!heads)throw new TypeError('HD_SNAPSHOT_ACCOUNT_SESSION_REQUIRED');const plan=buildHdReportAutomationPlan({...snapshotOptions,token:x.confirmationToken,preview,language:x.reportLanguage||x.locale,resources:reportResources});await heads.assertActive(plan.snapshot);return json({ok:true,preview,reportPlan:plan});
   }
   let confirmationSnapshot=null;
   if(x.action==='confirm'&&heads)confirmationSnapshot=await heads.activate(generation,()=>issueHdConfirmationSnapshot(preview,{...snapshotOptions,confirmationGeneration:generation}));
   return json({ok:true,preview,confirmationSnapshot});
  }catch(error){const known=['HD_PREVIEW_CHANGED_RECALCULATE','HD_CUSTOMER_CONFIRMATION_REQUIRED','HD_EXACT_CONSENTED_BIRTH_INPUT_REQUIRED'];const snapshotError=/^HD_(SNAPSHOT_|CONFIRMED_PREVIEW_|CALCULATION_VERSION_BINDING_)/.test(error.message);return json({ok:false,error:known.includes(error.message)||snapshotError?error.message:'HD_PREVIEW_CALCULATION_UNAVAILABLE'},known.includes(error.message)||snapshotError?422:503)}
 };
}
export const onRequestPost=createHdChartPreviewHandler();
