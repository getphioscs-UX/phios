import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const h=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const freeze=j('content/professional/core-method-runtime/iching-runtime-freeze-v1.json');
const manifest=j('content/professional/core-method-runtime/iching-runtime-manifest-v1.json');
const state=j('content/professional/core-method-runtime/iching-runtime-state-successor-v1.json');
const acceptance=j('content/professional/core-method-runtime/iching-machine-acceptance-v1.json');
const pkg=j('package.json');
assert.equal(freeze.work,'ICH-W13'); assert.equal(freeze.status,'I Ching Runtime Frozen v1');
assert.equal(freeze.freezeVersion,'1.0.0'); assert.equal(freeze.productionStatus,'NOT_ACTIVATED');
assert.equal(freeze.executionBoundary,'STRUCTURAL_VALIDATION_ONLY'); assert.equal(freeze.sourceNeutral,true);
assert.deepEqual(freeze.completedWorks,Array.from({length:14},(_,i)=>`ICH-W${i}`));
for (const f of freeze.frozenScope) { assert.ok(fs.existsSync(f.path),`missing frozen file ${f.path}`); assert.equal(h(f.path),f.sha256,`ICH-W13 digest drift: ${f.path}`); }
assert.equal(freeze.invariants.methodIdentity,'I_CHING'); assert.equal(freeze.invariants.pluginIdentity,'ICH'); assert.equal(freeze.invariants.projectionType,'HEXAGRAM');
assert.equal(freeze.invariants.secondIChingIdentityAllowed,false); assert.equal(freeze.invariants.dedicatedIChingProjectionRuntimeAllowed,false); assert.equal(freeze.invariants.sharedProjectionRuntimeRequired,true);
assert.equal(freeze.invariants.systemRandomRerollInsideCalculationAllowed,false); assert.equal(freeze.invariants.interpretationInsideCalculationAllowed,false); assert.equal(freeze.invariants.sourceTextRequiredForStructuralRuntime,false);
assert.equal(manifest.status,'I_CHING_RUNTIME_FROZEN_V1_VALIDATION_ONLY'); assert.equal(manifest.activation.structuralRuntimeImplemented,true); assert.equal(manifest.activation.interpretationImplemented,false); assert.equal(manifest.activation.productionExecutionAllowed,false);
assert.equal(state.status,'STRUCTURAL_RUNTIME_IMPLEMENTED_NOT_ACTIVATED'); assert.equal(state.currentState.productionActivation,'NOT_ACTIVATED'); assert.equal(state.rules.predecessorMutationAllowed,false);
for (const cmd of [...acceptance.requiredCommands,...acceptance.additionalCommands]) assert.ok(pkg.scripts[cmd],`missing package script ${cmd}`);
const collisions=[];
for (const base of ['content','functions']) {
  const walk=d=>{if(!fs.existsSync(d))return; for(const ent of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,ent.name); if(ent.isDirectory())walk(p); else if(/i[-_]?ching.*projection.*runtime/i.test(ent.name))collisions.push(p.replaceAll('\\','/'));}};
  walk(base);
}
assert.deepEqual(collisions,[],'Dedicated I Ching projection runtime is forbidden.');
console.log(`✓ ICH-W10/W11/W13 Source-neutral Machine Acceptance + Freeze passed: ${freeze.frozenScope.length} frozen artifacts.`);
console.log('  I Ching Runtime Frozen v1; calculation/projection are structural only and production/public/professional activation remain closed.');
