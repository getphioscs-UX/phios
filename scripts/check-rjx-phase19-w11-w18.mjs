import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const read = p => fs.readFileSync(p, 'utf8');
const json = p => JSON.parse(read(p));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const baseline = '3b5ff152d1cdfe479ed4daf7c772e3faa926dc17';
const sourceManifest = json('content/runtime/journey-runtime/audits/rjx-phase15-w8-w18-implementation-manifest-v1.json');
const audit = json('content/web-production/audits/rjx-existing-page-audit-v1.json');
const predecessorRoute = json('content/runtime/journey-runtime/compatibility/rjx-page-consolidation-candidate-v1.json');
const vocabulary = json('content/runtime/journey-runtime/registries/client-vocabulary-registry-v1.json');
const complexity = json('content/runtime/journey-runtime/contracts/complexity-visualization-contract-v1.json');
const timeline = json('content/runtime/journey-runtime/registries/reality-timeline-event-type-registry-v1.json');
const reading = json('content/runtime/journey-runtime/contracts/reading-projection-contract-v1.json');
const navigation = json('content/runtime/journey-runtime/contracts/navigation-projection-contract-v1.json');
const review = json('content/runtime/journey-runtime/contracts/reality-review-next-contract-v1.json');
const reconciliation = json('content/runtime/journey-runtime/phase19/rjx-phase19-w11-w18-reconciliation-v1.json');
const route = json('content/runtime/journey-runtime/phase19/rjx-phase19-route-strategy-v1.json');
const model = json('content/runtime/journey-runtime/phase19/rjx-phase19-workspace-review-model-v1.json');
const acceptance = json('content/runtime/journey-runtime/phase19/rjx-phase19-w11-w18-technical-acceptance-v1.json');
const freeze = json('content/runtime/journey-runtime/freeze/rjx-phase19-w11-w18-technical-freeze-v1.json');
const phase19Archive = Object.freeze({
  'reality/index.html': 'content/runtime/journey-runtime/phase19/frozen-artifacts/reality-index-phase19.html',
  'assets/js/pages/reality-workspace-phase19.js': 'content/runtime/journey-runtime/phase19/frozen-artifacts/reality-workspace-phase19.js',
  'assets/css/reality-workspace-phase19.css': 'content/runtime/journey-runtime/phase19/frozen-artifacts/reality-workspace-phase19.css'
});
const html = read(phase19Archive['reality/index.html']);
const js = read(phase19Archive['assets/js/pages/reality-workspace-phase19.js']);
const css = read(phase19Archive['assets/css/reality-workspace-phase19.css']);
const redirects = read('_redirects');

assert.equal(reconciliation.baselineCommit, baseline);
assert.equal(route.baselineCommit, baseline);
assert.equal(model.baselineCommit, baseline);
assert.equal(acceptance.baselineCommit, baseline);
assert.equal(freeze.baselineCommit, baseline);

// W11 — reuse the complete page audit; no route/page mistaken for runtime authority.
assert.equal(audit.pages.length, 7);
assert.equal(audit.summary.unclassifiedRoutes, 0);
assert.equal(audit.summary.pageAuthorityCount, 0);
assert.equal(audit.summary.deletions, 0);
assert.ok(audit.pages.every(p => p.pageIsRuntimeAuthority === false && p.deleteInAuditStep === false));
assert.ok(sourceManifest.completedCandidateWork.includes('RJX-W11'));

// W12 — one workspace review surface, no route activation/deletion before explicit human UX acceptance.
assert.equal(predecessorRoute.canonicalWorkspaceRoute, '/reality/');
assert.equal(predecessorRoute.canonicalRouteActivated, false);
assert.equal(predecessorRoute.redirectsActivated, false);
assert.equal(route.canonicalWorkspaceRoute, '/reality/');
assert.equal(route.canonicalProductionRouteActivated, false);
assert.equal(route.redirectsActivated, false);
assert.equal(route.oldPagesDeleted, false);
assert.equal(route.duplicateRuntimeWritesAllowed, false);
assert.equal(route.humanUxAcceptanceSynthesized, false);
assert.ok(fs.existsSync('reality/index.html'));
for (const legacy of route.legacyRoutes) {
  const pattern = new RegExp(`^${legacy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+/reality/?\\s`, 'm');
  assert.equal(pattern.test(redirects), false, `${legacy} redirect must remain inactive`);
}

// W13 — friendly bilingual vocabulary without requiring internal acronyms.
assert.ok(vocabulary.entries.length >= 10);
assert.ok(vocabulary.entries.every(entry => entry.en && entry['zh-Hans']));
assert.equal(vocabulary.technicalIdentifiersRequiredForBasicClientUse, false);
assert.match(js, /'zh-Hans'/);
assert.match(html, /data-locale="en"/);
assert.match(html, /data-locale="zh-Hans"/);

// W14 — complexity stays progressive and source-bound; no decorative certainty.
assert.equal(complexity.defaultForSimpleCase, false);
assert.equal(complexity.boundaries.visualEdgeRequiresSource, true);
assert.equal(complexity.boundaries.unknownRelationshipUsesUncertainStyling, true);
assert.equal(complexity.boundaries.projectedCannotLookObserved, true);
assert.equal(complexity.boundaries.decorativeCertaintyAllowed, false);
assert.equal(model.defaultComplexity, 'SIMPLE');
assert.equal(model.workspace.complexity.loadByDefault, false);
assert.ok(model.workspace.complexity.relationships.every(rel => Array.isArray(rel.sourceRefs) && rel.sourceRefs.length > 0));
assert.match(css, /data-classification="UNKNOWN"/);

// W15 — timeline is optional, source-bound and never causal by sequence.
assert.equal(timeline.rules.timelineOptionalForSimpleCase, true);
assert.equal(timeline.rules.eventTimeIsCausalProof, false);
assert.equal(timeline.rules.sequenceIsCausation, false);
assert.equal(timeline.rules.aiMayInventDates, false);
assert.ok(model.workspace.complexity.timeline.every(event => Array.isArray(event.sourceRefs) && event.sourceRefs.length > 0));
assert.ok(model.workspace.complexity.timeline.every(event => ['RELATIVE', 'EXACT'].includes(event.timeType)));

// W16 — rule-first Reading remains usable with AI unavailable and keeps trace/unknowns visible.
assert.equal(reading.aiRequired, false);
assert.equal(reading.ruleReadingPreservedOnProviderFailure, true);
assert.equal(reading.navigationReadinessMutableByProvider, false);
assert.ok(model.workspace.reading.oneSentence.evidenceRefs.length > 0);
assert.ok(model.workspace.reading.oneSentence.unknownRefs.length > 0);
for (const section of model.workspace.reading.sections) {
  const supported = (section.evidenceRefs?.length || 0) > 0 || (section.unknownRefs?.length || 0) > 0;
  assert.equal(supported, true, `${section.code} must be supported or explicitly unknown`);
}

// W17 — options are complete, bounded and never auto-selected.
assert.equal(navigation.rules.chooseForClient, false);
assert.equal(navigation.rules.automaticSelection, false);
assert.equal(navigation.rules.aiSelectsFinalAction, false);
assert.equal(model.workspace.navigation.automaticSelection, false);
assert.equal(model.workspace.navigation.deterministicCommand, false);
for (const option of model.workspace.navigation.options) {
  for (const field of navigation.requiredOptionFields) assert.ok(Object.hasOwn(option, field), `${option.optionId} missing ${field}`);
  assert.equal(option.userChoiceRequired, true);
}

// W18 — review creates a successor candidate by predecessor+diff without rewriting history.
assert.equal(review.silentPastMutationAllowed, false);
assert.equal(review.realityVNextRequiresPredecessor, true);
assert.equal(review.realityVNextRequiresDiff, true);
assert.equal(model.workspace.review.realityVNext.predecessorVersionId, model.workspace.review.previousRealityVersion);
assert.equal(model.workspace.review.realityVNext.diffId, model.workspace.review.realityDiff.diffId);
assert.equal(model.workspace.review.realityVNext.candidateOnly, true);
assert.ok(model.workspace.review.closure.continuationPolicy);
assert.ok(model.workspace.review.closure.reopenPolicy);

// Review surface is non-authoritative and read-only by construction.
assert.equal(model.reviewOnly, true);
assert.equal(model.runtimeWriteAuthority, false);
assert.equal(model.persistenceAllowed, false);
assert.match(html, /data-rjx19-review-only="true"/);
assert.match(html, /reality-workspace-phase19\.js/);
assert.match(html, /reality-workspace-phase19\.css/);
assert.equal(/\b(localStorage|sessionStorage|indexedDB)\b/.test(js), false);
assert.equal(/fetch\(\s*['"]\/api\//.test(js), false);
assert.equal(/method-client-delivery|method-execute|reconstruct-reality/.test(js), false);

// Technical acceptance must not synthesize the human decision or downstream production evidence.
assert.equal(acceptance.accepted.humanUxAcceptanceSynthesized, false);
assert.equal(acceptance.accepted.legacyRedirectsActivated, false);
assert.equal(acceptance.accepted.legacyPagesDeleted, false);
assert.ok(acceptance.pending.includes('TL_HUMAN_UX_REVIEW'));
assert.ok(acceptance.pending.includes('PHASE20_PRODUCTION_RUNTIME_CONSUMPTION_INTEGRATION'));
assert.equal(acceptance.result, 'RJX_PHASE19_TECHNICALLY_READY_FOR_HUMAN_UX_ACCEPTANCE');

// Freeze is hash-bound to the reconciled candidate and predecessor authority artifacts.
for (const [path, digest] of Object.entries(freeze.protectedDigests)) {
  const evidencePath = phase19Archive[path] || path;
  assert.equal(fs.existsSync(evidencePath), true, `${evidencePath} missing`);
  assert.equal(sha256(evidencePath), digest, `${path} historical digest drift`);
}
assert.equal(freeze.authorityInvariant, 'TECHNICAL_UX_SIMPLIFICATION_DOES_NOT_CREATE_RUNTIME_AUTHORITY');
assert.equal(freeze.result, 'RJX_PHASE19_TECHNICAL_CANDIDATE_FROZEN');

console.log('✓ RJX Phase 19 W11-W18 reconciliation passed.');
console.log('✓ Existing Phase 15 candidates reused; no second Reality/Reading/Navigation/Review authority created.');
console.log('✓ Frozen Phase 19 three-stage review predecessor is preserved byte-for-byte in frozen-artifacts/.');
console.log('✓ Legacy redirects remain inactive; legacy pages remain preserved; dashboard remains separate pending review.');
console.log('✓ Human UX/browser/Phase 20 production consumption acceptance remains explicitly pending.');
