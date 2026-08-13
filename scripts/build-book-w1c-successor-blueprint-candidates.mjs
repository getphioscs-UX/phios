import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADMISSION_AUTHORIZATION_PATH,
  ADMISSION_FINAL_HUMAN_ACCEPTANCE_PATH,
  ADMISSION_HUMAN_ACCEPTANCE_PATH,
  ADMISSION_LEDGER_PATH,
  buildBookW1CCanonicalAdmissionReview
} from './build-book-w1c-canonical-node-admission-review.mjs';

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

const W1B_ACCEPTANCE_PATH =
  'content/knowledge/migrations/book-w1b/book-w1b-human-acceptance-v1.json';

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
  const admissionReview = await buildBookW1CCanonicalAdmissionReview(root);
  const admissionByOutlineKey = new Map(admissionReview.ledger.entries.map(entry =>
    [`${entry.partCode}:${entry.outlineChapterCode}`, entry]));
  const [activeRegistryRaw, r5Freeze, w1Contract, w1bAcceptance] = await Promise.all([
    read(root, 'content/knowledge/blueprints/blueprint-registry.json'),
    readJson(root, 'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),
    readJson(root, 'content/knowledge/migrations/five-volume-migration-contract-v1.json'),
    readJson(root, W1B_ACCEPTANCE_PATH)
  ]);
  assert.equal(r5Freeze.status, 'FROZEN_SUCCESSOR_CANONICAL_AUTHORITY');
  assert.equal(normalizedDigest(activeRegistryRaw), r5Freeze.blueprintAuthority.registryManifestSha256);
  assert.equal(w1Contract.implementationSteps.find(step => step.step === 'BOOK-W1B')?.status, 'accepted');
  assert.equal(w1bAcceptance.status, 'HUMAN_APPROVED');
  assert.equal(w1bAcceptance.decision, 'ACCEPT');
  assert.equal(w1bAcceptance.humanActor, 'TL');

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
      : [...spec.partCodes.map(partCode => W1B_MAPS[partCode]), W1B_ACCEPTANCE_PATH];
    const sourceOutlineAuthority = spec.bookCode === 'BOOK-2'
      ? { scope: 'P5-P7 completed-manuscript and Human-accepted KAU-R5 Canonical successor', status: 'accepted-and-frozen', paths: migrationRecord }
      : {
          scope: `${spec.partCodes[0]}-${spec.partCodes.at(-1)} Human-approved BOOK-W1B migration maps`,
          status: 'human-approved-book-w1b',
          acceptancePath: W1B_ACCEPTANCE_PATH,
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
          action: entry.outlineReconciliationRecommendation.action,
          humanDecision: entry.outlineReconciliationRecommendation.humanDecision,
          publicationOwnershipAction: entry.action,
          canonicalIdentityChanged: entry.canonicalIdentityChanged,
          publicationOwnershipChanged: entry.publicationOwnershipChanged,
          oldChapterCode: entry.oldChapterCode, newChapterCode: entry.newChapterCode
        }
      };
    });
    const parts = source.parts.map(part => ({
      ...part,
      title: CANONICAL_PART_TITLES[part.partCode] ?? part.title,
      blueprintCandidateStatus: 'book-w1c-human-approved-successor'
    }));
    const newCanonicalNodeCandidates = spec.bookCode === 'BOOK-2' ? [] : spec.partCodes.flatMap(partCode =>
      maps.get(partCode).migration.outlineCandidates
        .filter(candidate => candidate.recommendedAction === 'new candidate')
        .map(candidate => {
          const admission = admissionByOutlineKey.get(`${partCode}:${candidate.outlineChapterCode}`);
          assert(admission, `${partCode} ${candidate.outlineChapterCode} must have one admission review record.`);
          return ({
          partCode,
          outlineChapterCode: candidate.outlineChapterCode,
          sourceTitle: candidate.sourceTitle,
          canonicalQuestion: candidate.canonicalQuestion,
          candidateOnly: true,
          canonicalNodeApproved: false,
          w1bDisposition: candidate.disposition,
          admissionCandidateCode: admission.admissionCandidateCode,
          admissionRecommendation: admission.recommendation,
          provisionalNodeCode: admission.provisionalNodeCode,
          admissionReviewStatus: ['promote', 'supersede'].includes(admission.recommendation.action)
            ? 'HUMAN_RECOMMENDATION_ACCEPTED_CANONICAL_ADMISSION_PENDING_W1D'
            : admission.recommendation.action === 'link to existing'
              ? 'HUMAN_LINK_RELATIONSHIP_ACCEPTED_NO_NEW_IDENTITY'
              : 'HUMAN_DEFERRED_ADMISSION_PRESERVED',
          admissionReviewRef: {
            path: ADMISSION_LEDGER_PATH,
            entryIndex: admissionReview.ledger.entries.indexOf(admission)
          },
          migrationDecisionRef: {
            authority: 'BOOK-W1B-OUTLINE-MIGRATION-MAP',
            path: maps.get(partCode).path,
            outlineCandidateIndex: maps.get(partCode).migration.outlineCandidates.indexOf(candidate),
            humanDecision: candidate.humanDecision
          }
          });
        }));
    const nonDispositiveReviewEvidence = spec.bookCode === 'BOOK-2'
      ? { splitCandidateCount: 0, mergeCandidateCount: 0, disposition: 'NOT_APPLICABLE' }
      : {
          splitCandidateCount: spec.partCodes.reduce((sum, partCode) =>
            sum + maps.get(partCode).migration.splitCandidates.length, 0),
          mergeCandidateCount: spec.partCodes.reduce((sum, partCode) =>
            sum + maps.get(partCode).migration.mergeCandidates.length, 0),
          disposition: 'NON_DISPOSITIVE_REVIEW_EVIDENCE',
          sourcePaths: spec.partCodes.map(partCode => maps.get(partCode).path)
        };
    const candidate = {
      ...source,
      contract: spec.contractVersion,
      contractVersion: spec.contractVersion,
      candidateContractVersion: 'PHI-OS-BOOK-W1C-SUCCESSOR-BLUEPRINT-CANDIDATE-v1.0.0',
      status: 'successor-blueprint-human-approved-ready-for-w1d-review',
      phase: 'BOOK-W1', step: 'BOOK-W1C-CANDIDATE-PREPARATION', recordedAt: '2026-08-13',
      migrationRecord,
      supersedes: { path: spec.sourcePath, sha256: normalizedDigest(sourceRaw), contractVersion: source.contract, historicalFileMutationAllowed: false },
      sourceOutlineAuthority,
      activation: { candidateOnly: true, w1bMigrationMapsAccepted: true, humanBlueprintAcceptanceStatus: 'ACCEPTED', activeBlueprintRegistryMutationAllowed: false, activeBlueprintAuthorityCreated: false, nextGate: 'BOOK-W1D-HUMAN-CANONICAL-RECONCILIATION-REVIEW' },
      parts,
      nodes,
      newCanonicalNodeCandidates,
      canonicalAdmissionReview: {
        authorizationPath: ADMISSION_AUTHORIZATION_PATH,
        partialHumanAcceptancePath: ADMISSION_HUMAN_ACCEPTANCE_PATH,
        humanAcceptancePath: ADMISSION_FINAL_HUMAN_ACCEPTANCE_PATH,
        ledgerPath: ADMISSION_LEDGER_PATH,
        ledgerSha256: objectDigest(admissionReview.ledger),
        candidateCount: newCanonicalNodeCandidates.length,
        recommendationCounts: {
          promote: newCanonicalNodeCandidates.filter(candidate =>
            candidate.admissionRecommendation.action === 'promote').length,
          linkToExisting: newCanonicalNodeCandidates.filter(candidate =>
            candidate.admissionRecommendation.action === 'link to existing').length,
          supersede: newCanonicalNodeCandidates.filter(candidate =>
            candidate.admissionRecommendation.action === 'supersede').length,
          defer: newCanonicalNodeCandidates.filter(candidate =>
            candidate.admissionRecommendation.action === 'defer').length
        },
        humanDecisionCount: newCanonicalNodeCandidates.filter(candidate =>
          candidate.admissionRecommendation.humanDecision !== null).length,
        acceptedRecommendationCount: newCanonicalNodeCandidates.filter(candidate =>
          candidate.admissionRecommendation.humanDecision === 'ACCEPT_RECOMMENDATION').length,
        acceptedDeferredDispositionCount: newCanonicalNodeCandidates.filter(candidate =>
          candidate.admissionRecommendation.humanDecision === 'ACCEPT_DEFERRED_DISPOSITION').length,
        canonicalAdmissionRecommendationCount: newCanonicalNodeCandidates.filter(candidate =>
          ['promote', 'supersede'].includes(candidate.admissionRecommendation.action)).length,
        pendingHumanDecisionCount: newCanonicalNodeCandidates.filter(candidate =>
          candidate.admissionRecommendation.humanDecision === null).length,
        approvedCanonicalNodeCount: 0
      },
      nonDispositiveReviewEvidence
    };
    candidates.set(spec.candidateFile, candidate);
  }

  const candidateRegistry = {
    schemaVersion: 'PHI-OS-BOOK-W1C-SUCCESSOR-BLUEPRINT-CANDIDATE-REGISTRY-v1.0.0',
    phase: 'BOOK-W1', step: 'BOOK-W1C-CANDIDATE-PREPARATION',
    status: 'human-approved-successor-set-ready-for-w1d-review', recordedAt: '2026-08-13',
    sourceActiveRegistry: { path: 'content/knowledge/blueprints/blueprint-registry.json', sha256: normalizedDigest(activeRegistryRaw), status: 'frozen-kau-r5-successor', mutatedByBookW1CPreparation: false },
    finalOwnershipTarget: [
      { bookCode: 'BOOK-1', partCodes: ['P1', 'P2', 'P3', 'P4'], source: 'active-predecessor-preserved' },
      ...BOOK_SPECS.map(spec => ({ bookCode: spec.bookCode, partCodes: spec.partCodes, source: candidatePath(spec) }))
    ],
    candidates: BOOK_SPECS.map(spec => {
      const candidate = candidates.get(spec.candidateFile);
      return {
        bookCode: spec.bookCode, path: candidatePath(spec), sha256: objectDigest(candidate),
        contractVersion: spec.contractVersion, canonicalNodeCount: candidate.nodes.length,
        newCanonicalNodeCandidateCount: candidate.newCanonicalNodeCandidates.length,
        partCodes: spec.partCodes, status: candidate.status
      };
    }),
    traceability: {
      book2NodesTraceToKauR5Count: candidates.get(BOOK_SPECS[0].candidateFile).nodes.length,
      p8ToP15NodesTraceToW1BMigrationDecisionCount: BOOK_SPECS.slice(1).flatMap(spec => candidates.get(spec.candidateFile).nodes).length,
      candidateOnlyNewOutlineChaptersTraceToW1BCount: BOOK_SPECS.slice(1)
        .flatMap(spec => candidates.get(spec.candidateFile).newCanonicalNodeCandidates).length,
      humanResolvedAdmissionDispositionCount: admissionReview.ledger.inventory.resolvedHumanDispositionCount,
      canonicalAdmissionRecommendationCount: admissionReview.ledger.inventory.provisionalNodeCodeCount,
      acceptedLinkRelationshipCount: admissionReview.ledger.inventory.acceptedLinkToExistingCount,
      deferredCandidateCount: admissionReview.ledger.inventory.acceptedDeferredDispositionCount,
      pendingAdmissionRecommendationCount: admissionReview.ledger.inventory.pendingHumanDecisionCount,
      approvedNewCanonicalNodeCount: 0,
      untracedIncludedNodeCount: 0
    },
    canonicalAdmissionReview: {
      authorizationPath: ADMISSION_AUTHORIZATION_PATH,
      authorizationSha256: objectDigest(admissionReview.authorization),
      authorizationStatus: admissionReview.authorization.status,
      partialHumanAcceptancePath: ADMISSION_HUMAN_ACCEPTANCE_PATH,
      partialHumanAcceptanceSha256: objectDigest(admissionReview.humanAcceptance),
      humanAcceptancePath: ADMISSION_FINAL_HUMAN_ACCEPTANCE_PATH,
      humanAcceptanceSha256: objectDigest(admissionReview.finalHumanAcceptance),
      humanAcceptanceStatus: admissionReview.finalHumanAcceptance.status,
      ledgerPath: ADMISSION_LEDGER_PATH,
      ledgerSha256: objectDigest(admissionReview.ledger),
      ...admissionReview.ledger.inventory
    },
    activationGates: { w1bMigrationMapsAccepted: true, successorBlueprintCandidatesGenerated: true, canonicalAdmissionReviewPartiallyAccepted: true, canonicalAdmissionReviewFullyResolved: true, humanBlueprintAcceptanceRecorded: true, activeBlueprintRegistryMutationAllowed: false, activeBlueprintAuthorityCreated: false, nextPermittedGate: 'BOOK-W1D-HUMAN-CANONICAL-RECONCILIATION-REVIEW' }
  };
  const acceptance = {
    schemaVersion: 'PHI-OS-BOOK-W1C-HUMAN-ACCEPTANCE-v1.0.0', phase: 'BOOK-W1', step: 'BOOK-W1C', status: 'HUMAN_APPROVED',
    candidateRegistryPath: CANDIDATE_REGISTRY_PATH, candidateRegistrySha256: objectDigest(candidateRegistry),
    humanActor: 'TL', decidedAt: '2026-08-13', decision: 'ACCEPT', allowedDecisions: ['ACCEPT', 'REVISE', 'REJECT'],
    acceptanceStatement: admissionReview.finalHumanAcceptance.acceptanceStatement,
    admissionReviewAuthorization: {
      path: ADMISSION_AUTHORIZATION_PATH,
      status: admissionReview.authorization.status,
      humanActor: 'TL',
      reviewAuthorized: true,
      authorizationIsW1CAcceptance: false
    },
    admissionReview: {
      path: ADMISSION_LEDGER_PATH,
      sha256: objectDigest(admissionReview.ledger),
      partialHumanAcceptancePath: ADMISSION_HUMAN_ACCEPTANCE_PATH,
      partialHumanAcceptanceSha256: objectDigest(admissionReview.humanAcceptance),
      humanAcceptancePath: ADMISSION_FINAL_HUMAN_ACCEPTANCE_PATH,
      humanAcceptanceSha256: objectDigest(admissionReview.finalHumanAcceptance),
      candidateCount: admissionReview.ledger.inventory.candidateCount,
      recommendationCounts: {
        promote: admissionReview.ledger.inventory.promote,
        linkToExisting: admissionReview.ledger.inventory.linkToExisting,
        supersede: admissionReview.ledger.inventory.supersede,
        defer: admissionReview.ledger.inventory.defer
      },
      decision: 'ACCEPT_ALL_RECOMMENDATIONS_AND_DEFERRED_DISPOSITIONS',
      acceptedRecommendationCounts: {
        promote: admissionReview.ledger.inventory.acceptedPromoteCount,
        linkToExisting: admissionReview.ledger.inventory.acceptedLinkToExistingCount,
        supersede: admissionReview.ledger.inventory.acceptedSupersedeCount,
        deferAsDeferredAdmission: admissionReview.ledger.inventory.acceptedDeferredDispositionCount,
        totalResolved: admissionReview.ledger.inventory.resolvedHumanDispositionCount
      },
      pendingRecommendationCounts: {
        linkToExisting: 0,
        defer: 0,
        total: admissionReview.ledger.inventory.pendingHumanDecisionCount
      },
      acceptedRecommendationOverrides: []
    },
    bookDecisions: BOOK_SPECS.map(spec => {
      const candidate = candidates.get(spec.candidateFile);
      return {
        bookCode: spec.bookCode,
        candidatePath: candidatePath(spec),
        candidateSha256: objectDigest(candidate),
        canonicalNodeCount: candidate.nodes.length,
        newCanonicalNodeCandidateCount: candidate.newCanonicalNodeCandidates.length,
        admissionRecommendationCounts: candidate.canonicalAdmissionReview.recommendationCounts,
        acceptedAdmissionRecommendationCount: candidate.canonicalAdmissionReview.acceptedRecommendationCount,
        pendingAdmissionRecommendationCount: candidate.canonicalAdmissionReview.pendingHumanDecisionCount,
        admissionDecision: candidate.newCanonicalNodeCandidates.length === 0
          ? 'NOT_APPLICABLE'
          : 'ACCEPT_RECOMMENDATIONS_AND_DEFERRED_DISPOSITIONS',
        decision: 'ACCEPT',
        reason: 'TL accepted the successor Blueprint and its complete W1C admission-review dispositions.',
        acceptedRecommendationOverrides: []
      };
    }),
    reviewPolicy: {
      w1bPrimaryRecommendationsAreAcceptedInputs: true,
      splitAndMergeAreNonDispositiveEvidence: true,
      newCandidatesRequireSeparateCanonicalGovernance: true,
      all323CandidatesHumanResolvedInW1C: true,
      acceptedAdmissionRecommendationsRemainNonCanonicalUntilW1D: true,
      deferredAdmissionCandidatesRemainPreserved: true,
      acceptanceActivatesBlueprintRegistryAutomatically: false
    },
    approvalInstructions: {
      chatAuthorizationMayBeUsed: true,
      recordedChatStatement: admissionReview.finalHumanAcceptance.acceptanceStatement,
      allBookDecisionsMustBeRecorded: true,
      overridesMustBeExplicit: true,
      repositoryRecordingCompleted: true,
      w1dMayBegin: true
    },
    boundaries: {
      systemMaySelfAccept: false,
      candidateGenerationCreatesActiveAuthority: false,
      admissionReviewAuthorizationCreatesCanonicalNode: false,
      partialAdmissionAcceptanceCreatesCanonicalNode: false,
      activeRegistryMutationBeforeAcceptanceAllowed: false,
      activeBlueprintRegistryMutatedByAcceptance: false,
      nodesJsonMutatedByAcceptance: false,
      w1bAcceptanceMayBeInferredFromThisTemplate: false
    }
  };
  return { candidates, candidateRegistry, acceptance, admissionReview };
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
