import {renderPersonalEvidenceFigure,hasRenderablePersonalEvidenceFigure} from '../../assets/customer-ui/js/visuals/profile-visual-mvp.js';
import {evidenceLabel,evidenceStatement,evidenceValueRows} from '../../assets/customer-ui/js/visuals/personal-evidence-copy.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const human=v=>String(v??'').replaceAll('::',' · ').replaceAll('_',' ');
export function renderPersonalEvidenceDossier({dossier,profileView,locale='en',customerName='',subject='',reviewPreview=false,report=null,cprHandoff=null}){
  if(!reviewPreview && (report?.canonicalState!=='RELEASED'||cprHandoff?.sourceReportDigest!==report.reportDigest||cprHandoff?.targetRuntime!=='CPR'))throw new Error('CPR_PERSONAL_EVIDENCE_RELEASE_REQUIRED');
  if(!reviewPreview && report.customer!==profileView?.participantRef)throw new Error('CPR_PERSONAL_EVIDENCE_CUSTOMER_MISMATCH');
  if(dossier?.participantRef!==profileView?.participantRef)throw new Error('CPR_PERSONAL_EVIDENCE_SUBJECT_MISMATCH');
  const zh=locale==='zh-Hans',cards=profileView.signalCards||[];
  const page=(body,attrs='')=>`<article class="pub-page pe-body" ${attrs}>${body}</article>`;
  const staticPage=(asset,cover=false)=>`<article class="pub-static" data-pe-static="${esc(asset.id)}"><img src="${esc(asset.publicUrl)}" alt="${zh?'档案静态视觉':'Dossier static visual'}" loading="eager" onerror="this.nextElementSibling.hidden=false"><p class="pe-asset-error" hidden>${zh?'现有静态视觉暂时无法加载；打印尚未就绪。':'Existing static visual is unavailable. Print is not ready.'}</p>${cover?`<div class="pe-cover-values"><span>${esc(customerName||profileView.participantRef)}</span><span>${esc(dossier.asOfDate||'')}</span><span>${esc(subject)}</span></div>`:''}</article>`;
  const rows=card=>`<div class="pe-source"><strong>${esc(evidenceLabel(card.sourceClass,locale))}</strong><p>${esc(evidenceLabel(card.domainId,locale))} ${esc(evidenceLabel(card.facetId,locale))}</p><dl>${evidenceValueRows(card.value,locale).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p>${esc(evidenceLabel(card.providerFamily,locale))} · ${esc(card.assessmentDate||(zh?'日期未知':'Date unknown'))}</p><ul>${(card.precisionBoundary||[]).map(x=>`<li>${esc(evidenceStatement(x,locale))}</li>`).join('')}</ul></div>`;
  let html=dossier.staticPages.map((a,i)=>staticPage(a,i===0)).join('');
  for(const section of dossier.sections){
    html+=staticPage(section.master);
    for(const fig of section.pfigs)if(hasRenderablePersonalEvidenceFigure(fig))html+=page(renderPersonalEvidenceFigure(fig,{locale}),`data-pe-section="${esc(section.section)}"`);
    // Source lanes carry native data once. Figures in their primary sections
    // already contain the customer evidence; do not duplicate it on extra pages.
    const selected=section.section==='SEC-02'?cards:section.section==='SEC-08'?cards.filter(c=>String(c.domainId).startsWith('FINANCIAL_CAPABILITY')||c.sourceClass==='EXTERNAL_PROFILE_RESULT'):[];
    let group=[],lineCount=0;
    const emit=()=>{if(group.length)html+=page(group.map(rows).join(''),`data-pe-section="${esc(section.section)}"`);group=[];lineCount=0};
    for(const card of selected){const lines=JSON.stringify(card.value??null,null,2).split('\n').length+(card.precisionBoundary||[]).length+6;if(lineCount+lines>32)emit();group.push(card);lineCount+=lines;}emit();
    // Rich masters already explain empty sections and general boundaries.
  }
  return `<div class="pub-report pe-dossier" data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2" data-review-preview="${reviewPreview}">${html}</div>`;
}
