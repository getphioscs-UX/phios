import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {
  KAP_COMPLEXITY_SIGNAL_CODES,KAP_COMPLEXITY_DIMENSIONS,
  detectComplexitySignals,calculateComplexityScore,testRealityModelRequirement,
  evaluateRealityComplexityGate,normalizeRealityComplexityRequest
} from '../functions/_lib/knowledge-reality-complexity.js';
import {onRequestPost as complexityApi} from '../functions/api/reality-complexity.js';

const requested=String(process.argv[2]||'ALL').toUpperCase();
const ROOT='content/knowledge/answer-projection';
const read=p=>fs.readFileSync(p,'utf8');
const j=p=>JSON.parse(read(p));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run=(code,fn)=>{if(requested==='ALL'||requested===code){fn();console.log(`✓ KAP-${code} passed.`);}};

const expectedSignals=['MULTIPLE_PEOPLE','MULTIPLE_ROLES','MULTIPLE_ORGANIZATIONS','MULTIPLE_RELATIONSHIPS','MULTIPLE_GOALS','MULTIPLE_CONSTRAINTS','GOAL_CONFLICT','LONG_TIMELINE','REPEAT_PATTERN','FEEDBACK_LOOPS','UNCLEAR_CAUSAL_STRUCTURE','MULTIPLE_INTERVENTIONS','HIGH_CONSEQUENCE_DECISIONS','PERSISTENT_UNRESOLVED_STATE'];
const expectedDimensions=['entityCount','relationshipCount','constraintCount','timeDepth','goalConflict','uncertainty','dependency','repetition','decisionConsequence','feedbackLoopPresence'];

run('W23',()=>{
  const c=j(`${ROOT}/contracts/kap-w23-complexity-signals-contract-v1.json`);
  assert.equal(c.status,'ACTIVE_ROUTING_SIGNALS_NOT_REALITY_TRUTH');
  assert.deepEqual(c.signals,expectedSignals);assert.deepEqual(KAP_COMPLEXITY_SIGNAL_CODES,expectedSignals);
  const low=detectComplexitySignals({question:'Why am I tired today?'});assert.equal(low.activeSignalCount,0);assert.equal(low.governance.routingSignalOnly,true);assert.equal(low.governance.realityTruthCreated,false);
  const rich=detectComplexitySignals({structuredContext:{peopleCount:3,roleCount:2,organizationCount:2,relationshipCount:4,goalCount:3,constraintCount:4,goalConflict:true,longTimeline:true,repeatPattern:true,feedbackLoopPresence:true,unclearCausalStructure:true,interventionCount:3,highConsequenceDecision:true,persistentUnresolvedState:true}});
  assert.ok(rich.activeSignalCount>=12);assert.equal(rich.signals.MULTIPLE_PEOPLE,true);assert.equal(rich.signals.FEEDBACK_LOOPS,true);assert.equal(rich.signals.PERSISTENT_UNRESOLVED_STATE,true);
});

run('W25',()=>{
  const c=j(`${ROOT}/contracts/kap-w25-complexity-score-contract-v1.json`);assert.equal(c.authority.scoreIsRealityTruth,false);assert.deepEqual(c.dimensions,expectedDimensions);assert.deepEqual(KAP_COMPLEXITY_DIMENSIONS,expectedDimensions);
  const low=evaluateRealityComplexityGate({question:'Why am I tired today?'});assert.equal(low.complexityScore.classification,'LOW');
  const medium=evaluateRealityComplexityGate({structuredContext:{peopleCount:2,relationshipCount:2,constraintCount:2,longTimeline:true,uncertainty:2,dependency:1}});assert.equal(medium.complexityScore.classification,'MEDIUM');
  const highNo=evaluateRealityComplexityGate({structuredContext:{peopleCount:4,organizationCount:2,relationshipCount:4,goalCount:3,constraintCount:5,goalConflict:true,interventionCount:3,highConsequenceDecision:true,dependency:3,uncertainty:2}});
  assert.equal(highNo.complexityScore.classification,'HIGH');assert.equal(highNo.realityModelRequirement.requirement,'NO');assert.equal(highNo.complexityScore.governance.scoreAloneMayRequireRealityModel,false);
});

run('W24',()=>{
  const c=j(`${ROOT}/contracts/kap-w24-reality-model-requirement-test-contract-v1.json`);assert.equal(c.status,'ACTIVE_FINAL_COMPLEXITY_CONFIRMATION_GATE');assert.equal(c.decisionRule.scoreDecisive,false);
  const highNo=evaluateRealityComplexityGate({structuredContext:{peopleCount:4,organizationCount:2,relationshipCount:4,goalCount:3,constraintCount:5,goalConflict:true,interventionCount:3,highConsequenceDecision:true,dependency:3,uncertainty:2},w22StopCondition:{status:'REALITY_MODEL_REQUIRED'}});
  assert.equal(highNo.complexityScore.classification,'HIGH');assert.equal(highNo.realityModelRequirement.requirement,'NO');assert.equal(highNo.realityModelRequirement.w22Candidate.authoritativeFinalRoute,false);assert.ok(highNo.realityModelRequirement.reasonCodes.includes('W22_CANDIDATE_REQUIRES_W24_CONFIRMATION'));
  const yes=evaluateRealityComplexityGate({structuredContext:{peopleCount:4,relationshipCount:4,goalCount:3,constraintCount:5,goalConflict:true,longTimeline:true,repeatPattern:true,feedbackLoopPresence:true,unclearCausalStructure:true,interventionCount:3,highConsequenceDecision:true,persistentUnresolvedState:true}});
  assert.equal(yes.realityModelRequirement.requirement,'YES');assert.equal(yes.route,'REALITY_JOURNEY_CANDIDATE');assert.equal(yes.realityModelRequirement.handoff.automaticRealityJourney,false);assert.equal(yes.realityModelRequirement.handoff.requiresExplicitEscalationConsent,true);assert.equal(yes.realityModelRequirement.governance.realityModelCreated,false);
});

if(requested==='ALL'){
  const policy=j(`${ROOT}/registries/kap-w23-w25-reality-complexity-policy-v1.json`);assert.deepEqual(policy.steps,['KAP-W23','KAP-W24','KAP-W25']);assert.equal(policy.production.aiRequired,false);assert.equal(policy.production.persistentStorage,false);
  const successor=j(`${ROOT}/reconciliation/kap-w22-w23-reality-complexity-successor-v1.json`);assert.equal(successor.predecessor.mutated,false);assert.equal(successor.semanticReconciliation.automaticEscalation,false);
  const request=normalizeRealityComplexityRequest({schemaVersion:'PHI-OS-KAP-REALITY-COMPLEXITY-REQUEST-v1.0.0',structuredContext:{peopleCount:3,relationshipCount:3,constraintCount:3,longTimeline:true,feedbackLoopPresence:true,unclearCausalStructure:true,goalConflict:true}});assert.equal(request.schemaVersion,'PHI-OS-KAP-REALITY-COMPLEXITY-REQUEST-v1.0.0');
  const apiResponse=await complexityApi({request:new Request('https://phios.local/api/reality-complexity',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(request)})});const payload=await apiResponse.json();assert.equal(apiResponse.status,200);assert.equal(payload.ok,true);assert.equal(payload.capability,'REALITY_COMPLEXITY_GATE');
  const runtime=read('functions/_lib/knowledge-reality-complexity.js');const api=read('functions/api/reality-complexity.js');
  assert.doesNotMatch(runtime,/OPENAI|Workers AI|providerPrompt|modelPrompt|D1|KV|R2|INSERT INTO|UPDATE /i);assert.doesNotMatch(api,/OPENAI|console\\.log|console\\.error|stackTrace|secret/i);
  const predecessorFreeze=`${ROOT}/freeze/kap-w18-w22-guided-reading-freeze-v1.json`;const acceptance=j(`${ROOT}/acceptance/kap-w23-w25-reality-complexity-acceptance-v1.json`);const freeze=j(`${ROOT}/freeze/kap-w23-w25-reality-complexity-freeze-v1.json`);
  assert.equal(sha(predecessorFreeze),freeze.predecessorEvidence[0].sha256);assert.equal(acceptance.status,'ACCEPTED_COMPLEXITY_GATE_W24_DECISIVE_SCORE_ROUTING_AID_ONLY');
  for(const item of freeze.frozenOutputs)assert.equal(sha(item.path),item.sha256,`KAP Complexity frozen output drift: ${item.path}`);
  const pkg=j('package.json');assert.equal(pkg.scripts['check:kap-w23'],'node scripts/check-kap-reality-complexity.mjs W23');assert.equal(pkg.scripts['check:kap-w24'],'node scripts/check-kap-reality-complexity.mjs W24');assert.equal(pkg.scripts['check:kap-w25'],'node scripts/check-kap-reality-complexity.mjs W25');assert.match(pkg.scripts['check:kap'],/check:kap-guided && npm run check:kap-complexity$/);
  console.log('✓ KAP-W23-W25 Reality Complexity accepted: W23 signals are routing observations, W25 score is non-decisive, and only W24 confirms persistent Reality Model requirement.');
}
