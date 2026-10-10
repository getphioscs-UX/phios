import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const registryPath = 'content/professional/method-governance/imr-commercial-license-registry-v1.json';
const schemaPath = 'content/professional/method-governance/imr-commercial-license-registry-v1.schema.json';
const methodPath = 'content/professional/method-governance/imr-method-registry-v1.json';

for (const file of [registryPath, schemaPath, methodPath]) {
  assert(fs.existsSync(path.join(root, file)), `Missing IMR-W2 dependency: ${file}`);
}

const registry = readJson(registryPath);
const schema = readJson(schemaPath);
const methods = readJson(methodPath);
assert.equal(registry.stageCode, 'IMR-W2');
assert.equal(registry.registryCode, 'IMR_COMMERCIAL_LICENSE_REGISTRY');
assert.equal(registry.runtimeAuthority, false);
assert.equal(registry.governancePolicy.licenseRequiredBeforeCommercialUse, true);
assert.equal(registry.governancePolicy.unknownLicenseFailsClosed, true);
assert.equal(registry.governancePolicy.registrationCreatesCommercialRights, false);
assert.equal(registry.governancePolicy.commercialRightsCreateProductionEligibility, false);
assert.equal(registry.governancePolicy.productionEligibilityGovernedBy, 'IMR-W4');
assert.equal(schema.properties.runtimeAuthority.const, false);

const methodByCode = new Map(methods.methods.map(item => [item.methodCode, item]));
const governed = new Map(registry.methods.map(item => [item.methodCode, item]));
assert.equal(governed.size, registry.methods.length, 'Duplicate IMR-W2 methodCode.');
assert.deepEqual([...governed.keys()].sort(), [...methodByCode.keys()].sort());

for (const item of registry.methods) {
  assert.equal(item.methodVersion, methodByCode.get(item.methodCode).version);
  assert.equal(item.productionAuthorityCreated, false);
  assert.equal(typeof item.license.licenseType, 'string');
  assert.equal(typeof item.license.rightsHolder, 'string');
  assert.equal(typeof item.commercialRights.commercialUse, 'string');
  assert.equal(typeof item.usageScope.internalResearch, 'boolean');
  assert.equal(typeof item.redistribution.sourceCode, 'boolean');
  assert(Array.isArray(item.thirdPartyDependencies));
  for (const dep of item.thirdPartyDependencies) {
    for (const field of ['dependencyCode','licenseStatus','commercialRightsStatus','redistributionStatus','required']) {
      assert(Object.hasOwn(dep, field), `${item.methodCode} dependency missing ${field}`);
    }
  }
}
assert.equal(governed.get('ASTROLOGY').license.licenseType, 'MIT');
assert.equal(governed.get('ASTROLOGY').commercialRights.commercialUse, 'allowed');
assert(governed.get('ASTROLOGY').thirdPartyDependencies.some(dep => dep.dependencyCode === 'ASTRONOMY_ENGINE_JS'));
assert.equal(governed.get('HUMAN_DESIGN').licenseStatus, 'restricted');
assert.equal(governed.get('BAZI').licenseStatus, 'conditional');
for (const code of ['I_CHING','TAROT','PSYCHOLOGY']) {
  assert.equal(governed.get(code).licenseStatus, 'not_assessed');
  assert.equal(governed.get(code).commercialRights.commercialUse, 'blocked');
}

for (const forbidden of ['algorithm','validation','tolerance','productionReady','migration','deprecation']) {
  assert.equal(Object.hasOwn(registry.governancePolicy, forbidden), false, `IMR-W2 must not own ${forbidden}`);
}

const pkg = readJson('package.json');
assert.equal(pkg.scripts?.['check:imr-w2'], 'node scripts/check-imr-w2-commercial-license.mjs');
console.log('✓ IMR-W2 Commercial License Governance passed.');
console.log(`  Governed methods: ${registry.methods.length}`);
console.log('  Unknown or unassessed commercial rights fail closed.');
