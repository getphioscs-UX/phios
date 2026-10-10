import fs from 'node:fs';import assert from 'node:assert/strict';import vm from 'node:vm';
import {base,packet,page} from './build-b14-sks-book1-acceptance.mjs';
import {tasks,validateAcceptanceDraft} from './lib/book1-customer-acceptance.mjs';
const p=packet();assert.deepEqual(JSON.parse(fs.readFileSync(base+'w71-book1-acceptance-v1.json')),p);const html=fs.readFileSync(base+'W71-BOOK1-READER-REVIEW.html','utf8');assert.equal(html,page(p));new vm.Script(html.match(/<script>([\s\S]*)<\/script>/)[1]);
const draft={sourceDigest:p.sourceDigest,reader:'TEST ONLY',firstTimeReader:true,locale:'zh-Hans',testUrl:'https://test.example/books/reality-formation/',elapsedSeconds:250,results:tasks.map(t=>({id:t.id,status:'PASS',observation:'Fixture only'}))};
assert.equal(validateAcceptanceDraft(p,draft).eligibleForAcceptanceReview,true);
for(const mutate of [d=>d.sourceDigest='stale',d=>d.firstTimeReader=false,d=>d.elapsedSeconds=null,d=>d.elapsedSeconds=301,d=>d.results[0].status='FAIL',d=>d.results[0].observation='',d=>d.results.pop(),d=>d.results[1].id=d.results[0].id]){const d=structuredClone(draft);mutate(d);const result=validateAcceptanceDraft(p,d);assert.equal(result.eligibleForAcceptanceReview,false);assert.equal(result.humanAcceptanceApplied,false);}
assert.equal(p.humanAcceptanceComplete,false);console.log('✓ W71 preparation: five tasks, source-bound packet, timing/reviewer/evidence validation, 8 invalid drafts rejected; no human acceptance applied.');
