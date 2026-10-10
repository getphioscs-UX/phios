import {createTestamentaryIntake,approveTestamentarySnapshot,PTRC_TESTAMENTARY_SECTIONS} from '../professional/financial/testamentary-intake-v1.js';
import {buildTestamentaryDraftReport} from '../professional/financial/testamentary-report-v1.js';
import {redactTestamentaryExport} from '../professional/financial/testamentary-security-v1.js';
import {evaluateWillShareIntegrity} from '../legal/will/share-integrity.js';
import {evaluateWillEscalation} from '../legal/will/escalation-gate.js';

const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
const str=v=>typeof v==='string'?v.trim().slice(0,600):'';
const titles=[['Scope & status','范围与状态'],['Identity & family','本人及家庭'],['Executors & guardians','执行人与监护人'],['Beneficiaries','受益人'],['Estate financial summary','遗产财务摘要'],['Trusts, gifts & exclusions','信托、赠与及排除安排'],['Digital assets','数字资产'],['Funeral & personal wishes','殡葬及个人意愿'],['Advisors & documents','顾问及文件'],['Gaps & conflicts','缺口与冲突'],['Review consent','审核同意'],['Legal review boundary','法律审核边界']];
function safeItem(item){
 const out={};for(const key of ['label','personId','relationship','minor','role','beneficiaryPersonId','assetId','category','currency','estateInclusion','ownership','documentLocation','institution','nomination','businessSuccession','instruction','substitutePersonId','evidence'])if(str(item?.[key]))out[key]=str(item[key]);
 if(out.currency&&!/^[A-Z]{3}$/.test(out.currency))throw new TypeError('INVALID_CURRENCY');
 for(const key of ['value','percentage'])if(item?.[key]!==''&&item?.[key]!=null){const n=Number(item[key]);if(!Number.isFinite(n)||n<0)throw new TypeError('INVALID_VALUE');out[key]=n;}
 return out;
}
export async function onRequestPost({request}){
 try{
  const raw=await request.text();if(raw.length>200000)return reply({ok:false,error:'INTAKE_TOO_LARGE'},413);
  const body=JSON.parse(raw);
  if(body.consent!==true||body.confirmedForReview!==true)return reply({ok:false,error:'EXPLICIT_REVIEW_CONSENT_REQUIRED'},403);
  if(body.financialImport&&body.financialImportConsent!==true)return reply({ok:false,error:'WILL_ASSEMBLY_CONSENT_REQUIRED'},403);
  const currency=str(body.currency),date=str(body.dataDate),jurisdiction=str(body.jurisdiction);
  if(!/^[A-Z]{3}$/.test(currency)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||!jurisdiction)throw new TypeError('CONTEXT_REQUIRED');
  const sections={};
  for(const id of PTRC_TESTAMENTARY_SECTIONS){const src=body.sections?.[id]||{};if(src.items?.length>100)throw new TypeError('TOO_MANY_ITEMS');const items=(Array.isArray(src.items)?src.items:[]).map(safeItem);const status=['UNSET','KNOWN','PARTIAL','UNKNOWN','NOT_APPLICABLE'].includes(src.status)?src.status:'UNSET';if(status==='NOT_APPLICABLE'&&items.length)throw new TypeError('CONTRADICTORY_STATUS');sections[id]={status,items,sourceReferences:items.length||['KNOWN','PARTIAL'].includes(status)?['CUSTOMER_DECLARATION']:[]};}
  const persons=[...sections.identity.items,...sections.family.items],ids=new Set();
  for(const p of persons){if(!p.personId||ids.has(p.personId))throw new TypeError('PERSON_REFERENCE_REQUIRED');ids.add(p.personId);}
  for(const id of ['executors','guardians','beneficiaries'])for(const p of sections[id].items)if(!ids.has(p.personId))throw new TypeError('UNDECLARED_PERSON_REFERENCE');
  const share=evaluateWillShareIntegrity({beneficiaryPersonIds:sections.beneficiaries.items.map(p=>p.personId),residuaryDistribution:sections.gifts.items.filter(p=>p.category==='RESIDUE_SHARE').map(p=>({beneficiaryPersonId:p.beneficiaryPersonId,percentage:p.percentage})),distributions:sections.gifts.items.filter(p=>p.category!=='RESIDUE_SHARE').map(p=>({distributionType:p.category,assetId:p.assetId,beneficiaryPersonIds:[p.beneficiaryPersonId]}))});
  const inventory=structuredClone({assets:sections.assets.items,liabilities:sections.liabilities.items});
  const guaranteeInput=body.sections?.guarantees?.items;
  if(guaranteeInput?.length>100)throw new TypeError('TOO_MANY_GUARANTEES');
  const guarantees=(Array.isArray(guaranteeInput)?guaranteeInput:[]).map(safeItem);
  // PTRC-W9 sums numeric values. Do not pass a misleading partial total into that owner.
  const complete=sections.assets.status==='KNOWN'&&sections.liabilities.status==='KNOWN'&&inventory.assets.length>0&&inventory.liabilities.length>0&&inventory.assets.every(a=>['INCLUDED','EXCLUDED'].includes(a.estateInclusion)&&typeof a.value==='number'&&(!a.currency||a.currency===currency))&&inventory.liabilities.every(a=>typeof a.value==='number'&&(!a.currency||a.currency===currency));
  if(complete){sections.assets.items=sections.assets.items.filter(a=>a.estateInclusion==='INCLUDED');}
  else {sections.assets.items=sections.assets.items.map(({value,...a})=>a);sections.liabilities.items=sections.liabilities.items.map(({value,...a})=>a);}
  sections.review_consent={status:'KNOWN',items:[{label:'Explicit customer confirmation for informational review'}],sourceReferences:['CUSTOMER_REVIEW_CONSENT']};
  const now=new Date(),retentionUntil=new Date(now.getTime()+15*60*1000).toISOString();
  const intake=createTestamentaryIntake({caseId:`EPHEMERAL-${crypto.randomUUID()}`,clientId:'REQUEST_ONLY',jurisdiction,currency,dataDate:date,sections});
  const snapshot=await approveTestamentarySnapshot(intake,{reviewConsentReference:'CUSTOMER_REVIEW_CONSENT',approvedByRole:'CLIENT',retentionUntil});
  const report=redactTestamentaryExport(buildTestamentaryDraftReport(snapshot));
  const escalation=evaluateWillEscalation({jurisdiction,customClauseRequested:sections.gifts.items.some(p=>p.instruction),companySuccession:inventory.assets.some(p=>p.category==='BUSINESS_INTEREST'),crossBorderEstate:body.crossBorderEstate===true});
  const zh=body.locale==='zh-Hans',pick=p=>p[zh?1:0],names=new Map(persons.map(p=>[p.personId,p.label||pick(['Unnamed person','未命名人士'])]));
  const reviewQuestions=[];
  if(persons.some(p=>p.minor==='YES')&&!sections.guardians.items.length)reviewQuestions.push(pick(['You declared a minor dependant. Confirm the guardian arrangements with your reviewer.','你申报了未成年受养人，请与审核人员确认监护安排。']));
  if(!sections.executors.items.some(p=>p.role==='SUBSTITUTE'))reviewQuestions.push(pick(['Confirm whether a substitute executor is needed.','请确认是否需要替补执行人。']));
  if(inventory.assets.some(p=>p.estateInclusion==='UNKNOWN'||!p.estateInclusion))reviewQuestions.push(pick(['Confirm ownership, nomination and estate inclusion before relying on any estate total.','依赖遗产总额之前，请确认所有权、提名及遗产纳入范围。']));
  const view={title:pick(['Estate & Will Planning Report','遗产与遗嘱规划报告']),state:'DRAFT_REPORT',date,currency,professionalReviewRequired:true,jurisdictionReviewRequired:true,executedInstrument:false,legalValidityDetermined:false,persisted:false,expiresAt:retentionUntil,
   boundary:pick(['This report organizes the information and intentions you provided for estate and Will planning. It is not an executed Will and does not determine legal validity. Professional legal review may be needed before documents are prepared or signed.','本报告用于整理你提供的遗产与遗嘱规划资料及意愿。它不是已经签署并生效的遗嘱，不会自动判断法律效力。在正式制作或签署法律文件之前，相关内容可能需要专业法律审核。']),
   calculation:complete&&report.derivedCalculations.status==='CALCULATED'?report.derivedCalculations.values:null,
   reviewQuestions,
   distribution:{requiresReview:share.status!=='VALID'||new Set(sections.gifts.items.filter(p=>p.category==='RESIDUE_SHARE').map(p=>p.beneficiaryPersonId)).size!==sections.gifts.items.filter(p=>p.category==='RESIDUE_SHARE').length,percentagesRebalanced:false,issues:share.issues.map(i=>({code:i.code}))},
   legalReviewRequired:escalation.automaticAssemblyBlocked,
   sections:report.outline.map((s,i)=>({title:pick(titles[i]),sectionId:s.sectionId,requiresConfirmation:s.gaps.length>0,items:['scope_and_status','gaps_and_conflicts','review_consent','legal_review_boundary'].includes(s.sectionId)?[]:[...s.sourceSections.flatMap(id=>inventory[id]||sections[id]?.items||[]),...(s.sectionId==='estate_financial_summary'?guarantees.map(g=>({...g,label:`${pick(['Contingent guarantee — not deducted','或有担保 — 未扣除'])}: ${g.label||''}`})):[])].map(p=>({label:names.get(p.personId)||p.label||names.get(p.beneficiaryPersonId)||pick(['Item to review','待审核项目']),instruction:p.instruction||null,details:[['ownership','Declared ownership','申报所有权'],['institution','Institution / provider','机构／服务商'],['nomination','Nomination to review','待审核提名'],['businessSuccession','Business succession intention','企业传承意愿']].filter(([key])=>p[key]).map(([key,en,zh])=>({label:pick([en,zh]),value:p[key]})),value:p.value??null,currency:p.currency||currency,role:p.role==='SUBSTITUTE'?pick(['Substitute','替补人选']):p.role==='PRIMARY'?pick(['Primary','主要人选']):null,percentage:p.percentage??null,documentLocation:p.documentLocation||null}))}))};
  for(const section of view.sections){
   if(section.sectionId==='legal_review_boundary')section.message=view.boundary;
   else if(section.sectionId==='scope_and_status')section.message=pick(['Information draft for professional and jurisdictional review. It is not a released legal instrument.','本资料草稿供专业及司法管辖区审核，并非已发布的法律文件。']);
   else if(section.sectionId==='review_consent')section.message=pick(['You explicitly confirmed these inputs for this temporary review. Nothing was saved automatically.','你已明确确认这些输入用于本次临时审核。没有自动保存资料。']);
   else if(section.sectionId==='gaps_and_conflicts')section.message=pick([`${report.warnings.gaps.length} information sections need confirmation; ${share.issues.length} distribution issues need review.`,`${report.warnings.gaps.length} 个资料章节需要确认；${share.issues.length} 项分配问题需要审核。`]);
   else if(!section.items.length)section.message=section.requiresConfirmation?pick(['Not provided or not yet confirmed.','未提供或尚未确认。']):pick(['No applicable items were declared for this section.','本节未申报适用项目。']);
  }
  return reply({ok:true,view});
 }catch{return reply({ok:false,error:'ESTATE_INTAKE_REQUIRES_CORRECTION'},400);}
}
export async function onRequestGet(){return reply({ok:false,error:'POST_ONLY'},405);}
