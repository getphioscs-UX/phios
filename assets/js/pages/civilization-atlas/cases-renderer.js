const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const loc=(v,lang)=>v?.[lang]||v?.en||v?.['zh-Hans']||'';
const label=(obj,lang)=>loc(obj?.label,lang)||'—';
const formatYear=(y,lang)=>y<0?(lang==='zh-Hans'?`公元前${Math.abs(y)}年`:`${Math.abs(y)} BCE`):(lang==='zh-Hans'?`公元${y}年`:`${y} CE`);
const formatRange=(t,lang)=>t?`${formatYear(t.startYear,lang)} – ${formatYear(t.endYear,lang)}`:'—';
export function renderCases(container,{registry,state,locale='en',onCaseSelect=()=>{},onCompareToggle=()=>{},onSearchChange=()=>{}}={}){
  const lang=locale==='zh-Hans'?'zh-Hans':'en'; const all=registry?.cases||[]; const query=String(state.caseSearch||'').trim().toLowerCase();
  const regionSet=new Set(state.regionIds||[]);
  const cases=all.filter(c=>{
    const hay=[loc(c.title,lang),loc(c.title,lang==='en'?'zh-Hans':'en'),...(c.aliases||[]),c.caseId,c.runtimeFamily].join(' ').toLowerCase();
    const matchQ=!query||hay.includes(query); const matchR=!regionSet.size||(c.region?.regionIds||[]).some(r=>regionSet.has(r));
    const matchP=!state.timeWindowId||c.caseId.startsWith(`CA-${state.timeWindowId}-`)||(state.time!==null&&state.time>=c.timeWindow.startYear&&state.time<=c.timeWindow.endYear);
    return matchQ&&matchR&&matchP;
  });
  const active=all.find(c=>c.caseId===state.primaryCaseId)||cases[0]||null;
  container.innerHTML=`<div class="civ-cases" data-atlas-cases>
    <div class="civ-cases__toolbar"><label><span>${lang==='zh-Hans'?'搜索文明案例':'Search cases'}</span><input type="search" data-case-search value="${esc(state.caseSearch||'')}" placeholder="${esc(lang==='zh-Hans'?'名称、别名、ID 或 Runtime family':'Name, alias, ID, or runtime family')}"></label><p>${lang==='zh-Hans'?`显示 ${cases.length} / ${all.length} 个案例`:`Showing ${cases.length} of ${all.length} cases`}</p></div>
    <div class="civ-case-grid">${cases.map(c=>`<article class="civ-case-card${active?.caseId===c.caseId?' is-active':''}"><div><p class="knowledge-eyebrow">${esc(c.caseId)}</p><h4>${esc(loc(c.title,lang))}</h4><p>${esc(formatRange(c.timeWindow,lang))}</p></div><dl><div><dt>${lang==='zh-Hans'?'地区':'Region'}</dt><dd>${esc(loc(c.region?.label,lang))}</dd></div><div><dt>Runtime</dt><dd>${esc(c.runtimeFamily)}</dd></div><div><dt>${lang==='zh-Hans'?'知识状态':'Knowledge'}</dt><dd>${esc(c.unknown?.state||'—')}</dd></div></dl><div class="civ-case-card__actions"><button type="button" class="knowledge-action" data-open-case="${esc(c.caseId)}">${lang==='zh-Hans'?'查看档案':'View dossier'}</button><button type="button" class="knowledge-action knowledge-action--quiet" data-compare-case="${esc(c.caseId)}" aria-pressed="${(state.compareBasket||[]).includes(c.caseId)?'true':'false'}">${(state.compareBasket||[]).includes(c.caseId)?(lang==='zh-Hans'?'移出比较':'Remove compare'):(lang==='zh-Hans'?'＋加入比较':'+ Compare')}</button></div></article>`).join('')}</div>
    ${!cases.length?`<p class="civ-atlas-note">${lang==='zh-Hans'?'没有符合当前筛选的案例。':'No cases match the current filters.'}</p>`:''}
  </div>`;
  const search=container.querySelector('[data-case-search]'); search?.addEventListener('change',e=>onSearchChange(e.target.value)); search?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();onSearchChange(e.currentTarget.value);}});
  container.querySelectorAll('[data-open-case]').forEach(el=>el.addEventListener('click',()=>onCaseSelect(el.dataset.openCase)));
  container.querySelectorAll('[data-compare-case]').forEach(el=>el.addEventListener('click',()=>onCompareToggle(el.dataset.compareCase)));
  return active;
}
export function renderCaseInspector(container,{caseRecord,state,locale='en'}={}){
  if(!caseRecord) return false; const lang=locale==='zh-Hans'?'zh-Hans':'en';
  const rows=[['Runtime',caseRecord.runtimeFamily],[lang==='zh-Hans'?'地区':'Region',loc(caseRecord.region?.label,lang)],[lang==='zh-Hans'?'空间范围':'Reach',label(caseRecord.geographicReach,lang)],[lang==='zh-Hans'?'政治结构':'Political architecture',label(caseRecord.politicalArchitecture,lang)],[lang==='zh-Hans'?'经济运行':'Economic runtime',label(caseRecord.economicRuntime,lang)],[lang==='zh-Hans'?'知识系统':'Knowledge system',label(caseRecord.knowledgeSystem,lang)],[lang==='zh-Hans'?'外部网络':'External network',label(caseRecord.externalNetwork,lang)],[lang==='zh-Hans'?'负载':'Load',label(caseRecord.load,lang)],[lang==='zh-Hans'?'扩展模式':'Expansion',label(caseRecord.expansionPattern,lang)],[lang==='zh-Hans'?'继任':'Successor',label(caseRecord.successorStructure,lang)],[lang==='zh-Hans'?'遗产':'Legacy',label(caseRecord.legacy,lang)],[lang==='zh-Hans'?'知识状态':'Knowledge state',caseRecord.unknown?.state||'—']];
  container.innerHTML=`<p class="knowledge-eyebrow">${esc(caseRecord.caseId)}</p><h3>${esc(loc(caseRecord.title,lang))}</h3><dl>${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${caseRecord.unknown?.note?`<p class="civ-atlas-note">${esc(loc(caseRecord.unknown.note,lang))}</p>`:''}${(state.compareBasket||[]).length?`<p class="civ-atlas-note">${lang==='zh-Hans'?'比较篮':'Compare basket'}: ${esc(state.compareBasket.join(', '))}</p>`:''}`;
  return true;
}
