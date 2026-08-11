import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const json = async file => JSON.parse(await read(file));

const [
  services,
  personalRuntime,
  legacyHumanDesign,
  readers,
  css,
  en,
  zh,
  registry,
  pricing,
  shell,
  wprVocabulary,
  wprRouteRegistry,
  migrationClosure,
  reconciliation,
  redirects
] = await Promise.all([
  read('services.html'),
  read('professional/personal-runtime/index.html'),
  read('professional/human-design/index.html'),
  read('professional/external-readers/index.html'),
  read('assets/css/public-experience.css'),
  read('assets/js/locales/en/public.js'),
  read('assets/js/locales/zh-Hans/public.js'),
  json('content/registry/m4b-professional-public-pages.json'),
  json('content/registry/professional-pricing-policy.json'),
  read('assets/js/public-shell.js'),
  json('content/web-production/registries/wpr-public-vocabulary-registry-v1.json'),
  json('content/web-production/registries/wpr-route-registry-v1.json'),
  json('content/web-production/audits/wpr-public-vocabulary-migration-closure-v1.json'),
  json('content/web-production/audits/wpr-d-m4b-public-vocabulary-reconciliation-v1.json'),
  read('_redirects')
]);

const hdVocabulary = wprVocabulary.entries.find(entry =>
  Array.isArray(entry.internalCodes) && entry.internalCodes.includes('HUMAN_DESIGN')
);
assert.ok(hdVocabulary, 'WPR_HUMAN_DESIGN_PUBLIC_VOCABULARY_MISSING');
assert.equal(hdVocabulary.renderPolicy, 'CONTROLLED_PUBLIC_LABEL_ONLY');
assert.equal(hdVocabulary.publicLabels.en, 'Personal Runtime Projection');
assert.equal(hdVocabulary.publicLabels['zh-Hans'], '个人运行投射');
assert.ok(hdVocabulary.restrictedTerms.includes('Human Design'));
assert.ok(hdVocabulary.restrictedTerms.includes('人类图'));

// Preserve the M4B public-service structure and i18n keys; WPR-W13 owns visible public labels.
for (const key of ['runtimeReading','humanDesign','consultation','navigationFollowup','longTermReview']) {
  assert.ok(services.includes(`servicesPublic.${key}`), `M4B_SERVICE_I18N_KEY_MISSING:${key}`);
}
for (const key of ['whatTitle','useTitle','examineTitle','cannotTitle','optionsTitle','processTitle','materialsTitle','boundaryTitle','priceTitle','book']) {
  assert.ok(personalRuntime.includes(`humanDesignPublic.${key}`), `M4B_PERSONAL_RUNTIME_I18N_KEY_MISSING:${key}`);
}

// The frozen M4B internal identity remains preserved, while WPR-D owns the public route successor.
assert.ok(registry.routes.includes('/professional/human-design'));
assert.ok(registry.publicServices.includes('human_design_runtime_interpretation'));
assert.equal(registry.readerAvailability.human_design, 'available');
assert.equal(registry.readerAvailability.bazi, 'planned');

const canonicalRoute = wprRouteRegistry.entries.find(entry => entry.routeCode === 'PROFESSIONAL_PERSONAL_RUNTIME');
assert.ok(canonicalRoute, 'WPR_PERSONAL_RUNTIME_ROUTE_MISSING');
assert.equal(canonicalRoute.path, '/professional/personal-runtime');
assert.equal(canonicalRoute.surfaceCode, 'PROFESSIONAL');
const legacyRoute = wprRouteRegistry.legacyCompatibility.find(entry => entry.legacyPath === '/professional/human-design');
assert.ok(legacyRoute, 'WPR_LEGACY_HUMAN_DESIGN_ROUTE_MISSING');
assert.equal(legacyRoute.targetRouteCode, 'PROFESSIONAL_PERSONAL_RUNTIME');
assert.equal(legacyRoute.status, 'LEGACY_INTERNAL_TERM_ROUTE_COMPATIBILITY_REDIRECT');
assert.ok(legacyHumanDesign.includes('/professional/personal-runtime'));
assert.ok(legacyHumanDesign.includes("location.replace('/professional/personal-runtime')"));
assert.ok(redirects.includes('/professional/human-design /professional/personal-runtime 308'));

// Reader availability remains structurally identical, but the available reader uses the controlled public label.
for (const reader of [hdVocabulary.publicLabels.en, 'BaZi', 'Zi Wei', 'Gene Keys', 'Astrology']) {
  assert.ok(readers.includes(reader), `M4B_READER_PUBLIC_LABEL_MISSING:${reader}`);
}
assert.equal((readers.match(/data-i18n="externalReadersPublic.available"/g) || []).length, 1);
assert.equal((readers.match(/data-i18n="externalReadersPublic.planned"/g) || []).length, 4);

for (const name of [
  'Automated Runtime Reading',
  'Professional Runtime Reading',
  'Personal Runtime Foundation Report',
  hdVocabulary.publicLabels.en,
  'Reality-Specific Interpretation',
  'Integrated Runtime Review'
]) {
  assert.ok(services.includes(name), `M4B_PUBLIC_SERVICE_LABEL_MISSING:${name}`);
}

const disclaimer = 'Professional interpretation is not the same as observed evidence.';
const readerDisclaimer = 'External Readers are used as interpretive perspectives, not as diagnostic, deterministic or evidentiary systems.';
for (const page of [services, personalRuntime, readers]) {
  assert.ok(page.includes('servicesPublic.disclaimerOne'));
  assert.ok(page.includes('servicesPublic.disclaimerTwo'));
}
assert.ok(en.includes(disclaimer));
assert.ok(en.includes(readerDisclaimer));
assert.ok(zh.includes('专业解释并不等同于观察证据。'));
assert.ok(zh.includes('不属于诊断、确定性判断或证据系统'));

assert.equal(pricing.amountsPublished, false);
assert.equal(pricing.checkoutEnabled, false);
assert.equal(registry.boundaries.readerInterpretationWritesRuntimeMemory, false);
assert.ok(css.includes('@media (max-width: 768px)'));
assert.ok(css.includes('@media (max-width: 520px)'));

for (const forbidden of ['human-design','bazi','ziwei','gene-keys','astrology']) {
  assert.equal((shell.match(new RegExp(`href=["'][^"']*${forbidden}`, 'g')) || []).length, 0);
}

// Activated public/customer targets must not regress to WPR-restricted visible terminology.
assert.equal(migrationClosure.status, 'closed_on_activated_public_customer_targets');
assert.deepEqual(migrationClosure.remainingHits, []);
for (const file of migrationClosure.activatedTargetFiles) {
  const text = await read(file);
  for (const restricted of hdVocabulary.restrictedTerms) {
    assert.equal(text.includes(restricted), false, `WPR_RESTRICTED_PUBLIC_TERM_REGRESSION:${file}:${restricted}`);
  }
}

assert.equal(reconciliation.status, 'M4B_STRUCTURE_PRESERVED_WPR_PUBLIC_VOCABULARY_SUCCESSOR_ACTIVE');
assert.equal(reconciliation.m4bInternalIdentityPreserved, true);
assert.equal(reconciliation.wprPublicVocabularyAuthorityPreserved, true);
assert.equal(reconciliation.legacyRouteCompatibilityPreserved, true);
assert.equal(reconciliation.m4bPaymentAndBoundarySemanticsChanged, false);

console.log('✓ M4B-W7 / WPR-D Professional Public Pages reconciliation passed.');
console.log('  M4B internal service/reader identity and boundaries remain preserved; WPR-W13 controls public labels and WPR-W4 controls the canonical public route.');
console.log('  Prices and checkout remain unpublished; External Readers remain interpretation-only and outside the main navigation.');
