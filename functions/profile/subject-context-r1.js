// Read-only projection over PWS. This module neither provisions identities nor grants access.
import {projectNavigationForCustomer} from '../customer-projection/navigation-customer-projection.js';
export const SUBJECT_CONTEXT_VERSION = 'SUBJECT-CONTEXT-R1';
export const SUBJECT_TYPES = Object.freeze(['PERSONAL','FAMILY','TEAM','BUSINESS','INSTITUTION','COUNTRY']);
export const DIMENSIONS = Object.freeze(['identity','expression','relationships','environment','growth','potential']);
export const SUBJECT_RELATIONSHIPS=Object.freeze(['BELONGS_TO_FAMILY','PARTICIPATES_IN_TEAM','WORKS_WITH_BUSINESS','MANAGES_BUSINESS','INTERACTS_WITH_INSTITUTION','OPERATES_IN_COUNTRY','OBSERVED_IN_WORLD_CONTEXT']);
export const DIMENSION_NAMES = Object.freeze({identity:['Identity','身份'],expression:['Expression','表达'],relationships:['Relationships','关系'],environment:['Environment','环境'],growth:['Growth','成长'],potential:['Possibilities','可能性']});
const definitions = {
 PERSONAL:[['Your values, roles and self-description.','你的价值、角色与自我认识。'],['How you communicate and express your views.','你如何沟通和表达观点。'],['Connections you have chosen to describe.','你选择说明的人际连接。'],['Your stated living and working conditions.','你明确提供的生活与工作条件。'],['Learning, experience and progress over time.','随时间积累的学习、经验与进展。'],['Options within your resources and constraints.','在资源与限制下可以探索的选择。']],
 FAMILY:[['The household and responsibilities within its stated scope.','已明确范围内的家庭组成与责任。'],['How members communicate and make shared decisions.','成员如何沟通及作共同决定。'],['Consented care and support connections; not private member reports.','经授权的照护与支持连接，不包含成员私人报告。'],['Housing, services and shared living conditions.','住房、公共服务与共同生活条件。'],['Lifecycle changes and adaptation of shared resources.','家庭阶段变化与共同资源的适应。'],['Options that members can choose together.','可由成员共同选择的路径。']],
 TEAM:[['A team’s stated purpose, roles and mandate.','团队明确的目标、角色与职责。'],['Coordination, communication and work practices.','协调、沟通及工作方式。'],['Task dependencies and agreed collaboration.','任务依赖与已约定的协作。'],['Resources, working conditions and project constraints.','资源、工作环境与项目限制。'],['Evidence of learning, capability and delivery changes.','学习、能力及交付变化的证据。'],['Feasible improvements requiring team agreement.','需要团队同意的可行改进。']],
 BUSINESS:[['Business activities, operating boundary and declared legal form.','业务活动、经营范围及声明的法律形式。'],['Products, services and how the business reaches customers.','产品、服务及面向客户的经营方式。'],['Authorized supplier, customer and operating dependencies.','获授权的供应商、客户与经营依赖。'],['Market, costs, supply chain and relevant public conditions.','市场、成本、供应链及相关公共条件。'],['Changes in comparable operating and financial evidence.','可比的经营与财务证据所显示的变化。'],['Operating options subject to cash, capacity and uncertainty.','受现金、能力及不确定性约束的经营选择。']],
 INSTITUTION:[['An institution’s mission, mandate and service scope.','机构的宗旨、职责与服务范围。'],['How services and governance are delivered.','服务及治理如何运作。'],['Stakeholders and authorized institutional responsibilities.','利益相关方及获授权的机构责任。'],['Policy, funding and operating conditions.','政策、资金与运营条件。'],['Changes in service coverage and organizational capability.','服务覆盖与组织能力的变化。'],['Options consistent with the mandate and restricted funding.','符合职责及受限资金条件的可选路径。']],
 COUNTRY:[['The public geographic entity and the scope of observation.','公共地理主体及观察范围。'],['Publicly documented institutions and economic activities.','有公共资料支持的制度与经济活动。'],['Public trade and institutional connections, not personal relationships.','公开贸易与制度连接，而非个人人际关系。'],['Dated economic, social and infrastructure observations.','带有观察日期的经济、社会与基础设施资料。'],['Comparable changes over time, with revisions retained.','可比的时间变化，并保留修订身份。'],['Public-policy scenarios and trade-offs, not predictions.','公共政策情景与权衡，而非确定预测。']]
};
export function subjectDefinitions(type,locale='en') {
 if(!SUBJECT_TYPES.includes(type)) throw issue('SUBJECT_TYPE_INVALID',422);
 return DIMENSIONS.map((id,i)=>({id,label:DIMENSION_NAMES[id][locale==='zh-Hans'?1:0],definition:definitions[type][i][locale==='zh-Hans'?1:0]}));
}
export const issue=(code,status=403)=>Object.assign(new Error(code),{code,status});
const need=(v,c,s)=>{if(!v)throw issue(c,s);};
const parse=v=>typeof v==='string'?JSON.parse(v):v;
const activeAt=(r,now)=>r.status==='active'&&Number.isFinite(Date.parse(r.valid_from))&&Date.parse(r.valid_from)<=now&&(!r.valid_to||Number.isFinite(Date.parse(r.valid_to))&&Date.parse(r.valid_to)>now);
export function methodApplicability(type,{birthInputsVerified=false,consent=false}={}) {
 need(SUBJECT_TYPES.includes(type),'SUBJECT_TYPE_INVALID',422);
 return ['BAZI','HUMAN_DESIGN','ZI_WEI','NUMEROLOGY','WESTERN_ASTROLOGY'].map(method=>({method,status:type!=='PERSONAL'?'NOT_APPLICABLE':!consent?'REQUIRES_CONSENT':!birthInputsVerified?'REQUIRES_VERIFIED_INPUT':'CONDITIONALLY_APPLICABLE',publicationEligible:false}));
}
export async function authorizeSubject(registry,subjectId,actorId,{operation='profile:read',now=Date.now()}={}) {
 need(typeof subjectId==='string'&&subjectId.length<=200,'SUBJECT_NOT_FOUND',404);
 const view=await registry.query.getObjectView(subjectId),object=view?.object;
 need(object?.object_type==='SUBJECT_CONTEXT_REF'&&object.status==='active','SUBJECT_NOT_FOUND',404);
 const m=object.metadata;need(m.contractVersion===SUBJECT_CONTEXT_VERSION&&SUBJECT_TYPES.includes(m.subjectType),'SUBJECT_CONTRACT_INVALID',409);
 const denies=(view.restrictions||[]).filter(r=>activeAt(r,now));
 // Uninterpreted requirements/limits fail closed rather than being silently bypassed.
 need(!denies.some(r=>{const s=parse(r.scope_json);return !s.accountId||s.accountId===actorId;}),'SUBJECT_RESTRICTED');
 const publicRead=m.subjectType==='COUNTRY'&&m.visibility==='PUBLIC'&&m.canonicalSubjectRef?.owner==='WORLD'&&operation==='profile:read';
 if(publicRead)return {object,role:'PUBLIC_OBSERVER',scopes:['profile:read'],ownsSubject:false,grant:null};
 need(actorId,'AUTH_REQUIRED',401);
 for(const row of view.relationships||[]) {
  if(row.target_object_id!==subjectId||row.relationship_type!=='SUBJECT_CONTEXT_ACCESS'||!activeAt(row,now))continue;
  const a=parse(row.attributes_json);
  if(a.purpose!=='SUBJECT_PROFILE_DISPLAY'||a.subjectVersion!==m.version||!['OWNER','EDITOR','VIEWER'].includes(a.role)||!Array.isArray(a.scopes)||!a.scopes.includes(operation)||a.role==='VIEWER'&&operation.endsWith(':write'))continue;
  const account=await registry.query.getObject(row.source_object_id);
  if(account?.status!=='active'||account.object_type!=='ACCOUNT_REFERENCE'||account.owner_module!=='ACCOUNT'||account.metadata.canonicalAccountId!==actorId)continue;
  need(m.requiresGuardianAuthority!==true,'GUARDIAN_AUTHORITY_OWNER_NOT_BOUND');
  return {object,role:a.role,scopes:a.scopes,ownsSubject:false,grant:{id:row.relationship_id,validTo:row.valid_to,version:a.subjectVersion}};
 }
 throw issue('SUBJECT_NOT_FOUND',404);
}
const safeText=v=>typeof v==='string'?v.slice(0,2000):'';
const evidenceTypes=['OBSERVED_FACT','VERIFIED_CALCULATION','METHOD_INTERPRETATION','SCENARIO','SYMBOLIC_READING','ILLUSTRATIVE_EXAMPLE'];
export function evidenceProjection(e,publicOnly=false,locale='en') {
 if(!e||!e.id||!e.version||!e.position||!evidenceTypes.includes(e.kind)||publicOnly&&e.access!=='PUBLIC')return null;
 if(e.kind==='OBSERVED_FACT'&&(!e.publisher||!e.period||!e.unit||!e.sourceUrl))return null;
 let href=null;try{const u=new URL(e.sourceUrl);if(u.protocol==='https:'&&!u.username&&!u.password)href=u.href;}catch{}
 return {id:safeText(e.id),version:safeText(e.version),position:safeText(e.position),kind:e.kind,statement:safeText(locale==='zh-Hans'&&e.statementZh?e.statementZh:e.statement),sourceUrl:href,publisher:safeText(e.publisher),period:safeText(e.period),unit:safeText(e.unit),geography:safeText(e.geography),retrievedAt:safeText(e.retrievedAt),revision:safeText(e.revision),limitation:safeText(locale==='zh-Hans'&&e.limitationZh?e.limitationZh:e.limitation)};
}
export async function readSubjectWorkspace(registry,subjectId,actorId,{locale='en',now=Date.now()}={}) {
 const auth=await authorizeSubject(registry,subjectId,actorId,{now});
 const m=auth.object.metadata,versions=await registry.versionStore.list(subjectId),v=versions[0];
 need(v?.status==='active'&&v.checksum===m.currentPayloadDigest,'SUBJECT_VERSION_RECHECK_REQUIRED',409);
 const bytes=new TextEncoder().encode(JSON.stringify(v.payload)),actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
 need(actual===v.checksum,'SUBJECT_PAYLOAD_DIGEST_MISMATCH',409);
 const payload=v.payload,publicOnly=m.visibility==='PUBLIC',evidence=(payload.evidence||[]).filter(e=>e.access==='PUBLIC'||e.ownerSubjectId===subjectId).map(e=>evidenceProjection(e,publicOnly,locale)).filter(Boolean),ids=new Set(evidence.map(e=>e.id));
 const dimensions=subjectDefinitions(m.subjectType,locale).map(d=>{const refs=(payload.dimensions?.[d.id]||[]).filter(id=>ids.has(id));return {...d,evidenceRefs:refs,state:refs.length?'EVIDENCE_AVAILABLE':'UNKNOWN',observations:evidence.filter(e=>refs.includes(e.id))};});
 const financial=auth.scopes.includes('financial:read')?payload.financial:null;
 if(financial)need(Object.values(financial.metrics||{}).every(m=>ids.has(m.sourceRef)),'FINANCIAL_EVIDENCE_REFERENCE_INVALID',409);
 return {schemaVersion:SUBJECT_CONTEXT_VERSION,subjectId,subjectType:m.subjectType,profileId:m.profileId,profileVersion:m.version,subjectStatus:auth.object.status,visibility:m.visibility,createdAt:auth.object.created_at,updatedAt:auth.object.updated_at,asOfDate:m.asOfDate||null,description:safeText(m.description),provenanceStatus:m.dataNature||'SOURCE_BOUND',permissionPolicyRef:auth.grant?.id||'WORLD_PUBLIC_OBSERVATION',relationshipRefs:auth.grant?[auth.grant.id]:[],sourceRefs:evidence.map(e=>({id:e.id,version:e.version,position:e.position})),canonicalSubjectRef:m.canonicalSubjectRef,version:m.version,sourceVersion:v.checksum,displayName:safeText(payload.displayNames?.[locale]||auth.object.canonical_name),displayNames:payload.displayNames?{en:safeText(payload.displayNames.en),'zh-Hans':safeText(payload.displayNames['zh-Hans'])}:null,role:auth.role,ownsSubject:false,dataNature:m.dataNature||'SOURCE_BOUND',legalForm:m.subjectType==='BUSINESS'?m.legalForm||'UNKNOWN':null,independentLegalPerson:m.subjectType==='BUSINESS'&&m.legalForm==='SOLE_PROPRIETORSHIP'?false:null,dimensions,evidence,financial:financial?analyzeSubjectFinancial(m.subjectType,financial):{state:'NOT_AUTHORIZED_OR_NOT_PROVIDED',metrics:[]},methods:methodApplicability(m.subjectType),legacyPersonalRef:m.subjectType==='PERSONAL'?m.canonicalSubjectRef:null,worldContext:(payload.worldContext||[]).map(e=>evidenceProjection(e,true,locale)).filter(Boolean).map(e=>({...e,relationship:'CONTEXT_ONLY_NOT_PERSONAL_OUTCOME'})),relationships:await readSubjectRelationships(registry,subjectId,actorId,{now}),worldTrend:projectWorldTrend(payload.worldTrend,evidence),navigation:{state:'USER_CHOICE_REQUIRED',subjectId,subjectType:m.subjectType,sourceVersion:v.checksum,facts:evidence.filter(e=>e.kind==='OBSERVED_FACT'),illustrations:evidence.filter(e=>e.kind==='ILLUSTRATIVE_EXAMPLE'),unknown:dimensions.filter(d=>d.state==='UNKNOWN').map(d=>d.id),constraints:payload.constraints?.map(safeText)||[],options:navigationOptions(m.subjectType,locale),customerProjection:projectNavigationForCustomer({state:'SOURCE_BOUND_OPTIONS',options:navigationOptions(m.subjectType,locale),actions:[]},{locale}),automaticAction:false},persistedByThisRead:false};
}
export async function listSubjectWorkspaces(registry,actorId,options={}) {
 // Bounded discovery is explicit: an exhausted page is not claimed to be the complete account catalogue.
 const objects=await registry.query.findObjects({object_type:'SUBJECT_CONTEXT_REF',status:'active',limit:100}),items=[];
 for(const o of objects)try{const v=await readSubjectWorkspace(registry,o.object_id,actorId,options);items.push({subjectId:v.subjectId,subjectType:v.subjectType,displayName:v.displayName,displayNames:v.displayNames,role:v.role,version:v.version});}catch(e){if(!['SUBJECT_NOT_FOUND','SUBJECT_RESTRICTED','AUTH_REQUIRED'].includes(e.code))throw e;}
 return {items,hasMore:objects.length===100,provisionsSubjects:false};
}
export function navigationOptions(type,locale='en') {
 const options={PERSONAL:[['Review necessary spending and your stated resources','核对必要支出与已提供资源']],FAMILY:[['Confirm shared costs and each member’s permitted contribution','确认共同开支与各成员获授权的投入']],TEAM:[['Review project budget and delivery constraints','核对项目预算与交付限制']],BUSINESS:[['Check receivables, operating cash and upcoming obligations','核对应收款、经营现金与即将到期的义务']],INSTITUTION:[['Review funding restrictions and service commitments','核对资金用途限制及服务承诺']],COUNTRY:[['Review dated public evidence and compare policy scenarios','核对有日期的公共证据并比较政策情景']]};
 return options[type].map((text,i)=>({id:'REVIEW_'+type+'_'+i,label:text[locale==='zh-Hans'?1:0],type:'OPTION_NOT_RECOMMENDATION',requiresUserDecision:true}));
}
const scopes={PERSONAL:['PERSONAL'],FAMILY:['HOUSEHOLD'],TEAM:['PROJECT'],BUSINESS:['BUSINESS_OPERATIONS'],INSTITUTION:['INSTITUTION_BUDGET'],COUNTRY:['PUBLIC_FISCAL','MACROECONOMIC']};
export function analyzeSubjectFinancial(type,input) {
 need(SUBJECT_TYPES.includes(type),'SUBJECT_TYPE_INVALID',422);
 need(scopes[type].includes(input.scope),'FINANCIAL_SCOPE_MISMATCH',422);
 need(Object.keys(input.metrics||{}).every(id=>FINANCIAL_SCOPE_METRICS[input.scope].includes(id)),'FINANCIAL_METRIC_SCOPE_MISMATCH',422);
 need(/^[A-Z]{3}$/.test(input.currency||'')&&input.period&&input.accountingBasis&&input.consolidationBoundary,'FINANCIAL_CONTEXT_REQUIRED',422);
 const get=id=>{const m=input.metrics?.[id];return m&&Number.isSafeInteger(m.value)&&Math.abs(m.value)<=1e13&&m.sourceRef&&m.unit==='CURRENCY_MINOR'&&m.period===input.period&&m.currency===input.currency?m.value:null;};
 const derived=[];const difference=(id,a,b)=>{const x=get(a),y=get(b);derived.push({id,value:x===null||y===null?null:x-y,unit:'CURRENCY_MINOR',state:x===null||y===null?'MISSING_INPUT':'CALCULATED',formulaVersion:'SUBJECT-FINANCIAL-R1',formula:a+' − '+b,inputRefs:[input.metrics?.[a]?.sourceRef,input.metrics?.[b]?.sourceRef].filter(Boolean)});return x===null||y===null?null:x-y;};
 if(type==='BUSINESS'){const profit=difference('grossProfit','revenue','costOfSales'),revenue=get('revenue');derived.push({id:'grossMargin',value:profit!==null&&revenue>0?profit/revenue:null,unit:'RATIO',state:profit!==null&&revenue>0?'CALCULATED':'MISSING_OR_ZERO_DENOMINATOR',formulaVersion:'SUBJECT-FINANCIAL-R1',formula:'grossProfit / revenue',inputRefs:['grossProfit',input.metrics?.revenue?.sourceRef].filter(Boolean)});difference('workingCapital','currentAssets','currentLiabilities');}
 if(type==='COUNTRY'&&input.scope==='PUBLIC_FISCAL')difference('budgetBalance','governmentRevenue','governmentExpenditure');
 if(type==='TEAM'||type==='INSTITUTION')difference('budgetRemaining','budget','actualSpending');
 // Personal/Family analysis is delegated to its existing Authority; no duplicate personal formula engine.
 return {state:['PERSONAL','FAMILY'].includes(type)?'EXISTING_FINANCIAL_AUTHORITY_REQUIRED':'SCOPE_BOUND_OVERVIEW',scope:input.scope,currency:input.currency,period:input.period,accountingBasis:input.accountingBasis,consolidationBoundary:input.consolidationBoundary,metrics:Object.entries(input.metrics||{}).map(([id,m])=>({id,value:get(id),unit:m.unit,sourceRef:safeText(m.sourceRef),state:get(id)===null?'MISSING_OR_INCOMPATIBLE':'SOURCE_VALUE'})),derived,profitIsNotCash:true,governmentRevenueIsNotGDP:true,modelGeneratedFacts:false};
}
export function comparableFinancial(a,b) {return ['scope','currency','period','accountingBasis','consolidationBoundary','unit','formulaVersion'].every(k=>a[k]!==undefined&&a[k]===b[k]);}

function projectWorldTrend(trend,evidence){if(!trend)return null;const ids=new Set(evidence.map(e=>e.id)),r=trend.result;if(trend.owner!=='functions/_lib/world-measurement-observations.js'||r?.state!=='TIME_SERIES_TREND'||!Array.isArray(r.points)||r.points.length<12||!r.points.every(p=>ids.has(p.observationId)&&Number.isFinite(p.value)))return {state:'SOURCE_RECHECK_REQUIRED'};return {state:r.state,mode:trend.mode,periods:r.periods,unit:r.unit,points:r.points.map(p=>({period:p.period,value:p.value,sourceRef:p.observationId})),reading:'DESCRIPTIVE_SEQUENCE_NOT_CAUSAL_OR_FORECAST'};}

// Relationship membership is descriptive, never a substitute for independent access grants.
export async function readSubjectRelationships(registry,subjectId,actorId,{now=Date.now()}={}) {
 await authorizeSubject(registry,subjectId,actorId,{now});const view=await registry.query.getObjectView(subjectId),out=[];
 for(const row of view.relationships||[]) {
  if(!SUBJECT_RELATIONSHIPS.includes(row.relationship_type)||!activeAt(row,now))continue;
  const a=parse(row.attributes_json);
  if(a.verificationStatus!=='SOURCE_VERIFIED'||!a.sourceRef||!a.sourceVersion||a.purpose!=='SUBJECT_CONTEXT_READING')continue;
  if(a.visibility!=='PUBLIC'&&(!actorId||!Array.isArray(a.allowedAccountIds)||!a.allowedAccountIds.includes(actorId)))continue;
  const other=row.source_object_id===subjectId?row.target_object_id:row.source_object_id;
  try{await authorizeSubject(registry,other,actorId,{now});}catch{continue;}
  out.push({id:row.relationship_id,type:row.relationship_type,sourceSubjectId:row.source_object_id,targetSubjectId:row.target_object_id,validFrom:row.valid_from,validTo:row.valid_to,sourceRef:safeText(a.sourceRef),sourceVersion:safeText(a.sourceVersion),verificationStatus:a.verificationStatus,visibility:a.visibility,grantsAccess:false});
 }
 return out;
}
export const FINANCIAL_SCOPE_METRICS=Object.freeze({
 PERSONAL:['income','expenses','assets','liabilities','netWorth','cashFlow','emergencyReserve','debtObligations','insuranceCoverage','investmentAllocation'],
 HOUSEHOLD:['householdIncome','sharedExpenses','householdBudget','sharedAssets','sharedLiabilities','educationBudget','dependantCosts'],
 PROJECT:['budget','actualSpending','costAllocation','resourceBudget'],
 BUSINESS_OPERATIONS:['revenue','costOfSales','grossProfit','operatingExpenses','operatingProfit','netProfit','receivables','payables','cashPosition','currentAssets','currentLiabilities','cashFlow','budget','actualSpending'],
 INSTITUTION_BUDGET:['budget','actualSpending','funding','grants','restrictedFunds','projectExpenditure'],
 PUBLIC_FISCAL:['governmentRevenue','governmentExpenditure','publicDebt','debtService','budgetBalance'],
 MACROECONOMIC:['GDP','gdpGrowth','inflation','employment','trade','investment','productivity','currencyIndex']
});
