import {t} from '../../i18n.js';
import {resolveAtlasVisualById} from './atlas-static-visual.js';

const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const loc=(v,l)=>v?.[l]||v?.en||v?.['zh-Hans']||v||'';
const clean=v=>String(v??'').normalize('NFKC').trim();
const searchText=v=>clean(v).toLocaleLowerCase();
const PAGE=12,SEARCH_PAGE=24;
const tr=(key,fallback='')=>t(`book6Atlas.${key}`,{},fallback);
const humanize=v=>String(v??'').replaceAll('_',' ').replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase());
const UI_KEYS=['eyebrow','title','lead','overview','search','cases','timeline','windows','snapshots','dossiers','lived','visuals','compare','compareRuntime','unknown','missing','unverified','ask','noRank','open','previous','next','filters','clear','results','version','previousVersion','dataState','freshness','layer','textAlternative','selectDossier','selectSnapshot','selectDimension','pagination','imageBaseNote','resolverMissing','relatedCases','state','all','allTime','allRegions','allTypes','timeWindow','region','caseType','trigger','pressureField','structuralChange','reconfigurationWindow','linkedCases','dimension','evidenceDate','historicalVersionNote','selectCasesFirst','selectDossiersFirst','noUniversalScore','livedProfile','visualLibrary','visualLibraryLead','visualFamily','visualSubject','visualCount','contextFigures','currentDataNotAdmitted','currentDataBoundary','runtimeReadout','runtimeReadoutLead','runtimeEvidenceGateOpen','runtimeConfidence','runtimeConfidenceUnknown','runtimeNeeds','runtimeNeedEvidence','runtimeNeedObservation','runtimeNeedMethod','runtimeHistoricalContext','runtimeEngineBoundary','runtimeLoading','runtimeUnavailable','historicalEvidence','searchPlaceholder'];
const copy=()=>Object.fromEntries(UI_KEYS.map(k=>[k,tr('ui.'+k,humanize(k))]));
const COPY={get en(){return copy();},get 'zh-Hans'(){return copy();}};
const LIVED_GUIDE=Object.freeze({
 livingEnvironment:{'zh-Hans':'观察居住环境、基础服务、城市条件与日常稳定性如何受到重组影响。',en:'Tracks how housing environment, basic services, urban conditions, and everyday stability are affected by reconfiguration.'},
 employmentOpportunity:{'zh-Hans':'观察工作机会、进入门槛、岗位分布与机会可得性如何变化。',en:'Tracks changes in job availability, entry barriers, opportunity distribution, and access to work.'},
 jobQuality:{'zh-Hans':'观察工作稳定性、保障、技能使用、劳动条件与长期可持续性。',en:'Tracks stability, protection, skill use, working conditions, and long-term sustainability of work.'},
 incomeCostBalance:{'zh-Hans':'观察收入能力、生活成本、家庭预算空间与实际购买力之间的关系。',en:'Tracks the relationship among earning capacity, living costs, household budget room, and real purchasing power.'},
 housingPressure:{'zh-Hans':'观察住房可得性、租购负担、居住稳定性与空间压力。',en:'Tracks housing access, rent or ownership burden, residential stability, and spatial pressure.'},
 timePressure:{'zh-Hans':'观察通勤、照护、工作与制度摩擦如何占用个人可支配时间。',en:'Tracks how commuting, care, work, and institutional friction consume discretionary time.'},
 workPressure:{'zh-Hans':'观察工作强度、绩效要求、不稳定性与职业风险如何进入日常生活。',en:'Tracks how work intensity, performance demands, instability, and career risk enter daily life.'},
 healthLoad:{'zh-Hans':'观察医疗可得性、环境暴露、照护负担与身体健康压力。',en:'Tracks healthcare access, environmental exposure, care burden, and physical health pressure.'},
 psychologicalLoad:{'zh-Hans':'观察不确定性、工作与生活压力如何累积为心理负担。',en:'Tracks how uncertainty and work-life pressures accumulate into psychological load.'},
 subjectiveWellbeing:{'zh-Hans':'观察个人对生活质量、稳定感、希望感与整体处境的评价。',en:'Tracks how people assess quality of life, stability, hope, and their overall situation.'},
 security:{'zh-Hans':'观察人身、经济、制度与未来不确定性对安全感的影响。',en:'Tracks how personal, economic, institutional, and future uncertainty shape felt security.'},
 socialConnection:{'zh-Hans':'观察家庭、社区、工作关系与社会支持网络的连接强度。',en:'Tracks the strength of family, community, workplace, and social-support connections.'},
 mobility:{'zh-Hans':'观察教育、职业、迁移与社会位置改变的可进入路径。',en:'Tracks access to education, careers, migration, and pathways for changing social position.'},
 personalFutureCapacity:{'zh-Hans':'观察一个人是否仍拥有学习、选择、调整与建立未来的现实空间。',en:'Tracks whether a person still has practical room to learn, choose, adapt, and build a future.'}
});
const PHRASE_KEY_BY_TEXT=Object.freeze({
 'Existing institutional configuration before reform':'PRIOR_REFORM',
 'Prior system configuration':'PRIOR_SYSTEM',
 'Pre-revolutionary political and institutional configuration':'PRIOR_REVOLUTION',
 'Pre-war political and institutional configuration':'PRIOR_WAR',
 'Pre-collapse system configuration':'PRIOR_COLLAPSE',
 'Prior economic and coordination configuration':'PRIOR_ECONOMIC',
 'Prior technical and network configuration':'PRIOR_TECH',
 'Colonial political and administrative configuration':'PRIOR_COLONIAL',
 'Governed reform and policy reconfiguration':'TRIGGER_REFORM',
 'System reconfiguration pressure':'TRIGGER_SYSTEM',
 'Revolutionary rupture':'TRIGGER_REVOLUTION',
 'Armed conflict / wartime mobilization':'TRIGGER_WAR',
 'System breakdown / loss of coordinating continuity':'TRIGGER_COLLAPSE',
 'Economic-system pressure or institutional change':'TRIGGER_ECONOMIC',
 'Technology adoption / infrastructure transition':'TRIGGER_TECH',
 'Decolonization / sovereignty transfer':'TRIGGER_DECOLONIZATION',
 'Revised institutional and economic configuration':'SUCCESSOR_REFORM',
 'Successor system configuration':'SUCCESSOR_SYSTEM',
 'Successor political and institutional configuration':'SUCCESSOR_POLITICAL',
 'Post-conflict institutional and system configuration':'SUCCESSOR_CONFLICT',
 'Successor states or institutions':'SUCCESSOR_STATES',
 'Reconfigured economic and network arrangement':'SUCCESSOR_ECONOMIC',
 'Reconfigured technical and coordination layer':'SUCCESSOR_TECH',
 'Post-colonial state or regional configuration':'SUCCESSOR_POSTCOLONIAL',
 'See manuscript-grounded case scope; granular causal weighting is not asserted in B6-WEB-C.':'CASE_PRESSURE_BOUNDARY',
 'Granular causal attribution, quantitative effects and contested interpretations are not filled by inference.':'CASE_UNKNOWN_BOUNDARY',
 'Window pressure is represented by the governed set of overlapping cases; no synthetic ranking is created.':'WINDOW_PRESSURE_BOUNDARY',
 'Successor configurations remain case-scoped; this window does not assert one deterministic outcome.':'WINDOW_SUCCESSOR_BOUNDARY',
 'Window-level causal weighting remains UNKNOWN; linked cases retain their own evidence boundaries.':'WINDOW_UNKNOWN_BOUNDARY',
 'Current-data evidence has not been admitted. UNKNOWN is the governed output.':'DOSSIER_CURRENT_NOT_ADMITTED'
});
const VALUE_ENUMS=new Set(['UNKNOWN','UNVERIFIED','NOT_APPLICABLE','NOT_CURRENT_DATA','CURRENT_DATA_NOT_ADMITTED','CONTRACT_READY_CURRENT_DATA_NOT_ADMITTED','ACTIVE','SUPERSEDED']);
const stateLabel=v=>tr('knowledgeState.'+String(v||'UNKNOWN'),humanize(v||'UNKNOWN'));
const typeLabel=v=>tr('caseType.'+String(v||''),humanize(v));
const resultTypeLabel=(v,l='en')=>v==='RUNTIME_POSITION'?(l==='zh-Hans'?'运行位置':'Runtime position'):tr('resultType.'+String(v||''),humanize(v));
const entityTypeLabel=v=>tr('entityType.'+String(v||''),humanize(v));
const regionLabel=v=>tr('region.'+String(v||''),humanize(v));
const fieldLabel=v=>tr('field.'+String(v||''),humanize(v));
const layerLabel=v=>tr('layer.'+String(v||''),humanize(v));
const changeLabel=v=>tr('change.'+String(v||''),typeLabel(v));
const visualFamilyLabel=v=>tr('visualFamily.'+String(v||''),humanize(v));
const W6_STATE_ZH=Object.freeze({
 NO_ADMITTED_CURRENT_EVIDENCE:'尚无已验收当前证据',
 OBSERVATION_TARGET_ONLY:'观察目标',
 NO_OBSERVED_SIGNAL_ADMITTED:'尚无已验收转移讯号',
 NOT_EVALUATED:'尚未评估',
 EVIDENCE_INCOMPLETE:'证据不足',
 CANDIDATE_FOR_HUMAN_REVIEW:'待人工阈值审查',
 HUMAN_CONFIRMED:'人工确认',
 HUMAN_REJECTED:'人工否决',
 BLOCKED_NO_ADMITTED_CURRENT_EVIDENCE:'因缺少当前证据而阻断',
 UNKNOWN:'未知',
 PRESENT:'存在',
 ABSENT:'不存在',
 CONFLICTED:'证据冲突'
});
const w6StateLabel=(v,l='en')=>l==='zh-Hans'?(W6_STATE_ZH[String(v||'UNKNOWN')]||humanize(v||'UNKNOWN')):humanize(v||'UNKNOWN');
const W7_STATE_ZH=Object.freeze({
 NOT_STARTED:'尚未开始',
 SOURCE_CANDIDATES_DISCOVERED:'已发现来源候选',
 SOURCE_ADMISSION_READY:'来源待验收',
 CURRENT_EVIDENCE_ADMITTED:'当前证据已验收',
 RRE_READY:'运行读取已准备',
 POSITION_CANDIDATE_READY:'运行位置候选已准备',
 POSITION_HUMAN_REVIEW:'运行位置待人工验收',
 POSITION_ADMITTED:'运行位置已验收',
 TRANSITION_SIGNAL_REVIEW:'转移讯号待验收',
 THRESHOLD_REVIEW:'观察阈值待验收',
 CONDITIONAL_PROJECTION_READY:'条件性投影已准备',
 BLOCKED_PENDING_ADMITTED_EVIDENCE:'等待已验收证据',
 EVIDENCE_READY:'证据已准备',
 INSUFFICIENT_EVIDENCE:'证据不足',
 HUMAN_REVIEW_READY:'待人工验收',
 ADMITTED:'已验收',
 REJECTED:'已否决'
});
const w7StateLabel=(v,l='en')=>l==='zh-Hans'?(W7_STATE_ZH[String(v||'NOT_STARTED')]||humanize(v||'NOT_STARTED')):humanize(v||'NOT_STARTED');
const W7_LANE_LABEL=Object.freeze({
 DEMOGRAPHY:{'zh-Hans':'人口',en:'Demography'},
 INDUSTRY:{'zh-Hans':'产业',en:'Industry'},
 INFRASTRUCTURE:{'zh-Hans':'基础设施',en:'Infrastructure'},
 ENERGY:{'zh-Hans':'能源',en:'Energy'},
 TRADE_SUPPLY_CHAIN:{'zh-Hans':'贸易与供应链',en:'Trade & supply chain'},
 FINANCE_FISCAL:{'zh-Hans':'金融与财政',en:'Finance & fiscal'},
 TECHNOLOGY:{'zh-Hans':'科技',en:'Technology'},
 LABOUR_SKILLS:{'zh-Hans':'劳动与技能',en:'Labour & skills'},
 HOUSING_URBAN:{'zh-Hans':'住房与城市',en:'Housing & urban'},
 EXTERNAL_DEPENDENCY:{'zh-Hans':'外部依赖',en:'External dependency'},
 CARRIER_STRUCTURE:{'zh-Hans':'载体结构',en:'Carrier structure'},
 PRESSURE_FIELD:{'zh-Hans':'压力场',en:'Pressure field'}
});
const w7LaneLabel=(id,l='en')=>W7_LANE_LABEL[id]?.[l]||W7_LANE_LABEL[id]?.en||humanize(id);
const valueLabel=(v,l='en')=>{
 if(v==null||v==='')return tr('ui.unknown','Unknown');
 if(typeof v==='string'){
  const upper=v.toUpperCase();
  if(VALUE_ENUMS.has(upper))return tr('value.'+upper,humanize(upper));
  if(/^[A-Z][A-Z0-9_]+$/.test(v))return tr('value.'+v,humanize(v));
  const phraseKey=PHRASE_KEY_BY_TEXT[v];
  if(phraseKey)return tr('phrase.'+phraseKey,v);
  if(l==='zh-Hans'){
   const duration=v.match(/^(\d+) years? \(registry window; not a causal-duration claim\)$/);
   if(duration)return `${duration[1]} 年（登记窗口；不代表因果持续时长）`;
  }
 }
 return String(v);
};
const status=(v,l)=>valueLabel(v,l);
const listText=(v,l)=>Array.isArray(v)&&v.length?v.map(x=>valueLabel(x,l)).join(' · '):tr('ui.unknown','Unknown');
const uniq=a=>[...new Set((a||[]).filter(Boolean))];
function scopeFor(layer,o={}){
 const base={schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v2.0.0',scopeType:'CIVILIZATION_RECONFIGURATION_ATLAS',bookCode:'BOOK-6',partCode:'PART-13',activeLayer:layer};
 for(const k of ['entityId','windowId','snapshotId','dossierId','livedRealityDimensionId','positionId','sectionId'])if(o[k])base[k]=o[k];
 if(o.caseIds?.length)base.caseIds=o.caseIds.slice(0,4);if(o.comparisonIds?.length)base.comparisonIds=o.comparisonIds.slice(0,4);return base;
}
function askHref(locale,layer,o={}){
 const p=new URLSearchParams({contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-6',contextLabel:locale==='zh-Hans'?'《世界如何重组》· 文明重组图谱':'Reality Reconfiguration · Civilization Reconfiguration Atlas',contextRoute:'/books/reality-configuration/#atlas',readingPath:`BOOK-6 > PART-13 > RECONFIGURATION > ${layer}`,relatedKnowledgeRef:'BOOK:BOOK-6',retrievalScope:JSON.stringify(scopeFor(layer,o))});
 return '/knowledge/ask/?'+p.toString();
}
const badge=(value,l)=>`<span class="civ-reconfig-badge" data-state="${esc(value||'UNKNOWN')}">${esc(stateLabel(value,l))}</span>`;
const options=(rows,value,label,all,l)=>`<option value="">${esc(all)}</option>`+rows.map(x=>`<option value="${esc(value(x))}">${esc(label(x,l))}</option>`).join('');
function set(store,patch,source='ui'){store.set(patch,{source});}
function selectValue(el,value){
 if(!el)return;
 const target=String(value??'');
 const option=[...(el.options||[])].find(o=>o.value===target);
 if(option)option.selected=true;
}
function selectedValue(el){
 return el?.querySelector?.('option:checked')?.value ?? el?.options?.[0]?.value ?? el?.value ?? '';
}
function resultRows(data,l){
 const rows=[];
 for(const x of data.sections?.sections||[])rows.push({type:'BOOK_SECTION',id:x.id,label:l==='zh-Hans'?x.titleZh:x.titleEn,detail:l==='zh-Hans'?x.groupZh:x.groupEn,layer:'search',scope:{sectionId:x.id,entityId:x.id},raw:x});
 for(const x of data.cases?.cases||[])rows.push({type:'CASE',id:x.id,label:l==='zh-Hans'?x.titleZh:x.titleEn,detail:[x.timeLabel,...(x.caseTypes||[]).map(t=>typeLabel(t,l))].filter(Boolean).join(' · '),layer:'cases',scope:{entityId:x.id},raw:x});
 for(const x of data.windows?.windows||[])rows.push({type:'WINDOW',id:x.id,label:l==='zh-Hans'?x.titleZh:x.titleEn,detail:`${x.startYear}–${x.endYear}`,layer:'windows',scope:{windowId:x.id,entityId:x.id},raw:x});
 for(const x of data.snapshots?.snapshots||[])rows.push({type:'SNAPSHOT',id:x.id,label:l==='zh-Hans'?x.metadata?.titleZh:x.metadata?.titleEn,detail:String(x.year),layer:'snapshots',scope:{snapshotId:x.id,entityId:x.id},raw:x});
 for(const x of data.dossiers?.dossiers||[])rows.push({type:'DOSSIER',id:x.id,label:loc(x.entity,l),detail:[entityTypeLabel(x.entityType),stateLabel(x.dataClass,l),x.version].filter(Boolean).join(' · '),layer:'dossiers',scope:{dossierId:x.id,entityId:x.id},raw:x});
 for(const x of data.lived?.dimensions||[])rows.push({type:'LIVED_REALITY',id:x.id,label:l==='zh-Hans'?x.labelZh:x.labelEn,detail:l==='zh-Hans'?'观察值 · 推导 · 未知':'Observed · Derived · Unknown',layer:'lived',scope:{livedRealityDimensionId:x.id,entityId:x.id},raw:x});
 for(const x of data.positions?.positions||[])rows.push({type:'RUNTIME_POSITION',id:x.id,label:loc(x.shortLabel,l)||x.id,detail:[loc(x.realityDomain,l),x.sourceContext?.id,x.accessState].filter(Boolean).join(' · '),layer:'positions',scope:{positionId:x.id,entityId:x.id},raw:x});
 return rows;
}
function openPatch(row){return row.type==='CASE'?{activeLayer:'cases',primaryCaseId:row.id}:row.type==='WINDOW'?{activeLayer:'windows',windowId:row.id}:row.type==='SNAPSHOT'?{activeLayer:'snapshots',snapshotId:row.id}:row.type==='DOSSIER'?{activeLayer:'dossiers',dossierId:row.id}:row.type==='LIVED_REALITY'?{activeLayer:'lived',livedRealityDimensionId:row.id}:row.type==='RUNTIME_POSITION'?{activeLayer:'positions',positionId:row.id}:{activeLayer:'search',query:row.id,sectionId:row.id};}
function pager(host,page,count,onPage,l){
 const pages=Math.max(1,Math.ceil(count/PAGE));if(pages<=1)return;
 const nav=document.createElement('nav');nav.className='civ-reconfig-pager';nav.setAttribute('aria-label',COPY[l].pagination);
 nav.innerHTML=`<button type="button" data-prev ${page<=1?'disabled':''}>← ${esc(COPY[l].previous)}</button><span>${page} / ${pages}</span><button type="button" data-next ${page>=pages?'disabled':''}>${esc(COPY[l].next)} →</button>`;
 nav.querySelector('[data-prev]')?.addEventListener('click',()=>onPage(page-1));nav.querySelector('[data-next]')?.addEventListener('click',()=>onPage(page+1));host.append(nav);
}
function renderOverview(host,data,l,store){
 const c=COPY[l],cards=[[c.cases,data.cases?.cases?.length||0,'cases'],[c.timeline,data.windows?.windows?.length||0,'timeline'],[c.snapshots,data.snapshots?.snapshots?.length||0,'snapshots'],[c.dossiers,data.dossiers?.dossiers?.length||0,'dossiers'],[c.lived,data.lived?.dimensions?.length||0,'lived'],[l==='zh-Hans'?'运行位置':'Runtime positions',data.positions?.positions?.length||0,'positions']];
 host.innerHTML=`<div class="civ-reconfig-overview">${cards.map(([label,n,tab])=>`<button class="civ-reconfig-card civ-reconfig-overview-card" data-open="${tab}"><strong>${esc(String(n))}</strong><span>${esc(label)}</span></button>`).join('')}</div><section class="civ-reconfig-state-legend"><h3>${esc(COPY[l].dataState)}</h3><div class="civ-reconfig-chip-row">${['CANONICAL_HISTORY','HISTORICAL_RECONSTRUCTION','STRUCTURAL_KNOWLEDGE','OBSERVED_SIGNAL','CURRENT_DATA','DERIVED_RUNTIME_READOUT','CONDITIONAL_PROJECTION','UNKNOWN'].map(s=>badge(s,l)).join('')}</div><p>${esc(c.noRank)}</p></section>`;
 host.querySelectorAll('[data-open]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:btn.dataset.open},'overview-nav'));
}
function renderSearch(host,data,l,state,store){
 const c=COPY[l],q=searchText(state.query),all=resultRows(data,l).filter(row=>!q||searchText([row.type,row.id,row.label,row.detail,JSON.stringify(row.raw)].join(' ')).includes(q)),page=Math.min(state.searchPage,Math.max(1,Math.ceil(all.length/SEARCH_PAGE))),rows=all.slice((page-1)*SEARCH_PAGE,page*SEARCH_PAGE);
 host.innerHTML=`<label class="civ-reconfig-search">${esc(c.search)}<input type="search" value="${esc(state.query)}" placeholder="${esc(c.searchPlaceholder)}" data-query></label><p class="cx-meta">${all.length} ${esc(c.results)}</p><div class="civ-reconfig-search-results">${rows.map(row=>`<article class="civ-reconfig-card"><small>${esc(resultTypeLabel(row.type,l))}</small><h4>${esc(row.label)}</h4><p>${esc(row.detail)}</p><div class="civ-reconfig-actions"><button type="button" data-open-id="${esc(row.id)}">${esc(c.open)}</button><a href="${esc(askHref(l,row.type==='BOOK_SECTION'?'sections':row.layer,row.scope))}">${esc(c.ask)}</a></div></article>`).join('')}</div>`;
 host.querySelector('[data-query]')?.addEventListener('change',e=>set(store,{query:e.target.value,searchPage:1},'search'));
 host.querySelectorAll('[data-open-id]').forEach(btn=>{const row=resultRows(data,l).find(r=>r.id===btn.dataset.openId);btn.onclick=()=>row&&set(store,openPatch(row),'search-open');});
 if(Math.ceil(all.length/SEARCH_PAGE)>1){const nav=document.createElement('nav');nav.className='civ-reconfig-pager';nav.setAttribute('aria-label',c.pagination);nav.innerHTML=`<button type="button" aria-label="${esc(c.previous)}" ${page<=1?'disabled':''} data-prev>← ${esc(c.previous)}</button><span>${page} / ${Math.ceil(all.length/SEARCH_PAGE)}</span><button type="button" aria-label="${esc(c.next)}" ${page>=Math.ceil(all.length/SEARCH_PAGE)?'disabled':''} data-next>${esc(c.next)} →</button>`;nav.querySelector('[data-prev]')?.addEventListener('click',()=>set(store,{searchPage:page-1},'search-page'));nav.querySelector('[data-next]')?.addEventListener('click',()=>set(store,{searchPage:page+1},'search-page'));host.append(nav);}
}
function caseChangeMatch(x,f){
 if(!f)return true;if(['WAR','REVOLUTION','REFORM','COLLAPSE','SUCCESSION','DECOLONIZATION','TECHNOLOGICAL_RECONFIGURATION','NETWORK_RECONFIGURATION'].includes(f))return (x.caseTypes||[]).includes(f);
 if(f==='carrier')return (x.carrierBefore||[]).length||(x.carrierAfter||[]).length;
 if(f==='boundary')return x.boundaryChange&&x.boundaryChange!=='UNKNOWN';
 if(f==='institutional')return x.institutionalChange&&x.institutionalChange!=='UNKNOWN';
 if(f==='economic')return (x.caseTypes||[]).includes('ECONOMIC_RECONFIGURATION')||(x.economicChange&&x.economicChange!=='UNKNOWN');
 return true;
}
function filteredCases(data,state){
 const q=searchText(state.caseSearch),trigger=searchText(state.triggerQuery),pressure=searchText(state.pressureQuery),win=(data.windows?.windows||[]).find(w=>w.id===state.filterWindowId);
 return (data.cases?.cases||[]).filter(x=>{
  if(q&&!searchText([x.id,x.titleZh,x.titleEn,x.timeLabel,...(x.regions||[]),...(x.caseTypes||[]),x.priorRuntime,x.successorRuntime].join(' ')).includes(q))return false;
  if(state.regionId&&!(x.regions||[]).includes(state.regionId))return false;if(state.caseType&&!(x.caseTypes||[]).includes(state.caseType))return false;
  if(win&&!(x.timeStart<=win.endYear&&x.timeEnd>=win.startYear))return false;
  if(trigger&&!searchText([x.trigger,...(x.triggers||[])].join(' ')).includes(trigger))return false;
  if(pressure&&!searchText(x.pressureField||[]).includes(pressure))return false;
  return caseChangeMatch(x,state.changeFilter);
 });
}
function caseDetail(x,l,data,store){
 const c=COPY[l];if(!x)return'';
 const zh=l==='zh-Hans';
 const title=zh?x.titleZh:x.titleEn;
 const region=(x.regions||[]).map(regionLabel).join(' · ');
 const changes=[
  ['boundaryChange',zh?'边界变化':'Boundary change'],
  ['institutionalChange',zh?'制度变化':'Institutional change'],
  ['economicChange',zh?'经济变化':'Economic change'],
  ['knowledgeChange',zh?'知识变化':'Knowledge change'],
  ['technologyChange',zh?'技术变化':'Technology change'],
  ['militaryChange',zh?'安全与军事变化':'Security & military change']
 ].map(([key,label])=>{const raw=x[key];const visible=raw&&String(raw).toUpperCase()!=='UNKNOWN';return visible?'<div><dt>'+esc(label)+'</dt><dd>'+esc(status(raw,l))+'</dd></div>':'';}).join('');
 const consequences=[
  ...(x.capacityGain||[]).map(v=>(zh?'能力增加：':'Capacity gained: ')+valueLabel(v,l)),
  ...(x.loadTransfer||[]).map(v=>(zh?'负载转移：':'Load transferred: ')+valueLabel(v,l)),
  ...(x.dependencyCreated||[]).map(v=>(zh?'新依赖：':'Dependency created: ')+valueLabel(v,l)),
  ...(x.historicalLegacy||[]).map(v=>(zh?'长期遗产：':'Legacy: ')+valueLabel(v,l))
 ];
 const prior=status(x.priorRuntime,l),trigger=status(x.trigger,l),pressure=listText(x.pressureField,l),successor=status(x.successorRuntime,l);
 const scopeTypes=(x.caseTypes||[]).map(v=>typeLabel(v,l));
 const scopeSections=(x.relatedBookSections||[]).slice(0,4);
 const changeFallback=zh
  ?`已确认本案例属于${scopeTypes.join('、')||'结构重组'}范围，并连接${scopeSections.length?scopeSections.join('、'):'相关书稿段落'}；未获证据支持的边界、经济、知识、技术与军事变化继续保留，不作推断。`
  :`This case is confirmed within ${scopeTypes.join(', ')||'structural reconfiguration'} and is linked to ${scopeSections.length?scopeSections.join(', '):'the relevant manuscript scope'}. Boundary, economic, knowledge, technology, and military changes remain unfilled where evidence is not admitted.`;
 const consequenceFallback=zh
  ?`已确认该窗口形成了“${successor}”这一继任结构；关于规模、持续性和跨区域影响的量化结果，在证据不足时不补写。`
  :`The registered successor configuration is “${successor}”. Quantitative claims about scale, persistence, or cross-regional effects are not filled where evidence is insufficient.`;
 const evidence=(x.evidenceNotes||[]).map(v=>valueLabel(v,l));
 const unknown=(x.unknown||[]).map(v=>valueLabel(v,l));
 return '<section class="civ-reconfig-case-reader" data-reconfig-case-reader="'+esc(x.id)+'">'
  +'<header class="civ-reconfig-case-reader__head"><div><p class="knowledge-eyebrow">'+esc(zh?'重组案例':'Reconfiguration case')+'</p><h3>'+esc(title)+'</h3><p>'+esc(x.timeLabel)+' · '+esc(region)+'</p></div><a class="knowledge-action" href="'+esc(askHref(l,'cases',{entityId:x.id}))+'">'+esc(c.ask)+'</a></header>'
  +'<div class="civ-reconfig-chain">'
   +'<section><span>01</span><p class="knowledge-eyebrow">'+esc(zh?'原有结构':'Prior configuration')+'</p><h4>'+esc(prior)+'</h4></section>'
   +'<section><span>02</span><p class="knowledge-eyebrow">'+esc(zh?'触发与压力':'Trigger & pressure')+'</p><h4>'+esc(trigger)+'</h4><p>'+esc(pressure)+'</p></section>'
   +'<section><span>03</span><p class="knowledge-eyebrow">'+esc(zh?'结构变化':'Structural change')+'</p>'+(changes?'<dl>'+changes+'</dl>':'<p>'+esc(changeFallback)+'</p>')+'</section>'
   +'<section><span>04</span><p class="knowledge-eyebrow">'+esc(zh?'继任结构':'Successor configuration')+'</p><h4>'+esc(successor)+'</h4><p>'+esc(zh?'登记窗口：':'Registry window: ')+esc(status(x.transitionDuration,l))+'</p></section>'
   +'<section><span>05</span><p class="knowledge-eyebrow">'+esc(zh?'可观察结果':'Observed consequences')+'</p>'+(consequences.length?'<ul>'+consequences.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>':'<p>'+esc(consequenceFallback)+'</p>')+'</section>'
  +'</div>'
  +'<details class="civ-reconfig-evidence"><summary>'+esc(zh?'证据与未知':'Evidence & unknown')+'</summary><div><p><strong>'+esc(zh?'知识状态':'Knowledge state')+'</strong> '+badge(x.knowledgeState||x.dataClass,l)+'</p>'+(evidence.length?'<ul>'+evidence.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>':'')+(unknown.length?'<div class="knowledge-boundary"><strong>'+esc(zh?'仍未知':'Still unknown')+'</strong><ul>'+unknown.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></div>':'')+'</div></details>'
  +'<div class="civ-reconfig-chip-row">'+(x.relatedWindows||[]).map(id=>'<button type="button" data-window="'+esc(id)+'">'+esc(zh?'查看相关重组窗口':'Related window')+'</button>').join('')+(x.relatedSnapshots||[]).map(id=>'<button type="button" data-snapshot="'+esc(id)+'">'+esc(zh?'查看相关世界横切面':'Related world shift')+'</button>').join('')+(x.relatedFigures||[]).map(id=>'<a href="/figure?id='+encodeURIComponent(id)+'">'+esc(id+' · '+(zh?'相关图解':'Related figure'))+'</a>').join('')+'</div>'
  +'</section>';
}
function renderCases(host,data,l,state,store){
 const c=COPY[l],all=filteredCases(data,state),pages=Math.max(1,Math.ceil(all.length/PAGE)),page=Math.min(state.casePage,pages),rows=all.slice((page-1)*PAGE,page*PAGE),regions=uniq((data.cases?.cases||[]).flatMap(x=>x.regions||[])).sort(),types=uniq((data.cases?.cases||[]).flatMap(x=>x.caseTypes||[])).sort(),selected=(data.cases?.cases||[]).find(x=>x.id===state.primaryCaseId),zh=l==='zh-Hans';
 host.innerHTML=caseDetail(selected,l,data,store)
  +'<section class="civ-reconfig-filters civ-reconfig-filters--simple" aria-label="'+esc(c.filters)+'"><div class="civ-reconfig-filter-grid">'
  +'<label>'+esc(c.search)+'<input data-case-q value="'+esc(state.caseSearch)+'" placeholder="'+esc(zh?'搜索重组案例':'Search reconfiguration cases')+'"></label>'
  +'<label>'+esc(c.timeWindow)+'<select data-window-filter>'+options(data.windows?.windows||[],x=>x.id,x=>String(x.startYear)+'–'+String(x.endYear),c.allTime,l)+'</select></label>'
  +'<label>'+esc(c.region)+'<select data-region>'+options(regions,x=>x,x=>regionLabel(x),c.allRegions,l)+'</select></label>'
  +'<label>'+esc(c.caseType)+'<select data-type>'+options(types,x=>x,(x,loc)=>typeLabel(x,loc),c.allTypes,l)+'</select></label>'
  +'</div><button type="button" data-clear>'+esc(c.clear)+'</button></section>'
  +'<div class="civ-reconfig-case-list-head"><h3>'+esc(zh?'重组案例':'Reconfiguration cases')+'</h3><p>'+String(all.length)+' '+esc(c.results)+'</p></div>'
  +'<div class="civ-reconfig-grid civ-reconfig-case-grid">'+rows.map(x=>{
    const title=zh?x.titleZh:x.titleEn;
    const prior=status(x.priorRuntime,l),successor=status(x.successorRuntime,l),trigger=status(x.trigger,l);
    return '<article class="civ-reconfig-card civ-reconfig-case-card'+(selected?.id===x.id?' is-current':'')+'"><p class="knowledge-eyebrow">'+esc(x.timeLabel)+' · '+esc((x.regions||[]).slice(0,2).map(regionLabel).join(' · '))+'</p><h4>'+esc(title)+'</h4><p>'+esc(trigger)+'</p><div class="civ-reconfig-mini-chain"><span>'+esc(prior)+'</span><b aria-hidden="true">→</b><span>'+esc(successor)+'</span></div><div class="civ-reconfig-actions"><button type="button" data-case="'+esc(x.id)+'">'+esc(zh?'查看重组链':'Open reconfiguration')+'</button><label><input type="checkbox" data-compare="'+esc(x.id)+'" '+(state.compareCaseIds.includes(x.id)?'checked':'')+'> '+esc(c.compare)+'</label></div></article>';
  }).join('')+'</div>';
 const wf=host.querySelector('[data-window-filter]');selectValue(wf,state.filterWindowId||'');const rg=host.querySelector('[data-region]');selectValue(rg,state.regionId||'');const ty=host.querySelector('[data-type]');selectValue(ty,state.caseType||'');
 host.querySelector('[data-case-q]')?.addEventListener('change',e=>set(store,{caseSearch:e.target.value,casePage:1},'case-filter'));
 wf?.addEventListener('change',e=>set(store,{filterWindowId:e.target.value||null,casePage:1},'case-filter'));
 rg?.addEventListener('change',e=>set(store,{regionId:e.target.value||null,casePage:1},'case-filter'));
 ty?.addEventListener('change',e=>set(store,{caseType:e.target.value||null,casePage:1},'case-filter'));
 host.querySelector('[data-clear]')?.addEventListener('click',()=>set(store,{caseSearch:'',filterWindowId:null,regionId:null,caseType:null,triggerQuery:'',pressureQuery:'',changeFilter:null,casePage:1},'case-clear'));
 host.querySelectorAll('[data-case]').forEach(btn=>btn.onclick=()=>set(store,{primaryCaseId:btn.dataset.case},'case-open'));
 host.querySelectorAll('[data-compare]').forEach(el=>el.onchange=()=>{const s=new Set(state.compareCaseIds);el.checked?s.add(el.dataset.compare):s.delete(el.dataset.compare);set(store,{compareCaseIds:[...s].slice(0,4)},'case-compare');});
 host.querySelectorAll('[data-window]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:'windows',windowId:btn.dataset.window},'case-window'));
 host.querySelectorAll('[data-snapshot]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:'snapshots',snapshotId:btn.dataset.snapshot},'case-snapshot'));
 pager(host,page,all.length,p=>set(store,{casePage:p},'case-page'),l);
}
function renderTimeline(host,data,l,store){
 const c=COPY[l],rows=[...(data.windows?.windows||[])].sort((a,b)=>a.startYear-b.startYear||a.endYear-b.endYear);
 host.innerHTML=`<ol class="civ-reconfig-timeline">${rows.map(w=>`<li><button type="button" data-window="${esc(w.id)}"><time>${w.startYear}–${w.endYear}</time><strong>${esc(l==='zh-Hans'?w.titleZh:w.titleEn)}</strong><span>${w.majorCases?.length||0} ${esc(c.linkedCases)}</span></button></li>`).join('')}</ol>`;
 host.querySelectorAll('[data-window]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:'windows',windowId:btn.dataset.window},'timeline-window'));
}
function renderWindows(host,data,l,state,store){
 const c=COPY[l],rows=[...(data.windows?.windows||[])].sort((a,b)=>a.startYear-b.startYear||a.endYear-b.endYear),selected=rows.find(w=>w.id===state.windowId)||rows[0],caseMap=new Map((data.cases?.cases||[]).map(x=>[x.id,x])),zh=l==='zh-Hans';
 if(!selected){host.textContent=c.unknown;return;}
 const linked=(selected.majorCases||[]).map(id=>caseMap.get(id)).filter(Boolean);
 const before=uniq(linked.map(x=>status(x.priorRuntime,l)).filter(Boolean));
 const after=uniq(linked.map(x=>status(x.successorRuntime,l)).filter(Boolean));
 const affected=(selected.systemLayers||[]).map(v=>typeLabel(v,l));
 const unknown=(selected.unknown||[]).map(v=>valueLabel(v,l));
 host.innerHTML='<section class="civ-reconfig-window-reader">'
  +'<header><p class="knowledge-eyebrow">'+esc(zh?'重组时间脊柱':'Reconfiguration timeline')+'</p><h3>'+esc(zh?selected.titleZh:selected.titleEn)+'</h3><p>'+String(selected.startYear)+'–'+String(selected.endYear)+'</p></header>'
  +'<nav class="civ-reconfig-window-rail" aria-label="'+esc(zh?'切换重组窗口':'Change reconfiguration window')+'">'+rows.map(w=>'<button type="button" data-window="'+esc(w.id)+'" aria-pressed="'+(w.id===selected.id?'true':'false')+'"><time>'+String(w.startYear)+'–'+String(w.endYear)+'</time><span>'+String(w.majorCases?.length||0)+' '+esc(zh?'案例':'cases')+'</span></button>').join('')+'</nav>'
  +'<div class="civ-reconfig-window-chain">'
   +'<section><span>01</span><p class="knowledge-eyebrow">'+esc(zh?'之前':'Before')+'</p><h4>'+esc(zh?'进入窗口前的主要结构':'Main structures entering the window')+'</h4><ul>'+before.slice(0,6).map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></section>'
   +'<section><span>02</span><p class="knowledge-eyebrow">'+esc(zh?'压力':'Pressure')+'</p><h4>'+esc(zh?'哪些系统正在承压':'Systems under pressure')+'</h4><div class="civ-reconfig-tag-list">'+affected.slice(0,8).map(v=>'<span>'+esc(v)+'</span>').join('')+'</div></section>'
   +'<section><span>03</span><p class="knowledge-eyebrow">'+esc(zh?'重组过程':'During')+'</p><h4>'+esc(zh?'窗口内发生的重组案例':'Reconfigurations inside the window')+'</h4><div class="civ-reconfig-window-cases">'+linked.slice(0,10).map(x=>'<button type="button" data-case="'+esc(x.id)+'">'+esc(zh?x.titleZh:x.titleEn)+'</button>').join('')+'</div></section>'
   +'<section><span>04</span><p class="knowledge-eyebrow">'+esc(zh?'之后':'After')+'</p><h4>'+esc(zh?'形成的继任结构':'Successor configurations')+'</h4><ul>'+after.slice(0,6).map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul></section>'
  +'</div>'
  +(selected.relatedSnapshots?.length?'<div class="civ-reconfig-window-snapshots"><strong>'+esc(zh?'相关世界变化':'Related world shifts')+'</strong>'+selected.relatedSnapshots.map(id=>'<button type="button" data-snapshot="'+esc(id)+'">'+esc(id.replace('WORLD_RECONFIGURATION_SNAPSHOT_',''))+'</button>').join('')+'</div>':'')
  +'<details class="civ-reconfig-evidence"><summary>'+esc(zh?'证据与未知':'Evidence & unknown')+'</summary><p><strong>'+esc(zh?'知识状态':'Knowledge state')+'</strong> '+badge(selected.knowledgeState||selected.dataClass,l)+'</p>'+(unknown.length?'<ul>'+unknown.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>':'')+'</details>'
  +'<a class="knowledge-action" href="'+esc(askHref(l,'windows',{windowId:selected.id,entityId:selected.id}))+'">'+esc(c.ask)+'</a>'
  +'</section>';
 host.querySelectorAll('[data-window]').forEach(btn=>btn.onclick=()=>set(store,{windowId:btn.dataset.window},'window-select'));
 host.querySelectorAll('[data-case]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:'cases',primaryCaseId:btn.dataset.case},'window-case'));
 host.querySelectorAll('[data-snapshot]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:'snapshots',snapshotId:btn.dataset.snapshot},'window-snapshot'));
}
function renderSnapshots(host,data,l,state,store){
 const c=COPY[l],rows=[...(data.snapshots?.snapshots||[])].sort((a,b)=>a.year-b.year),current=rows.find(x=>x.id===state.snapshotId)||rows[0],zh=l==='zh-Hans';
 if(!current){host.textContent=c.unknown;return;}
 const index=rows.findIndex(x=>x.id===current.id),prev=rows[index-1]||null,next=rows[index+1]||null,caseMap=new Map((data.cases?.cases||[]).map(x=>[x.id,x]));
 const caseTitle=id=>{const x=caseMap.get(id);return x?(zh?x.titleZh:x.titleEn):id};
 const currentSet=new Set(current.majorReconfigurationCases||[]),prevSet=new Set(prev?.majorReconfigurationCases||[]),nextSet=new Set(next?.majorReconfigurationCases||[]);
 const introduced=[...currentSet].filter(id=>!prevSet.has(id)),continued=[...currentSet].filter(id=>prevSet.has(id)),leaving=[...currentSet].filter(id=>!nextSet.has(id));
 const resolveVisual=snap=>{if(!snap)return null;const record=(data.visualStatus?.assets||[]).find(a=>a.assetId===snap.visualAssetId);if(record?.status!=='PRESENT')return null;return resolveAtlasVisualById(data.visualBindings,snap.visualAssetId);};
 const card=(snap,role)=>{if(!snap)return'';const v=resolveVisual(snap),title=zh?snap.metadata?.titleZh:snap.metadata?.titleEn;return '<article class="civ-reconfig-shift-card '+role+'"><p class="knowledge-eyebrow">'+esc(role==='is-current'?(zh?'当前横切面':'Current snapshot'):(role==='is-previous'?(zh?'之前':'Before'):(zh?'之后':'After')))+'</p><h4>'+esc(title)+'</h4><time>'+String(snap.year)+'</time>'+(v?'<img src="'+esc(v.publicUrl)+'" alt="'+esc(title)+'" loading="lazy" decoding="async">':'')+'<button type="button" data-snapshot="'+esc(snap.id)+'">'+esc(zh?'查看这一年':'Open this year')+'</button></article>';};
 host.innerHTML='<section class="civ-reconfig-shift-reader">'
  +'<header><p class="knowledge-eyebrow">'+esc(zh?'世界变化':'World shifts')+'</p><h3>'+esc(zh?'世界如何在重组窗口之间改变':'How the world changes between reconfiguration windows')+'</h3><p>'+esc(zh?'横切面用于比较结构变化，不把静态视觉当作精确地图或完整因果模型。':'Snapshots support structural comparison; the static visual is not treated as a precise map or complete causal model.')+'</p></header>'
  +'<nav class="civ-reconfig-snapshot-rail" aria-label="'+esc(zh?'选择世界横切面':'Select world snapshot')+'">'+rows.map(x=>'<button type="button" data-snapshot="'+esc(x.id)+'" aria-pressed="'+(x.id===current.id?'true':'false')+'">'+String(x.year)+'</button>').join('')+'</nav>'
  +'<div class="civ-reconfig-shift-triptych">'+card(prev,'is-previous')+card(current,'is-current')+card(next,'is-next')+'</div>'
  +'<section class="civ-reconfig-change-summary"><div><p class="knowledge-eyebrow">'+esc(zh?'新进入':'New in this snapshot')+'</p><ul>'+(introduced.length?introduced.map(id=>'<li><button type="button" data-case="'+esc(id)+'">'+esc(caseTitle(id))+'</button></li>').join(''):'<li>'+esc(zh?'没有新增已登记案例':'No newly registered cases')+'</li>')+'</ul></div>'
  +'<div><p class="knowledge-eyebrow">'+esc(zh?'持续':'Continuing')+'</p><ul>'+(continued.length?continued.map(id=>'<li><button type="button" data-case="'+esc(id)+'">'+esc(caseTitle(id))+'</button></li>').join(''):'<li>'+esc(zh?'没有持续案例':'No continuing cases')+'</li>')+'</ul></div>'
  +'<div><p class="knowledge-eyebrow">'+esc(zh?'即将退出当前结构':'Leaving by next snapshot')+'</p><ul>'+(leaving.length?leaving.map(id=>'<li><button type="button" data-case="'+esc(id)+'">'+esc(caseTitle(id))+'</button></li>').join(''):'<li>'+esc(zh?'没有已登记退出':'No registered exits')+'</li>')+'</ul></div></section>'
  +'<details class="civ-reconfig-evidence"><summary>'+esc(zh?'证据与未知':'Evidence & unknown')+'</summary><p><strong>'+esc(zh?'知识状态':'Knowledge state')+'</strong> '+badge(current.knowledgeState||current.dataClass,l)+'</p><p>'+esc(listText(current.unknown,l))+'</p></details>'
  +'<a class="knowledge-action" href="'+esc(askHref(l,'snapshots',{snapshotId:current.id,entityId:current.id}))+'">'+esc(c.ask)+'</a>'
  +'</section>';
 host.querySelectorAll('[data-snapshot]').forEach(btn=>btn.onclick=()=>set(store,{snapshotId:btn.dataset.snapshot},'snapshot-select'));
 host.querySelectorAll('[data-case]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:'cases',primaryCaseId:btn.dataset.case},'snapshot-case'));
}
function runtimeDl(d,l){const fields=['stage','scale','density','capacity','load','alignment','resilience','adaptability','expansionCapacity','futureCapacity'];const future=d.livedReality?.personalFutureCapacity;return `<dl class="civ-reconfig-dl">${fields.map(f=>`<dt>${esc(fieldLabel(f))}</dt><dd>${esc(status(d[f],l))}</dd>`).join('')}<dt>${esc(fieldLabel('externalDependency'))}</dt><dd>${esc(listText(d.externalDependency,l))}</dd><dt>${esc(fieldLabel('pressure'))}</dt><dd>${esc(listText(d.pressureFields,l))}</dd><dt>${esc(fieldLabel('direction'))}</dt><dd>${esc(listText(d.direction,l))}</dd><dt>${esc(fieldLabel('transitionSignals'))}</dt><dd>${esc(listText(d.transitionSignals,l))}</dd><dt>${esc(fieldLabel('personalFutureCapacity'))}</dt><dd>${esc(status(future?.state,l))}</dd><dt>${esc(fieldLabel('evidenceDate'))}</dt><dd>${esc(d.sourceDate||d.asOfDate||d.lastReviewedAt||COPY[l].unknown)}</dd><dt>${esc(fieldLabel('unknown'))}</dt><dd>${esc(listText(d.unknown,l))}</dd></dl>`;}
function runtimeNeedLabel(dimension,c){
 const map={EVIDENCE:c.runtimeNeedEvidence,OBSERVATION:c.runtimeNeedObservation,PROJECTION:c.runtimeNeedMethod};
 return map[dimension]||null;
}
async function hydrateDossierRuntimeReadout(host,dossier,l){
 const slot=host.querySelector('[data-runtime-readout]');
 if(!slot||!dossier?.id)return;
 const c=COPY[l],origin=host.ownerDocument?.defaultView?.location?.origin;
 if(!origin||origin==='null')return;
 try{
  const response=await fetch(new URL('/api/book6-runtime-readout?dossier='+encodeURIComponent(dossier.id),origin),{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('HTTP_'+response.status);
  const payload=await response.json(),projection=payload?.projection;
  if(!payload?.ok||!projection)throw new Error('INVALID_RRE_PROJECTION');
  const needs=uniq((projection.missingLineageDimensions||[]).map(x=>runtimeNeedLabel(x,c)).filter(Boolean));
  const confidence=projection.confidenceClass==='UNKNOWN'?c.runtimeConfidenceUnknown:valueLabel(projection.confidenceClass,l);
  slot.dataset.rreReadout='ready';
  slot.innerHTML=`<section class="civ-reconfig-runtime-readout"><p class="knowledge-eyebrow">${esc(c.runtimeReadout)}</p><h4>${esc(c.runtimeEvidenceGateOpen)}</h4><p>${esc(c.runtimeReadoutLead)}</p><dl class="civ-reconfig-dl"><dt>${esc(c.runtimeConfidence)}</dt><dd>${esc(confidence)}</dd><dt>${esc(c.runtimeHistoricalContext)}</dt><dd>${esc(String((projection.historicalKnowledgeReferences||[]).length))}</dd></dl>${needs.length?`<div><strong>${esc(c.runtimeNeeds)}</strong><ul>${needs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}<p class="knowledge-boundary">${esc(c.runtimeEngineBoundary)}</p></section>`;
 }catch{
  slot.dataset.rreReadout='unavailable';
  slot.innerHTML=`<p class="civ-reconfig-runtime-unavailable">${esc(c.runtimeUnavailable)}</p>`;
 }
}
function renderDossiers(host,data,l,state,store){
 const c=COPY[l],rows=data.dossiers?.dossiers||[],d=rows.find(x=>x.id===state.dossierId)||rows[0],zh=l==='zh-Hans';
 if(!d){host.textContent=c.unknown;return;}
 const dt=v=>zh?(v?.zh||v?.['zh-Hans']||v?.en||''):(v?.en||v?.zh||v?.['zh-Hans']||'');
 const linkedCases=(data.cases?.cases||[]).filter(x=>(x.relatedDossiers||[]).includes(d.id)).sort((a,b)=>a.timeStart-b.timeStart);
 const admitted=d.dataClass==='CURRENT_DATA'&&Boolean(d.asOfDate||d.sourceDate);
 const depth=d.knowledgeDepth||{};
 const positionReading=d.runtimePositionCorrespondence||{};
 const w6=d.runtimePositionEvidenceGate||{};
 const w7=d.runtimePositionAdmissionReadiness||{};
 const w7Lanes=w7.sourceLaneRequirements||[];
 const w7RequiredLanes=w7Lanes.filter(x=>x.requiredForPositionCandidate);
 const w7ReadyLanes=w7RequiredLanes.filter(x=>(x.admittedEvidenceRefs||[]).length>0);
 const w7Candidates=d.runtimePositionCandidates||[];
 const admittedClaimCount=w6.currentEvidence?.admittedClaims?.length||0;
 const observedTransitionSignals=w6.transitionSignals?.observed||[];
 const observationTargets=w6.observationTargets||[];
 const threshold=w6.observationThreshold||{};
 const thresholdCriteria=threshold.criteria||[];
 const reachablePositionRows=w6.reachablePositions?.positions||[];
 const positionMap=new Map((data.positions?.positions||[]).map(x=>[x.id,x]));
 const primaryPosition=positionReading.primary?.positionId?positionMap.get(positionReading.primary.positionId):null;
 const historicalPositionRefs=(positionReading.historicalPositionReferences||[]).map(id=>positionMap.get(id)).filter(Boolean);
 const currentConfig=admitted?[d.stage,d.scale,d.capacity,d.load,d.alignment].filter(v=>v&&String(v).toUpperCase()!=='UNKNOWN').map(v=>status(v,l)):[];
 const currentPressures=admitted?(d.pressureFields||[]).map(v=>valueLabel(v,l)):[];
 const recentHistorical=linkedCases.slice(-8);
 const latestHistorical=linkedCases.at(-1)||null;
 const structuralPressures=depth.structuralPressures||[];
 const reconfigurationAxes=depth.reconfigurationAxes||[];
 const signals=depth.signals||[];
 const unknowns=(depth.unknowns||[]).length?depth.unknowns:(d.unknown||[]).map(v=>({zh:valueLabel(v,'zh-Hans'),en:valueLabel(v,'en')}));
 const projectionBoundary=admitted
  ?(zh?'当前值已经接入，但条件性投影仍必须经过独立的方法与证据门槛；此页不自动把趋势写成预测。':'Current values are admitted, but conditional projection still requires a separate method and evidence gate; this page never turns a trend into a forecast automatically.')
  :(zh?'未接入通过时效性验收的当前值，因此不生成数值预测；结构知识、历史形成和观察讯号仍正常呈现。':'No time-sensitive current values are admitted, so no numeric forecast is generated. Structural knowledge, historical formation, and observation signals remain available.');
 host.innerHTML='<section class="civ-reconfig-dossier-reader">'
  +'<header class="civ-reconfig-dossier-reader__head"><div><p class="knowledge-eyebrow">'+esc(zh?'运行档案':'Runtime dossier')+'</p><h3>'+esc(loc(d.entity,l))+'</h3><p>'+esc(zh?'把历史形成、结构知识、当前资料、观察讯号与未知边界分层呈现；没有最新数值不等于没有知识。':'Historical formation, structural knowledge, current data, observation signals, and unknowns are separated. Missing live values do not erase what is already known.')+'</p></div><a class="knowledge-action" href="'+esc(askHref(l,'dossiers',{dossierId:d.id,entityId:d.id}))+'">'+esc(c.ask)+'</a></header>'
  +'<label class="civ-reconfig-dossier-picker">'+esc(zh?'选择档案':'Select dossier')+'<select data-dossier-select>'+rows.map(x=>'<option value="'+esc(x.id)+'">'+esc(loc(x.entity,l))+'</option>').join('')+'</select></label>'
  +(admitted?'<section class="civ-reconfig-current-overlay"><p class="knowledge-eyebrow">'+esc(zh?'CURRENT · 已验收当前资料':'CURRENT · Admitted current data')+'</p>'+(currentConfig.length?'<ul>'+currentConfig.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>':'')+(currentPressures.length?'<ul>'+currentPressures.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ul>':'')+'</section>':'')
  +'<div class="civ-reconfig-dossier-sections">'
   +'<section><p class="knowledge-eyebrow">01 · '+esc(zh?'结构底盘':'Structural runtime')+'</p><p>'+esc(dt(depth.structuralProfile)|| (zh?'结构资料正在整理。':'Structural profile is being prepared.'))+'</p>'+(latestHistorical?'<p class="cx-meta"><strong>'+esc(zh?'最近历史节点':'Latest historical node')+'</strong><br>'+esc(latestHistorical.timeLabel)+' · '+esc(zh?latestHistorical.titleZh:latestHistorical.titleEn)+'</p>':'')+'<p class="knowledge-boundary">'+esc(zh?'此处为结构知识，不冒充 2026 即时统计值。':'This is structural knowledge, not a substitute for live 2026 statistics.')+'</p></section>'
   +'<section><p class="knowledge-eyebrow">02 · '+esc(zh?'历史形成':'Historical formation')+'</p>'+(recentHistorical.length?'<ol>'+recentHistorical.map(x=>'<li><button type="button" data-case="'+esc(x.id)+'"><time>'+esc(x.timeLabel)+'</time><span>'+esc(zh?x.titleZh:x.titleEn)+'</span></button><p class="cx-meta">'+esc(valueLabel(x.priorRuntime,l))+' → '+esc(valueLabel(x.successorRuntime,l))+'</p></li>').join('')+'</ol>':'<p>'+esc(zh?'尚无已登记历史案例。':'No linked historical cases are registered.')+'</p>')+'</section>'
   +'<section><p class="knowledge-eyebrow">03 · '+esc(zh?'结构性压力':'Structural pressures')+'</p>'+(structuralPressures.length?'<ul>'+structuralPressures.map(v=>'<li>'+esc(dt(v))+'</li>').join('')+'</ul>':'<p>'+esc(zh?'尚无结构压力条目。':'No structural pressure entries are registered.')+'</p>')+(admitted&&currentPressures.length?'<p class="cx-meta">'+esc(zh?'上方 current overlay 另列已经验收的当前压力。':'The current overlay above separately lists admitted current pressures.')+'</p>':'')+'</section>'
   +'<section><p class="knowledge-eyebrow">04 · '+esc(zh?'正在重组的结构轴':'Observed reconfiguration axes')+'</p>'+(reconfigurationAxes.length?'<ul>'+reconfigurationAxes.map(v=>'<li>'+esc(dt(v))+'</li>').join('')+'</ul>':'<p>'+esc(zh?'尚无已登记结构轴。':'No registered reconfiguration axes.')+'</p>')+'<p class="knowledge-boundary">'+esc(zh?'结构轴描述已登记的变化方向，不等于短期预测。':'These axes describe registered directions of change; they are not short-term forecasts.')+'</p></section>'
   +'<section><p class="knowledge-eyebrow">05 · '+esc(zh?'观察目标':'Observation targets')+'</p>'+(observationTargets.length?'<ul>'+observationTargets.map(v=>'<li>'+esc(zh?v.labelZh:v.labelEn)+'</li>').join(''):(signals.length?'<ul>'+signals.map(v=>'<li>'+esc(dt(v))+'</li>').join('')+'</ul>':'<p>'+esc(zh?'尚无已登记观察目标。':'No observation targets are registered.')+'</p>'))+'<p class="knowledge-boundary">'+esc(zh?'这里显示的是结构知识中的观察目标，不是已经发生的 OBSERVED_SIGNAL。只有通过当前证据 admission 后，目标才可能升级为观察讯号。':'These are structural observation targets, not admitted OBSERVED_SIGNAL instances. A target can become an observed signal only after current-evidence admission.')+'</p></section>'
   +'<section><p class="knowledge-eyebrow">06 · '+esc(zh?'尚未知':'Unknown boundary')+'</p><ul>'+(unknowns.length?unknowns.map(v=>'<li>'+esc(dt(v))+'</li>').join(''):'<li>'+esc(c.unknown)+'</li>')+'</ul></section>'
   +'<section><p class="knowledge-eyebrow">07 · '+esc(zh?'当前证据 → 四十八运行位置':'Current evidence → 48 runtime positions')+'</p><dl class="civ-reconfig-dl"><dt>'+esc(zh?'当前证据门':'Current evidence gate')+'</dt><dd>'+esc(w6StateLabel(w6.currentEvidence?.admissionState||'UNKNOWN',l))+'</dd><dt>'+esc(zh?'已验收证据':'Admitted evidence')+'</dt><dd>'+esc(String(admittedClaimCount))+'</dd><dt>'+esc(zh?'当前位置读取':'Current position readout')+'</dt><dd>'+esc(primaryPosition?loc(primaryPosition.shortLabel,l):(zh?'未知':'Unknown'))+'</dd></dl>'+(primaryPosition?'':'<p>'+esc(zh?'没有通过时效性、来源与证据 admission 的 CURRENT_DATA，因此当前位置保持 UNKNOWN。':'No CURRENT_DATA has passed freshness, provenance, and evidence admission, so current position remains UNKNOWN.')+'</p>')+(historicalPositionRefs.length?'<p class="cx-meta">'+esc(zh?'来源时间窗参照：':'Source time-window reference: ')+historicalPositionRefs.map(x=>x.id+' · '+(x.sourceWindow?.sourceWindowLabel||'')+' · '+loc(x.shortLabel,l)).join(' · ')+'</p>':'')+'<p class="knowledge-boundary">'+esc(zh?'来源时间窗不是当前位置证据；日期重叠不会把对象自动放进某个运行位置。':'A source time window is not current-position evidence; date overlap never assigns an entity to a runtime position automatically.')+'</p></section>'
   +'<section><p class="knowledge-eyebrow">08 · '+esc(zh?'观察讯号 → 观察阈值 → 可达位置':'Observation signals → observation threshold → reachable positions')+'</p><dl class="civ-reconfig-dl"><dt>'+esc(zh?'已验收转移讯号':'Admitted transition signals')+'</dt><dd>'+esc(String(observedTransitionSignals.length))+'</dd><dt>'+esc(zh?'观察阈值':'Observation threshold')+'</dt><dd>'+esc(w6StateLabel(threshold.state||'NOT_EVALUATED',l))+'</dd><dt>'+esc(zh?'可达位置':'Reachable positions')+'</dt><dd>'+esc(String(reachablePositionRows.length))+'</dd></dl>'+(thresholdCriteria.length?'<ul>'+thresholdCriteria.map(x=>'<li><strong>'+esc(x.criterionId)+'</strong> · '+esc(w6StateLabel(x.state||'UNKNOWN',l))+'</li>').join('')+'</ul>':'')+'<p>'+esc(projectionBoundary)+'</p><p class="knowledge-boundary">'+esc(zh?'观察目标不等于讯号；讯号不等于跨过阈值；跨过阈值也不等于未来必然到达某个位置。可达位置始终属于条件性投影。':'Observation target ≠ signal; signal ≠ threshold crossing; threshold crossing ≠ guaranteed future position. Reachable positions remain conditional projection.')+'</p></section>'
   +'<section><p class="knowledge-eyebrow">09 · '+esc(zh?'当前证据验收准备':'Current-evidence admission readiness')+'</p><dl class="civ-reconfig-dl"><dt>'+esc(zh?'工作状态':'Workflow state')+'</dt><dd>'+esc(w7StateLabel(w7.state||'NOT_STARTED',l))+'</dd><dt>'+esc(zh?'必要证据通道':'Required evidence lanes')+'</dt><dd>'+esc(String(w7RequiredLanes.length))+'</dd><dt>'+esc(zh?'已有验收证据的必要通道':'Required lanes with admitted evidence')+'</dt><dd>'+esc(String(w7ReadyLanes.length))+'</dd><dt>'+esc(zh?'运行位置候选':'Runtime-position candidates')+'</dt><dd>'+esc(String(w7Candidates.length))+'</dd></dl>'+(w7RequiredLanes.length?'<div class="civ-reconfig-dimension-list">'+w7RequiredLanes.map(x=>'<span>'+esc(w7LaneLabel(x.laneId,l))+' · '+esc(w7StateLabel(x.admissionState||'NOT_STARTED',l))+'</span>').join('')+'</div>':'')+'<p class="knowledge-boundary">'+esc(zh?'这一层只说明为了产生当前位置候选还缺哪些 current evidence。它不会自己搜索后把结果直接写成事实，也不会因为资料齐全就自动分配 Phase。':'This layer shows which current-evidence lanes are still needed before a position candidate can be formed. Search results never become facts automatically, and evidence readiness never auto-assigns a Phase.')+'</p></section>'
  +'</div>'
  +'<div data-runtime-readout></div>'
  +'<div class="civ-reconfig-actions"><label><input type="checkbox" data-dossier-compare="'+esc(d.id)+'" '+(state.compareDossierIds.includes(d.id)?'checked':'')+'> '+esc(c.compareRuntime)+'</label></div>'
  +'</section>';
 const sel=host.querySelector('[data-dossier-select]');selectValue(sel,d.id);sel.onchange=e=>set(store,{dossierId:e.target.value},'dossier-select');
 host.querySelectorAll('[data-case]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:'cases',primaryCaseId:btn.dataset.case},'dossier-case'));
 host.querySelector('[data-dossier-compare]')?.addEventListener('change',e=>{const setIds=new Set(state.compareDossierIds);e.target.checked?setIds.add(e.target.dataset.dossierCompare):setIds.delete(e.target.dataset.dossierCompare);set(store,{compareDossierIds:[...setIds].slice(0,4)},'dossier-compare');});
 hydrateDossierRuntimeReadout(host,d,l);
}
function renderLived(host,data,l,state,store){
 const c=COPY[l],dims=data.lived?.dimensions||[],dossiers=data.dossiers?.dossiers||[],dossier=dossiers.find(d=>d.id===state.dossierId)||dossiers[0],zh=l==='zh-Hans';
 const dt=v=>zh?(v?.zh||v?.['zh-Hans']||v?.en||''):(v?.en||v?.zh||v?.['zh-Hans']||'');
 const admitted=dossier?.dataClass==='CURRENT_DATA'&&Boolean(dossier?.asOfDate||dossier?.sourceDate);
 const depth=dossier?.knowledgeDepth?.lived||{};
 const preferred=['livingEnvironment','employmentOpportunity','incomeCostBalance','housingPressure','personalFutureCapacity'];
 const keyDims=preferred.map(id=>dims.find(d=>d.id===id)).filter(Boolean).slice(0,5);
 const otherDims=dims.filter(d=>!preferred.includes(d.id));
 const dimCard=dim=>{
  const value=dossier?.livedReality?.[dim.id],deep=depth[dim.id]||{},guide=dt(deep)||loc(LIVED_GUIDE[dim.id],l),observe=zh?(deep.observeZh||[]):(deep.observeEn||[]);
  const current=admitted?status(value?.state,l):null;
  return '<article class="civ-reconfig-lived-card"><p class="knowledge-eyebrow">'+esc(zh?dim.labelZh:dim.labelEn)+'</p>'+(current?'<h4>'+esc(current)+'</h4>':'')+'<p>'+esc(guide||'')+'</p>'+(observe.length?'<div class="civ-reconfig-chip-row">'+observe.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':'')+(admitted?'<button type="button" data-dim="'+esc(dim.id)+'">'+esc(zh?'查看当前资料细节':'View current-data detail')+'</button>':'')+'</article>';
 };
 host.innerHTML='<section class="civ-reconfig-lived-reader">'
  +'<header><p class="knowledge-eyebrow">'+esc(zh?'日常现实':'Lived reality')+'</p><h3>'+esc(loc(dossier?.entity,l)||c.unknown)+'</h3><p>'+esc(zh?'这里读取宏观重组如何穿过城市、工作、家庭预算、住房与行动空间，最终变成个人每天能够感觉到的现实。':'This layer reads how macro reconfiguration passes through cities, work, household budgets, housing, and room for action until it becomes everyday reality.')+'</p></header>'
  +'<label class="civ-reconfig-dossier-picker">'+esc(c.selectDossier)+'<select data-lived-dossier>'+dossiers.map(d=>'<option value="'+esc(d.id)+'">'+esc(loc(d.entity,l))+'</option>').join('')+'</select></label>'
  +(!admitted?'<div class="knowledge-boundary"><strong>'+esc(zh?'当前数值层尚未验收':'Current-value layer not yet admitted')+'</strong><p>'+esc(zh?'下方仍显示已登记的结构传导关系与观察维度；只有即时数值保持为空。':'The registered transmission mechanisms and observation dimensions remain visible below; only live values stay unfilled.')+'</p></div>':'')
  +'<div class="civ-reconfig-lived-key">'+keyDims.map(dimCard).join('')+'</div>'
  +'<details class="civ-reconfig-lived-more"><summary>'+esc(zh?'查看其余日常现实维度':'View other lived-reality dimensions')+'</summary><div class="civ-reconfig-lived-list">'+otherDims.map(dim=>'<span>'+esc(zh?dim.labelZh:dim.labelEn)+'</span>').join('')+'</div></details>'
  +(admitted&&state.livedRealityDimensionId?(()=>{const dim=dims.find(d=>d.id===state.livedRealityDimensionId),value=dossier?.livedReality?.[state.livedRealityDimensionId];return dim?'<section class="civ-reconfig-lived-detail"><p class="knowledge-eyebrow">'+esc(zh?dim.labelZh:dim.labelEn)+'</p><h4>'+esc(status(value?.state,l))+'</h4><a class="knowledge-action" href="'+esc(askHref(l,'lived',{dossierId:dossier?.id,livedRealityDimensionId:dim.id,entityId:dim.id}))+'">'+esc(c.ask)+'</a></section>':'';})():'')
  +'</section>';
 const sel=host.querySelector('[data-lived-dossier]');if(sel){selectValue(sel,dossier?.id||'');sel.onchange=e=>set(store,{dossierId:e.target.value,livedRealityDimensionId:null},'lived-dossier');}
 host.querySelectorAll('[data-dim]').forEach(btn=>btn.onclick=()=>set(store,{livedRealityDimensionId:btn.dataset.dim},'lived-dimension'));
}
function renderVisualLibrary(host,data,l){
 const c=COPY[l];
 const assets=(data.visualBindings?.assets||[]).filter(a=>a.family==='WORLD_RECONFIGURATION_SNAPSHOT').map(a=>resolveAtlasVisualById(data.visualBindings,a.assetId)).filter(Boolean);
 const families=uniq(assets.map(a=>a.family)).sort();
 if(!assets.length){host.innerHTML=`<p>${esc(c.unverified)}</p>`;return;}
 host.innerHTML=`<section class="civ-reconfig-visual-library"><h3>${esc(c.visualLibrary)}</h3><p>${esc(l==='zh-Hans'?'这里显示第六册正式绑定的 12 张世界重组横切面；完整 392 张文明视觉资料库保留在第五册 Civilization Atlas。':'This view shows the 12 world-reconfiguration snapshots formally bound to Book VI. The full 392-asset visual library remains in the Book V Civilization Atlas.')}</p><p class="cx-meta">${assets.length} ${esc(c.visualCount)}</p><div class="civ-reconfig-snapshot-controls"><label>${esc(c.visualFamily)}<select data-visual-family>${families.map(f=>`<option value="${esc(f)}">${esc(visualFamilyLabel(f))}</option>`).join('')}</select></label><label>${esc(c.visualSubject)}<select data-visual-subject></select></label></div><div data-visual-preview></div></section>`;
 const family=host.querySelector('[data-visual-family]'),subject=host.querySelector('[data-visual-subject]'),preview=host.querySelector('[data-visual-preview]');
 const renderPreview=()=>{
  const a=assets.find(x=>x.assetId===selectedValue(subject));
  if(!a){preview.replaceChildren();return;}
  const title=loc(a.subjectTitle,l)||a.assetId;
  preview.innerHTML=`<figure class="civ-reconfig-visual-preview"><img loading="lazy" decoding="async" src="${esc(a.publicUrl)}" alt="${esc(title)}"><figcaption><strong>${esc(title)}</strong><br><span>${esc(visualFamilyLabel(a.family))}</span></figcaption></figure>`;
 };
 const fillSubjects=()=>{
  const rows=assets.filter(a=>a.family===selectedValue(family));
  subject.innerHTML=rows.map((a,index)=>`<option value="${esc(a.assetId)}" ${index===0?'selected':''}>${esc(loc(a.subjectTitle,l)||a.assetId)}</option>`).join('');
  renderPreview();
 };
 family.onchange=fillSubjects;
 subject.onchange=renderPreview;
 fillSubjects();
}
function renderPositions(host,data,l,state,store){
 const zh=l==='zh-Hans',rows=data.positions?.positions||[],domains=data.positions?.domains||[],selected=rows.find(x=>x.id===state.positionId);
 const byGrammar=new Map();
 for(const x of rows){if(!byGrammar.has(x.grammarId))byGrammar.set(x.grammarId,[]);byGrammar.get(x.grammarId).push(x);}
 const order=[...byGrammar.keys()].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));
 const head=domains.map(d=>`<th><strong>${esc(zh?d['zh-Hans']:d.en)}</strong><br><small>${esc(d.id)} · ${esc(d.bookCode)}</small></th>`).join('');
 const body=order.map(gid=>{
   const cells=(byGrammar.get(gid)||[]).sort((a,b)=>a.phase-b.phase),g=cells[0];
   return `<tr><th><strong>${esc(gid)} · ${esc(loc(g?.grammar,l))}</strong><br><small>${esc(g?.arc||'')}</small></th>${cells.map(x=>`<td><button type="button" data-position-id="${esc(x.id)}" aria-pressed="${state.positionId===x.id?'true':'false'}"><strong>${esc(String(x.phase).padStart(2,'0'))}</strong><br>${esc(loc(x.shortLabel,l))}<br><small>${esc(x.sourceContext?.id||'')} · ${esc(x.accessState||'')}</small></button></td>`).join('')}</tr>`;
 }).join('');
 const history=selected?.historicalAlignment,sourceWindow=selected?.sourceWindow;
 const bookV=history?.bookV||{};
 const historySummary=[
   ...(bookV.periodIds||[]).map(id=>(zh?'时期 ':'Period ')+id),
   ...(bookV.snapshotIds||[]).map(id=>(zh?'横切面 ':'Snapshot ')+id)
 ].slice(0,10);
 const semanticAlignment=history?.semanticPrecedentAdmission?.status==='HUMAN_ACCEPTED'?(zh?'人工验收：结构先例已接受；仍不代表语义等同或因果关系。':'Human accepted: structural precedent admitted; semantic equivalence and causality are still not asserted.'):history?.forwardBoundaryAdmission?.status==='HUMAN_ACCEPTED'?(zh?'人工验收：前瞻边界已接受；不进入第五册历史事实层。':'Human accepted: forward boundary admitted; it is not Book V historical fact.'):(zh?'仅时间重叠，不代表语义等同':'temporal overlap only; not semantic equivalence');
 const detail=selected?`<article class="civ-reconfig-detail"><div class="civ-reconfig-detail-head"><div><small>${esc(selected.id)} · ${esc(selected.accessState)}</small><h4>${esc(loc(selected.shortLabel,l))}</h4></div>${badge(selected.knowledgeState||'STRUCTURAL_KNOWLEDGE',l)}</div><dl class="civ-reconfig-dl"><dt>${esc(zh?'现实语法':'Reality Grammar')}</dt><dd>${esc(selected.grammarId+' · '+loc(selected.grammar,l))}</dd><dt>${esc(zh?'现实域':'Reality Domain')}</dt><dd>${esc(loc(selected.realityDomain,l))}</dd><dt>${esc(zh?'来源语境':'Source Context')}</dt><dd>${esc((selected.sourceContext?.id||'')+' · '+loc(selected.sourceContext,l))}</dd><dt>${esc(zh?'来源时间窗':'Source Window')}</dt><dd>${esc(sourceWindow?.sourceWindowLabel||c.unknown)}</dd><dt>${esc(zh?'伴随主题':'Cross Theme')}</dt><dd>${esc(selected.crossTheme||'')}</dd><dt>${esc(zh?'第五册历史对齐':'Book V Historical Alignment')}</dt><dd>${esc(history?.alignmentState||c.unknown)} · ${esc(semanticAlignment)}</dd><dt>${esc(zh?'认识边界':'Authority Boundary')}</dt><dd>${esc(zh?'位置属于结构知识；当前对象对应必须是推导运行读数，未来可达位置只能是条件性投影。':'The position is structural knowledge; current entity correspondence is a derived runtime readout, and future reachability is conditional projection only.')}</dd></dl>${historySummary.length?`<p class="cx-meta">${esc(historySummary.join(' · '))}</p>`:''}<a href="${esc(askHref(l,'positions',{positionId:selected.id,entityId:selected.id}))}">${esc(COPY[l].ask)}</a></article>`:'';
 host.innerHTML=`<section><h3>${esc(zh?'四十八运行位置':'48 Runtime Positions')}</h3><p>${esc(zh?'十六现实语法分别穿过现实形成、现实运行与现实维持三个现实域。位置不是文明等级、预测或命运时间表。':'Sixteen Reality Grammar elements traverse Reality Formation, Reality Runtime and Reality Continuity. Positions are not civilization ranks, predictions or a destiny timeline.')}</p><div class="civ-reconfig-compare-table" role="region" tabindex="0" aria-label="${esc(zh?'四十八运行位置矩阵':'48 runtime position matrix')}"><table><thead><tr><th>${esc(zh?'现实语法':'Reality Grammar')}</th>${head}</tr></thead><tbody>${body}</tbody></table></div>${detail}</section>`;
 host.querySelectorAll('[data-position-id]').forEach(btn=>btn.onclick=()=>set(store,{positionId:btn.dataset.positionId},'runtime-position'));
}
function renderCaseCompare(host,data,l,state,store){
 const c=COPY[l],map=new Map((data.cases?.cases||[]).map(x=>[x.id,x])),rows=state.compareCaseIds.map(id=>map.get(id)).filter(Boolean);
 if(rows.length<2){host.innerHTML=`<p>${esc(c.selectCasesFirst)}</p>`;return;}
 const fields=[[fieldLabel('priorRuntime'),x=>x.priorRuntime],[fieldLabel('trigger'),x=>x.trigger],[fieldLabel('pressure'),x=>listText(x.pressureField,l)],[fieldLabel('threshold'),()=>c.unknown],[fieldLabel('removed'),x=>listText(x.elementsRemoved,l)],[fieldLabel('preserved'),x=>listText(x.elementsPreserved,l)],[fieldLabel('added'),x=>listText(x.elementsAdded,l)],[fieldLabel('carrierChange'),x=>listText([...(x.carrierBefore||[]),...(x.carrierAfter||[])],l)],[fieldLabel('capacityGain'),x=>listText(x.capacityGain,l)],[fieldLabel('loadTransfer'),x=>listText(x.loadTransfer,l)],[fieldLabel('dependencyCreated'),x=>listText(x.dependencyCreated,l)],[fieldLabel('successorRuntime'),x=>x.successorRuntime],[fieldLabel('transitionDuration'),x=>x.transitionDuration],[fieldLabel('legacy'),x=>listText(x.historicalLegacy,l)],[fieldLabel('unknown'),x=>listText(x.unknown,l)]];
 host.innerHTML=`<p>${esc(c.noRank)}</p><div class="civ-reconfig-compare-table" role="region" tabindex="0" aria-label="${esc(c.compare)}"><table><thead><tr><th>${esc(c.dimension)}</th>${rows.map(x=>`<th>${esc(l==='zh-Hans'?x.titleZh:x.titleEn)}</th>`).join('')}</tr></thead><tbody>${fields.map(([label,get])=>`<tr><th>${esc(label)}</th>${rows.map(x=>`<td>${esc(status(get(x),l))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><a href="${esc(askHref(l,'compare',{comparisonIds:rows.map(x=>x.id),caseIds:rows.map(x=>x.id)}))}">${esc(c.ask)}</a>`;
}
function renderDossierCompare(host,data,l,state){
 const c=COPY[l],map=new Map((data.dossiers?.dossiers||[]).map(x=>[x.id,x])),rows=state.compareDossierIds.map(id=>map.get(id)).filter(Boolean),dimMap=new Map((data.lived?.dimensions||[]).map(dim=>[dim.id,l==='zh-Hans'?dim.labelZh:dim.labelEn]));
 if(rows.length<2){host.innerHTML=`<p>${esc(c.selectDossiersFirst)}</p>`;return;}
 const fields=['stage','scale','density','capacity','load','alignment','resilience','adaptability','expansionCapacity','futureCapacity'];
 const listRows=[[fieldLabel('externalDependency'),d=>listText(d.externalDependency,l)],[fieldLabel('pressure'),d=>listText(d.pressureFields,l)],[fieldLabel('direction'),d=>listText(d.direction,l)],[fieldLabel('transitionSignals'),d=>listText(d.transitionSignals,l)],[l==='zh-Hans'?'当前运行位置':'Current runtime position',d=>d.runtimePositionCorrespondence?.primary?.positionId||c.unknown],[l==='zh-Hans'?'来源时间窗参照':'Source time-window reference',d=>listText(d.runtimePositionCorrespondence?.historicalPositionReferences,l)]];
 host.innerHTML=`<p>${esc(c.noRank)}</p><div class="civ-reconfig-compare-table" role="region" tabindex="0" aria-label="${esc(c.compareRuntime)}"><table><thead><tr><th>${esc(l==='zh-Hans'?'维度':'Dimension')}</th>${rows.map(d=>`<th>${esc(loc(d.entity,l))}</th>`).join('')}</tr></thead><tbody>${fields.map(f=>`<tr><th>${esc(fieldLabel(f))}</th>${rows.map(d=>`<td>${esc(status(d[f],l))}</td>`).join('')}</tr>`).join('')}${listRows.map(([label,get])=>`<tr><th>${esc(label)}</th>${rows.map(d=>`<td>${esc(get(d))}</td>`).join('')}</tr>`).join('')}<tr><th>${esc(fieldLabel('livedReality'))}</th>${rows.map(d=>`<td>${esc(Object.entries(d.livedReality||{}).map(([k,v])=>(dimMap.get(k)||humanize(k))+': '+status(v?.state,l)).join(' · '))}</td>`).join('')}</tr><tr><th>${esc(fieldLabel('unknown'))}</th>${rows.map(d=>`<td>${esc(listText(d.unknown,l))}</td>`).join('')}</tr></tbody></table></div><a href="${esc(askHref(l,'dossiercompare',{comparisonIds:rows.map(x=>x.id)}))}">${esc(c.ask)}</a>`;
}
export function mountReconfigurationAtlas(root,data,{locale='en',store}={}){
 if(!root||!store)return()=>{};const l=locale==='zh-Hans'?'zh-Hans':'en',c=COPY[l];
 if(!document.getElementById('book6-reconfig-style')){const st=document.createElement('style');st.id='book6-reconfig-style';st.textContent='[data-atlas-mode="reconfiguration"]{padding:3rem 0}.civ-reconfig-shell{max-width:1180px;margin:auto;padding:0 1rem}.civ-reconfig-tabs{display:flex;flex-wrap:wrap;gap:.55rem;margin:1.25rem 0;padding-bottom:.35rem}.civ-reconfig-tabs--primary{border-bottom:1px solid #9994}.civ-reconfig-more{margin:.4rem 0 1rem}.civ-reconfig-more>summary{cursor:pointer;font-weight:600}.civ-reconfig-tabs--tools{margin:.7rem 0}.civ-reconfig-tabs button{padding:.7rem 1rem;white-space:nowrap}.civ-reconfig-tabs button[aria-selected="true"]{font-weight:700}.civ-reconfig-grid,.civ-reconfig-search-results,.civ-reconfig-overview{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:1rem}.civ-reconfig-card{display:flex;min-width:0;min-height:180px;flex-direction:column;align-items:stretch;gap:.7rem;padding:1.1rem;border:1px solid #d5b36c55;border-radius:16px;background:color-mix(in srgb,currentColor 2%,transparent);overflow:hidden}.civ-reconfig-card h4,.civ-reconfig-card p,.civ-reconfig-card a,.civ-reconfig-card button{min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:normal}.civ-reconfig-card h4{margin:.1rem 0;font-size:1.08rem;line-height:1.45}.civ-reconfig-card .civ-reconfig-actions,.civ-reconfig-card>a,.civ-reconfig-card>button{margin-top:auto}.civ-reconfig-overview-card{display:grid;text-align:left;min-height:120px}.civ-reconfig-overview-card strong{font-size:2rem}.civ-reconfig-search{display:grid;gap:.4rem;max-width:760px;margin-bottom:1rem}.civ-reconfig-search input,.civ-reconfig-filters input,.civ-reconfig-filters select,.civ-reconfig-snapshot-controls select,[data-atlas-mode="reconfiguration"] select{padding:.65rem;width:100%}.civ-reconfig-filters{border:1px solid #d5b36c55;border-radius:14px;padding:1rem;margin:1rem 0}.civ-reconfig-filter-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.8rem}.civ-reconfig-filter-grid label,.civ-reconfig-snapshot-controls label{display:grid;gap:.35rem}.civ-reconfig-detail,.civ-reconfig-snapshot{border:1px solid #d5b36c66;border-radius:14px;padding:1rem;margin:1rem 0}.civ-reconfig-detail-head{display:flex;justify-content:space-between;gap:1rem;align-items:start}.civ-reconfig-dl{display:grid;grid-template-columns:minmax(130px,.4fr) 1fr;gap:.45rem 1rem}.civ-reconfig-dl dt{font-weight:700}.civ-reconfig-badge,.civ-reconfig-chip-row>*{display:inline-flex;padding:.2rem .55rem;border:1px solid currentColor;border-radius:999px;font-size:.82rem;margin:.15rem}.civ-reconfig-snapshot img{display:block;width:100%;max-width:100%;height:auto}.civ-reconfig-snapshot figure{margin:1rem 0;overflow:hidden}.civ-reconfig-snapshot-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.civ-reconfig-layer-panel{padding:1rem;background:color-mix(in srgb,currentColor 4%,transparent);border-radius:10px}.civ-reconfig-current-boundary{margin:1rem 0;padding:1rem 1.1rem;border-left:4px solid currentColor;background:color-mix(in srgb,currentColor 4%,transparent);border-radius:10px}.civ-reconfig-runtime-readout{margin-top:1rem;padding:1rem;border:1px solid #9995;border-radius:12px;background:color-mix(in srgb,currentColor 3%,transparent)}.civ-reconfig-runtime-readout h4{margin:.25rem 0 .7rem}.civ-reconfig-runtime-readout ul{margin:.5rem 0;padding-left:1.25rem}.civ-reconfig-runtime-unavailable{margin-top:1rem}.civ-reconfig-dimension-list{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}.civ-reconfig-dimension-list span{padding:.35rem .65rem;border:1px solid #9995;border-radius:999px}.civ-reconfig-visual-library{margin-top:1rem}.civ-reconfig-visual-preview{margin:1rem 0;border:1px solid #d5b36c55;border-radius:16px;overflow:hidden}.civ-reconfig-visual-preview img{display:block;width:100%;max-height:620px;object-fit:contain;background:#071828}.civ-reconfig-visual-preview figcaption{padding:1rem}.civ-reconfig-missing{padding:1rem;border:1px dashed currentColor}.civ-reconfig-timeline{list-style:none;padding:0;display:grid;gap:.65rem}.civ-reconfig-timeline button{width:100%;display:grid;grid-template-columns:120px 1fr auto;gap:1rem;text-align:left;padding:.8rem}.civ-reconfig-pager{display:flex;justify-content:center;align-items:center;gap:1rem;margin:1.2rem 0}.civ-reconfig-actions{display:flex;gap:.7rem;flex-wrap:wrap}.civ-reconfig-compare-table{overflow:auto}.civ-reconfig-compare-table table{border-collapse:collapse;width:100%;min-width:760px}.civ-reconfig-compare-table th,.civ-reconfig-compare-table td{padding:.65rem;border:1px solid #9995;vertical-align:top}.civ-reconfig-tabs :focus-visible,[data-atlas-mode="reconfiguration"] a:focus-visible,[data-atlas-mode="reconfiguration"] button:focus-visible,[data-atlas-mode="reconfiguration"] input:focus-visible,[data-atlas-mode="reconfiguration"] select:focus-visible{outline:3px solid currentColor;outline-offset:3px}@media(max-width:650px){.civ-reconfig-tabs{flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x proximity}.civ-reconfig-tabs button{scroll-snap-align:start}.civ-reconfig-snapshot-controls{grid-template-columns:1fr}.civ-reconfig-compare-table{max-width:100%;overscroll-behavior-inline:contain}.civ-reconfig-timeline button{grid-template-columns:1fr}.civ-reconfig-detail-head{display:block}.civ-reconfig-dl{grid-template-columns:1fr}.civ-reconfig-grid{grid-template-columns:1fr}}';document.head.append(st);}
 const tabs=[['windows',l==='zh-Hans'?'重组窗口':'Windows'],['snapshots',l==='zh-Hans'?'世界变化':'World shifts'],['cases',l==='zh-Hans'?'重组案例':'Cases'],['dossiers',l==='zh-Hans'?'当前档案':'Current dossiers'],['lived',l==='zh-Hans'?'日常现实':'Lived reality']];const tools=[['positions',l==='zh-Hans'?'四十八运行位置':'48 runtime positions'],['search',c.search],['compare',c.compare],['dossiercompare',c.compareRuntime]];
 const render=()=>{const s=store.get();root.innerHTML=`<div class="civ-reconfig-shell"><p class="knowledge-eyebrow">${esc(c.eyebrow)}</p><h2>${esc(c.title)}</h2><p>${esc(c.lead)}</p><p class="knowledge-boundary">${esc(c.noRank)}</p><nav class="civ-reconfig-tabs civ-reconfig-tabs--primary" role="tablist" aria-label="${esc(c.eyebrow)}">${tabs.map(([id,label])=>`<button type="button" role="tab" data-tab="${id}" aria-selected="${s.activeLayer===id?'true':'false'}" aria-controls="book6-reconfig-panel" tabindex="${s.activeLayer===id?'0':'-1'}">${esc(label)}</button>`).join('')}</nav><details class="civ-reconfig-more" ${tools.some(([id])=>id===s.activeLayer)?'open':''}><summary>${esc(l==='zh-Hans'?'更多工具':'More tools')}</summary><div class="civ-reconfig-tabs civ-reconfig-tabs--tools">${tools.map(([id,label])=>`<button type="button" data-tab="${id}" aria-pressed="${s.activeLayer===id?'true':'false'}">${esc(label)}</button>`).join('')}</div></details><section id="book6-reconfig-panel" role="tabpanel" data-panel tabindex="-1"></section></div>`;const tabButtons=[...root.querySelectorAll('.civ-reconfig-tabs--primary [data-tab]')];root.querySelectorAll('[data-tab]').forEach(btn=>btn.onclick=()=>set(store,{activeLayer:btn.dataset.tab},'tab'));root.querySelector('.civ-reconfig-tabs--primary')?.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const current=Math.max(0,tabButtons.indexOf(document.activeElement));const next=event.key==='Home'?0:event.key==='End'?tabButtons.length-1:event.key==='ArrowRight'?(current+1)%tabButtons.length:(current-1+tabButtons.length)%tabButtons.length;tabButtons[next]?.focus();tabButtons[next]?.click();});const h=root.querySelector('[data-panel]');if(s.activeLayer==='overview')renderOverview(h,data,l,store);else if(s.activeLayer==='search')renderSearch(h,data,l,s,store);else if(s.activeLayer==='cases')renderCases(h,data,l,s,store);else if(s.activeLayer==='timeline')renderTimeline(h,data,l,store);else if(s.activeLayer==='windows')renderWindows(h,data,l,s,store);else if(s.activeLayer==='snapshots')renderSnapshots(h,data,l,s,store);else if(s.activeLayer==='dossiers')renderDossiers(h,data,l,s,store);else if(s.activeLayer==='lived')renderLived(h,data,l,s,store);else if(s.activeLayer==='positions')renderPositions(h,data,l,s,store);else if(s.activeLayer==='visuals')renderVisualLibrary(h,data,l);else if(s.activeLayer==='compare')renderCaseCompare(h,data,l,s,store);else renderDossierCompare(h,data,l,s);};
 const off=store.subscribe(render);render();root.dataset.atlasReady='true';root.dataset.atlasRegistryCounts=`85/${data.cases?.cases?.length||0}/${data.windows?.windows?.length||0}/${data.snapshots?.snapshots?.length||0}/${data.dossiers?.dossiers?.length||0}/${data.lived?.dimensions?.length||0}/${data.positions?.positions?.length||0}`;return()=>off();
}
