import fs from 'node:fs';import assert from 'node:assert/strict';
import {resolveStructuredRealityCandidates,STRUCTURED_CANDIDATE_ROLES} from '../functions/_lib/structured-reality-candidates.js';
import {onRequestPost} from '../functions/api/customer-reality-handoff.js';
const env={ASSETS:{fetch:async request=>{const p='.'+new URL(request.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}}};
const base={bookCode:'BOOK-1',objectId:'SK-B1-CONSTRAINT',role:'interpretationCandidate',userConfirmed:true,observation:'I observed a constraint.',realityFact:true,diagnosis:true};
let cases=0;
for(const locale of ['en','zh-Hans'])for(const role of STRUCTURED_CANDIDATE_ROLES){const result=await resolveStructuredRealityCandidates([{...base,role}],env,locale);assert.equal(result.accepted.length,1);const c=result.accepted[0];assert.equal(c.realityFact,false);assert.equal(c.diagnosis,false);assert.equal(c.recommendation,false);assert.ok(c.sourceRefs.manuscriptSectionRefs.length);assert.ok(c.href.startsWith('/books/'));cases++;}
for(const change of [{userConfirmed:false},{role:'diagnosis'},{bookCode:'BOOK-4'},{objectId:'SK-B1-MISSING'},{bookCode:'BOOK-2',objectId:'SK-B2-B2-P6-002'}]){const result=await resolveStructuredRealityCandidates([{...base,...change}],env);assert.equal(result.accepted.length,0);assert.equal(result.rejected.length,1);cases++;}
assert.equal((await resolveStructuredRealityCandidates([base],{})).accepted.length,0);
const request=body=>new Request('https://test/api/customer-reality-handoff',{method:'POST',body:JSON.stringify(body)});
const body={sourceType:'ASK',viewModel:{question:'Explain constraint'},structuredCandidates:[base],consent:{explicit:true,accepted:true}};
assert.equal((await onRequestPost({request:request({...body,consent:{}}),env})).status,403);
const response=await onRequestPost({request:request(body),env});assert.equal(response.status,200);const result=await response.json();assert.equal(result.view.knowledge.items[0].realityFact,false);assert.equal(result.workspace.sideContext.knowledge[0].role,'interpretationCandidate');assert.equal(result.view.currentReality.importantFacts.length,0);assert.equal(result.continuation.persisted,false);
const contract=JSON.parse(fs.readFileSync('content/knowledge/structured/knowledge-reality-boundary-v1.json'));assert.deepEqual(contract.candidateRoles,STRUCTURED_CANDIDATE_ROLES);for(const route of contract.routes)assert.ok(fs.existsSync('.'+route.href+'index.html'));
console.log(`✓ W50–W52: ${cases} candidate cases, unavailable-source rejection, real handoff consent, reference-only workspace mapping and existing destination routes passed.`);
