import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { resolveJourneyProviderCostGate } from '../functions/reality-journey-runtime/provider-cost-gate-v1.js';

const read = p => fs.readFileSync(p, 'utf8');
const json = p => JSON.parse(read(p));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const requested = process.argv[2] || 'ALL';
const baseline = '167bce2a82734cf96207b78abb47cdcd8cf82522';

const PATHS = {
  slices: 'content/runtime/journey-runtime/acceptance/rjx-minimum-vertical-slices-v2.json',
  metrics: 'content/runtime/journey-runtime/registries/rjx-metrics-contract-v2.json',
  final: 'content/runtime/journey-runtime/acceptance/rjx-final-non-negotiable-acceptance-v1.json',
  authorization: 'content/runtime/journey-runtime/review/rjx-recommended-first-authorization-scope-v1.json',
  manifest: 'content/runtime/journey-runtime/audits/rjx-central-checker-manifest-v2.json',
  package: 'content/runtime/journey-runtime/audits/rjx-final-evidence-package-manifest-v1.json'
};

function verifyPredecessor(record) {
  assert.equal(record.rewritten, false);
  assert.equal(fs.existsSync(record.path), true, `${record.path} missing`);
  assert.equal(sha256(record.path), record.sha256, `${record.path} predecessor digest drift`);
}

function checkSlices() {
  const registry = json(PATHS.slices);
  assert.equal(registry.baselineCommit, baseline);
  assert.equal(registry.status, 'EVIDENCE_BOUND_VALIDATION_READY_PRODUCTION_EXECUTION_NOT_CLAIMED');
  verifyPredecessor(registry.predecessor);
  assert.equal(registry.authorityBoundary.createsRuntimeAuthority, false);
  assert.equal(registry.authorityBoundary.activatesRuleBindings, false);
  assert.equal(registry.authorityBoundary.productionExecutionClaimed, false);
  assert.equal(registry.slices.length, 5);

  const stageRegistry = json('content/runtime/journey-runtime/registries/client-stage-projection-registry-v1.json');
  const role = json('content/runtime/journey-runtime/contracts/reality-journey-role-contract-v1.json');
  const routeRegistry = json('content/runtime/journey-runtime/registries/reality-request-route-registry-v1.json');
  const readingContract = json('content/runtime/journey-runtime/contracts/reading-projection-contract-v1.json');
  const navigationContract = json('content/runtime/journey-runtime/contracts/navigation-projection-contract-v1.json');
  const reviewContract = json('content/runtime/journey-runtime/contracts/reality-review-next-contract-v1.json');
  const eligibility = json('content/runtime/journey-runtime/registries/canonical-node-rule-eligibility-v1.json');
  const complex = json('content/runtime/journey-runtime/contracts/complex-reality-mode-contract-v1.json');

  const fixtureById = Object.fromEntries(registry.slices.map(s => [s.id, json(s.fixture)]));
  for (const s of registry.slices) assert.equal(fs.existsSync(s.fixture), true, `${s.fixture} missing`);

  // Slice 1 — Simple Personal Case
  const s1 = fixtureById.SIMPLE_PERSONAL_CASE;
  assert.equal(s1.questionZhHans, '是否换工作？');
  assert.equal(s1.mode, 'SIMPLE_REALITY_CASE');
  assert.deepEqual(s1.clientStages, ['Understand', 'Choose', 'Review']);
  assert.deepEqual(stageRegistry.clientStages, ['Understand', 'Choose', 'Review']);
  assert.equal(stageRegistry.canonicalBackendOrder.length, 8);
  assert.equal(s1.requirements.aiRequired, false);
  assert.equal(s1.requirements.methodRequired, false);
  assert.equal(s1.requirements.professionalRequiredByDefault, false);
  const professionalRoute = routeRegistry.routes.find(r => r.requestClass === 'PROFESSIONAL_BOUNDARY');
  assert.deepEqual(s1.requirements.professionalTriggerOnly, professionalRoute.matchSignals);
  assert.deepEqual(s1.input.fieldsCollected, s1.input.requiredFields);
  assert.equal(s1.input.providerFieldsCollected, false);
  assert.equal(s1.input.methodFieldsCollected, false);
  assert.ok(s1.ruleEngine.known.length >= 2);
  assert.ok(s1.ruleEngine.unknown.length >= 1 && s1.ruleEngine.unknown.every(u => u.resolved === false));
  assert.equal(s1.ruleEngine.providerUsed, false);
  assert.equal(s1.reading.singleDecisionOutput, false);
  assert.equal(readingContract.aiRequired, false);
  assert.equal(s1.navigation.automaticSelection, false);
  assert.ok(s1.navigation.options.length >= 2);
  assert.equal(navigationContract.rules.chooseForClient, false);
  assert.equal(navigationContract.rules.automaticSelection, false);
  assert.equal(s1.userChoice.selectedBy, 'CLIENT');
  assert.equal(s1.actionRecord.createdAfterUserChoice, true);
  assert.equal(s1.actionRecord.sourceOptionId, s1.userChoice.optionId);
  assert.equal(s1.actionRecord.executionAuthorityCreatedByFixture, false);
  assert.equal(s1.review.expectedSignal, s1.navigation.options.find(o => o.optionId === s1.userChoice.optionId)['expectedSignal']);
  assert.equal(s1.review.causalityClaimed, false);
  assert.equal(s1.realityNext.pastMutated, false);
  assert.equal(reviewContract.silentPastMutationAllowed, false);
  assert.equal(reviewContract.realityVNextRequiresPredecessor, true);
  assert.equal(reviewContract.realityVNextRequiresDiff, true);
  assert.equal(role.boundaries.allQuestionsDefaultToJourney, false);

  // Slice 2 — Complex Family Case
  const s2 = fixtureById.COMPLEX_FAMILY_CASE;
  assert.equal(s2.mode, 'COMPLEX_REALITY_CASE');
  assert.ok(s2.entities.length >= 3);
  assert.ok(s2.relationships.length >= 2);
  assert.ok(s2.events.length >= 3);
  assert.ok(new Set(s2.events.map(e => e.repeatedPatternId)).size === 1);
  assert.equal(s2.timeline.longTimeline, true);
  assert.ok(s2.sharedConstraints.length >= 1);
  assert.ok(s2.perspectives.length >= 3);
  assert.ok(new Set(s2.perspectives.map(p => p.sourceEntityId)).size === s2.perspectives.length);
  assert.ok(new Set(s2.perspectives.map(p => p.position)).size > 1);
  assert.ok(s2.relationships.every(r => r.source && r.inventedByAI === false));
  assert.ok(s2.events.every(e => e.sourceRef));
  assert.ok(s2.unknown.every(u => ['RELATIONSHIP', 'ENTITY'].includes(u.scopeType) && u.scopeId));
  assert.equal(s2.boundaries.mergePerspectivesIntoSingleFact, false);
  assert.equal(s2.boundaries.aiMayInventMissingRelationship, false);
  assert.ok(complex.requirements.includes('ATTRIBUTED_PERSPECTIVES'));
  assert.ok(complex.requirements.includes('NO_AI_INVENTED_GRAPH_EDGE'));
  for (const candidate of s2.candidateRuleScope) {
    const node = eligibility.entries.find(e => e.nodeCode === candidate.nodeCode);
    assert.ok(node, `${candidate.nodeCode} missing from eligibility registry`);
    assert.equal(node.publicationBookCode, candidate.bookCode);
    assert.equal(node.humanAcceptance.accepted, true);
    assert.equal(node.activeRule, false);
    assert.equal(candidate.ruleActivationRequested, false);
  }
  assert.equal(s2.candidateRuleScope.some(x => x.bookCode === 'BOOK-2' && x.scope === 'RELATIONAL'), true);
  assert.equal(s2.candidateRuleScope.some(x => x.bookCode === 'BOOK-3' && x.scope === 'MAINTENANCE'), true);

  // Slice 3 — Organization Case
  const s3 = fixtureById.ORGANIZATION_CASE;
  assert.equal(s3.scope, 'ORGANIZATION');
  assert.ok(s3.organization.roles.length >= 3);
  assert.ok(s3.resourceAllocation.length >= 1);
  assert.ok(s3.systemConstraints.some(c => c.type === 'INFRASTRUCTURE_CAPACITY'));
  assert.ok(s3.systemConstraints.every(c => c.personalIdentityAttribution === false));
  assert.ok(s3.objectives.length >= 2);
  assert.equal(s3.book4ContextGate.systemScaleEvidencePresent, true);
  assert.equal(s3.book4ContextGate.activationAllowedOnlyWithSystemScaleEvidence, true);
  assert.equal(s3.book4ContextGate.ruleBindingActivated, false);
  const book4Node = eligibility.entries.find(e => e.nodeCode === s3.book4ContextGate.candidateNodeCode);
  assert.ok(book4Node);
  assert.equal(book4Node.publicationBookCode, 'BOOK-4');
  assert.match(book4Node.classificationRationale, /system-scale/i);
  assert.equal(book4Node.activeRule, false);
  assert.equal(s3.professionalBoundary.businessJudgmentCreatedByRJX, false);
  assert.equal(s3.professionalBoundary.professionalConclusionCreatedByRJX, false);

  // Slice 4 — Method-assisted Case
  const s4 = fixtureById.METHOD_ASSISTED_CASE;
  const mcd1 = json('content/professional/method-client-delivery/registries/mcd-1-production-method-selection-v1.json');
  const mcd5 = json('content/professional/method-client-delivery/acceptance/mcd-5-canonical-projection-acceptance-v1.json');
  const provenance = json('content/runtime/journey-runtime/contracts/method-case-provenance-contract-v1.json');
  const handoff = json('content/runtime/journey-runtime/contracts/method-result-case-handoff-contract-v1.json');
  const successor = json('content/runtime/journey-runtime/contracts/method-result-successor-contract-v1.json');
  const hdr = json('content/runtime/journey-runtime/contracts/hdr-reality-boundary-contract-v1.json');
  const num = mcd1.methods.find(m => m.pluginCode === 'NUM');
  assert.ok(num);
  assert.equal(num.dispatchAllowedByMpa, true);
  assert.match(mcd5.methodStatus.NUM, /^PRODUCTION_CLIENT_/);
  assert.equal(s4.method.pluginCode, 'NUM');
  assert.equal(s4.method.dispatchAllowedByMpa, true);
  assert.equal(s4.method.resultClassification, 'CALCULATED');
  assert.equal(s4.method.rmoCompatibilityState, 'DERIVED');
  assert.equal(s4.method.sourceType, 'METHOD_CALCULATION');
  assert.equal(provenance.methodCalculationMayBeObserved, false);
  assert.equal(s4.handoff.observedEvidence, false);
  assert.equal(handoff.automaticPersistenceIntoCase, false);
  assert.equal(s4.consent.granted, true);
  assert.equal(s4.negativeControl.consentGranted, false);
  assert.equal(s4.negativeControl.handoffAllowed, false);
  assert.equal(s4.successor.methodVersionChanged, true);
  assert.equal(s4.successor.diffRequired, true);
  assert.equal(s4.successor.readingMutatedAutomatically, false);
  assert.equal(successor.silentOverwriteAllowed, false);
  assert.equal(successor.caseImpactCandidateAutomaticallyMutatesReading, false);
  assert.equal(hdr.guards.productionBlocked, true);
  assert.equal(hdr.guards.caseHandoffAllowed, false);
  assert.equal(hdr.guards.clientEvidenceAllowed, false);
  assert.equal(s4.hdr.productionBlocked, true);

  // Slice 5 — No-provider Production validation
  const s5 = fixtureById.NO_PROVIDER_PRODUCTION;
  const workersUnavailable = resolveJourneyProviderCostGate({requestedProvider:'workers_ai', providerEligible:true, providerAvailable:false, budgetReserved:true, usageTrackingReady:true, reservedUnits:1});
  const openAIUnavailable = resolveJourneyProviderCostGate({requestedProvider:'openai', explicitOpenAIOptIn:true, openAIEntitled:true, providerEligible:true, providerAvailable:false, budgetReserved:true, usageTrackingReady:true, reservedUnits:1});
  assert.equal(workersUnavailable.selectedProvider, 'rule_engine');
  assert.equal(openAIUnavailable.selectedProvider, 'rule_engine');
  assert.equal(workersUnavailable.providerFailureBlocksBaseJourney, false);
  assert.equal(openAIUnavailable.providerFailureBlocksBaseJourney, false);
  assert.deepEqual(s5.trace.map(x => x.step), ['Entry','Understand','Reading','Choose','Action','Review','Reality Next']);
  assert.ok(s5.trace.every(x => x.completed === true));
  assert.equal(s5.providers.workersAIAvailable, false);
  assert.equal(s5.providers.openAIAvailable, false);
  assert.equal(s5.providers.modelRequestCount, 0);
  assert.equal(s5.providers.selectedProvider, 'rule_engine');
  assert.equal(s5.reading.ruleOnly, true);
  assert.equal(s5.reading.modelRequired, false);
  assert.equal(s5.realityNext.pastMutated, false);

  console.log('✓ RJX Section 12 Minimum Vertical Slices passed: 5 evidence-bound validation slices prove simple, family, organization, method-assisted and no-provider semantics without activating new Runtime authority.');
}

function checkMetrics() {
  const metrics = json(PATHS.metrics);
  assert.equal(metrics.baselineCommit, baseline);
  assert.equal(metrics.status, 'OPERATIONAL_DEFINITIONS_READY_PRODUCTION_VALUES_NOT_FABRICATED');
  verifyPredecessor(metrics.predecessor);
  assert.equal(metrics.measurementBoundary.productionTelemetryRequiredForValues, true);
  assert.equal(metrics.measurementBoundary.syntheticProductionValuesAllowed, false);
  assert.equal(metrics.measurementBoundary.caseContentInMetricsPayloadAllowed, false);
  const expectedProduct = ['journeyEligibilityRate','simpleCaseRate','complexCaseRate','firstMeaningfulResultLatency','UnderstandCompletionRate','ChooseCompletionRate','ReviewReturnRate','RealityNextCreationRate','professionalHandoffRate'];
  const expectedRule = ['ruleCoverageRate','ruleOnlyCompletionRate','unknownPreservationRate','counterEvidenceRetentionRate','nodeRuleTraceabilityRate','humanOverrideRate','ruleConflictRate'];
  const expectedAI = ['zeroModelRequestRate','workersAIRequestRate','workersAIAcceptedCandidateRate','workersAIMeteredCost','openAIRequestRate','openAIAcceptedCandidateRate','openAICost','providerFallbackRate','providerValidationFailureRate','costPerCompletedJourney'];
  const expectedSafety = ['observedEvidenceMutationCount','unknownFillCount','methodObservedMutationCount','HDRLeakCount','professionalBoundaryViolationCount','silentVersionOverwriteCount','untraceableReadingClaimCount','automaticIrreversibleActionCount'];
  assert.deepEqual(metrics.productMetrics.map(m => m.name), expectedProduct);
  assert.deepEqual(metrics.ruleMetrics.map(m => m.name), expectedRule);
  assert.deepEqual(metrics.aiCostMetrics.map(m => m.name), expectedAI);
  assert.deepEqual(metrics.safetyMetrics.map(m => m.name), expectedSafety);
  for (const group of [metrics.productMetrics, metrics.ruleMetrics, metrics.aiCostMetrics]) {
    assert.ok(group.every(m => m.definition && m.source && m.productionValue === null));
  }
  assert.ok(metrics.safetyMetrics.every(m => m.target === 0 && m.zeroIsRequired === true && m.productionValue === null));
  assert.equal(fs.existsSync(metrics.providerUsageLedgerSchema), true);
  assert.equal(fs.existsSync(metrics.journeyEventRegistry), true);
  console.log('✓ RJX Section 13 Metrics passed: all requested Product, Rule, AI/Cost and Safety metrics have operational definitions; Safety targets are 0 and no production values are fabricated.');
}

function checkFinalAcceptance() {
  const acceptance = json(PATHS.final);
  assert.equal(acceptance.baselineCommit, baseline);
  assert.equal(acceptance.status, 'TECHNICAL_NON_NEGOTIABLES_EVIDENCED_FINAL_PRODUCTION_ACCEPTANCE_BLOCKED');
  const t = acceptance.technicalEvidence;

  const role = json('content/runtime/journey-runtime/contracts/reality-journey-role-contract-v1.json');
  const stages = json('content/runtime/journey-runtime/registries/client-stage-projection-registry-v1.json');
  const workspace = json('content/runtime/journey-runtime/contracts/reality-workspace-contract-v1.json');
  const authority = json('content/runtime/journey-runtime/audits/rjx-w1-runtime-authority-reconciliation-v1.json');
  const books = json('content/knowledge/migrations/book-w1-five-volume-acceptance-v1.json');
  const nodes = json('content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json');
  const eligibility = json('content/runtime/journey-runtime/registries/canonical-node-rule-eligibility-v1.json');
  const bindings = json('content/runtime/journey-runtime/registries/canonical-node-rule-binding-candidates-v1.json');
  const knowledgeBoundary = json('content/runtime/journey-runtime/contracts/knowledge-reality-reading-boundary-v1.json');
  const provenance = json('content/runtime/journey-runtime/contracts/method-case-provenance-contract-v1.json');
  const handoff = json('content/runtime/journey-runtime/contracts/method-result-case-handoff-contract-v1.json');
  const hdr = json('content/runtime/journey-runtime/contracts/hdr-reality-boundary-contract-v1.json');
  const unknown = json('content/runtime/journey-runtime/contracts/journey-unknown-integration-contract-v1.json');
  const provider = json('content/runtime/journey-runtime/policies/rjx-provider-cost-policy-v1.json');
  const routes = json('content/runtime/journey-runtime/compatibility/rjx-route-compatibility-v1.json');
  const prod = json('content/runtime/journey-runtime/acceptance/rjx-production-acceptance-v1.json');
  const action = json('content/runtime/reality-model-runtime/contracts/action-runtime-contract-v1.json');
  const outcome = json('content/runtime/reality-model-runtime/contracts/outcome-runtime-contract-v1.json');
  const versioning = json('content/runtime/reality-model-runtime/contracts/reality-versioning-contract-v1.json');
  const diff = json('content/runtime/reality-model-runtime/contracts/reality-diff-contract-v1.json');
  const nav = json('content/runtime/journey-runtime/contracts/navigation-projection-contract-v1.json');
  const human = json('content/runtime/journey-runtime/acceptance/rjx-human-acceptance-v1.json');

  assert.equal(role.boundaries.allQuestionsDefaultToJourney, false);
  assert.equal(t.realityJourneyDefaultForAllQuestions, false);
  assert.equal(stages.canonicalBackendOrder.length, 8);
  assert.equal(stages.clientStages.length, 3);
  assert.equal(t.backendStateCount, 8);
  assert.equal(t.clientStageCount, 3);
  assert.equal(workspace.canonicalRouteCandidate, '/reality/');
  assert.equal(routes.canonicalWorkspaceRoute, '/reality/');
  assert.equal(t.canonicalWorkspaceTarget, '/reality/');
  assert.equal(workspace.routeActivated, false);
  assert.equal(t.canonicalWorkspaceProductionActivated, false);

  const authorityCodes = new Set(authority.upstreamAuthorities.map(a => a.code));
  for (const code of t.preservedAuthorities) assert.ok(authorityCodes.has(code), `${code} upstream authority missing`);
  for (const a of authority.upstreamAuthorities) {
    assert.equal(fs.existsSync(a.reference), true, `${a.reference} missing`);
    assert.equal(sha256(a.reference), a.sha256, `${a.code} authority digest drift`);
  }

  assert.equal(books.canonicalArchitecture.bookCount, 5);
  assert.equal(books.canonicalArchitecture.canonicalNodeCount, 931);
  assert.equal(nodes.nodes.length, 931);
  assert.equal(nodes.accounting.ungovernedNodeCodeMutationCount, 0);
  assert.equal(t.canonicalBookCount, 5);
  assert.equal(t.canonicalNodeCount, 931);
  assert.equal(t.canonicalNodeMutationCount, 0);
  assert.equal(eligibility.accounting.automaticActiveRuleCount, 0);
  assert.equal(eligibility.accounting.humanAcceptedBindingCount, 0);
  assert.equal(bindings.accounting.activeRuleCount, 0);
  assert.equal(t.automaticNodeRuleActivationCount, 0);
  assert.equal(t.activeRuleCount, 0);
  assert.equal(t.activeRuleBindingsNotHumanAcceptedCount, 0);
  const nodeCodes = new Set(nodes.nodes.map(n => n.nodeCode));
  assert.ok(bindings.bindings.every(b => Array.isArray(b.sourceNodeCodes) && b.sourceNodeCodes.length >= 1 && b.sourceNodeCodes.every(code => nodeCodes.has(code))));

  assert.notEqual(knowledgeBoundary.separation.knowledge.authority, knowledgeBoundary.separation.realityReading.authority);
  assert.equal(t.knowledgeEqualsRealityReading, false);
  assert.equal(provenance.methodCalculationMayBeObserved, false);
  assert.equal(t.methodCalculationMayBeObservedEvidence, false);
  assert.equal(handoff.automaticPersistenceIntoCase, false);
  assert.equal(t.personalRuntimeMayEnterCaseWithoutConsent, false);
  assert.equal(hdr.guards.productionBlocked, true);
  assert.equal(hdr.guards.caseHandoffAllowed, false);
  assert.equal(t.hdrClientProductionAllowed, false);
  assert.equal(unknown.rules.aiMayAnswerUnknown, false);
  assert.equal(unknown.rules.aiMayInferMissingFact, false);
  assert.equal(t.unknownMayBeAIFilled, false);

  assert.equal(provider.default.initialResult, 'RULE_ENGINE_ONLY');
  assert.equal(provider.default.initialReadingModelAllowed, false);
  assert.equal(provider.runtimeEntry.openAIDefaultAllowed, false);
  assert.equal(provider.workersAI.atomicBudgetReservationRequired, true);
  assert.equal(provider.workersAI.usageTrackingRequired, true);
  assert.equal(provider.modelOutput.authority, 'CANDIDATE_ONLY');
  assert.equal(t.initialReading, 'RULE_ENGINE_ONLY');
  assert.equal(t.defaultOpenAICallCount, 0);
  assert.equal(t.workersAIMeteredAndBudgetGovernedWhenEnabled, true);
  assert.equal(t.modelOutputAuthority, 'CANDIDATE_ONLY');
  assert.equal(t.baseJourneyWorksWithNoModelProvider, true);

  assert.equal(routes.accounting.brokenDeepLinkCount, 0);
  assert.equal(routes.accounting.duplicateActiveWriteAuthorityCount, 0);
  assert.equal(prod.uxAcceptance.forcedPageHopping, false);
  assert.equal(versioning.rules.previousSnapshotImmutable, true);
  assert.equal(diff.rules.sameRealityIdentityRequired, true);
  assert.equal(prod.technicalAcceptance.brokenRealityVersionLineageCount, 0);
  assert.equal(action.rules.actionMayCreateProfessionalRecommendation, false);
  assert.equal(outcome.rules.outcomeMayCreatePrOutcomeRecord, false);
  assert.equal(nav.rules.professionalHandoffWhenRequired, true);
  assert.equal(t.brokenLegacyRouteCount, 0);
  assert.equal(t.forcedPageHopping, false);
  assert.equal(t.duplicateActiveRuntimeWriteAuthorityCount, 0);
  assert.equal(t.silentVersionOverwriteCount, 0);
  assert.equal(t.brokenRealityLineageCount, 0);
  assert.equal(t.ungovernedProfessionalConclusionCount, 0);

  // Final acceptance must remain fail-closed until the existing production gates are actually satisfied.
  assert.equal(human.status, 'PENDING_TL_HUMAN_REVIEW');
  assert.equal(acceptance.productionBlockingGates.tlHumanReviewPackagesAccepted, false);
  assert.equal(acceptance.productionBlockingGates.canonicalWorkspaceProductionActivated, false);
  assert.equal(acceptance.productionBlockingGates.browserAcceptancePassed, false);
  assert.equal(acceptance.productionBlockingGates.productionProviderBudgetAndLedgerIntegrated, false);
  assert.equal(acceptance.productionBlockingGates.productionRuntimeConsumptionIntegrated, false);
  assert.equal(acceptance.productionBlockingGates.fullNpmRunCheckEvidenceAtThisRecord, false);
  assert.equal(acceptance.finalAcceptanceAllowed, false);
  assert.equal(acceptance.globalProductionFreezeDeclared, false);

  console.log('✓ RJX Section 14 Final Non-Negotiable Acceptance passed fail-closed: technical invariants are evidenced; Human/browser/provider/canonical-route/full-check gates remain explicit blockers, so no final Production Freeze is synthesized.');
}

function checkAuthorization() {
  const a = json(PATHS.authorization);
  assert.equal(a.baselineCommit, baseline);
  assert.equal(a.status, 'REFERENCE_SCOPE_ONLY_NOT_NEW_HUMAN_AUTHORIZATION');
  assert.deepEqual(a.recommendedScope, ['RJX-W0-W3 candidate implementation','931 Canonical Node Rule Eligibility Audit','Runtime Entry OpenAI explicit opt-in repair candidate']);
  for (const prohibited of ['activate_node_to_rule_bindings','delete_legacy_pages','activate_reality_canonical_redirect','modify_frozen_runtime_enum','automatic_method_result_case_entry','hdr_client_production','final_freeze']) assert.ok(a.prohibited.includes(prohibited));
  assert.equal(a.interpretation.currentMessageIsAuthorization, false);
  assert.equal(a.interpretation.humanAcceptanceSynthesized, false);
  assert.equal(a.interpretation.ruleBindingActivationAuthorized, false);
  assert.equal(a.interpretation.finalFreezeAuthorized, false);
  assert.equal(a.currentRepositoryReconciliation.activeRuleCount, 0);
  assert.equal(a.currentRepositoryReconciliation.runtimeEntryRepairRemainsCandidate, true);
  console.log('✓ RJX Section 15 Recommended First Authorization scope reconciled as reference-only; it is not misread as a new TL Human Acceptance, rule activation, route activation or freeze authorization.');
}

function checkManifest() {
  const m = json(PATHS.manifest);
  assert.equal(m.baselineCommit, baseline);
  assert.equal(m.status, 'READ_ONLY_FINAL_EVIDENCE_SUCCESSOR');
  verifyPredecessor(m.predecessor);
  for (const cmd of ['check:rjx-minimum-slices','check:rjx-metrics','check:rjx-final-acceptance','check:rjx-authorization-scope','check:rjx-package-f','check:rjx','check']) assert.ok(m.commands.includes(cmd));
  assert.ok(Object.values(m.checkerMutationPolicy).every(v => v === false));
  assert.equal(m.finalStatePolicy.humanAcceptanceMayBeSynthesized, false);
  assert.equal(m.finalStatePolicy.globalFreezeMayBeSynthesized, false);
  const p = json(PATHS.package);
  assert.equal(p.baselineCommit, baseline);
  assert.equal(p.historicalProtectedFilesMutated, false);
  assert.equal(p.newRuntimeAuthorityCreated, false);
  assert.equal(p.newRuleBindingActivated, false);
  assert.equal(p.humanAcceptanceSynthesized, false);
  assert.equal(p.finalFreezeSynthesized, false);
  for (const artifact of p.artifacts) assert.equal(fs.existsSync(artifact), true, `${artifact} missing`);
  console.log('✓ RJX final evidence successor manifest passed: Package F extends the read-only checker chain without mutating Package E protected history.');
}

const checks = {
  SLICES: checkSlices,
  METRICS: checkMetrics,
  FINAL: checkFinalAcceptance,
  AUTHORIZATION: checkAuthorization,
  MANIFEST: checkManifest
};

if (requested === 'ALL') {
  checkSlices();
  checkMetrics();
  checkFinalAcceptance();
  checkAuthorization();
  checkManifest();
  console.log('✓ RJX Package F Sections 12–15 technical evidence passed; final production acceptance remains correctly fail-closed.');
} else {
  assert.ok(checks[requested], `Unknown RJX final evidence check: ${requested}`);
  checks[requested]();
}
