import {renderReportBodyContentPreview} from '../canonical-presentation-runtime/report-editorial-resolver.js';
import {ECR_DEEP_R2_SECTIONS} from './ecr-deep-reading-r2.js';
const escapeText=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exactProse=text=>text.split(/(\r\n\r\n|\n\n)/).map((part,i)=>i%2?part:`<p style="margin:0;break-inside:avoid;orphans:3;widows:3">${escapeText(part)}</p>`).join('');
// Local preview adapter to the existing report body renderer, never a paid route.
// The adapter has no interpretation provider, acceptance writer or entitlement authority.
export function renderEcrAuthorLedPreview({sectionId,languages,calculationRef,sourceReference,manifest,localReview=false,synthetic=false}={}){
 if(!localReview)throw Error('ECR_AUTHOR_PREVIEW_LOCAL_REVIEW_ONLY');
 const section=ECR_DEEP_R2_SECTIONS.find(s=>s.id===sectionId&&!s.interactive);
 if(!section||!calculationRef||!sourceReference)throw Error('AUTHOR_PREVIEW_SOURCE_REQUIRED');
 if(!languages?.['zh-Hans']?.text?.trim()||!languages?.en?.text?.trim())throw Error('FULL_BILINGUAL_AUTHOR_MANUSCRIPT_REQUIRED');
 const text=`<header><p>${synthetic?'SYNTHETIC ENGINEERING SAMPLE — NOT AUTHOR MANUSCRIPT':'PRIVATE AUTHOR DRAFT — NOT CUSTOMER DELIVERY'}</p><h1>${escapeText(section.zh)}<br>${escapeText(section.en)}</h1><p>Section ${sectionId} · AUTHOR_DRAFT · Semantic and rights review pending</p></header><section class="ecr-author-language" lang="zh-Hans"><h2>中文 · Chinese</h2><div data-exact-author-text="zh-Hans" style="white-space:pre-wrap;overflow-wrap:anywhere">${exactProse(languages['zh-Hans'].text)}</div></section><section class="ecr-author-language" lang="en"><h2>English · 英文</h2><div data-exact-author-text="en" style="white-space:pre-wrap;overflow-wrap:anywhere">${exactProse(languages.en.text)}</div></section><footer>Local review only. No automatic author acceptance, semantic admission, rights clearance or commercial delivery.</footer>`;
 const preview=renderReportBodyContentPreview({methodId:'ECR',contentLanguage:'bilingual',html:text,sourceOwner:'ECR_AUTHOR_CASE_MANUSCRIPT',sourceReference,manifest});
 const flowCss='@media print{@page{size:A4;margin:18mm 18mm 16mm}.report-customer-content{padding:0;min-height:0}.report-body-backdrop{inset:-18mm -18mm -16mm}.report-body-reading-field{padding:5mm}.ecr-author-language h2{break-after:avoid}}';
 return {...preview,html:preview.html.replace('</style>',flowCss+'</style>'),calculationRef,sectionId,authorState:'AUTHOR_DRAFT',completeReport:false,customerPublishable:false,synthetic,rendererCreatesMeaning:false};
}
