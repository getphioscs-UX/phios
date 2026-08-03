import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const auditRoot = path.join(root, 'content/professional/method-audits');

function readJson(name) {
  const file = path.join(auditRoot, name);
  assert(fs.existsSync(file), `Missing IMR-W0 audit file: ${name}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const scope = readJson('imr-w0-scope.json');
const sources = readJson('imr-w0-data-sources.json');
const algorithms = readJson('imr-w0-algorithms.json');
const licenses = readJson('imr-w0-license-findings.json');
const queue = readJson('imr-w0-decision-queue.json');
const validation = readJson('imr-w0-validation-plan.json');

assert.equal(scope.stageCode, 'IMR-W0');
assert.equal(scope.runtimePosition, 'parallel_track');
assert.equal(scope.masterTrackBlocking, false);
assert.equal(scope.stageStatus, 'conditional_passed');

const methodByCode = new Map(scope.methods.map(item => [item.methodCode, item]));
assert.equal(methodByCode.size, scope.methods.length);
assert.equal(methodByCode.get('ASTROLOGY')?.serviceStatus, 'inactive');
assert.equal(methodByCode.get('BAZI')?.serviceStatus, 'inactive');
assert.equal(methodByCode.get('GENE_KEYS')?.status, 'not_planned');
assert.equal(
  methodByCode.get('ZI_WEI_DOU_SHU')?.status,
  'deferred_out_of_scope'
);
assert.equal(
  methodByCode.get('HUMAN_DESIGN')?.selfCalculationStatus,
  'separate_hdr_audit_required'
);
assert(scope.methods.every(item => item.productionEligible === false));

const sourceByCode = new Map(sources.sources.map(item => [item.sourceCode, item]));
assert.equal(sourceByCode.size, sources.sources.length);
assert.equal(
  sourceByCode.get('ASTRONOMY_ENGINE_JS')?.license?.name,
  'MIT'
);
assert.equal(
  sourceByCode.get('ASTRONOMY_ENGINE_JS')?.productionStatus,
  'validation_required'
);
assert.equal(
  sourceByCode.get('SWISS_EPHEMERIS')?.productionStatus,
  'blocked'
);
assert.equal(
  sourceByCode.get('EXTERNAL_BAZI_TOOLS')?.algorithmAuthority,
  false
);

const algorithmByCode = new Map(
  algorithms.algorithms.map(item => [item.algorithmCode, item])
);
assert.equal(algorithmByCode.size, algorithms.algorithms.length);
const astrology = algorithmByCode.get('ASTROLOGY-NATAL-v1');
const bazi = algorithmByCode.get('BAZI-NATAL-v1');
assert(astrology && bazi);
assert.equal(astrology.engine, 'ASTRONOMY_ENGINE_JS');
assert.equal(astrology.productionEligible, false);
assert.equal(astrology.openAiCalculationAllowed, false);
assert.equal(bazi.productionEligible, false);
assert.equal(bazi.openAiCalculationAllowed, false);
assert.equal(bazi.policy.formalTimeBasis, 'true_solar_time');
assert.equal(bazi.policy.dayBoundary.boundary, '00:00');
assert.equal(bazi.policy.dayBoundary.timeBasis, 'true_solar_time');
assert.equal(bazi.policy.ziHour.range, '23:00-00:59');
assert.equal(
  bazi.policy.ziHour.beforeMidnight.dateBasis,
  'same_true_solar_date'
);
assert.equal(
  bazi.policy.ziHour.afterMidnight.dateBasis,
  'next_true_solar_date'
);
assert.equal(
  bazi.policy.luckDirection.rule,
  'year_stem_polarity_plus_traditional_calculation_sex'
);
assert.equal(bazi.policy.luckStart.forwardReference, 'next_jie');
assert.equal(bazi.policy.luckStart.backwardReference, 'previous_jie');
assert.equal(bazi.policy.luckStart.rounding, 'no_rounding_in_engine');
assert.equal(
  bazi.policy.unknownBirthTime.fabricatedHourPillarProhibited,
  true
);

assert(licenses.findings.length >= 5);
assert(
  licenses.findings.some(
    item =>
      item.findingCode === 'GENE_KEYS_NOT_PLANNED' &&
      item.productionBlocking === true
  )
);
assert(
  licenses.findings.some(
    item =>
      item.findingCode === 'HUMAN_DESIGN_SEPARATE_AUDIT_REQUIRED' &&
      item.productionBlocking === true
  )
);

const decisionByCode = new Map(
  queue.decisions.map(item => [item.decisionCode, item])
);
assert.equal(decisionByCode.size, queue.decisions.length);
assert.equal(
  decisionByCode.get('ASTROLOGY_PILOT_ENGINE')?.selectedValue,
  'ASTRONOMY_ENGINE_JS'
);
assert.equal(
  decisionByCode.get('BAZI_DAY_BOUNDARY')?.selectedValue,
  'true_solar_time_00_00'
);
assert.equal(
  decisionByCode.get('GENE_KEYS')?.selectedValue,
  'not_planned'
);
assert.equal(
  decisionByCode.get('ZI_WEI_DOU_SHU')?.selectedValue,
  'deferred_out_of_scope'
);

assert.equal(validation.validationStatus, 'contract_only');
assert.equal(
  validation.acceptancePrinciple,
  'same_input_same_policy_same_engine_same_output_hash'
);

const forbiddenPaths = [
  'functions/charts',
  'assets/js/charts',
  'assets/css/charts',
  'astrology-chart.html',
  'bazi-chart.html'
];
for (const relative of forbiddenPaths) {
  assert.equal(
    fs.existsSync(path.join(root, relative)),
    false,
    `IMR-W0 must not create runtime or public chart implementation: ${relative}`
  );
}

const packagePath = path.join(root, 'package.json');
assert(fs.existsSync(packagePath), 'package.json is required');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
assert.equal(
  packageJson.scripts?.['check:imr-w0'],
  'node scripts/check-imr-w0-scope-data-algorithm-license-audit.mjs'
);

for (const scriptName of ['precheck', 'check', 'postcheck', 'check:pja', 'check:knowledge-runtime']) {
  const value = packageJson.scripts?.[scriptName];
  if (typeof value === 'string') {
    assert.equal(
      value.includes('check:imr-w0'),
      false,
      `IMR-W0 must remain outside ${scriptName}`
    );
  }
}

console.log('✓ IMR-W0 Scope, Data, Algorithm and License Audit conditionally passed.');
console.log('  Astrology and BaZi are defined but inactive; no Calculation Engine or public Chart was created.');
console.log('  Astronomy Engine MIT is the Astrology pilot candidate; Swiss Ephemeris remains a blocked fallback.');
console.log('  BaZi Policy v1 candidate preserves true solar time, 00:00 day boundary, midnight-split Zi hour and governed luck-cycle rules.');
console.log('  Human Design self-calculation is deferred to HDR-W0; Gene Keys is not planned and Zi Wei Dou Shu is out of scope.');
console.log('  IMR remains a parallel checker and is not added to the default npm run check chain.');
