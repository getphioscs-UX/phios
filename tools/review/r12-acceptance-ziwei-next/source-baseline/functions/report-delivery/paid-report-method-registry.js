import {generateAndReleaseAccountBazi,openAccountBaziMaterial,listAccountBaziMaterials} from '../account/bazi-account-delivery.js';
import {generateAndReleaseAccountZiwei,openAccountZiweiMaterial,listAccountZiweiMaterials} from '../account/ziwei-account-delivery.js';
import {baziPaidReportAdapter} from './paid-report-bazi-adapter.js';
export const PAID_REPORT_METHOD_REGISTRY_VERSION='P8-METHOD-REGISTRY-1';
// One account adapter map. Existing readable methods remain readable; future
// commercial admission requires conformance and does not follow asset existence.
export const PAID_REPORT_METHODS=Object.freeze({
 BZR:Object.freeze({...baziPaidReportAdapter,methodCode:'BZR',productId:'COM-REPORT-BAZI-FULL',reportClass:'PROVIDER_COMPOSED',generateAccount:generateAndReleaseAccountBazi,open:openAccountBaziMaterial,list:listAccountBaziMaterials,p8Admitted:true}),
 ZWR:Object.freeze({methodCode:'ZWR',productId:'COM-REPORT-ZIWEI-FULL',reportClass:'PROVIDER_COMPOSED',generateAccount:generateAndReleaseAccountZiwei,open:openAccountZiweiMaterial,list:listAccountZiweiMaterials,p8Admitted:false})
});
export function resolvePaidReportMethod(methodCode,{requireP8=false}={}){const a=PAID_REPORT_METHODS[methodCode];if(!a||requireP8&&!a.p8Admitted)throw Object.assign(Error('METHOD_DELIVERY_ADAPTER_NOT_ADMITTED'),{code:'METHOD_DELIVERY_ADAPTER_NOT_ADMITTED',status:409});return a;}
export function paidReportMethodForProduct(productId){return Object.values(PAID_REPORT_METHODS).find(a=>a.productId===productId)||null;}
