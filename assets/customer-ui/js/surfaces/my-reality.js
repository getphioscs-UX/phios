import {arr,esc,installTabs,locale,postJson,reRenderOnLocale,setStatus,tr,valueText} from './runtime-ui.js';
let currentView=null;
const sessionObservations=[];
const empty=message=>`<div class="cx-p1-empty">${esc(message)}</div>`;
const textOf=item=>typeof item==='string'?item:item?.statement||item?.summary||item?.label||item?.title||item?.content||'';
const listHtml=items=>arr(items).length?`<ul class="cx-p1-list">${arr(items).map(item=>`<li>${esc(textOf(item))}</li>`).join('')}</ul>`:empty(tr('Nothing has been added here yet.','这里还没有加入任何内容。'));
const countText=(count,enOne,enMany,zh)=>locale()==='zh-Hans'?`${count} ${zh}`:`${count} ${count===1?enOne:enMany}`;

function normalizeWorkspace(input){
  if(input?.schemaVersion==='PHI-OS-CX-R10-MY-REALITY-WORKSPACE-v2.0.0')return input;
  const reality=input||{};
  const current=reality.currentReality||{};
  return {
    schemaVersion:'PHI-OS-CX-R10-MY-REALITY-WORKSPACE-COMPAT',state:reality.state||'EMPTY',locale:reality.locale||locale(),
    contextSummary:{whatIsHappeningNow:reality.overview?.summary||null,whatHasBeenEstablished:[...arr(current.importantFacts),...arr(current.externalEvidence),...arr(current.findings),...arr(current.calculations)],whatRemainsUnknown:arr(current.unknown),currentStage:reality.continuation?.stage||null,possibleNextDirections:arr(reality.navigation?.options),nextStages:arr(reality.continuation?.nextStages)},
    currentReality:{currentSituation:arr(current.reportedContext),importantFacts:arr(current.importantFacts),constraints:arr(current.constraints),openQuestions:arr(current.openQuestions),evidence:arr(current.externalEvidence),findings:arr(current.findings),calculations:arr(current.calculations),unknowns:arr(current.unknown),financialState:current.financialState||null},
    perspectives:{items:arr(reality.perspectives?.items)},reading:{state:reality.reading?.state||'UNKNOWN',whatStandsOut:reality.reading?.summary?[reality.reading.summary]:[],patterns:[],tensions:[],dependencies:[],other:[],unknowns:arr(reality.reading?.unknown),sources:[]},
    navigation:{state:reality.navigation?.state||'NOT_ESTABLISHED',currentPosition:null,possibleDirections:arr(reality.navigation?.options),selectedId:null,systemSelected:false},actions:{items:[]},review:reality.review||{state:'NOT_ESTABLISHED'},history:{items:arr(reality.history?.items)},reports:{items:arr(reality.reports?.items)},sideContext:{knowledge:arr(reality.knowledge?.items),evidenceCount:arr(current.externalEvidence).length,unknownCount:arr(current.unknown).length},continuity:{state:'NOT_ESTABLISHED',stage:reality.continuation?.stage||null,nextStages:arr(reality.continuation?.nextStages),available:false,href:null,requiresExplicitConsent:true},governance:{workspaceCompositionOnly:true}
  };
}

function setStateBadge(state){
  const node=document.querySelector('[data-cx-reality-state]');if(!node)return;
  const value=state||'EMPTY';node.textContent=value.replaceAll('_',' ');node.className='cx-status '+(value==='READY'?'cx-status--available':'cx-status--unknown');
}

function renderContextSummary(view){
  const summary=view.contextSummary||{};
  const happening=summary.whatIsHappeningNow||tr('Not established yet','尚未建立');
  document.querySelector('[data-cx-summary-happening]').textContent=happening;
  document.querySelector('[data-cx-summary-established]').textContent=countText(arr(summary.whatHasBeenEstablished).length,'item','items','项内容');
  document.querySelector('[data-cx-summary-unknown]').textContent=countText(arr(summary.whatRemainsUnknown).length,'open item','open items','项未决');
  document.querySelector('[data-cx-summary-stage]').textContent=summary.currentStage||tr('Not established','尚未建立');
  const nextCount=arr(summary.possibleNextDirections).length+arr(summary.nextStages).length;
  document.querySelector('[data-cx-summary-next]').textContent=nextCount?countText(nextCount,'direction','directions','个可能方向'):tr('None established','尚未建立');
}

function renderOverview(view){
  setStateBadge(view.state);
  const summary=view.contextSummary||{};
  document.querySelector('[data-cx-reality-summary]').textContent=summary.whatIsHappeningNow||tr('Start with what is happening now, or bring in a governed perspective, reading or report.','从现在正在发生的事情开始，或把受治理的视角、读取或报告带进来。');
  const rows=[
    [tr('What is happening now','现在正在发生什么'),summary.whatIsHappeningNow||tr('Not established yet','尚未建立')],
    [tr('What has been established','已经建立了什么'),countText(arr(summary.whatHasBeenEstablished).length,'structured item','structured items','项已建立内容')],
    [tr('What remains unknown','仍然未知什么'),countText(arr(summary.whatRemainsUnknown).length,'open item','open items','项未决')],
    [tr('Current stage','当前阶段'),summary.currentStage||tr('Not established','尚未建立')],
    [tr('What may be useful next','接下来可能有用的方向'),arr(summary.possibleNextDirections).length||arr(summary.nextStages).length?tr('Compare the available directions before choosing.','先比较现有方向，再由你选择。'):tr('No next direction has been established.','尚未建立下一方向。')]
  ];
  document.querySelector('[data-cx-overview-cards]').innerHTML=rows.map(([label,value])=>`<article class="cx-my-reality__overview-card"><small>${esc(label)}</small><strong>${esc(value)}</strong></article>`).join('');
}

function block(title,items,emptyText){return `<section class="cx-my-reality__block"><h3 class="cx-heading">${esc(title)}</h3>${arr(items).length?listHtml(items):empty(emptyText)}</section>`}
function renderCurrent(view){
  const r=view.currentReality||{};
  const parts=[
    block(tr('Current situation','当前处境'),r.currentSituation,tr('No current situation has been added.','尚未加入当前处境。')),
    block(tr('Important facts','重要事实'),r.importantFacts,tr('No explicit Reality facts have been established.','尚未建立明确的 Reality 事实。')),
    block(tr('Constraints','限制条件'),r.constraints,tr('No explicit constraints have been established.','尚未建立明确限制条件。')),
    block(tr('Open questions','开放问题'),r.openQuestions,tr('No explicit open questions have been added.','尚未加入明确的开放问题。'))
  ];
  if(arr(r.evidence).length)parts.push(`<section class="cx-my-reality__block"><h3 class="cx-heading">${esc(tr('Evidence','证据'))}</h3>${r.evidence.map(e=>`<article class="cx-p1-source"><strong>${esc(e.statement||'')}</strong>${e.authorityClass?`<div class="cx-meta">${esc(e.authorityClass)}</div>`:''}${e.sourceUrl?`<a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener">${esc(tr('Open source','打开来源'))}</a>`:''}</article>`).join('')}</section>`);
  if(arr(r.findings).length)parts.push(block(tr('Established findings','已建立发现'),r.findings,tr('No findings have been established.','尚未建立发现。')));
  if(arr(r.calculations).length)parts.push(block(tr('Calculations','计算'),r.calculations.map(x=>`${x.code}: ${valueText(x.value)}${x.unit?` ${x.unit}`:''}`),tr('No calculations are present.','当前没有计算。')));
  parts.push(block(tr('Unknowns','未知'),r.unknowns,tr('No explicit unknown has been recorded.','尚未记录明确未知。')));
  document.querySelector('[data-cx-current-reality]').innerHTML=`<div class="cx-my-reality__reality-grid">${parts.join('')}</div>`;
}

function renderPerspectives(view){
  const items=arr(view.perspectives?.items);
  document.querySelector('[data-cx-reality-perspectives]').innerHTML=items.length?items.map(x=>`<article class="cx-p1-method"><header><strong>${esc(x.label)}</strong><span class="cx-p1-evidence-badge">${esc(x.realityFact?tr('Reality fact','Reality 事实'):tr('Perspective','视角'))}</span></header>${x.projectionId?`<code>${esc(x.projectionId)}</code>`:''}</article>`).join(''):empty(tr('No perspective has been brought into this workspace.','这个工作区尚未带入任何视角。'));
}

function readingLane(title,items){return arr(items).length?block(title,items,''):''}
function renderReading(view){
  const r=view.reading||{};
  const parts=[readingLane(tr('What stands out','最值得注意的地方'),r.whatStandsOut),readingLane(tr('Patterns','模式'),r.patterns),readingLane(tr('Tensions','张力'),r.tensions),readingLane(tr('Dependencies','依赖条件'),r.dependencies),readingLane(tr('Unknowns','未知'),r.unknowns)].filter(Boolean);
  if(arr(r.other).length)parts.push(`<section class="cx-my-reality__block"><h3 class="cx-heading">${esc(tr('Other reading sections','其他读取部分'))}</h3>${r.other.map(x=>`<article class="cx-p1-source"><strong>${esc(x.label||tr('Reading section','读取部分'))}</strong>${x.content?`<p>${esc(x.content)}</p>`:''}</article>`).join('')}</section>`);
  document.querySelector('[data-cx-reality-reading]').innerHTML=parts.length?`<div class="cx-my-reality__reality-grid">${parts.join('')}</div>`:empty(tr('A Reading has not been established for this Reality.','这个 Reality 尚未建立读取。'));
}

function directionDetails(item){
  const rows=[];
  if(item.tradeOff)rows.push([tr('Trade-off','取舍'),item.tradeOff]);
  if(arr(item.risks).length)rows.push([tr('Risks','风险'),arr(item.risks).join(' · ')]);
  if(arr(item.dependencies).length)rows.push([tr('Dependencies','依赖条件'),arr(item.dependencies).join(' · ')]);
  if(item.reversibility)rows.push([tr('Reversibility','可逆性'),item.reversibility]);
  if(arr(item.observationPoints).length)rows.push([tr('Observation points','观察点'),arr(item.observationPoints).join(' · ')]);
  return rows.length?`<dl>${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`:'';
}
function renderNavigation(view){
  const n=view.navigation||{};const items=arr(n.possibleDirections);
  const current=n.currentPosition?`<div class="cx-p1-callout"><strong>${esc(tr('Current position','当前位置'))}</strong><p>${esc(n.currentPosition)}</p></div>`:'';
  const directions=items.length?items.map(item=>`<article class="cx-my-reality__direction"><header><div><strong>${esc(item.label)}</strong>${item.description?`<p class="cx-muted">${esc(item.description)}</p>`:''}</div>${item.state?`<span class="cx-p1-evidence-badge">${esc(item.state)}</span>`:''}</header>${directionDetails(item)}${item.href?`<a href="${esc(item.href)}">${esc(tr('Explore this direction','查看这个方向'))}</a>`:''}</article>`).join(''):empty(tr('No navigation directions have been established yet.','尚未建立导航方向。'));
  document.querySelector('[data-cx-reality-navigation]').innerHTML=current+directions;
}

function renderActions(view){
  const items=arr(view.actions?.items);
  document.querySelector('[data-cx-reality-actions]').innerHTML=items.length?items.map(item=>`<article class="cx-p1-source"><strong>${esc(item.label)}</strong><div class="cx-meta">${esc(item.confirmedBy||item.confirmationState||tr('Confirmed upstream','上游已确认'))}</div></article>`).join(''):empty(tr('No customer- or professional-confirmed action is available yet.','尚无由客户或专业人士确认的行动。'));
}

function renderObservations(){
  const node=document.querySelector('[data-cx-observations]');if(!node)return;
  node.innerHTML=sessionObservations.length?sessionObservations.map((item,index)=>`<article class="cx-my-reality__observation"><strong>${esc(`${tr('Session observation','本次会话观察')} ${index+1}`)}</strong><p><b>${esc(tr('What happened','发生了什么'))}:</b> ${esc(item.whatHappened)}</p>${item.newEvidence?`<p><b>${esc(tr('New evidence','新证据'))}:</b> ${esc(item.newEvidence)}</p>`:''}${item.change?`<p><b>${esc(tr('Change','变化'))}:</b> ${esc(item.change)}</p>`:''}<small class="cx-meta">${esc(tr('Session only · not saved','仅本次会话 · 未保存'))}</small></article>`).join(''):empty(tr('No session observation has been added.','本次会话尚未加入观察。'));
}

function reviewCell(label,value){return `<article class="cx-my-reality__block"><small class="cx-meta">${esc(label)}</small>${value?`<p>${esc(value)}</p>`:empty(tr('Not established','尚未建立'))}</article>`}
function renderReview(view){
  const r=view.review||{};
  if(r.state==='NOT_ESTABLISHED'&&!r.summary&&!r.previous&&!r.current&&!r.whatChanged&&!r.whatRemains){document.querySelector('[data-cx-reality-review]').innerHTML=empty(tr('Review begins after something has been tried or observed.','在发生行动或观察之后才进入复核。'));return}
  document.querySelector('[data-cx-reality-review]').innerHTML=`${r.summary?`<div class="cx-p1-callout"><strong>${esc(r.state||tr('Review','复核'))}</strong><p>${esc(r.summary)}</p></div>`:''}<div class="cx-my-reality__review-grid">${reviewCell(tr('Previous','之前'),r.previous)}${reviewCell(tr('Current','现在'),r.current)}${reviewCell(tr('What changed','发生了什么变化'),r.whatChanged)}${reviewCell(tr('What remains','仍然保留什么'),r.whatRemains)}</div>`;
}

function renderHistory(view){
  const items=arr(view.history?.items);
  document.querySelector('[data-cx-reality-history]').innerHTML=items.length?items.map(item=>`<article class="cx-p1-source"><strong>${esc(item.label||item.id||'')}</strong>${item.occurredAt?`<div class="cx-meta">${esc(item.occurredAt)}</div>`:''}${item.state?`<div class="cx-meta">${esc(item.state)}</div>`:''}</article>`).join(''):empty(tr('No retained Journey history is available here yet.','这里尚无已保留的 Journey 历史。'));
}
function renderReports(view){
  const items=arr(view.reports?.items);
  document.querySelector('[data-cx-reality-reports]').innerHTML=items.length?items.map(r=>`<article class="cx-p1-source"><strong>${esc(r.title||r.label||tr('Report','报告'))}</strong>${r.state?`<div class="cx-meta">${esc(r.state)}</div>`:''}${r.downloadHref||r.href?`<a href="${esc(r.downloadHref||r.href)}">${esc(tr('Open report','打开报告'))}</a>`:''}</article>`).join(''):empty(tr('No released report is connected here yet.','这里尚未连接已发布报告。'));
}
function renderContinuity(view){
  const c=view.continuity||{};const next=arr(c.nextStages);
  const lines=[];
  lines.push(`<div class="cx-p1-callout"><strong>${esc(tr('Current stage','当前阶段'))}</strong><p>${esc(c.stage||tr('Not established','尚未建立'))}</p></div>`);
  lines.push(`<section class="cx-my-reality__block"><h3 class="cx-heading">${esc(tr('Available next stages','可用下一阶段'))}</h3>${next.length?listHtml(next):empty(tr('No next stage has been established.','尚未建立下一阶段。'))}</section>`);
  if(c.nextReviewAt)lines.push(`<section class="cx-my-reality__block"><h3 class="cx-heading">${esc(tr('Next review','下一次复核'))}</h3><p>${esc(c.nextReviewAt)}</p></section>`);
  lines.push(`<p class="cx-p1-note">${esc(c.requiresExplicitConsent?tr('Persistent continuation requires explicit consent.','持续保存需要明确同意。'):tr('Continuation follows the upstream Journey authority.','持续过程服从上游 Journey authority。'))}</p>`);
  document.querySelector('[data-cx-reality-continuity]').innerHTML=lines.join('');
}
function renderSide(view){
  const c=view.continuity||{},side=view.sideContext||{};
  document.querySelector('[data-cx-stage]').textContent=c.stage||tr('Not established','尚未建立');
  const progress=document.querySelector('[data-cx-progress]');const stages=[c.stage,...arr(c.nextStages)].filter(Boolean);progress.innerHTML=stages.length?stages.map((_,i)=>`<span data-state="${i===0?'current':'next'}" aria-hidden="true"></span>`).join(''):'';
  document.querySelector('[data-cx-next-stages]').innerHTML=arr(c.nextStages).length?listHtml(c.nextStages):empty(tr('No next stage established.','尚未建立下一阶段。'));
  document.querySelector('[data-cx-side-evidence]').textContent=String(side.evidenceCount||0);document.querySelector('[data-cx-side-unknown]').textContent=String(side.unknownCount||0);document.querySelector('[data-cx-side-knowledge]').textContent=String(arr(side.knowledge).length);document.querySelector('[data-cx-side-reports]').textContent=String(arr(view.reports?.items).length);
  const cta=document.querySelector('[data-cx-continuation-cta]'),state=document.querySelector('[data-cx-continuation-state]');
  if(c.available&&c.href){cta.href=c.href;cta.hidden=false;state.textContent=c.requiresExplicitConsent?tr('Explicit consent is required before persistent continuation.','持续保存前需要明确同意。'):''}else{cta.hidden=true;state.textContent=tr('No continuation route is currently established.','当前尚未建立持续路径。')}
}

function render(input){
  const view=normalizeWorkspace(input);currentView=view;renderContextSummary(view);renderOverview(view);renderCurrent(view);renderPerspectives(view);renderReading(view);renderNavigation(view);renderActions(view);renderObservations();renderReview(view);renderHistory(view);renderReports(view);renderContinuity(view);renderSide(view);
}
async function loadCurrent(){try{const response=await fetch(`/api/customer-my-reality?locale=${encodeURIComponent(locale())}`,{cache:'no-store',credentials:'same-origin'});const payload=await response.json();if(response.ok&&payload?.ok)render(payload.workspace||payload.view)}catch{render({state:'EMPTY',overview:{},currentReality:{},perspectives:{items:[]}})}}
function boot(){
  installTabs();const dialog=document.getElementById('cx-reality-intake');
  document.querySelector('[data-cx-start-reality]')?.addEventListener('click',()=>dialog?.showModal());
  document.querySelector('[data-cx-reality-form]')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,status=form.querySelector('[data-cx-reality-form-status]');if(!form.elements.consent.checked)return;setStatus(status,tr('Building your temporary current view…','正在建立你的临时当前视图…'));const data=Object.fromEntries(new FormData(form).entries());try{const payload=await postJson('/api/customer-my-reality',{...data,locale:locale(),consent:true});render(payload.workspace||payload.view);setStatus(status,tr('Current view ready. Nothing was saved automatically.','当前视图已建立，没有任何内容被自动保存。'),'success');setTimeout(()=>dialog?.close(),450)}catch{setStatus(status,tr('This view could not be created right now.','目前无法建立这个视图。'),'error')}});
  document.querySelector('[data-cx-observe-form]')?.addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget).entries());const whatHappened=String(data.whatHappened||'').trim();if(!whatHappened)return;sessionObservations.push({whatHappened,newEvidence:String(data.newEvidence||'').trim(),change:String(data.change||'').trim()});event.currentTarget.reset();renderObservations()});
  window.addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='PHIOS_CX_REALITY_HANDOFF'||!event.data?.viewModel)return;render(event.data.viewModel)});
  if(new URLSearchParams(location.search).get('handoff')==='1'&&window.opener){window.opener.postMessage({type:'PHIOS_CX_MY_REALITY_READY'},location.origin)}
  loadCurrent();reRenderOnLocale(()=>{if(currentView)render(currentView)})
}
boot();
