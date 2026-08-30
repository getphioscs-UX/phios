import {ensureZiweiW9W11Css,buildZiweiW9W11RenderPlan,buildZiweiW12W13RenderPlan,ziweiFailClosedHtml,ZIWEI_CX_R1_W12_W13_RENDERER_ID} from './ziwei-specialist-workspace.js';
import {isZiweiW18FullReportProduct,renderZiweiW18FullReport,ensureZiweiW18FullReportCss} from '../../personal-products/ziwei-w18-full-report-renderer.js';
import {isZiweiCustomerSurfaceActivated,isZiweiFinalCustomerSurfaceActivated} from '../../../../../functions/personal-reality-product/adapters/ziwei-customer-surface-activation.js';
// buildZiweiW9W11RenderPlan remains imported as the frozen predecessor identifier for W9-W11 compatibility checks; current published ownership is W12-W13.
void buildZiweiW9W11RenderPlan;
export function renderZiweiProduct({product,mount}={}){
 if(product?.methodId!=='ZWR'||product?.productType!=='ZIWEI_FULL_PRODUCTION')return Object.freeze({status:'NOT_HANDLED',reason:'ZIWEI_SPECIALIST_PRODUCT_REQUIRED'});
 // Historical PPR-R3 compatibility only. A current CUSTOMER_PUBLISHABLE product never reaches this branch.
 if(product?.state!=='CUSTOMER_PUBLISHABLE'&&isZiweiW18FullReportProduct(product)){ensureZiweiW18FullReportCss(mount?.host?.ownerDocument||globalThis.document);return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:renderZiweiW18FullReport(product),historicalCompatibilityOnly:true});}
 ensureZiweiW9W11Css(mount?.host?.ownerDocument||globalThis.document);
 if(!isZiweiCustomerSurfaceActivated(product))return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:ziweiFailClosedHtml(product),technicalHtml:'',rendererId:ZIWEI_CX_R1_W12_W13_RENDERER_ID,responsiveReconstruction:true,legacySuppression:true,customerSurfaceActivation:'W16_BLOCKED',finalCustomerSurfaceActivation:'W17_BLOCKED',fullProductionVisibleToCustomer:false,printableCustomerProduct:false,activationBlocked:true});
 if(!isZiweiFinalCustomerSurfaceActivated(product))return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:ziweiFailClosedHtml(product),technicalHtml:'',rendererId:ZIWEI_CX_R1_W12_W13_RENDERER_ID,responsiveReconstruction:true,legacySuppression:true,customerSurfaceActivation:'W16_ACTIVE',finalCustomerSurfaceActivation:'W17_BLOCKED',fullProductionVisibleToCustomer:false,printableCustomerProduct:false,finalActivationBlocked:true});
 return buildZiweiW12W13RenderPlan(product);
}
export default Object.freeze({renderZiweiProduct});
