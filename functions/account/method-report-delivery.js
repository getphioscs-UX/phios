import {generateAndReleaseAccountZiwei,openAccountZiweiMaterial,listAccountZiweiMaterials} from './ziwei-account-delivery.js';
const adapters=Object.freeze({ZWR:{generate:generateAndReleaseAccountZiwei,open:openAccountZiweiMaterial,list:listAccountZiweiMaterials}});
export function resolveMethodDeliveryAdapter(methodCode){
 const adapter=adapters[methodCode];
 if(!adapter)throw Object.assign(new Error('METHOD_DELIVERY_ADAPTER_NOT_ADMITTED'),{code:'METHOD_DELIVERY_ADAPTER_NOT_ADMITTED',status:409});
 return adapter;
}
