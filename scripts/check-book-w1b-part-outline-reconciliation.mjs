import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ACCEPTANCE_PATH,
  buildBookW1BHumanAcceptance,
  buildBookW1BOutlineMigrationMaps,
  buildBookW1BReviewSummary,
  MIGRATION_FILES,
  REVIEW_SUMMARY_PATH,
  SOURCE_AUTHORITY_PATH
} from './build-book-w1b-outline-migration-drafts.mjs';
import { AUTHORIZED_SOURCE_SHA256 } from './import-book-w1b-source-outline-authority.mjs';

const root = process.cwd();
const read = relativePath => fs.readFile(path.join(root, relativePath), 'utf8');
const readJson = async relativePath => JSON.parse(await read(relativePath));
const digest = value => crypto.createHash('sha256')
  .update(value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');

const R5_FREEZE_PATH = 'content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json';
const RECOMMENDATION_ACTIONS = new Set(['match', 'rename', 'move', 'supersede']);

const [
  nodesRaw, blueprintRegistryRaw, contract, sourceAuthority, packageJson,
  audit, r5Freeze, expectedMaps
] = await Promise.all([
  read('content/knowledge/registry/nodes.json'),
  read('content/knowledge/blueprints/blueprint-registry.json'),
  readJson('content/knowledge/migrations/five-volume-migration-contract-v1.json'),
  readJson(SOURCE_AUTHORITY_PATH), readJson('package.json'), read(REVIEW_SUMMARY_PATH),
  readJson(R5_FREEZE_PATH), buildBookW1BOutlineMigrationMaps(root)
]);

assert.equal(r5Freeze.status, 'FROZEN_SUCCESSOR_CANONICAL_AUTHORITY');
assert.equal(digest(nodesRaw), r5Freeze.canonicalAuthority.successorSha256,
  'BOOK-W1B must preserve the exact KAU-R5 Canonical successor.');
assert.equal(digest(blueprintRegistryRaw), r5Freeze.blueprintAuthority.registryManifestSha256,
  'BOOK-W1B must preserve the exact KAU-R5 Blueprint Registry.');

assert.equal(sourceAuthority.source.originalSha256, AUTHORIZED_SOURCE_SHA256);
assert.equal(sourceAuthority.status, 'TL_AUTHORIZED_SOURCE_AUTHORITY_REVIEW_CANDIDATES_ONLY');
assert.equal(sourceAuthority.humanAuthorization.sourceOutlineAuthorityAuthorized, true);
assert.equal(sourceAuthority.humanAuthorization.migrationMapCandidateRebuildAuthorized, true);
assert.equal(sourceAuthority.humanAuthorization.w1bAccepted, false);
assert.equal(sourceAuthority.humanAuthorization.w1cAccepted, false);
assert.equal(sourceAuthority.humanAuthorization.w1dAccepted, false);
assert.equal(sourceAuthority.inventory.partCount, 8);
assert.equal(sourceAuthority.inventory.mainChapterCount, 621);
assert.equal(sourceAuthority.normalizationRecord.sourceMainChapterOccurrenceCount, 708);
assert.equal(sourceAuthority.normalizationRecord.duplicateOccurrenceCount, 87);
assert.equal(sourceAuthority.normalizationRecord.duplicateCoreMismatchCount, 0);
assert.equal(sourceAuthority.normalizationRecord.duplicateScope, 'P13 13.1-13.87 second exact-repeat sequence');
assert.equal(sourceAuthority.boundaries.outlineChapterIsCanonicalNode, false);

const expectedChapterCounts = [64, 43, 81, 77, 84, 87, 79, 106];
assert.deepEqual(sourceAuthority.parts.map(part => part.partCode),
  ['P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15']);
assert.deepEqual(sourceAuthority.parts.map(part => part.mainChapterCount), expectedChapterCounts);
for (const part of sourceAuthority.parts) {
  assert.equal(new Set(part.chapters.map(chapter => chapter.chapterCode)).size, part.mainChapterCount);
  assert(part.chapters.every(chapter => chapter.sourceTitle && chapter.chapterCoreSha256));
  assert(part.chapters.every(chapter => chapter.sourceOccurrences.length === (part.partCode === 'P13' ? 2 : 1)));
}

const nodes = JSON.parse(nodesRaw);
const actualMaps = [];
for (const [partCode, fileName] of MIGRATION_FILES) {
  const actual = await readJson(`content/knowledge/migrations/${fileName}`);
  assert.deepEqual(actual, expectedMaps.get(fileName), `${partCode} migration map must rebuild deterministically.`);
  actualMaps.push(actual);
}

assert.equal(actualMaps.length, 8);
assert.deepEqual(actualMaps.map(map => map.partAuthority.newPublicationBookCode),
  ['BOOK-3', 'BOOK-3', 'BOOK-4', 'BOOK-4', 'BOOK-4', 'BOOK-5', 'BOOK-5', 'BOOK-5']);
assert(actualMaps.every(map => map.status === 'HUMAN_APPROVED_BOOK_W1B_MIGRATION_MAP'));
assert(actualMaps.every(map => map.sourceOutlineAuthority.path === SOURCE_AUTHORITY_PATH));
assert(actualMaps.every(map => map.sourceOutlineAuthority.fullChapterListIncluded));
assert(actualMaps.every(map => map.sourceOutlineAuthority.humanReviewEligible));
assert(actualMaps.every(map => map.sourceOutlineAuthority.bookW1BAcceptanceRecorded));
assert(actualMaps.every(map => map.sourceOutlineAuthority.canonicalAcceptanceEligible));
assert(actualMaps.every(map => !map.blocker.w1bAcceptanceBlocked));
assert(actualMaps.every(map => map.blocker.w1cSuccessorBlueprintGenerationAllowed));

assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.existingCanonicalNodeCount, 0), 471);
assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.upgradedOutlineChapterCount, 0), 621);
assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.outlineChapterMinusExistingNodeCount, 0), 150);
assert.equal(actualMaps.reduce((sum, map) => sum + map.inventory.approvedNewCanonicalNodeCandidateCount, 0), 0);

const entries = actualMaps.flatMap(map => map.entries);
const governedNodes = nodes.nodes.filter(node => /^P(?:8|9|1[0-5])$/.test(node.partCode ?? ''));
assert.equal(entries.length, 471);
assert.equal(new Set(entries.map(entry => entry.oldNodeCode)).size, 471);
assert.deepEqual(entries.map(entry => entry.oldNodeCode).sort(), governedNodes.map(node => node.nodeCode).sort());
for (const entry of entries) {
  assert.equal(entry.action, 'move');
  assert.equal(entry.actionScope, 'publication-ownership-only');
  assert.equal(entry.canonicalIdentityChanged, false);
  assert.equal(entry.publicationOwnershipChanged, true);
  assert.equal(entry.outlineMatchStatus, 'human-approved-book-w1b-primary-recommendation');
  assert.deepEqual(entry.successorNodeCodes, []);
  const recommendation = entry.outlineReconciliationRecommendation;
  assert(RECOMMENDATION_ACTIONS.has(recommendation.action));
  assert.equal(recommendation.candidateOnly, false);
  assert.equal(recommendation.humanDecisionRequired, false);
  assert.equal(recommendation.humanDecision, 'ACCEPT');
  assert.equal(recommendation.humanDecisionAuthority, 'TL');
}

const outlineCandidates = actualMaps.flatMap(map => map.outlineCandidates);
assert.equal(outlineCandidates.length, 621);
assert.equal(new Set(outlineCandidates.map(candidate => candidate.outlineChapterCode)).size, 621);
assert(outlineCandidates.every(candidate => !candidate.canonicalNodeApproved));
assert(outlineCandidates.every(candidate => !candidate.humanDecisionRequired));
assert(outlineCandidates.filter(candidate => candidate.recommendedAction === 'new candidate')
  .every(candidate => candidate.candidateOnly && candidate.humanDecision === 'ACCEPT_AS_CANDIDATE_ONLY'));
assert(outlineCandidates.filter(candidate => candidate.recommendedAction !== 'new candidate')
  .every(candidate => !candidate.candidateOnly && candidate.humanDecision === 'ACCEPT'));
assert(actualMaps.flatMap(map => map.splitCandidates)
  .every(candidate => candidate.status === 'NON_DISPOSITIVE_REVIEW_EVIDENCE'));
assert(actualMaps.flatMap(map => map.mergeCandidates)
  .every(candidate => candidate.status === 'NON_DISPOSITIVE_REVIEW_EVIDENCE'));
assert(actualMaps.every(map => map.decisionSummary.acceptedPrimaryRecommendationCount === map.entries.length));
assert(actualMaps.every(map => map.decisionSummary.approvedCanonicalNodeCount === 0));

const acceptance = await readJson(ACCEPTANCE_PATH);
assert.deepEqual(acceptance, buildBookW1BHumanAcceptance(expectedMaps));
assert.equal(acceptance.status, 'HUMAN_APPROVED');
assert.equal(acceptance.sourceAuthorityGate.complete, true);
assert.equal(acceptance.sourceAuthorityGate.completePartCount, 8);
assert.deepEqual(acceptance.sourceAuthorityGate.missingCompleteOutlineAuthorities, []);
assert.equal(acceptance.decision, 'ACCEPT');
assert.equal(acceptance.humanActor, 'TL');
assert(acceptance.partDecisions.every(part => part.decision === 'ACCEPT'));
assert(acceptance.partDecisions.every(part => part.acceptedRecommendationOverrides.length === 0));
assert.equal(acceptance.dispositionPolicy.splitAndMerge, 'NON_DISPOSITIVE_REVIEW_EVIDENCE');
assert.equal(acceptance.dispositionPolicy.newCandidates, 'HUMAN_APPROVED_AS_CANDIDATE_ONLY');
assert.equal(acceptance.dispositionPolicy.approvedCanonicalNodeCount, 0);
assert.equal(acceptance.boundaries.sourceAuthorityAuthorizationIsW1BAcceptance, false);

assert.equal(audit, buildBookW1BReviewSummary(expectedMaps, sourceAuthority));
assert(audit.includes('At the BOOK-W1B acceptance checkpoint'));
assert(audit.includes('621 outline chapters ≠ 621 Canonical Nodes'));
assert(audit.includes('exact repeated P13 13.1–13.87 sequence'));
assert(audit.includes('## P8｜'));
assert(audit.includes('## P15｜'));

assert.equal(contract.implementationSteps[0].status, 'accepted');
assert.equal(contract.implementationSteps[1].status, 'accepted');
assert.equal(contract.implementationSteps[2].status, 'accepted');
assert.equal(contract.implementationSteps[3].status, 'in_progress');
assert(contract.implementationSteps.slice(4).every(step => step.status === 'pending'));
assert.equal(contract.progress.currentStep, 'BOOK-W1D');
assert.equal(contract.progress.status, 'w1c-human-approved-w1d-human-review-ready');
assert.deepEqual(contract.progress.fullChapterInventoryAvailableForParts,
  ['P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15']);
assert.deepEqual(contract.progress.fullChapterInventoryMissingForParts, []);
assert.equal(contract.progress.approvedNewCanonicalNodeCandidateCount, 0);
assert.equal(contract.progress.w1bHumanAcceptanceSatisfied, true);
assert.equal(contract.progress.nextPermittedStep, 'BOOK-W1D-HUMAN-CANONICAL-RECONCILIATION-ACCEPTANCE');
assert.equal(contract.boundaries.canonicalNodeRegistryMutationAllowedInW1B, false);
assert.equal(contract.boundaries.successorBlueprintGenerationAllowedBeforeW1BAcceptance, false);

assert.equal(packageJson.scripts['check:book-w1-outline'],
  'npm run check:book-w1a && node scripts/check-book-w1b-part-outline-reconciliation.mjs');
assert.equal(packageJson.scripts['check:book-w1b'], 'npm run check:book-w1-outline');
assert.equal((packageJson.scripts.precheck.match(/npm run check:book-w1-outline/g) ?? []).length, 1);

const recommendationTotals = actualMaps.reduce((totals, map) => {
  for (const key of ['match', 'rename', 'move', 'supersede', 'splitCandidateReview', 'mergeCandidateReview', 'newCandidate']) {
    totals[key] += map.decisionSummary[key];
  }
  return totals;
}, { match: 0, rename: 0, move: 0, supersede: 0, splitCandidateReview: 0, mergeCandidateReview: 0, newCandidate: 0 });

console.log('✓ BOOK-W1B Human-approved complete-source migration maps passed.');
console.log(`  TL-authorized source ${AUTHORIZED_SOURCE_SHA256} yields 621 unique chapters after governed exact-repeat P13 normalization.`);
console.log('  Eight deterministic maps account for all 471 existing P8-P15 frozen Canonical Nodes and all 621 outline chapters.');
console.log(`  Review suggestions: ${recommendationTotals.match} match, ${recommendationTotals.rename} rename, ${recommendationTotals.move} move, ${recommendationTotals.supersede} supersede, ${recommendationTotals.splitCandidateReview} split clusters, ${recommendationTotals.mergeCandidateReview} merge clusters, ${recommendationTotals.newCandidate} new candidates.`);
console.log('  W1B remains Human approved; W1C is now accepted and W1D Human Review is open; nodes.json remains byte-identical to KAU-R5.');
