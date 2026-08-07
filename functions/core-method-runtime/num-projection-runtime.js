import { stableSerialize, sha256 } from '../method-runtime/shared-calculation-runtime.js';

export const NUM_PROJECTION_RUNTIME_CODE = 'NUM_PROJECTION_RUNTIME';
export const NUM_PROJECTION_RUNTIME_VERSION = '1.0.0';
export const NUMERIC_CANONICAL_PROJECTION_SCHEMA_VERSION =
  'PHI-OS-CANONICAL-NUMERIC-PROJECTION-v1.0.0';

const TYPES = Object.freeze(['NUMBER','NUMBER_STRUCTURE','NUMBER_CYCLE']);
const FORBIDDEN = new Set([
  'interpretation','knowledge','meaning','identity','personality',
  'futurePrediction','realityConclusion','professionalConclusion'
]);

function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
}
function noForbidden(value, path='$') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN.has(key)) throw new TypeError(`NUM-W4 boundary forbidden at ${path}.${key}`);
    noForbidden(child, `${path}.${key}`);
  }
}
function assertCalculation(result, algorithmCode, outputRuntimeCode, createdFlag) {
  object(result, `${algorithmCode} Calculation Result is required.`);
  if (result.runtimeCode !== 'SHARED_CALCULATION_RUNTIME' ||
      result.methodCode !== 'NUMEROLOGY' || result.pluginCode !== 'NUM' ||
      result.algorithmCode !== algorithmCode || result.deterministic !== true ||
      result.providerUsed !== false || result.aiUsed !== false ||
      result.projectionCreated !== false || result.interpretationCreated !== false ||
      result.professionalConclusionCreated !== false) {
    throw new TypeError(`${algorithmCode} Calculation Result boundary is invalid.`);
  }
  object(result.output, `${algorithmCode} output is required.`);
  if (result.output.runtimeCode !== outputRuntimeCode ||
      result.output[createdFlag] !== true ||
      result.output.productionEligible !== false) {
    throw new TypeError(`${algorithmCode} output boundary is invalid.`);
  }
  for (const key of ['calculationId','runtimeVersion','algorithmVersion','inputDigest','outputDigest']) {
    if (typeof result[key] !== 'string' || !result[key]) throw new TypeError(`${algorithmCode} lineage missing: ${key}.`);
  }
  noForbidden(result);
}
async function projection(type, version, result, value) {
  const source = Object.freeze({
    calculationId: result.calculationId,
    calculationRuntimeCode: result.runtimeCode,
    calculationRuntimeVersion: result.runtimeVersion,
    methodCode: result.methodCode,
    pluginCode: result.pluginCode,
    algorithmCode: result.algorithmCode,
    algorithmVersion: result.algorithmVersion,
    inputDigest: result.inputDigest,
    outputDigest: result.outputDigest
  });
  const projectionCode = `PRJ-${type}-${(await sha256({type,version,source,value})).slice(0,24).toUpperCase()}`;
  return Object.freeze({
    schemaVersion: NUMERIC_CANONICAL_PROJECTION_SCHEMA_VERSION,
    projectionType:type,
    projectionCode,
    projectionVersion:version,
    projectionValue:structuredClone(value),
    projectionSource:source,
    projectionConfidence:Object.freeze({level:'exact',score:1,basis:'deterministic_mapping'}),
    deterministic:true,providerUsed:false,aiUsed:false,
    interpretationCreated:false,knowledgeCreated:false,meaningCreated:false,
    realityConclusionCreated:false,professionalConclusionCreated:false
  });
}

export function createNumProjectionRuntime() {
  return Object.freeze({
    runtimeCode:NUM_PROJECTION_RUNTIME_CODE,
    runtimeVersion:NUM_PROJECTION_RUNTIME_VERSION,
    projectionTypes:TYPES,
    async project(request) {
      object(request,'NUM-W4 request is required.'); noForbidden(request);
      if (request.runtimeCode !== NUM_PROJECTION_RUNTIME_CODE) throw new TypeError('Invalid NUM-W4 runtimeCode.');
      if (request.executionMode !== 'validation') throw new Error('NUM_PROJECTION_PRODUCTION_EXECUTION_FORBIDDEN');
      if (!/^\d+\.\d+\.\d+$/.test(request.projectionVersion||'')) throw new TypeError('projectionVersion is invalid.');
      const birth=request.birthNumberCalculationResult;
      const structure=request.numberStructureCalculationResult;
      const cycle=request.cycleCalculationResult;
      assertCalculation(birth,'NUM_BIRTH_NUMBER_CALCULATION','NUM_BIRTH_NUMBER_RUNTIME','numberFactsCreated');
      assertCalculation(structure,'NUM_NUMBER_STRUCTURE_NORMALIZATION','NUM_NUMBER_STRUCTURE_RUNTIME','structureCreated');
      assertCalculation(cycle,'NUM_DATE_AND_LIFE_STAGE_CYCLES','NUM_CYCLE_RUNTIME','cycleCreated');
      if (structure.output.lineage?.birthNumberOutputDigest !== birth.outputDigest ||
          cycle.output.lineage?.birthNumberOutputDigest !== birth.outputDigest) {
        throw new TypeError('NUM calculation lineage is not aligned.');
      }
      const snapshot=stableSerialize([birth,structure,cycle]);
      const projections=Object.freeze([
        await projection('NUMBER',request.projectionVersion,birth,{
          birthDate:birth.output.birthDate,
          numbers:birth.output.numbers
        }),
        await projection('NUMBER_STRUCTURE',request.projectionVersion,structure,{
          birthDate:structure.output.birthDate,
          numberFacts:structure.output.numberFacts,
          digitFrequency:structure.output.digitFrequency,
          masterNumberState:structure.output.masterNumberState,
          compoundNumbers:structure.output.compoundNumbers
        }),
        await projection('NUMBER_CYCLE',request.projectionVersion,cycle,{
          birthDate:cycle.output.birthDate,
          targetDate:cycle.output.targetDate,
          timezonePolicyCode:cycle.output.timezonePolicyCode,
          calendarCycles:cycle.output.calendarCycles,
          lifeStageCycles:cycle.output.lifeStageCycles
        })
      ]);
      if (stableSerialize([birth,structure,cycle]) !== snapshot) throw new Error('NUM_CALCULATION_RESULT_MUTATION_FORBIDDEN');
      return Object.freeze({
        schemaVersion:'PHI-OS-NUM-PROJECTION-BUNDLE-v1.0.0',
        runtimeCode:NUM_PROJECTION_RUNTIME_CODE,runtimeVersion:NUM_PROJECTION_RUNTIME_VERSION,
        methodCode:'NUMEROLOGY',pluginCode:'NUM',executionMode:'validation',
        projectionVersion:request.projectionVersion,projections,
        extensionReference:'MR-PROJECTION-EXT-NUMERIC-001',
        deterministic:true,providerUsed:false,aiUsed:false,projectionCreated:true,
        interpretationCreated:false,knowledgeCreated:false,meaningCreated:false,
        realityConclusionCreated:false,professionalConclusionCreated:false,
        productionEligible:false
      });
    }
  });
}
