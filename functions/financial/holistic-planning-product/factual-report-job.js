import {loadOwnedDraft} from '../../account/financial-will-draft-store.js';
import {requireFinancialGrant,grantOwner} from '../../professional/consent/financial-purpose-grants.js';
import {runFinancialProduct} from '../product-activation/financial-product-runtime.js';
import {calculateLoan,calculateRental,calculateRentalPortfolio} from '../calculation-runtime/customer-finance-tools.js';
import {sha256Hex} from '../../document-assembly/digest.js';
import {createReportGenerationStore} from '../../personal-reading/report-generation-store.js';
import {createCustomerReportArtifact} from '../../report-delivery/customer-report-artifact.js';
import {persistCustomerArtifactInHeldStore,createCustomerArtifactStore} from '../../report-delivery/customer-artifact-store.js';
import {syntheticFactualCandidate,validateFactualCandidate,compileFactualNarrative,factualNarrativeReference} from './factual-report-narrative.js';
import {assembleReport,createReportCandidate,reviewReportCandidate,approveReportCandidate,buildCanonicalReport} from '../../../scripts/lib/customer-report-runtime/report-runtime-v2.mjs';
import {FINANCE_PUBLICATION_VERSION,FINANCE_LAYOUT_VERSION,compileFinancePublication,renderFinancePublication} from './report-publication-v2.js';
import {FINANCE_R3_VERSION,FINANCE_R3_LAYOUT} from './publication-r3-contract.js';
import {compileFinancialPublicationR3,prepareFinancialR3Deepening} from './publication-r3-projection.js';
import {renderFinancialPublicationR3} from './publication-r3-renderer.js';
import {loadFinancialR3Assets} from './publication-r3-assets.js';
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function buildFinancialReportEvidence(context,{savedDraftRef,grantId,language}){
 if(!['en','zh-Hans'].includes(language)||!Number.isInteger(savedDraftRef?.version))fail('FINANCE_REPORT_SCOPE_INVALID');
 await requireFinancialGrant(context,{grantId,source:savedDraftRef,purpose:'REPORT',language,scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions']});
 const source=await loadOwnedDraft(context,{draftId:savedDraftRef.draftId,version:savedDraftRef.version,expectedRef:savedDraftRef,kind:'FINANCIAL'});
 const response=await context.env.ASSETS.fetch(new Request(new URL('/content/financial/analysis-runtime/policies/financial-analysis-policy-set-base-v1.json',context.request.url)));if(!response.ok)fail('FAR_POLICY_UNAVAILABLE');
 const runtime=await runFinancialProduct({input:source.payload,calculationPolicy:'CUSTOMER_NET_DEBT_V2',includeOwnerEvidence:true,analysisPolicySet:await response.json()});
 const scenarios=Object.fromEntries(Object.entries(source.payload.toolScenarios||{}).filter(([kind])=>kind!=='rental'||!source.payload.toolScenarios.rentalPortfolio).map(([kind,input])=>[kind,kind==='rentalPortfolio'?calculateRentalPortfolio(input.properties):(kind==='loan'?calculateLoan:calculateRental)(input)]));
 const body={schemaVersion:'FINANCIAL_REPORT_EVIDENCE_V1',source:source.savedDraftRef,currency:source.payload.baseCurrency,asOfDate:source.payload.asOfDate,snapshot:runtime.snapshot,ownerEvidence:runtime.ownerEvidence,calculationDigest:runtime.calculation.resultDigest,metrics:runtime.calculation.metrics,typedMetrics:runtime.calculation.typedMetrics,scenarios,findings:runtime.findings,unknowns:runtime.scenario,language,serviceScope:'FACTUAL_ONLY',registryVersions:{contract:'FINANCE-PREPARATION-R1',math:'MINOR_UNIT_HALF_UP_v1'}};
 return {...body,evidenceDigest:sha256Hex(body)};
}
function reportBinding(owner,id,environment){return {environment,ownerAccountId:owner,orderId:`NONCOMMERCIAL_PREPARATION:${id}`,reportId:id,productId:'FINANCIAL_FACTUAL_R1'};}
export async function runFinancialReportJob(context,request,{synthetic=false,renderFailure=false}={}){
 const local=synthetic&&context.env.PHIOS_ENVIRONMENT==='local-test',publicationR3=request.publicationVersion===FINANCE_R3_VERSION,freeR3=publicationR3&&request.reportTier==='FREE';
 // This release does not admit a real financial provider, budget or sale.
 if(!local&&!freeR3)return {state:'BLOCKED',code:'FINANCE_PROVIDER_BUDGET_AND_PUBLICATION_NOT_AUTHORIZED',providerCalls:0,costUSD:0};
 if(request.publicationVersion&&![FINANCE_PUBLICATION_VERSION,FINANCE_R3_VERSION].includes(request.publicationVersion))fail('FINANCE_PUBLICATION_VERSION_INVALID');
 if(publicationR3&&request.reportTier&&!['FREE','PAID'].includes(request.reportTier))fail('FINANCE_REPORT_TIER_INVALID');
 const publicationV2=request.publicationVersion===FINANCE_PUBLICATION_VERSION;
 const evidence=await buildFinancialReportEvidence(context,request),owner=grantOwner(context),jobId='finance_'+sha256Hex({owner,source:evidence.source,grantId:request.grantId,language:request.language,evidenceDigest:evidence.evidenceDigest,...(publicationV2?{publicationVersion:FINANCE_PUBLICATION_VERSION}:{}),...(publicationR3?{publicationVersion:FINANCE_R3_VERSION,reportTier:freeR3?'FREE':'PAID',environment:local?'QA':'LIVE'}:{})}).slice(0,32),binding=reportBinding(owner,jobId,local?'QA':'LIVE');
 const state=await createReportGenerationStore(context.env,binding,{scope:'delivery'});
 return state.withLock('finance-job',async()=>{
  let job=await state.get('FINANCE_JOB');if(job?.state==='DISPATCHED_OUTCOME_UNKNOWN')fail('FINANCE_PROVIDER_RECONCILIATION_REQUIRED');
  if(job?.state==='DISPATCHED')fail('FINANCE_PROVIDER_OUTCOME_UNKNOWN_NO_RETRY');
  if(!job){job={jobId,state:'PREPARED',evidenceDigest:evidence.evidenceDigest,source:evidence.source,grantId:request.grantId,language:request.language,history:['PREPARED'],synthetic:local,providerCalls:0,...(publicationR3?{publicationVersion:FINANCE_R3_VERSION,reportTier:freeR3?'FREE':'PAID'}:{})};await state.put('FINANCE_JOB',job);}
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
  const publication=publicationR3?compileFinancialPublicationR3(evidence,{tier:freeR3?'FREE':'PAID',language:request.language}):publicationV2?compileFinancePublication(evidence,request.language):null;
  const html=publicationR3?renderFinancialPublicationR3(publication,{synthetic:local,assets:await loadFinancialR3Assets(context)}):publicationV2?renderFinancePublication(publication,{synthetic:true}):`<!doctype html><html lang="${esc(request.language)}"><meta charset="utf-8"><title>Financial information report</title><style>body{font:16px/1.6 system-ui;max-width:900px;margin:auto;padding:24px;overflow-wrap:anywhere}section{break-inside:avoid}h1{font-size:26px}h2{font-size:20px}footer{font-size:10px;line-height:1.3;overflow-wrap:anywhere;break-inside:avoid}@page{size:A4;margin:18mm}@media print{body{padding:0;font-size:14px;line-height:1.5}h2{font-size:18px;margin:16px 0 8px}p{margin:8px 0}section{orphans:3;widows:3}}</style><main><p>LOCAL SYNTHETIC REVIEW — NOT A PAID OR PROFESSIONAL REPORT / 本地合成审核</p><h1>Financial information / 财务资料</h1>${narrative.sections.map(s=>`<section><h2>${esc(s.title)}</h2>${s.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</section>`).join('')}<footer>${request.language==="zh-Hans"?"保存财务版本":"Saved financial version"} ${esc(evidence.source.version)} · ${esc(evidence.asOfDate)} · ${esc(evidence.source.contentDigest)}</footer></main></html>`;
  const htmlKey=`financial-artifacts/${jobId}/${publicationR3?publication.contentDigest:narrative.contentDigest}.html`;await context.env.PRIVATE_REPORTS.put(htmlKey,html);await advance('RENDERED');
  const artifact=await createCustomerReportArtifact({reportArtifactId:jobId,customerId:owner,personId:evidence.source.subjectRef,methodCode:'FINANCIAL_FACTUAL',productCode:'FINANCIAL_FACTUAL_R1',entitlementId:freeR3?'FREE_SAVED_VERSION_NO_PURCHASE':'QA_NONCOMMERCIAL_NO_ENTITLEMENT',inputDigest:evidence.source.contentDigest,authorityPackVersion:'FINANCIAL-NARRATIVE-SOURCE-R1',reportContentVersion:publicationR3?FINANCE_R3_VERSION:publicationV2?FINANCE_PUBLICATION_VERSION:'1.0.0',rendererVersion:publicationR3?FINANCE_R3_LAYOUT:publicationV2?FINANCE_LAYOUT_VERSION:'FINANCE_HTML_v1.1.0',inputSnapshot:evidence.source,calculationSnapshot:evidence,publicationIR:{report,narrative,...(publication?{publication}:{}),...(publicationR3&&!freeR3?{deepening:prepareFinancialR3Deepening(publication)}:{})},generatedSections:publication?publication.pages:narrative.sections,htmlSnapshotOrRenderState:{objectKey:htmlKey}});
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
