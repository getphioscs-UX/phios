import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  VAP_W11_EXPECTED_NODE_CODES,
  VAP_W11_PATHS,
  VAP_W11_PUBLICATION_AUTHORITY,
  buildVapW11PublicationQueue,
  buildPendingPublicationDecisionEnvelope,
  validateFrozenPublicationQueueLineage,
  validatePublicationDecisionEnvelope,
  validatePublicationHandoff,
  materializeBoundCanonicalBriefs,
  applyVapW11,
  resolveVapW11PublishedSuccessorAuthority
} from './lib/visual-article-production/publication-handoff-decision-v1.mjs';
import { validateProductionArticlePackage } from './lib/visual-article-production/human-approval-production-article-package-v1.mjs';
import { serialize } from './lib/knowledge-production/canonical-brief-v2.mjs';

const root = process.cwd();
const readJson = async rel => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));
const fileExists = rel => fs.access(path.join(root, rel)).then(() => true, () => false);
const [contract, policy, decisionSchema, handoffSchema, queue, decisions, manifest, activation, publicationRegistry, publishedAuthority] = await Promise.all([
  readJson('content/production/visual-article/contracts/vap-w11-publication-handoff-decision-v1.json'),
  readJson('content/production/visual-article/policies/vap-w11-publication-handoff-decision-policy-v1.json'),
  readJson('content/production/visual-article/schemas/vap-w11-human-publication-decisions-v1.schema.json'),
  readJson('content/production/visual-article/schemas/vap-w11-publication-handoff-v1.schema.json'),
  readJson(VAP_W11_PATHS.publicationQueue), readJson(VAP_W11_PATHS.decisions), readJson(VAP_W11_PATHS.authorizationManifest), readJson(VAP_W11_PATHS.activation),
  readJson(VAP_W11_PATHS.pjaPublicationRegistry), readJson(VAP_W11_PATHS.publishedAuthorityRegistry)
]);

assert.equal(contract.outputAuthority, 'human_publication_decision_and_publication_runtime_handoff_only');
assert.equal(contract.authorityBoundary.humanApprovalEqualsPublication, false);
assert.equal(contract.authorityBoundary.humanPublicationDecisionEqualsPublicationRecord, false);
assert.equal(contract.authorityBoundary.publicationHandoffEqualsPublicationRecord, false);
assert.equal(contract.authorityBoundary.pjaPublicationRuntimeRequired, true);
assert.equal(contract.authorityBoundary.w11MayWritePjaPublicationRegistry, false);
assert.equal(contract.authorityBoundary.w11MayWritePublishedKnowledgeAuthority, false);
assert.equal(contract.authorityBoundary.w11MayMutateArticleBody, false);
for (const op of ['infer_human_publication_decision','bulk_human_publication_approval','rewrite_article_body','write_pja_publication_package','write_pja_publication_registry','write_published_knowledge_authority','write_public_runtime_projection','call_provider']) assert(contract.prohibitedOperations.includes(op));
assert.equal(policy.bulkPublicationDecisionAllowed, false); assert.equal(policy.oneIndependentDecisionPerNode, true); assert.equal(policy.systemMayInferPublishFromHumanApproval, false); assert.equal(policy.systemMayInferPublishFromContinueCommand, false); assert.equal(policy.aiMayActAsPublicationAuthority, false); assert.equal(policy.publicationExecution.performedByW11, false);
assert.equal(decisionSchema.properties.schemaVersion.const, 'PHI-OS-VAP-W11-HUMAN-PUBLICATION-DECISIONS-v1.0.0'); assert.equal(handoffSchema.properties.schemaVersion.const, 'PHI-OS-VAP-W11-PUBLICATION-HANDOFF-v1.0.0');

const rebuilt = await buildVapW11PublicationQueue(root); const frozenValidation = validateFrozenPublicationQueueLineage(queue, rebuilt); assert.equal(frozenValidation.valid, true, JSON.stringify(frozenValidation.errors));
assert.equal(queue.entries.length, 6); assert.deepEqual(queue.entries.map(x => x.nodeCode), VAP_W11_EXPECTED_NODE_CODES); assert.equal(queue.bulkPublicationDecisionAllowed, false); assert.equal(queue.oneIndependentDecisionPerNode, true); assert.equal(queue.publicationAuthority, VAP_W11_PUBLICATION_AUTHORITY); assert.equal(queue.humanApprovalDoesNotEqualPublication, true); assert.equal(queue.humanPublicationDecisionDoesNotEqualPublicationRecord, true); assert.equal(queue.publicProjectionAllowedByW11, false);

for (const entry of queue.entries) {
  assert.equal(entry.pjaPublicationRuntimeExecutionReady, true, `${entry.nodeCode}:PJA_PUBLICATION_RUNTIME_MUST_BE_READY`);
  assert(entry.preconditions.every(item => item.status === 'satisfied'), `${entry.nodeCode}:PUBLICATION_PRECONDITIONS_MUST_PASS`);
  const [candidate, review, approval, productionPackage, body, brief] = await Promise.all([
    readJson(entry.candidate.path), readJson(entry.review.path), readJson(entry.approval.path), readJson(entry.productionArticlePackage.path),
    fs.readFile(path.join(root, entry.productionArticlePackage.bodyPath), 'utf8'), readJson(entry.canonicalBrief.path)
  ]);
  const packageValidation = validateProductionArticlePackage(productionPackage, { candidate, review, approval, articleBody: body }); assert.equal(packageValidation.valid, true, `${entry.nodeCode}:${JSON.stringify(packageValidation.errors)}`);
  assert.equal(body, candidate.article.bodyMarkdown, `${entry.nodeCode}:W11_MUST_NOT_MUTATE_ARTICLE_BODY`);
  assert.equal(brief.briefDigest, candidate.sourceBrief.briefDigest); assert.equal(brief.briefDigest, entry.canonicalBrief.briefDigest); assert.equal(brief.repositoryCommit, candidate.sourceBrief.repositoryCommit); assert.equal(entry.canonicalBrief.exactCandidateDigestMatch, true);
  assert.equal(entry.targetPublication.slug, brief.localizedIdentity.slug); assert.equal(entry.targetPublication.href, `/articles/${brief.localizedIdentity.slug}`); assert.equal(entry.targetPublication.articleCode, `KA-${entry.nodeCode.replace(/^KN-/, '')}-ZH-ARTICLE`); assert.equal(entry.targetPublication.publicationBookCode, 'BOOK-1');
  const successor = await resolveVapW11PublishedSuccessorAuthority(root, entry.nodeCode);
  const registryRecord = publicationRegistry.records.find(record => record.nodeCode === entry.nodeCode && record.locale === 'zh-Hans');
  if (registryRecord) { assert(successor?.humanPublicationAuthorized, `${entry.nodeCode}:PUBLICATION_REQUIRES_W11_HUMAN_AUTHORITY`); assert.equal(successor.publicationRecorded, true); }
}

const decisionValidation = validatePublicationDecisionEnvelope(decisions, queue, { requireAllDecided: false }); assert.equal(decisionValidation.valid, true, JSON.stringify(decisionValidation.errors));
const decided = decisions.entries.filter(item => item.decisionState === 'human_decided');
if (decided.length === 0) {
  assert.equal(decisions.status, 'PENDING_HUMAN_PUBLICATION_DECISION'); assert(decisions.entries.every(item => item.decision === null && item.publisherCode === null && item.publisherAuthority === null));
  const required = validatePublicationDecisionEnvelope(decisions, queue, { requireAllDecided: true }); assert.equal(required.valid, false); assert.equal(required.errors.filter(error => error.code === 'VAP_W11_EXPLICIT_HUMAN_PUBLICATION_DECISION_REQUIRED').length, 6);
  assert.equal(manifest.status, 'AWAITING_EXPLICIT_HUMAN_PUBLICATION_DECISION'); assert.equal(manifest.humanPublicationDecisionCount, 0); assert.equal(manifest.publishAuthorizedCount, 0); assert.equal(manifest.publicationHandoffCount, 0); assert.equal(manifest.pjaPublicationRecordCountCreatedByW11, 0); assert.equal(manifest.publicProjectionCountCreatedByW11, 0);
  assert.equal(activation.status, manifest.status); assert.equal(activation.publicationEligibleCount, 6); assert.equal(activation.humanPublicationDecisionCount, 0); assert.equal(activation.pjaPublicationRecordCountCreatedByW11, 0); assert.equal(activation.publicProjectionCountCreatedByW11, 0); assert.equal(activation.pjaPublicationRegistryMutated, false); assert.equal(activation.publishedKnowledgeAuthorityMutated, false);
  for (const nodeCode of VAP_W11_EXPECTED_NODE_CODES) assert.equal(await fileExists(`content/production/visual-article/publication/zh-Hans/${nodeCode}/publication-handoff.v1.json`), false, `${nodeCode}:HANDOFF_REQUIRES_HUMAN_PUBLICATION_DECISION`);
} else {
  assert.equal(decided.length, 6); assert.equal(decisions.status, 'HUMAN_PUBLICATION_DECISIONS_RECORDED');
  for (const entry of queue.entries) {
    const decision = decisions.entries.find(item => item.nodeCode === entry.nodeCode); const handoff = await readJson(`content/production/visual-article/publication/zh-Hans/${entry.nodeCode}/publication-handoff.v1.json`); const validation = validatePublicationHandoff(handoff, entry, decision); assert.equal(validation.valid, true, `${entry.nodeCode}:${JSON.stringify(validation.errors)}`);
  }
  assert.equal(manifest.humanPublicationDecisionCount, 6); assert.equal(manifest.publicationHandoffCount, 6); assert.equal(manifest.pjaPublicationRecordCountCreatedByW11, 0); assert.equal(manifest.publicProjectionCountCreatedByW11, 0); assert.equal(activation.pjaPublicationRegistryMutated, false); assert.equal(activation.publishedKnowledgeAuthorityMutated, false);
}
assert.equal(manifest.pjaPublicationRecordCountCreatedByW11, 0); assert.equal(manifest.publicProjectionCountCreatedByW11, 0);
assert.equal(activation.pjaPublicationRegistryMutated, false); assert.equal(activation.publishedKnowledgeAuthorityMutated, false);
assert.equal(publishedAuthority.recordCount, 2, 'VAP-W11 must not project Published Knowledge Authority.');

const makePublishEnvelope = () => {
  const envelope = structuredClone(buildPendingPublicationDecisionEnvelope(queue)); envelope.status = 'HUMAN_PUBLICATION_DECISIONS_RECORDED';
  for (const entry of envelope.entries) { entry.decisionState = 'human_decided'; entry.decision = 'publish'; entry.publisherCode = 'TL'; entry.publisherAuthority = VAP_W11_PUBLICATION_AUTHORITY; entry.decidedAt = '2026-08-11T09:45:00.000Z'; entry.summary = 'Fixture: independently authorize this Human-approved Production Article Package for the PJA Publication Runtime; this decision is not itself a Publication record.'; }
  return envelope;
};
const publishEnvelope = makePublishEnvelope(); const publishValidation = validatePublicationDecisionEnvelope(publishEnvelope, queue, { requireAllDecided: true }); assert.equal(publishValidation.valid, true, JSON.stringify(publishValidation.errors));
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w11-publish-')); const applied = await applyVapW11(root, publishEnvelope, { apply: true, targetRoot: temp }); assert.equal(applied.activation.humanPublicationDecisionCount, 6); assert.equal(applied.activation.publishAuthorizedCount, 6); assert.equal(applied.activation.publicationHandoffCount, 6); assert.equal(applied.activation.pjaPublicationRecordCountCreatedByW11, 0); assert.equal(applied.activation.publicProjectionCountCreatedByW11, 0); assert.equal(applied.manifest.status, 'SIX_HUMAN_PUBLICATION_DECISIONS_AUTHORIZE_PJA_PUBLICATION_EXECUTION');
for (const entry of queue.entries) { const handoff = JSON.parse(await fs.readFile(path.join(temp, `content/production/visual-article/publication/zh-Hans/${entry.nodeCode}/publication-handoff.v1.json`), 'utf8')); const decision = publishEnvelope.entries.find(item => item.nodeCode === entry.nodeCode); const validation = validatePublicationHandoff(handoff, entry, decision); assert.equal(validation.valid, true, `${entry.nodeCode}:${JSON.stringify(validation.errors)}`); assert.equal(handoff.pjaPublicationRuntimeExecutionEligible, true); assert.equal(handoff.authority.publicationRecorded, false); assert.equal(handoff.authority.publicProjectionRecorded, false); }

const mixed = makePublishEnvelope(); const deferredNode = 'KN-B1-P3-015'; const deferred = mixed.entries.find(item => item.nodeCode === deferredNode); deferred.decision = 'defer'; deferred.summary = 'Fixture defer.'; const tempMixed = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w11-mixed-')); const mixedApplied = await applyVapW11(root, mixed, { apply: true, targetRoot: tempMixed }); assert.equal(mixedApplied.activation.publishAuthorizedCount, 5); const deferredHandoff = JSON.parse(await fs.readFile(path.join(tempMixed, `content/production/visual-article/publication/zh-Hans/${deferredNode}/publication-handoff.v1.json`), 'utf8')); assert.equal(deferredHandoff.pjaPublicationRuntimeExecutionEligible, false); assert.equal(deferredHandoff.authorizationState, 'deferred_by_human_publication_authority');

const invalid = makePublishEnvelope(); invalid.entries[0].publisherCode = 'ChatGPT'; invalid.entries[0].publisherAuthority = 'AI'; assert.equal(validatePublicationDecisionEnvelope(invalid, queue, { requireAllDecided: true }).valid, false);
const conflictTemp = await fs.mkdtemp(path.join(os.tmpdir(), 'vap-w11-brief-conflict-')); const conflictPath = path.join(conflictTemp, queue.entries[0].canonicalBrief.path); await fs.mkdir(path.dirname(conflictPath), { recursive: true }); await fs.writeFile(conflictPath, '{}\n'); await assert.rejects(() => materializeBoundCanonicalBriefs(root, queue, { apply: true, targetRoot: conflictTemp }), /VAP_W11_CANONICAL_BRIEF_CONFLICT/);

const pkg = await readJson('package.json'); assert.equal(pkg.scripts['build:vap-w11'], 'node scripts/build-vap-w11-publication-handoff-decision.mjs'); assert.equal(pkg.scripts['vap:w11:apply'], 'node scripts/apply-vap-w11-publication-handoff-decision.mjs --apply'); assert.equal(pkg.scripts['check:vap-w11'], 'node scripts/check-vap-w11-publication-handoff-decision.mjs'); const vapB = pkg.scripts['check:vap-b']; assert(vapB.includes('npm run check:vap-w11')); if (vapB.includes('npm run check:vap-w12-w19')) assert(vapB.indexOf('npm run check:vap-w11') < vapB.indexOf('npm run check:vap-w12-w19')); else assert(vapB.endsWith('&& npm run check:vap-w11'));

console.log('✓ VAP-W11 Publication Handoff & Governed Publication Decision passed.');
console.log('✓ 6/6 Human-approved Production Article Packages are publication-eligible with exact Candidate/Review/Approval/Package lineage.');
console.log('✓ 6/6 Canonical Production Brief v2 snapshots deterministically reconstruct to the exact Candidate-bound frozen digests and are materialized for downstream PJA Publication Runtime execution.');
console.log(decided.length ? `✓ ${decided.length}/6 explicit TL Human Publication decisions are recorded as governed handoffs; W11 still creates 0 PJA Publication records and 0 Public Projections.` : '✓ Real Batch 001 remains fail-closed at 0 Human Publication decisions; no Publication or Public Projection is inferred from Human Approval.');
console.log('✓ Positive fixture proves six explicit TL publish decisions create six publication-runtime handoffs while leaving Publication Registry and Published Knowledge Authority outside W11 authority.');
