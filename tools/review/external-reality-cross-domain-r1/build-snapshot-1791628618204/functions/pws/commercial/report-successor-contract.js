import {COMMERCE_ECONOMICS_VERSION,COMMERCE_ECONOMICS,STANDARD_BUNDLE_PRODUCTS} from './commerce-economics-policy.js';
import {quoteReportPresentation as historicalQuote,eligibleReportIds as historicalEligibleReportIds} from './report-successor-contract-history.js';
// Additive configuration and selection policy for the existing PWS owners.
// No orders, payment sessions or entitlement state live in this module.
const freeze=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const REPORT_COMMERCE_CONTRACT_ID='phi-os.pws.report-commerce-successor.v1';
const version='1.1.0',effectiveAt='2026-10-09T00:00:00.000Z';
const singles=Object.values(COMMERCE_ECONOMICS).filter(p=>p.methodId).map(p=>{
 const name=p.productId.startsWith('COM-REPORT-')?p.productId.slice(11,-5):p.productId.startsWith('COM-READING-')?p.productId.slice(12,-5):'WILL';
 return {productId:`${name}_FULL_REPORT`,productCode:`${name.toLowerCase()}-full-report`,methodId:p.methodId,kind:p.methodId==='CROSS'?'SYNTHESIS':'SINGLE_METHOD',newPrimaryPromotion:true,newPurchaseDefault:true,amountMinor:p.amountMinor,currency:'MYR',bilingualOnly:p.bilingualOnly,bundleEligible:STANDARD_BUNDLE_PRODUCTS.includes(p.productId),entitlementKey:`report:${name.toLowerCase()}:full`,selection:null};
});
const bundles=[['BUNDLE_2',9900,2],['BUNDLE_3',14900,3]].map(([productId,amountMinor,count])=>({productId,productCode:productId.toLowerCase().replaceAll('_','-'),methodId:null,kind:'BUNDLE',amountMinor,currency:'MYR',bundleEligible:false,entitlementKey:null,selection:{min:count,max:count,eligibilityRegistry:'standard-myr59-20261009',distinct:true}}));
export const REPORT_COMMERCE_CONTRACT=freeze({contractId:REPORT_COMMERCE_CONTRACT_ID,version,effectiveAt,owner:'PWS_COMMERCIAL_RUNTIME',approval:{source:'EXPLICIT_USER_COMMERCIAL_REVISION',baseline:'538442cae861566956d203eae8cb053f02abf377',policyVersion:COMMERCE_ECONOMICS_VERSION,date:'2026-10-09',scope:'PRICES_COST_CAPS_LANGUAGE_AND_BUNDLE_ELIGIBILITY'},products:[...singles,...bundles],eligibilityRegistries:[{registryId:'standard-myr39-v1',status:'HISTORICAL_ORDER_COMPATIBILITY',productIds:historicalEligibleReportIds('BUNDLE_2')},{registryId:'standard-myr59-20261009',status:'FUTURE_SELECTION',productIds:singles.filter(p=>p.bundleEligible).map(p=>p.productId)}],policy:{bundleCreatesCross:false,crossGrantsSingleMethods:false,selectionIsEntitlement:false,clientPaymentSuccessIsAuthority:false,productionPaymentEnabled:false,activationOwner:'EXISTING_PWS_COMMERCE_GATE',entitlementActivationRequires:'SERVER_VERIFIED_PAYMENT_AND_PRODUCT_ADMISSION'}});
export const REPORT_PRODUCT_DEFINITIONS=freeze(REPORT_COMMERCE_CONTRACT.products.map(p=>({product_code:p.productCode,display_name:p.productId.replaceAll('_',' '),product_type_code:'knowledge_product',state:'draft',current_version:version,legacy_product_ids:[],versions:[{version,status:'active',effective_at:effectiveAt,components:[{component_code:`${p.productCode}-reading`,component_type:'knowledge_access',configuration:{knowledge_asset_id:p.productId,access_scope:p.kind==='BUNDLE'?'selected_independent_full_reports':'single_subject_full_report',...(p.methodId?{method_code:p.methodId}:p.kind==='LEGACY_COMPATIBILITY'?{legacy_method_code:p.legacyMethodId}:{selection_policy_ref:REPORT_COMMERCE_CONTRACT_ID,eligibility_registry_ref:p.selection.eligibilityRegistry})}}]}]})));
export const REPORT_PRICE_DEFINITIONS=freeze(REPORT_COMMERCE_CONTRACT.products.map(p=>({price_code:`${p.productCode}-myr`,price_version:version,currency_code:p.currency,amount_minor:p.amountMinor,status:'draft',effective_at:effectiveAt})));
export const REPORT_OFFER_DEFINITIONS=freeze(REPORT_COMMERCE_CONTRACT.products.map(p=>({offer_code:`${p.productCode}-myr`,offer_version:version,display_name:p.productId.replaceAll('_',' '),product_code:p.productCode,product_version:version,price_code:`${p.productCode}-myr`,region_code:'my',customer_segment_code:'public-customer',status:'draft'})));
export function resolveReportProduct(reference){const p=REPORT_COMMERCE_CONTRACT.products.find(p=>p.productId===reference||p.productCode===reference);if(!p)throw new Error('PWS_REPORT_PRODUCT_NOT_FOUND');return p;}
export const REPORT_LANGUAGE_PRICING_VERSION=COMMERCE_ECONOMICS_VERSION;
export const REPORT_LANGUAGE_PRICING_POLICIES=freeze({[REPORT_LANGUAGE_PRICING_VERSION]:Object.fromEntries(REPORT_COMMERCE_CONTRACT.products.map(p=>[p.productId,{BILINGUAL:{surchargeMinor:p.bilingualOnly?0:1000}}]))});
export function normalizeReportPresentation(input={}) {
 const {reportLanguageMode,reportLocale}=input;
 if(!((reportLanguageMode==='SINGLE'&&['en','zh-Hans'].includes(reportLocale))||(reportLanguageMode==='BILINGUAL'&&reportLocale==='bilingual')))
  throw Object.assign(new Error('Choose the report language explicitly.'),{code:'REPORT_PRESENTATION_REQUIRED',status:422});
 return freeze({reportLanguageMode,reportLocale});
}
export function quoteReportPresentation(productId,input,selectedProductIds=[],pricingVersion=REPORT_LANGUAGE_PRICING_VERSION) {
 if(pricingVersion!==REPORT_LANGUAGE_PRICING_VERSION)return historicalQuote(productId,input,selectedProductIds,pricingVersion);
 const product=resolveReportProduct(productId), presentation=normalizeReportPresentation(input);
 if(product.bilingualOnly&&presentation.reportLanguageMode!=='BILINGUAL')throw Object.assign(Error('REPORT_BILINGUAL_ONLY'),{status:422,code:'REPORT_BILINGUAL_ONLY'});
 if(product.newPurchaseDefault===false)throw new Error('PWS_REPORT_LEGACY_NEW_PURCHASE_DISABLED');
 const plan=mapReportEntitlements(product.productId,selectedProductIds);
 const policy=REPORT_LANGUAGE_PRICING_POLICIES[pricingVersion]?.[product.productId];
 if(!policy)throw new Error('REPORT_PRICING_POLICY_NOT_FOUND');
 const surcharge=presentation.reportLanguageMode==='SINGLE'?0:policy.BILINGUAL.surchargeMinor;
 return freeze({...presentation,productId:product.productId,currency:product.currency,baseAmountMinor:product.amountMinor,
  surchargeAmountMinor:surcharge,amountMinor:product.amountMinor+surcharge,pricingVersion,
  modifierRule:presentation.reportLanguageMode==='SINGLE'?'SINGLE_NO_SURCHARGE':product.kind==='BUNDLE'?`${product.productId}_BILINGUAL`:'INDIVIDUAL_BILINGUAL',
  selectedProductIds:plan.selectedProductIds});
}
// The caller must load an active, customer-owned entitlement from Commerce.
export function requirePurchasedReportPresentation(entitlement,requested) {
 if(entitlement?.entitlement_status!=='active'||!entitlement.purchase_id)throw Object.assign(new Error('Active purchase required.'),{code:'REPORT_ENTITLEMENT_REQUIRED',status:403});
 const stored=normalizeReportPresentation(entitlement.reportPresentation);
 if(requested){const selection=normalizeReportPresentation(requested);if(selection.reportLocale!==stored.reportLocale||selection.reportLanguageMode!==stored.reportLanguageMode)throw Object.assign(new Error('Purchased report language is locked.'),{code:'REPORT_LANGUAGE_ENTITLEMENT_MISMATCH',status:403});}
 return stored;
}
export function eligibleReportIds(bundleId){const p=resolveReportProduct(bundleId);if(p.kind!=='BUNDLE')throw new Error('PWS_REPORT_BUNDLE_REQUIRED');return REPORT_COMMERCE_CONTRACT.eligibilityRegistries.find(r=>r.registryId===p.selection.eligibilityRegistry).productIds;}
// This returns an entitlement mapping plan, never a grant or payment assertion.
export function mapReportEntitlements(productId,selectedProductIds=[]){
 const p=resolveReportProduct(productId);if(!Array.isArray(selectedProductIds))throw new Error('PWS_REPORT_SELECTION_ARRAY_REQUIRED');
 let ids;
 if(p.kind==='BUNDLE'){
  const eligible=eligibleReportIds(p.productId),{min,max}=p.selection;
  if(selectedProductIds.length<min||selectedProductIds.length>(max??eligible.length))throw new Error('PWS_REPORT_SELECTION_COUNT');
  if(new Set(selectedProductIds).size!==selectedProductIds.length)throw new Error('PWS_REPORT_SELECTION_DUPLICATE');
  if(selectedProductIds.some(id=>!eligible.includes(id)))throw new Error('PWS_REPORT_SELECTION_INELIGIBLE');
  ids=eligible.filter(id=>selectedProductIds.includes(id));
 }else{if(selectedProductIds.length)throw new Error('PWS_REPORT_SINGLE_SELECTION_FORBIDDEN');ids=[p.productId];}
 return freeze({contractId:REPORT_COMMERCE_CONTRACT_ID,version,productId:p.productId,selectedProductIds:ids,entitlements:ids.map(id=>{const r=resolveReportProduct(id);return {productId:id,entitlementKey:r.entitlementKey,scope:r.kind==='SYNTHESIS'?'CROSS_SYNTHESIS':'INDEPENDENT_SINGLE_METHOD_REPORT',methodId:r.legacyMethodId||r.methodId};}),createsCrossReading:false,grantsEntitlement:false,requiresVerifiedPayment:true,requiresProductAdmission:true});
}
