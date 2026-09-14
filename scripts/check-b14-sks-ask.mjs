import fs from 'node:fs';
import assert from 'node:assert/strict';
import {classifyStructuredIntent,normalizeStructuredScope,resolveStructuredEntry,structuredAnswerShape} from '../functions/_lib/structured-ask-policy.js';
import {createPtrcAskRequestContract} from '../functions/_lib/ptrc-ask-contract.js';
import {runKapGroundingPipeline} from '../functions/_lib/knowledge-answer-grounding.js';
import {composeDeterministicKapAnswer} from '../functions/_lib/knowledge-answer-composition.js';
const env={ASSETS:{fetch:async request=>{const p='.'+new URL(request.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}}};
assert.equal(normalizeStructuredScope({scopeType:'STRUCTURED_KNOWLEDGE',bookCode:'BOOK-4',objectId:'SK-B1-CONSTRAINT'}),null);
assert.equal(await resolveStructuredEntry('CONCEPT:sk-b4-missing',env),null);
assert.equal(await resolveStructuredEntry('CONCEPT:sk-b4-b4-p10-219',{ASSETS:{fetch:async()=>new Response('',{status:503})}}),null);
const samples=[['恢复','RECOVERY'],['scale transition','SCALE_TRANSITION'],['relationship feedback','RUNTIME_INTERACTION'],['compare patterns','PATTERN_COMPARISON'],['退化','DEGRADATION'],['continuity','CONTINUITY'],['expansion','EXPANSION'],['constraint','CONSTRAINT_ANALYSIS'],['state transition','STATE_TRANSITION'],['what is this mechanism','MECHANISM_EXPLANATION']];
for(const [q,intent] of samples)assert.equal(classifyStructuredIntent(q),intent);
for(const locale of ['en','zh-Hans'])for(const [ref,q,blocked] of [
 ['CONCEPT:sk-b1-constraint',locale==='en'?'Explain constraint':'解释约束',false],
 ['CONCEPT:sk-b1-constraint',locale==='en'?'Explain recovery':'解释恢复',true],
 ['CONCEPT:sk-b1-constraint',locale==='en'?'Explain scale transition':'解释尺度转换',true],
 ['CONCEPT:sk-b1-constraint',locale==='en'?'Explain relationship feedback':'解释关系互动',true],
 ['CONCEPT:sk-b2-b2-p6-002',locale==='en'?'Explain relationship interaction':'解释关系互动',true],
 ['CONCEPT:sk-b3-b3-p8-137',locale==='en'?'Explain recovery':'解释恢复',true],
 ['CONCEPT:sk-b4-b4-p10-219',locale==='en'?'Explain scale transition':'解释尺度转换',false]
]){
 const entry=await resolveStructuredEntry(ref,env);assert.ok(entry,ref);const requestContract=createPtrcAskRequestContract({q,locale,entryContext:entry});
 const result=await runKapGroundingPipeline({input:{question:q,locale,requestContract},env,request:new Request('https://test/api/knowledge-access')});
 const sources=result.groundingBundle.sources;
 if(blocked){assert.equal(sources.length,0,ref+q);assert.equal(result.coverageDecision.answerCompositionEligible,false);}
 else {assert.equal(sources[0]?.sourceType,'STRUCTURED_KNOWLEDGE_OBJECT',ref+q);const shape=structuredAnswerShape(result.groundingBundle,'supported');assert.ok(shape.exploreInBook.startsWith('/books/'));assert.equal(shape.possibleTransition,null);}
 const answer=composeDeterministicKapAnswer({bundle:result.groundingBundle,coverageDecision:result.coverageDecision});if(blocked)assert.equal(answer.content.structuredAnswer,undefined);
 else {assert.equal(result.coverageDecision.shortSupportedAnswerEligible,true);assert.ok(answer.content.structuredAnswer?.exploreInBook);}
}
console.log('✓ W37–W40: 10 intents and 14 bilingual real KAP pipeline cases passed, including source-index abstention and unrelated recovery/scale/relationship rejection.');
