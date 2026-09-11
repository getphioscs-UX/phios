const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const loc=(v,lang)=>v?.[lang]||v?.en||v?.['zh-Hans']||'';
export const formatHistoricalYear=(year,lang='en')=>{
  if(year===null||year===undefined) return '—';
  if(year<0) return lang==='zh-Hans'?`公元前${Math.abs(year)}年`:`${Math.abs(year)} BCE`;
  return lang==='zh-Hans'?`公元${year}年`:`${year} CE`;
};
export const formatHistoricalRange=(a,b,lang='en')=>`${formatHistoricalYear(a,lang)} – ${formatHistoricalYear(b,lang)}`;
export function renderTimeline(container,{registry,state,locale='en',onPeriodSelect=()=>{},onCaseSelect=()=>{}}={}){
  const lang=locale==='zh-Hans'?'zh-Hans':'en'; const periods=registry?.periods||[];
  if(!periods.length){container.innerHTML=`<p>${lang==='zh-Hans'?'历史脊柱尚未激活。':'Timeline data is not active yet.'}</p>`;return;}
  const selected=periods.find(p=>p.periodId===state.timeWindowId)||periods.find(p=>state.time!==null&&state.time>=p.startYear&&state.time<=p.endYear)||periods[0];
  container.innerHTML=`<div class="civ-timeline" data-atlas-timeline>
    <div class="civ-timeline__track" role="list" aria-label="${esc(lang==='zh-Hans'?'文明历史时期':'Civilization periods')}">
      ${periods.map(p=>`<button role="listitem" type="button" class="civ-timeline__period${selected?.periodId===p.periodId?' is-active':''}" data-period-id="${esc(p.periodId)}" aria-pressed="${selected?.periodId===p.periodId?'true':'false'}"><strong>${esc(p.periodId)}</strong><span>${esc(loc(p.title,lang))}</span><small>${esc(formatHistoricalRange(p.startYear,p.endYear,lang))}</small></button>`).join('')}
    </div>
    <article class="civ-timeline__focus">
      <p class="knowledge-eyebrow">${esc(selected.periodId)}</p><h4>${esc(loc(selected.title,lang))}</h4>
      <p>${esc(loc(selected.summary,lang))}</p>
      <dl class="civ-atlas-meta"><div><dt>${lang==='zh-Hans'?'时间':'Time'}</dt><dd>${esc(formatHistoricalRange(selected.startYear,selected.endYear,lang))}</dd></div><div><dt>${lang==='zh-Hans'?'知识状态':'Knowledge state'}</dt><dd>${esc(selected.unknown?.state||'—')}</dd></div></dl>
      ${selected.caseIds?.length?`<div class="civ-atlas-related"><h5>${lang==='zh-Hans'?'代表案例':'Representative cases'}</h5>${selected.caseIds.map(id=>`<button type="button" class="knowledge-action knowledge-action--quiet" data-case-id="${esc(id)}">${esc(id)}</button>`).join('')}</div>`:''}
      ${selected.unknown?.note?`<p class="civ-atlas-note">${esc(loc(selected.unknown.note,lang))}</p>`:''}
    </article>
    <div class="civ-atlas-table-wrap"><table class="civ-atlas-table"><caption class="civ-sr-only">${lang==='zh-Hans'?'文明历史时期完整表格':'Complete civilization timeline table'}</caption><thead><tr><th scope="col">${lang==='zh-Hans'?'时期':'Period'}</th><th scope="col">${lang==='zh-Hans'?'时间范围':'Range'}</th><th scope="col">${lang==='zh-Hans'?'历史主线':'Historical line'}</th><th scope="col">${lang==='zh-Hans'?'代表案例':'Cases'}</th></tr></thead><tbody>
      ${periods.map(p=>`<tr><td><button type="button" class="civ-atlas-link" data-period-id="${esc(p.periodId)}">${esc(p.periodId)} · ${esc(loc(p.title,lang))}</button></td><td>${esc(formatHistoricalRange(p.startYear,p.endYear,lang))}</td><td>${esc(loc(p.summary,lang))}</td><td>${esc((p.caseIds||[]).join(', ')||'—')}</td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
  container.querySelectorAll('[data-period-id]').forEach(el=>el.addEventListener('click',()=>{const p=periods.find(x=>x.periodId===el.dataset.periodId); if(p) onPeriodSelect(p);}));
  container.querySelectorAll('[data-case-id]').forEach(el=>el.addEventListener('click',()=>onCaseSelect(el.dataset.caseId)));
}
