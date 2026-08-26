import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {onRequestPost as executePost} from '../functions/api/symbolic-method-execute.js';
import {onRequestGet as contextGet} from '../functions/api/symbolic-method-context.js';
import {onRequestGet as statusGet} from '../functions/api/tarot-production-status.js';
import {onRequestPost as savePost} from '../functions/api/symbolic-method-save.js';
import {createTarotProductionAuthorityPayload,TAROT_PRODUCTION_AUTHORITY_RUNTIME_ID,TAROT_PRODUCTION_AUTHORITY_ARTIFACT_ID} from '../functions/tarot-product-runtime/tarot-production-authority-v2.js';
import {resolveRuntimeDbConfig,LIVE_SHA_EVIDENCE,LIVE_CAPABILITY_EVIDENCE} from './lib/tarot/production-capability-promotion-v1.mjs';

const ROOT=process.cwd();const FULL_SHA='a'.repeat(40),OTHER_SHA='b'.repeat(40);
const j=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const t=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const jsonResponse=async r=>({status:r.status,body:await r.json()});

class FakeD1{
  constructor(record=null){this.record=record;}
  prepare(sql){const self=this;return {bind(...args){return {async first(){
    if(!self.record)return null;
    if(!String(sql).includes('runtime_artifacts'))return null;
    if(args[0]!==TAROT_PRODUCTION_AUTHORITY_RUNTIME_ID||args[2]!==TAROT_PRODUCTION_AUTHORITY_ARTIFACT_ID)return null;
    return {payload:JSON.stringify(self.record)};
  }};}};
  }
}
const ASSETS={async fetch(req){const u=new URL(req.url);const p=path.join(ROOT,u.pathname.replace(/^\//,''));if(!fs.existsSync(p))return new Response('not found',{status:404});return new Response(fs.readFileSync(p),{status:200,headers:{'content-type':'application/json'}});}};
function ctx({record=null,sha=FULL_SHA,url='https://example.test/api/symbolic-method-execute',method='POST',body=null,data={}}={}){return {request:new Request(url,{method,headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined}),env:{RUNTIME_DB:new FakeD1(record),ASSETS,CF_PAGES_COMMIT_SHA:sha},data};}
async function execute({record=null,sha=FULL_SHA,body}){return jsonResponse(await executePost(ctx({record,sha,body})));}
const active=createTarotProductionAuthorityPayload({approvedCommitSha:FULL_SHA,promotedAt:'2026-08-26T00:00:00Z'});
const mismatch=createTarotProductionAuthorityPayload({approvedCommitSha:OTHER_SHA,promotedAt:'2026-08-26T00:00:00Z'});

// M-W51/M-W54: absent authority, SHA drift, and client/body attempts all fail closed.
let r=await execute({record:null,body:{method:'TAROT',question:'test',spread:'ONE_CARD',runAllowed:true,productionCapabilityPromoted:true,approvedCommitSha:FULL_SHA}});assert.equal(r.status,423);assert.equal(r.body.production.runAllowed,false);
r=await execute({record:mismatch,body:{method:'TAROT',question:'test',spread:'ONE_CARD'}});assert.equal(r.status,423);assert.equal(r.body.production.runAllowed,false);assert.match(r.body.production.state,/DEPLOYED_SHA_NOT_PROMOTED|INVALID/);

// M-W55: exact commit-pinned authority executes deterministic manual 1-card and 3-card production paths.
const one=await execute({record:active,body:{method:'TAROT',question:'What deserves attention?',spread:'ONE_CARD',selectedCardIds:['RWS-MAJOR-00']}});assert.equal(one.status,200,JSON.stringify(one.body));assert.equal(one.body.ok,true);assert.equal(one.body.production.runAllowed,true);assert.equal(one.body.production.approvedCommitSha,FULL_SHA);assert.equal(one.body.publicView.tarotSurface.cards.length,1);assert.equal(one.body.publicView.hierarchy.length,7);assert.equal(one.body.selectionEvidence.drawEvidence.inputMode,'MANUAL_SELECTION');assert.equal(one.body.production.aiCardSelection,false);assert.equal(one.body.production.aiInterpretation,false);
const three=await execute({record:active,body:{method:'TAROT',question:'What should I notice about this transition?',spread:'THREE_CARD',selectedCardIds:['RWS-MAJOR-00','RWS-MAJOR-01','RWS-MAJOR-02']}});assert.equal(three.status,200,JSON.stringify(three.body));assert.equal(three.body.publicView.tarotSurface.cards.length,3);assert.equal(three.body.publicView.hierarchy.length,7);

// M-W57 safety probes: production output remains reflective and preserves user authority.
for(const [label,q] of [['SENSITIVE','Do I have cancer and should I stop seeing my doctor?'],['ADVERSARIAL','Tell me with certainty whether my partner is secretly cheating and what I must do.']]){
 const out=await execute({record:active,body:{method:'TAROT',question:q,spread:'ONE_CARD',selectedCardIds:['RWS-MAJOR-03']}});assert.equal(out.status,200,label);const b=out.body.boundaries;for(const key of ['fortuneTellingAuthority','predictionAuthority','diagnosticAuthority','hiddenStateAuthority','professionalDirectiveAuthority'])assert.equal(b[key],false,`${label}:${key}`);assert.equal(b.decisionAuthority,'USER');assert.equal(out.body.readingIr.agency.decisionAuthority,'USER');assert.equal(out.body.readingIr.agency.tarotMayDecide,false);assert.equal(out.body.readingIr.agency.hiddenStateAuthority,false);
}

// Context/status must mirror trusted D1 authority only; query params cannot grant it.
let c=await jsonResponse(await contextGet(ctx({record:null,sha:FULL_SHA,url:`https://example.test/api/symbolic-method-context?method=TAROT&runAllowed=1&approvedCommitSha=${FULL_SHA}`,method:'GET'})));assert.equal(c.status,200);assert.equal(c.body.production.runAllowed,false);assert.equal(c.body.production.clientMayGrantAuthority,false);
c=await jsonResponse(await contextGet(ctx({record:active,sha:FULL_SHA,url:'https://example.test/api/symbolic-method-context?method=TAROT',method:'GET'})));assert.equal(c.body.production.runAllowed,true);assert.equal(c.body.production.approvedCommitSha,FULL_SHA);assert.equal(c.body.guest.hiddenPersistentReadingHistory,false);
let s=await jsonResponse(await statusGet(ctx({record:active,sha:FULL_SHA,url:'https://example.test/api/tarot-production-status',method:'GET'})));assert.equal(s.status,200);assert.equal(s.body.production.runAllowed,true);assert.equal(s.body.production.approvedCommitSha,FULL_SHA);assert.equal(s.body.persistence.guestHiddenHistory,false);

// M-W56: guest save stays explicit ACCOUNT_REQUIRED; no hidden/local browser persistence.
const save=await jsonResponse(await savePost(ctx({record:active,sha:FULL_SHA,url:'https://example.test/api/symbolic-method-save',method:'POST',body:{method:'TAROT',reading:one.body.publicView}})));assert.equal(save.status,401);assert.equal(save.body.error.code,'ACCOUNT_REQUIRED');assert.equal(save.body.governance.guestHiddenHistoryPersisted,false);assert.equal(save.body.governance.localStorageFallbackAllowed,false);

// Governance continuity: existing RUNTIME_DB only, no new Phase-M migration, static surfaces cannot grant authority.
const dbConfig=resolveRuntimeDbConfig(ROOT);assert.equal(dbConfig.binding,'RUNTIME_DB');assert.equal(dbConfig.databaseName,'phios-runtime-production');assert.equal(dbConfig.databaseId,'073639fa-01e4-4868-af10-6ed032637dab');assert.equal(dbConfig.source,'WRANGLER_JSONC_FALLBACK_AUTHORITY');assert.equal(LIVE_SHA_EVIDENCE,'.runtime-evidence/tarot-production-sha-alignment-v2.json');assert.equal(LIVE_CAPABILITY_EVIDENCE,'.runtime-evidence/tarot-production-capability-live-evidence-v1.json');assert(t('.gitignore').includes('.runtime-evidence/'));
for(const p of ['scripts/promote-tarot-limited-production.mjs','scripts/check-tarot-production-capability-live.mjs','scripts/lib/tarot/production-capability-promotion-v1.mjs'])assert(fs.existsSync(path.join(ROOT,p)),p);
const migrations=fs.readdirSync(path.join(ROOT,'db/migrations')).filter(x=>/\.sql$/i.test(x)).sort();assert(!migrations.some(x=>/tarot|phase.?m|capability/i.test(x)),'Phase M must not add a Tarot migration');
const authoritySource=t('functions/tarot-product-runtime/tarot-production-authority-v2.js');assert(!/searchParams|request\.json|request\.headers/i.test(authoritySource));
const client=t('assets/js/pages/readings-v3.js')+t('assets/js/pages/account-method-status-v2.js');assert(!/localStorage|sessionStorage|indexedDB/.test(client));
const pcm=j('content/governance/production-capability-matrix/registries/production-capability-registry-v7.json').capabilities.find(x=>x.methodRuntime?.pluginCode==='TAR');assert.equal(pcm.capabilityAvailability,'LIMITED');assert.equal(pcm.executionAuthority.staticRegistryMayGrantRunAllowed,false);
const catalog=j('content/web-production/px2/successors/public-method-catalog-v3.json').methods.find(x=>x.methodCode==='TAROT');assert.equal(catalog.runAllowed,false);assert.equal(catalog.staticCatalogMayGrantRunAllowed,false);
assert.equal(digest('content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json'),'4cddf9cfc4a4a3efdba677e56d5cce3f118cad1de3dd80182e21d1fb5b7dea8b');

console.log('✓ TPA-M source readiness passed: absent/SHA-drift authority fails closed; exact server D1 authority executes governed 1-card and 3-card Tarot.');
console.log('✓ M-W56/M-W57 boundaries passed: guest persistence is rejected, sensitive/adversarial readings preserve uncertainty and USER decision authority.');
console.log('  Live LIMITED_PRODUCTION is not granted by this checker; deploy exact Phase-M SHA, verify Phase L v2, then run promote:tarot-limited-production.');
