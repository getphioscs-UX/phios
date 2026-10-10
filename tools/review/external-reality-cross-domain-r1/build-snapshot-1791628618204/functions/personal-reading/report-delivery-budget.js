import {commerceEnvironment} from '../commerce/commerce-environment.js';
import {createReportGenerationStore} from './report-generation-store.js';
import {completePaidReportBudget} from './paid-report-transport.js';
// Called after the existing renderer/release owner has saved immutable bytes.
// Never mint delivered state from a payment webhook or a browser boolean.
export async function closeReleasedReportBudget(context,{candidate,release,receipt}){
 const binding=candidate.paidReportBinding;
 if(!binding)return {budgetStatus:'LEGACY_UNBOUND'};
 if(binding.ownerAccountId!==candidate.customerId||binding.purchaseId!==candidate.purchaseId||binding.reportId!==release.reportId||receipt.passed!==true)throw Error('REPORT_DELIVERY_BUDGET_BINDING_MISMATCH');
 const row=await context.env.RUNTIME_DB.prepare('SELECT output_digest,snapshot_id FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(binding.ownerAccountId,binding.reportId).first();
 if(row?.output_digest!==receipt.outputDigest||row.snapshot_id!==candidate.snapshot.semanticSnapshotId)throw Error('REPORT_DELIVERY_MATERIAL_REQUIRED');
 const store=await createReportGenerationStore(context.env,{...binding,environment:commerceEnvironment(context.env)});
 await store.withLock('lifecycle',async()=>{
  const ledger=await store.get('lifecycle');
  if(!ledger||['ownerAccountId','orderId','reportId','productId','authorityDigest'].some(k=>ledger[k]!==binding[k]))throw Error('REPORT_DELIVERY_GENERATION_LEDGER_REQUIRED');
 });
 return completePaidReportBudget({store,key:'lifecycle',generationComplete:true,publicationComplete:true});
}
