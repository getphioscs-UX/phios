import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHdrInternalValidationReportRuntime } from '../functions/professional/hdr-internal/hdr-internal-validation-report-runtime.js';

const contract = JSON.parse(fs.readFileSync('content/professional/core-method-runtime/contracts/hdr-internal-professional-validation-report-contract-v1.json', 'utf8'));
const successor = JSON.parse(fs.readFileSync('content/professional/core-method-runtime/successors/hdr-internal-professional-validation-report-successor-v1.json', 'utf8'));
const freeze = JSON.parse(fs.readFileSync('content/professional/core-method-runtime/hdr-production-freeze-v1.json', 'utf8'));

assert.equal(contract.status, 'ACTIVE_INTERNAL_VALIDATION_ONLY');
assert.equal(successor.status, 'ACTIVE_INTERNAL_PROFESSIONAL_VALIDATION_REPORT_ONLY');
assert.equal(freeze.productionStatus, 'blocked');
assert.equal(freeze.executionMode, 'validation_only');
assert.equal(freeze.productionGates.productionExecutionAllowed, false);
assert.equal(freeze.productionGates.professionalReleaseAllowed, false);
assert.equal(successor.authorityBoundary.hdrProductionStatusRemainsBlocked, true);
assert.equal(successor.authorityBoundary.publicHdrMethodAuthorityCreated, false);
assert.equal(successor.authorityBoundary.automaticProfessionalReleaseCreated, false);

const base = Date.parse('2000-01-01T12:00:00.000Z');
const bodyOffsets = Object.freeze({ SUN:0, MOON:23.2, MERCURY:41.1, VENUS:61.4, MARS:88.8, JUPITER:119.3, SATURN:151.2, URANUS:183.7, NEPTUNE:213.4, PLUTO:247.9, NORTH_NODE:272.2, SOUTH_NODE:92.2, EARTH:180 });
function lon(code, utcIso) {
  const days = (Date.parse(utcIso) - base) / 86400000;
  const speed = code === 'SUN' || code === 'EARTH' ? 1 : 0.05 + Object.keys(bodyOffsets).indexOf(code) * 0.003;
  return ((232.75 + bodyOffsets[code] + days * speed) % 360 + 360) % 360;
}
const astronomyAdapter = Object.freeze({
  adapterCode: 'HDR_INTERNAL_SHARED_AST_ASTRONOMY_ADAPTER',
  adapterVersion: '1.0.0', engineCode: 'ASTRONOMY_ENGINE_JS', engineVersion: '2.1.19',
  licenseCode: 'MIT', nodeConvention: 'TRUE_NODE.V1', providerUsed: false, aiUsed: false,
  async calculateLongitudesAt(utcIso) {
    const codes = ['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO','NORTH_NODE'];
    const longitudes = Object.fromEntries(codes.map(code => [code, lon(code, utcIso)]));
    longitudes.EARTH = (longitudes.SUN + 180) % 360;
    longitudes.SOUTH_NODE = (longitudes.NORTH_NODE + 180) % 360;
    return Object.freeze({ utcIso, longitudes: Object.freeze(longitudes), engineCode:'ASTRONOMY_ENGINE_JS', engineVersion:'2.1.19', nodeConvention:'TRUE_NODE.V1', deterministic:true, providerUsed:false, aiUsed:false });
  },
  async sunLongitudeAt({ utcIso }) { return Object.freeze({ ephemerisVersion:'2.1.19', sunLongitude:lon('SUN', utcIso) }); }
});

const runtime = createHdrInternalValidationReportRuntime({ astronomyAdapter });
const request = {
  requestId: 'HDR-INTERNAL-CHECK-001', reportId: 'HDR-INTERNAL-REPORT-001', generatedAt: '2026-08-21T07:00:00.000Z',
  canonicalBirthInput: {
    birthDate: '2000-01-01', birthTime: '12:00:00',
    birthPlace: { displayName:'Synthetic Validation Place', countryCode:'MY', latitude:3.14, longitude:101.69 },
    timezone: { iana:'Asia/Kuala_Lumpur', utcOffsetAtBirth:'+08:00', source:'PINNED_IANA_TZDB', confidence:'HIGH' },
    timeAccuracy:'EXACT', locale:'en', consent:{ hdrInternalValidation:true }, inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'
  },
  professionalContext: {
    professionalId:'PROFESSIONAL-INTERNAL-001', professionalName:'Internal Reviewer', clientId:'SYNTHETIC-CLIENT-001',
    workspaceId:'WORKSPACE-INTERNAL-001', consentReference:'CONSENT-HDR-INTERNAL-001', workspaceAccessGranted:true, boundaryAcknowledged:true
  }
};
const first = await runtime.generate(request);
const second = await runtime.generate(request);
assert.deepEqual(first, second);
assert.equal(first.status, 'AWAITING_PROFESSIONAL_REVIEW');
assert.equal(first.visibility, 'INTERNAL_ONLY');
assert.equal(first.calculationReference.capabilityReadiness.eligible, true);
assert.equal(first.projectionReference.projectionCount, 5);
assert.equal(first.governance.clientDeliveryAllowed, false);
assert.equal(first.governance.publicExposureAllowed, false);
assert.equal(first.governance.automaticReleaseAllowed, false);
assert.equal(first.governance.interpretationCreated, false);
assert.equal(first.governance.professionalJudgmentCreated, false);
assert.equal(first.sections.length, 15);
assert.equal(first.sections.find(s => s.sectionCode === 'strategy').status, 'UNKNOWN');
assert.equal(first.sections.find(s => s.sectionCode === 'variables_phs').status, 'UNKNOWN');

const reviewed = runtime.review(first, {
  professionalId:'PROFESSIONAL-INTERNAL-001', reviewedAt:'2026-08-21T07:30:00.000Z',
  decision:'ACCEPT_FOR_INTERNAL_USE', findings:['Calculation lineage checked.', 'Unsupported interpretation fields remain unknown.']
});
assert.equal(reviewed.status, 'INTERNAL_REVIEWED');
assert.equal(reviewed.review.status, 'COMPLETED');
assert.equal(reviewed.governance.clientDeliveryAllowed, false);
assert.equal(reviewed.governance.automaticReleaseAllowed, false);

await assert.rejects(() => runtime.generate({ ...request, canonicalBirthInput:{ ...request.canonicalBirthInput, consent:{} } }), /EXPLICIT_VALIDATION_CONSENT/);
await assert.rejects(() => runtime.generate({ ...request, canonicalBirthInput:{ ...request.canonicalBirthInput, timeAccuracy:'APPROXIMATE' } }), /EXACT_BIRTH_TIME_REQUIRED/);
assert.throws(() => runtime.review(first, { professionalId:'OTHER', reviewedAt:'2026-08-21T07:30:00Z', decision:'ACCEPT_FOR_INTERNAL_USE' }), /REVIEWER_MISMATCH/);

console.log('✓ HDR Internal Professional Validation Report successor passed.');
console.log('  Real canonical birth input can drive deterministic internal Personal Structure calculation + projection + reviewable report candidate.');
console.log('  HDR Production remains blocked; client delivery, public exposure, automatic interpretation, judgment and release remain forbidden.');
