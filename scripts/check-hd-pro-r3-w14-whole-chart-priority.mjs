import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prioritizeHumanDesignR3WholeChart,HD_R3_PRIORITY_VERSION} from '../functions/external-profile/human-design-r3-whole-chart-priority.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const policy=read(`${ROOT}/priority/HD-PRO-R3-W14-whole-chart-priority-policy-v1.json`);
const fixture=read(`${ROOT}/priority/HD-PRO-R3-W14-whole-chart-priority-fixture-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v11.json`);
const historical=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v10.json`);

assert.equal(policy.baselineCommit,'ba3ac00864644f7ac7861df59ce8c35db7ebad97');
assert.deepEqual(policy.outputTiers,['PRIMARY_FINDINGS','SECONDARY_FINDINGS','CONTEXTUAL_FINDINGS','ADVANCED_DETAILS']);
assert.deepEqual(policy.primaryRange,{min:5,max:8,defaultTarget:6});
assert.equal(policy.determinism.opaqueScoreAllowed,false);
assert.equal(policy.determinism.percentageConfidenceAllowed,false);
assert.equal(policy.determinism.summedMysteryWeightsAllowed,false);
assert.equal(policy.advancedRule,'VARIABLE_PHS_NEVER_OVERRIDES_CORE');

const first=prioritizeHumanDesignR3WholeChart(fixture.facts,{customerIntent:fixture.facts.customerIntent});
const second=prioritizeHumanDesignR3WholeChart(JSON.parse(JSON.stringify(fixture.facts)),{customerIntent:fixture.facts.customerIntent});
assert.equal(first.schemaVersion,HD_R3_PRIORITY_VERSION);
assert.deepEqual(first,second,'W14 priority must be deterministic');
assert.equal(first.primaryFindings.length,6);
assert(first.primaryFindings.length>=fixture.expected.primaryMin&&first.primaryFindings.length<=fixture.expected.primaryMax);
assert(first.secondaryFindings.length>=1,'fixture should prove Secondary tier');
assert(first.contextualFindings.length>=1,'fixture should prove Contextual tier');
assert(first.advancedDetails.length>=1,'fixture should prove Advanced tier');
assert(first.primaryFindings.some(x=>x.domains.includes('DECISION')),'decision finding missing from primary');
assert(first.primaryFindings.some(x=>x.domains.includes('ENGAGEMENT')),'engagement finding missing from primary');
assert(first.primaryFindings.some(x=>x.domains.includes('ROLE')),'role finding missing from primary');
assert(first.primaryFindings.some(x=>x.domains.includes('INTEGRATION')),'definition/integration finding missing from primary');
assert(first.primaryFindings.some(x=>x.domains.includes('STRUCTURE')),'complete-channel structure finding missing from primary');
for(const f of [...first.primaryFindings,...first.secondaryFindings,...first.contextualFindings,...first.advancedDetails]){
  for(const k of ['finding','whyThisAppears','structuralEvidence','howStructuresCombine','realLifeExpression','whatWouldContradictIt']) assert(k in f,`finding missing ${k}`);
  assert(Array.isArray(f.technicalRefs.claimIds)&&f.technicalRefs.claimIds.length>=1);
  assert(Array.isArray(f.technicalRefs.structureRefs)&&f.technicalRefs.structureRefs.length>=2);
  assert(Array.isArray(f.technicalRefs.sourceRefs)&&f.technicalRefs.sourceRefs.length>=1);
  assert(Array.isArray(f.technicalRefs.compositionRuleIds)&&f.technicalRefs.compositionRuleIds.length>=1);
  assert.equal(f.pseudoPrecisionScore,null);
}
assert(first.advancedDetails.every(x=>x.tier==='ADVANCED'));
assert.equal(first.priorityPolicy.usesOpaqueScore,false);
assert.equal(first.priorityPolicy.usesPercentageConfidence,false);
assert.equal(first.priorityPolicy.advancedVariableCanOverrideCore,false);
assert.equal(first.publication.customerPublishableR3,false);
assert.equal(first.publication.machineVerified,false);
assert.equal(first.publication.humanAccepted,false);

assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v11.0.0');
assert.equal(status.updatedByWork,'HD-PRO-R3-W14');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v10.json`);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W13');
assert.equal(status.aggregate.wholeChartPriorityEngineActive,true);
assert.equal(status.aggregate.wholeChartPriorityUsesOpaqueScore,false);
assert.equal(status.aggregate.wholeChartPrimaryFindingDefaultTarget,6);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W15 Professional Reading IR v2');

console.log('✓ HD-PRO-R3-W14 Whole-Chart Priority Engine passed.');
console.log(`  ${first.primaryFindings.length} primary findings selected within the 5–8 default range; Secondary, Contextual and Advanced tiers remain available, and ranking is deterministic without customer-facing mystery scores.`);
