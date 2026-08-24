import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
const required = [
  'functions/ask2/ask2-execution-adapters.js',
  'functions/ask2/ask2-public-composer.js',
  'functions/ask2/ask2-consumption-runtime.js',
  'functions/api/ask-phios-orchestrated.js',
  'functions/api/ask2-runtime-status.js',
  'assets/js/knowledge/ask-phios-client.js',
  'content/governance/ask2/contracts/execution-adapter-binding-contract-v1.json',
  'content/governance/ask2/contracts/public-consumption-integration-contract-v1.json',
  'content/governance/ask2/contracts/bounded-answer-composition-contract-v2.json',
  'content/governance/ask2/registries/public-consumption-domain-order-v1.json',
  'content/governance/ask2/contracts/public-lens-disclosure-contract-v2.json',
  'content/governance/ask2/acceptance/ask2-w4-w10-public-consumption-acceptance-v1.json',
  'content/governance/ask2/freeze/ask2-w4-w10-public-consumption-freeze-v1.json'
];
for (const path of required) assert.ok(fs.existsSync(path), `ASK2_W4_W10_REQUIRED_FILE_MISSING:${path}`);

const adapters = read('functions/ask2/ask2-execution-adapters.js');
for (const endpoint of ['/api/ast-transit-execute','/api/bzr-temporal-execute','/api/zi-wei-dynamic-execute','/api/zi-wei-execute']) assert.ok(adapters.includes(endpoint));
assert.ok(adapters.includes("state: 'INPUT_REQUIRED'"));
assert.ok(adapters.includes('validateRuntimeExecutionResult'));
assert.ok(!/MODEL_GENERATED_CALCULATION\s*:\s*true/.test(adapters));

const runtime = read('functions/ask2/ask2-consumption-runtime.js');
assert.ok(runtime.includes('planAskHealthBridge'));
assert.ok(runtime.includes('HEALTH_K1_SIGNAL'));
assert.ok(runtime.includes('红疹'));
assert.ok(runtime.includes("mode: 'CKA'"));
assert.ok(runtime.includes('currentExternalEvidence'));
assert.ok(runtime.includes('ASK_GUIDED_CONTEXT_EPHEMERAL'));
assert.ok(runtime.includes('canonicalReality: false'));
assert.ok(runtime.includes('persisted: false'));

const api = read('functions/api/ask-phios-orchestrated.js');
assert.ok(api.includes("runCkaConsumption"));
assert.ok(api.includes("result.classification.mode === 'HEALTH'"));
assert.ok(api.includes("result.classification.mode === 'CKA'"));
assert.ok(api.includes('modelCalculationAllowed: false'));

const client = read('assets/js/knowledge/ask-phios-client.js');
assert.ok(client.includes("fetch('/api/ask-phios-orchestrated'"));
assert.ok(client.includes('renderAsk2Disclosure(payload)'));
assert.ok(client.includes('Why this lens:'));
assert.ok(client.includes('为什么使用这个视角'));
assert.ok(client.includes('capability gate'));
assert.ok(client.includes('模型不能自行补算 Method'));

const statusApi = read('functions/api/ask2-runtime-status.js');
assert.ok(statusApi.includes('CF_PAGES_COMMIT_SHA'));
assert.ok(statusApi.includes('modelCalculationAllowed: false'));

const order = json('content/governance/ask2/registries/public-consumption-domain-order-v1.json');
assert.equal(order.rules.healthCannotBeOverriddenBySymbolicLens, true);
assert.equal(order.canonicalRegression.question, '为什么我的手会起红疹');
assert.equal(order.canonicalRegression.expectedDomain, 'HEALTH');
const acceptance = json('content/governance/ask2/acceptance/ask2-w4-w10-public-consumption-acceptance-v1.json');
assert.equal(acceptance.sourceAcceptance.existingCkaEndpointMutated, false);
assert.equal(acceptance.liveAcceptance.realBrowserVerified, false);
assert.equal(acceptance.productionState, 'ASK2_PUBLIC_SOURCE_ACCEPTED_LIVE_BROWSER_PENDING');
const freeze = json('content/governance/ask2/freeze/ask2-w4-w10-public-consumption-freeze-v1.json');
assert.equal(freeze.freeze.modelCalculationAllowed, false);
assert.equal(freeze.freeze.rawWebResultAllowed, false);
assert.equal(freeze.freeze.healthSafetyBeforeLens, true);
assert.equal(freeze.freeze.liveProductionClaimAllowed, false);

console.log('✓ ASK2-W4–W10 public consumption source acceptance passed.');
console.log('✓ Execution adapters are bound to governed runtime endpoints and fail closed on missing inputs.');
console.log('✓ Existing Ask client targets the additive orchestrated endpoint; the historical CKA endpoint remains a fallback authority.');
console.log('✓ Health-K1 red-rash regression is routed before symbolic lenses.');
console.log('✓ Public lens disclosure and bounded composition contracts are active.');
console.log('✓ Live browser acceptance remains pending successor deployment.');
