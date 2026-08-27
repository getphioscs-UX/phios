import crypto from 'node:crypto';
import {
  cleanExternalProfileText,
  EXTERNAL_PROFILE_FAMILY,
  EXTERNAL_PROFILE_INTAKE_VERSION,
  EXTERNAL_PROFILE_MANUAL_FIELDS,
  validateExternalProfileFile
} from '../external-profile/external-profile-contract.js';
import {buildExternalProfileExtractionIr} from '../external-profile/external-profile-extraction-ir.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};

async function sha256File(file){
  const bytes=await file.arrayBuffer();
  return crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');
}

function sourceTypeForFile(meta){return meta.extension==='pdf'?'CUSTOMER_UPLOADED_DOCUMENT':'CUSTOMER_UPLOADED_IMAGE'}

export async function onRequestPost(context){
  let form;
  try{form=await context.request.formData()}catch{return json({ok:false,error:'EXTERNAL_PROFILE_MULTIPART_REQUIRED'},400)}
  if(String(form.get('consent')||'')!=='true')return json({ok:false,error:'EXTERNAL_PROFILE_PROCESSING_CONSENT_REQUIRED'},403);
  const family=cleanExternalProfileText(form.get('profileFamily'),80).toUpperCase()||EXTERNAL_PROFILE_FAMILY;
  if(family!==EXTERNAL_PROFILE_FAMILY)return json({ok:false,error:'EXTERNAL_PROFILE_FAMILY_UNSUPPORTED'},422);
  const pastedText=cleanExternalProfileText(form.get('pastedText'),12000);
  const manualFields=Object.fromEntries(EXTERNAL_PROFILE_MANUAL_FIELDS.map(field=>[field,cleanExternalProfileText(form.get(field),240)]));
  const file=form.get('file');
  const hasFile=typeof File!=='undefined'&&file instanceof File&&file.size>0;
  const hasManual=Object.values(manualFields).some(Boolean);
  if(!hasFile&&!pastedText&&!hasManual)return json({ok:false,error:'EXTERNAL_PROFILE_INPUT_REQUIRED'},422);
  const sources=[];
  if(hasFile){
    let meta;
    try{meta=validateExternalProfileFile(file)}catch(error){return json({ok:false,error:error?.code||'EXTERNAL_PROFILE_FILE_INVALID'},422)}
    sources.push(freeze({
      sourceType:sourceTypeForFile(meta),
      fileName:meta.name,
      fileType:meta.extension,
      mimeType:meta.mimeType,
      fileSize:meta.size,
      sha256:await sha256File(file),
      fileContentPersisted:false,
      sourceAuthority:'CUSTOMER'
    }));
  }
  if(pastedText)sources.push(freeze({sourceType:'CUSTOMER_PASTED_TEXT',characterCount:pastedText.length,sourceAuthority:'CUSTOMER'}));
  const intakeId=`XPF-${crypto.randomUUID()}`;
  const extractionIr=buildExternalProfileExtractionIr({intakeId,sources,pastedText,manualFields});
  return json({
    ok:true,
    externalProfileIntake:freeze({
      schemaVersion:EXTERNAL_PROFILE_INTAKE_VERSION,
      intakeId,
      methodId:'XPF',
      profileFamily:EXTERNAL_PROFILE_FAMILY,
      authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',
      extractionIr,
      nextAction:extractionIr.candidates.length||extractionIr.manualFields.length?'CUSTOMER_CONFIRMATION_REQUIRED':'DOCUMENT_EXTRACTION_REQUIRED',
      privacy:{saved:false,fileContentPersisted:false,runtimeMemoryWritten:false},
      boundary:{phiosCalculated:false,hdrShadowUsed:false,customerReportAuthorityCreated:false}
    })
  });
}
