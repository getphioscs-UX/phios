import {buildBaziFullReading} from '../../functions/api/bazi-full-reading.js';

const STEMS=['JIA','YI','BING','DING','WU','JI','GENG','XIN','REN','GUI'];
const BRANCHES=['ZI','CHOU','YIN','MAO','CHEN','SI','WU','WEI','SHEN','YOU','XU','HAI'];
const ZH_STEM={JIA:'甲',YI:'乙',BING:'丙',DING:'丁',WU:'戊',JI:'己',GENG:'庚',XIN:'辛',REN:'壬',GUI:'癸'};
const ZH_BRANCH={ZI:'子',CHOU:'丑',YIN:'寅',MAO:'卯',CHEN:'辰',SI:'巳',WU:'午',WEI:'未',SHEN:'申',YOU:'酉',XU:'戌',HAI:'亥'};
const SCENARIOS=[
 {code:'CLASH_NETWORK',branches:['ZI','WU','YIN','SHEN'],focus:'branch_clash'},
 {code:'SIX_COMBINATION',branches:['ZI','CHOU','MAO','XU'],focus:'six_combination'},
 {code:'HARM_NETWORK',branches:['ZI','WEI','SHEN','HAI'],focus:'branch_harm'},
 {code:'BREAK_NETWORK',branches:['ZI','YOU','CHEN','CHOU'],focus:'branch_break'},
 {code:'THREE_HARMONY_WATER',branches:['SHEN','ZI','CHEN','YIN'],focus:'three_harmony'},
 {code:'THREE_MEETING_WOOD',branches:['YIN','MAO','CHEN','XU'],focus:'three_meeting'},
 {code:'THREE_PUNISHMENT',branches:['YIN','SI','SHEN','MAO'],focus:'three_punishment'},
 {code:'SELF_PUNISHMENT_REPEAT',branches:['CHEN','CHEN','WU','WU'],focus:'self_punishment_repeat'},
 {code:'ZI_MAO_PUNISHMENT',branches:['ZI','MAO','XU','WEI'],focus:'punishment_pair'},
 {code:'MIXED_RELATIONS',branches:['ZI','YIN','CHEN','SI'],focus:'mixed'},
 {code:'THREE_HARMONY_WOOD',branches:['HAI','MAO','WEI','SI'],focus:'three_harmony'},
 {code:'THREE_MEETING_WATER',branches:['HAI','ZI','CHOU','SHEN'],focus:'three_meeting'}
];
const VARIANTS=[
 {code:'COMPLETE_ACTIVE',hour:true,current:'ACTIVE',annual:true},
 {code:'HOUR_UNKNOWN',hour:false,current:'ACTIVE',annual:true},
 {code:'ACTIVE_ALTERNATE',hour:true,current:'ACTIVE',annual:true},
 {code:'ANNUAL_RELATION_SHIFT',hour:true,current:'ACTIVE',annual:true},
 {code:'TRANSITION_DAY',hour:true,current:'TRANSITION_DAY',annual:true},
 {code:'ANNUAL_UNAVAILABLE',hour:true,current:'ACTIVE',annual:false},
 {code:'CURRENT_UNAVAILABLE',hour:true,current:'UNAVAILABLE',annual:true},
 {code:'HOUR_UNKNOWN_ACTIVE_ALT',hour:false,current:'ACTIVE',annual:true}
];

function sx(index){const i=((index%60)+60)%60;return {index:i+1,stemCode:STEMS[i%10],branchCode:BRANCHES[i%12]};}
function pairForBranch(branchCode,choice=0){const b=BRANCHES.indexOf(branchCode);if(b<0)throw new Error(`UNKNOWN_BRANCH:${branchCode}`);return sx(b+12*(choice%5));}
function rotate(a,n){const x=((n%a.length)+a.length)%a.length;return [...a.slice(x),...a.slice(0,x)];}
function clone(v){return JSON.parse(JSON.stringify(v));}
function caseId(n){return `BAZI-FP-W17-${String(n).padStart(3,'0')}`;}

export function generateCampaignCases(){
 const out=[];let n=0;
 for(let s=0;s<SCENARIOS.length;s++)for(let v=0;v<VARIANTS.length;v++){
  n++;const scenario=SCENARIOS[s],variant=VARIANTS[v],branches=rotate(scenario.branches,v%4);
  const pillarPairs=branches.map((b,p)=>pairForBranch(b,(s+v+p)%5));
  const currentCycleNumber=(s*3+v)%8+1;
  const annualIndex=(s*13+v*7+10)%60;
  out.push({caseId:caseId(n),ordinal:n,scenarioCode:scenario.code,scenarioFocus:scenario.focus,variantCode:variant.code,locale:n%2?'zh-Hans':'en',pillarPairs,includeHour:variant.hour,currentLuckState:variant.current,annualAvailable:variant.annual,currentCycleNumber,annualIndex,targetYear:2032+n,targetDate:`${2032+n}-10-15`,humanReviewSelected:(v===s%8||v===(s+4)%8)});
 }
 return out;
}

export function buildInputs(spec){
 const p=spec.pillarPairs;const positions=['YEAR','MONTH','DAY','HOUR'];const items=[];
 for(let i=0;i<(spec.includeHour?4:3);i++){
  items.push({code:`${positions[i]}_STEM`,value:p[i].stemCode,rawValue:null,meta:{sexagenaryIndex:p[i].index}});
  items.push({code:`${positions[i]}_BRANCH`,value:p[i].branchCode,rawValue:null,meta:{sexagenaryIndex:p[i].index}});
 }
 const monthIndex=p[1].index-1;const startAge=5.25+(spec.ordinal%8)*0.125;const cycles=[];
 for(let i=1;i<=8;i++){const q=sx(monthIndex+i);cycles.push({code:'LUCK_CYCLE',value:`${q.stemCode}-${q.branchCode}`,rawValue:null,startAge:startAge+(i-1)*10,endAge:startAge+i*10,cycleNumber:i,certainty:'DETERMINISTIC'});}
 const projectionId=`CMP-${spec.caseId}`;
 const canonicalProjection={schemaVersion:'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0',projectionId,method:{publicMethodCode:'BAZI_PROJECTION',publicLabel:'Bazi Projection',publicLabels:{en:'Bazi Projection','zh-Hans':'八字投射'},internalReference:{opaqueId:`MREF-${spec.caseId}`,protected:true,rawIdentityExposed:false},version:'0.1.0',status:'PRODUCTION_BOUND_SCOPE',calculationMode:'DETERMINISTIC_BOUND_SCOPE'},calculation:{status:spec.includeHour?'COMPLETE':'PARTIAL',deterministic:true,values:[],coordinates:null,structures:[{code:'FOUR_PILLARS',items}],cycles,positions:[]},projection:{status:spec.includeHour?'COMPLETE':'PARTIAL',clientRenderable:true,productionResult:true,coreSchemaExposed:false,unknownDisclosureRequired:!spec.includeHour},unknown:spec.includeHour?[]:[{code:'BZR_HOUR_PILLAR_UNKNOWN',category:'INPUT_COMPLETENESS',scope:'BZR_HOUR_PILLAR',reasonCodes:['BIRTH_TIME_UNKNOWN']}],evidence:[{type:'RUNTIME_AUTHORITY',status:'AVAILABLE',sourceCode:'BAZI_FP_W17',reference:'GOVERNED_SYNTHETIC_DOWNSTREAM_CAMPAIGN',version:'1.0.0',confidence:'HIGH'}],version:{methodRegistryVersion:'2.0.0',runtimeVersion:'1.0.0',adapterVersion:'1.0.0',inputContractVersion:'1.0.0',projectionContractVersion:'1.0.0'},execution:{requestId:spec.caseId,status:'EXECUTED_BOUND_SCOPE',mpaDecision:{authorityOwner:'MPA',decision:'ELIGIBLE',dispatchAllowed:true,state:'PRODUCTION_AUTHORITY_GRANTED_FOR_BOUND_SCOPE'},runtimeIdentity:'MCD_CANONICAL_PROJECTION_RUNTIME@1.0.0',executedAt:'2026-08-29T00:00:00.000Z'},interpretation:{included:false,principle:'CALCULATION_NOT_EQUAL_INTERPRETATION',meaningAuthorityCreated:false,realityReadingCreated:false,professionalJudgmentCreated:false}};
 const currentCycle=cycles[spec.currentCycleNumber-1];const [cs,cb]=currentCycle.value.split('-');
 const currentLuckCycle=spec.currentLuckState==='ACTIVE'?{status:'AVAILABLE',state:'ACTIVE',current:{cycleNumber:spec.currentCycleNumber,pillar:{stemCode:cs,branchCode:cb},startDate:`${spec.targetYear-5}-01-01`,endDate:`${spec.targetYear+5}-01-01`,direction:'FORWARD'},candidates:[],firstCycleStartDate:'2010-01-01',direction:'FORWARD',startAge:{years:Math.floor(startAge),months:Math.round((startAge%1)*12),days:0},reasonCodes:[]}:
 spec.currentLuckState==='TRANSITION_DAY'?{status:'PARTIAL',state:'TRANSITION_DAY',current:null,candidates:[{cycleNumber:Math.max(1,spec.currentCycleNumber-1)},{cycleNumber:spec.currentCycleNumber}],firstCycleStartDate:'2010-01-01',direction:'FORWARD',startAge:{years:Math.floor(startAge),months:Math.round((startAge%1)*12),days:0},reasonCodes:['LUCK_CYCLE_TRANSITION_DAY']}:
 {status:'UNAVAILABLE',state:'UNAVAILABLE',current:null,candidates:[],firstCycleStartDate:'2010-01-01',direction:'FORWARD',startAge:{years:Math.floor(startAge),months:Math.round((startAge%1)*12),days:0},reasonCodes:['CURRENT_LUCK_CYCLE_UNAVAILABLE']};
 const annualPair=sx(spec.annualIndex);const annualContext=spec.annualAvailable?{status:'AVAILABLE',annualPillar:{year:spec.targetYear,stemCode:annualPair.stemCode,branchCode:annualPair.branchCode,sexagenaryIndex:annualPair.index},liChunUtcIso:`${spec.targetYear}-02-04T00:00:00.000Z`,liChunLocalDate:`${spec.targetYear}-02-04`,liChunLocalTime:'08:00:00',reasonCodes:[]}:{status:'UNAVAILABLE',annualPillar:null,liChunUtcIso:null,liChunLocalDate:null,liChunLocalTime:null,reasonCodes:['ANNUAL_CONTEXT_UNAVAILABLE']};
 const temporalProjection={schemaVersion:'PHI-OS-BZR-TEMPORAL-PROJECTION-v1.0.0',capabilityCode:'BZR_TEMPORAL',capabilityVersion:'2.0.0',sourceMethodCode:'BAZI',sourcePluginCode:'BZR',sourceNatalProjectionId:projectionId,projectionId:`BZTP-${spec.caseId}`,targetContext:{targetDate:spec.targetDate,targetTime:'12:00:00',targetTimezone:{iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00',offsetMinutes:480,source:'EXPLICIT_REQUEST'}},executionCompleteness:spec.annualAvailable&&spec.currentLuckState==='ACTIVE'?'COMPLETE':'PARTIAL',natal:{pillars:[]},currentLuckCycle,annualContext,relations:[],unknown:[...(!spec.annualAvailable?[{code:'BZR_ANNUAL_CONTEXT_UNAVAILABLE'}]:[]),...(spec.currentLuckState==='TRANSITION_DAY'?[{code:'BZR_CURRENT_LUCK_CYCLE_TRANSITION_DAY'}]:[]),...(spec.currentLuckState==='UNAVAILABLE'?[{code:'BZR_CURRENT_LUCK_CYCLE_UNAVAILABLE'}]:[])],evidence:[],boundaries:{fortunePredictionCreated:false,eventPredictionCreated:false,professionalJudgmentCreated:false,goodBadScoreCreated:false,methodVotingCreated:false}};
 return {canonicalProjection,temporalProjection};
}

function flattenCustomerText(report){return JSON.stringify({title:report.title,subtitle:report.subtitle,boundary:report.boundary,keyPoints:report.keyPoints,sections:report.sections.map(x=>({title:x.title,dek:x.dek,paragraphs:x.paragraphs,blocks:x.blocks?.map(b=>({title:b.title,text:b.text})),items:x.items}))});}
export function presentedSchoolText(b,locale){const m={ZI_PING_MONTH_COMMAND_USE_v1:['子平从月令与格局成败进入，继续核对哪一项作用因素真正成立；当前条件不足时，不强定唯一用神。','Zi Ping starts from the month command and pattern formation/defeat conditions, then tests which operative factor is actually established; no single useful god is forced when conditions remain incomplete.'],DI_TIAN_SUI_TI_YONG_BALANCE_v1:['体用视角观察整盘哪些力量偏重、哪些作用可形成平衡，并允许候选有先后层次，而不是只保留一个答案。','The Ti-Yong lens looks at what is over-emphasized in the whole chart and what could restore balance, allowing ordered candidates rather than one forced answer.'],DI_TIAN_SUI_CLIMATE_TIAOHOU_v1:['调候单独观察寒暖与燥湿，不把气候需要直接等同于身强身弱，也不自动合并成通用喜用神。','The climate/tiaohou lens separately examines thermal and dry/wet conditions, without equating climate needs with strength or a universal useful god.']};return (m[b.schoolCode]||[b.text,b.text])[locale==='zh-Hans'?0:1]};
function duplicateParagraphs(report,locale){const a=report.sections.flatMap(s=>[...(s.paragraphs||[]),...(s.blocks||[]).map(b=>presentedSchoolText(b,locale))]).map(x=>String(x||'').trim()).filter(Boolean);return a.length-new Set(a).size;}
export async function runMachineCase(spec,{locale=spec.locale}={}){
 const {canonicalProjection,temporalProjection}=buildInputs(spec);
 const body={schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale};
 const a=await buildBaziFullReading(clone(body));const b=await buildBaziFullReading(clone(body));
 const txt=flattenCustomerText(a.report);const forbidden=['W2_STRONG_WEAK','W5_PRIMARY_PATTERN','W6_','ZI_PING_MONTH_COMMAND_USE_v1','DI_TIAN_SUI_TI_YONG_BALANCE_v1','DI_TIAN_SUI_CLIMATE_TIAOHOU_v1','PRIMARY_EXPLANATION','REFERENCE_ONLY'];
 const relationTypes=[...new Set(a.readingIR.sections.relationships.items.map(x=>x.type))];const temporalRelationTypes=[...new Set([...a.readingIR.sections.timing.interactions.liuNianToNatal,...a.readingIR.sections.timing.interactions.liuNianToCurrentDaYun,...a.readingIR.sections.timing.interactions.currentDaYunToNatal,...a.readingIR.sections.timing.interactions.crossLayerGroups].map(x=>x.type))];
 const checks={pipeline:true,deterministic:a.readingIR.readingDigest===b.readingIR.readingDigest&&a.report.reportDigest===b.report.reportDigest,schema:a.readingIR.schemaVersion==='PHI-OS-BAZI-FULL-READING-IR-v1.0.0'&&a.report.schemaVersion==='PHI-OS-BAZI-CUSTOMER-REPORT-v1.0.0',sectionIA:JSON.stringify(a.report.sections.map(x=>x.code))===JSON.stringify(['FOUNDATION','RELATIONSHIPS','PATTERNS','SCHOOLS','TIMING','OPEN']),schoolSeparation:a.report.sections.find(x=>x.code==='SCHOOLS')?.blocks?.length===3,unknownVisibility:a.report.sections.find(x=>x.code==='OPEN')?.items?.length>0,dedup:duplicateParagraphs(a.report,locale)===0,noRawCodes:forbidden.every(x=>!txt.includes(x)),boundaries:a.report.boundaries.pillarByPillarRepeatedEssay===false&&a.report.boundaries.schoolViewsMerged===false&&a.report.boundaries.unknownHidden===false&&a.report.boundaries.goodBadScoreCreated===false&&a.report.boundaries.eventPredictionCreated===false&&a.report.boundaries.fortunePredictionCreated===false,pillarCount:a.report.pillars.length===(spec.includeHour?4:3)};
 const pass=Object.values(checks).every(Boolean);
 return {caseId:spec.caseId,scenarioCode:spec.scenarioCode,scenarioFocus:spec.scenarioFocus,variantCode:spec.variantCode,locale,pillarCodes:a.report.pillars.map(x=>`${x.stem.code}-${x.branch.code}`),pillarZh:a.report.pillars.map(x=>`${x.stem.zh}${x.branch.zh}`),monthBranch:a.readingIR.sections.foundation.monthCommand.branch.code,dayMaster:a.readingIR.sections.foundation.dayMaster.code,relationTypes,temporalRelationTypes,currentLuckState:spec.currentLuckState,annualAvailable:spec.annualAvailable,includeHour:spec.includeHour,patternCandidateCount:a.readingIR.summary.patternCandidateCount,unknownCount:a.readingIR.summary.unknownCount,renderOwnerCount:a.readingIR.summary.renderOwnerCount,temporalInteractionCount:a.readingIR.summary.temporalInteractionCount,readingDigest:a.readingIR.readingDigest,reportDigest:a.report.reportDigest,checks,pass,report:a.report,readingIR:a.readingIR};
}

export async function runMachineCampaign(){
 const specs=generateCampaignCases();const results=[];for(const spec of specs)results.push(await runMachineCase(spec));
 return {specs,results};
}

export function coverageSummary(specs,results){
 const all=(k)=>[...new Set(results.flatMap(r=>Array.isArray(r[k])?r[k]:[r[k]]).filter(Boolean))].sort();
 return {caseCount:results.length,passCount:results.filter(x=>x.pass).length,failCount:results.filter(x=>!x.pass).length,scenarioCount:new Set(specs.map(x=>x.scenarioCode)).size,monthBranches:all('monthBranch'),dayMasters:all('dayMaster'),relationTypes:all('relationTypes'),temporalRelationTypes:all('temporalRelationTypes'),variants:[...new Set(specs.map(x=>x.variantCode))].sort(),locales:[...new Set(results.map(x=>x.locale))].sort(),threePillarCases:results.filter(x=>x.pillarCodes.length===3).length,fourPillarCases:results.filter(x=>x.pillarCodes.length===4).length,transitionCases:specs.filter(x=>x.currentLuckState==='TRANSITION_DAY').length,currentUnavailableCases:specs.filter(x=>x.currentLuckState==='UNAVAILABLE').length,annualUnavailableCases:specs.filter(x=>!x.annualAvailable).length};
}

export function humanSelectedSpecs(specs=generateCampaignCases()){
 const uncovered=new Set([
  ...SCENARIOS.map(x=>`S:${x.code}`),...VARIANTS.map(x=>`V:${x.code}`),
  ...BRANCHES.map(x=>`M:${x}`),...STEMS.map(x=>`D:${x}`)
 ]);const selected=[];const remaining=[...specs];
 const features=x=>[`S:${x.scenarioCode}`,`V:${x.variantCode}`,`M:${x.pillarPairs[1].branchCode}`,`D:${x.pillarPairs[2].stemCode}`];
 while(uncovered.size&&remaining.length){remaining.sort((a,b)=>features(b).filter(x=>uncovered.has(x)).length-features(a).filter(x=>uncovered.has(x)).length||a.ordinal-b.ordinal);const x=remaining.shift();selected.push(x);for(const f of features(x))uncovered.delete(f);}
 while(selected.length<24&&remaining.length){const counts=new Map();for(const x of selected)counts.set(x.scenarioCode,(counts.get(x.scenarioCode)||0)+1);remaining.sort((a,b)=>(counts.get(a.scenarioCode)||0)-(counts.get(b.scenarioCode)||0)||a.ordinal-b.ordinal);selected.push(remaining.shift());}
 return selected.slice(0,24).sort((a,b)=>a.ordinal-b.ordinal);
}
export async function buildHumanReviewCases(machine){
 const selected=humanSelectedSpecs(machine.specs);const byId=new Map(machine.results.map(x=>[x.caseId,x]));const out=[];
 for(const spec of selected){const primary=byId.get(spec.caseId);const otherLocale=primary.locale==='zh-Hans'?'en':'zh-Hans';const other=await runMachineCase(spec,{locale:otherLocale});const zh=primary.locale==='zh-Hans'?primary:other,en=primary.locale==='en'?primary:other;out.push({caseId:spec.caseId,scenarioCode:spec.scenarioCode,scenarioFocus:spec.scenarioFocus,variantCode:spec.variantCode,pillarsZh:zh.pillarZh,monthBranch:zh.monthBranch,dayMaster:zh.dayMaster,currentLuckState:spec.currentLuckState,annualAvailable:spec.annualAvailable,includeHour:spec.includeHour,machinePass:primary.pass,zhReport:zh.report,enReport:en.report,reviewCriteria:['WHOLE_CHART_READABILITY','NO_PILLAR_BY_PILLAR_REPETITION','PATTERN_UNCERTAINTY_HANDLED','SCHOOL_VIEWS_SEPARATE','TIMING_CONTEXT_READABLE','UNKNOWN_AND_COUNTER_EVIDENCE_VISIBLE','NO_FORTUNE_CERTAINTY','NO_RAW_INTERNAL_CODES']});}
 return out;
}

export {STEMS,BRANCHES,SCENARIOS,VARIANTS,ZH_STEM,ZH_BRANCH};
