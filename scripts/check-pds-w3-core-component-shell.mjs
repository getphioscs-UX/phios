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

const contract = await readJson('content/registry/pds-w3-core-component-shell-contract.json');
const fixture = await readJson('tests/fixtures/pds-w3-core-component-shell-contract.json');
const shell = await read(contract.sharedShell.script);
const css = await read(contract.sharedShell.stylesheet);
const tokens = await read('assets/css/tokens.css');
const foundation = await read('assets/css/design/foundation.css');
const components = await read('assets/css/design/components.css');
const layout = await read('assets/css/design/layout.css');

assert.equal(contract.milestone, 'PDS-W3');
assert.equal(contract.status, 'core-component-shell-aligned');
assert.equal(contract.informationArchitecture.changed, false);
assert.deepEqual(
  contract.responsiveContract.map(item => item.viewportPx),
  fixture.acceptanceViewportsPx
);
assert.equal(contract.boundaries.runtimeChanged, false);
assert.equal(contract.boundaries.runtimeSdkChanged, false);
assert.equal(contract.boundaries.apiChanged, false);
assert.equal(contract.boundaries.storageKeysChanged, false);

const activeNavigationIds = fixture.primaryNavigationIds;
let cursor = shell.indexOf('const NAVIGATION');
for (const id of activeNavigationIds) {
  const index = shell.indexOf(`id: '${id}'`, cursor + 1);
  assert.ok(index > cursor, `Primary navigation order changed at ${id}`);
  cursor = index;
}

cursor = shell.indexOf('const FOOTER_LINKS');
for (const href of [
  '/library',
  '/articles',
  '/thesis',
  '/book-one',
  '/explore',
  '/reality/',
  '/services',
  '/about',
  '/privacy',
  '/terms',
  '/contact'
]) {
  const index = shell.indexOf(`href: '${href}'`, cursor + 1);
  assert.ok(index > cursor, `Footer order changed at ${href}`);
  cursor = index;
}

for (const behavior of [
  'aria-controls="public-navigation"',
  'aria-haspopup="true"',
  "event.key === 'Escape'",
  "event.key !== 'Tab'",
  'restoreFocus: true',
  "!header.contains(event.target)",
  "querySelectorAll('a, [data-locale]')",
  'window.innerWidth > 1000'
]) {
  assert.ok(shell.includes(behavior), `Missing Global Shell behavior: ${behavior}`);
}

const px2Successor = await readJson('content/web-production/px2/successors/px2-w11-checker-successor-v1.json');
assert.equal(px2Successor.status, 'ACTIVE');
const cxHome = await readJson('content/customer-experience-rebuild/authority/homepage-customer-composition-v1.json');
assert.equal(cxHome.route, '/');
assert.equal(cxHome.status, 'HOMEPAGE_TOTAL_REBUILD_IMPLEMENTED');
assert.equal(cxHome.invariants.legacyStylesheetDependency, false);
assert.equal(cxHome.invariants.legacyShellDependency, false);
const cxPages = new Set(['index.html', 'about/index.html', 'explore/index.html']);
const px2Pages = new Set(['library.html', 'services.html', 'books/index.html', 'professional/financial/index.html', 'reality/index.html']);
for (const page of fixture.publicPages) {
  const source = await read(page);
  if (cxPages.has(page)) {
    assert.ok(source.includes('/assets/customer-ui/tokens.css'), `${page} must consume the CX shared design tokens`);
    assert.ok(source.includes('/assets/customer-ui/base.css'), `${page} must consume the CX shared base stylesheet`);
    assert.ok(source.includes('/assets/customer-ui/js/shell.js'), `${page} must consume the CX shared shell successor`);
    assert.ok(!source.includes('/assets/css/phios-public-v2.css'), `${page} must not reintroduce the superseded PX2 stylesheet`);
    assert.ok(!source.includes('/assets/js/public-shell-v2.js'), `${page} must not reintroduce the superseded PX2 shell`);
    continue;
  }
  if (px2Pages.has(page)) {
    assert.ok(source.includes('/assets/css/phios-public-v2.css'), `${page} must consume the PX2 shared shell stylesheet`);
    assert.ok(source.includes('/assets/js/public-shell-v2.js'), `${page} must consume the PX2 shared shell script`);
    continue;
  }
  assert.ok(source.includes('/assets/css/public-experience.css'), `${page} must retain the predecessor shared shell stylesheet`);
  assert.ok(source.includes('/assets/js/public-shell.js'), `${page} must retain the predecessor shared shell script`);
}

for (const token of fixture.requiredShellTokens) {
  assert.ok(tokens.includes(`${token}:`), `Missing Shell token: ${token}`);
}

for (const cssContract of [
  'min-width: var(--phi-control-target-min);',
  'min-height: var(--phi-control-target-min);',
  '@media (max-width: 1000px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.ok(css.includes(cssContract), `Missing responsive Shell CSS: ${cssContract}`);
}

assert.ok(foundation.includes(':where(:focus-visible)'));
assert.ok(foundation.includes('outline: var(--phi-focus-width)'));
assert.ok(components.includes('.phi-button'));
assert.ok(components.includes('.phi-link'));
assert.ok(layout.includes('.phi-container--shell'));

const registry = await readJson('content/registry/index.json');
assert.equal(
  registry.registries.pds_w3_core_component_shell_contract,
  './pds-w3-core-component-shell-contract.json'
);

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:pds-w3'],
  'node scripts/check-pds-w3-core-component-shell.mjs'
);

console.log('✓ PDS-W3 Current Core Component Contract and Global Shell aligned');
console.log('  Canonical PDS primary navigation validated; Reality customer entry is /reality/.');
console.log('  Mobile focus, Escape, outside-click and locale-close behavior validated');
console.log('  Responsive contracts: 360px, 768px, 1440px');
console.log('  Runtime, Runtime SDK, APIs and storage keys unchanged');
