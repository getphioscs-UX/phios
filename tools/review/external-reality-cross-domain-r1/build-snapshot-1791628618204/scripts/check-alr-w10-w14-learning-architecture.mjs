import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildLearningArchitectureProjection,
  evaluateLearningDeliveryEligibility,
  validateLearningArchitecture,
  validateLearningObjectiveRegistry,
  validateLearningPathRegistry,
  validateLessonRegistry,
  validateModuleRegistry,
  validateProgramRegistry
} from './lib/academy-learning-runtime/alr-learning-architecture-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto
  .createHash('sha256')
  .update(normalizeText(await fs.readFile(path.join(root, file), 'utf8')), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-learning-architecture-reconciliation-v1.json`);
assert.equal(audit.baselineCommit, '1e99186e5bc5fafa705f61cc15ef57370bec07e9');
assert.equal(audit.scope, 'ALR-W10-W14');
assert.deepEqual(audit.canonicalWork.map(item => item.workCode), [
  'ALR-W10', 'ALR-W11', 'ALR-W12', 'ALR-W13', 'ALR-W14'
]);
assert.equal(audit.baselineFindings.alrW0W9Frozen, true);
assert.equal(audit.baselineFindings.postcheckInvokesAlrCapability, false);
assert.equal(audit.implementationDecision.knowledgeOrTeachingBodyMayBeCreated, false);
assert.equal(audit.implementationDecision.learnerOrCaseDataMayBeStored, false);
assert.equal(audit.implementationDecision.learningDeliveryMayBeActivated, false);
assert.equal(audit.implementationDecision.credentialEntitlementOrProfessionalAuthorityMayBeGranted, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:10|11|12|13|14)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode), [
  'ALR-W10', 'ALR-W11', 'ALR-W12', 'ALR-W13', 'ALR-W14'
]);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const context = {
  contract: await read(`${base}/contracts/learning-architecture-contract-v1.json`),
  typeRegistry: await read(`${base}/registries/learning-object-registry-v1.json`),
  levelRegistry: await read(`${base}/registries/academy-level-registry-v1.json`),
  trackRegistry: await read(`${base}/registries/learning-track-registry-v1.json`),
  capabilityRegistry: await read(`${base}/registries/capability-registry-v1.json`),
  capabilityGraph: await read(`${base}/registries/capability-dependency-graph-v1.json`),
  programRegistry: await read(`${base}/registries/program-registry-v1.json`),
  learningPathRegistry: await read(`${base}/registries/learning-path-registry-v1.json`),
  moduleRegistry: await read(`${base}/registries/module-registry-v1.json`),
  lessonRegistry: await read(`${base}/registries/lesson-registry-v1.json`),
  learningObjectiveRegistry: await read(`${base}/registries/learning-objective-registry-v1.json`)
};

assert.deepEqual(context.contract.hierarchy, [
  'PROGRAM', 'LEARNING_PATH', 'MODULE', 'LESSON', 'LEARNING_OBJECTIVE'
]);
assert.deepEqual(context.contract.ownerWorks, {
  PROGRAM: 'ALR-W10',
  LEARNING_PATH: 'ALR-W11',
  MODULE: 'ALR-W12',
  LESSON: 'ALR-W13',
  LEARNING_OBJECTIVE: 'ALR-W14'
});
assert.equal(context.contract.rules.lessonIsCarLessonBrief, false);
assert.equal(context.contract.rules.objectiveIsAssessment, false);
assert.equal(context.contract.rules.structureMayStoreLearnerOrCaseData, false);
assert.equal(context.contract.activation.architectureSemanticsActive, true);
assert.equal(context.contract.activation.learningDeliveryRuntimeActive, false);
assert.equal(context.contract.activation.learnerDataRuntimeActive, false);
assert.equal(context.contract.activation.academySurfaceActive, false);

assert.equal(validateProgramRegistry(context), 'VALID_PROGRAM_REGISTRY');
assert.equal(validateLearningPathRegistry(context), 'VALID_LEARNING_PATH_REGISTRY');
assert.equal(validateModuleRegistry(context), 'VALID_MODULE_REGISTRY');
assert.equal(validateLessonRegistry(context), 'VALID_LESSON_REGISTRY');
assert.equal(validateLearningObjectiveRegistry(context), 'VALID_LEARNING_OBJECTIVE_REGISTRY');
assert.equal(validateLearningArchitecture(context), 'VALID_LEARNING_ARCHITECTURE');

assert.equal(context.typeRegistry.productionStatus, 'type_registry_only');
assert.equal(context.typeRegistry.instances.length, 0);
assert.equal(context.typeRegistry.populationState, 'EMPTY_BY_DESIGN_UNTIL_OWNER_WORK');
for (const [typeCode, ownerWork] of Object.entries(context.contract.ownerWorks)) {
  const type = context.typeRegistry.objectTypes.find(item => item.typeCode === typeCode);
  assert.equal(type.ownerWork, ownerWork);
  assert.equal(type.contentAuthority, 'ALR');
}

assert.equal(context.programRegistry.programs.length, 1);
assert.equal(context.learningPathRegistry.learningPaths.length, 5);
assert.equal(context.moduleRegistry.modules.length, 5);
assert.equal(context.lessonRegistry.lessons.length, 5);
assert.equal(context.learningObjectiveRegistry.learningObjectives.length, 10);
assert.equal(context.programRegistry.programs[0].programCode, 'ALR-LO-PROGRAM-REALITY-NAVIGATION-FORMATION');
assert.deepEqual(context.learningPathRegistry.learningPaths.map(item => item.sequence), [1, 2, 3, 4, 5]);
assert.deepEqual(context.learningPathRegistry.learningPaths.map(item => item.targetCapabilityCodes[0]),
  context.capabilityRegistry.capabilities.map(item => item.capabilityCode));
assert.ok([
  ...context.programRegistry.programs,
  ...context.learningPathRegistry.learningPaths,
  ...context.moduleRegistry.modules,
  ...context.lessonRegistry.lessons,
  ...context.learningObjectiveRegistry.learningObjectives
].every(item => item.status === 'APPROVED' && item.deliveryActivationState === 'STRUCTURE_ONLY'));
assert.ok(context.lessonRegistry.lessons.every(lesson =>
  Object.values(lesson.futureIntegrationReferences).every(references => references.length === 0)
));
assert.ok(context.learningObjectiveRegistry.learningObjectives.every(objective =>
  objective.assessmentAlignmentState === 'PENDING_ALR-W24'
));

const expectedCriteria = context.capabilityRegistry.capabilities.flatMap(capability =>
  capability.requiredEvidenceCriteria.map(criterion => `${capability.capabilityCode}:${criterion.criterionCode}`)
).sort();
const objectiveCriteria = context.learningObjectiveRegistry.learningObjectives.map(objective =>
  `${objective.capabilityCode}:${objective.evidenceCriterionCode}`
).sort();
assert.deepEqual(objectiveCriteria, expectedCriteria);

const beforeProjection = JSON.stringify(context);
const projection = buildLearningArchitectureProjection(
  context,
  'ALR-LO-PROGRAM-REALITY-NAVIGATION-FORMATION'
);
assert.equal(JSON.stringify(context), beforeProjection);
assert.equal(projection.learningPaths.length, 5);
assert.equal(projection.learningPaths.flatMap(item => item.modules).length, 5);
assert.equal(projection.learningPaths.flatMap(item => item.modules.flatMap(module => module.lessons)).length, 5);
assert.equal(projection.learningPaths.flatMap(item =>
  item.modules.flatMap(module => module.lessons.flatMap(lesson => lesson.learningObjectives))
).length, 10);
assert.equal(buildLearningArchitectureProjection(context, 'ALR-LO-PROGRAM-UNKNOWN'), null);

const programWithCaseData = structuredClone(context);
programWithCaseData.programRegistry.programs[0].subjectReference = 'SUBJECT-1';
assert.equal(validateProgramRegistry(programWithCaseData), 'DENY_PROGRAM_DATA_OR_CONTENT_FIELD');

const duplicateProgram = structuredClone(context);
duplicateProgram.programRegistry.programs.push(structuredClone(duplicateProgram.programRegistry.programs[0]));
assert.equal(validateProgramRegistry(duplicateProgram), 'DUPLICATE_PROGRAM_CODE');

const cyclicPaths = structuredClone(context);
cyclicPaths.learningPathRegistry.learningPaths[0].prerequisitePathCodes = [
  'ALR-LO-PATH-BOUNDED-PROFESSIONAL-FORMATION'
];
assert.equal(validateLearningPathRegistry(cyclicPaths), 'CYCLIC_LEARNING_PATH_GRAPH');

const capabilityDependencyBypass = structuredClone(context);
capabilityDependencyBypass.learningPathRegistry.learningPaths[1].prerequisitePathCodes = [];
assert.equal(validateLearningArchitecture(capabilityDependencyBypass), 'PATH_CAPABILITY_DEPENDENCY_MISMATCH');

const danglingModule = structuredClone(context);
danglingModule.moduleRegistry.modules[0].learningPathCode = 'ALR-LO-PATH-UNKNOWN';
assert.equal(validateModuleRegistry(danglingModule), 'UNKNOWN_MODULE_LEARNING_PATH');

const lessonWithEarlyKnowledge = structuredClone(context);
lessonWithEarlyKnowledge.lessonRegistry.lessons[0].futureIntegrationReferences.knowledgeProjections = [
  'ALR-KNOWLEDGE-PROJECTION-UNREGISTERED'
];
assert.equal(validateLessonRegistry(lessonWithEarlyKnowledge), 'EARLY_OR_INVALID_LESSON_INTEGRATION');

const lessonWithBody = structuredClone(context);
lessonWithBody.lessonRegistry.lessons[0].lessonBody = 'Unowned teaching content';
assert.equal(validateLessonRegistry(lessonWithBody), 'DENY_LESSON_DATA_OR_CONTENT_FIELD');

const objectiveWithUnknownCriterion = structuredClone(context);
objectiveWithUnknownCriterion.learningObjectiveRegistry.learningObjectives[0].evidenceCriterionCode = 'UNKNOWN_CRITERION';
assert.equal(
  validateLearningObjectiveRegistry(objectiveWithUnknownCriterion),
  'UNKNOWN_LEARNING_OBJECTIVE_CRITERION'
);

const objectiveWithAssessment = structuredClone(context);
objectiveWithAssessment.learningObjectiveRegistry.learningObjectives[0].assessmentItems = ['AUTO_SCORE'];
assert.equal(validateLearningObjectiveRegistry(objectiveWithAssessment), 'DENY_OBJECTIVE_DATA_OR_CONTENT_FIELD');

const brokenProgramReciprocity = structuredClone(context);
brokenProgramReciprocity.programRegistry.programs[0].learningPathCodes.pop();
assert.equal(validateLearningArchitecture(brokenProgramReciprocity), 'PROGRAM_PATH_RECIPROCITY_FAILURE');

assert.equal(evaluateLearningDeliveryEligibility(context.contract, {
  requestedActivationState: 'STRUCTURE_ONLY'
}), 'STRUCTURE_READY_DELIVERY_BLOCKED');
assert.equal(evaluateLearningDeliveryEligibility(context.contract, {
  requestedActivationState: 'DELIVERY_ELIGIBLE',
  knowledgeProjectionReady: true,
  teachingExplanationReady: true,
  practiceReady: true,
  assessmentReady: false,
  rdgPermissionResolved: true
}), 'DENY_DELIVERY_GATES');
assert.equal(evaluateLearningDeliveryEligibility(context.contract, {
  requestedActivationState: 'DELIVERY_ELIGIBLE',
  knowledgeProjectionReady: true,
  teachingExplanationReady: true,
  practiceReady: true,
  assessmentReady: true,
  rdgPermissionResolved: true
}), 'DENY_RUNTIME_NOT_ACTIVATED');
assert.equal(evaluateLearningDeliveryEligibility(context.contract, {
  requestedActivationState: 'DELIVERY_ELIGIBLE',
  subjectReference: 'SUBJECT-1'
}), 'DENY_LEARNER_CASE_OR_AUTHORITY_DATA');

const kppAcademy = await read('content/knowledge/production-planning/policies/kpp-academy-production-need-v1.json');
assert.equal(kppAcademy.invariant, 'ACADEMY_NEED_NOT_ARTICLE_REQUIREMENT');
const carReconciliation = await read('content/professional/canonical-asset-runtime/contracts/car-alr-cpr-authority-reconciliation-v1.json');
assert.equal(carReconciliation.workInterpretation['CAR-W7'].equations.carLessonBriefEqualsAlrLessonRuntime, false);
assert.equal(carReconciliation.workInterpretation['CAR-W7'].rules.carMayCreateLearningRuntimeState, false);
const rdgLearning = await read('content/governance/reality-data-governance/contracts/alr-learning-data-contract-v1.json');
assert.equal(rdgLearning.rules.learningRecordMaySetCapabilityState, false);
assert.equal(rdgLearning.rules.permissionMustBeResolvedBeforePersistence, true);
const icrContract = await read('content/runtime/input-case-runtime/contracts/canonical-input-contract-v1.json');
assert.equal(icrContract.rules.canonicalInputIsRuntimeState, false);
assert.equal(icrContract.rules.registryMayStoreUserData, false);
const icrFreeze = await read('content/runtime/input-case-runtime/freeze/icr-w0-w4-input-foundation-freeze-v1.json');
assert.equal(icrFreeze.nonActivation.caseRuntimeActivated, false);
assert.equal(icrFreeze.nonActivation.userDataCreated, false);

const freeze = await read(`${base}/freeze/alr-w10-w14-learning-architecture-freeze-v1.json`);
assert.equal(freeze.status, 'frozen');
assert.deepEqual(freeze.completedWorks, ['ALR-W10', 'ALR-W11', 'ALR-W12', 'ALR-W13', 'ALR-W14']);
assert.equal(freeze.canonicalProgramCount, 1);
assert.equal(freeze.canonicalLearningPathCount, 5);
assert.equal(freeze.canonicalModuleCount, 5);
assert.equal(freeze.canonicalLessonCount, 5);
assert.equal(freeze.canonicalLearningObjectiveCount, 10);
assert.equal(freeze.capabilityDependencyAlignmentEstablished, true);
assert.equal(freeze.objectiveCriterionAlignmentEstablished, true);
assert.equal(freeze.learningDeliveryRuntimeActivated, false);
assert.equal(freeze.learnerDataWriteActivated, false);
assert.equal(freeze.icrCaseOrInputDataWriteActivated, false);
assert.equal(freeze.credentialEntitlementOrProfessionalAuthorityActivated, false);
assert.equal(freeze.w0W9FrozenArtifactsMutated, false);
assert.equal(freeze.rdgCarIcrFrozenArtifactsMutated, false);
assert.equal(freeze.existingRuntimeOrUserDataMutated, false);
assert.equal(freeze.nextWork, 'ALR-W15 Knowledge-to-Learning Projection');
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w10-w14'], 'node scripts/check-alr-w10-w14-learning-architecture.mjs');
assert.equal(pkg.scripts['check:alr-learning-architecture'], 'npm run check:alr-w10-w14');
assert.ok(pkg.scripts.postcheck.startsWith(
  'npm run check:governance-data-closure && npm run check:alr-foundation && npm run check:alr-capability && npm run check:alr-learning-architecture && npm run check:car-reconciliation && npm run check:icr-foundation && '
));

console.log('✓ ALR-W10～W14 Program / Learning Path / Module / Lesson / Learning Objective passed.');
console.log('✓ 1 Program → 5 Paths → 5 Modules → 5 Lessons → 10 Objectives are reciprocal and Capability-aligned.');
console.log('✓ Learning Architecture is structure-only; Knowledge, Practice, Assessment, learner/case data, delivery, Credential, Entitlement and Professional authority remain inactive.');
