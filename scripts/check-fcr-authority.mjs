import assert from 'node:assert/strict';
import {readJson,sha256File} from './lib/fcr/fcr-check-lib.mjs';
const b=readJson('content/financial/calculation-runtime/authority/financial-calculation-authority-baseline-v1.json');
assert.equal(b.baselineCommit,'3e4f22c'); assert.equal(b.authority.runtimeCode,'FCR');
for(const owned of ['DETERMINISTIC_FINANCIAL_CALCULATION','FINANCIAL_CALCULATION_TRACE','VERSIONED_FINANCIAL_ASSUMPTION_BINDING']) assert.ok(b.authority.owns.includes(owned));
for(const forbidden of ['CANONICAL_FINANCIAL_FACTS','FINANCIAL_ANALYSIS','FINANCIAL_ADVICE','PROFESSIONAL_JUDGMENT','PROFESSIONAL_RECOMMENDATION']) assert.ok(b.authority.doesNotOwn.includes(forbidden));
assert.equal(b.reconciliation.FDR.relationship,'SOLE_CANONICAL_FINANCIAL_FACT_INPUT_AUTHORITY');
assert.equal(b.reconciliation.legacyFinancialCalculation.relationship,'COMPATIBILITY_PREDECESSOR_NOT_FCR_AUTHORITY');
assert.equal(b.reconciliation.MPASharedCalculationGovernance.financialFormulaAuthorityGranted,false);
assert.equal(b.reconciliation.NUM.reusedAlgorithms,false);
for(const p of b.frozenPredecessors){assert.equal(sha256File(p.path),p.sha256,`Predecessor drift: ${p.code}`);}
assert.equal(b.knownUpstreamGap.fcrPolicy.includes('UNKNOWN'),true);
console.log('✓ FCR-W0 authority reconciliation passed.');
console.log(`  ${b.frozenPredecessors.length} predecessor authorities frozen; FDR remains sole fact authority and M4A/MPA/NUM do not become FCR fact or advice owners.`);
