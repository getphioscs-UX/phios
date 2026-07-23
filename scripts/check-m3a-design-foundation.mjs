import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASELINE_COMMIT = '1df74566174ee18457ce8a095fd7a61b14da649f';
const pages = [
  'index.html',
  'about.html',
  'explore.html',
  'reality-entry.html',
  'reality-reading.html',
  'reality-navigation.html'
];
const designLayers = [
  'assets/css/tokens.css',
  'assets/css/design/foundation.css',
  'assets/css/design/typography.css',
  'assets/css/design/layout.css',
  'assets/css/design/components.css',
  'assets/css/design/motion.css'
];

function baseline(path) {
  return execFileSync('git', ['show', `${BASELINE_COMMIT}:${path}`], {
    encoding: 'utf8'
  });
}

function values(source, expression) {
  return [...source.matchAll(expression)].map(match => match[1]).sort();
}

function elementIds(source) {
  return values(source, /\bid\s*=\s*["']([^"']+)["']/g);
}

function translationKeys(source) {
  return values(
    source,
    /\bdata-i18n(?:-[a-z-]+)?\s*=\s*["']([^"']+)["']/g
  );
}

for (const path of designLayers) {
  assert.ok(fs.existsSync(path), `${path} must exist`);
  assert.ok(fs.statSync(path).size > 0, `${path} must not be empty`);
}

for (const path of pages) {
  const before = baseline(path);
  const after = fs.readFileSync(path, 'utf8');

  assert.deepEqual(
    elementIds(after),
    elementIds(before),
    `${path} element IDs changed during Design System migration`
  );
  assert.deepEqual(
    translationKeys(after),
    translationKeys(before),
    `${path} translation keys changed during Design System migration`
  );

  for (const layer of designLayers) {
    const href = `/${layer}`;
    assert.ok(after.includes(href), `${path} must load ${href}`);
  }
}

const components = fs.readFileSync('assets/css/design/components.css', 'utf8');
assert.match(components, /\.phi-button,\s*\n\.btn\s*\{/);
assert.match(components, /\.phi-button\s*\{/);

const sessionSource = fs.readFileSync('assets/js/core/session.js', 'utf8');
const i18nSource = fs.readFileSync('assets/js/i18n.js', 'utf8');
const workspaceState = fs.readFileSync(
  'assets/js/modules/runtime-workspace-state.js',
  'utf8'
);
const routes = [
  ['assets/js/reality-entry.js', '/api/reconstruct-reality'],
  ['assets/js/modules/reconstruction-loader.js', '/api/reconstruct-runtime'],
  ['assets/js/modules/reading-loader.js', '/api/read-runtime'],
  ['assets/js/modules/navigation-loader.js', '/api/navigate-runtime']
];

for (const key of [
  'phiOSInitialMessage',
  'phiOSEntryState',
  'phiOSRuntimeEntry',
  'phiOSRealityReconstruction',
  'phiOSRealityReading',
  'phiOSRealityNavigation'
]) {
  assert.ok(sessionSource.includes(key), `Session key ${key} must remain frozen`);
}

assert.ok(i18nSource.includes("'phiOSLocale'"), 'Locale storage key changed');

for (const key of [
  'phiOSRuntimeWorkspaceState',
  'phiOSRealityReview',
  'phiOSRuntimeMemory',
  'phiOSRealityContinuity'
]) {
  assert.ok(workspaceState.includes(key), `Runtime state key ${key} changed`);
}

for (const [path, route] of routes) {
  assert.ok(
    fs.readFileSync(path, 'utf8').includes(route),
    `API route ${route} changed`
  );
}

const registry = JSON.parse(
  fs.readFileSync('content/registry/m3a-design-foundation.json', 'utf8')
);
assert.equal(registry.baseline.commit, BASELINE_COMMIT);
assert.equal(registry.status, 'foundation-ready');
assert.equal(registry.compatibility.legacyPagesRemainAuthoritative, true);

console.log(
  '✓ M3A-W1 tokens, Design System layers, compatibility classes, and immutable Runtime boundaries passed.'
);
