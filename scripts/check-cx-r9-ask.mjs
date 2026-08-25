import assert from 'node:assert/strict';
import fs from 'node:fs';
import { onRequestGet, onRequestPost } from '../functions/api/customer-ask.js';
import { projectKnowledgeAnswerForCustomer } from '../functions/customer-projection/knowledge-customer-projection.js';

const read = relativePath => fs.readFileSync(relativePath, 'utf8');
const json = relativePath => JSON.parse(read(relativePath));
const acceptance = json('content/customer-experience-rebuild/acceptance/cx-r9-acceptance-v1.json');
const factsContract = json('content/customer-experience-rebuild/contracts/current-facts-gateway-contract-v1.json');
const cutover = json('content/customer-experience-rebuild/migration/priority-route-cutover-registry-v1.json');
const surface = cutover.surfaces.find(entry => entry.surfaceId === 'ASK');

assert.equal(acceptance.status, 'ASK_CX_CODE_ACTIVE_BROWSER_PENDING');
assert.equal(acceptance.exit, 'ASK_CX_READY');
assert.equal(acceptance.productionBrowserAcceptance, 'PENDING_DEPLOYMENT');
assert.equal(acceptance.backendAuthorityRebuilt, false);
assert.equal(surface.canonicalPath, '/ask');
assert.equal(surface.htmlPath, 'ask.html');
assert.deepEqual(surface.legacyRoutes, ['/knowledge-search']);
assert.equal(factsContract.status, 'SERVER_GATEWAY_IMPLEMENTED_PROVIDER_FAIL_CLOSED');
assert.equal(factsContract.provider.browserDirectRetrieval, false);
assert.equal(factsContract.provider.providerRequiredForLiveCurrentFacts, true);
for (const value of Object.values(factsContract.boundaries)) assert.equal(value, false);

const html = read(surface.htmlPath);
for (const marker of [
  'data-cx-surface="ASK"', 'href="/ask"', 'data-cx-ask-form', 'data-cx-ask-mode="QUICK"',
  'data-cx-ask-mode="GUIDED"', 'data-cx-ask-mode="REALITY"', 'data-cx-ask-result',
  'data-cx-basis-sources', 'data-cx-current-facts-disclosure', 'data-cx-answer-limits',
  'data-cx-related-knowledge', 'data-cx-next-step', 'data-cx-ask-handoff-consent',
  '/assets/customer-ui/js/shell.js', '/assets/customer-ui/js/surfaces/ask.js'
]) assert.ok(html.includes(marker), `Ask surface missing: ${marker}`);
assert.equal(html.includes('/assets/css/phios-public-v2.css'), false);
assert.equal(html.includes('/assets/js/public-shell-v2.js'), false);

const controller = read('assets/customer-ui/js/surfaces/ask.js');
for (const marker of ['/api/customer-ask', 'handoffToMyReality', "sourceType:'ASK'", 'guidedContext', 'Current public facts are not PHI OS canonical knowledge']) {
  assert.ok(controller.includes(marker), `Ask controller missing: ${marker}`);
}
const api = read('functions/api/customer-ask.js');
for (const marker of ['runAskOrchestrated', 'retrieveCurrentFacts', 'projectKnowledgeAnswerForCustomer', 'rawAskRuntimeExposed:false', 'currentFactsCanonicalKnowledge:false', 'browserThirdPartyRetrieval:false']) {
  assert.ok(api.includes(marker), `Ask API missing: ${marker}`);
}

const fixture = projectKnowledgeAnswerForCustomer({
  clientAnswer: {
    question: 'What changed?', directAnswer: 'A bounded answer.', whyThisMayHappen: ['One governed explanation.'],
    unknown: { details: ['The outcome remains unknown.'] },
    relatedKnowledgeCards: [{ title: 'Related knowledge', description: 'A related article.', href: '/articles/related' }]
  }
}, { locale: 'zh-Hans', currentFacts: { state: 'AVAILABLE', retrievedAt: '2026-08-25T00:00:00Z', freshness: 'CURRENT', limitations: ['Provider coverage is bounded.'], evidence: [{ claimText: 'A current public fact.', publisher: 'Primary authority', sourceUrl: 'https://example.com/fact', authorityClass: 'PRIMARY', retrievedAt: '2026-08-25T00:00:00Z', freshnessState: 'CURRENT' }] } });
assert.equal(fixture.locale, 'zh-Hans');
assert.equal(fixture.answer.text, 'A bounded answer.');
assert.deepEqual(fixture.limits.items, ['The outcome remains unknown.']);
assert.equal(fixture.currentFacts.state, 'AVAILABLE');
assert.equal(fixture.currentFacts.evidence[0].claim, 'A current public fact.');
assert.equal(fixture.governance.currentFactsAreCanonicalKnowledge, false);
assert.equal(fixture.governance.recommends, false);
assert.ok(Object.isFrozen(fixture));

const getResponse = await onRequestGet();
assert.equal(getResponse.status, 405);
assert.equal((await getResponse.json()).error, 'CUSTOMER_ASK_POST_ONLY');
const missingQuestion = await onRequestPost({ request: new Request('https://phios.test/api/customer-ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }), env: {} });
assert.equal(missingQuestion.status, 400);
assert.equal((await missingQuestion.json()).error, 'ASK_QUESTION_REQUIRED');

const redirects = read('_redirects');
assert.ok(redirects.includes('/knowledge-search /ask 308'));
assert.ok(redirects.includes('/knowledge-search.html /ask 308'));
console.log('✓ CX-R9 Ask passed: Quick/Guided/Reality modes, source/limit disclosure, current-facts firewall and explicit My Reality handoff are CX-active.');
