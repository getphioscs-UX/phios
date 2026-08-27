export const EXTERNAL_PROFILE_FAMILY='HUMAN_DESIGN';
export const EXTERNAL_PROFILE_IR_VERSION='PHI-OS-EXTERNAL-PROFILE-EXTRACTION-IR-v1.0.0';
export const EXTERNAL_PROFILE_INTAKE_VERSION='PHI-OS-CX-R12R4B-EXTERNAL-PROFILE-INTAKE-v1.0.0';
export const EXTERNAL_PROFILE_MAX_UPLOAD_BYTES=10_000_000;
export const EXTERNAL_PROFILE_MANUAL_FIELDS=Object.freeze([
  'cognition',
  'determination',
  'environment',
  'perspective',
  'motivation',
  'trajectory'
]);

const EXTENSION_TO_MIME=Object.freeze({
  png:'image/png',
  jpg:'image/jpeg',
  jpeg:'image/jpeg',
  webp:'image/webp',
  pdf:'application/pdf'
});

export function cleanExternalProfileText(value,max=4000){
  return String(value??'').replace(/\u0000/g,'').trim().slice(0,max);
}

export function fileExtension(name){
  const match=String(name??'').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1]||'';
}

export function validateExternalProfileFile(file){
  if(!file||typeof file!=='object')return null;
  const name=cleanExternalProfileText(file.name,240);
  const extension=fileExtension(name);
  const mime=cleanExternalProfileText(file.type,120).toLowerCase();
  const expected=EXTENSION_TO_MIME[extension];
  if(!expected)throw Object.assign(new TypeError('EXTERNAL_PROFILE_FILE_TYPE_UNSUPPORTED'),{code:'EXTERNAL_PROFILE_FILE_TYPE_UNSUPPORTED'});
  if(mime&&mime!==expected)throw Object.assign(new TypeError('EXTERNAL_PROFILE_FILE_MIME_MISMATCH'),{code:'EXTERNAL_PROFILE_FILE_MIME_MISMATCH'});
  const size=Number(file.size);
  if(!Number.isInteger(size)||size<1||size>EXTERNAL_PROFILE_MAX_UPLOAD_BYTES){
    throw Object.assign(new TypeError('EXTERNAL_PROFILE_FILE_SIZE_INVALID'),{code:'EXTERNAL_PROFILE_FILE_SIZE_INVALID'});
  }
  return Object.freeze({name,extension,mimeType:expected,size});
}

export function normalizeManualAdvancedFields(input={}){
  return Object.freeze(EXTERNAL_PROFILE_MANUAL_FIELDS.flatMap(field=>{
    const value=cleanExternalProfileText(input[field],240);
    return value?[Object.freeze({
      field,
      rawValue:value,
      normalizedValue:value,
      sourceType:'CUSTOMER_MANUAL_ENTRY',
      customerConfirmed:true,
      phiosCalculated:false
    })]:[];
  }));
}
