import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const OUTPUT_ROOT = 'content/knowledge/migrations/book-w1e';
export const PROJECTION_PATH = `${OUTPUT_ROOT}/public-book-locale-icon-projection-candidate-v1.json`;
export const ACCEPTANCE_PATH = `${OUTPUT_ROOT}/book-w1e-human-acceptance-v1.json`;
export const W1D_REVIEW_PATH = 'content/knowledge/migrations/book-w1d/book-w1d-tl-activation-review-v1.json';
export const W1B_ACCEPTANCE_PATH = 'content/knowledge/migrations/book-w1b/book-w1b-human-acceptance-v1.json';

export const REQUIRED_PROJECTION_SOURCES = Object.freeze([
  'assets/js/web-production/public-surface-data.js',
  'assets/js/pages/books.js',
  'assets/js/pages/book-volume.js',
  'assets/js/locales/en/atlas.js',
  'assets/js/locales/zh-Hans/atlas.js',
  'assets/js/locales/en/public.js',
  'assets/js/locales/zh-Hans/public.js',
  'content/knowledge/public/public-book-metadata.json',
  'content/registry/public-assets.json',
  'content/web-production/composition/public/book-composition-v1.json'
]);

const W1B_MAP_PATHS = Object.freeze([
  'content/knowledge/migrations/p8-runtime-maintenance-outline-migration-v1.json',
  'content/knowledge/migrations/p9-coordination-runtime-outline-migration-v1.json',
  'content/knowledge/migrations/p10-runtime-expansion-outline-migration-v1.json',
  'content/knowledge/migrations/p11-civilization-runtime-outline-migration-v1.json',
  'content/knowledge/migrations/p12-civilization-atlas-outline-migration-v1.json',
  'content/knowledge/migrations/p13-reading-science-outline-migration-v1.json',
  'content/knowledge/migrations/p14-navigation-science-outline-migration-v1.json',
  'content/knowledge/migrations/p15-reality-continuation-outline-migration-v1.json'
]);

const REVIEWED_W1C_PATHS = Object.freeze([
  'content/knowledge/blueprints/successors/book-w1c/book-2-knowledge-blueprint-v3.json',
  'content/knowledge/blueprints/successors/book-w1c/book-3-knowledge-blueprint-v1.json',
  'content/knowledge/blueprints/successors/book-w1c/book-4-knowledge-blueprint-v3.json',
  'content/knowledge/blueprints/successors/book-w1c/book-5-knowledge-blueprint-v1.json',
  'content/knowledge/blueprints/successors/book-w1c/book-w1c-human-acceptance-v1.json',
  'content/knowledge/blueprints/successors/book-w1c/canonical-node-admission-review-human-acceptance-v1.json',
  'content/knowledge/blueprints/successors/book-w1c/canonical-node-admission-review-human-acceptance-v2.json',
  'content/knowledge/blueprints/successors/book-w1c/canonical-node-admission-review-candidates-v1.json'
]);

const RECONCILIATION_PATH = 'content/knowledge/migrations/book-w1d/canonical-registry-reconciliation-active-v1.json';
const PUBLICATION_PATH = 'content/knowledge/migrations/book-w1d/publication-ownership-migration-active-v1.json';
const W1D_ACCEPTANCE_PATH = 'content/knowledge/migrations/book-w1d/book-w1d-human-acceptance-v1.json';

export const CANONICAL_ROUTES = Object.freeze({
  'BOOK-1': '/books/reality-formation/',
  'BOOK-2': '/books/reality-runtime/',
  'BOOK-3': '/books/reality-continuity/',
  'BOOK-4': '/books/reality-civilization/',
  'BOOK-5': '/books/reality-navigation/'
});

export const VISUAL_VOCABULARY = Object.freeze({
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
});

const read = (root, relative) => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async (root, relative) => JSON.parse(await read(root, relative));
const sha256 = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

async function artifactRecord(root, relative) {
  const raw = await read(root, relative);
  return { path: relative, sha256: sha256(raw) };
}

export async function buildBookW1EProjectionCandidate(root = process.cwd()) {
  const [
    contract,
    booksRegistry,
    partsRegistry,
    recordedW1BAcceptance,
    w1cAcceptance,
    w1dAcceptance,
    reconciliation,
    publication,
    publicMetadata,
    publicAssets,
    composition,
    ...sourceRaws
  ] = await Promise.all([
    readJson(root, 'content/knowledge/migrations/five-volume-migration-contract-v1.json'),
    readJson(root, 'content/registry/books.json'),
    readJson(root, 'content/registry/parts.json'),
    readJson(root, W1B_ACCEPTANCE_PATH),
    readJson(root, 'content/knowledge/blueprints/successors/book-w1c/book-w1c-human-acceptance-v1.json'),
    readJson(root, W1D_ACCEPTANCE_PATH),
    readJson(root, RECONCILIATION_PATH),
    readJson(root, PUBLICATION_PATH),
    readJson(root, 'content/knowledge/public/public-book-metadata.json'),
    readJson(root, 'content/registry/public-assets.json'),
    readJson(root, 'content/web-production/composition/public/book-composition-v1.json'),
    ...REQUIRED_PROJECTION_SOURCES.map(relative => read(root, relative))
  ]);

  assert.equal(booksRegistry.architecture, 'five-volume-15-part');
  assert.equal(partsRegistry.architecture, 'five-volume-15-part');
  assert.equal(booksRegistry.books.length, 5);
  assert.equal(partsRegistry.parts.length, 15);
  assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1D')?.status, 'accepted');
  assert.equal(contract.implementationSteps.find(record => record.step === 'BOOK-W1E')?.status, 'in_progress');
  assert.equal(w1cAcceptance.status, 'HUMAN_APPROVED');
  assert.equal(w1cAcceptance.admissionReview.acceptedRecommendationCounts.totalResolved, 323);
  assert.equal(w1cAcceptance.admissionReview.pendingRecommendationCounts.total, 0);
  assert.equal(w1dAcceptance.status, 'HUMAN_APPROVED');
  assert.equal(w1dAcceptance.decision, 'ACCEPT');
  assert.equal(w1dAcceptance.activation.canonicalRegistrySuccessorActive, true);
  assert.equal(reconciliation.existingIdentityDecisions.length, 718);
  assert.equal(reconciliation.canonicalAdmissionDecisions.length, 213);
  assert.equal(publication.recordCount, 473);

  const sourceSnapshots = REQUIRED_PROJECTION_SOURCES.map((relative, index) => ({
    path: relative,
    sha256: sha256(sourceRaws[index]),
    mutationStatus: 'blocked-until-book-w1e-human-acceptance'
  }));

  const partTitles = Object.fromEntries(partsRegistry.parts.map(part => [
    `P${part.number}`,
    { title: part.title, publicationBookCode: `BOOK-${booksRegistry.books.find(book => book.book_id === part.book).volume}` }
  ]));
  const books = booksRegistry.books.map(book => ({
    bookId: book.book_id,
    bookCode: book.bookCode,
    volume: book.volume,
    title: book.title,
    subtitle: book.subtitle,
    canonicalRoute: CANONICAL_ROUTES[book.bookCode],
    partCodes: book.parts.map(part => `P${part}`),
    assetCode: `${book.bookCode}-HARDCOVER`,
    coverObjectKey: book.asset.cover_object,
    status: book.status,
    contentStatus: book.content_status
  }));

  const missingOutlineAuthorities = recordedW1BAcceptance.sourceAuthorityGate
    .missingCompleteOutlineAuthorities;

  const reviewedW1B = await Promise.all(W1B_MAP_PATHS.map(relative => artifactRecord(root, relative)));
  const reviewedW1C = await Promise.all(REVIEWED_W1C_PATHS.map(relative => artifactRecord(root, relative)));
  const reviewedW1D = await Promise.all([RECONCILIATION_PATH, PUBLICATION_PATH].map(relative => artifactRecord(root, relative)));

  const w1dTlReview = {
    schemaVersion: 'PHI-OS-BOOK-W1D-TL-ACTIVATION-REVIEW-v1.0.0',
    phase: 'BOOK-W1',
    step: 'BOOK-W1D-ACTIVATION-READINESS',
    status: 'W1D_HUMAN_APPROVED_ACTIVE_RECONCILIATION',
    generatedAt: '2026-08-14',
    directActivationAllowed: false,
    activeReconciliationCreated: true,
    blockerSummary: {
      missingCompleteOutlineAuthorityPartCount: missingOutlineAuthorities.length,
      missingCompleteOutlineAuthorities: missingOutlineAuthorities,
      w1bMigrationMapsAccepted: true,
      w1cHumanResolvedDispositionCount: 323,
      w1dCanonicalAdmissionCandidateCount: 213,
      w1cAcceptedLinkRelationshipCount: 66,
      w1cDeferredAdmissionCandidateCount: 44,
      w1cAdmissionRecommendationsPending: 0,
      w1cSuccessorBlueprintsAccepted: true,
      w1dReconciliationAccepted: true,
      targetOnlyRehomeCount: 2
    },
    reviewSequence: [
      {
        order: 1,
        gate: 'BOOK-W1B-SOURCE-AUTHORITY',
        requiredDecision: 'Complete source authority is recorded for P8-P15; no further source inventory is missing.',
        satisfied: true,
        tlReviewRequired: false,
        systemMayInfer: false
      },
      {
        order: 2,
        gate: 'BOOK-W1B-HUMAN-CANONICAL-OUTLINE-ACCEPTANCE',
        requiredDecision: 'Review and accept the rebuilt eight migration maps, including every match, move, rename, split, merge, supersede and new candidate decision.',
        satisfied: true,
        tlReviewRequired: true,
        systemMayInfer: false,
        acceptanceArtifact: W1B_ACCEPTANCE_PATH,
        reviewedArtifacts: reviewedW1B
      },
      {
        order: 3,
        gate: 'BOOK-W1C-HUMAN-SUCCESSOR-BLUEPRINT-AND-REMAINING-ADMISSION-ACCEPTANCE',
        requiredDecision: 'Accept all four successor Blueprints and resolve the full 323-entry W1C review: 213 admission recommendations, 66 link-to-existing relationships and 44 deferred admissions.',
        satisfied: true,
        tlReviewRequired: true,
        systemMayInfer: false,
        acceptanceArtifact: 'content/knowledge/blueprints/successors/book-w1c/book-w1c-human-acceptance-v1.json',
        reviewedArtifacts: reviewedW1C
      },
      {
        order: 4,
        gate: 'BOOK-W1D-HUMAN-CANONICAL-RECONCILIATION-ACCEPTANCE',
        requiredDecision: 'Review the 718-entry existing identity ledger, decide 213 Canonical admission candidates (192 promote + 21 supersede with lineage/compatibility), review 473 publication-ownership records and explicitly decide whether the two target-only rehomes may be physically applied. The 66 accepted links remain relationship-only and the 44 deferred candidates stay preserved.',
        satisfied: true,
        tlReviewRequired: true,
        systemMayInfer: false,
        acceptanceArtifact: W1D_ACCEPTANCE_PATH,
        reviewedArtifacts: reviewedW1D
      }
    ],
    specialTlDecisions: [
      {
        canonicalNodeCode: 'KN-B2-P7-052',
        targetPartCode: 'P11',
        currentAuthority: 'HUMAN_APPROVED_APPLIED',
        physicalApplicationDecision: 'APPLY'
      },
      {
        canonicalNodeCode: 'KN-B2-P7-057',
        targetPartCode: 'P10',
        currentAuthority: 'HUMAN_APPROVED_APPLIED',
        physicalApplicationDecision: 'APPLY'
      }
    ],
    activationInvariant: {
      canonicalNodeCodeMutationAllowed: false,
      oldNodeCodeMustEqualCanonicalNodeCode: true,
      silentDeletionAllowed: false,
      w1eCurrentProductionMutationAllowedBeforeActivation: false
    }
  };

  const projection = {
    schemaVersion: 'PHI-OS-BOOK-W1E-PUBLIC-BOOK-LOCALE-ICON-PROJECTION-CANDIDATE-v1.0.0',
    phase: 'BOOK-W1',
    step: 'BOOK-W1E-CANDIDATE-PREPARATION',
    status: 'candidate-only-ready-for-human-review-not-active',
    generatedAt: '2026-08-14',
    sourceAuthority: {
      booksRegistryPath: 'content/registry/books.json',
      partsRegistryPath: 'content/registry/parts.json',
      architecture: booksRegistry.architecture,
      w1dAcceptancePath: W1D_ACCEPTANCE_PATH,
      w1dActiveReconciliationSatisfied: true
    },
    activation: {
      candidateOnly: true,
      currentProductionMutationAllowed: false,
      activePublicProjectionCreated: false,
      nextPermittedGate: 'BOOK-W1E-HUMAN-PUBLIC-PROJECTION-ACCEPTANCE'
    },
    sourceSnapshots,
    canonicalBookRoutes: books.map(book => ({ bookCode: book.bookCode, route: book.canonicalRoute })),
    compatibilityRoutes: [
      {
        route: '/books/reality-maintenance/',
        kind: 'compatibility-alias-redirect',
        redirectStatus: 308,
        target: '/books/reality-continuity/',
        canonicalAuthority: false,
        competesWithCanonicalRouteAuthority: false,
        historicalUrlDeletionAllowed: false
      }
    ],
    ownership: {
      'BOOK-1': ['P1', 'P2', 'P3', 'P4'],
      'BOOK-2': ['P5', 'P6', 'P7'],
      'BOOK-3': ['P8', 'P9'],
      'BOOK-4': ['P10', 'P11', 'P12'],
      'BOOK-5': ['P13', 'P14', 'P15']
    },
    books,
    partTitles,
    visualVocabulary: VISUAL_VOCABULARY,
    localeProjection: {
      en: {
        architectureName: 'Five-volume, fifteen-Part architecture',
        booksEyebrow: 'Canonical Knowledge · Five Volumes',
        booksTitle: 'Five volumes now share one governed public architecture.',
        bookLabels: books.map(book => `Book ${book.volume} · ${book.title.en}`),
        ownershipLabels: ['Parts 1–4', 'Parts 5–7', 'Parts 8–9', 'Parts 10–12', 'Parts 13–15'],
        canonicalPartTitlesP8ToP15: Object.fromEntries(Object.entries(partTitles).filter(([partCode]) => Number(partCode.slice(1)) >= 8).map(([partCode, record]) => [partCode, record.title.en]))
      },
      'zh-Hans': {
        architectureName: '五册、十五部架构',
        booksEyebrow: 'Canonical Knowledge · 五册',
        booksTitle: '五册知识现在由同一套受治理的公开架构承载。',
        bookLabels: books.map(book => `第 ${book.volume} 册 · ${book.title['zh-Hans']}`),
        ownershipLabels: ['第 1–4 部', '第 5–7 部', '第 8–9 部', '第 10–12 部', '第 13–15 部'],
        canonicalPartTitlesP8ToP15: Object.fromEntries(Object.entries(partTitles).filter(([partCode]) => Number(partCode.slice(1)) >= 8).map(([partCode, record]) => [partCode, record.title['zh-Hans']]))
      }
    },
    activationTargets: [
      {
        path: 'assets/js/web-production/public-surface-data.js',
        operations: ['replace route/asset maps with five-book projection', 'require five-volume-15-part registry architecture', 'export non-canonical maintenance compatibility alias']
      },
      { path: 'assets/js/pages/books.js', operations: ['verify five-card rendering from registry; no duplicate frontend book authority'] },
      { path: 'assets/js/pages/book-volume.js', operations: ['verify generic rendering for BOOK-1 through BOOK-5 and canonical-link behavior'] },
      { path: 'assets/js/locales/en/atlas.js', operations: ['project five books, canonical Part ownership and current P8-P15 titles'] },
      { path: 'assets/js/locales/zh-Hans/atlas.js', operations: ['project five books, canonical Part ownership and current P8-P15 titles'] },
      { path: 'assets/js/locales/en/public.js', operations: ['remove current four-volume copy and project five-book architecture'] },
      { path: 'assets/js/locales/zh-Hans/public.js', operations: ['remove current four-volume copy and project five-book architecture'] },
      { path: 'content/knowledge/public/public-book-metadata.json', operations: ['replace four-record read model with five canonical book records'] },
      { path: 'content/registry/public-assets.json', operations: ['add BOOK-5 cover asset and current/legacy visual-vocabulary metadata'] },
      { path: 'content/web-production/composition/public/book-composition-v1.json', operations: ['replace four ownership arrays with five canonical ownership arrays'] }
    ],
    currentProductionBlockers: [
      {
        code: 'FOUR_VOLUME_ARCHITECTURE_GUARD',
        paths: ['assets/js/web-production/public-surface-data.js'],
        evidence: "registry.architecture !== 'four-volume-15-part'",
        disposition: 'replace-on-activation; not HISTORICAL_ALLOWED'
      },
      {
        code: 'FOUR_VOLUME_PUBLIC_COPY',
        paths: ['assets/js/locales/en/atlas.js', 'assets/js/locales/zh-Hans/atlas.js', 'assets/js/locales/en/public.js', 'assets/js/locales/zh-Hans/public.js'],
        evidence: 'four-book/four-volume locale labels remain in current production',
        disposition: 'replace-on-activation; not HISTORICAL_ALLOWED'
      },
      {
        code: 'BOOK_3_AND_BOOK_4_STALE_VOLUME_IDENTITY',
        paths: ['assets/js/web-production/public-surface-data.js', 'assets/js/locales/en/atlas.js', 'assets/js/locales/zh-Hans/atlas.js', 'content/knowledge/public/public-book-metadata.json'],
        evidence: 'Reality Civilization is projected as Volume III and Reality Navigation as Volume IV',
        disposition: 'replace-on-activation; not HISTORICAL_ALLOWED'
      },
      {
        code: 'BOOK_2_P5_TO_P9_STALE_OWNERSHIP',
        paths: ['assets/js/locales/en/atlas.js', 'assets/js/locales/zh-Hans/atlas.js', 'assets/js/locales/en/public.js', 'assets/js/locales/zh-Hans/public.js', 'content/web-production/composition/public/book-composition-v1.json'],
        evidence: 'BOOK-2 still owns P5-P9 instead of P5-P7',
        disposition: 'replace-on-activation; not HISTORICAL_ALLOWED'
      },
      {
        code: 'STALE_PART_8_TO_15_TITLES',
        paths: ['assets/js/locales/en/atlas.js', 'assets/js/locales/zh-Hans/atlas.js', 'assets/js/locales/en/public.js', 'assets/js/locales/zh-Hans/public.js'],
        evidence: 'maintenance/governance, civilization dynamics/ecology and continuity science labels remain',
        disposition: 'replace-on-activation; historical occurrences require explicit HISTORICAL_ALLOWED marking'
      }
    ],
    currentReadModelEvidence: {
      publicMetadataRecordCount: publicMetadata.recordCount,
      publicAssetBookCoverCount: publicAssets.assets.filter(asset => asset.category === 'book-cover').length,
      compositionOwnership: {
        bookOne: composition.bookOneOwnership,
        bookTwo: composition.bookTwoOwnership,
        bookThree: composition.bookThreeOwnership,
        bookFour: composition.bookFourOwnership,
        bookFive: composition.bookFiveOwnership ?? null
      }
    },
    boundaries: {
      historicalUrlDeletionAllowed: false,
      maintenanceAliasMayClaimCanonicalAuthority: false,
      currentProductionMayBeUpdatedBeforeW1DActive: false,
      currentProductionMayBeUpdatedBeforeW1EAcceptance: false,
      legacyVisualVocabularyMayRemainPrimary: false,
      aiIconDeleted: false,
      aiMayRemainBookLevelPrimary: false
    }
  };

  const acceptance = {
    schemaVersion: 'PHI-OS-BOOK-W1E-HUMAN-ACCEPTANCE-v1.0.0',
    phase: 'BOOK-W1',
    step: 'BOOK-W1E',
    status: 'READY_FOR_HUMAN_REVIEW',
    recordedAt: null,
    humanActor: null,
    decision: null,
    priorGates: {
      w1dActiveReconciliation: true,
      knowledgeAuthorityAccepted: true
    },
    reviewedArtifact: PROJECTION_PATH,
    reviewedArtifactSha256: sha256(`${JSON.stringify(projection, null, 2)}\n`),
    activation: {
      currentProductionMutationAllowed: false,
      publicProjectionAuthorityCreated: false
    }
  };

  return { projection, acceptance, w1bAcceptance: recordedW1BAcceptance, w1dTlReview };
}

async function writeJson(root, relative, value) {
  const absolute = path.join(root, relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  assert.equal(process.argv[2], '--write', 'Use --write to materialize the BOOK-W1E candidate and W1D TL review package.');
  const built = await buildBookW1EProjectionCandidate();
  await writeJson(process.cwd(), PROJECTION_PATH, built.projection);
  await writeJson(process.cwd(), ACCEPTANCE_PATH, built.acceptance);
  await writeJson(process.cwd(), W1D_REVIEW_PATH, built.w1dTlReview);
  console.log('Generated BOOK-W1E Human Review candidate from active W1D authority; Public Production remains unchanged.');
}
