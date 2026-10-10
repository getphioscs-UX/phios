import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
const lfHash=p=>hash(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'));
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const casesRef='content/professional/ast-full-production/review/ast-fp-review-cases-v1.json';
const resultsRef='content/professional/ast-full-production/review/ast-fp-review-results-v1.json';
const admissionRef='content/professional/ast-full-production/admission/ast-fp-r2-candidate-human-admission-v1.json';
const acceptanceRef='content/professional/ast-full-production/acceptance/ast-fp-r2-human-admission-acceptance-v1.json';
const contractRef='content/professional/ast-full-production/contracts/ast-fp-r2-human-admitted-candidate-contract-v1.json';

const packet=read(casesRef),results=read(resultsRef),admission=read(admissionRef),acceptance=read(acceptanceRef),contract=read(contractRef);
assert.equal(packet.schemaVersion,'PHI-OS-AST-FP-REVIEW-CASES-v1.0.0');
assert.equal(packet.caseCount,16);assert.equal(packet.accepted,0);assert.equal(packet.pending,16);
assert.equal(packet.productionAllowed,false,'Source review packet remains a pre-admission candidate artifact');
assert.equal(results.schemaVersion,'PHI-OS-AST-FP-R2-HUMAN-REVIEW-RESULTS-v1.0.0');
assert.equal(results.sourceMainCommit,'31f0cb5dcf47c1e9419ef67ac89968d06834b35d');
assert.equal(results.reviewCasesRef,casesRef);assert.equal(results.reviewCasesLfNormalizedSha256,lfHash(casesRef));
assert.ok(nonempty(results.reviewerRef));assert.ok(nonempty(results.decisionRecordedAt));
assert.equal(results.required,16);assert.equal(results.accepted,16);assert.equal(results.rejected,0);assert.equal(results.needsRevision,0);assert.equal(results.pending,0);
assert.equal(results.status,'HUMAN_REVIEW_COMPLETE_16_OF_16');assert.equal(results.decisions.length,16);
assert.equal(new Set(results.decisions.map(x=>x.caseId)).size,16);
assert.deepEqual([...results.decisions.map(x=>x.caseId)].sort(),[...packet.cases.map(x=>x.caseId)].sort());

function bindingObject(c,decision='HUMAN_ACCEPTED'){
 return {caseId:c.caseId,locale:c.locale,houseSystem:c.houseSystem,projectionId:c.projectionId,projectionDigest:c.projectionDigest,compositionVersion:c.compositionVersion,semanticDigest:c.semanticDigest,interpretationDigest:c.interpretationDigest,decision};
}
for(const decision of results.decisions){
 const candidate=packet.cases.find(x=>x.caseId===decision.caseId);assert.ok(candidate,decision.caseId);
 assert.equal(decision.decision,'HUMAN_ACCEPTED');
 for(const key of ['locale','houseSystem','projectionId','projectionDigest','compositionVersion','semanticDigest','interpretationDigest','inputFixtureRef','inputClass'])assert.equal(decision[key],candidate[key],`${decision.caseId}: ${key} changed after review`);
 const expected=hash(JSON.stringify(bindingObject(candidate)));
 assert.equal(decision.decisionBindingDigest,expected,`${decision.caseId}: decision is not bound to the exact candidate digest tuple`);
 assert.equal(decision.reviewerRef,results.reviewerRef);assert.equal(decision.decisionRecordedAt,results.decisionRecordedAt);
 assert.equal(decision.rubricAttestation?.publishedRubricApplied,true);
 assert.equal(decision.rubricAttestation?.exactCandidateVersionReviewed,true);
 assert.equal(decision.rubricAttestation?.declaredUnsupportedScopePreserved,true);
 assert.equal(decision.rubricAttestation?.sourceBooksAdmittedByThisDecision,false);
 assert.equal(decision.rubricAttestation?.wholeChartSynthesisAcceptedByThisDecision,false);
 assert.equal(decision.rubricAttestation?.customerPublicationAllowedByThisDecision,false);
}
const expectedBatchDigest=hash(results.decisions.map(x=>x.decisionBindingDigest).sort().join('\n'));
assert.equal(results.batchDecisionDigest,expectedBatchDigest);
assert.equal(results.governance.acceptanceWildcardsAllowed,false);
assert.equal(results.governance.customerPublicationAuthorized,false);
assert.equal(results.governance.productionCutoverAuthorized,false);

// Bilingual pairs must bind the same structural semantics but retain locale-specific interpretation digests.
for(let i=1;i<=8;i++){
 const prefix=`ASTFP-${String(i).padStart(2,'0')}`;
 const en=results.decisions.find(x=>x.caseId===`${prefix}-en`),zh=results.decisions.find(x=>x.caseId===`${prefix}-zh-Hans`);
 assert.ok(en&&zh,prefix);assert.equal(en.projectionDigest,zh.projectionDigest);assert.equal(en.semanticDigest,zh.semanticDigest);assert.notEqual(en.interpretationDigest,zh.interpretationDigest);
}

assert.equal(admission.schemaVersion,'PHI-OS-AST-FP-R2-CANDIDATE-HUMAN-ADMISSION-v1.0.0');
assert.equal(admission.status,'HUMAN_ADMISSION_COMPLETE_16_OF_16');assert.equal(admission.sourceMainCommit,results.sourceMainCommit);
assert.equal(admission.reviewEvidence.reviewCasesLfNormalizedSha256,lfHash(casesRef));assert.equal(admission.reviewEvidence.resultsLfNormalizedSha256,lfHash(resultsRef));
assert.equal(admission.reviewEvidence.batchDecisionDigest,results.batchDecisionDigest);
assert.equal(admission.counts.reviewed,16);assert.equal(admission.counts.admitted,16);assert.equal(admission.counts.pending,0);assert.equal(admission.admittedCandidates.length,16);
assert.equal(admission.admissionScope.type,'EXACT_DIGEST_BOUND_ENGINEERING_CANDIDATE_SET');
assert.equal(admission.admissionScope.exactDigestMatchRequired,true);assert.equal(admission.admissionScope.wildcardProjectionAdmission,false);assert.equal(admission.admissionScope.genericCompositionRulesetAdmission,false);assert.equal(admission.admissionScope.staleDigestFailsClosed,true);
for(const row of admission.admittedCandidates){
 const decision=results.decisions.find(x=>x.caseId===row.caseId);assert.ok(decision);
 for(const key of ['locale','houseSystem','projectionId','projectionDigest','semanticDigest','interpretationDigest','decisionBindingDigest'])assert.equal(row[key],decision[key]);
 assert.equal(row.engineeringCandidateUseAllowed,true);assert.equal(row.customerRuntimeUseAllowed,false);assert.equal(row.customerPublicationAllowed,false);
}
assert.equal(admission.governance.candidateHumanAdmissionOnly,true);assert.equal(admission.governance.sourceUseBasisGranted,false);assert.equal(admission.governance.wholeChartSynthesisAccepted,false);assert.equal(admission.governance.productionAllowed,false);assert.equal(admission.governance.customerCutoverAllowed,false);assert.equal(admission.governance.deploymentAllowed,false);

assert.equal(contract.schemaVersion,'PHI-OS-AST-FP-R2-HUMAN-ADMITTED-CANDIDATE-CONTRACT-v1.0.0');assert.equal(contract.candidateAdmissionRef,admissionRef);assert.equal(contract.humanReviewResultsRef,resultsRef);
assert.equal(contract.eligibility.exactCaseMembershipRequired,true);assert.equal(contract.eligibility.exactProjectionDigestRequired,true);assert.equal(contract.eligibility.exactSemanticDigestRequired,true);assert.equal(contract.eligibility.exactInterpretationDigestRequired,true);
assert.equal(contract.effects.engineeringCandidateHumanAccepted,true);assert.equal(contract.effects.genericLiveCandidateAdmission,false);assert.equal(contract.effects.customerPublicationAllowed,false);assert.equal(contract.effects.productionAllowed,false);assert.equal(contract.effects.defaultCustomerCutover,false);

assert.equal(acceptance.schemaVersion,'PHI-OS-AST-FP-R2-HUMAN-ADMISSION-ACCEPTANCE-v1.0.0');
assert.equal(acceptance.status,'ENGINEERING_HUMAN_ADMISSION_ACCEPTED_READY_FOR_AST_FP_R3');
assert.equal(acceptance.evidence.reviewCasesLfNormalizedSha256,lfHash(casesRef));assert.equal(acceptance.evidence.reviewResultsLfNormalizedSha256,lfHash(resultsRef));assert.equal(acceptance.evidence.candidateAdmissionLfNormalizedSha256,lfHash(admissionRef));assert.equal(acceptance.evidence.batchDecisionDigest,expectedBatchDigest);
assert.equal(acceptance.result.humanAccepted,16);assert.equal(acceptance.result.humanPending,0);assert.equal(acceptance.result.exactDigestBound,true);assert.equal(acceptance.result.staleCandidateFailsClosed,true);
assert.equal(acceptance.boundaries.sourceUseBasisEstablished,false);assert.equal(acceptance.boundaries.wholeChartSynthesisAcceptanceEstablished,false);assert.equal(acceptance.boundaries.independentEphemerisAccuracyCertificationEstablished,false);assert.equal(acceptance.boundaries.professionalPlatformParityEstablished,false);assert.equal(acceptance.boundaries.finalCustomerReportHumanAcceptanceEstablished,false);assert.equal(acceptance.boundaries.customerCutover,false);assert.equal(acceptance.boundaries.productionAllowed,false);assert.equal(acceptance.boundaries.deploymentPerformed,false);

// This admission must not rewrite or silently pass the superseded legacy SMR review campaign.
const legacyHuman=read('content/customer-experience-rebuild/r12r4b/smr/history/v1/review/smr-human-review-results-v1.json');
const legacyAdmission=read('content/customer-experience-rebuild/r12r4b/smr/history/v1/admission/smr-production-admission-v1.json');
assert.equal(legacyHuman.accepted,0);assert.equal(legacyHuman.pending,48);assert.equal(legacyAdmission.productionAllowed,false);assert.equal(legacyAdmission.customerCutoverAllowed,false);
const engineering=read('content/professional/ast-full-production/contracts/ast-fp-engineering-contract-v1.json');
assert.equal(engineering.candidate.productionAllowed,false);assert.equal(engineering.candidate.customerCutoverAllowed,false);assert.equal(engineering.gates.fullProductionClaimAllowed,false);
const benchmark=read('content/customer-experience-rebuild/r12r4b/smr/benchmark/smr-ast-benchmark-v1-evidence.json');
assert.equal(benchmark.governance.benchmarkHumanAccepted,false,'R2 candidate acceptance is not the final SMR-R2 report acceptance');
assert.ok(benchmark.upstreamGapTickets.some(x=>x.gapCode==='AST_FULL_PRODUCTION_GAP_PLANET_SIGN'));
assert.ok(benchmark.upstreamGapTickets.some(x=>x.gapCode==='AST_FULL_PRODUCTION_GAP_TENSION_SELECTION'));

console.log(JSON.stringify({status:'PASS',workCode:'AST-FP-R2',reviewCases:16,humanAccepted:16,humanPending:0,batchDecisionDigest:expectedBatchDigest,exactDigestBound:true,engineeringCandidateUseAllowed:true,customerPublicationAllowed:false,productionAllowed:false,next:'AST-FP-R3'},null,2));
