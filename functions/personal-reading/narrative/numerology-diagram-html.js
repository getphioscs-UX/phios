import {composeNumR20Pages} from './numerology-publication-adapter.js';
import {renderNumR20PublicationHtml} from './numerology-publication-html.js';
import {buildNumerologyChartModel} from '../../customer-projection/numerology-customer-reading-envelope-v1.js';
import {numerologyPublicLabel} from '../../customer-projection/numerology-public-labels-v1.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Acceptance candidate: consume native calculated structures; never calculate roles.
export function composeNumR22DiagramPages(snapshot){
 const pages=structuredClone(composeNumR20Pages(snapshot));
 for(const p of pages)for(const locale of ['zh-Hans','en']){
  const b=p.languages[locale],v=b.structuredVisual,chart=buildNumerologyChartModel({integratedReading:snapshot.readings[locale],locale});
  if(p.logicalPageId==='P06'){
   const core=chart.coreNumberMap.nodes.filter(x=>['LIFE_PATH','BIRTHDAY_NUMBER'].includes(x.id));
   const admitted=snapshot.readings[locale].sections.depth.sections.nameRoleMeanings;
   const names=(chart.nameLayerMap?.values||[]).filter(x=>['EXPRESSION','SOUL_URGE','PERSONALITY'].includes(x.role)&&admitted.some(m=>m.role===x.role&&m.runtimeUseAllowed===true&&m.methodAlignment?.eligible===true));
   v.rows=[...core.map(x=>({label:numerologyPublicLabel(x.id,locale),value:String(x.value),role:x.id})),...names.map(x=>({label:numerologyPublicLabel(x.role,locale),value:String(x.value),role:x.role}))];
   v.title=locale==='en'?'Core roles · eligible name layer only':'核心角色 · 姓名层仅在输入合格时显示';
   v.sourceRefs=['chartModel.coreNumberMap.nodes','chartModel.nameLayerMap.values','depth.nameRoleMeanings.methodAlignment'];
  }
  if(p.logicalPageId==='P24')v.rows=[{label:locale==='en'?'Calculation':'计算',value:locale==='en'?'Confirmed inputs':'已确认输入'},{label:locale==='en'?'Traditional interpretation':'传统解释',value:locale==='en'?'Source constrained':'按已准入来源'},{label:locale==='en'?'Reality evidence':'现实资料',value:locale==='en'?'Not supplied':'未提供'}];
 }
 return pages;
}

export function renderNumR22Diagram(p,locale){
 const lang=locale==='bilingual'?'zh-Hans':locale,v=p.languages[lang].structuredVisual,en=locale==='bilingual'?p.languages.en.structuredVisual:null;
 const title=en?v.title+' / '+en.title:v.title;
 const groups=[{rows:v.rows,kind:v.kind},...(v.secondary?[{...v.secondary,kind:'FREQUENCY'}]:[])];
 const rowHeight=35;let height=34+groups.reduce((n,g)=>n+g.rows.length*rowHeight+(g.title?25:0),0);
 let y=32;const marks=[];
 for(const [gi,g] of groups.entries()){
  if(g.title){marks.push(`<text x="12" y="${y}" class="sub">${esc(g.title)}</text>`);y+=25;}
  const max=Math.max(1,...g.rows.map(r=>Number(r.value)||0));
  for(const [i,r] of g.rows.entries()){
   const other=gi===0?en?.rows[i]:en?.secondary?.rows[i],label=other&&other.label!==r.label?r.label+' / '+other.label:r.label;
   marks.push(`<g data-row="${i}" data-value="${esc(r.value)}"><text x="12" y="${y+2}" class="label">${esc(label)}</text>`);
   if(g.kind==='FREQUENCY')marks.push(`<rect x="330" y="${y-12}" width="${160*(Number(r.value)||0)/max}" height="17" rx="3" fill="#467f80"/>`);
   else marks.push(`<line x1="322" y1="${y-4}" x2="492" y2="${y-4}" stroke="#cbb984"/><circle cx="330" cy="${y-4}" r="4" fill="#467f80"/>`);
   marks.push(`<text x="510" y="${y+2}" class="value">${esc(r.value)}</text></g>`);y+=rowHeight;
  }
 }
 let drawing=marks.join('');
 if(v.kind==='FREQUENCY'&&p.logicalPageId!=='P17'){
  height=groups.length*115+10;drawing=groups.map((g,gi)=>{const max=Math.max(1,...g.rows.map(r=>Number(r.value)||0)),width=620/Math.max(1,g.rows.length),base=gi*115+82;return `${g.title?`<text x="12" y="${base-65}" class="sub">${esc(g.title)}</text>`:''}`+g.rows.map((r,i)=>{const x=24+i*width,h=45*Number(r.value)/max;return `<g data-value="${esc(r.value)}"><rect x="${x}" y="${base-h}" width="${width*.55}" height="${h}" fill="#467f80"/><text x="${x}" y="${base-h-5}" class="value">${esc(r.value)}</text><text x="${x}" y="${base+20}" class="label">${esc(r.label)}</text></g>`;}).join('');}).join('');
 }
 if(['P06','P08','P13','P14','P15','P16'].includes(p.logicalPageId)){
  height=190;const rows=v.rows,positions=rows.map((r,i)=>rows.length<=3?[100+i*230,85]:[80+(i%3)*240,45+Math.floor(i/3)*100]);
  drawing=rows.map((r,i)=>{const [x,y]=positions[i];const target=positions[i+1],line=target?`<line x1="${x}" y1="${y}" x2="${target[0]}" y2="${target[1]}" stroke="#cbb984"/>`:'';return line;}).join('')+rows.map((r,i)=>{const [x,y]=positions[i],other=en?.rows[i];return `<g data-role="${esc(r.role||r.label)}" data-value="${esc(r.value)}"><circle cx="${x}" cy="${y}" r="23" fill="#fffdf4" stroke="#467f80" stroke-width="2"/><text x="${x}" y="${y+6}" text-anchor="middle" class="value">${esc(r.value)}</text><text x="${x}" y="${y+43}" text-anchor="middle" class="label">${esc(r.label)}</text>${other&&other.label!==r.label?`<text x="${x}" y="${y+61}" text-anchor="middle" class="label">${esc(other.label)}</text>`:''}</g>`;}).join('');
 }
 return `<figure class="num-r22-diagram" data-page="${p.logicalPageId}" data-provenance="${esc(v.sourceRefs.join(';'))}"><figcaption>${esc(title)}</figcaption><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 ${height}" role="img" aria-labelledby="${p.logicalPageId}-title ${p.logicalPageId}-desc"><title id="${p.logicalPageId}-title">${esc(title)}</title><desc id="${p.logicalPageId}-desc">${esc(v.rows.map(r=>r.label+': '+r.value).join('; '))}</desc><style>text{fill:#193442;font-family:ReportCJK,Arial,sans-serif}.label{font-size:14px}.value{font-size:18px;font-weight:bold}.sub{font-size:13px}</style>${v.missing?`<text x="12" y="25">${lang==='en'?'Eligible inputs not supplied':'未提供合格输入'}</text>`:drawing}</svg></figure>`;
}

export function renderNumR22DiagramHtml({snapshot,editorialSnapshot,...options}){
 const pages=composeNumR22DiagramPages(snapshot);
 if(editorialSnapshot){
  if(editorialSnapshot.origin!=='OFFLINE_HANDOFF_REPLAY'||editorialSnapshot.calculationSnapshotDigest!==snapshot.snapshotDigest||editorialSnapshot.pages.length!==19)throw Error('NUM_R22_EDITORIAL_IDENTITY_REQUIRED');
  for(const p of pages){const e=editorialSnapshot.pages.find(x=>x.logicalPageId===p.logicalPageId);if(!e)throw Error('NUM_R22_EDITORIAL_PAGE_MISSING');for(const l of ['zh-Hans','en'])p.languages[l].units=e.languages[l].map((text,i)=>({unitId:p.logicalPageId+'-editorial-'+i,text,sourceClaimId:null}));}
 }
 const r=renderNumR20PublicationHtml({...options,snapshot,pages});
 // Replace only the existing figure, preserving page identity and admitted facts.
 let index=0;const html=r.html.replace(/<figure class="structure"[\s\S]*?<\/figure>/g,()=>renderNumR22Diagram(pages[index++],options.locale));
 if(index!==19)throw Error('NUM_R22_DIAGRAM_PAGE_COUNT');
 const css=`<style>.reading{inset:14mm 14mm 14mm;padding:3mm}.reading header{margin-bottom:2mm;padding-bottom:1mm}h1{font-size:14pt}header small,footer,.facts,.input-summary,.observation{display:none}.num-r22-diagram{margin:0 0 3mm;padding:2mm;border:1px solid #c5ad6d;background:#fffdf4}.num-r22-diagram figcaption{font-size:9pt;font-weight:bold;margin-bottom:1mm}.num-r22-diagram svg{width:100%;max-height:65mm;display:block}.language p{font-size:10.5pt;line-height:1.4;margin-bottom:2mm}.body-content{display:grid;grid-template-columns:minmax(0,1fr);gap:0}.reading.bilingual .body-content{grid-template-columns:minmax(0,1fr) minmax(0,1fr);column-gap:4mm}.num-r22-diagram{grid-column:1/-1}.reading.bilingual .language+.language{border-top:0;border-left:1px solid #d8c9a6;padding:0 0 0 3mm;margin:0}.reading.bilingual .language p{line-height:1.30;margin-bottom:1.5mm}.gap{font-size:9pt}.reading.bilingual{inset:10mm 10mm 10mm;padding:2mm}.reading.bilingual .num-r22-diagram svg{max-height:48mm}.reading.bilingual .language p{line-height:1.20;margin-bottom:1mm}.reading.bilingual .language h2{margin:0 0 1mm}.reading.bilingual h1{font-size:13pt}.reading.bilingual .gap{font-size:9pt}[data-page-id="P16"] .reading.bilingual .num-r22-diagram svg{max-height:42mm}</style>`;
 return {...r,html:html.replace('</style>','</style>'+css),layoutIdentity:'NUM_R22_NATIVE_SVG_CANDIDATE',semanticReviewComplete:false,customerPublishable:false};
}
