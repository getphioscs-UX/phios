const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const layerTitle=(id,l)=>({timeline:{en:'Civilization Timeline','zh-Hans':'文明历史脊柱'},cases:{en:'Civilization Case Registry','zh-Hans':'文明案例注册表'},comparison:{en:'Comparison Families','zh-Hans':'比较家族'},world:{en:'World Snapshot','zh-Hans':'世界横切面'},trajectories:{en:'Long-Duration Trajectories','zh-Hans':'长时段轨迹'},transitions:{en:'Civilization Transition Windows','zh-Hans':'文明转型窗口'},loss:{en:'Reversal & Loss Atlas','zh-Hans':'文明逆转与损失图谱'}}[id]?.[l]||id);
function posterFor(config,state){
  if(!config) return null;
  if(config.layerId==='world') return (config.posters||[]).find(x=>x.snapshotId===state.snapshotId)||(config.posters||[])[0]||null;
  return config.poster||null;
}
export function renderAtlasVisualProjection(container,{projection,state,locale='en'}={}){
  if(!container) return;
  const l=locale==='zh-Hans'?'zh-Hans':'en';
  const config=(projection?.layers||[]).find(x=>x.layerId===state.activeLayer);
  const poster=posterFor(config,state);
  if(!config||!poster){container.hidden=true;container.innerHTML='';return;}
  container.hidden=false;
  container.innerHTML=`<section class="civ-atlas-visual" data-atlas-visual data-layer="${esc(state.activeLayer)}">
    <div class="civ-atlas-visual__heading"><div><p class="knowledge-eyebrow">${esc(l==='zh-Hans'?'动态视觉导览':'Visual orientation')}</p><h4>${esc(layerTitle(state.activeLayer,l))}</h4></div>
    <div class="civ-atlas-visual__actions"><button type="button" class="knowledge-action knowledge-action--quiet" data-visual-expand>${esc(l==='zh-Hans'?'全屏查看':'Open full screen')}</button></div></div>
    <div class="civ-atlas-visual__frame" data-visual-frame>
      <img src="${esc(poster.publicUrl)}" alt="${esc(layerTitle(state.activeLayer,l))}" loading="lazy" decoding="async" data-atlas-poster>
      <div class="civ-atlas-visual__fallback" data-visual-fallback hidden><strong>${esc(l==='zh-Hans'?'视觉海报尚未部署':'Visual poster not deployed yet')}</strong><p>${esc(l==='zh-Hans'?'结构化文明图谱仍可正常使用；海报只是导览，不是历史资料来源。':'The structured Atlas remains fully usable. The poster is orientation only and is not historical authority.')}</p></div>
    </div>
    <p class="civ-atlas-note">${esc(l==='zh-Hans'?'海报用于导览；下方 Registry 驱动的互动内容与证据状态才是正式资料。':'Poster is for orientation. Registry-driven interaction and evidence states below remain authoritative.')}</p>
  </section>`;
  const img=container.querySelector('[data-atlas-poster]');
  const fallback=container.querySelector('[data-visual-fallback]');
  img?.addEventListener('error',()=>{img.hidden=true; fallback.hidden=false; container.dataset.posterState='fallback';},{once:true});
  img?.addEventListener('load',()=>{container.dataset.posterState='ready';},{once:true});
  container.querySelector('[data-visual-expand]')?.addEventListener('click',()=>openPosterViewer({src:poster.publicUrl,alt:layerTitle(state.activeLayer,l),locale:l}));
}
export function openPosterViewer({src,alt='',locale='en'}={}){
  const old=document.querySelector('[data-atlas-poster-dialog]'); if(old) old.remove();
  const dialog=document.createElement('dialog'); dialog.className='civ-atlas-poster-dialog'; dialog.dataset.atlasPosterDialog='';
  dialog.innerHTML=`<div class="civ-atlas-poster-dialog__bar"><strong>${esc(alt)}</strong><button type="button" data-close>${esc(locale==='zh-Hans'?'关闭':'Close')}</button></div><div class="civ-atlas-poster-dialog__viewport"><img src="${esc(src)}" alt="${esc(alt)}" decoding="async"></div>`;
  document.body.append(dialog); dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close()); dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.showModal();
}
