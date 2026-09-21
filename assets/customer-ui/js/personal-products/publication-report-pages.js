import {esc} from '../surfaces/runtime-ui.js';
import {renderBaziStructuralBatch} from './bazi-structural-visual-pages.js';
import {globalReportPagination,METHOD_VISUAL_SKINS,assertPublicationCandidate} from '../../../../functions/canonical-presentation-runtime/report-publication-contract.js';

export function renderGlobalReportPagination(sequence,total){const text=globalReportPagination(sequence,total);return text?`<span data-pagination-owner="GlobalReportPagination" aria-label="${esc(text)}">${text}</span>`:'';}
export function fitPublicationForPrint(root){
 return [...root.querySelectorAll('.pub-page')].map(page=>{
  let fits=false;for(const variant of ['STANDARD','COMPACT','REFLOW']){page.dataset.textFit=variant;const end=page.getBoundingClientRect().bottom,footer=page.querySelector('footer').getBoundingClientRect();fits=page.scrollHeight<=page.clientHeight+2&&footer.bottom<=end;if(fits)break;}
  return {pageNumber:Number(page.dataset.pageNumber),variant:page.dataset.textFit,fits};
 });
}
// Presentation-only compatibility adapter. The page body's admitted diagram
// and copy are preserved; provenance and duplicate folios are not customer copy.
export function renderFrozenBaziIntro(report){
 const rendered=renderBaziStructuralBatch(report),start=rendered.indexOf('<section class="vrpt-page"'),end=rendered.indexOf('<section class="vrpt-page"',start+1),page=rendered.slice(start,end);
 // The nested sections in P06's snapshot are divs/articles; reject drift.
 if(!page||!page.includes('data-page-number="6"')||!page.includes('</footer>'))throw Error('FROZEN_BAZI_INTRO_SHAPE_CHANGED');
 const clean=page.replace(/<details class="vrpt-evidence">[\s\S]*?<\/details>/g,'').replace(/ data-source-ref="[^"]*"/g,'').replace(/id="[^"]*"/g,'').replace(/<span data-part="page-index">[\s\S]*?<\/span>/,'').replace(/<br>06<\/span>/,'</span>').replace(/<span>06 \/ 26<\/span>/,renderGlobalReportPagination(6,26));
 return `<article class="vrpt-report" data-visual-batch="${report.visualBatch}" data-frozen-intro="P06" lang="${report.locale}">${clean}</article>`;
}
export function extractPublicationDiagram(report,pageNumber){
 const rendered=renderBaziStructuralBatch(report),start=rendered.indexOf(`data-page-number="${pageNumber}"`),fragment=rendered.slice(start),figure=fragment.match(/<figure class="vrpt-primary">([\s\S]*?)<\/figure>/)?.[1];
 if(start<0||!figure)throw Error('PUBLICATION_SOURCE_DIAGRAM_MISSING');
 return figure.replace(/ data-source-ref="[^"]*"/g,'').replace(/<figcaption>[\s\S]*?<\/figcaption>/g,'');
}
function motif(kind){
 const shapes={LANDSCAPE_RINGS:'<path d="M0 270L70 190 130 240 210 120 300 245 390 155 480 270 600 180 720 280V340H0Z"/><path d="M0 300L130 210 230 280 350 195 460 270 580 220 720 310V340H0Z"/>',PALACE_GRID:'<path d="M80 60H640V300H80ZM220 60V300M360 60V300M500 60V300M80 140H640M80 220H640"/>',ORBITS:'<ellipse cx="360" cy="170" rx="260" ry="90"/><ellipse cx="360" cy="170" rx="180" ry="130"/>',CHANNELS:'<path d="M200 80L520 80 360 280ZM200 80L360 170 520 80M360 170V280"/>',INTERSECTIONS:'<circle cx="280" cy="170" r="120"/><circle cx="440" cy="170" r="120"/>',LAYERS:'<path d="M90 250Q360 20 630 250M90 210Q360 -20 630 210M90 290Q360 60 630 290"/>',SEQUENCE:'<path d="M100 250L220 90 360 250 500 90 620 250"/>',FIELDS:'<ellipse cx="360" cy="170" rx="240" ry="130"/><ellipse cx="360" cy="170" rx="180" ry="95"/><ellipse cx="360" cy="170" rx="100" ry="50"/>'};
 return `<svg class="pub-motif" viewBox="0 0 720 340" aria-hidden="true" focusable="false">${shapes[kind]||shapes.LAYERS}</svg>`;
}
export function renderPublicationReport(snapshot){
 assertPublicationCandidate(snapshot);const {locale,totalPages,methodId}=snapshot,skin=METHOD_VISUAL_SKINS[methodId],t=(en,zh)=>locale==='en'?en:zh;
 const intro=snapshot.intro.map(p=>p.kind==='STATIC'?`<section class="pub-static" data-page-number="${p.pageNumber}" data-pagination-exception="APPROVED_BAKED_ASSET"><img src="${esc(p.src)}" alt="${esc(p.alt)}"></section>`:p.html).join('');
 const pages=snapshot.pages.map(p=>{
  const facts=p.facts.filter(f=>f.value!==undefined);
  const visual=p.primaryVisualHtml|| (p.temporal?`<div class="pub-time"><span>${t('Observation date','观察日期')}<b>${esc(p.temporal.date)}</b></span>${p.temporal.selectedLuck?`<span>${t('Luck cycle','大运')}<b>${esc(p.temporal.selectedLuck)}</b></span>`:''}${p.temporal.annual?`<span>${t('Year pillar','流年')}<b>${esc(p.temporal.annual)}</b></span>`:''}</div>`:facts.length?`<div class="pub-facts" role="list">${facts.slice(0,5).map(f=>`<div role="listitem"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join('')}</div>`:p.pageNumber===26?`<div class="pub-closing-mark" aria-hidden="true">◇</div>`:'');
  return `<section class="pub-page" data-page-number="${p.pageNumber}" data-page-key="${esc(p.pageKey)}" data-variant="${p.visualVariant}" data-method-skin="${methodId}" data-text-fit="STANDARD">
  ${motif(skin.motif)}<header class="pub-header"><span>PHI OS<small>${t('SEE DEEPER · LIVE CLEARER','看见更深 · 活出更清晰')}</small></span><span>${esc(skin.label[locale])}<small>${t('PERSONAL READING','个人读取')}</small></span></header>
  <div class="pub-heading"><p class="pub-section">${esc(t(({M04:'Structure & context',M05:'Balance & relationships',M06:'Your life in context',M07:'Time & experience',M08:'Observation & direction'})[p.section]||'Personal reading',({M04:'结构与情境',M05:'平衡与联系',M06:'人生情境',M07:'时间与经验',M08:'观察与方向'})[p.section]||'个人读取'))}</p><h2>${esc(p.title)}</h2>${p.lead?`<p class="pub-lead">${esc(p.lead)}</p>`:''}</div>
  ${visual?`<figure class="pub-visual" aria-label="${esc(p.title)}">${visual}</figure>`:''}
  <div class="pub-narrative">${p.paragraphs.map(text=>`<p>${esc(text)}</p>`).join('')}</div>
  ${p.provenanceHighlights?.length?`<ul class="pub-provenance">${p.provenanceHighlights.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>`:''}
  ${p.observation||p.counterSignal?`<aside class="pub-reflection"><h3>${t('Bring it into experience','把读取带回经验')}</h3>${p.observation?`<p>${esc(p.observation)}</p>`:''}${p.counterSignal?`<p>${esc(p.counterSignal)}</p>`:''}</aside>`:''}
  <p class="pub-boundary">${esc(p.boundary)}</p><footer class="pub-footer"><span>${t('Your life, in context.','在情境中理解你的人生。')}</span>${renderGlobalReportPagination(p.pageNumber,totalPages)}</footer></section>`;
 }).join('');
 return `<article class="pub-report" lang="${locale}" data-publication-version="2.0.0" data-method="${methodId}">${intro}${pages}</article>`;
}
