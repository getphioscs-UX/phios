import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {inspectIChingDepthAdmission,selectIChingDepthInterpretation,composeIChingDepthReadingSupplement} from '../functions/interpretation-runtime/iching-depth-editorial-runtime-v2.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const historicalV1=read('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v1.json');
const corpus=read('content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v2.json');
assert.equal(historicalV1.coverage.total,'0/448');assert.equal(historicalV1.publicRuntimeBound,false);
assert.equal(corpus.successorOf,'content/interpretation/iching/corpus/iching-depth-admitted-editorial-corpus-v1.json');assert.equal(corpus.historicalPredecessorMutated,false);
assert.equal(corpus.coverage.hexagram,'64/64');assert.equal(corpus.coverage.line,'384/384');assert.equal(corpus.coverage.total,'448/448');assert.equal(corpus.coverage.zhHans,'448/448');assert.equal(corpus.coverage.en,'448/448');
assert.equal(corpus.humanEditorialComplete,true);assert.equal(corpus.publicRuntimeBound,false);assert.equal(corpus.productionAuthorityChanged,false);assert.equal(corpus.entries.length,448);assert.equal(new Set(corpus.entries.map(x=>x.interpretationId)).size,448);
for(const entry of corpus.entries){assert.equal(entry.review.status,'HUMAN_APPROVED');assert.equal(entry.review.humanApproved,true);assert.equal(entry.review.reviewer,'TL');assert.equal(entry.review.sourceFidelityChecked,true);assert.equal(entry.review.localeFidelityChecked,true);assert.equal(entry.review.boundaryChecked,true);assert.equal(entry.publicationProjectionRules.omitInternalCandidateReviewStatusWarning,true);assert.equal(entry.publicationProjectionRules.mayCreateNewMeaning,false);}
const inspection=inspectIChingDepthAdmission(corpus);assert.equal(inspection.admitted,448);assert.equal(inspection.hexagram,64);assert.equal(inspection.line,384);assert.equal(inspection.humanEditorialComplete,true);assert.equal(inspection.publicDepthReady,false);
const selection=selectIChingDepthInterpretation({hexagramId:'HEXAGRAM-01',changingLines:[1,6],locale:'zh-Hans',admittedCorpus:corpus});assert.equal(selection.status,'AVAILABLE');assert.equal(selection.hexagram.interpretationId,'ICH-DEPTH-HEX-01-EDITORIAL-v1');assert.deepEqual(selection.lines.map(x=>x.linePosition),[1,6]);
const supplement=composeIChingDepthReadingSupplement({readingIr:{schemaVersion:'PHI-OS-ICHING-READING-IR-v1.0.0',methodCode:'I_CHING',structuralProjection:{projectionCode:'CHECK-DEPTH-V4',primary:{hexagramId:'HEXAGRAM-01'},changingLines:[1,6]}},selection});assert.equal(supplement.status,'AVAILABLE');assert.equal(supplement.authority.existingReadingIrMutated,false);assert.equal(supplement.authority.candidateFallbackUsed,false);assert.equal(supplement.authority.runtimeModelGenerationUsed,false);assert.equal(supplement.authority.publicProductionEligible,false);
const predecessor=read('content/interpretation/iching/reconciliation/iching-depth-current-successor-v4.json');
const current=read('content/interpretation/iching/reconciliation/iching-depth-current-successor-v5.json');
assert.equal(current.successorOf,'content/interpretation/iching/reconciliation/iching-depth-current-successor-v4.json');assert.equal(current.historicalPredecessorMutated,false);assert.equal(current.baselineCommit,'025588253432e411b130a61bf4b38fe540cfcf54');
assert.equal(predecessor.admittedCoverage.humanApproved,'448/448');assert.equal(current.admittedCoverage.humanApproved,'448/448');assert.equal(current.productionBoundary.depthSuccessorAloneMayGrantRunAllowed,false);assert.equal(current.productionBoundary.governedLimitedProductionAuthorityAdmittedByW31,true);assert.equal(current.productionBoundary.fullProductionAllowed,false);assert.equal(current.productionBoundary.globalPublicExecutionAllowed,false);
assert.equal(current.checkerGovernance.sharedSymbolicContextIsMutableCrossMethodSurface,true);assert.equal(current.checkerGovernance.sharedSymbolicContextWholeFileShaExcludedFromIChingPersistenceFreeze,true);assert.equal(current.checkerGovernance.sharedSymbolicContextCheckedSemantically,true);assert.equal(current.checkerGovernance.historicalPersistenceV3CheckerRewritten,false);
for(const artifact of current.domainArtifacts){assert.ok(artifact.sha256,`missing v4 artifact digest ${artifact.path}`);assert.equal(sha(artifact.path),artifact.sha256,`ICHI-DEPTH v4 domain artifact drift: ${artifact.path}`);}
const pkg=read('package.json');
for(const [name,value] of Object.entries(current.orchestrationBindings.requiredScripts)) assert.equal(pkg.scripts[name],value,`package orchestration drift: ${name}`);
console.log('✓ ICHI-DEPTH current v5 successor passed: 448/448 HUMAN_APPROVED depth is unchanged while W31 governed LIMITED_PRODUCTION authority remains external to the depth freeze.');
console.log('  W30 persistence semantics remain current; W32 observation and W33 FULL_PRODUCTION acceptance stay separate.');
