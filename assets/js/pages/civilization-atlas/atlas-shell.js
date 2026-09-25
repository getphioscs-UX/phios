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
  en:{context:'Current reading',skip:'Skip to Atlas content',ask:'Ask PHI OS about this',eyebrow:'Civilization Atlas',title:'See how civilizations formed, diverged and reconfigured.',lead:'Move through time, world snapshots, civilizations and comparison. Technical provenance stays available in the background while the main surface prioritizes readable historical context.',read:'Read the book',layers:'Explore',inspector:'Your current reading',empty:'This view is ready.',evidence:'Evidence notes remain available without crowding the main reading surface.',open:'Explore',civilizationViews:'Explore civilizations'},
  'zh-Hans':{context:'当前阅读',skip:'跳到图谱内容',ask:'问 PHI OS 当前图谱',eyebrow:'文明图谱',title:'看见文明如何形成、分化与重组。',lead:'沿着时间、世界横切面、文明案例与比较进入。技术来源与证据边界继续保留在后台和详情层，主页面优先呈现可阅读的历史内容。',read:'阅读《世界如何分化》',layers:'开始探索',inspector:'当前阅读',empty:'这个视图已经就绪。',evidence:'证据说明继续保留，但不占据主要阅读空间。',open:'正在探索',civilizationViews:'探索文明'}
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
  root.innerHTML=`<a class="civ-atlas-skip" href="#civ-atlas-active-title">${esc(c.skip)}</a><div class="knowledge-shell civ-atlas-shell"><div class="civ-atlas-shell__intro"><div><p class="knowledge-eyebrow">${esc(c.eyebrow)}</p><h2>${esc(c.title)}</h2><p>${esc(c.lead)}</p></div><a class="knowledge-action" href="#book-parts">${esc(c.read)}</a></div><div class="civ-atlas-layout"><nav class="civ-atlas-layers" data-atlas-layer-nav aria-label="${esc(c.layers)}">${CUSTOMER_ENTRIES.map((entry,index)=>entry.href?`<a id="civ-atlas-entry-${entry.id}" class="civ-atlas-layer civ-atlas-layer--link" data-atlas-entry href="${esc(entry.href)}"><span>${esc(entry.label[lang])}</span><small>0${index+1}</small></a>`:`<button type="button" id="civ-atlas-entry-${entry.id}" aria-controls="civ-atlas-panel" aria-pressed="${activeEntry===entry.id?'true':'false'}" class="civ-atlas-layer${activeEntry===entry.id?' is-active':''}" data-atlas-entry data-atlas-layer="${entry.target}"><span>${esc(entry.label[lang])}</span><small>0${index+1}</small></button>`).join('')}</nav><section id="civ-atlas-panel" role="region" class="civ-atlas-canvas" aria-labelledby="civ-atlas-entry-${esc(activeEntry)} civ-atlas-active-title"><p class="knowledge-eyebrow">${esc(c.open)}</p><h3 id="civ-atlas-active-title">${esc(LAYERS[state.activeLayer]?.[lang]||LAYERS.timeline[lang])}</h3>
${CIVILIZATION_LAYERS.has(state.activeLayer)?`<div class="civ-atlas-subnav" aria-label="${esc(c.civilizationViews)}">${CIVILIZATION_VIEWS.map(id=>`<button type="button" class="civ-atlas-subview${state.activeLayer===id?' is-active':''}" data-atlas-layer="${id}" aria-pressed="${state.activeLayer===id?'true':'false'}">${esc(LAYERS[id][lang])}</button>`).join('')}</div>`:''}
<div class="civ-atlas-context-strip civ-atlas-context-strip--quiet" aria-label="${esc(c.context)}">
  <span><strong>${lang==='zh-Hans'?'视图':'View'}</strong> ${esc(LAYERS[state.activeLayer]?.[lang]||LAYERS.timeline[lang])}</span>
</div>
<div data-atlas-template-projection></div>
<details class="civ-template-controls"><summary>${esc(lang==='zh-Hans'?'打开互动资料与控制':'Open interactive data and controls')}</summary><div data-atlas-layer-content></div></details>
<details class="civ-atlas-secondary" data-atlas-structured-section><summary>${esc(lang==='zh-Hans'?'查看结构图与数据视图':'Explore structured data view')}</summary><div data-atlas-structured-visual></div></details>
<div data-atlas-primary-visual></div>
<div data-atlas-visual-resources></div></section><aside class="civ-atlas-inspector" aria-labelledby="civ-atlas-inspector-title" data-atlas-inspector><div class="civ-atlas-inspector__summary"><p class="knowledge-eyebrow">${esc(c.inspector)}</p><h3 id="civ-atlas-inspector-title">${esc(LAYERS[state.activeLayer]?.[lang]||LAYERS.timeline[lang])}</h3><p class="civ-atlas-inspector__lead">${esc(lang==='zh-Hans'?'跟随当前选择。':'Follows your current selection.')}</p></div></aside></div></div>`;
  root.querySelectorAll('[data-atlas-layer]').forEach(button=>button.addEventListener('click',()=>onLayerChange(button.dataset.atlasLayer)));
  wireAtlasKeyboardNavigation(root,{onLayerActivate:id=>{if(id&&id!==state.activeLayer)onLayerChange(id);}});
  const content=root.querySelector('[data-atlas-layer-content]'); const inspector=root.querySelector('[data-atlas-inspector]');
  renderStructuredAtlasVisual(root.querySelector('[data-atlas-structured-visual]'),{data,state,locale:lang,onStateChange});
  if(state.activeLayer==='timeline'&&data.timeline){
    renderTimeline(content,{registry:data.timeline,casesRegistry:data.cases,visualBindings:data.staticVisuals,state,locale:lang,onPeriodSelect:p=>onStateChange({timeWindowId:p.periodId,time:p.startYear,caseIds:p.caseIds||[],primaryCaseId:p.caseIds?.[0]||null},{source:'timeline-period'}),onCaseSelect:id=>onStateChange({activeLayer:'cases',primaryCaseId:id,caseIds:[id]},{source:'timeline-case'})});
  }else if(state.activeLayer==='cases'&&data.cases){
    const active=renderCases(content,{registry:data.cases,visualBindings:data.staticVisuals,state,locale:lang,onCaseSelect:id=>onStateChange({primaryCaseId:id,caseIds:[id]},{source:'case-select'}),onCompareToggle:id=>{const current=new Set(state.compareBasket||[]); current.has(id)?current.delete(id):current.add(id); onStateChange({compareBasket:[...current].slice(0,6)},{source:'case-compare'});},onSearchChange:q=>onStateChange({caseSearch:q},{source:'case-search'})});
    renderCaseInspector(inspector,{caseRecord:active,state,locale:lang});
  }else if(state.activeLayer==='comparison'&&data.comparison&&data.cases){
    const family=renderComparison(content,{registry:data.comparison,casesRegistry:data.cases,transitionsRegistry:data.transitions,worldRegistry:data.world,visualBindings:data.staticVisuals,state,locale:lang,onFamilySelect:id=>onStateChange({comparisonFamilyId:id},{source:'comparison-family'}),onCaseSelect:id=>onStateChange({activeLayer:'cases',primaryCaseId:id,caseIds:[id]},{source:'comparison-case'}),onCompareToggle:id=>{const current=new Set(state.compareBasket||[]); current.has(id)?current.delete(id):current.add(id); onStateChange({compareBasket:[...current].slice(0,6)},{source:'comparison-basket'});}});
    renderComparisonInspector(inspector,{family,state,locale:lang});
  }else if(state.activeLayer==='world'&&data.world&&data.cases){
    const snapshot=renderWorldSlice(content,{registry:data.world,casesRegistry:data.cases,visualBindings:data.staticVisuals,state,locale:lang,onSnapshotSelect:s=>onStateChange({snapshotId:s.snapshotId,time:s.year,caseIds:s.majorCaseIds||[],primaryCaseId:s.majorCaseIds?.[0]||null},{source:'world-snapshot'}),onCaseSelect:id=>onStateChange({activeLayer:'cases',primaryCaseId:id,caseIds:[id]},{source:'world-case'})});
    renderWorldInspector(inspector,{snapshot,locale:lang});
  }else if(state.activeLayer==='trajectories'&&data.trajectories){
    const selected=renderTrajectories(content,{registry:data.trajectories,visualBindings:data.staticVisuals,state,locale:lang,onToggle:ids=>onStateChange({trajectoryIds:ids},{source:'trajectory-select'})});
    renderTrajectoryInspector(inspector,{trajectories:selected,locale:lang});
  }else if(state.activeLayer==='transitions'&&data.transitions){
    const active=renderTransitions(content,{registry:data.transitions,visualBindings:data.staticVisuals,state,locale:lang,onSelect:id=>onStateChange({transitionWindowId:id},{source:'transition-select'})});
    renderTransitionInspector(inspector,{windowRecord:active,locale:lang});
  }else if(state.activeLayer==='loss'&&data.loss){
    const selection=renderLossAtlas(content,{registry:data.loss,casesRegistry:data.cases,visualBindings:data.staticVisuals,state,locale:lang,onFamilySelect:id=>onStateChange({lossFamilyId:id,lossTypeId:null},{source:'loss-family'}),onLossSelect:id=>onStateChange({lossTypeId:id},{source:'loss-type'})});
    renderLossInspector(inspector,{selection,locale:lang});
  }else{
    content.innerHTML=`<div class="civ-atlas-empty"><span aria-hidden="true">Φ</span><p>${esc(c.empty)}</p><small>${esc(c.evidence)}</small></div>`;
  }
  const askUrl=buildAtlasAskUrl(state,data,lang,globalThis.location?.href||'https://example.invalid/books/reality-differentiation/');
  inspector.insertAdjacentHTML('beforeend',`<div class="civ-atlas-ask"><a class="knowledge-action" href="${esc(askUrl)}">${esc(c.ask)}</a><small>${esc(lang==='zh-Hans'?'使用当前阅读情境提问。':'Ask using the current reading context.')}</small></div>`);
  ensureAtlasInteractiveNames(root);
}
