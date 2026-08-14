import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  APS4_BASELINE,
  APS4_CONTRACT,
  APS_L10N_CONTRACT,
  buildCandidateOrchestration,
  candidateOrchestrationPath
} from './lib/article-simplification/candidate-orchestrator-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const batchPath = 'content/production/article-simplification/batches/BATCH-001/batch-plan.v1.json';
const expectedNodes = [
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
];

const contract = readJson(APS4_CONTRACT);
assert.equal(contract.work, 'APS-4');
assert.equal(contract.status, 'ACTIVE');
assert.equal(contract.baselineCommit, APS4_BASELINE);
assert.equal(contract.command, 'npm run article:batch -- --book BOOK-1 --count 30');
assert.equal(contract.input.mayReinterpretAPS2C2C3KppVapReadinessInternals, false);
assert.equal(contract.generationBoundary.implicitPaidAiInvocationAllowed, false);
assert.equal(contract.generationBoundary.networkInvocationByArticleBatchAllowedAtAPS4, false);
assert.equal(contract.governance.candidateEqualsKnowledgeAuthority, false);
assert.equal(contract.governance.humanAuthorityCreationAllowed, false);
assert.equal(contract.governance.publicationCreationAllowed, false);
assert.equal(contract.localeIntegration.contract, APS_L10N_CONTRACT);
assert.deepEqual(contract.localeIntegration.defaultTargetLocales, ['zh-Hans', 'en']);
assert.equal(contract.localeIntegration.englishTranslationInheritanceAllowed, false);

const pkg = readJson('package.json');
assert.equal(pkg.scripts?.['article:batch'], 'node scripts/article-batch.mjs');
assert.equal(pkg.scripts?.['check:aps-4'], 'node scripts/check-aps-4-candidate-orchestration.mjs');
assert.equal(pkg.scripts?.['check:aps-l10n'], 'node scripts/check-aps-l10n-integration.mjs');

const source = fs.readFileSync(path.join(root, 'scripts/article-batch.mjs'), 'utf8');
assert.match(source, /writeCandidateOrchestration/);
assert.match(source, /--locales/);
assert.equal(/runProviderGeneration|OPENAI_API_KEY|fetch\(/.test(source), false, 'article:batch APS-4 must not make implicit provider/network calls');

const batch = readJson(batchPath);
assert.equal(batch.work, 'APS-3');
assert.deepEqual(batch.entries.map(entry => entry.nodeCode), expectedNodes);
const projected = buildCandidateOrchestration(root, batch, {
  targetLocales: ['zh-Hans', 'en'],
  createdAt: '2026-08-14T03:20:00.000Z'
});
assert.equal(projected.work, 'APS-4');
assert.equal(projected.status, 'PRIMARY_CANDIDATES_RESOLVED_FOR_APS_5_REVIEW_BATCH');
assert.equal(projected.summary.selectedNodeCount, 6);
assert.equal(projected.summary.primaryCandidateReadyCount, 6);
assert.equal(projected.summary.reusedExistingPrimaryCandidateCount, 6);
assert.equal(projected.summary.primaryCandidateGenerationRequiredCount, 0);
assert.equal(projected.summary.primaryCandidateConflictCount, 0);
assert.equal(projected.summary.localeLaneCount, 12);
assert.equal(projected.summary.localeCandidateReadyCount, 6);
assert.equal(projected.summary.localeDiscoveryBlockedCount, 6);
assert.equal(projected.summary.localeGenerationRequiredCount, 0);
assert.equal(projected.summary.reusableHumanReviewCount, 6);
assert.equal(projected.summary.reusableHumanApprovalCount, 6);
assert.equal(projected.summary.localePublicationAuthorityPresentCount, 0);
assert.deepEqual(projected.entries.map(entry => entry.nodeCode), expectedNodes);

for (const entry of projected.entries) {
  assert.equal(entry.primaryCandidate.resolution, 'REUSED_EXISTING_GOVERNED_PJA_CANDIDATE');
  assert.equal(entry.primaryCandidate.validCandidateOnlyBoundary, true);
  assert.equal(entry.primaryCandidate.state, 'CANDIDATE_READY');
  assert.equal(entry.primaryCandidate.path, `content/knowledge/production/candidates/zh-Hans/${entry.nodeCode}/candidate.v1.json`);
  assert.match(entry.primaryCandidate.candidateDigest, /^[a-f0-9]{64}$/);
  const zh = entry.targetLocaleLanes.find(lane => lane.locale === 'zh-Hans');
  const en = entry.targetLocaleLanes.find(lane => lane.locale === 'en');
  assert(zh && en);
  assert.equal(zh.state, 'CANDIDATE_READY_FOR_LOCALE_AUTHORITY');
  assert.equal(zh.existingHumanEvidence.review.accepted, true);
  assert.equal(zh.existingHumanEvidence.approval.approved, true);
  assert.equal(zh.existingHumanEvidence.publication.published, false);
  assert.equal(zh.localeArticleAuthorityState, 'AWAITING_EXPLICIT_HUMAN_PUBLICATION_DECISION');
  assert.equal(en.state, 'BLOCKED_LOCALE_AUTHORITY_DISCOVERY');
  assert(en.blockers.includes('LOCALE_DISCOVERY_REQUIRED'));
  assert(en.blockers.includes('LOCALE_AUTHORITY_UNASSIGNED'));
  assert.equal(en.candidate.state, 'CANDIDATE_NOT_PRESENT');
  assert.equal(en.localeArticleAuthorityState, 'NOT_ELIGIBLE_FOR_LOCALE_AUTHORITY');
}

const committedPath = candidateOrchestrationPath('BATCH-001');
assert.equal(fs.existsSync(path.join(root, committedPath)), true, `${committedPath} must exist`);
const committed = readJson(committedPath);
assert.equal(committed.batchCode, 'BATCH-001');
assert.deepEqual(committed.entries.map(entry => entry.nodeCode), expectedNodes);
assert.equal(committed.summary.reusedExistingPrimaryCandidateCount, 6);
assert.equal(committed.summary.localeDiscoveryBlockedCount, 6);
assert.equal(committed.governance.implicitPaidAiInvocationAllowed, false);
assert.equal(committed.governance.localeAuthorityInheritanceAllowed, false);
assert.equal(committed.governance.zhHansToEnglishTranslationInheritanceAllowed, false);
assert.equal(committed.nextWork, 'APS-5_REVIEW_BATCH_ASSEMBLY');

console.log('✓ APS-4 Candidate Orchestration passed.');
console.log('✓ BATCH-001 reuses all 6 existing governed zh-Hans PJA Candidates; no article prose is regenerated or overwritten.');
console.log('✓ Existing digest-bound TL Review + Approval are discovered for APS-5 reuse, but Publication authority remains 0/6.');
console.log('✓ zh-Hans is candidate-ready; all 6 English lanes fail closed at locale discovery/authority instead of inheriting or translating authority.');
console.log('✓ article:batch makes no implicit paid-AI/network call at APS-4.');
console.log('→ Next: APS-5 Review Batch Assembly can reuse exact existing Human evidence and expose only unresolved decisions.');
