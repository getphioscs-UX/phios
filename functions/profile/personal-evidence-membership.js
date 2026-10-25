import {activeContinuitySubscription} from '../personal-reading/continuity/continuity-quota-d1.js';
import {ownedReportPresentation} from '../commerce/book-commerce-store.js';
export async function dossierEligibility(env,owner){
 try{const sub=await activeContinuitySubscription(env,owner);return {basis:'ACTIVE_RM19_MEMBERSHIP',subscriptionId:sub.stripe_subscription_id,expiresAt:sub.paid_until,providerCalls:0};}
 catch(e){if(e.code!=='CONTINUITY_ACTIVE_SUBSCRIPTION_REQUIRED')throw e;}
 const legacy=await ownedReportPresentation(env,owner,'COM-REPORT-PROFILE-FULL');if(legacy)return {basis:'LEGACY_PAID_ACCESS',purchaseId:legacy.purchase_id,providerCalls:0};
 throw Object.assign(Error('DOSSIER_MEMBERSHIP_OR_LEGACY_ACCESS_REQUIRED'),{code:'DOSSIER_MEMBERSHIP_OR_LEGACY_ACCESS_REQUIRED',status:403});
}
