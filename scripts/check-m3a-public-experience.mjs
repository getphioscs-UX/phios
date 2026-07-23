import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

const publicPages = [
  'index.html',
  'about.html',
  'explore.html',
  'thesis.html',
  'academy.html',
  'services.html',
  'reality-demo.html',
  'privacy.html',
  'terms.html',
  'ai-disclosure.html',
  'professional-boundary.html',
  'contact.html'
];

for (const page of publicPages) {
  assert.ok(fs.existsSync(page), `${page} must exist`);
  const source = read(page);
  assert.ok(
    source.includes('/assets/css/public-experience.css'),
    `${page} must load the public experience stylesheet`
  );
  assert.ok(
    source.includes('/assets/js/public-shell.js'),
    `${page} must load the unified public shell`
  );
}

const shell = read('assets/js/public-shell.js');
const navOrder = [
  "'discover'",
  "'knowledge'",
  "'reality'",
  "'professional'",
  "'about'"
];
let cursor = -1;
for (const label of navOrder) {
  const index = shell.indexOf(`id: ${label}`, cursor + 1);
  assert.ok(index > cursor, `Public navigation order is invalid at ${label}`);
  cursor = index;
}

const footerOrder = [
  "'/thesis'",
  "'/explore#books'",
  "'/explore'",
  "'/reality-demo'",
  "'/services'",
  "'/privacy'",
  "'/terms'",
  "'/contact'"
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
  "window.innerWidth > 1000",
  'data-locale="en"',
  'data-locale="zh-Hans"'
]) {
  assert.ok(shell.includes(contract), `Public shell is missing ${contract}`);
}

const home = read('index.html');
for (const statement of [
  'Reality has structure.',
  'Reality can be understood.',
  'Reality can be navigated.',
  'Explore Knowledge',
  'Experience Reality Journey',
  'Discover PHI OS'
]) {
  assert.ok(home.includes(statement), `Discover is missing: ${statement}`);
}

for (const section of [
  'problem-title',
  'entries-title',
  'overview-title',
  'ecosystem-title',
  'book-preview-title'
]) {
  assert.ok(home.includes(`id="${section}"`), `Discover is missing #${section}`);
}

const about = read('about.html');
for (const section of [
  'why-phios',
  'research-foundation',
  'three-books',
  'fourteen-part-architecture',
  'platform',
  'future-ecosystem',
  'figure-v2'
]) {
  assert.ok(about.includes(`id="${section}"`), `About is missing #${section}`);
}
assert.ok(
  about.includes('Figure V.2 · PHI OS Ecosystem Architecture'),
  'About must include Figure V.2'
);

const demo = read('reality-demo.html');
for (const label of [
  'Observed Change',
  'Evidence',
  'Reading',
  'Navigation',
  'Start Full Reality Journey'
]) {
  assert.ok(demo.includes(label), `Reality Demo is missing ${label}`);
}

const demoRuntime = read('assets/js/pages/reality-demo.js');
for (const forbidden of [
  'sessionStorage',
  'localStorage',
  'fetch(',
  'RuntimeKernel',
  'setSession',
  'runtime-persistence',
  '/api/'
]) {
  assert.ok(
    !demoRuntime.includes(forbidden),
    `Reality Demo must not use ${forbidden}`
  );
}

const aiDisclosure = read('assets/js/locales/en/public.js');
for (const disclosure of [
  'AI-assisted',
  'Not medical diagnosis',
  'Not legal advice',
  'Not a financial recommendation'
]) {
  assert.ok(aiDisclosure.includes(disclosure), `AI Disclosure is missing: ${disclosure}`);
}

const css = read('assets/css/public-experience.css');
for (const responsiveContract of [
  '@media (max-width: 1000px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '.public-menu-toggle',
  'min-height: 44px'
]) {
  assert.ok(css.includes(responsiveContract), `Responsive CSS is missing ${responsiveContract}`);
}

const registry = JSON.parse(read('content/registry/m3a-public-experience.json'));
assert.equal(registry.status, 'public-experience-ready');
assert.equal(registry.deliverables.demo.writesFormalRuntimeMemory, false);
assert.equal(registry.acceptance.runtimeContractsChanged, false);
assert.equal(registry.acceptance.d1BindingChanged, false);

const wrangler = read('wrangler.jsonc');
assert.ok(wrangler.includes('"binding": "RUNTIME_DB"'), 'RUNTIME_DB binding changed');
assert.ok(
  wrangler.includes('073639fa-01e4-4868-af10-6ed032637dab'),
  'Production Runtime D1 database changed'
);

console.log('✓ M3A-W2–W6 Public Experience passed: unified navigation, Discover, About, Demo, bilingual trust and mobile contracts.');
console.log('  Reality Demo remains isolated from API, session storage and formal Runtime Memory.');
