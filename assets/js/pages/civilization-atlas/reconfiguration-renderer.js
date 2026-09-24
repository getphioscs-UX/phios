const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const COPY={
 en:{eyebrow:'Civilization Reconfiguration Atlas',title:'Explore how existing civilizations reconfigure.',lead:'Cases, windows, world snapshots, contemporary runtime and lived reality share one evidence-bound Atlas.',search:'Search',searchPlaceholder:'Search cases, windows, snapshots, dossiers, sections or lived-reality dimensions',cases:'Cases',windows:'Windows',snapshots:'World Snapshots',dossiers:'Contemporary Runtime',lived:'Lived Reality',compare:'Compare Cases',compareRuntime:'Compare Runtime',unknown:'Unknown',missing:'MISSING',ask:'Ask PHI OS about this',noRank:'Profiles, not rankings. Projection is not prediction.',version:'Version',previous:'Previous version',none:'None registered'},
 'zh-Hans':{eyebrow:'文明重组图谱',title:'观察已经存在的文明如何重组。',lead:'案例、重组窗口、世界横切面、当代运行与日常现实，共用同一套有证据边界的图谱。',search:'搜索',searchPlaceholder:'搜索案例、窗口、横切面、档案、正文节点或日常现实维度',cases:'案例',windows:'重组窗口',snapshots:'世界重组横切面',dossiers:'当代 Runtime',lived:'日常现实',compare:'比较案例',compareRuntime:'比较 Runtime',unknown:'未知',missing:'MISSING',ask:'问 PHI OS 当前重组图谱',noRank:'输出 Profile，不做国家排名；Projection 不等于 Prediction。',version:'版本',previous:'上一版本',none:'尚未登记'}
};
const loc=(v,l)=>v?.[l]||v?.en||v?.['zh-Hans']||v||'';
const status=(v,l)=>v==='UNKNOWN'?(l==='zh-Hans'?'未知':'Unknown'):String(v??(l==='zh-Hans'?'未知':'Unknown'));
const searchText=v=>String(v??'').normalize('NFKC').toLocaleLowerCase();
function scopeFor(layer,id){
 const base={schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v2.0.0',scopeType:'CIVILIZATION_RECONFIGURATION_ATLAS',bookCode:'BOOK-6',partCode:'PART-13',activeLayer:layer};
 if(id)base.entityId=id;
 return base;
}
function askHref(locale,layer,id){
 const p=new URLSearchParams({
  contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-6',
  contextLabel:locale==='zh-Hans'?'《世界如何重组》· 文明重组图谱':'Reality Reconfiguration · Civilization Reconfiguration Atlas',
  contextRoute:'/books/reality-configuration/#atlas',
  readingPath:`BOOK-6 > PART-13 > RECONFIGURATION > ${layer}`,
  relatedKnowledgeRef:'BOOK:BOOK-6',
  retrievalScope:JSON.stringify(scopeFor(layer,id))
 });
 return '/knowledge/ask/?'+p.toString();
}
function resultRows(data,l){
 const rows=[];
 for(const x of data.sections?.sections||[])rows.push({type:'BOOK_SECTION',id:x.id,label:l==='zh-Hans'?x.titleZh:x.titleEn,detail:x.groupZh||x.groupEn,layer:'sections',raw:x});
 for(const x of data.cases?.cases||[])rows.push({type:'CASE',id:x.id,label:l==='zh-Hans'?x.titleZh:x.titleEn,detail:(x.caseTypes||[]).join(' · '),layer:'cases',raw:x});
 for(const x of data.windows?.windows||[])rows.push({type:'WINDOW',id:x.id,label:l==='zh-Hans'?x.titleZh:x.titleEn,detail:`${x.startYear}–${x.endYear}`,layer:'windows',raw:x});
 for(const x of data.snapshots?.snapshots||[])rows.push({type:'SNAPSHOT',id:x.id,label:l==='zh-Hans'?x.metadata?.titleZh:x.metadata?.titleEn,detail:String(x.year),layer:'snapshots',raw:x});
 for(const x of data.dossiers?.dossiers||[])rows.push({type:'DOSSIER',id:x.id,label:loc(x.entity,l),detail:x.entityType,layer:'dossiers',raw:x});
 for(const x of data.lived?.dimensions||[])rows.push({type:'LIVED_REALITY',id:x.id,label:l==='zh-Hans'?x.labelZh:x.labelEn,detail:l==='zh-Hans'?'观察值 · 推导 · 未知':'observed · derived · unknown',layer:'lived',raw:x});
 return rows;
}
function renderSearch(host,data,l,state,rerender){
 const c=COPY[l],q=searchText(state.query).trim();
 const rows=resultRows(data,l).filter(row=>!q||searchText([row.type,row.id,row.label,row.detail,JSON.stringify(row.raw)].join(' ')).includes(q)).slice(0,80);
 host.innerHTML=`<label class="civ-reconfig-search">${esc(c.search)}<input type="search" value="${esc(state.query)}" placeholder="${esc(c.searchPlaceholder)}" data-rc-query></label><div class="civ-reconfig-search-results" aria-live="polite">${rows.map(row=>`<article class="wpr-part-card"><small>${esc(row.type)}</small><h4>${esc(row.label)}</h4><p>${esc(row.detail||'')}</p><a href="${esc(askHref(l,row.layer,row.id))}">${esc(c.ask)}</a></article>`).join('')}</div>`;
 host.querySelector('[data-rc-query]')?.addEventListener('input',e=>{state.query=e.target.value;rerender();});
}
function renderCases(host,data,l,state,rerender){
 const c=COPY[l],q=searchText(state.caseQuery).trim();
 const rows=(data.cases?.cases||[]).filter(x=>!q||searchText([x.titleZh,x.titleEn,x.id,...(x.caseTypes||[]),...(x.regions||[]),...(x.triggers||[]),...(x.pressureField||[])].join(' ')).includes(q));
 host.innerHTML=`<label class="civ-reconfig-search">${esc(c.search)}<input type="search" value="${esc(state.caseQuery)}" data-rc-case-search></label><div class="civ-reconfig-grid">${rows.map(x=>`<article class="wpr-part-card"><small>${esc(x.id)}</small><h4>${esc(l==='zh-Hans'?x.titleZh:x.titleEn)}</h4><p>${esc((x.caseTypes||[]).join(' · '))}</p><label><input type="checkbox" data-rc-compare="${esc(x.id)}" ${state.caseCompare.includes(x.id)?'checked':''}> ${esc(c.compare)}</label><a href="${esc(askHref(l,'cases',x.id))}">${esc(c.ask)}</a></article>`).join('')}</div>`;
 host.querySelector('[data-rc-case-search]')?.addEventListener('input',e=>{state.caseQuery=e.target.value;rerender();});
 host.querySelectorAll('[data-rc-compare]').forEach(el=>el.addEventListener('change',()=>{const s=new Set(state.caseCompare);el.checked?s.add(el.dataset.rcCompare):s.delete(el.dataset.rcCompare);state.caseCompare=[...s].slice(0,4);rerender();}));
}
function renderCaseCompare(host,data,l,state){
 const c=COPY[l],map=new Map((data.cases?.cases||[]).map(x=>[x.id,x])),rows=state.caseCompare.map(id=>map.get(id)).filter(Boolean);
 host.innerHTML=`<p>${esc(c.noRank)}</p>${rows.length?'<div class="civ-reconfig-grid">'+rows.map(x=>`<article class="wpr-part-card"><h4>${esc(l==='zh-Hans'?x.titleZh:x.titleEn)}</h4><dl><dt>Prior Runtime</dt><dd>${esc(status(x.priorRuntime,l))}</dd><dt>Trigger</dt><dd>${esc(status(x.trigger,l))}</dd><dt>Pressure</dt><dd>${esc((x.pressureField||[]).join(' · ')||c.unknown)}</dd><dt>Removed / Preserved / Added</dt><dd>${esc([...(x.elementsRemoved||[]),...(x.elementsPreserved||[]),...(x.elementsAdded||[])].join(' · ')||c.unknown)}</dd><dt>Successor Runtime</dt><dd>${esc(status(x.successorRuntime,l))}</dd><dt>Unknown</dt><dd>${esc((x.unknown||[]).join(' · ')||c.unknown)}</dd></dl></article>`).join('')+'</div>':`<p>${esc(l==='zh-Hans'?'在「案例」中选择最多四项。':'Select up to four cases in Cases.')}</p>`}`;
}
function renderWindows(host,data,l){
 const c=COPY[l];
 host.innerHTML=`<div class="civ-reconfig-grid">${(data.windows?.windows||[]).map(w=>`<article class="wpr-part-card"><h4>${esc(l==='zh-Hans'?w.titleZh:w.titleEn)}</h4><p>${esc(w.startYear)}–${esc(w.endYear)}</p><p>${esc((w.unknown||[]).join(' · ')||c.unknown)}</p><a href="${esc(askHref(l,'windows',w.id))}">${esc(c.ask)}</a></article>`).join('')}</div>`;
}
function renderSnapshots(host,data,l){
 const c=COPY[l];
 host.innerHTML=(data.snapshots?.snapshots||[]).map(s=>`<article class="civ-reconfig-snapshot"><h4>${esc(l==='zh-Hans'?s.metadata.titleZh:s.metadata.titleEn)}</h4><p><strong>${esc(c.version)}:</strong> ${esc(s.version)}</p>${s.asset?.resolutionStatus==='MISSING'?`<div role="status"><strong>${esc(c.missing)}</strong><br><code>${esc(s.asset.r2Path)}</code></div>`:`<figure><img loading="lazy" src="${esc(s.asset.publicUrl)}" alt=""><figcaption>${esc(l==='zh-Hans'?'静态底图；资料、图例与当前数据由结构化 HTML 承担。':'Static base visual; data, legend and current information are owned by structured HTML.')}</figcaption></figure>`}<details><summary>${esc(l==='zh-Hans'?'结构层':'Structured layers')}</summary><p>${esc((s.structuredLayers||[]).join(' · '))}</p></details><a href="${esc(askHref(l,'snapshots',s.id))}">${esc(c.ask)}</a></article>`).join('');
}
function renderDossiers(host,data,l,state,rerender){
 const c=COPY[l];
 host.innerHTML=`<p>${esc(c.noRank)}</p><div class="civ-reconfig-grid">${(data.dossiers?.dossiers||[]).map(d=>`<article class="wpr-part-card"><h4>${esc(loc(d.entity,l))}</h4><p><strong>${esc(l==='zh-Hans'?'资料状态':'Data state')}:</strong> ${esc(d.dataClass)}</p><p><strong>${esc(l==='zh-Hans'?'新鲜度':'Freshness')}:</strong> ${esc(d.sourceFreshness)}</p><p><strong>${esc(c.version)}:</strong> ${esc(d.version)} · <strong>${esc(c.previous)}:</strong> ${esc(d.supersedes||c.none)}</p><dl><dt>Capacity</dt><dd>${esc(status(d.capacity,l))}</dd><dt>Load</dt><dd>${esc(status(d.load,l))}</dd><dt>Future Capacity</dt><dd>${esc(status(d.futureCapacity,l))}</dd></dl><label><input type="checkbox" data-rc-dossier-compare="${esc(d.id)}" ${state.dossierCompare.includes(d.id)?'checked':''}> ${esc(c.compareRuntime)}</label><a href="${esc(askHref(l,'dossiers',d.id))}">${esc(c.ask)}</a></article>`).join('')}</div>`;
 host.querySelectorAll('[data-rc-dossier-compare]').forEach(el=>el.addEventListener('change',()=>{const s=new Set(state.dossierCompare);el.checked?s.add(el.dataset.rcDossierCompare):s.delete(el.dataset.rcDossierCompare);state.dossierCompare=[...s].slice(0,4);rerender();}));
}
function renderDossierCompare(host,data,l,state){
 const c=COPY[l],map=new Map((data.dossiers?.dossiers||[]).map(x=>[x.id,x])),rows=state.dossierCompare.map(id=>map.get(id)).filter(Boolean);
 const fields=['stage','scale','density','capacity','load','alignment','resilience','adaptability','expansionCapacity','futureCapacity'];
 host.innerHTML=`<p>${esc(c.noRank)}</p>${rows.length?'<div class="civ-reconfig-grid">'+rows.map(d=>`<article class="wpr-part-card"><h4>${esc(loc(d.entity,l))}</h4><dl>${fields.map(f=>`<dt>${esc(f)}</dt><dd>${esc(status(d[f],l))}</dd>`).join('')}<dt>External Dependency</dt><dd>${esc((d.externalDependency||[]).join(' · ')||c.unknown)}</dd><dt>Lived Reality</dt><dd>${esc(Object.entries(d.livedReality||{}).map(([k,v])=>k+': '+status(v?.state,l)).join(' · '))}</dd><dt>Unknown</dt><dd>${esc((d.unknown||[]).join(' · ')||c.unknown)}</dd></dl></article>`).join('')+'</div>':`<p>${esc(l==='zh-Hans'?'在「当代 Runtime」中选择最多四项。':'Select up to four dossiers in Contemporary Runtime.')}</p>`}`;
}
function renderLived(host,data,l){
 const c=COPY[l];
 host.innerHTML=`<p>${esc(c.noRank)}</p><div class="civ-reconfig-grid">${(data.lived?.dimensions||[]).map(d=>`<article class="wpr-part-card"><h4>${esc(l==='zh-Hans'?d.labelZh:d.labelEn)}</h4><p>${esc(l==='zh-Hans'?'允许：观察值 · 推导 · 未知':'Allows: observed · derived · unknown')}</p><strong>${esc(l==='zh-Hans'?'不转换为 0–100 分数':'No 0–100 score')}</strong><a href="${esc(askHref(l,'lived',d.id))}">${esc(c.ask)}</a></article>`).join('')}</div>`;
}
export function mountReconfigurationAtlas(root,data,{locale='en'}={}){
 const l=locale==='zh-Hans'?'zh-Hans':'en',c=COPY[l],state={tab:'search',query:'',caseQuery:'',caseCompare:[],dossierCompare:[]};
 if(!document.getElementById('book6-reconfig-style')){const st=document.createElement('style');st.id='book6-reconfig-style';st.textContent='[data-atlas-mode="reconfiguration"]{padding:3rem 0}.civ-reconfig-shell{max-width:1180px;margin:auto;padding:0 1rem}.civ-reconfig-tabs{display:flex;gap:.5rem;overflow:auto;margin:1.25rem 0}.civ-reconfig-tabs button{padding:.7rem 1rem}.civ-reconfig-tabs button[aria-selected="true"]{font-weight:700}.civ-reconfig-grid,.civ-reconfig-search-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem}.civ-reconfig-search{display:grid;gap:.4rem;max-width:720px;margin-bottom:1rem}.civ-reconfig-search input{padding:.7rem}.civ-reconfig-snapshot{border:1px solid #d5b36c66;border-radius:14px;padding:1rem;margin:1rem 0}.civ-reconfig-snapshot img{display:block;max-width:100%;height:auto}.wpr-part-card label,.wpr-part-card a{display:block;margin-top:.7rem}.civ-reconfig-tabs :focus-visible,[data-atlas-mode="reconfiguration"] a:focus-visible,[data-atlas-mode="reconfiguration"] input:focus-visible{outline:3px solid currentColor;outline-offset:3px}';document.head.append(st);}
 const tabs=[['search',c.search],['cases',c.cases],['windows',c.windows],['snapshots',c.snapshots],['dossiers',c.dossiers],['lived',c.lived],['compare',c.compare],['dossiercompare',c.compareRuntime]];
 const render=()=>{root.innerHTML=`<div class="civ-reconfig-shell"><p class="knowledge-eyebrow">${esc(c.eyebrow)}</p><h2>${esc(c.title)}</h2><p>${esc(c.lead)}</p><p class="knowledge-boundary">${esc(c.noRank)}</p><nav class="civ-reconfig-tabs" aria-label="${esc(c.eyebrow)}">${tabs.map(([id,label])=>`<button type="button" data-rc-tab="${id}" aria-selected="${state.tab===id?'true':'false'}">${esc(label)}</button>`).join('')}</nav><section data-rc-panel tabindex="-1"></section></div>`;
  root.querySelectorAll('[data-rc-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.rcTab;render();}));
  const h=root.querySelector('[data-rc-panel]');
  if(state.tab==='search')renderSearch(h,data,l,state,render);
  else if(state.tab==='cases')renderCases(h,data,l,state,render);
  else if(state.tab==='compare')renderCaseCompare(h,data,l,state);
  else if(state.tab==='windows')renderWindows(h,data,l);
  else if(state.tab==='snapshots')renderSnapshots(h,data,l);
  else if(state.tab==='dossiers')renderDossiers(h,data,l,state,render);
  else if(state.tab==='dossiercompare')renderDossierCompare(h,data,l,state);
  else renderLived(h,data,l);
 };
 render();root.dataset.atlasReady='true';root.dataset.atlasRegistryCounts=`85/${data.cases?.cases?.length||0}/${data.windows?.windows?.length||0}/${data.snapshots?.snapshots?.length||0}/${data.dossiers?.dossiers?.length||0}/${data.lived?.dimensions?.length||0}`;
}
