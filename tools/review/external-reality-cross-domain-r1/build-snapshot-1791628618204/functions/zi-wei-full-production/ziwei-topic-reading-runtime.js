import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';

export const ZIWEI_TOPIC_READING_SCHEMA='PHI-OS-ZIWEI-TOPIC-READING-v1.0.0';
export const ZIWEI_TOPIC_READING_VERSION='1.0.0';

const TOPICS=Object.freeze([
  Object.freeze({code:'CAREER',zh:'事业',en:'Career',primary:['CAREER'],context:['LIFE','WEALTH','TRAVEL'],boundaryZh:'这是结构性事业主题读取，不是职业建议，也不保证职位、晋升或具体事业事件。',boundaryEn:'This is a structural career-theme reading, not career advice and not a guarantee of role, promotion, or specific career events.'}),
  Object.freeze({code:'WEALTH',zh:'财富',en:'Wealth',primary:['WEALTH'],context:['CAREER','PROPERTY','LIFE'],boundaryZh:'这是结构性财富主题读取，不是财务建议，也不预测收入、投资回报或财富结果。',boundaryEn:'This is a structural wealth-theme reading, not financial advice and not a prediction of income, investment returns, or wealth outcomes.'}),
  Object.freeze({code:'RELATIONSHIPS',zh:'关系',en:'Relationships',primary:['SPOUSE'],context:['LIFE','FRIENDS','WELLBEING'],boundaryZh:'这是关系主题的结构读取，不产生兼容度分数，也不预测关系结果。',boundaryEn:'This is a structural relationship-theme reading. It does not create compatibility scores or predict relationship outcomes.'}),
  Object.freeze({code:'FAMILY',zh:'家庭',en:'Family',primary:['PARENTS','CHILDREN','SIBLINGS'],context:['PROPERTY','SPOUSE'],boundaryZh:'这是家庭结构主题读取，不把宫位结构当成已发生的家庭事实，也不预测家庭成员事件。',boundaryEn:'This is a structural family-theme reading. It does not treat palace structure as observed family fact or predict events for family members.'}),
  Object.freeze({code:'HEALTH_WELLBEING',zh:'健康／身心',en:'Health / wellbeing',primary:['HEALTH','WELLBEING'],context:['LIFE'],boundaryZh:'这是象征性的健康／身心结构主题，不是医学诊断、健康风险评估或治疗建议。',boundaryEn:'This is a symbolic health/wellbeing theme, not medical diagnosis, health-risk assessment, or treatment advice.'}),
  Object.freeze({code:'TRAVEL_MOBILITY',zh:'迁移／外部环境',en:'Travel / external environment',primary:['TRAVEL'],context:['LIFE','CAREER','FRIENDS'],boundaryZh:'这是迁移与外部环境的结构读取，不预测出行安全、迁居成败或具体地点结果。',boundaryEn:'This is a structural reading of mobility and external environment. It does not predict travel safety, relocation success, or location-specific outcomes.'}),
  Object.freeze({code:'HOME_PROPERTY',zh:'居所／资产承载',en:'Home / property context',primary:['PROPERTY'],context:['PARENTS','SPOUSE','WEALTH'],boundaryZh:'这是居所与资产承载主题的结构读取，不构成房地产、法律或财务建议。',boundaryEn:'This is a structural home/property-theme reading and is not real-estate, legal, or financial advice.'}),
  Object.freeze({code:'SOCIAL_NETWORKS',zh:'社交／协作网络',en:'Social / collaboration networks',primary:['FRIENDS'],context:['SIBLINGS','CAREER','TRAVEL'],boundaryZh:'这是社交与协作网络的结构读取，不判断具体个人可靠性，也不预测合作结果。',boundaryEn:'This is a structural social/collaboration reading. It does not judge a specific person’s reliability or predict collaboration outcomes.'})
]);

const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const list=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(list(v).filter(Boolean))];
const isZh=l=>l==='zh-Hans';
const t=(l,zh,en)=>isZh(l)?zh:en;
function fail(code){const e=new Error(code);e.code=code;throw e;}
function section(report,code){return list(report?.sections).find(x=>x.sectionCode===code)||null;}
function firstSentence(text,l){const s=String(text||'').trim();if(!s)return '';const m=isZh(l)?s.match(/^(.+?[。！？])/u):s.match(/^(.+?[.!?])/);return (m?.[1]||s).trim();}
function mapByPalace(report){return new Map(list(section(report,'PALACES')?.items).map(x=>[x.palaceCode,x]));}
function topicLabel(topic,l){return isZh(l)?topic.zh:topic.en;}
function selectedPalaceRef(block,role,l){return freeze({palaceCode:block.palaceCode,title:block.title,branch:block.branch,branchLabel:block.branchLabel,role,readingUnitRef:block.readingUnitRef,resolutionState:block.resolutionState,resolutionLabel:block.resolutionLabel,isStructuralFocus:block.isStructuralFocus===true,excerpt:firstSentence(block.paragraphs?.[0],l),networkSummary:block.networkContext?.summary||null,openBoundary:block.openBoundary||null,why:{evidenceRefs:[...(block.why?.evidenceRefs||[])],meaningRefs:[...(block.why?.meaningRefs||[])],authorityRefs:[...(block.why?.authorityRefs||[])],unknownRefs:[...(block.why?.unknownRefs||[])],counterEvidenceRefs:[...(block.why?.counterEvidenceRefs||[])]}});}
function timingForTopic(report,palaceCodes,l){
  const selected=new Set(palaceCodes);
  const out=[];
  for(const x of list(section(report,'TIMING')?.items)){
    if(x.kind==='DA_XIAN'){
      const focus=x.focus?.natalDomainCode;
      const tx=list(x.transformations).filter(v=>selected.has(v.palaceCode));
      if(selected.has(focus)||tx.length)out.push(freeze({kind:x.kind,title:x.title,focusPalaceCode:focus||null,focusPalaceLabel:x.focus?.natalDomainLabel||null,relevantTransformations:tx.map(v=>({label:v.label,targetStarLabel:v.targetStarLabel,palaceCode:v.palaceCode,palaceLabel:v.palaceLabel})),excerpt:firstSentence(x.paragraphs?.[0],l),resolutionState:x.resolutionState}));
    }else if(x.kind==='LIU_NIAN'){
      const focus=x.focus?.natalDomainCode;
      const tx=list(x.transformations).filter(v=>selected.has(v.palaceCode));
      if(selected.has(focus)||tx.length)out.push(freeze({kind:x.kind,title:x.title,focusPalaceCode:focus||null,focusPalaceLabel:x.focus?.natalDomainLabel||null,lunarYear:x.focus?.lunarYear||null,relevantTransformations:tx.map(v=>({label:v.label,targetStarLabel:v.targetStarLabel,palaceCode:v.palaceCode,palaceLabel:v.palaceLabel})),excerpt:firstSentence(x.paragraphs?.[0],l),resolutionState:x.resolutionState}));
    }else if(x.kind==='CROSS_LAYER'){
      const relation=x.domainRelation||{};
      const overlaps=list(x.overlaps).filter(v=>selected.has(v.palaceCode));
      const relationRelevant=selected.has(relation.daXianNatalDomainCode)||selected.has(relation.liuNianNatalDomainCode);
      if(relationRelevant||overlaps.length)out.push(freeze({kind:x.kind,title:x.title,domainRelation:{classification:relation.classification||null,daXianNatalDomainCode:relation.daXianNatalDomainCode||null,daXianNatalDomainLabel:relation.daXianNatalDomainLabel||null,liuNianNatalDomainCode:relation.liuNianNatalDomainCode||null,liuNianNatalDomainLabel:relation.liuNianNatalDomainLabel||null,sameNatalDomainFocus:relation.sameNatalDomainFocus===true},relevantOverlaps:overlaps.map(v=>({palaceCode:v.palaceCode,palaceLabel:v.palaceLabel,starLabel:v.starLabel||null,layers:[...(v.layers||[])],spansAllThreeLayers:v.spansAllThreeLayers===true})),excerpt:firstSentence(x.paragraphs?.[0],l),resolutionState:x.resolutionState}));
    }
  }
  return out;
}
function openBoundariesForTopic(report,palaceCodes){const selected=new Set(palaceCodes);return list(section(report,'OPEN_BOUNDARIES')?.items).filter(x=>list(x.affectedPalaceCodes).some(code=>selected.has(code))).map(x=>freeze({unknownId:x.unknownId,starLabel:x.starLabel||null,affectedPalaceCodes:list(x.affectedPalaceCodes).filter(code=>selected.has(code)),affectedPalaceLabels:list(x.affectedPalaceCodes).map((code,i)=>selected.has(code)?x.affectedPalaceLabels?.[i]:null).filter(Boolean),customerCopy:x.customerCopy}));}
function topicOverview(topic,primary,context,timing,l){
  const primaryNames=primary.map(x=>x.title);
  const contextNames=context.map(x=>x.title);
  const p1=t(l,`${topicLabel(topic,l)}主题先读取${primaryNames.join('、')}，再把${contextNames.join('、')}作为结构背景。`,`The ${topicLabel(topic,l)} theme reads ${primaryNames.join(', ')} first, then uses ${contextNames.join(', ')} as structural context.`);
  const p2=timing.length?t(l,`当前大限／流年中有 ${timing.length} 个与这组宫位相关的时间层证据；这里只把它们作为当前结构焦点，不转写成事件预测。`,`There ${timing.length===1?'is':'are'} ${timing.length} current Da Xian/Liu Nian timing evidence unit${timing.length===1?'':'s'} relevant to these palaces. They remain current structural focus, not event prediction.`):t(l,'当前时间层没有把这组宫位列为直接焦点；主题读取仍保留本命结构，不据此判断好坏。','The current timing layers do not directly focus these palaces. The topic still retains the natal structure without turning that absence into a good/bad judgment.');
  return [p1,p2];
}

export function buildZiweiTopicReadings({customerReport,interactiveSurface,locale}={}){
  if(customerReport?.schemaVersion!=='PHI-OS-ZIWEI-CUSTOMER-REPORT-v1.0.0')fail('ZIWEI_FP_W20_REQUIRES_W18_CUSTOMER_REPORT');
  if(interactiveSurface?.schemaVersion!=='PHI-OS-ZIWEI-INTERACTIVE-CHART-SURFACE-v1.0.0')fail('ZIWEI_FP_W20_REQUIRES_W19_INTERACTIVE_SURFACE');
  if(interactiveSurface.source?.customerReportDigest!==customerReport.reportDigest)fail('ZIWEI_FP_W20_W19_W18_LINEAGE_MISMATCH');
  const l=locale||customerReport.locale;if(l!==customerReport.locale||l!==interactiveSurface.locale||!['zh-Hans','en'].includes(l))fail('ZIWEI_FP_W20_LOCALE_MISMATCH');
  const reportSnap=stableStringify(customerReport),surfaceSnap=stableStringify(interactiveSurface);
  const palaceMap=mapByPalace(customerReport);if(palaceMap.size!==12)fail('ZIWEI_FP_W20_REQUIRES_12_W18_PALACE_BLOCKS');
  const topics=TOPICS.map(topic=>{
    const primary=topic.primary.map(code=>palaceMap.get(code)).filter(Boolean).map(x=>selectedPalaceRef(x,'PRIMARY',l));
    const context=topic.context.filter(code=>!topic.primary.includes(code)).map(code=>palaceMap.get(code)).filter(Boolean).map(x=>selectedPalaceRef(x,'CONTEXT',l));
    if(primary.length!==topic.primary.length)fail(`ZIWEI_FP_W20_PRIMARY_PALACE_MISSING:${topic.code}`);
    const palaceCodes=uniq([...primary,...context].map(x=>x.palaceCode));
    const timing=timingForTopic(customerReport,palaceCodes,l);
    const openBoundaries=openBoundariesForTopic(customerReport,palaceCodes);
    const base={topicCode:topic.code,title:topicLabel(topic,l),presentationMode:'ON_DEMAND_TOPIC_SELECTOR',primaryPalaceCodes:[...topic.primary],contextPalaceCodes:[...topic.context],overview:topicOverview(topic,primary,context,timing,l),boundary:isZh(l)?topic.boundaryZh:topic.boundaryEn,primaryPalaces:primary,contextPalaces:context,timing,openBoundaries,source:{customerReportDigest:customerReport.reportDigest,interactiveSurfaceDigest:interactiveSurface.surfaceDigest},boundaries:{reusesW18Narrative:true,reusesW19PalaceOwnership:true,newMeaningCreated:false,newFindingCreated:false,newCompatibilityScoreCreated:false,newProfessionalAdviceCreated:false,newMedicalClaimCreated:false,newFinancialClaimCreated:false,eventPredictionCreated:false,fortunePredictionCreated:false}};
    return freeze({...base,topicDigest:sha256Stable(base)});
  });
  const base={schemaVersion:ZIWEI_TOPIC_READING_SCHEMA,work:'ZIWEI-FP-W20',runtimeVersion:ZIWEI_TOPIC_READING_VERSION,locale:l,status:'ENGINEERING_TOPIC_READINGS_FROM_W18_W19',source:{customerReportDigest:customerReport.reportDigest,interactiveSurfaceDigest:interactiveSurface.surfaceDigest},topicOrder:TOPICS.map(x=>x.code),topics,summary:{topicCount:topics.length,topicsWithTimingEvidence:topics.filter(x=>x.timing.length).length,topicsWithOpenBoundaries:topics.filter(x=>x.openBoundaries.length).length,uniquePrimaryPalaceCodes:uniq(topics.flatMap(x=>x.primaryPalaceCodes)),uniqueReferencedPalaceCodes:uniq(topics.flatMap(x=>[...x.primaryPalaceCodes,...x.contextPalaceCodes]))},boundaries:{onDemandTopicSelector:true,allTopicsAutoRenderedTogether:false,newCalculationAuthorityCreated:false,newMeaningCreated:false,newFindingCreated:false,topicReadingCreatesOutcomeVerdict:false,customerCutoverAllowed:false,humanAcceptedCustomerTopicReading:false}};
  const topicReadingDigest=sha256Stable(base);
  if(stableStringify(customerReport)!==reportSnap||stableStringify(interactiveSurface)!==surfaceSnap)fail('ZIWEI_FP_W20_INPUT_MUTATION_FORBIDDEN');
  return freeze({...base,topicReadingDigest});
}

export const ZIWEI_TOPIC_DEFINITIONS=TOPICS;
export default Object.freeze({buildZiweiTopicReadings,ZIWEI_TOPIC_DEFINITIONS});
