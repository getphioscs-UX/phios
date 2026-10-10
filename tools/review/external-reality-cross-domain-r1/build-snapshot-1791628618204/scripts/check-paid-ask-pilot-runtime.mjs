import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPaidAskPilotEvent,aggregatePaidAskPilot,evaluatePaidAskPilotGate} from '../functions/_lib/paid-ask-pilot.js';

const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const contract=read('content/ai-economics/paid-ask/contracts/paid-ask-pilot-cohort-v1.json');
const fixture=read('content/ai-economics/paid-ask/fixtures/paid-ask-controlled-preflight-v1.json');
const controlled=fixture.events.map(createPaidAskPilotEvent);
const controlledSummary=aggregatePaidAskPilot(controlled);
assert.equal(controlledSummary.realEventCount,0);
assert.equal(controlledSummary.nonRealEventCount,4);
const controlledGate=evaluatePaidAskPilotGate(controlledSummary,contract);
assert.equal(controlledGate.accepted,false);
assert.equal(controlledGate.syntheticEvidenceMaySatisfyGate,false);
assert.ok(controlledGate.reasons.includes('REAL_REQUEST_MINIMUM_NOT_MET'));
assert.throws(()=>createPaidAskPilotEvent({eventId:'X',requestId:'X',evidenceClass:'REAL_PRODUCTION_EVENT',cohort:'REALITY',aiExecutionClass:'T3_DEEP_COMPOSITION',personalContextConsumed:true,explicitContextAuthorization:false}),/PASK_SILENT_CONTEXT_FORBIDDEN/);
assert.throws(()=>createPaidAskPilotEvent({eventId:'Y',requestId:'Y',evidenceClass:'REAL_PRODUCTION_EVENT',cohort:'PLUS',aiExecutionClass:'T2_LIGHT_COMPOSITION',providerAttemptCount:2}),/PASK_MULTI_PROVIDER_WITHOUT_FAILURE/);

const classes=['T0_DETERMINISTIC','T1_CANONICAL_ASSEMBLY','T2_LIGHT_COMPOSITION','T3_DEEP_COMPOSITION'];
const cohorts=['FREE','CREDIT','PLUS','REALITY'];
const eligible=Array.from({length:100},(_,index)=>createPaidAskPilotEvent({
  eventId:`TEST-${index}`,requestId:`TEST-REQ-${index}`,evidenceClass:'REAL_PRODUCTION_EVENT',
  cohort:cohorts[index%4],aiExecutionClass:classes[index%4],providerId:index%4<2?null:'FIXTURE_PROVIDER',
  providerAttemptCount:index%4<2?0:1,providerCostUsd:index%4<2?0:0.002,latencyMs:100,
  answerDelivered:true,directAnswerAccepted:true,claimGuardPassed:true,humanAccepted:true,
  creditsGranted:2,creditsDebited:index%4<2?0:1,creditDebitCorrect:true,
  upgradeOffered:index%5===0,upgradeCompleted:index%10===0,abandoned:false,repeatUse:index%2===0,
  revenueMyr:index%4<2?0:1,personalContextConsumed:false,explicitContextAuthorization:false
}));
const eligibleGate=evaluatePaidAskPilotGate(aggregatePaidAskPilot(eligible),contract);
assert.equal(eligibleGate.accepted,true);
console.log('✓ Paid Ask pilot event ingestion, aggregation and real-evidence gate behavior passed.');
console.log('  Controlled replay cannot satisfy the gate; silent context and unrecorded multi-provider attempts fail closed.');
