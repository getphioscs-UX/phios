import assert from 'node:assert/strict';
import fs from 'node:fs';
import { onRequestGet, onRequestPost } from '../functions/api/customer-my-reality.js';
import { onRequestPost as onHandoffPost } from '../functions/api/customer-reality-handoff.js';
import { projectRealityForCustomer } from '../functions/customer-projection/reality-customer-projection.js';

const read = relativePath => fs.readFileSync(relativePath, 'utf8');
const json = relativePath => JSON.parse(read(relativePath));
const acceptance = json('content/customer-experience-rebuild/acceptance/cx-r10-acceptance-v1.json');
const cutover = json('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v1.json');
const surface = cutover.surfaces.find(entry => entry.surfaceId === 'MY_REALITY');

assert.equal(acceptance.status, 'MY_REALITY_CX_CODE_ACTIVE_BROWSER_PENDING');
assert.equal(acceptance.exit, 'MY_REALITY_CX_READY');
assert.equal(acceptance.productionBrowserAcceptance, 'PENDING_DEPLOYMENT');
assert.equal(acceptance.backendAuthorityRebuilt, false);
assert.equal(surface.canonicalPath, '/reality/');
assert.equal(surface.htmlPath, 'reality/index.html');
assert.deepEqual(surface.legacyRoutes, ['/my-reality', '/reality-dashboard']);

const html = read(surface.htmlPath);
for (const marker of [
  'data-cx-surface="MY_REALITY"', 'href="/reality/"', 'data-cx-start-reality',
  'data-cx-reality-form', 'data-cx-workspace', 'data-cx-panel="overview"',
  'data-cx-panel="current"', 'data-cx-panel="perspectives"', 'data-cx-panel="reading"',
  'data-cx-panel="navigation"', 'data-cx-panel="actions"', 'data-cx-panel="review"',
  'data-cx-panel="history"', 'data-cx-panel="reports"', 'ILL-010',
  '/assets/customer-ui/js/shell.js', '/assets/customer-ui/js/surfaces/my-reality.js'
]) assert.ok(html.includes(marker), `My Reality surface missing: ${marker}`);
assert.equal(html.includes('/assets/css/phios-public-v2.css'), false);
assert.equal(html.includes('/assets/js/public-shell-v2.js'), false);

const controller = read('assets/customer-ui/js/surfaces/my-reality.js');
for (const marker of ['/api/customer-my-reality', 'credentials:\'same-origin\'', 'PHIOS_CX_REALITY_HANDOFF', 'event.origin!==location.origin']) {
  assert.ok(controller.includes(marker), `My Reality controller missing: ${marker}`);
}
const api = read('functions/api/customer-my-reality.js');
for (const marker of ['buildCurrentRealityBundle', 'projectRealityForCustomer', 'REALITY_PROCESSING_CONSENT_REQUIRED', 'persisted:false', 'canonicalRealityCreated:false', 'rawRuntimeExposed:false']) {
  assert.ok(api.includes(marker), `My Reality API missing: ${marker}`);
}
assert.equal(api.includes('localStorage'), false);
assert.equal(api.includes('sessionStorage'), false);

const fixture = projectRealityForCustomer({
  bundle: {
    schemaVersion: 'fixture', bundleId: 'bundle-1', sourceType: 'ASK', createdAt: '2026-08-25T00:00:00Z',
    lanes: { userQuestion: 'What is changing?', reportedContext: ['Reported context'], unknown: ['Unknown point'], perspectiveReferences: [{ projectionId: 'projection-1', methodLabel: 'Perspective', realityFact: false }], calculations: [{ code: 'value', value: 7, professionalJudgment: false }], findings: [{ findingCode: 'finding', summary: 'Finding', recommendation: false }] },
    classification: { perspectivesRemainPerspectives: true, calculationsRemainCalculations: true, findingsRemainFindings: true },
    governance: { persisted: false, canonicalRealityCreated: false },
    continuation: { currentStage: 'REALITY', nextAvailableStages: ['READING'], deepWorkflowAutomatic: false, persistentContinuationRequiresExplicitConsent: true }
  }
});
assert.equal(fixture.state, 'READY');
assert.deepEqual(fixture.currentReality.unknown, ['Unknown point']);
assert.equal(fixture.perspectives.items[0].realityFact, false);
assert.equal(fixture.currentReality.calculations[0].professionalJudgment, false);
assert.equal(fixture.currentReality.findings[0].recommendation, false);
assert.equal(fixture.continuation.deepWorkflowAutomatic, false);
assert.equal(fixture.governance.persisted, false);
assert.equal(fixture.governance.canonicalRealityCreated, false);
assert.ok(Object.isFrozen(fixture));

const getResponse = await onRequestGet({ request: new Request('https://phios.test/api/customer-my-reality?locale=zh-Hans'), data: {} });
const getBody = await getResponse.json();
assert.equal(getResponse.status, 200);
assert.equal(getResponse.headers.get('cache-control'), 'no-store');
assert.equal(getBody.view.locale, 'zh-Hans');
assert.equal(getBody.governance.persisted, false);
assert.equal(getBody.governance.rawRuntimeExposed, false);
const denied = await onRequestPost({ request: new Request('https://phios.test/api/customer-my-reality', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ whatIsHappening: 'Context' }) }) });
assert.equal(denied.status, 403);
assert.equal((await denied.json()).error, 'REALITY_PROCESSING_CONSENT_REQUIRED');
const handoffDenied = await onHandoffPost({ request: new Request('https://phios.test/api/customer-reality-handoff', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceType: 'ASK' }) }) });
assert.equal(handoffDenied.status, 403);
assert.equal((await handoffDenied.json()).error, 'MY_REALITY_HANDOFF_CONSENT_REQUIRED');

const redirects = read('_redirects');
for (const legacy of surface.legacyRoutes) assert.ok(redirects.includes(`${legacy} /reality/ 308`), legacy);
console.log('✓ CX-R10 My Reality passed: temporary customer projection, nine-section workspace, explicit consent and same-origin handoff remain authority-separated.');
