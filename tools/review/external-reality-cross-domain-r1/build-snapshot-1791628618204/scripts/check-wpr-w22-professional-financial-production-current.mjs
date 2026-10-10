import assert from 'node:assert/strict';
import { BASELINE, readJson, readText, exists } from './lib/web-production/wpr-professional-report-v1.mjs';

const c = readJson('content/web-production/contracts/wpr-professional-financial-production-v1.json');
assert.equal(c.baselineCommit, BASELINE);
assert.equal(c.work, 'WPR-W22');
assert.equal(c.status, 'ACTIVE_LIMITED_PRODUCTION_PR_HUMAN_AUTHORITY_GATED_FINANCIAL_PRODUCT_NEUTRAL');
for (const value of Object.values(c.nonAuthority)) assert.equal(value, false);

const pr = readJson('content/runtime/professional-runtime/freeze/pr-v2-freeze-v1.json');
assert.equal(pr.status, 'PR-v2.0.0-FROZEN');
assert.equal(pr.productionState, 'GOVERNED_PROFESSIONAL_RUNTIME_READY_HUMAN_AUTHORITY_GATED');
assert.equal(pr.authorityClosure.professionalJudgmentAuthority, 'PR_ONLY_HUMAN_ATTRIBUTABLE');
assert.equal(pr.nonAuthority.prCreatesReport, false);
const pab = readJson('content/runtime/professional-runtime/contracts/professional-authority-boundary-v2.json');
assert.equal(pab.rules.onlyPrW4MayCreateProfessionalJudgment, true);
assert.equal(pab.rules.professionalJudgmentRequiresHumanAttribution, true);
assert.equal(pab.rules.rrRemainsReportAssemblyAuthority, true);

const fin = readJson('content/registry/financial-authority-boundary.json');
assert.equal(fin.rules.productSpecificAdviceEnabled, false);
assert.equal(fin.rules.outOfScopeSignOffAllowed, false);
const pub = readJson('content/registry/m4a-w6-financial-public-pages.json');
assert.equal(pub.route, '/professional/financial');
assert.equal(pub.boundaries.checkout_enabled, false);
assert.equal(pub.boundaries.future_financial_outcome_guaranteed, false);

const projection = readJson('content/web-production/registries/wpr-professional-financial-projection-registry-v1.json');
assert.equal(projection.baselineCommit, BASELINE);
assert.equal(projection.entries.length, 2);
assert.ok(projection.entries.every(entry => entry.projectionState === 'LIMITED_PRODUCTION'));
assert.equal(projection.rules.projectionIsNotProfessionalJudgment, true);
const surfaces = readJson('content/web-production/registries/wpr-surface-registry-v1.json');
assert.equal(surfaces.entries.find(entry => entry.surfaceCode === 'FINANCIAL').implementationState, 'LIMITED_PRODUCTION_DISCOVERY');
const routes = readJson('content/web-production/registries/wpr-route-registry-v1.json');
assert.equal(routes.entries.find(entry => entry.routeCode === 'FINANCIAL').implementationState, 'EXISTING');

const sources = readJson('content/web-production/registries/wpr-production-source-registry-v1.json');
for (const code of ['PR', 'FINANCIAL_RUNTIME']) assert.ok(sources.entries.some(entry => entry.sourceCode === code), code);
assert.equal(sources.entries.find(entry => entry.sourceCode === 'PR').professionalJudgmentAuthorityMayBeInferredByWpr, false);
assert.equal(sources.entries.find(entry => entry.sourceCode === 'FINANCIAL_RUNTIME').recommendationAuthorityMayBeInferredByWpr, false);
const consumption = readJson('content/web-production/registries/wpr-runtime-consumption-registry-v1.json');
assert.equal(consumption.entries.find(entry => entry.runtimeCode === 'PR').professionalJudgmentCreatedByWpr, false);
assert.equal(consumption.entries.find(entry => entry.runtimeCode === 'FINANCIAL_RUNTIME').financialCalculationExecutedByWpr, false);

const web = readJson('content/web-production/registries/canonical-web-production-registry-v1.json');
const records = web.productionRecords.filter(entry => entry.lineage?.wprWork === 'WPR-W22');
assert.equal(records.length, 4);
assert.deepEqual([...new Set(records.map(entry => entry.locale))].sort(), ['en', 'zh-Hans']);
assert.ok(records.every(entry => entry.productionState === 'LIMITED_PRODUCTION'));
assert.ok(records.filter(entry => entry.surfaceCode === 'FINANCIAL').every(entry => entry.renderPolicy.financialCalculationExecutionAllowed === false));

const px2Successor = readJson('content/web-production/px2/successors/px2-w11-checker-successor-v1.json');
assert.equal(px2Successor.status, 'ACTIVE');
const html = readText('professional/financial/index.html');
for (const marker of [
  'data-px2-surface="FINANCIAL"',
  '/assets/css/phios-public-v2.css',
  '/assets/js/public-shell-v2.js',
  'Financial Reality Navigation'
]) assert.ok(html.includes(marker), marker);

const services = readText('services.html');
assert.ok(services.includes('/professional/financial'));
const audit = readJson('content/web-production/audits/wpr-w22-professional-financial-authority-audit-v1.json');
for (const value of Object.values(audit.nonActivation)) assert.equal(value, false);
const acceptance = readJson('content/web-production/acceptance/wpr-w22-professional-financial-acceptance-v1.json');
assert.equal(acceptance.baselineCommit, BASELINE);
for (const value of Object.values(acceptance.nonActivation)) assert.equal(value, false);
for (const file of [
  'content/web-production/composition/professional/professional-financial-composition-v1.json',
  'docs/runtime/WPR-F-W22-W23-PROFESSIONAL-FINANCIAL-REPORT-SURFACES.md'
]) assert.ok(exists(file), file);

console.log('✓ WPR-W22 current Professional / Financial Production Surface passed through the active PX2 presentation successor.');
console.log('  PR human judgment authority and financial product-neutral boundaries remain upstream; WPR projects discovery only.');
