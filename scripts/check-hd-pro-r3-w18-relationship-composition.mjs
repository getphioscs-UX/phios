import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prioritizeHumanDesignR3WholeChart} from '../functions/external-profile/human-design-r3-whole-chart-priority.js';
import {composeHumanDesignR3SingleChartRelationship,HD_R3_RELATIONSHIP_VERSION} from '../functions/external-profile/human-design-r3-relationship-composition.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const contract=read(`${ROOT}/relationship/HD-PRO-R3-W18-single-chart-relationship-contract-v1.json`);
const fixture=read(`${ROOT}/relationship/HD-PRO-R3-W18-relationship-fixture-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v15.json`);
const historical=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v14.json`);

assert.equal(contract.baselineCommit,'ba3ac00864644f7ac7861df59ce8c35db7ebad97');
assert.equal(contract.scope,'SINGLE_CHART_RELATIONAL_INTERPRETATION_ONLY');
assert.equal(contract.secondChartAccepted,false);

const priority=prioritizeHumanDesignR3WholeChart(fixture.facts,{customerIntent:fixture.facts.customerIntent});
const first=composeHumanDesignR3SingleChartRelationship(fixture.facts,{priorityResult:priority});
const second=composeHumanDesignR3SingleChartRelationship(JSON.parse(JSON.stringify(fixture.facts)),{priorityResult:priority});
assert.equal(first.schemaVersion,HD_R3_RELATIONSHIP_VERSION);
assert.deepEqual(first,second);
assert.equal(first.scope,'SINGLE_CHART_RELATIONAL_INTERPRETATION');
assert(first.interpretations.length>=fixture.expected.minimumInterpretations);
const cats=new Set(first.interpretations.map(x=>x.category));
for(const c of ['RELATIONSHIP_EXPOSURE','UNDEFINED_CENTER_SENSITIVITY','PROJECTION_DYNAMICS','PROFILE_RELATIONAL_ROLE','CHANNEL_BASED_INTERACTION_STYLE','DECISION_PRESSURE_IN_RELATIONSHIPS']) assert(cats.has(c),`missing ${c}`);
for(const i of first.interpretations){
  assert(i.meaning?.en&&i.meaning?.zhHans); assert(i.observe?.en&&i.observe?.zhHans);
  assert(i.technicalRefs.findingIds.length>=1); assert(i.technicalRefs.claimIds.length>=1); assert(i.technicalRefs.sourceRefs.length>=1);
}
for(const [k,v] of Object.entries(first.boundaries)) if(k!=='futureOwner') assert.equal(v,false,`${k} should remain false`);
assert.throws(()=>composeHumanDesignR3SingleChartRelationship(fixture.facts,{priorityResult:priority,partnerChart:{type:'PROJECTOR'}}),/SINGLE_CHART_ONLY/);
const prose=JSON.stringify(first.interpretations).toLowerCase();
for(const term of ['86%','灵魂伴侣','命定关系','一定会分手','soulmate','destined relationship','will definitely break up']) assert(!prose.includes(term),`forbidden relationship prose: ${term}`);
assert.equal(first.publication.customerPublishableR3,false);

assert.equal(status.updatedByWork,'HD-PRO-R3-W18');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v14.json`);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W17');
assert.equal(status.aggregate.singleChartRelationshipCompositionActive,true);
assert.equal(status.aggregate.relationshipSecondChartAccepted,false);
assert.equal(status.aggregate.relationshipCompatibilityScoreAllowed,false);
assert.equal(status.aggregate.relationshipSoulmateClaimAllowed,false);
assert.equal(status.aggregate.relationshipBreakupPredictionAllowed,false);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W19 Epistemic + Sensitive-Domain Boundary');

console.log('✓ HD-PRO-R3-W18 Relationship Composition passed.');
console.log(`  ${first.interpretations.length} single-chart relational interpretations cover exposure, undefined sensitivity, projection/profile role, Channel interaction and decision pressure; second-chart compatibility and fate scoring remain blocked.`);
