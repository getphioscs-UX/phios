import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHealthReality, classifyHealthIntent, routeHealthSafety, assertSymbolicHealthFirewall, composeHealthProfessionalHandoff } from '../functions/health/health-reality-runtime.js';
import { planAskHealthBridge } from '../functions/health/ask-health-bridge.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const required = [
  'content/health/health-reality-runtime/authority/health-authority-boundary-v1.json',
  'content/health/health-reality-runtime/schemas/health-reality-schema-v1.json',
  'content/health/health-reality-runtime/registries/health-evidence-source-registry-v1.json',
  'content/health/health-reality-runtime/registries/health-care-state-registry-v1.json',
  'content/health/health-reality-runtime/registries/health-intent-registry-v1.json',
  'content/health/health-reality-runtime/contracts/health-evidence-contract-v1.json',
  'content/health/health-reality-runtime/contracts/health-symbolic-firewall-contract-v1.json',
  'content/health/health-reality-runtime/contracts/health-professional-handoff-contract-v1.json',
  'content/health/health-reality-runtime/contracts/ask-health-bridge-contract-v1.json',
  'content/health/health-reality-runtime/acceptance/hrx-w0-w14-acceptance-v1.json'
];
for (const rel of required) assert.equal(fs.existsSync(path.join(root, rel)), true, `missing ${rel}`);

const authority = readJson(required[0]);
assert.equal(authority.runtimeCode, 'HRX');
assert.equal(authority.activation.productionAccepted, false);
assert.ok(authority.forbidden.includes('ESTABLISH_DIAGNOSIS_AS_FACT'));
assert.ok(authority.forbidden.includes('INFER_DISEASE_FROM_SYMBOLIC_METHOD'));

assert.equal(classifyHealthIntent('What does HbA1c mean?'), 'HEALTH_INFORMATION');
assert.equal(classifyHealthIntent('I have felt tired for several months.'), 'HEALTH_REALITY');
assert.equal(classifyHealthIntent('How does Reality Navigation work?'), 'NON_HEALTH');

const emergency = routeHealthSafety({ question: 'I have sudden severe chest pain and I am struggling to breathe.' });
assert.equal(emergency.careState, 'EMERGENCY');
assert.equal(emergency.diagnosisEstablished, false);
assert.equal(emergency.exhaustiveTriageClaimed, false);

const routineFixture = readJson('content/health/health-reality-runtime/fixtures/routine-fatigue.json');
const reality = buildHealthReality(routineFixture);
assert.equal(reality.schemaVersion, 'PHI-OS-HEALTH-REALITY-v1.0.0');
assert.equal(reality.governance.diagnosisEstablished, false);
assert.equal(reality.governance.treatmentPrescribed, false);
assert.ok(['ROUTINE_REVIEW','PROMPT_MEDICAL_REVIEW'].includes(reality.careState));
assert.ok(reality.evidence.length >= 1);

assert.throws(
  () => assertSymbolicHealthFirewall({ methodCode: 'TAR', requestedUse: 'DIAGNOSIS' }),
  /HRX_SYMBOLIC_HEALTH_AUTHORITY_FORBIDDEN/
);
assert.equal(assertSymbolicHealthFirewall({ methodCode: 'TAR', requestedUse: 'REFLECTIVE_CONTEXT' }).healthEvidenceCreated, false);

const handoff = composeHealthProfessionalHandoff(reality);
assert.equal(handoff.governance.createsDiagnosis, false);
assert.equal(handoff.governance.createsProfessionalJudgment, false);

const askInfo = planAskHealthBridge({ question: 'What does HbA1c mean?' }, {});
assert.equal(askInfo.route, 'HRX_AUTHORITY_REQUIRED');
assert.equal(askInfo.authority.generalModelMaySubstituteForHealthAuthority, false);
const askEmergency = planAskHealthBridge({ question: 'I have sudden severe chest pain and I am struggling to breathe.' }, {});
assert.equal(askEmergency.route, 'HRX_SAFETY_FIRST');
assert.equal(askEmergency.governance.productionActivation, false);

const acceptance = readJson(required.at(-1));
assert.equal(acceptance.status, 'HRX_FOUNDATION_VALIDATED_NOT_PRODUCTION_ACTIVATED');
assert.equal(acceptance.activation.externalClinicalAuthorityConnected, false);
assert.equal(acceptance.activation.publicSurfaceEnabled, false);

console.log('✓ HRX-W0–W14 Health Reality Runtime foundation passed.');
console.log('  Health Reality, evidence, safety routing, symbolic-method firewall, professional handoff and Ask bridge are structurally governed.');
console.log('  Production remains fail-closed until external health authority, client surface and live deployment are independently accepted.');
