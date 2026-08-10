import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {parseHTML} from 'linkedom';
import enAcademy from '../assets/js/locales/en/academy.js';
import zhAcademy from '../assets/js/locales/zh-Hans/academy.js';
import {
  assertAcademyProjectionDigest,
  buildAcademyDashboardProjection,
  buildAcademyLessonProjection,
  validateAlrPresentationRuntime
} from './lib/academy-learning-runtime/alr-presentation-v1.mjs';

const root = process.cwd();
const base = 'content/academy/academy-learning-runtime';
const read = async file => JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));
const readText = file => fs.readFile(path.join(root, file), 'utf8');
const normalizeText = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const digest = async file => crypto.createHash('sha256')
  .update(normalizeText(await readText(file)), 'utf8')
  .digest('hex');

const audit = await read(`${base}/audits/alr-presentation-reconciliation-v1.json`);
assert.equal(audit.auditVersion, '1.0.0');
assert.equal(audit.baselineCommit, '9f6642e753fe381ff0e6deb8cb4b2858df9f3966');
assert.equal(audit.scope, 'ALR-W36-W41');
assert.equal(audit.canonicalPhase, 'ALR-I｜Presentation');
assert.deepEqual(audit.implementationDecision, {
  academyPresentationViewCount: 2,
  localizedLearningSetCount: 5,
  localizedLessonProjectionCount: 10,
  localizedObjectiveProjectionCount: 20,
  supportedLocales: ['en', 'zh-Hans'],
  acceptanceViewports: [360, 768, 1440],
  alrLearningSemanticsOwner: true,
  cprPresentationOwner: true,
  carPublishedAssetOwner: true,
  canonicalPresentationCreated: false,
  academyValidationProjectionActivated: true,
  academyDeliveryOrLearnerPersistenceActivated: false
});
assert.equal(audit.baselineCompatibility.alrW33CheckerFinding,
  'POSTCHECK_TAIL_ASSERTION_PREDATES_VAP_W0_AND_VAP_W1');
assert.equal(audit.baselineCompatibility.alrW0CheckerFinding,
  'ACADEMY_ORIENTATION_HASH_PREDATES_GOVERNED_ALR_W36_PRESENTATION');
assert.equal(audit.baselineCompatibility.alrW0RepairScope,
  'SUCCESSOR_FREEZE_GATED_PAGE_ASSERTION_ONLY');
assert.equal(audit.baselineCompatibility.repairScope, 'CHECKER_ORDER_ASSERTION_ONLY');
assert.equal(audit.baselineCompatibility.cprBaselineAuditDigestDriftObservedBeforeW36, true);
assert.equal(audit.baselineCompatibility.cprFrozenAuditOrAuthorityMutationAllowed, false);
assert.equal(audit.preservation.alrW0W35ContractsRegistriesRuntimeOrFreezeMutated, false);
assert.equal(audit.preservation.cprW0W30ContractRegistryRuntimeOrFreezeMutated, false);
assert.equal(audit.preservation.existingRuntimeOrUserDataMutated, false);
for (const source of audit.inspectedAuthorities) {
  await fs.access(path.join(root, source.reference));
  assert.equal(await digest(source.reference), source.sha256, source.reference);
}

const masterWork = await read('content/governance/canonical-master-work/registries/canonical-master-work-registry-v1.json');
const workEntries = masterWork.entries.filter(entry => /^ALR-W(?:36|37|38|39|40|41)$/.test(entry.workCode));
assert.deepEqual(workEntries.map(entry => entry.workCode),
  ['ALR-W36', 'ALR-W37', 'ALR-W38', 'ALR-W39', 'ALR-W40', 'ALR-W41']);
assert.deepEqual(workEntries.map(entry => entry.executionOrder), [149, 150, 151, 152, 153, 154]);
assert.ok(workEntries.every(entry => entry.runtimeCode === 'ALR' && entry.status === 'PLANNED'));

const context = {
  cprAcademyContract: await read(`${base}/contracts/cpr-academy-contract-v1.json`),
  academyDashboardContract: await read(`${base}/contracts/academy-dashboard-contract-v1.json`),
  lessonExperienceContract: await read(`${base}/contracts/lesson-experience-contract-v1.json`),
  responsiveAcademyContract: await read(`${base}/contracts/responsive-academy-contract-v1.json`),
  academyAccessibilityContract: await read(`${base}/contracts/academy-accessibility-contract-v1.json`),
  localeLearningProjectionContract: await read(`${base}/contracts/locale-learning-projection-contract-v1.json`),
  academyPresentationViewRegistry: await read(`${base}/registries/academy-presentation-view-registry-v1.json`),
  localeLearningProjectionRegistry: await read(`${base}/registries/locale-learning-projection-registry-v1.json`),
  programRegistry: await read(`${base}/registries/program-registry-v1.json`),
  learningPathRegistry: await read(`${base}/registries/learning-path-registry-v1.json`),
  moduleRegistry: await read(`${base}/registries/module-registry-v1.json`),
  lessonRegistry: await read(`${base}/registries/lesson-registry-v1.json`),
  learningObjectiveRegistry: await read(`${base}/registries/learning-objective-registry-v1.json`),
  knowledgeLearningBindingRegistry: await read(`${base}/registries/knowledge-learning-binding-registry-v1.json`),
  knowledgeToLearningProjectionRegistry: await read(`${base}/registries/knowledge-to-learning-projection-registry-v1.json`),
  cprSurfaceRegistry: await read('content/professional/canonical-presentation-runtime/registries/surface-registry-v1.json'),
  cprPresentationTypeRegistry: await read('content/professional/canonical-presentation-runtime/registries/presentation-type-registry-v1.json'),
  cprSurfaceProjectionRegistry: await read('content/professional/canonical-presentation-runtime/registries/cpr-surface-projection-registry-v1.json'),
  cprResponsiveContract: await read('content/professional/canonical-presentation-runtime/contracts/cpr-responsive-presentation-runtime-v1.json'),
  cprAccessibilityContract: await read('content/professional/canonical-presentation-runtime/contracts/cpr-accessibility-presentation-runtime-v1.json'),
  cprLocaleContract: await read('content/professional/canonical-presentation-runtime/contracts/cpr-locale-presentation-runtime-v1.json'),
  publishedAssetRegistry: await read('content/professional/canonical-asset-runtime/registries/published-asset-registry-v1.json'),
  pdsDesignTokenContract: await read('content/registry/pds-w2-design-token-contract.json'),
  pdsFullSiteAcceptance: await read('content/registry/pds-w10-full-site-acceptance.json')
};

assert.equal(validateAlrPresentationRuntime(context), 'VALID_ALR_PRESENTATION_RUNTIME');
assert.equal(context.cprAcademyContract.rules.alrMayCreateCanonicalPresentation, false);
assert.equal(context.cprAcademyContract.rules.academyDeliveryActivated, false);
assert.equal(context.academyDashboardContract.rules.missingProgressMayBeInferredAsNotStarted, false);
assert.equal(context.lessonExperienceContract.rules.lessonCompletionWriteActivated, false);
assert.equal(context.responsiveAcademyContract.rules.semanticOrderImmutable, true);
assert.equal(context.academyAccessibilityContract.rules.stateMeaningMayRelyOnColorAlone, false);
assert.equal(context.localeLearningProjectionContract.rules.missingLocaleMayAuthorizeAutomaticTranslation, false);
assert.deepEqual(context.localeLearningProjectionContract.supportedLocales, ['en', 'zh-Hans']);
assert.equal(context.academyPresentationViewRegistry.views.length, 2);
assert.equal(context.localeLearningProjectionRegistry.projectionSets.length, 5);
assert.equal(context.publishedAssetRegistry.publications.length, 0);

const dashboardRequest = await read(`${base}/fixtures/academy-dashboard-projection.request.valid.json`);
const lessonRequest = await read(`${base}/fixtures/academy-lesson-projection.request.valid.json`);
const beforeContext = JSON.stringify(context);
const dashboard = buildAcademyDashboardProjection(context, dashboardRequest);
assert.equal(dashboard.projectionCode, 'ALR-ACADEMY-DASHBOARD-PROJECTION');
assert.equal(dashboard.renderState, 'validation_projection');
assert.equal(dashboard.canonicalPresentationState, 'VALIDATION_PROJECTION_SOURCE_ASSET_BLOCKED');
assert.equal(dashboard.locale, 'en');
assert.deepEqual(dashboard.sectionOrder, context.academyDashboardContract.sectionOrder);
assert.deepEqual(dashboard.program, {
  programCode: 'ALR-LO-PROGRAM-REALITY-NAVIGATION-FORMATION',
  title: 'PHI OS Reality Navigation Formation',
  pathCount: 5,
  moduleCount: 5,
  lessonCount: 5,
  objectiveCount: 10
});
assert.equal(dashboard.learningPaths.length, 5);
assert.deepEqual(dashboard.progressProjection, {
  state: 'NOT_PROVIDED',
  references: [],
  interpretedByPresentation: false,
  inferredNotStarted: false
});
assert.ok(dashboard.learningPaths.every(item =>
  item.progressProjectionState === 'NOT_PROVIDED' &&
  item.deliveryState === 'STRUCTURE_AVAILABLE_DELIVERY_BLOCKED'));
assert.equal(dashboard.enrollmentEffect, 'NONE');
assert.equal(dashboard.unlockEffect, 'NONE');
assert.equal(dashboard.completionEffect, 'NONE');
assert.equal(dashboard.capabilityStateEffect, 'NONE');
assert.equal(dashboard.credentialEffect, 'NONE');
assert.equal(dashboard.professionalAuthorityEffect, 'NONE');
assert.equal(assertAcademyProjectionDigest(dashboard), true);
assert.equal(JSON.stringify(context), beforeContext);

const referencedDashboard = buildAcademyDashboardProjection(context, {
  ...dashboardRequest,
  progressProjectionState: 'GOVERNED_REFERENCES_PROVIDED',
  progressReferences: ['ALR-PROGRESS-OPAQUE-0001']
});
assert.equal(referencedDashboard.progressProjection.state, 'GOVERNED_REFERENCES_PROVIDED');
assert.equal(referencedDashboard.learningPaths[0].progressProjectionState,
  'REFERENCE_PROVIDED_NOT_INTERPRETED');
assert.equal(referencedDashboard.progressProjection.interpretedByPresentation, false);
assert.equal(buildAcademyDashboardProjection(context, {
  ...dashboardRequest,
  progressReferences: ['ALR-PROGRESS-OPAQUE-0001']
}).decision, 'DENY_PROGRESS_REFERENCE_STATE_MISMATCH');
assert.equal(buildAcademyDashboardProjection(context, {
  ...dashboardRequest,
  personalData: {name: 'not accepted'}
}).decision, 'DENY_LEARNER_DATA_OR_EXTERNAL_AUTHORITY_FIELD');
assert.equal(buildAcademyDashboardProjection(context, {
  ...dashboardRequest,
  extra: true
}).decision, 'DENY_PRESENTATION_INPUT_SHAPE');
assert.equal(buildAcademyDashboardProjection(context, {
  ...dashboardRequest,
  providerUsed: true
}).decision, 'DENY_PROVIDER_OR_AI_PRESENTATION_AUTHORITY');
assert.equal(buildAcademyDashboardProjection(context, {
  ...dashboardRequest,
  locale: 'zh-Hant'
}).decision, 'DENY_UNSUPPORTED_LEARNING_LOCALE');

const lesson = buildAcademyLessonProjection(context, lessonRequest);
assert.equal(lesson.lesson.lessonCode, 'ALR-LO-LESSON-EVIDENCE-DISTINCTION');
assert.equal(lesson.lesson.title, '区分证据与推断');
assert.equal(lesson.lesson.objectives.length, 2);
assert.equal(lesson.sourceReading.locale, 'zh-Hans');
assert.equal(lesson.sourceReading.authority, 'PUBLISHED_KNOWLEDGE_AUTHORITY');
assert.equal(lesson.sourceReading.contentCopiedIntoProjection, false);
assert.equal(lesson.teachingStructure.deliveryState, 'REFERENCE_ONLY_DELIVERY_BLOCKED');
assert.equal(lesson.practiceState, 'DEFINITION_AVAILABLE_RESPONSE_CAPTURE_INACTIVE');
assert.equal(lesson.assessmentState, 'DEFINITION_AVAILABLE_EXECUTION_INACTIVE');
assert.equal(lesson.mixedLocaleContentUsed, false);
assert.equal(lesson.assessmentResultEffect, 'NONE');
assert.equal(lesson.completionEffect, 'NONE');
assert.equal(lesson.capabilityStateEffect, 'NONE');
assert.equal(assertAcademyProjectionDigest(lesson), true);
assert.equal(JSON.stringify(context), beforeContext);
assert.equal(buildAcademyLessonProjection(context, {
  ...lessonRequest,
  lessonCode: 'ALR-LO-LESSON-UNKNOWN'
}).decision, 'DENY_UNKNOWN_LESSON_OR_LOCALE_PROJECTION');

const localeDrift = structuredClone(context);
delete localeDrift.localeLearningProjectionRegistry.projectionSets[0].locales['zh-Hans'];
assert.equal(validateAlrPresentationRuntime(localeDrift), 'DANGLING_LOCALE_LEARNING_PROJECTION');
const cprDrift = structuredClone(context);
cprDrift.cprSurfaceProjectionRegistry.entries.find(item =>
  item.projectionCode === 'ACADEMY').presentationTypes.pop();
assert.equal(validateAlrPresentationRuntime(cprDrift), 'CPR_ACADEMY_PRESENTATION_AUTHORITY_DRIFT');
const pdsDrift = structuredClone(context);
pdsDrift.pdsDesignTokenContract.responsiveContract.acceptanceViewportsPx = [320, 768, 1440];
assert.equal(validateAlrPresentationRuntime(pdsDrift), 'CPR_PDS_PRESENTATION_CONTRACT_DRIFT');
const assetAuthorityDrift = structuredClone(context);
assetAuthorityDrift.publishedAssetRegistry.invariants.fixtureRecordsAreProductionRecords = true;
assert.equal(validateAlrPresentationRuntime(assetAuthorityDrift), 'CAR_PUBLISHED_ASSET_AUTHORITY_INVALID');

const localeKeyMap = [
  ['evidenceDistinction', 0],
  ['boundedReading', 1],
  ['constraintNavigation', 2],
  ['reviewContinuity', 3],
  ['professionalBoundaries', 4]
];
for (const [key, index] of localeKeyMap) {
  const set = context.localeLearningProjectionRegistry.projectionSets[index];
  for (const [locale, dictionary] of [['en', enAcademy], ['zh-Hans', zhAcademy]]) {
    const localized = set.locales[locale];
    const surface = dictionary.academyLearning.lessons[key];
    assert.equal(surface.title, localized.lessonTitle);
    assert.equal(surface.summary, localized.summary);
    assert.equal(surface.objectiveOneTitle, localized.objectives[0].title);
    assert.equal(surface.objectiveOneStatement, localized.objectives[0].statement);
    assert.equal(surface.objectiveTwoTitle, localized.objectives[1].title);
    assert.equal(surface.objectiveTwoStatement, localized.objectives[1].statement);
  }
}

const leafKeys = (value, prefix = '') => Object.entries(value).flatMap(([key, nested]) => {
  const next = prefix ? `${prefix}.${key}` : key;
  return nested && typeof nested === 'object' ? leafKeys(nested, next) : [next];
}).sort();
assert.deepEqual(leafKeys(enAcademy), leafKeys(zhAcademy));

for (const [file, mainId, skipHref] of [
  ['academy.html', 'academy-main', '#academy-main'],
  ['academy-lesson.html', 'academy-lesson-main', '#academy-lesson-main']
]) {
  const html = await readText(file);
  const {document} = parseHTML(html);
  assert.equal(document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
    'width=device-width, initial-scale=1');
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.ok(document.getElementById(mainId));
  assert.equal(document.querySelector('.phi-skip-link')?.getAttribute('href'), skipHref);
  assert.ok(document.querySelector('link[href="/assets/css/tokens.css"]'));
  assert.ok(document.querySelector('link[href="/assets/css/academy.css"]'));
  assert.ok(document.querySelector('script[src="/assets/js/public-shell.js"]'));
  assert.ok(document.querySelector('script[src="/assets/js/pages/academy.js"]'));
  assert.equal(document.querySelectorAll('form, input, textarea, [contenteditable="true"]').length, 0);
}

const lessonHtml = await readText('academy-lesson.html');
assert.match(lessonHtml, /name="robots" content="noindex,follow"/);
assert.match(lessonHtml, /aria-live="polite"/);
assert.match(lessonHtml, /aria-labelledby="academy-objectives-title"/);
assert.match(lessonHtml, /public-button public-button--primary/);

const academyJs = await readText('assets/js/pages/academy.js');
for (const forbidden of ['localStorage', 'sessionStorage', 'XMLHttpRequest', 'fetch(']) {
  assert.ok(!academyJs.includes(forbidden), `Academy presentation must not use ${forbidden}`);
}
for (const lessonDefinition of context.lessonRegistry.lessons) {
  assert.ok(academyJs.includes(lessonDefinition.lessonCode), lessonDefinition.lessonCode);
}
for (const projection of context.knowledgeToLearningProjectionRegistry.projections) {
  const href = projection.sourceArticleReferences.find(item => item.locale === 'en').href;
  assert.ok(academyJs.includes(href), href);
}
assert.match(academyJs, /onLocaleChange\(\(\) => render\(\)\)/);
assert.match(academyJs, /aria-current/);
assert.match(academyJs, /replaceChildren/);

const academyCss = await readText('assets/css/academy.css');
for (const pattern of [
  /@media \(max-width: 40rem\)/,
  /@media \(min-width: 48rem\)/,
  /@media \(min-width: 90rem\)/,
  /@media \(prefers-reduced-motion: reduce\)/,
  /@media print/,
  /var\(--phi-control-target-min\)/,
  /:focus-visible/,
  /overflow-wrap: anywhere/,
  /aria-current="page"/
]) assert.match(academyCss, pattern);

const publicShell = await readText('assets/js/public-shell.js');
assert.match(publicShell, /path === '\/academy-lesson'/);

const pageCapabilityExtension = await read('docs/pja/pja-page-capability-extension-v1.json');
const academyPageCapability = pageCapabilityExtension.pageCapabilities.find(item =>
  item.capabilityId === 'academy-lesson-presentation');
assert.deepEqual(academyPageCapability.pages, ['academy-lesson.html']);
assert.equal(academyPageCapability.activationState, 'validation_projection_delivery_inactive');
assert.equal(academyPageCapability.writeAuthority, 'none');

const freeze = await read(`${base}/freeze/alr-w36-w41-presentation-freeze-v1.json`);
assert.equal(freeze.baselineCommit, '9f6642e753fe381ff0e6deb8cb4b2858df9f3966');
assert.deepEqual(freeze.completedWorks,
  ['ALR-W36', 'ALR-W37', 'ALR-W38', 'ALR-W39', 'ALR-W40', 'ALR-W41']);
assert.equal(freeze.academyValidationProjectionActivated, true);
assert.equal(freeze.canonicalPresentationOrPublishedAssetCreated, false);
assert.equal(freeze.academyEnrollmentUnlockDeliveryOrProgressWriteActivated, false);
assert.equal(freeze.providerAiNetworkOrPersistenceActivated, false);
assert.equal(freeze.nextWork, 'ALR-W42 RG Checker Integration');
for (const output of freeze.outputs) await fs.access(path.join(root, output));

const pkg = await read('package.json');
assert.equal(pkg.scripts['check:alr-w36-w41'], 'node scripts/check-alr-w36-w41-presentation.mjs');
assert.equal(pkg.scripts['check:alr-presentation'], 'npm run check:alr-w36-w41');
const commands = pkg.scripts.postcheck.split(' && ');
assert.ok(commands.indexOf('npm run check:alr-access') < commands.indexOf('npm run check:alr-presentation'));
assert.ok(commands.indexOf('npm run check:alr-presentation') <
  commands.indexOf('node scripts/check-exp-w4-reconstruction-customer-projection.mjs'));
assert.ok(commands.indexOf('npm run check:wave1-production') < commands.indexOf('npm run check:vap-w0'));

console.log('✓ ALR-W36～W41 Presentation passed.');
console.log('✓ CPR Academy request, Dashboard, Lesson, responsive, accessibility and en/zh-Hans learning projections are closed.');
console.log('✓ Academy remains a validation projection: no canonical presentation, published asset, learner state, delivery, credential or Professional authority was created.');
