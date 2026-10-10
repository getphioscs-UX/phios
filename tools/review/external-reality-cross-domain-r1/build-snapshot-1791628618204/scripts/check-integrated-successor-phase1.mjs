import assert from 'node:assert/strict';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const baseline='ad5e3df2f437ff40b72055af289b99880d13d8b6';
const registry=j('content/governance/integrated-successor/registries/phase1-cx-current-system-registry-v1.json');
const acceptance=j('content/governance/integrated-successor/acceptance/phase1-cx-current-system-acceptance-v1.json');
const freeze=j('content/governance/integrated-successor/freeze/phase1-cx-current-system-freeze-v1.json');
for(const x of [registry,acceptance,freeze])assert.equal(x.baselineCommit,baseline);
assert.equal(registry.status,'ENGINEERING_COMPLETE_FINAL_FREEZE_FAIL_CLOSED');
assert.equal(acceptance.status,'ENGINEERING_ACCEPTED_FINAL_FREEZE_BLOCKED');
assert.equal(freeze.status,'ENGINEERING_SCOPE_FROZEN_FINAL_CUSTOMER_FREEZE_PENDING');
assert.match(freeze.exit,/READY_FOR_PHASE2_KIR_R2_ENGINEERING/);
const byId=new Map((registry.phases||[]).map(x=>[x.phase,x]));
for(const id of acceptance.verifiedCurrent){const x=byId.get(id);assert(x,`missing verified phase ${id}`);assert.equal(x.state,'VERIFIED_CURRENT',`${id} current state drift`)}
for(const id of acceptance.implementedNow){const x=byId.get(id);assert(x,`missing implemented phase ${id}`);assert.match(x.state,/ENGINEERING_COMPLETE|CURRENT_CUTOVER_RECONCILED|CURRENT_RETIREMENT_RECONCILED|MACHINE_PARITY_COMPLETE|PROTECTION_ACTIVE/,`${id} implementation state drift`)}
assert.equal(byId.get('CX-R23')?.state,'HUMAN_VISUAL_PENDING');
assert.equal(byId.get('CX-R28')?.state,'FULL_REPOSITORY_REGRESSION_PENDING');
assert.equal(byId.get('CX-R29')?.state,'CORRECTLY_BLOCKED');
assert.equal(acceptance.pwsRetirementCheckerReconciled,true);
assert.equal(acceptance.humanVisualAcceptedClaimed,false);
assert.equal(acceptance.fullNpmRunCheckPassClaimed,false);
assert.match(registry.principle,/DO_NOT_RESTORE_RETIRED_PRESENTATION/);
assert(freeze.prohibitions.some(x=>/do not restore retired legacy files/i.test(x)));
assert(freeze.prohibitions.some(x=>/do not build a second customer shell/i.test(x)));
console.log('✓ Integrated successor PHASE 1 CX current-system registry, acceptance and fail-closed freeze passed.');
