import {readCreditBalance} from './continuity-credit-d1.js';
// Read-only reconciliation. Never generates grants, mutates quotas or migrates D1.
export async function auditCreditCutover(env,ownerAccountId,clock=Date.now){
 const balance=await readCreditBalance(env,ownerAccountId,clock);
 const costs=(await env.RUNTIME_DB.prepare(`SELECT x.* FROM provider_product_cost_entries x JOIN provider_product_cost_envelopes e ON e.envelope_id=x.envelope_id WHERE e.owner_account_id=?`).bind(ownerAccountId).all()).results;
 const tasks=(await env.RUNTIME_DB.prepare('SELECT * FROM continuity_ask_tasks WHERE owner_account_id=?').bind(ownerAccountId).all()).results;
 const represented=new Set(tasks.map(t=>t.task_id));
 const legacy=costs.filter(x=>!represented.has(x.request_id));
 const blockers=legacy.filter(x=>x.state!=='METERED').map(x=>({requestId:x.request_id,state:x.state,reason:'DRAIN_OR_RECONCILE_LEGACY_RESERVATION_BEFORE_CUTOVER'}));
 for(const task of tasks.filter(t=>['RESERVED','RUNNING','RECONCILIATION'].includes(t.state)))blockers.push({taskId:task.task_id,state:task.state,reason:'DRAIN_OR_RECONCILE_NEW_TASK_BEFORE_SWITCH'});
 const allocations=(await env.RUNTIME_DB.prepare('SELECT a.* FROM continuity_ask_allocations a JOIN continuity_ask_tasks t ON t.task_id=a.task_id WHERE t.owner_account_id=?').bind(ownerAccountId).all()).results;
 for(const task of tasks){const owned=allocations.filter(a=>a.task_id===task.task_id),reserved=owned.reduce((n,a)=>n+a.reserved_micro_usd,0),charged=owned.reduce((n,a)=>n+(a.charged_micro_usd??0),0);if(reserved!==task.reserved_micro_usd||charged!==(task.customer_charge_micro_usd??0))blockers.push({taskId:task.task_id,reason:'ALLOCATION_TASK_TOTAL_MISMATCH'});}
 return {ownerAccountId,balance,allocations,grantsCreated:0,legacyCosts:legacy.map(x=>({requestId:x.request_id,quotaUnit:JSON.parse(x.payload_json||'{}').quotaUnit,measuredMicroUSD:x.measured_micro_usd,reservedMicroUSD:x.reserved_micro_usd,state:x.state})),representedTaskIds:[...represented],blockers,cutoverReady:blockers.length===0,mixedMode:'FORBIDDEN_UNTIL_OLD_DISPATCH_FENCED',rollback:'DISABLE_BOTH_DISPATCHERS; RETAIN_ALL_GRANTS_COSTS_TASKS_ALLOCATIONS; NEVER_REGRANT; RECONCILE_BEFORE_REENABLING'};
}
