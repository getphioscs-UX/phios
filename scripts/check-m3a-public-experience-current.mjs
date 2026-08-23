import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const text = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(text(path), 'utf8').digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, code) => {
  const marker = source.indexOf(`data-hpc2-scene="${code}"`);
  assert.ok(marker >= 0, `Current Homepage is missing ${code}`);
  const start = source.lastIndexOf('<section', marker);
  const end = source.indexOf('</section>', marker);
  assert.ok(start >= 0 && end > marker, `${code} section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const HISTORICAL_CHECKER = 'scripts/check-m3a-public-experience.mjs';
const RECONCILIATION = 'content/web-production/reconciliation/m3a-hpc2-public-experience-successor-v1.json';
const HPC2_ACCEPTANCE = 'content/web/homepage/hpc2/acceptance/homepage-composition-acceptance-v2.json';
const HPC2_SCENES = 'content/web/homepage/hpc2/homepage-scene-registry-v2.json';
const HPC2_CSS = 'assets/css/hpc2-pre-home-visuals.css';

for (const path of [HISTORICAL_CHECKER, RECONCILIATION, HPC2_ACCEPTANCE, HPC2_SCENES, HPC2_CSS]) {
  assert.ok(fs.existsSync(path), `Missing M3A successor dependency: ${path}`);
}

const reconciliation = read(RECONCILIATION);
const hpc2Acceptance = read(HPC2_ACCEPTANCE);
const hpc2Scenes = read(HPC2_SCENES);
const hpc2Css = text(HPC2_CSS);

assert.equal(reconciliation.baselineCommit, '64ead9a9addf56f4f83c28736bf205cdc9380c10');
assert.equal(reconciliation.status, 'HISTORICAL_M3A_DISCOVER_COPY_RECONCILED_TO_HPC2_CURRENT_HOMEPAGE');
assert.equal(reconciliation.historicalChecker.path, HISTORICAL_CHECKER);
assert.equal(reconciliation.historicalChecker.sha256, sha256(HISTORICAL_CHECKER));
assert.equal(reconciliation.historicalChecker.rewritten, false);
assert.equal(reconciliation.currentAuthority.homepageComposition, HPC2_ACCEPTANCE);
assert.equal(reconciliation.currentAuthority.sceneAuthority, HPC2_SCENES);
assert.equal(reconciliation.currentAuthority.secondPublicExperienceAuthorityCreated, false);
assert.equal(reconciliation.preservedBoundaries.publicShell, true);
assert.equal(reconciliation.preservedBoundaries.bilingual, true);
assert.equal(reconciliation.preservedBoundaries.realityDemoRetired, true);
assert.equal(reconciliation.preservedBoundaries.runtimeContractsChanged, false);
assert.equal(reconciliation.preservedBoundaries.d1BindingChanged, false);
assert.equal(hpc2Acceptance.status, 'HPC2_COMPOSITION_READY');
assert.equal(hpc2Acceptance.globalProductionFreeze.claimed, false);

const px2Path = 'content/web-production/px2/successors/px2-w11-checker-successor-v1.json';
if (fs.existsSync(px2Path) && read(px2Path).status === 'ACTIVE') {
  const px2Pages = ['index.html','library.html','articles.html','services.html','knowledge-search.html','books/index.html','professional/personal-runtime/index.html','professional/financial/index.html','reality/index.html','search/index.html','readings/index.html'];
  for (const page of px2Pages) {
    const source = text(page);
    assert.ok(source.includes('/assets/css/phios-public-v2.css'), `${page} must load PX2 public experience`);
    assert.ok(source.includes('/assets/js/public-shell-v2.js'), `${page} must load PX2 shell`);
  }
  const home = text('index.html');
  for (const href of ['/search/','/knowledge-search','/readings/','/professional/financial/','/reality/']) assert.ok(home.includes(href));
  assert.ok(home.includes('data-px2-intent-form'));
  console.log('✓ M3A current public experience reconciled to PX2 Public Experience V2 successor.');
  console.log('  Historical M3A/HPC2 authority remains evidence; current primary public composition is Search + Ask + Readings + Financial + My Reality.');
  process.exit(0);
}

const publicPages = [
  'index.html',
  'about.html',
  'explore.html',
  'thesis.html',
  'academy.html',
  'articles.html',
  'services.html',
  'reality-journey.html',
  'privacy.html',
  'terms.html',
  'ai-disclosure.html',
  'professional-boundary.html',
  'contact.html'
];
for (const page of publicPages) {
  assert.ok(fs.existsSync(page), `${page} must exist`);
  const source = text(page);
  assert.ok(source.includes('/assets/css/public-experience.css'), `${page} must load the public experience stylesheet`);
  assert.ok(source.includes('/assets/js/public-shell.js'), `${page} must load the unified public shell`);
}

const shell = text('assets/js/public-shell.js');
const navOrder = ["'discover'", "'knowledge'", "'reality'", "'professional'", "'about'"];
let cursor = -1;
for (const label of navOrder) {
  const index = shell.indexOf(`id: ${label}`, cursor + 1);
  assert.ok(index > cursor, `Public navigation order is invalid at ${label}`);
  cursor = index;
}
const footerOrder = [
  "'/library'", "'/articles'", "'/thesis'", "'/book-one'", "'/explore'",
  "'/reality-journey'", "'/services'", "'/about'", "'/privacy'", "'/terms'", "'/contact'"
];
cursor = shell.indexOf('const FOOTER_LINKS');
for (const href of footerOrder) {
  const index = shell.indexOf(`href: ${href}`, cursor + 1);
  assert.ok(index > cursor, `Public footer order is invalid at ${href}`);
  cursor = index;
}
for (const contract of [
  'aria-controls="public-navigation"',
  "event.key === 'Escape'",
  'window.innerWidth > 1000',
  'data-locale="en"',
  'data-locale="zh-Hans"'
]) {
  assert.ok(shell.includes(contract), `Public shell is missing ${contract}`);
}
assert.ok(shell.includes('href="/account"'), 'Public shell is missing Sign In');
assert.ok(shell.includes("id: 'reality', href: '/reality-journey'"), 'Public shell is missing Reality Journey');
assert.ok(shell.includes("id: 'professional', href: '/services'"), 'Public shell is missing Professional');

// M3A Discover exact-copy assertions are historical. Current Homepage authority is HPC2 H01-H09.
const home = text('index.html');
const sceneOrder = [...home.matchAll(/data-hpc2-scene="(H\d\d)"/g)].map(match => match[1]);
assert.deepEqual(sceneOrder, ['H01','H02','H03','H04','H05','H06','H07','H08','H09']);
assert.deepEqual(hpc2Scenes.sceneOrder, sceneOrder);
assert.equal(count(home, /data-hpc2-scene="H\d\d"/g), 9);

const h02 = sceneMarkup(home, 'H02');
const h04 = sceneMarkup(home, 'H04');
const h05 = sceneMarkup(home, 'H05');
const h06 = sceneMarkup(home, 'H06');
const h07 = sceneMarkup(home, 'H07');
const h08 = sceneMarkup(home, 'H08');
const h09 = sceneMarkup(home, 'H09');
assert.match(h02, /data-hpc2-figure="FIG-054"/);
assert.match(h04, /The intelligence is not one model\. It is an architecture\./);
assert.match(h04, /data-hpc2-runtime-stage="READING"[\s\S]*data-hpc2-runtime-stage="NAVIGATION"/);
assert.match(h05, /What is changing, difficult or unclear right now\?/);
assert.match(h06, /href="\/reality-journey"/);
assert.match(h07, /data-hpc2-five-volume-state=/);
assert.match(h08, /href="\/services"/);
assert.match(h08, /data-hpc2-authority-level="PHIOS_PROFESSIONAL"/);
assert.match(h09, /data-hpc2-continuity-loop="UNDERSTAND_CHOOSE_ACT_OBSERVE_REVIEW_CONTINUE"/);

assert.equal(reconciliation.staleAssertions.length, 5);
assert.deepEqual(Object.keys(reconciliation.historicalSections).sort(), ['boundary-title','entries-title','value-title']);
for (const section of ['entries-title','value-title','boundary-title']) {
  assert.ok(home.includes(`id="${section}"`), `Historical source-compatibility section missing #${section}`);
}
for (const selector of [
  'section[aria-labelledby="value-title"]',
  'section[aria-labelledby="entries-title"]',
  'section[aria-labelledby="boundary-title"]'
]) {
  assert.ok(hpc2Css.includes(selector), `Historical M3A compatibility section must be non-rendered: ${selector}`);
}
assert.match(hpc2Css, /HPC2-W14[\s\S]*display:\s*none\s*!important;/);

const about = text('about.html');
for (const section of ['why-phios', 'responsibility', 'limits', 'trust']) {
  assert.ok(about.includes(`id="${section}"`), `About is missing #${section}`);
}
assert.ok(about.includes('Teresa Lee'), 'About must include builder trust information');

assert.equal(fs.existsSync('reality-demo.html'), false, 'Retired Reality Demo page must be absent');
assert.equal(fs.existsSync('assets/js/pages/reality-demo.js'), false, 'Retired Reality Demo controller must be absent');
assert.match(text('_redirects'), /^\/reality-demo \/reality-journey 308$/m);

const aiDisclosure = text('assets/js/locales/en/public.js');
for (const disclosure of ['AI-assisted', 'Not medical diagnosis', 'Not legal advice', 'Not a financial recommendation']) {
  assert.ok(aiDisclosure.includes(disclosure), `AI Disclosure is missing: ${disclosure}`);
}

const css = text('assets/css/public-experience.css');
for (const responsiveContract of [
  '@media (max-width: 1000px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '.public-menu-toggle',
  'min-height: 44px'
]) {
  assert.ok(css.includes(responsiveContract), `Responsive CSS is missing ${responsiveContract}`);
}

const registry = read('content/registry/m3a-public-experience.json');
assert.equal(registry.status, 'public-experience-ready');
assert.equal(registry.deliverables.demo.writesFormalRuntimeMemory, false, 'Historical M3A boundary remains recorded');
assert.equal(registry.acceptance.runtimeContractsChanged, false);
assert.equal(registry.acceptance.d1BindingChanged, false);

const wrangler = text('wrangler.jsonc');
assert.ok(wrangler.includes('"binding": "RUNTIME_DB"'), 'RUNTIME_DB binding changed');
assert.ok(wrangler.includes('073639fa-01e4-4868-af10-6ed032637dab'), 'Production Runtime D1 database changed');

console.log('✓ M3A current public experience successor passed: historical M3A authority is preserved while Discover is governed by HPC2 H01-H09.');
console.log('  Unified shell, bilingual trust, responsive contracts, Reality Demo retirement and Runtime/D1 boundaries remain intact.');
console.log('  Historical exact Discover copy is not reintroduced; source-compatibility sections remain non-rendered under HPC2-W14.');
