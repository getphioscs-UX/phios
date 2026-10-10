import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const j=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const baseline='007fee6f24071d0653ce120be9ec832efc5c11a4';
const w0=j('content/professional/zi-wei-runtime/reconciliation/zi-wei-runtime-authority-baseline-v1.json');
assert.equal(w0.baselineCommit,baseline); assert.equal(w0.status,'FORMALLY_REOPENED_FOUNDATION_ONLY'); assert.equal(w0.currentReopening.productionActivated,false); assert.equal(w0.identityRule.singleZiWeiMethodIdentity,true);
const scope=j('content/professional/zi-wei-runtime/contracts/zi-wei-natal-structural-runtime-scope-v1.json');
assert.equal(scope.scopeCode,'ZI_WEI_NATAL_STRUCTURAL_RUNTIME_V1'); assert.equal(scope.productionEligible,false); assert.equal(scope.scopeRules.policyMustBeHumanFrozenBeforeCalculation,true);
const policy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
assert.equal(policy.methodCode,'ZI_WEI_DOU_SHU'); assert.equal(policy.freezeGate.mode,'HUMAN_ONLY'); assert.equal(policy.freezeGate.failClosed,true); assert.equal(policy.freezeGate.productionActivationGranted,false);
assert.equal(policy.requiredPolicies.length,10);
const frozen=policy.requiredPolicies.filter(x=>x.frozen===true).length;
assert.equal(policy.freezeGate.frozenDecisionCount,frozen);
if(frozen<10){ assert.equal(policy.status,'PENDING_HUMAN_FREEZE'); assert.equal(policy.freezeGate.downstreamPolicyConsumptionAllowed,false); }
const ev=j('content/professional/zi-wei-runtime/evidence/zi-wei-source-evidence-registry-v1.json');
assert.equal(ev.doctrinalRuleSourcesAdmitted,0); assert.equal(ev.externalWebsiteAsAuthorityAllowed,false); assert.ok(ev.entries.every(x=>x.calculationRuleAuthority===false));
const input=j('content/professional/zi-wei-runtime/contracts/zi-wei-canonical-input-contract-v1.json');
assert.equal(input.sourceObject,'CanonicalBirthInput'); assert.equal(input.adapterRules.guessMissingTime,false); assert.equal(input.adapterRules.deriveLunarDateBeforeW2Freeze,false); assert.equal(input.productionAuthorityGranted,false);
const c5=j('content/professional/zi-wei-runtime/contracts/zi-wei-calendar-conversion-runtime-contract-v1.json');
const c6=j('content/professional/zi-wei-runtime/contracts/zi-wei-palace-construction-runtime-contract-v1.json');
assert.equal(c5.currentExecutionAllowed,false); assert.equal(c6.currentExecutionAllowed,false);
const gate=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/policy-gate.js')).href);
let blocked=false; try{gate.assertZiWeiPolicyConsumable(policy);}catch(e){blocked=e.code==='ZWR_POLICY_NOT_HUMAN_FROZEN'; assert.equal(e.pendingPolicyCodes.length,10-frozen);} assert.equal(blocked,frozen<10,'policy gate must fail closed while pending');
const cal=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-calendar-conversion-runtime.js')).href);
const pal=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-palace-construction-runtime.js')).href);
if(frozen<10){
 for(const fn of [()=>cal.buildZiWeiCalendarRepresentation({birthDate:'1989-11-15'}),()=>pal.buildZiWeiPalaceStructure({})]){ let ok=false; try{fn();}catch(e){ok=e.code==='ZWR_POLICY_NOT_HUMAN_FROZEN';} assert.equal(ok,true); }
}
const acc=j('content/professional/zi-wei-runtime/acceptance/zwr-w0-w6-foundation-acceptance-v1.json');
assert.equal(acc.status,'ACCEPTED_FAIL_CLOSED_FOUNDATION'); assert.equal(acc.notAcceptedYet.calculationRuntimeActivated,false); assert.equal(acc.notAcceptedYet.productionActivated,false);
console.log(`✓ ZWR-W0–W6 fail-closed foundation passed (${frozen}/10 Human-frozen policy decisions).`);
console.log('  Zi Wei is formally reopened as one canonical method identity, but W5/W6 calculation remains blocked until W2 Human freeze + doctrinal rule admission.');
