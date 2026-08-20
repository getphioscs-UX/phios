import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assertCkaRealityContextAuthorization,
  buildCkaRjxHandoffRecord,
  evaluateCkaKnowledgeCards,
  normalizeTrustedCkaAccess,
  projectCkaW18W33Consumption,
  resolveCkaEntitlements
} from '../functions/_lib/client-knowledge-ask-c.js';
import {
  normalizeCkaGuidedContext,
  normalizeCkaKnowledgeContext,
  projectCkaW5W17Envelope
} from '../functions/_lib/client-knowledge-ask-b.js';

const text = path => fs.readFileSync(path, 'utf8');
const read = path => JSON.parse(text(path));
const exists = path => assert.ok(fs.existsSync(path), `Missing CKA-W18-W33 dependency: ${path}`);
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const baseline = '311fad7653785b8f0d14d5a0a154cce3f1303eb5';

const paths = Object.freeze({
  contract: 'content/client/knowledge-ask/contracts/cka-w18-w33-client-consumption-contract-v1.json',
  handoff: 'content/client/knowledge-ask/contracts/cka-rjx-handoff-contract-v1.json',
  responsive: 'content/client/knowledge-ask/contracts/cka-bfr-h12-responsive-binding-v1.json',
  registry: 'content/client/knowledge-ask/registries/cka-entry-surface-registry-v2.json',
  audit: 'content/client/knowledge-ask/evidence/cka-w18-w33-client-consumption-audit-v1.json',
  reconciliation: 'content/client/knowledge-ask/reconciliation/cka-kap-phase18-client-consumption-reconciliation-v1.json',
  freeze: 'content/client/knowledge-ask/freeze/cka-w18-w33-client-consumption-freeze-v1.json',
  acceptance: 'content/client/knowledge-ask/acceptance/cka-production-acceptance-v1.json',
  homepage: 'index.html', account: 'account.html', dashboard: 'reality-dashboard.html', search: 'knowledge-search.html',
  searchC: 'assets/js/pages/knowledge-search-c.js', askClient: 'assets/js/knowledge/ask-phios-client.js',
  accountClient: 'assets/js/pages/account-cka.js', dashboardClient: 'assets/js/pages/reality-dashboard-cka.js',
  accountApi: 'functions/api/cka-account.js', dashboardApi: 'functions/api/cka-reality-context.js', askApi: 'functions/api/ask-phios-consumption.js', legacyAskApi: 'functions/api/ask-phios.js',
  cLib: 'functions/_lib/client-knowledge-ask-c.js', searchCss: 'assets/css/knowledge-search.css', dashboardCss: 'assets/css/reality-dashboard.css',
  bfr: 'content/web-production/bfr-responsive-production-matrix-v1.json',
  fixture: 'content/knowledge/answer-projection/fixtures/ask-phios-response.strong.valid.json',
  package: 'package.json'
});
Object.values(paths).forEach(exists);

const contract = read(paths.contract);
const handoff = read(paths.handoff);
const responsive = read(paths.responsive);
const registry = read(paths.registry);
const audit = read(paths.audit);
const reconciliation = read(paths.reconciliation);
const freeze = read(paths.freeze);
const acceptance = read(paths.acceptance);
const bfr = read(paths.bfr);
const fixture = read(paths.fixture);
const homepage = text(paths.homepage);
const account = text(paths.account);
const dashboard = text(paths.dashboard);
const search = text(paths.search);
const searchC = text(paths.searchC);
const askClient = text(paths.askClient);
const accountClient = text(paths.accountClient);
const dashboardClient = text(paths.dashboardClient);
const accountApi = text(paths.accountApi);
const dashboardApi = text(paths.dashboardApi);
const askApi = text(paths.askApi);
const cLib = text(paths.cLib);
const pkg = read(paths.package);

for (const artifact of [contract, handoff, responsive, registry, audit, reconciliation, freeze, acceptance]) {
  assert.equal(artifact.baselineCommit, baseline);
}
assert.deepEqual(contract.works.map(item => item.work), Array.from({ length: 16 }, (_, i) => `CKA-W${i + 18}`));

// W18 Homepage integration: entry only, never a full answer UI in Hero.
const w18 = contract.works.find(item => item.work === 'CKA-W18');
assert.equal(w18.rule, 'CKA_ENTRY_NOT_FULL_ANSWER_UI_IN_HERO');
assert.match(homepage, /data-hpc2-scene="H04"/);
assert.match(homepage, /data-hpc2-ask-position="H04_CONTEXTUAL_ENTRY"/);
assert.match(homepage, /data-hpc2-scene="H05"/);
assert.match(homepage, /data-hpc2-scene="H07"/);
assert.ok(count(homepage, /entrySurface=HOMEPAGE/g) >= 3);
assert.doesNotMatch(homepage.slice(0, homepage.indexOf('data-hpc2-scene="H04"')), /data-cka-answer|data-cka-composer/);
assert.equal(w18.placements.find(item => item.placement === 'H09_CONTINUATION_SECONDARY_ACTION').state, 'NONE_BY_DESIGN_HPC2_H09_DEFERRED');

// W19 Account: provider + retention gated; Guest never gets hidden local history.
assert.match(account, /data-cka-account hidden/);
assert.match(account, /assets\/js\/pages\/account-cka\.js/);
assert.match(accountApi, /context\?\.data\?\.ckaAccountSummary/);
assert.match(accountApi, /retentionPolicyAccepted/);
assert.doesNotMatch(`${accountClient}\n${accountApi}`, /localStorage|sessionStorage/);
const guestEntitlements = resolveCkaEntitlements({ accountState: 'GUEST' });
assert.deepEqual(guestEntitlements.capabilities, ['LIMITED_ASK']);
const accountWithoutRetention = resolveCkaEntitlements({ accountState: 'ACCOUNT' });
assert.deepEqual(accountWithoutRetention.capabilities, ['LIMITED_ASK']);
const accountWithRetention = resolveCkaEntitlements({ accountState: 'ACCOUNT', retentionPolicyAccepted: true });
assert.ok(accountWithRetention.capabilities.includes('HISTORY') && accountWithRetention.capabilities.includes('SAVE'));

// W20 Reality Dashboard: explicit disclosure + trusted authorization, never browser-state upload.
assert.match(dashboard, /data-cka-reality-dashboard hidden/);
assert.match(dashboard, /data-cka-reality-disclosure/);
assert.match(dashboard, /assets\/js\/pages\/reality-dashboard-cka\.js/);
assert.match(dashboardApi, /assertCkaRealityContextAuthorization/);
assert.match(dashboardClient, /Using current Reality context/);
assert.doesNotMatch(`${dashboardClient}\n${dashboardApi}`, /localStorage|sessionStorage/);
assert.throws(() => assertCkaRealityContextAuthorization({
  access: {}, realityContext: { realityCaseId: 'R-1' }, useCurrentRealityContext: true
}), /CKA_REALITY_CONTEXT_NOT_AUTHORIZED/);
const authorizedReality = assertCkaRealityContextAuthorization({
  access: { accountState: 'ACCOUNT', permission: true, privacy: true, entitlement: true },
  realityContext: { realityCaseId: 'R-1', disclosureItems: [{ label: 'Stage', value: 'Review' }] },
  useCurrentRealityContext: true
});
assert.equal(authorizedReality.authorized, true);

// W21 Journey handoff contract: exact requested fields; routing signals are not Reality Truth.
assert.deepEqual(handoff.required, ['sourceQuestion','sourceAnswer','userSelectedContext','observedSignals','unknowns','suggestedReasonForJourney','consentState']);
assert.equal(handoff.governance.preCreatedRealityTruth, false);
const handoffRecord = buildCkaRjxHandoffRecord({
  sourceQuestion: 'Why?', sourceAnswer: 'Grounded answer', userSelectedContext: ['work'],
  observedSignals: [{ code: 'PERSISTENT', label: 'Persistent' }], unknowns: ['cause'],
  suggestedReasonForJourney: 'Needs continuity', consentState: 'REQUIRED'
});
assert.equal(handoffRecord.observedSignals[0].authorityClass, 'ROUTING_SIGNAL_NOT_REALITY_TRUTH');
assert.equal(handoffRecord.governance.preCreatedRealityTruth, false);

// W22 Locale: complete answer chrome is successor-localized without mutating frozen W5-W17 HTML/JS.
for (const token of ['Question','Direct answer','Related knowledge','Sources and grounding','What PHI OS does not yet know','Ask PHI OS']) assert.match(search, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
for (const token of ['问题','直接回答','相关知识','来源与依据','PHI OS 目前仍不知道什么','询问 PHI OS']) assert.match(searchC, new RegExp(token));
assert.match(searchC, /volume: '册别'/);
assert.match(searchC, /contentType: '内容类型'/);
assert.match(searchC, /onLocaleChange\(applyLocale\)/);

// W23 Responsive: bind existing BFR-H12 matrix, do not create breakpoint authority.
assert.deepEqual(responsive.viewports, [360,390,430,768,1024,1280,1440]);
const askMatrix = bfr.matrix.filter(item => item.surfaceFamily === 'Ask PHI OS');
assert.equal(askMatrix.length, 14);
assert.deepEqual([...new Set(askMatrix.map(item => item.viewport))], responsive.viewports);
assert.deepEqual([...new Set(askMatrix.map(item => item.locale))].sort(), ['en','zh-Hans']);
assert.equal(responsive.createsBreakpointAuthority, false);
assert.match(text(paths.searchCss), /max-width:\s*430px/);
assert.match(text(paths.dashboardCss), /max-width:\s*768px/);

// W24 Accessibility.
assert.match(search, /<label for="cka-question">Question<\/label>/);
assert.match(search, /data-cka-grounding/);
assert.match(searchC, /aria-describedby/);
assert.match(searchC, /aria-busy/);
assert.match(searchC, /submit\.disabled/);
assert.match(searchC, /aria-expanded/);
assert.match(searchC, /DIRECT_ANSWER.*h2.*focus/s);
assert.match(searchC, /dataset\.state === 'error'/);

// W25 Privacy.
assert.match(askClient, /method:\s*'POST'/);
assert.match(askClient, /cache:\s*'no-store'/);
assert.doesNotMatch(askClient, /URLSearchParams|\/api\/ask-phios\?/);
assert.match(askClient, /\/api\/ask-phios-consumption/);
assert.doesNotMatch(`${askClient}\n${searchC}\n${accountClient}\n${dashboardClient}`, /localStorage|sessionStorage/);
assert.match(askApi, /context\?\.data\?\.ckaAccess/);
assert.match(askApi, /context\?\.data\?\.ckaRealityContext/);
assert.match(askApi, /CKA_PRIVATE_CONTEXT_REQUIRES_POST/);
assert.match(cLib, /privateContextInAnalyticsPayload:\s*false/);
assert.match(cLib, /silentPrivateContextConsumption:\s*false/);
assert.match(cLib, /persistentCaseCreated:\s*false/);

// W26 Entitlement matrix.
const customer = resolveCkaEntitlements({ accountState: 'ACCOUNT', permission: true, privacy: true, entitlement: true, roles: ['ELIGIBLE_CUSTOMER'] });
assert.ok(customer.capabilities.includes('REALITY_AWARE_CONTEXT'));
const methodUser = resolveCkaEntitlements({ accountState: 'ACCOUNT', entitlement: true, roles: ['ELIGIBLE_METHOD_USER'] });
assert.ok(methodUser.capabilities.includes('METHOD_HANDOFF'));
const journeyUser = resolveCkaEntitlements({ accountState: 'ACCOUNT', entitlement: true, roles: ['JOURNEY_USER'] });
assert.ok(journeyUser.capabilities.includes('CONTINUITY'));
const professional = resolveCkaEntitlements({ accountState: 'ACCOUNT', roles: ['PROFESSIONAL'] });
assert.deepEqual(professional.capabilities, ['SEPARATE_PROFESSIONAL_SURFACE']);

// W27-W29: structured, bounded, no generic chat, no over-escalation, no forced login.
for (const section of ['DIRECT_ANSWER','WHAT_PHIOS_DOES_NOT_YET_KNOW','RELATED_KNOWLEDGE']) assert.match(search, new RegExp(`data-cka-section="${section}"`));
assert.doesNotMatch(`${askApi}\n${askClient}`, /\/api\/(?:chat|conversation)|unlimited chat/i);
assert.match(text('functions/_lib/client-knowledge-ask-b.js'), /authoritativeGate|automaticJourney|realityJourneyActivated|KAP_W24|requirement/s);
assert.match(homepage, /knowledge-search\?entrySurface=HOMEPAGE/);
assert.doesNotMatch(homepage, /knowledge-search[^"']*(?:login|account-required)/i);

// W30 Knowledge Cards: source metadata only; never KN-B prefix inference.
const cards = evaluateCkaKnowledgeCards(fixture, 'zh-Hans');
assert.ok(cards.length > 0 && cards.every(card => card.valid));
assert.ok(cards.every(card => card.ownershipInferredFromKnBPrefix === false));
const prefixTrap = evaluateCkaKnowledgeCards({ sources: [{ sourceType:'PUBLISHED_CANONICAL_ARTICLE', authorityLabel:'Published', nodeCode:'KN-B3-P1-001', bookCode:'BOOK-5', partCode:'P2', href:'/articles/x', questionScopedExcerpt:'x' }] }, 'en')[0];
assert.equal(prefixTrap.volume, 'BOOK-5');
assert.equal(prefixTrap.ownershipSource, 'SOURCE_BOOK_CODE');
assert.equal(prefixTrap.ownershipInferredFromKnBPrefix, false);

// W31 Grounding acceptance.
const envelope = projectCkaW5W17Envelope(fixture, {
  displayQuestion: fixture.answer.question,
  locale: fixture.answer.locale,
  guidedContext: normalizeCkaGuidedContext({ question: fixture.answer.question }),
  knowledgeContext: normalizeCkaKnowledgeContext({})
});
const consumption = projectCkaW18W33Consumption(fixture, envelope, { locale: fixture.answer.locale, access: normalizeTrustedCkaAccess({}) });
assert.equal(consumption.answerAcceptance.productionAnswerAccepted, true);
assert.equal(consumption.answerAcceptance.groundingValid, true);
assert.equal(consumption.answerAcceptance.knowledgeSourceValid, true);
assert.equal(consumption.answerAcceptance.unknownVisible, true);
assert.equal(consumption.governance.genericUnlimitedChat, false);

// W32 Surface consumption: no silent missing surface.
assert.equal(registry.records.length, 8);
assert.ok(registry.records.every(item => ['ACTIVE','NONE_BY_DESIGN'].includes(item.state)));
assert.deepEqual(registry.records.map(item => item.surface), ['Homepage','Knowledge Search','Library','Article','Book','Account','Reality Dashboard','Figure if enabled']);

// W33 scoped production acceptance only.
assert.equal(acceptance.status, 'CKA_PRODUCTION_READY');
assert.equal(acceptance.globalProductionAccepted, false);
assert.ok(Object.values(acceptance.gates).every(Boolean));
assert.equal(acceptance.responsiveEvidence.askMatrixStates, 14);
assert.equal(acceptance.responsiveEvidence.productionBrowserState, 'REVALIDATION_REQUIRED');
assert.equal(reconciliation.status, 'CLOSED_AT_CKA_SCOPE');
assert.equal(reconciliation.globalProductionAccepted, false);
assert.equal(freeze.status, 'CKA_W18_W33_FROZEN_AFTER_DETERMINISTIC_ACCEPTANCE');
assert.equal(audit.duplicateAuthorityCreated, false);

assert.equal(pkg.scripts['check:cka-w18-w33'], 'node scripts/check-cka-w18-w33.mjs');
assert.equal(pkg.scripts['check:cka-current'], 'npm run check:cka');

console.log('CKA-W18–W33 deterministic production acceptance passed.');
console.log('  Homepage: H04/H05/H07 ACTIVE; H09 explicit NONE_BY_DESIGN (HPC2 H09 deferred)');
console.log('  Account/Reality: trusted-provider fail-closed, explicit context disclosure, POST/no-store privacy boundary');
console.log('  Locale/Responsive/A11y: en + zh-Hans, BFR-H12 14 Ask states, successor accessibility overlay');
console.log('  CKA × KAP Phase 18: CLOSED_AT_CKA_SCOPE → CKA_PRODUCTION_READY (not global production accepted)');
