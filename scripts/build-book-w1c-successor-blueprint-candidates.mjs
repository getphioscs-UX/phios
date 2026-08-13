import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CANDIDATE_ROOT = 'content/knowledge/blueprints/successors/book-w1c';
export const CANDIDATE_REGISTRY_PATH = `${CANDIDATE_ROOT}/successor-blueprint-candidate-registry-v1.json`;
export const ACCEPTANCE_PATH = `${CANDIDATE_ROOT}/book-w1c-human-acceptance-v1.json`;

export const BOOK_SPECS = [
  { bookCode: 'BOOK-2', sourcePath: 'content/knowledge/blueprints/book-2-knowledge-blueprint.json', candidateFile: 'book-2-knowledge-blueprint-v3.json', contractVersion: 'PHI-OS-BOOK-2-KNOWLEDGE-BLUEPRINT-v3.0.0', partCodes: ['P5', 'P6', 'P7'] },
  { bookCode: 'BOOK-3', sourcePath: 'content/knowledge/blueprints/book-3-knowledge-blueprint.json', candidateFile: 'book-3-knowledge-blueprint-v1.json', contractVersion: 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v1.0.0', partCodes: ['P8', 'P9'] },
  { bookCode: 'BOOK-4', sourcePath: 'content/knowledge/blueprints/book-4-knowledge-blueprint.json', candidateFile: 'book-4-knowledge-blueprint-v3.json', contractVersion: 'PHI-OS-BOOK-4-KNOWLEDGE-BLUEPRINT-v3.0.0', partCodes: ['P10', 'P11', 'P12'] },
  { bookCode: 'BOOK-5', sourcePath: 'content/knowledge/blueprints/book-5-knowledge-blueprint.json', candidateFile: 'book-5-knowledge-blueprint-v1.json', contractVersion: 'PHI-OS-BOOK-5-KNOWLEDGE-BLUEPRINT-v1.0.0', partCodes: ['P13', 'P14', 'P15'] }
];

const W1B_MAPS = {
  P8: 'content/knowledge/migrations/p8-runtime-maintenance-outline-migration-v1.json',
  P9: 'content/knowledge/migrations/p9-coordination-runtime-outline-migration-v1.json',
  P10: 'content/knowledge/migrations/p10-runtime-expansion-outline-migration-v1.json',
  P11: 'content/knowledge/migrations/p11-civilization-runtime-outline-migration-v1.json',
  P12: 'content/knowledge/migrations/p12-civilization-atlas-outline-migration-v1.json',
  P13: 'content/knowledge/migrations/p13-reading-science-outline-migration-v1.json',
  P14: 'content/knowledge/migrations/p14-navigation-science-outline-migration-v1.json',
  P15: 'content/knowledge/migrations/p15-reality-continuation-outline-migration-v1.json'
};

const CANONICAL_PART_TITLES = {
  P8: '第八部｜运行维持', P9: '第九部｜协调运行', P10: '第十部｜运行扩展',
  P11: '第十一部｜文明运行', P12: '第十二部｜文明图谱', P13: '第十三部｜读取科学',
  P14: '第十四部｜导航科学', P15: '第十五部｜现实延续'
};

const read = (root, relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');
const readJson = async (root, relativePath) => JSON.parse(await read(root, relativePath));
const normalizedDigest = value => crypto.createHash('sha256').update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
const objectText = value => `${JSON.stringify(value, null, 2)}\n`;
const objectDigest = value => normalizedDigest(objectText(value));
const candidatePath = spec => `${CANDIDATE_ROOT}/${spec.candidateFile}`;

export async function buildBookW1CCandidateSet(root = process.cwd()) {
  const [activeRegistryRaw, r5Freeze, w1Contract] = await Promise.all([
    read(root, 'content/knowledge/blueprints/blueprint-registry.json'),
    readJson(root, 'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),
    readJson(root, 'content/knowledge/migrations/five-volume-migration-contract-v1.json')
  ]);
  assert.equal(r5Freeze.status, 'FROZEN_SUCCESSOR_CANONICAL_AUTHORITY');
  assert.equal(normalizedDigest(activeRegistryRaw), r5Freeze.blueprintAuthority.registryManifestSha256);
  assert.equal(w1Contract.implementationSteps.find(step => step.step === 'BOOK-W1B')?.status, 'in_progress');

  const maps = new Map();
  for (const [partCode, migrationPath] of Object.entries(W1B_MAPS)) {
    const migration = await readJson(root, migrationPath);
    maps.set(partCode, {
      path: migrationPath,
      digest: normalizedDigest(await read(root, migrationPath)),
      migration,
      byNode: new Map(migration.entries.map((entry, index) => [entry.oldNodeCode, { entry, index }]))
    });
  }

  const candidates = new Map();
  for (const spec of BOOK_SPECS) {
    const sourceRaw = await read(root, spec.sourcePath);
    const source = JSON.parse(sourceRaw);
    assert.equal(source.bookCode, spec.bookCode);
    assert.deepEqual(source.parts.map(part => part.partCode), spec.partCodes);
    const migrationRecord = spec.bookCode === 'BOOK-2'
      ? ['content/knowledge/reconciliation/kau-r5/canonical-registry-lineage-v1.json', 'content/knowledge/reconciliation/kau-r5/kau-r5-acceptance-v1.json', 'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json']
      : spec.partCodes.map(partCode => W1B_MAPS[partCode]);
    const sourceOutlineAuthority = spec.bookCode === 'BOOK-2'
      ? { scope: 'P5-P7 completed-manuscript and Human-accepted KAU-R5 Canonical successor', status: 'accepted-and-frozen', paths: migrationRecord }
      : {
          scope: `${spec.partCodes[0]}-${spec.partCodes.at(-1)} BOOK-W1B migration-map drafts`,
          status: 'blocked-pending-w1b-human-canonical-acceptance',
          paths: spec.partCodes.map(partCode => ({ partCode, path: maps.get(partCode).path, sha256: maps.get(partCode).digest, migrationStatus: maps.get(partCode).migration.status }))
        };
    const nodes = source.nodes.map(node => {
      if (spec.bookCode === 'BOOK-2') return {
        ...node,
        publicationBookCode: spec.bookCode,
        migrationDecisionRef: { authority: 'KAU-R5-CANONICAL-SUCCESSOR', status: 'human-accepted-applied', nodeCode: node.nodeCode, path: 'content/knowledge/reconciliation/kau-r5/canonical-registry-lineage-v1.json' }
      };
      const match = maps.get(node.partCode)?.byNode.get(node.nodeCode);
      assert(match, `${spec.bookCode} ${node.nodeCode} must trace to one W1B migration decision.`);
      const { entry, index } = match;
      return {
        ...node,
        publicationBookCode: spec.bookCode,
        migrationDecisionRef: {
          authority: 'BOOK-W1B-OUTLINE-MIGRATION-MAP', status: entry.outlineMatchStatus,
          path: maps.get(node.partCode).path, entryIndex: index, oldNodeCode: entry.oldNodeCode,
          action: entry.action, canonicalIdentityChanged: entry.canonicalIdentityChanged,
          publicationOwnershipChanged: entry.publicationOwnershipChanged,
          oldChapterCode: entry.oldChapterCode, newChapterCode: entry.newChapterCode
        }
      };
    });
    const parts = source.parts.map(part => ({
      ...part,
      title: CANONICAL_PART_TITLES[part.partCode] ?? part.title,
      blueprintCandidateStatus: spec.bookCode === 'BOOK-2' ? 'kau-r5-authority-accepted' : 'w1b-human-canonical-acceptance-pending'
    }));
    const candidate = {
      ...source,
      contract: spec.contractVersion,
      contractVersion: spec.contractVersion,
      candidateContractVersion: 'PHI-OS-BOOK-W1C-SUCCESSOR-BLUEPRINT-CANDIDATE-v1.0.0',
      status: 'successor-blueprint-candidate-human-acceptance-pending',
      phase: 'BOOK-W1', step: 'BOOK-W1C-CANDIDATE-PREPARATION', recordedAt: '2026-08-13',
      migrationRecord,
      supersedes: { path: spec.sourcePath, sha256: normalizedDigest(sourceRaw), contractVersion: source.contract, historicalFileMutationAllowed: false },
      sourceOutlineAuthority,
      activation: { candidateOnly: true, w1bMigrationMapsAccepted: false, humanBlueprintAcceptanceStatus: 'PENDING', activeBlueprintRegistryMutationAllowed: false, activeBlueprintAuthorityCreated: false },
      parts,
      nodes
    };
    candidates.set(spec.candidateFile, candidate);
  }

  const candidateRegistry = {
    schemaVersion: 'PHI-OS-BOOK-W1C-SUCCESSOR-BLUEPRINT-CANDIDATE-REGISTRY-v1.0.0',
    phase: 'BOOK-W1', step: 'BOOK-W1C-CANDIDATE-PREPARATION',
    status: 'candidate-set-blocked-pending-w1b-and-human-acceptance', recordedAt: '2026-08-13',
    sourceActiveRegistry: { path: 'content/knowledge/blueprints/blueprint-registry.json', sha256: normalizedDigest(activeRegistryRaw), status: 'frozen-kau-r5-successor', mutatedByBookW1CPreparation: false },
    finalOwnershipTarget: [
      { bookCode: 'BOOK-1', partCodes: ['P1', 'P2', 'P3', 'P4'], source: 'active-predecessor-preserved' },
      ...BOOK_SPECS.map(spec => ({ bookCode: spec.bookCode, partCodes: spec.partCodes, source: candidatePath(spec) }))
    ],
    candidates: BOOK_SPECS.map(spec => {
      const candidate = candidates.get(spec.candidateFile);
      return { bookCode: spec.bookCode, path: candidatePath(spec), sha256: objectDigest(candidate), contractVersion: spec.contractVersion, canonicalNodeCount: candidate.nodes.length, partCodes: spec.partCodes, status: candidate.status };
    }),
    traceability: {
      book2NodesTraceToKauR5Count: candidates.get(BOOK_SPECS[0].candidateFile).nodes.length,
      p8ToP15NodesTraceToW1BMigrationDecisionCount: BOOK_SPECS.slice(1).flatMap(spec => candidates.get(spec.candidateFile).nodes).length,
      untracedIncludedNodeCount: 0
    },
    activationGates: { w1bMigrationMapsAccepted: false, successorBlueprintCandidatesGenerated: true, humanBlueprintAcceptanceRecorded: false, activeBlueprintRegistryMutationAllowed: false, nextPermittedGate: 'BOOK-W1B-HUMAN-CANONICAL-OUTLINE-ACCEPTANCE' }
  };
  const acceptance = {
    schemaVersion: 'PHI-OS-BOOK-W1C-HUMAN-ACCEPTANCE-v1.0.0', phase: 'BOOK-W1', step: 'BOOK-W1C', status: 'PENDING_HUMAN_ACCEPTANCE',
    candidateRegistryPath: CANDIDATE_REGISTRY_PATH, candidateRegistrySha256: objectDigest(candidateRegistry),
    humanActor: null, decidedAt: null, decision: null, allowedDecisions: ['ACCEPT', 'REVISE', 'REJECT'],
    bookDecisions: BOOK_SPECS.map(spec => ({ bookCode: spec.bookCode, candidatePath: candidatePath(spec), decision: null, reason: null })),
    boundaries: { systemMaySelfAccept: false, candidateGenerationCreatesActiveAuthority: false, activeRegistryMutationBeforeAcceptanceAllowed: false, w1bAcceptanceMayBeInferredFromThisTemplate: false }
  };
  return { candidates, candidateRegistry, acceptance };
}

async function writeCandidateSet(root) {
  const { candidates, candidateRegistry, acceptance } = await buildBookW1CCandidateSet(root);
  await fs.mkdir(path.join(root, CANDIDATE_ROOT), { recursive: true });
  for (const [fileName, candidate] of candidates) await fs.writeFile(path.join(root, CANDIDATE_ROOT, fileName), objectText(candidate), 'utf8');
  await fs.writeFile(path.join(root, CANDIDATE_REGISTRY_PATH), objectText(candidateRegistry), 'utf8');
  await fs.writeFile(path.join(root, ACCEPTANCE_PATH), objectText(acceptance), 'utf8');
  console.log(`Generated ${candidates.size} BOOK-W1C successor Blueprint candidates; activation remains blocked.`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  assert.equal(process.argv[2], '--write', 'Use --write to materialize BOOK-W1C candidates.');
  await writeCandidateSet(process.cwd());
}
