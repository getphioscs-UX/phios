import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createBzrProjectionRuntime,
  BZR_PROJECTION_RUNTIME_CODE
} from '../functions/core-method-runtime/bzr-projection-runtime.js';

const root = process.cwd();
const readJson = async file =>
  JSON.parse(await fs.readFile(path.join(root, file), 'utf8'));

const contract = await readJson(
  'content/professional/core-method-runtime/bzr-projection-runtime-v1.json'
);
const schema = await readJson(
  'content/professional/core-method-runtime/bzr-projection-bundle-v1.schema.json'
);
const normalizedContract = await readJson(
  'content/professional/core-method-runtime/bzr-projection-normalization-v1.json'
);
const w2 = await readJson(
  'content/professional/core-method-runtime/bzr-four-pillars-runtime-v1.json'
);
const w3 = await readJson(
  'content/professional/core-method-runtime/bzr-luck-cycle-runtime-v1.json'
);
const shared = await readJson(
  'content/professional/method-runtime/shared-projection-runtime-v1.json'
);
const canonical = await readJson(
  'content/professional/method-runtime/canonical-projection-v1.schema.json'
);
const eligibility = await readJson(
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json'
);

assert.equal(contract.stageCode, 'BZR-W4');
assert.deepEqual(contract.projectionTypes, [
  'STEM','BRANCH','PILLAR','LUCK_CYCLE'
]);
assert.equal(contract.projectionAuthority.runtimeCode, 'SHARED_PROJECTION_RUNTIME');
assert.equal(
  contract.projectionAuthority.normalizedFactsCreateProjectionAuthority,
  false
);
assert.equal(contract.boundaries.createsProjection, true);
assert.equal(contract.boundaries.createsInterpretation, false);
assert.equal(contract.execution.productionExecutionAllowed, false);
assert.equal(contract.nextStage, 'BZR-W5');
assert.equal(normalizedContract.stageCode, 'BZR-W2A');
assert.equal(w2.stageCode, 'BZR-W2');
assert.equal(w3.stageCode, 'BZR-W3');
assert.equal(shared.runtimeCode, 'SHARED_PROJECTION_RUNTIME');
for (const type of contract.projectionTypes) {
  assert.ok(canonical.properties.projectionType.enum.includes(type));
}
const bazi = eligibility.methods.find(item => item.methodCode === 'BAZI');
assert.equal(bazi.productionReady, false);
assert.equal(bazi.professionalReady, false);
assert.equal(schema.properties.productionEligible.const, false);

const base = ({id, algorithm, digest, output}) => ({
  calculationId: id,
  runtimeCode: 'SHARED_CALCULATION_RUNTIME',
  runtimeVersion: '1.0.0',
  methodCode: 'BAZI',
  pluginCode: 'BZR',
  algorithmCode: algorithm,
  algorithmVersion: '1.0.0',
  inputDigest: '1'.repeat(64),
  outputDigest: digest,
  output,
  deterministic: true,
  providerUsed: false,
  aiUsed: false,
  projectionCreated: false,
  interpretationCreated: false,
  professionalConclusionCreated: false
});
const pillarsDigest = 'a'.repeat(64);
const luckDigest = 'b'.repeat(64);
const pillars = [
  {pillarType:'YEAR',stemCode:'JI',branchCode:'SI',sexagenaryIndex:6},
  {pillarType:'MONTH',stemCode:'YI',branchCode:'HAI',sexagenaryIndex:12},
  {pillarType:'DAY',stemCode:'JI',branchCode:'MAO',sexagenaryIndex:16},
  {pillarType:'HOUR',stemCode:'YI',branchCode:'HAI',sexagenaryIndex:12}
];
const fourPillarsCalculationResult = base({
  id: 'BZR-PILLARS-001',
  algorithm: 'BZR_FOUR_PILLARS',
  digest: pillarsDigest,
  output: {
    runtimeCode:'BZR_FOUR_PILLARS_RUNTIME',runtimeVersion:'1.0.0',
    methodCode:'BAZI',pluginCode:'BZR',executionMode:'validation',
    calculationMode:'FOUR_PILLARS',birthTimeKnown:true,
    hourPillarStatus:'RESOLVED',pillars,
    pillarCreated:true,projectionNormalized:false,projectionCreated:false,
    interpretationCreated:false,professionalConclusionCreated:false,
    productionEligible:false
  }
});
const normalizedProjectionFacts = {
  schemaVersion:'PHI-OS-BZR-NORMALIZED-PROJECTION-FACTS-v1.0.0',
  runtimeCode:'BZR_PROJECTION_NORMALIZATION_RUNTIME',
  normalizationCode:'BZR_CANONICAL_PROJECTION_INPUT_V1',
  normalizationVersion:'1.0.0',executionMode:'validation',
  pillarOrder:['YEAR','MONTH','DAY','HOUR'],
  source:{
    calculationId:'BZR-PILLARS-001',
    outputDigest:pillarsDigest
  },
  normalizationDigest:'c'.repeat(64),
  projectionNormalized:true,projectionCreated:false,productionEligible:false
};
const luckCycleCalculationResult = base({
  id:'BZR-LUCK-001',
  algorithm:'BZR_LUCK_CYCLE_SEQUENCE',
  digest:luckDigest,
  output:{
    runtimeCode:'BZR_LUCK_CYCLE_RUNTIME',runtimeVersion:'1.0.0',
    methodCode:'BAZI',pluginCode:'BZR',executionMode:'validation',
    direction:'FORWARD',yearStemPolarity:'YIN',
    traditionalCalculationSexUseScope:'LUCK_CYCLE_DIRECTION_ONLY',
    referenceJie:'NEXT_JIE',referenceJieCode:'DA_XUE',
    referenceJieUtcIso:'1989-12-07T00:00:00.000Z',
    intervalSeconds:1836000,
    startAge:{
      years:7,months:1,days:10,totalYearsNumerator:2575,
      totalYearsDenominator:360,roundingApplied:false
    },
    cycleDurationYears:10,cycleCount:2,
    cycles:[
      {cycleNumber:1,direction:'FORWARD',startAgeYears:7,endAgeYears:17,
       pillar:{stemCode:'BING',branchCode:'ZI',sexagenaryIndex:13}},
      {cycleNumber:2,direction:'FORWARD',startAgeYears:17,endAgeYears:27,
       pillar:{stemCode:'DING',branchCode:'CHOU',sexagenaryIndex:14}}
    ],
    lineage:{fourPillarsOutputDigest:pillarsDigest},
    luckCycleCreated:true,projectionCreated:false,interpretationCreated:false,
    professionalConclusionCreated:false,productionEligible:false
  }
});

const runtime = createBzrProjectionRuntime();
const request = {
  runtimeCode:BZR_PROJECTION_RUNTIME_CODE,
  executionMode:'validation',
  projectionVersion:'1.0.0',
  fourPillarsCalculationResult,
  normalizedProjectionFacts,
  luckCycleCalculationResult
};
const first = await runtime.project(request);
const second = await runtime.project(request);

assert.deepEqual(
  first.projections.map(item => item.projectionType),
  ['STEM','BRANCH','PILLAR','LUCK_CYCLE']
);
assert.deepEqual(
  first.projections.map(item => item.projectionCode),
  second.projections.map(item => item.projectionCode)
);
for (const projection of first.projections) {
  assert.equal(projection.schemaVersion,'PHI-OS-CANONICAL-PROJECTION-v1.0.0');
  assert.equal(projection.projectionConfidence.level,'exact');
  assert.equal(projection.projectionConfidence.score,1);
  assert.equal(projection.providerUsed,false);
  assert.equal(projection.aiUsed,false);
  assert.equal(projection.interpretationCreated,false);
  assert.equal(projection.knowledgeCreated,false);
  assert.equal(projection.professionalConclusionCreated,false);
}
assert.equal(first.projections[0].projectionValue.stems.length,4);
assert.equal(first.projections[1].projectionValue.branches.length,4);
assert.equal(first.projections[2].projectionValue.pillars.length,4);
assert.equal(first.projections[3].projectionValue.cycles.length,2);
assert.equal(
  first.projections[0].projectionSource.outputDigest,
  pillarsDigest
);
assert.equal(
  first.projections[3].projectionSource.outputDigest,
  luckDigest
);
assert.equal(first.projectionCreated,true);
assert.equal(first.productionEligible,false);

await assert.rejects(
  () => runtime.project({...request,executionMode:'production'}),
  /BZR_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN/
);
await assert.rejects(
  () => runtime.project({
    ...request,
    normalizedProjectionFacts:{
      ...normalizedProjectionFacts,
      normalizationDigest:'d'.repeat(64),
      source:{...normalizedProjectionFacts.source,outputDigest:'e'.repeat(64)}
    }
  }),
  /do not align/
);
await assert.rejects(
  () => runtime.project({
    ...request,
    luckCycleCalculationResult:{
      ...luckCycleCalculationResult,
      output:{
        ...luckCycleCalculationResult.output,
        lineage:{fourPillarsOutputDigest:'f'.repeat(64)}
      }
    }
  }),
  /does not reference BZR-W2/
);
await assert.rejects(
  () => runtime.project({...request,interpretation:{}}),
  /BZR-W4 boundary forbidden/
);

console.log('✓ BZR-W4 Projection Runtime passed.');
console.log('  BZR-W2 + BZR-W2A → STEM, BRANCH and PILLAR Canonical Projections.');
console.log('  BZR-W3 → LUCK_CYCLE Canonical Projection with independent lineage.');
console.log('  Interpretation, Knowledge, Professional output and Production remain forbidden.');
