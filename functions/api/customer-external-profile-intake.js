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
import {HDR_INTAKE_CALCULATION_SOURCE,buildHdrIntakeCalculationReference} from '../external-profile/hdr-intake-calculation-reference.js';
import {resolveBirthPlace} from '../location/place-resolver.js';
import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';

const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:H});
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const BASIC_CONFIRMATION_FIELDS=Object.freeze(['type','strategy','authority','profile','definition','signature','notSelfTheme','incarnationCross','variable']);
const STRUCTURAL_CONFIRMATION_FIELDS=Object.freeze(['activations','channels','definedCenters','openCenters']);
const clean=value=>String(value??'').trim();
function hasValue(value){return Array.isArray(value)?value.length>0:Boolean(value)}
function isCalculatedDraftItem(item){return item?.sourceType===HDR_INTAKE_CALCULATION_SOURCE}
function buildRecognitionSummary(confirmationDraft){
  const recognizedFields=BASIC_CONFIRMATION_FIELDS.filter(field=>hasValue(confirmationDraft?.fields?.[field]?.value)&&!isCalculatedDraftItem(confirmationDraft?.fields?.[field]));
  const calculatedReferenceFields=BASIC_CONFIRMATION_FIELDS.filter(field=>hasValue(confirmationDraft?.fields?.[field]?.value)&&isCalculatedDraftItem(confirmationDraft?.fields?.[field]));
  const pendingFields=BASIC_CONFIRMATION_FIELDS.filter(field=>!hasValue(confirmationDraft?.fields?.[field]?.value));
  const advancedFields=EXTERNAL_PROFILE_MANUAL_FIELDS.filter(field=>field!=='variable');
  const advancedRecognizedFields=advancedFields.filter(field=>hasValue(confirmationDraft?.fields?.[field]?.value));
  const structuralRecognizedFields=STRUCTURAL_CONFIRMATION_FIELDS.filter(field=>hasValue(confirmationDraft?.structure?.[field]?.value)&&!isCalculatedDraftItem(confirmationDraft?.structure?.[field]));
  const structuralCalculatedReferenceFields=STRUCTURAL_CONFIRMATION_FIELDS.filter(field=>hasValue(confirmationDraft?.structure?.[field]?.value)&&isCalculatedDraftItem(confirmationDraft?.structure?.[field]));
  return freeze({basicExpectedCount:BASIC_CONFIRMATION_FIELDS.length,recognizedCount:recognizedFields.length,calculatedReferenceCount:calculatedReferenceFields.length,prefilledCount:recognizedFields.length+calculatedReferenceFields.length,pendingCount:pendingFields.length,recognizedFields,calculatedReferenceFields,pendingFields,advancedRecognizedCount:advancedRecognizedFields.length,advancedRecognizedFields,structuralRecognizedFields,structuralCalculatedReferenceFields});
}

async function sha256File(file){const bytes=await file.arrayBuffer();return crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex')}
function sourceTypeForFile(meta){return meta.extension==='pdf'?'CUSTOMER_UPLOADED_DOCUMENT':'CUSTOMER_UPLOADED_IMAGE'}
function canonicalBirthInput({birthDate,birthTime,location,locale,consentRecordId}){
  const normalizedTime=birthTime?`${birthTime}${birthTime.length===5?':00':''}`:null;
  return freeze({
    birthDate:birthDate||null,
    birthTime:normalizedTime,
    birthPlace:freeze({displayName:location.displayName,countryCode:location.countryCode,latitude:location.latitude,longitude:location.longitude}),
    timezone:freeze({iana:location.timezone.iana,utcOffsetAtBirth:location.timezone.utcOffsetAtBirth,source:'GOVERNED_RESOLUTION',confidence:'HIGH'}),
    timeAccuracy:'EXACT',
    locale,
    consent:freeze({recordId:consentRecordId,granted:true,purposeCode:'EXTERNAL_PROFILE_CONFIRMATION_CALCULATION_REFERENCE',persistence:'NONE',hdrInternalValidation:true}),
    inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'
  });
}
async function maybeBuildCalculationReference({form,context,intakeId}){
  if(String(form.get('useBirthDataFallback')||'')!=='true')return null;
  const birthDate=clean(form.get('birthDate')),birthTime=clean(form.get('birthTime')),placeRef=clean(form.get('placeRef')),locale=form.get('locale')==='zh-Hans'?'zh-Hans':'en';
  if(!birthDate||!birthTime||!placeRef)return freeze({status:'NOT_RUN_INPUT_INCOMPLETE',reasonCode:'HDR_INTAKE_EXACT_BIRTH_CONTEXT_REQUIRED'});
  let location;
  try{location=await resolveBirthPlace(placeRef,{birthDate,birthTime,locale,env:context.env})}
  catch(error){return freeze({status:'UNAVAILABLE',reasonCode:error?.code||'HDR_INTAKE_LOCATION_RESOLUTION_FAILED'})}
  const consentRecordId=`${intakeId}:HDR-REFERENCE`;
  const input=canonicalBirthInput({birthDate,birthTime,location,locale,consentRecordId}),shape=validateCanonicalBirthInput(input);
  if(!shape.valid)return freeze({status:'UNAVAILABLE',reasonCode:'HDR_INTAKE_CANONICAL_INPUT_INVALID',reasonCodes:shape.reasonCodes});
  try{return await buildHdrIntakeCalculationReference({canonicalBirthInput:input,requestId:consentRecordId})}
  catch(error){return freeze({status:'UNAVAILABLE',reasonCode:error?.code||error?.message||'HDR_INTAKE_CALCULATION_REFERENCE_FAILED'})}
}

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
  const calculationReference=await maybeBuildCalculationReference({form,context,intakeId});
  const extractionIr=buildExternalProfileExtractionIr({intakeId,sources,pastedText,manualFields,manualCoreFields,manualStructureText,documentExtraction,calculationReference});
  // The uploaded chart remains the preferred source. When conversion cannot read a field,
  // an exact-birth-data HDR calculation may prefill a lower-priority reference candidate.
  // Nothing becomes chart authority until the customer reviews and confirms the form.
  const confirmationDraft=buildExternalProfileConfirmationDraft(extractionIr);
  const recognitionSummary=buildRecognitionSummary(confirmationDraft);
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
      recognitionSummary,
      intakeState:'NEEDS_CONFIRMATION',
      extractionState:documentExtraction?.status||'NOT_APPLICABLE',
      calculationReferenceState:calculationReference?.status||'NOT_REQUESTED',
      nextAction:'CUSTOMER_CONFIRMATION_REQUIRED',
      privacy:{saved:false,fileContentPersisted:false,runtimeMemoryWritten:false},
      boundary:{phiosCalculated:false,hdrCalculationReferenceUsed:calculationReference?.status==='AVAILABLE',hdrCalculationReferenceRequiresCustomerConfirmation:true,hdrCalculationReferenceDoesNotGenerateOfficialBodyGraph:true,customerReportAuthorityCreated:false,workersAiUsedForDocumentConversion:documentExtraction?.aiServiceUsed===true,workersAiCreatesMeaning:false}
    })
  });
}
