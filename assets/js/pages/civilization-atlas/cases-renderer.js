import {resolveAtlasVisualById} from './atlas-static-visual.js';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const loc=(v,lang)=>v?.[lang]||v?.en||v?.['zh-Hans']||'';
const label=(obj,lang)=>loc(obj?.label,lang)||'—';
const formatYear=(y,lang)=>y<0?(lang==='zh-Hans'?`公元前${Math.abs(y)}年`:`${Math.abs(y)} BCE`):(lang==='zh-Hans'?`公元${y}年`:`${y} CE`);
const formatRange=(t,lang)=>t?`${formatYear(t.startYear,lang)} – ${formatYear(t.endYear,lang)}`:'—';
const PAGE=12;
export function renderCases(container,{registry,visualBindings,state,locale='en',onCaseSelect=()=>{},onCompareToggle=()=>{},onSearchChange=()=>{}}={}){
  const lang=locale==='zh-Hans'?'zh-Hans':'en'; const all=registry?.cases||[]; const query=String(state.caseSearch||'').trim().toLowerCase(); const visual=id=>{const a=visualBindings?.assets?.find(x=>x.family==='CASE_HERO'&&x.subjectId===id);return a?resolveAtlasVisualById(visualBindings,a.assetId):null;};
  const regionSet=new Set(state.regionIds||[]);
  const cases=all.filter(c=>{
    const hay=[loc(c.title,lang),loc(c.title,lang==='en'?'zh-Hans':'en'),...(c.aliases||[]),c.caseId,c.runtimeFamily].join(' ').toLowerCase();
    const matchQ=!query||hay.includes(query); const matchR=!regionSet.size||(c.region?.regionIds||[]).some(r=>regionSet.has(r));
    const matchP=!state.timeWindowId||c.caseId.startsWith(`CA-${state.timeWindowId}-`)||(state.time!==null&&state.time>=c.timeWindow.startYear&&state.time<=c.timeWindow.endYear);
    return matchQ&&matchR&&matchP;
  });
  const active=all.find(c=>c.caseId===state.primaryCaseId)||cases[0]||null;
  const orderedCases=active&&cases.some(c=>c.caseId===active.caseId)?[active,...cases.filter(c=>c.caseId!==active.caseId)]:cases;
  container.innerHTML=`<div class="civ-cases" data-atlas-cases>
    <div class="civ-cases__toolbar"><label><span>${lang==='zh-Hans'?'搜索文明案例':'Search cases'}</span><input type="search" data-case-search aria-describedby="civ-case-count"  value="${esc(state.caseSearch||'')}" placeholder="${esc(lang==='zh-Hans'?'搜索文明名称、地区或关键词':'Search civilization, region, or keyword')}"></label><p id="civ-case-count" aria-live="polite">${lang==='zh-Hans'?`显示 ${Math.min(PAGE,cases.length)} / ${cases.length} 个符合条件的文明`:`Showing ${Math.min(PAGE,cases.length)} of ${cases.length} matching civilizations`}</p></div>
    <div class="civ-case-grid">${orderedCases.map((c,index)=>{const v=visual(c.caseId);return `<article class="civ-case-card${active?.caseId===c.caseId?' is-active':''}" data-case-card data-case-index="${index}"${index>=PAGE?' hidden':''}>${v?`<img class="civ-case-card__visual" src="${esc(v.publicUrl)}" alt="" loading="lazy" decoding="async">`:''}<div><p class="knowledge-eyebrow">${esc(loc(c.region?.label,lang)||formatRange(c.timeWindow,lang))}</p><h4>${esc(loc(c.title,lang))}</h4><p>${esc(formatRange(c.timeWindow,lang))}</p></div><dl><div><dt>${lang==='zh-Hans'?'地区':'Region'}</dt><dd>${esc(loc(c.region?.label,lang))}</dd></div><div><dt>${lang==='zh-Hans'?'运行特征':'Pattern'}</dt><dd>${esc(label(c.politicalArchitecture,lang)||label(c.economicRuntime,lang))}</dd></div></dl>${active?.caseId===c.caseId&&c.unknown?.note?`<details class="civ-atlas-evidence-note"><summary>${lang==='zh-Hans'?'资料边界':'Evidence note'}</summary><p>${esc(loc(c.unknown.note,lang))}</p></details>`:''}<div class="civ-case-card__actions"><button type="button" class="knowledge-action" data-open-case="${esc(c.caseId)}">${lang==='zh-Hans'?'查看档案':'View dossier'}</button><button type="button" class="knowledge-action knowledge-action--quiet" data-compare-case="${esc(c.caseId)}" aria-pressed="${(state.compareBasket||[]).includes(c.caseId)?'true':'false'}">${(state.compareBasket||[]).includes(c.caseId)?(lang==='zh-Hans'?'移出比较':'Remove compare'):(lang==='zh-Hans'?'＋加入比较':'+ Compare')}</button></div></article>`}).join('')}</div>
    ${cases.length>PAGE?`<div class="civ-case-more"><button type="button" class="knowledge-action knowledge-action--quiet" data-case-more>${lang==='zh-Hans'?'继续显示文明':'Show more civilizations'}</button></div>`:''}
    ${!cases.length?`<p class="civ-atlas-note">${lang==='zh-Hans'?'没有符合当前筛选的案例。':'No cases match the current filters.'}</p>`:''}
  </div>`;
  const search=container.querySelector('[data-case-search]'); search?.addEventListener('change',e=>onSearchChange(e.target.value)); search?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();onSearchChange(e.currentTarget.value);}});
  container.querySelectorAll('[data-open-case]').forEach(el=>el.addEventListener('click',()=>onCaseSelect(el.dataset.openCase)));
  container.querySelectorAll('[data-compare-case]').forEach(el=>el.addEventListener('click',()=>onCompareToggle(el.dataset.compareCase)));
  const more=container.querySelector('[data-case-more]');let visible=Math.min(PAGE,cases.length);
  more?.addEventListener('click',()=>{visible=Math.min(visible+PAGE,cases.length);container.querySelectorAll('[data-case-card]').forEach((card,index)=>card.hidden=index>=visible);const count=container.querySelector('#civ-case-count');if(count)count.textContent=lang==='zh-Hans'?`显示 ${visible} / ${cases.length} 个符合条件的文明`:`Showing ${visible} of ${cases.length} matching civilizations`;if(visible>=cases.length)more.remove();});
  return active;
}
export function renderCaseInspector(container,{caseRecord,state,locale='en'}={}){
  if(!caseRecord) return false; const lang=locale==='zh-Hans'?'zh-Hans':'en';
  container.innerHTML=`<div class="civ-atlas-inspector__summary"><p class="knowledge-eyebrow">${esc(formatRange(caseRecord.timeWindow,lang))}</p><h3>${esc(loc(caseRecord.title,lang))}</h3><p>${esc(loc(caseRecord.region?.label,lang))}</p><dl><div><dt>${lang==='zh-Hans'?'长期遗产':'Legacy'}</dt><dd>${esc(label(caseRecord.legacy,lang))}</dd></div><div><dt>${lang==='zh-Hans'?'继任结构':'Successor'}</dt><dd>${esc(label(caseRecord.successorStructure,lang))}</dd></div></dl>${(state.compareBasket||[]).length?`<p class="civ-atlas-note">${lang==='zh-Hans'?'已选择比较':'Selected'}: ${state.compareBasket.length}</p>`:''}</div>`;
  return true;
}
