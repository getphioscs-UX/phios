import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  APS_L10N_CONTRACT,
  APS_L10N_RECONCILIATION,
  vapL10nReferenceState
} from './lib/article-simplification/candidate-orchestrator-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const vapContractPath = 'content/production/visual-article/l10n/contracts/vap-l10n-r1-r5-english-successor-v1.json';
const vapFreezePath = 'content/production/visual-article/l10n/freeze/VAP-L10N-R5-KN-PREFACE-001-EN.json';
const pjaReconciliationPath = 'content/knowledge/reconciliation/pja-w2d/pja-w2d-vap-l10n-english-publication-successor-v1.json';
const batchCandidatePath = 'content/production/article-simplification/batches/BATCH-001/candidate-orchestration.v1.json';
const formatReconciliationPath = 'content/production/article-simplification/l10n/aps-l10n-published-article-format-successor-reconciliation-v1.json';

const contract = readJson(APS_L10N_CONTRACT);
assert.equal(contract.work, 'APS-L10N');
assert.equal(contract.status, 'ACTIVE_VAP_L10N_SUCCESSOR_PATTERN_ADOPTED');
assert.deepEqual(contract.canonicalSequence, [
  'ARTICLE_CANDIDATE',
  'ZH_HANS_AND_EN_LOCALE_ARTICLE_AUTHORITY',
  'CAR',
  'CPR',
  'VISUAL_ARTICLE',
  'SAME_ROUTE_LOCALE_RELEASE'
]);
assert.equal(contract.referenceImplementation.contract, vapContractPath);
assert.equal(contract.referenceImplementation.freeze, vapFreezePath);
assert.equal(contract.localeAuthorityRules.englishMustUseIndependentLocaleAuthoring, true);
assert.equal(contract.localeAuthorityRules.translationFromZhHansMayCreateEnglishAuthority, false);
assert.equal(contract.localeAuthorityRules.humanReviewInheritanceAcrossLocalesAllowed, false);
assert.equal(contract.localeAuthorityRules.humanApprovalInheritanceAcrossLocalesAllowed, false);
assert.equal(contract.localeAuthorityRules.humanPublicationInheritanceAcrossLocalesAllowed, false);
assert.equal(contract.sameRouteRules.sameSlugRequired, true);
assert.equal(contract.sameRouteRules.sameHrefRequired, true);
assert.equal(contract.sameRouteRules.runtimeChoosesLocale, true);
assert.equal(contract.projectionAuthority.carOwner, 'CAR');
assert.equal(contract.projectionAuthority.cprOwner, 'CPR');
assert.equal(contract.projectionAuthority.visualArticleReleaseOwner, 'VAP');

const reconciliation = readJson(APS_L10N_RECONCILIATION);
assert.equal(reconciliation.status, 'VAP_L10N_VERTICAL_SLICE_ADOPTED_AS_APS_REFERENCE');
assert.equal(reconciliation.apsChange.vapL10nRemainsHistoricalAndFrozen, true);
assert.equal(reconciliation.apsChange.futureLocaleReleaseRunsThroughAPSContract, true);
assert.equal(reconciliation.apsChange.separateVapL10nOperatorPhaseRequiredForFutureArticles, false);
assert.equal(reconciliation.apsChange.underlyingCarCprVapAuthoritiesPreserved, true);
assert.equal(reconciliation.apsChange.localeHumanAuthorityPreserved, true);

const vap = readJson(vapContractPath);
assert.deepEqual(vap.works.map(item => item.work), ['VAP-L10N-R1', 'VAP-L10N-R2', 'VAP-L10N-R3', 'VAP-L10N-R4', 'VAP-L10N-R5']);
assert.equal(vap.authorityBoundaries.carOwnsFigurePublication, true);
assert.equal(vap.authorityBoundaries.cprOwnsPresentation, true);
assert.equal(vap.authorityBoundaries.vapOwnsVisualArticleReleaseProjection, true);
assert.equal(vap.authorityBoundaries.runtimeChoosesLocale, true);
const freeze = readJson(vapFreezePath);
assert.equal(freeze.status, 'FROZEN');

const reference = vapL10nReferenceState(root);
assert.equal(reference.bothPublished, true);
assert.equal(reference.sameSlug, true);
assert.equal(reference.sameHref, true);
assert.equal(reference.zhHans.slug, 'ai-formation-from-civilizational-capability');
assert.equal(reference.en.slug, 'ai-formation-from-civilizational-capability');
assert.equal(reference.zhHans.href, '/articles/ai-formation-from-civilizational-capability');
assert.equal(reference.en.href, '/articles/ai-formation-from-civilizational-capability');

const routeRuntime = fs.readFileSync(path.join(root, 'assets/js/pages/article.js'), 'utf8');
const publishedContent = fs.readFileSync(path.join(root, 'assets/js/knowledge/published-content.js'), 'utf8');
assert.match(routeRuntime, /getLocale\(\)/);
assert.match(publishedContent, /record\.locale === normalizedLocale/);
assert.match(publishedContent, /visualArticles/);

const pjaSuccessor = readJson(pjaReconciliationPath);
assert.equal(pjaSuccessor.successorRule.optionalSuccessorNodeCode, 'KN-PREFACE-001');
assert.equal(pjaSuccessor.successorRule.optionalSuccessorLocale, 'en');
assert.equal(pjaSuccessor.successorRule.requiredManifestStatus, 'published');
assert.equal(pjaSuccessor.preservedAuthority.noPublicationCreatedByThisReconciliation, true);


const formatReconciliation = readJson(formatReconciliationPath);
assert.equal(formatReconciliation.status, 'ACTIVE_SUCCESSOR_AWARE_CHECKER_RECONCILIATION');
assert.equal(formatReconciliation.preservedAuthority.repairCandidateDoesNotAutoPublish, true);
assert.equal(formatReconciliation.preservedAuthority.humanReviewRequired, true);
assert.equal(formatReconciliation.preservedAuthority.humanApprovalRequired, true);
assert.equal(formatReconciliation.preservedAuthority.humanPublicationRequired, true);
assert.equal(formatReconciliation.preservedAuthority.englishSuccessorAuthorityRequired, true);
assert.equal(formatReconciliation.preservedAuthority.vapL10nFreezeRequired, true);

const candidateOrchestration = readJson(batchCandidatePath);
assert.equal(candidateOrchestration.apsL10nContractReference, APS_L10N_CONTRACT);
for (const entry of candidateOrchestration.entries) {
  const zh = entry.targetLocaleLanes.find(lane => lane.locale === 'zh-Hans');
  const en = entry.targetLocaleLanes.find(lane => lane.locale === 'en');
  assert.equal(zh.state, 'CANDIDATE_READY_FOR_LOCALE_AUTHORITY');
  assert.equal(en.state, 'BLOCKED_LOCALE_AUTHORITY_DISCOVERY');
  assert.equal(en.localeIdentity.authority, 'unassigned');
}

console.log('✓ APS-L10N integration passed.');
console.log('✓ Completed VAP-L10N R1-R5 is preserved as the frozen reference implementation, not duplicated or mutated.');
console.log('✓ APS now owns orchestration of Candidate → locale authority → CAR → CPR → Visual Article → same-route locale release while each underlying authority remains with its original owner.');
console.log('✓ KN-PREFACE-001 proves zh-Hans/en can publish on one canonical route with runtime locale selection.');
console.log('✓ Current BATCH-001 English lanes remain fail-closed because English locale authority discovery is not yet established for those 6 nodes.');
