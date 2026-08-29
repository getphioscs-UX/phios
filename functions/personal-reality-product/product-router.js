import {freeze,fail} from './product-envelope-core.js';
const ORDER=Object.freeze(['ECR','AST','BZR','NUM','ZWR']);
const METHODS=new Set(ORDER);
const list=v=>Array.isArray(v)?v:[];
function normalized(ids){return [...new Set(list(ids).filter(x=>METHODS.has(x)))];}
function stateOf(product){return product?.state||'PRODUCT_UNAVAILABLE';}
export function routeSingleMethodProduct({selectedMethodIds,productsByMethod={}}={}){
 const ids=normalized(selectedMethodIds);if(ids.length!==1)fail('PPR_R2_W8_SINGLE_METHOD_REQUIRED',{selectedMethodIds:ids});
 const methodId=ids[0],product=productsByMethod[methodId]||null;
 return freeze({schemaVersion:'PHI-OS-PPR-R2-SINGLE-METHOD-PRODUCT-ROUTE-v1.0.0',workCode:'PPR-R2-W8',mode:'SINGLE_METHOD',methodId,state:stateOf(product),primaryProduct:product,products:product?[product]:[],crossMethodCompositionPerformed:false,boundaries:{routerCreatesMeaning:false,routerRecalculatesMethod:false,routerPromotesBlockedAuthority:false}});
}
export function routeMultiMethodProducts({selectedMethodIds,productsByMethod={}}={}){
 const ids=normalized(selectedMethodIds);if(ids.length<2)fail('PPR_R2_W9_MULTI_METHOD_REQUIRED',{selectedMethodIds:ids});
 const products=ids.map(methodId=>productsByMethod[methodId]).filter(Boolean);const unavailable=ids.filter(methodId=>!productsByMethod[methodId]);
 return freeze({schemaVersion:'PHI-OS-PPR-R2-MULTI-METHOD-PRODUCT-ROUTE-v1.0.0',workCode:'PPR-R2-W9',mode:'MULTI_METHOD',methodIds:ids,state:unavailable.length?'PARTIAL':'SIDE_BY_SIDE_READY',products,unavailableMethodIds:unavailable,crossMethodCompositionPerformed:false,crossMethodCompositionState:'NOT_STARTED',boundaries:{routerCreatesMeaning:false,rawSymbolsCompared:false,consensusScoreCreated:false,smrProseUsedAsCrossInput:false}});
}
export function routePersonalRealityProducts(args={}){const ids=normalized(args.selectedMethodIds);if(!ids.length)fail('PPR_R2_PRODUCT_ROUTE_METHOD_REQUIRED');return ids.length===1?routeSingleMethodProduct({...args,selectedMethodIds:ids}):routeMultiMethodProducts({...args,selectedMethodIds:ids});}
export const PERSONAL_REALITY_PRODUCT_ORDER=ORDER;
export default Object.freeze({routeSingleMethodProduct,routeMultiMethodProducts,routePersonalRealityProducts,PERSONAL_REALITY_PRODUCT_ORDER});
