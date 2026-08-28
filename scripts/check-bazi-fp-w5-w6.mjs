import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildCanonicalBaziChartIR} from '../functions/bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziStrengthSeasonal} from '../functions/bzr-full-production/bazi-strength-seasonal-runtime.js';
import {analyzeBaziRelationships} from '../functions/bzr-full-production/bazi-relationship-runtime.js';
import {analyzeBaziTenGods} from '../functions/bzr-full-production/bazi-ten-god-runtime.js';
import {analyzeBaziPatternCandidates} from '../functions/bzr-full-production/bazi-pattern-runtime.js';
import {analyzeBaziUsefulGodTiaohouViews} from '../functions/bzr-full-production/bazi-useful-god-tiaohou-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists=p=>fs.existsSync(p);
const current='07d01b39a98d07ff237f1516852f3b29d058a47e';
const paths={
 extracted:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v1.json',
 admitted:'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v1.1.json',
 review:'content/interpretation/bazi/review/bzr-r1-claim-batch-001-human-review-result-v1.json',
 admissionRecord:'content/interpretation/bazi/admission/bzr-r1-claim-batch-001-admission-v1.json',
 sourceStrategy:'content/interpretation/bazi/authority/bzr-r1-source-strategy-v1.1.json',
 sourceRegistry:'content/interpretation/bazi/registries/bazi-source-registry-v1.1.json',
 admissionRegistry:'content/interpretation/bazi/registries/bazi-source-admission-registry-v1.1.json',
 coverage:'content/interpretation/bazi/registries/bazi-source-coverage-matrix-v1.1.json',
 patternSchool:'content/interpretation/bazi/registries/bazi-pattern-school-registry-v1.1.json',
 usefulSchool:'content/interpretation/bazi/registries/bazi-useful-god-school-registry-v1.1.json',
 patternRuleset:'content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v1.json',
 ziPingRuleset:'content/interpretation/bazi/rulesets/bazi-zi-ping-month-command-use-ruleset-v1.json',
 tiYongRuleset:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-ti-yong-ruleset-v1.json',
 tiaohouRuleset:'content/interpretation/bazi/rulesets/bazi-di-tian-sui-tiaohou-ruleset-v1.json',
 patternContract:'content/professional/bzr-production/contracts/bazi-pattern-runtime-contract-v1.1.json',
 usefulContract:'content/professional/bzr-production/contracts/bazi-useful-god-tiaohou-contract-v1.1.json',
 roadmap:'content/professional/bzr-full-production/roadmap/bazi-full-production-master-work-v1.1.json',
 freeze:'content/professional/bzr-full-production/freeze/bazi-fp-w5-w6-source-admission-ruleset-freeze-v1.json',
 acceptance:'content/professional/bzr-full-production/acceptance/bazi-fp-w5-w6-source-admission-ruleset-freeze-acceptance-v1.json'
};
for(const p of Object.values(paths))assert(exists(p),`missing ${p}`);

// Historical extraction and protected current-authority predecessors remain historical, not silently rewritten.
const extracted=j(paths.extracted);
assert.equal(extracted.baselineCommit,'abab6b358bff574c65b9dfacc7985d5de564d674');
assert.equal(extracted.claims.length,12);
assert(extracted.claims.every(x=>x.reviewState==='EXTRACTED_PENDING_HUMAN_REVIEW'&&x.runtimeUseAllowed===false));
const historicalAdmission=j('content/interpretation/bazi/registries/bazi-source-admission-registry-v1.json');
assert.equal(historicalAdmission.claimBatches[0].humanAdmittedClaims,0);
const historicalRoadmap=j('content/professional/bzr-full-production/roadmap/bazi-full-production-master-work-v1.json');
assert.equal(historicalRoadmap.baselineCommit,'14b6735b1ffb804c160b0b5306646994ee1ab1dd');

// Human review is complete and exhaustive for Batch 001.
const review=j(paths.review);
assert.equal(review.schemaVersion,'PHI-OS-BAZI-SOURCE-CLAIM-HUMAN-REVIEW-v1.0.0');
assert.equal(review.batchId,'BZR-R1-CLAIM-BATCH-001');
assert.equal(review.status,'HUMAN_REVIEW_COMPLETE');
assert.equal(review.reviewer,'TL');
assert.equal(review.decisions.length,12);
assert(review.decisions.every(x=>x.decision==='ADMIT'));
assert.deepEqual(review.decisions.map(x=>x.claimId),extracted.claims.map(x=>x.claimId));

// Admitted successor carries the runtime authority; source text/paraphrase identity is preserved.
const admitted=j(paths.admitted);
assert.equal(admitted.schemaVersion,'PHI-OS-BAZI-SOURCE-CLAIM-BATCH-v1.1.0');
assert.equal(admitted.status,'HUMAN_ADMITTED_12_OF_12_RUNTIME_USE_ALLOWED');
assert.equal(admitted.admissionBaselineCommit,current);
assert.equal(admitted.counts.humanAdmitted,12);
assert.equal(admitted.counts.runtimeUseAllowed,12);
assert(admitted.claims.every(x=>x.reviewState==='HUMAN_ADMITTED'&&x.runtimeUseAllowed===true&&x.reviewEvidenceRef===paths.review));
for(let i=0;i<12;i++){
 assert.equal(admitted.claims[i].claimId,extracted.claims[i].claimId);
 assert.equal(admitted.claims[i].sourceBoundParaphrase,extracted.claims[i].sourceBoundParaphrase);
 assert.equal(admitted.claims[i].sourceId,extracted.claims[i].sourceId);
 assert.equal(admitted.claims[i].schoolLayer,extracted.claims[i].schoolLayer);
}

const admissionRecord=j(paths.admissionRecord);
assert.equal(admissionRecord.status,'HUMAN_ADMISSION_COMPLETE_12_OF_12');
assert.equal(admissionRecord.counts.admitted,12);
assert.equal(admissionRecord.governance.unsupportedRuleGapFillForbidden,true);
const admission=j(paths.admissionRegistry);
assert.equal(admission.registryVersion,'1.1.0');
assert.equal(admission.claimBatches[0].humanAdmittedClaims,12);
assert.equal(admission.claimBatches[0].runtimeUseAllowedClaims,12);
assert.equal(admission.productionVerdictGate.patternRuleEvaluation,true);
assert.equal(admission.productionVerdictGate.patternPrimaryVerdict,false);
assert.equal(admission.productionVerdictGate.usefulGodRuleEvaluation,true);
assert.equal(admission.productionVerdictGate.usefulGodElementSelectionVerdict,false);
assert.equal(admission.productionVerdictGate.tiaohouRuleEvaluation,true);
assert.equal(admission.productionVerdictGate.tiaohouElementSelectionVerdict,false);

const sourceRegistry=j(paths.sourceRegistry);
assert(sourceRegistry.sources.every(x=>x.runtimeClaimAuthority==='HUMAN_ADMITTED_CLAIMS_AVAILABLE'));
assert.deepEqual(sourceRegistry.sources.map(x=>x.humanAdmittedClaimCount),[1,7,4]);
const coverage=j(paths.coverage);
for(const topic of ['SEASONAL_STRENGTH_MONTH_COMMAND','TEN_GODS','PATTERN_CLASSIFICATION','USEFUL_GOD_TIAOHOU'])assert.equal(coverage.topics.find(x=>x.topic===topic).admissionState,'HUMAN_ADMITTED');

// Frozen W5/W6 source-qualified rule sets.
const patternRuleset=j(paths.patternRuleset),zi=j(paths.ziPingRuleset),ti=j(paths.tiYongRuleset),th=j(paths.tiaohouRuleset);
for(const r of [patternRuleset,zi,ti,th])assert.equal(r.status,'FROZEN_SOURCE_ADMITTED_FOUNDATION');
assert.equal(patternRuleset.decisionCoverage.candidateFamilyClassification,'SUPPORTED');
assert.match(patternRuleset.decisionCoverage.primaryPatternFormation,/UNRESOLVED/);
assert.equal(patternRuleset.decisionCoverage.qualityRanking,'FORBIDDEN');
assert.match(zi.decisionCoverage.usefulGodElementSelection,/UNRESOLVED/);
assert.match(ti.decisionCoverage.factorSelectionAndPriorityTable,/UNRESOLVED/);
assert.match(th.decisionCoverage.tiaohouElementSelection,/UNRESOLVED/);
for(const ref of [...patternRuleset.authority.admittedClaimRefs,...zi.authority.admittedClaimRefs,...ti.authority.admittedClaimRefs,...th.authority.admittedClaimRefs])assert(admitted.claims.some(x=>x.claimId===ref&&x.runtimeUseAllowed===true),`ruleset ref not admitted ${ref}`);

const patternSchool=j(paths.patternSchool),useSchool=j(paths.usefulSchool);
assert.equal(patternSchool.schools[0].sourceAdmissionComplete,true);
assert.equal(patternSchool.schools[0].ruleEvaluationEnabled,true);
assert.equal(patternSchool.schools[0].productionVerdictEnabled,false);
assert.equal(patternSchool.schools[0].primaryPatternAssignmentEnabled,false);
assert.equal(useSchool.schools.length,3);
assert(useSchool.schools.every(x=>x.sourceAdmissionComplete===true&&x.ruleEvaluationEnabled===true&&x.productionVerdictEnabled===false&&x.elementSelectionEnabled===false));
assert.equal(useSchool.crossSchoolRules.automaticMergeForbidden,true);
assert.equal(useSchool.crossSchoolRules.humanAdmittedClaimsPresent,true);

const patternContract=j(paths.patternContract),useContract=j(paths.usefulContract);
assert.match(patternContract.status,/RULESET_FROZEN/);
assert.equal(patternContract.rules.humanAdmittedSourceClaimsAvailable,true);
assert.equal(patternContract.rules.primaryPatternAssignmentRequiresDetailedFormationRuleCoverage,true);
assert.match(useContract.status,/RULESETS_FROZEN/);
assert.equal(useContract.rules.humanAdmittedSourceClaimsAvailable,true);
assert.equal(useContract.rules.elementSelectionRequiresElementSpecificRuleCoverage,true);

// Runtime is deterministic and no longer blocked on human admission; unsupported final selections stay fail-closed.
const projection=j('content/professional/bzr-production/fixtures/bzr-canonical-projection.production.valid.json');
const chart=await buildCanonicalBaziChartIR({canonicalProjection:projection});
const strength=await analyzeBaziStrengthSeasonal({chart});
const rel=await analyzeBaziRelationships({chart});
const tg=await analyzeBaziTenGods({chart});
const p1=await analyzeBaziPatternCandidates({chart,tenGods:tg,relationships:rel}),p2=await analyzeBaziPatternCandidates({chart,tenGods:tg,relationships:rel});
assert.equal(p1.patternDigest,p2.patternDigest);
assert.equal(p1.runtimeVersion,'1.1.0');
assert.equal(p1.authorityState,'SOURCE_ADMITTED_FOUNDATION_RULESET_FROZEN');
assert.equal(p1.monthCommand.branchCode,'YIN');
assert.deepEqual(p1.patternCandidates.map(x=>x.hiddenStemCode),['JIA','BING','WU']);
assert(p1.patternCandidates.every(x=>x.sourceAuthorityState==='HUMAN_ADMITTED_FOUNDATION_RULESET_FROZEN_V1'));
assert.equal(p1.patternCandidates.find(x=>x.hiddenStemCode==='BING').patternFamily,'QI_SHA');
assert.equal(p1.patternCandidates.find(x=>x.hiddenStemCode==='BING').treatmentClass,'NI_USE');
assert.equal(p1.ruleEvaluation.fourPillarSupportDamageRescueEvidenceRequired,true);
assert.equal(p1.verdict.primaryPattern,null);
assert.match(p1.verdict.formationState,/UNRESOLVED_FROZEN_RULESET/);
assert.equal(p1.boundaries.sourceAdmittedRuleEvaluationCreated,true);
assert.equal(p1.boundaries.primaryPatternAssignmentCreated,false);
assert.equal(p1.boundaries.customerProductionEligible,false);
assert(!JSON.stringify(p1).includes('PENDING_HUMAN_ADMISSION'));

const u1=await analyzeBaziUsefulGodTiaohouViews({chart,strengthSeasonal:strength,patterns:p1}),u2=await analyzeBaziUsefulGodTiaohouViews({chart,strengthSeasonal:strength,patterns:p1});
assert.equal(u1.usefulGodTiaohouDigest,u2.usefulGodTiaohouDigest);
assert.equal(u1.runtimeVersion,'1.1.0');
assert.equal(u1.authorityState,'SOURCE_ADMITTED_MULTI_SCHOOL_FOUNDATION_RULESETS_FROZEN');
assert.deepEqual(u1.schoolViews.map(x=>x.schoolCode),['ZI_PING_MONTH_COMMAND_USE_v1','DI_TIAN_SUI_TI_YONG_BALANCE_v1','DI_TIAN_SUI_CLIMATE_TIAOHOU_v1']);
assert(u1.schoolViews.every(x=>x.sourceAuthorityState==='HUMAN_ADMITTED_FOUNDATION_RULESET_FROZEN'));
assert(u1.schoolViews.every(x=>/UNRESOLVED_FROZEN_RULESET/.test(x.verdict.state)));
assert.equal(u1.crossSchoolSynthesis.created,false);
assert.equal(u1.boundaries.sourceAdmissionComplete,true);
assert.equal(u1.boundaries.foundationRulesetsFrozen,true);
assert.equal(u1.boundaries.usefulGodVerdictCreated,false);
assert.equal(u1.boundaries.tiaohouVerdictCreated,false);
assert.equal(u1.boundaries.customerProductionEligible,false);
assert(!JSON.stringify(u1).includes('PENDING_HUMAN_ADMISSION'));

// Freeze manifest binds authority and runtime bytes.
const freeze=j(paths.freeze);
assert.equal(freeze.status,'FROZEN');
assert.equal(freeze.baselineCommit,current);
assert.equal(freeze.humanReview.admitCount,12);
for(const f of freeze.files){assert(exists(f.path),`freeze missing ${f.path}`);assert.equal(sha(f.path),f.sha256,`freeze digest drift ${f.path}`);assert.equal(fs.statSync(f.path).size,f.bytes,`freeze size drift ${f.path}`);}
assert.equal(freeze.boundaries.protectedW0W4PredecessorsMutated,false);
assert.equal(freeze.boundaries.unsupportedRuleGapFillPerformed,false);
assert.equal(freeze.boundaries.primaryPatternAutoAssignmentEnabled,false);
assert.equal(freeze.boundaries.usefulGodElementAutoSelectionEnabled,false);
assert.equal(freeze.boundaries.tiaohouElementAutoSelectionEnabled,false);

const acc=j(paths.acceptance);
assert.equal(acc.status,'SOURCE_ADMISSION_COMPLETE_FOUNDATION_RULESETS_FROZEN');
assert.equal(acc.gates.SOURCE_FIDELITY_HUMAN_REVIEW_COMPLETE,true);
assert.equal(acc.gates.HUMAN_REVIEW_DECISIONS_ALL_ADMIT,true);
assert.equal(acc.gates.PRODUCTION_SOURCE_CLAIMS_ADMITTED,true);
assert.equal(acc.gates.HUMAN_ADMITTED_CLAIM_COUNT,12);
assert.equal(acc.gates.W5_PATTERN_FOUNDATION_RULESET_FROZEN,true);
assert.equal(acc.gates.W5_PRIMARY_PATTERN_AUTO_ASSIGNMENT_ENABLED,false);
assert.equal(acc.gates.W6_ZI_PING_USE_FOUNDATION_RULESET_FROZEN,true);
assert.equal(acc.gates.W6_TI_YONG_FOUNDATION_RULESET_FROZEN,true);
assert.equal(acc.gates.W6_TIAOHOU_FOUNDATION_RULESET_FROZEN,true);
assert.equal(acc.gates.W6_USEFUL_GOD_ELEMENT_AUTO_SELECTION_ENABLED,false);
assert.equal(acc.gates.W6_TIAOHOU_ELEMENT_AUTO_SELECTION_ENABLED,false);
assert.equal(acc.gates.OVERALL_PRODUCTION_GATE_OPEN,false);

const roadmap=j(paths.roadmap);
assert.equal(roadmap.currentBaselineCommit,current);
assert.match(roadmap.works.find(x=>x.work==='BZR-R1').status,/HUMAN_ADMITTED_12_OF_12/);
assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W5').status,/RULESET_FROZEN/);
assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W6').status,/RULESETS_FROZEN/);
assert.match(roadmap.works.find(x=>x.work==='BAZI-FP-W7').status,/NEXT/);

console.log('✓ BZR-R1 Batch 001 source admission + BAZI-FP-W5/W6 foundation ruleset freeze passed.');
console.log('  Human review: 12/12 ADMIT; admitted successor claims: 12/12 runtime-use allowed.');
console.log('  W5: source-admitted rule evaluation is active; primary pattern remains fail-closed until detailed formation-condition authority is added.');
console.log('  W6: three school-qualified rulesets are frozen; useful-god/tiaohou element auto-selection remains fail-closed until element-specific authority is added.');
