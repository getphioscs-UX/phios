import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();

async function read(relativePath) {
  return (await fs.readFile(path.join(root, relativePath), 'utf8'))
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function git(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

const deliverables = [
  'content/registry/pds-w0-baseline-boundary.json',
  'tests/fixtures/pds-w0-baseline-boundary.json',
  'docs/design-system/PDS-W0-BASELINE-AND-BOUNDARY-FREEZE.md',
  'scripts/check-pds-w0-baseline-boundary.mjs'
];

for (const file of deliverables) {
  assert.equal(await exists(file), true, `Missing PDS-W0 deliverable: ${file}`);
}

const contract = await readJson(deliverables[0]);
const fixture = await readJson(deliverables[1]);

assert.equal(contract.milestone, 'PDS-W0');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.schemaVersion, 'phi-os.pds-baseline-boundary.v1');
assert.equal(contract.status, 'baseline-and-boundary-frozen');
assert.deepEqual(contract.baseline.repository, fixture.expectedBaseline.repository);
assert.deepEqual(contract.baseline.branch, fixture.expectedBaseline.branch);
assert.deepEqual(contract.baseline.commit, fixture.expectedBaseline.commit);
assert.deepEqual(contract.baseline.tree, fixture.expectedBaseline.tree);

assert.equal(
  git(['rev-parse', `${contract.baseline.commit}^{commit}`]),
  contract.baseline.commit,
  'Recorded PDS-W0 baseline commit is not available in Git history'
);
assert.equal(
  git(['rev-parse', `${contract.baseline.commit}^{tree}`]),
  contract.baseline.tree,
  'Recorded PDS-W0 baseline tree does not match the Git commit'
);

const declaredProtectedPaths = contract.protectedScopes.flatMap(scope => scope.paths);
assert.deepEqual(declaredProtectedPaths, fixture.protectedPaths);

for (const protectedPath of fixture.protectedPaths) {
  const baselineFiles = git([
    'ls-tree',
    '-r',
    '--name-only',
    contract.baseline.commit,
    '--',
    protectedPath
  ]).split('\n').filter(Boolean);
  assert.ok(baselineFiles.length > 0, `Protected path missing from baseline: ${protectedPath}`);

  const changed = git([
    'diff',
    '--name-only',
    contract.baseline.commit,
    '--',
    protectedPath
  ]);
  assert.equal(changed, '', `Protected PDS-W0 path changed: ${protectedPath}`);
}

for (const page of fixture.corePages) {
  assert.equal(await exists(page), true, `Core page missing from baseline: ${page}`);
}

assert.deepEqual(contract.acceptanceBaseline.viewports, fixture.viewports);
assert.deepEqual(contract.acceptanceBaseline.locales, fixture.locales);
assert.equal(contract.acceptanceBaseline.minimumTouchTargetPx, fixture.minimumTouchTargetPx);
assert.equal(contract.acceptanceBaseline.keyboardOperationRequired, true);
assert.equal(contract.acceptanceBaseline.focusVisibilityRequired, true);
assert.equal(contract.acceptanceBaseline.horizontalPageScrollAllowed, false);
assert.equal(contract.acceptanceBaseline.productionConsoleErrorsAllowed, false);
assert.equal(contract.baselineValidation.pdsW0, 'passed');
assert.equal(contract.baselineValidation.pdsW1, 'passed');
assert.equal(
  contract.baselineValidation.fullRepositoryCheck,
  'blocked-by-pre-existing-baseline-inconsistencies'
);
assert.equal(contract.baselineValidation.protectedScopeDiff, 'zero');
assert.equal(contract.baselineValidation.decision, 'conditional-passed');
assert.equal(contract.baselineValidation.knownBlockers.length, 3);
assert.equal(
  contract.baselineValidation.knownBlockers.every(blocker => blocker.pdsW0Change === false),
  true
);

assert.equal(contract.relationshipToPdsW1.pdsW1AlreadyExists, true);
assert.equal(await exists(contract.relationshipToPdsW1.pdsW1Registry), true);
const pdsW1 = await readJson(contract.relationshipToPdsW1.pdsW1Registry);
assert.equal(pdsW1.milestone, 'PDS-W1');
assert.equal(pdsW1.status, 'experience-contract-frozen');

const registryIndex = await readJson('content/registry/index.json');
assert.equal(
  registryIndex.registries.pds_w0_baseline_boundary,
  './pds-w0-baseline-boundary.json',
  'PDS-W0 contract must be registered in content/registry/index.json'
);

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:pds-w0'],
  'node scripts/check-pds-w0-baseline-boundary.mjs'
);

console.log('✓ PDS-W0 baseline and boundary freeze passed');
console.log(`  Baseline: ${contract.baseline.repository} main@${contract.baseline.shortCommit}`);
console.log(`  Protected scopes: ${contract.protectedScopes.length}`);
console.log('  Existing PDS-W1 experience contract preserved');
