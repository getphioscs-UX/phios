import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const evidence=read('content/ai-economics/paid-ask/evidence/paid-ask-existing-real-evidence-calibration-v1.json');
assert.equal(evidence.status,'REAL_PROVIDER_AND_RELEVANCE_CALIBRATION_AVAILABLE_NOT_PAID_COHORT_EVIDENCE');
for(const source of evidence.sources){
  assert.equal(source.sha256,crypto.createHash('sha256').update(fs.readFileSync(source.path,'utf8')).digest('hex'),source.path);
}
assert.equal(evidence.liveCompositionCalibration.requestCount,100);
assert.equal(evidence.liveCompositionCalibration.guardPassed,100);
assert.equal(Object.values(evidence.liveCompositionCalibration.providerDistribution).reduce((sum,value)=>sum+value,0),100);
assert.equal(evidence.observedProviderCostCalibration.comparedQuestionCount,24);
assert.ok(evidence.observedProviderCostCalibration.totalCostUsdObserved>0);
assert.equal(evidence.relevanceCalibration.effectiveAccepted,100);
assert.equal(evidence.relevanceCalibration.effectiveTotal,100);
assert.equal(evidence.relevanceCalibration.criticalFailures,0);
assert.equal(evidence.paidPilotBoundary.paidCohortParticipantsObserved,0);
assert.equal(evidence.paidPilotBoundary.maySatisfyPaidAskAcceptance,false);
console.log('✓ Paid Ask historical real-provider/relevance calibration passed.');
console.log('  Evidence is reusable calibration only and is not promoted to real paid-cohort acceptance.');
