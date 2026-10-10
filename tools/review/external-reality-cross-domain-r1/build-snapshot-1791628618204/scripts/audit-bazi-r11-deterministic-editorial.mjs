import fs from 'node:fs';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {editorialQualityMetrics} from '../functions/personal-reading/narrative/bazi-editorial-quality.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const out={schemaVersion:'BAZI_R11_DETERMINISTIC_EDITORIAL_AUDIT_V2',generatedAt:new Date().toISOString(),baselineRole:'R10_REGRESSION_CORPUS_NOT_POSITIVE_CALIBRATION',locales:{}};

const genericPatterns={
 en:[
  /this is a conditional symbolic reading/gi,
  /reading priority, not a measured trait/gi,
  /does not establish how they are experienced/gi,
  /they do not replace the topic's first emphasis/gi,
  /modifies how the method reads this topic/gi
 ],
 'zh-Hans':[
  /这是一份有条件的象征性解读/g,
  /这表示解读重点，不是测得的人格特质/g,
  /命盘不能证明它们在现实中如何被体验/g,
  /它们不取代本章的首要重点/g,
  /它会修正本章与其他命盘因素的组合读取方式/g
 ]
};

const sectionTerms={
 S02_PERSONALITY:{en:['capability','learning','expression','support'], 'zh-Hans':['能力','学习','表达','支持']},
 S03_LIFE_STRUCTURE:{en:['pattern','carrying','pillar','structure'], 'zh-Hans':['格局','承载','柱位','结构']},
 S04_CAREER:{en:['career','role','work','responsibility'], 'zh-Hans':['事业','角色','工作','责任']},
 S05_WEALTH:{en:['wealth','resource','retention','finance'], 'zh-Hans':['财富','资源','留存','财务']},
 S06_RELATIONSHIP:{en:['relationship','interaction','boundary','expectation'], 'zh-Hans':['关系','互动','边界','期待']},
 S07_HEALTH:{en:['wellbeing','recovery','load','support'], 'zh-Hans':['身心','恢复','负荷','支持']},
 S08_TIMING:{en:['timing','annual','Da Yun','natal'], 'zh-Hans':['时间','流年','大运','本命']},
 S09_GUIDANCE:{en:['guidance','theme','condition','navigation'], 'zh-Hans':['建议','主线','条件','导航']}
};

const technicalNarrativePatterns={
 en:[
  /appears?\s+\d+\s+times?/gi,
  /\d+\s+visible/gi,
  /\d+\s+hidden/gi,
  /records?\s+\d+\s+(?:relationship|interaction|path)/gi,
  /contains?\s+\d+\s+(?:linkage|tension|relation)/gi,
  /\bcount\s*[:=]?\s*\d+/gi,
  /\b\d+(?:\.\d+)?\s*%/g
 ],
 'zh-Hans':[
  /出现\s*\d+\s*次/g,
  /透干\s*\d+/g,
  /藏干\s*\d+/g,
  /记录(?:到)?\s*\d+\s*(?:组|条)/g,
  /包含\s*\d+\s*组/g,
  /计数\s*[:：]?\s*\d+/g,
  /\d+(?:\.\d+)?\s*%/g
 ]
};

const evidenceAnchorPatterns={
 en:/\b(?:Seven Killings|Direct Officer|Indirect Wealth|Direct Wealth|Direct Resource|Indirect Resource|Peer|Rob Wealth|Eating God|Hurting Officer|stem combination|branch harm|self-punishment|Da Yun|annual layer|natal)\b/gi,
 'zh-Hans':/(?:七杀|正官|偏财|正财|正印|偏印|比肩|劫财|食神|伤官|天干合|地支害|自刑|大运|流年|本命)/g
};
const conditionPatterns={
 en:/\b(?:if|when|while|depends? on|condition|support|counterexample|contrast|competing|available|without|with enough)\b/gi,
 'zh-Hans':/(?:如果|当|同时|取决于|条件|支持|反例|对照|分流|可用|不足|改变)/g
};
const observablePatterns={
 en:/\b(?:compare|observe|notice|track|real-life|lived|evidence|what changed|what stayed|test)\b/gi,
 'zh-Hans':/(?:比较|观察|现实|生活证据|什么改变|什么保持|检验|追踪|反驳)/g
};
const navigationPatterns={
 en:/\b(?:adjust|separate|distinguish|prioriti[sz]e|identify|use this|next step|decision|conversation)\b/gi,
 'zh-Hans':/(?:调整|分开|区分|优先|识别|找出|下一步|决定|沟通|使用这一页)/g
};

const countMatches=(text,re)=>(text.match(re)||[]).length;

for(const locale of ['en','zh-Hans']){
 const projection=await projectBaziSectionPublication({reading:source.reading,locale,temporalContext:source.temporalSnapshot,composition:{}});
 const narrative=projection.pages.filter(p=>!p.isSectionOpener&&['NARRATIVE_ANALYSIS_PAGE','TIMING_PAGE','SUMMARY_PAGE'].includes(p.pageFamily));
 const bySection=new Map();
 for(const p of narrative){
  const text=[...(p.paragraphs||[]),...(p.observations||[]),p.boundary||''].filter(Boolean).join(' ');
  if(!bySection.has(p.sectionKey))bySection.set(p.sectionKey,[]);
  bySection.get(p.sectionKey).push({pageKey:p.pageKey,title:p.title,text});
 }
 const sectionTexts=Object.fromEntries([...bySection].map(([k,v])=>[k,v.map(x=>x.text).join(' ')]));
 const rows=[];
 for(const [sectionKey,pages] of bySection){
  const text=pages.map(x=>x.text).join(' ');
  const otherSections=Object.entries(sectionTexts).filter(([k])=>k!==sectionKey).map(([,v])=>v);
  const metrics=editorialQualityMetrics(text,{otherSections,sectionTerms:sectionTerms[sectionKey]?.[locale]||[]});
  const genericHits=genericPatterns[locale].reduce((n,re)=>n+countMatches(text,re),0);
  const technicalNarrativeHits=technicalNarrativePatterns[locale].reduce((n,re)=>n+countMatches(text,re),0);
  const boundarySentences=countMatches(text,locale==='en'?/(?:not|cannot|does not)[^.?!]*(?:[.?!]|$)/gi:/(?:不|不能|并不)[^。！？]*(?:[。！？]|$)/g);
  const evidenceAnchors=countMatches(text,evidenceAnchorPatterns[locale]);
  const conditionSignals=countMatches(text,conditionPatterns[locale]);
  const observableSignals=countMatches(text,observablePatterns[locale]);
  const navigationSignals=countMatches(text,navigationPatterns[locale]);
  const explanationChain={
   evidenceAnchored:evidenceAnchors>0,
   conditionsPresent:conditionSignals>0,
   observableComparisonPresent:observableSignals>0,
   navigationPresent:navigationSignals>0
  };
  const explanationChainScore=Object.values(explanationChain).filter(Boolean).length;
  const reasons=[];
  if(genericHits>1)reasons.push('R10_TEMPLATE_REGRESSION');
  if(technicalNarrativeHits>0)reasons.push('RAW_TECHNICAL_COUNT_LEAKAGE');
  if(metrics.CROSS_SECTION_SIMILARITY!==null&&metrics.CROSS_SECTION_SIMILARITY>=0.45)reasons.push('CROSS_SECTION_SIMILARITY');
  if(metrics.SECTION_SPECIFICITY!==null&&metrics.SECTION_SPECIFICITY<0.5)reasons.push('LOW_SECTION_SPECIFICITY');
  if(metrics.TEMPLATE_PHRASE_REPETITION>0.08)reasons.push('INTRA_SECTION_TEMPLATE_REPETITION');
  if(boundarySentences>2)reasons.push('BOUNDARY_DENSITY');
  if(sectionKey!=='S09_GUIDANCE'&&evidenceAnchors===0)reasons.push('NO_BAZI_EVIDENCE_ANCHOR');
  if(explanationChainScore<3)reasons.push('INSUFFICIENT_EXPLANATION_CHAIN');
  rows.push({
   sectionKey,
   pages:pages.map(x=>x.pageKey),
   metrics,
   genericHits,
   technicalNarrativeHits,
   boundarySentences,
   depthSignals:{evidenceAnchors,conditionSignals,observableSignals,navigationSignals,explanationChain,explanationChainScore},
   status:reasons.length?'REVIEW':'PASS',
   reasons
  });
 }
 out.locales[locale]={
  pageCount:projection.pages.length+6,
  rows,
  summary:{
   pass:rows.filter(r=>r.status==='PASS').length,
   review:rows.filter(r=>r.status!=='PASS').length,
   maxCrossSectionSimilarity:Math.max(0,...rows.map(r=>r.metrics.CROSS_SECTION_SIMILARITY||0)),
   totalGenericHits:rows.reduce((n,r)=>n+r.genericHits,0),
   totalTechnicalNarrativeHits:rows.reduce((n,r)=>n+r.technicalNarrativeHits,0),
   insufficientExplanationChain:rows.filter(r=>r.reasons.includes('INSUFFICIENT_EXPLANATION_CHAIN')).map(r=>r.sectionKey)
  }
 };
}
out.parity={
 enPages:out.locales.en.pageCount,
 zhPages:out.locales['zh-Hans'].pageCount,
 samePages:out.locales.en.pageCount===out.locales['zh-Hans'].pageCount
};
out.qualityContract={
 positiveCalibration:'OWNER_ACCEPTED_R11_SECTION_ONLY',
 r10Role:'REGRESSION_CORPUS',
 principle:'STRUCTURE -> MEANING -> CONDITIONS -> COUNTERWEIGHTS -> OBSERVABLE_EXPRESSION -> TIMING_RELEVANCE_WHERE_LICENSED -> NAVIGATION',
 rawCountsInCustomerNarrative:'REVIEW',
 machinePassDoesNotEqualOwnerAcceptance:true
};
fs.mkdirSync('docs/acceptance/bazi-paid-report/r11',{recursive:true});
fs.writeFileSync('docs/acceptance/bazi-paid-report/r11/EDITORIAL-QUALITY-AUDIT.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({en:out.locales.en.summary,zh:out.locales['zh-Hans'].summary,parity:out.parity,qualityContract:out.qualityContract},null,2));
