import {freeze,fail} from './product-envelope-core.js';

export const ZIWEI_CX_R1_W16_SURFACE_ACTIVATION_SCHEMA='PHI-OS-ZIWEI-CX-R1-W16-CUSTOMER-SURFACE-ACTIVATION-v1.0.0';
export const ZIWEI_CX_R1_W16_SURFACE_ACTIVATION=freeze({
  schemaVersion:ZIWEI_CX_R1_W16_SURFACE_ACTIVATION_SCHEMA,
  work:'ZIWEI-CX-R1-W16',
  state:'ACTIVE_CUSTOMER_SURFACE',
  canonicalRoute:'/perspectives/personal/',
  sharedHostAuthority:'PPR-R3',
  rendererId:'ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE',
  authorityRef:'content/customer-experience-rebuild/ziwei-cx-r1/authority/ziwei-cx-r1-w16-customer-surface-activation-authority-v1.json',
  acceptanceRef:'content/customer-experience-rebuild/ziwei-cx-r1/acceptance/ziwei-cx-r1-w16-customer-surface-activation-acceptance-v1.json',
  humanVisualAdmissionRef:'content/customer-experience-rebuild/ziwei-cx-r1/admission/ziwei-cx-r1-w15-human-visual-admission-v1.json',
  machineDomCampaignRef:'content/customer-experience-rebuild/ziwei-cx-r1/campaign/ziwei-cx-r1-w14-real-api-dom-machine-campaign-v1.json',
  currentRouteReplayRef:'content/customer-experience-rebuild/ziwei-cx-r1/campaign/ziwei-cx-r1-w16-current-route-replay-v1.json',
  semanticProductionRef:'content/professional/zi-wei-full-production/acceptance/ziwei-fp-w23-production-cutover-acceptance-v1.json',
  machineDomAdmission:'96/96',
  humanVisualAdmission:'12/12',
  fullProductionVisibleToCustomer:true,
  legacyGenericFallbackAllowed:false,
  sharedPersonalRealityMutationRequired:false
});

export function activateZiweiCustomerSurface(product){
  if(product?.methodId!=='ZWR'||product?.productType!=='ZIWEI_FULL_PRODUCTION')fail('ZIWEI_CX_R1_W16_ZIWEI_FULL_PRODUCTION_PRODUCT_REQUIRED');
  if(product?.state!=='CUSTOMER_PUBLISHABLE'||product?.publication?.customerPublishable!==true)fail('ZIWEI_CX_R1_W16_CUSTOMER_PUBLISHABLE_PRODUCT_REQUIRED');
  return freeze({...product,surfaceActivation:ZIWEI_CX_R1_W16_SURFACE_ACTIVATION,boundaries:freeze({...product.boundaries,w15HumanVisualAccepted:true,w16ActualCustomerSurfaceActivated:true,fullProductionVisibleToCustomer:true,legacyGenericZiweiFallbackAllowed:false,sharedPersonalRealityFileMutationRequired:false}),lineage:freeze({...product.lineage,ziweiCxR1W15HumanVisualAdmissionRef:ZIWEI_CX_R1_W16_SURFACE_ACTIVATION.humanVisualAdmissionRef,ziweiCxR1W16SurfaceActivationAuthorityRef:ZIWEI_CX_R1_W16_SURFACE_ACTIVATION.authorityRef})});
}

export function isZiweiCustomerSurfaceActivated(product){
  return product?.methodId==='ZWR'&&product?.productType==='ZIWEI_FULL_PRODUCTION'&&product?.state==='CUSTOMER_PUBLISHABLE'&&product?.surfaceActivation?.schemaVersion===ZIWEI_CX_R1_W16_SURFACE_ACTIVATION_SCHEMA&&product?.surfaceActivation?.state==='ACTIVE_CUSTOMER_SURFACE'&&product?.surfaceActivation?.fullProductionVisibleToCustomer===true;
}

export default Object.freeze({ZIWEI_CX_R1_W16_SURFACE_ACTIVATION,activateZiweiCustomerSurface,isZiweiCustomerSurfaceActivated});
