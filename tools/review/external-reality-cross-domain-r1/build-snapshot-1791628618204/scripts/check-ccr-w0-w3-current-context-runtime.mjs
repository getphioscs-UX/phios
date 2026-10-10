import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {routeLensQuestion} from '../functions/lens-router/lens-router-runtime.js';
import {buildCurrentContextSnapshot,CCR_SNAPSHOT_SCHEMA,_test as ccrTest} from '../functions/current-context/current-context-runtime.js';

const root=process.cwd();
const j=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const target=Object.freeze({targetDate:'2026-08-24',targetTime:'10:00:00',targetTimezone:Object.freeze({iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'})});
const target2=Object.freeze({targetDate:'2026-08-25',targetTime:'10:00:00',targetTimezone:Object.freeze({iana:'Asia/Kuala_Lumpur',utcOffsetAtTarget:'+08:00'})});
const safeBoundaries=Object.freeze({eventPredictionCreated:false,fortunePredictionCreated:false,goodBadScoreCreated:false,professionalJudgmentCreated:false,methodVotingCreated:false});
function astTransit(){return {schemaVersion:'PHI-OS-AST-TRANSIT-READING-IR-v1.0.0',readingCode:'ASTTR-FIXTURE',sourceProjectionId:'ASTTP-FIXTURE',executionCompleteness:'COMPLETE',sections:{currentActivation:{targetContext:target,transits:[]},activatedNatalDomains:[],transitRelations:[],unknownAndLimitations:{limitations:[]},provenance:{}},boundaries:{...safeBoundaries,natalRecalculated:false}};}
function bzrTemporal(){return {schemaVersion:'PHI-OS-BZR-TEMPORAL-READING-IR-v1.0.0',capabilityCode:'BZR_TEMPORAL',sourceProjectionId:'BZTP-FIXTURE',executionCompleteness:'COMPLETE',sections:{currentLongCycle:{state:'ACTIVE'},currentAnnualContext:{annualPillar:{stemCode:'BING',branchCode:'WU'},targetContext:target},natalRelations:{relations:[]},structuralChanges:{meaningStatements:[]},unknownAndLimitations:{unknown:[],limitations:[]},provenance:{}},boundaries:{...safeBoundaries,natalRecalculated:false}};}
function zwrDynamic(){return {schemaVersion:'PHI-OS-ZI-WEI-DYNAMIC-DOMAIN-READING-IR-v1.0.0',capabilityCode:'ZI_WEI_DYNAMIC_DOMAIN',sourceProjectionId:'ZWDP-FIXTURE',executionCompleteness:'COMPLETE',sections:{longPeriodDomain:{state:'ACTIVE'},annualDomain:{lunarYear:2026},domainOverlays:{items:[]},transformationSignals:{items:[]},unknownAndLimitations:{unknown:[],limitations:[]},provenance:{}},boundaries:{...safeBoundaries,natalRecalculated:false}};}
function numReading(){return {schemaVersion:'PHI-OS-NUM-RUNTIME-READING-IR-v1.0.0',capabilityVersion:'1.0.0',methodCode:'NUMEROLOGY',sourceProjectionId:'NUMP-FIXTURE',executionCompleteness:'COMPLETE',sections:{calculatedStructure:{values:[],cycles:[]},canonicalMeaning:{statements:[]},unknownAndLimitations:{unknowns:[],limitations:[]},provenance:{}},boundaries:{fortunePredictionCreated:false,professionalJudgmentCreated:false,recalculated:false,meaningInvented:false,identityFactCreated:false,methodVotingCreated:false}};}
function hdrReading(){return {schemaVersion:'PHI-OS-INTERNAL-OPERATING-READING-IR-v1.0.0',runtimeCode:'PHI_OS_INTERNAL_OPERATING_LENS_RUNTIME',visibility:'INTERNAL_ONLY',sourceProjectionDigest:'HDRP-FIXTURE',readingDigest:'HDRR-FIXTURE',sections:{operatingMode:{code:'MULTI_STAGE_RESPONSE_SYSTEM'},engagementProtocol:{code:'RESPONSE_LED_WITH_ITERATIVE_ADJUSTMENT'},decisionProcess:{code:'CLARITY_OVER_TIME'}},guidanceBoundary:{realityEvidenceRemainsFinalAuthority:true},boundaries:{automaticInterpretationCreated:false,professionalJudgmentCreated:false,fatePredictionCreated:false,eventPredictionCreated:false,diagnosisCreated:false,goodBadScoreCreated:false,methodVotingCreated:false,publicResultCreated:false}};}
function evidence(id='EV-1'){return {evidenceId:id,statement:'A real-world change has been observed and is supplied explicitly for comparison.',sourceType:'USER_REPORTED',verificationState:'USER_REPORTED',observedAt:'2026-08-24'};}
function key(x){return `${x.candidate.pluginCode}${x.candidate.subCapability?'.'+x.candidate.subCapability:''}`;}
function lensInputFor(candidate,reading,targetContext=null){return {role:candidate.role,lensCode:candidate.lensCode,pluginCode:candidate.pluginCode,subCapability:candidate.subCapability??null,readingIr:reading,targetContext};}

const snapshotContract=j('content/governance/current-context/contracts/current-context-snapshot-contract-v1.json');
assert.equal(snapshotContract.status,'FROZEN_V1');
assert.equal(snapshotContract.rules.snapshotDoesNotExecuteMethodRuntime,true);
assert.equal(snapshotContract.contextTargetRules.serverNowInferenceAllowed,false);
assert.equal(snapshotContract.contextTargetRules.browserTimezoneInferenceAllowed,false);
const isolation=j('content/governance/current-context/contracts/lens-isolation-contract-v1.json');
assert.equal(isolation.invariants.onlyRoutedLensInputsAllowed,true);
assert.equal(isolation.invariants.sourceReadingMutationForbidden,true);
assert.equal(isolation.invariants.crossLensCanonicalMeaningCreationForbidden,true);
const alignment=j('content/governance/current-context/contracts/observed-alignment-contract-v1.json');
assert.equal(alignment.semanticAlignment.statusInV1,'NOT_EVALUATED');
assert.equal(alignment.semanticAlignment.truthConfidenceCreationAllowed,false);
assert.equal(alignment.semanticAlignment.majorityOrWeightedAgreementAllowed,false);
const evidenceContract=j('content/governance/current-context/contracts/reality-evidence-comparison-contract-v1.json');
assert.equal(evidenceContract.rules.runtimeMayNotInventEvidence,true);
assert.equal(evidenceContract.rules.runtimeMayNotAutoInferSupportOrContradiction,true);
assert.equal(evidenceContract.rules.realityEvidenceRemainsFinalAuthority,true);
const sourceRegistry=j('content/governance/current-context/registries/current-context-source-adapter-registry-v1.json');
assert.equal(sourceRegistry.status,'CURRENT_V1');
for(const rec of sourceRegistry.records){const adapter=ccrTest.SOURCE_ADAPTERS[rec.routeKey];assert.ok(adapter,`Missing runtime adapter: ${rec.routeKey}`);assert.equal(adapter.schema,rec.readingSchema,`${rec.routeKey} schema drift`);assert.equal(adapter.lensCode,rec.lensCode,`${rec.routeKey} lens drift`);}
const fixtureCorpus=j('content/governance/current-context/fixtures/current-context-fixtures-v1.json');
assert.equal(fixtureCorpus.fixtures.length,8);
assert.equal(fixtureCorpus.fixtures[0].expectedPrimary,'AST.CURRENT_DYNAMIC');
assert.equal(fixtureCorpus.fixtures[1].expectedPrimary,'BZR.TEMPORAL');
assert.equal(fixtureCorpus.fixtures[2].expectedPrimary,'NUM');

// CURRENT + DOMAIN: AST current primary, Zi Wei dynamic supporting.
const currentRoute=routeLensQuestion({question:'现在事业什么动力正在被激活？',publicRequest:true});
assert.equal(currentRoute.classification.taxonomy,'CURRENT');
assert.equal(key(currentRoute.primary),'AST.CURRENT_DYNAMIC');
assert.deepEqual(currentRoute.supporting.map(key),['ZWR.DYNAMIC_DOMAIN']);
const currentInputs=[lensInputFor(currentRoute.primary.candidate,astTransit(),target),lensInputFor(currentRoute.supporting[0].candidate,zwrDynamic(),target)];
const beforeCurrent=JSON.stringify(currentInputs);
const currentSnapshot=await buildCurrentContextSnapshot({routePlan:currentRoute,contextTarget:target,lensInputs:currentInputs,realityEvidence:[evidence()]});
const currentSnapshot2=await buildCurrentContextSnapshot({routePlan:currentRoute,contextTarget:target,lensInputs:currentInputs,realityEvidence:[evidence()]});
assert.equal(currentSnapshot.schemaVersion,CCR_SNAPSHOT_SCHEMA);
assert.equal(currentSnapshot.executionCompleteness,'COMPLETE');
assert.equal(currentSnapshot.snapshotId,currentSnapshot2.snapshotId);
assert.equal(JSON.stringify(currentInputs),beforeCurrent,'CCR mutated source readings');
assert.equal(currentSnapshot.observedAlignment.coPresence,true);
assert.equal(currentSnapshot.observedAlignment.sharedTargetDate,true);
assert.equal(currentSnapshot.observedAlignment.semanticAlignmentStatus,'NOT_EVALUATED');
assert.equal(currentSnapshot.observedAlignment.truthConfidenceCreated,false);
assert.equal(currentSnapshot.boundaries.methodVotingCreated,false);
assert.equal(currentSnapshot.boundaries.crossMethodCanonicalMeaningCreated,false);
assert.equal(currentSnapshot.boundaries.methodRuntimeExecuted,false);
assert.equal(currentSnapshot.realityEvidenceComparison.automaticSupportOrContradictionInference,false);

// TIME + DOMAIN: BZR temporal primary, Zi Wei dynamic supporting.
const timeRoute=routeLensQuestion({question:'今年事业环境如何？',publicRequest:true});
assert.equal(key(timeRoute.primary),'BZR.TEMPORAL');
assert.deepEqual(timeRoute.supporting.map(key),['ZWR.DYNAMIC_DOMAIN']);
const timeSnapshot=await buildCurrentContextSnapshot({routePlan:timeRoute,contextTarget:target,lensInputs:[lensInputFor(timeRoute.primary.candidate,bzrTemporal(),target),lensInputFor(timeRoute.supporting[0].candidate,zwrDynamic(),target)]});
assert.equal(timeSnapshot.routeContext.taxonomy,'TIME');
assert.equal(timeSnapshot.lensContexts.length,2);
assert.equal(timeSnapshot.observedAlignment.semanticConvergenceCreated,false);

// RHYTHM + TIME: NUM primary, BZR contextual.
const rhythmRoute=routeLensQuestion({question:'今年是什么节奏？',publicRequest:true});
assert.equal(key(rhythmRoute.primary),'NUM');
assert.deepEqual(rhythmRoute.supporting.map(key),['BZR.TEMPORAL']);
const rhythmSnapshot=await buildCurrentContextSnapshot({routePlan:rhythmRoute,contextTarget:target,lensInputs:[lensInputFor(rhythmRoute.primary.candidate,numReading(),target),lensInputFor(rhythmRoute.supporting[0].candidate,bzrTemporal(),target)]});
assert.equal(rhythmSnapshot.executionCompleteness,'COMPLETE');
assert.equal(rhythmSnapshot.lensContexts[0].lensCode,'RHYTHM');

// Internal DECISION may consume HDR but Reality Evidence is mandatory.
const decisionRoute=routeLensQuestion({question:'我应该接受这个工作吗？',publicRequest:false,internalAccessClass:'GOVERNED_INTERNAL_PROFESSIONAL'});
assert.equal(decisionRoute.routeState,'ROUTABLE_INTERNAL_ONLY');
await assert.rejects(()=>buildCurrentContextSnapshot({routePlan:decisionRoute,lensInputs:[lensInputFor(decisionRoute.primary.candidate,hdrReading())]}),e=>e?.code==='CCR_REALITY_EVIDENCE_REQUIRED_FOR_ROUTE');
const decisionSnapshot=await buildCurrentContextSnapshot({routePlan:decisionRoute,lensInputs:[lensInputFor(decisionRoute.primary.candidate,hdrReading())],realityEvidence:[evidence('EV-DECISION')]});
assert.equal(decisionSnapshot.lensContexts[0].lensCode,'OPERATION');
assert.equal(decisionSnapshot.realityEvidenceComparison.realityEvidenceFinalAuthority,true);

// Public DECISION remains blocked and CCR cannot bypass LRR.
const publicDecision=routeLensQuestion({question:'我应该接受这个工作吗？',publicRequest:true});
assert.equal(publicDecision.routeState,'BLOCKED_CAPABILITY');
await assert.rejects(()=>buildCurrentContextSnapshot({routePlan:publicDecision,realityEvidence:[evidence()]}),e=>e?.code==='CCR_ROUTE_PLAN_NOT_COMPOSABLE');

// REALITY_FACT can create evidence-only context and never invokes a symbolic lens.
const factRoute=routeLensQuestion({question:'现行法律是什么？',publicRequest:true});
assert.equal(factRoute.routeState,'REALITY_EVIDENCE_ONLY');
const factSnapshot=await buildCurrentContextSnapshot({routePlan:factRoute,realityEvidence:[{...evidence('EV-FACT'),sourceType:'VERIFIED_EXTERNAL',verificationState:'VERIFIED',sourceRef:'EXTERNAL-FACT-REF'}]});
assert.equal(factSnapshot.lensContexts.length,0);
assert.equal(factSnapshot.realityEvidenceComparison.status,'EVIDENCE_PRESENT_UNBOUND');
assert.equal(factSnapshot.boundaries.realityEvidenceInvented,false);

// No target-sensitive reading may drift away from explicit context target.
const badAst=astTransit();badAst.sections.currentActivation.targetContext=target2;
await assert.rejects(()=>buildCurrentContextSnapshot({routePlan:currentRoute,contextTarget:target,lensInputs:[lensInputFor(currentRoute.primary.candidate,badAst,target2)]}),e=>e?.code==='CCR_CONTEXT_TARGET_MISMATCH');

// Unrouted lens injection fails closed.
await assert.rejects(()=>buildCurrentContextSnapshot({routePlan:currentRoute,contextTarget:target,lensInputs:[...currentInputs,{role:'SUPPORTING',lensCode:'RHYTHM',pluginCode:'NUM',subCapability:null,readingIr:numReading(),targetContext:target}]}),e=>e?.code==='CCR_UNROUTED_LENS_INPUT');

// Explicit evidence binding is preserved but never auto-inferred.
const oneContext=await buildCurrentContextSnapshot({routePlan:currentRoute,contextTarget:target,lensInputs:[lensInputFor(currentRoute.primary.candidate,astTransit(),target)],realityEvidence:[evidence('EV-BIND')]});
const contextRef=oneContext.lensContexts[0].contextRef;
const bound=await buildCurrentContextSnapshot({routePlan:currentRoute,contextTarget:target,lensInputs:[lensInputFor(currentRoute.primary.candidate,astTransit(),target)],realityEvidence:[evidence('EV-BIND')],evidenceBindings:[{evidenceId:'EV-BIND',contextRef,relation:'CONTEXT_ONLY',assertedBy:'USER'}]});
assert.equal(bound.evidenceBindings[0].automaticInference,false);
assert.equal(bound.realityEvidenceComparison.status,'EXPLICIT_BINDINGS_PRESENT');
await assert.rejects(()=>buildCurrentContextSnapshot({routePlan:currentRoute,contextTarget:target,lensInputs:[lensInputFor(currentRoute.primary.candidate,astTransit(),target)],realityEvidence:[evidence('EV-X')],evidenceBindings:[{evidenceId:'EV-X',contextRef,relation:'SUPPORTS_OBSERVATION',assertedBy:'SYSTEM'}]}),e=>e?.code==='CCR_EVIDENCE_BINDING_ATTRIBUTION_INVALID');

const current6=j('content/governance/multi-lens/successors/multi-lens-current-successor-v6.json');
const current7=j('content/governance/multi-lens/successors/multi-lens-current-successor-v7.json');
assert.equal(current7.predecessor,'content/governance/multi-lens/successors/multi-lens-current-successor-v6.json');
assert.equal(current7.currentLensRegistry,current6.currentLensRegistry);
assert.equal(current7.currentCapabilityRegistry,current6.currentCapabilityRegistry);
assert.equal(current7.roleChanges,false);
assert.equal(current7.capabilityChanges,false);
assert.equal(current7.contextCompositionActivated,true);
assert.equal(current7.runtimeExecutionOrchestrationActivated,false);
assert.equal(current7.askPhiOsIntegrationActivated,false);
assert.equal(current7.relationalRuntimeActivated,false);
const acceptance=j('content/governance/current-context/acceptance/ccr-w0-w3-current-context-runtime-acceptance-v1.json');
assert.equal(acceptance.status,'ACCEPTED');
assert.equal(acceptance.accepted.noRuntimeExecutionOrchestrationActivated,true);
assert.equal(acceptance.accepted.noFrontendRouteCreated,true);
const freeze=j('content/governance/current-context/freeze/current-context-runtime-freeze-v1.json');
assert.equal(freeze.status,'FROZEN_V1');
assert.ok(freeze.invariants.includes('CCR_DOES_NOT_SEMANTICALLY_SCORE_ALIGNMENT'));
assert.ok(freeze.invariants.includes('REALITY_EVIDENCE_REMAINS_FINAL_AUTHORITY'));

console.log('✓ CCR-W0–W3 Current Context Runtime passed: LRR-routed accepted readings compose deterministically; lenses stay isolated; alignment is contextual-only; Reality Evidence remains final authority; no method execution, voting, semantic convergence or Ask orchestration is created.');
