import {loadOwnedDraft} from '../../account/financial-will-draft-store.js';
import {requireFinancialGrant,grantOwner} from '../../professional/consent/financial-purpose-grants.js';
import {runFinancialProduct} from '../product-activation/financial-product-runtime.js';
import {calculateLoan,calculateRental} from '../calculation-runtime/customer-finance-tools.js';
import {sha256Hex} from '../../document-assembly/digest.js';
import {createReportGenerationStore} from '../../personal-reading/report-generation-store.js';
import {createCustomerReportArtifact} from '../../report-delivery/customer-report-artifact.js';
import {persistCustomerArtifactInHeldStore,createCustomerArtifactStore} from '../../report-delivery/customer-artifact-store.js';
import {syntheticFactualCandidate,validateFactualCandidate,compileFactualNarrative,factualNarrativeReference} from './factual-report-narrative.js';
import {assembleReport,createReportCandidate,reviewReportCandidate,approveReportCandidate,buildCanonicalReport} from '../../../scripts/lib/customer-report-runtime/report-runtime-v2.mjs';
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function buildFinancialReportEvidence(context,{savedDraftRef,grantId,language}){
 if(!['en','zh-Hans'].includes(language)||!Number.isInteger(savedDraftRef?.version))fail('FINANCE_REPORT_SCOPE_INVALID');
 await requireFinancialGrant(context,{grantId,source:savedDraftRef,purpose:'REPORT',language,scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions']});
 const source=await loadOwnedDraft(context,{draftId:savedDraftRef.draftId,version:savedDraftRef.version,expectedRef:savedDraftRef,kind:'FINANCIAL'});
 const response=await context.env.ASSETS.fetch(new Request(new URL('/content/financial/analysis-runtime/policies/financial-analysis-policy-set-base-v1.json',context.request.url)));if(!response.ok)fail('FAR_POLICY_UNAVAILABLE');
 const runtime=await runFinancialProduct({input:source.payload,calculationPolicy:'CUSTOMER_NET_DEBT_V2',includeOwnerEvidence:true,analysisPolicySet:await response.json()});
 const scenarios=Object.fromEntries(Object.entries(source.payload.toolScenarios||{}).map(([kind,input])=>[kind,(kind==='loan'?calculateLoan:calculateRental)(input)]));
 const body={schemaVersion:'FINANCIAL_REPORT_EVIDENCE_V1',source:source.savedDraftRef,currency:source.payload.baseCurrency,asOfDate:source.payload.asOfDate,snapshot:runtime.snapshot,ownerEvidence:runtime.ownerEvidence,calculationDigest:runtime.calculation.resultDigest,metrics:runtime.calculation.metrics,typedMetrics:runtime.calculation.typedMetrics,scenarios,findings:runtime.findings,unknowns:runtime.scenario,language,serviceScope:'FACTUAL_ONLY',registryVersions:{contract:'FINANCE-PREPARATION-R1',math:'MINOR_UNIT_HALF_UP_v1'}};
 return {...body,evidenceDigest:sha256Hex(body)};
}
function reportBinding(owner,id,environment){return {environment,ownerAccountId:owner,orderId:`NONCOMMERCIAL_PREPARATION:${id}`,reportId:id,productId:'FINANCIAL_FACTUAL_R1'};}
export async function runFinancialReportJob(context,request,{synthetic=false,renderFailure=false}={}){
 const local=synthetic&&context.env.PHIOS_ENVIRONMENT==='local-test';
 // This release does not admit a real financial provider, budget or sale.
 if(!local)return {state:'BLOCKED',code:'FINANCE_PROVIDER_BUDGET_AND_PUBLICATION_NOT_AUTHORIZED',providerCalls:0,costUSD:0};
 const evidence=await buildFinancialReportEvidence(context,request),owner=grantOwner(context),jobId='finance_'+sha256Hex({owner,source:evidence.source,grantId:request.grantId,language:request.language,evidenceDigest:evidence.evidenceDigest}).slice(0,32),binding=reportBinding(owner,jobId,'QA');
 const state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 return state.withLock('finance-job',async()=>{
  let job=await state.get('FINANCE_JOB');if(job?.state==='DISPATCHED_OUTCOME_UNKNOWN')fail('FINANCE_PROVIDER_RECONCILIATION_REQUIRED');
  if(job?.state==='DISPATCHED')fail('FINANCE_PROVIDER_OUTCOME_UNKNOWN_NO_RETRY');
  if(!job){job={jobId,state:'PREPARED',evidenceDigest:evidence.evidenceDigest,source:evidence.source,grantId:request.grantId,language:request.language,history:['PREPARED'],synthetic:true,providerCalls:0};await state.put('FINANCE_JOB',job);}
  if(job.evidenceDigest!==evidence.evidenceDigest)fail('FINANCE_JOB_EVIDENCE_DRIFT');
  const advance=async next=>{job={...job,state:next,history:[...job.history,next]};await state.put('FINANCE_JOB',job);};
  const authorize=()=>requireFinancialGrant(context,{grantId:request.grantId,source:evidence.source,purpose:'REPORT',language:request.language,scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions']});
  if(job.state==='ACCOUNT_AVAILABLE'){await authorize();return {...job,cacheHit:true};}
  let candidateRef=await state.get('FINANCE_CANDIDATE');
  if(!candidateRef){
   await authorize();await advance('QUEUED');await advance('DISPATCHED');
   const candidate=syntheticFactualCandidate(evidence,request.language),key=`financial-candidates/${jobId}/${sha256Hex(candidate)}.json`;
   // A production dispatcher must reconcile an uncertain outcome before retry.
   await context.env.PRIVATE_REPORTS.put(key,JSON.stringify(candidate));candidateRef={key,digest:sha256Hex(candidate)};await state.putIfAbsent('FINANCE_CANDIDATE',candidateRef);await advance('CANDIDATE_STORED');
  }
  const object=await context.env.PRIVATE_REPORTS.get(candidateRef.key);if(!object)fail('FINANCE_CANDIDATE_MISSING');const candidate=JSON.parse(await object.text());if(sha256Hex(candidate)!==candidateRef.digest)fail('FINANCE_CANDIDATE_DIGEST_MISMATCH');
  try{validateFactualCandidate(candidate,evidence);}catch(e){await advance('VALIDATION_FAILED');throw e;}await advance('VALIDATED');
  const narrative=compileFactualNarrative(candidate,evidence);await advance('COMPILED');
  const source=factualNarrativeReference(narrative),registry={sections:[{sectionCode:'FINANCIAL_NARRATIVE',acceptedDataTypes:['FINANCIAL_NARRATIVE_RECORD'],acceptedAuthorities:['HFP_FINANCIAL_NARRATIVE']}]};
  const assembly=assembleReport({reportCode:jobId,case:evidence.source.sourceRef,customer:owner,locale:request.language,serviceContract:{reference:'FINANCIAL-NARRATIVE-SOURCE-R1',requiredSectionTypes:['FINANCIAL_NARRATIVE'],optionalSectionTypes:[],allowedLocales:['en','zh-Hans'],allowedChannels:['HTML','PDF','WORKSPACE'],requiresConsent:true},consentReferences:[request.grantId],sections:[{sectionCode:'FINANCIAL_NARRATIVE',sourceReferences:[source]}]},registry);
  const rrCandidate=createReportCandidate(assembly),review=reviewReportCandidate(assembly,rrCandidate),approval=approveReportCandidate(assembly,rrCandidate,review),report=buildCanonicalReport(assembly,rrCandidate,review,approval);
  if(renderFailure){await advance('RETRYABLE');return {...job,code:'SYNTHETIC_RENDER_FAILURE_CANDIDATE_RETAINED'};}
  const html=`<!doctype html><html lang="${esc(request.language)}"><meta charset="utf-8"><title>Financial information report</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:auto;padding:24px;overflow-wrap:anywhere}section{break-inside:avoid}h1{font-size:26px}h2{font-size:20px}footer{font-size:10px;line-height:1.3;overflow-wrap:anywhere;break-inside:avoid}@page{size:A4;margin:18mm}@media print{body{padding:0;font-size:14px;line-height:1.5}h2{font-size:18px;margin:16px 0 8px}p{margin:8px 0}section{orphans:3;widows:3}}</style><main><p>LOCAL SYNTHETIC REVIEW — NOT A PAID OR PROFESSIONAL REPORT / 本地合成审核</p><h1>Financial information / 财务资料</h1>${narrative.sections.map(s=>`<section><h2>${esc(s.title)}</h2>${s.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</section>`).join('')}<footer>${request.language==="zh-Hans"?"保存财务版本":"Saved financial version"} ${esc(evidence.source.version)} · ${esc(evidence.asOfDate)} · ${esc(evidence.source.contentDigest)}</footer></main></html>`;
  const htmlKey=`financial-artifacts/${jobId}/${narrative.contentDigest}.html`;await context.env.PRIVATE_REPORTS.put(htmlKey,html);await advance('RENDERED');
  const artifact=await createCustomerReportArtifact({reportArtifactId:jobId,customerId:owner,personId:evidence.source.subjectRef,methodCode:'FINANCIAL_FACTUAL',productCode:'FINANCIAL_FACTUAL_R1',entitlementId:'QA_NONCOMMERCIAL_NO_ENTITLEMENT',inputDigest:evidence.source.contentDigest,authorityPackVersion:'FINANCIAL-NARRATIVE-SOURCE-R1',reportContentVersion:'1.0.0',rendererVersion:'FINANCE_HTML_v1.1.0',inputSnapshot:evidence.source,calculationSnapshot:evidence,publicationIR:{report,narrative},generatedSections:narrative.sections,htmlSnapshotOrRenderState:{objectKey:htmlKey}});
  await authorize();await persistCustomerArtifactInHeldStore(context.env,binding,state,artifact);await advance('ARTIFACT_SAVED');await advance('ACCOUNT_AVAILABLE');return {...job,artifactDigest:artifact.artifactDigest,contentDigest:narrative.contentDigest,cacheHit:false};
 });
}
export async function openFinancialReport(context,{jobId,grantId,savedDraftRef,language}){
 const owner=grantOwner(context);await requireFinancialGrant(context,{grantId,source:savedDraftRef,purpose:'REPORT',language,scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions']});
 await loadOwnedDraft(context,{draftId:savedDraftRef.draftId,version:savedDraftRef.version,expectedRef:savedDraftRef,kind:'FINANCIAL'});
 const binding=reportBinding(owner,jobId,context.env.PHIOS_ENVIRONMENT==='local-test'?'QA':'LIVE'),state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 const job=await state.inspectState('FINANCE_JOB');if(!job||job.grantId!==grantId||job.source.contentDigest!==savedDraftRef.contentDigest||job.state!=='ACCOUNT_AVAILABLE')fail('FINANCE_REPORT_UNAVAILABLE');
 const store=await createCustomerArtifactStore(context.env,binding),{artifact}=await store.open();const object=await context.env.PRIVATE_REPORTS.get(artifact.htmlSnapshotOrRenderState.objectKey);if(!object)fail('FINANCE_RENDER_MISSING_REPAIR_REQUIRED');return {artifact,html:await object.text(),providerCalls:0};
}
