import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT,readJson,assertEvidence} from './lib/knowledge-answer-projection/kap-answer-v1.mjs';
import {onRequestGet} from '../functions/api/ask-phios.js';

const pkg=readJson('package.json');
const aliases=['check:kap-w11','check:kap-w12','check:kap-w13','check:kap-w14','check:kap-w15','check:kap-w16','check:kap-w17'];
for(const alias of aliases){
  const cmd=pkg.scripts[alias]; assert.ok(cmd,`MISSING_SCRIPT:${alias}`);
  const [exe,...args]=cmd.split(' '); assert.equal(exe,'node');
  const run=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(run.status,0,`${alias}\n${run.stdout}\n${run.stderr}`); process.stdout.write(run.stdout);
}
const acceptance=readJson(`${ROOT}/acceptance/kap-w11-w17-answer-composition-acceptance-v1.json`);
const freeze=readJson(`${ROOT}/freeze/kap-w11-w17-answer-composition-freeze-v1.json`);
assert.equal(acceptance.status,'ACCEPTED_ASK_PHIOS_INDEPENDENT_DETERMINISTIC_PRODUCTION');
for(const [k,v] of Object.entries({
  deterministicAnswerActive:true,aiProviderActivated:false,tier0ProductionActive:true,askPhiosApiActive:true,askPhiosClientSurfaceActive:true,
  questionScopedAnswerRemainsNonAuthoritative:true,publicationCreated:false,realityReadingCreated:false,persistentCaseCreated:false,mcdRequired:false,guidedReadingRequired:false,realityJourneyRequired:false,upstreamGroundedAnswerConsumed:false
})) assert.equal(acceptance.acceptance[k],v,`ACCEPTANCE:${k}`);
assert.equal(freeze.status,'FROZEN_ASK_PHIOS_DETERMINISTIC_PRODUCTION_NO_AI_PROVIDER_NO_READING_ESCALATION');
for(const item of freeze.predecessorEvidence) assertEvidence(item);
for(const item of freeze.frozenOutputs) assertEvidence(item);
assert.equal(freeze.production.askPhiosIndependentlyDeliverable,true);
assert.equal(freeze.production.generativeProviderRequired,false);
assert.equal(freeze.production.mcdRequired,false);
assert.equal(freeze.production.guidedReadingRequired,false);
assert.equal(freeze.production.realityJourneyRequired,false);

// Local production smoke: real public Knowledge projections, no MANUSCRIPTS binding, no provider.
const root=process.cwd();
const ASSETS={fetch:async req=>{
  const rel=decodeURIComponent(new URL(req.url).pathname.replace(/^\/+/,''));
  if(rel.includes('..')) return new Response('',{status:400});
  try{return new Response(await fs.readFile(path.join(root,rel)),{status:200,headers:{'content-type':'application/json'}});}catch{return new Response('',{status:404});}
}};
const request=new Request('https://phios.local/api/ask-phios?q='+encodeURIComponent('为什么人工智能是文明能力长期累积的结果')+'&locale=zh-Hans&depth=STANDARD');
const response=await onRequestGet({request,env:{ASSETS}}); const payload=await response.json();
assert.equal(response.status,200); assert.equal(payload.ok,true); assert.equal(payload.capability,'ASK_PHIOS');
assert.equal(payload.answer.authorityClass,'QUESTION_SCOPED_NON_AUTHORITATIVE_PROJECTION'); assert.equal(payload.answer.generation.generativeModelUsed,false);
assert.equal(payload.ai.providerInvoked,false); assert.equal(payload.production.independentlyDeliverable,true); assert.ok(payload.answer.content.directAnswer.length>0); assert.ok(payload.sources.length>0);
assert.equal(payload.governance.publicationAuthorityUnchanged,true); assert.equal(payload.governance.realityReadingAuthorityUnchanged,true); assert.equal(payload.governance.persistentCaseCreated,false);

assert.equal(pkg.scripts['check:kap-answer'],'node scripts/check-kap-w11-w17-answer-composition.mjs');
assert.equal(pkg.scripts['check:kap'],'npm run check:kap-reconciliation && npm run check:kap-foundation && npm run check:kap-grounding && npm run check:kap-answer');
console.log('✓ KAP Phase 3 W11-W17 Answer Composition accepted and frozen.');
console.log('  Ask PHI OS is independently deliverable through deterministic governed grounding; AI provider, MCD, Guided Reading and Reality Journey are not prerequisites.');
