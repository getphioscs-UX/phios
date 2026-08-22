import assert from 'node:assert/strict';
import {read,readJson} from './lib/fcr/fcr-check-lib.mjs';
const input=readJson('content/financial/calculation-runtime/contracts/financial-calculation-input-contract-v1.json'); assert.deepEqual(input.numericAuthorityInputs,['fdrSnapshot','assumptionSet']);
const authority=readJson('content/financial/calculation-runtime/authority/financial-calculation-authority-baseline-v1.json'); assert.ok(authority.authority.doesNotOwn.includes('CANONICAL_FINANCIAL_FACTS')); assert.equal(authority.invariants.fdrFactsMutated,false);
const src=read('functions/financial/calculation-runtime/financial-calculation-runtime.js'); assert.doesNotMatch(src,/functions\/professional\/financial/); assert.doesNotMatch(src,/financial-navigation-recommendation/); assert.doesNotMatch(src,/professional_override/i);
const missing=readJson('content/financial/calculation-runtime/fixtures/missing-value.json'); assert.equal(missing.calculationInput.fdrSnapshot.snapshotPayload.assets[0].valueFact.value,null);
console.log('✓ FCR ↔ FDR authority boundary passed.');
console.log('  FCR consumes immutable FDR snapshots and assumptions only; no FDR fact mutation, professional override, or recommendation runtime is imported.');
