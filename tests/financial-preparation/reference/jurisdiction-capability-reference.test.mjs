import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEATURES as F, INITIAL_REGISTRY, countApprovedWillBundles,
  evaluateCapability, projectCapabilityDecision, buildWillAssessmentContext,
} from './jurisdiction-capability-reference.mjs';

const AS_OF = '2026-10-17';
const AS_OF_INSTANT = '2026-10-17T12:00:00.000Z';
const CONTRACT = 'TEST_ONLY_OWNER_CONTRACT_V1';
const clone = value => structuredClone(value);
const integrated = () => ({ features: Object.fromEntries(Object.values(F).map(feature => [feature,
  { integration: 'INTEGRATED', contractVersion: CONTRACT,
    allowedLanguages: ['en'], allowedServiceScopes: ['FACTUAL_FINANCIAL_EXPLANATION'] }])) });
const completeFacts = () => ({
  profileRevision: 'TEST_ONLY_PROFILE_R1',
  person: { dateOfBirth: '1985-04-21' },
  residence: { country: 'SG' }, habitualResidence: { country: 'SG' },
  citizenships: ['SG'], domicile: { country: 'SG', status: 'DECLARED' },
  personalLaw: { islam: 'NO' },
  assets: [{ location: { country: 'SG' }, ownership: 'SOLE', value: 123456 }],
  will: {
    requestedJurisdiction: 'SG', signingPlace: { country: 'SG' },
    intendedSigningDate: '2026-11-01', language: 'en',
    signatureMethod: 'WET_INK_IN_PERSON', maritalStatus: 'SINGLE', complexityFlags: [],
  },
});

// Deliberately fictional. These receipts/bundles are NOT approved law, legal text,
// provider verification, or a model for changing INITIAL_REGISTRY to APPROVED.
const TEST_ONLY_WILL_BUNDLE = {
  id: 'TEST_ONLY_FICTIONAL_WILL_BUNDLE', version: 'TEST_ONLY_V1', kind: 'WILL',
  scope: { jurisdiction: 'SG', personalLawRoute: 'SG_NON_MUSLIM' },
  approval: { status: 'APPROVED', recordId: 'TEST_ONLY_NOT_LEGAL_APPROVAL' },
  sourceRefs: ['TEST_ONLY_NO_LEGAL_SOURCE'], sourceStatus: 'VERIFIED_EFFECTIVE',
  reviewValidUntil: '2027-12-31', legalEffectiveFrom: '2020-01-01', legalEffectiveTo: null,
  approvedClauseIds: ['TEST_ONLY_NO_REAL_CLAUSE'], languages: ['en'],
  signatureMethods: ['WET_INK_IN_PERSON'],
};
const testRegistry = (...bundles) => ({
  ...clone(INITIAL_REGISTRY), id: 'TEST_ONLY_REGISTRY', environment: 'TEST_ONLY', bundles,
});
const willEvidence = () => ({
  assetInventoryConfirmedComplete: true,
  willEligibilityAssessment: 'PASSED',
  willAssessmentBundleId: TEST_ONLY_WILL_BUNDLE.id,
  willAssessmentBundleVersion: TEST_ONLY_WILL_BUNDLE.version,
  willAssessmentProfileRevision: 'TEST_ONLY_PROFILE_R1',
  willAssessmentContextDigest: buildWillAssessmentContext({ facts: completeFacts(), bundle: TEST_ONLY_WILL_BUNDLE,
    registryId: 'TEST_ONLY_REGISTRY', asOfDate: AS_OF, contractVersion: CONTRACT }).digest,
});
const willInput = overrides => ({
  feature: F.WILL_SIGNING_TEXT, facts: completeFacts(), evidence: willEvidence(),
  runtime: integrated(), asOfDate: AS_OF,
  registry: testRegistry(clone(TEST_ONLY_WILL_BUNDLE)), evaluationMode: 'TEST_ONLY', ...overrides,
});
const has = (decision, code) => decision.blockers.some(blocker => blocker.code === code);
const authorization = (purpose, bindings) => ({
  id: 'TEST_ONLY_GRANT_ID', version: 'TEST_ONLY_GRANT_V1', purpose,
  status: 'GRANTED', active: true, revocationState: 'NOT_REVOKED',
  issuedAt: '2026-10-01T00:00:00.000Z', expiresAt: '2026-12-31T00:00:00.000Z',
  contractVersion: CONTRACT, ...bindings,
});
const reportInput = () => ({
  feature: F.AI_FACTUAL_REPORT, asOfDate: AS_OF, asOfInstant: AS_OF_INSTANT, runtime: integrated(),
  facts: { report: { sourceSnapshotId: 'TEST_ONLY_SOURCE_V1', mode: 'FACTUAL_ONLY',
    language: 'en', serviceScope: 'FACTUAL_FINANCIAL_EXPLANATION' } },
  evidence: { reportSourceValidated: true, reportContractBound: true,
    reportAuthorization: authorization('REPORT', { sourceSnapshotId: 'TEST_ONLY_SOURCE_V1',
      language: 'en', serviceScope: 'FACTUAL_FINANCIAL_EXPLANATION' }) },
});
const handoffInput = () => ({
  feature: F.PROFESSIONAL_HANDOFF, asOfDate: AS_OF, asOfInstant: AS_OF_INSTANT,
  facts: { handoff: { professionalId: 'TEST_ONLY_P1', jurisdictionScope: 'MY_PENINSULAR',
    serviceScope: 'TEST_ONLY_SCOPE', sourceSnapshotId: 'TEST_ONLY_S1', dataScope: ['income', 'liabilities'] } },
  evidence: { handoffPacketValidated: true, handoffConsent: authorization('PROFESSIONAL_HANDOFF', {
    professionalId: 'TEST_ONLY_P1', jurisdictionScope: 'MY_PENINSULAR', serviceScope: 'TEST_ONLY_SCOPE',
    sourceSnapshotId: 'TEST_ONLY_S1', dataScope: ['liabilities', 'income'] }) },
  runtime: { ...integrated(), professionals: [{ id: 'TEST_ONLY_P1', verificationStatus: 'VERIFIED',
    jurisdictionScopes: ['MY_PENINSULAR'], serviceScopes: ['TEST_ONLY_SCOPE'], reviewValidUntil: '2027-01-01' }] },
});
function rebindTestWill(input) {
  const bundle = input.registry.bundles[0];
  input.evidence.willAssessmentBundleId = bundle.id;
  input.evidence.willAssessmentBundleVersion = bundle.version;
  input.evidence.willAssessmentProfileRevision = input.facts.profileRevision;
  input.evidence.willAssessmentContextDigest = buildWillAssessmentContext({
    facts: input.facts, bundle, registryId: input.registry.id, asOfDate: input.asOfDate,
    contractVersion: input.runtime.features[F.WILL_SIGNING_TEXT].contractVersion,
  }).digest;
  return input;
}

test('initial registry is deeply frozen and has zero approved production Will bundles', () => {
  assert.equal(countApprovedWillBundles(), 0);
  assert.equal(INITIAL_REGISTRY.bundles.length, 0);
  assert.throws(() => INITIAL_REGISTRY.bundles.push(clone(TEST_ONLY_WILL_BUNDLE)), TypeError);
  assert.ok(INITIAL_REGISTRY.willCandidates.every(c => c.approval === 'PENDING_REVIEW'));
});

test('complete profile and runtime still cannot enable initial Will signing text', () => {
  const result = evaluateCapability(willInput({ registry: INITIAL_REGISTRY, evaluationMode: 'REFERENCE' }));
  assert.equal(result.factsReadiness.status, 'READY');
  assert.equal(result.runtimeIntegration.status, 'READY');
  assert.equal(result.coverage.status, 'REVIEW_NEEDED');
  assert.equal(result.allGatesPassed, false);
  assert.ok(has(result, 'WILL_APPROVED_BUNDLE_ABSENT'));
});

test('TEST_ONLY success requires all three dimensions and owner-bound assessment', () => {
  const result = evaluateCapability(willInput());
  assert.equal(result.status, 'READY');
  assert.equal(result.allGatesPassed, true);
  assert.equal(result.testOnly, true);
  assert.equal(result.referenceOnly, true);
  assert.deepEqual(result.blockers, []);
});

test('TEST_ONLY fixtures are rejected outside explicit TEST_ONLY mode', () => {
  const result = evaluateCapability(willInput({ evaluationMode: 'REFERENCE' }));
  assert.equal(result.status, 'UNSUPPORTED');
  assert.ok(has(result, 'TEST_REGISTRY_FORBIDDEN'));
});

test('country and ethnicity alone cannot make signing text ready', () => {
  const result = evaluateCapability(willInput({ facts: { country: 'SG', ethnicity: 'Chinese' } }));
  assert.equal(result.status, 'UNKNOWN');
  assert.equal(result.allGatesPassed, false);
  assert.ok(has(result, 'WILL_JURISDICTION_UNRESOLVED'));
});

test('unknown, declined and absent personal-law answers never become NO', () => {
  for (const value of [undefined, null, '', 'UNKNOWN', 'DECLINED', 'UNBOUND']) {
    const facts = completeFacts(); facts.personalLaw.islam = value;
    const result = evaluateCapability(willInput({ facts }));
    assert.equal(result.factsReadiness.status, 'UNKNOWN');
    assert.equal(result.allGatesPassed, false);
    assert.deepEqual(result.routes, []);
  }
});

test('ethnicity and race do not participate in matching or projection', () => {
  const one = completeFacts(); one.ethnicity = 'Chinese'; one.race = 'A';
  const two = completeFacts(); two.ethnicity = 'Malay'; two.race = 'B';
  assert.deepEqual(evaluateCapability(willInput({ facts: one })), evaluateCapability(willInput({ facts: two })));
});

test('Malaysia state omission remains UNKNOWN; country is not a regional rule', () => {
  const facts = completeFacts();
  facts.will.requestedJurisdiction = 'MY_PENINSULAR';
  facts.residence = { country: 'MY' };
  const result = evaluateCapability(willInput({ facts, registry: INITIAL_REGISTRY }));
  assert.equal(result.factsReadiness.status, 'UNKNOWN');
  assert.ok(result.blockers.some(b => b.paths.includes('residence.subdivision')));
});

test('Malaysia Peninsula Muslim route does not select a non-Muslim civil bundle', () => {
  const facts = completeFacts();
  facts.personalLaw.islam = 'YES'; facts.citizenships = ['MY'];
  facts.will.requestedJurisdiction = 'MY_PENINSULAR';
  for (const path of ['residence', 'habitualResidence', 'domicile']) {
    facts[path] = { ...facts[path], country: 'MY', subdivision: 'SELANGOR' };
  }
  facts.will.signingPlace = { country: 'MY', subdivision: 'SELANGOR' };
  facts.assets[0].location = { country: 'MY', subdivision: 'SELANGOR' };
  const bundle = clone(TEST_ONLY_WILL_BUNDLE);
  bundle.scope = { jurisdiction: 'MY_PENINSULAR', personalLawRoute: 'MY_PENINSULAR_NON_MUSLIM' };
  const result = evaluateCapability(willInput({ facts, registry: testRegistry(bundle) }));
  assert.deepEqual(result.routes, ['MY_MUSLIM_SEPARATE_REGIME']);
  assert.deepEqual(result.matchedBundles, []);
  assert.ok(has(result, 'MY_WILLS_ACT_1959_MUSLIM_EXCLUSION_REQUIRES_SEPARATE_ROUTE'));
  assert.equal(result.allGatesPassed, false);
});

test('Singapore Muslim route retains Wills formalities plus AMLA; no MY exclusion', () => {
  const facts = completeFacts(); facts.personalLaw.islam = 'YES';
  const result = evaluateCapability(willInput({ facts, registry: INITIAL_REGISTRY }));
  assert.deepEqual(result.routes, ['SG_WILLS_ACT_PLUS_AMLA']);
  assert.ok(has(result, 'SG_WILLS_FORMALITIES_PLUS_AMLA_REVIEW_REQUIRED'));
  assert.ok(!has(result, 'MY_WILLS_ACT_1959_MUSLIM_EXCLUSION_REQUIRES_SEPARATE_ROUTE'));
  assert.notEqual(result.coverage.status, 'UNSUPPORTED');
  assert.equal(result.allGatesPassed, false);
});

test('Sabah and Sarawak ask relevant customary status without inferring it', () => {
  for (const region of ['MY_SABAH', 'MY_SARAWAK']) {
    const facts = completeFacts(); facts.will.requestedJurisdiction = region;
    const result = evaluateCapability(willInput({ facts, registry: INITIAL_REGISTRY }));
    assert.ok(result.blockers.some(b => b.status === 'UNKNOWN'
      && b.paths.includes('personalLaw.customaryLawApplicability')));
    assert.equal(result.allGatesPassed, false);
  }
});

test('uncatalogued Scotland is not silently treated as England and Wales', () => {
  const facts = completeFacts(); facts.will.requestedJurisdiction = 'GB_SCOTLAND';
  const result = evaluateCapability(willInput({ facts, registry: INITIAL_REGISTRY }));
  assert.equal(result.coverage.status, 'UNSUPPORTED');
  assert.ok(has(result, 'WILL_JURISDICTION_NOT_CATALOGUED'));
});

test('cross-border citizenship, assets and signing place trigger conservative review', () => {
  for (const change of [
    facts => { facts.citizenships = ['SG', 'MY']; },
    facts => { facts.assets[0].location = { country: 'GB', subdivision: 'ENGLAND' }; },
    facts => { facts.will.signingPlace = { country: 'MY', subdivision: 'JOHOR' }; },
  ]) {
    const facts = completeFacts(); change(facts);
    const result = evaluateCapability(willInput({ facts }));
    assert.ok(has(result, 'CROSS_JURISDICTION_OUTSIDE_INITIAL_SIMPLE_SCOPE'));
    assert.equal(result.allGatesPassed, false);
  }
});

test('non-sole ownership and domicile awaiting review are not standard-case READY', () => {
  const facts = completeFacts(); facts.assets[0].ownership = 'JOINT';
  facts.domicile.status = 'NEEDS_REVIEW';
  const result = evaluateCapability(willInput({ facts }));
  assert.ok(has(result, 'OWNERSHIP_OUTSIDE_INITIAL_SIMPLE_SCOPE'));
  assert.ok(has(result, 'DOMICILE_REVIEW_REQUIRED'));
});

test('unknown ownership is UNKNOWN, not a sole-ownership default', () => {
  const facts = completeFacts(); facts.assets[0].ownership = 'UNKNOWN';
  const result = evaluateCapability(willInput({ facts }));
  assert.equal(result.factsReadiness.status, 'UNKNOWN');
  assert.equal(result.allGatesPassed, false);
});

test('expired source, missing facts and absent runtime retain all three blockers', () => {
  const bundle = clone(TEST_ONLY_WILL_BUNDLE); bundle.reviewValidUntil = '2026-10-16';
  const facts = completeFacts(); delete facts.person.dateOfBirth;
  const result = evaluateCapability(willInput({ facts, runtime: {}, registry: testRegistry(bundle) }));
  assert.equal(result.status, 'EXPIRED');
  assert.equal(result.coverage.status, 'EXPIRED');
  assert.equal(result.factsReadiness.status, 'UNKNOWN');
  assert.equal(result.runtimeIntegration.status, 'REVIEW_NEEDED');
  assert.ok(has(result, 'SOURCE_REVIEW_EXPIRED'));
  assert.ok(has(result, 'FACT_UNKNOWN'));
  assert.ok(has(result, 'OWNER_RUNTIME_NOT_INTEGRATED'));
});

test('proposed source and future effective date cannot be promoted by approval metadata', () => {
  for (const change of [
    bundle => { bundle.sourceStatus = 'PROPOSED'; },
    bundle => { bundle.legalEffectiveFrom = '2027-01-01'; },
  ]) {
    const bundle = clone(TEST_ONLY_WILL_BUNDLE); change(bundle);
    const result = evaluateCapability(willInput({ registry: testRegistry(bundle) }));
    assert.equal(result.coverage.status, 'REVIEW_NEEDED');
    assert.equal(result.allGatesPassed, false);
  }
});

test('unapproved language, signature method and absent clauses block generation capability', () => {
  const facts = completeFacts(); facts.will.language = 'zh'; facts.will.signatureMethod = 'ELECTRONIC';
  const bundle = clone(TEST_ONLY_WILL_BUNDLE); bundle.approvedClauseIds = [];
  const result = evaluateCapability(willInput({ facts, registry: testRegistry(bundle) }));
  for (const code of ['LANGUAGE_NOT_APPROVED', 'SIGNATURE_METHOD_NOT_APPROVED', 'APPROVED_CLAUSES_ABSENT']) {
    assert.ok(has(result, code));
  }
  assert.equal(result.allGatesPassed, false);
});

test('stale owner assessment cannot approve a changed profile revision', () => {
  const facts = completeFacts(); facts.profileRevision = 'TEST_ONLY_PROFILE_R2';
  const result = evaluateCapability(willInput({ facts }));
  assert.ok(result.blockers.some(b => b.code === 'OWNER_EVIDENCE_NOT_PASSED'
    && b.paths.includes('willAssessmentProfileRevision')));
  assert.equal(result.allGatesPassed, false);
});

test('multiple matching bundles require resolution rather than first-match wins', () => {
  const second = clone(TEST_ONLY_WILL_BUNDLE); second.id = 'TEST_ONLY_SECOND_BUNDLE';
  const result = evaluateCapability(willInput({ registry: testRegistry(clone(TEST_ONLY_WILL_BUNDLE), second) }));
  assert.ok(has(result, 'AMBIGUOUS_BUNDLE_MATCH'));
  assert.equal(result.allGatesPassed, false);
});

test('basic and Will preparation remain usable with unknown jurisdiction and religion', () => {
  for (const feature of [F.BASIC_PREPARATION, F.WILL_PREPARATION]) {
    const result = evaluateCapability({ feature, facts: {}, runtime: integrated(), asOfDate: AS_OF });
    assert.equal(result.status, 'READY');
    assert.equal(result.matchedBundles.length, 0);
  }
});

test('pure math requires validated model/input evidence, but no religious or citizenship facts', () => {
  const input = { feature: F.PURE_MATH, asOfDate: AS_OF, runtime: integrated() };
  assert.equal(evaluateCapability(input).factsReadiness.status, 'UNKNOWN');
  assert.equal(evaluateCapability({ ...input, evidence: { mathInputsValidated: true, mathModelVersionBound: true } }).status, 'READY');
  assert.equal(evaluateCapability({ ...input, evidence: { mathInputsValidated: 'true', mathModelVersionBound: true } }).allGatesPassed, false);
});

test('tax bundle selection uses assessment year and tax residency, not filing/current year', () => {
  const bundle = {
    ...clone(TEST_ONLY_WILL_BUNDLE), id: 'TEST_ONLY_YA_2025', kind: 'TAX',
    scope: { jurisdiction: 'MY', assessmentYear: 2025, residencyStatus: 'RESIDENT' },
  };
  const input = {
    feature: F.TAX_ESTIMATE, facts: { tax: { jurisdiction: 'MY', assessmentYear: 2025, filingYear: 2026, residencyStatus: 'RESIDENT' } },
    evidence: { taxInputsValidated: true }, runtime: integrated(), asOfDate: AS_OF,
    registry: testRegistry(bundle), evaluationMode: 'TEST_ONLY',
  };
  const result = evaluateCapability(input);
  assert.equal(result.status, 'READY');
  assert.equal(result.matchedBundles[0].id, 'TEST_ONLY_YA_2025');
  input.facts.tax.assessmentYear = 2026;
  assert.equal(evaluateCapability(input).allGatesPassed, false);
  delete input.facts.tax.assessmentYear;
  assert.equal(evaluateCapability(input).factsReadiness.status, 'UNKNOWN');
});

test('manual rate assumptions do not manufacture verified tax coverage', () => {
  const result = evaluateCapability({
    feature: F.TAX_ESTIMATE, asOfDate: AS_OF, runtime: integrated(),
    facts: { tax: { jurisdiction: 'MY', assessmentYear: 2025, residencyStatus: 'RESIDENT', manualRate: 0.15 } },
    evidence: { taxInputsValidated: true },
  });
  assert.ok(has(result, 'TAX_APPROVED_BUNDLE_ABSENT'));
  assert.equal(result.allGatesPassed, false);
});

test('AI factual report requires source evidence and rejects personalized-plan scope', () => {
  const input = reportInput();
  assert.equal(evaluateCapability(input).status, 'READY');
  input.facts.report.mode = 'PERSONALIZED_PLAN';
  assert.ok(has(evaluateCapability(input), 'PERSONALIZED_PLAN_OUTSIDE_FACTUAL_REPORT'));
  input.facts.report.mode = 'FACTUAL_ONLY'; delete input.evidence.reportSourceValidated;
  assert.equal(evaluateCapability(input).factsReadiness.status, 'UNKNOWN');
});

test('professional handoff requires recipient/scope/source-bound consent and verified coverage', () => {
  const input = handoffInput();
  assert.equal(evaluateCapability(input).status, 'READY');
  input.evidence.handoffConsent.sourceSnapshotId = 'TEST_ONLY_OLD_SOURCE';
  assert.ok(has(evaluateCapability(input), 'HANDOFF_AUTHORIZATION_BINDING_MISMATCH'));
  input.runtime.professionals[0].reviewValidUntil = '2026-01-01';
  const result = evaluateCapability(input);
  assert.ok(has(result, 'PROFESSIONAL_VERIFICATION_EXPIRED'));
  assert.ok(has(result, 'HANDOFF_AUTHORIZATION_BINDING_MISMATCH'));
  assert.equal(result.allGatesPassed, false);
});

test('invalid as-of dates do not fall back to the computer clock', () => {
  for (const asOfDate of [undefined, '2026-02-30', 'today']) {
    const result = evaluateCapability({ feature: F.BASIC_PREPARATION, runtime: integrated(), asOfDate });
    assert.equal(result.status, 'UNKNOWN');
    assert.ok(has(result, 'AS_OF_DATE_REQUIRED'));
  }
});

test('evaluation is deterministic, does not mutate inputs, and projection omits raw facts', () => {
  const input = willInput(); const before = clone(input);
  const one = evaluateCapability(input); const two = evaluateCapability(input);
  assert.deepEqual(input, before); assert.deepEqual(one, two);
  const projection = projectCapabilityDecision(one);
  const encoded = JSON.stringify(projection);
  assert.ok(!encoded.includes('1985-04-21'));
  assert.ok(!encoded.includes('123456'));
  assert.ok(!('binding' in projection));
  assert.ok(Object.isFrozen(projection));
});

test('malformed object-valued identifiers are blocked without freezing caller objects', () => {
  const facts = { profileRevision: { unexpected: true }, report: { sourceSnapshotId: { unexpected: true }, mode: 'FACTUAL_ONLY' } };
  const before = clone(facts);
  const result = evaluateCapability({ feature: F.AI_FACTUAL_REPORT, facts, runtime: integrated(), asOfDate: AS_OF });
  assert.equal(result.allGatesPassed, false);
  assert.equal(result.binding.profileRevision, null);
  assert.equal(result.binding.sourceSnapshotId, null);
  assert.deepEqual(facts, before);
  assert.equal(Object.isFrozen(facts.profileRevision), false);
  assert.equal(Object.isFrozen(facts.report.sourceSnapshotId), false);
});

test('no representative initial-registry Will profile can reach READY', () => {
  for (const candidate of INITIAL_REGISTRY.willCandidates) {
    for (const islam of ['YES', 'NO', 'UNKNOWN']) {
      const facts = completeFacts(); facts.will.requestedJurisdiction = candidate.id;
      facts.personalLaw.islam = islam;
      const result = evaluateCapability(willInput({ facts, registry: INITIAL_REGISTRY, evaluationMode: 'REFERENCE' }));
      assert.equal(result.allGatesPassed, false, `${candidate.id}/${islam}`);
    }
  }
});

test('regression: contract sentinels stay UNKNOWN with any casing or surrounding whitespace', () => {
  for (const sentinel of ['NOT_YET_PROVIDED', 'DECLINED_TO_PROVIDE', 'UNSPECIFIED', 'UNKNOWN', 'UNBOUND']) {
    for (const value of [sentinel, sentinel.toLowerCase(), `  ${sentinel.toLowerCase()}  `]) {
      const input = reportInput(); input.facts.report.sourceSnapshotId = value;
      const result = evaluateCapability(input);
      assert.equal(result.factsReadiness.status, 'UNKNOWN', value);
      assert.equal(result.allGatesPassed, false);
    }
  }
});

test('regression: runtime contract references require real non-sentinel strings', () => {
  for (const value of [false, 0, {}, ['VERSION'], 'UNSPECIFIED', 'NOT_APPLICABLE', ' ', ' padded ']) {
    const runtime = integrated(); runtime.features[F.BASIC_PREPARATION].contractVersion = value;
    const result = evaluateCapability({ feature: F.BASIC_PREPARATION, asOfDate: AS_OF, runtime });
    assert.ok(has(result, 'OWNER_RUNTIME_NOT_INTEGRATED'));
    assert.equal(result.allGatesPassed, false);
  }
});

test('FDR NOT_APPLICABLE retains distinct meaning but cannot serve as a source identifier', () => {
  for (const value of ['NOT_APPLICABLE', 'not_applicable', '  NOT_APPLICABLE  ']) {
    const input = reportInput(); input.facts.report.sourceSnapshotId = value;
    input.evidence.reportAuthorization.sourceSnapshotId = value;
    const result = evaluateCapability(input);
    assert.ok(result.blockers.some(b => b.code === 'FACT_INVALID' && b.paths.includes('report.sourceSnapshotId')));
    assert.equal(result.allGatesPassed, false);
  }
});

test('regression: language/method metadata must be exact string arrays, never substrings', () => {
  const input = willInput(); input.registry.bundles[0].languages = 'french';
  input.registry.bundles[0].signatureMethods = 'PREFIX_WET_INK_IN_PERSON_SUFFIX';
  const result = evaluateCapability(rebindTestWill(input));
  assert.ok(has(result, 'LANGUAGE_NOT_APPROVED'));
  assert.ok(has(result, 'SIGNATURE_METHOD_NOT_APPROVED'));
  assert.equal(result.allGatesPassed, false);
});

test('regression: professional jurisdiction/service scopes require exact array members', () => {
  for (const change of [
    professional => { professional.jurisdictionScopes = 'PREFIX_MY_PENINSULAR_SUFFIX'; },
    professional => { professional.serviceScopes = 'PREFIX_TEST_ONLY_SCOPE_SUFFIX'; },
    professional => { professional.jurisdictionScopes = ['MY_SABAH']; },
  ]) {
    const input = handoffInput(); change(input.runtime.professionals[0]);
    const result = evaluateCapability(input);
    assert.ok(has(result, 'PROFESSIONAL_SCOPE_UNVERIFIED'));
    assert.equal(result.allGatesPassed, false);
  }
});

test('regression: empty, mixed, duplicate and sparse source/clause references cannot pass', () => {
  for (const value of [[], [''], ['UNSPECIFIED'], [123], [null], ['a', 'a'], new Array(1)]) {
    const input = willInput();
    input.registry.bundles[0].sourceRefs = value;
    input.registry.bundles[0].approvedClauseIds = clone(value);
    const result = evaluateCapability(rebindTestWill(input));
    assert.ok(has(result, 'BUNDLE_PROVENANCE_INCOMPLETE'));
    assert.ok(has(result, 'APPROVED_CLAUSES_ABSENT'));
    assert.equal(result.allGatesPassed, false);
  }
});

test('regression: same bundle ID with a new version invalidates old assessment', () => {
  const input = willInput(); input.registry.bundles[0].version = 'TEST_ONLY_V2';
  const result = evaluateCapability(input);
  for (const path of ['willAssessmentBundleVersion', 'willAssessmentContextDigest']) {
    assert.ok(result.blockers.some(b => b.code === 'OWNER_EVIDENCE_NOT_PASSED' && b.paths.includes(path)));
  }
  assert.equal(result.allGatesPassed, false);
});

test('regression: decision-context changes cannot reuse an assessment despite same profile revision', () => {
  for (const change of [
    input => { input.facts.will.intendedSigningDate = '2026-11-02'; },
    input => { input.facts.person.dateOfBirth = '1986-04-21'; },
    input => { input.facts.will.maritalStatus = 'MARRIED'; },
    input => { input.facts.assets[0].value = 654321; },
    input => { input.registry.bundles[0].approvedClauseIds = ['TEST_ONLY_REPLACED_CLAUSE']; },
    input => { input.registry.id = 'TEST_ONLY_REGISTRY_V2'; },
    input => { input.asOfDate = '2026-10-18'; },
    input => { input.runtime.features[F.WILL_SIGNING_TEXT].contractVersion = 'TEST_ONLY_CONTRACT_V2'; },
  ]) {
    const input = willInput(); change(input);
    const result = evaluateCapability(input);
    assert.ok(result.blockers.some(b => b.code === 'OWNER_EVIDENCE_NOT_PASSED'
      && b.paths.includes('willAssessmentContextDigest')));
    assert.equal(result.allGatesPassed, false);
  }
});

test('regression: chronology rejects future birth and past intended signing without inventing legal age', () => {
  const futureBirth = willInput(); futureBirth.facts.person.dateOfBirth = '2099-01-01';
  const birthResult = evaluateCapability(rebindTestWill(futureBirth));
  assert.ok(has(birthResult, 'DATE_OF_BIRTH_IN_FUTURE'));
  assert.ok(has(birthResult, 'DATE_OF_BIRTH_AFTER_SIGNING'));
  const pastSigning = willInput(); pastSigning.facts.will.intendedSigningDate = '2020-01-01';
  const signingResult = evaluateCapability(rebindTestWill(pastSigning));
  assert.ok(has(signingResult, 'INTENDED_SIGNING_DATE_IN_PAST'));
  assert.equal(birthResult.allGatesPassed, false);
  assert.equal(signingResult.allGatesPassed, false);
});

test('signing beyond the source review horizon requires a fresh reviewed package', () => {
  const input = willInput(); input.facts.will.intendedSigningDate = '2028-01-01';
  const result = evaluateCapability(rebindTestWill(input));
  assert.ok(has(result, 'SIGNING_BEYOND_SOURCE_REVIEW_HORIZON'));
  assert.equal(result.allGatesPassed, false);
});

test('regression: GRANTED alone cannot override inactive, revoked or denied handoff state', () => {
  for (const change of [
    consent => { consent.active = false; },
    consent => { delete consent.active; },
    consent => { consent.revocationState = 'REVOKED'; },
    consent => { consent.status = 'DENIED'; },
    consent => { consent.revokedAt = '2026-10-10T00:00:00.000Z'; },
  ]) {
    const input = handoffInput(); change(input.evidence.handoffConsent);
    const result = evaluateCapability(input);
    assert.ok(has(result, 'HANDOFF_AUTHORIZATION_NOT_ACTIVE'));
    assert.equal(result.allGatesPassed, false);
  }
});

test('regression: handoff authorization has required exact UTC validity and exclusive expiry', () => {
  for (const [change, reason] of [
    [consent => { delete consent.expiresAt; }, 'HANDOFF_AUTHORIZATION_TIME_MISSING'],
    [consent => { consent.expiresAt = '2020-01-01T00:00:00.000Z'; }, 'HANDOFF_AUTHORIZATION_EXPIRED'],
    [consent => { consent.expiresAt = AS_OF_INSTANT; }, 'HANDOFF_AUTHORIZATION_EXPIRED'],
    [consent => { consent.issuedAt = '2026-10-18T00:00:00.000Z'; }, 'HANDOFF_AUTHORIZATION_NOT_YET_ACTIVE'],
  ]) {
    const input = handoffInput(); change(input.evidence.handoffConsent);
    const result = evaluateCapability(input);
    assert.ok(has(result, reason));
    assert.equal(result.allGatesPassed, false);
  }
});

test('regression: handoff purpose, subnational scope, service and data scope are fully bound', () => {
  for (const change of [
    consent => { consent.purpose = 'REPORT'; },
    consent => { consent.jurisdictionScope = 'MY_SABAH'; },
    consent => { consent.serviceScope = 'WILL'; },
    consent => { consent.contractVersion = 'TEST_ONLY_DIFFERENT_CONTRACT'; },
    consent => { consent.dataScope = ['income']; },
    consent => { consent.dataScope = ['income', 'liabilities', '']; },
  ]) {
    const input = handoffInput(); change(input.evidence.handoffConsent);
    assert.equal(evaluateCapability(input).allGatesPassed, false);
  }
  const legacy = handoffInput(); delete legacy.facts.handoff.jurisdictionScope;
  legacy.facts.handoff.jurisdiction = 'MY';
  assert.equal(evaluateCapability(legacy).factsReadiness.status, 'UNKNOWN');
});

test('AI report additionally requires active REPORT-purpose authorization, not validation booleans alone', () => {
  for (const change of [
    input => { delete input.evidence.reportAuthorization; },
    input => { input.evidence.reportAuthorization.revocationState = 'REVOKED'; },
    input => { input.evidence.reportAuthorization.purpose = 'PROFESSIONAL_HANDOFF'; },
    input => { input.evidence.reportAuthorization.expiresAt = '2020-01-01T00:00:00.000Z'; },
    input => { input.evidence.reportAuthorization.language = 'zh'; },
    input => { input.evidence.reportAuthorization.serviceScope = 'PERSONALIZED_PLAN'; },
  ]) {
    const input = reportInput(); change(input);
    assert.equal(evaluateCapability(input).allGatesPassed, false);
  }
});

test('AI language/scope runtime arrays are exact and do not accept string substrings', () => {
  const input = reportInput(); input.runtime.features[F.AI_FACTUAL_REPORT].allowedLanguages = 'french';
  const result = evaluateCapability(input);
  assert.ok(has(result, 'REPORT_SCOPE_OR_LANGUAGE_NOT_INTEGRATED'));
  assert.equal(result.allGatesPassed, false);
});

test('runtime authorization time must be explicit and agree with the legal evaluation date', () => {
  for (const instant of [undefined, '2026-10-17', '2026-10-18T12:00:00.000Z']) {
    const input = handoffInput(); input.asOfInstant = instant;
    assert.equal(evaluateCapability(input).allGatesPassed, false);
  }
});

test('READY is an evaluation snapshot; generation, signing and transmission need fresh evaluation', () => {
  const will = evaluateCapability(willInput());
  assert.equal(will.status, 'READY');
  assert.equal(will.validity.semantics, 'AT_EVALUATION_ONLY');
  assert.equal(will.validity.reusableAuthorization, false);
  assert.deepEqual(will.validity.freshEvaluationRequiredBefore, ['GENERATE', 'SIGN']);
  assert.deepEqual(evaluateCapability(reportInput()).validity.freshEvaluationRequiredBefore, ['MODEL_CALL']);
  assert.deepEqual(evaluateCapability(handoffInput()).validity.freshEvaluationRequiredBefore, ['HANDOFF']);
});

test('sparse fact arrays cannot bypass asset/citizenship completeness checks', () => {
  for (const change of [
    facts => { facts.assets = new Array(1); },
    facts => { facts.citizenships = new Array(1); },
    facts => { facts.will.complexityFlags = new Array(1); },
  ]) {
    const input = willInput(); change(input.facts);
    assert.equal(evaluateCapability(rebindTestWill(input)).allGatesPassed, false);
  }
});
