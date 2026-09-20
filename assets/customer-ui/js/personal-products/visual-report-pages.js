import {renderQuantitativeVisual} from './visual-report-quantitative.js';
import {esc} from '../surfaces/runtime-ui.js';
import {renderBaziStructuralBatch} from './bazi-structural-visual-pages.js';
const list=v=>Array.isArray(v)?v:[];
const words=(text,max=22)=>{
 const chars=/[\u3400-\u9fff]/u.test(text),parts=chars?[...text]:String(text).split(/\s+/),lines=[];let line='';
 for(const part of parts){const next=line+(line&&!chars?' ':'')+part;if([...next].length>max&&line){lines.push(line);line=part;}else line=next;}if(line)lines.push(line);return lines;
};
const svgText=(text,x,y,max=22,cls='')=>`<text class="${cls}" x="${x}" y="${y}" text-anchor="middle">${words(String(text),max).map((line,i)=>`<tspan x="${x}" dy="${i?21:0}">${esc(line)}</tspan>`).join('')}</text>`;
function diagram(visual){
 const nodes=list(visual.nodes),type=visual.type;
 if(!nodes.length)return '';
 const quantitative=renderQuantitativeVisual(visual);if(quantitative)return quantitative;
 if(type==='MINI_CARD'&&nodes.every(n=>/^images\/phi-cards\/phi-card-[a-z0-9-]+\.webp$/.test(n.asset?.objectKey||'')))return `<div class="vrpt-phi-cards">${nodes.map(n=>`<article><img src="https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/${n.asset.objectKey}" width="240" height="320" alt="${esc(n.label)}" data-phi-card-asset="${esc(n.asset.assetId)}"><strong>${esc(n.label)}</strong><p>${esc(n.secondary)}</p></article>`).join('')}</div>`;
 if(type==='STRUCTURAL_DIAGRAM'&&nodes.length===12&&nodes.every(n=>Number.isInteger(n.row)&&Number.isInteger(n.col)))return `<div class="vrpt-palaces" role="img" aria-label="${esc(visual.a11ySummary)}">${nodes.map(n=>`<article style="grid-row:${n.row};grid-column:${n.col}"><small>${esc(n.code)}</small><strong>${esc(n.label)}</strong><p>${list(n.stars).map(s=>esc(s.label)).join(' · ')}</p></article>`).join('')}<div class="vrpt-palaces-center">PHI OS<br>Zi Wei</div></div>`;
 if(/^\/assets\/reports\/PHIOS-COM-REPORT-(ECR|BAZI|ZIWEI|ASTROLOGY|NUMEROLOGY|PROFILE|HD|CROSS)-FULL-v1\.svg$/.test(visual.coverAssetUrl||''))return `<img class="vrpt-cover-art" src="${visual.coverAssetUrl}" alt="${esc(visual.a11ySummary)}" width="240" height="320">`;
 if(type==='BAR'){
  if(nodes.some(x=>typeof x.value!=='number'||!Number.isFinite(x.value)||x.value<0))throw Error('VRPT_CHART_VALUE_REQUIRED');
  const max=Math.max(...nodes.map(x=>x.value),.001),height=nodes.length*38+60;
  return `<svg viewBox="0 0 680 ${height}" role="img" aria-label="${esc(visual.a11ySummary)}"><title>${esc(visual.unit)}</title>${nodes.map((x,i)=>`<text x="10" y="${i*38+28}">${esc(`${x.rank?x.rank+'. ':''}${x.label}`)}</text><rect x="200" y="${i*38+10}" width="${x.value/max*360}" height="21" rx="3"/><text x="575" y="${i*38+28}">${Number(x.value.toFixed(4))}</text>`).join('')}<text x="10" y="${height-10}" class="vrpt-axis">${esc(visual.unit)}</text></svg>`;
 }
 if(['MINI_CARD','DOMAIN_GRID','RANKED_CARDS','SPLIT_COMPARE','FLOW','TIMELINE','CONFIDENCE_OR_EVIDENCE_BADGE'].includes(type))return `<div class="vrpt-tiles">${nodes.map(x=>`<article class="vrpt-tile${/^-?\d+(\.\d+)?$/.test(x.secondary||'')?' vrpt-number-tile':''}"${type==='FLOW'&&list(visual.edges).some(e=>e.from===x.id)?' data-flow-connected="true"':''}${x.selected?' data-selected="true"':''}><span>${esc(x.role||x.code||'')}</span><h3>${esc(x.label)}</h3>${x.secondary?`<p>${esc(x.secondary)}</p>`:''}</article>`).join('')}</div>`;
 if(!['RADIAL_MAP','CYCLE','LAYER_STACK','NETWORK','STRUCTURAL_DIAGRAM','NODE_MAP'].includes(type))throw Error(`VRPT_COMPONENT_NOT_IMPLEMENTED:${type}`);
 const radial=['RADIAL_MAP','CYCLE'].includes(type),layer=type==='LAYER_STACK';
 const grid=nodes.length>4&&!radial&&!layer;
 const positions=nodes.map((n,i)=>grid?{x:120+(i%3)*220,y:75+Math.floor(i/3)*135}:nodes.length===1?{x:340,y:275}:radial?{x:340+225*Math.cos(-Math.PI/2+i*2*Math.PI/nodes.length),y:275+205*Math.sin(-Math.PI/2+i*2*Math.PI/nodes.length)}:layer?{x:i===2?340:180+i*320,y:i===2?425:130}:{x:nodes.length===2?190+i*300:i===0?145:465,y:nodes.length===2?250:i===0?270:100+(i-1)*170});
 const edgePaths=list(visual.edges).map(e=>{const a=positions[nodes.findIndex(x=>x.id===e.from)],b=positions[nodes.findIndex(x=>x.id===e.to)];return a&&b?`<path class="vrpt-link" d="M${a.x},${a.y} L${b.x},${b.y}"/>`:'';}).join('');
 return `<svg viewBox="0 0 680 560" role="img" aria-label="${esc(visual.a11ySummary)}"><title>${esc(visual.a11ySummary)}</title>${radial?'<circle class="vrpt-orbit" cx="340" cy="275" r="210"/>':''}${edgePaths}${nodes.map((n,i)=>{const {x,y}=positions[i],lines=words(n.label,radial||grid?13:23);return `<g class="vrpt-node${n.selected?' is-selected':''}"><rect x="${x-(radial||grid?82:122)}" y="${y-48}" width="${radial||grid?164:244}" height="${Math.max(96,lines.length*22+46)}" rx="18"/>${svgText(n.label,x,y-10,radial||grid?13:23)}${svgText(`${n.selected?'● ':''}${n.role||n.code||''}`,x,y+lines.length*21+7,25,'vrpt-node-code')}</g>`;}).join('')}</svg>`;
}
function responsiveDiagram(v){
 const desktop=diagram(v),nodes=list(v.nodes);
 if(v.type==='BAR'){
  const max=Math.max(...nodes.map(n=>n.value),.001);
  return `<div class="vrpt-wide-diagram">${desktop}</div><div class="vrpt-compact-diagram vrpt-bars">${nodes.map(n=>`<div><strong>${esc(n.label)}</strong><div class="vrpt-bar-track"><i style="width:${n.value/max*100}%"></i></div><span>${esc(Number(n.value.toFixed(4)))}</span></div>`).join('')}<small>${esc(v.unit||'')}</small></div>`;
 }
 if(['NETWORK','NODE_MAP','LAYER_STACK'].includes(v.type))return `<div class="vrpt-wide-diagram">${desktop}</div><div class="vrpt-compact-diagram vrpt-network">${nodes.map(n=>`<article><small>${esc(n.role||n.code||'')}</small><strong>${esc(n.label)}</strong></article>`).join('')}${list(v.edges).length?`<div class="vrpt-connections">${v.edges.map(e=>`<p>${esc(nodes.find(n=>n.id===e.from)?.label||e.from)} <span>→</span> ${esc(nodes.find(n=>n.id===e.to)?.label||e.to)}</p>`).join('')}</div>`:''}</div>`;
 return desktop;
}
export function renderVisualReportPages(report,{primaryVisuals={}}={}) {
 if(['BAZI-DYNAMIC-R1-BATCH-01','BAZI-DYNAMIC-R1-BATCH-02','BAZI-DYNAMIC-R1-BATCH-03','BAZI-DYNAMIC-R1-BATCH-04','BAZI-DYNAMIC-R1-BATCH-05'].includes(report?.visualBatch)&&!report.presentationSchema)return renderBaziStructuralBatch(report);
 if(report?.presentationSchema==='PHI-OS-REPORT-PRESENTATION-R2')return renderPresentedReport(report,{primaryVisuals});
 if(report?.schemaVersion!=='PHI-OS-PERSONAL-READING-VISUAL-PAGES-v1.0.0')throw Error('VRPT_PAGE_REPORT_REQUIRED');
 const zh=report.locale==='zh-Hans';
 return `<article class="vrpt-report" data-visual-report="${esc(report.productId)}" data-depth="${esc(report.depth)}">${report.pages.map((p,i)=>`<section class="vrpt-page" id="${esc(p.pageId)}" data-template="${esc(p.templateId)}" data-page-id="${esc(p.pageId)}"><header class="vrpt-heading"><span>PHI OS · ${esc(report.depth)} · ${String(p.pageNumber??i+1).padStart(2,'0')}</span><h2>${esc(p.title)}</h2><p>${esc(p.question)}</p></header><figure class="vrpt-primary" data-visual-type="${esc(p.visual.type)}">${primaryVisuals[p.pageId]||responsiveDiagram(p.visual)}<figcaption>${esc(p.visual.unit||'')}</figcaption></figure><div class="vrpt-insights">${list(p.insights).map(x=>`<p data-source-ref="${esc(x.sourceRef)}">${esc(x.text)}</p>`).join('')}${p.navigationPrompt?`<p>${esc(p.navigationPrompt.text)}</p>`:''}</div>${p.boundaryText?`<aside class="vrpt-boundary">${esc(p.boundaryText)}</aside>`:''}<details class="vrpt-evidence"><summary>${zh?'数据与来源':'Data and sources'}</summary><table><caption>${esc(p.question)}</caption><tbody>${p.visual.nodes.map(x=>`<tr><th scope="row">${esc(x.label)}</th><td>${esc(x.rawValue?JSON.stringify(x.rawValue):x.value??x.secondary??x.code??'')}</td><td>${list(x.sourceRefs).map(esc).join(' · ')}</td></tr>`).join('')}</tbody></table><ul>${p.evidenceRefs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details><footer>PHI OS · REVIEW ONLY <span>${String(p.pageNumber??i+1).padStart(2,'0')} / ${report.totalPages??report.pages.length}</span></footer></section>`).join('')}${report.depth==='FREE'?`<div class="vrpt-upgrade"><p>${zh?'完整报告根据可用来源展开结构关系、条件、时间层与观察问题。':'The full report expands source-supported relationships, conditions, timing and observation questions.'}</p><button disabled aria-disabled="true">${zh?'完整报告 · 待审核开放':'Full report · awaiting review'}</button></div>`:''}</article>`;
}


// Anonymous geometry reflects the chart family; paid node labels, values,
// connections and findings are deliberately never copied into this preview.
function renderLockedStructure(preview,text){
 const type=preview?.visualType||'STRUCTURAL_DIAGRAM';
 const family=/BAR|RADIAL|CYCLE|DONUT|DISTRIBUTION/.test(type)?'distribution':/FLOW|TIMELINE/.test(type)?'timeline':/NETWORK|NODE|LAYER|STRUCTURAL/.test(type)?'structure':'cards';
 const drawings={
  distribution:'<circle cx="150" cy="145" r="82" fill="none" stroke-width="24"/><path d="M310 95h200M310 145h200M310 195h200" stroke-width="22"/>',
  timeline:'<path d="M70 145h460"/><circle cx="100" cy="145" r="24"/><circle cx="230" cy="145" r="24"/><circle cx="370" cy="145" r="24"/><circle cx="500" cy="145" r="24"/>',
  structure:'<path d="M300 145L120 75M300 145L120 215M300 145L480 75M300 145L480 215"/><circle cx="300" cy="145" r="48"/><rect x="60" y="45" width="120" height="60" rx="12"/><rect x="60" y="185" width="120" height="60" rx="12"/><rect x="420" y="45" width="120" height="60" rx="12"/><rect x="420" y="185" width="120" height="60" rx="12"/>',
  cards:'<rect x="65" y="45" width="210" height="85" rx="12"/><rect x="325" y="45" width="210" height="85" rx="12"/><rect x="65" y="165" width="210" height="85" rx="12"/><rect x="325" y="165" width="210" height="85" rx="12"/>'
 };
 return '<figure class="vrpt-preview-silhouette" data-preview-family="'+family+'"><svg viewBox="0 0 600 290" aria-hidden="true">'+drawings[family]+'</svg><figcaption>'+text('Visual layout preview — personal findings are locked.','图表布局预览；个人结果尚未解锁。')+'</figcaption></figure><p role="status">'+text('Findings locked','分析结果尚未解锁')+'</p>';
}

function renderPresentedReport(report,options){
 const locale=report.presentation.reportLocale,zh=locale==='zh-Hans',both=locale==='bilingual';
 const text=(en,cn)=>both?`${cn} / ${en}`:zh?cn:en;
 const states={OPEN:text('Open','可阅读'),PREVIEW:text('Preview','预览'),PAID_LOCKED:text('Full report','完整报告'),DATA_REQUIRED:text('Required material missing','缺少所需资料'),CONDITIONAL:text('Conditional','视条件提供'),NOT_APPLICABLE:text('Not applicable','不适用')};
 return `<article class="vrpt-presented" lang="${both?'zh-Hans':esc(locale)}" data-report-locale="${esc(locale)}"><nav class="vrpt-report-map" aria-label="${text('Report map','报告目录')}"><ol>${report.pages.map(p=>`<li><a href="#${esc(p.pageId)}">${String(p.pageNumber).padStart(2,'0')} · ${esc(p.titles?.[locale]||p.sourcePage?.title||p.copy?.[zh?'zh-Hans':'en']?.title||text('Editorial page','导读页'))}</a> · ${states[p.accessState]}</li>`).join('')}</ol></nav>${report.pages.map(p=>{
  if(p.kind==='STATIC_EDITORIAL')return `<section class="vrpt-editorial" id="${esc(p.pageId)}"><header>PHI OS · ${p.pageNumber}</header>${p.error?`<p role="status">${text('Required editorial artwork is unavailable.','所需导读图片尚不可用。')}</p><code>${esc(p.error)}</code>`:`<img src="${esc(p.asset.src)}" alt="${esc(p.copy?.[zh?'zh-Hans':'en']?.alt||text('Report cover','报告封面'))}" width="${p.asset.width}" height="${p.asset.height}">`}${p.copy?`<details><summary>${text('Accessible page text','页面文字')}</summary>${(both?['zh-Hans','en']:[locale]).map(l=>`<div lang="${l}"><h2>${esc(p.copy[l].title)}</h2><p>${esc(p.copy[l].body)}</p><p>${esc(p.copy[l].boundary)}</p></div>`).join('')}</details>`:''}</section>`;
  if(p.accessState!=='OPEN')return `<section class="vrpt-page vrpt-locked" id="${esc(p.pageId)}"><header>${p.pageNumber} · ${states[p.accessState]}</header><h2>${esc(p.titles?.[zh?'zh-Hans':'en']||'')}</h2><p>${esc(p.values?.[zh?'zh-Hans':'en']||'')}</p>${p.accessState==='PAID_LOCKED'?renderLockedStructure(p.preview,text):''}${p.accessState==='PAID_LOCKED'?`<a class="vrpt-unlock" href="/account/">${text('Choose report language and view price','选择报告语言并查看价格')}</a>`:''}</section>`;
  if(both){
   const cn=p.translations['zh-Hans'],en=p.translations.en,join=(a,b)=>a===b?a:`${a} / ${b}`;
   const copy={...cn,title:join(cn.title,en.title),question:join(cn.question,en.question),insights:cn.insights.map((x,i)=>({...x,text:join(x.text,en.insights[i].text)})),visual:{...cn.visual,nodes:cn.visual.nodes.map((x,i)=>({...x,label:join(x.label,en.visual.nodes[i].label)}))}};
   return `<section class="vrpt-locale-page vrpt-bilingual-shared" id="${esc(p.pageId)}" data-page-number="${p.pageNumber}">${renderVisualReportPages({...report,presentationSchema:undefined,totalPages:report.pages.length,locale:'zh-Hans',depth:'PAID',pages:[{...p.sourcePage,...copy,pageId:p.pageId+'-bilingual',pageNumber:p.pageNumber}]},options)}</section>`;
  }
  return `<section class="vrpt-locale-page" id="${esc(p.pageId)}" data-page-number="${p.pageNumber}">${Object.entries(p.translations).map(([language,copy])=>`<div lang="${language}">${renderVisualReportPages({...report,presentationSchema:undefined,totalPages:report.pages.length,locale:language,depth:'PAID',pages:[{...p.sourcePage,...copy,pageId:p.pageId+'-'+language,pageNumber:p.pageNumber}]},options)}</div>`).join('')}</section>`;
 }).join('')}</article>`;
}
