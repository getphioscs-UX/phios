import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildZiWeiCalculationIR} from '../functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js';
import {executeAndProjectZwrProduction} from '../functions/method-client-delivery/zwr-canonical-projection-runtime.js';
import {getZwrMpaProductionDecision} from '../functions/method-production-activation/zwr-production-authority-runtime.js';
import {buildCanonicalZiweiChartIR} from '../functions/zi-wei-full-production/ziwei-chart-runtime.js';
import {calculateZiweiCompleteStarPlacement} from '../functions/zi-wei-full-production/ziwei-complete-star-placement-runtime.js';
import {resolveZiweiStarStates} from '../functions/zi-wei-full-production/ziwei-star-state-runtime.js';
import {buildZiweiFourTransformationMatrix} from '../functions/zi-wei-full-production/ziwei-four-transformation-matrix-runtime.js';
import {buildZiweiPalaceRelationshipEngine} from '../functions/zi-wei-full-production/ziwei-palace-relationship-engine.js';
import {buildZiweiStarCombinationRuntime} from '../functions/zi-wei-full-production/ziwei-star-combination-runtime.js';
import {evaluateAdmittedZiweiPatterns} from '../functions/zi-wei-full-production/ziwei-admitted-pattern-runtime.js';
import {ZIWEI_ADMITTED_PATTERN_RULE_REGISTRY,assertZiweiPatternRuleAdmission} from '../functions/zi-wei-full-production/ziwei-pattern-rule-authority-v1.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const stable=x=>JSON.stringify(x,Object.keys(x||{}).sort());
const base='content/professional/zi-wei-full-production';
const sa=`${base}/source-admission`;
const extractionPath=`${sa}/claims/ziwei-source-claim-batch-002-patterns-v1.json`;
const admittedPath=`${sa}/claims/ziwei-source-claim-batch-002-patterns-v1.1.json`;
const reviewPath=`${sa}/review/ziwei-source-claim-batch-002-patterns-human-review-result-v1.json`;
const admissionPath=`${sa}/admission/ziwei-source-claim-batch-002-patterns-admission-v1.json`;
const registryPath=`${base}/registries/ziwei-pattern-rule-registry-v1.json`;
for(const p of [
 extractionPath,admittedPath,reviewPath,admissionPath,registryPath,
 `${sa}/registries/ziwei-source-admission-registry-v3.json`,
 `${sa}/registries/ziwei-source-registry-v3.json`,
 `${sa}/authority/ziwei-source-admission-strategy-v4.json`,
 `${sa}/acceptance/ziwei-source-claim-batch-002-patterns-admission-acceptance-v1.json`,
 `${base}/authority/ziwei-fp-w8-pattern-authority-v2.json`,
 `${base}/acceptance/ziwei-fp-w8-pattern-admission-acceptance-v1.json`,
 `${base}/fixtures/ziwei-fp-w8-admitted-pattern-validation-fixture-v1.json`
]) assert.ok(fs.existsSync(p),`missing ${p}`);

const extraction=j(extractionPath), admitted=j(admittedPath), review=j(reviewPath), admission=j(admissionPath), registry=j(registryPath);
assert.equal(review.schemaVersion,'PHI-OS-ZIWEI-SOURCE-CLAIM-HUMAN-REVIEW-RESULT-v2.0.0');
assert.equal(review.batchId,'ZIWEI-SOURCE-CLAIM-BATCH-002-PATTERNS');
assert.equal(review.decisions.length,11);assert.deepEqual(new Set(review.decisions.map(x=>x.decision)),new Set(['ADMIT']));
const extractedIds=extraction.claims.map(x=>x.claimId);assert.equal(new Set(extractedIds).size,11);assert.deepEqual(new Set(review.decisions.map(x=>x.claimId)),new Set(extractedIds));
assert.equal(admitted.predecessor,extractionPath);assert.equal(admitted.predecessorMutated,false);assert.equal(admitted.claims.length,11);
const oldById=new Map(extraction.claims.map(x=>[x.claimId,x]));
for(const c of admitted.claims){const old=oldById.get(c.claimId);assert(old);assert.equal(c.reviewState,'HUMAN_ADMITTED');assert.equal(c.runtimeUseAllowed,true);assert.equal(c.reviewEvidenceRef,reviewPath);assert.deepEqual(c.normalizedPayload,old.normalizedPayload);assert.deepEqual(c.locator,old.locator);assert.equal(c.sourceBoundParaphrase,old.sourceBoundParaphrase);}
assert.equal(admission.status,'HUMAN_ADMISSION_COMPLETE_11_OF_11');assert.equal(admission.counts.admitted,11);assert.equal(admission.counts.runtimeUseAllowed,11);assert.equal(admission.humanReview.sha256,sha(reviewPath));assert.equal(admission.humanReview.reviewedAt,review.reviewedAt);assert.deepEqual(new Set(admission.sourceClaims.admittedClaimIds),new Set(extractedIds));assert.equal(admission.governance.classicalOutcomeTextImported,false);assert.equal(admission.handoff.customerCutoverAllowed,false);
assert.equal(registry.admissionState,'HUMAN_ADMITTED');assert.equal(registry.ruleCount,11);assert.equal(registry.rules.length,11);assert.deepEqual(new Set(registry.rules.map(x=>x.sourceClaimId)),new Set(extractedIds));
for(const r of registry.rules){assert.equal(r.admissionState,'HUMAN_ADMITTED');assert.equal(r.reviewEvidenceRef,reviewPath);assert.ok(r.alternatives.length>=1);}
assert.deepEqual(ZIWEI_ADMITTED_PATTERN_RULE_REGISTRY,registry);assert.equal(assertZiweiPatternRuleAdmission().ruleCount,11);
for(const k of ['outcomeTextIncluded','numericStrengthIncluded','goodBadVerdictIncluded','fortunePredictionIncluded','customerInterpretationApproved','customerCutoverAllowed'])assert.equal(registry.boundaries[k],false);

const sourceAdmission=j(`${sa}/registries/ziwei-source-admission-registry-v3.json`);const batch=sourceAdmission.claimBatches.find(x=>x.batchId===review.batchId);assert(batch);assert.equal(batch.humanAdmittedClaims,11);assert.equal(batch.runtimeUseAllowedClaims,11);assert.equal(sourceAdmission.engineeringGates.w8TraditionalPatternRules,true);assert.equal(sourceAdmission.customerGates.w8PatternsPublished,false);
const sourceRegistry=j(`${sa}/registries/ziwei-source-registry-v3.json`);assert.match(sourceRegistry.status,/W8|ADMIT|HUMAN/i);
const strategy=j(`${sa}/authority/ziwei-source-admission-strategy-v4.json`);assert.equal(strategy.predecessorMutated,false);
const acc=j(`${base}/acceptance/ziwei-fp-w8-pattern-admission-acceptance-v1.json`);assert.equal(acc.gates.BATCH_002_HUMAN_ADMITTED_11_OF_11,true);assert.equal(acc.gates.W8_ACTIVE_RULE_COUNT,11);assert.equal(acc.gates.FULL_PRODUCTION_CUTOVER_OPEN,false);

// Real calculated-chart positive proof for one admitted pattern. No dynamic/time outcome is needed here.
const fixture=j(`${base}/fixtures/ziwei-fp-w8-admitted-pattern-validation-fixture-v1.json`);const ci=fixture.canonicalInput;
const policy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
const canonicalInput={birthDate:ci.birthDate,birthTime:ci.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:ci.timezone.iana,utcOffsetAtBirth:ci.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:ci.timeAccuracy,locale:'zh-Hans',consent:{recordId:'CONSENT-ZIWEI-FP-W8-ADMISSION',granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const sourceIR=buildZiWeiCalculationIR({birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone},{policy,executionMode:'INTERNAL_VALIDATION'});
const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');assert.equal(decision.decision,'ELIGIBLE');
const request={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:'CONSENT-ZIWEI-FP-W8-ADMISSION',requestId:'REQ-ZIWEI-FP-W8-ADMISSION'};
const projection=await executeAndProjectZwrProduction(request,decision);const snap=[JSON.stringify(projection),JSON.stringify(sourceIR)];
const chart=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR});
const placement=calculateZiweiCompleteStarPlacement({chart});const states=resolveZiweiStarStates({placement});const matrix=buildZiweiFourTransformationMatrix({chart});const rel=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:states,transformationMatrix:matrix});const comb=buildZiweiStarCombinationRuntime({chart,placement,starStates:states,transformationMatrix:matrix,relationships:rel});
const p1=evaluateAdmittedZiweiPatterns({combinations:comb}),p2=evaluateAdmittedZiweiPatterns({combinations:comb});assert.equal(p1.patternDigest,p2.patternDigest);assert.equal(p1.ruleState,'ADMITTED_TRADITIONAL_RULESET_ACTIVE');assert.equal(p1.coverage.activeRuleCount,fixture.expected.activePatternRules);
const codes=new Set(p1.traditionalPatterns.map(x=>x.patternCode));for(const code of fixture.expected.mustIncludePatternCodes)assert(codes.has(code),`expected admitted pattern ${code}`);const positive=p1.traditionalPatterns.find(x=>x.patternCode===fixture.expected.mustIncludePatternCodes[0]);assert.equal(positive.sourceClaimId,fixture.expected.sourceClaimId);assert.equal(positive.qualificationStatus,'STRUCTURALLY_QUALIFIED_BY_ADMITTED_RULE');assert.equal(p1.boundaries.patternOutcomeMeaningCreated,false);assert.equal(p1.boundaries.customerCutoverAllowed,fixture.expected.customerCutoverAllowed);
assert.equal(JSON.stringify(projection),snap[0]);assert.equal(JSON.stringify(sourceIR),snap[1]);
console.log('✓ ZIWEI-FP-W8 Human-admitted pattern registry passed.');
console.log(`  Batch 002: ${review.decisions.length}/11 ADMIT; active traditional rules: ${registry.rules.length}.`);
console.log(`  Real calculated chart positively qualified: ${[...codes].join(', ') || '(none)'}; no outcome text or customer meaning was created.`);
