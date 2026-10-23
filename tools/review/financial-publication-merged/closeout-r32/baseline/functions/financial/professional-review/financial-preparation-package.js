import {loadOwnedDraft} from '../../account/financial-will-draft-store.js';
import {runFinancialProduct} from '../product-activation/financial-product-runtime.js';
import {calculateLoan,calculateRental,calculateRentalPortfolio} from '../calculation-runtime/customer-finance-tools.js';
import {openFinancialReport} from '../holistic-planning-product/factual-report-job.js';
import {sha256Hex} from '../../document-assembly/digest.js';
import {PREPARATION_SCOPES,PREPARATION_DEPENDENCIES} from '../../professional/consent/financial-preparation-scopes.js';
export {PREPARATION_SCOPES,PREPARATION_DEPENDENCIES};
const fail=code=>{throw Object.assign(Error(code),{code,status:422});};
export function preparationDependencies(scopes){return [...new Set(scopes.flatMap(s=>PREPARATION_DEPENDENCIES[s]||[]))];}
export function validatePacketOptions(value={}){
 if(!value||Array.isArray(value)||Object.keys(value).some(k=>!['willRef','willSections','reportRef'].includes(k)))fail('PREPARATION_OPTIONS_INVALID');
 for(const ref of [value.willRef,value.reportRef?.savedDraftRef].filter(Boolean))if(Object.keys(ref).some(k=>!['sourceKind','draftId','kind','version','schemaVersion','contentDigest','ownerRef','subjectRef','savedAt','sourceRef'].includes(k)))fail('PREPARATION_SOURCE_SELECTOR_INVALID');if(value.reportRef&&Object.keys(value.reportRef).some(k=>!['jobId','grantId','savedDraftRef','language'].includes(k)))fail('PREPARATION_REPORT_SELECTOR_INVALID');
 if(value.willRef&&(!Array.isArray(value.willSections)||!value.willSections.length||new Set(value.willSections).size!==value.willSections.length||Array.from(value.willSections).some(k=>!['identity','family','executors','guardians','beneficiaries','assets','liabilities','guarantees','trusts','gifts','exclusions','digital_assets','funeral_wishes','advisors','documents','review_consent'].includes(k))))fail('PREPARATION_WILL_SELECTION_REQUIRED');
 if(value.willSections&&!value.willRef)fail('PREPARATION_WILL_REFERENCE_REQUIRED');return structuredClone(value);
}
export async function buildFinancialPreparationPackage(context,{source,scopes,packetOptions={},subjectGuard}={}){
 if(!Array.isArray(scopes)||!scopes.length||new Set(scopes).size!==scopes.length||Array.from(scopes).some(s=>!PREPARATION_SCOPES.includes(s)))fail('PREPARATION_SCOPE_INVALID');
 packetOptions=validatePacketOptions(packetOptions);const payload=source.payload,ref=source.savedDraftRef,inventory=payload.inventory||{},dependencies=preparationDependencies(scopes);
 subjectGuard?.(inventory,dependencies);
 const sections={},selected=s=>scopes.includes('preparation.'+s),put=(key,data,missing=[])=>{sections[key]={source:ref,state:missing.length?'INCOMPLETE':'PREPARED_FROM_DECLARATIONS',data,missing};};
 if(selected('needs'))put('needs',{clientQuestions:{goals:payload.goals||'',constraints:payload.constraints||'',unknowns:payload.unknowns||''},goals:inventory.goals||[],discussionScope:'CLIENT_SELECTED_GOALS_ONLY'},(inventory.goals||[]).length?[]:['CLIENT_GOALS_NOT_PROVIDED']);
 if(selected('household'))put('household',{householdDescription:payload.household||'',people:inventory.people||[],responsibilities:(inventory.goals||[]).filter(g=>g.ownerReferences?.length),rolesVerified:false},['DEPENDENCY_AND_ROLE_CONFIRMATION_REQUIRED']);
 if(selected('position')){
  const projected={asOfDate:payload.asOfDate,baseCurrency:payload.baseCurrency,inventory:Object.fromEntries(PREPARATION_DEPENDENCIES['preparation.position'].map(k=>[k,inventory[k]||[]]))};
  for(const k of ['people','assets','liabilities','incomeStreams','expenses','guarantees','policies','goals'])projected.inventory[k]??=[];projected.inventory.people=[...new Set(Object.values(projected.inventory).filter(Array.isArray).flatMap(rows=>rows.flatMap(r=>r.ownerReferences||[])))].map(personId=>({personId}));projected.inventory.disclosure=Object.fromEntries(PREPARATION_DEPENDENCIES['preparation.position'].filter(k=>inventory.disclosure?.[k]).map(k=>[k,inventory.disclosure[k]]));
  let runtime;try{runtime=await runFinancialProduct({input:projected,calculationPolicy:'CUSTOMER_NET_DEBT_V2'});}catch(e){if(e.status!==400)throw e;runtime={calculation:{metrics:{},typedMetrics:{},unavailableReason:e.message},snapshot:null};}
  put('position',{currency:payload.baseCurrency,asOfDate:payload.asOfDate,metrics:runtime.calculation.metrics,typedMetrics:runtime.calculation.typedMetrics,calculation:runtime.calculation,snapshot:runtime.snapshot,assets:inventory.assets||[],liabilities:inventory.liabilities||[]},runtime.calculation.unavailableReason?['POSITION_INPUT_REVIEW_REQUIRED']:Object.entries(runtime.calculation.metrics).filter(([,v])=>v===null).map(([k])=>'UNRESOLVED_'+k));
 }
 if(selected('scenarios')){
  const tools=payload.toolScenarios||{},data={};if(tools.loan)data.loan=calculateLoan(tools.loan);if(tools.rentalPortfolio)data.rentalPortfolio=calculateRentalPortfolio(tools.rentalPortfolio.properties);else if(tools.rental)data.rental=calculateRental(tools.rental);
  put('scenarios',{...data,modelResultsNotContractStatements:true,loanRentalNotAddedToPosition:true},Object.keys(data).length?[]:['NO_SAVED_SCENARIO']);
 }
 if(selected('policiesInvestments'))put('policiesInvestments',{policies:inventory.policies||[],investments:(inventory.assets||[]).filter(a=>['INVESTMENT','LISTED_SECURITY','UNIT_TRUST'].includes(a.type)),coverageAdequacy:'NOT_DETERMINED',nomineeNotBeneficiary:true},['INSURED_EVENTS_AND_EVIDENCE_REVIEW_REQUIRED']);
 if(selected('tax')){subjectGuard?.(inventory,['incomeStreams','expenses'],'tax_information');put('tax',{declarations:payload.jurisdictionProfile?.tax||{},incomeEvidence:inventory.incomeStreams||[],expenseEvidence:inventory.expenses||[],approvedTaxConclusion:false},['APPROVED_ASSESSMENT_YEAR_RULES_REQUIRED']);}
 if(selected('will')){
  if(!packetOptions.willRef)put('will',{sharedWishes:false},['WILL_NOT_SELECTED']);else{
   const w=await loadOwnedDraft(context,{draftId:packetOptions.willRef.draftId,version:packetOptions.willRef.version,expectedRef:packetOptions.willRef,kind:'WILL'});
   // A professional needs separately admitted estate-information consent for
   // every declared household subject before any selected Will text is projected.
   const selectedPeople=[...new Set(packetOptions.willSections.flatMap(k=>(w.payload.sections?.[k]?.items||[]).flatMap(item=>[item.personId,item.beneficiaryPersonId,item.substitutePersonId].filter(Boolean))))].map(personId=>({personId}));subjectGuard?.({people:selectedPeople},['people'],'estate_information',w.savedDraftRef.sourceRef);
   sections.will={source:w.savedDraftRef,state:'SELECTED_PREPARATION_ONLY',data:{sections:Object.fromEntries(packetOptions.willSections.map(k=>[k,w.payload.sections?.[k]??null])),legalValidity:'NOT_DETERMINED',rolesNotInferred:true},missing:['LEGAL_TEXT_AND_CASE_APPROVAL_REQUIRED']};
  }
 }
 if(selected('sources')){
  const data={financialSource:ref,reportSelected:false};if(packetOptions.reportRef){if(packetOptions.reportRef.savedDraftRef?.contentDigest!==ref.contentDigest)fail('PREPARATION_REPORT_SOURCE_MISMATCH');subjectGuard?.(inventory,Object.keys(inventory).filter(k=>Array.isArray(inventory[k])),'previous_financial_reports');const report=await openFinancialReport(context,packetOptions.reportRef);data.reportSelected=true;data.reportRef=packetOptions.reportRef;data.reportHtml=report.html;data.reportContentDigest=sha256Hex(report.html);}
  put('sources',data,data.reportSelected?[]:['OPTIONAL_AI_REPORT_NOT_SELECTED']);
 }
 if(selected('discussion'))put('discussion',{items:Object.entries(sections).flatMap(([section,s])=>s.missing.map(code=>({section,code,confirmBy:code.includes('APPROV')?'AUTHORISED_REVIEWER':'CUSTOMER_OR_PROFESSIONAL',href:'/professional/financial/#financial-information'}))),questions:['Confirm dates, ownership and evidence before relying on calculations.','Discuss unresolved responsibilities and selected goals; no product purchase is required.'],purchaseRequired:false});
 const body={contract:'FINANCIAL_PREPARATION_PACKAGE_V2',source:ref,scopes:[...scopes],packetOptions,sections,notSelected:PREPARATION_SCOPES.filter(s=>!scopes.includes(s)),authority:'CUSTOMER_DECLARATIONS_AND_OWNER_CALCULATIONS',appointmentState:'NOT_REQUESTED',shareState:'CUSTOMER_PREVIEW_ONLY',professionalReadState:'NOT_OBSERVED',externalSend:false};return {...body,packageDigest:sha256Hex(body)};
}
