// Shared presentation only. Access and quotes are supplied by the server.
import {esc,tr} from '../surfaces/runtime-ui.js';
import {renderPublicationReport,settlePublicationAssets,fitPublicationForPrint} from './publication-report-pages.bundle.js';
export function renderCustomerPublication({product,mount,renderDetail,labels}={}){
 const report=product?.publicationReport,access=product?.reportAccess;
 if(!report)return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:`<section data-bazi-access="FREE_REPORT_PREVIEW"><p>${esc(labels.generate)}</p></section>`,technicalHtml:'',customerDefaultSurface:'FREE_REPORT_PREVIEW'});
 const paid=access?.state==='FULL_REPORT'&&access?.verifiedPurchase===true&&(!product.reportDelivery||product.reportDelivery.access.state==='ENTITLED');
 const offer=access?.offer,amount=offer&&new Intl.NumberFormat(product.locale==='en'?'en-MY':'zh-MY',{style:'currency',currency:offer.currency,maximumFractionDigits:0}).format(offer.amountMinor/100);
 const outline=(product.lockedOutline||[]).map(s=>`<li><svg viewBox="0 0 120 36" width="120" height="36" aria-hidden="true"><rect x="1" y="1" width="118" height="34" rx="3" fill="none" stroke="currentColor"/><path d="M12 10h50m-50 8h96m-96 8h74" stroke="currentColor" opacity=".35"/></svg><span>${esc(s.title)}</span></li>`).join('');
 const lock=paid?'':`<section class="bazi-report-unlock" data-bazi-paid-state="PAID_LOCKED"><h2>${esc(tr('Full Report','完整报告'))}</h2><p>${esc(labels.includes)}</p>${offer?`<a class="cx-button" href="${esc(offer.href)}">${esc(labels.unlock)} · ${esc(amount)}</a>`:''}${access?.reason==='FULL_REPORT_RELEASE_PENDING'?`<p>${esc(tr('Your purchase is recorded. The new report edition awaits release acceptance.','购买已记录，新版报告等待发布验收。'))}</p>`:''}</section>`;
 const detail=paid&&product.sourceProduct?renderDetail({product,mount}):null;
 const technical=detail?`<details data-bazi-technical-detail><summary>${esc(tr('Explore Details','探索详情'))}</summary>${detail.navigationHtml}${detail.visualHtml}${detail.readingHtml}${detail.technicalHtml}</details>`:'';
 return {status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:`<div data-bazi-access="${paid?'FULL_REPORT':'FREE_REPORT_PREVIEW'}">${lock}${renderPublicationReport(report)}${outline?`<details data-report-locked-outline><summary>${esc(tr('What the Full Report includes','完整报告包含什么'))}</summary><ul>${outline}</ul></details>`:''}${lock}</div>`,technicalHtml:technical,customerDefaultSurface:paid?'GUIDED_REPORT_SUCCESSOR_R2':'FREE_REPORT_PREVIEW',afterMount:async slots=>{
  const doc=slots.host?.ownerDocument||globalThis.document;
  for(const name of ['visual-report','report-publication']){if(!doc.querySelector(`link[data-bazi-report-css="${name}"]`)){const link=doc.createElement('link');link.rel='stylesheet';link.href=`/assets/customer-ui/surfaces/${name}.css`;link.dataset.baziReportCss=name;doc.head.appendChild(link);}}
  await settlePublicationAssets(slots.reading);fitPublicationForPrint(slots.reading);
 }};
}
