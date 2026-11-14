import {ziweiPublicationRevisionEnabled,openZiweiPublicationRevision,downloadZiweiPublicationRevision,listZiweiPublicationRevisions} from '../account/ziwei-publication-revision-r1.js';
import {baziPublicationRevisionEnabled,openBaziPublicationRevision,downloadBaziPublicationRevision,listBaziPublicationRevisions} from '../account/bazi-publication-revision-r1.js';
import {requireSameOrigin} from '../account/oidc-auth.js';
import {personIdentity} from '../account/canonical-person-store.js';
import {requireP9Owner} from '../report-delivery/p9-canary-admission.js';
import {resolveMethodDeliveryAdapter,openOwnedMethodReport,listOwnedMethodReports} from '../account/method-report-delivery.js';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
export async function onRequest(context){
 try{
  personIdentity(context);
  if(!['local','qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT))requireP9Owner(context.env,personIdentity(context).userId,{allowExpired:true});
  if(context.request.method==='GET'){
   const id=new URL(context.request.url).searchParams.get('reportId');
   if(id&&new URL(context.request.url).searchParams.has('revision')){const revision=new URL(context.request.url).searchParams.get('revision');const method=(await openOwnedMethodReport(context,id)).row.method_code,ziwei=method==='ZWR';if(!['BZR','ZWR'].includes(method)||!(ziwei?ziweiPublicationRevisionEnabled(context):baziPublicationRevisionEnabled(context)))throw Object.assign(Error('REPORT_UNAVAILABLE'),{status:404});const m=await (ziwei?openZiweiPublicationRevision:openBaziPublicationRevision)(context,id,revision);if(new URL(context.request.url).searchParams.get('format')==='pdf')return await (ziwei?downloadZiweiPublicationRevision:downloadBaziPublicationRevision)(context,id,revision,new URL(context.request.url).searchParams.get('rendition')||'optimized');return new Response(m.html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; img-src 'self' data: https://assets.getphios.com https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev; style-src 'self' 'unsafe-inline'; script-src 'none'; frame-ancestors 'self'"}});}
   if(id){const material=await openOwnedMethodReport(context,id);if(new URL(context.request.url).searchParams.get('format')==='pdf'){const adapter=material.localQaAdapter||resolveMethodDeliveryAdapter(material.row.method_code);if(typeof adapter.downloadPdf!=='function')throw Object.assign(Error('REPORT_PDF_NOT_AVAILABLE'),{status:409});return await adapter.downloadPdf(context,id);}const {html}=material;if(typeof html!=='string')return Response.json({ok:true,report:{reportId:material.row.report_id,method:material.row.method_code,locale:material.row.locale,publicationVersion:material.material?.publicationVersion,pdfDownloadUrl:'/api/account-method-reports?reportId='+encodeURIComponent(material.row.report_id)+'&format=pdf'}},{headers});const download=new URL(context.request.url).searchParams.get('download')==='1';return new Response(html,{headers:{...headers,...(download?{'Content-Disposition':'attachment; filename="PHI-OS-report.html"'}:{}),'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; img-src 'self' data: https://assets.getphios.com https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"}});}
   const reports=await listOwnedMethodReports(context);if(baziPublicationRevisionEnabled(context))for(const r of reports)if(r.method==='BZR')r.publicationRevisions=await listBaziPublicationRevisions(context,r.reportId);if(ziweiPublicationRevisionEnabled(context))for(const r of reports)if(r.method==='ZWR')r.publicationRevisions=await listZiweiPublicationRevisions(context,r.reportId);return Response.json({ok:true,reports},{headers});
  }
  if(context.request.method!=='POST')return Response.json({ok:false,code:'METHOD_NOT_ALLOWED'},{status:405,headers});
  requireSameOrigin(context.request);
  const reader=context.request.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');let size=0,raw='';const decoder=new TextDecoder();
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();return Response.json({ok:false,code:'REQUEST_TOO_LARGE'},{status:413,headers});}raw+=decoder.decode(value,{stream:true});}
  raw+=decoder.decode();
  const {methodCode='ZWR',...selection}=JSON.parse(raw);
  return Response.json({ok:true,...await resolveMethodDeliveryAdapter(methodCode).generate(context,selection)},{headers,status:201});
 }catch(e){
  if(context.env?.PHIOS_ENVIRONMENT==='qa'){
   const token=v=>typeof v==='string'&&/^[A-Z0-9_:-]{1,120}$/.test(v)?v:null;
   console.warn('METHOD_REPORT_QA_FAILURE',JSON.stringify({code:token(e.code)||'METHOD_REPORT_UNAVAILABLE',sections:(e.details?.sections||[]).map(s=>({sectionId:token(s.sectionId),status:token(s.status),reasons:(s.reasons||[]).map(token).filter(Boolean),fallbackReason:token(s.fallbackReason)}))}));
  }
  return Response.json({ok:false,code:e.status===503?e.code:'METHOD_REPORT_UNAVAILABLE'},{status:e.status??403,headers});
 }
}
