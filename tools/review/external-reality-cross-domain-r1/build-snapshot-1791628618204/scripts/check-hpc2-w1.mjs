import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselineCommit = '57bf9ec086f16ad37f47db6ea93aae55987765f9';
const registryPath = 'content/web/homepage/hpc2/homepage-scene-registry-v2.json';
const matrixPath = 'content/web/homepage/hpc2/homepage-production-coverage-matrix-v1.json';
const contractPath = 'content/web/homepage/hpc2/contracts/hpc2-w1-narrative-scene-authority-contract-v1.json';
const evidencePath = 'content/web/homepage/hpc2/evidence/hpc2-w1-narrative-scene-audit-v1.json';
const acceptancePath = 'content/web/homepage/hpc2/acceptance/hpc2-w1-narrative-scene-authority-acceptance-v1.json';
const freezePath = 'content/web/homepage/hpc2/freeze/hpc2-w1-narrative-scene-authority-freeze-v1.json';
const p0IntakePath = 'content/web/homepage/hpc2/homepage-capability-intake-v1.json';
const w0ManifestPath = 'content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json';
const wprCompositionPath = 'content/web-production/composition/public/homepage-composition-v1.1.json';
const visualSlotPath = 'content/web/homepage/hpc2-pre/homepage-visual-slot-coverage-audit-v1.json';

const expectedScenes = ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08', 'H09'];
const expectedTitles = {
  H01: 'Hero',
  H02: 'One Reality',
  H03: 'Many Lenses / Fragmentation',
  H04: 'PHI OS Runtime',
  H05: 'First Interaction',
  H06: 'Reality Surfaces',
  H07: 'Five-Volume Knowledge',
  H08: 'Academy / Services / Professional',
  H09: 'Continuity'
};
const expectedBeats = ['REALITY', 'SIGNALS', 'FRAGMENTATION', 'PHI_OS', 'UNDERSTAND', 'CHOOSE', 'ACT', 'OUTCOME', 'REVIEW', 'CONTINUE'];
const expectedBeatProjection = {
  REALITY: 'H01',
  SIGNALS: 'H02',
  FRAGMENTATION: 'H03',
  PHI_OS: 'H04',
  UNDERSTAND: 'H05',
  CHOOSE: 'H06',
  ACT: 'H08',
  OUTCOME: 'H09',
  REVIEW: 'H09',
  CONTINUE: 'H09'
};
const expectedVisuals = {
  H01: ['HERO-001'],
  H02: ['FIG-054'],
  H03: ['FIG-055'],
  H04: ['FIG-056'],
  H05: [],
  H06: ['FIG-002', 'FIG-003', 'FIG-004', 'FIG-005'],
  H07: ['BOOK-1-HARDCOVER', 'BOOK-2-HARDCOVER', 'BOOK-3-HARDCOVER', 'BOOK-4-HARDCOVER', 'BOOK-5-HARDCOVER', 'FIG-001'],
  H08: ['FIG-006', 'ICON-014', 'ICON-015'],
  H09: ['FIG-057']
};
const expectedCoverage = {
  REALITY_NAVIGATION_PLATFORM: { scenes: ['H01'], role: 'PRIMARY' },
  REALITY_RECONSTRUCTION: { scenes: ['H02', 'H04'], role: 'PRIMARY' },
  READING_NAVIGATION: { scenes: ['H04'], role: 'PRIMARY' },
  ASK_PHIOS: { scenes: ['H04', 'H05', 'H07', 'H09'], role: 'ENTRY' },
  PERSONAL_REALITY: { scenes: ['H05', 'H06'], role: 'PRIMARY' },
  FINANCIAL_REALITY: { scenes: ['H06'], role: 'PRIMARY' },
  REALITY_JOURNEY: { scenes: ['H06', 'H09'], role: 'PRIMARY' },
  FIVE_VOLUME_KNOWLEDGE: { scenes: ['H07'], role: 'PRIMARY' },
  PUBLISHED_KNOWLEDGE: { scenes: ['H07'], role: 'SUPPORT' },
  FIGURES_VISUAL_KNOWLEDGE: { scenes: ['H02', 'H04', 'H07'], role: 'VISUAL' },
  ACADEMY: { scenes: ['H08'], role: 'SECONDARY' },
  SERVICES: { scenes: ['H08'], role: 'SECONDARY' },
  PROFESSIONAL: { scenes: ['H08'], role: 'SECONDARY' },
  FOUNDER: { scenes: [], role: 'OPTIONAL' },
  RESEARCH: { scenes: [], role: 'NONE_BY_DESIGN_FULL' },
  PRIVATE_CUSTOMER_WORKSPACE: { scenes: [], role: 'NONE_BY_DESIGN' },
  PROFESSIONAL_WORKSPACE: { scenes: [], role: 'NONE_BY_DESIGN' }
};
const requiredSceneFields = ['sceneCode', 'purpose', 'capabilitiesConsumed', 'authoritySources', 'runtimeSources', 'visualAssets', 'ctaDestinations', 'audience', 'density'];

function fail(message) {
  throw new Error(`[HPC2-W1] ${message}`);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

async function text(path) {
  return readFile(resolve(root, path), 'utf8');
}

async function json(path) {
  return JSON.parse(await text(path));
}

async function sha256(path) {
  const bytes = await readFile(resolve(root, path));
  return createHash('sha256').update(bytes).digest('hex');
}

function sameArray(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  assert(actual.length === expected.length, `${label} count ${actual.length} !== ${expected.length}`);
  expected.forEach((value, index) => assert(actual[index] === value, `${label}[${index}] ${actual[index]} !== ${value}`));
}

function sameMembers(actual, expected, label) {
  assert(actual.length === expected.length, `${label} count ${actual.length} !== ${expected.length}`);
  assert(new Set(actual).size === actual.length, `${label} contains duplicates`);
  const actualSet = new Set(actual);
  expected.forEach((value) => assert(actualSet.has(value), `${label} missing ${value}`));
}

function assertSourceExists(source, label) {
  const path = source.split('#')[0];
  assert(existsSync(resolve(root, path)), `${label} source missing: ${path}`);
}

const [registry, matrix, contract, evidence, acceptance, freeze, p0Intake, w0Manifest, wprComposition, visualSlots, packageJson] = await Promise.all([
  json(registryPath),
  json(matrixPath),
  json(contractPath),
  json(evidencePath),
  json(acceptancePath),
  json(freezePath),
  json(p0IntakePath),
  json(w0ManifestPath),
  json(wprCompositionPath),
  json(visualSlotPath),
  json('package.json')
]);

for (const [label, record] of [
  ['scene registry', registry],
  ['coverage matrix', matrix],
  ['contract', contract],
  ['evidence', evidence],
  ['acceptance', acceptance],
  ['freeze', freeze]
]) {
  assert(record.work === 'HPC2-W1', `${label} work must be HPC2-W1`);
  const recordedBaseline = record.baselineCommit ?? record.auditedCommit;
  assert(recordedBaseline === baselineCommit, `${label} baseline must be ${baselineCommit}`);
}

assert(registry.status === 'FINAL_SINGLE_NARRATIVE_AND_H01_H09_AUTHORITY_FROZEN_COMPOSITION_PENDING', 'registry status drift');
assert(registry.authority.predecessorComposition === wprCompositionPath, 'WPR predecessor drift');
assert(registry.authority.successorRelationship === 'ADDITIVE_HPC2_NARRATIVE_AND_SCENE_AUTHORITY_NOT_SECOND_HOMEPAGE_RUNTIME', 'registry must be an additive successor');
assert(registry.narrativeSpine.singleStoryRequired === true, 'Homepage must have one story');
sameArray(registry.narrativeSpine.canonicalBeats, expectedBeats, 'canonical narrative beats');
assert(registry.narrativeSpine.storyMayNotBranchIntoParallelHomepageNarratives === true, 'parallel Homepage narratives must be forbidden');
sameArray(registry.sceneOrder, expectedScenes, 'scene order');
assert(registry.scenePolicy.sceneCount === 9, 'scene policy must fix nine scenes');
assert(registry.scenePolicy.additionalSceneAllowed === false, 'additional scenes must be forbidden');
assert(registry.scenePolicy.h10AndAboveForbidden === true, 'H10 and above must be forbidden');
assert(registry.scenePolicy.forbiddenSceneCodePattern === '^H[1-9][0-9]+$', 'H10+ forbidden scene pattern drift');
assert(registry.scenePolicy.additionalSceneRequiresVersionedHomepageArchitectureSuccessor === true, 'additional scenes require a versioned architecture successor');

const beatProjection = new Map();
for (const record of registry.narrativeSpine.primaryBeatProjection) {
  assert(expectedBeats.includes(record.beat), `unknown narrative beat ${record.beat}`);
  assert(!beatProjection.has(record.beat), `duplicate narrative beat projection ${record.beat}`);
  assert(expectedBeatProjection[record.beat] === record.sceneCode, `${record.beat} scene projection drift`);
  beatProjection.set(record.beat, record.sceneCode);
}
sameMembers([...beatProjection.keys()], expectedBeats, 'primary beat projection');
assert(registry.narrativeSpine.supportBridge.sceneCode === 'H07', 'H07 must be the grounded knowledge support bridge');
sameArray(registry.narrativeSpine.supportBridge.supportsBeats, ['UNDERSTAND', 'CHOOSE'], 'H07 support beats');

assert(Array.isArray(registry.scenes) && registry.scenes.length === 9, 'scene registry must contain exactly nine scenes');
sameArray(registry.scenes.map((scene) => scene.sceneCode), expectedScenes, 'registry scene codes');
assert(registry.scenes.every((scene) => /^H0[1-9]$/.test(scene.sceneCode)), 'only H01-H09 scene codes are allowed');

const sceneByCode = new Map();
const capabilitySceneMap = new Map();
const allVisuals = [];
const allV8Lineage = [];
for (const scene of registry.scenes) {
  for (const field of requiredSceneFields) assert(Object.hasOwn(scene, field), `${scene.sceneCode} missing required field ${field}`);
  assert(scene.sceneTitle === expectedTitles[scene.sceneCode], `${scene.sceneCode} title drift`);
  assert(typeof scene.purpose === 'string' && scene.purpose.length > 40, `${scene.sceneCode} purpose is incomplete`);
  assert(Array.isArray(scene.capabilitiesConsumed) && scene.capabilitiesConsumed.length > 0, `${scene.sceneCode} must consume at least one capability requirement`);
  assert(Array.isArray(scene.authoritySources) && scene.authoritySources.length > 0, `${scene.sceneCode} needs authority sources`);
  scene.authoritySources.forEach((source) => assertSourceExists(source, scene.sceneCode));
  scene.runtimeSources.forEach((source) => assertSourceExists(source, scene.sceneCode));
  assert(Array.isArray(scene.ctaDestinations), `${scene.sceneCode} CTA destinations must be an array`);
  assert(Array.isArray(scene.audience) && scene.audience.length > 0, `${scene.sceneCode} audience missing`);
  assert(['LOW', 'MEDIUM', 'HIGH'].includes(scene.density), `${scene.sceneCode} density invalid`);
  assert(scene.implementationState.includes('PENDING_HPC2_W'), `${scene.sceneCode} must remain implementation-pending`);
  assert(!scene.ctaDestinations.some((cta) => cta.destination === '/reality'), `${scene.sceneCode} must not activate or target /reality in W1`);
  assert(!scene.ctaDestinations.some((cta) => cta.activationState === 'ACTIVE_BY_HPC2_W1'), `${scene.sceneCode} fabricates route activation`);
  for (const capability of scene.capabilitiesConsumed) {
    assert(typeof capability.capabilityCode === 'string', `${scene.sceneCode} capabilityCode missing`);
    assert(typeof capability.coverageRole === 'string', `${scene.sceneCode}/${capability.capabilityCode} coverageRole missing`);
    assert(typeof capability.requirementState === 'string', `${scene.sceneCode}/${capability.capabilityCode} requirementState missing`);
    if (!capabilitySceneMap.has(capability.capabilityCode)) capabilitySceneMap.set(capability.capabilityCode, []);
    capabilitySceneMap.get(capability.capabilityCode).push(scene.sceneCode);
  }
  const visualCodes = scene.visualAssets.map((asset) => asset.assetCode);
  sameArray(visualCodes, expectedVisuals[scene.sceneCode], `${scene.sceneCode} visual assets`);
  for (const asset of scene.visualAssets) {
    assert(asset.availabilityState === 'HPC2_PRE_READY', `${scene.sceneCode}/${asset.assetCode} availability drift`);
    assert(asset.sceneConsumerState.startsWith('PENDING_HPC2_W'), `${scene.sceneCode}/${asset.assetCode} prematurely claims scene consumption`);
    allVisuals.push(asset.assetCode);
  }
  assert(Array.isArray(scene.v8NarrativeLineage), `${scene.sceneCode} v8NarrativeLineage must be an array`);
  allV8Lineage.push(...scene.v8NarrativeLineage);
  sceneByCode.set(scene.sceneCode, scene);
}

assert(allVisuals.length === 18 && new Set(allVisuals).size === 18, 'visual requirement identities must be 18/18 unique');
assert(sceneByCode.get('H05').visualAssets.length === 0, 'H05 must not use a fake UI image');
assert(sceneByCode.get('H05').visualMode === 'REAL_HTML_UI_NO_FAKE_UI_IMAGE', 'H05 must require real HTML UI');
assert(!capabilitySceneMap.get('ASK_PHIOS').includes('H01'), 'Ask PHI OS may not be Hero primary');
sameArray(capabilitySceneMap.get('ASK_PHIOS'), ['H04', 'H05', 'H07', 'H09'], 'Ask PHI OS scene positions');
assert(sceneByCode.get('H04').ckaRole === 'FIRST_FORMAL_CONTEXTUAL_ASK_ENTRY_AFTER_RUNTIME_EXPLANATION', 'H04 must be the first formal Ask entry');
assert(!sceneByCode.get('H01').ctaDestinations.some((cta) => cta.actionCode === 'ASK_PHIOS'), 'Hero may not expose Ask as CTA');
sameArray(capabilitySceneMap.get('REALITY_JOURNEY'), ['H06', 'H09'], 'Reality Journey scene positions');
assert(sceneByCode.get('H09').ctaDestinations.some((cta) => cta.actionCode === 'EXPLORE_REALITY_JOURNEY' && cta.hierarchy === 'TERTIARY_CONTEXTUAL_COMPLEX_ONLY'), 'H09 Journey must remain tertiary and complexity-gated');
assert(sceneByCode.get('H08').purpose.includes('without a price menu'), 'H08 must forbid a Homepage price menu');

const preVisuals = Object.fromEntries(visualSlots.slots.map((slot) => [slot.scene, slot.assets]));
for (const sceneCode of expectedScenes) sameArray(expectedVisuals[sceneCode], preVisuals[sceneCode], `${sceneCode} HPC2-PRE visual lineage`);
assert(visualSlots.slotCount === 9 && visualSlots.fakeUiImageUsed === false, 'HPC2-PRE visual slot boundary drift');

const p0Codes = p0Intake.records.map((record) => record.capabilityCode);
assert(p0Intake.records.every((record) => record.actualScene === null), 'P0 historical actualScene values must remain null');
for (const capabilityCode of p0Codes) assert(capabilitySceneMap.has(capabilityCode), `P0 capability missing W1 scene assignment: ${capabilityCode}`);
assert(p0Codes.length === 13, 'P0 capability count drift');
assert(capabilitySceneMap.size === 14 && capabilitySceneMap.has('REALITY_RECONSTRUCTION'), 'W1 capability assignment set drift');

assert(registry.v8ProjectionBoundary.narrativeLineageOnlyNotMigration === true, 'V8 projection must remain narrative lineage only');
assert(registry.v8ProjectionBoundary.successorVerifiedChangedByHpc2W1 === false, 'W1 must not change V8 successor verification');
assert(registry.v8ProjectionBoundary.deletionAllowedChangedByHpc2W1 === false, 'W1 must not allow V8 deletion');
const v8NotProjected = registry.v8ProjectionBoundary.notProjectedIntoScenes;
assert(new Set(allV8Lineage).size === allV8Lineage.length, 'V8 narrative lineage contains duplicates');
assert(new Set(v8NotProjected).size === v8NotProjected.length, 'V8 not-projected list contains duplicates');
sameMembers([...allV8Lineage, ...v8NotProjected], w0Manifest.semanticBlocks.map((block) => block.blockCode), 'V8 W1 disposition');
assert(allV8Lineage.length === 26 && v8NotProjected.length === 13, 'V8 W1 disposition counts drift');
assert(w0Manifest.semanticBlocks.every((block) => block.successorVerified === false && block.deletionAllowedFromHomepage === false), 'W0 V8 verification/deletion facts were rewritten');

assert(registry.implementationBoundary.finalNarrativeAuthorityEstablished === true, 'final narrative authority must be established');
assert(registry.implementationBoundary.finalNineSceneAuthorityEstablished === true, 'final H01-H09 authority must be established');
assert(registry.implementationBoundary.finalNineSceneDomImplemented === false, 'W1 must not claim DOM implementation');
assert(registry.implementationBoundary.currentSevenSectionHomepageReplaced === false, 'W1 must not replace current Homepage consumer');
assert(registry.implementationBoundary.homepageRuntimeCreated === false, 'W1 must not create a Homepage runtime');
assert(registry.implementationBoundary.routeActivated === false && registry.implementationBoundary.realityRouteActivated === false, 'W1 must not activate routes');
assert(registry.implementationBoundary.ckaAuthorityCreated === false, 'W1 must not create CKA authority');
assert(registry.implementationBoundary.humanAcceptanceClaimed === false, 'W1 must not fabricate human acceptance');

assert(matrix.authority.sceneSourceOfTruth === `${registryPath}#scenes`, 'coverage matrix scene source-of-truth drift');
assert(matrix.authority.capabilitySourceOfTruth === `${p0IntakePath}#records`, 'coverage matrix capability source-of-truth drift');
assert(matrix.authority.projectionOnly === true && matrix.authority.secondSceneOrCapabilityAuthorityCreated === false, 'coverage matrix must be projection-only');
sameMembers(matrix.records.map((record) => record.coverageCode), Object.keys(expectedCoverage), 'coverage matrix codes');
for (const record of matrix.records) {
  const expected = expectedCoverage[record.coverageCode];
  sameArray(record.sceneCodes, expected.scenes, `${record.coverageCode} matrix scenes`);
  assert(record.homepageRole === expected.role, `${record.coverageCode} role drift`);
  assert(record.actualConsumerClaimedByW1 === false, `${record.coverageCode} fabricates actual consumer promotion`);
  record.authoritySources.forEach((source) => assertSourceExists(source, record.coverageCode));
}
assert(matrix.summary.recordCount === 17, 'coverage matrix record count drift');
assert(matrix.summary.p0CapabilityCoverage === '13/13', 'P0 capability coverage drift');
assert(matrix.summary.requiredMinimumCoverage === '17/17', 'minimum coverage drift');
assert(matrix.summary.askScenePositionCoverage === '4/4', 'Ask position coverage drift');
assert(matrix.summary.askActualHomepageConsumerState === 'MISSING_PRESERVED_PENDING_CKA', 'Ask missing consumer must remain explicit');
assert(matrix.summary.actualConsumerPromotionsCreatedByW1 === 0, 'W1 fabricates consumer promotions');
assert(matrix.summary.routeActivationsCreatedByW1 === 0, 'W1 fabricates route activations');
assert(matrix.boundary.founderIsNotTenthScene === true, 'Founder must not create H10');
assert(matrix.boundary.figuresAreNotSeparateScene === true, 'Figures must not create a separate scene');
assert(matrix.boundary.researchFullContentIsNotHomepageScene === true, 'Full research must not create a scene');

assert(contract.status === 'ACTIVE_ADDITIVE_SUCCESSOR_NARRATIVE_AND_SCENE_AUTHORITY_ONLY', 'contract status drift');
assert(contract.authorityBoundary.narrativeAndSceneAuthority === registryPath, 'contract registry authority drift');
assert(contract.authorityBoundary.coverageMatrixRole === 'DETERMINISTIC_PROJECTION_ONLY_NOT_SECOND_SCENE_OR_CAPABILITY_AUTHORITY', 'contract matrix boundary drift');
assert(contract.failClosedRules.exactSceneCount === 9, 'contract scene count drift');
assert(contract.failClosedRules.h10AndAboveForbiddenWithoutVersionedArchitectureSuccessor === true, 'contract must forbid H10');
assert(contract.failClosedRules.askMayNotBeHeroPrimary === true && contract.failClosedRules.askFirstFormalEntryIsH04 === true, 'contract Ask placement drift');
assert(contract.failClosedRules.realityJourneyMayNotBeForced === true, 'contract must forbid forced Journey');
assert(contract.failClosedRules.v8DeletionRemainsForbidden === true, 'contract must preserve V8 deletion gate');
assert(contract.failClosedRules.humanAcceptanceMayNotBeSynthesized === true, 'contract must forbid fake human acceptance');
sameArray(contract.sceneImplementationSuccessors.map((record) => record.sceneCode), expectedScenes, 'scene implementation successors');
sameArray(contract.ckaConsumptionBoundary.entryScenes, ['H04', 'H05', 'H07', 'H09'], 'contract CKA entry scenes');
assert(contract.ckaConsumptionBoundary.currentHomepageConsumerState === 'MISSING_PRESERVED_PENDING_CKA', 'contract must preserve missing Ask consumer');

assert(evidence.w1AuthorityResult.canonicalNarrativeBeatCount === 10, 'evidence narrative beat count drift');
assert(evidence.w1AuthorityResult.sceneCount === 9, 'evidence scene count drift');
assert(evidence.w1AuthorityResult.p0CapabilityAssignmentCoverage === '13/13', 'evidence P0 coverage drift');
assert(evidence.w1AuthorityResult.minimumCoverageMatrixCoverage === '17/17', 'evidence minimum coverage drift');
assert(evidence.w1AuthorityResult.visualAssetRequirementRecordCount === 18, 'evidence visual count drift');
assert(evidence.w1AuthorityResult.ctaRequirementCount === 26, 'evidence CTA count drift');
assert(evidence.w1AuthorityResult.v8NarrativeLineageCount === 26, 'evidence V8 narrative count drift');
assert(evidence.w1AuthorityResult.v8NoneByDesignOrDestinationOnlyCount === 13, 'evidence V8 none-by-design count drift');
assert(evidence.w1AuthorityResult.finalNineSceneDomImplemented === false, 'evidence fabricates DOM implementation');
assert(evidence.implementationBoundary.humanAcceptanceClaimed === false && evidence.implementationBoundary.humanDecisionCreated === false, 'evidence fabricates human acceptance');

assert(acceptance.status === 'HPC2_W1_NARRATIVE_AND_9_SCENE_AUTHORITY_MACHINE_ACCEPTED_COMPOSITION_NOT_IMPLEMENTED', 'acceptance status drift');
assert(acceptance.acceptedFacts.singleNarrativeAuthorityEstablished === true, 'acceptance narrative authority missing');
assert(acceptance.acceptedFacts.finalNineSceneAuthorityEstablished === true, 'acceptance scene authority missing');
assert(acceptance.acceptedFacts.sceneCoverage === '9/9', 'acceptance scene coverage drift');
assert(acceptance.acceptedFacts.p0CapabilityAssignmentCoverage === '13/13', 'acceptance P0 coverage drift');
assert(acceptance.acceptedFacts.askActualHomepageConsumerState === 'MISSING_PRESERVED_PENDING_CKA', 'acceptance must preserve missing Ask consumer');
assert(acceptance.acceptedFacts.finalNineSceneDomImplemented === false, 'acceptance fabricates DOM implementation');
assert(acceptance.acceptedFacts.v8SuccessorVerifiedCount === 0 && acceptance.acceptedFacts.v8DeletionAllowedFromHomepageCount === 0, 'acceptance weakens W0 V8 gate');
assert(acceptance.acceptedFacts.humanAcceptanceClaimed === false, 'acceptance fabricates human acceptance');
assert(acceptance.humanAcceptance.claimed === false && acceptance.humanAcceptance.decisionRecord === null, 'human acceptance must remain unclaimed');
assert(acceptance.nextWork === 'HPC2-W2_HERO_PRODUCTION_COMPOSITION', 'acceptance next work drift');

assert(wprComposition.sections.length === 7, 'historical WPR composition section count drift');
assert(freeze.status === 'HPC2_W1_SINGLE_NARRATIVE_AND_H01_H09_AUTHORITY_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED', 'freeze status drift');
assert(freeze.frozenFacts.sceneCount === 9 && freeze.frozenFacts.sceneRange === 'H01_H09', 'freeze scene facts drift');
assert(freeze.frozenFacts.askActualHomepageConsumerState === 'MISSING_PRESERVED_PENDING_CKA', 'freeze Ask state drift');
assert(freeze.frozenBoundaries.finalNineSceneAuthorityEstablished === true, 'freeze must establish scene authority');
assert(freeze.frozenBoundaries.finalNineSceneDomImplemented === false, 'freeze must not claim DOM implementation');
assert(freeze.frozenBoundaries.v8SuccessorVerifiedCount === 0 && freeze.frozenBoundaries.v8DeletionAllowedCount === 0, 'freeze weakens V8 gate');
assert(freeze.frozenBoundaries.routeActivated === false && freeze.frozenBoundaries.realityRouteActivated === false, 'freeze fabricates route activation');
assert(freeze.frozenBoundaries.humanAcceptanceClaimed === false, 'freeze fabricates human acceptance');

const expectedFrozenPaths = [registryPath, matrixPath, contractPath, evidencePath, acceptancePath];
sameMembers(freeze.frozenOutputs.map((record) => record.path), expectedFrozenPaths, 'frozen output paths');
for (const output of freeze.frozenOutputs) assert(await sha256(output.path) === output.sha256, `frozen output digest drift: ${output.path}`);

assert(packageJson.scripts['check:hpc2-w1'] === 'node scripts/check-hpc2-w1.mjs', 'package check:hpc2-w1 wiring drift');
assert(packageJson.scripts['check:hpc2'].startsWith('npm run check:hpc2-pre-ready && npm run check:hpc2-p0 && npm run check:hpc2-w0'), 'check:hpc2 predecessor prefix drift');
assert(packageJson.scripts['check:hpc2'].includes('npm run check:hpc2-w1'), 'check:hpc2 must include W1');
assert(packageJson.scripts['check:bfr-h'].startsWith('npm run check:client-surface-invariants && npm run check:bfr-h-current && npm run check:hpc2-p0 && npm run check:hpc2-w0'), 'check:bfr-h predecessor prefix drift');
assert(packageJson.scripts['check:bfr-h'].includes('npm run check:hpc2-w1'), 'check:bfr-h must include W1');

console.log('HPC2-W1 single narrative and H01-H09 authority: ACCEPTED');
console.log('  narrative: 10 canonical beats → 9 scenes (H01-H09); H10+ = 0');
console.log('  coverage: P0 13/13; minimum production matrix 17/17');
console.log('  Ask PHI OS: H04/H05/H07/H09 positions reserved; actual Homepage consumer remains MISSING pending CKA');
console.log('  visuals: 18 existing governed identities; H05 requires real HTML UI');
console.log('  DOM implementation: 0/9; route activations: 0; V8 migration/deletion promotions: 0; human decisions: 0');
