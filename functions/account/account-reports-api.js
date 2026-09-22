import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from './oidc-auth.js';
import {loadTrustedReleasedReport,listTrustedReleasedReports} from './released-report-material-store.js';
import {issueReleasedPrivateReportGrant,deliverReleasedPrivateReport} from './private-report-delivery.js';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const COOKIE='__Secure-phios-report-download';
const reply=(body,status=200,extra={})=>Response.json(body,{status,headers:{...headers,...extra}});
export async function accountReportsApi(context,action){
 try{
  const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)return reply({ok:false,code:'ACCOUNT_REQUIRED'},401);
  if(action==='list'){if(context.request.method!=='GET')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);return reply({ok:true,reports:await listTrustedReleasedReports(context.env,identity.userId)});}
  if(context.request.method!=='POST')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);requireSameOrigin(context.request);
  const reader=context.request.body?.getReader();let raw='',size=0;const decoder=new TextDecoder();if(!reader)throw new Error('REPORT_ID_REQUIRED');
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>512){await reader.cancel();return reply({ok:false,code:'REQUEST_TOO_LARGE'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
  const body=JSON.parse(raw);if(!body||Object.keys(body).length!==1||typeof body.reportId!=='string'||!/^[a-f0-9-]{36}$/.test(body.reportId))return reply({ok:false,code:'REPORT_ID_REQUIRED'},400);
  const loaded=await loadTrustedReleasedReport(context.env,body.reportId,identity.userId);
  if(action==='grant'){const grant=await issueReleasedPrivateReportGrant(context,loaded);return reply({ok:true,expiresAt:grant.expiresAt},200,{'Set-Cookie':`${COOKIE}=${grant.token}; Path=/api/account-report-download; Secure; HttpOnly; SameSite=Strict; Max-Age=900`});}
  if(action!=='download')return reply({ok:false,code:'NOT_FOUND'},404);
  const cookies=(context.request.headers.get('cookie')||'').split(';').map(s=>s.trim());const token=cookies.find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  return await deliverReleasedPrivateReport(context,{...loaded,token});
 }catch(error){return reply({ok:false,code:error.status===503?'REPORT_STORAGE_UNAVAILABLE':'REPORT_UNAVAILABLE'},error.status===503?503:error.status===403?403:404);}
}
