// Compatibility exports: the additive PWS successor is the definition owner.
import {REPORT_PRODUCT_DEFINITIONS,REPORT_PRICE_DEFINITIONS,REPORT_OFFER_DEFINITIONS} from './commercial/report-successor-contract.js';
export const ECR_FULL_REPORT_BINDING=Object.freeze({productId:'ECR_FULL_REPORT',methodId:'ECR',productCode:'ecr-full-report',offerCode:'ecr-full-report-myr',version:'1.0.0'});
export const ECR_FULL_REPORT_PRODUCT=REPORT_PRODUCT_DEFINITIONS.find(p=>p.product_code==='ecr-full-report');
export const ECR_FULL_REPORT_PRICE=REPORT_PRICE_DEFINITIONS.find(p=>p.price_code==='ecr-full-report-myr');
export const ECR_FULL_REPORT_OFFER=REPORT_OFFER_DEFINITIONS.find(p=>p.offer_code==='ecr-full-report-myr');
