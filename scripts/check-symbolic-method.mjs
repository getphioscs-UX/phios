import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const exists = p => fs.existsSync(p);

const ROOT = 'content/professional/symbolic-method';
const categoryPath = 'content/professional/method-production-activation/successors/method-registry-symbolic-category-successor-v1.json';
const methodRegistryPath = 'content/professional/method-production-activation/registries/method-registry-v2.json';
const projectionRuntimePath = 'content/professional/method-runtime/shared-projection-runtime-v1.json';
const projectionSchemaPath = 'content/professional/method-runtime/canonical-projection-v1.schema.json';

for (const p of [
  categoryPath,
  `${ROOT}/authority/symbolic-method-authority-contract-v1.json`,
  `${ROOT}/contracts/symbolic-method-projection-contract-v1.json`,
  `${ROOT}/contracts/symbolic-method-evidence-contract-v1.json`,
  `${ROOT}/schemas/symbolic-method-evidence-v1.schema.json`,
  `${ROOT}/contracts/symbolic-method-determinism-boundary-v1.json`,
  `${ROOT}/contracts/symbolic-method-interpretation-contract-v1.json`,
  `${ROOT}/contracts/symbolic-method-reality-integration-contract-v1.json`,
  `${ROOT}/contracts/symbolic-method-language-contract-v1.json`,
  `${ROOT}/acceptance/symbolic-method-w0-w8-acceptance-v1.json`
]) assert.ok(exists(p), `Missing SYM artifact: ${p}`);

const category = readJson(categoryPath);
const methodRegistry = readJson(methodRegistryPath);
assert.equal(category.work, 'SYM-W0');
assert.equal(category.status, 'ACTIVE_CLASSIFICATION_SUCCESSOR_NO_PRODUCTION_GRANT');
assert.equal(category.predecessor.path, methodRegistryPath);
assert.equal(category.predecessor.sha256, sha256(methodRegistryPath));
assert.equal(category.predecessorMutationAllowed, undefined);
assert.equal(category.extensionAuthority.predecessorMutationAllowed, false);
assert.equal(category.extensionAuthority.createsSecondMethodRegistryAuthority, false);
assert.equal(category.extensionAuthority.productionGrantAllowed, false);
assert.deepEqual(category.categories, ['SYMBOLIC_REFLECTION']);
assert.deepEqual(category.forbiddenCategoryLabels, ['FORTUNE_TELLING']);
assert.equal(category.rules.symbolicReflectionEqualsFortuneTelling, false);

for (const [methodCode, pluginCode, projectionType] of [
  ['I_CHING', 'ICH', 'HEXAGRAM'],
  ['TAROT', 'TAR', 'CARD']
]) {
  const base = methodRegistry.methods.find(x => x.methodCode === methodCode);
  assert.ok(base, `${methodCode} missing from canonical Method Registry v2`);
  assert.equal(base.pluginCode, pluginCode);
  assert.equal(base.state, 'REGISTERED');
  assert.equal(base.productionEligible, false);
  assert.equal(base.professionalEligible, false);
  const ext = category.categoryEntries.find(x => x.methodCode === methodCode);
  assert.ok(ext, `${methodCode} missing symbolic category extension`);
  assert.equal(ext.pluginCode, pluginCode);
  assert.equal(ext.methodCategory, 'SYMBOLIC_REFLECTION');
  assert.equal(ext.predecessorState, 'REGISTERED');
  assert.equal(ext.productionEligible, false);
  assert.equal(ext.projectionType, projectionType);
}
assert.ok(!category.categoryEntries.some(x => x.methodCategory === 'FORTUNE_TELLING'));
console.log('✓ SYM-W0 Method Category passed: I_CHING/TAROT are SYMBOLIC_REFLECTION via a non-mutating Method Registry successor extension; no production grant.');

const authority = readJson(`${ROOT}/authority/symbolic-method-authority-contract-v1.json`);
assert.equal(authority.work, 'SYM-W1');
assert.equal(authority.status, 'FROZEN_SHARED_BOUNDARY');
assert.deepEqual(authority.mayProduce, ['METHOD_EVIDENCE','CANONICAL_PROJECTION','SYMBOLIC_DIMENSIONS','INTERPRETATION_CANDIDATES']);
for (const v of ['REALITY_TRUTH','GUARANTEED_FUTURE','FATE','MEDICAL_TRUTH','LEGAL_TRUTH','FINANCIAL_CERTAINTY','PROFESSIONAL_JUDGMENT']) {
  assert.ok(authority.mayNotProduce.includes(v), `SYM-W1 missing forbidden authority: ${v}`);
}
assert.equal(authority.invariants.symbolicOutputEqualsObservedFact, false);
assert.equal(authority.invariants.interpretationEqualsPrediction, false);
assert.equal(authority.invariants.methodProjectionEqualsRealityTruth, false);
assert.equal(authority.invariants.aiCompositionEqualsCalculationAuthority, false);
assert.equal(authority.invariants.aiInterpretationEqualsDecisionAuthority, false);
assert.equal(authority.invariants.userChoiceAuthorityRetained, true);
console.log('✓ SYM-W1 Authority Boundary passed: symbolic output cannot become reality/future/fate/professional truth.');

const projection = readJson(`${ROOT}/contracts/symbolic-method-projection-contract-v1.json`);
const sharedProjection = readJson(projectionRuntimePath);
const canonicalProjectionSchema = readJson(projectionSchemaPath);
assert.equal(projection.work, 'SYM-W2');
assert.equal(projection.projectionAuthority.runtimePath, projectionRuntimePath);
assert.equal(projection.projectionAuthority.sha256, sha256(projectionRuntimePath));
assert.equal(projection.projectionAuthority.schemaPath, projectionSchemaPath);
assert.equal(projection.projectionAuthority.schemaSha256, sha256(projectionSchemaPath));
assert.deepEqual(sharedProjection.projectionTypes.I_CHING, ['HEXAGRAM']);
assert.deepEqual(sharedProjection.projectionTypes.TAROT, ['CARD']);
assert.ok(canonicalProjectionSchema.properties.projectionType.enum.includes('HEXAGRAM'));
assert.ok(canonicalProjectionSchema.properties.projectionType.enum.includes('CARD'));
assert.equal(projection.runtimePolicy.newIChingProjectionRuntimeCreated, false);
assert.equal(projection.runtimePolicy.newTarotProjectionRuntimeCreated, false);
assert.equal(projection.runtimePolicy.sharedProjectionRuntimeReused, true);
const projectionRuntimeNameCollisions = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/i[-_]?ching.*projection.*runtime|tarot.*projection.*runtime/i.test(ent.name)) projectionRuntimeNameCollisions.push(p.replaceAll('\\','/'));
  }
}
walk('content'); walk('functions');
assert.deepEqual(projectionRuntimeNameCollisions, [], `Dedicated symbolic projection runtime collision: ${projectionRuntimeNameCollisions.join(', ')}`);
console.log('✓ SYM-W2 Shared Projection passed: existing I_CHING→HEXAGRAM and TAROT→CARD authority is reused; no dedicated projection runtime exists.');

const evidence = readJson(`${ROOT}/contracts/symbolic-method-evidence-contract-v1.json`);
const evidenceSchema = readJson(`${ROOT}/schemas/symbolic-method-evidence-v1.schema.json`);
assert.equal(evidence.work, 'SYM-W3');
assert.deepEqual(evidence.requiredFields, ['methodId','sessionId','inputMode','selectionMode','selectionEvidence','timestamp','runtimeVersion','projectionVersion']);
assert.deepEqual(evidence.systemRandomAdditionalRequirements, ['seed','entropyEvidence','replayToken']);
assert.equal(evidence.rules.everySelectionRequiresEvidence, true);
assert.equal(evidence.rules.evidenceMayBeReconstructedByAI, false);
assert.equal(evidence.rules.hiddenSymbolSelectionAllowed, false);
assert.deepEqual(evidenceSchema.required, ['schemaVersion','methodId','sessionId','inputMode','selectionMode','selectionEvidence','timestamp','runtimeVersion','projectionVersion']);
assert.deepEqual(evidenceSchema.properties.methodId.enum, ['I_CHING','TAROT']);
assert.deepEqual(evidenceSchema.properties.selectionMode.enum, ['MANUAL_SELECTION','SYSTEM_RANDOM']);
assert.equal(evidenceSchema.properties.selectionEvidence.properties.aiSelected.const, false);
console.log('✓ SYM-W3 Evidence Contract passed: every selection is evidence-backed and system-random evidence is replay-capable.');

const determinism = readJson(`${ROOT}/contracts/symbolic-method-determinism-boundary-v1.json`);
assert.equal(determinism.work, 'SYM-W4');
assert.ok(determinism.separations.includes('RANDOM_SELECTION_NE_AI_CHOICE'));
assert.equal(determinism.randomSelection.allowed, true);
assert.equal(determinism.randomSelection.aiChoiceAllowed, false);
assert.equal(determinism.randomSelection.providerChoiceAllowed, false);
assert.deepEqual(determinism.randomSelection.mustPersist, ['seed','entropyEvidence','selectionOrder','selectedSymbols','runtimeVersion','replayToken']);
assert.equal(determinism.randomSelection.replayRequired, true);
assert.equal(determinism.randomSelection.replayMayGenerateNewRandomOutcome, false);
assert.equal(determinism.postSelectionDeterminism.sameStoredEvidenceMustRestoreSameSelection, true);
assert.equal(determinism.postSelectionDeterminism.sameProjectionVersionMustRestoreSameProjection, true);
console.log('✓ SYM-W4 Determinism Boundary passed: randomness ≠ AI choice; stored evidence restores the same selection/projection without rerolling.');

const interpretation = readJson(`${ROOT}/contracts/symbolic-method-interpretation-contract-v1.json`);
assert.equal(interpretation.work, 'SYM-W5');
for (const [p,h] of [
  [interpretation.authorityEvidence.interpretationBoundaryPath, interpretation.authorityEvidence.interpretationBoundarySha256],
  [interpretation.authorityEvidence.sharedCompositionPath, interpretation.authorityEvidence.sharedCompositionSha256],
  [interpretation.authorityEvidence.sharedPrimitiveRegistryPath, interpretation.authorityEvidence.sharedPrimitiveRegistrySha256],
  [interpretation.authorityEvidence.canonicalMeaningPath, interpretation.authorityEvidence.canonicalMeaningSha256]
]) assert.equal(sha256(p), h, `SYM-W5 authority digest drift: ${p}`);
assert.deepEqual(interpretation.requiredBindings, ['SOURCE_BOUND','PERSPECTIVE_BOUND','CONFIDENCE_BOUND','PROJECTION_LINEAGE_BOUND']);
assert.equal(interpretation.rules.unqualifiedUniversalMeaningAllowed, false);
assert.equal(interpretation.rules.aiMayMergeSourcesIntoSingleTrueMeaning, false);
assert.equal(interpretation.rules.interpretationMayPredictGuaranteedOutcome, false);
assert.equal(interpretation.rules.interpretationMayOverrideCanonicalMeaningAuthority, false);
assert.equal(interpretation.rules.secondInterpretationRuntimeCreated, false);
console.log('✓ SYM-W5 Interpretation Contract passed: interpretation remains source/perspective/confidence/lineage bound under existing MIR/CMR authority.');

const reality = readJson(`${ROOT}/contracts/symbolic-method-reality-integration-contract-v1.json`);
assert.equal(reality.work, 'SYM-W6');
assert.deepEqual(reality.requiredLayerOrder, ['METHOD_PROJECTION','INTERPRETIVE_LENS','REALITY_CHECK','EVIDENCE','USER_CHOICE']);
for (const [p,h] of [
  [reality.realityAuthorityEvidence.rmoBoundaryPath, reality.realityAuthorityEvidence.rmoBoundarySha256],
  [reality.realityAuthorityEvidence.rreBoundaryPath, reality.realityAuthorityEvidence.rreBoundarySha256],
  [reality.realityAuthorityEvidence.journeyContractPath, reality.realityAuthorityEvidence.journeyContractSha256]
]) assert.equal(sha256(p), h, `SYM-W6 reality authority digest drift: ${p}`);
assert.equal(reality.rules.methodProjectionEqualsReality, false);
assert.equal(reality.rules.interpretiveLensEqualsObservedEvidence, false);
assert.equal(reality.rules.unknownMustRemainVisible, true);
assert.equal(reality.rules.contradictoryEvidenceMayBeHidden, false);
assert.equal(reality.rules.userRetainsDecisionAuthority, true);
assert.equal(reality.layers.at(-1).authority, 'USER');
assert.equal(reality.layers.at(-1).systemMaySilentlyChoose, false);
console.log('✓ SYM-W6 Reality Integration passed: Projection → Lens → Reality Check → Evidence → User Choice is fixed and authority-separated.');

const language = readJson(`${ROOT}/contracts/symbolic-method-language-contract-v1.json`);
assert.equal(language.work, 'SYM-W7');
assert.deepEqual(language.prohibitedProductionPhrases, ['This will happen.','You are destined to...','The universe is telling you...','Your future is...']);
assert.deepEqual(language.allowedFramingExamples, ['This symbolic pattern may be used to examine...','One possible lens is...','Compare this with what is actually observable...']);
assert.equal(language.rules.symbolicClaimsMustUseBoundedLanguage, true);
assert.equal(language.rules.predictionAuthorityForbidden, true);
const forbiddenPhrases = language.prohibitedProductionPhrases.map(x => x.replace(/\.\.\.$/, '').replace(/\.$/, ''));
const productionCandidates = [];
for (const p of ['index.html','personal-runtime.html','reality.html','account.html']) if (exists(p)) productionCandidates.push(p);
function collectTextFiles(dir) {
  if (!exists(dir)) return;
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,ent.name);
    if(ent.isDirectory()) collectTextFiles(p);
    else if(/\.(?:html|js|mjs)$/i.test(ent.name)) productionCandidates.push(p);
  }
}
collectTextFiles('assets/js'); collectTextFiles('functions');
const violations=[];
for (const p of productionCandidates) {
  const text=fs.readFileSync(p,'utf8');
  for (const phrase of forbiddenPhrases) if (phrase && text.includes(phrase)) violations.push(`${p}: ${phrase}`);
}
assert.deepEqual(violations, [], `SYM-W7 forbidden production language found: ${violations.join(' | ')}`);
console.log('✓ SYM-W7 Language Contract passed: prediction/destiny/universe-directive/certain-future production claims are absent from current client/runtime code.');

const holding = readJson('content/professional/method-production-activation/registries/mpa-future-method-holding-registry-v1.json');
for (const methodCode of ['I_CHING','TAROT']) {
  const h=holding.entries.find(x=>x.methodCode===methodCode);
  assert.ok(h);
  assert.equal(h.implementationState,'NOT_IMPLEMENTED');
  assert.equal(h.activationState,'NOT_ACTIVATED');
  assert.equal(h.productionEligible,false);
  assert.equal(h.productionExecutionAllowed,false);
  assert.equal(h.publicEligible,false);
}
const acceptance = readJson(`${ROOT}/acceptance/symbolic-method-w0-w8-acceptance-v1.json`);
assert.equal(acceptance.status,'SHARED_SYMBOLIC_FOUNDATION_ACCEPTED_NO_METHOD_IMPLEMENTATION_NO_PRODUCTION_GRANT');
assert.deepEqual(acceptance.completedWorks,['SYM-W0','SYM-W1','SYM-W2','SYM-W3','SYM-W4','SYM-W5','SYM-W6','SYM-W7','SYM-W8']);
assert.equal(acceptance.productionStatus,'NOT_PRODUCTION_ACTIVATED');
for (const notImplemented of ['I_CHING_CALCULATION_RUNTIME','TAROT_SELECTION_RUNTIME','PUBLIC_SYMBOLIC_UX','PRODUCTION_ACTIVATION']) assert.ok(acceptance.notImplementedByThisPhase.includes(notImplemented));
console.log('✓ SYM-W8 Shared Symbolic Checker passed: W0–W8 foundation is accepted while I Ching/Tarot implementation and production activation remain fail-closed.');
console.log('  I_CHING/TAROT stay REGISTERED + NOT_IMPLEMENTED; Shared Projection and existing MIR/CMR/RMO/RRE authorities are reused.');
