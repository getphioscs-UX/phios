export const HDR2_INTERNAL_ACCESS_RUNTIME_CODE = 'PHI_OS_HDR2_INTERNAL_ACCESS_RUNTIME';
export const HDR2_INTERNAL_ACCESS_RUNTIME_VERSION = '1.0.0';
const ACCESS_CLASSES = new Set(['GOVERNED_INTERNAL_PROFESSIONAL','GOVERNED_INTERNAL_QA']);
function requiredText(value, code){if(typeof value!=='string'||!value.trim())throw new TypeError(code);return value.trim();}
export function assertHdr2InternalAccess(accessContext){
  if(!accessContext||typeof accessContext!=='object'||Array.isArray(accessContext))throw new TypeError('HDR2_INTERNAL_ACCESS_CONTEXT_REQUIRED');
  const subjectId=requiredText(accessContext.authenticatedSubjectId,'HDR2_AUTHENTICATED_SUBJECT_REQUIRED');
  const accessClass=requiredText(accessContext.accessClass,'HDR2_ACCESS_CLASS_REQUIRED');
  if(!ACCESS_CLASSES.has(accessClass))throw new Error('HDR2_ACCESS_CLASS_FORBIDDEN');
  if(accessContext.authorizationStatus!=='ACTIVE')throw new Error('HDR2_ACTIVE_AUTHORIZATION_REQUIRED');
  if(accessContext.workspaceAccess!==true)throw new Error('HDR2_WORKSPACE_ACCESS_REQUIRED');
  if(accessContext.operatingLensAccess!==true)throw new Error('HDR2_OPERATING_LENS_ACCESS_REQUIRED');
  if(accessContext.explicitConsent!==true)throw new Error('HDR2_EXPLICIT_CONSENT_REQUIRED');
  if(accessContext.purpose!=='INTERNAL_OPERATING_LENS')throw new Error('HDR2_INTERNAL_PURPOSE_REQUIRED');
  if(accessContext.publicRequest===true||accessContext.customerSelfService===true)throw new Error('HDR2_PUBLIC_OR_SELF_SERVICE_ACCESS_FORBIDDEN');
  return Object.freeze({runtimeCode:HDR2_INTERNAL_ACCESS_RUNTIME_CODE,runtimeVersion:HDR2_INTERNAL_ACCESS_RUNTIME_VERSION,decision:'ALLOW_INTERNAL_ONLY',subjectId,accessClass,workspaceAccess:true,publicExecutionAllowed:false,customerSelfServiceAllowed:false});
}
