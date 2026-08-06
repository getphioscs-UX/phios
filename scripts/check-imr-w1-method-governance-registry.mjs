import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const governancePath = 'content/professional/method-governance/imr-method-registry-v1.json';
const schemaPath = 'content/professional/method-governance/imr-method-registry-v1.schema.json';
const runtimeRegistryPath = 'content/professional/method-runtime/method-registry-v1.json';
const capabilityPath = 'content/professional/method-runtime/method-capability-model.json';
const imrW0Path = 'content/professional/method-audits/imr-w0-scope.json';

for (const file of [governancePath, schemaPath, runtimeRegistryPath, capabilityPath, imrW0Path]) {
  assert(fs.existsSync(path.join(root, file)), `Missing IMR-W1 dependency: ${file}`);
}

const governance = readJson(governancePath);
const schema = readJson(schemaPath);
const runtimeRegistry = readJson(runtimeRegistryPath);
const capabilityModel = readJson(capabilityPath);
const imrW0 = readJson(imrW0Path);

assert.equal(governance.stageCode, 'IMR-W1');
assert.equal(governance.registryCode, 'IMR_METHOD_REGISTRY');
assert.equal(governance.authority, 'INTERPRETIVE_METHOD_GOVERNANCE');
assert.equal(governance.runtimeAuthority, false);
assert.equal(governance.governancePolicy.registrationCreatesRuntimeAuthority, false);
assert.equal(governance.governancePolicy.registrationCreatesProductionEligibility, false);
assert.equal(governance.governancePolicy.commercialLicenseGovernedBy, 'IMR-W2');
assert.equal(governance.governancePolicy.algorithmGovernedBy, 'IMR-W3');
assert.equal(governance.governancePolicy.productionEligibilityGovernedBy, 'IMR-W4');
assert.equal(governance.governancePolicy.versionManagementGovernedBy, 'IMR-W5');
assert.equal(governance.governancePolicy.freezeGovernedBy, 'IMR-W6');
assert.deepEqual(governance.requiredFields, ['methodCode','owner','version','status','capabilities','dependencies']);
assert.equal(schema.properties.runtimeAuthority.const, false);

const runtimeByCode = new Map(runtimeRegistry.methods.map(item => [item.methodCode, item]));
const governanceByCode = new Map(governance.methods.map(item => [item.methodCode, item]));
assert.equal(governanceByCode.size, governance.methods.length, 'Duplicate IMR methodCode.');
assert.deepEqual([...governanceByCode.keys()].sort(), [...runtimeByCode.keys()].sort());

const allowedCapabilities = new Set(capabilityModel.layers.map(layer => layer.code));
const requiredSharedRuntimes = new Set([
  'SHARED_DATA_AUTHORITY','SHARED_CALCULATION_RUNTIME','SHARED_PROJECTION_RUNTIME','SHARED_INTERPRETATION_RUNTIME','SHARED_PROFESSIONAL_RUNTIME'
]);
for (const method of governance.methods) {
  const runtime = runtimeByCode.get(method.methodCode);
  assert(runtime, `Missing Runtime Registry identity: ${method.methodCode}`);
  assert.equal(method.version, runtime.methodVersion);
  assert.equal(method.status, runtime.status);
  assert.equal(method.dependencies.runtimeRegistryMethodCode, method.methodCode);
  assert.equal(method.dependencies.pluginCode, runtime.pluginCode);
  assert.equal(method.owner.authorityType, 'HUMAN_GOVERNANCE');
  assert.equal(method.owner.ownerCode, 'TL');
  assert.equal(method.owner.implementationTrack, runtime.targetTrack);
  assert.equal(method.productionEligible, false);
  assert(method.capabilities.every(code => allowedCapabilities.has(code)));
  assert.equal(new Set(method.capabilities).size, method.capabilities.length);
  assert.deepEqual(new Set(method.dependencies.sharedRuntimeDependencies), requiredSharedRuntimes);
}

const audited = new Map(imrW0.methods.map(item => [item.methodCode, item]));
for (const code of ['HUMAN_DESIGN','ASTROLOGY','BAZI']) {
  assert(governanceByCode.get(code)?.dependencies.governanceAuditTracks.includes('IMR-W0'));
  assert(audited.has(code));
}
assert.equal(governanceByCode.get('ASTROLOGY').dependencies.externalDependencies.includes('ASTRONOMY_ENGINE_JS'), true);
assert.equal(governanceByCode.get('HUMAN_DESIGN').dependencies.governanceAuditTracks.includes('HDR-W0'), true);

for (const forbidden of ['license','commercialRights','usageScope','redistribution','algorithm','validationTolerance','productionReady','migration','deprecation']) {
  assert.equal(Object.hasOwn(governance.governancePolicy, forbidden), false, `IMR-W1 must not own ${forbidden}`);
}

const packageJson = readJson('package.json');
assert.equal(packageJson.scripts?.['check:imr-w1'], 'node scripts/check-imr-w1-method-governance-registry.mjs');
for (const scriptName of ['precheck','check','postcheck','check:pja','check:knowledge-runtime']) {
  const value = packageJson.scripts?.[scriptName];
  if (typeof value === 'string') assert.equal(value.includes('check:imr-w1'), false, `IMR-W1 must remain outside ${scriptName}`);
}

console.log('✓ IMR-W1 Method Governance Registry passed.');
console.log(`  Registered governance identities: ${governance.methods.length}`);
console.log('  Method, Owner, Version, Status, Capability and Dependencies are governed without Runtime authority.');
console.log('  Commercial License, Algorithm, Production Eligibility, Version Management and Freeze remain reserved for IMR-W2–W6.');
