import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  evaluateAlrAuthorityAction,
  resolveLearningObjectType,
  validateAcademyLevelRegistry,
  validateLearningTrackDefinition
} from './lib/academy-learning-runtime/alr-foundation-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto
  .createHash('sha256')
  .update(normalizeText(await fs.readFile(path.join(root, file), 'utf8')), 'utf8')
  .digest('hex');

const presentationFreezePath = `${base}/freeze/alr-w36-w41-presentation-freeze-v1.json`;
const presentationFreeze = await read(presentationFreezePath).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});

const audit = await read(`${base}/audits/alr-foundation-audit-v1.json`);
assert.equal(audit.baselineCommit, 'd5266251b43fc1497ab60959203c7a21b129acdf');
assert.equal(audit.migration.legacyScope, 'ALR-W0-W32');
assert.equal(audit.migration.canonicalScope, 'ALR-W0-W46');
assert.equal(audit.migration.migrationStatus, 'SUPERSEDED');
assert.equal(audit.baselineFindings.alrV2RuntimePresent, false);
assert.equal(audit.baselineFindings.legacyKnowledgeLearningPathsAreAlrAuthority, false);
assert.equal(audit.baselineFindings.pwsProfessionalCapabilityIsAlrLearningCapability, false);
assert.equal(audit.foundationDecision.liveLearningDataMayBeWritten, false);
assert.equal(audit.foundationDecision.capabilityStateMayBeSet, false);
assert.equal(audit.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  if (source.reference === 'academy.html' && presentationFreeze) {
    assert.ok(presentationFreeze.completedWorks.includes('ALR-W36'));
    assert.ok(presentationFreeze.outputs.includes('academy.html'));
    assert.equal(presentationFreeze.cprW0W30CarPdsRdgKnowledgeOrProfessionalAuthorityMutated, false);
    continue;
  }
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}

const migration = await read('content/governance/canonical-master-work/registries/canonical-master-work-migration-registry-v1.json');
const alrMigration = migration.entries.find(entry => entry.legacyWorkCode === 'ALR-W0-W32');
assert.equal(alrMigration.canonicalWorkCode, 'ALR-W0-W46');
assert.equal(alrMigration.migrationStatus, 'SUPERSEDED');

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const alrWorkCodes = masterWork.entries.filter(entry => entry.runtimeCode === 'ALR').map(entry => entry.workCode);
assert.deepEqual(alrWorkCodes, Array.from({ length: 47 }, (_, index) => `ALR-W${index}`));

const dependencies = await read('content/governance/canonical-master-work/registries/canonical-runtime-dependency-registry-v1.json');
const alrDependency = dependencies.entries.find(entry => entry.runtimeCode === 'ALR');
assert.deepEqual(alrDependency.dependsOn, ['KNOWLEDGE_AUTHORITY', 'CAR', 'RDG', 'CPR']);
assert.deepEqual(alrDependency.writesTo, ['LEARNING_STATE', 'CAPABILITY_SEMANTICS']);
assert.ok(alrDependency.forbiddenDependencies.includes('PROFESSIONAL_PERMISSION_WRITE'));

const authority = await read(`${base}/contracts/alr-authority-contract-v1.json`);
assert.equal(authority.runtimeCode, 'ALR');
assert.equal(authority.authorityClass, 'LEARNING_CAPABILITY');
assert.equal(authority.namespaceBoundaries.alrLearningCapabilityIsPwsProfessionalCapability, false);
assert.equal(authority.namespaceBoundaries.carLessonBriefIsAlrLessonRuntime, false);
assert.equal(authority.namespaceBoundaries.cprAcademyPresentationIsAlrLearningAuthority, false);
assert.equal(authority.foundationActivation.contractAndRegistriesActive, true);
assert.equal(authority.foundationActivation.learningDataRuntimeActive, false);
assert.equal(authority.foundationActivation.capabilityStateRuntimeActive, false);
assert.equal(evaluateAlrAuthorityAction(authority, 'REGISTER_LEARNING_OBJECT_TYPE'), 'ALLOW_FOUNDATION_DECLARATION');
assert.equal(evaluateAlrAuthorityAction(authority, 'SET_CAPABILITY_STATE'), 'DEFER_TO_FUTURE_WORK');
assert.equal(evaluateAlrAuthorityAction(authority, 'WRITE_KNOWLEDGE'), 'DENY_ALR_AUTHORITY');
assert.equal(evaluateAlrAuthorityAction(authority, 'WRITE_REALITY_EVIDENCE'), 'DENY_ALR_AUTHORITY');
assert.equal(evaluateAlrAuthorityAction(authority, 'WRITE_PROFESSIONAL_JUDGMENT'), 'DENY_ALR_AUTHORITY');
assert.equal(evaluateAlrAuthorityAction(authority, 'UNKNOWN_ACTION'), 'UNRESOLVED');

const learningObjects = await read(`${base}/registries/learning-object-registry-v1.json`);
const expectedObjectTypes = [
  'PROGRAM', 'LEARNING_PATH', 'MODULE', 'LESSON', 'LEARNING_OBJECTIVE',
  'TEACHING_EXPLANATION', 'EXAMPLE', 'CASE_STUDY', 'FIGURE_LEARNING_PROJECTION',
  'PRACTICE', 'GUIDED_PRACTICE', 'SIMULATION', 'REFLECTION', 'ASSESSMENT', 'LEARNING_FEEDBACK'
];
assert.deepEqual(learningObjects.objectTypes.map(entry => entry.typeCode), expectedObjectTypes);
assert.equal(new Set(learningObjects.objectTypes.map(entry => entry.typeCode)).size, expectedObjectTypes.length);
assert.equal(learningObjects.instances.length, 0);
assert.equal(learningObjects.populationState, 'EMPTY_BY_DESIGN_UNTIL_OWNER_WORK');
assert.equal(learningObjects.rules.registryStoresKnowledgeBody, false);
assert.equal(learningObjects.rules.registryStoresUserData, false);
assert.equal(resolveLearningObjectType(learningObjects, 'LESSON').ownerWork, 'ALR-W13');
assert.equal(resolveLearningObjectType(learningObjects, 'CAPABILITY'), null);

const levels = await read(`${base}/registries/academy-level-registry-v1.json`);
assert.equal(validateAcademyLevelRegistry(levels), true);
assert.deepEqual(levels.levels.map(entry => entry.levelCode), ['FOUNDATION', 'READER', 'NAVIGATOR', 'PROFESSIONAL']);
assert.equal(levels.rules.academyLevelIsCapabilityState, false);
assert.equal(levels.rules.lessonCompletionPromotesLevel, false);
assert.equal(levels.rules.professionalLevelGrantsProfessionalCredential, false);
assert.equal(levels.rules.professionalLevelGrantsProfessionalEntitlement, false);

const tracks = await read(`${base}/registries/learning-track-registry-v1.json`);
assert.deepEqual(tracks.trackClasses.map(entry => entry.trackClass), [
  'CORE_LITERACY', 'READING_LITERACY', 'NAVIGATION_PRACTICE', 'METHOD_LEARNING', 'PROFESSIONAL_FORMATION'
]);
assert.equal(tracks.tracks.length, 0);
assert.equal(tracks.populationState, 'EMPTY_BY_DESIGN_UNTIL_ALR-W10-W14');
assert.equal(tracks.rules.legacyKnowledgePathIsAlrTrack, false);
assert.equal(tracks.rules.professionalTrackGrantsProfessionalAuthority, false);
const validTrack = {
  trackCode: 'ALR-TRACK-REALITY-FOUNDATION',
  trackVersion: '1.0.0',
  trackClass: 'CORE_LITERACY',
  title: 'Reality Foundation',
  allowedAcademyLevels: ['FOUNDATION', 'READER'],
  sourceScopeReferences: ['BOOK-1'],
  status: 'DRAFT',
  authorityReference: 'ALR'
};
assert.equal(validateLearningTrackDefinition(tracks, levels, validTrack), 'VALID_TRACK_DEFINITION');
assert.equal(validateLearningTrackDefinition(tracks, levels, { ...validTrack, trackClass: 'UNKNOWN' }), 'UNKNOWN_TRACK_CLASS');
assert.equal(validateLearningTrackDefinition(tracks, levels, { ...validTrack, allowedAcademyLevels: ['MASTER'] }), 'UNKNOWN_ACADEMY_LEVEL');
assert.equal(validateLearningTrackDefinition(tracks, levels, { ...validTrack, learnerReference: 'SUBJECT-1' }), 'DENY_USER_OR_RUNTIME_DATA');

const kpp = await read('content/knowledge/production-planning/policies/kpp-academy-production-need-v1.json');
assert.equal(kpp.invariant, 'ACADEMY_NEED_NOT_ARTICLE_REQUIREMENT');
const car = await read('content/professional/canonical-asset-runtime/contracts/car-slides-academy-contract-v1.json');
assert.deepEqual(car.outputs, ['Lesson Brief', 'Slides Brief', 'Quiz Brief', 'Assignment Brief']);
assert.equal(car.invariants.teachingProjectionIsKnowledgeSource, false);
const cpr = await read('content/professional/canonical-presentation-runtime/contracts/canonical-presentation-contract-v1.json');
assert.equal(cpr.invariants.knowledgeContentStored, false);
assert.equal(cpr.invariants.runtimeStateStoredAsAuthority, false);

const rdgLearning = await read('content/governance/reality-data-governance/contracts/alr-learning-data-contract-v1.json');
assert.equal(rdgLearning.semanticAuthority, 'ALR Capability Runtime');
assert.equal(rdgLearning.dataGovernanceAuthority, 'RDG');
assert.equal(rdgLearning.rules.assessmentScoreIsCapability, false);
assert.equal(rdgLearning.rules.learningRecordMaySetCapabilityState, false);
const rdgEvidence = await read('content/governance/reality-data-governance/contracts/capability-evidence-boundary-v1.json');
assert.equal(rdgEvidence.finalCapabilityAuthority, 'ALR Capability Runtime');
assert.equal(rdgEvidence.rules.capabilityEvidenceIsCapabilityState, false);
const rdgContracts = await read('content/governance/reality-data-governance/registries/canonical-data-contract-registry-v1.json');
const alrDataContract = rdgContracts.entries.find(entry => entry.runtimeCode === 'ALR');
assert.equal(alrDataContract.activationState, 'RESERVED_NOT_IMPLEMENTED');
assert.deepEqual(alrDataContract.producedDataTypes, ['LEARNING_RECORD', 'CAPABILITY_EVIDENCE_RECORD']);

const freeze = await read(`${base}/freeze/alr-w0-w4-foundation-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.scope, 'ALR-W0-W4');
assert.deepEqual(freeze.completedWorks, ['ALR-W0', 'ALR-W1', 'ALR-W2', 'ALR-W3', 'ALR-W4']);
assert.equal(freeze.contractAndRegistryFoundationEstablished, true);
assert.equal(freeze.liveLearningRuntimeActivated, false);
assert.equal(freeze.capabilityStateRuntimeActivated, false);
assert.equal(freeze.existingRuntimeOrUserDataMutated, false);
assert.equal(freeze.nextWork, 'ALR-W5 Capability Registry');
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w0-w4'], 'node scripts/check-alr-w0-w4-foundation.mjs');
assert.equal(pkg.scripts['check:alr-foundation'], 'npm run check:alr-w0-w4');
assert.ok(pkg.scripts.postcheck.startsWith('npm run check:governance-data-closure && npm run check:alr-foundation && '));

console.log('✓ ALR-W0～W4 Academy Learning & Capability Runtime Foundation passed.');
console.log('✓ ALR semantic authority, Learning Object types, four Academy Levels and Track classes are frozen without activating learner data, Capability State, Assessment, Credential or Academy presentation runtimes.');
