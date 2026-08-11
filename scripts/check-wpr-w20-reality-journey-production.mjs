import assert from 'node:assert/strict';
import {
  BASELINE,
  canonicalStageOrder,
  exists,
  readJson,
  readText
} from './lib/web-production/wpr-journey-v1.mjs';

const contract = readJson(
  'content/web-production/contracts/wpr-reality-journey-production-v1.json'
);
assert.equal(contract.work, 'WPR-W20');
assert.equal(contract.baselineCommit, BASELINE);
assert.equal(
  contract.status,
  'active_limited_production_jr_v2_read_only_projection'
);
assert.equal(contract.rules.wprMayInventJourneyStage, false);
assert.equal(contract.rules.wprMayInferCanonicalStageFromPageOrder, false);
assert.equal(contract.rules.pageVisitCountsAsCompletion, false);
assert.equal(contract.rules.routeLoadCountsAsCompletion, false);
assert.equal(contract.rules.wprW21MethodExecutionActivated, false);

const freeze = readJson('content/runtime/journey-runtime/freeze/jr-v2-freeze-v1.json');
assert.equal(freeze.status, 'JR-v2.0.0-FROZEN');
assert.equal(freeze.architectureState, 'FROZEN');
assert.equal(freeze.productionState, 'VALIDATION_ONLY_INTEGRATION_RUNTIME');
assert.equal(freeze.wprHandoff.wprW20ReadOnlyProjectionEligible, true);
assert.equal(freeze.wprHandoff.wprW20MayInventJourneyStage, false);
assert.equal(freeze.wprHandoff.wprW20MustUseCanonicalStageRegistry, true);
assert.equal(freeze.wprHandoff.wprW20MayClaimLiveRrePersistence, false);
assert.equal(freeze.wprHandoff.wprW21MethodExecutionEligibleByJr, false);

const stages = readJson(
  'content/runtime/journey-runtime/registries/canonical-journey-stage-registry-v2.json'
);
assert.deepEqual(stages.canonicalOrder, canonicalStageOrder);
assert.deepEqual(
  stages.canonicalStages.map(stage => stage.code),
  canonicalStageOrder
);
assert.deepEqual(
  stages.canonicalStages.map(stage => stage.ordinal),
  [1, 2, 3, 4, 5, 6, 7, 8]
);

const compatibility = readJson(
  'content/runtime/journey-runtime/registries/journey-stage-compatibility-registry-v1.json'
);
assert.equal(compatibility.status, 'compatibility_only');
assert.deepEqual(
  Object.keys(compatibility.legacyPdsShellMappings),
  ['enter', 'describe', 'discover', 'understand', 'choose', 'continue']
);
assert.deepEqual(
  compatibility.legacySequenceException.sequence,
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);
assert.equal(
  compatibility.legacySequenceException.mayDefineNewCanonicalJourneyOrder,
  false
);

const progress = readJson(
  'content/runtime/journey-runtime/contracts/journey-progress-contract-v1.json'
);
assert.equal(progress.sourceOfProgress, 'ACTUAL_STAGE_COMPLETION_EVENTS');
assert.equal(progress.rules.pageVisitCountsAsCompletion, false);
assert.equal(progress.rules.routeLoadCountsAsCompletion, false);
assert.equal(progress.rules.stageCompletionRequiresExplicitEvent, true);

const safety = readJson(
  'content/runtime/journey-runtime/contracts/journey-safety-boundary-contract-v1.json'
);
for (const required of [
  'EMERGENCY_SIGNAL',
  'REGULATED_ADVICE_REQUEST',
  'MISSING_REQUIRED_CONSENT',
  'PROFESSIONAL_ESCALATION',
  'DATA_PURPOSE_VIOLATION'
]) {
  assert.ok(safety.checks.includes(required), required);
}
assert.equal(safety.rules.professionalEscalationCreatesResponsibility, false);

const recommendation = readJson(
  'content/runtime/journey-runtime/contracts/journey-recommendation-contract-v1.json'
);
assert.equal(recommendation.rules.recommendationIsWorkflowStepOnly, true);
for (const forbidden of [
  'LIFE_DECISION',
  'FINANCIAL_DECISION',
  'MEDICAL_DECISION',
  'LEGAL_DECISION',
  'PROFESSIONAL_JUDGMENT',
  'REALITY_TRUTH'
]) {
  assert.ok(recommendation.forbiddenDecisionClasses.includes(forbidden), forbidden);
}

const composition = readJson(
  'content/web-production/composition/customer/reality-journey-composition-v1.json'
);
assert.equal(composition.work, 'WPR-W20');
assert.equal(composition.baselineCommit, BASELINE);
assert.equal(composition.status, 'limited_production');
assert.equal(composition.publicOverview.surfaceCode, 'REALITY_JOURNEY_OVERVIEW');
assert.equal(composition.localCustomerStatus.surfaceCode, 'REALITY_JOURNEY_LOCAL');
assert.equal(
  composition.localCustomerStatus.hydration,
  'BROWSER_LOCAL_READ_ONLY_COMPATIBILITY'
);
assert.equal(composition.presentationBoundary.cprProductionRecordReference, null);
assert.equal(composition.presentationBoundary.htmlIsProjectionOnly, true);

const projectionRegistry = readJson(
  'content/web-production/registries/wpr-reality-journey-projection-registry-v1.json'
);
assert.equal(projectionRegistry.entries.length, 2);
assert.equal(projectionRegistry.rules.sameJourneyAuthority, true);
assert.equal(projectionRegistry.rules.secondJourneyRuntimeCreated, false);
assert.equal(projectionRegistry.rules.missingMappingFailsClosed, true);

const sourceRegistry = readJson(
  'content/web-production/registries/wpr-production-source-registry-v1.json'
);
const jrSource = sourceRegistry.entries.find(entry => entry.sourceCode === 'JR');
assert.ok(jrSource, 'WPR_W20_JR_SOURCE_MISSING');
assert.equal(jrSource.sourceClass, 'CANONICAL');
assert.equal(jrSource.readOnlyProjectionOnly, true);
const localSource = sourceRegistry.entries.find(
  entry => entry.sourceCode === 'M3C_BROWSER_LOCAL'
);
assert.ok(localSource, 'WPR_W20_M3C_LOCAL_SOURCE_MISSING');
assert.equal(localSource.sourceClass, 'SESSION');
assert.equal(localSource.canonicalJourneyAuthority, false);

const consumption = readJson(
  'content/web-production/registries/wpr-runtime-consumption-registry-v1.json'
);
const jrConsumption = consumption.entries.find(entry => entry.runtimeCode === 'JR');
assert.ok(jrConsumption, 'WPR_W20_JR_CONSUMPTION_MISSING');
assert.equal(jrConsumption.architectureState, 'FROZEN');
assert.equal(
  jrConsumption.productionState,
  'VALIDATION_ONLY_INTEGRATION_RUNTIME'
);
assert.ok(jrConsumption.surfaceConsumers.includes('REALITY_JOURNEY_OVERVIEW'));
assert.ok(jrConsumption.surfaceConsumers.includes('REALITY_JOURNEY_LOCAL'));

const surfaces = readJson(
  'content/web-production/registries/wpr-surface-registry-v1.json'
);
const overviewSurface = surfaces.entries.find(
  entry => entry.surfaceCode === 'REALITY_JOURNEY_OVERVIEW'
);
const localSurface = surfaces.entries.find(
  entry => entry.surfaceCode === 'REALITY_JOURNEY_LOCAL'
);
assert.ok(overviewSurface);
assert.equal(overviewSurface.audienceClass, 'PUBLIC');
assert.equal(overviewSurface.authRequired, false);
assert.ok(localSurface);
assert.equal(localSurface.audienceClass, 'CUSTOMER');
assert.equal(localSurface.authRequired, false);
assert.equal(localSurface.canonicalCustomerWorkspace, false);

const routes = readJson(
  'content/web-production/registries/wpr-route-registry-v1.json'
);
const journeyRoute = routes.entries.find(entry => entry.routeCode === 'REALITY_JOURNEY');
const localRoute = routes.entries.find(
  entry => entry.routeCode === 'CUSTOMER_WORKSPACE'
);
assert.equal(journeyRoute.path, '/reality-journey');
assert.equal(journeyRoute.surfaceCode, 'REALITY_JOURNEY_OVERVIEW');
assert.equal(localRoute.path, '/reality-dashboard');
assert.equal(localRoute.surfaceCode, 'REALITY_JOURNEY_LOCAL');

const web = readJson(
  'content/web-production/registries/canonical-web-production-registry-v1.json'
);
const w20Records = web.productionRecords.filter(
  record => record.lineage?.wprWork === 'WPR-W20'
);
assert.equal(w20Records.length, 4);
assert.deepEqual(
  [...new Set(w20Records.map(record => record.locale))].sort(),
  ['en', 'zh-Hans']
);
assert.ok(w20Records.every(record => record.productionState === 'LIMITED_PRODUCTION'));
assert.ok(w20Records.every(record => record.lineage.cprProductionRecordReference === null));
assert.ok(w20Records.every(record => record.renderPolicy.htmlIsProjectionOnly === true));

const overviewRecords = w20Records.filter(
  record => record.surfaceCode === 'REALITY_JOURNEY_OVERVIEW'
);
assert.equal(overviewRecords.length, 2);
assert.ok(overviewRecords.every(record => record.audience === 'PUBLIC'));
assert.ok(overviewRecords.every(record => record.accessMode === 'PUBLIC'));
assert.ok(overviewRecords.every(record => record.hydrationPolicy.privateStateAllowed === false));
assert.ok(overviewRecords.every(record => record.seoPolicy.indexable === true));

const localRecords = w20Records.filter(
  record => record.surfaceCode === 'REALITY_JOURNEY_LOCAL'
);
assert.equal(localRecords.length, 2);
assert.ok(localRecords.every(record => record.audience === 'CUSTOMER'));
assert.ok(localRecords.every(record => record.accessMode === 'PUBLIC'));
assert.ok(localRecords.every(record => record.renderPolicy.canonicalCustomerWorkspaceClaimed === false));
assert.ok(localRecords.every(record => record.hydrationPolicy.mode === 'BROWSER_LOCAL_READ_ONLY_COMPATIBILITY'));
assert.ok(localRecords.every(record => record.hydrationPolicy.serverCustomerDataAllowed === false));
assert.ok(localRecords.every(record => record.cachePolicy.class === 'PRIVATE_NO_STORE'));
assert.ok(localRecords.every(record => record.seoPolicy.indexable === false));

const overview = readText('reality-journey.html');
for (const marker of [
  '/assets/css/wpr-public-production.css',
  '/assets/css/wpr-reality-journey-production.css',
  'data-wpr-production-surface="REALITY_JOURNEY_OVERVIEW"',
  'data-wpr-jr-canonical-stages',
  'data-wpr-jr-authority-status',
  '/assets/js/pages/reality-journey-production.js'
]) {
  assert.ok(overview.includes(marker), `WPR_W20_OVERVIEW_MISSING:${marker}`);
}
for (const legacyTask of ['enter', 'describe', 'discover', 'understand', 'choose', 'continue']) {
  assert.ok(
    overview.includes(`journeyPublic.customerStages.${legacyTask}.name`),
    `WPR_W20_LEGACY_TASK_COMPATIBILITY_MISSING:${legacyTask}`
  );
}

const dashboard = readText('reality-dashboard.html');
for (const marker of [
  '/assets/css/wpr-reality-journey-production.css',
  'data-wpr-production-surface="REALITY_JOURNEY_LOCAL"',
  'data-wpr-jr-dashboard-authority',
  'data-wpr-jr-canonical-current',
  '/assets/js/pages/reality-dashboard-jr-v2.js'
]) {
  assert.ok(dashboard.includes(marker), `WPR_W20_DASHBOARD_MISSING:${marker}`);
}
assert.ok(dashboard.includes('name="robots" content="noindex,follow"'));

const overviewController = readText('assets/js/pages/reality-journey-production.js');
for (const source of [
  'canonical-journey-stage-registry-v2.json',
  'journey-stage-compatibility-registry-v1.json',
  'jr-v2-freeze-v1.json'
]) {
  assert.ok(overviewController.includes(source), `WPR_W20_CONTROLLER_SOURCE_MISSING:${source}`);
}
assert.ok(overviewController.includes('canonicalStages'));
assert.ok(overviewController.includes('wprW20ReadOnlyProjectionEligible'));
assert.equal(overviewController.includes("const STAGES = Object.freeze(["), false);

const dashboardController = readText('assets/js/pages/reality-dashboard-jr-v2.js');
assert.ok(dashboardController.includes('legacyM3cStageMappings'));
assert.ok(dashboardController.includes('data-legacy-journey-stage'));
assert.ok(dashboardController.includes('canonicalStages'));
assert.equal(dashboardController.includes('localStorage.setItem'), false);
assert.equal(dashboardController.includes('sessionStorage.setItem'), false);

const legacyDashboardController = readText('assets/js/pages/reality-dashboard.js');
assert.ok(legacyDashboardController.includes('data-legacy-journey-stage'));
assert.ok(legacyDashboardController.includes('document.body.dataset.legacyJourneyStage'));
const legacyProjection = readText('assets/js/modules/journey-dashboard-projection.js');
assert.ok(legacyProjection.includes("id: 'memory'"));
assert.ok(legacyProjection.includes("id: 'continuity'"));

const audit = readJson(
  'content/web-production/audits/wpr-w20-jr-v2-consumption-audit-v1.json'
);
assert.equal(audit.baselineCommit, BASELINE);
assert.equal(audit.observed.canonicalStageCount, 8);
assert.equal(audit.observed.legacyM3cStageCount, 7);
assert.equal(audit.observed.legacyPdsCustomerTaskCount, 6);
for (const value of Object.values(audit.nonActivation)) {
  assert.equal(value, false);
}

const acceptance = readJson(
  'content/web-production/acceptance/wpr-w20-reality-journey-production-acceptance-v1.json'
);
assert.equal(acceptance.baselineCommit, BASELINE);
assert.equal(
  acceptance.status,
  'ACCEPT_REALITY_JOURNEY_LIMITED_PRODUCTION_JR_V2_READ_ONLY_NO_METHOD_EXECUTION'
);
assert.equal(acceptance.acceptance.jrV2CanonicalAuthorityConsumed, true);
assert.equal(acceptance.acceptance.canonicalAuthenticatedCustomerWorkspaceClaimed, false);
for (const value of Object.values(acceptance.nonActivation)) {
  assert.equal(value, false);
}

const cpr = readJson(
  'content/professional/canonical-presentation-runtime/registries/canonical-presentation-registry-v1.json'
);
assert.deepEqual(cpr.productionRecords, []);

const pkg = readJson('package.json');
assert.equal(
  pkg.scripts['check:wpr-w20'],
  'node scripts/check-wpr-w20-reality-journey-production.mjs'
);
assert.equal(pkg.scripts['check:wpr-reality'], 'npm run check:wpr-w20');
assert.ok(pkg.scripts['check:wpr'].includes('npm run check:wpr-reality'));
assert.equal(pkg.scripts.postcheck.includes('check:wpr'), false);
assert.equal(pkg.scripts.postcheck.includes('check:jr'), false);

for (const file of [
  'assets/css/wpr-reality-journey-production.css',
  'assets/js/pages/reality-journey-production.js',
  'assets/js/pages/reality-dashboard-jr-v2.js',
  'content/web-production/contracts/wpr-reality-journey-production-v1.json',
  'content/web-production/composition/customer/reality-journey-composition-v1.json'
]) {
  assert.ok(exists(file), `WPR_W20_FILE_MISSING:${file}`);
}

console.log('✓ WPR-W20 Reality Journey Production Composition passed.');
console.log('✓ JR v2 canonical stage authority is projected read-only; legacy M3C/PDS journey views remain compatibility-only.');
console.log('✓ No live JR/RRE persistence, RNE/LRM execution, professional responsibility or WPR-W21 method execution is claimed.');
