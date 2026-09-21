import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {resolveReleasedCustomerReport} from '../canonical-presentation-runtime/released-report-projection-runtime.js';
import {issuePrivateDownloadGrant,authorizePrivateDownload} from '../document-assembly/download-runtime.js';
import {digest} from './oidc-auth.js';

// Delivery adapter, not a release owner. The release material and export binding
// must be loaded by the existing RR/DAR server owner, never from a request body.
async function admitted(context,material){
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 if(!identity||material?.report?.client_id!==identity.userId)throw new Error('PRIVATE_REPORT_OWNER_REQUIRED');
 resolveReleasedCustomerReport(material);
 if(!context.env?.PRIVATE_REPORTS?.get)throw new Error('PRIVATE_REPORTS_BINDING_REQUIRED');
 if(typeof context.env.AUTH_SESSION_SECRET!=='string'||context.env.AUTH_SESSION_SECRET.length<32)throw new Error('PRIVATE_REPORT_SIGNING_CONFIGURATION_REQUIRED');
 return {identity,secret:await digest(`PHIOS_PRIVATE_REPORT_GRANT_v1\0${context.env.AUTH_SESSION_SECRET}`)};
}
function exportBinding(material,exportVersion){
 if(exportVersion?.reportId!==material.report.report_id||exportVersion?.reportDigest!==material.releaseAssertion.reportDigest||!/^[a-f0-9]{64}$/.test(exportVersion?.outputDigest||'')||exportVersion.format!=='PDF')throw new Error('PRIVATE_REPORT_EXPORT_BINDING_REQUIRED');
}
export async function issueReleasedPrivateReportGrant(context,{material,exportVersion}){
 const {identity,secret}=await admitted(context,material);exportBinding(material,exportVersion);
 return issuePrivateDownloadGrant({exportVersion,subjectId:identity.userId,now:new Date().toISOString(),expiresAt:new Date(Date.now()+15*60000).toISOString(),secret});
}
export async function deliverReleasedPrivateReport(context,{material,exportVersion,objectKey,token}){
 const {identity,secret}=await admitted(context,material);exportBinding(material,exportVersion);
 if(typeof token!=='string'||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))throw new Error('PRIVATE_REPORT_GRANT_INVALID');
 const grant=authorizePrivateDownload({token,subjectId:identity.userId,now:new Date().toISOString(),secret});
 if(!grant.authorized||grant.payload.documentId!==exportVersion.documentId||grant.payload.documentVersion!==exportVersion.documentVersion||grant.payload.outputDigest!==exportVersion.outputDigest)throw new Error('PRIVATE_REPORT_GRANT_INVALID');
 if(typeof objectKey!=='string'||!objectKey||objectKey.length>1024)throw new Error('PRIVATE_REPORT_OBJECT_REQUIRED');
 const object=await context.env.PRIVATE_REPORTS.get(objectKey);
 if(!object||object.size>32*1024*1024)throw new Error('PRIVATE_REPORT_UNAVAILABLE');
 const bytes=await object.arrayBuffer();
 if(bytes.byteLength>32*1024*1024)throw new Error('PRIVATE_REPORT_UNAVAILABLE');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==exportVersion.outputDigest)throw new Error('PRIVATE_REPORT_DIGEST_MISMATCH');
 return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="PHI-OS-private-report.pdf"','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
}
