import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {selectPaiRoute,selectPaiFailureFallback} from '../functions/_lib/pai-r1-economics.js';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const registry = read('content/ai-economics/providers/ai-provider-cost-registry-v1.json');
assert.equal(registry.baselineCommit, '454a7d1771feec5e2f6ab00bffdde46a5aa661f0');
assert.equal(registry.models.length, 4);
assert.deepEqual(registry.models.slice(0,3).map(model => model.routingCode), ['LUNA','TERRA','SOL']);
for (const model of registry.models) {
  assert.ok(['AVAILABLE','DEGRADED','DISABLED','UNAVAILABLE'].includes(model.status));
  assert.ok(model.inputPricePerMillion >= 0 && model.cachedInputPricePerMillion >= 0 && model.outputPricePerMillion >= 0);
}
const disabled = {...registry, models: registry.models.map(model => ({...model,status:'DISABLED'}))};
assert.equal(selectPaiRoute({aiExecutionClass:'T0_DETERMINISTIC'},disabled).providerRequired,false);
assert.equal(selectPaiRoute({aiExecutionClass:'T1_CANONICAL_ASSEMBLY'},disabled).providerRequired,false);
assert.equal(selectPaiRoute({aiExecutionClass:'T2_LIGHT_COMPOSITION'},disabled).degradedDisposition,'CONTROLLED_UNAVAILABLE');
const t2 = selectPaiRoute({aiExecutionClass:'T2_LIGHT_COMPOSITION'},registry);
const t3 = selectPaiRoute({aiExecutionClass:'T3_DEEP_COMPOSITION'},registry);
assert.equal(t2.selectedModel,'gpt-5.6-luna');
assert.equal(t3.selectedModel,'gpt-5.6-sol');
const fallback = selectPaiFailureFallback(t2,t2.selectedModel,registry);
assert.equal(fallback.customerChargeMayIncrease,false);
const successor = read('content/ai-economics/reconciliation/kir-r2-model-gateway-pai-r1-successor-v1.json');
assert.equal(successor.predecessorSha256,'5957f10cbbe7be630086817f4bd8122ca99329ff1b897c07983f3def3807b83b');
assert.equal(successor.currentSha256,crypto.createHash('sha256').update(fs.readFileSync(successor.runtimePath)).digest('hex'));
const gateway = fs.readFileSync(successor.runtimePath,'utf8');
assert.match(gateway,/selectPaiRoute/);
assert.match(gateway,/providerSelectionOwner:'PAI_R1'/);
console.log('✓ PAI-R1-W0/W2 provider registry, availability, T0–T3 mapping and single-provider fallback passed.');
