import {digest} from '../account/oidc-auth.js';
import {assertPaidReportWorkerFence,verifyLockReconciliationWitness,workerFenceSql} from '../report-delivery/paid-report-worker-fence.js';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
// SQL owns both state and exclusion across worker instances. The in-memory
// token only proves which invocation holds the persisted lock.
export async function createReportGenerationStore(env,binding,{scope='budget'}={}){
 const db=env?.RUNTIME_DB;
 if(!db?.prepare)fail('REPORT_GENERATION_DATABASE_REQUIRED');
 if(!['QA','LIVE'].includes(binding?.environment)||!['budget','manuscript','delivery'].includes(scope)||
  ['ownerAccountId','orderId','reportId','productId'].some(k=>typeof binding[k]!=='string'||!binding[k]))fail('REPORT_GENERATION_STORE_BINDING_REQUIRED');
 const namespace=await digest(JSON.stringify({environment:binding.environment,owner:binding.ownerAccountId,order:binding.orderId,report:binding.reportId,product:binding.productId,scope}));
 let held=null;
 const validKey=key=>{if(typeof key!=='string'||!key||key.length>512)fail('REPORT_GENERATION_STATE_KEY_INVALID');};
 async function assertLock(){
  await assertPaidReportWorkerFence(env);
  if(!held)fail('REPORT_GENERATION_LOCK_REQUIRED');
  const row=await db.prepare('SELECT lock_token FROM report_generation_locks WHERE namespace=?').bind(namespace).first();
  if(row?.lock_token!==held)fail('REPORT_GENERATION_LOCK_LOST');
 }
 return Object.freeze({
  namespace,
  async inspectLock(){const row=await db.prepare('SELECT * FROM report_generation_locks WHERE namespace=?').bind(namespace).first();if(!row)return null;const marker=await db.prepare("SELECT value_json FROM report_generation_state WHERE namespace=? AND state_key='P8_LOCK_OWNER'").bind(namespace).first();return {...row,owner:marker?JSON.parse(marker.value_json):null};},
  async inspectState(key){validKey(key);const row=await db.prepare('SELECT value_json FROM report_generation_state WHERE namespace=? AND state_key=?').bind(namespace,key).first();return row?JSON.parse(row.value_json):null;},
  async inspectStates({suffix}){validKey(suffix);const rows=(await db.prepare('SELECT state_key,value_json FROM report_generation_state WHERE namespace=? AND substr(state_key,-?)=?').bind(namespace,suffix.length,suffix).all()).results;return rows.map(r=>({key:r.state_key,value:JSON.parse(r.value_json)}));},
  async releaseOrphanedLock({expectedToken,reconciliationWitness}){await verifyLockReconciliationWitness(env,reconciliationWitness,namespace,expectedToken);const f=workerFenceSql(env);const result=await db.prepare(`DELETE FROM report_generation_locks WHERE namespace=? AND lock_token=? AND ${f.sql}`).bind(namespace,expectedToken,...f.bindings).run();if(result.meta?.changes!==1)fail('REPORT_GENERATION_LOCK_TOKEN_CHANGED');return true;},
  async withLock(key,work){
   const fence=await assertPaidReportWorkerFence(env);
   validKey(key);
   if(held)fail('REPORT_GENERATION_LOCK_BUSY');
   const token=crypto.randomUUID();
   const predicate=workerFenceSql(env);const result=await db.prepare(`INSERT OR IGNORE INTO report_generation_locks(namespace,lock_token,acquired_at) SELECT ?,?,? WHERE ${predicate.sql}`).bind(namespace,token,new Date().toISOString(),...predicate.bindings).run();
   if(result.meta?.changes!==1)fail('REPORT_GENERATION_LOCK_BUSY');
   held=token;
   try{if(fence)await this.put('P8_LOCK_OWNER',{jobId:fence.jobId,ownerAccountId:fence.ownerAccountId,claimToken:fence.claimToken,lockToken:token});return await work();}finally{
    // A failed deletion leaves the SQL lock in place and blocks another call.
    held=null;
    await db.prepare('DELETE FROM report_generation_locks WHERE namespace=? AND lock_token=?').bind(namespace,token).run();
   }
  },
  async get(key){validKey(key);await assertLock();const row=await db.prepare('SELECT value_json FROM report_generation_state WHERE namespace=? AND state_key=?').bind(namespace,key).first();return row?JSON.parse(row.value_json):null;},
  async put(key,value){validKey(key);await assertLock();const f=workerFenceSql(env);const result=await db.prepare(`INSERT INTO report_generation_state(namespace,state_key,value_json,updated_at)
   SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM report_generation_locks WHERE namespace=? AND lock_token=?) AND ${f.sql}
   ON CONFLICT(namespace,state_key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at`).bind(namespace,key,JSON.stringify(value),new Date().toISOString(),namespace,held,...f.bindings).run();if(result.meta?.changes!==1)fail('REPORT_GENERATION_LOCK_LOST');},
  async putIfAbsent(key,value){validKey(key);await assertLock();const f=workerFenceSql(env);const result=await db.prepare(`INSERT OR IGNORE INTO report_generation_state(namespace,state_key,value_json,updated_at)
   SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM report_generation_locks WHERE namespace=? AND lock_token=?) AND ${f.sql}`).bind(namespace,key,JSON.stringify(value),new Date().toISOString(),namespace,held,...f.bindings).run();if(result.meta?.changes!==1&&f.bindings.length)await assertPaidReportWorkerFence(env);return result.meta?.changes===1;}
 });
}
