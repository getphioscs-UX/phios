const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const loc=(v,l)=>v?.[l]||v?.en||v?.['zh-Hans']||'';
const year=(y,l)=>Number(y)<0?(l==='zh-Hans'?`公元前${Math.abs(y)}年`:`${Math.abs(y)} BCE`):(l==='zh-Hans'?`公元${y}年`:`${y} CE`);
const STYLE_ID='civ-atlas-premium-visual-style';
const TRAJECTORY_AUTHORITY=['EVIDENCE_SERIES','HISTORICAL_RECONSTRUCTION','CONCEPTUAL_TRAJECTORY'];

function ensureStyle(){
 if(document.getElementById(STYLE_ID)) return;
 const s=document.createElement('style'); s.id=STYLE_ID; s.textContent=`
 :root{
  --atlas-navy:#061321;--atlas-navy-2:#0a1e32;--atlas-navy-3:#0f2941;
  --atlas-gold:#d5b36c;--atlas-gold-soft:#f1dfb0;--atlas-ivory:#f5f0e6;
  --atlas-muted:#b7c0ca;--atlas-line:rgba(213,179,108,.28);--atlas-glow:rgba(213,179,108,.22);
  --atlas-aqua:#7fb8c7;--atlas-copper:#c48968;--atlas-violet:#9d8bb6;--atlas-green:#8eb39a;
 }
 .civ-structured{
  position:relative;isolation:isolate;display:grid;gap:1rem;margin:1rem 0 1.5rem;padding:clamp(1rem,2.2vw,1.6rem);
  border:1px solid rgba(213,179,108,.38);border-radius:22px;color:var(--atlas-ivory);
  background:
    radial-gradient(circle at 78% 10%,rgba(213,179,108,.11),transparent 28%),
    radial-gradient(circle at 12% 82%,rgba(127,184,199,.08),transparent 30%),
    linear-gradient(145deg,var(--atlas-navy),var(--atlas-navy-2) 58%,#071828);
  box-shadow:0 24px 70px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.04);
  overflow:hidden;
 }
 .civ-structured::before{
  content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;opacity:.42;
  background-image:
    linear-gradient(rgba(213,179,108,.045) 1px,transparent 1px),
    linear-gradient(90deg,rgba(213,179,108,.045) 1px,transparent 1px);
  background-size:36px 36px;
  mask-image:linear-gradient(to bottom,black,transparent 92%);
 }
 .civ-structured::after{
  content:"Φ";position:absolute;right:1.2rem;bottom:-1.3rem;z-index:-1;
  font-family:Georgia,serif;font-size:8rem;line-height:1;color:rgba(213,179,108,.035);pointer-events:none;
 }
 .civ-structured__head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:end}
 .civ-structured__head .knowledge-eyebrow{margin:0 0 .35rem;color:var(--atlas-gold);letter-spacing:.16em;text-transform:uppercase;font-size:.72rem}
 .civ-structured__head h4{margin:0;color:var(--atlas-gold-soft);font-family:Georgia,"Times New Roman",serif;font-weight:500;font-size:clamp(1.25rem,2.3vw,2rem);letter-spacing:.01em}
 .civ-structured__head p{margin:.35rem 0 0;color:var(--atlas-muted);max-width:64rem;line-height:1.6}
 .civ-structured__badge{
  justify-self:end;align-self:start;padding:.38rem .65rem;border:1px solid rgba(213,179,108,.34);border-radius:999px;
  color:var(--atlas-gold-soft);background:rgba(213,179,108,.06);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase
 }
 .civ-structured__svg-wrap{
  position:relative;overflow-x:auto;border:1px solid rgba(213,179,108,.2);border-radius:18px;
  background:linear-gradient(180deg,rgba(15,41,65,.82),rgba(4,16,28,.86));
  box-shadow:inset 0 0 45px rgba(0,0,0,.22);scrollbar-gutter:stable
 }
 .civ-structured__svg-wrap::before{
  content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(circle at center,rgba(213,179,108,.05),transparent 58%);
 }
 .civ-structured svg{display:block;width:100%;min-width:44rem;height:auto;max-height:26rem;color:var(--atlas-gold-soft)}
 .civ-structured svg text{fill:var(--atlas-muted);font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:11px}
 .civ-structured svg .label-strong{fill:var(--atlas-gold-soft);font-weight:700}
 .civ-structured svg .axis{stroke:var(--atlas-gold);stroke-width:1.5;opacity:.36}
 .civ-structured svg .grid{stroke:rgba(213,179,108,.09);stroke-width:1}
 .civ-structured svg .orbit{fill:none;stroke:rgba(213,179,108,.2);stroke-width:1.2;stroke-dasharray:4 7}
 .civ-structured svg .link{stroke:rgba(213,179,108,.23);stroke-width:1.3}
 .civ-structured svg .link.active{stroke:var(--atlas-gold);stroke-width:2.2;opacity:.8}
 .civ-structured svg .node{fill:rgba(213,179,108,.12);stroke:var(--atlas-gold);stroke-width:1.3}
 .civ-structured svg .node.active{fill:rgba(213,179,108,.28);stroke:var(--atlas-gold-soft);stroke-width:2.5;filter:drop-shadow(0 0 8px rgba(213,179,108,.42))}
 .civ-structured svg .node-soft{fill:rgba(127,184,199,.11);stroke:rgba(127,184,199,.68)}
 .civ-structured svg .node-copper{fill:rgba(196,137,104,.12);stroke:rgba(196,137,104,.72)}
 .civ-structured svg .node-violet{fill:rgba(157,139,182,.12);stroke:rgba(157,139,182,.72)}
 .civ-structured svg .node-green{fill:rgba(142,179,154,.12);stroke:rgba(142,179,154,.72)}
 .civ-structured svg .evidence{fill:none;stroke:var(--atlas-gold-soft);stroke-width:3}
 .civ-structured svg .reconstructed{fill:none;stroke:var(--atlas-aqua);stroke-width:7;opacity:.38}
 .civ-structured svg .conceptual{fill:none;stroke:var(--atlas-copper);stroke-width:3;stroke-dasharray:9 7}
 .civ-structured svg .series-0{stroke:var(--atlas-gold-soft)} .civ-structured svg .series-1{stroke:var(--atlas-aqua)}
 .civ-structured svg .series-2{stroke:var(--atlas-copper)} .civ-structured svg .series-3{stroke:var(--atlas-violet)}
 .civ-structured svg .series-4{stroke:var(--atlas-green)} .civ-structured svg .series-5{stroke:var(--atlas-gold)}
 .civ-svg-interactive{cursor:pointer}.civ-svg-interactive:focus{outline:none}.civ-svg-interactive:focus .node{stroke-width:3;filter:drop-shadow(0 0 8px rgba(213,179,108,.5))}
 .civ-structured__controls{display:flex;gap:.55rem;overflow-x:auto;padding:.2rem 0 .45rem;scrollbar-gutter:stable}
 .civ-structured__controls button,.civ-structured__card{
  color:var(--atlas-ivory);font:inherit;transition:transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease
 }
 .civ-structured__controls button{
  flex:0 0 auto;min-height:44px;padding:.58rem .82rem;border:1px solid rgba(213,179,108,.24);border-radius:999px;
  background:rgba(6,19,33,.66);cursor:pointer
 }
 .civ-structured__controls button:hover,.civ-structured__controls button:focus-visible,
 .civ-structured__card:hover,.civ-structured__card:focus-visible{border-color:rgba(213,179,108,.7);transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.18)}
 .civ-structured__controls button[aria-pressed="true"],.civ-structured__card[aria-pressed="true"]{
  border-color:var(--atlas-gold);background:linear-gradient(180deg,rgba(213,179,108,.16),rgba(213,179,108,.07));
  box-shadow:inset 0 0 0 1px rgba(213,179,108,.13),0 0 22px rgba(213,179,108,.08)
 }
 .civ-structured__matrix{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem}
 .civ-structured__card{
  display:block;width:100%;padding:.95rem 1rem;border:1px solid rgba(213,179,108,.18);border-radius:16px;
  background:linear-gradient(145deg,rgba(15,41,65,.64),rgba(5,18,31,.75));text-align:left
 }
 button.civ-structured__card{cursor:pointer}
 .civ-structured__card h5{margin:0 0 .4rem;color:var(--atlas-gold-soft);font-size:.98rem}
 .civ-structured__card p{margin:.15rem 0;color:var(--atlas-muted);line-height:1.52}
 .civ-structured__card small{color:var(--atlas-gold);opacity:.9}
 .civ-structured__legend{display:flex;flex-wrap:wrap;gap:.85rem;font-size:.78rem;color:var(--atlas-muted)}
 .civ-structured__legend span{display:inline-flex;align-items:center;gap:.4rem}
 .civ-structured__legend i{display:inline-block;width:2rem;border-top:3px solid var(--atlas-gold-soft)}
 .civ-structured__legend .dash{border-top-style:dashed;border-color:var(--atlas-copper)}
 .civ-structured__legend .band{border-top-width:8px;opacity:.45;border-color:var(--atlas-aqua)}
 .civ-structured__note{
  display:flex;align-items:flex-start;gap:.6rem;padding:.7rem .8rem;border-left:2px solid rgba(213,179,108,.6);
  background:rgba(213,179,108,.05);color:var(--atlas-muted);font-size:.82rem;line-height:1.5
 }
 .civ-structured__note strong{color:var(--atlas-gold-soft)}
 @media(max-width:900px){.civ-structured__matrix{grid-template-columns:repeat(2,minmax(0,1fr))}}
 @media(max-width:768px){
  .civ-structured__head{grid-template-columns:1fr}.civ-structured__badge{justify-self:start}
  .civ-structured__matrix{grid-template-columns:1fr}.civ-structured svg{min-width:38rem}.civ-structured{padding:.9rem;border-radius:18px}
 }
 @media(max-width:420px){.civ-structured svg{min-width:33rem}.civ-structured__controls button{white-space:normal;max-width:12rem}.civ-structured::after{font-size:6rem}}
 @media(prefers-reduced-motion:reduce){.civ-structured *{transition:none!important;animation:none!important}}
 @media(forced-colors:active){.civ-structured,.civ-structured__card,.civ-structured__controls button{forced-color-adjust:auto;background:Canvas;color:CanvasText}}
 `;
 document.head.appendChild(s);
}
function defs(){
 return `<defs>
  <radialGradient id="atlasGlow"><stop offset="0" stop-color="#f1dfb0" stop-opacity=".34"/><stop offset="1" stop-color="#d5b36c" stop-opacity="0"/></radialGradient>
  <linearGradient id="atlasGoldLine" x1="0" x2="1"><stop offset="0" stop-color="#d5b36c" stop-opacity=".1"/><stop offset=".5" stop-color="#f1dfb0"/><stop offset="1" stop-color="#d5b36c" stop-opacity=".1"/></linearGradient>
  <filter id="atlasSoftGlow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 </defs>`;
}
function head(l,titleZh,titleEn,leadZh,leadEn,badgeZh='动态矢量',badgeEn='Dynamic vector'){
 return `<div class="civ-structured__head"><div><p class="knowledge-eyebrow">${l==='zh-Hans'?'文明图谱 · 动态视觉':'Civilization Atlas · Dynamic Visual'}</p><h4>${esc(l==='zh-Hans'?titleZh:titleEn)}</h4><p>${esc(l==='zh-Hans'?leadZh:leadEn)}</p></div><span class="civ-structured__badge">${esc(l==='zh-Hans'?badgeZh:badgeEn)}</span></div>`;
}
function wireSvg(container,selector,handler){
 container.querySelectorAll(selector).forEach(el=>{
   const run=()=>handler(el);
   el.addEventListener('click',run);
   el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});
 });
}
function linePoints(series,minY,maxY,w=720,h=190){
 const rows=(series||[]).filter(p=>Number.isFinite(Number(p.year))&&Number.isFinite(Number(p.index)));
 if(!rows.length)return '';
 const minX=Math.min(...rows.map(p=>Number(p.year))),maxX=Math.max(...rows.map(p=>Number(p.year)));
 return rows.map(p=>{
   const x=34+(Number(p.year)-minX)/Math.max(1,maxX-minX)*(w-68);
   const y=h-25-(Number(p.index)-minY)/Math.max(1,maxY-minY)*(h-50);
   return `${x.toFixed(1)},${y.toFixed(1)}`;
 }).join(' ');
}
function timeline(container,data,state,l,onStateChange){
 const periods=data.timeline?.periods||[]; const active=state.timeWindowId;
 const xs=periods.map((_,i)=>35+i*(690/Math.max(1,periods.length-1)));
 container.innerHTML=`<section class="civ-structured" data-structured-layer="timeline">${head(l,'历史脊柱','Timeline Spine','从定居、城市、帝国、工业到计算文明基础设施；每个节点都是可操作的真实时期。','From settlement and cities to empires, industry, and computational infrastructure; every node is a live registry period.','时间场','Temporal field')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 190" role="img" aria-label="${esc(l==='zh-Hans'?'文明历史时期轴':'Civilization period timeline')}">${defs()}
 <line x1="34" y1="90" x2="726" y2="90" stroke="url(#atlasGoldLine)" stroke-width="2"/>
 ${periods.map((p,i)=>{const x=xs[i],is=p.periodId===active;return `<g class="civ-svg-interactive" data-svg-period="${esc(p.periodId)}" role="button" tabindex="0" aria-label="${esc(`${p.periodId} ${loc(p.title,l)}`)}"><circle cx="${x}" cy="90" r="${is?24:17}" fill="url(#atlasGlow)" opacity="${is?.8:.35}"/><circle cx="${x}" cy="90" r="${is?8:5}" class="node ${is?'active':''}"/><text class="${is?'label-strong':''}" x="${x}" y="${i%2?138:46}" text-anchor="middle">${esc(p.periodId)}</text><line x1="${x}" y1="${i%2?103:77}" x2="${x}" y2="${i%2?124:58}" class="axis"/></g>`}).join('')}
 </svg></div>
 <div class="civ-structured__controls">${periods.map(p=>`<button data-period="${esc(p.periodId)}" aria-pressed="${p.periodId===active}">${esc(p.periodId)} · ${esc(loc(p.title,l))}</button>`).join('')}</div></section>`;
 const select=id=>{const p=periods.find(x=>x.periodId===id);if(p)onStateChange({timeWindowId:p.periodId,time:p.startYear,caseIds:p.caseIds||[],primaryCaseId:p.caseIds?.[0]||null},{source:'premium-timeline'});};
 container.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>select(b.dataset.period));
 wireSvg(container,'[data-svg-period]',el=>select(el.dataset.svgPeriod));
}
function cases(container,data,state,l){
 const all=data.cases?.cases||[]; const counts=new Map();
 all.forEach(c=>{const t=(c.caseId.match(/CA-(T\d\d)-/)||[])[1]||'OTHER';counts.set(t,(counts.get(t)||0)+1)});
 const rows=[...counts.entries()].sort(); const max=Math.max(1,...rows.map(x=>x[1]));
 container.innerHTML=`<section class="civ-structured" data-structured-layer="cases">${head(l,'文明案例场','Civilization Case Field','120 个案例以时期密度形成纵向节奏；完整资料继续由下方可搜索 HTML 档案承载。','The 120 cases form a period-density field; full dossiers remain readable in the searchable HTML cards below.','120 Cases','120 Cases')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 220" role="img" aria-label="${esc(l==='zh-Hans'?'文明案例按历史时期分布':'Cases by historical period')}">${defs()}
 ${[50,90,130,170].map(y=>`<line x1="28" y1="${y}" x2="732" y2="${y}" class="grid"/>`).join('')}
 ${rows.map(([id,n],i)=>{const x=26+i*35;const h=20+(n/max)*112;const active=state.primaryCaseId?.includes(id);return `<g><rect x="${x}" y="${178-h}" width="22" height="${h}" rx="11" class="node ${active?'active':''}"/><circle cx="${x+11}" cy="${178-h}" r="${active?9:5}" fill="url(#atlasGlow)"/><text x="${x+11}" y="200" text-anchor="middle" class="${active?'label-strong':''}">${id}</text></g>`}).join('')}
 </svg></div>
 <div class="civ-structured__note"><strong>${all.length}</strong><span>${esc(l==='zh-Hans'?'个文明 Runtime Cases 已进入完整 Registry；图形只表达分布，不形成强弱排名。':'civilization runtime cases are in the full registry; the visual expresses distribution only, never ranking.')}</span></div></section>`;
}
function comparison(container,data,state,l,onStateChange){
 const fams=data.comparison?.families||[]; const active=state.comparisonFamilyId;
 const cx=380,cy=150,r=104;
 const points=fams.map((f,i)=>({f,x:cx+Math.cos(-Math.PI/2+i*2*Math.PI/fams.length)*r,y:cy+Math.sin(-Math.PI/2+i*2*Math.PI/fams.length)*r}));
 const links=[];
 const seen=new Set();
 fams.forEach(f=>(f.crossFamilyRelations||[]).forEach(rel=>{
   const key=[f.familyId,rel.targetFamilyId].sort().join('|');
   if(!seen.has(key)){seen.add(key);links.push([f.familyId,rel.targetFamilyId]);}
 }));
 const pos=new Map(points.map(p=>[p.f.familyId,p]));
 container.innerHTML=`<section class="civ-structured" data-structured-layer="comparison">${head(l,'比较家族网络','Comparison Family Network','六个比较家族围绕共同的文明运行问题形成关系网络；比较不是排名。','Six comparison families form a network around shared runtime questions; comparison is not ranking.','6 Families','6 Families')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 300" role="img" aria-label="${esc(l==='zh-Hans'?'文明比较家族网络':'Civilization comparison family network')}">${defs()}
 <circle cx="${cx}" cy="${cy}" r="124" class="orbit"/><circle cx="${cx}" cy="${cy}" r="56" class="orbit"/>
 ${links.map(([a,b])=>{const p1=pos.get(a),p2=pos.get(b);return p1&&p2?`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="link ${active&&(a===active||b===active)?'active':''}"/>`:''}).join('')}
 <circle cx="${cx}" cy="${cy}" r="40" fill="url(#atlasGlow)"/><circle cx="${cx}" cy="${cy}" r="14" class="node active"/><text x="${cx}" y="${cy+4}" text-anchor="middle" class="label-strong">Φ</text>
 ${points.map(({f,x,y},i)=>`<g class="civ-svg-interactive" data-svg-family="${esc(f.familyId)}" role="button" tabindex="0" aria-label="${esc(loc(f.title,l))}"><circle cx="${x}" cy="${y}" r="${f.familyId===active?25:20}" class="node ${f.familyId===active?'active':i%4===1?'node-soft':i%4===2?'node-copper':i%4===3?'node-violet':''}"/><text x="${x}" y="${y+38}" text-anchor="middle" class="${f.familyId===active?'label-strong':''}">${esc((loc(f.title,l)||'').slice(0,18))}</text></g>`).join('')}
 </svg></div>
 <div class="civ-structured__matrix">${fams.map(f=>`<button class="civ-structured__card" data-family="${esc(f.familyId)}" aria-pressed="${f.familyId===active}"><h5>${esc(loc(f.title,l))}</h5><p>${esc(loc(f.coreRuntimeProblem,l))}</p><small>${f.caseIds?.length||0} ${l==='zh-Hans'?'案例':'cases'}</small></button>`).join('')}</div></section>`;
 const choose=id=>onStateChange({comparisonFamilyId:id},{source:'premium-comparison'});
 container.querySelectorAll('[data-family]').forEach(b=>b.onclick=()=>choose(b.dataset.family));
 wireSvg(container,'[data-svg-family]',el=>choose(el.dataset.svgFamily));
}
function world(container,data,state,l,onStateChange){
 const snaps=data.world?.snapshots||[]; const selected=snaps.find(s=>s.snapshotId===state.snapshotId)||snaps[0];
 const groups=selected?.regionalGroups||[]; const cx=380,cy=155,rx=190,ry=94;
 const pts=groups.slice(0,10).map((g,i)=>({g,x:cx+Math.cos(-Math.PI/2+i*2*Math.PI/Math.max(1,Math.min(groups.length,10)))*rx,y:cy+Math.sin(-Math.PI/2+i*2*Math.PI/Math.max(1,Math.min(groups.length,10)))*ry}));
 container.innerHTML=`<section class="civ-structured" data-structured-layer="world">${head(l,'世界横切面','World Snapshot Field','不是现代国界地图，而是同一时间点的文明节点与网络关系场。','Not a modern-border map: this is a same-time field of civilization nodes and network relationships.','15 Snapshots','15 Snapshots')}
 <div class="civ-structured__controls">${snaps.map(s=>`<button data-snapshot="${esc(s.snapshotId)}" aria-pressed="${s.snapshotId===selected?.snapshotId}">${esc(year(s.year,l))}</button>`).join('')}</div>
 ${selected?`<div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 310" role="img" aria-label="${esc(l==='zh-Hans'?'世界文明网络示意图':'Schematic world civilization network')}">${defs()}
 <ellipse cx="${cx}" cy="${cy}" rx="205" ry="108" class="orbit"/><ellipse cx="${cx}" cy="${cy}" rx="118" ry="62" class="orbit"/>
 <circle cx="${cx}" cy="${cy}" r="60" fill="url(#atlasGlow)"/><circle cx="${cx}" cy="${cy}" r="22" class="node active"/><text x="${cx}" y="${cy+4}" text-anchor="middle" class="label-strong">${esc(year(selected.year,l))}</text>
 ${pts.map(({g,x,y},i)=>`<g><line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="link"/><circle cx="${x}" cy="${y}" r="${14+Math.min(8,(g.caseIds||[]).length*2)}" class="node ${i%4===1?'node-soft':i%4===2?'node-copper':i%4===3?'node-green':''}"/><text x="${x}" y="${y+32}" text-anchor="middle">${esc((loc(g.label,l)||'').slice(0,20))}</text></g>`).join('')}
 </svg></div>
 <div class="civ-structured__note"><strong>${esc(l==='zh-Hans'?'网络视图':'Network view')}</strong><span>${esc(l==='zh-Hans'?'节点位置用于结构阅读，不代表精确地理坐标或现代国界。':'Node placement supports structural reading; it does not represent precise geography or modern borders.')}</span></div>
 <div class="civ-structured__matrix">${groups.map(g=>`<article class="civ-structured__card"><h5>${esc(loc(g.label,l))}</h5><p>${esc((g.caseIds||[]).join(' · '))}</p></article>`).join('')}</div>`:''}</section>`;
 container.querySelectorAll('[data-snapshot]').forEach(b=>b.onclick=()=>{const s=snaps.find(x=>x.snapshotId===b.dataset.snapshot);if(s)onStateChange({snapshotId:s.snapshotId,time:s.year,caseIds:s.majorCaseIds||[],primaryCaseId:s.majorCaseIds?.[0]||null},{source:'premium-world'});});
}
function trajectories(container,data,state,l,onStateChange){
 const all=data.trajectories?.trajectories||[]; let ids=state.trajectoryIds?.length?state.trajectoryIds:all.slice(0,4).map(t=>t.trajectoryId);
 const selected=all.filter(t=>ids.includes(t.trajectoryId)).slice(0,6);
 const vals=selected.flatMap(t=>(t.series||[]).map(p=>Number(p.index)).filter(Number.isFinite)); const min=vals.length?Math.min(...vals):0,max=vals.length?Math.max(...vals):100;
 container.innerHTML=`<section class="civ-structured" data-structured-layer="trajectories">${head(l,'长时段轨迹场','Long-Duration Trajectory Field','不同证据等级保持不同线型；曲线表达长期方向，不把文明压成一个总分。','Authority classes retain distinct line grammars; trajectories show long-run direction without collapsing civilization into one score.','16 Trajectories','16 Trajectories')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 250" role="img" aria-label="${esc(l==='zh-Hans'?'文明长时段轨迹':'Long-duration civilization trajectories')}">${defs()}
 ${[45,90,135,180,225].map(y=>`<line x1="34" y1="${y}" x2="726" y2="${y}" class="grid"/>`).join('')}
 <line x1="34" y1="220" x2="726" y2="220" class="axis"/>
 ${selected.map((t,i)=>`<polyline points="${linePoints(t.series,min,max,720,220)}" class="${t.authorityClass==='CONCEPTUAL_TRAJECTORY'?'conceptual':t.authorityClass==='HISTORICAL_RECONSTRUCTION'?'reconstructed':'evidence'} series-${i}"><title>${esc(loc(t.title,l))} · ${esc(t.authorityClass)}</title></polyline>`).join('')}
 </svg></div>
 <div class="civ-structured__legend"><span><i></i>${l==='zh-Hans'?'资料系列':'Evidence series'}</span><span><i class="band"></i>${l==='zh-Hans'?'历史重建':'Historical reconstruction'}</span><span><i class="dash"></i>${l==='zh-Hans'?'概念轨迹':'Conceptual trajectory'}</span></div>
 <div class="civ-structured__controls">${all.map(t=>`<button data-traj="${esc(t.trajectoryId)}" aria-pressed="${ids.includes(t.trajectoryId)}">${esc(loc(t.title,l))}</button>`).join('')}</div></section>`;
 container.querySelectorAll('[data-traj]').forEach(b=>b.onclick=()=>{const set=new Set(ids);set.has(b.dataset.traj)?set.delete(b.dataset.traj):set.add(b.dataset.traj);onStateChange({trajectoryIds:[...set].slice(0,6)},{source:'premium-trajectories'});});
}
function transitions(container,data,state,l,onStateChange){
 const ws=data.transitions?.transitionWindows||[]; const active=ws.find(w=>w.transitionWindowId===state.transitionWindowId)||ws[0];
 const steps=active?[['Before',active.beforeState],['Pressure',active.pressure],['Threshold',active.threshold],['Transition',active.transition],['Capacity',active.newCapacity],['Load',active.newLoad],['Irreversible',active.irreversibility],['Successor',active.successorReality]]:[];
 container.innerHTML=`<section class="civ-structured" data-structured-layer="transitions">${head(l,'文明转型窗口','Civilization Transition Windows','把 Before → Pressure → Threshold → Transition → Successor 变成可视化运行路径。','Turns Before → Pressure → Threshold → Transition → Successor into a visible runtime path.','32 Windows','32 Windows')}
 <div class="civ-structured__controls">${ws.map(w=>`<button data-tw="${esc(w.transitionWindowId)}" aria-pressed="${w.transitionWindowId===active?.transitionWindowId}">${esc(w.transitionWindowId)} · ${esc(loc(w.title,l))}</button>`).join('')}</div>
 ${active?`<div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 190" role="img" aria-label="${esc(loc(active.title,l))}">${defs()}<path d="M55 95 H705" stroke="url(#atlasGoldLine)" stroke-width="2" fill="none"/>
 ${steps.map(([k],i)=>{const x=60+i*(640/7);return `<g><circle cx="${x}" cy="95" r="${i===2||i===3?17:12}" class="node ${i===2||i===3?'active':''}"/><text x="${x}" y="${i%2?145:50}" text-anchor="middle" class="${i===2||i===3?'label-strong':''}">${esc(k)}</text><line x1="${x}" y1="${i%2?110:80}" x2="${x}" y2="${i%2?130:64}" class="axis"/></g>`}).join('')}</svg></div>`:''}
 <div class="civ-structured__matrix">${steps.map(([k,v],i)=>`<article class="civ-structured__card"><small>${String(i+1).padStart(2,'0')}</small><h5>${esc(k)}</h5><p>${esc(loc(v,l))}</p></article>`).join('')}</div></section>`;
 container.querySelectorAll('[data-tw]').forEach(b=>b.onclick=()=>onStateChange({transitionWindowId:b.dataset.tw},{source:'premium-transition'}));
}
function loss(container,data,state,l,onStateChange){
 const fams=data.loss?.families||[],types=data.loss?.lossTypes||[]; const active=state.lossFamilyId||fams[0]?.familyId;
 const cx=380,cy=150,r=100;
 const pts=fams.map((f,i)=>({f,x:cx+Math.cos(-Math.PI/2+i*2*Math.PI/fams.length)*r,y:cy+Math.sin(-Math.PI/2+i*2*Math.PI/fams.length)*r}));
 container.innerHTML=`<section class="civ-structured" data-structured-layer="loss">${head(l,'文明逆转与损失图谱','Reversal & Loss Atlas','文明可能失去政权、人口、知识、网络或载体，同时仍有部分能力进入后继结构。','Civilizations may lose regime, population, knowledge, networks, or carriers while other capacities continue into successor structures.','6 × 24','6 × 24')}
 <div class="civ-structured__svg-wrap"><svg viewBox="0 0 760 300" role="img" aria-label="${esc(l==='zh-Hans'?'文明损失六大家族':'Six civilization loss families')}">${defs()}
 <circle cx="${cx}" cy="${cy}" r="122" class="orbit"/><circle cx="${cx}" cy="${cy}" r="48" fill="url(#atlasGlow)"/><circle cx="${cx}" cy="${cy}" r="16" class="node active"/><text x="${cx}" y="${cy+4}" text-anchor="middle" class="label-strong">${l==='zh-Hans'?'损失':'LOSS'}</text>
 ${pts.map(({f,x,y},i)=>{const a=f.familyId===active;const count=types.filter(t=>t.familyId===f.familyId).length;return `<g class="civ-svg-interactive" data-svg-loss-family="${esc(f.familyId)}" role="button" tabindex="0" aria-label="${esc(loc(f.title,l))}"><line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="link ${a?'active':''}"/><circle cx="${x}" cy="${y}" r="${a?27:22}" class="node ${a?'active':i%3===1?'node-copper':i%3===2?'node-violet':''}"/><text x="${x}" y="${y+4}" text-anchor="middle" class="${a?'label-strong':''}">${count}</text><text x="${x}" y="${y+40}" text-anchor="middle">${esc((loc(f.title,l)||'').slice(0,17))}</text></g>`}).join('')}
 </svg></div>
 <div class="civ-structured__matrix">${fams.map(f=>{const list=types.filter(t=>t.familyId===f.familyId);return `<button class="civ-structured__card" data-loss-family="${esc(f.familyId)}" aria-pressed="${f.familyId===active}"><h5>${esc(loc(f.title,l))}</h5><p>${esc(loc(f.description,l))}</p><small>${list.length} ${l==='zh-Hans'?'种损失类型':'loss types'}</small></button>`}).join('')}</div></section>`;
 const choose=id=>onStateChange({lossFamilyId:id,lossTypeId:null},{source:'premium-loss'});
 container.querySelectorAll('[data-loss-family]').forEach(b=>b.onclick=()=>choose(b.dataset.lossFamily));
 wireSvg(container,'[data-svg-loss-family]',el=>choose(el.dataset.svgLossFamily));
}
export function renderStructuredAtlasVisual(container,{data={},state={},locale='en',onStateChange=()=>{}}={}){
 if(!container)return; ensureStyle(); const l=locale==='zh-Hans'?'zh-Hans':'en';
 const fn={timeline,cases,comparison,world,trajectories,transitions,loss}[state.activeLayer]||timeline;
 fn(container,data,state,l,onStateChange);
}
