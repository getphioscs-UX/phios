import {REPORT_COMMERCE_CONTRACT} from '../pws/commercial/report-successor-contract.js';
import {STRIPE_PRODUCT_REGISTRY} from '../pws/commercial/stripe-product-registry.js';
import {reportContractId} from '../commerce/report-presentation.js';

export const REPORT_DELIVERY_VERSION='PHI-OS-REPORT-DELIVERY-R1';
export const REPORT_ACCESS_STATES=Object.freeze(['FREE','LOCKED','ENTITLED','UNAVAILABLE','DATA_REQUIRED']);
// Product and entitlement literals are projections of the existing Commerce owner.
export const REPORT_DELIVERY_METHODS=Object.freeze(REPORT_COMMERCE_CONTRACT.products.filter(p=>p.methodId).map(p=>Object.freeze({
 methodId:p.methodId,reportProductId:p.productId,entitlementKey:p.entitlementKey,
 commerceProductId:STRIPE_PRODUCT_REGISTRY.find(c=>c.category==='REPORT'&&reportContractId(c.productId)===p.productId)?.productId,
 pilot:p.methodId==='BZR',productionActive:false,humanAccepted:false
})));
export function reportDeliveryMethod(methodId){return REPORT_DELIVERY_METHODS.find(p=>p.methodId===methodId)||null;}
