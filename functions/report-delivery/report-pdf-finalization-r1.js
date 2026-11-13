// Same canonical JSON ordering as the existing shared digest contract, without Node fallback.
const canonical=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
export const REPORT_PDF_FINALIZATION_VERSION='REPORT-PDF-FINALIZATION-R1';
export const REPORT_PDF_PROFILES=Object.freeze(['BACKGROUND_JPEG_Q87_444_NO_RESIZE','BACKGROUND_JPEG_Q83_444_NO_RESIZE']);
const fail=c=>{throw Object.assign(Error(c),{code:c,status:409});};
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
export async function finalizeNewReportPdf({bytes,binding,finalizer}){
 // Server-owned port only: never obtain codec policy/receipts from request JSON.
 if(!(bytes instanceof Uint8Array)||bytes.length<1000||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-')fail('REPORT_PDF_SOURCE_INVALID');
 for(const k of ['methodCode','reportId','jobId','subjectId','publicationDigest','publicationVersion'])if(typeof binding?.[k]!=='string'||!binding[k])fail('REPORT_PDF_FINALIZATION_BINDING_REQUIRED');
 if(!['BZR','ZWR','AST','NUM','HD','ECR'].includes(binding.methodCode)||typeof finalizer!=='function')fail('REPORT_PDF_FINALIZER_REQUIRED');
 const inputSHA256=await hash(bytes),bindingDigest=await hash(new TextEncoder().encode(canonical(binding)));
 const result=await finalizer({bytes,binding:structuredClone(binding),bindingDigest,inputSHA256,version:REPORT_PDF_FINALIZATION_VERSION});
 const r=result?.receipt,out=result?.bytes;
 if(!(out instanceof Uint8Array)||out.length<1000||new TextDecoder().decode(out.subarray(0,5))!=='%PDF-'||r?.version!==REPORT_PDF_FINALIZATION_VERSION||r.inputSHA256!==inputSHA256||r.outputSHA256!==await hash(out)||r.bindingDigest!==bindingDigest||r.methodCode!==binding.methodCode||!REPORT_PDF_PROFILES.includes(r.profile)||r.optimizedBytes!==out.length||r.originalBytes!==bytes.length||out.length>bytes.length)fail('REPORT_PDF_FINALIZATION_IDENTITY_MISMATCH');
 for(const k of ['pageCount','pageBoundaries','dynamicContentStreamsExact','extractedTextExactPerPage','fontPayloadSetUnchanged','fontNamesUnchanged','originalIdentityMetadataRetained','originalUnmodified','bookmarksExact','linksExact','protectedImagesUnchanged'])if(r.checks?.[k]!==true)fail('REPORT_PDF_FINALIZATION_PARITY_FAILED');
 if(r.providerCalls!==0||r.commercialAdmissionGranted!==false||r.downsampled!==false||r.transparencyPreserved!==true||r.criticalCalculationImagesPreserved!==true)fail('REPORT_PDF_FINALIZATION_POLICY_INVALID');
 return {bytes:out,outputSHA256:r.outputSHA256,receipt:r};
}

