const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const loc=(v,l)=>v?.[l]||v?.en||v?.['zh-Hans']||'';
const year=(y,l)=>Number(y)<0?(l==='zh-Hans'?`公元前${Math.abs(y)}年`:`${Math.abs(y)} BCE`):(l==='zh-Hans'?`公元${y}年`:`${y} CE`);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const STYLE_ID='civ-atlas-structured-visual-style';
const TRAJECTORY_AUTHORITY=['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY'];

function ensureStyle(){
 if(document.getElementById(STYLE_ID)) return;
 const s=document.createElement('style'); s.id=STYLE_ID; s.textContent=`
 .civ-structured{display:grid;gap:1rem;margin:1rem 0 1.5rem;padding:1rem;border:1px solid var(--phi-border-strong);border-radius:var(--phi-radius-lg);background:var(--phi-surface-subtle)}
 .civ-structured__head{display:flex;justify-content:space-between;align-items:end;gap:1rem}
 .civ-structured__head h4{margin:0}.civ-structured__head p{margin:.2rem 0 0;color:var(--phi-text-secondary)}
 .civ-structured__svg-wrap{overflow-x:auto;border:1px solid var(--phi-border-subtle);border-radius:var(--phi-radius-md);background:var(--phi-surface-solid)}
 .civ-structured svg{display:block;width:100%;min-width:42rem;height:auto;max-height:24rem}
 .civ-structured svg text{fill:currentColor;font-family:var(--phi-font-sans);font-size:12px}
 .civ-structured svg .axis{stroke:currentColor;opacity:.2}.civ-structured svg .node{fill:currentColor;opacity:.12;stroke:currentColor;stroke-width:1.4}
 .civ-structured svg .node.active{opacity:.28;stroke-width:3}.civ-structured svg .evidence{fill:none;stroke:currentColor;stroke-width:3}
 .civ-structured svg .reconstructed{fill:none;stroke:currentColor;stroke-width:8;opacity:.28}.civ-structured svg .conceptual{fill:none;stroke:currentColor;stroke-width:3;stroke-dasharray:9 7}
 .civ-structured__controls{display:flex;gap:.5rem;overflow-x:auto;padding:.15rem 0 .35rem;scrollbar-gutter:stable}
 .civ-structured__controls button{flex:0 0 auto;min-height:44px;padding:.55rem .75rem;border:1px solid var(--phi-border-strong);border-radius:999px;background:var(--phi-surface-solid);color:var(--phi-text-primary);font:inherit;cursor:pointer}
 .civ-structured__controls button[aria-pressed="true"]{border-color:var(--phi-action-knowledge);box-shadow:inset 0 -3px 0 var(--phi-action-knowledge)}
 .civ-structured__matrix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem}.civ-structured__card{padding:.8rem;border:1px solid var(--phi-border-subtle);border-radius:var(--phi-radius-md);background:var(--phi-surface-solid)}
 .civ-structured__card h5{margin:0 0 .35rem}.civ-structured__card p{margin:.15rem 0;color:var(--phi-text-secondary)}
 .civ-structured__legend{display:flex;flex-wrap:wrap;gap:.7rem;font-size:var(--phi-text-xs);color:var(--phi-text-secondary)}
 .civ-structured__legend span{display:inline-flex;align-items:center;gap:.35rem}.civ-structured__legend i{display:inline-block;width:2rem;border-top:3px solid currentColor}.civ-structured__legend .dash{border-top-style:dashed}.civ-structured__legend .band{border-top-width:8px;opacity:.35}
 @media(max-width:768px){.civ-structured__head{display:grid}.civ-structured__matrix{grid-template-columns:1fr}.civ-structured svg{min-width:36rem}.civ-structured{padding:.8rem}}
 @media(max-width:420px){.civ-structured svg{min-width:32rem}.civ-structured__controls button{white-space:normal;max-width:12rem}}
 @media(prefers-reduced-motion:reduce){.civ-structured *{transition:none!important;animation:none!important}}
 `;
 document.head.appendChild(s);
}
function head(l,titleZh,titleEn,leadZh,leadEn){
 return `<div class="civ-structured__head"><div><p class="knowledge-eyebrow">${l==='zh-Hans'?'结构化动态图谱':'Structured dynamic atlas'}</p><h4>${esc(l==='zh-Hans'?titleZh:titleEn)}</h4><p>${esc(l==='zh-Hans'?leadZh:leadEn)}</p></div></div>`;
}
function linePoints(series,minY,maxY,w=720,h=190){
 const rows=(series||[]).filter(p=>Number.isFinite(Number(p.year))&&Number.isFinite(Number(p.index)));
 if(!rows.length)return '';
 const minX=Math.min(...rows.map(p=>Number(p.year))),maxX=Math.max(...rows.map(p=>Number(p.year)));
 return rows.map(p=>{
   const x=30+(Number(p.year)-minX)/Math.max(1,maxX-minX)*(w-60);
   const y=h-25-(Number(p.index)-minY)/Math.max(1,maxY-minY)*(h-50);
   return `${x.toFixed(1)},${y.toFixed(1)}`;
 }).join(' ');
}
function timeline(container,data,state,l,onStateChange){
 const periods=data.timeline?.periods||[]; const active=state.timeWindowId;
 container.innerHTML=`<section class="civ-structured" data-structured-layer="timeline">${head(l,'历史脊柱','Timeline spine','文字、节点与时期全部由 Registry 实时生成；无需读取海报小字。','Labels, periods and selection are rendered directly from the registry—no poster text required.')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 170" role="img" aria-label="${esc(l==='zh-Hans'?'文明历史时期轴':'Civilization period timeline')}"><line x1="30" y1="75" x2="730" y2="75" class="axis"/>${periods.map((p,i)=>{const x=35+i*(690/Math.max(1,periods.length-1));return `<g><circle cx="${x}" cy="75" r="${p.periodId===active?10:6}" class="node ${p.periodId===active?'active':''}"/><text x="${x}" y="${i%2?118:42}" text-anchor="middle">${esc(p.periodId)}</text></g>`}).join('')}</svg></div>
 <div class="civ-structured__controls">${periods.map(p=>`<button data-period="${esc(p.periodId)}" aria-pressed="${p.periodId===active}">${esc(p.periodId)} · ${esc(loc(p.title,l))}</button>`).join('')}</div></section>`;
 container.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{const p=periods.find(x=>x.periodId===b.dataset.period);if(p)onStateChange({timeWindowId:p.periodId,time:p.startYear,caseIds:p.caseIds||[],primaryCaseId:p.caseIds?.[0]||null},{source:'structured-timeline'});});
}
function cases(container,data,state,l,onStateChange){
 const all=data.cases?.cases||[]; const counts=new Map();
 all.forEach(c=>{const t=(c.caseId.match(/CA-(T\d\d)-/)||[])[1]||'OTHER';counts.set(t,(counts.get(t)||0)+1)});
 const rows=[...counts.entries()].sort();
 container.innerHTML=`<section class="civ-structured" data-structured-layer="cases">${head(l,'文明案例分布','Civilization case distribution','120 个案例由 HTML 卡片承载清晰文字；这里仅显示时期分布与当前选择。','All 120 cases remain readable HTML cards; this overview shows period distribution and selection.')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 190" role="img" aria-label="${esc(l==='zh-Hans'?'文明案例按历史时期分布':'Cases by historical period')}">${rows.map(([id,n],i)=>{const x=25+i*35;const h=n*16;return `<rect x="${x}" y="${160-h}" width="22" height="${h}" class="node ${state.primaryCaseId?.includes(id)?'active':''}"/><text x="${x+11}" y="178" text-anchor="middle">${id}</text>`}).join('')}</svg></div>
 <p class="civ-atlas-note">${esc(l==='zh-Hans'?`完整 Registry：${all.length} 个文明 Runtime Cases。使用下方搜索与卡片读取完整文字。`:`Full registry: ${all.length} civilization runtime cases. Use the search and cards below for complete text.`)}</p></section>`;
}
function comparison(container,data,state,l,onStateChange){
 const fams=data.comparison?.families||[]; const active=state.comparisonFamilyId;
 container.innerHTML=`<section class="civ-structured" data-structured-layer="comparison">${head(l,'比较家族','Comparison families','比较结构由 Registry 生成，不使用文明总分或强弱排名。','Comparison is generated from registry relationships without a civilization score or ranking.')}
 <div class="civ-structured__matrix">${fams.map(f=>`<button class="civ-structured__card" data-family="${esc(f.familyId)}" aria-pressed="${f.familyId===active}"><h5>${esc(loc(f.title,l))}</h5><p>${esc(loc(f.coreRuntimeProblem,l))}</p><small>${f.caseIds?.length||0} ${l==='zh-Hans'?'案例':'cases'}</small></button>`).join('')}</div></section>`;
 container.querySelectorAll('[data-family]').forEach(b=>b.onclick=()=>onStateChange({comparisonFamilyId:b.dataset.family},{source:'structured-comparison'}));
}
function world(container,data,state,l,onStateChange){
 const snaps=data.world?.snapshots||[]; const selected=snaps.find(s=>s.snapshotId===state.snapshotId)||snaps[0];
 container.innerHTML=`<section class="civ-structured" data-structured-layer="world">${head(l,'世界横切面','World snapshots','15 个标准横切面使用清晰 HTML 时间轴与区域矩阵；不依赖静态地图上的小字。','Fifteen snapshots use a readable HTML timeline and regional matrix, without depending on small text baked into a map image.')}
 <div class="civ-structured__controls">${snaps.map(s=>`<button data-snapshot="${esc(s.snapshotId)}" aria-pressed="${s.snapshotId===selected?.snapshotId}">${esc(year(s.year,l))}</button>`).join('')}</div>
 ${selected?`<div class="civ-structured__matrix">${selected.regionalGroups.map(g=>`<article class="civ-structured__card"><h5>${esc(loc(g.label,l))}</h5><p>${esc((g.caseIds||[]).join(' · '))}</p></article>`).join('')}</div>`:''}</section>`;
 container.querySelectorAll('[data-snapshot]').forEach(b=>b.onclick=()=>{const s=snaps.find(x=>x.snapshotId===b.dataset.snapshot);if(s)onStateChange({snapshotId:s.snapshotId,time:s.year,caseIds:s.majorCaseIds||[],primaryCaseId:s.majorCaseIds?.[0]||null},{source:'structured-world'});});
}
function trajectories(container,data,state,l,onStateChange){
 const all=data.trajectories?.trajectories||[]; let ids=state.trajectoryIds?.length?state.trajectoryIds:all.slice(0,4).map(t=>t.trajectoryId);
 const selected=all.filter(t=>ids.includes(t.trajectoryId)).slice(0,6);
 const vals=selected.flatMap(t=>(t.series||[]).map(p=>Number(p.index)).filter(Number.isFinite)); const min=vals.length?Math.min(...vals):0,max=vals.length?Math.max(...vals):100;
 container.innerHTML=`<section class="civ-structured" data-structured-layer="trajectories">${head(l,'长时段轨迹','Long-duration trajectories','曲线为 SVG 矢量图；证据系列、历史重建与概念轨迹保持不同视觉语法。','SVG keeps evidence series, historical reconstruction and conceptual trajectories visually distinct.')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 220" role="img" aria-label="${esc(l==='zh-Hans'?'文明长时段轨迹':'Long-duration civilization trajectories')}"><line x1="30" y1="190" x2="730" y2="190" class="axis"/>${selected.map(t=>`<polyline points="${linePoints(t.series,min,max)}" class="${t.authorityClass==='CONCEPTUAL_TRAJECTORY'?'conceptual':t.authorityClass==='HISTORICAL_RECONSTRUCTION'?'reconstructed':'evidence'}"><title>${esc(loc(t.title,l))} · ${esc(t.authorityClass)}</title></polyline>`).join('')}</svg></div>
 <div class="civ-structured__legend"><span><i></i>${l==='zh-Hans'?'资料系列':'Evidence series'}</span><span><i class="band"></i>${l==='zh-Hans'?'历史重建':'Historical reconstruction'}</span><span><i class="dash"></i>${l==='zh-Hans'?'概念轨迹':'Conceptual trajectory'}</span></div>
 <div class="civ-structured__controls">${all.map(t=>`<button data-traj="${esc(t.trajectoryId)}" aria-pressed="${ids.includes(t.trajectoryId)}">${esc(loc(t.title,l))}</button>`).join('')}</div></section>`;
 container.querySelectorAll('[data-traj]').forEach(b=>b.onclick=()=>{const set=new Set(ids);set.has(b.dataset.traj)?set.delete(b.dataset.traj):set.add(b.dataset.traj);onStateChange({trajectoryIds:[...set].slice(0,6)},{source:'structured-trajectories'});});
}
function transitions(container,data,state,l,onStateChange){
 const ws=data.transitions?.transitionWindows||[]; const active=ws.find(w=>w.transitionWindowId===state.transitionWindowId)||ws[0];
 const steps=active?[['Before',active.beforeState],['Pressure',active.pressure],['Threshold',active.threshold],['Transition',active.transition],['New capacity',active.newCapacity],['New load',active.newLoad],['Irreversibility',active.irreversibility],['Successor',active.successorReality]]:[];
 container.innerHTML=`<section class="civ-structured" data-structured-layer="transitions">${head(l,'文明转型窗口','Civilization transition windows','每个窗口用八阶段 HTML 流程呈现，文字可读、可复制、可读屏。','Each window is rendered as an eight-stage readable, selectable HTML flow.')}
 <div class="civ-structured__controls">${ws.map(w=>`<button data-tw="${esc(w.transitionWindowId)}" aria-pressed="${w.transitionWindowId===active?.transitionWindowId}">${esc(w.transitionWindowId)} · ${esc(loc(w.title,l))}</button>`).join('')}</div>
 <div class="civ-structured__matrix">${steps.map(([k,v],i)=>`<article class="civ-structured__card"><small>${i+1}</small><h5>${esc(k)}</h5><p>${esc(loc(v,l))}</p></article>`).join('')}</div></section>`;
 container.querySelectorAll('[data-tw]').forEach(b=>b.onclick=()=>onStateChange({transitionWindowId:b.dataset.tw},{source:'structured-transition'}));
}
function loss(container,data,state,l,onStateChange){
 const fams=data.loss?.families||[],types=data.loss?.lossTypes||[]; const active=state.lossFamilyId||fams[0]?.familyId;
 container.innerHTML=`<section class="civ-structured" data-structured-layer="loss">${head(l,'文明逆转与损失','Reversal & loss','六类、二十四种损失以 HTML 分类呈现；损失不是一个总分。','Six families and twenty-four loss types are rendered as readable HTML; loss is not a total score.')}
 <div class="civ-structured__matrix">${fams.map(f=>{const list=types.filter(t=>t.familyId===f.familyId);return `<button class="civ-structured__card" data-loss-family="${esc(f.familyId)}" aria-pressed="${f.familyId===active}"><h5>${esc(loc(f.title,l))}</h5><p>${esc(loc(f.description,l))}</p><small>${list.length} ${l==='zh-Hans'?'种损失类型':'loss types'}</small></button>`}).join('')}</div></section>`;
 container.querySelectorAll('[data-loss-family]').forEach(b=>b.onclick=()=>onStateChange({lossFamilyId:b.dataset.lossFamily,lossTypeId:null},{source:'structured-loss'}));
}
export function renderStructuredAtlasVisual(container,{data={},state={},locale='en',onStateChange=()=>{}}={}){
 if(!container)return; ensureStyle(); const l=locale==='zh-Hans'?'zh-Hans':'en';
 const fn={timeline,cases,comparison,world,trajectories,transitions,loss}[state.activeLayer]||timeline;
 fn(container,data,state,l,onStateChange);
}
