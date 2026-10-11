import {PAID_REPORT_METHODS,resolvePaidReportMethod} from '../report-delivery/paid-report-method-registry.js';
export async function openOwnedMethodReport(context,reportId){
 const {personIdentity}=await import('./canonical-person-store.js');const owner=personIdentity(context).userId;
 const row=await context.env.RUNTIME_DB.prepare('SELECT method_code FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(owner,reportId).first();
 if(!row)throw Object.assign(Error('REPORT_UNAVAILABLE'),{status:404});return resolveMethodDeliveryAdapter(row.method_code).open(context,reportId);
}
export async function listOwnedMethodReports(context){const adapters=context.env.STRIPE_ENVIRONMENT==='LIVE'?Object.values(PAID_REPORT_METHODS).filter(a=>a.methodCode==='BZR'):Object.values(PAID_REPORT_METHODS);return (await Promise.all(adapters.map(a=>a.list(context)))).flat();}
export function resolveMethodDeliveryAdapter(methodCode){const adapter=resolvePaidReportMethod(methodCode);return {...adapter,generate:adapter.generateAccount};}
