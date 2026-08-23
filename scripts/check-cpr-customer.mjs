import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  createReportReleaseAssertion,
  updateReportReleaseStatus,
  digestCanonical
} from '../functions/canonical-presentation-runtime/report-release-runtime.js';
import {
  resolveReleasedCustomerReport
} from '../functions/canonical-presentation-runtime/released-report-projection-runtime.js';
import {
  createCustomerWorkspaceProjection,
  createCustomerPdfProjection
} from '../functions/canonical-presentation-runtime/customer-report-presentation-runtime.js';
import {
  projectCustomerVisibleSections,
  assertNoForbiddenCustomerFields
} from '../functions/canonical-presentation-runtime/customer-report-visibility-runtime.js';

const gate = process.argv[2] || 'all';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = path => crypto.createHash('sha256')
  .update(fs.readFileSync(path)).digest('hex');

const ROOT = 'content/professional/canonical-presentation-runtime';

function throws(fn, contains) {
  let error = null;
  try { fn(); } catch (candidate) { error = candidate; }
  assert.ok(error, `Expected failure containing ${contains}`);
  assert.match(String(error.message), new RegExp(contains));
}

function report(overrides = {}) {
  const section = (id, en, zh, sourceType, options = {}) => ({
    section_id: id,
    title: { en, zh_Hans: zh },
    content: {
      en: options.enContent || `${en} content`,
      zh_Hans: options.zhContent || `${zh}内容`
    },
    source_type: sourceType,
    source_reference: options.sourceReference || (
      sourceType === 'calculated' ? `hdr-internal:${id}` : `PRO-SOURCE-${id}`
    ),
    professional_id: sourceType === 'calculated' ? null : 'PRO-1',
    confidence: options.confidence || 'high',
    correspondence_status: 'not_applicable',
    client_visible: options.clientVisible !== false
  });
  return {
    schema_version: 'phi-os.professional-report.v1',
    report_id: 'HDR-REPORT-001',
    report_type: 'human_design_foundation_report',
    version: '1.0.0',
    status: 'final',
    generated_at: '2026-08-23T08:00:00.000Z',
    professional_id: 'PRO-1',
    professional_name: 'Registered Professional',
    client_id: 'CUS-1',
    service_scope: 'human_design_foundation_report',
    consent_reference: 'CONSENT-1',
    reader_type: 'human_design',
    registry_version: '1.0.0',
    sections: [
      section('chart_overview', 'Chart Overview', '图表总览', 'calculated'),
      section('type', 'Type', '类型', 'calculated', {
        enContent: 'Type: Generator.',
        zhContent: '类型：生产者。'
      }),
      section('strategy', 'Strategy', '策略', 'professional_interpretation'),
      section('authority', 'Authority', '权威', 'calculated'),
      section('profile', 'Profile', '人生角色', 'calculated'),
      section('definition', 'Definition', '定义', 'calculated'),
      section('centers', 'Centers', '中心', 'calculated'),
      section('channels', 'Channels', '通道', 'calculated'),
      section('key_gates', 'Gate / Line Activations', '闸门／爻线激活', 'calculated'),
      section('variables_phs', 'Variables / PHS', '变量／PHS', 'professional_interpretation'),
      section('environment', 'Environment', '环境', 'professional_interpretation'),
      section('cognition', 'Cognition', '认知', 'professional_interpretation'),
      section('motivation', 'Motivation', '动机', 'professional_interpretation'),
      section('general_operating_conditions', 'General Operating Conditions', '总体运行条件', 'professionally_verified'),
      section('limitations', 'Limitations', '限制', 'professionally_verified', {
        enContent: 'Calculated structure and professional interpretation remain distinct.',
        zhContent: '系统计算结构与专业人员解读保持分离。'
      })
    ],
    interpretation_boundary: { en: 'Boundary', zh_Hans: '边界' },
    confidentiality_notice: { en: 'Confidential', zh_Hans: '保密' },
    ...overrides
  };
}

function consent(overrides = {}) {
  return {
    schema_version: 'phi-os.professional-consent.v1',
    consent_id: 'CONSENT-1',
    client_id: 'CUS-1',
    professional_id: 'PRO-1',
    service_id: 'human_design_foundation_report',
    purpose: 'hdr_professional_report_finalization',
    consent_version: '1.0.0',
    status: 'granted',
    granted_at: '2026-08-22T08:00:00.000Z',
    duration: 'thirty_days',
    expires_at: '2026-09-21T08:00:00.000Z',
    service_status: 'active',
    runtime_ids: ['HDR'],
    resource_scopes: ['human_design_chart', 'birth_information', 'previous_reports'],
    financial_data_scopes: [],
    human_design_scopes: ['derived_chart_fields', 'professional_interpretation'],
    acknowledgements: {},
    access_count: 0,
    revoked: false,
    revoked_scopes: [],
    revocation: null,
    ...overrides
  };
}

function bundle(reportValue = report(), overrides = {}) {
  return {
    schemaVersion: 'PHI-OS-HDR-REGISTERED-PROFESSIONAL-FINAL-REPORT-BUNDLE-v1.0.0',
    report: reportValue,
    signedOutput: {
      professional_id: 'PRO-1',
      client_id: 'CUS-1',
      consent_reference: 'CONSENT-1',
      service_scope: 'human_design_foundation_report',
      signed_at: '2026-08-23T08:00:00.000Z',
      signed_by: 'PRO-1'
    },
    authorisation: {
      allowed: true,
      professional_id: 'PRO-1',
      client_id: 'CUS-1',
      consent_id: 'CONSENT-1'
    },
    ...overrides
  };
}

function releaseInput(overrides = {}) {
  return {
    releaseId: 'REL-001',
    customerId: 'CUS-1',
    professionalId: 'PRO-1',
    releaseChannel: 'CUSTOMER_WORKSPACE',
    releasedAt: '2026-08-23T08:05:00.000Z',
    releasedBy: 'PRO-1',
    releaseReason: 'Explicit customer delivery after professional finalisation.',
    releaseStatus: 'ACTIVE',
    explicitAction: true,
    previousReleaseReference: null,
    supersedesReleaseReference: null,
    ...overrides
  };
}

function authorization(release = null) {
  return {
    allowed: true,
    authorizationType: 'ACCOUNT_CUSTOMER_REPORT_ACCESS',
    customerId: 'CUS-1',
    reportId: 'HDR-REPORT-001',
    releaseId: release?.releaseId || 'REL-001'
  };
}

function buildReleased(reportValue = report(), consentValue = consent()) {
  const reportBundle = bundle(reportValue);
  const release = createReportReleaseAssertion({
    reportBundle,
    consent: consentValue,
    release: releaseInput()
  }, { now: '2026-08-23T08:05:00.000Z' });
  const released = resolveReleasedCustomerReport({
    report: reportValue,
    releaseAssertion: release,
    consent: consentValue
  }, { now: '2026-08-23T08:06:00.000Z' });
  return { release, released };
}

function checkAuthorityAndRelease() {
  const audit = read(`${ROOT}/audits/customer-presentation-authority-audit-v1.json`);
  assert.equal(audit.status, 'RECONCILED_NO_SECOND_AUTHORITY');
  assert.deepEqual(audit.exitGate, {
    secondReportAuthorityCreated: false,
    secondPresentationAuthorityCreated: false,
    hdrProductionActivated: false,
    frozenCprMutated: false
  });
  for (const item of audit.frozenInputs) {
    assert.equal(sha(item.path), item.sha256, `Frozen input drift: ${item.path}`);
  }
  const r = report();
  const c = consent();
  const rel = createReportReleaseAssertion({
    reportBundle: bundle(r),
    consent: c,
    release: releaseInput()
  }, { now: '2026-08-23T08:05:00.000Z' });
  assert.equal(rel.releaseStatus, 'ACTIVE');
  assert.equal(rel.reportDigest, digestCanonical(r));
  assert.equal(rel.customerId, r.client_id);
  assert.equal(rel.professionalId, r.professional_id);

  throws(() => createReportReleaseAssertion({
    reportBundle: bundle({ ...r, status: 'professional_review' }),
    consent: c,
    release: releaseInput()
  }, { now: '2026-08-23T08:05:00.000Z' }), 'REPORT_NOT_FINAL');

  throws(() => createReportReleaseAssertion({
    reportBundle: bundle(r, { signedOutput: null }),
    consent: c,
    release: releaseInput()
  }, { now: '2026-08-23T08:05:00.000Z' }), 'SIGNED_OUTPUT_REQUIRED');

  throws(() => createReportReleaseAssertion({
    reportBundle: bundle(r),
    consent: c,
    release: releaseInput({ customerId: 'CUS-OTHER' })
  }, { now: '2026-08-23T08:05:00.000Z' }), 'CUSTOMER_REPORT_MISMATCH');

  throws(() => createReportReleaseAssertion({
    reportBundle: bundle(r),
    consent: consent({ revoked_scopes: ['report_sharing'] }),
    release: releaseInput()
  }, { now: '2026-08-23T08:05:00.000Z' }), 'REPORT_SHARING_REVOKED');

  console.log('✓ CPR-CUST release: signed final + explicit active release passes; draft/unsigned/wrong customer/revoked consent fail closed.');
}

function checkProjection() {
  const { release, released } = buildReleased();
  assert.equal(released.downstreamEligibilityOnly, true);
  assert.equal(released.mutatesReport, false);
  assert.equal(released.clonesReportAuthority, false);
  assert.equal(released.changesInterpretation, false);

  throws(() => resolveReleasedCustomerReport({
    report: report(),
    releaseAssertion: null,
    consent: consent()
  }), 'ASSERTION_REQUIRED');

  const superseded = updateReportReleaseStatus(release, 'SUPERSEDED', {
    explicitAction: true,
    changedAt: '2026-08-23T09:00:00.000Z',
    changedBy: 'PRO-1',
    reason: 'New report version released.'
  });
  throws(() => resolveReleasedCustomerReport({
    report: report(),
    releaseAssertion: superseded,
    consent: consent()
  }, { now: '2026-08-23T09:01:00.000Z' }), 'RELEASE_NOT_ACTIVE');

  const successor = read(`${ROOT}/successors/canonical-presentation-contract-v2-successor.json`);
  assert.equal(successor.presentationModes.REPORT_BASED.sourceAssetReferences.minItems, 0);
  assert.equal(successor.presentationModes.REPORT_BASED.releasedReportReference, 'required');
  assert.equal(successor.rules.fakeAssetForMinItemsForbidden, true);
  console.log('✓ CPR-CUST projection: released-report gate is downstream-only; superseded/unreleased reports block; report-based presentation requires no fake asset.');
}

function checkVisibility() {
  const hiddenReport = report();
  hiddenReport.sections = hiddenReport.sections.map(section =>
    section.section_id === 'strategy'
      ? { ...section, client_visible: false }
      : section
  );
  const sections = projectCustomerVisibleSections(hiddenReport, 'en');
  assert.ok(!sections.some(section => section.sectionId === 'strategy'));
  assert.ok(sections.some(section =>
    section.sectionId === 'limitations' && section.boundaryAlwaysVisible
  ));
  assert.ok(sections.some(section =>
    section.sectionId === 'type' &&
    section.authorityLabel === 'Calculated by PHI OS'
  ));
  assert.equal(
    sections.find(section => section.sectionId === 'type').professionalAttribution,
    null
  );
  assert.ok(sections.some(section =>
    section.sectionId === 'variables_phs' &&
    section.authorityLabel === 'Professional interpretation'
  ));
  throws(
    () => assertNoForbiddenCustomerFields({ authorization: { allowed: true } }),
    'FORBIDDEN_FIELD'
  );
  console.log('✓ CPR-CUST visibility: client_visible=false hides; authority semantics remain visible; raw authorization/internal fields are blocked; limitations remain mandatory.');
}

function checkLocale() {
  const { released } = buildReleased();
  const zh = createCustomerWorkspaceProjection(released, {
    locale: 'zh-Hans',
    authorization: authorization()
  });
  assert.equal(zh.locale, 'zh-Hans');
  assert.equal(
    zh.sections.find(section => section.sectionId === 'type').title,
    '类型'
  );
  assert.equal(
    zh.sections.find(section => section.sectionId === 'type').authorityLabel,
    '系统计算'
  );
  throws(() => createCustomerWorkspaceProjection(released, {
    locale: 'mixed',
    authorization: authorization()
  }), 'LOCALE_UNSUPPORTED');
  const localeContract = read(`${ROOT}/contracts/cpr-locale-presentation-runtime-v1.json`);
  assert.deepEqual(localeContract.supportedLocales, ['en', 'zh-Hans']);
  assert.equal(localeContract.mixedLocaleDefault, 'forbidden');
  console.log('✓ CPR-CUST locale: en/zh-Hans are explicit single-locale projections; implicit mixed-language mode is blocked.');
}

function checkHdrBoundary() {
  const execution = read(
    'content/professional/method-client-delivery/contracts/mcd-4-execution-contract-v1.json'
  );
  assert.equal(execution.methodExecution.HDR.productionInvocationAllowed, false);
  const hdrProfile = read(
    'content/professional/method-client-delivery/registries/hdr-input-requirement-profile-v1.json'
  );
  assert.equal(hdrProfile.authorityGate.customerResultAllowed, false);
  const hdrSource = fs.readFileSync(
    'functions/professional/hdr-internal/hdr-registered-professional-final-report-runtime.js',
    'utf8'
  );
  assert.match(hdrSource, /aiGenerated === true/);
  assert.match(hdrSource, /aiMayFillManualHdrFields:\s*false/);
  assert.match(hdrSource, /hdrProductionDispatchChanged:\s*false/);
  assert.match(hdrSource, /clientReleaseRequiresSeparateExplicitAction:\s*true/);
  const production = read(`${ROOT}/registries/canonical-presentation-production-registry-v2.json`);
  const record = production.productionRecords[0];
  assert.equal(record.hdrExecutionGranted, false);
  assert.equal(record.hdrCustomerResultDispatchGranted, false);
  assert.equal(record.publicSelfServiceEligible, false);
  console.log('✓ CPR-CUST HDR boundary: released professional report may be presented, but direct HDR dispatch, customer self-service, and AI-filled manual HDR fields remain blocked.');
}

function checkCrossSurface() {
  const { released } = buildReleased();
  const auth = authorization();
  const workspace = createCustomerWorkspaceProjection(released, {
    locale: 'en',
    authorization: auth
  });
  const pdf = createCustomerPdfProjection(released, {
    locale: 'en',
    authorization: auth
  });
  assert.equal(workspace.sourceContentDigest, pdf.sourceContentDigest);
  assert.deepEqual(workspace.sections, pdf.sections);
  assert.notDeepEqual(workspace.surfaceRenderHints, pdf.surfaceRenderHints);
  assert.equal(workspace.surfaceRenderHints.semanticContentMayDiffer, false);
  assert.equal(pdf.surfaceRenderHints.semanticContentMayDiffer, false);
  assert.ok(workspace.layers.some(layer =>
    layer.layerCode === 'L1_IMMEDIATE_UNDERSTANDING'
  ));
  assert.ok(workspace.layers.some(layer =>
    layer.layerCode === 'L2_CONFIRMATION'
  ));
  assert.ok(workspace.layers.some(layer =>
    layer.layerCode === 'L3_PROFESSIONAL_EVIDENCE'
  ));
  console.log('✓ CPR-CUST cross-surface: Workspace/PDF share one semantic source digest; only renderer/layout hints may differ.');
}

function checkProduction() {
  const legacy = read(`${ROOT}/registries/canonical-presentation-registry-v1.json`);
  assert.deepEqual(legacy.productionRecords, []);
  assert.equal(legacy.productionRecordsMustRemainEmptyAtFreeze, true);
  const current = read(`${ROOT}/registries/canonical-presentation-production-registry-v2.json`);
  assert.equal(current.productionRecords.length, 1);
  const record = current.productionRecords[0];
  assert.equal(record.presentationCode, 'CPR-PRESENT-HDR-FOUNDATION-REPORT');
  assert.equal(record.sourceAuthority, 'RELEASED_CANONICAL_REPORT');
  assert.equal(record.workspaceEligible, true);
  assert.equal(record.pdfEligible, true);
  assert.equal(record.publicWebsiteEligible, false);
  assert.equal(record.publicSelfServiceEligible, false);

  const acceptance = read(`${ROOT}/acceptance/cpr-customer-production-acceptance-v1.json`);
  assert.equal(acceptance.scenarios.length, 12);
  assert.deepEqual(
    acceptance.scenarios.map(item => item.expected),
    ['PASS','BLOCK','BLOCK','BLOCK','BLOCK','BLOCK','HIDDEN','BLOCK','BLOCK','BLOCK','PASS','PASS']
  );
  console.log('✓ CPR-CUST production: frozen v1 registry stays empty; v2 successor activates one released-report presentation record with 12 acceptance scenarios.');
}

function checkFreeze() {
  const freezePath = `${ROOT}/freeze/cpr-customer-production-freeze-v1.json`;
  assert.ok(fs.existsSync(freezePath), 'CPR-CUST freeze missing');
  const freeze = read(freezePath);
  assert.equal(freeze.status, 'FROZEN_CUSTOMER_PRESENTATION_SUCCESSOR_GLOBAL_CURRENT_GATE_PENDING');
  for (const item of freeze.artifacts) {
    assert.ok(fs.existsSync(item.path), `Missing frozen artifact: ${item.path}`);
    assert.equal(sha(item.path), item.sha256, `Frozen artifact drift: ${item.path}`);
  }
  assert.deepEqual(freeze.exitGate, {
    secondReportAuthorityCreated: false,
    secondPresentationAuthorityCreated: false,
    hdrProductionActivated: false,
    frozenCprMutated: false,
    customerReleaseRequired: true,
    customerAuthorizationRequired: true,
    workspacePdfSemanticSourceShared: true,
    machineAcceptanceScenariosPassed: 12
  });
  console.log('✓ CPR-CUST freeze: W0-W12 successor evidence is digest-bound; frozen CPR/HDR authorities remain unchanged.');
}

const gates = {
  release: checkAuthorityAndRelease,
  projection: checkProjection,
  visibility: checkVisibility,
  locale: checkLocale,
  'hdr-boundary': checkHdrBoundary,
  'cross-surface': checkCrossSurface,
  production: checkProduction,
  freeze: checkFreeze
};

if (gate === 'all') {
  for (const fn of Object.values(gates)) fn();
} else {
  assert.ok(gates[gate], `Unknown CPR-CUST gate: ${gate}`);
  gates[gate]();
}
