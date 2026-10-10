import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;

import {createIChingGovernedCast,verifyIChingGovernedCast,ICHING_CAST_SCHEMA,ICHING_CAST_ALGORITHM} from '../functions/iching-casting/iching-casting-adapter-v1.js';
import {buildIChingProductEvidence} from '../functions/iching-product-runtime/iching-product-runtime-v2.js';
import {onRequestPost as castEndpoint,onRequestGet as castEndpointGet} from '../functions/api/iching-full-cast.js';
import {createIChingFullProductionAuthorityPayload} from '../functions/iching-full-production/iching-full-production-v1.js';

const readJson=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const read=path=>fs.readFileSync(path,'utf8');

const contract=readJson('content/production/symbolic-method/contracts/iching-customer-casting-surface-completion-v1.json');
const current=readJson('content/production/symbolic-method/authority/iching-current-authority.json');
const release=readJson('content/production/symbolic-method/releases/iching/ICHING-1.0.1.json');

assert.equal(contract.schemaVersion,'PHI-OS-ICHING-CUSTOMER-CASTING-SURFACE-COMPLETION-v1.0.0');
assert.equal(contract.releaseId,'ICHING-1.0.1');
assert.equal(contract.status,'CUSTOMER_CASTING_SURFACE_AND_SELF_CASTING_GUIDE_RELEASED_WITH_DURABLE_FULL_PRODUCTION');
assert.equal(contract.authority.singleCurrentAuthorityPointer,'content/production/symbolic-method/authority/iching-current-authority.json');
assert.equal(contract.authority.newCurrentVNumberCreated,false);
assert.equal(contract.authority.releaseIdChanged,true);
assert.equal(contract.frozenCore.corpusReopened,false);
assert.equal(contract.frozenCore.depthHumanAcceptanceReopened,false);
assert.equal(contract.frozenCore.depthCoverage,'448/448');
assert.equal(contract.frozenCore.bilingualRuntimeCases,'896/896');
assert.equal(contract.frozenCore.interpretationRuntimeChanged,false);
assert.equal(contract.frozenCore.productRuntimeChanged,false);
assert.equal(contract.frozenCore.releaseManifestChanged,true);
assert.equal(current.releaseId,'ICHING-1.0.1');
assert.equal(current.releaseManifest,'content/production/symbolic-method/releases/iching/ICHING-1.0.1.json');
assert.equal(release.releaseId,'ICHING-1.0.1');
assert.equal(release.acceptedEvidence.depthHumanAcceptance,'448/448');
assert.equal(release.acceptedEvidence.bilingualRuntimeCases,'896/896');

const question='What pattern of change should I observe before I decide?';
const fixedBytes=Uint8Array.from([0,2,4,6,8,1,10,3,5,7,9,11,12,13,14,15,16,17]);
const fixedNow=()=>new Date('2026-08-27T05:00:00.000Z');
const cast=await createIChingGovernedCast({question,randomBytes:fixedBytes,now:fixedNow});
assert.equal(cast.schemaVersion,ICHING_CAST_SCHEMA);
assert.equal(cast.algorithm.code,ICHING_CAST_ALGORITHM);
assert.equal(cast.algorithm.randomSource,'SERVER_WEB_CRYPTO_GET_RANDOM_VALUES');
assert.equal(cast.algorithm.lineOrder,'BOTTOM_TO_TOP');
assert.deepEqual(cast.selection.selectedSymbols,['6','7','8','9','7','8']);
assert.deepEqual(cast.selection.coinGroups,[[2,2,2],[2,2,3],[2,3,3],[3,3,3],[2,3,2],[3,2,3]]);
assert.equal(cast.selection.inputMode,'SYSTEM_RANDOM');
assert.equal(cast.selection.selectionMode,'SYSTEM_RANDOM');
assert.equal(cast.selection.aiSelected,false);
assert.equal(cast.selection.favorableOutcomeSelection,false);
assert.equal(cast.selection.rerolledInsideCalculation,false);
assert.equal(cast.questionBinding.rawQuestionStoredByCastingAdapter,false);
assert.equal(cast.evidenceBoundary.symbolicSamplingEvidenceOnly,true);
assert.equal(cast.evidenceBoundary.realityEvidence,false);
assert.equal(cast.evidenceBoundary.predictionAuthority,false);
assert.equal(cast.evidenceBoundary.diagnosticAuthority,false);
assert.equal(cast.evidenceBoundary.professionalDirectiveAuthority,false);
assert.equal(cast.evidenceBoundary.decisionAuthority,'USER');
assert.match(cast.randomSelectionEvidence.entropyEvidence.digest,/^[a-f0-9]{64}$/);
assert.match(cast.randomSelectionEvidence.replayToken,/^ICH-CAST-[a-f0-9]{64}$/);
assert.equal(await verifyIChingGovernedCast(cast,question),true);
assert.equal(await verifyIChingGovernedCast(cast,`${question} changed`),false);

const replay=await createIChingGovernedCast({question,randomBytes:fixedBytes,now:fixedNow});
assert.deepEqual(replay,cast,'same governed sampling evidence + timestamp must reproduce the same cast package');
const tampered=structuredClone(cast);
tampered.selection.selectedSymbols[0]='9';
assert.equal(await verifyIChingGovernedCast(tampered,question),false,'tampered selected symbol must invalidate cast evidence');

const productEvidence=buildIChingProductEvidence({
  method:'I_CHING',
  question,
  inputMode:'SYSTEM_RANDOM',
  randomSelectionEvidence:cast.randomSelectionEvidence,
  sessionId:cast.castId,
  timestamp:cast.createdAt,
  projectionVersion:'1.0.0'
});
assert.equal(productEvidence.inputMode,'SYSTEM_RANDOM');
assert.equal(productEvidence.selectionMode,'SYSTEM_RANDOM');
assert.deepEqual(productEvidence.selectionEvidence.selectedSymbols,cast.randomSelectionEvidence.selectedSymbols);
assert.equal(productEvidence.selectionEvidence.seed,cast.randomSelectionEvidence.seed);
assert.deepEqual(productEvidence.selectionEvidence.entropyEvidence,cast.randomSelectionEvidence.entropyEvidence);
assert.equal(productEvidence.selectionEvidence.replayToken,cast.randomSelectionEvidence.replayToken);
assert.equal(productEvidence.selectionEvidence.aiSelected,false);


class MockAuthorityD1{
  constructor(payload){this.payload=payload;}
  prepare(){
    const self=this;
    return {
      bind(){return this;},
      async first(){return self.payload?{payload:JSON.stringify(self.payload)}:null;}
    };
  }
}
const liveSha='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const liveAuthority=createIChingFullProductionAuthorityPayload({
  approvedCommitSha:liveSha,
  rightsReviewId:'ICHING-GLOBAL-RIGHTS-CHECK-001',
  guestRetentionDays:30,
  promotedAt:'2026-08-27T05:00:00.000Z',
  active:true
});
const liveEnv={
  CF_PAGES_COMMIT_SHA:liveSha,
  ICHING_FULL_PRODUCTION_GUEST_SESSION_SECRET:'0123456789abcdef0123456789abcdef',
  RUNTIME_DB:new MockAuthorityD1(liveAuthority)
};
const endpointRequest=new Request('https://example.test/api/iching-full-cast',{
  method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({method:'I_CHING',intent:'CREATE_NEW_CAST',question})
});
const endpointResponse=await castEndpoint({request:endpointRequest,env:liveEnv,data:{}});
assert.equal(endpointResponse.status,200,await endpointResponse.clone().text());
assert.match(endpointResponse.headers.get('set-cookie')||'',/__Host-PHIOS_ICHING_GUEST=/);
const endpointBody=await endpointResponse.json();
assert.equal(endpointBody.ok,true);
assert.equal(endpointBody.production.state,'FULL_PRODUCTION');
assert.equal(endpointBody.production.runAllowed,true);
assert.equal(endpointBody.boundaries.questionSemanticsInfluenceSelection,false);
assert.equal(endpointBody.boundaries.aiSelected,false);
assert.equal(endpointBody.boundaries.automaticReroll,false);
assert.equal(await verifyIChingGovernedCast(endpointBody.cast,question),true);

const deniedRequest=new Request('https://example.test/api/iching-full-cast',{
  method:'POST',
  headers:{'content-type':'application/json'},
  body:JSON.stringify({method:'I_CHING',intent:'CREATE_NEW_CAST',question})
});
const deniedResponse=await castEndpoint({request:deniedRequest,env:{...liveEnv,RUNTIME_DB:new MockAuthorityD1(null)},data:{}});
assert.equal(deniedResponse.status,423);
const getResponse=await castEndpointGet();
assert.equal(getResponse.status,405);

const endpoint=read('functions/api/iching-full-cast.js');
for(const marker of ['createIChingGovernedCast','resolveIChingFullProductionAuthority','ensureIChingGuestSession','CREATE_NEW_CAST','questionSemanticsInfluenceSelection:false','automaticReroll:false'])assert.ok(endpoint.includes(marker),`cast endpoint missing ${marker}`);
assert.equal(endpoint.includes('interpretation-runtime'),false,'casting endpoint must not own interpretation');
assert.equal(endpoint.includes('iching-depth-admitted-editorial-corpus'),false,'casting endpoint must not own corpus');

const client=read('assets/customer-ui/js/surfaces/iching-casting.js');
for(const marker of ['SYSTEM_RANDOM','MANUAL_LINES','COIN_CAST','/api/iching-full-cast','CREATE_NEW_CAST','/api/iching-full-execute','renderIChingView','question changed','coinLines'])assert.ok(client.includes(marker),`casting UX missing ${marker}`);
assert.ok(client.includes("currentCast&&question()!==boundQuestion"),'question mutation must invalidate a generated cast');
assert.ok(client.includes('stopImmediatePropagation'),'non-manual modes must not fall through to the frozen manual execute handler');

const shell=read('assets/customer-ui/js/shell.js');
assert.ok(shell.includes("document.body.dataset.cxSurface==='ICHING_FULL_PRODUCTION'"));
assert.ok(shell.includes("import('./surfaces/iching-casting.js')"));
const css=read('assets/customer-ui/surfaces/iching-casting.css');
for(const marker of ['cx-cast-mode-buttons','cx-cast-lines','cx-cast-coin-grid'])assert.ok(css.includes(marker),`casting CSS missing ${marker}`);

const frozenPaths=new Set(release.artifacts.map(item=>item.path));
for(const path of [
  'content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json',
  'functions/interpretation-runtime/iching-depth-editorial-runtime-v2.js',
  'functions/iching-product-runtime/iching-product-runtime-v2.js',
  'perspectives/iching/run/index.html',
  'assets/customer-ui/js/surfaces/iching-full.js',
  'functions/api/iching-full-execute.js'
])assert.equal(frozenPaths.has(path),true,`expected immutable release witness missing: ${path}`);
for(const path of [
  'functions/iching-casting/iching-casting-adapter-v1.js',
  'functions/api/iching-full-cast.js',
  'assets/customer-ui/js/surfaces/iching-casting.js',
  'assets/customer-ui/surfaces/iching-casting.css',
  'content/production/symbolic-method/contracts/iching-customer-self-casting-guide-v1.json'
])assert.equal(frozenPaths.has(path),true,`ICHING-1.0.1 must freeze the completed customer casting surface: ${path}`);

assert.equal(contract.selfCastingGuide.lineValueReference,true);assert.equal(contract.selfCastingGuide.threeCoinMethod,true);assert.equal(contract.selfCastingGuide.sixCoinStaticMethodFromUserReference,true);assert.equal(contract.selfCastingGuide.traditionalYarrowMethod,true);
console.log('✓ ICHING-1.0.1 customer casting surface completion passed.');
console.log('  PHI OS governed cast + manual lines + recorded three-coin input + complete self-casting guide converge on the existing product runtime without reopening corpus, 448/448 admission or interpretation runtime.');
console.log('  System casting is server CSPRNG evidence, question-bound and replay-tokened; AI selection, favorable-result selection and automatic reroll remain forbidden.');
