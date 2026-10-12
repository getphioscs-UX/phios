// Candidate only: not deployed. Results go to private Worker logs, never response.
import { isGuardedD1Binding, d1ViolationCount, maintenanceResponse } from './d1-maintenance-guard.js';
export async function privateIsolationProbe(context, state) {
  const path=new URL(context.request.url).pathname;
  if(path!=='/__ops/d1-isolation')return null;
  const secret=context.env.PHIOS_D1_ISOLATION_PROBE_TOKEN;
  const supplied=context.request.headers.get('X-PHIOS-Isolation-Token');
  if(typeof secret!=='string'||secret.length<32||typeof supplied!=='string'||supplied.length!==secret.length)return maintenanceResponse();
  let mismatch=0;for(let i=0;i<secret.length;i++)mismatch|=secret.charCodeAt(i)^supplied.charCodeAt(i);
  if(mismatch!==0)return maintenanceResponse();
  const result={kind:'P9_PRIVATE_D1_ISOLATION',middlewareExecuted:true,handlerReached:true,mode:state.mode,bindingWrapped:state.wrapped&&isGuardedD1Binding(context.env.RUNTIME_DB),method:context.request.method,guardRejectedWrite:false,D1MutationAttemptForwarded:false};
  // Never even attempt SQL on an original binding. Guard rejects at prepare().
  if(state.mode==='READ_ONLY'&&result.bindingWrapped){const before=d1ViolationCount(context.env.RUNTIME_DB);try{context.env.RUNTIME_DB.prepare('INSERT INTO __phios_isolation_never_created SELECT 1 WHERE 0');}catch{result.guardRejectedWrite=d1ViolationCount(context.env.RUNTIME_DB)>before;}}
  console.log(JSON.stringify(result));
  return maintenanceResponse();
}
