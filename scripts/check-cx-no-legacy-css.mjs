import {validateReleaseR5} from './lib/pr22-release-r5-exact-successor-r1.mjs';
import {currentSharedStylesheetPredecessorBytes} from './lib/current-shared-css-defect-successor-v3.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { root, base, readJson, cxImplementationFiles, cxHtmlSurfaces, normalizedLocalAsset, stylesheetRefs } from './lib/customer-experience-rebuild/cx-r1-guards.mjs';
import {isConvergenceCurrent} from './lib/public-customer-report-convergence-successor-r1.mjs';

const freeze = readJson(`${base}/legacy/legacy-css-freeze-v2.json`);
const frozen = new Set(freeze.entries.map((x) => x.stylesheet));
const successor = readJson(`${base}/legacy/current-shared-stylesheet-successor-v1.json`);
assert.equal(successor.status, 'ENGINEERING_RECONCILIATION');
for (const key of ['historicalFreezeRewritten', 'humanAcceptanceGranted', 'productionAcceptanceGranted']) assert.equal(successor[key], false);
assert.deepEqual(successor.stylesheets.map(item => item.path), ['assets/css/global-visual-r2.css', 'assets/css/ask-architecture-r1.css']);
const currentSharedStylesheets = new Set();
for (const item of successor.stylesheets) {
  assert.ok(!frozen.has(item.path), 'Frozen legacy stylesheet cannot receive a current exception');
  assert.equal(crypto.createHash('sha256').update(currentSharedStylesheetPredecessorBytes(item.path,fs.readFileSync(path.join(root, item.path)))).digest('hex'), item.sha256, `Current stylesheet successor drift: ${item.path}`);
  currentSharedStylesheets.add(item.path);
}
const scopedSuccessor = readJson(`${base}/legacy/current-shared-stylesheet-successor-v2.json`);
assert.equal(scopedSuccessor.status, 'ENGINEERING_RECONCILIATION');
assert.equal(scopedSuccessor.predecessor.path, `${base}/legacy/current-shared-stylesheet-successor-v1.json`);
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, scopedSuccessor.predecessor.path))).digest('hex'), scopedSuccessor.predecessor.sha256);
for (const key of ['historicalFreezeRewritten', 'humanAcceptanceGranted', 'productionAcceptanceGranted']) assert.equal(scopedSuccessor[key], false);
assert.deepEqual(scopedSuccessor.stylesheets.map(item => item.path), ['assets/css/integrated-r42.css']);
const scopedStylesheets = new Map();
for (const item of scopedSuccessor.stylesheets) {
  assert.ok(!frozen.has(item.path), 'Frozen legacy stylesheet cannot receive a current exception');
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, item.path))).digest('hex'), item.sha256, `Current stylesheet successor drift: ${item.path}`);
  assert.deepEqual(item.consumers, ['academy/index.html', 'books/index.html', 'knowledge/ask/index.html', 'search/index.html']);
  scopedStylesheets.set(item.path, new Set(item.consumers));
}
// The separately frozen R3 source has one exact stylesheet and seven exact
// consumers. This carries no visual/publication acceptance and cannot admit a
// frozen legacy stylesheet, another page, or drift in either source identity.
const r3Css='assets/css/six-subjects-r1.css';
const r3Consumers=new Set(['index.html',...['personal','family','team','business','institution','country'].map(x=>'subjects/'+x+'/index.html')]);
function r3ScopedStylesheet(rel,css){
 return css===r3Css&&r3Consumers.has(rel)&&!frozen.has(css)&&isConvergenceCurrent(css)&&isConvergenceCurrent(rel);
}
assert.equal(r3ScopedStylesheet('books/index.html',r3Css),false);
assert.equal(r3ScopedStylesheet('subjects/unknown/index.html',r3Css),false);
assert.equal(r3ScopedStylesheet('index.html','assets/css/phios-public-v2.css'),false);
assert.equal(r3ScopedStylesheet('index.html','assets/css/unregistered.css'),false);
if(isConvergenceCurrent('index.html'))for(const rel of r3Consumers)assert.equal(r3ScopedStylesheet(rel,r3Css),true);

function inspect(rel, text) {
  const hits = [];
  for (const css of frozen) {
    if (text.includes(css) || text.includes(`/${css}`)) hits.push(css);
  }
  return [...new Set(hits)].sort();
}

// Self-test proves the detector does not pass merely because no CX page exists yet.
assert.deepEqual(inspect('fixture-safe', '<link rel="stylesheet" href="/assets/customer-ui/base.css">'), []);
assert.ok(inspect('fixture-bad', '<link rel="stylesheet" href="/assets/css/phios-public-v2.css">').includes('assets/css/phios-public-v2.css'));

function r5ScopedStylesheet(rel,css){if(rel!=='index.html'||!['assets/css/homepage-hero-r4.css','assets/css/homepage-r5.css'].includes(css)||frozen.has(css))return false;validateReleaseR5();return true;}
assert.equal(r5ScopedStylesheet('books/index.html','assets/css/homepage-r5.css'),false);assert.equal(r5ScopedStylesheet('index.html','assets/css/unregistered.css'),false);assert.equal(r5ScopedStylesheet('index.html','assets/css/phios-public-v2.css'),false);
const violations = [];
for (const rel of cxImplementationFiles()) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const css of inspect(rel, text)) violations.push({ file: rel, stylesheet: css, reason: 'FROZEN_LEGACY_STYLESHEET_REFERENCE' });
}

// CX HTML local stylesheets must come from the one customer design-system directory.
for (const rel of cxHtmlSurfaces()) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const href of stylesheetRefs(html)) {
    const local = normalizedLocalAsset(href);
    if (!local) continue;
    if (!local.startsWith('assets/customer-ui/') && !currentSharedStylesheets.has(local) && !scopedStylesheets.get(local)?.has(rel) && !r3ScopedStylesheet(rel,local) && !r5ScopedStylesheet(rel,local)) violations.push({ file: rel, stylesheet: local, reason: 'LOCAL_CSS_OUTSIDE_CUSTOMER_UI' });
  }
}

assert.deepEqual(violations, [], `CX legacy CSS guard failed:\n${violations.map((v) => `${v.file}: ${v.stylesheet} (${v.reason})`).join('\n')}`);
console.log(`✓ CX-R1-W2 legacy CSS import guard passed: ${cxHtmlSurfaces().length} CX HTML surfaces + customer-ui sources contain 0 frozen legacy stylesheet imports.`);
