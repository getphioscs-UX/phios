import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZiweiContentDepthR3Sections,ZIWEI_CONTENT_DEPTH_VERSION} from '../functions/personal-reading/narrative/ziwei-production-composer-r3.js';
import {buildZiweiContentDepthR3Publication} from '../functions/personal-reading/ziwei-production-publication-r3.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
const expected={
 'zh-Hans':{
  S03:'真正值得观察的不是',
  S04:'把重点放在任务如何被交付',
  S05:'把“能获得资源”与“资源被放到哪里”分开',
  S06:'关系质量更适合看互动是否能往返',
  S07:'除了“我怎样帮助别人”',
  S08:'这里更适合追踪压力怎样累积',
  S09:'真正要追踪的是',
  S10:'当前最适合记录的是'
 },
 en:{
  S03:'The useful question is not simply what is liked',
  S04:'Focus on how work is delivered',
  S05:'Separate acquiring resources from deciding where they go',
  S06:'Relationship quality is better tested through reciprocity',
  S07:'Alongside how support is offered',
  S08:'Track how pressure accumulates rather than drawing conclusions about the body',
  S09:'The useful question is what keeps asking for clarification',
  S10:'Track new circumstances, responsibility shifts'
 }
};
const results=[];
for(const locale of ['zh-Hans','en']){
 const sections=await buildZiweiContentDepthR3Sections({evidence:fixture.evidence,locale});
 assert.equal(sections.length,12);
 for(const id of Object.keys(expected[locale])){
  const section=sections.find(s=>s.sectionId===id);
  assert(section,'Missing section '+id);
  assert.equal(section.editorialVersion,ZIWEI_CONTENT_DEPTH_VERSION);
  const prose=section.paragraphs.join(' ');
  assert(prose.includes(expected[locale][id]),id+' did not use its R3 section-specific grammar');
 }
 const prose=sections.flatMap(s=>s.paragraphs).join(' ');
 assert(!prose.includes(locale==='zh-Hans'?'其余落点保留在结构与证据记录中，未据此扩大解释。':'Other placements remain in the structural and evidence records without extending this interpretation.'),'Legacy repeated structural-context sentence returned');
 const oldReality=locale==='zh-Hans'?'把这些条件与实际经历核对。证据不足的部分保持开放，不作为确定结论。':'Compare these conditions with lived experience. Insufficient evidence remains open rather than becoming a certain conclusion.';
 assert.equal(prose.split(oldReality).length-1,0,'Legacy repeated reality-check paragraph returned');
 const subject=fixture.subject;
 const snapshot=buildZiweiContentDepthR3Publication({evidence:{structured:fixture.evidence},sections,locale,subjectPresentation:subject});
 assert.equal(snapshot.totalPages,33);
 assert.equal(snapshot.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE').length,12);
 results.push({locale,sections:12,pages:33,editorialVersion:ZIWEI_CONTENT_DEPTH_VERSION,legacyRepeatedSentences:0});
}
fs.mkdirSync('docs/reports/ziwei/content-depth-r3',{recursive:true});
fs.writeFileSync('docs/reports/ziwei/content-depth-r3/machine-evidence.json',JSON.stringify({work:'ZIWEI-CONTENT-DEPTH-R3',status:'MACHINE_PASS_HUMAN_REVIEW_PENDING',results,productionAdmission:'NOT_GRANTED'},null,2)+'\n');
console.log('PASS Zi Wei Content Depth R3: section-specific narrative grammar, 33-page architecture preserved, old repeated boilerplate absent.');
