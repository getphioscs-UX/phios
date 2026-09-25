import fs from 'node:fs';
import {projectBaziSectionPublication} from '../functions/personal-reading/bazi-section-publication.js';
import {editorialQualityMetrics} from '../functions/personal-reading/narrative/bazi-editorial-quality.js';

const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json','utf8'));
const out={schemaVersion:'BAZI_R11_DETERMINISTIC_EDITORIAL_AUDIT_V1',generatedAt:new Date().toISOString(),locales:{}};

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
  const genericHits=genericPatterns[locale].reduce((n,re)=>n+(text.match(re)||[]).length,0);
  const boundarySentences=(text.match(locale==='en'?/(?:not|cannot|does not)[^.?!]*(?:[.?!]|$)/gi:/(?:不|不能|并不)[^。！？]*(?:[。！？]|$)/g)||[]).length;
  const reasons=[];
  if(genericHits>1)reasons.push('GENERIC_TEMPLATE_PHRASE_REPETITION');
  if(metrics.CROSS_SECTION_SIMILARITY!==null&&metrics.CROSS_SECTION_SIMILARITY>=0.45)reasons.push('CROSS_SECTION_SIMILARITY');
  if(metrics.SECTION_SPECIFICITY!==null&&metrics.SECTION_SPECIFICITY<0.5)reasons.push('LOW_SECTION_SPECIFICITY');
  if(metrics.TEMPLATE_PHRASE_REPETITION>0.08)reasons.push('INTRA_SECTION_TEMPLATE_REPETITION');
  rows.push({sectionKey,pages:pages.map(x=>x.pageKey),metrics,genericHits,boundarySentences,status:reasons.length?'REVIEW':'PASS',reasons});
 }
 out.locales[locale]={
  pageCount:projection.pages.length+6,
  rows,
  summary:{
   pass:rows.filter(r=>r.status==='PASS').length,
   review:rows.filter(r=>r.status!=='PASS').length,
   maxCrossSectionSimilarity:Math.max(0,...rows.map(r=>r.metrics.CROSS_SECTION_SIMILARITY||0)),
   totalGenericHits:rows.reduce((n,r)=>n+r.genericHits,0)
  }
 };
}
out.parity={
 enPages:out.locales.en.pageCount,
 zhPages:out.locales['zh-Hans'].pageCount,
 samePages:out.locales.en.pageCount===out.locales['zh-Hans'].pageCount
};
fs.mkdirSync('docs/acceptance/bazi-paid-report/r11',{recursive:true});
fs.writeFileSync('docs/acceptance/bazi-paid-report/r11/EDITORIAL-QUALITY-AUDIT.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({en:out.locales.en.summary,zh:out.locales['zh-Hans'].summary,parity:out.parity},null,2));
