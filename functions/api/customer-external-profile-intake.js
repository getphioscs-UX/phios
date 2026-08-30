import crypto from 'node:crypto';
import {
  cleanExternalProfileText,
  EXTERNAL_PROFILE_FAMILY,
  EXTERNAL_PROFILE_INTAKE_VERSION,
  EXTERNAL_PROFILE_MANUAL_FIELDS,
  EXTERNAL_PROFILE_MANUAL_CORE_FIELDS,
  validateExternalProfileFile
} from '../external-profile/external-profile-contract.js';
import {buildExternalProfileExtractionIr} from '../external-profile/external-profile-extraction-ir.js';
import {extractUploadedExternalProfileDocument} from '../external-profile/upload-document-extractor.js';
import {buildExternalProfileConfirmationDraft} from '../external-profile/external-profile-confirmation.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};

async function sha256File(file){const bytes=await file.arrayBuffer();return crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex')}
function sourceTypeForFile(meta){return meta.extension==='pdf'?'CUSTOMER_UPLOADED_DOCUMENT':'CUSTOMER_UPLOADED_IMAGE'}

export async function onRequestPost(context){
  let form;
  try{form=await context.request.formData()}catch{return json({ok:false,error:'EXTERNAL_PROFILE_MULTIPART_REQUIRED'},400)}
  if(String(form.get('consent')||'')!=='true')return json({ok:false,error:'EXTERNAL_PROFILE_PROCESSING_CONSENT_REQUIRED'},403);
  const family=cleanExternalProfileText(form.get('profileFamily'),80).toUpperCase()||EXTERNAL_PROFILE_FAMILY;
  if(family!==EXTERNAL_PROFILE_FAMILY)return json({ok:false,error:'EXTERNAL_PROFILE_FAMILY_UNSUPPORTED'},422);
  const pastedText=cleanExternalProfileText(form.get('pastedText'),12000);
  const manualFields=Object.fromEntries(EXTERNAL_PROFILE_MANUAL_FIELDS.map(field=>[field,cleanExternalProfileText(form.get(field),240)]));
  const manualCoreFields=Object.fromEntries(EXTERNAL_PROFILE_MANUAL_CORE_FIELDS.map(field=>[field,cleanExternalProfileText(form.get(`manual${field[0].toUpperCase()}${field.slice(1)}`),600)]));
  const manualStructureParts=[
    ['Channels','manualChannels'],
    ['Defined Centers','manualDefinedCenters'],
    ['Open Centers','manualOpenCenters'],
    ['Design activated Gates','manualDesignActivations'],
    ['Personality activated Gates','manualPersonalityActivations']
  ].map(([label,key])=>[label,cleanExternalProfileText(form.get(key),4000)]).filter(([,value])=>value);
  const manualStructureText=manualStructureParts.map(([label,value])=>`${label}: ${value}`).join('\n');
  const file=form.get('file');
  const hasFile=typeof File!=='undefined'&&file instanceof File&&file.size>0;
  const hasManual=Object.values(manualFields).some(Boolean)||Object.values(manualCoreFields).some(Boolean)||Boolean(manualStructureText);
  if(!hasFile&&!pastedText&&!hasManual)return json({ok:false,error:'EXTERNAL_PROFILE_INPUT_REQUIRED'},422);
  const sources=[];let documentExtraction=null;
  if(hasFile){
    let meta;
    try{meta=validateExternalProfileFile(file)}catch(error){return json({ok:false,error:error?.code||'EXTERNAL_PROFILE_FILE_INVALID'},422)}
    const sourceType=sourceTypeForFile(meta),sha256=await sha256File(file);
    sources.push(freeze({sourceType,fileName:meta.name,fileType:meta.extension,mimeType:meta.mimeType,fileSize:meta.size,sha256,fileContentPersisted:false,sourceAuthority:'CUSTOMER'}));
    documentExtraction=await extractUploadedExternalProfileDocument({file,env:context.env});
  }
  if(pastedText)sources.push(freeze({sourceType:'CUSTOMER_PASTED_TEXT',characterCount:pastedText.length,sourceAuthority:'CUSTOMER'}));
  if(hasManual)sources.push(freeze({sourceType:'CUSTOMER_MANUAL_STRUCTURED_ENTRY',fieldCount:Object.values(manualFields).filter(Boolean).length+Object.values(manualCoreFields).filter(Boolean).length+manualStructureParts.length,sourceAuthority:'CUSTOMER'}));
  const intakeId=`XPF-${crypto.randomUUID()}`;
  const extractionIr=buildExternalProfileExtractionIr({intakeId,sources,pastedText,manualFields,manualCoreFields,manualStructureText,documentExtraction});
  const hasConfirmable=extractionIr.candidates.length||extractionIr.manualFields.length;
  const confirmationDraft=hasConfirmable?buildExternalProfileConfirmationDraft(extractionIr):null;
  return json({
    ok:true,
    externalProfileIntake:freeze({
      schemaVersion:EXTERNAL_PROFILE_INTAKE_VERSION,
      intakeId,
      methodId:'XPF',
      profileFamily:EXTERNAL_PROFILE_FAMILY,
      authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',
      extractionIr,
      confirmationDraft,
      intakeState:confirmationDraft?'NEEDS_CONFIRMATION':documentExtraction?.status==='FAILED'?'EXTRACTION_FAILED':'EXTRACTION_INCOMPLETE',
      nextAction:confirmationDraft?'CUSTOMER_CONFIRMATION_REQUIRED':documentExtraction?.status==='FAILED'?'DOCUMENT_EXTRACTION_FAILED':'DOCUMENT_EXTRACTION_REQUIRED',
      privacy:{saved:false,fileContentPersisted:false,runtimeMemoryWritten:false},
      boundary:{phiosCalculated:false,hdrShadowUsed:false,customerReportAuthorityCreated:false,workersAiUsedForDocumentConversion:documentExtraction?.aiServiceUsed===true,workersAiCreatesMeaning:false}
    })
  });
}
