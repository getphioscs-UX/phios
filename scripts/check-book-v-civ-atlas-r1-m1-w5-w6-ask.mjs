import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectKnowledgeAnswerForCustomer} from '../functions/customer-projection/knowledge-customer-projection.js';
import {
  ATLAS_RETRIEVAL_PRIORITY,
  classifyCivilizationAtlasIntent,
  composeCivilizationAtlasRetrievalQuestion,
  isCivilizationAtlasContext,
  resolveCivilizationAtlasAsk
} from '../functions/_lib/civilization-atlas-ask.js';

const read=p=>fs.readFileSync(p,'utf8');
const ask=read('functions/api/ask-phios-consumption.js');
const projection=read('functions/customer-projection/knowledge-customer-projection.js');

assert.deepEqual(ATLAS_RETRIEVAL_PRIORITY,[
  'SELECTED_ATLAS_ENTITY','RELATED_ATLAS_REGISTRY_EVIDENCE','PART_12_CANONICAL_NODES',
  'BOOK_5_PUBLISHED_OR_REVIEWED_KNOWLEDGE','BROADER_PHI_OS_KNOWLEDGE'
]);
assert.equal(isCivilizationAtlasContext({entryContext:{bookCode:'BOOK-5'},knowledgeContext:{readingPath:'BOOK-5 > PART-12 > ATLAS > loss'}}),true);
assert.equal(classifyCivilizationAtlasIntent('为什么某些国家落寞？',{}),'CIVILIZATION_DECLINE');
assert.equal(classifyCivilizationAtlasIntent('为什么罗马政权结束不等于文明消失？',{}),'SUCCESSION');
assert.equal(classifyCivilizationAtlasIntent('比较宋与另一个商业文明',{}),'COMPARISON');
assert.equal(classifyCivilizationAtlasIntent('1000 和 1250 的世界有什么不同？',{}),'WORLD_SNAPSHOT');
assert.equal(classifyCivilizationAtlasIntent('工业阈值怎样改变文明？',{}),'TRANSITION');
assert.equal(classifyCivilizationAtlasIntent('为什么不做文明崩溃评分？',{}),'NO_SCORE_GOVERNANCE');

const fixtures={
 '/content/civilization-atlas/loss/reversal-loss-atlas-v1.json':{
  families:[
   {familyId:'POLITICAL_BOUNDARY',title:{'zh-Hans':'政治与边界',en:'Political & Boundary'},description:{'zh-Hans':'政权、主权、领土与边界位置变化。',en:'Changes in regime, sovereignty, territory, and boundary position.'}},
   {familyId:'POPULATION_URBAN',title:{'zh-Hans':'人口与城市',en:'Population & Urban'},description:{'zh-Hans':'人口基础、城市密度与聚落网络收缩或重组。',en:'Contraction or reorganization of population, urban density, and settlement networks.'}},
   {familyId:'KNOWLEDGE_INSTITUTIONAL',title:{'zh-Hans':'知识与制度',en:'Knowledge & Institutional'},description:{'zh-Hans':'制度、教育与知识复制损失。',en:'Institution and knowledge loss.'}},
   {familyId:'NETWORK_INFRASTRUCTURE',title:{'zh-Hans':'网络与基础设施',en:'Network & Infrastructure'},description:{'zh-Hans':'交通、贸易与基础设施退化。',en:'Network degradation.'}},
   {familyId:'MEANING_IDENTITY_CARRIER',title:{'zh-Hans':'意义、身份与载体',en:'Meaning, Identity & Carrier'},description:{'zh-Hans':'文化与载体变化。',en:'Carrier change.'}},
   {familyId:'SUCCESSION_ABSORPTION_FUTURE',title:{'zh-Hans':'继任、吸收与未来',en:'Succession, Absorption & Future'},description:{'zh-Hans':'旧结构被吸收、转型或延续。',en:'Old structures are absorbed, transformed, or continued.'}}
  ],
  lossTypes:[{lossTypeId:'LOSS-REGIME-END',familyId:'POLITICAL_BOUNDARY',title:{'zh-Hans':'政权终止',en:'Regime End'},definition:{'zh-Hans':'政权终止不等于整体文明灭亡。',en:'Regime end does not equal total civilizational extinction.'},exampleCaseIds:['CA-T06-02'],evidenceRequirements:['UNKNOWN_BOUNDARY_REQUIRED']}],
  caseProfiles:[]
 },
 '/content/civilization-atlas/cases/civilization-case-registry-v1.json':{
  cases:[{caseId:'CA-T06-02',title:{'zh-Hans':'罗马后继结构案例',en:'Roman successor structures'},aliases:['Rome','Roman'],load:{label:{'zh-Hans':'负载来自维护、冲突、疾病、资源、制度和网络依赖。',en:'Load comes from maintenance, conflict, disease, resources, institutions, and network dependency.'}},successorStructure:{label:{'zh-Hans':'部分制度、知识与网络进入后继 Runtime。',en:'Some institutions, knowledge, and networks enter successor runtimes.'}},legacy:{label:{'zh-Hans':'语言、法律与记忆可能继续存在。',en:'Language, law, and memory may continue.'}},unknown:{state:'RECONSTRUCTED',note:{'zh-Hans':'资料保留重建边界。',en:'Evidence retains reconstruction boundaries.'}}}]
 },
 '/content/civilization-atlas/transitions/transition-windows-v1.json':{
  transitionWindows:[{transitionWindowId:'TW-10',title:{'zh-Hans':'帝国转型',en:'Imperial transition'},relatedCases:['CA-T06-02'],pressure:{'zh-Hans':'维护成本与外部压力上升。',en:'Maintenance cost and external pressure rise.'},threshold:{'zh-Hans':'旧协调结构失去可持续性。',en:'Old coordination loses sustainability.'},transition:{'zh-Hans':'政治载体重组。',en:'Political carrier reorganizes.'},newCapacity:{'zh-Hans':'部分能力转移。',en:'Some capacity transfers.'},newLoad:{'zh-Hans':'新结构承担不同负载。',en:'New structures carry different load.'},successorReality:{'zh-Hans':'后继结构承接部分能力。',en:'Successor structures inherit some capacities.'},authorityClass:'HISTORICAL_RECONSTRUCTION'}],scaleShifts:[]
 }
};
const fakeFetch=async url=>{
 const u=new URL(url);
 const body=fixtures[u.pathname];
 return {ok:Boolean(body),json:async()=>body};
};

const atlas=await resolveCivilizationAtlasAsk({
 question:'为什么某些国家落寞？',
 locale:'zh-Hans',
 entryContext:{bookCode:'BOOK-5',contextId:'BOOK:BOOK-5'},
 knowledgeContext:{contextLabel:'《世界如何分化》· 文明图谱',contextSummary:'Layer=loss · Loss=LOSS-REGIME-END 政权终止',readingPath:'BOOK-5 > PART-12 > ATLAS > loss'},
 requestUrl:'https://phios.test/api/ask-phios-consumption',
 fetcher:fakeFetch
});
assert.equal(atlas.intent,'CIVILIZATION_DECLINE');
assert.ok(atlas.evidence.some(x=>x.id==='LOSS-REGIME-END'));
assert.match(atlas.directFraming,/不是一个单一总分/);
assert.match(atlas.deepLink,/atlas=loss/);
assert.match(atlas.deepLink,/lossType=LOSS-REGIME-END/);
assert.match(atlas.deepLink,/#atlas$/);
assert.equal(atlas.governance.secondAskRuntimeCreated,false);
assert.equal(atlas.governance.secondRetrievalRuntimeCreated,false);
const retrieval=composeCivilizationAtlasRetrievalQuestion('为什么某些国家落寞？',atlas);
assert.match(retrieval,/SELECTED_ATLAS_ENTITY/);
assert.match(retrieval,/PART_12_CANONICAL_NODES/);
assert.match(retrieval,/BOOK_5_PUBLISHED_OR_REVIEWED_KNOWLEDGE/);
assert.match(retrieval,/Do not substitute a generic differentiation mechanism/);
assert.match(retrieval,/LOSS-REGIME-END/);

assert.match(ask,/resolveCivilizationAtlasAsk/);
assert.match(ask,/composeCivilizationAtlasRetrievalQuestion/);
assert.match(ask,/secondAnswerRuntimeCreated:\s*false/);
assert.match(ask,/secondRetrievalRuntimeCreated:\s*false/);
assert.match(projection,/Explore this position in Civilization Atlas/);
assert.match(projection,/发生了什么变化/);
assert.match(projection,/损失维度/);
assert.match(projection,/什么继续存在/);
assert.match(projection,/证据／未知/);
assert.doesNotMatch(projection,/civilizationScore|collapseScore|superiorityScore/);

const projected=projectKnowledgeAnswerForCustomer({cka:{
 clientAnswer:{question:'为什么某些国家落寞？',directAnswer:'维护成本、制度与网络条件变化会改变一个 Runtime 的持续能力。',whyThisMayHappen:['旧协调结构可能失去可持续性。'],unknown:{details:[]},relatedKnowledgeCards:[]},
 w5w17:{answerState:'ANSWERED',relatedKnowledgeCards:[],record:{retrievalContext:{authorityGroups:[]}}},
 atlas:{...atlas,directFraming:atlas.directFraming,sections:atlas.sections}
}},{locale:'zh-Hans',currentFacts:{state:'NOT_REQUIRED',evidence:[]}});
assert.match(projected.answer.text,/不是一个单一总分/);
assert.match(projected.answer.text,/维护成本/);
assert.ok(projected.answer.supporting.some(x=>x.startsWith('发生了什么变化:')));
assert.ok(projected.answer.supporting.some(x=>x.startsWith('损失维度:')));
assert.ok(projected.answer.supporting.some(x=>x.startsWith('什么继续存在:')));
assert.equal(projected.relatedKnowledge[0].contentType,'ATLAS');
assert.match(projected.relatedKnowledge[0].href,/#atlas$/);
assert.equal(projected.possibleNextStep.kind,'RELATED_KNOWLEDGE');
assert.ok(projected.basedOn.sources.some(x=>x.sourceClass==='GOVERNED_KNOWLEDGE'));
assert.equal(projected.governance.secondAskRuntimeCreated,false);

console.log('✓ BOOK-V-CIV-ATLAS-R1-M1-W5–W6 Atlas-aware Ask retrieval + composition + deep-link passed.');
console.log('  Critical decline fixture routes through Atlas evidence before broader PHI OS knowledge.');
