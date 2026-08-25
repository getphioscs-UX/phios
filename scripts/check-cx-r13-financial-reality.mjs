import assert from 'node:assert/strict';
import fs from 'node:fs';
import { onRequestGet, onRequestPost } from '../functions/api/customer-financial-reality.js';
import { projectFinancialForCustomer } from '../functions/customer-projection/financial-customer-projection.js';

const read = relativePath => fs.readFileSync(relativePath, 'utf8');
const json = relativePath => JSON.parse(read(relativePath));
const acceptance = json('content/customer-experience-rebuild/acceptance/cx-r13-acceptance-v1.json');
const cutover = json('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v1.json');
const surface = cutover.surfaces.find(entry => entry.surfaceId === 'FINANCIAL_REALITY');

assert.equal(acceptance.status, 'FINANCIAL_REALITY_CX_CODE_ACTIVE_BROWSER_PENDING');
assert.equal(acceptance.exit, 'FINANCIAL_REALITY_CX_READY');
assert.equal(acceptance.productionBrowserAcceptance, 'PENDING_DEPLOYMENT');
assert.equal(acceptance.backendAuthorityRebuilt, false);
assert.equal(surface.canonicalPath, '/professional/financial/');
assert.equal(surface.htmlPath, 'professional/financial/index.html');
assert.deepEqual(surface.legacyRoutes, ['/financial-reality', '/financial']);

const html = read(surface.htmlPath);
for (const marker of [
  'data-cx-surface="FINANCIAL_REALITY"', 'href="/professional/financial/"',
  'data-cx-financial-form', 'data-cx-financial-results', 'data-cx-financial-handoff',
  'data-cx-tab="position"', 'data-cx-tab="cashflow"', 'data-cx-tab="assets"',
  'data-cx-tab="liabilities"', 'data-cx-tab="protection"', 'data-cx-tab="goals"',
  'data-cx-tab="findings"', 'data-cx-tab="review"',
  '/assets/customer-ui/js/shell.js', '/assets/customer-ui/js/surfaces/financial-reality.js'
]) assert.ok(html.includes(marker), `Financial Reality surface missing: ${marker}`);
assert.equal(html.includes('/assets/css/phios-public-v2.css'), false);
assert.equal(html.includes('/assets/js/public-shell-v2.js'), false);
assert.equal(html.includes('guaranteed return'), false);
assert.equal(html.includes('checkout'), false);

const controller = read('assets/customer-ui/js/surfaces/financial-reality.js');
for (const marker of ['/api/customer-financial-reality', 'handoffToMyReality', "sourceType:'FINANCIAL_REALITY'", 'Nothing was saved automatically']) {
  assert.ok(controller.includes(marker), `Financial controller missing: ${marker}`);
}
const api = read('functions/api/customer-financial-reality.js');
for (const marker of ['runFinancialPreview', 'projectFinancialForCustomer', 'FINANCIAL_REALITY_PROCESSING_CONSENT_REQUIRED', 'rawFinancialRuntimeExposed:false', 'persisted:false', 'professionalRecommendationCreated:false']) {
  assert.ok(api.includes(marker), `Financial API missing: ${marker}`);
}

const fixture = projectFinancialForCustomer({
  schemaVersion: 'fixture', snapshot: { snapshotId: 'snapshot-1', asOfDate: '2026-08-25', baseCurrency: 'MYR', persisted: false, evidenceState: 'REPORTED' },
  calculation: { metrics: { netWorth: 320000, grossAssets: 500000, totalLiabilities: 180000, monthlyIncome: 12000, monthlyExpenses: 7000, cashFlowSurplus: 5000 } },
  findings: [{ findingCode: 'CONCENTRATION', findingType: 'EXPOSURE', summary: 'Concentrated position', evidenceState: 'REPORTED', limitations: ['Document verification pending'] }],
  professionalHandoff: { available: true, productNeutral: true, route: '/professional/financial/' },
  boundaries: { adviceCreated: false, recommendationCreated: false, professionalJudgmentCreated: false }
}, { intake: { liquidAssets: 30000, unknowns: 'One liability value is missing' }, locale: 'en' });
assert.equal(fixture.currentPosition[0].value, 320000);
assert.equal(fixture.cashflow.find(item => item.label === 'Cash-flow surplus').value, 5000);
assert.equal(fixture.unknowns[0].evidenceState, 'REPORTED');
assert.equal(fixture.authorityLayers.professionalRecommendation.present, false);
assert.equal(fixture.governance.calculates, false);
assert.equal(fixture.governance.recommends, false);
assert.deepEqual(fixture.priorities, { state: 'NOT_CREATED_BY_ADAPTER', items: [] });
assert.deepEqual(fixture.options, { state: 'NOT_CREATED_BY_ADAPTER', items: [] });
assert.ok(Object.isFrozen(fixture));

const getResponse = await onRequestGet();
assert.equal(getResponse.status, 405);
assert.equal((await getResponse.json()).error, 'CUSTOMER_FINANCIAL_REALITY_POST_ONLY');
const denied = await onRequestPost({ request: new Request('https://phios.test/api/customer-financial-reality', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ monthlyIncome: 12000 }) }) });
assert.equal(denied.status, 403);
assert.equal((await denied.json()).error, 'FINANCIAL_REALITY_PROCESSING_CONSENT_REQUIRED');

const authority = json('content/registry/financial-authority-boundary.json');
assert.equal(authority.rules.productSpecificAdviceEnabled, false);
assert.equal(authority.rules.outOfScopeSignOffAllowed, false);
const redirects = read('_redirects');
for (const legacy of surface.legacyRoutes) assert.ok(redirects.includes(`${legacy} /professional/financial/ 308`), legacy);
console.log('✓ CX-R13 Financial Reality passed: consent-gated intake, deterministic projection, evidence states and professional-review boundary are CX-active without legacy presentation.');
