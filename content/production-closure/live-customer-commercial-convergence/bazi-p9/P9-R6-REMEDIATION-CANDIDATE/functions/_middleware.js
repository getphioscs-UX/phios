import { privateIsolationProbe } from './_lib/d1-private-isolation-probe.js';
import { maintenanceMode, guardD1Binding, d1ViolationCount, maintenanceResponse, isGuardedD1Binding } from './_lib/d1-maintenance-guard.js';

export async function onRequest(context) {
  const mode = maintenanceMode(context.env.PHIOS_D1_MAINTENANCE_MODE);
  if (mode === 'OFF') return context.next();
  if (mode !== 'READ_ONLY') return maintenanceResponse();
  if (['POST','PUT','PATCH','DELETE'].includes(context.request.method) && new URL(context.request.url).pathname !== '/__ops/d1-isolation') return maintenanceResponse();
  try {
    // Pages next() captures this env object. Replacing context.env would NOT
    // propagate. Seal only the binding in that object before nested handlers.
    // Do not restore it after next(): waitUntil and concurrent requests must
    // never regain a write capability during this deployment's READ_ONLY mode.
    const guarded = guardD1Binding(context.env.RUNTIME_DB, mode);
    Object.defineProperty(context.env, 'RUNTIME_DB', {value:guarded,writable:false,configurable:false,enumerable:true});
    const operational = await privateIsolationProbe(context, {mode, wrapped:isGuardedD1Binding(guarded)});
    if (operational) return operational;
    if (['POST','PUT','PATCH','DELETE'].includes(context.request.method)) return maintenanceResponse();
    const before = d1ViolationCount(guarded);
    const response = await context.next();
    // Route-owned catches cannot turn a rejected write into success or leak
    // their diagnostics. A concurrent rejection may conservatively deny a read.
    return d1ViolationCount(guarded) === before ? response : maintenanceResponse();
  } catch {
    // Existing handlers may translate a guard error themselves; neither path
    // exposes SQL, topology or an original binding to a customer.
    return maintenanceResponse();
  }
}
