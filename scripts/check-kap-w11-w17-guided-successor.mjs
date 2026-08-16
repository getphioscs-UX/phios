import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {onRequestGet} from '../functions/api/ask-phios.js';
const read=p=>fs.readFileSync(p,'utf8');const j=p=>JSON.parse(read(p));const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pkg=j('package.json');
for(const step of ['11','12','13','14','15','16','17']){const alias=`check:kap-w${step}`;const command=pkg.scripts[alias];assert.ok(command,`MISSING:${alias}`);const [exe,...args]=command.split(' ');assert.equal(exe,'node');const run=spawnSync(process.execPath,args,{cwd:process.cwd(),encoding:'utf8'});assert.equal(run.status,0,`${alias}\n${run.stdout}\n${run.stderr}`);process.stdout.write(run.stdout);}
const freeze=j('content/knowledge/answer-projection/freeze/kap-w11-w17-answer-composition-freeze-v1.json');const successor=j('content/knowledge/answer-projection/reconciliation/kap-w17-w18-guided-reading-surface-successor-v1.json');
assert.equal(freeze.status,'FROZEN_ASK_PHIOS_DETERMINISTIC_PRODUCTION_NO_AI_PROVIDER_NO_READING_ESCALATION');assert.equal(successor.status,'ACTIVE_ADDITIVE_SURFACE_SUCCESSOR');
for(const item of [...freeze.predecessorEvidence,...freeze.frozenOutputs]){if(item.path==='assets/js/pages/knowledge-search.js')continue;assert.equal(sha(item.path),item.sha256,`KAP_W11_W17_FROZEN_DRIFT:${item.path}`);}
assert.equal(successor.authorizedDrift.predecessorSha256,freeze.frozenOutputs.find(x=>x.path==='assets/js/pages/knowledge-search.js').sha256);assert.equal(sha(successor.authorizedDrift.path),successor.authorizedDrift.successorSha256);assert.equal(successor.authorityBoundary.askPhiosSemanticsChanged,false);assert.equal(successor.authorityBoundary.guidedReadingIsSeparateCapability,true);
const ASSETS={fetch:async req=>{const rel=decodeURIComponent(new URL(req.url).pathname.replace(/^\/+/,''));try{return new Response(fs.readFileSync(rel),{status:200,headers:{'content-type':'application/json'}})}catch{return new Response('',{status:404})}}};
const request=new Request('https://phios.local/api/ask-phios?q='+encodeURIComponent('为什么人工智能是文明能力长期累积的结果')+'&locale=zh-Hans&depth=STANDARD');const response=await onRequestGet({request,env:{ASSETS}});const payload=await response.json();assert.equal(response.status,200);assert.equal(payload.ok,true);assert.equal(payload.capability,'ASK_PHIOS');assert.equal(payload.ai.providerInvoked,false);assert.equal(payload.production.independentlyDeliverable,true);assert.equal(payload.production.requiresGuidedReading,false);assert.equal(payload.governance.persistentCaseCreated,false);
assert.equal(pkg.scripts['check:kap-answer'],'node scripts/check-kap-w11-w17-guided-successor.mjs');
console.log('✓ KAP-W11-W17 predecessor answer semantics preserved under W18 Guided Reading surface successor.');
