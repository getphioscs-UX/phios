import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {classifyAsk2Consumption} from '../functions/ask2/ask2-consumption-runtime.js';
import {composeCkaContextualRetrievalQuestion,composeCkaGuidedRetrievalQuestion} from '../functions/_lib/client-knowledge-ask-b.js';
import {retrieveAtlasScope} from '../functions/_lib/atlas-retrieval-scope.js';
import {evaluateKapQuestionSourceRelevance} from '../functions/_lib/knowledge-answer-grounding.js';
import {buildAtlasAskContext,buildAtlasAskUrl} from '../assets/js/pages/civilization-atlas/atlas-ask-context.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixture=JSON.parse(await fs.readFile(path.join(root,'content/civilization-atlas/maintenance/ask-production-language-regression-v1.json'),'utf8'));
const askHtml=await fs.readFile(path.join(root,'knowledge/ask/index.html'),'utf8');
const askCss=await fs.readFile(path.join(root,'assets/customer-ui/surfaces/contextual-ask.css'),'utf8');
const env={ASSETS:{fetch:async request=>{
  const relative=new URL(request.url).pathname.replace(/^\//,'');
  try{return new Response(await fs.readFile(path.join(root,relative)),{status:200,headers:{'content-type':'application/json'}})}catch{return new Response('',{status:404})}
}}};

for(const row of fixture.cases){
  const body=row.scope?{entryContext:{bookCode:'BOOK-5',retrievalScope:row.scope}}:row.currentEvidence?{currentExternalEvidence:[{sourceId:'TEST'}]}:{};
  assert.equal(classifyAsk2Consumption({question:row.question,body}).mode,row.expectedRoute,row.id);
}
const original='纳图夫聚落如何形成更高密度？';
assert.equal(composeCkaContextualRetrievalQuestion(original,{contextSummary:'must not enter q',readingPath:'BOOK-5 > PART-12'}),original.normalize('NFKC'));
assert.equal(composeCkaGuidedRetrievalQuestion(original,{filledFields:['whatChanged'],fields:{whatChanged:'private context'}}),original.normalize('NFKC'));

const state={activeLayer:'cases',primaryCaseId:'CA-T00-01',caseIds:['CA-T00-01'],regionIds:['WEST_ASIA'],trajectoryIds:[],evidenceClasses:[]};
const context=buildAtlasAskContext(state,{},'zh-Hans','https://phios.test/books/reality-differentiation/');
assert.equal(context.retrievalScope.scopeType,'CIVILIZATION_ATLAS');
assert.match(buildAtlasAskUrl(state,{},'zh-Hans','https://phios.test/books/reality-differentiation/'),/retrievalScope=/);
const atlas=await retrieveAtlasScope({env,scope:context.retrievalScope,locale:'zh-Hans'});
assert.equal(atlas.sources[0].atlasEntityId,'CA-T00-01');
assert.deepEqual(atlas.chain.map(item=>item.stage),['ATLAS_ENTITY','ATLAS_EVIDENCE','PART_12','BROADER_KNOWLEDGE']);
assert.equal(atlas.chain[1].status,'NO_LINKED_EVIDENCE_RECORD');

const irrelevant=evaluateKapQuestionSourceRelevance({sources:[{text:'Settlement and storage shaped regional networks.'}],normalization:{tokens:['Martian','quantum','ritual']}});
assert.equal(irrelevant.established,false);
assert.ok(irrelevant.requiredMatches>=2);
const scoped=evaluateKapQuestionSourceRelevance({sources:[{text:atlas.sources[0].text,scopeMatch:true}],normalization:{tokens:['纳图夫','聚落','密度']}});
assert.equal(scoped.established,true);
assert.match(askHtml,/PHIOS-LOGO-MARK-v1\.png/);
assert.match(askHtml,/cx-ask-poster__network/);
assert.doesNotMatch(askHtml,/data-cx-asset="HERO-001"/);
assert.match(askCss,/M1-W6 full-bleed reconstruction/);
assert.match(askCss,/@media\(max-width:620px\)/);

console.log('✓ BOOK-V CIV-ATLAS R1 M1 W5–W6 ASK routing, structured scope, Atlas chain, and relevance gate passed.');
console.log(`  Production-language regression cases ${fixture.cases.length}; question text remains isolated from retrieval scope.`);
