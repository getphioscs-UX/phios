import assert from 'node:assert/strict'; import {readJson} from './lib/far/far-check-lib.mjs'; import {validateAnalysisPolicySet} from '../functions/financial/analysis-runtime/financial-analysis-runtime.js';
const types=readJson('content/financial/analysis-runtime/registries/financial-finding-type-registry-v1.json');
for(const t of ['STRENGTH','GAP','CONCENTRATION','EXPOSURE','DEPENDENCY','MISMATCH','SHORTFALL','SURPLUS','TREND','SCENARIO_SENSITIVITY','MISSING_EVIDENCE','CONTRADICTION','UNKNOWN']) assert.ok(types.types.includes(t));
const finding=readJson('content/financial/analysis-runtime/contracts/financial-finding-contract-v1.json'); for(const k of ['findingId','findingType','domain','sourceCalculationReferences','factReferences','confidence','evidenceState','limitations']) assert.ok(finding.requiredFields.includes(k));
const input=readJson('content/financial/analysis-runtime/contracts/financial-analysis-input-contract-v1.json'); assert.equal(input.rules.independentFinancialRecalculationAllowed,false); assert.equal(input.rules.fdrMutationAllowed,false);
await validateAnalysisPolicySet(readJson('content/financial/analysis-runtime/policies/financial-analysis-policy-set-base-v1.json'));
const src=readJson('content/financial/analysis-runtime/registries/financial-finding-source-registry-v1.json'); assert.ok(src.sources.some(x=>x.supportState==='NOT_AVAILABLE_NO_INFERENCE'));
console.log('✓ FAR-W1/W2/W18/W19 contracts and policy authority passed.');
