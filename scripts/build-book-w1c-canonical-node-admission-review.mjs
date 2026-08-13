import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreNodeOutlineSemantics } from './build-book-w1b-outline-migration-drafts.mjs';

export const ADMISSION_ROOT = 'content/knowledge/blueprints/successors/book-w1c';
export const ADMISSION_AUTHORIZATION_PATH =
  `${ADMISSION_ROOT}/canonical-node-admission-review-authorization-v1.json`;
export const ADMISSION_LEDGER_PATH =
  `${ADMISSION_ROOT}/canonical-node-admission-review-candidates-v1.json`;
export const ADMISSION_AUDIT_PATH =
  'docs/audits/BOOK-W1C-canonical-node-admission-review.md';

const W1B_ACCEPTANCE_PATH =
  'content/knowledge/migrations/book-w1b/book-w1b-human-acceptance-v1.json';
const MAP_PATHS = [
  'content/knowledge/migrations/p8-runtime-maintenance-outline-migration-v1.json',
  'content/knowledge/migrations/p9-coordination-runtime-outline-migration-v1.json',
  'content/knowledge/migrations/p10-runtime-expansion-outline-migration-v1.json',
  'content/knowledge/migrations/p11-civilization-runtime-outline-migration-v1.json',
  'content/knowledge/migrations/p12-civilization-atlas-outline-migration-v1.json',
  'content/knowledge/migrations/p13-reading-science-outline-migration-v1.json',
  'content/knowledge/migrations/p14-navigation-science-outline-migration-v1.json',
  'content/knowledge/migrations/p15-reality-continuation-outline-migration-v1.json'
];

const TARGET_BOOK = {
  P8: 'BOOK-3', P9: 'BOOK-3',
  P10: 'BOOK-4', P11: 'BOOK-4', P12: 'BOOK-4',
  P13: 'BOOK-5', P14: 'BOOK-5', P15: 'BOOK-5'
};

const TARGET_BOOK_PREFIX = { 'BOOK-3': 'B3', 'BOOK-4': 'B4', 'BOOK-5': 'B5' };
const AUTHORIZATION_STATEMENT =
  '我以 TL 身份授权 BOOK-W1C 将全部 323 个 unmatched outline chapters 作为 Canonical Node admission candidates 进行逐项审核；允许提出 promote、link to existing、supersede 或 defer 建议，但暂不自动创建 Canonical Node，也不代表 W1C 或 W1D acceptance。';

const read = (root, relative) => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async (root, relative) => JSON.parse(await read(root, relative));
const objectText = value => `${JSON.stringify(value, null, 2)}\n`;
const sha256 = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
const objectSha256 = value => sha256(objectText(value));
const chapterNumber = code => Number(code.split('.')[1]);
const nodeSuffix = nodeCode => Number(nodeCode.match(/-(\d+)$/)?.[1] ?? 0);
const confidence = score => score >= 0.9 ? 'HIGH' : score >= 0.82 ? 'MEDIUM' : 'REVIEW';

const mapCandidate = (node, score, migrationEntry) => ({
  nodeCode: node.nodeCode,
  partCode: node.partCode,
  titleZhHans: node.titleZhHans,
  titleEn: node.titleEn,
  semanticScore: score,
  w1bPrimaryAction: migrationEntry?.outlineReconciliationRecommendation?.action ?? null,
  w1bDecisionStatus: migrationEntry?.outlineMatchStatus ?? null
});

function determineRecommendation(samePartCandidates) {
  const sameFirst = samePartCandidates[0] ?? null;
  const sameSecond = samePartCandidates[1] ?? null;

  if (sameFirst?.semanticScore >= 0.82) {
    if (sameSecond?.semanticScore >= 0.82
      && sameFirst.semanticScore - sameSecond.semanticScore <= 0.05) {
      return {
        action: 'defer', reasonCode: 'AMBIGUOUS_SAME_PART_EXISTING_NODE_COVERAGE',
        relationshipScope: 'same-part', primary: sameFirst
      };
    }
    if (sameFirst.semanticScore >= 0.82 && sameFirst.w1bPrimaryAction === 'supersede') {
      return {
        action: 'supersede', reasonCode: 'STRONG_UNAMBIGUOUS_SUPERSEDED_LINEAGE_CANDIDATE',
        relationshipScope: 'same-part', primary: sameFirst
      };
    }
    return {
      action: 'link to existing', reasonCode: 'EXISTING_NODE_SEMANTIC_COVERAGE',
      relationshipScope: 'same-part', primary: sameFirst
    };
  }

  return {
    action: 'promote', reasonCode: 'DISTINCT_OUTLINE_AUTHORITY_WITHOUT_GOVERNED_EXISTING_COVERAGE',
    relationshipScope: null, primary: sameFirst
  };
}

export function buildBookW1CAdmissionAuthorization() {
  return {
    schemaVersion: 'PHI-OS-BOOK-W1C-CANONICAL-NODE-ADMISSION-REVIEW-AUTHORIZATION-v1.0.0',
    phase: 'BOOK-W1', step: 'BOOK-W1C-CANONICAL-ADMISSION-REVIEW',
    status: 'HUMAN_REVIEW_AUTHORIZED_NOT_ACCEPTED',
    recordedAt: '2026-08-13', humanActor: 'TL', decision: 'AUTHORIZE_REVIEW',
    authorizationStatement: AUTHORIZATION_STATEMENT,
    scope: {
      sourceCandidateCount: 323,
      partCodes: ['P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15'],
      allowedRecommendations: ['promote', 'link to existing', 'supersede', 'defer']
    },
    boundaries: {
      canonicalNodeCreatedByAuthorization: false,
      provisionalNodeCodeCreatesIdentity: false,
      bookW1CAccepted: false,
      bookW1DAccepted: false,
      nodesJsonMutationAllowed: false,
      activeBlueprintRegistryMutationAllowed: false,
      systemMaySelfAcceptRecommendation: false
    }
  };
}

export async function buildBookW1CCanonicalAdmissionReview(root = process.cwd()) {
  const [nodesRaw, activeBlueprintRegistryRaw, w1bAcceptance, ...maps] = await Promise.all([
    read(root, 'content/knowledge/registry/nodes.json'),
    read(root, 'content/knowledge/blueprints/blueprint-registry.json'),
    readJson(root, W1B_ACCEPTANCE_PATH),
    ...MAP_PATHS.map(relative => readJson(root, relative))
  ]);
  assert.equal(w1bAcceptance.status, 'HUMAN_APPROVED');
  assert.equal(w1bAcceptance.decision, 'ACCEPT');
  assert.equal(w1bAcceptance.dispositionPolicy.newCandidates,
    'HUMAN_APPROVED_AS_CANDIDATE_ONLY');

  const allNodes = JSON.parse(nodesRaw).nodes;
  const governedNodes = allNodes.filter(node => /^P(?:8|9|1[0-5])$/.test(node.partCode ?? ''));
  assert.equal(governedNodes.length, 471);
  const entryByNodeCode = new Map(maps.flatMap(migration =>
    migration.entries.map(entry => [entry.oldNodeCode, entry])));
  const candidateRows = maps.flatMap((migration, mapIndex) =>
    migration.outlineCandidates
      .map((candidate, outlineCandidateIndex) => ({
        candidate, migration, mapIndex, outlineCandidateIndex
      }))
      .filter(record => record.candidate.recommendedAction === 'new candidate'));
  assert.equal(candidateRows.length, 323);

  const maxSuffixByPart = Object.fromEntries(Object.keys(TARGET_BOOK).map(partCode => [
    partCode,
    Math.max(...allNodes.filter(node => node.partCode === partCode).map(node => nodeSuffix(node.nodeCode)))
  ]));
  const nextSuffixByPart = { ...maxSuffixByPart };
  const candidateOrdinalByPart = Object.fromEntries(Object.keys(TARGET_BOOK)
    .map(partCode => [partCode, 0]));

  const entries = candidateRows
    .sort((left, right) => Number(left.migration.partAuthority.partCode.slice(1))
      - Number(right.migration.partAuthority.partCode.slice(1))
      || chapterNumber(left.candidate.outlineChapterCode)
      - chapterNumber(right.candidate.outlineChapterCode))
    .map((record, index) => {
      const { candidate, migration, outlineCandidateIndex } = record;
      const partCode = migration.partAuthority.partCode;
      const scored = governedNodes.filter(node => node.partCode === partCode).map(node => mapCandidate(
        node,
        scoreNodeOutlineSemantics(node, {
          sourceTitle: candidate.sourceTitle,
          canonicalQuestion: candidate.canonicalQuestion
        }),
        entryByNodeCode.get(node.nodeCode)
      ));
      const samePartCandidates = scored.filter(item => item.semanticScore >= 0.65)
        .sort((left, right) => right.semanticScore - left.semanticScore
          || left.nodeCode.localeCompare(right.nodeCode)).slice(0, 5);
      const recommendation = determineRecommendation(samePartCandidates);
      const createsIdentityCandidate = ['promote', 'supersede'].includes(recommendation.action);
      const provisionalNodeCode = createsIdentityCandidate
        ? `KN-${TARGET_BOOK_PREFIX[TARGET_BOOK[partCode]]}-${partCode}-${String(++nextSuffixByPart[partCode]).padStart(3, '0')}`
        : null;
      return {
        admissionCandidateCode: `BOOK-W1C-CNA-${partCode}-${String(++candidateOrdinalByPart[partCode]).padStart(3, '0')}`,
        partCode,
        targetPublicationBookCode: TARGET_BOOK[partCode],
        outlineChapterCode: candidate.outlineChapterCode,
        sourceTitle: candidate.sourceTitle,
        canonicalQuestion: candidate.canonicalQuestion,
        candidateOnly: true,
        canonicalNodeApproved: false,
        canonicalIdentityChanged: false,
        provisionalNodeCode,
        provisionalNodeCodeStatus: provisionalNodeCode
          ? 'NON_ACTIVE_REVIEW_IDENTIFIER'
          : 'NOT_ASSIGNED_NO_NEW_IDENTITY_RECOMMENDED',
        recommendation: {
          action: recommendation.action,
          reasonCode: recommendation.reasonCode,
          confidence: recommendation.action === 'defer'
            ? 'HUMAN_DISAMBIGUATION_REQUIRED'
            : confidence(recommendation.primary?.semanticScore ?? 0),
          relationshipScope: recommendation.relationshipScope,
          targetExistingNodeCode: ['link to existing', 'supersede'].includes(recommendation.action)
            ? recommendation.primary?.nodeCode ?? null : null,
          proposedCanonicalIdentityChangedOnW1DAdmission:
            recommendation.action === 'supersede',
          humanDecisionRequired: true,
          humanDecision: null
        },
        lineageCandidate: recommendation.action === 'supersede' ? {
          legacyNodeCode: recommendation.primary.nodeCode,
          successorProvisionalNodeCode: provisionalNodeCode,
          compatibilityStrategy: 'preserve-legacy-nodeCode-and-resolve-to-human-approved-successor'
        } : null,
        existingNodeEvidence: {
          samePartCandidates,
          crossPartCandidates: [],
          crossPartDisposition: 'OUT_OF_SCOPE_FOR_PRIMARY_ADMISSION_RECOMMENDATION_REVIEW_IN_W1C'
        },
        sourceAuthority: {
          w1bMigrationMapPath: MAP_PATHS[record.mapIndex],
          outlineCandidateIndex,
          w1bDisposition: candidate.disposition,
          w1bHumanDecision: candidate.humanDecision,
          w1bAcceptancePath: W1B_ACCEPTANCE_PATH
        },
        gates: {
          w1cHumanAcceptanceRecorded: false,
          w1dCanonicalAdmissionDecisionRecorded: false,
          activeCanonicalAuthorityCreated: false
        }
      };
    });

  assert.equal(new Set(entries.map(entry => entry.admissionCandidateCode)).size, 323);
  assert.equal(new Set(entries.filter(entry => entry.provisionalNodeCode)
    .map(entry => entry.provisionalNodeCode)).size,
  entries.filter(entry => entry.provisionalNodeCode).length);
  assert(entries.filter(entry => entry.provisionalNodeCode)
    .every(entry => !allNodes.some(node => node.nodeCode === entry.provisionalNodeCode)));

  const actionCounts = action => entries.filter(entry =>
    entry.recommendation.action === action).length;
  const partSummary = Object.keys(TARGET_BOOK).map(partCode => {
    const partEntries = entries.filter(entry => entry.partCode === partCode);
    return {
      partCode,
      targetPublicationBookCode: TARGET_BOOK[partCode],
      candidateCount: partEntries.length,
      promote: partEntries.filter(entry => entry.recommendation.action === 'promote').length,
      linkToExisting: partEntries.filter(entry =>
        entry.recommendation.action === 'link to existing').length,
      supersede: partEntries.filter(entry => entry.recommendation.action === 'supersede').length,
      defer: partEntries.filter(entry => entry.recommendation.action === 'defer').length
    };
  });
  const authorization = buildBookW1CAdmissionAuthorization();
  const ledger = {
    schemaVersion: 'PHI-OS-BOOK-W1C-CANONICAL-NODE-ADMISSION-REVIEW-CANDIDATES-v1.0.0',
    phase: 'BOOK-W1', step: 'BOOK-W1C-CANONICAL-ADMISSION-REVIEW',
    status: 'HUMAN_REVIEW_CANDIDATES_NOT_ACCEPTED',
    generatedAt: '2026-08-13',
    authorization: {
      path: ADMISSION_AUTHORIZATION_PATH,
      sha256: objectSha256(authorization),
      status: authorization.status,
      humanActor: authorization.humanActor
    },
    frozenAuthoritySnapshots: {
      canonicalNodeRegistryPath: 'content/knowledge/registry/nodes.json',
      canonicalNodeRegistrySha256: sha256(nodesRaw),
      activeBlueprintRegistryPath: 'content/knowledge/blueprints/blueprint-registry.json',
      activeBlueprintRegistrySha256: sha256(activeBlueprintRegistryRaw),
      bothMutatedByReview: false
    },
    methodology: {
      eligibleSource: 'W1B outlineCandidates where recommendedAction == new candidate',
      semanticScoringAuthority: 'BOOK-W1B deterministic bilingual semantic score',
      promoteRule: 'no same-Part score >= 0.82; preserves outline importance rather than treating medium similarity as governed coverage',
      linkRule: 'unambiguous same-Part score >= 0.82',
      supersedeRule: 'unambiguous same-Part score >= 0.82 whose existing Node has Human-approved W1B supersede recommendation',
      deferRule: 'top two governed candidates both score >= 0.82 and differ by no more than 0.05',
      crossPartRelationshipReview: 'not determinative in W1C admission review; retained for later governed relationship reconciliation',
      recommendationsAreAdvisory: true
    },
    inventory: {
      candidateCount: entries.length,
      promote: actionCounts('promote'),
      linkToExisting: actionCounts('link to existing'),
      supersede: actionCounts('supersede'),
      defer: actionCounts('defer'),
      provisionalNodeCodeCount: entries.filter(entry => entry.provisionalNodeCode).length,
      approvedCanonicalNodeCount: 0,
      w1cHumanDecisionCount: 0,
      w1dCanonicalAdmissionDecisionCount: 0
    },
    partSummary,
    boundaries: authorization.boundaries,
    entries
  };
  return { authorization, ledger };
}

const escapeMarkdown = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function buildBookW1CAdmissionAudit(ledger) {
  const summaryRows = ledger.partSummary.map(record =>
    `| ${record.partCode} | ${record.targetPublicationBookCode} | ${record.candidateCount} | ${record.promote} | ${record.linkToExisting} | ${record.supersede} | ${record.defer} |`);
  const detailRows = ledger.entries.map(entry => {
    const target = entry.recommendation.targetExistingNodeCode
      ?? entry.provisionalNodeCode
      ?? (entry.existingNodeEvidence.samePartCandidates.slice(0, 2)
        .map(candidate => `${candidate.nodeCode} (${candidate.semanticScore})`).join('<br>') || '—');
    const score = entry.existingNodeEvidence.samePartCandidates[0]?.semanticScore
      ?? entry.existingNodeEvidence.crossPartCandidates[0]?.semanticScore ?? '—';
    return `| ${entry.admissionCandidateCode} | ${entry.outlineChapterCode} | ${escapeMarkdown(entry.sourceTitle)} | ${entry.recommendation.action} | ${target} | ${score} | Pending |`;
  });
  return [
    '# BOOK-W1C｜323 Canonical Node Admission Candidates — Human Review', '',
    '## Authority boundary', '',
    'TL authorized the review of all 323 unmatched outline chapters. This authorization permits deterministic `promote`, `link to existing`, `supersede` and `defer` recommendations only. It does not accept BOOK-W1C or BOOK-W1D, create Canonical Nodes, mutate `nodes.json`, or activate a Blueprint Registry successor.', '',
    'A provisional Node Code is a collision-checked review identifier only. It becomes no identity or authority unless a later explicit W1D Human admission decision is recorded.', '',
    '## Recommendation summary', '',
    '| Part | Target Book | Candidates | Promote | Link existing | Supersede | Defer |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...summaryRows, '',
    `Total: ${ledger.inventory.candidateCount}; promote ${ledger.inventory.promote}; link to existing ${ledger.inventory.linkToExisting}; supersede ${ledger.inventory.supersede}; defer ${ledger.inventory.defer}. Approved Canonical Nodes: 0.`, '',
    '## Decision meaning', '',
    '- `promote`: distinct admission candidate; provisional code reserved for review only.',
    '- `link to existing`: important chapter is retained through an existing Canonical Node relationship; no new identity is recommended.',
    '- `supersede`: a new provisional identity is recommended with explicit legacy lineage; W1D Human governance is mandatory.',
    '- `defer`: semantic evidence is ambiguous; TL disambiguation is required before any admission outcome.', '',
    '## All 323 review candidates', '',
    '| Candidate | Chapter | Title | Recommendation | Existing target / provisional code | Top score | Human decision |',
    '| --- | --- | --- | --- | --- | ---: | --- |',
    ...detailRows, ''
  ].join('\n');
}

async function writeArtifacts(root) {
  const { authorization, ledger } = await buildBookW1CCanonicalAdmissionReview(root);
  await fs.mkdir(path.join(root, ADMISSION_ROOT), { recursive: true });
  await fs.writeFile(path.join(root, ADMISSION_AUTHORIZATION_PATH), objectText(authorization), 'utf8');
  await fs.writeFile(path.join(root, ADMISSION_LEDGER_PATH), objectText(ledger), 'utf8');
  await fs.writeFile(path.join(root, ADMISSION_AUDIT_PATH), `${buildBookW1CAdmissionAudit(ledger)}\n`, 'utf8');
  console.log(`Generated ${ledger.inventory.candidateCount} BOOK-W1C Canonical admission review candidates; 0 Canonical Nodes approved.`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  assert.equal(process.argv[2], '--write', 'Use --write to materialize BOOK-W1C admission-review artifacts.');
  await writeArtifacts(process.cwd());
}
