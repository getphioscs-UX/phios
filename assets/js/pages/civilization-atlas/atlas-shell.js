import {renderTimeline} from './timeline-renderer.js';
import {renderCases,renderCaseInspector} from './cases-renderer.js';
import {renderComparison,renderComparisonInspector} from './comparison-renderer.js';
import {renderWorldSlice,renderWorldInspector} from './world-slice-renderer.js';
import {renderTrajectories,renderTrajectoryInspector} from './trajectory-renderer.js';
import {renderTransitions,renderTransitionInspector} from './transition-renderer.js';
import {renderLossAtlas,renderLossInspector} from './loss-renderer.js';
import {buildAtlasAskUrl} from './atlas-ask-context.js';
import {wireAtlasKeyboardNavigation,ensureAtlasInteractiveNames} from './atlas-accessibility.js';
import {renderStructuredAtlasVisual} from './atlas-structured-visual.js';
const COPY={
  en:{context:'Current Atlas context',skip:'Skip to Atlas content',ask:'Ask PHI OS about this',eyebrow:'Civilization Atlas Explorer',title:'Explore civilization through five clear entrances.',lead:'Start with Timeline, World, Civilizations, Compare, or Reconfiguration. The deeper historical layers remain available inside these customer-facing entrances without creating a second Atlas runtime.',read:'Read the book',layers:'Atlas entrances',inspector:'Current context',empty:'This Atlas entrance is ready. Historical content remains grounded in the existing registries.',evidence:'Evidence and unknown states stay explicit as each view is activated.',open:'Open view',civilizationViews:'Civilization views'},
  'zh-Hans':{context:'当前图谱情境',skip:'跳到图谱内容',ask:'问 PHI OS 当前图谱',eyebrow:'文明图谱探索器',title:'用五个清晰入口探索文明。',lead:'从「时间线、世界、文明、比较、重组」进入；长时段轨迹、转型窗口与逆转损失收进「文明」内部，不另建第二套图谱 Runtime。',read:'阅读《世界如何分化》',layers:'图谱入口',inspector:'当前 Context',empty:'这个图谱入口已经就绪；历史内容继续以现有 Registry 为权威来源。',evidence:'每个视图仍明确保留证据状态与未知边界。',open:'打开视图',civilizationViews:'文明内部视图'}
};
const LAYERS={timeline:{en:'Timeline','zh-Hans':'时间线'},cases:{en:'Civilizations','zh-Hans':'文明'},comparison:{en:'Compare','zh-Hans':'比较'},world:{en:'World','zh-Hans':'世界'},trajectories:{en:'Long Trends','zh-Hans':'长时段轨迹'},transitions:{en:'Transitions','zh-Hans':'转型窗口'},loss:{en:'Reversal & Loss','zh-Hans':'逆转与损失'}};
const CIVILIZATION_LAYERS=new Set(['cases','trajectories','transitions','loss']);
const CUSTOMER_ENTRIES=[
  {id:'timeline',target:'timeline',label:{en:'Timeline','zh-Hans':'时间线'}},
  {id:'world',target:'world',label:{en:'World','zh-Hans':'世界'}},
  {id:'civilizations',target:'cases',label:{en:'Civilizations','zh-Hans':'文明'}},
  {id:'compare',target:'comparison',label:{en:'Compare','zh-Hans':'比较'}},
  {id:'reconfiguration',href:'/books/reality-configuration/#atlas',label:{en:'Reconfiguration','zh-Hans':'重组'}}
];
const customerEntryForLayer=layer=>CIVILIZATION_LAYERS.has(layer)?'civilizations':layer==='comparison'?'compare':layer;
const CIVILIZATION_VIEWS=['cases','trajectories','transitions','loss'];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
export function renderAtlasShell(root,state,{locale='en',data={},onLayerChange=()=>{},onStateChange=()=>{}}={}){
  if(!root) return; const lang=locale==='zh-Hans'?'zh-Hans':'en'; const c=COPY[lang]; const activeEntry=customerEntryForLayer(state.activeLayer);
  root.innerHTML=`<a class="civ-atlas-skip" href="#civ-atlas-active-title">${esc(c.skip)}</a><div class="knowledge-shell civ-atlas-shell"><div class="civ-atlas-shell__intro"><div><p class="knowledge-eyebrow">${esc(c.eyebrow)}</p><h2>${esc(c.title)}</h2><p>${esc(c.lead)}</p></div><a class="knowledge-action" href="#book-parts">${esc(c.read)}</a></div><div class="civ-atlas-layout"><nav class="civ-atlas-layers" data-atlas-layer-nav role="tablist" aria-label="${esc(c.layers)}">${CUSTOMER_ENTRIES.map((entry,index)=>entry.href?`<a id="civ-atlas-tab-${entry.id}" class="civ-atlas-layer civ-atlas-layer--link" href="${esc(entry.href)}"><span>${esc(entry.label[lang])}</span><small>0${index+1}</small></a>`:`<button type="button" role="tab" id="civ-atlas-tab-${entry.id}" aria-controls="civ-atlas-panel" aria-selected="${activeEntry===entry.id?'true':'false'}" tabindex="${activeEntry===entry.id?'0':'-1'}" class="civ-atlas-layer${activeEntry===entry.id?' is-active':''}" data-atlas-layer="${entry.target}"><span>${esc(entry.label[lang])}</span><small>0${index+1}</small></button>`).join('')}</nav><section id="civ-atlas-panel" role="tabpanel" class="civ-atlas-canvas" aria-labelledby="civ-atlas-tab-${esc(activeEntry)} civ-atlas-active-title"><p class="knowledge-eyebrow">${esc(c.open)}</p><h3 id="civ-atlas-active-title">${esc(LAYERS[state.activeLayer]?.[lang]||LAYERS.timeline[lang])}</h3>
${CIVILIZATION_LAYERS.has(state.activeLayer)?`<div class="civ-atlas-subnav" aria-label="${esc(c.civilizationViews)}">${CIVILIZATION_VIEWS.map(id=>`<button type="button" class="civ-atlas-subview${state.activeLayer===id?' is-active':''}" data-atlas-layer="${id}" aria-pressed="${state.activeLayer===id?'true':'false'}">${esc(LAYERS[id][lang])}</button>`).join('')}</div>`:''}
<div class="civ-atlas-context-strip" aria-label="${esc(c.context)}">
  ${state.primaryCaseId?`<span><strong>${lang==='zh-Hans'?'文明':'Case'}</strong> ${esc(state.primaryCaseId)}</span>`:''}
  ${state.snapshotId?`<span><strong>${lang==='zh-Hans'?'世界横切面':'Snapshot'}</strong> ${esc(state.snapshotId)}</span>`:''}
  ${state.comparisonFamilyId?`<span><strong>${lang==='zh-Hans'?'比较':'Comparison'}</strong> ${esc(state.comparisonFamilyId)}</span>`:''}
  ${state.transitionWindowId?`<span><strong>${lang==='zh-Hans'?'转型':'Transition'}</strong> ${esc(state.transitionWindowId)}</span>`:''}
  ${state.lossTypeId?`<span><strong>${lang==='zh-Hans'?'损失':'Loss'}</strong> ${esc(state.lossTypeId)}</span>`:''}
</div>
<div data-atlas-structured-visual></div>
<div data-atlas-layer-content></div></section><aside class="civ-atlas-inspector" aria-labelledby="civ-atlas-inspector-title" data-atlas-inspector><h3 id="civ-atlas-inspector-title">${esc(c.inspector)}</h3><dl><div><dt>Layer</dt><dd>${esc(LAYERS[state.activeLayer]?.[lang]||state.activeLayer)}</dd></div>${state.time!==null?`<div><dt>Time</dt><dd>${esc(state.time)}</dd></div>`:''}${state.primaryCaseId?`<div><dt>Case</dt><dd>${esc(state.primaryCaseId)}</dd></div>`:''}</dl></aside></div></div>`;
  root.querySelectorAll('[data-atlas-layer]').forEach(button=>button.addEventListener('click',()=>onLayerChange(button.dataset.atlasLayer)));
  wireAtlasKeyboardNavigation(root,{onLayerActivate:id=>{if(id&&id!==state.activeLayer)onLayerChange(id);}});
  const content=root.querySelector('[data-atlas-layer-content]'); const inspector=root.querySelector('[data-atlas-inspector]');
  renderStructuredAtlasVisual(root.querySelector('[data-atlas-structured-visual]'),{data,state,locale:lang,onStateChange});
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
