const TYPES=new Set(['application/pdf','image/jpeg','image/png']);
const EXT=new Set(['pdf','jpg','jpeg','png']);
export function evaluateMedicalDocumentUpload(input={}){
  const name=String(input.name||'').trim(),type=String(input.type||'').toLowerCase(),size=Number(input.size||0),consent=String(input.consentState||'').toUpperCase();
  const ext=name.includes('.')?name.split('.').pop().toLowerCase():'';
  const errors=[];
  if(!name)errors.push('FILE_NAME_REQUIRED'); if(!TYPES.has(type)||!EXT.has(ext))errors.push('FILE_TYPE_NOT_ALLOWED');
  if(!Number.isFinite(size)||size<=0||size>10*1024*1024)errors.push('FILE_SIZE_INVALID'); if(consent!=='GRANTED')errors.push('EXPLICIT_UPLOAD_CONSENT_REQUIRED');
  return {schemaVersion:'PHI-OS-HRX-DOCUMENT-UPLOAD-BOUNDARY-v1.0.0',accepted:errors.length===0,errors,file:{name,type,size},next:errors.length?'REJECT':'INGESTION_IR_ONLY',governance:{virusScanRequiredBeforeProductionIngestion:true,ocrAuthorityCreated:false,diagnosisAllowed:false,rawUploadPersistenceAllowed:false}};
}
