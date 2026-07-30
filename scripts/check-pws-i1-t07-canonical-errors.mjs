import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const exists = file =>
  fs.access(path.join(root, file)).then(() => true, () => false);

const contract = await readJson(
  'docs/pws/contracts/pws-canonical-errors-v1.json'
);
assert.equal(contract.contractId, 'phi-os.pws.canonical-errors.v1');
assert.equal(contract.schemaVersion, 'pws-v1');
assert.equal(contract.status, 'frozen');
assert.equal(
  contract.baseline.commit,
  '1a032cdf851d71060ddb2d0033b9d65b75e35254'
);

const expectedFamilies = [
  'IDENTITY','AUTHENTICATION','AUTHORIZATION','CAPABILITY','CONSENT',
  'ENTITLEMENT','PAYMENT','ASSIGNMENT','WORKSPACE','EVIDENCE','METHOD',
  'DELIVERABLE','STATE','VERSION','PROVIDER','SECURITY','INTEGRATION','SYSTEM'
];
assert.deepEqual(
  contract.families.map(family => family.family),
  expectedFamilies
);
assert.equal(new Set(expectedFamilies).size, expectedFamilies.length);

for (const [rule, expected] of Object.entries({
  freeStringErrorFamiliesAllowed: false,
  freeStringErrorCodesAllowed: false,
  familyPrefixRequired: true,
  stableCodeRequired: true,
  customerMessageIsCodeAllowed: false,
  internalDetailExposedToCustomer: false,
  sensitiveDataAllowed: false,
  providerOutputAllowed: false,
  stackTraceAllowedAtPublicBoundary: false,
  retryabilityMustBeDeclared: true,
  httpStatusMustBeDeclared: true,
  correlationIdRequired: true,
  causeMayCrossTrustBoundary: false,
  legacyErrorWritesAllowed: false
})) {
  assert.equal(contract.rules[rule], expected, `Error rule changed: ${rule}`);
}

const codePattern = new RegExp(contract.rules.errorCodePattern);
const allCodes = [];
for (const family of contract.families) {
  assert.equal(family.prefix, `PWS_${family.family}_`);
  assert(Number.isInteger(family.defaultHttpStatus));
  assert(family.defaultHttpStatus >= 400 && family.defaultHttpStatus <= 599);
  assert.equal(typeof family.defaultRetryable, 'boolean');
  assert(Array.isArray(family.codes));
  assert(family.codes.length > 0);
  for (const code of family.codes) {
    assert(codePattern.test(code), `Invalid error code: ${code}`);
    assert(code.startsWith(family.prefix), `Wrong family prefix: ${code}`);
    allCodes.push(code);
  }
}
assert.equal(new Set(allCodes).size, allCodes.length);

for (const required of [
  'error_id','error_code','error_family','schema_version',
  'occurred_at','correlation_id','retryable'
]) {
  assert(contract.errorEnvelope.requiredFields.includes(required));
}
for (const forbidden of [
  'stack','cause','payload','customer_data','provider_output',
  'credential','token','secret'
]) {
  assert(contract.errorEnvelope.forbiddenPublicFields.includes(forbidden));
}

for (const boundary of contract.legacyCompatibility) {
  for (const legacyPath of boundary.paths) {
    assert(
      await exists(legacyPath),
      `Legacy error boundary is not traceable: ${legacyPath}`
    );
  }
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:pws-i1-t07'],
  'node scripts/check-pws-i1-t07-canonical-errors.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pws-i1-t07-canonical-errors.mjs'
  )
);

console.log('✓ PWS-I1-T07 Canonical Errors v1 frozen.');
console.log(`  ${expectedFamilies.length} closed families; ${allCodes.length} stable codes.`);
console.log('  Public errors exclude payloads, secrets, stacks and Provider output.');
