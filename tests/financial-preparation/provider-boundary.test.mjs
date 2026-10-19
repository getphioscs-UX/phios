import test from 'node:test';import assert from 'node:assert/strict';
import {createFinancialFactualTransport} from '../../functions/runtime/reading/providers/financial-factual-transport.js';
test('financial transport rejects BaZi/Zi Wei budgets, missing finance admission and stale source binding before any invocation',()=>{
 assert.throws(()=>createFinancialFactualTransport({}),/FINANCE_SPECIFIC_PROVIDER_ADMISSION_REQUIRED/);
 const scope={owner:'PWS-I9',productFamily:'FINANCIAL_FACTUAL',serviceScope:'FACTUAL_ONLY',purpose:'REPORT',status:'HUMAN_APPROVED',receiptRef:'TEST_ONLY_ADMISSION',productId:'COM-REPORT-BAZI-FULL',ownerAccountId:'TEST_ONLY',reportId:'TEST_ONLY',sourceEvidenceDigest:'TEST_ONLY_DIGEST',language:'en'};
 assert.throws(()=>createFinancialFactualTransport({admission:scope,binding:{productId:scope.productId,ownerAccountId:'TEST_ONLY',reportId:'TEST_ONLY'},evidenceDigest:'TEST_ONLY_DIGEST',language:'en'}),/FINANCE_PROVIDER_ADMISSION_BINDING_MISMATCH/);
 const financial={...scope,productId:'COM-REPORT-FINANCIAL-TEST_ONLY'};assert.throws(()=>createFinancialFactualTransport({admission:financial,binding:{productId:financial.productId,ownerAccountId:'TEST_ONLY',reportId:'TEST_ONLY'},evidenceDigest:'STALE',language:'en'}),/FINANCE_PROVIDER_ADMISSION_BINDING_MISMATCH/);
});
