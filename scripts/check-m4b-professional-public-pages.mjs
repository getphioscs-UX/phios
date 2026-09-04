import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const json = async file => JSON.parse(await read(file));
const exists = async file => fs.access(path.join(root, file)).then(() => true).catch(() => false);

const p1DeletePath = 'content/customer-experience-rebuild/migration/p1-legacy-delete-plan-v2.json';
const p1Deleted = await exists(p1DeletePath)
  && (await json(p1DeletePath)).status === 'PHYSICAL_LEGACY_PRESENTATION_DELETE_COMPLETE';
const personalSurfacePath = p1Deleted
  ? 'perspectives/personal/index.html'
  : 'professional/personal-runtime/index.html';

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
  read(personalSurfacePath),
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

const px2Successor = await json('content/web-production/px2/successors/px2-w11-checker-successor-v1.json');
assert.equal(px2Successor.status, 'ACTIVE');
const px2Active = true;

const hdVocabulary = wprVocabulary.entries.find(entry =>
  Array.isArray(entry.internalCodes) && entry.internalCodes.includes('HUMAN_DESIGN')
);
assert.ok(hdVocabulary, 'WPR_HUMAN_DESIGN_PUBLIC_VOCABULARY_MISSING');
assert.equal(hdVocabulary.renderPolicy, 'CONTROLLED_PUBLIC_LABEL_ONLY');
assert.equal(hdVocabulary.publicLabels.en, 'Personal Runtime Projection');
assert.equal(hdVocabulary.publicLabels['zh-Hans'], '个人运行投射');
assert.ok(hdVocabulary.restrictedTerms.includes('Human Design'));
assert.ok(hdVocabulary.restrictedTerms.includes('人类图'));

// PX2 is the active public-presentation successor. M4B identity/boundaries remain authoritative,
// while predecessor i18n key presence is no longer required on successor surfaces.
assert.ok(services.includes('/assets/css/phios-public-v2.css'));
assert.ok(services.includes('Financial Reality Navigation'));
assert.ok(services.includes('Personal Runtime'));
if (p1Deleted) {
  assert.equal(await exists('professional/personal-runtime/index.html'), false, 'P1 retired Professional Personal Runtime presentation must remain physically deleted');
  assert.ok(personalRuntime.includes('data-cx-surface="PERSONAL_REALITY"'));
  assert.ok(personalRuntime.includes('<link rel="canonical" href="/perspectives/personal/">'));
  assert.ok(redirects.includes('/professional/personal-runtime /perspectives/personal/ 308'));
  assert.ok(redirects.includes('/professional/personal-runtime/ /perspectives/personal/ 308'));
} else {
  assert.ok(personalRuntime.includes('/assets/css/phios-public-v2.css'));
  assert.ok(personalRuntime.includes('Personal Runtime Projection'));
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

for (const name of ['Personal Runtime','Financial Reality Navigation','Integrated Runtime Review']) {
  assert.ok(services.includes(name), `PX2_M4B_PUBLIC_SERVICE_LABEL_MISSING:${name}`);
}

const disclaimer = 'Professional interpretation is not the same as observed evidence.';
const readerDisclaimer = 'External Readers are used as interpretive perspectives, not as diagnostic, deterministic or evidentiary systems.';
assert.ok(services.includes('边界') || services.includes('boundary'));
assert.ok(p1Deleted ? personalRuntime.includes('Perspective ≠ Fact') : (personalRuntime.includes('Projection ≠ Evidence') || personalRuntime.includes('interpretation')));
for (const page of [readers]) {
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
  if (p1Deleted && file === 'professional/personal-runtime/index.html') {
    assert.equal(await exists(file), false, 'P1 retired WPR Personal Runtime presentation must remain physically deleted');
    continue;
  }
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

console.log(p1Deleted ? '✓ M4B-W7 / WPR-D historical public-page authority preserved; P1 Personal Reality successor reconciliation passed.' : '✓ M4B-W7 / WPR-D Professional Public Pages reconciliation passed.');
console.log('  M4B internal service/reader identity and boundaries remain preserved; WPR-W13 controls public labels and WPR-W4 controls the canonical public route.');
console.log('  Prices and checkout remain unpublished; External Readers remain interpretation-only and outside the main navigation.');
