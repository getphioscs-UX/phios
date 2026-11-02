import {quoteReportPresentation,resolveReportProduct} from '../pws/commercial/report-successor-contract.js';
export function reportContractId(id){const key=(id==='COM-WILL-WRITING'?'WILL-FULL':id.replace('COM-READING-','').replace('COM-REPORT-','')).replaceAll('-','_');return key.startsWith('BUNDLE')?key:key.replace('_FULL','_FULL_REPORT');}
export function isLanguageReport(product){try{return (product.category==='REPORT'||product.productId==='COM-WILL-WRITING')&&Boolean(resolveReportProduct(reportContractId(product.productId)));}catch{return false;}}
// Release A does not authorize new report or report-bundle sales. Historical
// orders and their existing delivery/entitlement projections do not call this.
export function requirePublicReleaseReportAdmission(product,env){if(env.STRIPE_ENVIRONMENT==='LIVE'&&product.category==='REPORT')throw Object.assign(Error('REPORT_PUBLICATION_AND_CLOUD_ADMISSION_REQUIRED'),{code:'REPORT_PUBLICATION_AND_CLOUD_ADMISSION_REQUIRED',status:409});}
export function commerceReportQuote(product,input,selected=[]){return quoteReportPresentation(reportContractId(product.productId),input,product.productId.includes('BUNDLE')?selected.map(reportContractId):[]);}
export function orderReportPresentation(order){return JSON.parse(order.context_json||'{}').reportPresentation||null;}
export function validateOrderReportPresentation(product,order){
 const stored=orderReportPresentation(order);
 if(!stored)return null; // Orders predating language selection retain their original contract.
 // Pricing versions come only from the persisted server order, never checkout input.
 const quote=quoteReportPresentation(reportContractId(product.productId),stored,product.productId.includes('BUNDLE')?JSON.parse(order.selected_products_json).map(reportContractId):[],stored.pricingVersion,true);
 if(JSON.stringify(quote)!==JSON.stringify(stored)||quote.amountMinor!==order.amount_minor)throw Object.assign(new Error('Stored presentation mismatch.'),{code:'commerce_provider_mismatch',status:422});
 return quote;
}
