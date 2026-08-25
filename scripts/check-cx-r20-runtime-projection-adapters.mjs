import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { projectRealityForCustomer } from '../functions/customer-projection/reality-customer-projection.js';
import { projectReadoutForCustomer } from '../functions/customer-projection/readout-customer-projection.js';
import { projectNavigationForCustomer } from '../functions/customer-projection/navigation-customer-projection.js';
import { projectMethodsForCustomer } from '../functions/customer-projection/method-customer-projection.js';
import { projectFinancialForCustomer } from '../functions/customer-projection/financial-customer-projection.js';
import { projectKnowledgeAnswerForCustomer } from '../functions/customer-projection/knowledge-customer-projection.js';
import { projectReportForCustomer } from '../functions/customer-projection/report-customer-projection.js';

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');
const json = relativePath => JSON.parse(read(relativePath));
const base = 'content/customer-experience-rebuild';
const contract = json(`${base}/contracts/customer-projection-adapter-contract-v1.json`);
const map = json(`${base}/registries/backend-customer-projection-map-v2.json`);
const acceptance = json(`${base}/acceptance/cx-r20-acceptance-v1.json`);

assert.equal(contract.work, 'CX-R20');
assert.deepEqual(contract.flow, ['RUNTIME_OUTPUT', 'CUSTOMER_PROJECTION_ADAPTER', 'CUSTOMER_VIEW_MODEL', 'CX_UI']);
assert.deepEqual(contract.allowedOperations, ['RENAME', 'GROUP', 'ORDER', 'FORMAT', 'LOCALIZE', 'HIDE_UNAUTHORIZED_FIELDS']);
assert.deepEqual(contract.forbiddenOperations, ['CALCULATE', 'INFER_NEW_FINDING', 'CHANGE_MEANING', 'RECOMMEND', 'CREATE_TRUTH']);
for (const key of ['backendAuthorityCreated', 'rawRuntimeProjectedToCxUi', 'viewModelIsAuthority']) {
  assert.equal(contract.rules[key], false, `CX projection boundary must remain closed: ${key}`);
}
assert.equal(contract.rules.unknownMustRemainVisible, true);

const adapterRoot = 'functions/customer-projection';
assert.equal(contract.adapters.length, 7);
for (const adapter of contract.adapters) {
  const relativePath = `${adapterRoot}/${adapter}`;
  assert.ok(fs.existsSync(path.join(root, relativePath)), `missing adapter ${relativePath}`);
  const source = read(relativePath);
  for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', 'indexedDB', 'WebSocket']) {
    assert.equal(source.includes(forbidden), false, `${adapter} may not perform ${forbidden}`);
  }
  assert.ok(source.includes('boundary()'), `${adapter} must project the common authority boundary`);
}
assert.equal(map.entries.length, 10);
assert.ok(map.entries.every(entry => entry.consumerMode === 'CONSUMER_ONLY' && entry.createsSecondAuthority === false));
assert.ok(map.entries.every(entry => entry.unresolvedSuggestedRoots.length === 0));
for (const value of Object.values(map.rules)) assert.equal(value, value === map.rules.cxConsumesOnly);

const expectedBoundary = {
  createsAuthority: false,
  calculates: false,
  infersNewFinding: false,
  changesMeaning: false,
  recommends: false,
  createsTruth: false
};
const assertProjection = (projection, schemaSuffix) => {
  assert.ok(Object.isFrozen(projection));
  assert.match(projection.schemaVersion, new RegExp(`:${schemaSuffix}$`));
  for (const [key, value] of Object.entries(expectedBoundary)) assert.equal(projection.governance[key], value, `${schemaSuffix}.${key}`);
};

const reality = projectRealityForCustomer({
  locale: 'zh-Hans',
  bundle: {
    schemaVersion: 'fixture', bundleId: 'bundle-1', sourceType: 'ASK',
    lanes: {
      userQuestion: '现在发生什么？', reportedContext: ['已申报处境'], unknown: ['仍未知'],
      perspectiveReferences: [{ projectionId: 'projection-1', methodLabel: '视角', realityFact: false }],
      calculations: [{ code: 'fixture_value', value: 12, professionalJudgment: false }],
      findings: [{ findingCode: 'fixture_finding', summary: '结构发现', recommendation: false }]
    },
    classification: { perspectivesRemainPerspectives: true, calculationsRemainCalculations: true, findingsRemainFindings: true },
    governance: { persisted: false, canonicalRealityCreated: false }
  }
});
assertProjection(reality, 'MY_REALITY');
assert.equal(reality.locale, 'zh-Hans');
assert.deepEqual(reality.currentReality.unknown, ['仍未知']);
assert.equal(reality.perspectives.items[0].realityFact, false);
assert.equal(reality.currentReality.calculations[0].value, 12);

const readout = projectReadoutForCustomer({ status: 'AVAILABLE', summary: 'Bounded summary', unknown: ['Open point'] });
assertProjection(readout, 'READOUT');
assert.deepEqual(readout.unknown, ['Open point']);
const navigation = projectNavigationForCustomer({ status: 'AVAILABLE', options: [{ id: 'observe', label: 'Observe' }] });
assertProjection(navigation, 'NAVIGATION');
assert.equal(navigation.governance.selectionMadeBySystem, false);

const methods = projectMethodsForCustomer({
  locale: 'en', intent: 'understand a pattern',
  projections: [{ projectionId: 'method-1', method: { publicMethodCode: 'NUMEROLOGY', publicLabels: { en: 'Numerology' }, status: 'AVAILABLE' }, calculation: { status: 'COMPLETE', values: [{ code: 'LIFE_PATH_NUMBER', value: 8 }], structures: [] }, unknown: ['unresolved_context'] }]
});
assertProjection(methods, 'PERSONAL_REALITY');
assert.equal(methods.governance.methodsRemainPerspectives, true);
assert.equal(methods.structure.methods[0].values[0].value, 8);
assert.equal(methods.details.openItems.length, 1);

const financial = projectFinancialForCustomer({
  schemaVersion: 'fixture', snapshot: { snapshotId: 'snapshot-1', asOfDate: '2026-08-25', baseCurrency: 'MYR', persisted: false, evidenceState: 'REPORTED' },
  calculation: { metrics: { netWorth: 320000, grossAssets: 500000, totalLiabilities: 180000 } },
  findings: [{ findingCode: 'CONCENTRATION', summary: 'Concentrated position', evidenceState: 'REPORTED' }],
  boundaries: { adviceCreated: false, recommendationCreated: false, professionalJudgmentCreated: false }
}, { intake: { unknowns: 'One value is missing' } });
assertProjection(financial, 'FINANCIAL_REALITY');
assert.equal(financial.currentPosition[0].value, 320000);
assert.equal(financial.unknowns[0].value, 'One value is missing');
assert.deepEqual(financial.priorities, { state: 'NOT_CREATED_BY_ADAPTER', items: [] });
assert.deepEqual(financial.options, { state: 'NOT_CREATED_BY_ADAPTER', items: [] });

const knowledge = projectKnowledgeAnswerForCustomer({
  clientAnswer: { directAnswer: 'Bounded answer', question: 'What changed?', unknown: { details: ['Current outcome is unknown'] }, relatedKnowledgeCards: [{ title: 'Related', href: '/articles/related' }] }
}, { currentFacts: { state: 'AVAILABLE', evidence: [{ claimText: 'Current fact', publisher: 'Authority', sourceUrl: 'https://example.com/fact', authorityClass: 'PRIMARY' }] } });
assertProjection(knowledge, 'ASK');
assert.equal(knowledge.governance.currentFactsAreCanonicalKnowledge, false);
assert.equal(knowledge.currentFacts.evidence[0].claim, 'Current fact');
assert.deepEqual(knowledge.limits.items, ['Current outcome is unknown']);

const report = projectReportForCustomer({ reportId: 'report-1', title: 'Report', sections: [{ code: 'overview', content: 'Summary' }], href: '/reports/report-1' });
assertProjection(report, 'REPORT');
assert.equal(report.sections[0].summary, 'Summary');

assert.equal(acceptance.work, 'CX-R20');
assert.equal(acceptance.status, 'RUNTIME_PROJECTION_ADAPTERS_IMPLEMENTED');
assert.equal(acceptance.exit, 'CUSTOMER_VIEW_MODEL_BOUNDARY_READY');
assert.equal(acceptance.productionBrowserAcceptance, 'PENDING_DEPLOYMENT');
assert.equal(acceptance.backendAuthorityRebuilt, false);

console.log('✓ CX-R20 Runtime Projection Adapters passed: 7 consume-only adapters produce frozen customer view models with Unknown and authority boundaries preserved.');
