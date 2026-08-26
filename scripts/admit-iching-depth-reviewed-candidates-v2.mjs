import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const write=(path,value)=>fs.writeFileSync(path,`${JSON.stringify(value,null,2)}\n`);
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const BASE='526547698894de0d33d09447aed0b93b83558114';
const ROOT='content/interpretation/iching/corpus';
const REVIEW='content/production/symbolic-method/human-review';
const hexagram=read(`${ROOT}/iching-depth-hexagram-editorial-candidates-v1.json`);
const line=read(`${ROOT}/iching-depth-line-editorial-candidates-v1.json`);
const results=read(`${REVIEW}/iching-depth-human-review-results-v2.json`);
const rubric=read(`${REVIEW}/iching-depth-human-review-rubric-v1.json`);
const contract=read(`${REVIEW}/iching-depth-human-review-evidence-contract-v2.json`);
const attestationPath=`${REVIEW}/iching-depth-human-review-aggregate-attestation-v1.json`;
const attestation=read(attestationPath);
const target=`${ROOT}/iching-depth-admitted-editorial-corpus-v2.json`;
const predecessor=`${ROOT}/iching-depth-admitted-editorial-corpus-v1.json`;
const candidates=new Map([...hexagram.entries,...line.entries].map(entry=>[entry.interpretationId,entry]));
const criterionIds=rubric.criteria.map(item=>item.id);
const candidateBindings=[...candidates.values()].map(candidate=>({interpretationId:candidate.interpretationId,candidateDigest:digest(candidate)})).sort((a,b)=>a.interpretationId.localeCompare(b.interpretationId));
const candidateSetDigest=digest(candidateBindings);

assert.equal(results.schemaVersion,'PHI-OS-ICHI-DEPTH-HUMAN-REVIEW-RESULTS-v2.0.0');
assert.equal(results.baselineCommit,BASE);
assert.equal(results.successorOf,`${REVIEW}/iching-depth-human-review-results-v1.json`);
assert.equal(results.historicalPredecessorMutated,false);
assert.equal(results.humanReviewed,448);
assert.equal(results.accepted,448);
assert.equal(results.rejected,0);
assert.equal(results.needsFix,0);
assert.equal(results.criticalBoundaryFailures,0);
assert.equal(results.humanAcceptanceComplete,true);
assert.equal(results.productionPromotionAllowed,false);
assert.equal(results.publicRunAllowed,false);
assert.equal(results.sessions.length,448);
assert.equal(contract.carrierSuccessor.semanticRubricCriteriaChanged,false);
assert.equal(contract.carrierSuccessor.acceptanceThresholdChanged,false);
assert.equal(contract.carrierSuccessor.criticalBoundaryToleranceChanged,false);
assert.equal(attestation.status,'HUMAN_ATTESTED_448_OF_448_ACCEPTED');
assert.equal(attestation.reviewer.reviewerId,'TL');
assert.equal(attestation.baselineCommit,BASE);
assert.equal(attestation.attestation.accepted,448);
assert.equal(attestation.attestation.criticalBoundaryFailures,0);
assert.equal(attestation.candidateSet.count,448);
assert.equal(attestation.candidateSet.candidateSetDigest,candidateSetDigest);
assert.deepEqual(attestation.candidateSet.bindings,candidateBindings);
assert.equal(attestation.productionBoundary.publicRunAllowed,false);
const attestationDigest=sha(attestationPath);

const accepted=[];
for(const row of results.sessions){
  assert.equal(row.decision,'ACCEPTED',`${row.sessionId}: all 448 must be accepted`);
  const candidate=candidates.get(row.interpretationId);
  assert.ok(candidate,`${row.sessionId}: candidate missing`);
  assert.equal(row.humanReviewed,true,`${row.sessionId}: real human review required`);
  assert.equal(row.reviewerId,attestation.reviewer.reviewerId,`${row.sessionId}: reviewer drift`);
  assert.equal(row.reviewedAt,attestation.reviewer.reviewedAt,`${row.sessionId}: review timestamp drift`);
  assert.equal(row.reviewSourceSha,BASE,`${row.sessionId}: review source SHA drift`);
  assert.equal(row.reviewEnvironment,'OFFLINE_GROUPED_REVIEW_WORKSPACE_AND_CHAT_ATTESTATION',`${row.sessionId}: review environment invalid`);
  assert.equal(row.evidenceMode,'AGGREGATE_REVIEWER_ATTESTATION',`${row.sessionId}: aggregate evidence mode required`);
  assert.equal(row.aggregateAttestation?.path,attestationPath,`${row.sessionId}: attestation path drift`);
  assert.equal(row.aggregateAttestation?.sha256,attestationDigest,`${row.sessionId}: attestation digest drift`);
  assert.equal(row.aggregateAttestation?.candidateSetDigest,candidateSetDigest,`${row.sessionId}: candidate-set digest drift`);
  assert.ok(Array.isArray(row.evidenceRefs)&&row.evidenceRefs.includes(`${attestationPath}#${row.sessionId}`),`${row.sessionId}: reviewer evidence ref required`);
  assert.equal(row.candidateDigest,digest(candidate),`${row.sessionId}: candidate digest drift`);
  assert.deepEqual(new Set(row.sourceClaimIds),new Set(candidate.sourceBindings.sourceClaimRefs),`${row.sessionId}: source claim evidence drift`);
  for(const id of criterionIds) assert.equal(row.criteria?.[id],true,`${row.sessionId}: criterion ${id} must pass`);
  assert.equal(row.criticalBoundaryFailure,false,`${row.sessionId}: critical boundary failure blocks admission`);
  accepted.push({
    ...structuredClone(candidate),
    review:{
      status:'HUMAN_APPROVED',humanApproved:true,reviewer:row.reviewerId,reviewedAt:row.reviewedAt,
      sourceFidelityChecked:true,localeFidelityChecked:true,boundaryChecked:true,
      evidenceMode:row.evidenceMode,evidenceRefs:[...row.evidenceRefs],candidateDigest:row.candidateDigest
    },
    publicationProjectionRules:{
      omitInternalCandidateReviewStatusWarning:true,
      preserveSubstantiveBoundaryWarnings:true,
      mayCreateNewMeaning:false
    }
  });
}

const hexagramCount=accepted.filter(entry=>entry.scope==='HEXAGRAM').length;
const lineCount=accepted.filter(entry=>entry.scope==='LINE').length;
assert.equal(hexagramCount,64);assert.equal(lineCount,384);assert.equal(accepted.length,448);
write(target,{
  schemaVersion:'PHI-OS-ICHI-DEPTH-ADMITTED-EDITORIAL-CORPUS-v2.0.0',
  phase:'ICHI-DEPTH',work:'ICHI-DEPTH-W10',baselineCommit:BASE,status:'448_OF_448_HUMAN_APPROVED_ADMITTED_EXTERNAL_ACTIVATION_GATES_PENDING',
  corpusVersion:'2.0.0',methodCode:'I_CHING',successorOf:predecessor,historicalPredecessorMutated:false,
  candidateSources:[`${ROOT}/iching-depth-hexagram-editorial-candidates-v1.json`,`${ROOT}/iching-depth-line-editorial-candidates-v1.json`],
  reviewResults:`${REVIEW}/iching-depth-human-review-results-v2.json`,reviewAttestation:attestationPath,
  coverage:{hexagram:`${hexagramCount}/64`,line:`${lineCount}/384`,total:`${accepted.length}/448`,zhHans:`${accepted.length}/448`,en:`${accepted.length}/448`},
  humanEditorialComplete:true,publicRuntimeBound:false,productionAuthorityChanged:false,
  publicationProjectionPolicy:{internalCandidateReviewStatusWarningMayBeOmitted:true,substantiveBoundaryWarningsMustRemain:true,semanticMeaningMayNotBeRewritten:true},
  entries:accepted
});

console.log(`✓ ICHI-DEPTH-W9/W10 admitted ${accepted.length}/448 human-approved editorial entries (${hexagramCount}/64 hexagram, ${lineCount}/384 line).`);
console.log('  Aggregate attestation is bound to every exact candidate digest; no screenshot evidence was fabricated.');
console.log('  Admission remains separate from public execution / production activation authority.');
