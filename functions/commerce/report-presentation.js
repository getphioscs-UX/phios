import {quoteReportPresentation,resolveReportProduct} from '../pws/commercial/report-successor-contract.js';
export function reportContractId(id){const key=id.replace('COM-REPORT-','').replaceAll('-','_');return key.startsWith('BUNDLE')?key:key.replace('_FULL','_FULL_REPORT');}
export function isLanguageReport(product){try{return product.category==='REPORT'&&Boolean(resolveReportProduct(reportContractId(product.productId)));}catch{return false;}}
export function commerceReportQuote(product,input,selected=[]){return quoteReportPresentation(reportContractId(product.productId),input,product.productId.includes('BUNDLE')?selected.map(reportContractId):[]);}
export function orderReportPresentation(order){return JSON.parse(order.context_json||'{}').reportPresentation||null;}
export function validateOrderReportPresentation(product,order){
 const stored=orderReportPresentation(order);
 if(!stored)return null; // Orders predating language selection retain their original contract.
 // Pricing versions come only from the persisted server order, never checkout input.
 const quote=quoteReportPresentation(reportContractId(product.productId),stored,product.productId.includes('BUNDLE')?JSON.parse(order.selected_products_json).map(reportContractId):[],stored.pricingVersion);
 if(JSON.stringify(quote)!==JSON.stringify(stored)||quote.amountMinor!==order.amount_minor)throw Object.assign(new Error('Stored presentation mismatch.'),{code:'commerce_provider_mismatch',status:422});
 return quote;
}
