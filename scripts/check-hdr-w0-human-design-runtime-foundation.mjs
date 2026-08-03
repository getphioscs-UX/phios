import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const auditRoot = path.join(root, 'content/professional/method-audits');

function readJson(name) {
  const file = path.join(auditRoot, name);
  assert(fs.existsSync(file), `Missing HDR-W0 audit file: ${name}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const scope = readJson('hdr-w0-scope.json');
const current = readJson('hdr-w0-current-source.json');
const layers = readJson('hdr-w0-calculation-layers.json');
const rights = readJson('hdr-w0-data-rights.json');
const ai = readJson('hdr-w0-ai-boundary.json');
const queue = readJson('hdr-w0-decision-queue.json');
const validation = readJson('hdr-w0-validation-plan.json');
const legacy = readJson('hdr-w0-legacy-material-assessment.json');

assert.equal(scope.stageCode, 'HDR-W0');
assert.equal(scope.runtimePosition, 'parallel_track');
assert.equal(scope.masterTrackBlocking, false);
assert.equal(scope.methodCode, 'HUMAN_DESIGN');
assert.equal(scope.methodStatus, 'existing_professional_method');
assert.equal(scope.serviceStatus, 'preserved');
assert.equal(scope.calculationMode, 'external');
assert.equal(scope.selfCalculationStatus, 'audit_required');
assert.equal(scope.expectedDecision, 'ASTRONOMY_CORE_ONLY');
assert.equal(scope.stageStatus, 'conditional_passed');

assert.equal(
  current.currentCalculation.status,
  'CURRENT_CALCULATION_SOURCE_UNVERIFIED'
);
assert.equal(current.silentAssumptionProhibited, true);

const layerByCode = new Map(layers.layers.map(item => [item.layerCode, item]));
assert.equal(layerByCode.size, layers.layers.length);
assert.equal(
  layerByCode.get('HD-L3-DESIGN-MOMENT')?.fixedDaysSubtractionAllowed,
  false
);
assert.equal(
  layerByCode.get('HD-L4-GATE-LINE-MAPPING')?.status,
  'blocked_pending_source_and_rights_audit'
);
assert.equal(
  layerByCode.get('HD-L5-BODYGRAPH-STRUCTURE')?.status,
  'blocked_pending_source_and_rights_audit'
);
assert.equal(
  layerByCode.get('HD-L6-ADVANCED-VARIABLE-PHS')?.status,
  'deferred'
);
assert.equal(layers.calculationInterpretationSeparationRequired, true);

const rightsByCode = new Map(
  rights.categories.map(item => [item.categoryCode, item])
);
assert.equal(
  rightsByCode.get('GATE_LINE_MAPPING')?.selfCalculationEligibility,
  'blocked'
);
assert.equal(
  rightsByCode.get('THIRD_PARTY_CHART_IMAGE')?.rendererAuthority,
  false
);
assert.equal(
  rightsByCode.get('PHIOS_ORIGINAL_PROJECTION')?.calculationAuthority,
  false
);

assert.equal(ai.openAiCalculationAuthority, false);
for (const prohibited of [
  'calculated_chart',
  'guessed_gate',
  'guessed_authority',
  'guessed_design_moment',
  'fabricated_birth_time',
  'action_authorization'
]) {
  assert(ai.prohibitedOutputs.includes(prohibited));
}
assert.equal(ai.professionalReviewRequired, true);

const decisionByCode = new Map(
  queue.decisions.map(item => [item.decisionCode, item])
);
assert.equal(
  decisionByCode.get('HDR_SELF_CALCULATION_GATE')?.selectedValue,
  'ASTRONOMY_CORE_ONLY'
);
assert.equal(
  decisionByCode.get('HDR_88_DEGREE_DESIGN_MOMENT')?.selectedValue,
  'solar_arc_solver_not_fixed_88_days'
);
assert.equal(
  decisionByCode.get('HDR_GATE_LINE_MAPPING_SOURCE')?.status,
  'source_required'
);

assert.equal(validation.validationStatus, 'contract_only');
assert.equal(validation.referencePolicy.externalCharts, 'comparison_only');
assert.equal(
  validation.referencePolicy.thirdPartyScreenshots,
  'not_calculation_authority'
);

assert.equal(legacy.includedInRepository, false);
assert.equal(legacy.includedInDeltaPackage, false);
assert.equal(legacy.usefulness.phiosInterpretiveBoundary, 'high');
assert.equal(legacy.usefulness.calculationAlgorithm, 'low');
assert.equal(legacy.usefulness.gateLineMappingAuthority, 'none');
assert.equal(
  legacy.authorityStatus,
  'interpretive_legacy_reference_only'
);

const packagePath = path.join(root, 'package.json');
assert(fs.existsSync(packagePath), 'package.json is required');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
assert.equal(
  packageJson.scripts?.['check:hdr-w0'],
  'node scripts/check-hdr-w0-human-design-runtime-foundation.mjs'
);

for (const scriptName of [
  'precheck',
  'check',
  'postcheck',
  'check:pja',
  'check:knowledge-runtime',
  'check:imr',
  'check:imr-w0'
]) {
  const value = packageJson.scripts?.[scriptName];
  if (typeof value === 'string') {
    assert.equal(
      value.includes('check:hdr-w0'),
      false,
      `HDR-W0 must remain outside ${scriptName}`
    );
  }
}

console.log('✓ HDR-W0 Human Design Runtime Foundation Audit conditionally passed.');
console.log('  Existing Human Design Professional Method and external calculation mode remain preserved.');
console.log('  Astronomy Core and the 88-degree solar-arc contract are eligible for future validation; fixed 88-day subtraction is prohibited.');
console.log('  Gate/Line mapping, BodyGraph structure and advanced Variable/PHS remain blocked or deferred pending source and rights audit.');
console.log('  The legacy HD document is useful for PHI OS interpretive boundaries, but is not calculation, mapping or license authority.');
console.log('  OpenAI has no chart-calculation authority; HDR remains outside the default npm run check chain.');
