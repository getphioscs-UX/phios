import {resolveAtlasVisualById} from './atlas-static-visual.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const loc=(v,l)=>v?.[l]??v?.en??'';
const COPY={en:{evidence:'Authority',method:'Method',uncertainty:'Uncertainty'},'zh-Hans':{evidence:'证据类型',method:'方法说明',uncertainty:'不确定性'}};
function authority(v,l){const m={EVIDENCE_SERIES:{en:'Evidence series','zh-Hans':'资料系列'},HISTORICAL_RECONSTRUCTION:{en:'Historical reconstruction','zh-Hans':'历史重建'},CONCEPTUAL_TRAJECTORY:{en:'Conceptual trajectory','zh-Hans':'概念轨迹'}};return m[v]?.[l]||v;}
const year=(v,l)=>Number(v)<0?(l==='zh-Hans'?`公元前${Math.abs(Number(v))}年`:`${Math.abs(Number(v))} BCE`):(l==='zh-Hans'?`公元${Number(v)}年`:`${Number(v)} CE`);
function points(series=[]){
  const valid=series.map(p=>({year:Number(p.year),value:Number(p.index)})).filter(p=>Number.isFinite(p.year)&&Number.isFinite(p.value));
  if(!valid.length) return '';
  const minYear=Math.min(...valid.map(p=>p.year)),maxYear=Math.max(...valid.map(p=>p.year));
  const minVal=Math.min(...valid.map(p=>p.value)),maxVal=Math.max(...valid.map(p=>p.value));
  const dx=Math.max(1,maxYear-minYear),dy=Math.max(1,maxVal-minVal);
  return valid.map(p=>{
    const x=((p.year-minYear)/dx)*1000;
    const y=340-((p.value-minVal)/dy)*280;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}
function graph(t,l){
  const cls=t.authorityClass==='CONCEPTUAL_TRAJECTORY'?'is-conceptual':t.authorityClass==='HISTORICAL_RECONSTRUCTION'?'is-reconstructed':'is-evidence';
  const first=t.series?.[0],last=t.series?.at(-1);
  return `<div class="civ-trajectory-panel__graph">
    <svg viewBox="0 0 1000 380" preserveAspectRatio="none" role="img" aria-label="${esc(loc(t.title,l))}">
      <g class="civ-trajectory-panel__grid">
        <line x1="0" y1="60" x2="1000" y2="60"/><line x1="0" y1="130" x2="1000" y2="130"/><line x1="0" y1="200" x2="1000" y2="200"/><line x1="0" y1="270" x2="1000" y2="270"/><line x1="0" y1="340" x2="1000" y2="340"/>
      </g>
      <polyline class="civ-trajectory-panel__line ${cls}" points="${points(t.series)}"></polyline>
    </svg>
    <div class="civ-trajectory-panel__range"><span>${esc(first?year(first.year,l):'—')}</span><span>${esc(last?year(last.year,l):'—')}</span></div>
  </div>`;
}
export function renderTrajectories(root,{registry,visualBindings,state,locale='en',onToggle=()=>{}}={}){
  const l=locale==='zh-Hans'?'zh-Hans':'en',c=COPY[l],items=registry?.trajectories||[];
  const focusedId=state.trajectoryIds?.[0]||items[0]?.trajectoryId||null;
  const visual=id=>{const a=visualBindings?.assets?.find(x=>x.family==='TRAJECTORY_MOTIF'&&x.subjectId===id);return a?resolveAtlasVisualById(visualBindings,a.assetId):null;};
  root.innerHTML=`<div class="civ-trajectories civ-trajectories--system">
    <div class="civ-trajectories__intro">
      <p class="knowledge-eyebrow">${esc(l==='zh-Hans'?'16 条长时段轨迹':'16 long-duration trajectories')}</p>
      <h4>${esc(l==='zh-Hans'?'每一条轨迹都由自己的视觉底层、动态曲线与证据说明组成。':'Each trajectory combines its own visual foundation, dynamic curve, and evidence notes.')}</h4>
      <p>${esc(l==='zh-Hans'?'所有曲线都来自当前 trajectory registry；这些指数用于观察相对变化，不是统一文明总分。':'All curves come from the current trajectory registry. The indexes show relative change and are not a unified civilization score.')}</p>
    </div>
    <div class="civ-trajectory-panel-grid">
      ${items.map(t=>{const v=visual(t.trajectoryId),active=t.trajectoryId===focusedId;return `<article class="civ-trajectory-panel${active?' is-active':''}" data-authority="${esc(t.authorityClass)}" data-trajectory-panel="${esc(t.trajectoryId)}">
        <button type="button" class="civ-trajectory-panel__focus" data-trajectory-focus="${esc(t.trajectoryId)}" aria-pressed="${active?'true':'false'}">
          <div class="civ-trajectory-panel__visual">${v?`<img src="${esc(v.publicUrl)}" alt="" loading="lazy" decoding="async">`:''}${graph(t,l)}</div>
          <div class="civ-trajectory-panel__copy"><p class="knowledge-eyebrow">${esc(authority(t.authorityClass,l))}</p><h5>${esc(loc(t.title,l))}</h5><p>${esc(loc(t.description,l))}</p></div>
        </button>
        <details class="civ-trajectory-panel__details"><summary>${esc(l==='zh-Hans'?'方法与不确定性':'Method & uncertainty')}</summary><dl class="civ-atlas-meta"><div><dt>${esc(c.method)}</dt><dd>${esc(loc(t.methodNote,l))}</dd></div><div><dt>${esc(c.uncertainty)}</dt><dd>${esc(loc(t.uncertaintyNote,l))}</dd></div></dl></details>
      </article>`}).join('')}
    </div>
  </div>`;
  root.querySelectorAll('[data-trajectory-focus]').forEach(button=>button.addEventListener('click',()=>onToggle([button.dataset.trajectoryFocus])));
  return items.filter(t=>t.trajectoryId===focusedId);
}
export function renderTrajectoryInspector(root,{trajectories=[],locale='en'}={}){
  const l=locale==='zh-Hans'?'zh-Hans':'en'; if(!root||!trajectories.length)return;
  const t=trajectories[0];
  root.innerHTML=`<div class="civ-atlas-inspector__summary"><p class="knowledge-eyebrow">${esc(l==='zh-Hans'?'当前轨迹':'Current trajectory')}</p><h3>${esc(loc(t.title,l))}</h3><p>${esc(authority(t.authorityClass,l))}</p></div>`;
}
