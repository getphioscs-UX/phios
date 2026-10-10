import {ownedReportPresentation} from '../commerce/book-commerce-store.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requirePurchasedReportPresentation,quoteReportPresentation} from '../pws/commercial/report-successor-contract.js';
import {reportDeliveryMethod} from './report-delivery-contract.js';

// The sole delivery adapter to existing Commerce storage. No grants or payment
// assertions are accepted from browser input; method admission remains separate.
export async function resolveReportAccess({methodId,locale,context,admitted=true,dataRequired=false,previewLocked=false},{loadEntitlement=ownedReportPresentation}={}){
 const policy=reportDeliveryMethod(methodId);
 if(!policy||!policy.pilot)return {state:'UNAVAILABLE',reason:'METHOD_DELIVERY_NOT_ACCEPTED'};
 if(dataRequired)return {state:'DATA_REQUIRED',reason:'METHOD_DATA_REQUIRED'};
 if(!admitted)return {state:'UNAVAILABLE',reason:'PUBLICATION_UNAVAILABLE'};
 const offer={...quoteReportPresentation(policy.reportProductId,{reportLanguageMode:'SINGLE',reportLocale:locale}),productId:policy.commerceProductId,contractProductId:policy.reportProductId,href:`/account/?product=${policy.commerceProductId}#commerce`};
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 let owned=null,reason=null;
 if(identity)try{
  owned=await loadEntitlement(context.env,identity.userId,policy.commerceProductId);
  if(owned){const selection=requirePurchasedReportPresentation(owned);if(selection.reportLocale!==locale&&selection.reportLocale!=='bilingual'){owned=null;reason='PURCHASED_LANGUAGE_MISMATCH';}}
 }catch{owned=null;reason='ENTITLEMENT_UNAVAILABLE';}
 const entitled=Boolean(owned)&&['qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT);
 if(owned&&!entitled)reason='FULL_REPORT_RELEASE_PENDING';
 return {state:entitled?'ENTITLED':previewLocked?'LOCKED':'FREE',reason,verifiedPurchase:entitled,offer,entitlementKey:policy.entitlementKey};
}
