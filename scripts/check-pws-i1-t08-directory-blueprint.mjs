import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const exists = file =>
  fs.access(path.join(root, file)).then(() => true, () => false);

const contract = await readJson(
  'docs/pws/contracts/pws-directory-blueprint-v1.json'
);

assert.equal(contract.contractId, 'phi-os.pws.directory-blueprint.v1');
assert.equal(contract.schemaVersion, 'pws-v1');
assert.equal(contract.status, 'frozen');
assert.equal(
  contract.baseline.commit,
  'd2dcb2dc2a07428a10e3b1c0b0f8658dfebb1fdc'
);
assert.equal(contract.roots.logicalRuntimeRoot, 'runtime');
assert.equal(contract.roots.currentRuntimeRoot, 'functions/runtime');
assert.equal(contract.roots.currentProfessionalRoot, 'functions/professional');

const expectedModules = [
  'professional','capability','credential','method','service','product',
  'commercial','entitlement','consent','journey','assignment','workspace',
  'evidence','reading','navigation','deliverable','signature','knowledge',
  'intelligence','operations','governance','security','integration'
];
const expectedDirectories = [
  'schema','registry','operations','permissions','states','events','tests'
];

assert.deepEqual(contract.modules.map(module => module.module), expectedModules);
assert.deepEqual(contract.standardModuleDirectories, expectedDirectories);
assert.equal(new Set(expectedModules).size, expectedModules.length);
assert.equal(new Set(expectedDirectories).size, expectedDirectories.length);

for (const module of contract.modules) {
  assert(module.owner, `Missing owner: ${module.module}`);
  assert(module.phase, `Missing phase: ${module.module}`);
  assert(module.writeSource, `Missing write source: ${module.module}`);
  assert(module.currentPaths.length > 0, `Missing current path: ${module.module}`);
  for (const currentPath of module.currentPaths) {
    assert(
      await exists(currentPath),
      `Current path is not traceable for ${module.module}: ${currentPath}`
    );
  }
}

for (const [rule, expected] of Object.entries({
  secondSourceOfTruthAllowed: false,
  bulkRuntimeMoveAllowed: false,
  emptyScaffoldCreationRequired: false,
  legacyDeletionAllowed: false,
  phaseEarlyImplementationAllowed: false,
  physicalPathDefinesOwnership: false,
  moduleOwnerRequired: true,
  currentPathTraceabilityRequired: true,
  standardDirectorySetClosed: true
})) {
  assert.equal(contract.rules[rule], expected, `Directory rule changed: ${rule}`);
}

const journey = contract.modules.find(module => module.module === 'journey');
const knowledge = contract.modules.find(module => module.module === 'knowledge');
const entitlement = contract.modules.find(
  module => module.module === 'entitlement'
);
assert.equal(journey.owner, 'Core Runtime');
assert.equal(knowledge.owner, 'PKR/PWS-I2');
assert.equal(entitlement.owner, 'PWS-I4');

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:pws-i1-t08'],
  'node scripts/check-pws-i1-t08-directory-blueprint.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pws-i1-t08-directory-blueprint.mjs'
  )
);

console.log('✓ PWS-I1-T08 Canonical Directory Blueprint v1 frozen.');
console.log(`  ${expectedModules.length} modules; ${expectedDirectories.length} standard directories.`);
console.log('  Existing Runtime paths are preserved; later-phase ownership remains closed.');
