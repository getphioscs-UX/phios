import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

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

const deliverables = [
  'content/registry/pds-w2-design-token-contract.json',
  'tests/fixtures/pds-w2-design-token-contract.json',
  'docs/design-system/PDS-W2-DESIGN-VARIABLE-UNIFICATION.md',
  'scripts/check-pds-w2-design-tokens.mjs'
];

for (const file of deliverables) {
  assert.equal(await exists(file), true, `Missing PDS-W2 deliverable: ${file}`);
}

const contract = await readJson(deliverables[0]);
const fixture = await readJson(deliverables[1]);
const tokens = await read(fixture.canonicalFile);

assert.equal(contract.milestone, 'PDS-W2');
assert.equal(contract.contractVersion, '1.0.0');
assert.equal(contract.schemaVersion, 'phi-os.pds-design-token-contract.v1');
assert.equal(contract.status, 'design-variables-unified');
assert.equal(contract.source.canonicalFile, fixture.canonicalFile);
assert.equal(contract.source.prefix, '--phi-');
assert.equal(contract.source.legacyAliasesAllowed, true);
assert.deepEqual(contract.categories.map(category => category.id), fixture.requiredCategories);
assert.deepEqual(contract.responsiveContract.acceptanceViewportsPx, fixture.acceptanceViewportsPx);
assert.equal(contract.accessibilityContract.minimumTouchTargetValue, fixture.minimumTouchTargetValue);
assert.equal(contract.compatibility.visualValueChangeIntended, false);
assert.equal(contract.compatibility.pageMarkupChange, false);
assert.equal(contract.compatibility.runtimeChange, false);
assert.equal(contract.downstream.nextMilestone, 'PDS-W3');
assert.equal(contract.downstream.pageMigrationBeginsAt, 'PDS-W4');

for (const token of fixture.requiredTokens) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(tokens, new RegExp(`${escaped}\\s*:`), `Missing token: ${token}`);
}

for (const alias of fixture.legacyAliases) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tokens.match(new RegExp(`${escaped}\\s*:\\s*([^;]+);`));
  assert.ok(match, `Missing legacy alias: ${alias}`);
  assert.match(match[1], /^var\(--phi-[a-z0-9-]+\)$/, `${alias} must reference a canonical --phi-* token`);
}

for (const file of fixture.designFiles) {
  assert.equal(await exists(file), true, `Missing Design System CSS: ${file}`);
}

const foundation = await read('assets/css/design/foundation.css');
const typography = await read('assets/css/design/typography.css');
const layout = await read('assets/css/design/layout.css');
const components = await read('assets/css/design/components.css');
const motion = await read('assets/css/design/motion.css');
const visualAcceptance = await read('assets/css/design/visual-acceptance.css');

assert.match(foundation, /outline: var\(--phi-focus-width\)/);
assert.match(foundation, /outline-offset: var\(--phi-focus-offset\)/);
assert.match(typography, /line-height: var\(--phi-leading-display\)/);
assert.match(layout, /var\(--phi-grid-min-card\)/);
assert.match(components, /min-height: var\(--phi-control-target-min\)/);
assert.match(components, /line-height: var\(--phi-leading-control\)/);
assert.match(motion, /translateY\(var\(--phi-motion-lift\)\)/);
assert.match(visualAcceptance, /var\(--phi-control-target-min, 2\.75rem\)/);

const registryIndex = await readJson('content/registry/index.json');
assert.equal(
  registryIndex.registries.pds_w2_design_token_contract,
  './pds-w2-design-token-contract.json'
);

const packageJson = await readJson('package.json');
assert.equal(packageJson.scripts['check:pds-w2'], 'node scripts/check-pds-w2-design-tokens.mjs');

console.log('✓ PDS-W2 design variables unified');
console.log(`  Canonical tokens: ${fixture.canonicalFile}`);
console.log(`  Required token checks: ${fixture.requiredTokens.length}`);
console.log(`  Legacy aliases mapped: ${fixture.legacyAliases.length}`);
console.log('  Runtime semantics and page markup unchanged');
