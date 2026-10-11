import {requireSameOrigin} from '../account/oidc-auth.js';
import {evaluatePaidReportReadiness,readPaidReportReadiness,customerReportSetup} from '../report-delivery/paid-report-readiness.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function onRequest(context){try{
 if(context.request.method==='GET')return Response.json({ok:true,setup:await readPaidReportReadiness(context,new URL(context.request.url).searchParams.get('id'))},{headers});
 if(context.request.method!=='POST')return Response.json({ok:false},{status:405,headers});requireSameOrigin(context.request);
 const raw=await context.request.text();if(raw.length>2048)throw Object.assign(Error('REQUEST_TOO_LARGE'),{status:413});const body=JSON.parse(raw);
 if(Object.keys(body).some(k=>!['methodCode','personId','presentation','readinessId'].includes(k)))throw Object.assign(Error('REPORT_SETUP_INPUT_INVALID'),{status:422});
 const r=await evaluatePaidReportReadiness(context,body);return Response.json({ok:true,setup:customerReportSetup(r)},{headers});
 }catch(error){return Response.json({ok:false,message:'Your report setup could not be opened. Please sign in and check your selected details.'},{status:error.status||409,headers});}}
