// Composes existing Financial / Tax / Testamentary owners. No store or licence issuer.
import {calculateFinancialMetric} from './financial-formula-registry.js';
import {createTestamentaryIntake} from './testamentary-intake-v1.js';
import {analyzeTaxCandidate} from './tax-intelligence-candidate-r1.js';
const requireValue=(v,c)=>{if(!v)throw Error(c);};
const minor=n=>Number.isSafeInteger(n)&&Math.abs(n)<=1e12;
export function bindTaxRuleR11(item,rule,companySource){
 const company=item.context.taxpayerType==='COMPANY';return{...item.context,ruleVersion:company?'MY-COMPANY-YA2025-REVIEW-REQUIRED-R1.1':rule.version,ruleSource:company?companySource:rule.sourceSha256,ruleVerificationStatus:company?'SOURCE_IDENTIFIED_COMPANY_2025_NOT_ADMITTED':'INDIVIDUAL_YA2025_RATE_ONLY_SYNTHETIC'};
}
export function taxR11(input){
 const company=input.context.taxpayerType==='COMPANY';requireValue(!company||!input.context.ruleVersion.startsWith('MY-INDIVIDUAL'),'COMPANY_INDIVIDUAL_RULE_BINDING_FORBIDDEN');
 const result=analyzeTaxCandidate(input);
 return{...result,version:'BFT-TAX-INTELLIGENCE-R1.1',ruleIdentity:{taxpayerType:input.context.taxpayerType,selected:input.context.ruleVersion,calculationRule:company?null:input.rule.id,reason:company?'Company rules not admitted; individual schedule never used':null},taxZeroSemantics:{sourceAmount:input.source.record.facts.tax?.value??null,meaning:'Source-reported accounting tax entry, not computed tax liability',finalTaxLiability:null}};
}
export function familyPlanning(family,{at='2026-11-03T00:00:00Z'}={}){
 requireValue(family.subjectType==='FAMILY'&&family.subjectId&&family.members.length>=2,'FAMILY_CONTEXT_REQUIRED');
 const members=family.members.filter(m=>m.consent?.explicit===true&&!m.consent.revoked&&Date.parse(m.consent.expiresAt)>Date.parse(at)&&m.consent.purpose==='SHARED_FINANCIAL_SUMMARY'&&m.consent.familySubjectId===family.subjectId);
 if(members.length!==family.members.length)return{status:'MEMBER_CONSENT_REQUIRED',netWorth:null,cashSurplus:null,unconsentedMemberDataIncluded:false};
 const ids=new Set(),assets=[],liabilities=[];
 for(const kind of ['assets','liabilities'])for(const item of family[kind]){requireValue(item.id&&!ids.has(kind+item.id),'DUPLICATE_JOINT_ASSET_OR_LIABILITY');ids.add(kind+item.id);requireValue(item.ownerRefs?.every(id=>members.some(m=>m.accountId===id)),'ASSET_OWNER_CONSENT_REQUIRED');requireValue(minor(item.valueMinor)&&item.valueMinor>=0&&item.evidenceRef,'ASSET_VALUE_EVIDENCE_REQUIRED');(kind==='assets'?assets:liabilities).push(item.valueMinor);}
 const metric=(formula_id,values)=>calculateFinancialMetric({calculation_id:family.sourceVersion+':'+formula_id,household_id:family.subjectId,formula_id,values,input_source_ids:[family.sourceVersion],assumption_ids:['SYNTHETIC_ASSUMPTIONS_V1'],input_date:'2026-11-03',calculated_at:at});
 const income=members.reduce((s,m)=>s+m.sharedMonthlyIncome,0),expenses=family.monthlySharedExpenses;
 requireValue(minor(income)&&minor(expenses)&&expenses>=0,'FAMILY_CASH_INPUT_REQUIRED');
 return{status:'CONSENTED_SYNTHETIC_SUMMARY',subjectId:family.subjectId,sourceVersion:family.sourceVersion,consentRefs:members.map(m=>m.consent.reference),netWorth:metric('net_worth',{total_assets_minor:assets.reduce((s,n)=>s+n,0),total_liabilities_minor:liabilities.reduce((s,n)=>s+n,0)}),cashSurplus:metric('cash_flow_surplus',{total_income_minor:income,total_expenses_minor:expenses}),educationGap:metric('education_gap',{projected_education_cost_minor:family.goals.education.required,existing_education_fund_minor:family.goals.education.existing}),retirementGap:metric('retirement_gap',{required_retirement_fund_minor:family.goals.retirement.required,existing_retirement_assets_minor:family.goals.retirement.existing}),jointAssetsCountedOnce:true,privateMemberDetailsIncluded:false,businessAssetsIncluded:false,guaranteedReturn:false};
}
export function estateReadiness(input){
 // Native intake provides provenance, gap semantics and restricted-value checks.
 const intake=createTestamentaryIntake(input,{now:'2026-11-03T00:00:00Z'}),s=intake.normalizedFacts.sections;
 for(const a of s.assets.items){requireValue(a.legalOwner&&a.ownerRef&&a.evidenceRef,'ESTATE_OWNERSHIP_EVIDENCE_REQUIRED');requireValue(['PERSONAL','JOINT','TRUST','BUSINESS_INTEREST','NOMINATED','DIGITAL'].includes(a.ownershipKind),'ESTATE_OWNERSHIP_TYPE_REQUIRED');}
 for(const t of s.trusts.items)requireValue(['LIVING','DECLARATION','TESTAMENTARY'].includes(t.trustType),'TRUST_TYPE_REQUIRED');
 return{intake,documents:{will:{status:s.documents.items.find(x=>x.type==='WILL')?.status||'UNKNOWN',executionVerified:false},trusts:s.trusts.items.map(t=>({...t,legalAdvice:false,assetTransferEvidencePresent:!!t.assetTransferEvidence,assetTransferVerified:false})),poa:{separateInstrument:true,replacesWill:false,replacesTrust:false,legalEffect:'JURISDICTION_REVIEW_REQUIRED'}},assets:s.assets.items.map(a=>({...a,willDistributable:null,availableCash:null})),custody:{owner:'Existing Testamentary / Continuity',ordinaryPdfDownloadIsOriginalRetrieval:false,requesterVerificationRequired:true,documentIdentityRequired:true,handoverEvidenceRequired:true,status:'NOT_A_CUSTODY_SERVICE'},legalIssueAllowed:false,distribution:null,professionalReviewRequired:true};
}
export function successionReadiness(s){
 requireValue(s.entityRef&&s.legalForm,'SUCCESSION_ENTITY_REQUIRED');
 if(s.legalForm==='SOLE_PROPRIETORSHIP')return{status:'NOT_APPLICABLE_FOR_SHARE_BUY_SELL',shares:null,legalIssueAllowed:false};
 if(!['LIMITED_COMPANY','PARTNERSHIP','LLP'].includes(s.legalForm))return{status:'ENTITY_REVIEW_REQUIRED',shares:null,legalIssueAllowed:false};
 requireValue(['DEATH','INCAPACITY','RETIREMENT','EXIT','BUSINESS_CLOSURE','OWNERSHIP_DISPUTE','SHARE_TRANSFER'].includes(s.trigger),'SUCCESSION_TRIGGER_REQUIRED');
 const missing=['ownershipEvidence','agreementRef','valuationEvidence','transferRestrictions','fundingEvidence'].filter(k=>!s[k]);
 return{status:missing.length?'EVIDENCE_REQUIRED':'READY_FOR_SPECIALIST_REVIEW_ONLY',legalForm:s.legalForm,interests:s.interests,trigger:s.trigger,missing,fundingGap:minor(s.fundingNeed)&&minor(s.fundingAvailable)?Math.max(0,s.fundingNeed-s.fundingAvailable):null,sourceVersion:s.sourceVersion,formalBuySellPrice:null,taxLiability:null,legalIssueAllowed:false};
}
export function planningJourney({engagement,family,estate,succession,tax,actions,previousReview}){
 requireValue(engagement.subjectId===family.subjectId&&engagement.purpose==='SYNTHETIC_INTEGRATED_PLANNING'&&engagement.consentRef&&engagement.compensationDisclosure&&engagement.conflictDisclosure&&engagement.withdrawalRef,'ENGAGEMENT_SCOPE_OR_DISCLOSURE_REQUIRED');
 const f=familyPlanning(family),e=estateReadiness(estate),s=successionReadiness(succession);
 return{version:'CFP-ROCKWILLS-INTEGRATED-LOCAL-R1',engagement:{...engagement,formalRegulatedEngagement:false},stages:[{id:1,state:'LOCAL_SCOPE_AND_DISCLOSURES_RECORDED'},{id:2,state:'SYNTHETIC_SOURCE_REVIEWED',source:family.sourceVersion},{id:3,state:f.status},{id:4,state:'PLANNING_DRAFT_SPECIALIST_REVIEW_REQUIRED'},{id:5,state:'LOCAL_ACTION_TRACKING_ONLY',actions},{id:6,state:'REVIEW_SCHEDULED_NOT_COMPLETED',previousReview}],family:f,estate:e,succession:s,tax,businessOwner:{accountingProfit:tax.workingPaper.accountingProfitBeforeTax,businessClosingCash:tax.financial.sourceFacts.find(x=>x.field==='closingCash')?.value??null,ownerActualReceipt:tax.financial.ownerActualReceived,ownerAccessibleCash:null,householdSurplus:f.cashSurplus?.value_numeric??null,noBusinessCashAddedToHousehold:true},serviceLanes:['PLATFORM_EVIDENCE','BUSINESS_TRANSFORMATION','PLANNING_PREPARATION','QUALIFIED_SPECIALIST_REQUIRED'],professionalSignatures:[],customerPublicationAllowed:false,secretStorageAllowed:false};
}
export function actionTransition(action,to,{clientApproved=false,completionEvidence=null}={}){
 requireValue(action.ownerRef&&action.approverRef&&action.objective&&action.dueDate&&action.evidenceRefs?.length,'ACTION_RESPONSIBILITY_REQUIRED');
 const transitions={PROPOSED:['APPROVED','REJECTED'],APPROVED:['IN_PROGRESS'],IN_PROGRESS:['COMPLETED']};requireValue(transitions[action.status]?.includes(to),'ACTION_TRANSITION_DENIED');requireValue(to!=='APPROVED'||clientApproved,'CLIENT_APPROVAL_REQUIRED');requireValue(to!=='COMPLETED'||completionEvidence,'COMPLETION_EVIDENCE_REQUIRED');return{...action,status:to,completionEvidence:to==='COMPLETED'?completionEvidence:null};
}
