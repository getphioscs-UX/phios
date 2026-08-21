import { validateCanonicalBirthInput, evaluateMethodInputReadiness } from '../../method-client-delivery/canonical-birth-input-runtime.js';
import { createHdrDesignMomentRuntime, HDR_DESIGN_MOMENT_RUNTIME_CODE } from '../../core-method-runtime/hdr-design-moment-runtime.js';
import { calculatePersonalStructure } from '../../method-runtime/personal-structure/personal-structure-runtime.js';
import { projectPersonalStructure } from '../../method-runtime/personal-structure/personal-structure-projection-runtime.js';
import { sha256 } from '../../method-runtime/shared-calculation-runtime.js';
import {
  createHdrInternalAstronomyAdapter,
  HDR_INTERNAL_ASTRONOMY_ADAPTER_CODE,
  HDR_INTERNAL_ASTRONOMY_ADAPTER_VERSION,
  HDR_INTERNAL_ASTRONOMY_ENGINE_VERSION,
  HDR_INTERNAL_NODE_CONVENTION
} from './hdr-internal-astronomy-adapter.js';

export const HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_CODE = 'HDR_INTERNAL_PROFESSIONAL_VALIDATION_REPORT_RUNTIME';
export const HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_VERSION = '1.0.0';
export const HDR_INTERNAL_VALIDATION_REPORT_SCHEMA_VERSION = 'PHI-OS-HDR-INTERNAL-PROFESSIONAL-VALIDATION-REPORT-v1.0.0';

const SECTION_CODES = Object.freeze([
  'chart_overview', 'type', 'strategy', 'authority', 'profile', 'definition',
  'centers', 'channels', 'key_gates', 'variables_phs', 'environment',
  'cognition', 'motivation', 'general_operating_conditions', 'limitations'
]);
const REVIEW_DECISIONS = new Set(['ACCEPT_FOR_INTERNAL_USE', 'REVISE_INTERNAL', 'REJECT_INTERNAL']);

function object(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(code);
  return value;
}
function text(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(code);
  return value.trim();
}
function iso(value, code) {
  const result = text(value, code);
  if (Number.isNaN(Date.parse(result))) throw new TypeError(code);
  return new Date(result).toISOString();
}
function utcFromCanonicalInput(input) {
  const offset = input.timezone?.utcOffsetAtBirth;
  if (!input.birthDate || !input.birthTime || !offset) throw new Error('HDR_INTERNAL_EXACT_UTC_CONTEXT_REQUIRED');
  const instant = new Date(`${input.birthDate}T${input.birthTime}${offset}`);
  if (Number.isNaN(instant.valueOf())) throw new Error('HDR_INTERNAL_CANONICAL_UTC_INVALID');
  return instant.toISOString();
}
function sharedRecord(recordId, recordType, payload) {
  return Object.freeze({
    authority: 'SHARED_DATA_AUTHORITY', status: 'verified', methodOwner: null,
    pluginOwner: null, recordId, recordType, recordVersion: 'HDR-INTERNAL-v1',
    payload: Object.freeze(payload)
  });
}
function freezeSection(sectionCode, sourceType, content, status = 'CALCULATED') {
  return Object.freeze({ sectionCode, sourceType, status, content: Object.freeze(content) });
}
function unknown(reason) {
  return Object.freeze({ value: null, reason, professionalReviewRequired: true });
}
function channelCodes(channels) {
  return (channels || []).map(channel => channel.channelCode || `${channel.gates?.[0]}-${channel.gates?.[1]}`);
}
function activationSummary(activations) {
  return (activations || []).map(a => Object.freeze({
    layer: a.layer, bodyCode: a.bodyCode, gate: a.gate, line: a.line,
    eclipticLongitude: a.eclipticLongitude
  }));
}
function assertInternalContext(context) {
  object(context, 'HDR_INTERNAL_PROFESSIONAL_CONTEXT_REQUIRED');
  for (const key of ['professionalId', 'professionalName', 'clientId', 'workspaceId', 'consentReference']) {
    text(context[key], `HDR_INTERNAL_CONTEXT_${key.toUpperCase()}_REQUIRED`);
  }
  if (context.workspaceAccessGranted !== true || context.boundaryAcknowledged !== true) {
    throw new Error('HDR_INTERNAL_PROFESSIONAL_WORKSPACE_GATE_FAILED');
  }
}
function assertAstronomyAdapter(adapter) {
  object(adapter, 'HDR_INTERNAL_ASTRONOMY_ADAPTER_REQUIRED');
  if (adapter.adapterCode !== HDR_INTERNAL_ASTRONOMY_ADAPTER_CODE ||
      adapter.adapterVersion !== HDR_INTERNAL_ASTRONOMY_ADAPTER_VERSION ||
      adapter.engineCode !== 'ASTRONOMY_ENGINE_JS' ||
      adapter.engineVersion !== HDR_INTERNAL_ASTRONOMY_ENGINE_VERSION ||
      adapter.nodeConvention !== HDR_INTERNAL_NODE_CONVENTION ||
      adapter.providerUsed !== false || adapter.aiUsed !== false ||
      typeof adapter.calculateLongitudesAt !== 'function' ||
      typeof adapter.sunLongitudeAt !== 'function') {
    throw new TypeError('HDR_INTERNAL_GOVERNED_ASTRONOMY_ADAPTER_REQUIRED');
  }
}

function buildSections(structure, meta) {
  const o = structure.output;
  const sections = [
    freezeSection('chart_overview', 'system_calculation', {
      personalityInstantUTC: meta.personalityInstantUTC,
      designInstantUTC: meta.designInstantUTC,
      designSolarArcDegrees: 88,
      activationCount: o.activations.length,
      incarnationConfiguration: o.incarnation,
      calculationAuthority: 'SHARED_CALCULATION_RUNTIME',
      projectionAuthority: 'SHARED_PROJECTION_RUNTIME'
    }),
    freezeSection('type', 'system_calculation', { typeCode: o.typeCode, projectorSubtype: o.projectorSubtype || null }),
    freezeSection('strategy', 'unknown', unknown('STRATEGY_NOT_DERIVED_BY_CURRENT_CALCULATION_AUTHORITY'), 'UNKNOWN'),
    freezeSection('authority', 'system_calculation', { authorityCode: o.authorityCode }),
    freezeSection('profile', 'system_calculation', { profile: o.profile }),
    freezeSection('definition', 'system_calculation', { definition: o.definition }),
    freezeSection('centers', 'system_calculation', { definedCenters: o.definedCenters, undefinedCenters: o.undefinedCenters, connectedComponents: o.connectedComponents }),
    freezeSection('channels', 'system_calculation', { channels: channelCodes(o.activatedChannels), hangingGates: o.hangingGates }),
    freezeSection('key_gates', 'system_calculation', { note: 'All calculated Gate/Line activations are listed; no automatic key-gate interpretation is created.', activations: activationSummary(o.activations) }),
    freezeSection('variables_phs', 'unknown', unknown('VARIABLE_ADVANCED_NOT_ACCEPTED_BY_CURRENT_RUNTIME'), 'UNKNOWN'),
    freezeSection('environment', 'unknown', unknown('ENVIRONMENT_INTERPRETATION_NOT_AUTOMATICALLY_DERIVED'), 'UNKNOWN'),
    freezeSection('cognition', 'unknown', unknown('COGNITION_INTERPRETATION_NOT_AUTOMATICALLY_DERIVED'), 'UNKNOWN'),
    freezeSection('motivation', 'unknown', unknown('MOTIVATION_INTERPRETATION_NOT_AUTOMATICALLY_DERIVED'), 'UNKNOWN'),
    freezeSection('general_operating_conditions', 'professional_review_required', { value: null, reason: 'INTERPRETATION_REQUIRES_SEPARATE_PROFESSIONAL_REVIEW', professionalReviewRequired: true }, 'PENDING_REVIEW'),
    freezeSection('limitations', 'governance', {
      internalOnly: true,
      clientDeliveryAllowed: false,
      publicExposureAllowed: false,
      automaticInterpretation: false,
      automaticProfessionalJudgment: false,
      automaticRelease: false,
      brandedPublicHdrExposure: false,
      reportPurpose: 'INTERNAL_PROFESSIONAL_VALIDATION_AND_REVIEW'
    })
  ];
  if (sections.map(s => s.sectionCode).join('|') !== SECTION_CODES.join('|')) throw new Error('HDR_INTERNAL_REPORT_SECTION_ORDER_INVALID');
  return Object.freeze(sections);
}

export function createHdrInternalValidationReportRuntime({ astronomyAdapter, astronomyModuleLoader } = {}) {
  const adapter = astronomyAdapter || createHdrInternalAstronomyAdapter({ astronomyModuleLoader });
  assertAstronomyAdapter(adapter);
  const designRuntime = createHdrDesignMomentRuntime({
    solarLongitudeAdapter: Object.freeze({
      adapterCode: `${adapter.adapterCode}:SUN_LONGITUDE`,
      adapterVersion: adapter.adapterVersion,
      ephemerisVersion: adapter.engineVersion,
      providerUsed: false,
      aiUsed: false,
      async sunLongitudeAt({ utcIso }) { return adapter.sunLongitudeAt({ utcIso }); }
    })
  });

  return Object.freeze({
    runtimeCode: HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_CODE,
    runtimeVersion: HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_VERSION,

    async generate(request) {
      object(request, 'HDR_INTERNAL_REPORT_REQUEST_REQUIRED');
      const requestId = text(request.requestId, 'HDR_INTERNAL_REQUEST_ID_REQUIRED');
      const reportId = text(request.reportId, 'HDR_INTERNAL_REPORT_ID_REQUIRED');
      const generatedAt = iso(request.generatedAt, 'HDR_INTERNAL_GENERATED_AT_REQUIRED');
      const input = object(request.canonicalBirthInput, 'HDR_INTERNAL_CANONICAL_INPUT_REQUIRED');
      const validation = validateCanonicalBirthInput(input);
      if (!validation.valid) throw new Error(`HDR_INTERNAL_CANONICAL_INPUT_INVALID:${validation.reasonCodes.join(',')}`);
      const readiness = evaluateMethodInputReadiness('HUMAN_DESIGN', input);
      if (readiness.state !== 'READY') throw new Error(`HDR_INTERNAL_INPUT_NOT_READY:${readiness.missingFields.join(',')}`);
      if (input.timeAccuracy !== 'EXACT') throw new Error('HDR_INTERNAL_EXACT_BIRTH_TIME_REQUIRED');
      if (input.consent?.hdrInternalValidation !== true) throw new Error('HDR_INTERNAL_EXPLICIT_VALIDATION_CONSENT_REQUIRED');
      assertInternalContext(request.professionalContext);

      const personalityInstantUTC = utcFromCanonicalInput(input);
      const personality = await adapter.calculateLongitudesAt(personalityInstantUTC);
      const personalityDigest = await sha256(personality);
      const personalityHdrRecord = sharedRecord(`${requestId}:HDR-PERSONALITY`, 'HDR_PERSONALITY_ASTRONOMY', {
        runtimeCode: 'HDR_INTERNAL_ASTRONOMY_SUCCESSOR', runtimeVersion: '1.0.0',
        outputDigest: personalityDigest, utcIso: personalityInstantUTC,
        longitudes: personality.longitudes, deterministic: true, providerUsed: false, aiUsed: false,
        designMomentCreated: false, gateMappingCreated: false, bodyGraphCreated: false,
        projectionCreated: false, interpretationCreated: false, professionalConclusionCreated: false
      });
      const designMomentResult = await designRuntime.solve({
        calculationId: `${requestId}:HDR-DESIGN-MOMENT`,
        runtimeCode: HDR_DESIGN_MOMENT_RUNTIME_CODE,
        inputRecords: [personalityHdrRecord],
        ephemerisVersion: adapter.engineVersion,
        referenceVersions: { internalValidationReport: HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_VERSION }
      });
      const designInstantUTC = designMomentResult.output.designUtcIso;
      const design = await adapter.calculateLongitudesAt(designInstantUTC);

      const mirRecords = [
        sharedRecord(`${requestId}:INPUT`, 'CANONICAL_BIRTH_INPUT', input),
        sharedRecord(`${requestId}:PERSONALITY`, 'PERSONALITY_ASTRONOMY', {
          instantUTC: personalityInstantUTC, longitudes: personality.longitudes,
          astronomyRef: `${adapter.adapterCode}@${adapter.adapterVersion}`
        }),
        sharedRecord(`${requestId}:DESIGN`, 'DESIGN_ASTRONOMY', {
          instantUTC: designInstantUTC, longitudes: design.longitudes,
          astronomyRef: `${adapter.adapterCode}@${adapter.adapterVersion}`
        }),
        sharedRecord(`${requestId}:DESIGN-MOMENT`, 'DESIGN_MOMENT', {
          designMomentRef: `${requestId}:DESIGN-MOMENT`, designInstantUTC,
          personalitySunLongitude: personality.longitudes.SUN,
          designSunLongitude: design.longitudes.SUN, solarArcDeg: 88,
          solverTolerance: designMomentResult.output.solver.angleToleranceDegrees,
          iterationCount: designMomentResult.output.solver.iterations,
          fixedDaySubtractionUsed: false,
          lineage: { runtimeCode: HDR_DESIGN_MOMENT_RUNTIME_CODE, outputDigest: designMomentResult.outputDigest }
        }),
        sharedRecord(`${requestId}:CONSENT`, 'CONSENT', { valid: true, purpose: 'HDR_INTERNAL_PROFESSIONAL_VALIDATION_REPORT' })
      ];
      const structure = await calculatePersonalStructure({
        calculationId: `${requestId}:PERSONAL-STRUCTURE`, inputRecords: mirRecords,
        nodeConvention: HDR_INTERNAL_NODE_CONVENTION,
        referenceVersions: {
          hdrInternalValidationSuccessor: HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_VERSION,
          astronomyAdapter: `${adapter.adapterCode}@${adapter.adapterVersion}`,
          engineVersion: adapter.engineVersion
        }
      });
      if (structure.output.capabilityReadiness.eligible !== true) throw new Error('HDR_INTERNAL_PERSONAL_STRUCTURE_NOT_ELIGIBLE');
      const projection = await projectPersonalStructure(structure, { projectionVersion: 'PHI-OS-HDR-INTERNAL-VALIDATION-PROJECTION-v1.0.0' });
      const sections = buildSections(structure, { personalityInstantUTC, designInstantUTC });

      return Object.freeze({
        schemaVersion: HDR_INTERNAL_VALIDATION_REPORT_SCHEMA_VERSION,
        runtimeCode: HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_CODE,
        runtimeVersion: HDR_INTERNAL_VALIDATION_REPORT_RUNTIME_VERSION,
        reportId, requestId, generatedAt,
        status: 'AWAITING_PROFESSIONAL_REVIEW',
        visibility: 'INTERNAL_ONLY',
        methodReference: Object.freeze({
          internalMethodLabel: 'HUMAN_DESIGN', pluginCode: 'HDR',
          calculationRuntime: 'PHI_OS_PERSONAL_STRUCTURE_RUNTIME',
          historicalHdrValidationCorePreserved: true,
          publicBrandedMethodAuthorityCreated: false
        }),
        professionalContext: Object.freeze({ ...request.professionalContext }),
        inputReference: Object.freeze({ inputVersion: input.inputVersion, inputDigest: await sha256(input) }),
        calculationReference: Object.freeze({ calculationId: structure.calculationId, outputDigest: structure.outputDigest, capabilityReadiness: structure.output.capabilityReadiness }),
        projectionReference: Object.freeze({ sourceCalculationId: projection.sourceCalculationId, projectionCount: projection.projections.length, publicVocabulary: projection.publicVocabulary }),
        sections,
        review: Object.freeze({ required: true, status: 'PENDING', professionalId: request.professionalContext.professionalId, reviewedAt: null, decision: null, findings: Object.freeze([]) }),
        governance: Object.freeze({
          executionMode: 'INTERNAL_VALIDATION_ONLY', deterministicCalculation: true,
          providerUsedForCalculation: false, aiUsedForCalculation: false,
          interpretationCreated: false, professionalJudgmentCreated: false,
          productionDispatchAuthorityCreated: false, hdrProductionEligibilityChanged: false,
          hdrProfessionalEligibilityChanged: false, clientDeliveryAllowed: false,
          publicExposureAllowed: false, automaticReleaseAllowed: false,
          professionalReviewRequired: true, workspaceReviewOnly: true
        })
      });
    },

    review(report, reviewInput) {
      object(report, 'HDR_INTERNAL_REPORT_REQUIRED');
      object(reviewInput, 'HDR_INTERNAL_REVIEW_INPUT_REQUIRED');
      if (report.schemaVersion !== HDR_INTERNAL_VALIDATION_REPORT_SCHEMA_VERSION || report.visibility !== 'INTERNAL_ONLY') throw new Error('HDR_INTERNAL_REPORT_CONTRACT_INVALID');
      const professionalId = text(reviewInput.professionalId, 'HDR_INTERNAL_REVIEWER_REQUIRED');
      if (professionalId !== report.professionalContext.professionalId) throw new Error('HDR_INTERNAL_REVIEWER_MISMATCH');
      const decision = text(reviewInput.decision, 'HDR_INTERNAL_REVIEW_DECISION_REQUIRED');
      if (!REVIEW_DECISIONS.has(decision)) throw new Error('HDR_INTERNAL_REVIEW_DECISION_INVALID');
      const findings = Array.isArray(reviewInput.findings) ? reviewInput.findings.map((item, index) => text(item, `HDR_INTERNAL_REVIEW_FINDING_${index}_INVALID`)) : [];
      const reviewedAt = iso(reviewInput.reviewedAt, 'HDR_INTERNAL_REVIEWED_AT_REQUIRED');
      return Object.freeze({
        ...report,
        status: decision === 'ACCEPT_FOR_INTERNAL_USE' ? 'INTERNAL_REVIEWED' : decision === 'REVISE_INTERNAL' ? 'INTERNAL_REVISION_REQUIRED' : 'INTERNAL_REJECTED',
        review: Object.freeze({ required: true, status: 'COMPLETED', professionalId, reviewedAt, decision, findings: Object.freeze(findings) }),
        governance: Object.freeze({ ...report.governance, clientDeliveryAllowed: false, publicExposureAllowed: false, automaticReleaseAllowed: false, professionalReviewCompleted: true })
      });
    }
  });
}
