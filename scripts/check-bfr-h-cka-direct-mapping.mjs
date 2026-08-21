import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const readText = path => fs.readFileSync(path, 'utf8');
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const exists = path => fs.existsSync(path);

const paths = {
  contract: 'content/web-production/contracts/bfr-h-cka-direct-mapping-contract-v1.json',
  successor: 'content/web-production/reconciliation/bfr-h-cka-direct-mapping-current-successor-v1.json',
  audit: 'content/web-production/audits/bfr-h-cka-direct-mapping-audit-v1.json',
  acceptance: 'content/web-production/acceptance/bfr-h-cka-direct-mapping-acceptance-v1.json',
  h0: 'content/web-production/bfr-backend-capability-inventory-v1.json',
  h1: 'content/web-production/bfr-frontend-surface-inventory-v1.json',
  h2: 'content/web-production/bfr-capability-surface-gap-matrix-v1.json',
  h3: 'content/web-production/surface-production-manifest-v1.json',
  bfrAcceptance: 'content/web-production/acceptance/bfr-h-part-a-acceptance-v1.json',
  ckaAcceptance: 'content/client/knowledge-ask/acceptance/cka-production-acceptance-v1.json',
  ckaB: 'content/client/knowledge-ask/contracts/cka-w5-w17-batch-b-contract-v1.json',
  ckaC: 'content/client/knowledge-ask/contracts/cka-w18-w33-client-consumption-contract-v1.json',
  entryRegistry: 'content/client/knowledge-ask/registries/cka-entry-surface-registry-v2.json',
  entryLinks: 'assets/js/knowledge/cka-entry-links.js',
  bookModule: 'assets/js/pages/book-volume.js',
  articleModule: 'assets/js/pages/article.js',
  figureModule: 'assets/js/pages/figure-detail.js',
  accountModule: 'assets/js/pages/account-cka.js',
  realityModule: 'assets/js/pages/reality-dashboard-cka.js',
  askApi: 'functions/api/ask-phios-consumption.js',
  ckaRuntime: 'functions/_lib/client-knowledge-ask-c.js',
  handoff: 'content/client/knowledge-ask/contracts/cka-rjx-handoff-contract-v1.json'
};

for (const path of Object.values(paths)) assert.ok(exists(path), `Missing PART E dependency: ${path}`);

const contract = readJson(paths.contract);
const successor = readJson(paths.successor);
const audit = readJson(paths.audit);
const acceptance = readJson(paths.acceptance);
const h0 = readJson(paths.h0);
const h1 = readJson(paths.h1);
const bfrAcceptance = readJson(paths.bfrAcceptance);
const ckaAcceptance = readJson(paths.ckaAcceptance);
const ckaB = readJson(paths.ckaB);
const ckaC = readJson(paths.ckaC);
const entryRegistry = readJson(paths.entryRegistry);
const handoff = readJson(paths.handoff);

assert.equal(contract.part, 'PART-E');
assert.equal(contract.currentBaselineCommit, '64ead9a9addf56f4f83c28736bf205cdc9380c10');
assert.equal(contract.authorityInvariant.bfrOwnsCka, false);
assert.equal(contract.authorityInvariant.ckaOwnsBfr, false);
assert.equal(contract.authorityInvariant.bfrInventoriesCapabilitiesAndSurfaces, true);
assert.equal(contract.authorityInvariant.ckaConsumesGovernedCapabilities, true);
assert.equal(contract.authorityInvariant.historicalBfrSnapshotsRewritten, false);
assert.equal(contract.authorityInvariant.historicalCkaAcceptanceRewritten, false);

const expected = new Map([
  ['Grounded Answer', 'ACTIVE'],
  ['Knowledge Retrieval', 'ACTIVE'],
  ['Published Knowledge', 'ACTIVE'],
  ['Related Knowledge', 'ACTIVE'],
  ['Book', 'ACTIVE'],
  ['Article', 'ACTIVE'],
  ['Figure', 'ACTIVE'],
  ['Reality Runtime', 'CONDITIONAL'],
  ['Account', 'CONDITIONAL'],
  ['Journey', 'CONDITIONAL'],
  ['Method Runtime', 'NO_DIRECT_EXECUTION']
]);
assert.equal(contract.mappings.length, expected.size);
assert.deepEqual(new Set(contract.mappings.map(record => record.subject)), new Set(expected.keys()));
for (const record of contract.mappings) assert.equal(record.state, expected.get(record.subject), `${record.subject} mapping state drift`);
assert.equal(contract.mappings.find(record => record.subject === 'Figure').allowedAlternativeState, 'NONE_BY_DESIGN');

const h0ByCode = new Map(h0.records.map(record => [record.capabilityCode, record]));
const h1ByCode = new Map(h1.records.map(record => [record.surfaceCode, record]));
for (const code of ['GROUNDED_ANSWER', 'KNOWLEDGE_RETRIEVAL', 'PUBLISHED_KNOWLEDGE', 'RELATED_KNOWLEDGE', 'REALITY_RUNTIME', 'REALITY_JOURNEY', 'METHOD_RUNTIME']) {
  assert.ok(h0ByCode.has(code), `BFR-H0 missing capability ${code}`);
}
for (const code of ['ASK_PHIOS', 'INDIVIDUAL_BOOK', 'ARTICLE', 'FIGURE', 'ACCOUNT', 'REALITY_DASHBOARD', 'REALITY_JOURNEY', 'PERSONAL_REALITY']) {
  assert.ok(h1ByCode.has(code), `BFR-H1 missing surface ${code}`);
}
assert.equal(h0ByCode.get('GROUNDED_ANSWER').consumerState, 'ACTIVE');
assert.equal(h0ByCode.get('KNOWLEDGE_RETRIEVAL').consumerState, 'ACTIVE');
assert.equal(h0ByCode.get('PUBLISHED_KNOWLEDGE').consumerState, 'PARTIAL');
assert.match(h0ByCode.get('PUBLISHED_KNOWLEDGE').notes.join(' '), /Homepage/i);
assert.equal(h0ByCode.get('RELATED_KNOWLEDGE').consumerState, 'PARTIAL');
assert.match(h0ByCode.get('RELATED_KNOWLEDGE').notes.join(' '), /CKA|contextual/i);

assert.match(bfrAcceptance.status, /^BFR_H_PART_A_/);
assert.equal(bfrAcceptance.exitGate.fullProductionPromotion, false);
assert.equal(ckaAcceptance.status, 'CKA_PRODUCTION_READY');
assert.equal(ckaAcceptance.globalProductionAccepted, false);
assert.equal(ckaAcceptance.gates.noMethodExecutionLeakage, true);
assert.equal(ckaAcceptance.gates.noAutomaticJourneyEscalation, true);
assert.equal(ckaAcceptance.gates.accountBoundaryValid, true);
assert.equal(ckaAcceptance.gates.privacyValid, true);

const workB = id => ckaB.works.find(record => record.work === id);
const workC = id => ckaC.works.find(record => record.work === id);
assert.deepEqual(workB('CKA-W8').pipeline, ['QUESTION', 'INTENT', 'KNOWLEDGE_RETRIEVAL', 'PUBLISHED_OR_AUTHORIZED_KNOWLEDGE', 'GROUNDING', 'ANSWER']);
assert.equal(workB('CKA-W8').llmMemoryOnlyAnswerAllowed, false);
assert.equal(workB('CKA-W9').runtimeOwner, 'KAP_GROUNDED_ANSWER');
assert.equal(workB('CKA-W9').secondAnswerRuntimeCreated, false);
assert.equal(workB('CKA-W14').inventedCardsAllowed, false);
assert.deepEqual(workB('CKA-W15').ctas, ['Ask about this volume', 'Ask about this article', 'Ask about this figure']);
assert.equal(workB('CKA-W12').askIsMethodExecution, false);
assert.ok(workB('CKA-W12').personalRuntimePath.includes('MPA_ELIGIBILITY'));

assert.equal(workC('CKA-W19').trustedAccountProviderRequired, true);
assert.equal(workC('CKA-W19').retentionPolicyRequired, true);
assert.equal(workC('CKA-W19').guestPersistentHiddenHistory, false);
assert.equal(workC('CKA-W20').canReadCurrentCaseContext, true);
assert.equal(workC('CKA-W20').explicitDisclosure, 'Using current Reality context');
assert.equal(workC('CKA-W20').silentPrivateContextConsumption, false);
assert.equal(workC('CKA-W20').trustedServerAuthorizationRequired, true);
assert.equal(workC('CKA-W21').preCreatedRealityTruth, false);
assert.equal(workC('CKA-W25').requestTransport, 'POST_JSON_NO_STORE');
assert.equal(workC('CKA-W26').matrix['Eligible Customer'], 'Reality-aware context');
assert.equal(workC('CKA-W26').matrix['Eligible Method User'], 'Method handoff');
assert.equal(workC('CKA-W28').routing.simple, 'answer');
assert.match(workC('CKA-W28').routing.complex, /KAP W24 YES \+ explicit consent/);
assert.deepEqual(workC('CKA-W31').required, ['grounding state', 'knowledge source', 'unknown', 'authority boundary']);

const entries = new Map(entryRegistry.records.map(record => [record.entrySurface, record]));
for (const code of ['BOOK', 'ARTICLE', 'FIGURE']) assert.equal(entries.get(code)?.state, 'ACTIVE', `${code} contextual entry not ACTIVE`);
assert.equal(entries.get('FIGURE').boundary, 'FIGURE_CODE_REQUIRED');
assert.equal(entries.get('ACCOUNT').boundary, 'TRUSTED_ACCOUNT_PROVIDER_AND_RETENTION_FAIL_CLOSED');
assert.equal(entries.get('REALITY_DASHBOARD').boundary, 'TRUSTED_AUTHORIZATION_AND_EXPLICIT_CONTEXT_DISCLOSURE');

const entryLinks = readText(paths.entryLinks);
assert.match(entryLinks, /Ask about this volume/);
assert.match(entryLinks, /Ask about this article/);
assert.match(entryLinks, /Ask about this figure/);
for (const path of [paths.bookModule, paths.articleModule, paths.figureModule]) assert.match(readText(path), /cka-entry-links\.js/, `${path} does not consume shared CKA contextual entry`);

const askApi = readText(paths.askApi);
assert.match(askApi, /runAskPhiosPipeline/);
assert.match(askApi, /composeCkaRealityAwareRetrievalQuestion/);
assert.match(askApi, /requestTransport: 'POST_JSON_NO_STORE'/);
assert.match(askApi, /methodExecuted: false/);
assert.doesNotMatch(askApi, /method-execute/);

const ckaRuntime = readText(paths.ckaRuntime);
assert.match(ckaRuntime, /REALITY_AWARE_CONTEXT/);
assert.match(ckaRuntime, /Using current Reality context/);
assert.match(ckaRuntime, /CKA_REALITY_CONTEXT_NOT_AUTHORIZED/);

const accountModule = readText(paths.accountModule);
assert.match(accountModule, /\/api\/cka-account/);
assert.match(accountModule, /if \(!root \|\| !payload\?\.available\) return/);
assert.match(accountModule, /root\.hidden = true/);

const realityModule = readText(paths.realityModule);
assert.match(realityModule, /Using current Reality context/);
assert.match(realityModule, /Ask without private Reality context/);

assert.equal(handoff.required.includes('consentState'), true);
assert.equal(handoff.governance.explicitConsentRequiredBeforeHandoff, true);
assert.ok(handoff.prohibited.includes('automatic Reality Journey activation'));

assert.equal(successor.part, 'PART-E');
assert.equal(successor.status, 'BFR_H_CKA_CURRENT_CONSUMPTION_RECONCILED_HISTORICAL_SNAPSHOTS_PRESERVED');
for (const key of ['backendInventory', 'frontendInventory', 'gapMatrix', 'surfaceManifest', 'partAAcceptance']) {
  const ref = successor.historicalBfrSnapshot[key];
  assert.equal(ref.sha256, sha256(ref.path), `Historical BFR snapshot drift: ${ref.path}`);
}
assert.equal(successor.historicalBfrSnapshot.rewritten, false);
for (const key of ['productionAcceptance', 'w5w17Contract', 'w18w33Contract', 'entryRegistry']) {
  const ref = successor.currentCkaAuthority[key];
  assert.equal(ref.sha256, sha256(ref.path), `CKA authority drift: ${ref.path}`);
}
assert.equal(successor.successorFacts.figureContextualEntryCurrentState, 'ACTIVE');
assert.equal(successor.successorFacts.realityAwareMode, 'CONDITIONAL');
assert.equal(successor.successorFacts.accountHistorySave, 'CONDITIONAL');
assert.equal(successor.successorFacts.journeyEscalation, 'CONDITIONAL');
assert.equal(successor.successorFacts.methodRuntimeDirectExecution, false);
assert.equal(successor.authorityPreservation.currentConsumptionOnly, true);
assert.equal(successor.authorityPreservation.bfrHistoricalGapStatesRewritten, false);

assert.equal(audit.result, 'PART_E_MAPPING_COMPLETE_CURRENT_CONSUMPTION_ONLY');
assert.equal(acceptance.status, 'BFR_H_CKA_DIRECT_MAPPING_READY');
assert.deepEqual(acceptance.mappingState, Object.fromEntries(expected));
assert.equal(acceptance.gates.methodDirectExecutionBlocked, true);
assert.equal(acceptance.gates.noSecondAuthority, true);
assert.equal(acceptance.globalProductionAccepted, false);
assert.equal(acceptance.next, 'PART-F-FULL-EXECUTION-ORDER-RECONCILIATION');

console.log('✓ PART E BFR-H × CKA Mapping passed.');
console.log('  ACTIVE: Grounded Answer, Knowledge Retrieval, Published Knowledge, Related Knowledge, Book, Article, Figure');
console.log('  CONDITIONAL: Reality Runtime, Account history/save, Journey escalation');
console.log('  NO_DIRECT_EXECUTION: Method Runtime');
console.log('  Historical BFR-H and CKA acceptance snapshots preserved.');
