import {minor,money} from '../calculation-runtime/customer-finance-tools.js';
// Opt-in metadata on the existing encrypted FW v2 draft. No second ledger.
const fields={assets:['ref','cost','costState','valuationDate','maturityDate','access','sharePct','valueBasis','costBasis','rate','rateDate'],income:['ref','personRef','deduction','deductionState','internalTransfer'],expenses:['ref','personRef','classification','paymentState','internalTransfer'],policies:['ref','policyRef','insuredRef','holderRef','payerRef','event','coverage','coverageState','premium','premiumState','frequency','expiryDate','nominationState'],goals:['ref','priorityRank','importanceScore','scoreScale'],scenarios:['ref','expenseRef','after','afterState','author','accepted','basedOnVersion'],tax:['ref','year','country','residency','incomeEvidence','paidTaxEvidence'],documents:['ref','kind','state'],appendices:[]};
const enums={costState:['EXACT','APPROXIMATE','RANGE','UNKNOWN'],coverageState:['EXACT','APPROXIMATE','RANGE','UNKNOWN'],premiumState:['EXACT','APPROXIMATE','RANGE','UNKNOWN'],deductionState:['EXACT','APPROXIMATE','RANGE','UNKNOWN'],afterState:['EXACT','APPROXIMATE','UNKNOWN'],access:['IMMEDIATE','RESTRICTED','MATURITY','UNKNOWN'],valueBasis:['OWNED_INTEREST','FULL_ASSET','UNKNOWN'],costBasis:['OWNED_INTEREST','FULL_ASSET','UNKNOWN'],classification:['DECLARED_ESSENTIAL','DECLARED_ADJUSTABLE','UNCLASSIFIED'],paymentState:['PAID','UNPAID','UNKNOWN'],event:['DEATH','TPD','CRITICAL_ILLNESS','MEDICAL','INCOME','MORTGAGE','UNKNOWN'],frequency:['MONTHLY','ANNUAL','ONCE','UNKNOWN'],nominationState:['DECLARED','DOCUMENT_SUPPORTED','UNKNOWN'],author:['CUSTOMER_DECLARED','SYNTHETIC_TEST'],state:['DECLARED','DOCUMENT_SUPPORTED','UNKNOWN','NOT_APPLICABLE','OUT_OF_DATE']};
const numeric=new Set(['cost','coverage','premium','deduction','after','sharePct','rate','priorityRank','importanceScore','scoreScale','basedOnVersion','year']);
export const APPENDIX_IDS=['BANK','INVESTMENTS','PROPERTY','LOANS','POLICIES','CASHFLOW','GOALS','SCENARIOS','TAX','RATIOS','RENTAL','SOURCES'].map(x=>'FIN-A-'+x);
export function validatePublicationFacts(value){
 const fail=()=>{throw Object.assign(Error('FINANCE_PUBLICATION_FACTS_INVALID'),{code:'FINANCE_PUBLICATION_FACTS_INVALID',status:422});};
 if(!value||Array.isArray(value)||value.schemaVersion!=='FINANCE_PUBLICATION_FACTS_V1'||Object.keys(value).some(k=>k!=='schemaVersion'&&!fields[k]))fail();
 for(const [group,rows] of Object.entries(value)){if(group==='schemaVersion')continue;if(!Array.isArray(rows)||rows.length>100)fail();if(group==='appendices'){if(rows.some(x=>!APPENDIX_IDS.includes(x))||new Set(rows).size!==rows.length)fail();continue;}
  const refs=new Set();for(const row of rows){if(!row||Array.isArray(row)||!/^[-\w]{1,80}$/.test(row.ref)||refs.has(row.ref)||Object.keys(row).some(k=>!fields[group].includes(k)))fail();refs.add(row.ref);for(const [key,v] of Object.entries(row)){if(enums[key]&&!enums[key].includes(v))fail();else if(numeric.has(key)&&(!(typeof v==='number'&&Number.isFinite(v)&&v>=0)||key==='sharePct'&&v>100))fail();else if(['accepted','internalTransfer','incomeEvidence','paidTaxEvidence'].includes(key)&&typeof v!=='boolean')fail();else if(!numeric.has(key)&&!enums[key]&&!['accepted','internalTransfer','incomeEvidence','paidTaxEvidence'].includes(key)&&(typeof v!=='string'||v.length>80||!/^[-\w .]*$/.test(v)))fail();}
   if(group==='goals'&&(row.priorityRank!==undefined&&(!Number.isInteger(row.priorityRank)||row.priorityRank<1)||row.scoreScale!==undefined&&row.scoreScale<=0||row.importanceScore!==undefined&&row.scoreScale!==undefined&&row.importanceScore>row.scoreScale))fail();
  }
 }
 return structuredClone(value);
}
export function validatePublicationReferences(meta,inv){
 const fail=()=>{throw Object.assign(Error('FINANCE_PUBLICATION_REFERENCE_INVALID'),{code:'FINANCE_PUBLICATION_REFERENCE_INVALID',status:422});};
 const ids=(group,key)=>(inv[group]||[]).map((r,i)=>r[key]||r.recordId||`${group}-${i+1}`),assets=ids('assets','assetId'),goals=ids('goals','goalId'),policies=ids('policies','policyId'),people=(inv.people||[]).map(p=>p.personId);
 for(const group of ['assets','goals','income','expenses'])for(const r of meta[group]||[]){const valid=group==='assets'?assets:group==='goals'?goals:ids(group==='income'?'incomeStreams':'expenses','recordId');if(!valid.includes(r.ref))fail();if(r.personRef&&!people.includes(r.personRef))fail();for(const key of ['valuationDate','maturityDate','rateDate'])if(r[key]&&(!/^\d{4}-\d{2}-\d{2}$/.test(r[key])||!Number.isFinite(Date.parse(r[key]))||new Date(r[key]).toISOString().slice(0,10)!==r[key]))fail();}
 for(const r of meta.policies||[])if(!policies.includes(r.policyRef)||[r.insuredRef,r.holderRef,r.payerRef].some(id=>!people.includes(id)))fail();
 for(const r of meta.scenarios||[])if(!ids('expenses','recordId').includes(r.expenseRef))fail();
}
// Consent claims inside a client draft are never authority. Other adults remain
// suppressed until the existing account person-use owner supplies admission.
export function r31Source(payload,{admittedSubjectIds=[]}={}){
 const result=structuredClone(payload),inv=result.inventory,meta=result.publicationFacts||{schemaVersion:'FINANCE_PUBLICATION_FACTS_V1'};
 if(!inv)return {payload:result,hiddenSubjectCount:0,allowedSubjectIds:['P1']};
 inv.people=inv.people.map((p,i)=>({...p,personId:p.personId||`P${i+1}`}));
 const self=inv.people[0]?.personId||'P1',allowed=new Set([self,...admittedSubjectIds]);
 const flowOverrides=[];
 const hidden=new Set(inv.people.filter(p=>!allowed.has(p.personId)).map(p=>p.personId));
 const unknown=row=>({...row,value:undefined,min:undefined,max:undefined,representation:'UNKNOWN',disclosureState:'NOT_YET_PROVIDED'});
 inv.people=inv.people.filter(p=>allowed.has(p.personId));
 inv.policies=inv.policies.map(row=>{const roles=(meta.policies||[]).filter(r=>r.policyRef===row.policyId);return roles.length&&roles.every(r=>allowed.has(r.holderRef)&&allowed.has(r.insuredRef)&&allowed.has(r.payerRef))?row:unknown(row);});
 for(const group of ['assets','liabilities','incomeStreams','expenses','guarantees'])inv[group]=inv[group].map((row,i)=>{
  const annotation=(meta[group==='incomeStreams'?'income':group]||[]).find(m=>m.ref===(row.assetId||row.liabilityId||row.recordId||`${group}-${i+1}`));
  const blocked=(row.ownerReferences||[]).some(id=>hidden.has(id))||hidden.has(annotation?.personRef);
  let out=blocked?unknown(row):{...row};if(blocked){out.ownerReferences=[];out.label='';if(out.repayment)out.repayment=unknown(out.repayment);}
  if(group==='expenses'&&!blocked&&(annotation?.paymentState!=='PAID'||annotation?.internalTransfer)){flowOverrides.push({id:`expenses-${i+1}`,sourceValue:row.representation==='RANGE'?{min:row.min,max:row.max}:row.value??null,sourceKind:row.representation||'UNKNOWN',paymentState:annotation?.paymentState||'UNKNOWN'});if(annotation?.paymentState!=='UNPAID'&&!annotation?.internalTransfer)out=unknown(out);}
  if(group==='assets'&&row.ownershipMode!=='SOLE'&&annotation?.valueBasis!=='OWNED_INTEREST')out=unknown(out);
  if(group==='assets'&&(annotation?.valuationDate||row.valuationDate)&&(annotation?.valuationDate||row.valuationDate)!==payload.asOfDate)out=unknown(out);
  if(group==='assets'&&blocked&&annotation)for(const key of Object.keys(annotation))if(key!=='ref')delete annotation[key];
  if(['incomeStreams','expenses'].includes(group)&&annotation?.internalTransfer){out={...out,value:0,representation:'EXACT',disclosureState:'SELF_REPORTED',...(group==='incomeStreams'?{grossOrNet:'NET'}:{})};}
  if(group==='expenses'&&annotation?.paymentState==='UNPAID')out={...out,value:0,representation:'EXACT',disclosureState:'SELF_REPORTED'};
  if(group==='incomeStreams'&&!blocked&&!annotation?.internalTransfer&&row.grossOrNet==='GROSS'&&typeof row.value==='number'&&['EXACT','APPROXIMATE'].includes(row.representation)&&['EXACT','APPROXIMATE'].includes(annotation?.deductionState)&&typeof annotation.deduction==='number'&&annotation.deduction<=row.value){out.value=Number(money(minor(String(row.value))-minor(String(annotation.deduction))));out.grossOrNet='NET';if(annotation.deductionState==='APPROXIMATE')out.representation='APPROXIMATE';}
  return out;
 });
 for(const row of inv.policies)if(row.currency&&row.currency!==payload.baseCurrency)for(const event of meta.policies||[])if(event.policyRef===row.policyId){event.coverageState='UNKNOWN';event.premiumState='UNKNOWN';delete event.coverage;delete event.premium;}
 result.publicationFacts=meta;return {payload:result,hiddenSubjectCount:hidden.size,allowedSubjectIds:[...allowed],flowOverrides};
}
