import {historicalQuestionScope} from './world-history-coverage-r1.js';
import {WORLD_COUNTRIES,countryText,countriesInQuestion} from './world-country-search.js';
function countriesForQuestion(value){const h=historicalQuestionScope(value),q=String(value);let rows=countriesInQuestion(value);if(/马六甲苏丹国|馬六甲蘇丹國/.test(q)&&!/(?:与|和|比较|比較).*苏丹|\bSudan\b/i.test(q))rows=rows.filter(x=>x.id!=='SDN');if(!rows.length&&h.countryCode){const country=WORLD_COUNTRIES.find(x=>x.id===h.countryCode);if(country)rows=[country];}return rows;}
// One presentation interpreter shared by Home discovery and World. No data authority.
export const WORLD_JOURNEYS=Object.freeze(['now','connections','history','compare']);
const modes=new Set(['landing',...WORLD_JOURNEYS,'companies']);
export function businessDecisionQuestion(value){return /(?:我的?|我们(?:的)?|我(?:经营|經營|的)|\b(?:my|our|own)\b).{0,24}(?:公司|企业|企業|生意|company|business)|(?:公司|企业|企業|\bcompan(?:y|ies)\b).{0,100}(?:提款|提取|扣税|扣稅|抵税|抵稅|税务|稅務|买车|買車|\b(?:withdraw|deduct|tax|car)\b)/i.test(String(value||''));}
export function worldQuestionTarget(value,{selected=false}={}){
 const q=String(value||'').normalize('NFKC').trim();
 if(!publicWorldQuestion(q)||businessDecisionQuestion(q)||!q||q.length>500||/自杀|自傷|自伤|suicid|emergency|急救|我的(?:账户|投资|工资|家庭|关系)|my (?:account|portfolio|salary|relationship)/i.test(q))return null;
 if(/相关文章|阅读.*文章|在哪里读|知识搜索|\b(?:knowledge|article|where.*read)\b/i.test(q))return null;
 let journey=null,symbol=null,company=null,region=null;
 if(/东方咖啡|東方咖啡|oriental\s*(?:kopi|coffee)|MYX:0338/i.test(q)){journey='companies';symbol='MYX:0338';}
 else if(/NVIDIA|英伟达|輝達/i.test(q)){journey='companies';company='NVIDIA';}
 else if(/\bMYX:\d{4}\b/i.test(q)){journey='companies';symbol=q.match(/MYX:\d{4}/i)[0].toUpperCase();}
 else if(/公司|企业研究|企業研究|上市|财报|財報|\b(?:company|companies|corporate|earnings|stock)\b/i.test(q))journey='companies';
 else if(!historicalQuestionScope(q).suggestHistory&&!/比较|比較|\bcompar(?:e|ison)\b|历史|歷史|\bhistory\b/i.test(q)&&/供应链|供應鏈|网络|網絡|贸易|貿易|港口|交通|城市|产业|產業|\b(?:supply\s*chains?|networks?|trade|ports?|transport|cities|urban|industr(?:y|ies))\b/i.test(q))journey='connections';
 else if(/比较|比較|对照|對照|\bcompar(?:e|ison)\b/i.test(q)&&(countriesForQuestion(q).length||/国家|國家|地区|地區|经济|經濟|人口|\b(?:countr(?:y|ies)|regions?|econom(?:y|ies)|population)\b/i.test(q)))journey='compare';
 else if(historicalQuestionScope(q).suggestHistory||/文明|历史|歷史|罗马|羅馬|\b(?:history|civilizations?|rome|roman)\b/i.test(q))journey='history';
 else if(/世界|地区|地區|经济|經濟|人口|能源|马来西亚|馬來西亞|\b(?:world|econom(?:y|ic)|population|energy|malaysia|regions?)\b/i.test(q))journey=/世界正在发生什么|世界正在發生什麼|understand the world|what.*happening.*world/i.test(q)?'landing':'now';
 else if(selected)journey='landing';
 if(!journey)return null;
 const countries=countriesForQuestion(q);if(journey==='compare'&&countries.length===1&&new Set(q.match(/\b(?:19|20)\d{2}\b/g)||[]).size>1)journey='now';if(/马来西亚|馬來西亞|malaysia/i.test(q))region='MYS';else region=countries[0]?.id||null;const topic=/经济|econom|gdp/i.test(q)?'economy':/人口|population/i.test(q)?'people':'connections';const year=q.match(/\b(19\d{2}|20\d{2})\b/)?.[1];
 const u=new URL('/world/','https://getphios.com');u.searchParams.set('worldJourney',journey);
 if(symbol)u.searchParams.set('symbol',symbol);if(company)u.searchParams.set('q',company);
 if(journey==='history'&&/罗马|羅馬|\b(?:rome|roman)\b/i.test(q))u.hash='v=2&mode=history&pane=cases&case=CA-T06-02';
 if(journey==='connections')u.hash='v=2&mode=current&pane=map&topic=connections';
 if(journey==='now'&&region)u.hash=new URLSearchParams({v:2,mode:'current',pane:'data',region,topic,...(year?{year}:{})}).toString();if(journey==='history'&&region)u.hash=new URLSearchParams({v:2,mode:'history',pane:'cases',region,topic}).toString();if(journey==='compare'&&countries.length>=2)u.hash=new URLSearchParams({v:2,mode:'compare',pane:'places',region:countries[0].id,baseline:countries[1].id,topic,...(year?{year}:{})}).toString();
 return {journey,href:u.pathname+u.search+u.hash,reason:'EXPLICIT_PUBLIC_WORLD_TASK',company,region};
}
export function worldRouteFromURL(value){
 const u=new URL(value,'https://getphios.com'),q=u.searchParams,h=new URLSearchParams(u.hash.slice(1)),explicit=q.get('worldJourney');
 let journey='landing';
 if(q.has('reading'))journey='history';
 else if(modes.has(explicit))journey=explicit;
 else if(q.has('symbol')||['company','market'].includes(q.get('intent')))journey='companies';
 else if(q.get('intent')==='compare'||q.has('objectCompare')||q.get('atlas')==='comparison'||h.get('mode')==='compare')journey='compare';
 else if(['connections','network','industry'].includes(q.get('intent')))journey='connections';
 else if(q.get('view')==='reconfiguration'||q.get('intent')==='current'||h.get('mode')==='current')journey='now';
 else if(['structure','history','timeline'].includes(q.get('intent'))||q.has('atlas')||h.get('mode')==='history'||Number(h.get('book'))>0)journey='history';
 else if(q.has('q'))journey=worldQuestionTarget(q.get('q'))?.journey||'now';
 return {journey,unknownIntent:!!explicit&&!modes.has(explicit),reading:q.get('reading'),topic:journey==='connections'?(h.get('topic')||'connections'):h.get('topic'),region:h.get('region'),companyQuery:journey==='companies'?q.get('q'):null};
}
export const worldJourneyFromURL=value=>worldRouteFromURL(value).journey;
export function worldJourneyURL(value,journey){
 if(!modes.has(journey))throw Error('WORLD_JOURNEY_INVALID');
 const u=new URL(value,'https://getphios.com');u.searchParams.set('worldJourney',journey);
 for(const k of ['reading','atlas','view','intent','explore','q','symbol'])u.searchParams.delete(k);
 const h=new URLSearchParams(u.hash.slice(1));
 if(journey==='connections'){h.set('mode','current');h.set('topic','connections');h.set('pane','map');}
 else if(['now','history','compare'].includes(journey)){h.set('mode',{now:'current',history:'history',compare:'compare'}[journey]);h.delete('pane');}
 u.hash=h.toString();return u;
}
export function worldNeedsLegacyReader(value){const u=new URL(value,'https://getphios.com');return ['reading','atlas','view','explore'].some(k=>u.searchParams.has(k))||u.hash==='#atlas'||u.hash==='#world-object-actions';}

// Public context parsing supplements the existing presentation interpreter; it grants no evidence or execution authority.
export function publicWorldQuestion(value){return typeof value==='string'&&value.trim().length>0&&value.length<=500&&!/@|\b\d{7,}\b|胸痛|呼吸困难|不想活|自杀|自傷|自伤|suicid|chest pain|cannot breathe|emergency|急救|我叫|我家|本人|我的(?:账户|投资|工资|家庭|关系|健康|地址|电话|证件|身份证|银行|孩子)|i (?:live|earn)|my (?:account|portfolio|salary|relationship|health|address|phone|email|passport|bank|child|family)|出生|birth.*(?:time|date)/i.test(value);}
function parseWorldQuestionBase(value,{locale='en',journey=null}={}){if(!publicWorldQuestion(value))return null;const originalQuestion=value.trim(),target=worldQuestionTarget(value),countries=countriesForQuestion(value),q=originalQuestion.toLowerCase(),historical=historicalQuestionScope(value);let period=null;const years=[...q.matchAll(/公元前\s*(\d{1,4})|\b(\d{1,4})\s*(bce|bc|ce|ad)\b|\b(\d{3,4})\b/g)].map(m=>({year:Number(m[1]||m[2]||m[4])*(m[1]||/bc/.test(m[3]||'')?-1:1),raw:m[0]}));if(years.length)period={kind:'YEAR_RANGE',start:Math.min(...years.map(x=>x.year)),end:Math.max(...years.map(x=>x.year)),raw:years.map(x=>x.raw).join('–')};else if(/过去|past|last|近.*年/.test(q))period={kind:'UNRESOLVED_RELATIVE',start:null,end:null,raw:originalQuestion};const topic=/经济|經濟|gdp|econom|人口|population/.test(q)?(/人口|population/.test(q)?'people':'economy'):/供应链|供應鏈|城市|贸易|trade|supply|cities|network/.test(q)?'connections':/能源|energy/.test(q)?'energy':/水|water/.test(q)?'water':null;return {kind:'PHIOS_WORLD_PUBLIC_QUESTION_V1',public:true,originalQuestion,normalizedQuestion:countryText(value),locale,requestedJourney:journey||target?.journey||'landing',requestedCompany:target?.journey==='companies'?(target.company||new URL(target.href,'https://getphios.com').searchParams.get('symbol')):null,resolvedCountryCode:countries[0]?.id||historical.countryCode||null,resolvedHistoricalEntity:historical.historicalEntity,requestedSpatialScope:countries[0]?.id||(/全球|worldwide|\bglobal\b/.test(q)?'GLOBAL':null),resolvedCountryName:countries[0]?.name[locale==='zh-Hans'?'zh':'en']||null,requestedTopic:topic,requestedPeriod:period,requestedComparison:(journey||target?.journey)==='compare'?countries.map(c=>c.id).slice(0,2):[],requestedCaseId:historical.relatedCaseId||(/罗马|羅馬|\brome\b|\broman\b/i.test(q)?'CA-T06-02':null),matchedSourceIds:[],coverageState:'NOT_CHECKED',answerState:'NEEDS_SCOPE_SELECTION',selectedAction:null,scopeAmendments:[]};}
export function parseWorldQuestion(value,options={}){const ctx=continueWorldQuestion(parseWorldQuestionBase(value,options),options.previous);if(ctx?.requestedJourney==='compare'&&ctx.requestedComparison.length===1&&Number.isInteger(ctx.requestedPeriod?.start)&&ctx.requestedPeriod.end>ctx.requestedPeriod.start){ctx.requestedJourney='now';ctx.requestedComparison=[];ctx.comparisonKind='TIME';}return ctx;}
export function currentWorldQuestion(){try{const q=history.state?.worldPublicQuestion;return q?.kind==='PHIOS_WORLD_PUBLIC_QUESTION_V1'&&q.public&&publicWorldQuestion(q.originalQuestion)?q:null;}catch{return null;}}
export function continueWorldQuestion(ctx,previous){
 if(!ctx)return ctx;
 const q=ctx.originalQuestion,follow=/\b(?:that|it|those|same|how about|what about|last year|previous year)\b|那(?:个|個|么|麼)|相比去年|和去年|与去年|與去年|上一年|新加坡呢|那么/i.test(q);
 const temporal=/\b(?:last year|previous year|year before)\b|去年|上一年/i.test(q)&&/比较|比較|相比|\bcompare/i.test(q);
 const validPrevious=previous?.kind==='PHIOS_WORLD_PUBLIC_QUESTION_V1'&&previous.public&&publicWorldQuestion(previous.originalQuestion)&&['now','compare'].includes(previous.requestedJourney);
 if(follow&&validPrevious){
  if(!ctx.resolvedCountryCode){ctx.resolvedCountryCode=previous.resolvedCountryCode;ctx.resolvedCountryName=previous.resolvedCountryName;ctx.requestedSpatialScope=previous.requestedSpatialScope;}
  if(!ctx.requestedTopic)ctx.requestedTopic=previous.requestedTopic;
  if(!ctx.requestedPeriod&&!temporal)ctx.requestedPeriod=previous.requestedPeriod;
  if(ctx.requestedJourney==='landing')ctx.requestedJourney='now';
  if(temporal){ctx.requestedJourney='now';ctx.requestedComparison=[];ctx.comparisonKind='TIME';const end=previous.requestedPeriod?.start===previous.requestedPeriod?.end?previous.requestedPeriod?.end:null;ctx.requestedPeriod=Number.isInteger(end)?{kind:'YEAR_RANGE',start:end-1,end,raw:q}:{kind:'UNRESOLVED_RELATIVE',start:null,end:null,raw:q};}
  ctx.contextSource='EXPLICIT_SAME_TAB_PUBLIC_QUESTION';
 }
 if(!ctx.requestedPeriod&&/\b(?:latest|current|now|today)\b|最新|当前|當前|目前|今天/i.test(q))ctx.requestedPeriod={kind:'LATEST_REQUESTED',start:null,end:null,raw:q};
 return ctx;
}
export function saveWorldQuestion(q,{push=false,url=null}={}){if(q&&!publicWorldQuestion(q.originalQuestion))throw Error('PRIVATE_QUERY_NOT_PUBLIC_CONTEXT');history[push?'pushState':'replaceState']({...history.state,worldPublicQuestion:q},'',url||location.href);}

// Public identity bridge, not a separate World router or private ownership grant.
export function worldCountryProfileURL(ctx,{dimension='identity'}={}){const code=ctx?.resolvedCountryCode;if(!WORLD_COUNTRIES.some(x=>x.id===code))return null;const u=new URL('/perspectives/profile/','https://getphios.com');u.search=new URLSearchParams({subjectType:'COUNTRY',country:code,dimension:ctx.countryDimension||dimension,locale:ctx.locale==='zh-Hans'?'zh-Hans':'en'});if(ctx.requestedJourney!=='history'&&ctx.requestedPeriod?.start===ctx.requestedPeriod?.end&&ctx.requestedPeriod?.start>=1960)u.searchParams.set('year',ctx.requestedPeriod.start);if(ctx.requestedComparison?.length===2){u.searchParams.set('compare',ctx.requestedComparison.find(id=>id!==code));u.searchParams.set('view','compare');}if(publicWorldQuestion(ctx.originalQuestion))u.searchParams.set('q',ctx.originalQuestion);return u.pathname+u.search;}

// A user-selected public Profile country is a viewing scope, never an ownership grant.
export function countryProfileWorldScope(ctx,url){const u=new URL(url,'https://getphios.com'),route=worldRouteFromURL(u),code=route.region;if(u.searchParams.get('subjectType')!=='COUNTRY'||!WORLD_COUNTRIES.some(c=>c.id===code)||!WORLD_JOURNEYS.includes(route.journey)||!ctx?.public)return ctx;const pair=u.searchParams.get('countryCompare')?.split(','),comparison=pair?.length===2&&pair[0]!==pair[1]&&pair.every(id=>WORLD_COUNTRIES.some(c=>c.id===id))?pair:ctx.requestedComparison;return {...ctx,countryDimension:['identity','expression','relationships','environment','growth','potential'].includes(u.searchParams.get('dimension'))?u.searchParams.get('dimension'):null,requestedComparison:comparison,resolvedCountryCode:code,requestedSpatialScope:code,requestedJourney:route.journey,scopeSelection:'EXPLICIT_PUBLIC_PROFILE_CHOICE',sourceQuestionUnchanged:true};}

export function worldCountryComparisonFromURL(value){const u=new URL(value,'https://getphios.com'),pair=u.searchParams.get('countryCompare')?.split(',');return pair?.length===2&&pair[0]!==pair[1]&&pair.every(id=>WORLD_COUNTRIES.some(c=>c.id===id))?pair:null;}
