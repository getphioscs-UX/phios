const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const loc=(v,l)=>v?.[l]??v?.en??'';
const COPY={en:{pick:'Choose trajectories',evidence:'Authority',method:'Method',uncertainty:'Uncertainty',concept:'Conceptual — not a measured historical score',range:'Reconstructed range / normalized trend'},'zh-Hans':{pick:'选择轨迹',evidence:'证据类型',method:'方法说明',uncertainty:'不确定性',concept:'概念轨迹——不是历史统计总分',range:'历史重建范围／标准化趋势'}};
function authority(v,l){const m={EVIDENCE_SERIES:{en:'Evidence series','zh-Hans':'资料系列'},HISTORICAL_RECONSTRUCTION:{en:'Historical reconstruction','zh-Hans':'历史重建'},CONCEPTUAL_TRAJECTORY:{en:'Conceptual trajectory','zh-Hans':'概念轨迹'}};return m[v]?.[l]||v;}
export function renderTrajectories(root,{registry,state,locale='en',onToggle=()=>{}}={}){
 const l=locale==='zh-Hans'?'zh-Hans':'en',c=COPY[l],items=registry?.trajectories||[],selected=(state.trajectoryIds?.length?state.trajectoryIds:items.slice(0,1).map(x=>x.trajectoryId)).slice(0,5);
 const current=items.filter(t=>selected.includes(t.trajectoryId));
 root.innerHTML=`<div class="civ-trajectories">
  <div class="civ-trajectory-list">${current.map(t=>`<article class="civ-trajectory-card civ-trajectory-card--reader" data-authority="${esc(t.authorityClass)}"><header><div><p class="knowledge-eyebrow">${esc(authority(t.authorityClass,l))}</p><h4>${esc(loc(t.title,l))}</h4></div></header><p class="civ-trajectory-lead">${esc(loc(t.description,l))}</p><details class="civ-trajectory-data"><summary>${esc(l==='zh-Hans'?'查看长期曲线与方法说明':'View long-run curve and method')}</summary><div class="civ-trajectory-spark" role="img" aria-label="${esc(loc(t.title,l))}">${(t.series||[]).map(p=>`<span style="--v:${Math.max(2,Math.min(100,Number(p.index)||0))}%" title="${esc(p.year)}: ${esc(p.index)}"></span>`).join('')}</div><dl class="civ-atlas-meta"><div><dt>${esc(c.method)}</dt><dd>${esc(loc(t.methodNote,l))}</dd></div><div><dt>${esc(c.uncertainty)}</dt><dd>${esc(loc(t.uncertaintyNote,l))}</dd></div></dl></details></article>`).join('')}</div>
  <nav class="civ-trajectory-navigator" aria-label="${esc(c.pick)}"><p class="civ-atlas-nav-label">${esc(l==='zh-Hans'?'选择要一起阅读的长期轨迹（最多 5 条）':'Choose long-run trajectories to read together (up to 5)')}</p><div class="civ-trajectory-picker">${items.map(t=>`<label><input type="checkbox" value="${esc(t.trajectoryId)}" ${selected.includes(t.trajectoryId)?'checked':''}><span>${esc(loc(t.title,l))}</span><small>${esc(authority(t.authorityClass,l))}</small></label>`).join('')}</div></nav>
  <p class="civ-atlas-note">${esc(l==='zh-Hans'?'不同权威类型不会被压成同一文明分数。':'Different authority classes are never collapsed into one civilization score.')}</p>
 </div>`;
 root.querySelectorAll('.civ-trajectory-picker input').forEach(input=>input.addEventListener('change',()=>{let next=[...root.querySelectorAll('.civ-trajectory-picker input:checked')].map(x=>x.value);if(next.length>5){input.checked=false;next=next.filter(x=>x!==input.value);}if(!next.length){input.checked=true;next=[input.value];}onToggle(next);}));
 return current;
}
export function renderTrajectoryInspector(root,{trajectories=[],locale='en'}={}){
 const l=locale==='zh-Hans'?'zh-Hans':'en'; if(!root||!trajectories.length)return;
 root.innerHTML=`<h3>${esc(l==='zh-Hans'?'长时段轨迹':'Long-Duration Trajectories')}</h3>${trajectories.map(t=>`<section><h4>${esc(loc(t.title,l))}</h4><p><strong>${esc(authority(t.authorityClass,l))}</strong></p><p>${esc(loc(t.uncertaintyNote,l))}</p></section>`).join('')}`;
}
