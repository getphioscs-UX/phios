import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const j=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const p=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
const ev=j('content/zi-wei-runtime/evidence/zi-wei-human-freeze-evidence-v1.json');
const acc=j('content/zi-wei-runtime/acceptance/zwr-w2h-human-policy-freeze-acceptance-v1.json');
assert.equal(p.status,'HUMAN_FROZEN');
assert.equal(p.freezeGate.state,'HUMAN_FROZEN');
assert.equal(p.freezeGate.frozenDecisionCount,10);
assert.equal(p.freezeGate.allRequiredDecisionsFrozen,true);
assert.equal(p.freezeGate.downstreamPolicyConsumptionAllowed,true);
assert.equal(p.freezeGate.calculationRuntimeActivationGranted,false);
assert.equal(p.freezeGate.productionActivationGranted,false);
const expected={
 CALENDAR_CONVENTION:'CHINESE_LUNISOLAR_NATAL_V1',
 LUNAR_CONVERSION:'HKO_GREGORIAN_LUNAR_TABLE_V1',
 LEAP_MONTH_POLICY:'LEAP_MONTH_SPLIT_15_16_V1',
 DAY_BOUNDARY:'ZI_INITIAL_23_00_NEXT_DAY_V1',
 BIRTH_HOUR_BOUNDARY:'TWELVE_DOUBLE_HOURS_LOCAL_CIVIL_V1',
 PALACE_CONSTRUCTION:'STANDARD_YIN_MONTH_REVERSE_HOUR_PALACES_V1',
 MAIN_STAR_SYSTEM:'STANDARD_14_MAIN_STARS_FIVE_ELEMENT_BUREAU_V1',
 AUXILIARY_STAR_SCOPE:'SIX_SUPPORT_STARS_V1',
 TRANSFORMATION_SCOPE:'BIRTH_YEAR_STEM_FOUR_TRANSFORMATIONS_SOUTHERN_TABLE_V1',
 DYNAMIC_PERIOD_SCOPE:'NATAL_ONLY_V1'
};
const evidenceIds=new Set(ev.entries.map(x=>x.evidenceId));
for(const e of p.requiredPolicies){
 assert.equal(e.frozen,true,e.policyCode);
 assert.equal(e.status,'HUMAN_FROZEN',e.policyCode);
 assert.equal(e.decision.code,expected[e.policyCode],e.policyCode);
 assert.equal(e.approver,'PHI_OS_HUMAN_APPROVER');
 assert.ok(!Number.isNaN(Date.parse(e.approvedAt)));
 assert.ok(e.rationale.length>20);
 assert.ok(e.evidenceRefs.length>0);
 for(const ref of e.evidenceRefs) assert.ok(evidenceIds.has(ref),`unknown evidence ${ref}`);
}
assert.equal(p.requiredPolicies.find(x=>x.policyCode==='BIRTH_HOUR_BOUNDARY').decision.trueSolarTimeCorrection,false);
assert.equal(p.requiredPolicies.find(x=>x.policyCode==='DAY_BOUNDARY').decision.boundary,'23:00:00');
assert.equal(p.requiredPolicies.find(x=>x.policyCode==='LEAP_MONTH_POLICY').decision.day16ToEndMonthTreatment,'NEXT_LUNAR_MONTH');
assert.deepEqual(p.requiredPolicies.find(x=>x.policyCode==='AUXILIARY_STAR_SCOPE').decision.included,['ZUO_FU','YOU_BI','WEN_CHANG','WEN_QU','TIAN_KUI','TIAN_YUE']);
assert.equal(p.requiredPolicies.find(x=>x.policyCode==='TRANSFORMATION_SCOPE').decision.schoolLabel,'SOUTHERN_TABLE');
assert.equal(p.requiredPolicies.find(x=>x.policyCode==='DYNAMIC_PERIOD_SCOPE').decision.dynamicCalculationAuthorityGranted,false);
assert.ok(ev.entries.every(x=>x.calculationRuleAuthority===false));
assert.equal(acc.status,'HUMAN_POLICY_FROZEN_RUNTIME_STILL_BLOCKED');
assert.equal(acc.invariants.calculationRuntimeActivationGranted,false);
assert.equal(acc.invariants.productionActivationGranted,false);
console.log('✓ ZWR-W2H Human Policy Freeze passed: 10/10 PHI OS v1 decisions frozen.');
console.log('  Policy consumption is allowed; actual Zi Wei calculation and Production remain blocked pending W5A/W6A/W7 implementation + fixtures.');
