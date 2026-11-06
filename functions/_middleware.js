import { maintenanceMode, guardD1Binding, d1ViolationCount, maintenanceResponse } from './_lib/d1-maintenance-guard.js';
import {financialQaPath} from './_lib/final-release-scope.js';
import {classifyStatelessFreeRequest, sealStatelessFreeBindings} from './_lib/stateless-free-request-r3.js';

export async function onRequest(context) {
  if(financialQaPath(new URL(context.request.url).pathname))return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  const mode = maintenanceMode(context.env.PHIOS_D1_MAINTENANCE_MODE);
  if (mode === 'OFF') return context.next();
  if (mode !== 'READ_ONLY') return maintenanceResponse();
  try {
    const mutation = ['POST','PUT','PATCH','DELETE'].includes(context.request.method);
    const freeRoute = mutation ? await classifyStatelessFreeRequest(context.request, context.env) : null;
    if (mutation && !freeRoute) return maintenanceResponse();
    const freeViolations = freeRoute ? sealStatelessFreeBindings(context.env) : () => 0;
    const freeBefore = freeViolations();
    // Pages next() captures this env object. Replacing context.env would NOT
    // propagate. Seal only the binding in that object before nested handlers.
    // Do not restore it after next(): waitUntil and concurrent requests must
    // never regain a write capability during this deployment's READ_ONLY mode.
    const guarded = guardD1Binding(context.env.RUNTIME_DB, mode);
    Object.defineProperty(context.env, 'RUNTIME_DB', {value:guarded,writable:false,configurable:false,enumerable:true});
    const before = d1ViolationCount(guarded);
    const response = await context.next();
    // Route-owned catches cannot turn a rejected write into success or leak
    // their diagnostics. A concurrent rejection may conservatively deny a read.
    return d1ViolationCount(guarded) === before && freeViolations() === freeBefore ? response : maintenanceResponse();
  } catch {
    // Existing handlers may translate a guard error themselves; neither path
    // exposes SQL, topology or an original binding to a customer.
    return maintenanceResponse();
  }
}
