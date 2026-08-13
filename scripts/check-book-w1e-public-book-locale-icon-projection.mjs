import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import enAtlas from '../assets/js/locales/en/atlas.js';
import zhAtlas from '../assets/js/locales/zh-Hans/atlas.js';
import enPublic from '../assets/js/locales/en/public.js';
import zhPublic from '../assets/js/locales/zh-Hans/public.js';

const root=process.cwd();
const read=relative=>fs.readFile(path.join(root,relative),'utf8');
const readJson=async relative=>JSON.parse(await read(relative));
const BASE='1cbc50f7590759774944a577d3082c13ef59c40b';

const [candidate,candidateAcceptance,w1dAcceptance,reconciliation,wpr5v,books,parts,routeRegistry,production,context,discovery,publicSurface,legacyMetadata,legacyAssets,legacyComposition,pkg]=await Promise.all([
  readJson('content/knowledge/migrations/book-w1e/public-book-locale-icon-projection-candidate-v1.json'),
  readJson('content/knowledge/migrations/book-w1e/book-w1e-human-acceptance-v1.json'),
  readJson('content/knowledge/migrations/book-w1d/book-w1d-human-acceptance-v1.json'),
  readJson('content/knowledge/migrations/book-w1e/book-w1e-wpr5v-web-projection-successor-reconciliation-v1.json'),
  readJson('content/web-production/acceptance/wpr-five-volume-production-successor-acceptance-v1.json'),
  readJson('content/registry/books.json'),readJson('content/registry/parts.json'),
  readJson('content/web-production/registries/wpr-route-registry-v1.1.json'),
  readJson('content/web-production/registries/canonical-web-production-registry-v1.1.json'),
  readJson('content/web-production/registries/wpr-five-volume-publication-context-registry-v1.json'),
  readJson('content/web-production/registries/wpr-public-discovery-registry-v1.1.json'),
  read('assets/js/web-production/public-surface-data.js'),
  readJson('content/knowledge/public/public-book-metadata.json'),
  readJson('content/registry/public-assets.json'),
  readJson('content/web-production/composition/public/book-composition-v1.json'),
  readJson('package.json')
]);

// BOOK-W1E candidate remains immutable historical evidence and is not promoted by this checker.
assert.equal(candidate.status,'candidate-only-blocked-pending-book-w1d-active-reconciliation');
assert.equal(candidate.activation.candidateOnly,true);assert.equal(candidate.activation.activePublicProjectionCreated,false);
assert.equal(candidateAcceptance.status,'BLOCKED_PENDING_BOOK_W1D_ACTIVE_RECONCILIATION');assert.equal(candidateAcceptance.decision,null);
assert.equal(w1dAcceptance.status,'READY_FOR_HUMAN_REVIEW');assert.equal(w1dAcceptance.activation.activeAuthorityCreated,false);
assert.equal(reconciliation.reconciliationCode,'PHI-OS-BOOK-W1E-WPR-5V-WEB-PROJECTION-SUCCESSOR-RECONCILIATION-v1');
assert.equal(reconciliation.status,'ACCEPTED_WEB_PROJECTION_SUCCESSOR_ONLY');assert.equal(reconciliation.baselineCommit,BASE);
for(const v of ['webProjectionOnly'])assert.equal(reconciliation.scope[v],true);
for(const v of ['bookW1EActivated','wprV2Created','wprV1AuthorityRewritten','canonicalNodeAuthorityMutated','activeBlueprintAuthorityMutated','legacyCandidateSourceSnapshotsRebased'])assert.equal(reconciliation.scope[v],false);

// WPR-5V owns the current web projection as a post-freeze successor, not as BOOK-W1E activation.
assert.equal(wpr5v.accepted,true);assert.equal(wpr5v.result.wprV1Authority,'UNCHANGED');assert.equal(wpr5v.result.wprV2Created,false);
assert.equal(books.architecture,'five-volume-15-part');assert.equal(books.books.length,5);assert.deepEqual(books.books.map(b=>b.volume),[1,2,3,4,5]);
assert.deepEqual(books.books.map(b=>b.parts),[[1,2,3,4],[5,6,7],[8,9],[10,11,12],[13,14,15]]);
assert.equal(parts.parts.length,15);
assert.deepEqual(books.books.map(b=>b.title.en),['Reality Formation','Reality Runtime','Reality Continuity','Reality Civilization','Reality Navigation']);

assert.equal(publicSurface.includes("architecture !== 'four-volume-15-part'"),false);assert.ok(publicSurface.includes("architecture !== 'five-volume-15-part'"));
for(const pair of [["'book-3': '/books/reality-continuity'",true],["'book-4': '/books/reality-civilization'",true],["'book-5': '/books/reality-navigation'",true]])assert.equal(publicSurface.includes(pair[0]),pair[1]);
assert.equal(enAtlas.atlas.hero.subtitle.includes('five books'),true);assert.equal(zhAtlas.atlas.hero.subtitle.includes('五册体系'),true);
assert.equal(enAtlas.atlas.books.bookThreeEnglish,'Reality Continuity');assert.equal(enAtlas.atlas.books.bookFourEnglish,'Reality Civilization');assert.equal(enAtlas.atlas.books.bookFiveEnglish,'Reality Navigation');
assert.equal(zhAtlas.atlas.books.bookThreeEnglish,'Reality Continuity');assert.equal(zhAtlas.atlas.books.bookFourEnglish,'Reality Civilization');assert.equal(zhAtlas.atlas.books.bookFiveEnglish,'Reality Navigation');
assert.equal(enPublic.discover.production.booksEyebrow,'Canonical Knowledge · Five Volumes');assert.equal(zhPublic.discover.production.booksEyebrow,'Canonical Knowledge · 五册');

const canonicalRoutes=['/books/reality-formation','/books/reality-runtime','/books/reality-continuity','/books/reality-civilization','/books/reality-navigation'];
assert.deepEqual(routeRegistry.rules.canonicalBookRoutes,canonicalRoutes);assert.equal(routeRegistry.rules.numericBookRouteCanonicalAllowed,false);
assert.equal(production.productionRecords.length,40);assert.equal(discovery.entries.length,17);
assert.equal(context.identityPolicy.nodeBPrefixBookInferenceAllowed,false);assert.equal(context.exampleProjection.nodeCode,'KN-B2-P8-001');assert.equal(context.exampleProjection.publicationBookCode,'BOOK-3');

// Predecessor read models stay historical rather than being silently rewritten.
assert.equal(legacyMetadata.recordCount,4);assert.equal(legacyAssets.assets.filter(a=>a.category==='book-cover').length,4);assert.deepEqual(legacyComposition.bookTwoOwnership,[5,6,7,8,9]);
assert.equal(pkg.scripts['check:book-w1-public-projection'],'node scripts/check-book-w1e-public-book-locale-icon-projection.mjs');assert.equal(pkg.scripts['check:book-w1e'],'npm run check:book-w1-public-projection');
console.log('✓ BOOK-W1E historical candidate / WPR-5V web successor reconciliation passed.');
console.log('  BOOK-W1E remains unactivated; current web projection is governed by WPR-5V without WPR v2 or Canonical Node authority mutation.');
