import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {projectOne,projectThree} from './lib/tarot/tari-fixtures-v1.mjs';
import {bindTarotCorpusProjections} from '../functions/interpretation-runtime/adapters/tarot-interpretation-adapter-v2.js';
import {createTarotReadingIR,TAROT_READING_IR_SCHEMA,TAROT_READING_IR_VERSION} from '../functions/interpretation-runtime/tarot-reading-ir-v1.js';

const ROOT=process.cwd();
const BASE='a347b414094e23cc361c3c73120173f117eef537';
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
  predecessor:'content/interpretation/tarot/reconciliation/tarot-interpretation-runtime-state-successor-v1.json',
  successor:'content/interpretation/tarot/reconciliation/tarot-interpretation-runtime-state-successor-v2.json',
  schema:'content/interpretation/tarot/contracts/tarot-reading-ir-v1.schema.json',
  rcc:'content/interpretation/tarot/contracts/tarot-rcc-mandatory-contract-v1.json',
  agency:'content/interpretation/tarot/contracts/tarot-agency-contract-v1.json',
  uncertainty:'content/interpretation/tarot/contracts/tarot-uncertainty-contract-v1.json',
  comp:'content/interpretation/tarot/contracts/tarot-composition-evidence-contract-v1.json',
  acceptance:'content/interpretation/tarot/acceptance/tarot-tari-successor-acceptance-v1.json',
  pcm:'content/governance/production-capability-matrix/registries/production-capability-registry-v6.json',
  publicCatalog:'content/web-production/px2/successors/public-method-catalog-v2.json'
};
for(const p of Object.values(P)) exists(p);
const authorities=Object.freeze({
  cardRegistry:readJson(P.cards),visualCorpus:readJson(P.visual),visualLocator:readJson(P.visualLoc),sourceRegistry:readJson(P.sourceRegistry),perspectiveRegistry:readJson(P.perspective),waiteCorpus:readJson(P.waite),predecessorMeaningCorpus:readJson(P.meaning),reflectiveLensRegistry:readJson(P.lens),noSourceBlendingContract:readJson(P.blend),corpusFreeze:readJson(P.freeze)
});
const successor=readJson(P.successor), predecessor=readJson(P.predecessor), schema=readJson(P.schema), rccContract=readJson(P.rcc), agencyContract=readJson(P.agency), uncertaintyContract=readJson(P.uncertainty), compContract=readJson(P.comp), acceptance=readJson(P.acceptance);

// W21 — bind frozen corpus as TARI v2 successor, preserving v1 and production closure.
assert.equal(successor.baselineCommit,BASE);
assert.equal(successor.status,'TARI_CORPUS_BOUND_SUCCESSOR_ACTIVE_PRODUCT_ACTIVATION_DEFERRED');
assert.equal(successor.predecessor.path,P.predecessor); assert.equal(successor.predecessor.preserved,true); assert.equal(successor.predecessor.sha256,sha256(P.predecessor));
assert.equal(successor.corpusAuthority.freezeSha256,sha256(P.freeze)); assert.equal(successor.corpusAuthority.currentCorpusSuccessorSha256,sha256(successor.corpusAuthority.currentCorpusSuccessor));
assert.equal(predecessor.authority.secondInterpretationRuntimeAuthorityCreated,false);
assert.equal(successor.runtimeBinding.tariV2CorpusConsumerRebound,true);
assert.equal(successor.runtimeBinding.tariV1PredecessorPreserved,true);
assert.equal(successor.runtimeBinding.cardIdentityOwnerUnchanged,'TAROT_STRUCTURAL_RUNTIME');
assert.equal(successor.runtimeBinding.visualObservationBound,true);
assert.equal(successor.runtimeBinding.waiteSourceLocatorBound,true);
assert.equal(successor.runtimeBinding.perspectiveAvailabilityV2Bound,true);
assert.equal(successor.runtimeBinding.reflectiveLensBound,true);
assert.equal(successor.runtimeBinding.privateReferenceRuntimeUse,false);
assert.equal(successor.runtimeBinding.webDiscoveryRuntimeUse,false);
assert.equal(successor.runtimeBinding.sourceVotingAllowed,false);
assert.equal(successor.runtimeBinding.universalMeaningAuthorityCreated,false);
for(const [k,v] of Object.entries(successor.productionBoundary)) assert.equal(v,false,`${k} must remain false`);

const deathProjections=await projectOne('RWS-MAJOR-13','TPAF-DEATH');
const deathBinding=bindTarotCorpusProjections(deathProjections,authorities);
assert.equal(deathBinding.schemaVersion,'PHI-OS-TAROT-CORPUS-BOUND-INTERPRETATION-v2.0.0');
assert.equal(deathBinding.cards.length,1); assert.equal(deathBinding.productionEligible,false); assert.equal(deathBinding.aiUsed,false); assert.equal(deathBinding.providerUsed,false);
const death=deathBinding.cards[0];
assert.equal(death.structuralCard.cardId,'RWS-MAJOR-13'); assert.equal(death.visualObservation.cardId,'RWS-MAJOR-13'); assert.equal(death.visualObservation.meaningAttached,false); assert.equal(death.visualObservation.interpretationAllowedInThisRecord,false);
const dAuthor=death.sourcePerspectives.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC'); const dRef=death.sourcePerspectives.find(x=>x.perspectiveClass==='REFLECTIVE'); const dPsy=death.sourcePerspectives.find(x=>x.perspectiveClass==='PSYCHOLOGICAL'); const dTrad=death.sourcePerspectives.find(x=>x.perspectiveClass==='TRADITIONAL');
assert.equal(dAuthor.sourceId,'TAR-SRC-WAITE-PKT-1910'); assert.equal(dAuthor.sourceUnits.length,2); assert.equal(dAuthor.editorialClaims.length,0); assert.equal(dAuthor.availability,'SOURCE_LOCATOR_AVAILABLE_EDITORIAL_PARAPHRASE_NOT_INGESTED');
assert.equal(dRef.availability,'AVAILABLE'); assert.equal(dRef.inquiryUnits.length,16); assert.ok(dRef.inquiryUnits.every(x=>x.cardSpecificMeaning===false&&x.mayDiagnose===false&&x.mayPredict===false));
assert.equal(dPsy.availability,'AVAILABLE'); assert.equal(dPsy.clinicalAuthority,false); assert.equal(dPsy.hiddenStateAuthority,false); assert.equal(dPsy.inquiryUnits.length,14);
assert.equal(dTrad.availability,'NOT_INGESTED'); assert.equal(dTrad.modelMayFill,false);
assert.equal(death.comparison.sourceVoting,false); assert.equal(death.comparison.universalSynthesis,false);
assert.equal(JSON.stringify(deathBinding).includes('TAR-SRC-PRIV-LUA'),false); assert.equal(JSON.stringify(deathBinding).includes('WEB_DISCOVERY'),false);
const foolBinding=bindTarotCorpusProjections(await projectOne('RWS-MAJOR-00','TPAF-FOOL'),authorities);
assert.equal(foolBinding.cards[0].sourcePerspectives.find(x=>x.perspectiveClass==='AUTHOR_SPECIFIC').editorialClaims.length,1);

// W22 — one governed IR for one-card and three-card readings.
assert.equal(schema.$id,'PHI-OS-TAROT-READING-IR-v1.0.0');
for(const k of ['drawEvidence','cardObservations','sourcePerspectives','comparison','reflectiveComposition','rcc','uncertainty','agency','compositionEvidence']) assert.ok(schema.required.includes(k),`reading IR missing required ${k}`);
const boundaryVersions=Object.freeze({rcc:rccContract.contractVersion,agency:agencyContract.contractVersion,uncertainty:uncertaintyContract.contractVersion,compositionEvidence:compContract.contractVersion});
const compositionEvidence=Object.freeze({generatedAt:'2026-08-24T09:00:00.000Z',authorityDigests:{corpusFreezeSha256:sha256(P.freeze)},boundaryContractVersions:boundaryVersions});
const oneIR=createTarotReadingIR({question:'What deserves my attention in this situation?',contextDisclosure:{currentRealityContextUsed:false,contextUseWasExplicit:true},projections:deathProjections,authorities,realityEvidence:{},compositionEvidence});
assert.equal(oneIR.schemaVersion,TAROT_READING_IR_SCHEMA); assert.equal(oneIR.readingIrVersion,TAROT_READING_IR_VERSION); assert.equal(oneIR.drawEvidence.cards.length,1); assert.equal(oneIR.cardObservations.length,1); assert.equal(oneIR.sourcePerspectives.length,1); assert.equal(oneIR.productionEligible,false); assert.equal(oneIR.aiUsed,false); assert.equal(oneIR.providerUsed,false);
assert.equal(oneIR.reflectiveComposition.questions[0].focusId,'ATTENTION'); assert.equal(oneIR.reflectiveComposition.questions[0].selectionUsesCardMeaning,undefined); assert.equal(oneIR.reflectiveComposition.questions[0].cardSpecificMeaning,false); assert.equal(oneIR.reflectiveComposition.selectionUsesCardMeaning,false);
const threeProj=await projectThree(['RWS-MAJOR-00','RWS-MAJOR-13','RWS-WANDS-ACE'],'TPAF-THREE');
const realityEvidence={
 supportingEvidence:[{evidenceId:'REAL-1',statement:'A project deadline is documented for this week.',source:'CURRENT_REALITY'}],
 contradictoryEvidence:[{evidenceId:'REAL-2',statement:'The available budget does not support the most ambitious option.',source:'CURRENT_REALITY'}],
 observation:[{evidenceId:'REAL-3',statement:'Two options remain open and neither has been selected.',source:'CURRENT_REALITY'}],
 unknown:[{evidenceId:'REAL-4',statement:'The other stakeholder has not confirmed availability.',source:'CURRENT_REALITY'}]
};
const threeIR=createTarotReadingIR({question:'What should I examine before choosing a direction?',contextDisclosure:{currentRealityContextUsed:true,currentRealityContextLabel:'Current Reality case R-001',contextUseWasExplicit:true},projections:threeProj,authorities,realityEvidence,compositionEvidence});
assert.equal(threeIR.drawEvidence.cards.length,3); assert.deepEqual(threeIR.reflectiveComposition.questions.map(x=>x.focusId),['ATTENTION','TENSION','NEXT_OBSERVATION']);
assert.equal(threeIR.contextDisclosure.currentRealityContextUsed,true); assert.equal(threeIR.contextDisclosure.contextUseWasExplicit,true); assert.equal(threeIR.contextDisclosure.silentPrivateContextConsumption,false);

// W23 — RCC is mandatory and card/source/reflection cannot masquerade as real-world evidence.
assert.equal(rccContract.baselineCommit,BASE); assert.equal(rccContract.status,'FROZEN_MANDATORY_REALITY_COMPARISON_LAYER'); assert.deepEqual(rccContract.requiredFields,['supportingEvidence','contradictoryEvidence','unknown','observation']);
assert.equal(rccContract.rules.rccRequiredForEveryReading,true); assert.equal(rccContract.rules.tarotCardIsRealityEvidence,false); assert.equal(rccContract.rules.sourceClaimIsRealityEvidence,false); assert.equal(rccContract.rules.reflectiveQuestionIsRealityEvidence,false); assert.equal(rccContract.rules.rccMayBeOmitted,false);
assert.equal(oneIR.rcc.required,true); assert.equal(oneIR.rcc.unknown.length,1); assert.equal(oneIR.rcc.unknown[0].source,'SYSTEM_BOUNDARY_NOTICE');
assert.equal(threeIR.rcc.supportingEvidence.length,1); assert.equal(threeIR.rcc.contradictoryEvidence.length,1); assert.equal(threeIR.rcc.observation.length,1); assert.equal(threeIR.rcc.unknown.length,1); assert.equal(threeIR.rcc.rules.tarotCardIsEvidence,false); assert.equal(threeIR.rcc.rules.sourceClaimIsRealityEvidence,false);

// W24 — agency remains with the user; no symbolic layer may compel a decision.
assert.equal(agencyContract.baselineCommit,BASE); assert.equal(agencyContract.status,'FROZEN_USER_DECISION_AUTHORITY'); assert.equal(agencyContract.decisionAuthority,'USER');
for(const k of ['tarotMayDecide','cardMayCompelAction','sourceMayCompelAction','systemMayCompelAction','professionalDirectiveAuthority','hiddenStateAuthority','futureOutcomeAuthority','diagnosticAuthority']) assert.equal(agencyContract.rules[k],false,`${k} must be false`);
assert.equal(agencyContract.rules.userDecisionRemainsYours,true); assert.equal(threeIR.agency.decisionAuthority,'USER'); assert.equal(threeIR.agency.tarotMayDecide,false); assert.equal(threeIR.agency.userDecisionRemainsYours,true);

// W25 — uncertainty survives missing commentary, contradictory reality evidence, and lack of evidence.
assert.equal(uncertaintyContract.baselineCommit,BASE); assert.deepEqual(uncertaintyContract.allowedStates,['UNKNOWN','UNRESOLVED','CONTRADICTORY','NOT_SUPPORTED_BY_REALITY','SOURCE_DISAGREEMENT']);
assert.equal(uncertaintyContract.rules.modelMayEraseUncertainty,false); assert.equal(uncertaintyContract.rules.forcedConclusionRequired,false);
assert.ok(oneIR.uncertainty.states.some(x=>x.status==='UNKNOWN')); assert.ok(oneIR.uncertainty.states.some(x=>x.status==='UNRESOLVED'));
assert.ok(threeIR.uncertainty.states.some(x=>x.status==='CONTRADICTORY')); assert.ok(threeIR.uncertainty.states.some(x=>x.status==='UNKNOWN')); assert.ok(threeIR.uncertainty.states.some(x=>x.status==='UNRESOLVED'));
const notSupportedIR=createTarotReadingIR({question:'What deserves attention?',projections:deathProjections,authorities,realityEvidence:{notSupportedByReality:true},compositionEvidence});
assert.ok(notSupportedIR.uncertainty.states.some(x=>x.status==='NOT_SUPPORTED_BY_REALITY'));
const disagreementIR=createTarotReadingIR({question:'What deserves attention?',projections:deathProjections,authorities,realityEvidence:{sourceDisagreement:true},compositionEvidence});
assert.ok(disagreementIR.uncertainty.states.some(x=>x.status==='SOURCE_DISAGREEMENT'));

// W26 — provenance is complete and semantic boundaries are deterministic for the same evidence.
assert.equal(compContract.baselineCommit,BASE); assert.equal(compContract.status,'FROZEN_COMPOSITION_PROVENANCE_REQUIREMENTS');
assert.equal(compContract.rules.drawEvidenceMustBeReplayable,true); assert.equal(compContract.rules.sameEvidenceMustUseSameAllowedSemanticBoundaries,true); assert.equal(compContract.rules.sameEvidenceMustRequireSameRccAndAgencyLayers,true); assert.equal(compContract.rules.byteIdenticalProseRequired,false);
assert.equal(threeIR.compositionEvidence.corpusFreezeSha256,sha256(P.freeze)); assert.equal(threeIR.compositionEvidence.sourceRegistryVersion,'2.0.0'); assert.equal(threeIR.compositionEvidence.perspectiveRegistryVersion,'2.0.0'); assert.equal(threeIR.compositionEvidence.drawEvidenceId,threeIR.drawEvidence.drawEvidenceId); assert.deepEqual(threeIR.compositionEvidence.sourceIds,['TAR-SRC-WAITE-PKT-1910']); assert.equal(threeIR.compositionEvidence.provider.used,false); assert.equal(threeIR.compositionEvidence.modelCalculationAllowed,false); assert.equal(threeIR.compositionEvidence.modelMayMutateEvidence,false);
const threeIRReplay=createTarotReadingIR({question:'What should I examine before choosing a direction?',contextDisclosure:{currentRealityContextUsed:true,currentRealityContextLabel:'Current Reality case R-001',contextUseWasExplicit:true},projections:threeProj,authorities,realityEvidence,compositionEvidence});
assert.deepEqual(threeIRReplay,threeIR);

// Acceptance + production closure.
assert.equal(acceptance.baselineCommit,BASE); assert.equal(acceptance.status,'ACCEPTED_TARI_SUCCESSOR_READING_IR_RCC_AGENCY_UNCERTAINTY_COMPOSITION_EVIDENCE_PRODUCT_STILL_CLOSED');
for(const [k,v] of Object.entries(acceptance.accepted)) assert.equal(v,true,`${k} not accepted`);
for(const [name,item] of Object.entries(acceptance.artifacts)){exists(item.path);assert.equal(item.sha256,sha256(item.path),`acceptance drift ${name}`);}
const pcm=readJson(P.pcm), tarPcm=pcm.capabilities.find(x=>x.methodRuntime?.methodCode==='TAROT'); assert.ok(tarPcm); assert.equal(tarPcm.userExecutable,false); assert.equal(tarPcm.productionAccepted,false);
const catalog=readJson(P.publicCatalog), tarPublic=catalog.methods.find(x=>x.methodCode==='TAROT'); assert.ok(tarPublic); assert.equal(tarPublic.runAllowed,false);
assert.equal(acceptance.productionBoundary.publicRunAllowedChanged,false); assert.equal(acceptance.productionBoundary.productionCapabilityPromoted,false); assert.equal(acceptance.productionBoundary.productSurfaceActivated,false);

console.log('✓ TPA-W21 TARI corpus binding successor passed: frozen TAR-CARD + TAR-VIS + TAR-SRC + perspective v2 + reflective lens are bound without a second identity or universal meaning authority.');
console.log('✓ TPA-W22 Tarot Reading IR passed: one-card and three-card readings assemble through one deterministic structured IR.');
console.log('✓ TPA-W23 RCC mandatory layer passed: supporting / contradictory / unknown / observation remain explicit and Tarot is never promoted to reality evidence.');
console.log('✓ TPA-W24 AGENCY contract passed: decision authority remains USER and symbolic/source layers cannot compel action.');
console.log('✓ TPA-W25 Uncertainty contract passed: UNKNOWN / UNRESOLVED / CONTRADICTORY / NOT_SUPPORTED_BY_REALITY / SOURCE_DISAGREEMENT remain representable and non-erasable.');
console.log('✓ TPA-W26 Composition Evidence passed: authority versions, source ids, draw evidence and provider/model boundaries are retained; same evidence produces the same structured IR.');
console.log(`  corpus freeze sha256=${sha256(P.freeze)}`);
