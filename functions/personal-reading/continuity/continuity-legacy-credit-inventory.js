// Read-only discovery across existing owners. Missing storage is UNVERIFIED, never zero entitlement.
const stores={commerce_purchases:'purchase/renewal/refill provenance',commerce_subscriptions:'paid membership state and periods',commerce_checkout_attempts:'verified paid orders and environment',continuity_quota_units:'existing quota grants',provider_product_cost_entries:'settled spend, unknown usage and legacy reservations',continuity_ask_tasks:'new execution and settlements',continuity_ask_allocations:'FIFO task allocation',runtime_artifacts:'legacy Continuity saved artifacts; requires type-specific provenance',account_report_followup_questions:'included report benefit; not interchangeable with credits'};
export async function inventoryLegacyCreditOwners(env){
 const names=new Set(((await env.RUNTIME_DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results||[]).map(r=>r.name));const records=[];
 for(const [table,purpose]of Object.entries(stores)){if(!names.has(table)){records.push({table,purpose,state:'STORAGE_ABSENT_ENTITLEMENT_UNVERIFIED',count:null});continue;}
  const row=await env.RUNTIME_DB.prepare('SELECT COUNT(*) AS count FROM '+table).first();records.push({table,purpose,state:'PRESENT_REQUIRES_PROVENANCE_RECONCILIATION',count:row.count});}
 const unresolved=records.filter(r=>r.state!=='VERIFIED').map(r=>({owner:r.table,reason:r.state,nextAction:r.table==='runtime_artifacts'?'Classify historical artifact types, versions and signed purchase linkage; do not translate informational allowance fields blindly':'Read verified owner-specific purchase/spend/reservation linkage in separately controlled reconciliation; do not regrant'}));
 return {binding:'RUNTIME_DB',records,unresolved,grantsCreated:0,creditsCleared:0,cutoverReady:false};
}
