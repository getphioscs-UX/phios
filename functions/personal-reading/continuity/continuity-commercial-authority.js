import registry from '../../../content/personal-reading/continuity/registries/continuity-subscription-product-registry-v2.json';
import {deepFreeze} from '../../interpretation-runtime/mir7-utils.js';
export const CONTINUITY_COMMERCIAL_AUTHORITY=deepFreeze(registry);
export function continuityRefillProduct(product,context={}){
 if(!context.continuityRefill)return product;
 if(product.productId!==registry.productId||!/^sub_[A-Za-z0-9]+$/.test(context.continuityRefill.subscriptionId||''))throw Error('CONTINUITY_REFILL_BINDING_REQUIRED');
 if(registry.refill.priceMode!=='INLINE_ONE_TIME_PRICE_DATA'||!/^prod_/.test(product.qaProductId||''))throw Object.assign(Error('CONTINUITY_REFILL_PRICE_CONFIGURATION_REQUIRED'),{code:'CONTINUITY_REFILL_PRICE_CONFIGURATION_REQUIRED',status:503});
 return Object.freeze({...product,billingType:'ONE_TIME',amountMinor:1900,qaPriceId:'CONTINUITY_REFILL_INLINE_V1',fulfillmentType:'CONTINUITY_QUOTA_REFILL',entitlementPolicy:'CONTINUITY_QUOTA_UNIT',livePriceId:null});
}
export function continuityModelPreflight(model,payload){
 if(model?.modelId!==registry.provider.defaultModel||model.pricingVerified!==true||!model.pricingSource||!model.pricingVerifiedAt||!Number.isSafeInteger(model.maxOutputTokens)||model.maxOutputTokens<1||model.maxOutputTokens>registry.provider.outputTokenMaximum)throw Error('CONTINUITY_VERIFIED_LUNA_REQUIRED');
 for(const key of ['inputPricePerMillion','cachedInputPricePerMillion','outputPricePerMillion'])if(!Number.isFinite(model[key])||model[key]<0)throw Error('CONTINUITY_PRICING_REQUIRED');
 if(model.cachedInputPricePerMillion>model.inputPricePerMillion||payload.model!==model.modelId||payload.tools?.length||payload.max_output_tokens!==model.maxOutputTokens)throw Error('CONTINUITY_REQUEST_NOT_ADMITTED');
 const bytes=new TextEncoder().encode(JSON.stringify(payload)).length;
 if(bytes>registry.provider.inputByteMaximum)throw Error('CONTINUITY_CONTEXT_TOO_LARGE');
 const inputTokenBound=bytes+256;
 return {inputTokenBound,maximumUSD:(inputTokenBound*model.inputPricePerMillion+model.maxOutputTokens*model.outputPricePerMillion)/1e6};
}
export function boundedContinuitySources(context,question){
 const selected=context?.selectedSources;
 if(!Array.isArray(selected)||!selected.length||selected.length>4)throw Error('CONTINUITY_BOUNDED_SOURCES_REQUIRED');
 return selected.map(({id,kind,value})=>{
  if(!registry.eligibleSourceKinds.includes(kind)||value?.established!==true||!value.sourceVersion||typeof value.projection!=='string'||!value.projection.trim()||value.projection.length>2000||value.ownerAccountId!==context.subjectRef)throw Error('CONTINUITY_ADMITTED_PROJECTION_REQUIRED');
  return {id,kind,sourceVersion:value.sourceVersion,projection:value.projection};
 });
}
