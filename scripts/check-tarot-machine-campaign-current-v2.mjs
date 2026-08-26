import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {projectOne,projectThree} from './lib/tarot/tari-fixtures-v1.mjs';
import {tarotAuthorities,selectionRuntime} from './lib/tarot/tarot-fixtures-v1.mjs';
import {createTarotRuntime,TAROT_RUNTIME_CODE} from '../functions/core-method-runtime/tarot-runtime.js';
import {createTarotCardProjector} from '../functions/core-method-runtime/tarot-card-projection-mapper.js';
import {TAROT_DECK_ID,TAROT_DECK_VERSION,TAROT_ORIENTATION_POLICY_ID,TAROT_ORIENTATION_POLICY_VERSION} from '../functions/core-method-runtime/tarot-selection-runtime.js';
import {createTarotReadingIR} from '../functions/interpretation-runtime/tarot-reading-ir-v1.js';
import {createTarotProductPublicViewModel} from '../functions/symbolic-method-public-ux/tarot-product-view-model-v1.js';
import {detectSensitiveDomains,assertSymbolicSensitiveDomainBoundary} from '../functions/symbolic-method-public-ux/symbolic-sensitive-domain-guard.js';

const ROOT=process.cwd();
const BASE='6eb24e4e55a77859b0068836da7fa89e946ae3b1';
const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
const exists=p=>assert.ok(fs.existsSync(path.join(ROOT,p)),`missing ${p}`);
const P={
  cards:'content/professional/core-method-runtime/tarot-card-registry-v1.json',
  visual:'content/interpretation/tarot/corpus/tarot-rws-visual-observation-corpus-v1.json',
  visualLoc:'content/interpretation/tarot/registries/tarot-visual-evidence-locator-v1.json',
  sourceRegistry:'content/interpretation/tarot/registries/tarot-source-registry-v2.json',
  perspective:'content/interpretation/tarot/registries/tarot-interpretation-perspective-registry-v2.json',
  waite:'content/interpretation/tarot/corpus/tarot-waite-source-bound-corpus-v1.json',
  meaning:'content/interpretation/tarot/corpus/tarot-minimum-source-bound-corpus-v1.json',
  lens:'content/interpretation/tarot/registries/tarot-reflective-lens-registry-v1.json',
  blend:'content/interpretation/tarot/contracts/tarot-no-source-blending-contract-v1.json',
  freeze:'content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json',
  campaign35:'content/production/symbolic-method/machine/tarot-78-card-machine-campaign-v1.json',
  campaign36:'content/production/symbolic-method/machine/tarot-replay-machine-campaign-v1.json',
  campaign37:'content/production/symbolic-method/machine/tarot-sensitive-domain-machine-campaign-v1.json',
  accept35:'content/production/symbolic-method/acceptance/tarot-78-card-machine-acceptance-v1.json',
  accept36:'content/production/symbolic-method/acceptance/tarot-replay-machine-acceptance-v1.json',
  accept37:'content/production/symbolic-method/acceptance/tarot-sensitive-domain-machine-acceptance-v1.json',
  accept38:'content/production/symbolic-method/acceptance/tarot-machine-acceptance-v2.json',
  oldMachine:'content/production/symbolic-method/acceptance/tarot-machine-acceptance-v1.json',
  successor:'content/production/symbolic-method/reconciliation/tarot-machine-acceptance-current-successor-v1.json',
  phaseG:'content/interpretation/tarot/acceptance/tarot-product-surface-acceptance-v1.json',
  execute:'functions/api/symbolic-method-execute.js',
  context:'functions/api/symbolic-method-context.js',
  guard:'functions/symbolic-method-public-ux/symbolic-sensitive-domain-guard.js',
  pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v7.json',
  catalog:'content/web-production/px2/successors/public-method-catalog-v3.json',
  humanFreeze:'content/production/symbolic-method/freeze/tarot-human-acceptance-freeze-v3.json',
  browserFreeze:'content/production/symbolic-method/freeze/tarot-live-browser-acceptance-freeze-v1.json',
  authority:'functions/tarot-product-runtime/tarot-production-authority-v2.js'
};
for(const p of Object.values(P)) exists(p);

const authorities=Object.freeze({
  cardRegistry:readJson(P.cards),visualCorpus:readJson(P.visual),visualLocator:readJson(P.visualLoc),sourceRegistry:readJson(P.sourceRegistry),perspectiveRegistry:readJson(P.perspective),waiteCorpus:readJson(P.waite),predecessorMeaningCorpus:readJson(P.meaning),reflectiveLensRegistry:readJson(P.lens),noSourceBlendingContract:readJson(P.blend),corpusFreeze:readJson(P.freeze)
});
const compositionEvidence=Object.freeze({
  generatedAt:'2026-08-24T13:30:00.000Z',
  authorityDigests:{corpusFreezeSha256:sha256(P.freeze)},
  boundaryContractVersions:{rcc:'1.0.0',agency:'1.0.0',uncertainty:'1.0.0',compositionEvidence:'1.0.0'}
});
const contextDisclosure=Object.freeze({currentRealityContextUsed:false,contextUseWasExplicit:true});
function createIr(projections,question='What deserves attention here?',realityEvidence={}){
  return createTarotReadingIR({question,contextDisclosure,projections,authorities,realityEvidence,compositionEvidence});
}
function assertIrCore(ir,expectedCards){
  assert.equal(ir.schemaVersion,'PHI-OS-TAROT-READING-IR-v1.0.0');
  assert.equal(ir.methodCode,'TAROT');
  assert.equal(ir.cardObservations.length,expectedCards);
  assert.equal(ir.sourcePerspectives.length,expectedCards);
  assert.equal(ir.drawEvidence.cards.length,expectedCards);
  assert.equal(ir.drawEvidence.deterministic,true);
  assert.equal(ir.drawEvidence.aiUsed,false);
  assert.equal(ir.drawEvidence.redrawInsideInterpretation,false);
  assert.equal(ir.rcc.required,true);
  assert.equal(ir.rcc.rules.tarotCardIsEvidence,false);
  assert.equal(ir.agency.required,true);
  assert.equal(ir.agency.decisionAuthority,'USER');
  assert.equal(ir.agency.tarotMayDecide,false);
  assert.equal(ir.agency.cardMayCompelAction,false);
  assert.equal(ir.agency.systemMayCompelAction,false);
  assert.equal(ir.authority.readingMayPredict,false);
  assert.equal(ir.authority.readingMayDiagnose,false);
  assert.equal(ir.authority.readingMayInferThirdPartyHiddenState,false);
  assert.equal(ir.authority.readingMayCreateProfessionalDirective,false);
  assert.equal(ir.authority.privateReferenceRuntimeUse,false);
  assert.equal(ir.authority.webDiscoveryRuntimeUse,false);
  assert.equal(ir.productionEligible,false);
  const encoded=JSON.stringify(ir);
  assert.equal(encoded.includes('TAR-SRC-PRIV-LUA'),false);
  assert.equal(encoded.includes('WEB_DISCOVERY'),false);
  for(const obs of ir.cardObservations){
    assert.equal(obs.visualObservation.meaningAttached,false);
    assert.equal(obs.visualObservation.interpretationAllowedInThisRecord,false);
    assert.equal(obs.visualEvidence.rightsClass,'PUBLIC_DOMAIN');
    assert.equal(obs.visualEvidence.authorityTier,'T0');
  }
  for(const group of ir.sourcePerspectives){
    const waite=group.perspectives.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC');
    const refl=group.perspectives.find(x=>x.perspectiveClass==='REFLECTIVE');
    const psy=group.perspectives.find(x=>x.perspectiveClass==='PSYCHOLOGICAL');
    assert.ok(waite); assert.equal(waite.sourceId,'TAR-SRC-WAITE-PKT-1910'); assert.ok(waite.sourceUnits.length>=1);
    assert.ok(refl); assert.equal(refl.availability,'AVAILABLE');
    assert.ok(psy); assert.equal(psy.availability,'AVAILABLE'); assert.equal(psy.clinicalAuthority,false); assert.equal(psy.hiddenStateAuthority,false);
  }
  const view=createTarotProductPublicViewModel(ir);
  assert.equal(view.production.runAllowed,false);
  assert.equal(view.tarotSurface.cards.length,expectedCards);
  for(const card of view.tarotSurface.cards){
    assert.equal(card.artwork.rightsStatus,'PUBLIC_DOMAIN');
    assert.equal(card.artwork.authorityTier,'T0');
    assert.match(card.artwork.src,/^https:\/\/upload\.wikimedia\.org\//);
  }
  return view;
}
async function projectEvidence(evidence,prefix){
  const results=await createTarotRuntime(tarotAuthorities).calculateSpread({runtimeCode:TAROT_RUNTIME_CODE,calculationIdPrefix:`${prefix}-CALC`,evidence});
  return createTarotCardProjector().projectSpread({calculationResults:results,projectionVersion:'1.0.0'});
}
const randomBase={deckId:TAROT_DECK_ID,deckVersion:TAROT_DECK_VERSION,orientationPolicyId:TAROT_ORIENTATION_POLICY_ID,orientationPolicyVersion:TAROT_ORIENTATION_POLICY_VERSION,spreadVersion:'1.0.0',projectionVersion:'1.0.0',timestamp:'2026-08-24T13:30:00.000Z'};
async function randomEvidence(c){
  return selectionRuntime.select({...randomBase,inputMode:'SYSTEM_RANDOM',sessionId:`${c.caseId}-SESSION`,spreadId:c.spreadId,seed:c.seed,entropyEvidence:{source:'TPAI_MACHINE_EXTERNAL_ENTROPY',digest:c.entropyDigest},replayToken:c.replayToken});
}

// TPA-W35 — 78 cards through identity → artwork → VIS → source → projection → TARI/IR → RCC → AGENCY.
const c35=readJson(P.campaign35), a35=readJson(P.accept35);
assert.equal(c35.baselineCommit,BASE); assert.equal(c35.oneCardManualCardIds.length,78); assert.equal(new Set(c35.oneCardManualCardIds).size,78);
assert.deepEqual(new Set(c35.oneCardManualCardIds),new Set(authorities.cardRegistry.entries.map(x=>x.cardId)));
const oneSeen=new Set();
for(let i=0;i<c35.oneCardManualCardIds.length;i++){
  const cardId=c35.oneCardManualCardIds[i];
  const projections=await projectOne(cardId,`TPAI-ONE-${String(i+1).padStart(2,'0')}`);
  assert.equal(projections.length,1); assert.equal(projections[0].projectionValue.card.cardId,cardId);
  const ir=createIr(projections,`Machine coverage ${cardId}`);
  assertIrCore(ir,1);
  assert.equal(ir.cardObservations[0].cardId,cardId);
  oneSeen.add(cardId);
}
assert.equal(oneSeen.size,78);
const threeSeen=[]; const positionCounts=new Map([['SITUATION',0],['TENSION',0],['CONSIDERATION',0]]);
for(const group of c35.threeCardManualGroups){
  const projections=await projectThree(group.cardIds,group.caseId);
  const ir=createIr(projections,`Three-card machine coverage ${group.caseId}`);
  assertIrCore(ir,3);
  assert.deepEqual(ir.cardObservations.map(x=>x.cardId),group.cardIds);
  for(const obs of ir.cardObservations){threeSeen.push(obs.cardId);positionCounts.set(obs.position.positionId,(positionCounts.get(obs.position.positionId)||0)+1);}
}
assert.equal(threeSeen.length,78); assert.equal(new Set(threeSeen).size,78);
assert.deepEqual(Object.fromEntries(positionCounts),{SITUATION:26,TENSION:26,CONSIDERATION:26});
for(const rc of c35.systemRandomCases){
  const evidence=await randomEvidence(rc); assert.equal(evidence.drawEvidence.inputMode,'SYSTEM_RANDOM'); assert.equal(evidence.drawEvidence.draws.length,rc.spreadId==='ONE_CARD'?1:3); assert.ok(evidence.drawEvidence.draws.every(x=>x.orientation==='UPRIGHT'));
  const projections=await projectEvidence(evidence,rc.caseId); const ir=createIr(projections,`System random ${rc.caseId}`); assertIrCore(ir,rc.spreadId==='ONE_CARD'?1:3);
}
assert.equal(a35.status,'MACHINE_ACCEPTED_78_OF_78_WITH_ONE_AND_THREE_CARD_AND_RANDOM_MODES'); assert.equal(a35.accepted.identityCoverage,78); assert.equal(a35.accepted.artworkCoverage,78); assert.equal(a35.accepted.waiteSourceCoverage,78);

// TPA-W36 — same stored evidence must reproduce draw/calculation/projection and structured IR.
const c36=readJson(P.campaign36), a36=readJson(P.accept36); assert.equal(c36.baselineCommit,BASE); assert.equal(c36.cases.length,10);
for(const c of c36.cases){
  let e1,e2;
  if(c.mode==='SYSTEM_RANDOM'){e1=await randomEvidence(c);e2=await randomEvidence(c);}
  else if(c.spreadId==='ONE_CARD'){
    const {manualOne}=await import('./lib/tarot/tarot-fixtures-v1.mjs'); e1=await manualOne(c.cardIds[0],`${c.caseId}-SESSION`); e2=await manualOne(c.cardIds[0],`${c.caseId}-SESSION`);
  } else {
    const {manualThree}=await import('./lib/tarot/tarot-fixtures-v1.mjs'); e1=await manualThree(c.cardIds,`${c.caseId}-SESSION`); e2=await manualThree(c.cardIds,`${c.caseId}-SESSION`);
  }
  assert.deepEqual(e1,e2,`${c.caseId} selection evidence drift`);
  const p1=await projectEvidence(e1,`${c.caseId}-A`), p2=await projectEvidence(e1,`${c.caseId}-A`);
  assert.deepEqual(p1,p2,`${c.caseId} projection replay drift`);
  const ir1=createIr(p1,`Replay ${c.caseId}`), ir2=createIr(p2,`Replay ${c.caseId}`);
  assert.deepEqual(ir1,ir2,`${c.caseId} structured IR replay drift`);
  assert.deepEqual(ir1.sourcePerspectives.map(x=>x.perspectives.map(p=>[p.perspectiveClass,p.availability,p.sourceId||null])),ir2.sourcePerspectives.map(x=>x.perspectives.map(p=>[p.perspectiveClass,p.availability,p.sourceId||null])));
  assert.deepEqual(ir1.rcc,ir2.rcc); assert.deepEqual(ir1.agency,ir2.agency);
}
assert.equal(a36.status,'MACHINE_ACCEPTED_REPLAY_DRAW_PROJECTION_AND_STRUCTURED_IR'); assert.equal(a36.accepted.sameEvidenceSameStructuredIr,true);

// TPA-W37 — sensitive domains + third-party hidden state never receive symbolic fact/professional authority.
const c37=readJson(P.campaign37), a37=readJson(P.accept37); assert.equal(c37.baselineCommit,BASE); assert.equal(c37.cases.length,8);
const sensitiveCards=['RWS-MAJOR-13','RWS-MAJOR-16','RWS-SWORDS-NINE','RWS-PENTACLES-FOUR','RWS-CUPS-TWO','RWS-MAJOR-18','RWS-WANDS-TWO','RWS-CUPS-SEVEN'];
for(let i=0;i<c37.cases.length;i++){
  const c=c37.cases[i];
  assert.ok(detectSensitiveDomains(c.question).includes(c.domain),`${c.caseId} did not classify ${c.domain}`);
  const safe='This is a symbolic reflective lens. Compare it with current evidence; it does not establish facts or direct a decision.';
  const boundary=assertSymbolicSensitiveDomainBoundary({question:c.question,generatedOutput:safe});
  assert.equal(boundary.createsFact,false); assert.equal(boundary.createsDiagnosis,false); assert.equal(boundary.createsProfessionalAdvice,false); assert.equal(boundary.createsDecisionDirective,false); assert.equal(boundary.userDecisionAuthority,true);
  assert.throws(()=>assertSymbolicSensitiveDomainBoundary({question:c.question,generatedOutput:c.unsafeOutput}),/FORBIDDEN/,`${c.caseId} unsafe output was not blocked`);
  const projections=await projectOne(sensitiveCards[i],`TPAI-${c.caseId}`);
  const ir=createIr(projections,c.question,{unknown:[{evidenceId:`${c.caseId}-UNKNOWN`,statement:'The symbolic reading does not establish the requested fact or outcome.',source:'SYSTEM_BOUNDARY_NOTICE'}]});
  assertIrCore(ir,1); assert.equal(ir.authority.readingMayPredict,false); assert.equal(ir.authority.readingMayDiagnose,false); assert.equal(ir.authority.readingMayInferThirdPartyHiddenState,false); assert.equal(ir.authority.readingMayCreateProfessionalDirective,false); assert.equal(ir.agency.decisionAuthority,'USER');
}
assert.equal(a37.status,'MACHINE_ACCEPTED_SENSITIVE_AND_HIDDEN_STATE_BOUNDARIES'); assert.equal(a37.accepted.thirdPartyHiddenStateAuthorityGranted,false);

// TPA-W38 — aggregate machine gate; still fail-closed for all non-machine production gates.
const oldMachine=readJson(P.oldMachine), a38=readJson(P.accept38), successor=readJson(P.successor), phaseG=readJson(P.phaseG);
assert.equal(phaseG.status,'ACCEPTED_PRODUCT_SURFACE_SOURCE_BINDING_EXECUTION_STILL_CLOSED');
assert.equal(a38.baselineCommit,BASE); assert.equal(a38.successorOf,P.oldMachine); assert.equal(oldMachine.machineAcceptanceComplete,false); assert.equal(a38.machineAcceptanceComplete,true);
for(const required of ['78_CARD_IDENTITY','78_CARD_ARTWORK','78_CARD_VISUAL','78_CARD_WAITE_SOURCE','ONE_CARD','THREE_CARD','MANUAL_SELECTION','SYSTEM_RANDOM','DRAW_REPLAY','PROJECTION_REPLAY','STRUCTURED_IR_REPLAY','RCC_MANDATORY','AGENCY_MANDATORY','SENSITIVE_DOMAIN_BOUNDARY','THIRD_PARTY_HIDDEN_STATE_BOUNDARY']) assert.ok(a38.passedGates.includes(required),`aggregate gate missing ${required}`);
assert.equal(a38.productionBoundary.humanAcceptanceClaimed,false); assert.equal(a38.productionBoundary.liveBrowserAcceptanceClaimed,false); assert.equal(a38.productionBoundary.liveProductionShaAlignmentClaimed,false); assert.equal(a38.productionBoundary.productionCapabilityPromoted,false); assert.equal(a38.productionBoundary.publicRunAllowedChanged,false);
assert.equal(a38.productionBoundary.phaseHPersistenceAcceptancePresentInCurrentBaseline,false);
assert.equal(a38.productionBoundary.phaseHPersistenceMustBeRestoredOrReconciledBeforeActivation,true);
assert.equal(successor.baselineCommit,BASE); assert.equal(successor.status,'TAROT_MACHINE_ACCEPTED_PRODUCT_ACTIVATION_STILL_FAIL_CLOSED');
for(const [name,item] of Object.entries(successor.artifacts)){exists(item.path);assert.equal(item.sha256,sha256(item.path),`successor drift ${name}`);}
const execute=fs.readFileSync(P.execute,'utf8'), context=fs.readFileSync(P.context,'utf8');
assert.ok(execute.includes('SYMBOLIC_LIMITED_PRODUCTION_NOT_ACTIVATED')); assert.ok(execute.includes('runAllowed:false')); assert.ok(execute.includes("method==='TAROT'")); assert.ok(context.includes('await resolveTarotExecutionAuthority(context)')); const authorityText=fs.readFileSync(P.authority,'utf8'); assert.ok(authorityText.includes('clientMayGrantAuthority:false')); assert.ok(authorityText.includes('approvedCommitSha===sha'));
const humanFreeze=readJson(P.humanFreeze),browserFreeze=readJson(P.browserFreeze); assert.equal(humanFreeze.humanAcceptanceComplete,true); assert.equal(humanFreeze.current.humanReviewed,24); assert.equal(humanFreeze.current.accepted,24); assert.equal(browserFreeze.productionBoundary.humanAcceptanceComplete,true); assert.equal(browserFreeze.productionBoundary.browserSourceAcceptanceComplete,true); assert.equal(browserFreeze.productionBoundary.publicRunAllowed,false);
const pcm=readJson(P.pcm), tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT'); assert.ok(tarPcm); assert.equal(tarPcm.userExecutable,true); assert.equal(tarPcm.productionAccepted,true); assert.equal(tarPcm.capabilityAvailability,'LIMITED'); assert.equal(tarPcm.executionAuthority.staticRegistryMayGrantRunAllowed,false);
const catalog=readJson(P.catalog), tarPublic=catalog.methods.find(x=>x.methodCode==='TAROT'); assert.ok(tarPublic); assert.equal(tarPublic.runAllowed,false); assert.equal(tarPublic.staticCatalogMayGrantRunAllowed,false); assert.equal(tarPublic.runtimeAuthorityEndpoint,'/api/tarot-production-status');

console.log('✓ TPA-W35 78-card Machine Campaign passed: 78/78 one-card readings, 26 three-card groups covering all 78 cards, plus SYSTEM_RANDOM one/three-card paths; identity, artwork, VIS, Waite source, projection, RCC and AGENCY all remain governed.');
console.log('✓ TPA-W36 Replay Campaign passed: 10 manual/random one/three-card cases reproduce stored selection evidence, projection, source availability, RCC, AGENCY and the full structured Reading IR.');
console.log('✓ TPA-W37 Sensitive-domain Machine Campaign passed: medical, mental-health, financial, legal, pregnancy, death, relationship and third-party hidden-state authority remain blocked; unsafe certainty/directive outputs fail closed.');
console.log('✓ TPA-W38 Aggregate Machine Gate v2 passed: historical machine acceptance remains complete while Phase-M static capability is Limited and dynamic server authority remains commit-pinned.');
console.log('  Current successor state: machine + 24/24 human + browser evidence remain governed; static catalog cannot grant runAllowed and Phase-M server authority is independently gated.');
