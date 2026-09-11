import {renderTimeline} from './timeline-renderer.js';
import {renderCases,renderCaseInspector} from './cases-renderer.js';
import {renderComparison,renderComparisonInspector} from './comparison-renderer.js';
import {renderWorldSlice,renderWorldInspector} from './world-slice-renderer.js';
const COPY={
  en:{eyebrow:'Civilization Atlas Explorer',title:'Explore the world through seven lenses.',lead:'Move across time, cases, comparison, world slices, long trends, transitions, and reversal without losing your current context.',read:'Read the book',layers:'Atlas layers',inspector:'Current context',empty:'This layer shell is ready. Historical content is activated in its assigned Atlas wave.',evidence:'Evidence and unknown states stay explicit as each layer is activated.',open:'Open layer'},
  'zh-Hans':{eyebrow:'文明图谱探索器',title:'用七种视角探索同一个文明现实。',lead:'在历史脊柱、文明案例、比较家族、世界横切面、长时段轨迹、转型窗口与逆转损失之间切换，同时保留当前 Context。',read:'阅读《世界如何分化》',layers:'图谱层',inspector:'当前 Context',empty:'这一层的探索外壳已经就绪；历史内容将在对应 Atlas 阶段正式激活。',evidence:'每一层正式激活时，证据状态与未知边界都会明确保留。',open:'打开图谱层'}
};
const LAYERS={timeline:{en:'Timeline','zh-Hans':'历史脊柱'},cases:{en:'Cases','zh-Hans':'文明案例'},comparison:{en:'Comparison','zh-Hans':'比较家族'},world:{en:'World Slices','zh-Hans':'世界横切面'},trajectories:{en:'Long Trends','zh-Hans':'长时段轨迹'},transitions:{en:'Transitions','zh-Hans':'转型窗口'},loss:{en:'Reversal & Loss','zh-Hans':'逆转与损失'}};
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
export function renderAtlasShell(root,state,{locale='en',data={},onLayerChange=()=>{},onStateChange=()=>{}}={}){
  if(!root) return; const lang=locale==='zh-Hans'?'zh-Hans':'en'; const c=COPY[lang];
  root.innerHTML=`<div class="knowledge-shell civ-atlas-shell"><div class="civ-atlas-shell__intro"><div><p class="knowledge-eyebrow">${esc(c.eyebrow)}</p><h2>${esc(c.title)}</h2><p>${esc(c.lead)}</p></div><a class="knowledge-action" href="#book-parts">${esc(c.read)}</a></div><div class="civ-atlas-layout"><nav class="civ-atlas-layers" aria-label="${esc(c.layers)}">${Object.entries(LAYERS).map(([id,label])=>`<button type="button" class="civ-atlas-layer${state.activeLayer===id?' is-active':''}" data-atlas-layer="${id}" aria-pressed="${state.activeLayer===id?'true':'false'}"><span>${esc(label[lang])}</span><small>L${['timeline','cases','comparison','world','trajectories','transitions','loss'].indexOf(id)+2}</small></button>`).join('')}</nav><section class="civ-atlas-canvas" aria-live="polite" aria-labelledby="civ-atlas-active-title"><p class="knowledge-eyebrow">${esc(c.open)}</p><h3 id="civ-atlas-active-title">${esc(LAYERS[state.activeLayer]?.[lang]||LAYERS.timeline[lang])}</h3><div data-atlas-layer-content></div></section><aside class="civ-atlas-inspector" aria-labelledby="civ-atlas-inspector-title" data-atlas-inspector><h3 id="civ-atlas-inspector-title">${esc(c.inspector)}</h3><dl><div><dt>Layer</dt><dd>${esc(LAYERS[state.activeLayer]?.[lang]||state.activeLayer)}</dd></div>${state.time!==null?`<div><dt>Time</dt><dd>${esc(state.time)}</dd></div>`:''}${state.primaryCaseId?`<div><dt>Case</dt><dd>${esc(state.primaryCaseId)}</dd></div>`:''}</dl></aside></div></div>`;
  root.querySelectorAll('[data-atlas-layer]').forEach(button=>button.addEventListener('click',()=>onLayerChange(button.dataset.atlasLayer)));
  const content=root.querySelector('[data-atlas-layer-content]'); const inspector=root.querySelector('[data-atlas-inspector]');
  if(state.activeLayer==='timeline'&&data.timeline){
    renderTimeline(content,{registry:data.timeline,state,locale:lang,onPeriodSelect:p=>onStateChange({timeWindowId:p.periodId,time:p.startYear,caseIds:p.caseIds||[],primaryCaseId:p.caseIds?.[0]||null},{source:'timeline-period'}),onCaseSelect:id=>onStateChange({activeLayer:'cases',primaryCaseId:id,caseIds:[id]},{source:'timeline-case'})});
  }else if(state.activeLayer==='cases'&&data.cases){
    const active=renderCases(content,{registry:data.cases,state,locale:lang,onCaseSelect:id=>onStateChange({primaryCaseId:id,caseIds:[id]},{source:'case-select'}),onCompareToggle:id=>{const current=new Set(state.compareBasket||[]); current.has(id)?current.delete(id):current.add(id); onStateChange({compareBasket:[...current].slice(0,6)},{source:'case-compare'});},onSearchChange:q=>onStateChange({caseSearch:q},{source:'case-search'})});
    renderCaseInspector(inspector,{caseRecord:active,state,locale:lang});
  }else if(state.activeLayer==='comparison'&&data.comparison&&data.cases){
    const family=renderComparison(content,{registry:data.comparison,casesRegistry:data.cases,state,locale:lang,onFamilySelect:id=>onStateChange({comparisonFamilyId:id},{source:'comparison-family'}),onCaseSelect:id=>onStateChange({activeLayer:'cases',primaryCaseId:id,caseIds:[id]},{source:'comparison-case'}),onCompareToggle:id=>{const current=new Set(state.compareBasket||[]); current.has(id)?current.delete(id):current.add(id); onStateChange({compareBasket:[...current].slice(0,6)},{source:'comparison-basket'});}});
    renderComparisonInspector(inspector,{family,state,locale:lang});
  }else if(state.activeLayer==='world'&&data.world&&data.cases){
    const snapshot=renderWorldSlice(content,{registry:data.world,casesRegistry:data.cases,state,locale:lang,onSnapshotSelect:s=>onStateChange({snapshotId:s.snapshotId,time:s.year,caseIds:s.majorCaseIds||[],primaryCaseId:s.majorCaseIds?.[0]||null},{source:'world-snapshot'}),onCaseSelect:id=>onStateChange({activeLayer:'cases',primaryCaseId:id,caseIds:[id]},{source:'world-case'})});
    renderWorldInspector(inspector,{snapshot,locale:lang});
  }else{
    content.innerHTML=`<div class="civ-atlas-empty"><span aria-hidden="true">Φ</span><p>${esc(c.empty)}</p><small>${esc(c.evidence)}</small></div>`;
  }
}
