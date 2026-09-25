const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const loc=(v,lang)=>v?.[lang]||v?.en||v?.['zh-Hans']||'';
const label=(obj,lang)=>loc(obj?.label,lang)||'—';
const DIMENSION_FIELD={
  ADMINISTRATION:'politicalArchitecture',FRONTIER_GOVERNANCE:'geographicReach',LEGITIMACY:'alignment',INFRASTRUCTURE:'infrastructure',
  CENTER_DISTRIBUTION:'politicalArchitecture',INTERCITY_NETWORK:'externalNetwork',SHARED_IDENTITY:'beliefSystem',PORT_SYSTEM:'infrastructure',SEA_LANES:'externalNetwork',COMMERCIAL_CARRIER:'economicRuntime',
  MEMORY_SYSTEM:'knowledgeSystem',REPLICATION:'knowledgeSystem',PARTICIPATION:'civilizationDensity',CROSS_BORDER_REACH:'externalNetwork',MARKET_DENSITY:'economicRuntime',NETWORK_REACH:'externalNetwork',MONEY_CREDIT:'economicRuntime',DEPENDENCY:'load',
  ENERGY_DENSITY:'energyBase',INDUSTRIAL_CAPACITY:'technology',INFORMATION_SPEED:'externalNetwork',GLOBAL_DEPENDENCY:'externalNetwork'
};
function cellFor(caseRecord,dimensionId,lang){if(!caseRecord)return'—'; const field=DIMENSION_FIELD[dimensionId]; return field?label(caseRecord[field],lang):'—';}
const PAGE=12;
export function renderComparison(container,{registry,casesRegistry,state,locale='en',onFamilySelect=()=>{},onCaseSelect=()=>{},onCompareToggle=()=>{}}={}){
  const lang=locale==='zh-Hans'?'zh-Hans':'en'; const families=registry?.families||[]; const cases=casesRegistry?.cases||[];
  const selected=families.find(f=>f.familyId===state.comparisonFamilyId)||families.find(f=>(state.compareBasket||[]).some(id=>f.caseIds.includes(id)))||families[0]||null;
  const caseMap=new Map(cases.map(c=>[c.caseId,c])); const familyMap=new Map(families.map(f=>[f.familyId,f]));
  const basket=(state.compareBasket||[]).filter(id=>selected?.caseIds.includes(id)); const matrixIds=(basket.length>=2?basket:selected?.caseIds||[]).slice(0,4);
  container.innerHTML=`<div class="civ-comparison" data-atlas-comparison>
    <p class="civ-atlas-note">${esc(lang==='zh-Hans'?'选择一个比较家族，查看面对相似问题的文明如何形成不同结构。这里做并列阅读，不做排名。':'Choose a comparison family to see how civilizations facing similar problems formed different structures. This is side-by-side reading, not ranking.')}</p>
    <div class="civ-family-network" role="list">${families.map(f=>`<button type="button" role="listitem" class="civ-family-node${selected?.familyId===f.familyId?' is-active':''}" data-family-id="${esc(f.familyId)}" aria-pressed="${selected?.familyId===f.familyId?'true':'false'}"><strong>${esc(loc(f.title,lang))}</strong><small>${esc(loc(f.coreRuntimeProblem,lang))}</small><span>${f.caseIds.length} ${lang==='zh-Hans'?'案例':'cases'}</span></button>`).join('')}</div>
    ${selected?`<section class="civ-family-focus"><p class="knowledge-eyebrow">${esc(lang==='zh-Hans'?'文明比较':'Civilization comparison')}</p><h4>${esc(loc(selected.title,lang))}</h4><p>${esc(loc(selected.coreRuntimeProblem,lang))}</p>
    <details class="civ-atlas-related-families"><summary>${esc(lang==='zh-Hans'?'查看相关比较家族':'Related comparison families')}</summary><div class="civ-family-relations">${selected.crossFamilyRelations.map(r=>`<button type="button" class="civ-family-relation" data-family-id="${esc(r.targetFamilyId)}"><strong>${esc(loc(familyMap.get(r.targetFamilyId)?.title,lang)||r.targetFamilyId)}</strong></button>`).join('')}</div></details>
    <div class="civ-family-cases">${selected.caseIds.map((id,index)=>{const c=caseMap.get(id);return `<article data-family-case data-family-index="${index}"${index>=PAGE?' hidden':''}><button class="civ-atlas-link" data-comparison-case="${esc(id)}">${esc(c?loc(c.title,lang):id)}</button><button type="button" class="knowledge-action knowledge-action--quiet" data-comparison-toggle="${esc(id)}" aria-pressed="${(state.compareBasket||[]).includes(id)?'true':'false'}">${(state.compareBasket||[]).includes(id)?(lang==='zh-Hans'?'移出比较':'Remove'):(lang==='zh-Hans'?'＋加入比较':'+ Compare')}</button></article>`}).join('')}</div>
    ${selected.caseIds.length>PAGE?`<div class="civ-family-more"><button type="button" class="knowledge-action knowledge-action--quiet" data-family-more>${lang==='zh-Hans'?'继续显示文明':'Show more civilizations'}</button></div>`:''}
    <details class="civ-atlas-detail-table"${basket.length>=2?' open':''}><summary>${lang==='zh-Hans'?'查看比较矩阵':'View comparison matrix'}</summary><div class="civ-atlas-table-wrap"><table class="civ-atlas-table civ-comparison-matrix"><thead><tr><th>${lang==='zh-Hans'?'比较维度':'Dimension'}</th>${matrixIds.map(id=>`<th>${esc(loc(caseMap.get(id)?.title,lang)||id)}</th>`).join('')}</tr></thead><tbody>${selected.comparisonDimensions.map(d=>`<tr><th scope="row"><strong>${esc(loc(d.title,lang))}</strong><small>${esc(loc(d.description,lang))}</small></th>${matrixIds.map(id=>`<td>${esc(cellFor(caseMap.get(id),d.dimensionId,lang))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details></section>`:''}
  </div>`;
  container.querySelectorAll('[data-family-id]').forEach(el=>el.addEventListener('click',()=>onFamilySelect(el.dataset.familyId)));
  container.querySelectorAll('[data-comparison-case]').forEach(el=>el.addEventListener('click',()=>onCaseSelect(el.dataset.comparisonCase)));
  container.querySelectorAll('[data-comparison-toggle]').forEach(el=>el.addEventListener('click',()=>onCompareToggle(el.dataset.comparisonToggle)));
  const more=container.querySelector('[data-family-more]');let visible=Math.min(PAGE,selected?.caseIds?.length||0);
  more?.addEventListener('click',()=>{visible=Math.min(visible+PAGE,selected.caseIds.length);container.querySelectorAll('[data-family-case]').forEach((card,index)=>card.hidden=index>=visible);if(visible>=selected.caseIds.length)more.remove();});
  return selected;
}
export function renderComparisonInspector(container,{family,state,locale='en'}={}){
  if(!family)return false; const lang=locale==='zh-Hans'?'zh-Hans':'en';
  container.innerHTML=`<div class="civ-atlas-inspector__summary"><p class="knowledge-eyebrow">${esc(lang==='zh-Hans'?'比较主题':'Comparison theme')}</p><h3>${esc(loc(family.title,lang))}</h3><p>${esc(loc(family.coreRuntimeProblem,lang))}</p><dl><div><dt>${lang==='zh-Hans'?'已选择':'Selected'}</dt><dd>${(state.compareBasket||[]).length}</dd></div></dl></div>`; return true;
}
