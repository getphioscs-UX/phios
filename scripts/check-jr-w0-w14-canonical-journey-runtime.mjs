import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_JOURNEY_STAGES, normalizeJourneyStage, buildJourneyContext, assertCanonicalJourney,
  evaluateJourneySafety, resolveJourneyPriority, buildBoundedReadingPath, deriveJourneyProgress,
  buildProfessionalHandoffPackage, buildJourneyRecommendation, prepareRneRequest, buildLrmEventIntents
} from './lib/journey-runtime/jr-v2.mjs';
import { buildReadoutInput, extractObservableRuntime, buildRuntimeSignature, buildPatternRuntime } from './lib/reality-readout-engine/rre-readout-foundation-v1.mjs';
import { buildConstraintReading, buildLoadReading, buildStabilityReading, buildDriftReading, buildRecoveryReading, buildUnknownResolutionLimit } from './lib/reality-readout-engine/rre-readout-reading-v1.mjs';

const root=process.cwd(); const base='content/runtime/journey-runtime'; const requested=process.argv[2] ?? 'ALL';
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'); const readJson=file=>JSON.parse(read(file)); const exists=file=>fs.existsSync(path.join(root,file));
const hash=file=>crypto.createHash('sha256').update(read(file),'utf8').digest('hex');
const run=(code,fn)=>{ if(requested==='ALL'||requested===code){ fn(); console.log(`✓ ${code} passed.`); } };
const throws=(fn,contains)=>{ let e; try{fn();}catch(err){e=err;} assert.ok(e,`Expected ${contains}`); assert.ok(String(e.message).includes(contains),`Expected ${contains}; got ${e?.message}`); };

const stageRegistry=readJson(`${base}/registries/canonical-journey-stage-registry-v2.json`);
const compatRegistry=readJson(`${base}/registries/journey-stage-compatibility-registry-v1.json`);
const purposes=readJson('content/governance/reality-data-governance/registries/canonical-data-purpose-registry-v1.json');
const persistence=readJson('content/governance/reality-data-governance/registries/canonical-persistence-class-registry-v1.json');
const consents=readJson('content/governance/reality-data-governance/registries/canonical-consent-class-registry-v1.json');

run('JR-W0',()=>{
  const audit=readJson(`${base}/audits/jr-w0-authority-reconciliation-v2.json`); assert.equal(audit.baselineCommit,'3dd903344945ecd3b585c8aafe48b93d7894caa9'); assert.equal(audit.status,'RECONCILED_SINGLE_JOURNEY_SUCCESSOR_NO_SECOND_RUNTIME');
  for(const x of audit.legacyJourneyAuthorities){ assert.ok(exists(x.reference)); assert.equal(hash(x.reference),x.sha256,`JR_LEGACY_AUTHORITY_DRIFT:${x.reference}`); }
  for(const x of audit.upstreamAuthorities){ assert.ok(exists(x.reference)); assert.equal(hash(x.reference),x.sha256,`JR_UPSTREAM_AUTHORITY_DRIFT:${x.reference}`); }
  assert.equal(audit.reconciliationDecisions.secondJourneyRuntimeCreated,false); assert.equal(audit.reconciliationDecisions.legacyRuntimeContractsPreserved,true); assert.equal(audit.reconciliationDecisions.rmoRealityAuthorityPreserved,true); assert.equal(audit.reconciliationDecisions.rreReadoutAuthorityPreserved,true); assert.equal(audit.reconciliationDecisions.rdgDataAuthorityPreserved,true);
  const master=readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json'); const works=master.entries.filter(x=>x.runtimeCode==='JR'); assert.deepEqual(works.map(x=>x.workCode),Array.from({length:15},(_,i)=>`JR-W${i}`)); assert.ok(works.every(x=>x.status==='PLANNED'),'CMW frozen planned states must remain unchanged by JR execution package');
});

run('JR-W1',()=>{
  const contract=readJson(`${base}/contracts/canonical-journey-contract-v2.json`); assert.equal(contract.contractVersion,'2.0.0'); for(const f of ['realityReference','readoutReferences','consentReferences','dataPurpose']) assert.ok(contract.v2Fields.includes(f)); assert.equal(contract.authorityBoundary.journeyOwnsRealityTruth,false); assert.equal(contract.authorityBoundary.journeyOwnsProfessionalJudgment,false);
  const fixture=readJson(`${base}/fixtures/canonical-journey-v2.valid.json`); assert.equal(assertCanonicalJourney(fixture,stageRegistry,purposes),true); const bad=structuredClone(fixture); bad.context.readoutReferences=[{code:'INLINE'}]; throws(()=>assertCanonicalJourney(bad,stageRegistry,purposes),'REFERENCE_STRING_REQUIRED');
});

run('JR-W2',()=>{
  assert.deepEqual(stageRegistry.canonicalOrder,CANONICAL_JOURNEY_STAGES); assert.deepEqual(stageRegistry.canonicalOrder,['entry','orientation','reading','reconstruction','navigation','review','continuity','closed']); assert.equal(stageRegistry.rules.uiMayInventStage,false);
  const old=readJson('content/registry/m3c-public-journey.json'); for(const s of old.stages.map(x=>x.id)) assert.ok(compatRegistry.legacyM3cStageMappings[s]);
  for(const stage of ['enter','describe','discover','understand','choose','continue']) assert.ok(compatRegistry.legacyPdsShellMappings[stage]);
  assert.equal(normalizeJourneyStage('reading',compatRegistry),'reading'); assert.equal(normalizeJourneyStage('memory',compatRegistry,'LEGACY_M3C'),'continuity'); throws(()=>normalizeJourneyStage('invented',compatRegistry),'JR_STAGE_UNKNOWN');
});

run('JR-W3',()=>{
  const contract=readJson(`${base}/contracts/journey-context-contract-v2.json`); assert.equal(contract.rules.referenceOnly,true); const ctx=buildJourneyContext({canonicalRealityReferences:['REAL-1'],meaningReferences:['MEAN-1'],knowledgeReferences:['KN-1'],readoutReferences:['READ-1'],publishedAssetReferences:['ASSET-1'],previousStateReferences:['REAL-0']}); assert.equal(ctx.readoutReferences[0],'READ-1'); throws(()=>buildJourneyContext({readoutReferences:[{code:'COPY'}]}),'REFERENCE_STRING_REQUIRED'); throws(()=>buildJourneyContext({inlineReality:{}}),'JR_CONTEXT_INLINE_OR_UNKNOWN_FIELD');
});

run('JR-W4',()=>{
  const contract=readJson(`${base}/contracts/journey-priority-contract-v1.json`); assert.ok(contract.forbiddenOutputs.includes('professionalJudgment')); const ready=resolveJourneyPriority({currentStage:'reading',nextCandidateWorkflowStep:'RECONSTRUCT',supportReferences:['READ-1'],safetyState:evaluateJourneySafety({})}); assert.equal(ready.priorityState,'READY'); assert.equal(ready.realityTruthDecided,false); const blocked=resolveJourneyPriority({currentStage:'reading',supportReferences:['CONSENT-1'],safetyState:evaluateJourneySafety({missingRequiredConsent:true})}); assert.equal(blocked.priorityState,'BLOCKED'); assert.equal(blocked.nextRelevantWorkflowStep,'COLLECT_CONSENT');
});

run('JR-W5',()=>{
  const contract=readJson(`${base}/contracts/bounded-reading-path-contract-v1.json`); assert.equal(contract.rules.infiniteRecommendationForbidden,true); const publicPaths=readJson('content/knowledge/public/public-reading-paths.json'); const path=buildBoundedReadingPath(publicPaths.records[0]); assert.equal(path.bounded,true); assert.ok(path.nodeReferences.length<=7); const dynamic=readJson('content/knowledge/intelligence/reading/dynamic-reading-paths.json'); assert.ok(dynamic.paths.every(x=>x.publishedOnly===true)); const d=buildBoundedReadingPath(dynamic.paths.find(x=>x.purpose==='deep_reading'),{maxBlockReferences:3}); assert.equal(d.blockReferences.length,3); assert.equal(d.terminationReason,'AUTHORITY_PATH_TRUNCATED_TO_BOUND');
});

run('JR-W6',()=>{
  const contract=readJson(`${base}/contracts/journey-session-runtime-contract-v1.json`); assert.equal(contract.rules.sessionIsCanonicalPersistence,false); assert.equal(contract.rules.recoveryIsCanonicalPersistence,false); assert.ok(purposes.purposeCodes.includes('SERVICE_DELIVERY')); assert.ok(purposes.purposeCodes.includes('RUNTIME_CONTINUITY')); assert.ok(purposes.purposeCodes.includes('RUNTIME_RECOVERY')); for(const c of ['SESSION','RECOVERY','RUNTIME']) assert.ok(persistence.persistenceClasses.includes(c)); assert.ok(consents.consentClasses.includes('OPTIONAL_MEMORY_CONSENT'));
  const data=readJson('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json'); const jr=data.entries.find?.(x=>x.runtimeCode==='JR') ?? data.contracts?.find(x=>x.runtimeCode==='JR'); assert.ok(jr,'RDG JR data contract missing'); assert.ok(jr.allowedPersistenceClasses.includes('SESSION')); assert.ok(jr.allowedPersistenceClasses.includes('RECOVERY')); assert.ok(jr.allowedPersistenceClasses.includes('RUNTIME'));
});

run('JR-W7',()=>{
  const contract=readJson(`${base}/contracts/journey-progress-contract-v1.json`); assert.equal(contract.rules.pageVisitCountsAsCompletion,false); const events=['entry','orientation','reading','reconstruction','navigation','review'].map((stage,i)=>({stage,eventReference:`EV-${i+1}`,completed:true})); const p=deriveJourneyProgress({completionEvents:events,currentStage:'review'},compatRegistry); assert.deepEqual(p.completedStages,['entry','orientation','reading','reconstruction','navigation','review']); assert.equal(p.basedOnPageVisits,false); throws(()=>deriveJourneyProgress({completionEvents:[{stage:'entry',eventReference:'EV-X',completed:true,pageVisit:true}]},compatRegistry),'JR_PROGRESS_PAGE_VISIT_NOT_COMPLETION');
});

run('JR-W8',()=>{
  const contract=readJson(`${base}/contracts/journey-safety-boundary-contract-v1.json`); assert.equal(contract.rules.jrDoesNotDiagnoseEmergency,true); assert.equal(evaluateJourneySafety({}).state,'ALLOW'); assert.equal(evaluateJourneySafety({emergencySignal:true}).state,'ESCALATE'); assert.equal(evaluateJourneySafety({dataPurposeViolation:true}).state,'BLOCK'); assert.equal(evaluateJourneySafety({regulatedAdviceRequest:true}).nextWorkflowStep,'PROFESSIONAL_HANDOFF');
});

run('JR-W9',()=>{
  const contract=readJson(`${base}/contracts/professional-handoff-package-contract-v1.json`); assert.equal(contract.rules.handoffCreatesProfessionalResponsibility,false); const pws=readJson('docs/pws/architecture/pws-entry-professional-handoff-boundary-v1.json'); assert.equal(pws.acceptance.requiredGateCount,8); assert.equal(pws.entitlementSeparation.journeyEntitlementMayBeReusedAsProfessionalEntitlement,false);
  const handoff=buildProfessionalHandoffPackage({handoffId:'HANDOFF-1',journeyReference:'JR-1',realityReferences:['REAL-1'],readoutReferences:['READ-1'],evidenceReferences:['EVID-1'],unknownReferences:['UNK-1'],journeyContextReference:'JRCTX-1',customerQuestionReference:'Q-1',consentReferences:['CONSENT-PRO-1'],dataPurpose:'PROFESSIONAL_SERVICE'}); assert.equal(handoff.professionalResponsibilityCreated,false);
});

run('JR-W10',()=>{
  const contract=readJson(`${base}/contracts/journey-recommendation-contract-v1.json`); assert.equal(contract.rules.recommendationIsWorkflowStepOnly,true); const rec=buildJourneyRecommendation({recommendationCode:'JR-REC-1',nextWorkflowStep:'REVIEW',supportReferences:['NAV-1'],safetyState:evaluateJourneySafety({})}); assert.equal(rec.nextWorkflowStep,'REVIEW'); assert.equal(rec.financialDecisionCreated,false); throws(()=>buildJourneyRecommendation({recommendationCode:'BAD',nextWorkflowStep:'BUY_STOCK',supportReferences:['X']}),'JR_RECOMMENDATION_STEP_INVALID');
});

run('JR-W11',()=>{
  const contract=readJson(`${base}/contracts/rne-integration-contract-v1.json`); assert.equal(contract.separation.jr,'WORKFLOW_RUNTIME'); assert.equal(contract.separation.rne,'NAVIGATION_INTELLIGENCE'); assert.equal(contract.currentBaseline.executionActivated,false); const master=readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json'); assert.ok(master.entries.filter(x=>x.runtimeCode==='RNE').every(x=>x.status==='PLANNED')); const req=prepareRneRequest({journeyReference:'JR-1',realityReference:'REAL-1',readoutReferences:['READ-1'],constraintReferences:['CON-1'],unknownReferences:['UNK-1'],customerGoalReference:'GOAL-1',dataPurpose:'SERVICE_DELIVERY',consentReferences:['CONSENT-1']},{executionActivated:false}); assert.equal(req.executionState,'NOT_EXECUTED_RNE_UNAVAILABLE'); assert.equal(req.fabricatedResponse,false);
});

run('JR-W12',()=>{
  const contract=readJson(`${base}/contracts/lrm-integration-contract-v1.json`); assert.equal(contract.currentBaseline.executionActivated,false); assert.equal(contract.rules.jrOwnsLongitudinalTimeline,false); const master=readJson('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json'); assert.ok(master.entries.filter(x=>x.runtimeCode==='LRM').every(x=>x.status==='PLANNED'));
  const out=buildLrmEventIntents({journeyReference:'JR-1',dataPurpose:'RUNTIME_CONTINUITY',consentReferences:['CONSENT-1'],events:[{eventType:'JOURNEY_STARTED',stage:'entry',sourceReference:'EV-1',occurredAt:'2026-08-11T04:20:00Z'},{eventType:'JOURNEY_REVIEW_RECORDED',stage:'review',sourceReference:'EV-2',occurredAt:'2026-08-11T04:30:00Z'}]},{executorActivated:false}); assert.equal(out.deliveryState,'DEFERRED_LRM_EXECUTOR_NOT_ACTIVATED'); assert.equal(out.persistedByJr,false);
});

run('JR-W13',()=>{
  const slice=readJson(`${base}/fixtures/jr-w13-production-slice.valid.json`); assert.equal(slice.status,'EXECUTABLE_INTEGRATION_SLICE_VALIDATION_ONLY');
  const rbase='content/runtime/reality-readout-engine'; const inputContract=readJson(`${rbase}/contracts/reality-readout-input-contract-v1.json`); const dims=readJson(`${rbase}/registries/canonical-observable-dimension-registry-v1.json`); const roles=readJson(`${rbase}/registries/canonical-runtime-signature-role-registry-v1.json`); const patternsReg=readJson(`${rbase}/registries/canonical-pattern-runtime-registry-v1.json`);
  const input=buildReadoutInput(readJson(`${rbase}/fixtures/readout-input.request.valid.json`),inputContract); const extraction=extractObservableRuntime(input,readJson(`${rbase}/fixtures/observable-reality-view.valid.json`),dims); const signature=buildRuntimeSignature(extraction,readJson(`${rbase}/fixtures/runtime-signature.request.valid.json`),roles); const patterns=buildPatternRuntime(extraction,readJson(`${rbase}/fixtures/pattern-runtime.request.valid.json`),patternsReg);
  const constraint=buildConstraintReading(extraction,readJson(`${rbase}/fixtures/constraint-reading.request.valid.json`),readJson(`${rbase}/registries/canonical-constraint-reading-class-registry-v1.json`),readJson('content/runtime/reality-model-runtime/registries/canonical-constraint-type-registry-v1.json'));
  const load=buildLoadReading(extraction,patterns,readJson(`${rbase}/fixtures/load-reading.request.valid.json`),readJson(`${rbase}/registries/canonical-load-reading-state-registry-v1.json`));
  const stability=buildStabilityReading(extraction,signature,patterns,readJson(`${rbase}/fixtures/stability-reading.request.valid.json`),readJson(`${rbase}/registries/canonical-stability-reading-registry-v1.json`));
  const drift=buildDriftReading(input,readJson(`${rbase}/fixtures/rmo-reality-diff-view.valid.json`),readJson(`${rbase}/fixtures/drift-reading.request.valid.json`),readJson(`${rbase}/registries/canonical-drift-reading-registry-v1.json`));
  const recovery=buildRecoveryReading(extraction,patterns,constraint,readJson(`${rbase}/fixtures/recovery-reading.request.valid.json`),readJson(`${rbase}/registries/canonical-recovery-reading-registry-v1.json`));
  const unknown=buildUnknownResolutionLimit(input,readJson(`${rbase}/fixtures/rmo-unknown-views.valid.json`),readJson('content/runtime/reality-model-runtime/registries/canonical-unknown-kind-registry-v1.json'),readJson(`${rbase}/fixtures/unknown-resolution-limit.request.valid.json`),readJson(`${rbase}/registries/canonical-resolution-limit-registry-v1.json`));
  const readoutRefs=[constraint.readingCode,load.loadReadingCode,stability.stabilityReadingCode,drift.driftReadingCode,recovery.recoveryReadingCode,unknown.unknownReadingCode].filter(Boolean); assert.equal(readoutRefs.length,6,'JR-W13 must execute six existing RRE readout components');
  const ctx=buildJourneyContext({canonicalRealityReferences:['REALITY-FIXTURE-0001'],meaningReferences:[],knowledgeReferences:['LP-PREFACE-FOUNDATION'],readoutReferences:readoutRefs,publishedAssetReferences:[],previousStateReferences:['REALITY-FIXTURE-0000']}); assert.equal(ctx.readoutReferences.length,6);
  const events=slice.milestones.map(m=>({stage:m.stage,eventReference:m.eventReference,completed:true})); const progress=deriveJourneyProgress({completionEvents:events,currentStage:'review'},compatRegistry); assert.equal(progress.currentStage,'review'); assert.ok(progress.completedStages.includes('entry')); assert.ok(progress.completedStages.includes('navigation')); assert.ok(progress.completedStages.includes('review'));
  const rec=buildJourneyRecommendation({recommendationCode:'JR-W13-NEXT-0001',nextWorkflowStep:'CONTINUE',supportReferences:[progress.lastCompletionReference,...readoutRefs],safetyState:evaluateJourneySafety({})}); assert.equal(rec.nextWorkflowStep,'CONTINUE'); assert.equal(slice.nonProductionFacts.liveCustomerDataUsed,false); assert.equal(slice.nonProductionFacts.canonicalReadoutPersisted,false); assert.equal(slice.nonProductionFacts.rneExecuted,false); assert.equal(slice.nonProductionFacts.lrmEventPersisted,false);
});

run('JR-W14',()=>{
  const acceptance=readJson(`${base}/acceptance/jr-v2-full-acceptance-v1.json`); assert.deepEqual(acceptance.completedWorks,Array.from({length:15},(_,i)=>`JR-W${i}`)); assert.equal(acceptance.nonActivation.liveCustomerJourneyCreated,false); const freeze=readJson(`${base}/freeze/jr-v2-freeze-v1.json`); assert.equal(freeze.status,'JR-v2.0.0-FROZEN'); assert.equal(freeze.productionState,'VALIDATION_ONLY_INTEGRATION_RUNTIME'); assert.equal(freeze.wprHandoff.wprW20ReadOnlyProjectionEligible,true); assert.equal(freeze.wprHandoff.wprW21MethodExecutionEligibleByJr,false); for(const file of freeze.frozenOutputs) assert.ok(exists(file),`JR_FREEZE_OUTPUT_MISSING:${file}`);
  const pkg=readJson('package.json'); assert.equal(pkg.scripts['check:jr-w0-w14'],'node scripts/check-jr-w0-w14-canonical-journey-runtime.mjs'); assert.equal(pkg.scripts['check:jr'],'npm run check:jr-w0-w14'); assert.ok(!pkg.scripts.postcheck.includes('check:jr'),'JR must not silently expand postcheck during runtime freeze package');
});

if(requested==='ALL') console.log('✓ JR v2 W0-W14 Canonical Journey Runtime passed; legacy Journey authority preserved, RNE/LRM execution not fabricated, and WPR-W20 read-only workflow projection is eligible after freeze.');
