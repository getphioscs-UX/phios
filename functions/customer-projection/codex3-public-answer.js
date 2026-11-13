import {routeClientIntent} from '../public/client-intent-router.js';
import {createCkaFollowUpContext} from '../_lib/client-knowledge-ask.js';
import {publicFinancialAnswer} from './public-financial-answer.js';
import {parseWorldQuestion,worldQuestionTarget} from '../../assets/js/pages/civilization-atlas/world-journey-state-r3.js';
import {publicEntryAnswer} from '../../assets/js/pages/public-entry-answer.js';
import {companyMetricLabel} from '../../assets/js/pages/civilization-atlas/world-company-question.js';
import {retrievePublicCompany} from '../current-facts-gateway/world-company-projection.js';
import filings from '../../content/world/company-filings-r1.json';
import {readCountryEvidence} from '../_lib/world-country-evidence.js';
import {answerCoverageFrame} from './codex3-answer-coverage-r3.js';
import {publicFinancialQuestionR3} from './codex3-financial-question-r3.js';

export const CODEX3_PUBLIC_ANSWER_VERSION='CODEX3_PUBLIC_ANSWER_R2';
// Receivers must first validate their existing task, source and account gates.
// Only unselected public knowledge and current-question illustrations may enter.
export function codex3PublicScope({body={},contexts=[]}={}){
 if(body.task&&!['ENTRY','KNOWLEDGE_BASIC'].includes(body.task))return false;
 if(!Array.isArray(contexts)||body.contexts!=null&&!Array.isArray(body.contexts))return false;
 if((body.contexts||[]).some(c=>c?.contextType!=='KNOWLEDGE'||c.contextRef&&c.contextRef!=='PHIOS_GOVERNED_KNOWLEDGE'))return false;
 if(body.selectedMethod||body.methodGuidanceRequested||body.navigationHandoff||body.knowledgeContext )return false;
 if(body.followUpContext?.parentAnswerId&&!String(body.followUpContext.parentAnswerId).startsWith('CX3-COMPANY:'))return false;
 if(['subjectId','accountId','objectId','savedDraftRef','ownedMaterial','sourceVersion'].some(k=>body[k]!=null))return false;
 return contexts.every(c=>c.contextType==='KNOWLEDGE'&&(!c.contextRef||c.contextRef==='PHIOS_GOVERNED_KNOWLEDGE'));
}
export async function resolveCodex3PublicAnswer({question,locale='en',body={},contexts=[],env={},origin='https://phios.local'}={}){
 if(!codex3PublicScope({body,contexts})||typeof question!=='string'||!question.trim()||question.length>500)return null;
 const safetyRoute=routeClientIntent({question,locale});
 if(safetyRoute.safety?.safetyRoutingOnly)return null;
 const zh=locale==='zh-Hans',t=(en,cn)=>zh?cn:en;
 const make=({paragraphs,sources=[],limits=[],state='SUFFICIENT',binding={},next={href:'/knowledge/',label:t('Read the public sources','阅读公开来源')},mode='PUBLIC_SOURCE_FACT'})=>{
  const text=paragraphs.join('\n\n');
  binding={...binding,answerCoverage:answerCoverageFrame({question,locale,mode,binding,sources,state,next})};
  return {ok:true,mode,sourceBinding:binding,execution:{generationMode:CODEX3_PUBLIC_ANSWER_VERSION,providerCalls:0,providerInvoked:false},view:{surface:'ASK',locale,state,qualityOutcome:state,question,answer:{text,supporting:[]},basedOn:{sources,statement:t('Only the stated public sources or your unsaved question were used. No account material was read.','仅使用列出的公开来源或本次未保存问题，没有读取账户材料。')},limits:{items:limits},relatedKnowledge:[{title:next.label,href:next.href},...sources.filter(s=>s.href!==next.href).map(s=>({title:s.label,href:s.href}))],possibleNextStep:{kind:'RELATED_KNOWLEDGE',label:next.label,href:next.href},handoff:{available:false}},route:{outcome:'PUBLIC_SOURCE_ANSWER',codex3PublicAnswer:CODEX3_PUBLIC_ANSWER_VERSION,clarification:null,publicAnswer:{paragraphs,metrics:binding.metrics||[],sources:sources.map(s=>({title:s.label,href:s.href})),note:limits.join(' '),answerContract:CODEX3_PUBLIC_ANSWER_VERSION},primaryAction:next}};
 };

 let effectiveQuestion=question,anchor=null;
 const explicitNewQuestion=!!publicFinancialAnswer({question,locale})||!!parseWorldQuestion(question,{locale})?.requestedCompany||(/why|为什么|為什麼|为何|為何/i.test(question)&&/profit|earnings|利润|利潤|盈利/i.test(question)&&/cash|现金|現金|没钱|沒錢/i.test(question));
 const prior=explicitNewQuestion?null:body.followUpContext;
 if(prior?.parentAnswerId){
  const match=/^CX3-COMPANY:(MYX:\d{4}):([a-f0-9]{64})$/.exec(prior.parentAnswerId);
  anchor=match&&filings.companies.find(p=>p.symbol===match[1]&&p.verifiedReport?.sha256===match[2]);
  if(!anchor||prior.groundingBundleId!==anchor.verifiedReport.sha256)throw Object.assign(Error('SELECTED_SOURCE_VERSION_CHANGED'),{code:'SELECTED_SOURCE_VERSION_CHANGED',status:409});
  if(!Number.isInteger(prior.followUpDepth)||prior.followUpDepth<1)throw Object.assign(Error('CKA_FOLLOW_UP_DEPTH_INVALID'),{code:'CKA_FOLLOW_UP_DEPTH_INVALID',status:400});
  try{createCkaFollowUpContext({...prior,currentQuestion:question,accountState:'GUEST'});}catch(error){throw Object.assign(error,{code:error.message,status:409});}
  if(!parseWorldQuestion(question,{locale})?.requestedCompany&&!/\b(?:my|our|account)\b|我的|我们|保单|家庭/i.test(question))effectiveQuestion=anchor.name+' '+question;
  if(/which.*(?:statement|filing|source)|what.*(?:date|period)|哪.*(?:财报|報表|来源|年)|来源|來源|source/i.test(question)){
   const doc=anchor.verifiedReport;
   return make({paragraphs:[anchor.name+' · '+anchor.sourceId,t('Filing period ends: ','财报期末：')+anchor.filing.periodEnd,t('Published: ','公告发布日期：')+anchor.publishedAt,t('Source checked: ','来源核对：')+anchor.checkedAt,t('Document version: ','文件版本：')+doc.sha256],sources:[{label:anchor.sourceId,href:anchor.sourceUrl},{label:t('Original filing PDF','原财报PDF'),href:doc.url}],binding:{symbol:anchor.symbol,document:doc,sourceId:anchor.sourceId},next:{href:doc.url,label:t('Open the original filing','打开原财报')}});
  }
 }
 const profitCashQuestion=/why|为什么|為什麼|为何|為何/i.test(question)&&/profit|earnings|利润|利潤|盈利/i.test(question)&&/cash|现金|現金|没钱|沒錢|取不出钱|取不出錢/i.test(question);
 const illustration=publicFinancialQuestionR3({question,locale});
 if(illustration)return make({...illustration,next:{href:'/professional/financial/',label:t('Review the declared inputs','核对本次声明资料')},mode:'PUBLIC_FINANCIAL_QUESTION_ILLUSTRATION'});
 const financial=publicFinancialAnswer({question:profitCashQuestion?'Why can profit rise while operating cash flow falls?':question,locale});
 if(financial&&profitCashQuestion){financial.sourceBinding.questionClassification='GENERAL_PROFIT_CASH_MECHANISMS_NOT_PERSONAL_DIAGNOSIS';financial.paragraphs.push(t('Personal drawings additionally depend on obligations, restricted funds, business needs and the relevant ownership authority; no withdrawable amount has been established.','个人提款还取决于到期义务、受限资金、经营需要和相应归属权限，目前没有核定可提款金额。'));}
 if(financial)return make({paragraphs:financial.paragraphs,sources:financial.sources,limits:financial.unknowns,state:financial.kind==='VEHICLE_TAX_CONTEXT'&&financial.sourceBinding.missingContext?.length?'AMBIGUOUS':financial.kind==='CASH_OBLIGATION_DIFFERENCE'&&financial.sourceBinding.simpleDifferenceMinor==null?'INSUFFICIENT':'PARTIAL',binding:financial.sourceBinding,next:{href:'/professional/financial/',label:t('Check the statements and assumptions','核对报表与假设')},mode:'PUBLIC_FINANCIAL_EXPLANATION'});
 // A registered security code is an identifier, not a requested historical year.
 effectiveQuestion=effectiveQuestion.replace(/\bMYX:\d{4}\b/gi,code=>filings.companies.find(p=>p.symbol===code.toUpperCase())?.name||code);
 const parsed=parseWorldQuestion(effectiveQuestion,{locale});
 if(parsed?.requestedCompany){
  if(!filings.companies.some(p=>p.symbol===parsed.requestedCompany))return make({paragraphs:[t('The requested company is not covered by the registered public filings. No default company or price was substituted.','已登记公开财报未覆盖所问公司，没有换成默认公司或补造价格。')],state:'INSUFFICIENT',binding:{symbol:parsed.requestedCompany},next:{href:'/world/?intent=company',label:t('Check company coverage','核对公司覆盖范围')},mode:'PUBLIC_SOURCE_LIMIT'});
  try{
   const target=worldQuestionTarget(effectiveQuestion),route=await publicEntryAnswer(effectiveQuestion,locale,{outcome:'MATCHED_CAPABILITY',href:target?.href||'/world/'},async url=>{
    const u=new URL(url,origin);
    if(u.pathname!=='/api/current-facts'||u.searchParams.get('operation')!=='company')throw Error('UNEXPECTED_PUBLIC_SOURCE');
    return Response.json({ok:true,result:retrievePublicCompany(Object.fromEntries(u.searchParams))});
   });
   if(route.outcome==='SERVICE_FAILURE')return make({paragraphs:[route.clarification],state:'SERVICE_FAILURE',mode:'PUBLIC_SOURCE_UNAVAILABLE',next:{href:'/world/',label:t('Retry the source check','重试来源核对')}});
   if(!route.publicAnswer)return make({paragraphs:[route.clarification||t('The registered filing does not cover this company, measure or period.','已登记财报未覆盖该公司、指标或期间。')],state:'INSUFFICIENT',binding:{symbol:parsed.requestedCompany},next:{href:'/world/?intent=company',label:t('Check company coverage','核对公司覆盖范围')},mode:'PUBLIC_SOURCE_LIMIT'});
   const metrics=route.publicAnswer.metrics||[],known=metrics.filter(m=>m.known);
   const packet=filings.companies.find(p=>p.symbol===parsed.requestedCompany);
   const document=packet?.verifiedReport?{...packet.verifiedReport,snapshotVersion:filings.schemaVersion}:null;
   const paragraphs=metrics.map((metric,index)=>{
    if(metric.id==='livePrice'&&!metric.known)return t('Live share price: unavailable; no current quote verified.','实时股价：无法提供，尚无可核实的今日报价。');
    if(!metric.known)return route.publicAnswer.paragraphs[index];
    const period=metric.period||{},window=period.kind==='AS_OF'?t('as of ','截至 '):period.kind==='YTD'?t('YTD ','累计 '):t('period ','期间 ');
    return companyMetricLabel(metric.id,locale)+': '+new Intl.NumberFormat(locale).format(metric.value)+' '+metric.unit+' · '+window+(period.start?period.start+' – ':'')+period.end;
   });
   for(const metric of known)if(metric.period?.kind==='YTD')paragraphs.push(t('The operating cash-flow amount is year-to-date, ','经营现金流金额为累计值，')+(metric.period.start||'')+' – '+metric.period.end+t('; it is not the cash flow of a single quarter.','，不是单一季度的现金流。'));
   if(document)paragraphs.push(t('Filing source version: ','财报来源版本：')+filings.schemaVersion+' · '+document.sha256.slice(0,12));
   if(packet){paragraphs.push(t('Published: ','公告发布日期：')+packet.publishedAt+t('; last source check: ','；最后来源核对：')+packet.checkedAt+t('. This registered historical snapshot does not establish that no newer filing exists today.','。这份已登记历史快照不能证明今天没有更新的财报。'));}
   const result=make({paragraphs,sources:route.publicAnswer.sources.map(s=>({label:s.title,href:s.href})),limits:[route.publicAnswer.note],state:known.length===metrics.length?'SUFFICIENT':known.length?'PARTIAL':'INSUFFICIENT',binding:{symbol:parsed.requestedCompany,metrics,document,sourceId:packet?.sourceId||null,publishedAt:packet?.publishedAt||null,checkedAt:packet?.checkedAt||null,sourceKind:'DATED_REGISTERED_FILING_NOT_LIVE_QUOTE'},next:route.primaryAction,mode:known.length?'PUBLIC_SOURCE_FACT':'PUBLIC_SOURCE_LIMIT'});
   if(document)result.followUp={answerContext:{answerId:'CX3-COMPANY:'+packet.symbol+':'+document.sha256},knowledgeContext:{groundingBundleId:document.sha256},sourceRefs:[packet.sourceId],sourceVersion:document.sha256,scope:{type:'PUBLIC_COMPANY',symbol:packet.symbol},depth:prior?.followUpDepth||0,guestLimitReached:(prior?.followUpDepth||0)>=1};
   return result;
  }catch{return make({paragraphs:[t('No verified registered filing is available for the requested company and measure. No other company or live quote was substituted.','目前没有所问公司与指标的可核实登记财报，没有换成其他公司或补造实时报价。')],state:'SERVICE_FAILURE',binding:{symbol:parsed.requestedCompany},next:{href:'/world/?intent=company',label:t('Retry the source check','重试来源核对')},mode:'PUBLIC_SOURCE_UNAVAILABLE'});}
 }
 if(parsed?.resolvedCountryCode){
  const q=question.toLowerCase(),definition=/unemployment|失业|失業/i.test(q)?t('unemployment rate','失业率'):/inflation|通胀|通脹/i.test(q)?t('inflation rate','通胀率'):/population|人口/i.test(q)?t('population','人口'):/gdp|国内生产总值|國內生產總值/i.test(q)?'GDP':null;
  if(!definition)return null;
  const year=parsed.requestedPeriod?.start===parsed.requestedPeriod?.end?parsed.requestedPeriod?.start:null;
  try{
   const snapshot=await readCountryEvidence(env,origin,{explicitYear:year}),meta=snapshot.runtimeSourceMeta;
   // No numerical consumer is admitted merely by the existence of a pointer.
   const pending=/PENDING|CANDIDATE/i.test(meta.publicationStatus||'');
   return make({paragraphs:[t('Your question asks about ','你的问题是关于 ')+(parsed.requestedComparison?.length>1?parsed.requestedComparison.join(' / '):parsed.resolvedCountryCode)+' · '+definition+(year?' · '+year:''),pending?t('The country snapshot available in this worktree is a local candidate awaiting human acceptance. It cannot establish an approved answer or a current value. GDP, population and another year are not substituted.','本工作树中的国家快照仍是待人审的本机候选，不能据此签发已批准答案或当前数值；不会用GDP、人口或其他年份代答。'):t('This Ask consumer has not yet received an approved numerical country-answer contract. No unverified current number, substitute measure or year is supplied.','本Ask消费者尚未收到已批准的国家数值答复合约，不提供未核实的当前数值，也不替换指标或年份。')],sources:[{label:t('Country source version and publication boundary','国家来源版次与准入边界'),href:'/'+meta.snapshotPath,sourceVersion:meta.sha256}],state:'INSUFFICIENT',binding:{country:parsed.resolvedCountryCode,comparisonCountries:parsed.requestedComparison||[],requestedMeasure:definition,requestedYear:year,sourceVersion:meta.sha256,publicationStatus:meta.publicationStatus,currentnessClaimed:false},limits:[t('Public regional facts do not establish your household or business situation.','公共地区事实不证明你的家庭或企业情况。')],next:{href:'/world/',label:t('Review the source and period','核对来源及期间')},mode:'PUBLIC_SOURCE_REVIEW_PENDING'});
  }catch(error){return make({paragraphs:[t('The selected country source could not be verified. There is no reliable number to answer this measure and period. Retry the source check; no substitute measure is used.','所选国家来源暂时无法核实，不能提供该指标和期间的可靠数值；请重试来源核对，不替换成其他指标。')],state:'SERVICE_FAILURE',binding:{country:parsed.resolvedCountryCode,sourceFailure:error.code||error.message},next:{href:'/world/',label:t('Retry the source check','重试来源核对')},mode:'PUBLIC_SOURCE_UNAVAILABLE'});}
 }
 return null;
}
