import {personIdentity,loadCanonicalPersonSubject} from './canonical-person-store.js';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {verifyNumR20Snapshot} from '../personal-reading/narrative/numerology-publication-adapter.js';
import {NUM_NATIVE_CANDIDATE_VERSION,NUM_NATIVE_BODY_CANDIDATE_VERSION,numLocalPdfByteLimit} from '../report-delivery/numerology-native-candidate-version.js';
const version='NUM-R30-FULL19-33PHYS-LOCAL-v1',product='COM-REPORT-NUMEROLOGY-FULL';
const fail=()=>{throw Object.assign(Error('REPORT_UNAVAILABLE'),{code:'REPORT_UNAVAILABLE',status:404});};
const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');
// Read-only bridge to the existing paid Job/material/private object owners.
// The saved R30 replay contract remains local QA; registering a reader never
// admits its manuscript for customers or permits generation from this API.
function scope(c){if(c.env.PHIOS_ENVIRONMENT!=='local'||c.env.STRIPE_ENVIRONMENT!=='QA')fail();}
const birth=b=>({birthDate:b.birthDate,birthTime:b.birthTime??null,birthPlace:b.birthPlace,timezone:{iana:b.timezone.iana,utcOffsetAtBirth:b.timezone.utcOffsetAtBirth}});
export async function openAccountNumerologyMaterial(c,reportId){
 scope(c);const owner=personIdentity(c).userId,db=c.env.RUNTIME_DB;
 const row=await db.prepare("SELECT * FROM account_method_report_materials WHERE report_id=? AND owner_account_id=? AND method_code='NUM'").bind(reportId,owner).first();if(!row)fail();
 const stored=await db.prepare('SELECT record_json FROM paid_report_jobs WHERE report_id=? AND owner_account_id=?').bind(reportId,owner).first();if(!stored)fail();const j=JSON.parse(stored.record_json);
 if(j.state!=='DELIVERED'||j.environment!=='QA'||j.methodCode!=='NUM'||j.productId!==product||j.reportId!==reportId||j.personId!==row.person_id||j.ownerAccountId!==owner||j.output?.reportId!==reportId||j.output?.outputDigest!==row.output_digest||j.output?.snapshotDigest!==row.snapshot_id||j.presentation?.reportLocale!==row.locale)fail();
 const right=await db.prepare("SELECT e.entitlement_id FROM commerce_purchases p JOIN digital_entitlements e ON e.purchase_id=p.purchase_id JOIN commerce_checkout_attempts o ON o.checkout_attempt_id=p.checkout_attempt_id WHERE p.purchase_id=? AND p.customer_id=? AND p.product_id=? AND p.purchase_state='purchased' AND e.customer_id=p.customer_id AND e.product_id=p.product_id AND e.entitlement_status='active' AND (e.expires_at IS NULL OR e.expires_at>?) AND o.checkout_attempt_id=? AND o.customer_id=p.customer_id AND o.order_state='FULFILLED' AND o.review_required=0 AND o.environment='QA'").bind(j.purchaseId,owner,product,new Date().toISOString(),j.orderId).first();if(!right)fail();
 const subject=await loadCanonicalPersonSubject(c.env,owner,j.personId);if(subject.personVersion!==j.personVersion)fail();
 const prefix='num-r30/'+j.jobId+'/',get=async part=>{const object=await c.env.PRIVATE_REPORTS.get(prefix+part);if(!object)fail();return object.json();};
 const m=await get('material'),s=await get('snapshot');await verifyNumR20Snapshot(s);
 const publicationVersion=m.publicationVersion;
 if(![version,NUM_NATIVE_BODY_CANDIDATE_VERSION,NUM_NATIVE_CANDIDATE_VERSION].includes(publicationVersion))fail();
 if(m.owner!==owner||m.purchase!==j.purchaseId||m.product!==product||m.reportId!==reportId||m.locale!==row.locale||m.artifactRef!==prefix+'pdf'||j.output.artifactRef!==m.artifactRef||row.object_key!==m.artifactRef||m.outputDigest!==row.output_digest||m.snapshotDigest!==row.snapshot_id||s.snapshotDigest!==m.snapshotDigest||s.inputDigest!==j.inputDigest||m.entitlementId!==right.entitlement_id)fail();
 if(await sha256Stable(birth(subject.canonicalBirthInput))!==await sha256Stable(birth(s.canonicalInput)))fail();
 const receipt=JSON.parse(row.verifier_receipt);if(receipt.publicationVersion!==publicationVersion||receipt.scope!=='LOCAL_NUM_R30_QA_NOT_CUSTOMER_RELEASE')fail();
 if([NUM_NATIVE_BODY_CANDIDATE_VERSION,NUM_NATIVE_CANDIDATE_VERSION].includes(publicationVersion)){const publication=await get('publication');if(publication.version!==publicationVersion||publication.snapshotDigest!==s.snapshotDigest||publication.editorial||publication.unifiedPublication?.snapshotDigest!==s.snapshotDigest||publication.unifiedPublication?.editorialStatus!=='NATIVE_ADMITTED_UNITS_NOT_EDITORIALLY_COMPRESSED'||publication.unifiedPublication?.customerPublishable!==false)fail();if(publicationVersion===NUM_NATIVE_CANDIDATE_VERSION&&(publication.unifiedPublication.pages.length!==23||publication.unifiedPublication.physicalPlan?.length!==39))fail();}
 return {row,job:j,material:m,snapshot:s,entitlementId:right.entitlement_id,subject};
}
export async function downloadAccountNumerologyPdf(c,id){
 const opened=await openAccountNumerologyMaterial(c,id),object=await c.env.PRIVATE_REPORTS.get(opened.material.artifactRef);if(!object||object.size>numLocalPdfByteLimit(opened.material.publicationVersion))fail();const bytes=new Uint8Array(await object.arrayBuffer());if(bytes.length<1000||bytes.length>numLocalPdfByteLimit(opened.material.publicationVersion)||new TextDecoder().decode(bytes.subarray(0,5))!=='%PDF-'||await hash(bytes)!==opened.material.outputDigest)fail();
 // Recheck current rights after the private read, without rendering or Provider.
 await openAccountNumerologyMaterial(c,id);
 return new Response(bytes,{headers:{'Content-Type':'application/pdf','Content-Length':String(bytes.length),'Content-Disposition':'attachment; filename="PHI-OS-Numerology.pdf"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-PHIOS-Output-Digest':opened.material.outputDigest,'X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
}
export async function listAccountNumerologyMaterials(c){
 if(c.env.PHIOS_ENVIRONMENT!=='local'||c.env.STRIPE_ENVIRONMENT!=='QA')return [];
 const owner=personIdentity(c).userId,rows=(await c.env.RUNTIME_DB.prepare("SELECT report_id FROM account_method_report_materials WHERE owner_account_id=? AND method_code='NUM' ORDER BY released_at DESC LIMIT 100").bind(owner).all()).results||[],out=[];
 for(const r of rows){try{const m=await openAccountNumerologyMaterial(c,r.report_id);out.push({reportId:r.report_id,method:'NUM',subjectName:m.subject.person.displayName,locale:m.row.locale,releasedAt:m.row.released_at,status:'LOCAL_QA_CANDIDATE',publicationVersion:m.material.publicationVersion,pdfDownloadUrl:'/api/account-method-reports?reportId='+encodeURIComponent(r.report_id)+'&format=pdf'});}catch(e){if(e.status!==404)throw e;}}return out;
}
