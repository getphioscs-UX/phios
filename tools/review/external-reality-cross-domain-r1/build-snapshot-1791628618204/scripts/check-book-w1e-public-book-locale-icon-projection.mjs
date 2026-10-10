import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import enAtlas from '../assets/js/locales/en/atlas.js';
import zhAtlas from '../assets/js/locales/zh-Hans/atlas.js';
import enPublic from '../assets/js/locales/en/public.js';
import zhPublic from '../assets/js/locales/zh-Hans/public.js';
import {
  BOOK_ASSET_CODE_BY_ID,
  BOOK_COMPATIBILITY_ROUTES,
  BOOK_ROUTE_BY_ID
} from '../assets/js/web-production/public-surface-data.js';

const read = path => fs.readFile(path, 'utf8');
const json = async path => JSON.parse(await read(path));
const sha256 = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const CANDIDATE_PATH = 'content/knowledge/migrations/book-w1e/public-book-locale-icon-projection-candidate-v1.json';
const ACCEPTANCE_PATH = 'content/knowledge/migrations/book-w1e/book-w1e-human-acceptance-v1.json';
const ACTIVE_PATH = 'content/knowledge/migrations/book-w1e/public-book-locale-icon-projection-active-v1.json';
const MATERIALIZATION_RECONCILIATION_PATH = 'content/knowledge/migrations/book-w1e/book-w1e-public-assets-materialization-reconciliation-v1.json';

const [
  candidateRaw,
  candidate,
  acceptance,
  active,
  contract,
  books,
  parts,
  publicMetadata,
  publicAssets,
  composition,
  routeRegistry,
  redirects,
  materializationReconciliation
] = await Promise.all([
  read(CANDIDATE_PATH),
  json(CANDIDATE_PATH),
  json(ACCEPTANCE_PATH),
  json(ACTIVE_PATH),
  json('content/knowledge/migrations/five-volume-migration-contract-v1.json'),
  json('content/registry/books.json'),
  json('content/registry/parts.json'),
  json('content/knowledge/public/public-book-metadata.json'),
  json('content/registry/public-assets.json'),
  json('content/web-production/composition/public/book-composition-v1.json'),
  json('content/web-production/registries/wpr-route-registry-v1.json'),
  read('_redirects'),
  json(MATERIALIZATION_RECONCILIATION_PATH)
]);

const expectedRoutes = {
  'BOOK-1': '/books/reality-formation/',
  'BOOK-2': '/books/reality-runtime/',
  'BOOK-3': '/books/reality-continuity/',
  'BOOK-4': '/books/reality-civilization/',
  'BOOK-5': '/books/reality-navigation/'
};
const expectedOwnership = {
  'BOOK-1': ['P1', 'P2', 'P3', 'P4'],
  'BOOK-2': ['P5', 'P6', 'P7'],
  'BOOK-3': ['P8', 'P9'],
  'BOOK-4': ['P10', 'P11', 'P12'],
  'BOOK-5': ['P13', 'P14', 'P15']
};
const expectedPartTitles = {
  P8: ['Runtime Maintenance', '运行维持'],
  P9: ['Coordination Runtime', '协调运行'],
  P10: ['Runtime Expansion', '运行扩展'],
  P11: ['Civilization Runtime', '文明运行'],
  P12: ['Civilization Atlas', '文明图谱'],
  P13: ['Reading Science', '读取科学'],
  P14: ['Navigation Science', '导航科学'],
  P15: ['Reality Continuation', '现实延续']
};
const expectedVocabulary = {
  'BOOK-3': {
    primary: ['maintenance', 'reconfiguration', 'recovery', 'coordination', 'emergence', 'continuity'],
    legacy: []
  },
  'BOOK-4': {
    primary: ['scale', 'replication', 'distribution', 'infrastructure', 'civilization', 'atlas'],
    legacy: ['migration', 'cycles', 'functions', 'ecology', 'coordinates', 'succession']
  },
  'BOOK-5': {
    primary: ['reading', 'evidence', 'navigation', 'action', 'outcome', 'continuation', 'formation'],
    legacy: ['continuity', 'ai', 'future', 'evolution'],
    retainedNonPrimary: ['ai']
  }
};

assert.equal(sha256(candidateRaw), acceptance.reviewedArtifactSha256);
assert.equal(active.sourceCandidate.sha256, acceptance.reviewedArtifactSha256);
assert.deepEqual(candidate.canonicalBookRoutes.map(({ bookCode, route }) => [bookCode, route]), Object.entries(expectedRoutes));
assert.equal(acceptance.status, 'HUMAN_APPROVED');
assert.equal(acceptance.humanActor, 'TL');
assert.equal(acceptance.decision, 'ACCEPT');
assert.equal(acceptance.activation.currentProductionMutationAllowed, true);
assert.equal(acceptance.activation.publicProjectionAuthorityCreated, true);
assert.equal(active.status, 'HUMAN_APPROVED_ACTIVE_PUBLIC_PROJECTION');
assert.deepEqual(active.canonicalBookRoutes, expectedRoutes);
assert.deepEqual(active.ownership, expectedOwnership);
assert.deepEqual(active.visualVocabulary, expectedVocabulary);
assert.equal(materializationReconciliation.status, 'OMITTED_ACCEPTED_MATERIALIZATION_RESTORED');
assert.equal(materializationReconciliation.authority.newHumanDecisionCreated, false);
assert.equal(materializationReconciliation.authority.publicProjectionAuthorityExpanded, false);
assert.equal(materializationReconciliation.publicAssets.restoredSha256, sha256(await read('content/registry/public-assets.json')));
assert.equal(materializationReconciliation.bookComposition.restoredSha256, sha256(await read('content/web-production/composition/public/book-composition-v1.json')));
assert.equal(materializationReconciliation.routeRegistry.restoredSha256, sha256(await read('content/web-production/registries/wpr-route-registry-v1.json')));
assert.equal(materializationReconciliation.publicDiscoveryRegistry.restoredSha256, sha256(await read('content/web-production/registries/wpr-public-discovery-registry-v1.json')));
assert.equal(materializationReconciliation.activeProjection.currentSha256, sha256(await read(ACTIVE_PATH)));
assert.equal(materializationReconciliation.activeProjection.historicalAcceptanceRewritten, false);
assert.equal(materializationReconciliation.publicAssets.book5DeliveryActivated, false);
assert.equal(materializationReconciliation.boundaries.assetMarkedVerifiedWithoutEvidence, false);

assert.equal(books.architecture, 'five-volume-15-part');
assert.equal(parts.architecture, 'five-volume-15-part');
assert.equal(books.books.length, 5);
assert.equal(parts.parts.length, 15);
assert.deepEqual(BOOK_ROUTE_BY_ID, Object.fromEntries(Object.entries(expectedRoutes).map(([code, route]) => [`book-${Number(code.slice(5))}`, route])));
assert.deepEqual(Object.keys(BOOK_ASSET_CODE_BY_ID), ['book-1', 'book-2', 'book-3', 'book-4', 'book-5']);
assert.deepEqual(BOOK_COMPATIBILITY_ROUTES['/books/reality-maintenance/'], {
  target: '/books/reality-continuity/', redirectStatus: 308, canonicalAuthority: false
});

for (const [bookCode, partCodes] of Object.entries(expectedOwnership)) {
  const book = books.books.find(record => record.bookCode === bookCode);
  assert(book, `Missing ${bookCode}.`);
  assert.deepEqual(book.parts.map(number => `P${number}`), partCodes);
  assert.equal(publicMetadata.records.find(record => record.bookCode === bookCode)?.canonicalRoute, expectedRoutes[bookCode]);
}
assert.equal(publicMetadata.architecture, 'five-volume-15-part');
assert.equal(publicMetadata.recordCount, 5);
assert.deepEqual(publicMetadata.records.map(record => record.title.en), [
  'Reality Formation', 'Reality Runtime', 'Reality Continuity', 'Reality Civilization', 'Reality Navigation'
]);

assert.equal(publicAssets.assets.filter(asset => asset.category === 'book-cover').length, 5);
assert(publicAssets.assets.some(asset => asset.asset_code === 'BOOK-5-HARDCOVER' && asset.book_id === 'book-5'));
assert.deepEqual(publicAssets.book_visual_vocabulary['BOOK-3'].primary, expectedVocabulary['BOOK-3'].primary);
assert.deepEqual(publicAssets.book_visual_vocabulary['BOOK-4'].legacy, expectedVocabulary['BOOK-4'].legacy);
assert.deepEqual(publicAssets.book_visual_vocabulary['BOOK-5'].primary, expectedVocabulary['BOOK-5'].primary);
assert.deepEqual(publicAssets.book_visual_vocabulary['BOOK-5'].retainedNonPrimary, ['ai']);
assert(!publicAssets.book_visual_vocabulary['BOOK-5'].primary.includes('ai'));

assert.deepEqual(composition.bookOneOwnership, [1, 2, 3, 4]);
assert.deepEqual(composition.bookTwoOwnership, [5, 6, 7]);
assert.deepEqual(composition.bookThreeOwnership, [8, 9]);
assert.deepEqual(composition.bookFourOwnership, [10, 11, 12]);
assert.deepEqual(composition.bookFiveOwnership, [13, 14, 15]);
assert.deepEqual(composition.canonicalRoutes, expectedRoutes);
assert.deepEqual(composition.compatibilityRoutes['/books/reality-maintenance/'], {
  target: '/books/reality-continuity/', redirectStatus: 308, canonicalAuthority: false
});

assert.equal(enAtlas.atlas.hero.subtitle.includes('five books'), true);
assert.equal(zhAtlas.atlas.hero.subtitle.includes('五册体系'), true);
assert.equal(enAtlas.atlas.books.bookThreeEnglish, 'Reality Continuity');
assert.equal(enAtlas.atlas.books.bookFourEnglish, 'Reality Civilization');
assert.equal(enAtlas.atlas.books.bookFiveEnglish, 'Reality Navigation');
assert.equal(zhAtlas.atlas.books.bookThreeEnglish, 'Reality Continuity');
assert.equal(zhAtlas.atlas.books.bookFourEnglish, 'Reality Civilization');
assert.equal(zhAtlas.atlas.books.bookFiveEnglish, 'Reality Navigation');
assert.equal(enPublic.discover.production.booksEyebrow, 'Canonical Knowledge · Five Volumes');
assert.equal(zhPublic.discover.production.booksEyebrow, 'Canonical Knowledge · 五册');
for (const [partCode, [en, zh]] of Object.entries(expectedPartTitles)) {
  const key = `part${partCode.slice(1)}`;
  assert.equal(enAtlas.atlas.parts[key].title, en);
  assert(zhAtlas.atlas.parts[key].title.startsWith(zh));
}

const routePages = {
  'books/reality-formation/index.html': 'book-1',
  'books/reality-runtime/index.html': 'book-2',
  'books/reality-continuity/index.html': 'book-3',
  'books/reality-civilization/index.html': 'book-4',
  'books/reality-navigation/index.html': 'book-5'
};
for (const [path, bookId] of Object.entries(routePages)) {
  const html = await read(path);
  assert(html.includes(`data-book-id="${bookId}"`), `${path} must project ${bookId}.`);
  assert(!/four[- ]volume/i.test(html), `${path} contains an active four-volume assumption.`);
}
const aliasPage = await read('books/reality-maintenance/index.html');
assert(aliasPage.includes('<link rel="canonical" href="/books/reality-continuity/">'));
assert(aliasPage.includes("window.location.replace('/books/reality-continuity/')"));
assert(redirects.includes('/books/reality-maintenance/ /books/reality-continuity/ 308'));
const continuityRoute = routeRegistry.entries.find(record => record.routeCode === 'BOOK_REALITY_CONTINUITY');
assert.equal(continuityRoute?.path, '/books/reality-continuity');
const maintenanceCompatibility = routeRegistry.legacyCompatibility.find(record => record.legacyPath === '/books/reality-maintenance/');
assert.equal(maintenanceCompatibility?.targetRouteCode, 'BOOK_REALITY_CONTINUITY');
assert.equal(maintenanceCompatibility?.redirectStatus, 308);
assert.equal(maintenanceCompatibility?.canonicalAuthority, false);

for (const source of active.activatedSources) {
  const actualSha256 = sha256(await read(source.path));
  if (source.path === materializationReconciliation.acceptedSuccessorDigests.publicSurfaceData.path) {
    const successor = materializationReconciliation.acceptedSuccessorDigests.publicSurfaceData;
    assert.equal(source.sha256, successor.bookW1eSha256);
    assert.equal(actualSha256, successor.currentSha256);
    assert.equal(successor.authorityChanged, false);
    const successorReconciliation = await json(successor.successorReconciliation);
    assert.equal(successorReconciliation.status, 'SUCCESSOR_EXPORT_REPAIR_NO_AUTHORITY_CHANGE');
    continue;
  }
  const restoredMaterialization = [
    materializationReconciliation.publicAssets,
    materializationReconciliation.bookComposition
  ].find(record => record.path === source.path);
  if (restoredMaterialization) {
    assert.equal(source.sha256, restoredMaterialization.recordedButUnmaterializedSha256);
    assert.equal(actualSha256, restoredMaterialization.restoredSha256);
    continue;
  }
  assert.equal(actualSha256, source.sha256, `BOOK-W1E digest drift: ${source.path}`);
}
assert.equal(active.activatedSources.length, 10);
assert.deepEqual(active.currentProductionScan, {
  activeFourVolumeAssumptionCount: 0,
  staleVolumeIdentityCount: 0,
  bookTwoP5ToP9OwnershipCount: 0,
  stalePart8To15TitleCount: 0,
  publicBookInferenceFromNodeCodePrefixCount: 0
});

const activePublicPaths = [
  ...active.activatedSources.map(record => record.path),
  'books/index.html',
  ...Object.keys(routePages),
  'explore.html',
  'thesis.html',
  'assets/css/atlas.css',
  'assets/js/knowledge/catalog.js',
  'assets/js/locales/en/thesis.js',
  'assets/js/locales/zh-Hans/thesis.js',
  'assets/js/locales/en/home.js',
  'assets/js/locales/zh-Hans/home.js',
  'assets/js/locales/en/about.js',
  'assets/js/locales/zh-Hans/about.js'
];
const activePublicText = (await Promise.all(activePublicPaths.map(read))).join('\n');
for (const forbidden of [
  /four[- ]volume/i,
  /four[- ]book/i,
  /four books/i,
  /three books/i,
  /three-book/i,
  /四册体系/,
  /四册书/,
  /四本书/,
  /三本书/,
  /BOOK II · PARTS 5–9/i,
  /Book II · Part [89]/,
  /Governance Runtime/,
  /Civilization Dynamics/,
  /Civilization Ecology/,
  /Reality Reading Science/,
  /Continuity Mechanics/,
  /Continuity Science/
]) assert(!forbidden.test(activePublicText), `Active public projection contains stale production text: ${forbidden}`);

assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1E')?.status, 'accepted');
assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1F')?.status, 'accepted');
assert.equal(contract.progress.currentStep, 'BOOK-W1G');
assert.equal(contract.w1eActivation?.status, 'human-approved-active-public-projection');

console.log('✓ BOOK-W1E Human-approved five-volume Public Book / Locale / Icon projection passed.');
console.log('  Five canonical routes and the non-canonical 308 Reality Maintenance compatibility alias are active.');
console.log('  Current production contains no active four-volume, stale ownership or stale P8–P15 title assumption.');
