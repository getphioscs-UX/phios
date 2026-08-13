import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const OUTLINE_GUARD_PATH =
  'content/knowledge/reconciliation/kau-r2/future-volume-outline-upgrade-guard-v1.json';

export const MIGRATION_FILES = [
  ['P8', 'p8-runtime-maintenance-outline-migration-v1.json', 'RUNTIME-MAINTENANCE'],
  ['P9', 'p9-coordination-runtime-outline-migration-v1.json', 'COORDINATION-RUNTIME'],
  ['P10', 'p10-runtime-expansion-outline-migration-v1.json', 'RUNTIME-EXPANSION'],
  ['P11', 'p11-civilization-runtime-outline-migration-v1.json', 'CIVILIZATION-RUNTIME'],
  ['P12', 'p12-civilization-atlas-outline-migration-v1.json', 'CIVILIZATION-ATLAS'],
  ['P13', 'p13-reading-science-outline-migration-v1.json', 'READING-SCIENCE'],
  ['P14', 'p14-navigation-science-outline-migration-v1.json', 'NAVIGATION-SCIENCE'],
  ['P15', 'p15-reality-continuation-outline-migration-v1.json', 'REALITY-CONTINUATION']
];

const ownerTransitions = {
  P8: ['BOOK-2', 'BOOK-3'],
  P9: ['BOOK-2', 'BOOK-3'],
  P10: ['BOOK-3', 'BOOK-4'],
  P11: ['BOOK-3', 'BOOK-4'],
  P12: ['BOOK-3', 'BOOK-4'],
  P13: ['BOOK-4', 'BOOK-5'],
  P14: ['BOOK-4', 'BOOK-5'],
  P15: ['BOOK-4', 'BOOK-5']
};

const readJson = async (root, relativePath) =>
  JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));

const jsonDigest = value => crypto.createHash('sha256')
  .update(JSON.stringify(value), 'utf8')
  .digest('hex');

const compareChapterCodes = (left, right) => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  return (leftParts[0] - rightParts[0]) || (leftParts[1] - rightParts[1]);
};

export async function buildBookW1BOutlineMigrationMaps(root = process.cwd()) {
  const [nodeRegistry, outlineGuard, ownershipMigration] = await Promise.all([
    readJson(root, 'content/knowledge/registry/nodes.json'),
    readJson(root, OUTLINE_GUARD_PATH),
    readJson(root, 'content/knowledge/migrations/five-volume-book-ownership-migration-v1.json')
  ]);

  const guardByPart = new Map(outlineGuard.records.map(record => [record.partCode, record]));
  const authorityByPart = new Map(
    ownershipMigration.currentPartAuthority.map(record => [record.partCode, record])
  );
  const maps = new Map();

  for (const [partCode, fileName, migrationSlug] of MIGRATION_FILES) {
    const guard = guardByPart.get(partCode);
    const authority = authorityByPart.get(partCode);
    const [oldPublicationBookCode, newPublicationBookCode] = ownerTransitions[partCode];
    assert(guard, `${partCode} upgraded-outline guard is required.`);
    assert(authority, `${partCode} Current Part Authority is required.`);
    assert.equal(guard.bookCode, newPublicationBookCode);

    const nodes = nodeRegistry.nodes
      .filter(node => node.partCode === partCode)
      .sort((left, right) => compareChapterCodes(left.chapterCode, right.chapterCode));
    assert.equal(nodes.length, guard.existingCanonicalNodeCount);

    const missingAuthority = guard.fullChapterListIncluded
      ? 'Explicit Human Canonical decisions for existing-node matches, insertions, supersessions, splits and merges.'
      : 'The complete Human-agreed chapter-by-chapter outline inventory plus explicit Human Canonical matching decisions.';

    const entries = nodes.map(node => {
      assert.equal(node.publicationBookCode, oldPublicationBookCode);
      return {
        oldNodeCode: node.nodeCode,
        oldChapterCode: node.chapterCode,
        newChapterCode: node.chapterCode,
        action: 'move',
        canonicalIdentityChanged: false,
        publicationOwnershipChanged: true,
        reason: `Preserve the frozen Canonical Node identity and current chapter slot while recording the BOOK-W1A publication move from ${oldPublicationBookCode} to ${newPublicationBookCode}; final outline matching remains pending explicit Human Canonical review.`,
        successorNodeCodes: [],
        oldPublicationBookCode,
        newPublicationBookCode,
        titleZhHans: node.titleZhHans,
        titleEn: node.titleEn,
        outlineMatchStatus: 'pending-explicit-human-canonical-review',
        newChapterCodeIsPreservationPlaceholder: true
      };
    });

    maps.set(fileName, {
      contract: 'PHI-OS-BOOK-W1B-PART-OUTLINE-MIGRATION-v1.0.0',
      schemaVersion: '1.0.0',
      migrationCode: `BOOK-W1B-${partCode}-${migrationSlug}-OUTLINE-MIGRATION-v1`,
      phase: 'BOOK-W1',
      step: 'BOOK-W1B',
      status: 'in-progress-blocked-pending-canonical-outline-authority',
      recordedAt: '2026-08-13',
      partAuthority: {
        partCode,
        titleZhHans: authority.titleZhHans,
        titleEn: authority.titleEn,
        legacyAliases: authority.legacyAliases,
        oldPublicationBookCode,
        newPublicationBookCode
      },
      sourceOutlineAuthority: {
        path: OUTLINE_GUARD_PATH,
        sourceAuthority: guard.sourceAuthority,
        sourceStage: guard.sourceStage,
        upgradedOutlineChapterCount: guard.upgradedOutlineChapterCount,
        fullChapterListIncluded: guard.fullChapterListIncluded,
        chapterInventoryDigest: guard.fullChapterListIncluded ? `sha256:${jsonDigest(guard.chapters)}` : null,
        semanticAnchors: guard.semanticAnchors,
        canonicalAcceptanceEligible: false
      },
      inventory: {
        existingCanonicalNodeCount: nodes.length,
        upgradedOutlineChapterCount: guard.upgradedOutlineChapterCount,
        outlineChapterMinusExistingNodeCount: guard.chapterMinusExistingNodeCount,
        preservedExistingNodeCount: entries.length,
        acceptedCanonicalOutlineMatchCount: 0,
        unresolvedSourceOutlineChapterCount: guard.upgradedOutlineChapterCount,
        approvedNewCanonicalNodeCandidateCount: 0,
        chapterCountDeltaIsNotANodeCandidateCount: true
      },
      decisionSummary: {
        retain: 0,
        rename: 0,
        move: entries.length,
        supersede: 0,
        split: 0,
        merge: 0,
        new: 0,
        moveScope: 'publication-ownership-only; same-Part chapter moves remain unresolved'
      },
      reconciliationActionGates: [
        { action: 'retain', status: 'pending-explicit-human-canonical-review' },
        { action: 'rename', status: 'pending-explicit-human-canonical-review' },
        { action: 'same-part-move', status: 'pending-explicit-human-canonical-review' },
        { action: 'publication-ownership-move', status: 'recorded-by-book-w1a' },
        { action: 'supersede', status: 'pending-explicit-human-canonical-review' },
        { action: 'split', status: 'pending-explicit-human-canonical-review' },
        { action: 'merge', status: 'pending-explicit-human-canonical-review' },
        { action: 'cross-part-related-node', status: 'pending-explicit-human-canonical-review' },
        { action: 'new-candidate', status: 'pending-explicit-human-canonical-review' }
      ],
      blocker: {
        code: guard.fullChapterListIncluded
          ? 'HUMAN_CANONICAL_MATCH_DECISIONS_REQUIRED'
          : 'COMPLETE_CHAPTER_OUTLINE_AUTHORITY_REQUIRED',
        missingAuthority,
        w1bAcceptanceBlocked: true,
        w1cSuccessorBlueprintGenerationAllowed: false
      },
      boundaries: {
        canonicalNodeRegistryMutationAllowed: false,
        frozenNodeDeletionAllowed: false,
        frozenNodeRenumberAllowed: false,
        automaticCanonicalNodeApprovalAllowed: false,
        articlePublicationAllowed: false,
        productionAuthorityCreated: false
      },
      entries
    });
  }

  return maps;
}

async function writeMaps(root) {
  const maps = await buildBookW1BOutlineMigrationMaps(root);
  const migrationRoot = path.join(root, 'content/knowledge/migrations');
  for (const [fileName, migration] of maps) {
    await fs.writeFile(
      path.join(migrationRoot, fileName),
      `${JSON.stringify(migration, null, 2)}\n`,
      'utf8'
    );
  }
  console.log(`Generated ${maps.size} fail-closed BOOK-W1B migration-map drafts.`);
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  assert.equal(process.argv[2], '--write', 'Use --write to materialize the governed migration-map drafts.');
  await writeMaps(process.cwd());
}
