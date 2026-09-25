const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const loc=(v,l)=>v?.[l]||v?.en||v?.['zh-Hans']||'';
const layerTitle=(id,l)=>({timeline:{en:'Civilization Timeline','zh-Hans':'文明历史脊柱'},cases:{en:'Civilization Case Registry','zh-Hans':'文明案例注册表'},comparison:{en:'Comparison Families','zh-Hans':'比较家族'},world:{en:'World Snapshot','zh-Hans':'世界横切面'},trajectories:{en:'Long-Duration Trajectories','zh-Hans':'长时段轨迹'},transitions:{en:'Civilization Transition Windows','zh-Hans':'文明转型窗口'},loss:{en:'Reversal & Loss Atlas','zh-Hans':'文明逆转与损失图谱'}}[id]?.[l]||id);

function posterFor(config,state){
  if(!config) return null;
  if(config.layerId==='world') return (config.posters||[]).find(x=>x.snapshotId===state.snapshotId)||(config.posters||[])[0]||null;
  return config.poster||null;
}
function pct(v){return `${Number(v||0)*100}%`;}
function slotStyle(slot){
  return `left:${pct(slot.left)};top:${pct(slot.top)};width:${pct(slot.width)};height:${pct(slot.height)}`;
}
function linePoints(series,minYear,maxYear,minVal,maxVal){
  const dx=Math.max(1,maxYear-minYear),dy=Math.max(1,maxVal-minVal);
  return (series||[]).map(p=>{
    const year=Number(p.year),val=Number(p.index);
    if(!Number.isFinite(year)||!Number.isFinite(val)) return null;
    const x=((year-minYear)/dx)*1000;
    const y=360-((val-minVal)/dy)*320;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).filter(Boolean).join(' ');
}
function trajectoryOverlay(data,state,locale,slot){
  const all=data?.trajectories?.trajectories||[];
  const ids=state.trajectoryIds?.length?state.trajectoryIds:all.slice(0,6).map(x=>x.trajectoryId);
  const selected=all.filter(t=>ids.includes(t.trajectoryId)).slice(0,6);
  const points=selected.flatMap(t=>(t.series||[]).map(p=>({year:Number(p.year),value:Number(p.index)}))).filter(p=>Number.isFinite(p.year)&&Number.isFinite(p.value));
  if(!selected.length||!points.length) return '';
  const minYear=Math.min(...points.map(p=>p.year)),maxYear=Math.max(...points.map(p=>p.year));
  const minVal=Math.min(...points.map(p=>p.value)),maxVal=Math.max(...points.map(p=>p.value));
  const lines=selected.map((t,i)=>{
    const authority=t.authorityClass||'';
    const cls=authority==='CONCEPTUAL_TRAJECTORY'?'is-conceptual':authority==='HISTORICAL_RECONSTRUCTION'?'is-reconstructed':'is-evidence';
    return `<polyline class="civ-template-trajectory-line ${cls} series-${i}" points="${linePoints(t.series,minYear,maxYear,minVal,maxVal)}"><title>${esc(loc(t.title,locale))}</title></polyline>`;
  }).join('');
  return `<div class="civ-template-slot civ-template-slot--trajectory" data-template-slot="trajectoryGraph" style="${slotStyle(slot)}">
    <svg viewBox="0 0 1000 400" preserveAspectRatio="none" role="img" aria-label="${esc(locale==='zh-Hans'?'动态长时段轨迹图':'Dynamic long-duration trajectory graph')}">
      <g class="civ-template-trajectory-grid">
        <line x1="0" y1="40" x2="1000" y2="40"/><line x1="0" y1="120" x2="1000" y2="120"/><line x1="0" y1="200" x2="1000" y2="200"/><line x1="0" y1="280" x2="1000" y2="280"/><line x1="0" y1="360" x2="1000" y2="360"/>
      </g>
      ${lines}
    </svg>
  </div>`;
}
export function renderAtlasVisualProjection(container,{projection,slots,data={},state,locale='en'}={}){
  if(!container) return;
  const l=locale==='zh-Hans'?'zh-Hans':'en';
  const config=(projection?.layers||[]).find(x=>x.layerId===state.activeLayer);
  const slotConfig=slots?.layers?.[state.activeLayer]||null;
  const poster=posterFor(config,state);
  if(!config||!slotConfig||!poster){container.hidden=true;container.innerHTML='';return;}
  const overlays=[];
  if(state.activeLayer==='trajectories'&&slotConfig.slots?.trajectoryGraph){
    overlays.push(trajectoryOverlay(data,state,l,slotConfig.slots.trajectoryGraph));
  }
  container.hidden=false;
  container.innerHTML=`<section class="civ-template-board" data-atlas-template-board data-layer="${esc(state.activeLayer)}">
    <div class="civ-template-board__heading">
      <div><p class="knowledge-eyebrow">${esc(l==='zh-Hans'?'Library 模板布局':'Library template layout')}</p><h4>${esc(layerTitle(state.activeLayer,l))}</h4></div>
      <button type="button" class="knowledge-action knowledge-action--quiet" data-template-expand>${esc(l==='zh-Hans'?'全屏查看':'Open full screen')}</button>
    </div>
    <div class="civ-template-board__stage" style="aspect-ratio:${slotConfig.referenceSize.width}/${slotConfig.referenceSize.height}">
      <img src="${esc(poster.publicUrl)}" alt="${esc(layerTitle(state.activeLayer,l))}" loading="eager" decoding="async" data-template-image>
      ${overlays.join('')}
      <div class="civ-template-board__fallback" data-template-fallback hidden><strong>${esc(l==='zh-Hans'?'模板视觉暂时无法载入':'Template visual unavailable')}</strong><p>${esc(l==='zh-Hans'?'下方 Registry 驱动内容仍可正常使用。':'Registry-driven content below remains available.')}</p></div>
    </div>
    <p class="civ-template-board__note">${esc(l==='zh-Hans'?'WebP 定义版式与视觉语法；动态 HTML / SVG 只写入已登记的预留区域，正式文字与数据仍来自 Registry。':'The WebP defines composition and visual grammar. Dynamic HTML/SVG is written only into registered reserved slots; canonical text and data remain registry-driven.')}</p>
  </section>`;
  const img=container.querySelector('[data-template-image]'),fallback=container.querySelector('[data-template-fallback]');
  img?.addEventListener('error',()=>{img.hidden=true;fallback.hidden=false;container.dataset.templateState='fallback';},{once:true});
  img?.addEventListener('load',()=>{container.dataset.templateState='ready';},{once:true});
  container.querySelector('[data-template-expand]')?.addEventListener('click',()=>openPosterViewer({src:poster.publicUrl,alt:layerTitle(state.activeLayer,l),locale:l}));
}
export function openPosterViewer({src,alt='',locale='en'}={}){
  const old=document.querySelector('[data-atlas-poster-dialog]'); if(old) old.remove();
  const dialog=document.createElement('dialog'); dialog.className='civ-atlas-poster-dialog'; dialog.dataset.atlasPosterDialog='';
  dialog.innerHTML=`<div class="civ-atlas-poster-dialog__bar"><strong>${esc(alt)}</strong><button type="button" data-close>${esc(locale==='zh-Hans'?'关闭':'Close')}</button></div><div class="civ-atlas-poster-dialog__viewport"><img src="${esc(src)}" alt="${esc(alt)}" decoding="async"></div>`;
  document.body.append(dialog);dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
}
