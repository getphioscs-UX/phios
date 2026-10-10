import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createIChingRuntime,ICHING_RUNTIME_CODE,normalizeIChingEvidence} from '../functions/core-method-runtime/iching-runtime.js';
import {manualLines,coinLines,evidence} from './lib/iching/iching-fixtures-v1.mjs';

const contract=JSON.parse(fs.readFileSync('content/professional/core-method-runtime/iching-input-contract-v1.json','utf8'));
assert.equal(contract.work,'ICH-W1');
assert.deepEqual(contract.supportedInputModes,['MANUAL_LINES','COIN_CAST','SYSTEM_RANDOM']);
assert.deepEqual(contract.reservedInputModes,['YARROW_STALK']);
assert.equal(contract.transportBoundary.frozenSharedDataRecordV1Mutated,false);
assert.equal(contract.transportBoundary.productionUseAllowed,false);
assert.equal(contract.rules.systemRandomMustUsePersistedEvidence,true);

const runtime=createIChingRuntime();
const manual=await runtime.calculate({runtimeCode:ICHING_RUNTIME_CODE,calculationId:'ICH-CALC-MANUAL',evidence:manualLines([7,7,7,7,7,7])});
assert.equal(manual.runtimeCode,'SHARED_CALCULATION_RUNTIME');
assert.equal(manual.methodCode,'I_CHING'); assert.equal(manual.pluginCode,'ICH');
assert.equal(manual.algorithmCode,'ICHING_HEXAGRAM_TRANSFORMATION');
assert.equal(manual.output.primary.hexagramId,'HEXAGRAM-01');
assert.equal(manual.output.primary.binary,'111111');
assert.deepEqual(manual.output.changingLines,[]);
assert.equal(manual.output.relating.hexagramId,'HEXAGRAM-01');
assert.equal(manual.output.deterministic,true); assert.equal(manual.output.sourceNeutral,true); assert.equal(manual.output.productionEligible,false);

const coin=await runtime.calculate({runtimeCode:ICHING_RUNTIME_CODE,calculationId:'ICH-CALC-COIN',evidence:coinLines(Array.from({length:6},()=>[2,2,3]))});
assert.deepEqual(coin.output.trace.inputLines,[7,7,7,7,7,7]);
assert.equal(coin.output.primary.hexagramId,'HEXAGRAM-01');

const randomEvidence=evidence({inputMode:'SYSTEM_RANDOM',selectedSymbols:['9','7','8','6','7','9']});
const normalized=normalizeIChingEvidence(randomEvidence);
assert.deepEqual(normalized.lines,[9,7,8,6,7,9]);
assert.equal(normalized.normalization.randomSelectionReplayed,true);
assert.equal(normalized.normalization.rerolledInsideCalculation,false);

assert.throws(()=>normalizeIChingEvidence({...manualLines([7,7,7,7,7,7]),inputMode:'YARROW_STALK'}),/UNSUPPORTED_ICHING_INPUT_MODE/);
assert.throws(()=>normalizeIChingEvidence(manualLines([7,7,7,5,7,7])),/INVALID_ICHING_LINE_VALUE/);
assert.throws(()=>normalizeIChingEvidence(manualLines([7,7,7,7,7])),/ICHING_REQUIRES_EXACTLY_SIX_LINES/);
assert.throws(()=>normalizeIChingEvidence(manualLines([7,7,7,7,7,7,7])),/ICHING_REQUIRES_EXACTLY_SIX_LINES/);

const runtimeText=fs.readFileSync('functions/core-method-runtime/iching-runtime.js','utf8').toLowerCase();
for (const forbidden of ['auspicious','bad luck','future','career outcome','relationship outcome']) assert.equal(runtimeText.includes(forbidden),false,`ICH-W7 runtime contains ${forbidden}`);
console.log('✓ ICH-W1/W2/W6/W7 calculation + evidence normalization passed.');
console.log('  Manual lines, coin evidence and persisted system-random evidence normalize to the same canonical 6/7/8/9 line model.');
