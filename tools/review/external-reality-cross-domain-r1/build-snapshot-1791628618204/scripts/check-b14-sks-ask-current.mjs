import fs from 'node:fs';
import assert from 'node:assert/strict';
import {resolveStructuredEntry,structuredIntentRelevant} from '../functions/_lib/structured-ask-policy.js';
import {createPtrcAskRequestContract} from '../functions/_lib/ptrc-ask-contract.js';
import {runKapGroundingPipeline} from '../functions/_lib/knowledge-answer-grounding.js';
import {composeDeterministicKapAnswer} from '../functions/_lib/knowledge-answer-composition.js';
import {projectCkaClientAnswer} from '../functions/_lib/client-knowledge-ask.js';
import {projectKnowledgeAnswerForCustomer} from '../functions/customer-projection/knowledge-customer-projection.js';
import './check-b14-sks-ask.mjs';
const cases=[
 ['PRESSURE','SK-B1-PRESSURE','为什么压力不会自动导致改变？','Why does pressure not automatically lead to change?','MISSING_OBJECT'],
 ['INTERACTION','SK-B2-B2-P6-007','为什么两个正常的人在一起会产生冲突？','Why can two otherwise normal people come into conflict together?','MISSING_MEANING'],
 ['DEGRADATION','SK-B3-B3-P8-111','一个 Runtime 为什么会慢慢退化？','Why does a runtime gradually degrade?','MISSING_MEANING'],
 ['RECOVERY','SK-B3-B3-P8-138','恢复和回到原样有什么不同？','How is recovery different from returning to the original state?','MISSING_MEANING'],
 ['COST','SK-B4-B4-P10-246','为什么扩大规模会增加维护成本？','Why does expanding scale increase maintenance costs?','BOUNDED_SOURCE'],
 ['SCALE','SK-B4-B4-P10-219','什么时候扩展会进入新的尺度？','When does expansion enter a new scale?','BOUNDED_SOURCE']
];
const env={ASSETS:{fetch:async request=>{const p='.'+new URL(request.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}}};
assert.equal(structuredIntentRelevant('EXPANSION',{bookCode:'BOOK-3',structuredTags:'MAINTENANCE_COST'}),false);
assert.equal(structuredIntentRelevant('RECOVERY',{bookCode:'BOOK-4',structuredTags:'MAINTENANCE_COST'}),false);
assert.equal(structuredIntentRelevant('EXPANSION',{bookCode:'BOOK-4',structuredTags:'CAPACITY'}),false);
const results=[];
for(const [id,objectId,zh,en,expected] of cases)for(const locale of ['zh-Hans','en']){
 const question=locale==='en'?en:zh,entry=await resolveStructuredEntry('CONCEPT:'+objectId.toLowerCase(),env);
 if(expected==='MISSING_OBJECT'){assert.equal(entry,null,'Missing pressure must not silently resolve to another mechanism');results.push({id,locale,question,objectId,outcome:expected});continue;}
 assert.ok(entry);const contract=createPtrcAskRequestContract({q:question,locale,entryContext:entry});assert.equal(contract.question,question);
 const result=await runKapGroundingPipeline({input:{question,locale,requestContract:contract},env,request:new Request('https://test/api/knowledge-access')});
 const sources=result.groundingBundle.sources;
 const answer=composeDeterministicKapAnswer({bundle:result.groundingBundle,coverageDecision:result.coverageDecision});
 if(expected==='MISSING_MEANING'){assert.equal(sources.length,0);assert.equal(result.coverageDecision.answerCompositionEligible,false);assert.notEqual(result.coverageDecision.shortSupportedAnswerEligible,true);assert.equal(answer.content.structuredAnswer,undefined);}
 else{assert.ok(sources.length);assert.ok(sources.every(s=>s.structuredObjectId===objectId),'Unrelated source leaked');assert.equal(result.coverageDecision.shortSupportedAnswerEligible,true);assert.ok(answer.content.structuredAnswer?.exploreInBook.startsWith('/books/reality-expansion/'));assert.equal(answer.content.structuredAnswer.possibleTransition,null);}
 const clientAnswer=projectCkaClientAnswer({answer,sources:[]});const view=projectKnowledgeAnswerForCustomer({clientAnswer},{locale});assert.ok(view.answer.text);
 if(expected==='MISSING_MEANING')assert.ok(!view.answer.structuredAnswer);
 results.push({id,locale,question,objectId,outcome:expected,sourceIds:sources.map(s=>s.sourceId)});
}
assert.equal(results.length,12);
console.log('✓ W70: six required questions in both languages; 2 missing-object, 6 missing-meaning and 4 bounded-source cases checked. These are coverage outcomes, not proof that all six questions have complete answers.');
