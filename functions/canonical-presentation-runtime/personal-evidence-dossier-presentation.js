import {renderPersonalEvidenceFigure} from '../../assets/customer-ui/js/visuals/profile-visual-mvp.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const human=v=>String(v??'').replaceAll('::',' · ').replaceAll('_',' ');
export function renderPersonalEvidenceDossier({dossier,profileView,locale='en',customerName='',subject='',reviewPreview=false,report=null,cprHandoff=null}){
  if(!reviewPreview && (report?.canonicalState!=='RELEASED'||cprHandoff?.sourceReportDigest!==report.reportDigest||cprHandoff?.targetRuntime!=='CPR'))throw new Error('CPR_PERSONAL_EVIDENCE_RELEASE_REQUIRED');
  if(!reviewPreview && report.customer!==profileView?.participantRef)throw new Error('CPR_PERSONAL_EVIDENCE_CUSTOMER_MISMATCH');
  if(dossier?.participantRef!==profileView?.participantRef)throw new Error('CPR_PERSONAL_EVIDENCE_SUBJECT_MISMATCH');
  const zh=locale==='zh-Hans',cards=profileView.signalCards||[];
  const page=(body,attrs='')=>`<article class="pub-page pe-body" ${attrs}>${body}</article>`;
  const staticPage=(asset,cover=false)=>`<article class="pub-static" data-pe-static="${esc(asset.id)}"><img src="${esc(asset.publicUrl)}" alt="${zh?'档案静态视觉':'Dossier static visual'}" loading="eager" onerror="this.nextElementSibling.hidden=false"><p class="pe-asset-error" hidden>${zh?'现有静态视觉暂时无法加载；打印尚未就绪。':'Existing static visual is unavailable. Print is not ready.'}</p>${cover?`<div class="pe-cover-values"><span>${esc(customerName||profileView.participantRef)}</span><span>${esc(dossier.asOfDate||'')}</span><span>${esc(subject)}</span></div>`:''}</article>`;
  const rows=card=>`<div class="pe-source"><strong>${esc(card.sourceLabel||human(card.sourceClass))}</strong><p>${esc(human(card.domainId))} ${esc(human(card.facetId))}</p><pre>${esc(JSON.stringify(card.value??null,null,2))}</pre><p>${esc(card.providerFamily||'')} · ${esc(card.assessmentDate||(zh?'日期未知':'Date unknown'))}</p><ul>${(card.precisionBoundary||[]).map(x=>`<li>${esc(human(x))}</li>`).join('')}</ul></div>`;
  let html=dossier.staticPages.map((a,i)=>staticPage(a,i===0)).join('');
  for(const section of dossier.sections){
    html+=staticPage(section.master);
    for(const fig of section.pfigs)html+=page(renderPersonalEvidenceFigure(fig,{locale}),`data-pe-section="${esc(section.section)}"`);
    // Source lanes carry native data once. Figures in their primary sections
    // already contain the customer evidence; do not duplicate it on extra pages.
    const selected=section.section==='SEC-02'?cards:section.section==='SEC-08'?cards.filter(c=>String(c.domainId).startsWith('FINANCIAL_CAPABILITY')||c.sourceClass==='EXTERNAL_PROFILE_RESULT'):[];
    let group=[],lineCount=0;
    const emit=()=>{if(group.length)html+=page(group.map(rows).join(''),`data-pe-section="${esc(section.section)}"`);group=[];lineCount=0};
    for(const card of selected){const lines=JSON.stringify(card.value??null,null,2).split('\n').length+(card.precisionBoundary||[]).length+6;if(lineCount+lines>32)emit();group.push(card);lineCount+=lines;}emit();
    if(!section.pfigs.length&&!selected.length&&section.section!=='SEC-10')html+=page(`<p>${zh?'此章节尚无已知证据；未知保持开放。':'No evidence for this section yet. Unknowns remain open.'}</p>`,`data-pe-section="${esc(section.section)}" data-pe-sparse="true"`);
    if(section.section==='SEC-10')html+=page(`<ul>${(profileView.boundaries||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>${zh?'评估结果不自动成为当下现实，也不自动保存。':'Assessment evidence does not automatically become Current Reality and is not saved automatically.'}</p>`,`data-pe-section="SEC-10"`);
  }
  return `<div class="pub-report pe-dossier" data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2" data-review-preview="${reviewPreview}">${html}</div>`;
}
