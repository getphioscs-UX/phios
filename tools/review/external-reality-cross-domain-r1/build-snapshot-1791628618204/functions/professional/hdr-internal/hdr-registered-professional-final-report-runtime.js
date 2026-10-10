import { evaluateProfessionalAuthorisation } from '../access/professional-authorisation-decision.js';
import { createProfessionalReport } from '../reports/professional-report-contract.js';
import { createProfessionalReportRevision } from '../reports/professional-report-version-contract.js';

export const HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME_CODE =
  'HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME';
export const HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME_VERSION = '1.0.0';
export const HDR_REGISTERED_PROFESSIONAL_LOGIN_ASSERTION_VERSION =
  'phi-os.professional-login-assertion.v1';
export const HDR_REGISTERED_PROFESSIONAL_CAPABILITY =
  'human_design_professional_report';

const REQUIRED_MANUAL_SECTIONS = Object.freeze([
  'strategy', 'variables_phs', 'environment', 'cognition', 'motivation'
]);
const REQUIRED_RESOURCE_SCOPES = Object.freeze([
  'human_design_chart', 'birth_information', 'previous_reports'
]);
const REQUIRED_HD_SCOPES = Object.freeze([
  'derived_chart_fields', 'professional_interpretation'
]);

function object(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(code);
  }
  return value;
}
function text(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(code);
  return value.trim();
}
function iso(value, code) {
  const valueText = text(value, code);
  const time = Date.parse(valueText);
  if (!Number.isFinite(time)) throw new TypeError(code);
  return new Date(time).toISOString();
}
function list(value) {
  return Array.isArray(value) ? value : [];
}
function sectionMap(report) {
  return new Map(list(report?.sections).map(section => [section.sectionCode, section]));
}
function printable(value) {
  if (value === null || value === undefined) return 'Unknown';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
function bilingual(en, zhHans) {
  return Object.freeze({
    en: text(en, 'HDR_FINAL_SECTION_EN_REQUIRED'),
    zh_Hans: text(zhHans, 'HDR_FINAL_SECTION_ZH_REQUIRED')
  });
}
function requireManualEntry(entry, code) {
  object(entry, `HDR_FINAL_MANUAL_${code.toUpperCase()}_REQUIRED`);
  if (entry.enteredManually !== true) {
    throw new Error(`HDR_FINAL_MANUAL_${code.toUpperCase()}_MUST_BE_EXPLICIT`);
  }
  if (entry.autoDerived === true || entry.aiGenerated === true) {
    throw new Error(`HDR_FINAL_MANUAL_${code.toUpperCase()}_AUTO_DERIVATION_FORBIDDEN`);
  }
  const content = object(entry.content, `HDR_FINAL_MANUAL_${code.toUpperCase()}_CONTENT_REQUIRED`);
  const confidence = text(entry.confidence || 'not_assessed', `HDR_FINAL_MANUAL_${code.toUpperCase()}_CONFIDENCE_REQUIRED`);
  if (!['low', 'moderate', 'high', 'not_assessed'].includes(confidence)) {
    throw new Error(`HDR_FINAL_MANUAL_${code.toUpperCase()}_CONFIDENCE_INVALID`);
  }
  return Object.freeze({
    content: bilingual(content.en, content.zh_Hans),
    sourceReference: text(entry.sourceReference, `HDR_FINAL_MANUAL_${code.toUpperCase()}_SOURCE_REQUIRED`),
    confidence,
    enteredManually: true,
    autoDerived: false,
    aiGenerated: false
  });
}

export function validateHdrProfessionalLoginAssertion(assertion, identity, options = {}) {
  object(assertion, 'HDR_FINAL_PROFESSIONAL_LOGIN_REQUIRED');
  object(identity, 'HDR_FINAL_PROFESSIONAL_IDENTITY_REQUIRED');
  const now = iso(options.now || new Date().toISOString(), 'HDR_FINAL_LOGIN_NOW_INVALID');
  if (assertion.contract !== HDR_REGISTERED_PROFESSIONAL_LOGIN_ASSERTION_VERSION) {
    throw new Error('HDR_FINAL_PROFESSIONAL_LOGIN_CONTRACT_INVALID');
  }
  if (assertion.authenticated !== true || assertion.authenticationContext !== 'PROFESSIONAL_LOGIN') {
    throw new Error('HDR_FINAL_PROFESSIONAL_LOGIN_NOT_AUTHENTICATED');
  }
  const sessionId = text(assertion.sessionId, 'HDR_FINAL_PROFESSIONAL_SESSION_ID_REQUIRED');
  const professionalId = text(assertion.professionalId, 'HDR_FINAL_PROFESSIONAL_SESSION_PROFESSIONAL_ID_REQUIRED');
  const subjectId = text(assertion.subjectId, 'HDR_FINAL_PROFESSIONAL_SESSION_SUBJECT_ID_REQUIRED');
  const issuedAt = iso(assertion.issuedAt, 'HDR_FINAL_PROFESSIONAL_SESSION_ISSUED_AT_REQUIRED');
  const expiresAt = iso(assertion.expiresAt, 'HDR_FINAL_PROFESSIONAL_SESSION_EXPIRES_AT_REQUIRED');
  if (expiresAt <= now || issuedAt > now) throw new Error('HDR_FINAL_PROFESSIONAL_LOGIN_SESSION_INACTIVE');
  if (identity.contract !== 'phi-os.professional-identity.v1' ||
      identity.status !== 'active' || identity.identity_verified !== true) {
    throw new Error('HDR_FINAL_REGISTERED_PROFESSIONAL_IDENTITY_REQUIRED');
  }
  if (identity.professional_id !== professionalId || identity.subject_id !== subjectId) {
    throw new Error('HDR_FINAL_PROFESSIONAL_LOGIN_IDENTITY_MISMATCH');
  }
  return Object.freeze({
    valid: true,
    sessionId,
    professionalId,
    subjectId,
    issuedAt,
    expiresAt,
    authenticationContext: 'PROFESSIONAL_LOGIN',
    authenticationSecretEmbedded: false
  });
}

function validateAuthorisedProfessionalAccess(access, login, internalReport, options = {}) {
  object(access, 'HDR_FINAL_PROFESSIONAL_ACCESS_REQUIRED');
  const request = object(access.request, 'HDR_FINAL_PROFESSIONAL_ACCESS_REQUEST_REQUIRED');
  const decision = evaluateProfessionalAuthorisation(access, { now: options.now });
  if (decision.allowed !== true) {
    throw new Error(`HDR_FINAL_PROFESSIONAL_ACCESS_DENIED:${decision.denial_reasons.map(x => x.code).join(',')}`);
  }
  if (decision.professional_id !== login.professionalId) {
    throw new Error('HDR_FINAL_LOGIN_AUTHORISATION_PROFESSIONAL_MISMATCH');
  }
  if (decision.professional_id !== internalReport.professionalContext?.professionalId ||
      decision.client_id !== internalReport.professionalContext?.clientId) {
    throw new Error('HDR_FINAL_INTERNAL_REPORT_AUTHORISATION_MISMATCH');
  }
  if (request.service_id !== 'human_design_foundation_report' ||
      request.purpose !== 'hdr_professional_report_finalization') {
    throw new Error('HDR_FINAL_PROFESSIONAL_SERVICE_SCOPE_INVALID');
  }
  if (!list(access.eligibility?.required_capability_codes)
      .includes(HDR_REGISTERED_PROFESSIONAL_CAPABILITY)) {
    throw new Error('HDR_FINAL_PROFESSIONAL_CAPABILITY_REQUIRED');
  }
  for (const scope of REQUIRED_RESOURCE_SCOPES) {
    if (!decision.resource_scopes.includes(scope)) {
      throw new Error(`HDR_FINAL_RESOURCE_SCOPE_REQUIRED:${scope}`);
    }
  }
  for (const scope of REQUIRED_HD_SCOPES) {
    if (!list(access.consent?.human_design_scopes).includes(scope)) {
      throw new Error(`HDR_FINAL_HUMAN_DESIGN_CONSENT_SCOPE_REQUIRED:${scope}`);
    }
  }
  if (access.identity?.professional_id !== login.professionalId) {
    throw new Error('HDR_FINAL_REGISTERED_PROFESSIONAL_MISMATCH');
  }
  return decision;
}

function requireAcceptedInternalReport(report) {
  object(report, 'HDR_FINAL_INTERNAL_REPORT_REQUIRED');
  if (report.schemaVersion !== 'PHI-OS-HDR-INTERNAL-PROFESSIONAL-VALIDATION-REPORT-v1.0.0') {
    throw new Error('HDR_FINAL_INTERNAL_REPORT_SCHEMA_INVALID');
  }
  if (report.visibility !== 'INTERNAL_ONLY' || report.status !== 'INTERNAL_REVIEWED') {
    throw new Error('HDR_FINAL_INTERNAL_REPORT_NOT_REVIEWED');
  }
  if (report.review?.status !== 'COMPLETED' || report.review?.decision !== 'ACCEPT_FOR_INTERNAL_USE') {
    throw new Error('HDR_FINAL_INTERNAL_REPORT_NOT_ACCEPTED');
  }
  if (report.governance?.clientDeliveryAllowed !== false ||
      report.governance?.publicExposureAllowed !== false ||
      report.governance?.automaticReleaseAllowed !== false) {
    throw new Error('HDR_FINAL_INTERNAL_REPORT_BOUNDARY_INVALID');
  }
  return report;
}

function calculatedSection(sectionId, title, sourceSection, content) {
  if (!sourceSection || sourceSection.status !== 'CALCULATED') {
    throw new Error(`HDR_FINAL_CALCULATED_SOURCE_MISSING:${sectionId}`);
  }
  return Object.freeze({
    section_id: sectionId,
    title,
    content,
    source_type: 'calculated',
    source_reference: `hdr-internal:${sectionId}`,
    confidence: 'high',
    correspondence_status: 'not_applicable',
    client_visible: true
  });
}
function manualSection(sectionId, title, manual, professionalId) {
  return Object.freeze({
    section_id: sectionId,
    title,
    content: manual.content,
    source_type: 'professional_interpretation',
    source_reference: manual.sourceReference,
    professional_id: professionalId,
    confidence: manual.confidence,
    correspondence_status: 'not_applicable',
    client_visible: true
  });
}

function buildFoundationSections(internalReport, manualCompletion, professionalId) {
  const map = sectionMap(internalReport);
  const manual = Object.fromEntries(
    REQUIRED_MANUAL_SECTIONS.map(code => [code, requireManualEntry(manualCompletion[code], code)])
  );
  const chart = map.get('chart_overview')?.content || {};
  const type = map.get('type')?.content || {};
  const authority = map.get('authority')?.content || {};
  const profile = map.get('profile')?.content || {};
  const definition = map.get('definition')?.content || {};
  const centers = map.get('centers')?.content || {};
  const channels = map.get('channels')?.content || {};
  const gates = map.get('key_gates')?.content || {};

  const optionalOperating = manualCompletion.general_operating_conditions
    ? requireManualEntry(manualCompletion.general_operating_conditions, 'general_operating_conditions')
    : null;

  return Object.freeze([
    calculatedSection('chart_overview', bilingual('Chart Overview', '图表总览'), map.get('chart_overview'), bilingual(
      `Personality instant: ${printable(chart.personalityInstantUTC)}; Design instant: ${printable(chart.designInstantUTC)}; Design solar arc: ${printable(chart.designSolarArcDegrees)}°; Activations: ${printable(chart.activationCount)}; Incarnation configuration: ${printable(chart.incarnationConfiguration)}.`,
      `人格时刻：${printable(chart.personalityInstantUTC)}；设计时刻：${printable(chart.designInstantUTC)}；设计太阳弧：${printable(chart.designSolarArcDegrees)}°；激活数量：${printable(chart.activationCount)}；轮回交叉配置：${printable(chart.incarnationConfiguration)}。`
    )),
    calculatedSection('type', bilingual('Type', '类型'), map.get('type'), bilingual(
      `Type: ${printable(type.typeCode)}${type.projectorSubtype ? `; subtype: ${printable(type.projectorSubtype)}` : ''}.`,
      `类型：${printable(type.typeCode)}${type.projectorSubtype ? `；子类型：${printable(type.projectorSubtype)}` : ''}。`
    )),
    manualSection('strategy', bilingual('Strategy', '策略'), manual.strategy, professionalId),
    calculatedSection('authority', bilingual('Authority', '权威'), map.get('authority'), bilingual(
      `Authority: ${printable(authority.authorityCode)}.`,
      `权威：${printable(authority.authorityCode)}。`
    )),
    calculatedSection('profile', bilingual('Profile', '人生角色'), map.get('profile'), bilingual(
      `Profile: ${printable(profile.profile)}.`,
      `人生角色：${printable(profile.profile)}。`
    )),
    calculatedSection('definition', bilingual('Definition', '定义'), map.get('definition'), bilingual(
      `Definition: ${printable(definition.definition)}.`,
      `定义：${printable(definition.definition)}。`
    )),
    calculatedSection('centers', bilingual('Centers', '中心'), map.get('centers'), bilingual(
      `Defined centers: ${list(centers.definedCenters).join(', ') || 'none'}; undefined centers: ${list(centers.undefinedCenters).join(', ') || 'none'}; connected components: ${printable(centers.connectedComponents)}.`,
      `已定义中心：${list(centers.definedCenters).join('、') || '无'}；未定义中心：${list(centers.undefinedCenters).join('、') || '无'}；连接组件：${printable(centers.connectedComponents)}。`
    )),
    calculatedSection('channels', bilingual('Channels', '通道'), map.get('channels'), bilingual(
      `Channels: ${list(channels.channels).join(', ') || 'none'}; hanging gates: ${list(channels.hangingGates).join(', ') || 'none'}.`,
      `通道：${list(channels.channels).join('、') || '无'}；悬挂闸门：${list(channels.hangingGates).join('、') || '无'}。`
    )),
    calculatedSection('key_gates', bilingual('Gate / Line Activations', '闸门／爻线激活'), map.get('key_gates'), bilingual(
      `Calculated activations: ${printable(gates.activations)}. No automatic key-gate interpretation was added.`,
      `计算激活：${printable(gates.activations)}。系统没有自动加入关键闸门解读。`
    )),
    manualSection('variables_phs', bilingual('Variables / PHS', '变量／PHS'), manual.variables_phs, professionalId),
    manualSection('environment', bilingual('Environment', '环境'), manual.environment, professionalId),
    manualSection('cognition', bilingual('Cognition', '认知'), manual.cognition, professionalId),
    manualSection('motivation', bilingual('Motivation', '动机'), manual.motivation, professionalId),
    optionalOperating
      ? manualSection('general_operating_conditions', bilingual('General Operating Conditions', '总体运行条件'), optionalOperating, professionalId)
      : Object.freeze({
          section_id: 'general_operating_conditions',
          title: bilingual('General Operating Conditions', '总体运行条件'),
          content: bilingual(
            'No additional automatic operating-condition interpretation was generated. Read the professionally completed Strategy, Variables / PHS, Environment, Cognition and Motivation sections together.',
            '系统没有自动生成额外的总体运行条件解读。请结合专业人员手动完成的策略、变量／PHS、环境、认知与动机部分阅读。'
          ),
          source_type: 'professionally_verified',
          source_reference: 'hdr-final:manual-sections-reviewed-together',
          professional_id: professionalId,
          confidence: 'not_assessed',
          correspondence_status: 'not_applicable',
          client_visible: true
        }),
    Object.freeze({
      section_id: 'limitations',
      title: bilingual('Limitations', '限制'),
      content: bilingual(
        'This report is prepared through the registered Professional workflow. Calculated structure and manually entered professional interpretation are kept distinct. It is not diagnosis, medical advice, legal advice, financial advice or an automatically generated Reality Fact.',
        '本报告通过已注册专业人员流程制作。系统计算结构与专业人员手动加入的解读保持分离。本报告不构成诊断、医疗建议、法律建议、财务建议，也不是自动生成的 Reality Fact。'
      ),
      source_type: 'professionally_verified',
      source_reference: 'hdr-final:governance-boundary-v1',
      professional_id: professionalId,
      confidence: 'high',
      correspondence_status: 'not_applicable',
      client_visible: true
    })
  ]);
}

export function createHdrRegisteredProfessionalFinalReportRuntime() {
  return Object.freeze({
    runtimeCode: HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME_CODE,
    runtimeVersion: HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME_VERSION,

    finalize(input = {}, options = {}) {
      const internalReport = requireAcceptedInternalReport(input.internalReport);
      const access = object(input.professionalAccess, 'HDR_FINAL_PROFESSIONAL_ACCESS_REQUIRED');
      const login = validateHdrProfessionalLoginAssertion(
        input.loginAssertion,
        access.identity,
        { now: options.now || input.finalisation?.signedAt }
      );
      const decision = validateAuthorisedProfessionalAccess(
        access,
        login,
        internalReport,
        { now: options.now || input.finalisation?.signedAt }
      );
      const manualCompletion = object(input.manualCompletion, 'HDR_FINAL_MANUAL_COMPLETION_REQUIRED');
      const finalisation = object(input.finalisation, 'HDR_FINAL_FINALISATION_REQUIRED');
      if (finalisation.explicitFinalise !== true || finalisation.professionalReviewConfirmed !== true) {
        throw new Error('HDR_FINAL_EXPLICIT_PROFESSIONAL_FINALISATION_REQUIRED');
      }
      const signedAt = iso(finalisation.signedAt, 'HDR_FINAL_SIGNED_AT_REQUIRED');
      const signedBy = text(finalisation.signedBy, 'HDR_FINAL_SIGNED_BY_REQUIRED');
      const reviewedBy = text(finalisation.reviewedBy || signedBy, 'HDR_FINAL_REVIEWED_BY_REQUIRED');
      if (signedBy !== decision.professional_id || reviewedBy !== decision.professional_id) {
        throw new Error('HDR_FINAL_SIGNER_MUST_MATCH_REGISTERED_PROFESSIONAL');
      }

      const sections = buildFoundationSections(
        internalReport,
        manualCompletion,
        decision.professional_id
      );
      const base = {
        report_id: text(finalisation.reportId || `${internalReport.reportId}:FINAL`, 'HDR_FINAL_REPORT_ID_REQUIRED'),
        report_type: 'human_design_foundation_report',
        professional_id: decision.professional_id,
        professional_name: text(access.identity.display_name, 'HDR_FINAL_PROFESSIONAL_NAME_REQUIRED'),
        client_id: decision.client_id,
        service_scope: 'human_design_foundation_report',
        consent_reference: decision.consent_id,
        reader_type: 'human_design',
        registry_version: '1.0.0',
        sections,
        interpretation_boundary: bilingual(
          'System calculation, professional manual interpretation and client evidence are separate authorities. Manual Strategy, Variables / PHS, Environment, Cognition and Motivation entries are attributable to the registered Professional and are not automatically derived by PHI OS.',
          '系统计算、专业人员手动解读与客户证据属于不同权威。策略、变量／PHS、环境、认知与动机均由已注册专业人员手动填写，并非由 PHI OS 自动推导。'
        ),
        confidentiality_notice: bilingual(
          'Registered Professional workspace report. Not a public self-service HDR product. Sharing with the client, when authorised, requires a separate explicit release action.',
          '本报告属于已注册专业人员工作区，不是面向大众的 HDR 自助产品。如经授权需要分享给客户，仍必须执行独立的明确发布动作。'
        )
      };
      const reviewReport = createProfessionalReport({
        ...base,
        version: '1.0-review',
        status: 'professional_review',
        generated_at: signedAt
      }, { now: signedAt });
      const revision = createProfessionalReportRevision(reviewReport, {
        status: 'final',
        version: text(finalisation.version || '1.0.0', 'HDR_FINAL_VERSION_REQUIRED'),
        changed_by: decision.professional_id,
        change_reason: text(finalisation.changeReason || 'Registered Professional completed manual HDR fields and confirmed final report.', 'HDR_FINAL_CHANGE_REASON_REQUIRED'),
        reviewed_by: reviewedBy
      }, { now: signedAt });
      const finalReport = createProfessionalReport({
        ...base,
        version: revision.version,
        status: 'final',
        generated_at: signedAt
      }, { now: signedAt });

      return Object.freeze({
        schemaVersion: 'PHI-OS-HDR-REGISTERED-PROFESSIONAL-FINAL-REPORT-BUNDLE-v1.0.0',
        runtimeCode: HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME_CODE,
        runtimeVersion: HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME_VERSION,
        login: Object.freeze({
          authenticated: true,
          professionalId: login.professionalId,
          sessionId: login.sessionId,
          expiresAt: login.expiresAt
        }),
        authorisation: decision,
        internalReportReference: Object.freeze({
          reportId: internalReport.reportId,
          requestId: internalReport.requestId,
          reviewDecision: internalReport.review.decision,
          calculationId: internalReport.calculationReference?.calculationId || null
        }),
        manualCompletionLineage: Object.freeze(
          Object.fromEntries(REQUIRED_MANUAL_SECTIONS.map(code => [code, Object.freeze({
            enteredManually: true,
            sourceReference: manualCompletion[code].sourceReference,
            autoDerived: false,
            aiGenerated: false
          })]))
        ),
        report: finalReport,
        revision,
        signedOutput: Object.freeze({
          professional_id: decision.professional_id,
          client_id: decision.client_id,
          source_versions: Object.freeze([
            internalReport.runtimeVersion,
            HDR_REGISTERED_PROFESSIONAL_FINAL_REPORT_RUNTIME_VERSION
          ]),
          consent_reference: decision.consent_id,
          service_scope: 'human_design_foundation_report',
          signed_at: signedAt,
          signed_by: signedBy
        }),
        governance: Object.freeze({
          registeredProfessionalOnly: true,
          professionalLoginRequired: true,
          activeVerifiedProfessionalIdentityRequired: true,
          capabilityRequired: HDR_REGISTERED_PROFESSIONAL_CAPABILITY,
          assignmentRequired: true,
          explicitConsentRequired: true,
          publicSelfServiceAllowed: false,
          guestAccessAllowed: false,
          ordinaryAccountAccessAllowed: false,
          automaticManualFieldDerivationAllowed: false,
          aiMayFillManualHdrFields: false,
          publicHdrRuntimeCreated: false,
          hdrProductionDispatchChanged: false,
          historicalHdrFreezeMutated: false,
          reportStatus: 'final',
          automaticClientDeliveryAllowed: false,
          clientReleaseRequiresSeparateExplicitAction: true
        })
      });
    }
  });
}

export default Object.freeze({
  createHdrRegisteredProfessionalFinalReportRuntime,
  validateHdrProfessionalLoginAssertion
});
