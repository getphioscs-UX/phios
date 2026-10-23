/** Explicit Contract Version Upgrade: FCR R3.2 opt-in path adapters.
 * Reuses governed range arithmetic; never changes legacy RETIREMENT/EDUCATION engines.
 * All rates, dates, allocations and timing are explicitly supplied. Local preview only.
 */
import {exact,unknown,add,subtract,multiply,divide,pow,sum,maxZero,bounds,isUnknown} from './range-arithmetic.js';
export const R32_VERSION='FINANCE_R3_2_DEEP_DIVE_CANDIDATE';
const year=d=>Number(String(d).slice(0,4));
const integer=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
const val=x=>x&&['EXACT','APPROXIMATE','RANGE'].includes(x.kind)&&bounds(x)?.every(Number.isFinite)?x:unknown('MISSING_OR_INVALID_VALUE');
const nonnegative=x=>!isUnknown(val(x))&&bounds(x)[0]>=0;
const rate=a=>a&&a.source==='CLIENT_DECLARED'&&validDate(a.sourceDate)&&typeof a.ref==='string'&&bounds(val(a.value))?.[0]>-1?val(a.value):unknown('MISSING_SOURCED_ASSUMPTION');
const safeRef=s=>typeof s==='string'&&/^[A-Z0-9_-]{1,64}$/i.test(s);
function base(ctx,id,input,dependencies=[]){
 const refs=(input?.subjects||[]);const denied=refs.some(r=>!ctx.admittedSubjects?.includes(r));
 const blocked=!ctx.currentConsent||!ctx.localPreview||!ctx.sourceDigest||!ctx.sourceDraftRef||!validDate(ctx.asOfDate)||!refs.length||denied;
 return {modelId:id,calcVersion:'FCR_R32_PATHS_V1',sourceDraftRef:ctx.sourceDraftRef,sourceDigest:ctx.sourceDigest,asOfDate:ctx.asOfDate,ownerSubjectRefs:refs,applicableJurisdiction:input?.jurisdiction||'UNKNOWN',currency:input?.currency,timeBasis:'CALENDAR_YEAR_END',realOrNominalBasis:'NOMINAL_WITH_BASE_YEAR_REAL',inputSourceRefs:input?.sourceRefs||[],assumptions:[],calculationMetricRefs:[id+':PATH'],valueState:blocked?'UNKNOWN':'APPROXIMATE',uncoveredDependencies:blocked?['CURRENT_SOURCE_AND_SUBJECT_AUTHORIZATION']:dependencies,sourceEligibility:blocked?'GATE_BLOCKED':'LOCAL_SYNTHETIC_PREVIEW_ONLY',disclosureBoundary:'CLIENT_SCENARIO_NOT_PROFESSIONAL_ADVICE',eligible:false,rows:[]};
}
function block(out,reason){return {...out,eligible:false,valueState:'UNKNOWN',uncoveredDependencies:[...out.uncoveredDependencies,reason]};}
function assumptionRecord(a,name){return {name,value:a?.value,unit:'ANNUAL_EFFECTIVE_RATE',source:a?.source,sourceDate:a?.sourceDate,effectivePeriod:a?.effectivePeriod||'EXPLICIT_SCENARIO_HORIZON',confidence:'CLIENT_DECLARED_NOT_VERIFIED',ref:a?.ref};}
const growth=(v,r,n)=>multiply(v,pow(add(exact(1),r),n));
export function retirementNeeds(ctx,input){
 const o=base(ctx,'RETIREMENT_NEEDS',input);if(o.sourceEligibility==='GATE_BLOCKED')return o;
 const start=year(ctx.asOfDate),r=rate(input.inflation);
 if(!/^[A-Z]{3}$/.test(input.currency||'')||!integer(input.retirementYear,start,start+50)||!integer(input.years,1,50)||!nonnegative(input.annualSpending)||!['AS_OF_YEAR','RETIREMENT_YEAR'].includes(input.spendingBasis)||isUnknown(r))return block(o,'EXPLICIT_SPENDING_YEARS_INFLATION_CURRENCY_REQUIRED');
 if(input.inflation.sourceDate>ctx.asOfDate)return block(o,'FUTURE_ASSUMPTION_SOURCE_DATE');
 const n=input.spendingBasis==='AS_OF_YEAR'?input.retirementYear-start:0;
 const rows=Array.from({length:input.years},(_,i)=>{const nominal=growth(input.annualSpending,r,n+i);return {year:input.retirementYear+i,nominal,real:divide(nominal,pow(add(exact(1),r),input.retirementYear-start+i))};});
 if(rows.some(r=>isUnknown(r.nominal)||isUnknown(r.real)))return block(o,'NUMERIC_DOMAIN_EXCEEDED');
 return {...o,eligible:true,rows,assumptions:[assumptionRecord(input.inflation,'INFLATION')],firstYear:rows[0].nominal,totalNominal:sum(rows.map(r=>r.nominal)),totalReal:sum(rows.map(r=>r.real)),formula:'spending × (1 + inflation)^elapsedYears; sum annual undiscounted cash needs. This is NOT present-value capital.',retirementYear:input.retirementYear,annualSpending:input.annualSpending,spendingBasis:input.spendingBasis,years:input.years};
}
export function educationCost(ctx,input){
 const o=base(ctx,'EDUCATION_COST',input);if(o.sourceEligibility==='GATE_BLOCKED')return o;
 const start=year(ctx.asOfDate),stages=input.stages;
 if(!Array.isArray(stages)||!stages.length||stages.length>20)return block(o,'DECLARED_STAGES_REQUIRED');
 if(new Set(stages.map(s=>s.id)).size!==stages.length)return block(o,'DUPLICATE_STAGE_ID');
 const rows=[];
 for(const s of stages){const r=rate(s.inflation);if(!safeRef(s.id)||!input.subjects.includes(s.subject)||!s.region||s.currency!==input.currency||!integer(s.feeYear,1900,start)||!integer(s.startYear,start,start+50)||!integer(s.years,1,10)||s.startYear+s.years>start+51||!['tuition','living','other'].every(k=>nonnegative(s[k]))||isUnknown(r))return block(o,'STAGE_COST_SOURCE_CURRENCY_OR_CONSENT_MISSING');
 if(s.inflation.sourceDate>ctx.asOfDate)return block(o,'FUTURE_ASSUMPTION_SOURCE_DATE');
 o.assumptions.push(assumptionRecord(s.inflation,s.id+':INFLATION'));
 for(let i=0;i<s.years;i++){const y=s.startYear+i;const parts=Object.fromEntries(['tuition','living','other'].map(k=>[k,growth(s[k],r,y-s.feeYear)]));rows.push({year:y,subject:s.subject,stage:s.id,feeYear:s.feeYear,region:s.region,...parts,nominal:sum(Object.values(parts))});}}
 if(rows.some(r=>isUnknown(r.nominal)))return block(o,'NUMERIC_DOMAIN_EXCEEDED');
 rows.sort((a,b)=>a.year-b.year);const annual=[...new Set(rows.map(r=>r.year))].map(y=>({year:y,nominal:sum(rows.filter(r=>r.year===y).map(r=>r.nominal))}));
 return {...o,eligible:true,rows,annual,totalNominal:sum(rows.map(r=>r.nominal)),formula:'Each explicitly declared stage component × (1 + sourced inflation)^(cost year - fee source year). No FX conversion.'};
}
export function allocationAudit(ctx,assets,allocations){
 const issues=[];const ids=new Set();const totals=new Map();
 for(const a of allocations||[]){const asset=assets.find(x=>x.ref===a.assetRef);if(!safeRef(a.id)||ids.has(a.id)){issues.push('DUPLICATE_ALLOCATION_ID');continue;}ids.add(a.id);
 if(!asset||!ctx.admittedSubjects.includes(asset.subject)||!nonnegative(asset.ownedValue)||!nonnegative(a.amount)||a.currency!==asset.currency||a.asOfDate!==ctx.asOfDate||asset.asOfDate!==ctx.asOfDate||!integer(asset.availableYear,year(ctx.asOfDate),year(ctx.asOfDate)+50)||asset.valueBasis!=='OWNED_INTEREST'){issues.push('ASSET_ACCESS_CURRENCY_DATE_OR_OWNERSHIP_UNKNOWN');continue;}
 const total=add(totals.get(asset.ref)||exact(0),a.amount);totals.set(asset.ref,total);if(bounds(total)[1]>bounds(asset.ownedValue)[0])issues.push('DOUBLE_ALLOCATION_OR_UNCERTAIN_SHARE:'+asset.ref);}
 return {eligible:issues.length===0,issues,totals:Object.fromEntries(totals)};
}
/** Shared existing FCR arithmetic owner for both funding paths, not a second calculator. */
export function fundingPath(ctx,input,cost,assets,allAllocations){
 const o=base(ctx,input?.kind==='RETIREMENT'?'RETIREMENT_FUNDING':'EDUCATION_FUNDING',input);if(o.sourceEligibility==='GATE_BLOCKED')return o;
 const audit=allocationAudit(ctx,assets,allAllocations);if(!audit.eligible)return block(o,audit.issues.join(';'));
 const ret=rate(input.returnAssumption),fee=rate(input.feeAssumption),start=year(ctx.asOfDate)+1;
 const schedules=input.contributionSchedules;const hasSchedules=Array.isArray(schedules)&&schedules.length>0&&schedules.length<=50;
 const contributionsValid=hasSchedules?schedules.every(c=>input.subjects?.includes(c.subject)&&ctx.admittedSubjects.includes(c.subject)&&c.currency===input.currency&&integer(c.startYear,start,input.endYear)&&integer(c.endYear,c.startYear,input.endYear)&&['MONTHLY','ANNUAL'].includes(c.frequency)&&c.timing==='PERIOD_END'&&nonnegative(c.personal)&&nonnegative(c.employer)):schedules===undefined&&['MONTHLY','ANNUAL'].includes(input.frequency)&&input.timing==='PERIOD_END'&&nonnegative(input.contribution)&&nonnegative(input.employerContribution)&&integer(input.contributionEndYear,start,input.endYear);
 if(!cost?.eligible||cost.currency!==input.currency||cost.sourceDigest!==ctx.sourceDigest||!integer(input.endYear,start,start+50)||isUnknown(ret)||isUnknown(fee)||bounds(fee)[0]<0||bounds(fee)[1]>=1||!contributionsValid)return block(o,'COMPATIBLE_COST_EXPLICIT_RETURN_FEES_CONTRIBUTION_TIMING_REQUIRED');
 if(input.returnAssumption.sourceDate>ctx.asOfDate||input.feeAssumption.sourceDate>ctx.asOfDate)return block(o,'FUTURE_ASSUMPTION_SOURCE_DATE');
 const selected=allAllocations.filter(a=>a.target===input.target);if(!selected.length)return block(o,'NO_EXPLICIT_FUNDING_LINK');
 if(selected.some(a=>a.currency!==input.currency||!input.subjects.includes(assets.find(x=>x.ref===a.assetRef).subject)))return block(o,'FUNDING_SUBJECT_OR_CURRENCY_MISMATCH');
 if(cost.rows.some(r=>r.year>input.endYear||r.year<start))return block(o,'FUNDING_HORIZON_DOES_NOT_COVER_COST_PATH');
 const firstCost=Math.min(...cost.rows.map(r=>r.year));if(selected.some(a=>assets.find(x=>x.ref===a.assetRef).availableYear>firstCost))return block(o,'RESTRICTED_ASSET_UNAVAILABLE_AT_NEED');
 const periods=hasSchedules||input.frequency==='MONTHLY'?12:1;
 const netAnnual=subtract(multiply(add(exact(1),ret),subtract(exact(1),fee)),exact(1));
 const pr=subtract(pow(add(exact(1),netAnnual),1/periods),exact(1));let balance=exact(0),unmet=exact(0);const rows=[];
 for(let y=start;y<=input.endYear;y++){
 const released=selected.filter(a=>(y===start?assets.find(x=>x.ref===a.assetRef).availableYear<=y:assets.find(x=>x.ref===a.assetRef).availableYear===y));const release=sum(released.map(a=>growth(a.amount,netAnnual,y-start)));const priorRestrictedGrowth=subtract(release,sum(released.map(a=>a.amount)));balance=add(balance,release);const opening=balance;
 let contributions=exact(0),investmentGrowth=exact(0);
 for(let p=0;p<periods;p++){const g=multiply(balance,pr);balance=add(balance,g);investmentGrowth=add(investmentGrowth,g);if(hasSchedules){const c=sum(schedules.filter(s=>y>=s.startYear&&y<=s.endYear&&(s.frequency==='MONTHLY'||p===periods-1)).map(s=>add(s.personal,s.employer)));balance=add(balance,c);contributions=add(contributions,c);}else if(y<=input.contributionEndYear){const c=add(input.contribution,input.employerContribution);balance=add(balance,c);contributions=add(contributions,c);}}
 const need=sum(cost.rows.filter(r=>r.year===y).map(r=>r.nominal));const available=balance;const difference=subtract(available,need);const gap=maxZero(subtract(need,available));unmet=add(unmet,gap);balance=maxZero(difference);
 rows.push({year:y,release,priorRestrictedGrowth,opening,contributions,investmentGrowth,need,available,gap,excess:balance,closing:balance,unmetToDate:unmet});}
 if(rows.some(r=>Object.values(r).some(v=>v&&typeof v==='object'&&isUnknown(v))))return block(o,'NUMERIC_DOMAIN_EXCEEDED');
 return {...o,eligible:true,rows,totalUnmet:unmet,remaining:balance,assumptions:[assumptionRecord(input.returnAssumption,'GROSS_RETURN'),assumptionRecord(input.feeAssumption,'ANNUAL_FEE')],allocations:selected,frequency:input.frequency,periodicContribution:input.contribution,periodicEmployerContribution:input.employerContribution,contributionEndYear:input.contributionEndYear,...(hasSchedules?{contributionSchedules:schedules,frequency:'MIXED_EXPLICIT_SCHEDULES'}:{}),formula:'Restricted allocations grow at the explicitly declared net annual scenario rate before release; prior restricted growth is separate from current-year growth. Projection begins in the next complete calendar year after asOf; no retroactive current-year growth or contribution. End-period contribution after effective-period growth. Annual costs withdrawn at year end; unfunded costs recorded, never financed implicitly. Net annual factor=(1+return)×(1-fee).'};
}
export function factualModules(ctx,input,policyEvents=[]){
 const baseInput={subjects:input.subjects,currency:input.currency,sourceRefs:input.sourceRefs};
 const protection=base(ctx,'PROTECTION_EVENT',baseInput),estate=base(ctx,'ESTATE_CONTINUITY',baseInput),milestones=base(ctx,'LIFE_COURSE_EVENTS',baseInput);
 const p=Array.isArray(input.protection)?input.protection:[];
 protection.rows=p.filter(r=>ctx.admittedSubjects.includes(r.subject)&&safeRef(r.event)&&r.policyRef&&policyEvents.some(e=>e.id===r.policyRef&&e.personRef===r.subject&&e.event===r.event)&&r.termsState==='DECLARED'&&validDate(r.expiryDate)&&r.expiryDate>=ctx.asOfDate).map(r=>({...r,coverage:policyEvents.find(e=>e.id===r.policyRef).coverage,need:unknown('PROFESSIONAL_NEEDS_MODEL_NOT_ADMITTED'),gap:unknown('PROFESSIONAL_NEEDS_MODEL_NOT_ADMITTED')}));
 const docs=input.estate?.documents||[];estate.rows=docs.filter(r=>safeRef(r.id)&&['WILL','NOMINATION','EXECUTOR','GUARDIAN','TRUSTEE','DIGITAL_INDEX'].includes(r.kind)&&['DECLARED','UNKNOWN'].includes(r.state)&&safeRef(r.locationRef)&&validDate(r.reviewDate)&&ctx.admittedSubjects.includes(r.subject));estate.triggers=(input.estate?.triggers||[]).filter(r=>validDate(r.date)&&safeRef(r.kind));estate.legalState='GATE_BLOCKED';estate.nominationIsInheritance=false;
 milestones.rows=(input.events||[]).filter(r=>safeRef(r.id)&&validDate(r.date)&&ctx.admittedSubjects.includes(r.subject)&&['PLANNED','COMPLETED','UNVERIFIED'].includes(r.state)&&safeRef(r.linkRef)&&['RETIREMENT','EDUCATION','HOUSEHOLD','OBLIGATION','ESTATE'].includes(r.lane)&&r.author==='CLIENT_DECLARED'&&(r.state!=='COMPLETED'||safeRef(r.receiptRef))).sort((a,b)=>a.date.localeCompare(b.date));
 for(const o of [protection,estate,milestones]){o.eligible=o.sourceEligibility!=='GATE_BLOCKED'&&o.rows.length>0;o.valueState=o.eligible?'DECLARED':'UNKNOWN';if(!o.eligible)o.uncoveredDependencies.push('MEANINGFUL_AUTHORIZED_FACTS_REQUIRED');}
 return {protection,estate,milestones};
}
export function compileR32(ctx,input,policyEvents=[]){
 const needs=retirementNeeds(ctx,input.retirement||{}),education=educationCost(ctx,input.education||{}),assets=input.assets||[],allocations=input.allocations||[];
 const retirementFunding=fundingPath(ctx,{...input.retirementFunding,kind:'RETIREMENT'},needs,assets,allocations),educationFunding=fundingPath(ctx,{...input.educationFunding,kind:'EDUCATION'},education,assets,allocations);
 const facts=factualModules(ctx,input,policyEvents);return {version:R32_VERSION,sourceDigest:ctx.sourceDigest,providerCalls:0,providerCostUSD:0,models:[needs,retirementFunding,education,educationFunding,facts.protection,facts.estate,facts.milestones],allocationAudit:allocationAudit(ctx,assets,allocations)};
}
