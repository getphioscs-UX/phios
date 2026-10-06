import {renderReportCoverOverlay} from '../../../../functions/canonical-presentation-runtime/report-cover-overlay.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function lines(value,width){const chars=[...String(value??'—')],out=[];for(let i=0;i<chars.length;i+=width)out.push(chars.slice(i,i+width).join(''));return out;}
function visual(d){
 const nodes=d.nodes;
 let content;
 if(d.type==='bars'){
  const max=Math.max(1,...nodes.map(n=>n.value||0));content=nodes.map((n,i)=>{const y=25+i*43;return `<g><text x="6" y="${y+13}" class="bdm-bar-label">${esc(n.label)}</text><rect x="300" y="${y}" width="330" height="19" class="bdm-track"/><rect x="300" y="${y}" width="${330*(n.value||0)/max}" height="19" class="bdm-bar"/><text x="655" y="${y+15}">${esc(n.value)}</text></g>`;}).join('');
 }else if(d.type==='pillars'){
  content=nodes.map((n,i)=>{const x=18+i*174;return `<g><rect x="${x}" y="30" width="154" height="345" rx="16" class="bdm-node"/><text x="${x+77}" y="77" text-anchor="middle" class="bdm-diagram-label">${esc(n.label)}</text>${[...n.value].map((v,j)=>`<text x="${x+77}" y="${158+j*90}" text-anchor="middle" class="bdm-pillar">${esc(v)}</text>`).join('')}<text x="${x+77}" y="332" text-anchor="middle">${esc(n.hiddenStems.join(' · '))}</text></g>`;}).join('');
 }else{
  // These panels preserve source structure. Edges are never inferred from layout.
  const cols=nodes.length>7?3:2,cellWidth=690/cols,rows=Math.ceil(nodes.length/cols),cellHeight=Math.min(130,430/rows);
  content=nodes.map((n,i)=>{const x=10+i%cols*cellWidth,y=10+Math.floor(i/cols)*cellHeight,w=cellWidth-12;const valueLines=lines(n.value,cols===3?13:20);const display=valueLines.length>3?valueLines.slice(0,3).concat('…'):valueLines;return `<g><rect x="${x}" y="${y}" width="${w}" height="${cellHeight-10}" rx="12" class="bdm-node"/><text x="${x+12}" y="${y+26}" class="bdm-diagram-label">${esc(n.label)}</text>${display.map((l,j)=>`<text x="${x+12}" y="${y+52+j*20}">${esc(l)}</text>`).join('')}</g>`;}).join('');
 }
 return `<figure data-diagram-id="${esc(d.id)}"><svg viewBox="0 0 720 470" role="img" aria-label="${esc(d.zh+' / '+d.en)}"><title>${esc(d.zh+' / '+d.en)}</title>${content}</svg><figcaption><p>${esc(d.caption.zh)}</p><p lang="en">${esc(d.caption.en)}</p></figcaption></figure>`;
}
function prose(content){return ['zh-Hans','en'].map(locale=>`<div lang="${locale}" class="bdm-locale">${(content?.[locale]||[]).map(s=>`<p>${esc(s.text)}${s.excerpted?'…':''}</p>`).join('')}</div>`).join('');}
export function renderBaziDeepManuscript(ir){
 if(ir.method!=='BAZI'||ir.publication?.pages?.length!==48||ir.technical?.diagrams?.length!==15)throw Error('BDM_RESOLVED_IR_REQUIRED');
 const identity={displayName:null,birthDate:null,birthTime:null,timeAccuracy:'UNKNOWN',...ir.identity};
 const pages=ir.publication.pages.map(p=>{
  let body;
  if(p.staticAsset){body=`<div class="pub-decoration pub-decoration--single"><img class="pub-page-background" src="${esc(p.staticAsset)}" alt="${esc(p.title.zh)}"></div>`+(p.staticFolioMasks||[]).map(m=>`<span class="bdm-static-folio-mask" data-pagination-owner="BDM_GLOBAL_PAGINATION" style="left:${m.left}%;top:${m.top}%;width:${m.width}%;height:${m.height}%"><b>${String(p.pageNumber).padStart(2,'0')}</b>${m.mode==='PAGE_TOTAL'?'<small>/ '+ir.publication.pageCount+'</small>':''}</span>`).join('')+(p.pageNumber===1?renderReportCoverOverlay({methodId:'BZR',subject:identity}):'');}
  else{
   const diagram=ir.technical.diagrams.find(d=>d.id===p.diagramId);
   const heading=`<div class="pub-heading"><h2>${esc(p.title.zh)}</h2><p lang="en">${esc(p.title.en)}</p></div>`;
   const decoration=`<div class="pub-decoration pub-decoration--single"><img class="pub-page-background" src="${esc(p.sectionMasterAsset||p.bodyAsset)}" alt=""></div>`;
   const content=p.insightCards?`<div class="bdm-insights">${p.insightCards['zh-Hans'].map((s,i)=>`<div><b>0${i+1}</b><p>${esc(s.text)}${s.excerpted?'…':''}</p><p lang="en">${esc(p.insightCards.en[i].text)}${p.insightCards.en[i].excerpted?'…':''}</p></div>`).join('')}</div>`:diagram?visual(diagram):prose(p.content);
   body=decoration+`<header class="pub-header"><span>P H I O S</span><span>八字 / BaZi</span></header>`+heading+`<div class="bdm-content">${content}</div>`;
  }
  return `<section class="pub-page bdm-page${p.staticAsset?' bdm-static':''}" data-page-number="${p.pageNumber}" data-page-role="${p.role}" data-section-id="${p.sectionId||''}">${body}<footer class="pub-footer"><span>在情境中理解人生 / Your life, in context</span><span>${p.pageNumber} / 48</span></footer></section>`;
 });
 return `<article class="pub-report bdm-report" data-method="BZR" data-print-shell="PHI-OS-REPORT-PRINT-SHELL-V2" data-manuscript-digest="${esc(ir.manuscript.digest)}">${pages.join('')}</article>`;
}
// Browser/PDF/print readiness is technical. No provider or authoring dependency.
export function inspectBaziDeepLayout(root){
 const pages=[...root.querySelectorAll('.bdm-page')];const overflowPages=pages.filter(p=>{const c=p.querySelector('.bdm-content'),footer=p.querySelector('footer');return p.scrollWidth>p.clientWidth+2||p.scrollHeight>p.clientHeight+2||c&&footer&&c.getBoundingClientRect().bottom>footer.getBoundingClientRect().top-4;}).map(p=>Number(p.dataset.pageNumber));
 const missingAssets=[...root.querySelectorAll('img')].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src);
 return {pageCount:pages.length,overflowPages,missingAssets,browserReady:pages.length===48&&!overflowPages.length&&!missingAssets.length};
}
