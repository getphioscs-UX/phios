import crypto from 'node:crypto';
import {resolveBirthPlace} from '../location/place-resolver.js';
import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';
import {runHdrShadowValidation} from '../external-profile/hdr-shadow-validation.js';
import {buildHdrTransitOverlay} from '../external-profile/hdr-target-activation-reference.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const clean=value=>String(value??'').trim();
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};

function canonicalInput(body,location,consentRecordId){
  const birthTime=clean(body.birthTime);
  return freeze({
    birthDate:clean(body.birthDate)||null,
    birthTime:birthTime?`${birthTime}${birthTime.length===5?':00':''}`:null,
    birthPlace:freeze({displayName:location.displayName,countryCode:location.countryCode,latitude:location.latitude,longitude:location.longitude}),
    timezone:freeze({iana:location.timezone.iana,utcOffsetAtBirth:location.timezone.utcOffsetAtBirth,source:'GOVERNED_RESOLUTION',confidence:'HIGH'}),
    timeAccuracy:'EXACT',
    locale:body.locale==='zh-Hans'?'zh-Hans':'en',
    consent:freeze({recordId:consentRecordId,granted:true,purposeCode:'EXTERNAL_PROFILE_INTERNAL_SHADOW_VALIDATION',persistence:'NONE',hdrInternalValidation:true}),
    inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'
  });
}

export async function onRequestPost(context){
  let body;try{body=await context.request.json()}catch{return json({ok:false,error:'HDR_SHADOW_JSON_REQUIRED'},400)}
  if(body?.consent!==true)return json({ok:false,error:'HDR_SHADOW_EXPLICIT_CONSENT_REQUIRED'},403);
  if(!body?.confirmedExternalProfile)return json({ok:false,error:'HDR_SHADOW_CONFIRMED_PROFILE_REQUIRED'},422);
  let transitOverlay=null;
  if(body?.hdrTargetContext){
    try{transitOverlay=await buildHdrTransitOverlay({targetContext:body.hdrTargetContext,confirmedProfile:body.confirmedExternalProfile})}
    catch(error){transitOverlay=freeze({state:'UNAVAILABLE',reasonCode:error?.code||error?.message||'HDR_TRANSIT_OVERLAY_UNAVAILABLE',boundary:{usesConfirmedNatalChart:true,natalBaselineImmutable:true,transitDesignLayerCalculated:false,confirmedChartChanged:false,interpretationCreated:false,persisted:false}})}
  }
  const notRun=(state,extra={})=>json({ok:true,shadowValidation:freeze({state,...extra,transitOverlay,targetActivationReference:transitOverlay,boundary:{internalValidationOnly:true,transitOverlaySeparateFromBirthCrossCheck:true,customerProfileOverwritten:false,persisted:false}})});
  const birthCrossCheckRequested=body?.birthCrossCheckRequested===true;
  if(!birthCrossCheckRequested)return notRun(['AVAILABLE','PARTIAL'].includes(transitOverlay?.state)?'TRANSIT_OVERLAY_ONLY':'NOT_RUN_NOT_REQUESTED');
  if(!clean(body.birthDate)||!clean(body.birthTime)||!clean(body.placeRef))return notRun('NOT_RUN_INPUT_INCOMPLETE');
  let location;try{location=await resolveBirthPlace(body.placeRef,{birthDate:clean(body.birthDate),birthTime:clean(body.birthTime),locale:body.locale==='zh-Hans'?'zh-Hans':'en',env:context.env})}catch(error){return notRun('NOT_RUN_LOCATION_UNAVAILABLE',{reasonCode:error?.code||'LOCATION_RESOLUTION_FAILED'})}
  const consentRecordId=`XPF-SHADOW-${crypto.randomUUID()}`;
  const input=canonicalInput(body,location,consentRecordId),shape=validateCanonicalBirthInput(input);
  if(!shape.valid)return notRun('NOT_RUN_INPUT_INVALID',{reasonCodes:shape.reasonCodes});
  try{
    const result=await runHdrShadowValidation({canonicalBirthInput:input,confirmedProfile:body.confirmedExternalProfile,requestId:consentRecordId});
    return json({ok:true,shadowValidation:freeze({...result.comparison,transitOverlay,targetActivationReference:transitOverlay,governance:result.governance,privacy:{saved:false,runtimeMemoryWritten:false}})});
  }catch(error){return notRun('NOT_RUN_RUNTIME_UNAVAILABLE',{reasonCode:error?.code||error?.message||'HDR_SHADOW_RUNTIME_FAILED'})}
}
