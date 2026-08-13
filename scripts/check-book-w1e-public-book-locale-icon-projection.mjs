import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import enAtlas from '../assets/js/locales/en/atlas.js';
import zhAtlas from '../assets/js/locales/zh-Hans/atlas.js';
import enPublic from '../assets/js/locales/en/public.js';
import zhPublic from '../assets/js/locales/zh-Hans/public.js';
import {
  ACCEPTANCE_PATH,
  CANONICAL_ROUTES,
  PROJECTION_PATH,
  REQUIRED_PROJECTION_SOURCES,
  VISUAL_VOCABULARY,
  W1B_ACCEPTANCE_PATH,
  W1D_REVIEW_PATH,
  buildBookW1EProjectionCandidate
} from './build-book-w1e-public-projection-candidate.mjs';

const root = process.cwd();
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async relative => JSON.parse(await read(relative));

const [
  expected,
  projection,
  acceptance,
  w1bAcceptance,
  w1dReview,
  w1dAcceptance,
  contract,
  publicSurface,
  publicMetadata,
  publicAssets,
  composition,
  packageJson,
  audit
] = await Promise.all([
  buildBookW1EProjectionCandidate(root),
  readJson(PROJECTION_PATH),
  readJson(ACCEPTANCE_PATH),
  readJson(W1B_ACCEPTANCE_PATH),
  readJson(W1D_REVIEW_PATH),
  readJson('content/knowledge/migrations/book-w1d/book-w1d-human-acceptance-v1.json'),
  readJson('content/knowledge/migrations/five-volume-migration-contract-v1.json'),
  read('assets/js/web-production/public-surface-data.js'),
  readJson('content/knowledge/public/public-book-metadata.json'),
  readJson('content/registry/public-assets.json'),
  readJson('content/web-production/composition/public/book-composition-v1.json'),
  readJson('package.json'),
  read('docs/audits/BOOK-W1E-public-book-locale-icon-projection.md')
]);

assert.deepEqual(projection, expected.projection, 'BOOK-W1E candidate must rebuild deterministically from exact current sources.');
assert.deepEqual(acceptance, expected.acceptance, 'BOOK-W1E Human Acceptance template must rebuild deterministically.');
assert.deepEqual(w1bAcceptance, expected.w1bAcceptance, 'BOOK-W1B Human Acceptance template must rebuild deterministically.');
assert.deepEqual(w1dReview, expected.w1dTlReview, 'BOOK-W1D TL activation review package must rebuild deterministically.');

assert.equal(w1dAcceptance.status, 'HUMAN_APPROVED');
assert.equal(w1dAcceptance.decision, 'ACCEPT');
assert.equal(w1dAcceptance.activation.canonicalRegistrySuccessorActive, true);
assert.equal(projection.status, 'candidate-only-ready-for-human-review-not-active');
assert.equal(projection.activation.candidateOnly, true);
assert.equal(projection.activation.currentProductionMutationAllowed, false);
assert.equal(projection.activation.activePublicProjectionCreated, false);
assert.equal(acceptance.status, 'READY_FOR_HUMAN_REVIEW');
assert.equal(acceptance.decision, null);
assert.equal(acceptance.activation.currentProductionMutationAllowed, false);

assert.deepEqual(
  Object.fromEntries(projection.canonicalBookRoutes.map(record => [record.bookCode, record.route])),
  CANONICAL_ROUTES
);
assert.deepEqual(projection.ownership, {
  'BOOK-1': ['P1', 'P2', 'P3', 'P4'],
  'BOOK-2': ['P5', 'P6', 'P7'],
  'BOOK-3': ['P8', 'P9'],
  'BOOK-4': ['P10', 'P11', 'P12'],
  'BOOK-5': ['P13', 'P14', 'P15']
});
assert.deepEqual(projection.books.map(book => book.bookCode), ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4', 'BOOK-5']);
assert.deepEqual(projection.books.map(book => book.title.en), [
  'Reality Formation', 'Reality Runtime', 'Reality Continuity', 'Reality Civilization', 'Reality Navigation'
]);
assert.deepEqual(projection.books.map(book => book.partCodes), [
  ['P1', 'P2', 'P3', 'P4'], ['P5', 'P6', 'P7'], ['P8', 'P9'], ['P10', 'P11', 'P12'], ['P13', 'P14', 'P15']
]);

assert.equal(projection.compatibilityRoutes.length, 1);
const [maintenanceAlias] = projection.compatibilityRoutes;
assert.equal(maintenanceAlias.route, '/books/reality-maintenance/');
assert.equal(maintenanceAlias.target, '/books/reality-continuity/');
assert.equal(maintenanceAlias.kind, 'compatibility-alias-redirect');
assert.equal(maintenanceAlias.redirectStatus, 308);
assert.equal(maintenanceAlias.canonicalAuthority, false);
assert.equal(maintenanceAlias.competesWithCanonicalRouteAuthority, false);
assert.equal(maintenanceAlias.historicalUrlDeletionAllowed, false);

assert.deepEqual(projection.visualVocabulary, VISUAL_VOCABULARY);
assert.deepEqual(projection.visualVocabulary['BOOK-3'].primary, [
  'maintenance', 'reconfiguration', 'recovery', 'coordination', 'emergence', 'continuity'
]);
assert.deepEqual(projection.visualVocabulary['BOOK-4'].primary, [
  'scale', 'replication', 'distribution', 'infrastructure', 'civilization', 'atlas'
]);
assert.deepEqual(projection.visualVocabulary['BOOK-4'].legacy, [
  'migration', 'cycles', 'functions', 'ecology', 'coordinates', 'succession'
]);
assert.deepEqual(projection.visualVocabulary['BOOK-5'].primary, [
  'reading', 'evidence', 'navigation', 'action', 'outcome', 'continuation', 'formation'
]);
assert(projection.visualVocabulary['BOOK-5'].legacy.includes('ai'));
assert(!projection.visualVocabulary['BOOK-5'].primary.includes('ai'));
assert.deepEqual(projection.visualVocabulary['BOOK-5'].retainedNonPrimary, ['ai']);

assert.equal(projection.sourceSnapshots.length, REQUIRED_PROJECTION_SOURCES.length);
assert.deepEqual(projection.sourceSnapshots.map(record => record.path), REQUIRED_PROJECTION_SOURCES);
assert(projection.sourceSnapshots.every(record => record.mutationStatus === 'blocked-until-book-w1e-human-acceptance'));
assert.equal(projection.activationTargets.length, REQUIRED_PROJECTION_SOURCES.length);
assert.deepEqual(projection.activationTargets.map(record => record.path), REQUIRED_PROJECTION_SOURCES);
assert.equal(projection.currentProductionBlockers.length, 5);
assert(projection.currentProductionBlockers.every(record => record.disposition.includes('replace-on-activation')));

// The current production read model intentionally remains unchanged until W1E is separately accepted.
assert.equal((publicSurface.match(/four-volume-15-part/g) ?? []).length, 2);
assert(!publicSurface.includes("'book-5': '/books/reality-navigation'"));
assert.equal(publicMetadata.recordCount, 4);
assert.deepEqual(publicMetadata.records.map(record => record.title.en), [
  'Reality Formation', 'Reality Runtime', 'Reality Civilization', 'Reality Navigation'
]);
assert.equal(publicAssets.assets.filter(asset => asset.category === 'book-cover').length, 4);
assert(!publicAssets.assets.some(asset => asset.asset_code === 'BOOK-5-HARDCOVER'));
assert.deepEqual(composition.bookTwoOwnership, [5, 6, 7, 8, 9]);
assert.deepEqual(composition.bookThreeOwnership, [10, 11, 12]);
assert.deepEqual(composition.bookFourOwnership, [13, 14, 15]);
assert.equal(composition.bookFiveOwnership, undefined);

assert(enAtlas.atlas.hero.subtitle.includes('four books'));
assert(zhAtlas.atlas.hero.subtitle.includes('四册体系'));
assert.equal(enAtlas.atlas.books.bookThreeEnglish, 'Reality Civilization');
assert.equal(enAtlas.atlas.books.bookFourEnglish, 'Reality Navigation');
assert.equal(zhAtlas.atlas.books.bookThreeEnglish, 'Reality Civilization');
assert.equal(zhAtlas.atlas.books.bookFourEnglish, 'Reality Navigation');
assert.equal(enPublic.discover.production.booksEyebrow, 'Canonical Knowledge · Four Volumes');
assert.equal(zhPublic.discover.production.booksEyebrow, 'Canonical Knowledge · 四册');

assert.equal(w1dReview.directActivationAllowed, false);
assert.equal(w1bAcceptance.status, 'HUMAN_APPROVED');
assert.equal(w1bAcceptance.decision, 'ACCEPT');
assert.equal(w1bAcceptance.humanActor, 'TL');
assert.equal(w1bAcceptance.sourceAuthorityGate.complete, true);
assert.equal(w1bAcceptance.sourceAuthorityGate.completePartCount, 8);
assert.equal(w1bAcceptance.sourceAuthorityGate.requiredPartCount, 8);
assert.deepEqual(w1bAcceptance.sourceAuthorityGate.missingCompleteOutlineAuthorities, []);
assert.equal(w1bAcceptance.reviewedArtifacts.length, 8);
assert(w1bAcceptance.partDecisions.every(record => record.decision === 'ACCEPT'));
assert.equal(w1bAcceptance.boundaries.systemMaySelfAccept, false);
assert.equal(w1bAcceptance.boundaries.sourceAuthorityAuthorizationIsW1BAcceptance, false);
assert.equal(w1dReview.blockerSummary.missingCompleteOutlineAuthorityPartCount, 0);
assert.deepEqual(w1dReview.blockerSummary.missingCompleteOutlineAuthorities, []);
assert.equal(w1dReview.status, 'W1D_HUMAN_APPROVED_ACTIVE_RECONCILIATION');
assert.equal(w1dReview.activeReconciliationCreated, true);
assert.equal(w1dReview.blockerSummary.w1cHumanResolvedDispositionCount, 323);
assert.equal(w1dReview.blockerSummary.w1dCanonicalAdmissionCandidateCount, 213);
assert.equal(w1dReview.blockerSummary.w1cAcceptedLinkRelationshipCount, 66);
assert.equal(w1dReview.blockerSummary.w1cDeferredAdmissionCandidateCount, 44);
assert.equal(w1dReview.blockerSummary.w1cAdmissionRecommendationsPending, 0);
assert.equal(w1dReview.blockerSummary.w1cSuccessorBlueprintsAccepted, true);
assert.equal(w1dReview.reviewSequence[0].satisfied, true);
assert.equal(w1dReview.reviewSequence[1].satisfied, true);
assert.equal(w1dReview.reviewSequence[2].satisfied, true);
assert.equal(w1dReview.reviewSequence[3].satisfied, true);
assert.deepEqual(w1dReview.reviewSequence.map(record => record.tlReviewRequired), [false, true, true, true]);
assert.equal(w1dReview.reviewSequence[1].reviewedArtifacts.length, 8);
assert.equal(w1dReview.reviewSequence[2].reviewedArtifacts.length, 8);
assert.equal(w1dReview.reviewSequence[2].gate,
  'BOOK-W1C-HUMAN-SUCCESSOR-BLUEPRINT-AND-REMAINING-ADMISSION-ACCEPTANCE');
assert.equal(w1dReview.reviewSequence[3].reviewedArtifacts.length, 2);
assert.deepEqual(w1dReview.specialTlDecisions.map(record => record.canonicalNodeCode), [
  'KN-B2-P7-052', 'KN-B2-P7-057'
]);
assert(w1dReview.specialTlDecisions.every(record => record.physicalApplicationDecision === 'APPLY'));

assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1D')?.status, 'accepted');
assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1E')?.status, 'in_progress');
assert.equal(contract.w1eCandidatePreparation.status, 'generated-ready-for-human-review-not-active');
assert.equal(contract.w1eCandidatePreparation.w1dActiveReconciliationSatisfied, true);
assert.equal(contract.w1eCandidatePreparation.mandatoryProjectionSourceCount, 10);
assert.equal(contract.w1eCandidatePreparation.activePublicProjectionMutated, false);
assert.equal(packageJson.scripts['check:book-w1-public-projection'], 'node scripts/check-book-w1e-public-book-locale-icon-projection.mjs');
assert.equal(packageJson.scripts['check:book-w1e'], 'npm run check:book-w1-public-projection');
assert.equal((packageJson.scripts.precheck.match(/npm run check:book-w1-public-projection/g) ?? []).length, 1);

for (const phrase of [
  'W1D is Human approved and active',
  'W1E is ready for its independent Human Review',
  '931 Canonical records',
  'compatibility alias',
  'Current production remains byte-identical'
]) assert(audit.includes(phrase));

console.log('✓ BOOK-W1E Public Book / Locale / Icon Projection candidate passed.');
console.log('  Five canonical book routes, five-book Part ownership and Book 3-5 visual vocabulary are projected deterministically.');
console.log('  /books/reality-maintenance/ is a non-canonical 308 compatibility alias to /books/reality-continuity/.');
console.log('  W1D is Human approved and active; five stale production classes are inventoried for W1E activation.');
console.log('  W1E is ready for independent Human Review; Current Public Production remains byte-identical.');
