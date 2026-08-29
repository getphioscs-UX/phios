import {ensureZiweiW9W11Css,buildZiweiW9W11RenderPlan,isZiweiW9W11Product} from './ziwei-specialist-workspace.js';
import {isZiweiW18FullReportProduct,renderZiweiW18FullReport,ensureZiweiW18FullReportCss} from '../../personal-products/ziwei-w18-full-report-renderer.js';
export function renderZiweiProduct({product,mount}={}){
 if(isZiweiW9W11Product(product)){ensureZiweiW9W11Css(mount?.host?.ownerDocument||globalThis.document);return buildZiweiW9W11RenderPlan(product);}
 if(!isZiweiW18FullReportProduct(product))return Object.freeze({status:'NOT_HANDLED',reason:'ZIWEI_SPECIALIST_PRODUCT_REQUIRED'});
 ensureZiweiW18FullReportCss(mount?.host?.ownerDocument||globalThis.document);return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:renderZiweiW18FullReport(product)});
}
export default Object.freeze({renderZiweiProduct});
