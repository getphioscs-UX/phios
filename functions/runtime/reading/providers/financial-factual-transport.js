import {createPaidReportTransport} from '../../../personal-reading/paid-report-transport.js';
// PWS-I9 transport adapter. No credentials, prices or commercial admission are created here.
export function createFinancialFactualTransport({admission,binding,evidenceDigest,language,...transport}){
 if(!admission||admission.owner!=='PWS-I9'||admission.productFamily!=='FINANCIAL_FACTUAL'||admission.serviceScope!=='FACTUAL_ONLY'||admission.purpose!=='REPORT'||admission.status!=='HUMAN_APPROVED'||!admission.receiptRef)throw Error('FINANCE_SPECIFIC_PROVIDER_ADMISSION_REQUIRED');
 if(!binding||admission.productId!==binding.productId||admission.ownerAccountId!==binding.ownerAccountId||admission.reportId!==binding.reportId||admission.sourceEvidenceDigest!==evidenceDigest||admission.language!==language||!/^COM-REPORT-FINANCIAL-/.test(binding.productId))throw Error('FINANCE_PROVIDER_ADMISSION_BINDING_MISMATCH');
 if(admission.budgetAuthority!=='ProductCostEnvelope'||admission.promptContract!=='FINANCIAL-NARRATIVE-SOURCE-R1'||admission.maximumCalls!==1||admission.automaticRetry!==false)throw Error('FINANCE_PROVIDER_BUDGET_CONTRACT_REQUIRED');
 if(transport.model?.model!==admission.model||transport.model?.pricingSourceRef!==admission.pricingSourceRef||!admission.pricingSourceRef)throw Error('FINANCE_PROVIDER_PRICING_BINDING_REQUIRED');
 // The shared owner still checks registered product economics, entitlement/payment
 // evidence and its SQL monetary reservation authority. Another method cannot fund this call.
 return createPaidReportTransport({...transport,binding});
}
