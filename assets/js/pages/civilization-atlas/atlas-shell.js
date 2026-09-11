import {renderTimeline} from './timeline-renderer.js';
import {renderCases,renderCaseInspector} from './cases-renderer.js';
import {renderComparison,renderComparisonInspector} from './comparison-renderer.js';
import {renderWorldSlice,renderWorldInspector} from './world-slice-renderer.js';
import {renderTrajectories,renderTrajectoryInspector} from './trajectory-renderer.js';
import {renderTransitions,renderTransitionInspector} from './transition-renderer.js';
import {renderLossAtlas,renderLossInspector} from './loss-renderer.js';
import {buildAtlasAskUrl} from './atlas-ask-context.js';
import {wireAtlasKeyboardNavigation,ensureAtlasInteractiveNames} from './atlas-accessibility.js';
const COPY={
  en:{skip:'Skip to Atlas content',ask:'Ask PHI OS about this',eyebrow:'Civilization Atlas Explorer',title:'Explore the world through seven lenses.',lead:'Move across time, cases, comparison, world slices, long trends, transitions, and reversal without losing your current context.',read:'Read the book',layers:'Atlas layers',inspector:'Current context',empty:'This layer shell is ready. Historical content is activated in its assigned Atlas wave.',evidence:'Evidence and unknown states stay explicit as each layer is activated.',open:'Open layer'},
  'zh-Hans':{skip:'跳到图谱内容',ask:'问 PHI OS 当前图谱',eyebrow:'文明图谱探索器',title:'用七种视角探索同一个文明现实。',lead:'在历史脊柱、文明案例、比较家族、世界横切面、长时段轨迹、转型窗口与逆转损失之间切换，同时保留当前 Context。',read:'阅读《世界如何分化》',layers:'图谱层',inspector:'当前 Context',empty:'这一层的探索外壳已经就绪；历史内容将在对应 Atlas 阶段正式激活。',evidence:'每一层正式激活时，证据状态与未知边界都会明确保留。',open:'打开图谱层'}
};
const LAYERS={timeline:{en:'Timeline','zh-Hans':'历史脊柱'},cases:{en:'Cases','zh-Hans':'文明案例'},comparison:{en:'Comparison','zh-Hans':'比较家族'},world:{en:'World Slices','zh-Hans':'世界横切面'},trajectories:{en:'Long Trends','zh-Hans':'长时段轨迹'},transitions:{en:'Transitions','zh-Hans':'转型窗口'},loss:{en:'Reversal & Loss','zh-Hans':'逆转与损失'}};
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
export function renderAtlasShell(root,state,{locale='en',data={},onLayerChange=()=>{},onStateChange=()=>{}}={}){
  if(!root) return; const lang=locale==='zh-Hans'?'zh-Hans':'en'; const c=COPY[lang];
  root.innerHTML=`<a class="civ-atlas-skip" href="#civ-atlas-active-title">${esc(c.skip)}</a><div class="knowledge-shell civ-atlas-shell"><div class="civ-atlas-shell__intro"><div><p class="knowledge-eyebrow">${esc(c.eyebrow)}</p><h2>${esc(c.title)}</h2><p>${esc(c.lead)}</p></div><a class="knowledge-action" href="#book-parts">${esc(c.read)}</a></div><div class="civ-atlas-layout"><nav class="civ-atlas-layers" data-atlas-layer-nav role="tablist" aria-label="${esc(c.layers)}">${Object.entries(LAYERS).map(([id,label])=>`<button type="button" role="tab" id="civ-atlas-tab-${id}" aria-controls="civ-atlas-panel" aria-selected="${state.activeLayer===id?'true':'false'}" tabindex="${state.activeLayer===id?'0':'-1'}" class="civ-atlas-layer${state.activeLayer===id?' is-active':''}" data-atlas-layer="${id}"><span>${esc(label[lang])}</span><small>L${['timeline','cases','comparison','world','trajectories','transitions','loss'].indexOf(id)+2}</small></button>`).join('')}</nav><section id="civ-atlas-panel" role="tabpanel" class="civ-atlas-canvas" aria-labelledby="civ-atlas-tab-${esc(state.activeLayer)} civ-atlas-active-title"><p class="knowledge-eyebrow">${esc(c.open)}</p><h3 id="civ-atlas-active-title">${esc(LAYERS[state.activeLayer]?.[lang]||LAYERS.timeline[lang])}</h3><div data-atlas-layer-content></div></section><aside class="civ-atlas-inspector" aria-labelledby="civ-atlas-inspector-title" data-atlas-inspector><h3 id="civ-atlas-inspector-title">${esc(c.inspector)}</h3><dl><div><dt>Layer</dt><dd>${esc(LAYERS[state.activeLayer]?.[lang]||state.activeLayer)}</dd></div>${state.time!==null?`<div><dt>Time</dt><dd>${esc(state.time)}</dd></div>`:''}${state.primaryCaseId?`<div><dt>Case</dt><dd>${esc(state.primaryCaseId)}</dd></div>`:''}</dl></aside></div></div>`;
  root.querySelectorAll('[data-atlas-layer]').forEach(button=>button.addEventListener('click',()=>onLayerChange(button.dataset.atlasLayer)));
  wireAtlasKeyboardNavigation(root,{onLayerActivate:id=>{if(id&&id!==state.activeLayer)onLayerChange(id);}});
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
  }else if(state.activeLayer==='trajectories'&&data.trajectories){
    const selected=renderTrajectories(content,{registry:data.trajectories,state,locale:lang,onToggle:ids=>onStateChange({trajectoryIds:ids},{source:'trajectory-select'})});
    renderTrajectoryInspector(inspector,{trajectories:selected,locale:lang});
  }else if(state.activeLayer==='transitions'&&data.transitions){
    const active=renderTransitions(content,{registry:data.transitions,state,locale:lang,onSelect:id=>onStateChange({transitionWindowId:id},{source:'transition-select'})});
    renderTransitionInspector(inspector,{windowRecord:active,locale:lang});
  }else if(state.activeLayer==='loss'&&data.loss){
    const selection=renderLossAtlas(content,{registry:data.loss,state,locale:lang,onFamilySelect:id=>onStateChange({lossFamilyId:id,lossTypeId:null},{source:'loss-family'}),onLossSelect:id=>onStateChange({lossTypeId:id},{source:'loss-type'})});
    renderLossInspector(inspector,{selection,locale:lang});
  }else{
    content.innerHTML=`<div class="civ-atlas-empty"><span aria-hidden="true">Φ</span><p>${esc(c.empty)}</p><small>${esc(c.evidence)}</small></div>`;
  }
  const askUrl=buildAtlasAskUrl(state,data,lang,globalThis.location?.href||'https://example.invalid/books/reality-differentiation/');
  inspector.insertAdjacentHTML('beforeend',`<div class="civ-atlas-ask"><a class="knowledge-action" href="${esc(askUrl)}">${esc(c.ask)}</a><small>${esc(lang==='zh-Hans'?'只带入你当前选择的公开文明图谱 Context；它不会替答案预设结论。':'Only your current public Atlas context is carried forward; it does not pre-decide the answer.')}</small></div>`);
  ensureAtlasInteractiveNames(root);
}
