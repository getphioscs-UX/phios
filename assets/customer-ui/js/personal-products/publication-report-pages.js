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
export function renderFrozenBaziIntro(report,total=26){
 const rendered=renderBaziStructuralBatch(report),start=rendered.indexOf('<section class="vrpt-page"'),end=rendered.indexOf('<section class="vrpt-page"',start+1),page=rendered.slice(start,end);
 // The nested sections in P06's snapshot are divs/articles; reject drift.
 if(!page||!page.includes('data-page-number="6"')||!page.includes('</footer>'))throw Error('FROZEN_BAZI_INTRO_SHAPE_CHANGED');
 const clean=page.replace(/<details class="vrpt-evidence">[\s\S]*?<\/details>/g,'').replace(/ data-source-ref="[^"]*"/g,'').replace(/id="[^"]*"/g,'').replace(/<span data-part="page-index">[\s\S]*?<\/span>/,'').replace(/<br>06<\/span>/,'</span>').replace(/<span>06 \/ 26<\/span>/,renderGlobalReportPagination(6,total));
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
  if(p.pageFamily)return renderSectionFamily(p,{locale,totalPages,skin,t});
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

function decorativeLayers(p){
 const binding=p.visualBinding||{},urls=[[0,binding.bodyUrl],[1,binding.motifUrl],[2,p.pageFamily==='SECTION_OPENER_PAGE'?binding.url:null]].filter(([,url])=>url);
 return `<div class="pub-decoration" aria-hidden="true">${urls.map(([i,url])=>`<img data-decorative-layer="${i}" ${i===2?`data-fallback-sources="${esc(JSON.stringify(binding.candidates||[]))}"`:''} src="${esc(url)}" alt="">`).join('')}</div>`;
}
function sectionLandscape(number){
 const n=Number(number),shift=(n%3)*45;
 return `<svg class="pub-section-landscape" viewBox="0 0 800 600" aria-hidden="true"><circle cx="${600-shift}" cy="240" r="46" fill="#cfb77e" opacity=".25"/><path d="M0 480 Q100 470 175 360 L260 425 350 310 445 420 530 355 655 450 800 330V600H0Z" fill="#bcc5c0" opacity=".48"/><path d="M0 555L110 445 200 485 330 390 430 505 550 460 640 410 800 520V600H0Z" fill="#8e9b93" opacity=".35"/><path d="M0 600Q120 500 260 555T550 530T800 575" fill="none" stroke="#b7975f" stroke-width="2"/><path d="M100 540Q280 505 410 548T760 555" fill="none" stroke="#b7975f" opacity=".65"/></svg>`;
}
function renderSectionFamily(p,{locale,totalPages,skin,t}){
 const opener=p.pageFamily==='SECTION_OPENER_PAGE',variant=p.heroPlacement||['hero-bottom','hero-right','hero-left','hero-full-fade'][(Number(p.sectionNumber)-1)%4];
 const header=`<header class="pub-header"><span>PHI OS<small>${t('SEE DEEPER · LIVE CLEARER','看见更深 · 活出更清晰')}</small></span><span>${esc(skin.label[locale])}<small>${esc(p.sectionTitle[locale])}</small></span></header>`;
 const heading=opener?`<div class="pub-opener-heading"><span class="pub-section-number">${esc(p.sectionNumber)}</span><h2 lang="zh-Hans">${esc(p.sectionTitle['zh-Hans'])}</h2><p lang="en">${esc(p.sectionTitle.en)}</p></div>`:`<div class="pub-heading"><p class="pub-section">${esc(p.sectionNumber)} · ${esc(p.sectionTitle[locale])}</p><h2>${esc(p.title)}</h2></div>`;
 const timing=p.temporal?`<dl class="pub-time"><div><dt>${t('Observation time','观察时间')}</dt><dd>${esc(p.temporal.date)}<small>${esc(p.temporal.localTime||'')} · ${esc(p.temporal.timezone)}</small></dd></div><div><dt>${t('Luck cycle','大运')}</dt><dd>${esc(p.temporal.selectedLuck||t('Outside resolved range','超出已解析范围'))}</dd></div><div><dt>${t('Year pillar','流年')}</dt><dd>${esc(p.temporal.annual||t('Not admitted','未获准'))}</dd></div></dl>`:'';
 const items=p.items?.length?`<ol class="pub-insights">${p.items.map((s,i)=>`<li><span aria-hidden="true">${String(i+1).padStart(2,'0')}</span><p>${esc(s)}</p></li>`).join('')}</ol>`:'';
 const facts=p.facts?.length?`<div class="pub-facts">${p.facts.map(f=>`<div><b>${esc(f.value)}</b><span>${esc(f.label)}</span></div>`).join('')}</div>`:'';
 const observations=p.observations?.length?`<aside class="pub-reflection"><h3>${t('Questions for this period','这一阶段的观察问题')}</h3>${p.observations.map(s=>`<p>${esc(s)}</p>`).join('')}</aside>`:'';
 return `<section class="pub-page pub-family" data-page-number="${p.pageNumber}" data-page-key="${esc(p.pageKey)}" data-page-family="${esc(p.pageFamily)}" data-section="${esc(p.sectionKey)}" data-hero-placement="${variant}" data-body-variant="BODY_${['A','B','C'][(p.pageNumber-7)%3]}" data-text-fit="STANDARD">${decorativeLayers(p)}${opener?sectionLandscape(p.sectionNumber):motif(skin.motif)}${header}${heading}${p.primaryVisualHtml?`<figure class="pub-visual">${p.primaryVisualHtml}</figure>`:''}${timing}${facts}<div class="pub-narrative">${p.paragraphs.map(s=>`<p>${esc(s)}</p>`).join('')}</div>${items}${observations}${p.boundary?`<p class="pub-boundary">${esc(p.boundary)}</p>`:''}<footer class="pub-footer"><span>${t('Your life, in context.','在情境中理解你的人生。')}</span>${renderGlobalReportPagination(p.pageNumber,totalPages)}</footer></section>`;
}

// Decorative failures are removed before readiness/print. The CSS landscape
// remains underneath, so a missing optional object never becomes a broken slot.
export async function settlePublicationAssets(root){
 await Promise.all([...root.querySelectorAll('.pub-decoration img')].map(async img=>{
  const candidates=img.dataset.fallbackSources?JSON.parse(img.dataset.fallbackSources):[img.getAttribute('src')];
  for(const url of candidates){try{img.src=url;await img.decode();return;}catch{}}
  img.remove();
 }));
}
