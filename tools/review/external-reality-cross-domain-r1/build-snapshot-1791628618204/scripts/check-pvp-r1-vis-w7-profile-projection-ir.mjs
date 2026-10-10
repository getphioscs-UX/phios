import fs from 'node:fs';
import assert from 'node:assert/strict';
import { buildProfileCustomerVisualProjection, PROFILE_PFIG_ORDER, PROFILE_CUSTOMER_VISUAL_PROJECTION_SCHEMA } from '../functions/profile/profile-customer-visual-projection.js';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const root=json('content/product-visual-platform-r1/profile/ir/profile-customer-visual-projection-v1.json');
const owner=json('content/profile/customer-output/profile-ppr-visual-output-authority-v2.json');
const admission=json('content/product-visual-platform-r1/profile/pfig-authority-admission-v1.json');
const acceptance=json('content/product-visual-platform-r1/acceptance/pvp-r1-vis-w7-profile-projection-ir-v1.json');
assert.equal(root.schemaVersion,PROFILE_CUSTOMER_VISUAL_PROJECTION_SCHEMA);
assert.equal(root.truthOwner,'PROFILE_PPR');
assert.equal(root.projectionOwner,'PVP_R1');
assert.deepEqual(root.pfigOrder,PROFILE_PFIG_ORDER);
assert.equal(Object.keys(root.pfigContracts).length,9);
for(const id of PROFILE_PFIG_ORDER){
  assert.equal(admission.pfigStates[id],'AUTHORITY_ALLOWED');
  const path=root.pfigContracts[id];
  assert.ok(fs.existsSync(path),`${id} IR missing`);
  const ir=json(path);
  assert.equal(ir.pfig,id);
  assert.equal(ir.authorityState,'ALLOWED');
  assert.equal(ir.projectionState,'IR_READY');
}
assert.ok(owner.pfigAuthority.every(x=>x.authorityState==='ALLOWED'));
assert.equal(root.globalBoundaries.pvpMayInventMeaning,false);
assert.equal(root.globalBoundaries.pvpMayNormalizeAcrossInstruments,false);
assert.equal(root.globalBoundaries.pvpMayCreateUniversalMasterScore,false);
assert.equal(root.globalBoundaries.pvpMayFillMissingEvidence,false);
assert.equal(root.globalBoundaries.renderingImplementedByThisWork,false);
assert.equal(acceptance.counts.pfigTotal,9);
assert.equal(acceptance.counts.irReady,9);
assert.equal(acceptance.counts.blocked,0);

const progressive={participantRef:'P1',asOfDate:'2026-09-09T00:00:00Z',sourceLegend:[{sourceClass:'CUSTOMER_SELF_REPORT'}],signalCards:[
  {signalRef:'S1',sourceClass:'CUSTOMER_SELF_REPORT',providerFamily:'PHI_SELF_ASSESSMENT',domainId:'COGNITIVE_NAVIGATION',facetId:'PLANNING',value:{normalizedSelfReportIndex:70},assessmentDate:'2026-09-01',provenance:['A']},
  {signalRef:'S2',sourceClass:'CUSTOMER_SELF_REPORT',providerFamily:'PHI_SELF_ASSESSMENT',domainId:'COGNITIVE_NAVIGATION',facetId:'DECISION_DISCIPLINE',value:{normalizedSelfReportIndex:62},assessmentDate:'2026-09-01',provenance:['A']}
],careerInterest:{provider:'O_NET_WEB_SERVICES_V2',currentRealityPrompts:['What work context currently feels most sustainable?']},currentReality:{states:['CURRENTLY_RESONANT']},crossSource:{perspectives:[{id:'X1',group:'SOURCE_ALIGNED',sourceClasses:['CUSTOMER_SELF_REPORT','STANDARDIZED_SELF_REPORT'],signalRefs:['S1'],statement:'aligned'}]},relationshipProfile:{evidence:[{id:'R1',comparisonClass:'POTENTIAL_FRICTION_TARGET',statement:'observe friction',sourceClass:'CUSTOMER_SELF_REPORT'}]}};
const projection=buildProfileCustomerVisualProjection({progressiveView:progressive,confirmations:[{participantRef:'P1',signalRef:'S1',lensId:'DECISION_STEWARDSHIP',contextType:'WORK',confirmation:'BOTH',observedAt:'2026-09-09T00:00:00Z'}]});
assert.equal(projection.schemaVersion,PROFILE_CUSTOMER_VISUAL_PROJECTION_SCHEMA);
assert.deepEqual(projection.figures.map(x=>x.pfig),PROFILE_PFIG_ORDER);
assert.equal(projection.figures.length,9);
assert.ok(projection.figures.every(x=>['READY','EMPTY','UNKNOWN'].includes(x.state)));
assert.equal(projection.governance.truthOwner,'PROFILE_PPR');
assert.equal(projection.governance.pvpMeaningAuthorityCreated,false);
assert.equal(projection.governance.universalMasterScoreCreated,false);
assert.equal(projection.figures.find(x=>x.pfig==='PFIG-002').data.series.length,1);
assert.equal(projection.figures.find(x=>x.pfig==='PFIG-005').data.perspectives[0].projectionState,'CONVERGES');
assert.ok(projection.figures.find(x=>x.pfig==='PFIG-003').data.resources.length>=1);
const empty=buildProfileCustomerVisualProjection({customerOutput:{sourceScopedDimensions:[],tensionSignals:[],relationshipEvidence:null,careerInterest:null,contextEvidence:null,contradictions:[],realityQuestions:[]}});
assert.equal(empty.figures.length,9);
assert.ok(empty.figures.every(x=>x.state==='UNKNOWN'));
console.log('✓ PVP-R1-VIS-W7 Profile Projection IR passed.');
console.log('  profile-customer-visual-projection-v1 is frozen; PFIG-001–009 all have authority-safe visual IR contracts.');
console.log('  Synthetic builder regression preserves unknown/fail-closed behavior and creates no Profile meaning authority.');
