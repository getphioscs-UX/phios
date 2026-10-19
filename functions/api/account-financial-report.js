import {requireSameOrigin} from '../account/oidc-auth.js';
import {grantOwner} from '../professional/consent/financial-purpose-grants.js';
import {buildFinancialReportEvidence,runFinancialReportJob,openFinancialReport} from '../financial/holistic-planning-product/factual-report-job.js';
import {FINANCE_PUBLICATION_VERSION,compileFinancePublication} from '../financial/holistic-planning-product/report-publication-v2.js';
export async function onRequestGet(context){try{const owner=grantOwner(context);const rows=await context.env.RUNTIME_DB.prepare("SELECT value_json FROM report_generation_state WHERE state_key='FINANCE_JOB' AND json_extract(value_json,'$.source.ownerRef')=? ORDER BY updated_at DESC LIMIT 100").bind(owner).all();const reports=(rows.results||[]).map(row=>JSON.parse(row.value_json)).map(j=>({jobId:j.jobId,state:j.state,language:j.language,savedDraftRef:j.source,grantId:j.grantId,synthetic:j.synthetic===true}));return Response.json({ok:true,reports},{headers:{'cache-control':'private, no-store'}});}catch(e){return Response.json({ok:false,code:e.code||'FINANCIAL_REPORT_LIST_UNAVAILABLE'},{status:e.status||503,headers:{'cache-control':'private, no-store'}});}}
export async function onRequestPost(context){try{
 requireSameOrigin(context.request);grantOwner(context);const raw=await context.request.text();if(raw.length>20000)throw Error('REQUEST_TOO_LARGE');const body=JSON.parse(raw);
 if(body.action==='open'){const result=await openFinancialReport(context,body);return new Response(result.html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'",'x-content-type-options':'nosniff'}});}
 if(body.action==='preview'){
  const evidence=await buildFinancialReportEvidence(context,body),publication=compileFinancePublication(evidence);
  return Response.json({ok:true,publicationVersion:FINANCE_PUBLICATION_VERSION,savedDraftRef:evidence.source,providerCalls:0,price:{currency:'MYR',amountMinor:6900,bilingual:true,includedFollowups:4},chapters:publication.pages.map(page=>({page:page.page,title:page.title,status:['cover','sources'].includes(page.key)?'COMMON_CONTENT':page.values.some(v=>v.value!==null)||page.records.some(r=>r.status==='SELF_REPORTED')?'SAVED_FACTS_AVAILABLE':'DETAILS_REQUIRED',missingMetrics:page.values.filter(v=>v.value===null).map(v=>v.label),questions:page.questions}))},{headers:{'cache-control':'private, no-store'}});
 }
 if(body.action!=='prepare')throw Error('ACTION_INVALID');
 const result=await runFinancialReportJob(context,{savedDraftRef:body.savedDraftRef,grantId:body.grantId,language:body.language,publicationVersion:body.publicationVersion||FINANCE_PUBLICATION_VERSION},{synthetic:context.env.PHIOS_ENVIRONMENT==='local-test'});
 return Response.json({ok:result.state!=='BLOCKED',...result},{status:result.state==='BLOCKED'?409:200,headers:{'cache-control':'private, no-store'}});
 }catch(e){return Response.json({ok:false,code:e.code||e.message||'FINANCE_REPORT_FAILED'},{status:e.status||422,headers:{'cache-control':'private, no-store'}});}}
