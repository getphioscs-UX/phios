import {sha256} from '../calculation-runtime/stable-digest.js';

// An ephemeral intake adapter. Financial arithmetic remains exclusively in FCR.
const states=new Set(['SELF_REPORTED','UNKNOWN','NOT_YET_PROVIDED','DECLINED_TO_PROVIDE','NOT_APPLICABLE']);
const representations=new Set(['EXACT','APPROXIMATE','RANGE','UNKNOWN','NOT_APPLICABLE']);
const assets=new Set(['SAFE_DEPOSIT','BANK_ACCOUNT','CASH','FIXED_DEPOSIT','PROPERTY','INSURANCE','UNIT_TRUST','LISTED_SECURITY','PRIVATE_COMPANY_SHARE','BUSINESS_INTEREST','EPF','PRS','VEHICLE','DIGITAL_ASSET','INTELLECTUAL_PROPERTY','OTHER']);
const clean=v=>typeof v==='string'?v.trim().slice(0,600):'';
const list=v=>Array.isArray(v)?v:[];
function fail(message){throw Object.assign(new TypeError(message),{status:400});}
function number(v){if(v===''||v==null)return null;if(!['number','string'].includes(typeof v))fail('INVALID_INVENTORY_AMOUNT');const n=Number(v);if(!Number.isFinite(n)||n<0)fail('INVALID_INVENTORY_AMOUNT');return n;}
function evidence(date,documentReference=null){return {evidenceType:'SELF_DECLARATION',source:'CUSTOMER_FINANCIAL_INVENTORY',verifiedAt:null,effectiveDate:date,documentReference:clean(documentReference)||null,confidence:null};}
function fact(id,code,row,date){
 const disclosureState=states.has(row.disclosureState)?row.disclosureState:'NOT_YET_PROVIDED';
 const valueRepresentation=representations.has(row.representation)?row.representation:'UNKNOWN';
 let value=null;
 if(disclosureState==='SELF_REPORTED'){
  if(valueRepresentation==='RANGE'){const min=number(row.min),max=number(row.max);if(min===null||max===null||min>max)fail('INVALID_INVENTORY_RANGE');value={min,max};}
  else if(['EXACT','APPROXIMATE'].includes(valueRepresentation)){value=number(row.value);if(value===null)fail('INVENTORY_AMOUNT_REQUIRED');}
 }
 return {factId:id,factCode:code,value,valueRepresentation,disclosureState,evidence:evidence(date,row.documentReference),effectiveDate:date,recordedAt:`${date}T00:00:00Z`};
}
function unknownRow(){return {disclosureState:'NOT_YET_PROVIDED',representation:'UNKNOWN'};}
function currency(value,base){const v=clean(value)||base;if(!/^[A-Z]{3}$/.test(v))fail('INVALID_INVENTORY_CURRENCY');return v;}

export async function buildCustomerInventorySnapshot(input={}){
 const inv=input.inventory;if(!inv||typeof inv!=='object')fail('INVENTORY_REQUIRED');
 const date=clean(input.asOfDate);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)fail('INVENTORY_DATE_REQUIRED');
 const base=currency(input.baseCurrency,'');
 const groups=['people','assets','liabilities','incomeStreams','expenses','guarantees','policies','goals'];
 for(const group of groups)if(!Array.isArray(inv[group])||inv[group].length>100)fail('INVALID_INVENTORY_COLLECTION');
 const knownIds=new Set();
 const people=inv.people.map((p,i)=>{const personId=clean(p.personId)||`P${i+1}`;if(knownIds.has(personId))fail('DUPLICATE_PERSON');knownIds.add(personId);return {personId,label:clean(p.label),roles:i===0?['CUSTOMER']:['HOUSEHOLD_MEMBER'],relationshipToHousehold:clean(p.relationship)||'UNKNOWN',...(p.dateOfBirth?{dateOfBirth:clean(p.dateOfBirth)}:{}),disclosureState:'SELF_REPORTED',evidence:evidence(date)};});
 const refs=value=>{const ids=list(value).map(clean);for(const id of ids)if(!knownIds.has(id))fail('UNDECLARED_PERSON_REFERENCE');return ids;};
 const rows=(group,map)=>{
  const entries=inv[group];const state=inv.disclosure?.[group];
  if(!entries.length&&state!=='NOT_APPLICABLE')return [map(unknownRow(),0)];
  if(entries.length&&state==='NOT_APPLICABLE')fail('CONTRADICTORY_COLLECTION_DISCLOSURE');
  return entries.map(map);
 };
 const payload={financialRealityId:'FR-EPHEMERAL',householdReference:'HH-EPHEMERAL',customerReferences:['CUST-EPHEMERAL'],asOfDate:date,currencyContext:{baseCurrency:base},people,entities:[],documents:[],estateFacts:[],version:1,disclosureSummary:{level:'STRUCTURED'},evidenceSummary:{state:'SELF_REPORTED_PARTIAL'}};
 payload.assets=rows('assets',(r,i)=>{
  if(r.type&&!assets.has(r.type))fail('INVALID_ASSET_TYPE');
  const assetId=`A${i+1}`,ownerReferences=refs(r.ownerReferences);
  const ownershipMode=['SOLE','JOINT','JOINT_EITHER','JOINT_BOTH','TENANCY_SHARE','COMPANY_OWNED','TRUST_OWNED','UNKNOWN'].includes(r.ownershipMode)?r.ownershipMode:'UNKNOWN';
  // The entered value is the explicitly declared interest value, never an inferred share of a gross valuation.
  return {assetId,assetType:r.type||'OTHER',label:clean(r.label),currency:currency(r.currency,base),ownership:{ownershipId:`OWN-${assetId}`,assetId,ownershipMode,ownerReferences,disclosureState:ownerReferences.length?'SELF_REPORTED':'UNKNOWN',evidence:evidence(date)},valueFact:fact(`F-${assetId}`,'DECLARED_INTEREST_VALUE',r,date),jurisdiction:clean(r.jurisdiction)||'UNSPECIFIED',disclosureState:r.disclosureState||'NOT_YET_PROVIDED',evidence:evidence(date),institutionOrCounterparty:clean(r.institution),maskedReference:clean(r.maskedReference).replace(/\d(?=\d{4})/g,'•'),liquidityNotes:clean(r.liquidityNotes),documentReferences:clean(r.documentReference)?[clean(r.documentReference)]:[],estateInclusion:['INCLUDED','EXCLUDED'].includes(r.estateInclusion)?r.estateInclusion:'UNKNOWN'};
 });
 payload.liabilities=rows('liabilities',(r,i)=>({liabilityId:`L${i+1}`,liabilityType:clean(r.type)||'OTHER_LOAN',label:clean(r.label),borrowerReferences:refs(r.ownerReferences),balanceFact:fact(`F-L${i+1}`,'LIABILITY_BALANCE',r,date),repaymentFact:fact(`F-L${i+1}-PAY`,'REPAYMENT',r.repayment||unknownRow(),date),currency:currency(r.currency,base),disclosureState:r.disclosureState||'NOT_YET_PROVIDED',evidence:evidence(date)}));
 for(const group of ['incomeStreams','expenses'])payload[group]=rows(group,(r,i)=>({[group==='incomeStreams'?'incomeStreamId':'expenseId']:`${group}-${i+1}`,label:clean(r.label),[group==='incomeStreams'?'incomeType':'expenseType']:clean(r.type)||(group==='incomeStreams'?'OTHER':'ESSENTIAL'),amountFact:fact(`F-${group}-${i+1}`,'AMOUNT',r,date),frequency:['MONTHLY','ANNUAL'].includes(r.frequency)?r.frequency:'UNSPECIFIED',currency:currency(r.currency,base),ownerReferences:refs(r.ownerReferences),grossOrNet:clean(r.grossOrNet)||'UNSPECIFIED',disclosureState:r.disclosureState||'NOT_YET_PROVIDED',evidence:evidence(date)}));
 payload.guarantees=rows('guarantees',(r,i)=>({guaranteeId:`G${i+1}`,guaranteeType:['PERSONAL_GUARANTEE','CORPORATE_GUARANTEE','JOINT_GUARANTEE','CONTINGENT_LIABILITY'].includes(r.type)?r.type:'CONTINGENT_LIABILITY',label:clean(r.label),guarantorReferences:refs(r.ownerReferences),obligorReferences:clean(r.obligor)?[clean(r.obligor)]:[],exposureFact:fact(`F-G${i+1}`,'GUARANTEE_EXPOSURE',r,date),limitFact:fact(`F-G${i+1}-LIMIT`,'GUARANTEE_LIMIT',r.limit||unknownRow(),date),currency:currency(r.currency,base),expiryDate:clean(r.expiryDate)||null,disclosureState:r.disclosureState||'NOT_YET_PROVIDED',evidence:evidence(date)}));
 payload.policies=rows('policies',(r,i)=>({policyId:`POL${i+1}`,label:clean(r.label),sumAssured:fact(`F-POL${i+1}`,'COVER',r.currency&&r.currency!==base?unknownRow():r,date),disclosureState:r.disclosureState||'NOT_YET_PROVIDED',evidence:evidence(date)}));
 payload.goals=inv.goals.map((r,i)=>({goalId:`GOAL${i+1}`,goalType:clean(r.type)||'OTHER',label:clean(r.label),target:(()=>{const v=fact(`F-GOAL${i+1}`,'TARGET',r,date).value;return v===null?null:typeof v==='number'?{amount:v,currency:currency(r.currency,base)}:{...v,currency:currency(r.currency,base)};})(),targetDate:clean(r.targetDate)||null,status:'OPEN',fundingSource:clean(r.fundingSource)||'UNKNOWN',relatedAssetReferences:list(r.relatedAssetReferences).map(clean),disclosureState:r.disclosureState||'NOT_YET_PROVIDED',evidence:evidence(date)}));
 payload.digest=await sha256(payload);
 const core={snapshotId:`FRS-${payload.digest.slice(0,24).toUpperCase()}`,financialRealityId:payload.financialRealityId,sequence:0,timepoint:'t0',asOfDate:date,financialRealityVersion:1,snapshotPayload:payload,previousSnapshotDigest:null,changeEventReferences:[],createdAt:`${date}T00:00:00Z`,creationReason:'EPHEMERAL_CUSTOMER_INVENTORY',consentReference:'EPHEMERAL_REQUEST_ONLY'};
 return Object.freeze({...core,digest:await sha256(core)});
}
