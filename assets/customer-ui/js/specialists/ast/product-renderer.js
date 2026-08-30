import {buildAstrologySpecialistSurfaceV3,installAstrologySpecialistInteractions} from './ast-specialist-surface-v3.js';
import {buildAstrologyWorkspaceHtml,installAstrologyWorkspaceInteractions} from '../../surfaces/astrology-workspace.js';

export const AST_CX_R3_CSS_HREF='/assets/customer-ui/surfaces/astrology-specialist-v3.css';
export const AST_CX_R3_CSS_CONTRACT='PHI-OS-AST-CX-R3-SPECIALIST-CSS-v1.0.0';
function ensureCss(doc=globalThis.document){
  if(!doc?.head)return null;
  let link=doc.querySelector?.('link[data-ast-cx-r3-css="true"]');
  if(link)return link;
  link=doc.createElement('link');link.rel='stylesheet';link.href=AST_CX_R3_CSS_HREF;link.dataset.astCxR3Css='true';link.dataset.astCxR3CssContract=AST_CX_R3_CSS_CONTRACT;doc.head.appendChild(link);return link;
}
function v3Of(product){
  const p=product?.sourceProduct?.customerProductProjection;
  return p?.schemaVersion==='PHI-OS-AST-CUSTOMER-PRODUCT-PROJECTION-v3.0.0'?p:null;
}
function experienceOf(product){
  const x=product?.sourceProduct?.customerExperienceProjection;
  return x?.schemaVersion==='PHI-OS-AST-CX-R3-CUSTOMER-EXPERIENCE-PROJECTION-v1.0.0'?x:null;
}
function legacyCompatibilityPlan(workspace){
  if(workspace?.schemaVersion!=='PHI-OS-AST-INTERACTIVE-WORKSPACE-v1.0.0'||workspace?.surfaceCutoverActive!==true)return Object.freeze({status:'NOT_HANDLED',reason:'AST_CUSTOMER_PRODUCT_V3_UNAVAILABLE'});
  const readingHtml=buildAstrologyWorkspaceHtml(workspace);
  if(!readingHtml)return Object.freeze({status:'NOT_HANDLED',reason:'AST_SPECIALIST_HTML_EMPTY'});
  return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml,compatibilityOnly:true,afterMount:mount=>installAstrologyWorkspaceInteractions(mount?.reading,workspace)});
}
export function renderAstrologyProduct({product,mount}={}){
  const projection=v3Of(product);
  if(!projection)return legacyCompatibilityPlan(product?.sourceProduct);
  ensureCss(mount?.host?.ownerDocument||globalThis.document);
  const experience=experienceOf(product);
  const plan=buildAstrologySpecialistSurfaceV3(projection,experience);
  if(plan.status!=='RENDERED')return plan;
  return Object.freeze({...plan,compatibilityOnly:false,afterMount:slots=>installAstrologySpecialistInteractions(slots?.host,projection,experience)});
}
export default Object.freeze({AST_CX_R3_CSS_HREF,AST_CX_R3_CSS_CONTRACT,renderAstrologyProduct});
