import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildCanonicalBaziChartIR} from '../functions/bzr-full-production/bazi-chart-runtime.js';
import {buildBaziDaYunStructuralIR} from '../functions/bzr-full-production/bazi-da-yun-runtime.js';
import {buildBaziLiuNianInteractionIR} from '../functions/bzr-full-production/bazi-liu-nian-interaction-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists=p=>fs.existsSync(p);
const current='c9f0970d7f3148924e85ee1735139558f0cad140';
const p={
 extracted:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v2.json',
 review:'content/interpretation/bazi/review/bzr-r1-claim-batch-002-human-review-result-v1.json',
 admitted:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v2.1.json',
 admission:'content/interpretation/bazi/admission/bzr-r1-claim-batch-002-admission-v1.json',
 sourceRegistry:'content/interpretation/bazi/registries/bazi-source-registry-v1.3.json',
 admissionRegistry:'content/interpretation/bazi/registries/bazi-source-admission-registry-v1.3.json',
 coverage:'content/interpretation/bazi/registries/bazi-source-coverage-matrix-v1.3.json',
 patternSchool:'content/interpretation/bazi/registries/bazi-pattern-school-registry-v1.2.json',
 usefulSchool:'content/interpretation/bazi/registries/bazi-useful-god-school-registry-v1.2.json',
 patternRuleset:'content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v2.json',
 ziRuleset:'content/interpretation/bazi/rulesets/bazi-zi-ping-month-command-use-ruleset-v2.json',
 tiRuleset:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-ti-yong-ruleset-v2.json',
 thRuleset:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-tiaohou-ruleset-v2.json',
 freeze:'content/professional/bzr-full-production/freeze/bazi-fp-w5-w6-v2-source-admission-ruleset-freeze-v1.json',
 admissionAcceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w5-w6-v2-source-admission-ruleset-freeze-acceptance-v1.json',
 w8Contract:'content/professional/bzr-full-production/contracts/bazi-liu-nian-interaction-contract-v1.json',
 w8Fixture:'content/professional/bzr-full-production/fixtures/bazi-liu-nian-interaction-fixture-v1.json',
 w8Acceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w8-engineering-acceptance-v1.json',
 roadmap:'content/professional/bzr-full-production/roadmap/bazi-full-production-master-work-v1.3.json'
};
for(const x of Object.values(p))assert(exists(x),`missing ${x}`);

// Batch 002 historical extraction remains immutable/pending; the human-reviewed successor owns admission.
const extracted=j(p.extracted),review=j(p.review),admitted=j(p.admitted);
assert.equal(extracted.status,'EXTRACTED_PENDING_HUMAN_SOURCE_FIDELITY_REVIEW');
assert.equal(extracted.claims.length,20);assert(extracted.claims.every(x=>x.reviewState==='EXTRACTED_PENDING_HUMAN_REVIEW'&&x.runtimeUseAllowed===false));
assert.equal(review.schemaVersion,'PHI-OS-BAZI-SOURCE-CLAIM-HUMAN-REVIEW-v1.0.0');assert.equal(review.batchId,'BZR-R1-CLAIM-BATCH-002');assert.equal(review.status,'HUMAN_REVIEW_COMPLETE');assert.equal(review.reviewer,'TL');assert.equal(review.decisions.length,20);assert(review.decisions.every(x=>x.decision==='ADMIT'));assert.deepEqual(review.decisions.map(x=>x.claimId),extracted.claims.map(x=>x.claimId));
assert.equal(admitted.status,'HUMAN_ADMITTED_20_OF_20_RUNTIME_USE_ALLOWED');assert.equal(admitted.admissionBaselineCommit,current);assert.equal(admitted.counts.humanAdmitted,20);assert.equal(admitted.counts.runtimeUseAllowed,20);assert(admitted.claims.every(x=>x.reviewState==='HUMAN_ADMITTED'&&x.runtimeUseAllowed===true&&x.reviewEvidenceRef===p.review));
for(let i=0;i<20;i++){for(const key of ['claimId','sourceId','witnessId','topic','claimType','sourceBoundParaphrase','schoolLayer'])assert.deepEqual(admitted.claims[i][key],extracted.claims[i][key],`admitted claim identity drift ${i}:${key}`);assert.deepEqual(admitted.claims[i].locator,extracted.claims[i].locator);}
const admission=j(p.admission);assert.equal(admission.status,'HUMAN_ADMISSION_COMPLETE_20_OF_20');assert.equal(admission.counts.admitted,20);assert.equal(admission.counts.runtimeUseAllowed,20);assert.equal(admission.governance.unsupportedRuleGapFillForbidden,true);assert.equal(admission.governance.customerPredictionAuthorized,false);

// Current source registry is a successor; both source batches are admitted.
const sr=j(p.sourceRegistry);assert.equal(sr.registryVersion,'1.3.0');assert.equal(sr.currentBaselineCommit,current);assert.deepEqual(sr.sources.map(x=>x.humanAdmittedClaimCount),[1,19,12]);assert(sr.sources.every(x=>x.pendingBatch002ClaimCount===0));
const ar=j(p.admissionRegistry);assert.equal(ar.registryVersion,'1.3.0');assert.equal(ar.currentBaselineCommit,current);const b2=ar.claimBatches.find(x=>x.batchId==='BZR-R1-CLAIM-BATCH-002');assert.equal(b2.state,'HUMAN_ADMITTED');assert.equal(b2.humanAdmittedClaims,20);assert.equal(b2.runtimeUseAllowedClaims,20);assert.equal(ar.productionVerdictGate.patternDetailedFormationDefeatRescueEvaluation,true);assert.equal(ar.productionVerdictGate.patternPrimaryVerdict,false);assert.equal(ar.productionVerdictGate.usefulGodConditionalCandidateSelection,true);assert.equal(ar.productionVerdictGate.usefulGodElementSelectionVerdict,false);assert.equal(ar.productionVerdictGate.tiaohouConditionalCandidateSelection,true);assert.equal(ar.productionVerdictGate.tiaohouElementSelectionVerdict,false);
const coverage=j(p.coverage);for(const topic of ['PATTERN_CLASSIFICATION','USEFUL_GOD_TIAOHOU']){const x=coverage.topics.find(y=>y.topic===topic);assert.equal(x.batch002AdmissionState,'HUMAN_ADMITTED');assert.equal(x.admissionState,'HUMAN_ADMITTED_BATCH_001_AND_002');assert(x.batch002AdmittedClaimRefs.length>0);}assert.equal(coverage.topics.find(x=>x.topic==='LIU_NIAN_INTERACTION').engineeringIntegrationState,'W8_TEMPORAL_ANNUAL_FACT_PLUS_W7_DA_YUN_PLUS_NATAL_STRUCTURAL_INTERACTION_COMPLETE');

// Candidate files remain historical/inactive; frozen v2 successors are active and only reference admitted claims.
for(const c of ['content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v2.candidate.json','content/interpretation/bazi/rulesets/bazi-zi-ping-month-command-use-ruleset-v2.candidate.json','content/interpretation/bazi/rulesets/bazi-di-tian-sui-ti-yong-ruleset-v2.candidate.json','content/interpretation/bazi/rulesets/bazi-di-tian-sui-tiaohou-ruleset-v2.candidate.json']){const d=j(c);assert.equal(d.active,false);assert.match(d.status,/PENDING_HUMAN_ADMISSION/);}
const rsets=[j(p.patternRuleset),j(p.ziRuleset),j(p.tiRuleset),j(p.thRuleset)];for(const r of rsets){assert.equal(r.active,true);assert.equal(r.status,'FROZEN_SOURCE_ADMITTED_DETAILED_V2');assert.equal(r.freezeBaselineCommit,current);assert.equal(r.authority.allReferencedBatch002ClaimsHumanAdmitted,true);}
assert.equal(rsets[0].decisionCoverage.primaryPatternAutomaticAssignment,'FAIL_CLOSED_UNLESS_ALL_REQUIRED_EVIDENCE_RESOLVED');assert.equal(rsets[1].decisionCoverage.finalSelectionRequiresEstablishedPatternPath,true);assert.equal(rsets[2].decisionCoverage.currentW2ExcessStateAvailability,'NOT_ESTABLISHED');assert.equal(rsets[3].decisionCoverage.exhaustiveDayMasterMonthElementTable,'NOT_ESTABLISHED');
const admittedIds=new Set(admitted.claims.map(x=>x.claimId));for(const r of rsets){const text=JSON.stringify(r);for(const id of extracted.claims.map(x=>x.claimId))if(text.includes(id))assert(admittedIds.has(id));}
const ps=j(p.patternSchool),us=j(p.usefulSchool);assert.equal(ps.schools[0].rulesetRef,p.patternRuleset);assert.equal(ps.schools[0].primaryPatternAssignmentEnabled,false);assert(us.schools.every(x=>x.conditionalCandidateSelectionEnabled===true&&x.productionVerdictEnabled===false&&x.elementSelectionEnabled===false));assert.equal(us.crossSchoolRules.automaticMergeForbidden,true);assert.equal(us.crossSchoolRules.batch002DetailedClaimsAdmitted,true);

// Freeze manifest binds the admitted authority bytes and explicitly keeps final verdicts closed.
const freeze=j(p.freeze);assert.equal(freeze.status,'FROZEN');assert.equal(freeze.baselineCommit,current);assert.equal(freeze.humanReview.admitCount,20);for(const f of freeze.files){assert(exists(f.path));assert.equal(sha(f.path),f.sha256,`freeze digest drift ${f.path}`);assert.equal(fs.statSync(f.path).size,f.bytes,`freeze size drift ${f.path}`);}assert.equal(freeze.boundaries.batch001FreezeMutated,false);assert.equal(freeze.boundaries.unsupportedRuleGapFillPerformed,false);assert.equal(freeze.boundaries.primaryPatternAutoAssignmentEnabled,false);assert.equal(freeze.boundaries.universalUsefulGodAutoSelectionEnabled,false);assert.equal(freeze.boundaries.universalTiaohouAutoSelectionEnabled,false);assert.equal(freeze.boundaries.exhaustiveDayMasterMonthTableInvented,false);
const aa=j(p.admissionAcceptance);assert.equal(aa.status,'BATCH_002_SOURCE_ADMISSION_COMPLETE_V2_RULESETS_FROZEN');assert.equal(aa.gates.BATCH_002_ADMITTED_CLAIM_COUNT,20);assert.equal(aa.gates.W5_V2_RULESET_FROZEN,true);assert.equal(aa.gates.W6_CONDITIONAL_CANDIDATE_SELECTION_AUTHORIZED,true);assert.equal(aa.gates.W6_UNIVERSAL_ELEMENT_AUTO_SELECTION_ENABLED,false);

// W8 consumes governed annual/current-luck facts and W7 structural Da Yun; it does not recalculate or interpret.
const natal=j('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json'),fx=j(p.w8Fixture);const chart=await buildCanonicalBaziChartIR({canonicalProjection:natal});const dy=await buildBaziDaYunStructuralIR({chart,canonicalProjection:natal});const w1=await buildBaziLiuNianInteractionIR({chart,daYunStructural:dy,temporalProjection:fx.temporalProjection});const w2=await buildBaziLiuNianInteractionIR({chart,daYunStructural:dy,temporalProjection:fx.temporalProjection});assert.equal(w1.interactionDigest,w2.interactionDigest);assert.equal(w1.executionCompleteness,'COMPLETE');assert.equal(w1.currentDaYun.record.cycleNumber,fx.expected.currentDaYunCycleNumber);assert.equal(w1.liuNian.stemTenGod.code,fx.expected.liuNianStemTenGod);assert(w1.interactions.liuNianToNatal.some(x=>x.type==='STEM_REPEAT'&&x.rightPosition==='YEAR'));const tri=w1.interactions.crossLayerGroups.find(x=>x.type==='BRANCH_THREE_HARMONY_WITH_LIU_NIAN'&&x.spansThreeLayers);assert(tri);assert.deepEqual(tri.members,fx.expected.threeLayerGroupMembers);assert.equal(tri.transformationEstablished,false);assert.equal(w1.boundaries.annualPillarRecalculated,false);assert.equal(w1.boundaries.currentDaYunReselected,false);assert.equal(w1.boundaries.patternVerdictCreated,false);assert.equal(w1.boundaries.usefulGodVerdictCreated,false);assert.equal(w1.boundaries.w9FindingRegistryCreated,false);assert.equal(w1.boundaries.customerProductionEligible,false);
const transition=structuredClone(fx.temporalProjection);transition.projectionId='BZTP-BAZI-FP-W8-TRANSITION';transition.currentLuckCycle={status:'PARTIAL',state:'TRANSITION_DAY',current:null,candidates:[{cycleNumber:3,pillar:{stemCode:'JI',branchCode:'SI'}},{cycleNumber:4,pillar:{stemCode:'GENG',branchCode:'WU'}}],reasonCodes:['BZT_LUCK_TRANSITION_DAY_CIVIL_DATE_PRECISION']};const tw=await buildBaziLiuNianInteractionIR({chart,daYunStructural:dy,temporalProjection:transition});assert.equal(tw.executionCompleteness,'PARTIAL');assert.equal(tw.currentDaYun.record,null);assert(tw.unknowns.some(x=>x.code==='BAZI_FP_W8_CURRENT_DA_YUN_AMBIGUOUS_TRANSITION_DAY'));assert.equal(tw.interactions.liuNianToCurrentDaYun.length,0);
const mismatch=structuredClone(fx.temporalProjection);mismatch.projectionId='BZTP-BAZI-FP-W8-MISMATCH';mismatch.currentLuckCycle.current.pillar.branchCode='CHOU';await assert.rejects(()=>buildBaziLiuNianInteractionIR({chart,daYunStructural:dy,temporalProjection:mismatch}),e=>e.code==='BAZI_FP_W8_DA_YUN_TEMPORAL_W7_PILLAR_MISMATCH');
const wc=j(p.w8Contract),wa=j(p.w8Acceptance);assert.equal(wc.status,'ENGINEERING_COMPLETE');assert.equal(wc.rules.mayRecalculateAnnualPillar,false);assert.equal(wc.rules.maySelectCurrentLuckIndependently,false);assert.equal(wc.rules.w5W6RulesConsumedAtW8,false);assert.equal(wa.status,'ENGINEERING_COMPLETE_NATAL_DA_YUN_LIU_NIAN_STRUCTURAL_INTERACTION');assert.equal(wa.gates.W9_FINDING_CREATED,false);
const roadmap=j(p.roadmap);assert.equal(roadmap.currentBaselineCommit,current);assert.match(roadmap.status,/W8_ENGINEERING_COMPLETE_W9_NEXT/);assert.match(roadmap.works.find(x=>x.work==='BZR-R1').status,/BATCH_002_ADMITTED_20_OF_20/);assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W5').status,/V2_/);assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W6').status,/V2_/);assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W8').status,/ENGINEERING_COMPLETE/);assert.equal(roadmap.works.find(x=>x.work==='BAZI-FP-W9').status,'NEXT');

console.log('✓ BZR-R1 Batch 002 formal admission + BAZI-FP-W5/W6 v2 ruleset freeze + BAZI-FP-W8 passed.');
console.log('  Batch 002: 20/20 human ADMIT -> 20/20 runtime-use allowed; historical extraction/candidate files remain unchanged.');
console.log('  W5/W6: v2 detailed source-qualified rulesets are frozen; final pattern/useful-god/tiaohou verdicts remain prerequisite-gated and no universal table was invented.');
console.log('  W8: governed Liu Nian annual fact × current Da Yun × natal structural interactions are deterministic; transition days fail closed and W9 findings/customer interpretation are not created.');
