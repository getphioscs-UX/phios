import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {previewReleasedFixture} from '../account/preview-acceptance-fixture.js';
import {persistTrustedReleasedReport,loadTrustedReleasedReport,persistTrustedReleaseTransition,persistTrustedConsentState} from '../account/released-report-material-store.js';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive'};
export async function onRequest(context){
 const reply=(body,status=200)=>Response.json(body,{status,headers});
 const url=new URL(context.request.url);
 if(url.origin!=='https://qa.phios-github.pages.dev'||context.env?.PHIOS_ENVIRONMENT!=='qa'||context.env.FW_PREVIEW_ACCEPTANCE_FIXTURES!=='enabled')return reply({ok:false},404);
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)return reply({ok:false,code:'ACCOUNT_REQUIRED'},401);
 if(context.request.method!=='POST')return reply({ok:false},405);
 try{
  requireSameOrigin(context.request);
  const reader=context.request.body?.getReader();if(!reader)return reply({ok:false},400);
  let raw='',size=0;const decoder=new TextDecoder();
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>512){await reader.cancel();return reply({ok:false},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
  const body=JSON.parse(raw);
  if(!body||Object.keys(body).some(k=>!['action','reportId','locale'].includes(k)))return reply({ok:false},400);
  if(body.action==='materialize'){
   // Bound per account to prevent unbounded font/PDF rendering from this QA helper.
   const n=await context.env.RUNTIME_DB.prepare("SELECT count(*) n FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE r.user_id=? AND a.artifact_type='RR_RELEASE_MATERIAL_V1'").bind(identity.userId).first();if(n.n>=8)return reply({ok:false,code:'QA_FIXTURE_LIMIT'},409);
   return reply({ok:true,...await persistTrustedReleasedReport(context.env,previewReleasedFixture(identity.userId,body.locale==='zh-Hans'?'zh-Hans':'en'))});
  }
  if(!['revoke-release','revoke-consent'].includes(body.action))return reply({ok:false},400);
  const loaded=await loadTrustedReleasedReport(context.env,body.reportId,identity.userId);if(!loaded.material.report.report_id.startsWith('QA-REPORT-'))return reply({ok:false},403);
  if(body.action==='revoke-release')await persistTrustedReleaseTransition(context.env,body.reportId,identity.userId,'REVOKED',{explicitAction:true,changedBy:'QA-FIXTURE-NOT-A-PROFESSIONAL',changedAt:new Date().toISOString(),reason:'Explicit Preview acceptance revocation'});
  else await persistTrustedConsentState(context.env,identity.userId,{...loaded.material.consent,revoked:true});
  return reply({ok:true});
 }catch{return reply({ok:false,code:'QA_FIXTURE_UNAVAILABLE'},409);}
}
