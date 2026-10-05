import {esc} from '../surfaces/runtime-ui.js';
import {validateVisualReportIR} from '../../../../functions/canonical-presentation-runtime/visual-first-report-contract.js';
import {renderReportCoverOverlay} from '../../../../functions/canonical-presentation-runtime/report-cover-overlay.js';
const text=(x,y,s,cls='')=>`<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${esc(s)}</text>`;
const lines=(s,max=10)=>{const a=[...String(s||'')],out=[];for(let i=0;i<a.length;i+=max)out.push(a.slice(i,i+max).join(''));return out;};
function node(n,x,y,i){return `<g data-element="${n.element||'METAL'}"><circle cx="${x}" cy="${y}" r="58" class="vfr-node"/>${text(x,y-10,n.value??n.label,'vfr-node-title')}${text(x,y+20,n.value!=null?n.label:String(i+1).padStart(2,'0'),'vfr-node-index')}${lines(n.detail,10).slice(0,3).map((s,j)=>text(x,y+94+j*24,s,'vfr-node-detail')).join('')}</g>`;}
export function renderVisualDiagram(d,page){
 let body='';const marker=`vfr-arrow-${page}`;
 if(d.type==='bars'){
  const max=Math.max(...d.nodes.map(n=>n.value),1),step=d.nodes.length>5?39:70,top=d.nodes.length>5?45:65;
  body=d.nodes.map((n,i)=>{const y=top+i*step;return `<g data-element="${n.element}"><text x="45" y="${y+20}" class="vfr-bar-label">${esc(n.label)}</text><rect x="140" y="${y}" width="470" height="26" rx="13" class="vfr-track"/><rect x="140" y="${y}" width="${470*n.value/max}" height="26" rx="13" fill="currentColor"/>${text(653,y+21,n.value,'vfr-bar-value')}</g>`}).join('')+text(360,463,d.unit,'vfr-node-detail');
 }else if(d.type==='pillars'){
  body=d.nodes.map((n,i)=>{const x=95+i*176;return `<g data-element="${n.element}"><rect x="${x-72}" y="70" width="144" height="310" rx="25" class="vfr-node"/>${text(x,117,n.label,'vfr-node-detail')}${text(x,200,String(n.value)[0],'vfr-pillar')}${text(x,270,String(n.value)[1],'vfr-pillar')}${lines(n.detail,7).map((s,j)=>text(x,323+j*26,s,'vfr-node-detail')).join('')}</g>`}).join('');
 }else if(d.type==='stack'){
  body=d.nodes.map((n,i)=>{const y=45+i*144;return `<g data-element="${n.element}"><rect x="95" y="${y}" width="530" height="110" rx="25" class="vfr-node"/>${text(210,y+47,n.label,'vfr-node-title')}${text(450,y+45,n.detail,'vfr-node-detail')}${i<d.nodes.length-1?`<path d="M360 ${y+111}v31" class="vfr-link" marker-end="url(#${marker})"/>`:''}</g>`}).join('');
 }else if(d.type==='relations'){
  const pts=d.nodes.map((n,i)=>({x:d.nodes.length===4?110+i*166:110+i%3*250,y:d.nodes.length===4?190:95+Math.floor(i/3)*195}));
  body=d.edges.map((e,i)=>{const a=pts[e.from],b=pts[e.to];return `<path d="M${a.x} ${a.y}L${b.x} ${b.y}" class="vfr-link" data-relation="${e.kind}"/>${text((a.x+b.x)/2,(a.y+b.y)/2-8,String(i+1),'vfr-edge-number')}`}).join('')+d.nodes.map((n,i)=>node(n,pts[i].x,pts[i].y,i)).join('');
  body+=d.edges.map((e,i)=>`<text x="${35+i%3*240}" y="${430+Math.floor(i/3)*30}" class="vfr-node-detail">${i+1}. ${esc(e.label)}</text>`).join('');
 }else if(['orbit','loop','network'].includes(d.type)){
  const radius=d.nodes.length>4?152:142,pts=d.nodes.map((n,i)=>({x:360+radius*Math.cos(-Math.PI/2+i*Math.PI*2/d.nodes.length),y:205+radius*.85*Math.sin(-Math.PI/2+i*Math.PI*2/d.nodes.length)}));
  body=`<circle cx="360" cy="205" r="${radius}" class="vfr-orbit"/>`+pts.map((p,i)=>d.type==='loop'?`<path d="M${p.x} ${p.y}L${pts[(i+1)%pts.length].x} ${pts[(i+1)%pts.length].y}" class="vfr-link" marker-end="url(#${marker})"/>`:`<path d="M360 205L${p.x} ${p.y}" class="vfr-link"/>`).join('')+text(360,200,d.type==='loop'?'循环与重组':'相互作用','vfr-center')+d.nodes.map((n,i)=>{const p=pts[i];return `<g data-element="${n.element}"><circle cx="${p.x}" cy="${p.y}" r="57" class="vfr-node"/>${lines(n.label,6).map((s,j)=>text(p.x,p.y-5+j*24,s,'vfr-node-title')).join('')}</g>`}).join('');
  body+=d.nodes.map((n,i)=>`<text x="${35+i%2*345}" y="${403+Math.floor(i/2)*28}" class="vfr-node-detail">${i+1}. ${esc(n.detail)}</text>`).join('');
 }else {
  const xs=d.nodes.map((n,i)=>65+i*590/Math.max(1,d.nodes.length-1));
  body=d.nodes.slice(0,-1).map((n,i)=>`<path d="M${xs[i]+58} 175H${xs[i+1]-60}" class="vfr-link" marker-end="url(#${marker})"/>`).join('')+d.nodes.map((n,i)=>node(n,xs[i],175,i)).join('')+text(360,402,'结构条件 → 现实作用 → 可观察的结果','vfr-node-detail');
 }
 const mobile=`<div class="vfr-mobile-map" data-diagram-type="${d.type}">${d.nodes.map((n,i)=>`<div data-element="${n.element}"><small>${String(i+1).padStart(2,'0')}</small><b>${esc(n.label)}</b>${n.value!=null?`<strong>${esc(n.value)}</strong>`:''}<p>${esc(n.detail||d.unit||'')}</p>${d.type==='bars'?`<span class="vfr-mobile-bar" style="width:${Math.max(0,n.value)*100/Math.max(...d.nodes.map(x=>x.value),1)}%"></span>`:''}</div>`).join('')}${d.edges?`<ul>${d.edges.map(e=>`<li>${esc(d.nodes[e.from].label)} ↔ ${esc(d.nodes[e.to].label)}：${esc(e.label)}</li>`).join('')}</ul>`:''}</div>`;
 return `<figure class="vfr-diagram" data-diagram-id="${esc(d.id)}"><svg viewBox="0 0 720 500" role="img" aria-label="${esc(d.title)}"><title>${esc(d.title)}</title><desc>${esc(d.caption)}</desc><defs><marker id="${marker}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="#ad946a"/></marker></defs>${body}</svg>${mobile}${d.group?`<div class="vfr-group">${esc(d.group)}</div>`:''}<figcaption>${esc(d.caption)}</figcaption></figure>`;
}
export function renderVisualFirstReport(ir){
 validateVisualReportIR(ir);if(ir.customerPublishable!==false||ir.reviewOnly!==true)throw Error('VFR_HUMAN_REVIEW_REQUIRED');
 return `<article class="pub-report vfr-report" lang="${ir.locale}" data-method="${ir.method}" data-physical-composition="VISUAL_FIRST_REPORT_CONTRACT_V1">${ir.pages.map(p=>{
  const master=p.kind==='MASTER',cover=p.kind==='COVER',s=ir.sections.find(s=>s.id===p.sectionId),d=ir.diagrams.find(d=>d.id===p.diagramIds?.[0]);
  const secondary=ir.diagrams.find(d=>d.id===p.secondaryDiagramId);
  const visual=secondary?`<figure class="vfr-structure-strip" data-diagram-id="${esc(d.id)}">${d.nodes.map(n=>`<div data-element="${n.element}"><b>${esc(n.label)}</b><span>${esc(n.detail)}</span></div>`).join('')}</figure>${renderVisualDiagram(secondary,p.pageNumber)}`:d?renderVisualDiagram(d,p.pageNumber):'';
  const body=cover?`<img class="vfr-art" src="${esc(ir.coverAsset)}" alt="八字读取封面">${renderReportCoverOverlay({locale:ir.locale,subject:ir.identity})}`:master?`<img class="vfr-art" src="${esc(s.sectionMasterAsset)}" alt="${esc(s.title)}章节图"><div class="vfr-master-heading"><small>${esc(s.id.slice(1))} · 八字个人读取</small><h2>${esc(s.title)}</h2><p>${esc(s.headline)}</p></div>`:`<div class="vfr-heading"><small>${esc(p.kicker||'结构与生活')}</small><h2>${esc(p.title)}</h2><p>${esc(p.subtitle||'')}</p></div><div class="vfr-content">${visual}${p.kind==='INTERPRETATION'?`<div class="vfr-prose">${s.interpretation.map(t=>`<p>${esc(t)}</p>`).join('')}</div><div class="vfr-insights">${s.insights.map((t,i)=>`<div><b>0${i+1}</b><p>${esc(t)}</p></div>`).join('')}</div>`:!d?`<div class="vfr-prose">${p.paragraphs.map(t=>`<p>${esc(t)}</p>`).join('')}</div>${p.cards?`<div class="vfr-read-map">${p.cards.map((t,i)=>`<div><b>0${i+1}</b><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p></div>`).join('')}</div>`:''}`:''}</div>`;
  return `<section class="pub-page vfr-page" id="${p.sectionId&&master?'chapter-'+p.sectionId:'page-'+p.pageNumber}" data-page-number="${p.pageNumber}" data-page-kind="${p.kind}" data-section-id="${p.sectionId||''}">${ir.bodyAsset&&!cover&&!master?`<img class="vfr-background" src="${esc(ir.bodyAsset)}" alt="">`:''}<header><strong>P H I O S</strong><span>八字 · 个人读取</span></header>${body}<footer><span>在情境中理解你的人生。</span><span>${String(p.pageNumber).padStart(2,'0')} / ${ir.pages.length}</span></footer></section>`;
 }).join('')}</article>`;
}
