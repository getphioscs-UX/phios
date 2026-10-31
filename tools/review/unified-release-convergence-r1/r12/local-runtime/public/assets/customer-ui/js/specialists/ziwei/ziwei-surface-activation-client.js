// Browser-only verification of server-issued Zi Wei customer-surface activation evidence.
// This module does not activate a product, calculate Zi Wei, or create meaning. It only
// checks the immutable activation fields already embedded in the customer product.
export const ZIWEI_CX_R1_W16_SURFACE_ACTIVATION_SCHEMA='PHI-OS-ZIWEI-CX-R1-W16-CUSTOMER-SURFACE-ACTIVATION-v1.0.0';
export const ZIWEI_CX_R1_W17_FINAL_SURFACE_ACTIVATION_SCHEMA='PHI-OS-ZIWEI-CX-R1-W17-FINAL-CUSTOMER-SURFACE-ACTIVATION-v1.0.0';

export function isZiweiCustomerSurfaceActivatedClient(product){
 return product?.methodId==='ZWR'
  && product?.productType==='ZIWEI_FULL_PRODUCTION'
  && product?.state==='CUSTOMER_PUBLISHABLE'
  && product?.surfaceActivation?.schemaVersion===ZIWEI_CX_R1_W16_SURFACE_ACTIVATION_SCHEMA
  && product?.surfaceActivation?.state==='ACTIVE_CUSTOMER_SURFACE'
  && product?.surfaceActivation?.fullProductionVisibleToCustomer===true;
}

export function isZiweiFinalCustomerSurfaceActivatedClient(product){
 return isZiweiCustomerSurfaceActivatedClient(product)
  && product?.finalSurfaceActivation?.schemaVersion===ZIWEI_CX_R1_W17_FINAL_SURFACE_ACTIVATION_SCHEMA
  && product?.finalSurfaceActivation?.state==='ACTIVE_FINAL_CUSTOMER_SURFACE'
  && product?.finalSurfaceActivation?.fullProductionVisibleToCustomer===true
  && product?.finalSurfaceActivation?.printableCustomerProduct===true;
}

export default Object.freeze({isZiweiCustomerSurfaceActivatedClient,isZiweiFinalCustomerSurfaceActivatedClient});
