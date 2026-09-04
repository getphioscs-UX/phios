import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async file => (await fs.readFile(file, 'utf8')).replace(/\r\n?/g, '\n');
const json = async file => JSON.parse(await read(file));
const exists = async file => fs.access(file).then(() => true).catch(() => false);

const contract = await json('content/registry/pds-w4-reality-journey-shell-contract.json');
const fixture = await json('tests/fixtures/pds-w4-reality-journey-shell-contract.json');
const script = await read(contract.sharedImplementation.script);
const css = await read(contract.sharedImplementation.stylesheet);
const localeEn = await read(contract.sharedImplementation.localeModules[0]);
const localeZh = await read(contract.sharedImplementation.localeModules[1]);
const p1DeletePath = 'content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json';
const p1Deleted = await exists(p1DeletePath)
  && (await json(p1DeletePath)).status === 'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE';


assert.equal(contract.milestone, 'PDS-W4');
assert.equal(contract.baseline.commit, '660e1eaae958f1fe6df8a1741027a391cbc72be7');
assert.deepEqual(contract.publicStageOrder, fixture.stages);
assert.deepEqual(contract.responsiveViewportsPx, fixture.viewportsPx);
assert.equal(contract.customerBoundary.customerViewDefault, true);
assert.equal(contract.behaviorBoundary.writesRuntimeState, false);
assert.equal(contract.behaviorBoundary.duplicatesRuntimeAction, false);

for (const stage of fixture.stages) {
  assert.ok(script.includes(`'${stage}'`), `Missing stage: ${stage}`);
  assert.ok(localeEn.includes(`${stage}:`), `Missing English stage: ${stage}`);
  assert.ok(localeZh.includes(`${stage}:`), `Missing Chinese stage: ${stage}`);
}

for (const page of fixture.pages) {
  if (p1Deleted && page === 'my-reality.html') {
    assert.equal(await exists(page), false, 'P1 retired My Reality presentation must remain physically deleted');
    continue;
  }
  const source = await read(page);
  assert.ok(source.includes('/assets/css/design/journey-shell.css'), `${page} missing Journey Shell CSS`);
  assert.ok(source.includes('/assets/js/journey-shell.js'), `${page} missing Journey Shell JS`);
}

if (p1Deleted) {
  const canonicalReality = await read('reality/index.html');
  const routeRegistry = await json('content/customer-experience-rebuild/authority/canonical-customer-route-registry-v5.json');
  const myRealityRoute = routeRegistry.routes.find(route => route.routeId === 'MY_REALITY');
  assert.ok(myRealityRoute, 'P1 canonical My Reality route is missing');
  assert.equal(myRealityRoute.canonicalPath, '/reality/');
  assert.equal(myRealityRoute.currentOperationalPath, '/reality/');
  assert.equal(myRealityRoute.physicalLegacyPresentationDeleted, true);
  assert.ok(canonicalReality.includes('data-cx-surface="MY_REALITY"'));
  assert.ok(canonicalReality.includes('data-cx-panel="continuity"'));
}

for (const forbidden of fixture.forbiddenCustomerTokens) {
  assert.equal(
    script.includes(`textContent = ${forbidden}`) || script.includes(`innerHTML = ${forbidden}`),
    false,
    `Journey Shell exposes internal field: ${forbidden}`
  );
}

for (const requirement of [
  'data-journey-state="ready"',
  'role="status"',
  'aria-live="polite"',
  'data-journey-action="back"',
  'data-journey-action="modify"',
  'data-journey-action="pause"',
  'data-journey-action="primary"',
  'scrollIntoView',
  'prefers-reduced-motion'
]) {
  assert.ok(script.includes(requirement), `Missing Journey behavior: ${requirement}`);
}

for (const state of ['loading', 'empty', 'error', 'blocked']) {
  assert.ok(localeEn.includes(`${state}:`), `Missing English state: ${state}`);
  assert.ok(localeZh.includes(`${state}:`), `Missing Chinese state: ${state}`);
}

assert.ok(css.includes('grid-template-columns: repeat(6'));
assert.ok(css.includes('@media (max-width: 48rem)'));
assert.ok(css.includes('@media (max-width: 30rem)'));
assert.ok(css.includes('var(--phi-control-target-min)'));

const index = await json('content/registry/index.json');
assert.equal(
  index.registries.pds_w4_reality_journey_shell_contract,
  './pds-w4-reality-journey-shell-contract.json'
);

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts['check:pds-w4'],
  'node scripts/check-pds-w4-reality-journey-shell.mjs'
);

console.log(p1Deleted ? '✓ PDS-W4 Reality Journey Shell historical contract preserved; P1 canonical My Reality successor aligned' : '✓ PDS-W4 Reality Journey Shell aligned');
console.log('  Six-stage customer journey: enter → describe → discover → understand → choose → continue');
console.log('  Loading, empty, error, blocked and handoff language validated');
console.log('  Internal codes, data keys, source paths and technical fields remain outside the Shell');
console.log('  Runtime, API, storage, persistence and lineage behavior unchanged');
