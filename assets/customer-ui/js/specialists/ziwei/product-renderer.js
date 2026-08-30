import {ensureZiweiW9W11Css,buildZiweiW9W11RenderPlan,buildZiweiW12W13RenderPlan} from './ziwei-specialist-workspace.js';
import {isZiweiW18FullReportProduct,renderZiweiW18FullReport,ensureZiweiW18FullReportCss} from '../../personal-products/ziwei-w18-full-report-renderer.js';
// buildZiweiW9W11RenderPlan remains imported as the frozen predecessor identifier for W9-W11 compatibility checks; current published ownership is W12-W13.
void buildZiweiW9W11RenderPlan;
export function renderZiweiProduct({product,mount}={}){
 if(product?.methodId!=='ZWR'||product?.productType!=='ZIWEI_FULL_PRODUCTION')return Object.freeze({status:'NOT_HANDLED',reason:'ZIWEI_SPECIALIST_PRODUCT_REQUIRED'});
 // Historical PPR-R3 compatibility only. A current CUSTOMER_PUBLISHABLE product never reaches this branch.
 if(product?.state!=='CUSTOMER_PUBLISHABLE'&&isZiweiW18FullReportProduct(product)){ensureZiweiW18FullReportCss(mount?.host?.ownerDocument||globalThis.document);return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:renderZiweiW18FullReport(product),historicalCompatibilityOnly:true});}
 ensureZiweiW9W11Css(mount?.host?.ownerDocument||globalThis.document);
 return buildZiweiW12W13RenderPlan(product);
}
export default Object.freeze({renderZiweiProduct});
