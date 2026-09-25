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
const visualBy=(bindings,family,subjectId)=>(bindings?.assets||[]).find(a=>a.family===family&&a.subjectId===subjectId&&a.reviewState==='ACCEPTED'&&a.bindingState==='BOUND')||null;
const short=(v,max=92)=>{const x=String(v||'—').trim();return x.length>max?x.slice(0,max-1)+'…':x;};
const matrixCell=(caseRecord,dimensionId,lang)=>{
 const value=cellFor(caseRecord,dimensionId,lang);
 return {headline:short(value,44),detail:short(label(caseRecord?.legacy,lang)||label(caseRecord?.externalNetwork,lang)||'',84)};
};
export function renderComparison(container,{registry,casesRegistry,visualBindings,state,locale='en',onFamilySelect=()=>{},onCaseSelect=()=>{},onCompareToggle=()=>{}}={}){
  const lang=locale==='zh-Hans'?'zh-Hans':'en'; const families=registry?.families||[]; const cases=casesRegistry?.cases||[];
  const selected=families.find(f=>f.familyId===state.comparisonFamilyId)||families.find(f=>(state.compareBasket||[]).some(id=>f.caseIds.includes(id)))||families[0]||null;
  const caseMap=new Map(cases.map(c=>[c.caseId,c])); const familyMap=new Map(families.map(f=>[f.familyId,f]));
  const basket=(state.compareBasket||[]).filter(id=>selected?.caseIds.includes(id)); const matrixIds=(basket.length>=2?basket:selected?.caseIds||[]).slice(0,4);
  const familyVisual=visualBy(visualBindings,'COMPARISON_FAMILY',selected?.familyId);
  const representatives=(basket.length>=2?basket:selected?.caseIds||[]).slice(0,6);
  const matrixCases=(basket.length>=2?basket:representatives.slice(0,4));
  container.innerHTML=`<div class="civ-comparison civ-comparison--board" data-atlas-comparison>
    <section class="civ-compare-family-map">
      <div class="civ-compare-family-map__intro">
        <p class="knowledge-eyebrow">${esc(lang==='zh-Hans'?'比较家族':'Comparison families')}</p>
        <h4>${esc(lang==='zh-Hans'?'从共同运行问题进入比较，而不是从强弱排名开始。':'Compare shared runtime problems, not winners and losers.')}</h4>
        <p>${esc(lang==='zh-Hans'?'六个家族代表不同的文明组织方式。先选择家族，再看代表文明与结构差异。':'Six families represent different ways civilizations organize. Choose a family, then inspect representative civilizations and structural differences.')}</p>
      </div>
      <div class="civ-family-network" role="list">${families.map(f=>{const v=visualBy(visualBindings,'COMPARISON_FAMILY',f.familyId);return `<button type="button" role="listitem" class="civ-family-node${selected?.familyId===f.familyId?' is-active':''}" data-family-id="${esc(f.familyId)}" aria-pressed="${selected?.familyId===f.familyId?'true':'false'}">${v?`<img src="${esc(v.publicUrl)}" alt="" loading="lazy" decoding="async">`:''}<span class="civ-family-node__copy"><strong>${esc(loc(f.title,lang))}</strong><small>${esc(loc(f.coreRuntimeProblem,lang))}</small><em>${f.caseIds.length} ${lang==='zh-Hans'?'个案例':'cases'}</em></span></button>`}).join('')}</div>
    </section>
    ${selected?`<section class="civ-family-focus civ-family-focus--board">
      <div class="civ-family-focus__hero">${familyVisual?`<img src="${esc(familyVisual.publicUrl)}" alt="" loading="eager" decoding="async">`:''}<div><p class="knowledge-eyebrow">${esc(lang==='zh-Hans'?'当前比较家族':'Current comparison family')}</p><h4>${esc(loc(selected.title,lang))}</h4><p>${esc(loc(selected.coreRuntimeProblem,lang))}</p></div></div>

      <section class="civ-compare-representatives"><div class="civ-compare-section-head"><div><p class="knowledge-eyebrow">${esc(lang==='zh-Hans'?'代表文明':'Representative civilizations')}</p><h5>${esc(lang==='zh-Hans'?'先看谁在比较，再进入矩阵。':'See who is being compared before entering the matrix.')}</h5></div><span>${representatives.length} / ${selected.caseIds.length}</span></div>
      <div class="civ-compare-case-strip">${representatives.map(id=>{const c=caseMap.get(id),v=visualBy(visualBindings,'CASE_HERO',id);return `<article class="civ-compare-case">${v?`<img src="${esc(v.publicUrl)}" alt="" loading="lazy" decoding="async">`:''}<div><button class="civ-atlas-link" data-comparison-case="${esc(id)}">${esc(c?loc(c.title,lang):id)}</button><p>${esc(c?label(c.region,lang):'')}</p><small>${esc(c?label(c.politicalArchitecture,lang):'')}</small></div><button type="button" class="knowledge-action knowledge-action--quiet" data-comparison-toggle="${esc(id)}" aria-pressed="${(state.compareBasket||[]).includes(id)?'true':'false'}">${(state.compareBasket||[]).includes(id)?(lang==='zh-Hans'?'移出':'Remove'):(lang==='zh-Hans'?'＋比较':'+ Compare')}</button></article>`}).join('')}</div></section>

      <section class="civ-compare-matrix-section">
        <div class="civ-compare-section-head"><div><p class="knowledge-eyebrow">${esc(lang==='zh-Hans'?'比较矩阵':'Comparison matrix')}</p><h5>${esc(lang==='zh-Hans'?'同一维度，横向读取不同文明。':'Read different civilizations across the same dimension.')}</h5></div><span>${matrixCases.length} ${lang==='zh-Hans'?'个文明':'civilizations'}</span></div>
        <div class="civ-compare-matrix" style="--compare-cols:${matrixCases.length}" role="table" aria-label="${esc(lang==='zh-Hans'?'文明比较矩阵':'Civilization comparison matrix')}">
          <div class="civ-compare-matrix__corner" role="columnheader">${esc(lang==='zh-Hans'?'比较维度':'Dimension')}</div>
          ${matrixCases.map(id=>{const c=caseMap.get(id),v=visualBy(visualBindings,'CASE_HERO',id);return `<div class="civ-compare-matrix__case-head" role="columnheader">${v?`<img src="${esc(v.publicUrl)}" alt="" loading="lazy" decoding="async">`:''}<strong>${esc(loc(c?.title,lang)||id)}</strong></div>`}).join('')}
          ${selected.comparisonDimensions.map(d=>`<div class="civ-compare-matrix__dimension" role="rowheader"><strong>${esc(loc(d.title,lang))}</strong><small>${esc(loc(d.description,lang))}</small></div>${matrixCases.map(id=>{const cell=matrixCell(caseMap.get(id),d.dimensionId,lang);return `<div class="civ-compare-matrix__cell" role="cell" data-case-label="${esc(loc(caseMap.get(id)?.title,lang)||id)}"><strong>${esc(cell.headline)}</strong>${cell.detail&&cell.detail!==cell.headline?`<small>${esc(cell.detail)}</small>`:''}</div>`}).join('')}`).join('')}
        </div>
      </section>

      <details class="civ-atlas-related-families"><summary>${esc(lang==='zh-Hans'?'相关比较家族':'Related comparison families')}</summary><div class="civ-family-relations">${selected.crossFamilyRelations.map(r=>`<button type="button" class="civ-family-relation" data-family-id="${esc(r.targetFamilyId)}"><strong>${esc(loc(familyMap.get(r.targetFamilyId)?.title,lang)||r.targetFamilyId)}</strong></button>`).join('')}</div></details>
    </section>`:''}
  </div>`;
  container.querySelectorAll('[data-family-id]').forEach(el=>el.addEventListener('click',()=>onFamilySelect(el.dataset.familyId)));
  container.querySelectorAll('[data-comparison-case]').forEach(el=>el.addEventListener('click',()=>onCaseSelect(el.dataset.comparisonCase)));
  container.querySelectorAll('[data-comparison-toggle]').forEach(el=>el.addEventListener('click',()=>onCompareToggle(el.dataset.comparisonToggle)));
  return selected;
}
export function renderComparisonInspector(container,{family,state,locale='en'}={}){
  if(!family)return false; const lang=locale==='zh-Hans'?'zh-Hans':'en';
  container.innerHTML=`<div class="civ-atlas-inspector__summary"><p class="knowledge-eyebrow">${esc(lang==='zh-Hans'?'比较主题':'Comparison theme')}</p><h3>${esc(loc(family.title,lang))}</h3><p>${esc(loc(family.coreRuntimeProblem,lang))}</p><dl><div><dt>${lang==='zh-Hans'?'已选择':'Selected'}</dt><dd>${(state.compareBasket||[]).length}</dd></div></dl></div>`; return true;
}
