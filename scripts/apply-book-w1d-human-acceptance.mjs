import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const W1D_ROOT = 'content/knowledge/migrations/book-w1d';
export const W1D_CANDIDATE_PATH = `${W1D_ROOT}/canonical-registry-reconciliation-candidate-v1.json`;
export const W1D_PUBLICATION_CANDIDATE_PATH = `${W1D_ROOT}/publication-ownership-migration-candidate-v1.json`;
export const W1D_ACCEPTANCE_PATH = `${W1D_ROOT}/book-w1d-human-acceptance-v1.json`;
export const W1D_ACTIVE_RECONCILIATION_PATH = `${W1D_ROOT}/canonical-registry-reconciliation-active-v1.json`;
export const W1D_ACTIVE_PUBLICATION_PATH = `${W1D_ROOT}/publication-ownership-migration-active-v1.json`;
export const W1D_SUCCESSOR_NODE_PATH = 'content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json';
export const W1D_SUCCESSOR_BLUEPRINT_ROOT = 'content/knowledge/blueprints/successors/book-w1d';
export const W1D_SUCCESSOR_FREEZE_PATH = `${W1D_SUCCESSOR_BLUEPRINT_ROOT}/knowledge-blueprint-freeze-v1.json`;
export const W1D_SUCCESSOR_AUTHORITY_PATH = 'content/knowledge/contracts/knowledge-registry-authority-book-w1d-v1.json';
export const ACTIVE_BLUEPRINT_REGISTRY_PATH = 'content/knowledge/blueprints/blueprint-registry.json';
export const HISTORICAL_NODE_PATH = 'content/knowledge/registry/nodes.json';
export const HISTORICAL_BLUEPRINT_FREEZE_PATH = 'content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json';
export const MIGRATION_CONTRACT_PATH = 'content/knowledge/migrations/five-volume-migration-contract-v1.json';

export const BOOK_SPECS = Object.freeze([
  { bookCode: 'BOOK-2', partCodes: ['P5', 'P6', 'P7'], candidateFile: 'book-2-knowledge-blueprint-v3.json', successorFile: 'book-2-knowledge-blueprint-v4.json', contract: 'PHI-OS-BOOK-2-KNOWLEDGE-BLUEPRINT-v4.0.0' },
  { bookCode: 'BOOK-3', partCodes: ['P8', 'P9'], candidateFile: 'book-3-knowledge-blueprint-v1.json', successorFile: 'book-3-knowledge-blueprint-v2.json', contract: 'PHI-OS-BOOK-3-KNOWLEDGE-BLUEPRINT-v2.0.0' },
  { bookCode: 'BOOK-4', partCodes: ['P10', 'P11', 'P12'], candidateFile: 'book-4-knowledge-blueprint-v3.json', successorFile: 'book-4-knowledge-blueprint-v4.json', contract: 'PHI-OS-BOOK-4-KNOWLEDGE-BLUEPRINT-v4.0.0' },
  { bookCode: 'BOOK-5', partCodes: ['P13', 'P14', 'P15'], candidateFile: 'book-5-knowledge-blueprint-v1.json', successorFile: 'book-5-knowledge-blueprint-v2.json', contract: 'PHI-OS-BOOK-5-KNOWLEDGE-BLUEPRINT-v2.0.0' }
]);

const W1C_ROOT = 'content/knowledge/blueprints/successors/book-w1c';
const W1C_LEDGER_PATH = `${W1C_ROOT}/canonical-node-admission-review-candidates-v1.json`;
const W1C_ACCEPTANCE_PATH = `${W1C_ROOT}/book-w1c-human-acceptance-v1.json`;
const W1C_FINAL_ACCEPTANCE_PATH = `${W1C_ROOT}/canonical-node-admission-review-human-acceptance-v2.json`;
const W1B_SOURCE_AUTHORITY_PATH = 'content/knowledge/migrations/book-w1b/source-authority/book-w1b-part-8-15-final-outline-authority-v1.json';
const W1D_STATEMENT = [
  '接受 718 项 existing identity reconciliation。',
  '接受 192 promote + 21 supersede admissions。',
  '接受 473 项 publication ownership records。',
  'KN-B2-P7-052 → P11：apply。',
  'KN-B2-P7-057 → P10：apply。'
].join('\n');

const read = (root, relative) => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async (root, relative) => JSON.parse(await read(root, relative));
const normalize = value => value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
export const sha256 = value => crypto.createHash('sha256').update(normalize(value), 'utf8').digest('hex');
export const objectText = value => `${JSON.stringify(value, null, 2)}\n`;
export const objectSha = value => sha256(objectText(value));
const clone = value => structuredClone(value);
const partNumber = partCode => Number(partCode.slice(1));
const chapterOrder = value => String(value ?? '').split('.').map(segment => Number(segment.replace(/\D/g, '')) || 0);
const compareChapter = (left, right) => {
  const a = chapterOrder(left.chapterCode);
  const b = chapterOrder(right.chapterCode);
  return (a[0] - b[0]) || (a[1] - b[1]) || left.nodeCode.localeCompare(right.nodeCode);
};
const blueprintPath = spec => `${W1D_SUCCESSOR_BLUEPRINT_ROOT}/${spec.successorFile}`;
const candidatePath = spec => `${W1C_ROOT}/${spec.candidateFile}`;

function newCanonicalNode(record) {
  const supersede = record.recommendation.action === 'supersede';
  return {
    nodeCode: record.provisionalNodeCode,
    collectionCode: `KC-${record.targetPublicationBookCode}-${record.partCode}`,
    themeCode: `TH-${record.targetPublicationBookCode}-${record.partCode}`,
    canonicalQuestionKey: record.admissionCandidateCode.toLowerCase(),
    nodeType: 'mechanism_question',
    knowledgeLevel: record.targetPublicationBookCode === 'BOOK-3' ? 'foundational' : 'advanced',
    productionTier: 'tier_b',
    primaryAssetType: 'article',
    canonicalLanguage: 'zh-Hans',
    requiredPublicLanguages: ['zh-Hans', 'en'],
    registryStatus: 'planned',
    productionQueue: 'not_scheduled',
    productionEffort: 'unassessed',
    publicationPriority: 'not_scheduled',
    supportingQuestionCodes: [],
    legacyNodeCodes: supersede ? [record.recommendation.targetExistingNodeCode] : [],
    relationships: {
      prerequisiteNodeCodes: [], nextNodeCodes: [], relatedNodeCodes: [],
      parentNodeCodes: [], childNodeCodes: []
    },
    dependencies: [],
    chapterCode: record.outlineChapterCode,
    partCode: record.partCode,
    sourceBookCode: record.targetPublicationBookCode,
    publicationBookCode: record.targetPublicationBookCode,
    publicationPartCode: record.partCode,
    titleZhHans: record.sourceTitle,
    canonicalQuestion: record.canonicalQuestion,
    productionReady: false,
    articleStatus: 'not_created',
    candidateStatus: 'not_created',
    sourceReferences: [],
    canonicalAdmission: {
      status: 'HUMAN_APPROVED_BOOK_W1D',
      action: record.recommendation.action,
      admissionCandidateCode: record.admissionCandidateCode,
      humanAcceptancePath: W1D_ACCEPTANCE_PATH,
      sourceOutlineAuthority: record.sourceAuthority,
      canonicalIdentityChanged: supersede,
      lineage: supersede ? {
        legacyNodeCode: record.recommendation.targetExistingNodeCode,
        successorNodeCode: record.provisionalNodeCode,
        compatibilityStrategy: record.lineageCandidate.compatibilityStrategy
      } : null
    },
    version: '1.0.0'
  };
}

function applyCanonicalSuccessor(baseline, candidate, publication, admissionLedger) {
  const existing = baseline.nodes.map(node => ({
    ...clone(node),
    canonicalReconciliation: {
      status: 'HUMAN_APPROVED_BOOK_W1D',
      oldNodeCode: node.nodeCode,
      canonicalNodeCode: node.nodeCode,
      canonicalIdentityChanged: false,
      humanAcceptancePath: W1D_ACCEPTANCE_PATH
    }
  }));
  const byCode = new Map(existing.map(node => [node.nodeCode, node]));
  assert.equal(byCode.size, 718);

  for (const record of publication.records) {
    const node = byCode.get(record.canonicalNodeCode);
    assert(node, `Missing ownership target ${record.canonicalNodeCode}`);
    node.publicationBookCode = record.newPublicationBookCode;
    node.publicationPartCode = record.partCode;
    node.publicationOwnershipMigration = {
      status: 'HUMAN_APPROVED_APPLIED_BOOK_W1D',
      oldPublicationBookCode: record.oldPublicationBookCode,
      newPublicationBookCode: record.newPublicationBookCode,
      partCode: record.partCode,
      migrationRecord: record.migrationRecord,
      humanAcceptancePath: W1D_ACCEPTANCE_PATH
    };
    if (record.oldPartCode) {
      node.registryStatus = 'planned';
      node.productionQueue = 'not_scheduled';
      node.canonicalDisposition = {
        ...(node.canonicalDisposition ?? {}),
        status: 'REHOME_APPLIED_BOOK_W1D',
        physicalMoveStatus: 'APPLIED',
        oldPartCode: record.oldPartCode,
        targetPartCode: record.partCode,
        targetChapterCode: record.targetChapterCode,
        historicalIdentityPreserved: true,
        nodeCodeRenamed: false,
        humanAcceptancePath: W1D_ACCEPTANCE_PATH
      };
    }
  }

  for (const relationship of candidate.acceptedLinkRelationships) {
    const node = byCode.get(relationship.targetExistingNodeCode);
    assert(node, `Missing link target ${relationship.targetExistingNodeCode}`);
    node.outlineAuthorityLinks = [
      ...(node.outlineAuthorityLinks ?? []),
      {
        admissionCandidateCode: relationship.admissionCandidateCode,
        partCode: relationship.partCode,
        outlineChapterCode: relationship.outlineChapterCode,
        sourceTitle: relationship.sourceTitle,
        relationship: 'governed-outline-authority-link',
        humanAcceptancePath: W1C_FINAL_ACCEPTANCE_PATH,
        appliedBy: 'BOOK-W1D'
      }
    ];
  }

  const admittedRecords = admissionLedger.entries.filter(record =>
    ['promote', 'supersede'].includes(record.recommendation.action));
  const supersedeGroups = Map.groupBy(
    admittedRecords.filter(record => record.recommendation.action === 'supersede'),
    record => record.recommendation.targetExistingNodeCode
  );
  for (const [legacyNodeCode, records] of supersedeGroups) {
    const legacy = byCode.get(legacyNodeCode);
    assert(legacy, `Missing supersede legacy identity ${legacyNodeCode}`);
    legacy.registryStatus = 'superseded';
    legacy.productionQueue = 'retired';
    legacy.productionReady = false;
    if (legacy.crossSessionNode) legacy.crossSessionNode.enabled = false;
    legacy.canonicalDisposition = {
      ...(legacy.canonicalDisposition ?? {}),
      status: 'SUPERSEDED_BY_BOOK_W1D_HUMAN_ACCEPTED_SUCCESSORS',
      legacyNodeCode,
      successorNodeCodes: records.map(record => record.provisionalNodeCode),
      humanAcceptancePath: W1D_ACCEPTANCE_PATH,
      lineage: records.map(record => ({
        legacyNodeCode,
        successorNodeCode: record.provisionalNodeCode,
        compatibilityStrategy: record.lineageCandidate.compatibilityStrategy
      })),
      compatibilityStrategy: 'preserve-legacy-nodeCode-and-resolve-to-human-approved-successor-set',
      historicalIdentityPreserved: true,
      nodeCodeReusable: false,
      canonicalIdentityChanged: true
    };
  }

  const admitted = admittedRecords.map(newCanonicalNode);
  assert.equal(admitted.length, 213);
  assert.equal(admitted.filter(node => node.canonicalAdmission.action === 'promote').length, 192);
  assert.equal(admitted.filter(node => node.canonicalAdmission.action === 'supersede').length, 21);
  assert(admitted.every(node => !byCode.has(node.nodeCode)));
  const nodes = [...existing, ...admitted];
  assert.equal(nodes.length, 931);
  assert.equal(new Set(nodes.map(node => node.nodeCode)).size, 931);
  assert.equal(new Set(nodes.map(node => node.canonicalQuestionKey)).size, 931);
  return {
    $schema: '../../schemas/nodes.schema.json',
    schemaVersion: 'PHI-OS-CANONICAL-NODE-REGISTRY-BOOK-W1D-SUCCESSOR-v1.0.0',
    contractVersion: 'PHI-OS-CANONICAL-KNOWLEDGE-AUTHORITY-v3.0.0',
    version: '3.0.0',
    status: 'HUMAN_APPROVED_ACTIVE_BOOK_W1D_SUCCESSOR',
    migrationRecord: [W1D_CANDIDATE_PATH, W1D_PUBLICATION_CANDIDATE_PATH, W1D_ACCEPTANCE_PATH],
    supersedes: {
      path: HISTORICAL_NODE_PATH,
      sha256: sha256(objectText(baseline)),
      version: baseline.version,
      historicalAuthorityMutationAllowed: false
    },
    sourceOutlineAuthority: {
      path: W1B_SOURCE_AUTHORITY_PATH,
      w1cAdmissionLedgerPath: W1C_LEDGER_PATH,
      w1cHumanAcceptancePath: W1C_ACCEPTANCE_PATH
    },
    humanAcceptance: { path: W1D_ACCEPTANCE_PATH, actor: 'TL', decision: 'ACCEPT' },
    accounting: {
      existingIdentityRecordCount: 718,
      admittedCanonicalNodeCount: 213,
      promoteAdmissionCount: 192,
      supersedeAdmissionCount: 21,
      uniqueLegacySupersededIdentityCount: supersedeGroups.size,
      acceptedLinkRelationshipCount: 66,
      deferredCandidateCount: 44,
      successorCanonicalNodeRecordCount: 931,
      silentDeletionCount: 0,
      ungovernedNodeCodeMutationCount: 0,
      duplicateIdentityCount: 0,
      orphanMigrationEntryCount: 0
    },
    boundaries: {
      canonicalAdmissionCreatesProductionAuthority: false,
      publicationOwnershipCreatesArticleAuthority: false,
      deferredCandidatePromoted: false,
      historicalRegistryRewritten: false,
      bookW1EAccepted: false
    },
    nodes
  };
}

function activeBlueprintNode(node, candidateNode) {
  const publicationPartCode = node.publicationPartCode ?? node.partCode;
  return {
    ...(candidateNode ? clone(candidateNode) : {
      nodeCode: node.nodeCode,
      chapterCode: node.chapterCode,
      titleZhHans: node.titleZhHans,
      titleEn: node.titleEn ?? null,
      status: node.registryStatus,
      productionPriority: node.publicationPriority,
      articleRequiredNow: false,
      publicLanguagePlan: node.requiredPublicLanguages,
      sourceRole: 'canonical-mechanism',
      relationships: node.relationships,
      dependencies: node.dependencies ?? []
    }),
    partCode: publicationPartCode,
    canonicalPartCode: node.partCode,
    publicationBookCode: node.publicationBookCode,
    publicationPartCode,
    status: node.registryStatus,
    canonicalAdmission: node.canonicalAdmission ?? null,
    canonicalDisposition: node.canonicalDisposition ?? null,
    canonicalAuthorityPath: W1D_SUCCESSOR_NODE_PATH
  };
}

function buildBlueprintSuccessors(successorRegistry, candidates) {
  const byCode = new Map(successorRegistry.nodes.map(node => [node.nodeCode, node]));
  const candidateNodeByCode = new Map(
    [...candidates.values()].flatMap(candidate => candidate.nodes).map(node => [node.nodeCode, node])
  );
  const outputs = new Map();
  for (const spec of BOOK_SPECS) {
    const candidate = candidates.get(spec.bookCode);
    const nodes = successorRegistry.nodes
      .filter(node => node.publicationBookCode === spec.bookCode
        && spec.partCodes.includes(node.publicationPartCode ?? node.partCode))
      .map(node => activeBlueprintNode(node, candidateNodeByCode.get(node.nodeCode)))
      .sort((left, right) => partNumber(left.partCode) - partNumber(right.partCode)
        || compareChapter(left, right));
    assert(nodes.every(node => byCode.has(node.nodeCode)));
    const parts = candidate.parts.map(part => {
      const partNodes = nodes.filter(node => node.partCode === part.partCode);
      return {
        ...part,
        canonicalNodeCount: partNodes.length,
        nodes: partNodes.map(node => node.nodeCode),
        blueprintStatus: 'book-w1d-human-approved-active-successor'
      };
    });
    const deferredCanonicalNodeCandidates = candidate.newCanonicalNodeCandidates
      .filter(record => record.admissionRecommendation.action === 'defer');
    const output = {
      ...candidate,
      contract: spec.contract,
      contractVersion: spec.contract,
      schemaVersion: 'PHI-OS-KNOWLEDGE-BLUEPRINT-v2.0.0',
      status: 'book-w1d-human-approved-active-successor',
      phase: 'BOOK-W1',
      step: 'BOOK-W1D-ACTIVE-SUCCESSOR',
      recordedAt: '2026-08-14',
      plannedCanonicalNodes: nodes.length,
      newNodesBeyondPreface: nodes.length,
      migrationRecord: [...candidate.migrationRecord, W1D_CANDIDATE_PATH, W1D_ACCEPTANCE_PATH],
      supersedes: {
        path: candidatePath(spec),
        sha256: objectSha(candidate),
        contractVersion: candidate.contractVersion,
        historicalFileMutationAllowed: false
      },
      sourceOutlineAuthority: candidate.sourceOutlineAuthority,
      knowledgeAuthority: W1D_SUCCESSOR_NODE_PATH,
      activation: {
        candidateOnly: false,
        w1bMigrationMapsAccepted: true,
        w1cBlueprintAccepted: true,
        w1dHumanAcceptanceStatus: 'ACCEPTED',
        activeBlueprintAuthorityCreated: true,
        productionAuthorityCreated: false,
        nextGate: 'BOOK-W1E-HUMAN-PUBLIC-PROJECTION-ACCEPTANCE'
      },
      parts,
      nodes,
      newCanonicalNodeCandidates: deferredCanonicalNodeCandidates,
      canonicalAdmissionReview: {
        ...candidate.canonicalAdmissionReview,
        w1dHumanAcceptancePath: W1D_ACCEPTANCE_PATH,
        admittedCanonicalNodeCount: nodes.filter(node => node.canonicalAdmission).length,
        deferredCandidateCount: deferredCanonicalNodeCandidates.length,
        pendingHumanDecisionCount: 0,
        activeCanonicalAuthorityCreated: true
      },
      boundaries: {
        productionAuthorityCreated: false,
        deferredCandidatePromoted: false,
        historicalBlueprintMutated: false,
        publicProjectionActivated: false
      }
    };
    outputs.set(spec.bookCode, output);
  }
  assert.deepEqual(Object.fromEntries([...outputs].map(([bookCode, blueprint]) => [bookCode, blueprint.nodes.length])), {
    'BOOK-2': 180, 'BOOK-3': 105, 'BOOK-4': 279, 'BOOK-5': 302
  });
  return outputs;
}

function buildActiveBlueprintRegistry(book1Raw, book1, blueprints, historicalFreeze, r5) {
  const book1Historical = historicalFreeze.bookFreeze.find(record => record.bookCode === 'BOOK-1');
  assert(book1Historical);
  const entries = [{
    bookCode: 'BOOK-1',
    blueprintPath: book1Historical.blueprintPath,
    contract: book1.contract,
    schemaVersion: book1.schemaVersion,
    status: book1.status,
    canonicalLanguage: book1.canonicalLanguage,
    partCodes: book1.parts.map(part => part.partCode),
    canonicalNodeCount: book1.nodes.length,
    sha256: sha256(book1Raw),
    productionEligibility: 'registered_nodes_only'
  }, ...BOOK_SPECS.map(spec => {
    const blueprint = blueprints.get(spec.bookCode);
    return {
      bookCode: spec.bookCode,
      blueprintPath: blueprintPath(spec),
      contract: blueprint.contract,
      schemaVersion: blueprint.schemaVersion,
      status: blueprint.status,
      canonicalLanguage: blueprint.canonicalLanguage,
      partCodes: spec.partCodes,
      canonicalNodeCount: blueprint.nodes.length,
      sha256: objectSha(blueprint),
      productionEligibility: 'registered_nodes_only'
    };
  })];
  return {
    contract: 'PHI-OS-KNOWLEDGE-BLUEPRINT-REGISTRY-v2.0.0',
    schemaVersion: 'PHI-OS-KNOWLEDGE-BLUEPRINT-REGISTRY-v2.0.0',
    contractVersion: 'PHI-OS-BOOK-W1D-ACTIVE-BLUEPRINT-REGISTRY-v1.0.0',
    status: 'book-w1d-human-approved-frozen-successor',
    authority: {
      canonicalKnowledge: W1D_SUCCESSOR_NODE_PATH,
      publicationOwnership: 'content/registry/parts.json',
      bookIdentity: 'content/registry/books.json',
      partIdentity: 'content/registry/parts.json'
    },
    policies: {
      nodeIdentityChangesWithPublication: false,
      blueprintMayCreateCanonicalNode: false,
      architectureOnlyPartMayEnterProduction: false,
      directSingleBookAssumptionDeprecated: true,
      registryRequiredForProduction: true,
      failClosedOnDigestMismatch: true
    },
    migrationRecord: [W1D_CANDIDATE_PATH, W1D_ACTIVE_RECONCILIATION_PATH, W1D_ACCEPTANCE_PATH],
    supersedes: {
      path: ACTIVE_BLUEPRINT_REGISTRY_PATH,
      sha256: r5.blueprintAuthority.registryManifestSha256,
      historicalFreezePath: HISTORICAL_BLUEPRINT_FREEZE_PATH,
      historicalAuthorityMutationAllowed: false
    },
    sourceOutlineAuthority: W1B_SOURCE_AUTHORITY_PATH,
    humanAcceptance: { path: W1D_ACCEPTANCE_PATH, actor: 'TL', decision: 'ACCEPT' },
    authorityContract: W1D_SUCCESSOR_AUTHORITY_PATH,
    freezeAuthorityPath: W1D_SUCCESSOR_FREEZE_PATH,
    books: entries,
    totals: {
      books: 5,
      parts: 16,
      canonicalNodes: entries.reduce((total, entry) => total + entry.canonicalNodeCount, 0)
    },
    legacy: {
      book1V1Snapshot: 'content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json',
      kauR5RegistrySha256: r5.blueprintAuthority.registryManifestSha256,
      status: 'historical_evidence_only'
    },
    projectionPolicy: {
      partCodes: 'derived_and_validated_from_book_and_part_registries',
      canonicalNodeCount: 'derived_and_validated_from-blueprint-and-book-w1d-canonical-successor',
      bookMetadata: 'not_authoritative',
      publicationOwnership: 'not_inferred_from_node_code'
    },
    architectureProjection: 'five-volume-15-part',
    boundaries: { publicProjectionActivated: false, productionAuthorityCreated: false }
  };
}

function buildFreeze(registry) {
  return {
    contract: 'PHI-OS-KNOWLEDGE-BLUEPRINT-FREEZE-v2.0.0',
    contractVersion: 'PHI-OS-BOOK-W1D-KNOWLEDGE-BLUEPRINT-FREEZE-v1.0.0',
    status: 'frozen-book-w1d-human-approved-successor',
    registryManifestPath: ACTIVE_BLUEPRINT_REGISTRY_PATH,
    registryManifestSHA: objectSha(registry),
    migrationRecord: [W1D_ACTIVE_RECONCILIATION_PATH, W1D_ACCEPTANCE_PATH],
    supersedes: { path: HISTORICAL_BLUEPRINT_FREEZE_PATH, historicalAuthorityMutationAllowed: false },
    humanAcceptance: { path: W1D_ACCEPTANCE_PATH, actor: 'TL', decision: 'ACCEPT' },
    bookFreeze: registry.books.map(entry => ({
      bookCode: entry.bookCode,
      blueprintPath: entry.blueprintPath,
      blueprintSHA: entry.sha256,
      schemaVersion: entry.schemaVersion,
      contractVersion: entry.contract,
      status: entry.status
    })),
    updatePolicy: {
      automaticCheckerUpdateAllowed: false,
      explicitCommandRequired: 'BOOK-W1D-HUMAN-ACCEPTANCE',
      independentBookDigestRequired: true
    }
  };
}

function buildAuthorityContract(oldRaw, oldContract) {
  return {
    ...oldContract,
    contract: 'PHI-OS-KNOWLEDGE-REGISTRY-AUTHORITY-v3.0.0',
    schemaVersion: 'PHI-OS-KNOWLEDGE-REGISTRY-AUTHORITY-v3.0.0',
    contractVersion: '3.0.0',
    stage: 'BOOK-W1D',
    status: 'human-approved-active-successor',
    baseline: { repository: 'getphioscs-UX/phios', branch: 'main', commit: '1cbc50f7590759774944a577d3082c13ef59c40b' },
    supersedes: {
      path: 'content/knowledge/contracts/knowledge-registry-authority-v2.json',
      sha256: sha256(oldRaw),
      contract: oldContract.contract,
      historicalAuthorityMutationAllowed: false
    },
    migrationRecord: [W1D_CANDIDATE_PATH, W1D_ACCEPTANCE_PATH],
    sourceOutlineAuthority: W1B_SOURCE_AUTHORITY_PATH,
    authorities: {
      ...oldContract.authorities,
      canonicalKnowledge: {
        ...oldContract.authorities.canonicalKnowledge,
        path: W1D_SUCCESSOR_NODE_PATH
      }
    },
    projectionRules: {
      ...oldContract.projectionRules,
      canonicalAdmissionRequiresBookW1DHumanAcceptance: true,
      supersededIdentityRequiresLineageAndCompatibility: true,
      deferredCandidateMayEnterCanonicalAuthority: false,
      publicProjectionRequiresIndependentBookW1EAcceptance: true
    },
    humanAcceptance: { path: W1D_ACCEPTANCE_PATH, actor: 'TL', decision: 'ACCEPT' }
  };
}

function buildAcceptance(candidate, publication, successorRegistry, activeBlueprintRegistry) {
  return {
    schemaVersion: 'PHI-OS-BOOK-W1D-HUMAN-ACCEPTANCE-v1.0.0',
    phase: 'BOOK-W1', step: 'BOOK-W1D', status: 'HUMAN_APPROVED',
    recordedAt: '2026-08-14', humanActor: 'TL', decision: 'ACCEPT',
    acceptanceStatement: W1D_STATEMENT,
    overrides: [],
    reviewedArtifacts: [
      { path: W1D_CANDIDATE_PATH, sha256: objectSha(candidate) },
      { path: W1D_PUBLICATION_CANDIDATE_PATH, sha256: objectSha(publication) }
    ],
    acceptedScope: {
      existingIdentityReconciliationCount: 718,
      promoteAdmissionCount: 192,
      supersedeAdmissionCount: 21,
      canonicalAdmissionCount: 213,
      publicationOwnershipRecordCount: 473,
      rehomeApplications: [
        { canonicalNodeCode: 'KN-B2-P7-052', targetPartCode: 'P11', decision: 'APPLY' },
        { canonicalNodeCode: 'KN-B2-P7-057', targetPartCode: 'P10', decision: 'APPLY' }
      ]
    },
    acceptanceChecks: {
      existing716CanonicalNodeAuthorityAccountedFor: 716,
      postBaselineKauR5AdmissionsAccountedFor: 2,
      all718ExistingIdentityRecordsAccepted: true,
      silentDeletionCount: 0,
      ungovernedNodeCodeMutationCount: 0,
      duplicateActiveIdentityCount: 0,
      orphanMigrationEntryCount: 0,
      allOwnershipChangesTraceable: true,
      supersedeLineageRecordCount: 21,
      supersedeCompatibilityStrategyCount: 21
    },
    activatedSuccessors: {
      canonicalRegistryPath: W1D_SUCCESSOR_NODE_PATH,
      canonicalRegistrySha256: objectSha(successorRegistry),
      canonicalRegistryRecordCount: 931,
      activeBlueprintRegistryPath: ACTIVE_BLUEPRINT_REGISTRY_PATH,
      activeBlueprintRegistrySha256: objectSha(activeBlueprintRegistry),
      activeBlueprintNodeCount: 931,
      authorityContractPath: W1D_SUCCESSOR_AUTHORITY_PATH,
      freezePath: W1D_SUCCESSOR_FREEZE_PATH
    },
    activation: {
      canonicalRegistrySuccessorActive: true,
      publicationOwnershipApplied: true,
      rehomeApplicationsApplied: true,
      activeBlueprintRegistrySuccessorActive: true,
      bookW1EHumanAcceptanceRecorded: false,
      publicProjectionMutationAllowed: false,
      productionAuthorityCreated: false
    }
  };
}

function buildActiveLedgers(candidate, publication, acceptance, successorRegistry, activeBlueprintRegistry) {
  const acceptanceRef = { path: W1D_ACCEPTANCE_PATH, sha256: objectSha(acceptance), actor: 'TL', decision: 'ACCEPT' };
  const reconciliation = {
    schemaVersion: 'PHI-OS-BOOK-W1D-CANONICAL-REGISTRY-RECONCILIATION-ACTIVE-v1.0.0',
    phase: 'BOOK-W1', step: 'BOOK-W1D', status: 'HUMAN_APPROVED_ACTIVE_SUCCESSOR', recordedAt: '2026-08-14',
    supersedes: { path: W1D_CANDIDATE_PATH, sha256: objectSha(candidate), historicalCandidateMutationAllowed: false },
    humanAcceptance: acceptanceRef,
    sourceAuthority: candidate.sourceAuthority,
    accounting: {
      existingIdentityRecordCount: 718,
      canonicalAdmissionCount: 213,
      promoteAdmissionCount: 192,
      supersedeAdmissionCount: 21,
      acceptedLinkRelationshipCount: 66,
      preservedDeferredCandidateCount: 44,
      successorCanonicalRegistryRecordCount: 931,
      silentDeletionCount: 0,
      ungovernedNodeCodeMutationCount: 0,
      duplicateActiveIdentityCount: 0,
      orphanMigrationEntryCount: 0
    },
    successorAuthority: {
      canonicalRegistryPath: W1D_SUCCESSOR_NODE_PATH,
      canonicalRegistrySha256: objectSha(successorRegistry),
      activeBlueprintRegistryPath: ACTIVE_BLUEPRINT_REGISTRY_PATH,
      activeBlueprintRegistrySha256: objectSha(activeBlueprintRegistry)
    },
    existingIdentityDecisions: candidate.entries.map(entry => ({
      ...entry,
      humanDecision: 'ACCEPT_RECONCILIATION',
      humanAcceptancePath: W1D_ACCEPTANCE_PATH,
      applicationStatus: 'applied-in-book-w1d-successor'
    })),
    canonicalAdmissionDecisions: candidate.admissionCandidates.map(entry => ({
      ...entry,
      canonicalNodeApproved: true,
      canonicalIdentityChanged: entry.proposedAction === 'supersede',
      w1dHumanDecision: 'ACCEPT_ADMISSION',
      humanAcceptancePath: W1D_ACCEPTANCE_PATH,
      successorNodeCode: entry.proposedCanonicalNodeCode,
      legacyNodeCode: entry.proposedAction === 'supersede' ? entry.targetExistingNodeCode : null,
      compatibilityStrategy: entry.lineageCandidate.compatibilityStrategy,
      applicationStatus: 'applied-in-book-w1d-successor'
    })),
    acceptedLinkRelationships: candidate.acceptedLinkRelationships.map(entry => ({
      ...entry, applicationStatus: 'applied-in-book-w1d-successor'
    })),
    deferredAdmissionCandidates: candidate.deferredAdmissionCandidates
  };
  const ownership = {
    schemaVersion: 'PHI-OS-BOOK-W1D-PUBLICATION-OWNERSHIP-MIGRATION-ACTIVE-v1.0.0',
    phase: 'BOOK-W1', step: 'BOOK-W1D', status: 'HUMAN_APPROVED_APPLIED', recordedAt: '2026-08-14',
    supersedes: { path: W1D_PUBLICATION_CANDIDATE_PATH, sha256: objectSha(publication), historicalCandidateMutationAllowed: false },
    humanAcceptance: acceptanceRef,
    recordCount: 473,
    w1bMapRecordCount: 471,
    rehomeAppliedRecordCount: 2,
    identityMutationCount: 0,
    untraceableRecordCount: 0,
    records: publication.records.map(record => ({
      ...record,
      humanAcceptance: { status: 'HUMAN_APPROVED_BOOK_W1D', authority: W1D_ACCEPTANCE_PATH },
      physicalMoveDecision: record.oldPartCode ? 'APPLY' : null,
      applicationStatus: 'applied-in-book-w1d-successor'
    }))
  };
  return { reconciliation, ownership };
}

function buildMigrationContract(current, acceptance, activeLedgers) {
  const next = clone(current);
  next.implementationSteps = next.implementationSteps.map(record => record.step === 'BOOK-W1D'
    ? { ...record, status: 'accepted' }
    : record.step === 'BOOK-W1E' ? { ...record, status: 'in_progress' } : record);
  next.progress = {
    ...next.progress,
    currentStep: 'BOOK-W1E',
    status: 'w1d-human-approved-w1e-human-review-ready',
    approvedNewCanonicalNodeCandidateCount: 213,
    activeCanonicalNodeRecordCount: 931,
    nextPermittedStep: 'BOOK-W1E-HUMAN-PUBLIC-PROJECTION-ACCEPTANCE'
  };
  next.w1dCandidatePreparation = {
    ...next.w1dCandidatePreparation,
    status: 'human-approved-active-successor',
    activeReconciliationPath: W1D_ACTIVE_RECONCILIATION_PATH,
    activePublicationOwnershipPath: W1D_ACTIVE_PUBLICATION_PATH,
    successorCanonicalRegistryPath: W1D_SUCCESSOR_NODE_PATH,
    successorBlueprintRegistryPath: ACTIVE_BLUEPRINT_REGISTRY_PATH,
    w1dHumanAcceptanceSatisfied: true,
    w1dCanonicalAdmissionDecisionCount: 213,
    appliedPublicationOwnershipRecordCount: 473,
    appliedRehomeRecordCount: 2,
    successorCanonicalNodeRecordCount: 931,
    activeCanonicalRegistryMutated: true,
    nextPermittedGate: 'BOOK-W1E-HUMAN-PUBLIC-PROJECTION-ACCEPTANCE'
  };
  next.w1eCandidatePreparation = {
    ...next.w1eCandidatePreparation,
    status: 'generated-ready-for-human-review-not-active',
    w1dActiveReconciliationSatisfied: true,
    activePublicProjectionMutated: false,
    nextPermittedGate: 'BOOK-W1E-HUMAN-PUBLIC-PROJECTION-ACCEPTANCE'
  };
  next.w1dAcceptance = {
    path: W1D_ACCEPTANCE_PATH,
    sha256: objectSha(acceptance),
    activeReconciliationSha256: objectSha(activeLedgers.reconciliation),
    activePublicationOwnershipSha256: objectSha(activeLedgers.ownership)
  };
  return next;
}

export async function buildBookW1DActivation(root = process.cwd()) {
  const [
    baselineRaw, candidate, publication, admissionLedger, w1cAcceptance, w1cFinalAcceptance,
    book1Raw, historicalFreeze, r5, oldAuthorityRaw, migrationContract, ...candidateBlueprints
  ] = await Promise.all([
    read(root, HISTORICAL_NODE_PATH), readJson(root, W1D_CANDIDATE_PATH),
    readJson(root, W1D_PUBLICATION_CANDIDATE_PATH), readJson(root, W1C_LEDGER_PATH),
    readJson(root, W1C_ACCEPTANCE_PATH), readJson(root, W1C_FINAL_ACCEPTANCE_PATH),
    read(root, 'content/knowledge/blueprints/book-1-knowledge-blueprint.json'),
    readJson(root, HISTORICAL_BLUEPRINT_FREEZE_PATH),
    readJson(root, 'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'),
    read(root, 'content/knowledge/contracts/knowledge-registry-authority-v2.json'),
    readJson(root, MIGRATION_CONTRACT_PATH),
    ...BOOK_SPECS.map(spec => readJson(root, candidatePath(spec)))
  ]);
  const baseline = JSON.parse(baselineRaw);
  const book1 = JSON.parse(book1Raw);
  const oldAuthority = JSON.parse(oldAuthorityRaw);
  assert.equal(sha256(baselineRaw), r5.canonicalAuthority.successorSha256);
  assert.equal(candidate.entries.length, 718);
  assert.equal(candidate.admissionCandidates.length, 213);
  assert.equal(candidate.acceptedLinkRelationships.length, 66);
  assert.equal(candidate.deferredAdmissionCandidates.length, 44);
  assert.equal(publication.records.length, 473);
  assert.equal(w1cAcceptance.status, 'HUMAN_APPROVED');
  assert.equal(w1cFinalAcceptance.status, 'HUMAN_REVIEW_COMPLETE');
  const candidates = new Map(candidateBlueprints.map(value => [value.bookCode, value]));
  const successorRegistry = applyCanonicalSuccessor(baseline, candidate, publication, admissionLedger);
  const blueprints = buildBlueprintSuccessors(successorRegistry, candidates);
  const activeBlueprintRegistry = buildActiveBlueprintRegistry(book1Raw, book1, blueprints, historicalFreeze, r5);
  assert.equal(activeBlueprintRegistry.totals.canonicalNodes, 931);
  const freeze = buildFreeze(activeBlueprintRegistry);
  const authorityContract = buildAuthorityContract(oldAuthorityRaw, oldAuthority);
  const acceptance = buildAcceptance(candidate, publication, successorRegistry, activeBlueprintRegistry);
  const activeLedgers = buildActiveLedgers(candidate, publication, acceptance, successorRegistry, activeBlueprintRegistry);
  const contract = buildMigrationContract(migrationContract, acceptance, activeLedgers);
  return {
    successorRegistry, blueprints, activeBlueprintRegistry, freeze,
    authorityContract, acceptance, ...activeLedgers, contract
  };
}

async function writeJson(root, relative, value) {
  const absolute = path.join(root, relative);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, objectText(value), 'utf8');
}

export async function writeBookW1DActivation(root = process.cwd()) {
  const built = await buildBookW1DActivation(root);
  await writeJson(root, W1D_SUCCESSOR_NODE_PATH, built.successorRegistry);
  for (const spec of BOOK_SPECS) await writeJson(root, blueprintPath(spec), built.blueprints.get(spec.bookCode));
  await writeJson(root, ACTIVE_BLUEPRINT_REGISTRY_PATH, built.activeBlueprintRegistry);
  await writeJson(root, W1D_SUCCESSOR_FREEZE_PATH, built.freeze);
  await writeJson(root, W1D_SUCCESSOR_AUTHORITY_PATH, built.authorityContract);
  await writeJson(root, W1D_ACCEPTANCE_PATH, built.acceptance);
  await writeJson(root, W1D_ACTIVE_RECONCILIATION_PATH, built.reconciliation);
  await writeJson(root, W1D_ACTIVE_PUBLICATION_PATH, built.ownership);
  await writeJson(root, MIGRATION_CONTRACT_PATH, built.contract);
  return built;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  assert.equal(process.argv[2], '--write', 'Use --write to apply the explicit BOOK-W1D Human Acceptance.');
  const built = await writeBookW1DActivation();
  console.log(`Applied BOOK-W1D Human Acceptance: ${built.successorRegistry.nodes.length} Canonical records, 213 admissions, 473 ownership records and 2 rehomes.`);
  console.log('BOOK-W1E is ready for independent Human Review; Public Production remains unchanged.');
}
