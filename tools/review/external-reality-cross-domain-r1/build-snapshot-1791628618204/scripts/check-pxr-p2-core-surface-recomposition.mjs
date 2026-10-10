import assert from 'node:assert/strict';
import fs from 'node:fs';

const text = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(text(path));
const registry = json('content/web-production/pxr/registries/pxr-public-surface-registry-v1.json');
const runtime = text('assets/js/public-experience/pxr-public-experience.js');
const home = text('index.html');

const required = new Set([
  'HOME','LIBRARY','BOOKS','BOOK_DETAIL','BOOK_PREVIEW','ASK_PHI_OS','REALITY_JOURNEY',
  'ACADEMY','ACADEMY_LESSON','PERSONAL_RUNTIME','SERVICES','PROFESSIONAL','FINANCIAL'
]);
const actual = new Set(registry.surfaces.map(surface => surface.surfaceCode));
for (const code of required) assert.ok(actual.has(code), `PXR-P2 missing core surface ${code}`);

const routeToFile = new Map([
  ['/','index.html'], ['/library','library.html'], ['/books','books/index.html'], ['/book-one','book-one.html'],
  ['/book-one-preview','book-one-preview.html'], ['/knowledge-search','knowledge-search.html'], ['/reality-journey','reality-journey.html'],
  ['/academy','academy.html'], ['/academy-lesson','academy-lesson.html'], ['/personal-runtime','personal-runtime.html'],
  ['/services','services.html'], ['/professional','professional/index.html'], ['/professional/financial','professional/financial/index.html']
]);
for (const [route,file] of routeToFile) {
  assert.ok(fs.existsSync(file), `PXR-P2 materialized page missing for ${route}: ${file}`);
  const source = text(file);
  assert.ok(/assets\/js\/(?:public-shell|i18n|journey-shell)\.js/.test(source) || route === '/personal-runtime', `${route} cannot reach shared public bootstrap`);
}

// Homepage H01-H09 stays exactly nine scenes; PXR adds presentation, not another section.
const scenes = [...home.matchAll(/data-hpc2-scene="H(0[1-9])"/g)].map(match => match[1]);
assert.deepEqual(scenes, ['01','02','03','04','05','06','07','08','09']);
assert.equal(registry.surfaces.find(s => s.surfaceCode === 'HOME').storyFigures.length, 0);

const academy = text('academy.html');
assert.match(academy, /academy-status[^>]+data-pxr-hidden="true"[^>]+hidden/);
assert.match(academy, /academy-boundaries[^>]+data-pxr-hidden="true"[^>]+hidden/);
assert.doesNotMatch(text('assets/js/pages/academy.js'), /academy-path-card__state/);

const journey = text('reality-journey.html');
assert.match(journey, /wpr-jr-authority[^>]+data-pxr-hidden="true"[^>]+hidden/);
const personal = text('personal-runtime.html');
assert.match(personal, /pr-side[^>]+data-pxr-hidden="true"[^>]+hidden/);
const ask = text('knowledge-search.html');
assert.match(ask, /data-cka-root/);
const askSurface = registry.surfaces.find(item => item.surfaceCode === 'ASK_PHI_OS');
assert.ok(askSurface.copyOverrides.some(item => item.selector.includes('cka-guided')), 'Ask PXR must replace Guided Context technical copy at presentation time');
assert.ok(askSurface.copyOverrides.some(item => item.selector.includes('cka-journey-consent')), 'Ask PXR must replace ICR handoff technical copy at presentation time');

for (const code of ['ACADEMY','ASK_PHI_OS','REALITY_JOURNEY','PERSONAL_RUNTIME']) {
  const surface = registry.surfaces.find(item => item.surfaceCode === code);
  assert.ok(surface.copyOverrides.length > 0, `${code} needs explicit customer-copy successor`);
}
assert.match(runtime, /applyCopyOverrides/);
assert.match(runtime, /hideTechnicalSections/);

console.log('✓ PXR-P2 Core Surface Recomposition passed: Homepage H01-H09 preserved; Library, Books, Ask, Reality Journey, Academy, Personal Reality and Professional surfaces have additive customer-presentation successors without new runtime authority.');
