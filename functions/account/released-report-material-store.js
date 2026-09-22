import {createReportReleaseAssertion,digestCanonical,updateReportReleaseStatus} from '../canonical-presentation-runtime/report-release-runtime.js';
import {resolveReleasedCustomerReport} from '../canonical-presentation-runtime/released-report-projection-runtime.js';
import {createCustomerPdfProjection} from '../canonical-presentation-runtime/customer-report-presentation-runtime.js';
import {renderReleasedCustomerPdf} from '../canonical-presentation-runtime/private-pdf-renderer.js';
const TYPE='RR_RELEASE_MATERIAL_V1',CONSENT='RR_CONSENT_REFERENCE_V1',SCHEMA='phi-os.rr-private-material.v1';
const bytes=v=>new TextEncoder().encode(v);
const hash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',v)),b=>b.toString(16).padStart(2,'0')).join('');
const denied=()=>Object.assign(new Error('REPORT_UNAVAILABLE'),{status:404});
function binding(env){if(!env?.RUNTIME_DB?.prepare||!env?.PRIVATE_REPORTS?.get||!env?.PRIVATE_REPORTS?.put)throw Object.assign(new Error('PRIVATE_REPORT_STORAGE_UNAVAILABLE'),{status:503});return env.RUNTIME_DB;}
function intact(release){const {releaseDigest,...body}=release;if(releaseDigest!==digestCanonical(body))throw denied();}
async function row(env,id,userId){const db=binding(env);const r=await db.prepare('SELECT a.payload,a.runtime_id FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND r.user_id=? AND a.artifact_type=? AND r.status=?').bind(id,userId,TYPE,'active').first();if(!r)throw denied();const m=JSON.parse(r.payload);if(m.customerId!==userId)throw denied();return {...m,runtimeId:r.runtime_id};}
// Server-only adapter under the existing runtime persistence owner. No browser write route.
export async function persistTrustedReleasedReport(env,{reportBundle,consent,release,locale='en'},options={}){
 if(reportBundle?.report?.report_id?.startsWith('QA-REPORT-')&&env.PHIOS_ENVIRONMENT!=='qa')throw new Error('QA_FIXTURE_PRODUCTION_FORBIDDEN');
 const db=binding(env),assertion=createReportReleaseAssertion({reportBundle,consent,release});intact(assertion);
 const material={report:reportBundle.report,releaseAssertion:assertion,consent};const released=resolveReleasedCustomerReport(material);
 const projection=createCustomerPdfProjection(released,{locale,authorization:{allowed:true,customerId:assertion.customerId,reportId:assertion.reportId,releaseId:assertion.releaseId}});
 const fontResponse=options.fontBytes?null:await env.ASSETS.fetch(new Request('https://assets.local/assets/fonts/private-report/NotoSansSC-Regular.ttf'));
 if(fontResponse&&!fontResponse.ok)throw new Error('PRIVATE_PDF_FONT_UNAVAILABLE');
 const pdf=await renderReleasedCustomerPdf(projection,options.fontBytes||await fontResponse.arrayBuffer());
 const id=crypto.randomUUID(),runtimeId=`rr-material-${id}`,objectKey=`released/${id}/report.pdf`,materialObjectKey=`released/${id}/material.json`,outputDigest=await hash(pdf),materialText=JSON.stringify({report:material.report,releaseAssertion:assertion}),materialDigest=await hash(bytes(materialText)),now=new Date().toISOString();
 const consentArtifactId=`rr-consent-${await hash(bytes(assertion.customerId+'\0'+consent.consent_id))}`;
 const metadata={acceptanceFixture:assertion.reportId.startsWith('QA-REPORT-'),reportId:assertion.reportId,reportVersion:assertion.reportVersion,customerId:assertion.customerId,releaseId:assertion.releaseId,releaseDigest:assertion.releaseDigest,reportDigest:assertion.reportDigest,consentReference:assertion.consentReference,consentArtifactId,documentId:id,documentVersion:'1',format:'PDF',objectKey,outputDigest,releasedAt:assertion.releasedAt,releaseStatus:assertion.releaseStatus,materialObjectKey,materialDigest,locale};
 try{
  await env.PRIVATE_REPORTS.put(objectKey,pdf,{httpMetadata:{contentType:'application/pdf',cacheControl:'private, no-store'}});
  await env.PRIVATE_REPORTS.put(materialObjectKey,materialText,{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
  await db.batch([
   db.prepare("INSERT INTO runtime_users(user_id,status,created_at,updated_at) VALUES(?,'active',?,?) ON CONFLICT(user_id) DO NOTHING").bind(assertion.customerId,now,now),
   db.prepare("INSERT INTO runtimes(runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES(?,?,'active','released_report',?,'{}',?,?)").bind(runtimeId,assertion.customerId,SCHEMA,now,now),
   db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,runtimeId,TYPE,'released_report',JSON.stringify(metadata),SCHEMA,now,now),
   // Do not overwrite a newer revoked consent when materializing another report.
   db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(artifact_id) DO NOTHING').bind(consentArtifactId,runtimeId,CONSENT,'report_consent',JSON.stringify(consent),SCHEMA,now,now)
  ]);
 }catch(e){await Promise.allSettled([env.PRIVATE_REPORTS.delete(objectKey),env.PRIVATE_REPORTS.delete(materialObjectKey)]);throw e;}
 return {reportId:id,reportVersion:metadata.reportVersion,releaseStatus:'ACTIVE',releasedAt:metadata.releasedAt};
}
export async function loadTrustedReleasedReport(env,id,userId){
 const m=await row(env,id,userId);if(m.releaseStatus!=='ACTIVE')throw denied();
 const object=await env.PRIVATE_REPORTS.get(m.materialObjectKey);if(!object||object.size>2000000)throw denied();const data=await object.arrayBuffer();if(data.byteLength>2000000||await hash(data)!==m.materialDigest)throw denied();
 const material=JSON.parse(new TextDecoder().decode(data));
 const c=await env.RUNTIME_DB.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND a.artifact_type=? AND r.user_id=?').bind(m.consentArtifactId,CONSENT,userId).first();if(!c)throw denied();material.consent=JSON.parse(c.payload);
 intact(material.releaseAssertion);resolveReleasedCustomerReport(material);
 for(const [k,v] of Object.entries({reportId:material.report.report_id,reportVersion:material.report.version,customerId:material.report.client_id,releaseId:material.releaseAssertion.releaseId,releaseDigest:material.releaseAssertion.releaseDigest,reportDigest:material.releaseAssertion.reportDigest,consentReference:material.consent.consent_id}))if(m[k]!==v)throw denied();
 return {material,objectKey:m.objectKey,exportVersion:{...m,status:'EXPORTED',legallyExecuted:false},metadata:m};
}
export async function listTrustedReleasedReports(env,userId){
 const db=binding(env),rows=(await db.prepare('SELECT a.artifact_id FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE r.user_id=? AND a.artifact_type=? AND r.status=? ORDER BY a.created_at DESC LIMIT 100').bind(userId,TYPE,'active').all()).results||[];
 const reports=[];for(const r of rows){try{const {metadata:m}=await loadTrustedReleasedReport(env,r.artifact_id,userId);reports.push({reportId:r.artifact_id,reportVersion:m.reportVersion,releaseStatus:m.releaseStatus,releasedAt:m.releasedAt,format:m.format,acceptanceFixture:m.acceptanceFixture===true});}catch(e){if(e.status===503)throw e;}}
 return reports;
}
// Called by the existing RR transition owner after its explicit action, never by customer APIs.
export async function persistTrustedReleaseTransition(env,id,userId,status,input){
 const current=await loadTrustedReleasedReport(env,id,userId),m=current.metadata;
 const next=updateReportReleaseStatus(current.material.releaseAssertion,status,input);
 if(input.changedBy!==current.material.report.professional_id)throw denied();
 const changed={...m,releaseStatus:next.releaseStatus,releaseDigest:next.releaseDigest,releaseTransition:next};
 // Non-active metadata is an immediate deny. Original signed material remains immutable.
 const result=await env.RUNTIME_DB.prepare('UPDATE runtime_artifacts SET payload=?,updated_at=? WHERE artifact_id=? AND artifact_type=? AND json_extract(payload,\'$.releaseDigest\')=?').bind(JSON.stringify(changed),new Date().toISOString(),id,TYPE,m.releaseDigest).run();
 if(Number(result.meta?.changes??result.changes)!==1)throw new Error('REPORT_VERSION_CONFLICT');
}
export async function persistTrustedConsentState(env,userId,consent){
 const id=`rr-consent-${await hash(bytes(userId+'\0'+consent.consent_id))}`;if(consent.client_id!==userId)throw denied();
 const result=await binding(env).prepare('UPDATE runtime_artifacts SET payload=?,updated_at=? WHERE artifact_id=? AND artifact_type=? AND runtime_id IN(SELECT runtime_id FROM runtimes WHERE user_id=?)').bind(JSON.stringify(consent),new Date().toISOString(),id,CONSENT,userId).run();
 if(Number(result.meta?.changes??result.changes)!==1)throw denied();
}
