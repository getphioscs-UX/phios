import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const j = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => assert.ok(fs.existsSync(p), `missing file: ${p}`);
const BASE = 'b872c4463c3e34e180cea53061c1ddc8e5b6f92c';
const basePath = 'content/interpretation/tarot/reconciliation/tarot-product-activation-baseline-v1.json';
const predPath = 'content/interpretation/tarot/reconciliation/tarot-product-activation-predecessor-map-v1.json';
const scopePath = 'content/production/symbolic-method/contracts/tarot-product-activation-scope-v1.json';
const accPath = 'content/production/symbolic-method/acceptance/tarot-product-activation-phase-a-acceptance-v1.json';

for (const p of [basePath, predPath, scopePath, accPath]) exists(p);
const baseline = j(basePath), pred = j(predPath), scope = j(scopePath), acc = j(accPath);
for (const x of [baseline, pred, scope, acc]) assert.equal(x.baselineCommit, BASE);

// TPA-W0 — resolve current Tarot authority without granting activation.
assert.equal(baseline.status, 'CURRENT_AUTHORITY_RECONCILED_ACTIVATION_NOT_GRANTED');
assert.deepEqual(baseline.canonicalIdentity, {methodCode:'TAROT', pluginCode:'TAR', projectionType:'CARD'});
for (const section of Object.values(baseline.currentAuthorityResolution)) {
  if (!section || typeof section !== 'object') continue;
  for (const [k,v] of Object.entries(section)) {
    if (k.toLowerCase().endsWith('sha256')) continue;
    if ((k === 'path' || k.endsWith('Registry') || k.endsWith('Pointer') || k.endsWith('Boundary') || k.endsWith('State') || k.endsWith('Acceptance') || k.endsWith('Manifest') || k.endsWith('Freeze') || k.endsWith('Current') || k.endsWith('Contract')) && typeof v === 'string' && v.includes('/')) exists(v);
  }
}
const ma = baseline.currentAuthorityResolution.methodRegistry;
assert.equal(sha(ma.path), ma.sha256);
const mr3 = j(ma.path), mr2 = j(ma.predecessor);
assert.equal(mr3.registryCode, 'METHOD_REGISTRY_V3');
assert.equal(mr3.predecessor, ma.predecessor);
const tar3 = mr3.methods.filter(x => x.methodCode === 'TAROT');
const tar2 = mr2.methods.filter(x => x.methodCode === 'TAROT');
assert.equal(tar3.length, 1); assert.equal(tar2.length, 1);
assert.deepEqual(tar3[0], tar2[0], 'Tarot identity/state drifted between method registry v2 and v3');
assert.equal(tar3[0].pluginCode, 'TAR');
assert.equal(tar3[0].productionEligible, false);
assert.equal(tar3[0].professionalEligible, false);

const identity = j(baseline.currentAuthorityResolution.structuralIdentity.path);
assert.equal(sha(baseline.currentAuthorityResolution.structuralIdentity.path), baseline.currentAuthorityResolution.structuralIdentity.sha256);
assert.equal(identity.status, 'RECONCILED_EXISTING_IDENTITY_NO_SECOND_AUTHORITY');
assert.deepEqual(identity.canonicalIdentity, {methodCode:'TAROT', pluginCode:'TAR', projectionType:'CARD'});
assert.equal(identity.rules.newMethodIdentityCreated, false);
assert.equal(identity.rules.newPluginIdentityCreated, false);
assert.equal(identity.rules.newProjectionTypeCreated, false);

const cards = j(baseline.currentAuthorityResolution.cardRegistry.path);
assert.equal(sha(baseline.currentAuthorityResolution.cardRegistry.path), baseline.currentAuthorityResolution.cardRegistry.sha256);
const cardEntries = cards.cards ?? cards.entries ?? [];
assert.equal(cardEntries.length, 78, 'Tarot canonical card registry must remain 78 cards');
assert.equal(new Set(cardEntries.map(x => x.cardId)).size, 78, 'duplicate Tarot cardId');

const runtime = baseline.currentAuthorityResolution.structuralRuntime;
for (const [pathKey, shaKey] of [['manifest','manifestSha256'],['state','stateSha256'],['freeze','freezeSha256']]) assert.equal(sha(runtime[pathKey]), runtime[shaKey], `${pathKey} digest drift`);
const runtimeState = j(runtime.state), runtimeManifest = j(runtime.manifest);
assert.equal(runtimeState.status, 'STRUCTURAL_RUNTIME_IMPLEMENTED_NOT_ACTIVATED');
assert.equal(runtimeState.currentState.structuralSelectionRuntime, 'IMPLEMENTED_FROZEN_V1');
assert.equal(runtimeState.currentState.structuralCalculationRuntime, 'IMPLEMENTED_FROZEN_V1');
assert.equal(runtimeState.currentState.productionActivation, 'NOT_ACTIVATED');
assert.equal(runtimeManifest.activation.productionExecutionAllowed, false);
assert.equal(runtimeManifest.activation.publicExecutionAllowed, false);
assert.equal(runtimeManifest.activation.professionalExecutionAllowed, false);

const projection = baseline.currentAuthorityResolution.projectionAuthority;
assert.equal(sha(projection.path), projection.sha256);
assert.equal(projection.secondProjectionRuntimeCreated, false);

const interp = baseline.currentAuthorityResolution.interpretationAuthority;
assert.equal(sha(interp.globalBoundary), interp.globalBoundarySha256);
assert.equal(sha(interp.tarotState), interp.tarotStateSha256);
assert.equal(sha(interp.tarotAcceptance), interp.tarotAcceptanceSha256);
const tariState = j(interp.tarotState), tariAcceptance = j(interp.tarotAcceptance);
assert.equal(tariState.authority.secondTarotIdentityCreated, false);
assert.equal(tariState.authority.secondInterpretationRuntimeAuthorityCreated, false);
assert.equal(tariState.authority.productionActivationGranted, false);
assert.equal(tariState.authority.publicActivationGranted, false);
assert.equal(tariAcceptance.status, 'ACCEPTED_VALIDATION_ONLY');
assert.equal(tariAcceptance.production.activated, false);
assert.equal(tariAcceptance.production.publicRunAllowed, false);

const pcmInfo = baseline.currentAuthorityResolution.productionCapability;
assert.equal(sha(pcmInfo.currentRegistry), pcmInfo.currentRegistrySha256);
assert.equal(sha(pcmInfo.currentPointer), pcmInfo.currentPointerSha256);
const pcmPointer = j(pcmInfo.currentPointer), pcm = j(pcmInfo.currentRegistry);
assert.equal(pcmPointer.currentRegistry, pcmInfo.currentRegistry);
const tarPcm = pcm.capabilities.find(x => x.methodRuntime?.methodCode === 'TAROT');
assert.ok(tarPcm, 'missing Tarot PCM entry');
assert.equal(tarPcm.classification, 'REGISTERED_NOT_IMPLEMENTED');
assert.equal(tarPcm.capabilityAvailability, 'COMING_LATER');
assert.equal(tarPcm.userExecutable, false);
assert.equal(tarPcm.productionAccepted, false);

const candidateInfo = baseline.currentAuthorityResolution.productionCandidateEvidence;
assert.equal(sha(candidateInfo.path), candidateInfo.sha256);
const candidate = j(candidateInfo.path).methods.TAROT;
assert.equal(candidate.implemented, true);
assert.equal(candidate.localMachineCandidateValidated, true);
assert.equal(candidate.executable, false);
assert.equal(candidate.productionAccepted, false);
assert.equal(candidate.targetAfterAcceptance, 'LIMITED_PRODUCTION');
assert.equal(baseline.reconciliationFindings.candidateImplementationDoesNotOverrideCurrentPcm, true);

const publicInfo = baseline.currentAuthorityResolution.publicProjection;
assert.equal(sha(publicInfo.path), publicInfo.sha256);
const publicCatalog = j(publicInfo.path);
const publicTarot = publicCatalog.methods.find(x => x.methodCode === 'TAROT');
assert.ok(publicTarot); assert.equal(publicTarot.runAllowed, false);

const ctx = baseline.currentAuthorityResolution.currentContextBoundary;
assert.equal(sha(ctx.multiLensCurrent), ctx.multiLensCurrentSha256);
assert.equal(sha(ctx.lensRegistry), ctx.lensRegistrySha256);
assert.equal(sha(ctx.currentContextSnapshotContract), ctx.currentContextSnapshotContractSha256);
const multiLensCurrent = j(ctx.multiLensCurrent), lensRegistry = j(ctx.lensRegistry);
assert.equal(multiLensCurrent.contextCompositionActivated, true);
assert.equal(multiLensCurrent.runtimeExecutionOrchestrationActivated, false);
assert.equal(ctx.tarotLensRoutableInPhaseA, false);
const lenses = lensRegistry.lenses ?? lensRegistry.entries ?? [];
assert.ok(!lenses.some(x => JSON.stringify(x).includes('TAROT')), 'Phase A must not silently register Tarot as a routed lens');

assert.equal(baseline.authorityCardinality.currentTarotMethodIdentityAuthorityCount, 1);
assert.equal(baseline.authorityCardinality.currentTarotStructuralRuntimeAuthorityCount, 1);
assert.equal(baseline.authorityCardinality.currentTarotInterpretationStateAuthorityCount, 1);
assert.equal(baseline.authorityCardinality.currentSharedProjectionAuthorityCount, 1);
assert.equal(baseline.authorityCardinality.duplicateCurrentTarotAuthorityDetected, false);
assert.equal(baseline.phaseAResult.productActivationGranted, false);
assert.equal(baseline.phaseAResult.runAllowedChanged, false);
assert.equal(baseline.phaseAResult.productionCapabilityPromoted, false);

// TPA-W1 — every predecessor is digest-pinned and immutable in this batch.
assert.equal(pred.status, 'FROZEN_PREDECESSOR_MAP_SUCCESSOR_ONLY');
assert.ok(pred.lineage.length >= 15);
const roles = new Set();
for (const item of pred.lineage) {
  exists(item.path);
  assert.equal(sha(item.path), item.sha256, `predecessor drift: ${item.role}`);
  assert.ok(!roles.has(item.role), `duplicate predecessor role: ${item.role}`);
  roles.add(item.role);
}
for (const required of ['TAR_W11_STRUCTURAL_FREEZE','TARI_W0_W6_ACCEPTANCE','PHASE10_PUBLIC_UX_ACCEPTANCE','PHASE11_TAROT_MACHINE_CANDIDATE','PHASE11_TAROT_HUMAN_REVIEW_CAMPAIGN','CURRENT_PCM_V6','CURRENT_PUBLIC_METHOD_CATALOG_V2','CURRENT_CONTEXT_SUCCESSOR_MASTER7']) assert.ok(roles.has(required), `missing predecessor role ${required}`);
assert.equal(pred.rules.predecessorMutationAllowed, false);
assert.equal(pred.rules.historicalStatusRewriteAllowed, false);
assert.equal(pred.rules.successorOnly, true);
assert.equal(pred.rules.phaseAChangesRunAllowed, false);
assert.equal(pred.rules.phaseAChangesProductionCapability, false);

// TPA-W2 — self-serve reflective product scope, not divination or professional authority.
assert.equal(scope.status, 'FROZEN_PHASE_A_SCOPE_NO_ACTIVATION');
assert.equal(scope.product.productCode, 'TAROT_SYMBOLIC_REFLECTIVE_RUNTIME');
assert.equal(scope.product.deliveryMode, 'SELF_SERVE_SYMBOLIC_PRODUCT');
assert.equal(scope.product.targetProductionClassification, 'LIMITED_PRODUCTION');
for (const allowed of ['SYMBOLIC_PROJECTION','SOURCE_BOUND_INTERPRETIVE_PERSPECTIVE','REALITY_COMPARISON','UNCERTAINTY_PRESERVATION','USER_AGENCY_HANDOFF']) assert.ok(scope.allowedAuthority.includes(allowed));
for (const forbidden of ['OBJECTIVE_FUTURE_PREDICTION','HIDDEN_FACT_CONFIRMATION','PSYCHOLOGICAL_DIAGNOSIS','MEDICAL_DIAGNOSIS_OR_TREATMENT','FINANCIAL_RECOMMENDATION_AUTHORITY','LEGAL_CONCLUSION_AUTHORITY','PROFESSIONAL_JUDGMENT_AUTHORITY']) assert.ok(scope.forbiddenAuthority.includes(forbidden));
assert.equal(scope.selfServeBoundary.professionalTarotServiceActivated, false);
assert.equal(scope.phaseAPermissions.changeRunAllowed, false);
assert.equal(scope.phaseAPermissions.promotePcm, false);
assert.equal(scope.phaseAPermissions.fabricateHumanAcceptance, false);
assert.equal(scope.phaseAPermissions.claimLiveBrowserAcceptance, false);
assert.equal(scope.phaseAPermissions.claimLiveProductionShaAlignment, false);
assert.equal(scope.currentArchitectureBoundary.lensRouterRegistrationGranted, false);
assert.equal(scope.currentArchitectureBoundary.currentContextRuntimeConsumptionGranted, false);
assert.equal(scope.currentArchitectureBoundary.askPhiOsAutomaticTarotInvocationGranted, false);
assert.equal(scope.publicLanguageBoundary.fortuneTellingPositioningAllowed, false);
assert.equal(scope.publicLanguageBoundary.predictionPositioningAllowed, false);

assert.equal(acc.status, 'ACCEPTED_CURRENT_AUTHORITY_RECONCILIATION_NO_ACTIVATION');
for (const [k,v] of Object.entries(acc.accepted)) assert.equal(v, true, `${k} not accepted`);
assert.equal(acc.nextPhase, 'PHASE_B_TAROT_SOURCE_CORPUS_GOVERNANCE');

const pkg = j('package.json');
assert.equal(pkg.scripts['check:tarot-product-activation-phase-a'], 'node scripts/check-tarot-product-activation-phase-a.mjs');
console.log('✓ TPA PHASE A / TPA-W0–W2 passed: current Tarot authority reconciled at b872c44, frozen predecessors digest-pinned, and self-serve reflective activation scope frozen without granting execution.');
console.log('  Structural TAR + TARI are preserved as implemented/validated predecessors; PCM/public catalog remain fail-closed and runAllowed remains false.');
console.log('  METHOD_REGISTRY_V3 is the current registry; the unchanged TAROT v2 lineage and pre-activation PCM v2 reference are recorded as expected successor drift, not silently rewritten.');
