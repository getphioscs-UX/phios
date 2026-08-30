import assert from 'node:assert/strict';
import fs from 'node:fs';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const w28=json('content/embodied-configuration/acceptance/ecr-mandala-w28-full-gate-v1.json');
const w29=json('content/embodied-configuration/acceptance/ecr-mandala-w29-production-dod-v1.json');
assert.equal(w28.baselineCommit,'7c6126404fe8e257b44937a0149bf23c837c538f');
assert.equal(w28.status,'FULL_GATE_BLOCKED_OUTSIDE_ECR');
const gate=cmd=>w28.orderedGates.find(x=>x.command===cmd);
for(const cmd of [
 'node --check functions/embodied-configuration/ecr-customer-mandala-projection.js',
 'node --check assets/customer-ui/js/specialists/ecr/mandala-geometry.js',
 'node --check assets/customer-ui/js/specialists/ecr/mandala-renderer.js',
 'node --check assets/customer-ui/js/specialists/ecr/product-renderer.js',
 'npm run check:ecr-mandala','npm run check:cx-r12r4','npm run check:cx-r12r4b:smr'
]) assert.equal(gate(cmd)?.status,'PASS',cmd);
assert.equal(gate('npm run check:ppr-r3')?.status,'BLOCKED_PRE_EXISTING_BASELINE_DRIFT');
assert.equal(gate('npm run check:ppr-r3')?.reproducedOnUntouchedGlossaryBaseline,true);
assert.equal(gate('npm run check:ppr-r3')?.causedByEcrW24W29Delta,false);
assert.equal(gate('npm run check')?.status,'BLOCKED_WORKSPACE_ENVIRONMENT');
assert.equal(w28.fullProductionGatePassed,false);
assert.equal(w29.status,'FULL_PRODUCTION_BLOCKED');
assert.equal(w29.definitionOfDone.targetedPprR3BoundaryIntact,true);
assert.equal(w29.definitionOfDone.otherFourMethodSpecialistsUnchangedByEcrDelta,true);
assert.equal(w29.definitionOfDone.aggregatePprR3CheckPassed,false);
assert.equal(w29.definitionOfDone.npmRunCheckPassed,false);
assert.equal(w29.productionAdmissionAllowed,false);
console.log('✓ ECR PHI Mandala W28–W29 truthfulness gate passed.');
console.log('  ECR W0–W27 is accepted; FULL PRODUCTION remains intentionally blocked until aggregate PPR-R3 and final npm run check pass in a real Git checkout.');
