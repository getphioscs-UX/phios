import {generateAndReleaseAccountZiwei,openAccountZiweiMaterial,listAccountZiweiMaterials} from './ziwei-account-delivery.js';
import {generateAndReleaseAccountBazi,openAccountBaziMaterial,listAccountBaziMaterials} from './bazi-account-delivery.js';
const adapters=Object.freeze({ZWR:{generate:generateAndReleaseAccountZiwei,open:openAccountZiweiMaterial,list:listAccountZiweiMaterials},BZR:{generate:generateAndReleaseAccountBazi,open:openAccountBaziMaterial,list:listAccountBaziMaterials}});
export async function openOwnedMethodReport(context,reportId){
 const {personIdentity}=await import('./canonical-person-store.js');const owner=personIdentity(context).userId;
 const row=await context.env.RUNTIME_DB.prepare('SELECT method_code FROM account_method_report_materials WHERE owner_account_id=? AND report_id=?').bind(owner,reportId).first();
 if(!row)throw Object.assign(Error('REPORT_UNAVAILABLE'),{status:404});return resolveMethodDeliveryAdapter(row.method_code).open(context,reportId);
}
export async function listOwnedMethodReports(context){return (await Promise.all(Object.values(adapters).map(a=>a.list(context)))).flat();}
export function resolveMethodDeliveryAdapter(methodCode){
 const adapter=adapters[methodCode];
 if(!adapter)throw Object.assign(new Error('METHOD_DELIVERY_ADAPTER_NOT_ADMITTED'),{code:'METHOD_DELIVERY_ADAPTER_NOT_ADMITTED',status:409});
 return adapter;
}
