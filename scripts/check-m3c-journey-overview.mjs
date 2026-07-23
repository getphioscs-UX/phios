import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relativePath) {
  return fs.readFile(path.join(root, relativePath), 'utf8');
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

const requiredFiles = [
  'reality-journey.html',
  'assets/css/reality-journey.css',
  'assets/js/locales/en/journey.js',
  'assets/js/locales/zh-Hans/journey.js',
  'content/registry/m3c-public-journey.json',
  'docs/public/M3C-W1-JOURNEY-OVERVIEW.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W1 deliverable: ${file}`);
}

const page = await read('reality-journey.html');
for (const contract of [
  '/assets/css/public-experience.css',
  '/assets/css/reality-journey.css',
  '/assets/js/public-shell.js',
  'data-public-section="reality"',
  'Privacy &amp; AI boundary',
  'AI-assisted, not AI-authoritative',
  'Not professional or emergency advice'
]) {
  assert.match(page, new RegExp(contract), `Journey Overview is missing: ${contract}`);
}

const stageIds = [
  'entry',
  'reconstruction',
  'reading',
  'navigation',
  'review',
  'memory',
  'continuity'
];

for (const stageId of stageIds) {
  assert.match(
    page,
    new RegExp(`id="stage-${stageId}"`),
    `Journey Overview is missing stage: ${stageId}`
  );
}

assert.equal(
  (page.match(/href="\/reality-entry"/g) || []).length,
  2,
  'Journey Overview must provide two canonical Start Journey actions'
);
assert.match(page, /href="\/reality-demo"/);
assert.match(page, /href="\/privacy"/);
assert.match(page, /href="\/ai-disclosure"/);
assert.match(page, /href="\/professional-boundary"/);

for (const forbidden of [
  '<form',
  '<input',
  '<textarea',
  'sessionStorage',
  'localStorage',
  'fetch(',
  '/api/'
]) {
  assert.equal(
    page.includes(forbidden),
    false,
    `Public Journey Overview must not contain ${forbidden}`
  );
}

for (const downstreamRoute of [
  '/reality-reconstruction',
  '/reality-reading',
  '/reality-navigation',
  '/reality-review',
  '/my-reality'
]) {
  assert.equal(
    page.includes(`href="${downstreamRoute}`),
    false,
    `Public overview must not bypass stage order through ${downstreamRoute}`
  );
}

const shell = await read('assets/js/public-shell.js');
const navigationBlock = shell.slice(
  shell.indexOf('const NAVIGATION'),
  shell.indexOf('const FOOTER_LINKS')
);
const footerBlock = shell.slice(
  shell.indexOf('const FOOTER_LINKS'),
  shell.indexOf('function navigationMarkup')
);
assert.match(navigationBlock, /id: 'reality', href: '\/reality-journey'/);
assert.match(footerBlock, /href: '\/reality-journey'/);
assert.match(shell, /path === '\/reality-journey'/);
assert.match(shell, /path === '\/reality-demo'/);

const registry = await readJson('content/registry/m3c-public-journey.json');
assert.equal(registry.status, 'w1-journey-overview-ready');
assert.equal(registry.overview.publicRoute, '/reality-journey');
assert.equal(registry.overview.startRoute, '/reality-entry');
assert.equal(registry.overview.demoRoute, '/reality-demo');
assert.equal(registry.overview.writesRuntime, false);
assert.equal(registry.overview.storesJourneyContent, false);
assert.equal(registry.overview.callsRuntimeApi, false);
assert.deepEqual(
  registry.stages.map(stage => stage.id),
  stageIds
);
assert.deepEqual(
  registry.stages.map(stage => stage.number),
  ['01', '02', '03', '04', '05', '06', '07']
);
assert.equal(
  registry.stages.every(stage => stage.automaticAdvance === false),
  true,
  'Every M3C-W1 stage must require an explicit customer transition'
);

const runtimeContracts = await readJson('content/registry/runtime-contracts.json');
const contractVersions = new Map(
  runtimeContracts.contracts.map(contract => [contract.id, contract.version])
);
for (const stage of registry.stages) {
  assert.equal(
    contractVersions.get(stage.contractId),
    stage.contractVersion,
    `M3C-W1 contract mismatch for ${stage.id}`
  );
}

assert.equal(registry.boundaries.evidenceInterpretationSeparated, true);
assert.equal(registry.boundaries.unknownRealityPreserved, true);
assert.equal(registry.boundaries.providerOutputCanBecomeObservedEvidence, false);
assert.equal(registry.boundaries.userChoiceRequiredForTransition, true);
assert.equal(registry.boundaries.lineageRewritten, false);
assert.equal(registry.acceptance.runtimeContractsChanged, false);
assert.equal(registry.acceptance.runtimeSchemasChanged, false);
assert.equal(registry.acceptance.d1BindingChanged, false);
assert.equal(registry.acceptance.runtimeMigrationsChanged, false);

const css = await read('assets/css/reality-journey.css');
for (const responsiveContract of [
  '@media (max-width: 1000px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '.journey-stage__content',
  '.journey-boundary-grid'
]) {
  assert.match(css, new RegExp(responsiveContract.replace(/[()]/g, '\\$&')));
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-journey-overview'],
  'node scripts/check-m3c-journey-overview.mjs'
);
assert.match(packageJson.scripts.check, /check-m3c-journey-overview\.mjs/);

const wrangler = await read('wrangler.jsonc');
assert.match(wrangler, /"binding": "RUNTIME_DB"/);
assert.match(wrangler, /073639fa-01e4-4868-af10-6ed032637dab/);

console.log('✓ M3C-W1 Journey Overview passed: Entry → Reconstruction → Reading → Navigation → Review → Memory → Continuity.');
console.log('  Public overview remains bilingual, no-save, evidence-bounded and contract-preserving.');
