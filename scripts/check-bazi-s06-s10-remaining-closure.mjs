import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {buildRelationshipBrief} from '../functions/personal-reading/narrative/bazi-s06-market-reading.js';
import {buildHealthBrief} from '../functions/personal-reading/narrative/bazi-s07-health-market-reading.js';
import {buildTimingBrief} from '../functions/personal-reading/narrative/bazi-s08-timing-market-reading.js';
import {buildGuidanceBrief} from '../functions/personal-reading/narrative/bazi-s09-guidance-market-reading.js';
import {buildAppendixBrief} from '../functions/personal-reading/narrative/bazi-s10-appendix-market-reading.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('docs/guided-report-successor-r2/bazi-source.json');
for(const [folder,section] of [['s02-market-v1','S02_PERSONALITY'],['s03-market-v1','S03_LIFE_STRUCTURE'],['s04-csd-v4','S04_CAREER'],['s05-market-v1','S05_WEALTH']]){
 const r=read(`docs/acceptance/report-narrative-t2-r1/bazi/${folder}/OWNER-ACCEPTANCE.json`);
 assert.equal(r.sectionKey,section);assert.equal(r.decision,'ACCEPT');assert.equal(r.productionActivated,false);
 const {acceptanceDigest,...seed}=r;assert.equal(await sha256Stable(seed),acceptanceDigest);
}
const specs=[
 ['S06_RELATIONSHIP','RELATIONSHIP','RELATIONSHIPS',buildRelationshipBrief,'relationshipNarrativeIR'],
 ['S07_HEALTH','HEALTH','PRESSURE',buildHealthBrief,'healthNarrativeIR'],
 ['S08_TIMING','TIMING','LIFE_OPERATION',buildTimingBrief,'timingNarrativeIR'],
 ['S09_GUIDANCE','GUIDANCE','CAPABILITY',buildGuidanceBrief,'guidanceNarrativeIR'],
 ['S10_APPENDIX','APPENDIX','LIFE_OPERATION',buildAppendixBrief,'appendixNarrativeIR']
];
const built={};
for(const [section,domain,topic,builder,irKey] of specs){
 const en=await builder({...source,locale:'en'}),zh=await builder({...source,locale:'zh-Hans'});
 assert.equal(en.sectionKey,section);assert.equal(en.marketDomain,domain);assert(en[irKey].eligibility.eligible,JSON.stringify(en[irKey].eligibility));
 assert.deepEqual(en.claims,zh.claims);assert.equal(en.sourceSemanticDigest,zh.sourceSemanticDigest);
 assert.deepEqual(en.requiredClaimRoles,en.marketContract.roles);
 assert.equal(Object.entries(en.authorityFacts).find(([k])=>k.endsWith('/leadGroup'))[1].groupCode,
  source.reading.professionalModules.professionalTopics.topics.find(x=>x.topicCode===topic).leadGroup.groupCode);
 const {briefSemanticDigest,...seed}=en;assert.equal(await sha256Stable(seed),briefSemanticDigest);
 built[section]=en;
}
const s06=JSON.stringify(built.S06_RELATIONSHIP.claims);
assert(!/(一定|必然|注定).{0,8}(结婚|离婚|分手|复合)|will definitely (marry|divorce|separate)/iu.test(s06));
assert(/不得预测结婚、分手、复合、第三者或具体事件/.test(s06));
const s07=JSON.stringify(built.S07_HEALTH.claims);
assert(!/(诊断为|必然患|一定会生病|will develop|diagnosed with|take medication|stop medication|服用药物|停药)/iu.test(s07));
assert(/不能替代医学评估|医疗专业人士/.test(s07));
const s08=JSON.stringify(built.S08_TIMING.claims);
assert(/本命—大运—流年/.test(s08));assert(!/(必然升职|一定发财|必定结婚|guaranteed promotion|guaranteed wealth)/iu.test(s08));
const timing=built.S08_TIMING.authorityFacts['professionalModules/timing'];
assert(timing.currentDaYun?.pillar?.stem?.zh&&timing.currentDaYun?.pillar?.branch?.zh&&timing.annual?.year&&timing.annual?.stem?.zh&&timing.annual?.branch?.zh);
const s09=JSON.stringify(built.S09_GUIDANCE.claims);
assert(/现实核对/.test(s09));assert(!/(必须离婚|必须辞职|必须投资|must divorce|must quit|must invest)/iu.test(s09));
const s10=JSON.stringify(built.S10_APPENDIX.claims);
assert(/不新增客户结论|不加入性格判断|只作为后文追溯依据/.test(s10));assert(!/(喜用神为|用神是|格局已成|pattern is established)/iu.test(s10));
console.log('PASS: S06-S10 remaining-section briefs are deterministic, bilingual-parity stable, source-bound and section-safe. No provider call.');
