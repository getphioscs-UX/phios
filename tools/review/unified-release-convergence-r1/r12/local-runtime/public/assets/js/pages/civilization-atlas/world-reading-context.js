import {worldPublicCopy} from './world-public-copy.js';
import {buildAtlasAskContext} from './atlas-ask-context.js';
import {atlasUrlFromState,reconfigurationAtlasUrlFromState} from './atlas-url-state.js';
export const local=(v,locale)=>worldPublicCopy(v?.[locale]||v?.en||'',locale);
export const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function activeWorldObject(index,book,state){
 const keys=book==='BOOK-5'?{timeline:state.timeWindowId,cases:state.primaryCaseId,world:state.snapshotId,comparison:state.comparisonFamilyId,trajectories:state.trajectoryIds?.[0],transitions:state.transitionWindowId,loss:state.lossTypeId||state.lossFamilyId}:{cases:state.primaryCaseId,windows:state.windowId,snapshots:state.snapshotId,dossiers:state.dossierId,lived:state.livedRealityDimensionId,positions:state.positionId};
 const id=book==='BOOK-6'&&state.sectionId?state.sectionId:keys[state.activeLayer];return id?index?.rows.find(r=>r.book===book&&r.id===id&&r.type!=='visual')||null:null;
}
export function worldObjectRelations(index,object){return object?(index.relations||[]).filter(r=>r.from===object.id||r.to===object.id):[];}
export function worldAskContext(book,state,data,locale,currentUrl){
 if(book==='BOOK-5')return buildAtlasAskContext(state,data,locale,currentUrl);
 const scope={schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v2.0.0',scopeType:'CIVILIZATION_RECONFIGURATION_ATLAS',bookCode:book,partCode:'PART-13',activeLayer:state.activeLayer};
 for(const key of ['windowId','snapshotId','dossierId','livedRealityDimensionId','positionId','sectionId'])if(state[key])scope[key]=state[key];
 if(state.primaryCaseId){scope.entityId=state.primaryCaseId;scope.caseIds=[state.primaryCaseId];}
 if(state.compareCaseIds?.length)scope.comparisonIds=state.compareCaseIds;
 const url=reconfigurationAtlasUrlFromState(currentUrl,state);url.searchParams.set('view','reconfiguration');
 return {contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-6',contextLabel:locale==='zh-Hans'?'世界重组资料':'World reconfiguration sources',contextRoute:url.pathname+url.search+url.hash,readingPath:'BOOK-6 > PART-13 > '+state.activeLayer,relatedKnowledgeRef:'BOOK:BOOK-6',retrievalScope:scope};
}
export function askURL(context){
 const p=new URLSearchParams();for(const key of ['contextType','contextRef','relatedKnowledgeRef','locale'])if(context[key])p.set(key,context[key]);
 const fields=['schemaVersion','scopeType','bookCode','partCode','activeLayer','time','timeWindowId','snapshotId','regionIds','caseIds','primaryCaseId','comparisonFamilyId','trajectoryIds','transitionWindowId','lossFamilyId','lossTypeId','evidenceClasses','entityId','windowId','dossierId','livedRealityDimensionId','positionId','sectionId','comparisonIds'];
 if(context.retrievalScope)p.set('retrievalScope',JSON.stringify(Object.fromEntries(fields.filter(k=>context.retrievalScope[k]!=null).map(k=>[k,context.retrievalScope[k]]))));
 if(context.contextRoute){const u=new URL(context.contextRoute,'https://world.invalid');const safe=new URL(u.pathname,'https://world.invalid');for(const key of ['atlas','view','case','period','snapshot','regions','cases','family','trajectories','tw','lossFamily','lossType','dossier','section','locale','reading'])if(u.searchParams.has(key))safe.searchParams.set(key,u.searchParams.get(key));if(u.pathname.startsWith('/world'))p.set('contextRoute',safe.pathname+safe.search);}
 return '/knowledge/ask/?'+p;
}
export function sameObjectDirection(index,object,layer){
 if(!object)return {state:'BROWSE',candidates:[]};
 const candidates=worldObjectRelations(index,object).map(r=>index.rows.find(x=>x.id===(r.from===object.id?r.to:r.from)&&x.book===object.book&&x.layer===layer&&x.type!=='visual')).filter(Boolean);
 const unique=[...new Map(candidates.map(x=>[x.id,x])).values()];return {state:unique.length===1?'ONE_MAPPING':unique.length?'CHOOSE_MAPPING':'NO_MAPPING',candidates:unique};
}
export function currentProjectionState(value){
 if(!value)return 'NOT_REQUESTED';if(value.currentLoadState==='SERVICE_ERROR')return 'SERVICE_ERROR';if(value.currentLoadState==='NOT_ACTIVATED')return 'NOT_ACTIVATED';
 const p=value.acceptedCurrent;if(!p)return 'NO_EVIDENCE';if(p.externalEvidence?.some(x=>x.currentFreshness==='STALE'))return 'PARTIAL_WITH_DATED_EXTERNAL_EVIDENCE';
 return p.sourceTimestamp?'ACCEPTED_SCOPE_FRESHNESS_UNVERIFIED':'ACCEPTED_SCOPE_DATE_MISSING';
}
export function stableWorldURL(book,state,currentUrl){const u=(book==='BOOK-5'?atlasUrlFromState:reconfigurationAtlasUrlFromState)(currentUrl,state);if(book==='BOOK-6')u.searchParams.set('view','reconfiguration');return u.pathname+u.search+u.hash;}
// Gate3-P1: bounded public evidence intents. Questions stay in caller memory.
export const WORLD_ANSWER_INTENTS=Object.freeze(['hmda','standards','income','my-cohort','mechanism','comparison','coverage','unsupported']);
export function worldQuestionPlan(question,{region='GLOBAL',year=2024,intent=null,period=null}={}){
 const q=String(question||'').trim();let countries=[];
 for(const [id,re] of [['USA',/美国|\bUSA\b|United States|American|HMDA|SLOOS/i],['MYS',/马来西亚|Malaysia|\bOPR\b/i],['CHN',/中国|China|Chinese/i],['JPN',/日本|Japan|Japanese|日元|\byen\b/i]])if(re.test(q)||(id==='USA'&&/\bUS\b/.test(q)))countries.push(id);
 let country=!intent&&countries.length===1?countries[0]:region;const years=[...new Set(q.match(/\b(?:19|20)\d{2}\b/g)||[])];const selectedPeriod=period||years[0]||String(year);let selected=intent;
 if(!selected){
  if(!q||q.length>1600||years.length>1)selected='unsupported';
  else if(countries.length>1||/跨国|排行|谁.*更高|rank.*countr|compar.*approval/i.test(q))selected='comparison';
  else if(/(?:GDP|人口|population)/i.test(q)&&/房贷|mortgage|approval|审批/i.test(q))selected='coverage';
  else if((/HMDA|行动.*记录|拒绝.*(?:占比|比率)|denial (?:share|rate)|income groups.*denial|denial.*income groups/i.test(q)||/mortgage|购房|房贷|home.purchase/i.test(q)&&/deni|reject|拒绝|行动|action/i.test(q))&&country==='USA')selected='hmda';
  else if(/SLOOS|银行.*标准|标准.*需求|standards|loan demand|bank rejections/i.test(q)&&country==='USA')selected='standards';
  else if(/(?:物价|CPI|price|cost).*(?:收入|income)|(?:收入|income).*(?:物价|CPI|price)/i.test(q)&&country==='MYS')selected='income';
  else if(/利率|\bOPR\b|interest rate|fixed.rate|mortgage payment/i.test(q))selected='mechanism';
  else if(/房贷|住房融资|批准金额|mortgage|approved loan|mortgage applications/i.test(q)&&country==='MYS')selected='my-cohort';
  else if(/租金|可负担|rents?|affordability/i.test(q))selected='unsupported';
  else selected='unsupported';
 }
 if(!WORLD_ANSWER_INTENTS.includes(selected))selected='unsupported';
 const publicScope={region:country,period:selectedPeriod,topic:'housing_credit',intent:selected};
 const req=(c,s,p)=>({country:c,series:s,period:p});let requests=[];
 if(selected==='hmda')requests=[req(country,'US_HMDA',selectedPeriod)];
 if(selected==='standards')requests=[req(country,'US_SLOOS',/第?\s*3\s*季|Q3|third quarter/i.test(q)&&!selectedPeriod.includes('-Q')?selectedPeriod+'-Q3':selectedPeriod)];
 if(selected==='income')requests=[req(country,'MY_CPI',selectedPeriod),req(country,'MY_INCOME',selectedPeriod)];
 if(selected==='my-cohort'||selected==='coverage')requests=[req(country,'MY_COHORT',selectedPeriod)];
 if(selected==='mechanism')requests=[req('GLOBAL','MECHANISM','GENERAL')];
 if(selected==='comparison')requests=[req('GLOBAL','COMPARISON',selectedPeriod)];
 return {intent:selected,scope:publicScope,requests,questionOriginal:q,deterministic:true};
}
export const safeWorldSource=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['ffiec.cfpb.gov','www.federalreserve.gov','api.data.gov.my','data.gov.my','storage.dosm.gov.my','www.consumerfinance.gov','getphios.com'].includes(u.hostname)?u.href:null}catch{return null}};
export async function queryWorldEvidence(query,{fetcher=fetch,timeoutMs=8000}={}){
 const failure=state=>({...query,state,observations:[],derivedMetrics:[],providerUsed:false,accountDataUsed:false});let timer;
 try{
  const controller=new AbortController();const response=await Promise.race([fetcher('/api/world-observations?'+new URLSearchParams(query),{signal:controller.signal,cache:'no-store'}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();const e=Error('TIMEOUT');e.name='TimeoutError';reject(e)},timeoutMs)})]);
  if(!response.ok)return failure(response.status===403?'NO_ACCESS':response.status===404?'MISSING_PERIOD':'SERVICE_ERROR');
  const b=await response.json(),e=b.evidence;
  if(!e||e.country!==query.country||e.series!==query.series||e.period!==query.period||e.providerUsed!==false||e.accountDataUsed!==false||!Array.isArray(e.observations)||!Array.isArray(e.derivedMetrics))return failure('SOURCE_ERROR');
  if(e.observations.some(o=>o.countryCode!==query.country||o.seriesId!==query.series||!o.observationPeriod.startsWith(query.period)||o.qualityState!=='OBSERVED'||typeof o.value!=='number'||!Number.isFinite(o.value)||o.value<0||!safeWorldSource(o.sourceUrl)||!/^[a-f0-9]{64}$/.test(o.rawArtifactHash)))return failure('SOURCE_ERROR');
  if(e.derivedMetrics.some(d=>!Number.isFinite(d.value)||!Number.isFinite(d.denominator)||d.denominator<=0))return failure('SOURCE_ERROR');
  if(e.state==='OBSERVED'&&(!e.observations.length||['US_HMDA','US_SLOOS'].includes(query.series)&&!e.derivedMetrics.length))return failure('SOURCE_ERROR');
  return e;
 }catch(e){return failure(e.name==='TimeoutError'||e.name==='AbortError'?'TIMEOUT':'SERVICE_ERROR')}finally{clearTimeout(timer)}
}
export function composeWorldAnswer(plan,evidence,locale='en'){
 const zh=locale==='zh-Hans',t=(z,e)=>zh?z:e;const answer={questionOriginal:plan.questionOriginal,locale,region:plan.scope.region,topic:plan.scope.topic,period:plan.scope.period,intent:plan.intent,answerState:'PARTIAL',directAnswer:'',mechanism:[],observations:[],derivedMetrics:[],missingEvidence:[],limits:[],relatedSources:[],suggestedFollowUps:[],providerUsed:false,accountDataUsed:false,mode:'BOUNDED_DETERMINISTIC'};
 const failed=evidence.find(e=>!['OBSERVED','NO_RELEASE','INCOMPARABLE'].includes(e.state));
 if(failed){answer.answerState=failed.state;answer.directAnswer=t('所选范围的证据未能取得，不能据此生成数值或判断。请保留范围，稍后重试或查看来源。','Evidence for this scope could not be obtained. No value or conclusion has been generated. Keep the scope and retry or inspect the source.');answer.missingEvidence=[({NO_ACCESS:t('来源拒绝访问。','The source denied access.'),MISSING_PERIOD:t('所选时期没有对应观察；未改用其他年份。','No observation matches the selected period; another year was not substituted.'),DEFINITION_MISMATCH:t('所选地区或指标定义与证据不一致。','The selected region or metric definition does not match the evidence.'),INCOMPARABLE:t('统计单位、频率或覆盖不可直接比较。','Units, frequency or coverage are not comparable.'),TIMEOUT:t('读取超时，未生成数值。','The read timed out; no value was generated.'),STALE:t('该数据版本已过期，需重新核验。','This data vintage is stale and needs revalidation.'),SOURCE_ERROR:t('来源格式或计算证据校验失败。','Source structure or calculation evidence failed validation.'),SERVICE_ERROR:t('证据服务连接失败。','The evidence service could not be reached.')})[failed.state]||t('所需证据未取得。','Required evidence was not obtained.')];return answer;}
 answer.observations=evidence.flatMap(e=>e.observations);answer.derivedMetrics=evidence.flatMap(e=>e.derivedMetrics).map(d=>({...d,computedAt:evidence.find(e=>e.derivedMetrics.includes(d))?.computedAt}));
 answer.relatedSources=answer.observations.map(o=>({href:o.sourceUrl,label:o.sourcePublisher,period:o.observationPeriod}));
 const pct=n=>new Intl.NumberFormat(zh?'zh-Hans':'en',{maximumFractionDigits:2}).format(n),num=n=>new Intl.NumberFormat(zh?'zh-Hans':'en',{maximumFractionDigits:2}).format(n);
 if(plan.intent==='hmda'){
  const d=answer.derivedMetrics[0];if(!d)return {...answer,answerState:'SOURCE_ERROR',directAnswer:t('缺少可验证的计算分母。','A verifiable denominator is missing.')};
  answer.answerState='ANSWERED_BOUNDED';answer.directAnswer=t(`在${plan.scope.period}年美国已限定的购房用途申报记录中，拒绝占比为${pct(d.value*100)}%：${num(d.numerator)}条拒绝记录 ÷ ${num(d.denominator)}条发放、批准未接受及拒绝记录。它不是所有申请人的拒绝概率。`,`Within the defined US home-purchase records for ${plan.scope.period}, the denial share is ${pct(d.value*100)}%: ${num(d.numerator)} denied records divided by ${num(d.denominator)} originated, approved-not-accepted and denied records. This is not every applicant’s rejection probability.`);
  answer.mechanism=[t('分组构成变化本身就可能改变总占比；这份未按收入分组的汇总不能区分申请者结构与银行标准的影响。','Applicant composition can change an aggregate share. This unstratified total cannot separate income-group composition from changes in bank standards.')];
  answer.limits=[t('仅贷款用途1及行动码1、2、3；撤回、不完整、购买贷款及预批准行动7/8不在分母。已发放记录仍可能来自预批准请求。','Only loan purpose1 and actions1,2,3. Withdrawn, incomplete, purchased loans and preapproval actions7/8 are excluded; originated records may still follow preapproval requests.'),t('未按收入、抵押顺位、居住用途或机构类型筛选；年度行动记录不是同一申请群组。缓存版本不是冻结年度发布版。','No income, lien, occupancy or reporter-type restriction. Annual action records are not a matched application cohort. The API cache is not a frozen annual release.')];
 }else if(plan.intent==='standards'){
  const std=answer.derivedMetrics.find(d=>d.metric==='net_tightening'),dem=answer.derivedMetrics.find(d=>d.metric==='net_stronger_demand');if(!std||!dem)return {...answer,answerState:'SOURCE_ERROR',directAnswer:t('调查计数缺失。','Survey counts are missing.')};
  answer.answerState='ANSWERED_BOUNDED';answer.directAnswer=t(`2024年第3季度，政府支持购房贷款类别的49家受访银行中，净收紧标准为${pct(std.value)}%，净需求增强为${pct(dem.value)}%。需求偏弱可与标准基本不变并存；这不是借款人拒贷率。`,`In 2024 Q3, among 49 responding banks in the government home-purchase category, net tightening was ${pct(std.value)}% and net stronger demand was ${pct(dem.value)}%. Weaker demand can coexist with basically unchanged standards. These are not borrower denial rates.`);
  answer.mechanism=[t('标准净比例是收紧减放松的银行比例；需求净比例是增强减减弱。两者回答不同问题。','The standards balance subtracts easing from tightening banks; demand subtracts weaker from stronger banks. They measure different questions.')];answer.limits=[t('只涵盖该类别受访美国本土银行，不按贷款金额加权，不含再融资；不能代表全部住宅房贷。','This respondent category is not loan-volume weighted, excludes refinancing and does not represent all residential mortgages.')];
 }else if(plan.intent==='income'){
  const c=answer.observations.filter(o=>o.seriesId==='MY_CPI'),i=answer.observations.find(o=>o.seriesId==='MY_INCOME');if(!c.length||!i)return {...answer,answerState:'MISSING_PERIOD',directAnswer:t('所选时期缺少其中一项证据，不能合成购买力判断。','One series is missing for this period; a purchasing-power conclusion cannot be combined.')};
  answer.answerState='ANSWERED_BOUNDED';answer.directAnswer=t(`${plan.scope.period}年马来西亚总体消费价格指数首月为${num(c[0].value)}、末月为${num(c.at(-1).value)}（2010=100）；该调查参考年的家庭月收入中位数为RM${num(i.value)}。前者是月度价格篮子，后者是公民家庭名义总收入的调查水平，不能直接合成实际购买力变化。`,`Malaysia’s overall CPI runs from ${num(c[0].value)} in the first available month to ${num(c.at(-1).value)} in the last for ${plan.scope.period} (2010=100). Median monthly household income for that survey reference year is RM${num(i.value)}. Monthly basket prices and survey-year citizen-household nominal gross income cannot be directly combined into real purchasing-power change.`);
  answer.limits=[t('不是月度收入序列，也不是个人可支配收入；未进行人口、篮子或时期对齐。','Income is not a monthly time series or individual disposable income. Population, basket and period alignment has not been performed.')];
 }else if(['my-cohort','coverage'].includes(plan.intent)){
  answer.directAnswer=t('不能由现有资料判断个人房贷是否更容易或更难获批。批准金额、GDP或人口都不能替代同一申请群组的申请件数及批准结果。贷款需求、银行标准和申请者条件须分别核验。','The available evidence cannot determine whether an individual mortgage is easier or harder to obtain. Approved amounts, GDP and population cannot replace application counts and outcomes for a matched cohort. Demand, standards and applicant circumstances require separate evidence.');answer.missingEvidence=[t('同一产品、机构覆盖、期间和申请群组的申请与批准件数，以及撤回、待审和重复申请处理。','Matched application and approved-outcome counts, aligned product, institution coverage and period, including pending, withdrawn and duplicate handling.')];
 }else if(plan.intent==='comparison'){
  answer.directAnswer=t('不能据现有不同口径资料排列国家房贷获批率。开发商融资收入、银行调查净比例和申请行动记录没有共同分母，也不能直接相互解释。','The available definitions cannot rank countries by mortgage approval rate. Developer funding receipts, bank survey balances and application-action records have no common denominator and cannot directly explain one another.');answer.missingEvidence=[t('相同贷款产品、申请群组、行动定义、期间、覆盖与许可。','Aligned products, application cohorts, action definitions, periods, coverage and rights.')];
 }else if(plan.intent==='mechanism'){
  answer.answerState='MECHANISM_ONLY';answer.directAnswer=t('利率变化会改变新增或重新定价借款的成本，从而影响家庭可用于日常消费的余量。固定利率贷款的本金与利息付款通常不会跟随政策利率立即改变；浮动贷款取决于合同指数、利差和重设时间。税费或保险也可能改变总付款。这是通用机制，不是本国本年的统计结论。','Rate changes can alter borrowing costs for new or repriced loans and the money left for everyday spending. Fixed-rate principal-and-interest payments generally do not immediately follow a policy-rate change; adjustable loans depend on the contract index, margin and reset date. Taxes or insurance can also change total payments. This is a general mechanism, not a local annual statistic.');
  answer.relatedSources=(evidence[0]?.mechanismSources||[]).map(s=>({href:s.sourceUrl,label:s.sourcePublisher}));answer.limits=[t('具体合同、费用和收入条件尚未输入；不作个人贷款或法律结论。','Contract terms, costs and income are not supplied. This is not an individual lending or legal determination.')];
 }else{
  answer.answerState='NOT_COVERED';answer.directAnswer=t('这轮有界数据尚不能回答这个问题。可以保留问题手动进入提问入口，或明确选择国家、年份和住房信贷指标；不会替换成不相关的示例。','This question is outside the bounded evidence coverage. Keep it for a manual Ask handoff, or choose a country, year and housing-credit measure. An unrelated example will not be substituted.');
 }
 const explanation=evidence.find(e=>e.explanations)?.explanations?.[locale];
 if(explanation&&['income','mechanism'].includes(plan.intent)){answer.mechanism.push(explanation.text);answer.relatedSources.push({href:explanation.canonicalUrl,label:t('PHI OS已发布解释','PHI OS published explanation'),kind:'interpretation',hash:explanation.rawArtifactHash});}
 if(answer.observations.length)answer.limits.push(t('这是注明版本的历史观察，不是实时数据；发布日期未保留的项目明确显示未知。','These are historical observations in a named vintage, not live data. Unretained publication dates remain explicitly unknown.'));
 answer.suggestedFollowUps=[t('这些数字的统计对象和分母是什么？','What population and denominator do these numbers describe?')];return answer;
}
