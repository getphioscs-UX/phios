import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {executeIChingProductRuntime} from '../functions/iching-product-runtime/iching-product-runtime-v1.js';
import {inspectIChingExecutionAuthority} from '../functions/iching-product-runtime/iching-execution-authority-v1.js';
import {onRequestPost as executeEndpoint} from '../functions/api/symbolic-method-execute.js';

const BASE='306b84652102583690a7f7665167f8dfdbb82541';
const j=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const t=path=>fs.readFileSync(path,'utf8');
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const exists=path=>assert.ok(fs.existsSync(path),`missing ${path}`);
const P=Object.freeze({
  scope:'content/production/symbolic-method/contracts/iching-product-runtime-contract-v1.json',
  schema:'content/interpretation/iching/contracts/iching-reading-ir-v1.schema.json',
  boundaries:'content/interpretation/iching/contracts/iching-product-boundaries-v1.json',
  surface:'content/public-ux/symbolic-method/contracts/iching-product-result-surface-contract-v1.json',
  successor:'content/interpretation/iching/reconciliation/iching-product-runtime-current-successor-v1.json',
  acceptance:'content/interpretation/iching/acceptance/iching-product-runtime-source-acceptance-v1.json',
  freeze:'content/interpretation/iching/freeze/iching-product-runtime-source-freeze-v1.json',
  hex:'content/professional/core-method-runtime/iching-hexagram-registry-v1.json',
  sources:'content/interpretation/iching/registries/iching-source-registry-v1.json',
  perspectives:'content/interpretation/iching/registries/iching-interpretation-perspective-registry-v1.json',
  corpus:'content/interpretation/iching/corpus/iching-public-domain-minimum-corpus-v1.json',
  html:'readings/i-ching/index.html',
  client:'assets/js/pages/iching-perspective.js',
  css:'assets/css/iching-perspective.css',
  api:'functions/api/symbolic-method-execute.js',
  context:'functions/api/symbolic-method-context.js',
  ir:'functions/interpretation-runtime/iching-reading-ir-v1.js',
  view:'functions/symbolic-method-public-ux/iching-product-view-model-v1.js',
  runtime:'functions/iching-product-runtime/iching-product-runtime-v1.js',
  authority:'functions/iching-product-runtime/iching-execution-authority-v1.js',
  pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
  publicCatalog:'content/web-production/px2/registries/public-method-catalog-v2.json'
});
for(const path of Object.values(P)) exists(path);

const authorities=Object.freeze({hexagramRegistry:j(P.hex),sourceRegistry:j(P.sources),perspectiveRegistry:j(P.perspectives),corpus:j(P.corpus)});
const request=(overrides={})=>({method:'I_CHING',question:'What should I observe before deciding?',inputMode:'MANUAL_LINES',lines:[9,9,9,9,9,9],sessionId:'ICH-PROD-ACCEPT-001',timestamp:'2026-08-24T00:00:00.000Z',projectionVersion:'1.0.0',...overrides});

// ICH-PROD-W0/W1 — successor-only authority reuse and a non-divination product scope.
const scope=j(P.scope),boundaries=j(P.boundaries),successor=j(P.successor);
for(const x of [scope,boundaries,successor,j(P.surface),j(P.acceptance)]) assert.equal(x.baselineCommit,BASE);
assert.equal(scope.status,'FROZEN_SOURCE_RUNTIME_SCOPE_ACTIVATION_NOT_GRANTED');
assert.deepEqual(scope.product,{productCode:'ICHING_SYMBOLIC_REFLECTIVE_PRODUCT_RUNTIME',methodCode:'I_CHING',pluginCode:'ICH',projectionType:'HEXAGRAM',deliveryMode:'SELF_SERVE_SYMBOLIC_PRODUCT',targetProductionClassification:'LIMITED_PRODUCTION'});
assert.equal(scope.authorityReuse.secondMethodIdentityCreated,false);assert.equal(scope.authorityReuse.secondPluginIdentityCreated,false);assert.equal(scope.authorityReuse.secondProjectionRuntimeCreated,false);assert.equal(scope.authorityReuse.sharedProjectionRuntimeRequired,true);
for(const forbidden of ['OBJECTIVE_FUTURE_PREDICTION','FATE_CONCLUSION','PSYCHOLOGICAL_DIAGNOSIS','MEDICAL_DIAGNOSIS_OR_TREATMENT','FINANCIAL_RECOMMENDATION_AUTHORITY','LEGAL_CONCLUSION_AUTHORITY','DECISION_DIRECTIVE']) assert.ok(scope.forbiddenAuthority.includes(forbidden));
assert.equal(scope.supportedInputModes.runtimeMayGenerateUnrecordedRandomness,false);assert.equal(scope.supportedInputModes.runtimeMayReroll,false);assert.equal(scope.supportedInputModes.aiMaySelectLines,false);
for(const predecessor of successor.predecessors){assert.equal(sha(predecessor.path),predecessor.sha256,`predecessor drift: ${predecessor.role}`);assert.equal(predecessor.mutated,false);}

// ICH-PROD-W2/W3 — manual, coin and replay evidence compose into one deterministic Reading IR.
const allChanging=await executeIChingProductRuntime(request(),authorities);
const replay=await executeIChingProductRuntime(request(),authorities);
assert.deepEqual(replay,allChanging);
assert.equal(allChanging.runtimeCode,'ICHING_SYMBOLIC_REFLECTIVE_PRODUCT_RUNTIME');
assert.equal(allChanging.readingIr.schemaVersion,'PHI-OS-ICHING-READING-IR-v1.0.0');
assert.equal(allChanging.readingIr.structuralProjection.primary.hexagramId,'HEXAGRAM-01');
assert.equal(allChanging.readingIr.structuralProjection.relating.hexagramId,'HEXAGRAM-02');
assert.deepEqual(allChanging.readingIr.structuralProjection.changingLines,[1,2,3,4,5,6]);
assert.equal(allChanging.readingIr.methodEvidence.sixLines.length,6);
assert.equal(allChanging.readingIr.methodEvidence.aiSelected,false);
assert.equal(allChanging.readingIr.methodEvidence.rerolledInsideCalculation,false);
assert.equal(allChanging.readingIr.aiUsed,false);assert.equal(allChanging.readingIr.providerUsed,false);assert.equal(allChanging.readingIr.productionEligible,false);

const coin=await executeIChingProductRuntime(request({inputMode:'COIN_CAST',lines:undefined,coinLines:Array.from({length:6},()=>[3,3,3]),sessionId:'ICH-PROD-COIN-001'}),authorities);
assert.equal(coin.readingIr.methodEvidence.inputMode,'COIN_CAST');assert.equal(coin.readingIr.structuralProjection.primary.hexagramId,'HEXAGRAM-01');
await assert.rejects(()=>executeIChingProductRuntime(request({inputMode:'SYSTEM_RANDOM',lines:undefined}),authorities),/PERSISTED_RANDOM_SELECTION_EVIDENCE_REQUIRED/);
const randomSelectionEvidence={selectedSymbols:['9','9','9','9','9','9'],seed:'PERSISTED-SEED-001',entropyEvidence:{source:'PERSISTED_SYSTEM_ENTROPY',digest:'0123456789abcdef'.repeat(4)},replayToken:'PERSISTED-REPLAY-001'};
const random=await executeIChingProductRuntime(request({inputMode:'SYSTEM_RANDOM',lines:undefined,randomSelectionEvidence,sessionId:'ICH-PROD-RANDOM-001'}),authorities);
assert.equal(random.readingIr.methodEvidence.replayEvidence.replayToken,'PERSISTED-REPLAY-001');assert.equal(random.readingIr.methodEvidence.aiSelected,false);

// ICH-PROD-W4/W5 — seven-layer I Ching surface and explicit source gaps.
const surface=j(P.surface),view=allChanging.publicView;
assert.deepEqual(view.hierarchy.map(x=>x.id),surface.layers.map(x=>x.id));
assert.equal(view.schemaVersion,'PHI-OS-ICHING-PRODUCT-PUBLIC-VIEW-MODEL-v1.0.0');
assert.equal(view.ichingSurface.lines.length,6);assert.equal(view.ichingSurface.primary.hexagramId,'HEXAGRAM-01');assert.equal(view.ichingSurface.relating.hexagramId,'HEXAGRAM-02');
assert.ok(view.sourceVisibility.sources.length>=2);assert.equal(view.authority.establishesFacts,false);assert.equal(view.authority.predictsGuaranteedOutcomes,false);assert.equal(view.authority.directsDecision,false);assert.equal(view.production.runAllowed,false);
const sourceGap=await executeIChingProductRuntime(request({lines:[7,8,8,8,7,8],sessionId:'ICH-PROD-GAP-003'}),authorities);
assert.equal(sourceGap.readingIr.structuralProjection.primary.hexagramId,'HEXAGRAM-03');
assert.equal(sourceGap.readingIr.sourceInterpretation.coverage.primary,'SOURCE_COMMENTARY_NOT_YET_INGESTED');
assert.ok(sourceGap.readingIr.uncertainty.states.some(x=>x.status==='UNRESOLVED'&&x.scope==='SOURCE_COVERAGE'));
assert.equal(sourceGap.publicView.sourceVisibility.sources.length,0);

// ICH-PROD-W6 — RCC, agency, sensitive domains and missing evidence stay visible.
assert.equal(boundaries.realityComparison.required,true);assert.equal(boundaries.realityComparison.hexagramIsRealityEvidence,false);assert.equal(boundaries.agency.decisionAuthority,'USER');assert.equal(boundaries.agency.ichingMayDecide,false);
assert.equal(allChanging.readingIr.rcc.required,true);assert.equal(allChanging.readingIr.rcc.questions.length,5);assert.equal(allChanging.readingIr.rcc.unknown[0].source,'SYSTEM_BOUNDARY_NOTICE');assert.equal(allChanging.readingIr.agency.decisionAuthority,'USER');assert.equal(allChanging.readingIr.agency.ichingMayDecide,false);
const sensitive=await executeIChingProductRuntime(request({question:'Should I invest money in this stock?',sessionId:'ICH-PROD-SENSITIVE-001'}),authorities);
assert.ok(sensitive.readingIr.sensitiveDomainBoundary.domains.includes('FINANCIAL'));assert.equal(sensitive.readingIr.sensitiveDomainBoundary.createsProfessionalAdvice,false);assert.equal(sensitive.readingIr.sensitiveDomainBoundary.createsDecisionDirective,false);

// ICH-PROD-W7 — public API is implemented but only trusted server evidence can open it.
const denied=await executeEndpoint({request:new Request('https://example.test/api/symbolic-method-execute',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request())}),data:{},env:{CF_PAGES_COMMIT_SHA:BASE}});
assert.equal(denied.status,423);const deniedBody=await denied.json();assert.equal(deniedBody.error.code,'SYMBOLIC_LIMITED_PRODUCTION_NOT_ACTIVATED');assert.equal(deniedBody.production.runAllowed,false);assert.equal(deniedBody.production.state,'PRODUCT_RUNTIME_SOURCE_READY_ACTIVATION_EVIDENCE_PENDING');
assert.equal(inspectIChingExecutionAuthority({data:{symbolicExecutionAuthority:{I_CHING:{methodCode:'I_CHING',state:'LIMITED_PRODUCTION',runAllowed:true,humanAcceptance:true,verifiedPersistenceIdentity:true,liveBrowserAcceptance:true,liveProductionShaVerified:true,liveProductionSha:BASE}}},env:{CF_PAGES_COMMIT_SHA:BASE}}).authorized,true);
assert.equal(inspectIChingExecutionAuthority({data:{symbolicExecutionAuthority:{I_CHING:{runAllowed:true}}},env:{CF_PAGES_COMMIT_SHA:BASE}}).authorized,false);

// ICH-PROD-W8 — dedicated line input/rendering exists and hidden browser persistence does not.
const html=t(P.html),client=t(P.client),css=t(P.css),api=t(P.api),context=t(P.context);
for(const token of ['data-iching-input','data-iching-line="1"','data-iching-line="6"','Record six lines (bottom to top)','does not cast for you','data-iching-results hidden tabindex="-1" aria-live="polite"','/assets/js/pages/iching-perspective.js']) assert.ok(html.includes(token),`html missing ${token}`);
for(const token of ['ich-hexagram-lines','SOURCE_COMMENTARY_NOT_YET_INGESTED','inputMode:\'MANUAL_LINES\'','randomUUID','new Date().toISOString()','renderIChingView']) assert.ok(client.includes(token),`client missing ${token}`);
for(const token of ['.sp-line-inputs','.ich-six-line-evidence','.ich-hexagram-grid','.ich-line-glyph--yin','select:focus-visible','@media(max-width:520px)']) assert.ok(css.includes(token),`css missing ${token}`);
for(const bad of ['localStorage','sessionStorage','indexedDB']) assert.equal(client.includes(bad),false,`hidden persistence primitive ${bad}`);
assert.ok(api.includes('inspectIChingExecutionAuthority'));assert.ok(api.includes('executeIChingProductRuntime'));assert.ok(context.includes('PRODUCT_RUNTIME_SOURCE_READY_ACTIVATION_EVIDENCE_PENDING')||context.includes('inspectIChingExecutionAuthority'));
assert.equal(sha('readings/symbolic/index.html'),'6ae2402ec1078f6bed1e5eb362d8256c189f8ff0e8cc2b66c54ddaba87662db3');
assert.equal(sha('assets/js/pages/symbolic-perspective.js'),'49e9fd01bd80e58826bdfbbfddf5bcbef1a6fc8aa438ab95e4743786f94e9740');
assert.equal(sha('assets/css/symbolic-perspective.css'),'ad018e54151b50b00d7e7b427110f1228d19af40eff0e4bbc9c73c548b5855ce');

// ICH-PROD-W9 — source acceptance closes; current production authority remains unchanged.
const acceptance=j(P.acceptance),freeze=j(P.freeze);
assert.equal(acceptance.status,'ACCEPTED_SOURCE_RUNTIME_COMPLETE_PRODUCTION_ACTIVATION_NOT_GRANTED');for(const [key,value] of Object.entries(acceptance.accepted)) assert.equal(value,true,`${key} not accepted`);
assert.equal(acceptance.production.publicRunAllowed,false);assert.equal(acceptance.production.humanReviewSessionsRequired,24);assert.equal(acceptance.production.humanReviewSessionsAccepted,0);
assert.equal(freeze.status,'I_CHING_PRODUCT_RUNTIME_SOURCE_FROZEN_ACTIVATION_EVIDENCE_PENDING');for(const item of freeze.frozenScope){exists(item.path);assert.equal(sha(item.path),item.sha256,`freeze drift: ${item.path}`);}
const pcm=j(P.pcm),ich=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='I_CHING');assert.ok(ich);assert.notEqual(ich.capabilityAvailability,'AVAILABLE');assert.equal(ich.userExecutable,false);assert.equal(ich.productionAccepted,false);
const publicCatalog=j(P.publicCatalog),publicIch=publicCatalog.methods.find(x=>x.methodCode==='I_CHING');assert.ok(publicIch);assert.equal(publicIch.runAllowed,false);
const campaign=j('content/production/symbolic-method/human-review/iching-human-review-campaign-v1.json');assert.equal(campaign.sessions.length,24);assert.equal(campaign.sessions.filter(x=>x.humanReviewed===true).length,0);
assert.equal(successor.productionBoundary.publicRunAllowedChanged,false);assert.equal(successor.productionBoundary.productionCapabilityPromoted,false);
const pkg=j('package.json');assert.equal(pkg.scripts['check:iching-product-runtime'],'node scripts/check-iching-product-runtime.mjs');

console.log('✓ ICH-PROD-W0–W9 passed: I Ching product Runtime source successor is complete and frozen.');
console.log('  Manual / coin / persisted-random replay evidence → frozen calculation → shared projection → source-bound interpretation → Reading IR → seven-layer public view is deterministic and fail-closed.');
console.log('  Production remains closed: 0/24 human sessions, verified persistence identity, live browser acceptance and live production SHA alignment are still pending.');
