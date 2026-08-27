// PHI OS canonical Tarot runtime surface. Server authority is the only runAllowed authority.
const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const method='TAROT';
let contextPayload=null;
let currentView=null;

const escape=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const arr=v=>Array.isArray(v)?v:[];
const isZh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
const localeText=(en,zh)=>isZh()?zh:en;
const human=v=>String(v??'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

function productionCopy(state){
  if(!state)return '';
  const labels={
    HUMAN_ACCEPTANCE_PENDING:{en:'Human acceptance pending',zh:'人工验收待完成'},
    HUMAN_AND_SOURCE_BROWSER_ACCEPTED_LIVE_PERSISTENCE_SHA_PROMOTION_PENDING:{en:'Human + browser acceptance complete · live activation gates remain',zh:'人工与浏览器验收已完成 · live activation gates 仍待完成'},
    LIMITED_PRODUCTION:{en:'Limited Production',zh:'有限生产'}
  };
  return labels[state]?.[isZh()?'zh':'en']||human(state);
}
async function loadContext(){
  const use=q('[data-use-reality-context]')?.checked===true;
  try{
    const [r,statusResponse]=await Promise.all([
      fetch(`/api/symbolic-method-context?method=${encodeURIComponent(method)}&useCurrentRealityContext=${use?'1':'0'}`,{cache:'no-store'}),
      fetch('/api/tarot-production-status',{cache:'no-store'})
    ]);
    contextPayload=await r.json();
    const statusPayload=await statusResponse.json().catch(()=>null);
    if(!contextPayload?.ok)throw new Error('context');
    const contextRun=contextPayload.production?.runAllowed===true;
    const statusRun=statusPayload?.production?.runAllowed===true;
    const sameCommit=!contextRun||!statusRun||contextPayload.production?.approvedCommitSha===statusPayload.production?.approvedCommitSha;
    const serverAuthorityOk=contextRun&&statusRun&&sameCommit&&statusPayload?.production?.clientMayGrantAuthority===false;
    const methodName=method==='I_CHING'?'I Ching · 易经':'Tarot · 塔罗';
    q('[data-method-context]').innerHTML=`<strong>${escape(methodName)}</strong><p>${escape(isZh()?'这个方法提供结构化的解释视角。它不建立事实，也不保证预测结果。':contextPayload.contextCopy)}</p>`;
    q('[data-symbolic-production-state]').textContent=productionCopy(contextPayload.production.state);
    const d=contextPayload.realityContext;
    q('[data-reality-context-disclosure]').innerHTML=`<strong>${escape(d.label)}</strong>${d.contextItems?.length?`<ul>${d.contextItems.map(x=>`<li>${escape(x.label)}: ${escape(x.value)}</li>`).join('')}</ul>`:''}`;
    const execute=q('[data-symbolic-execute]');
    if(execute)execute.disabled=!serverAuthorityOk;
    q('[data-symbolic-save]').disabled=!(contextPayload.account?.saveContractAvailable&&currentView);
    q('[data-save-status]').textContent=contextPayload.account?.state==='ACCOUNT'
      ?localeText('Save requires verified identity + configured persistence provider.','保存需要经过验证的账号身份与已配置的持久化服务。')
      :localeText('Guest sessions have no hidden persistent reading history.','访客会话不会建立隐藏的持久化读取历史。');
  }catch{
    q('[data-method-context]').textContent=localeText('Method context is unavailable. No execution was started.','方法上下文目前不可用，系统没有启动执行。');
  }
}
function list(items,{empty='—'}={}){
  const values=arr(items).filter(Boolean);
  if(!values.length)return `<p class="sp-empty">${escape(empty)}</p>`;
  return `<ul class="sp-detail-list">${values.map(v=>`<li>${typeof v==='string'?escape(v):escape(v.statement||v.reason||JSON.stringify(v))}</li>`).join('')}</ul>`;
}
function evidenceMarkup(data={}){
  const draw=arr(data.draw);
  return `<div class="sp-evidence-grid">
    <div><span>${localeText('Deck','牌组')}</span><strong>${escape(data.deck?.deckId||data.deck?.deckCode||'RWS')}</strong></div>
    <div><span>${localeText('Spread','牌阵')}</span><strong>${escape(data.spread?.spreadId||data.spread||'—')}</strong></div>
    <div><span>${localeText('Orientation','方向')}</span><strong>${escape(data.orientation||'—')}</strong></div>
    <div><span>${localeText('Draw evidence','抽牌证据')}</span><strong>${escape(data.drawEvidenceId||'—')}</strong></div>
  </div>${draw.length?`<div class="sp-chip-row">${draw.map(x=>`<span>${escape(x.position?.positionId||'CARD')} · ${escape(x.cardId||'')}</span>`).join('')}</div>`:''}`;
}
function projectionMarkup(data={}){
  const cards=arr(data.cards);
  if(!cards.length)return `<p class="sp-empty">${localeText('No projection is available.','暂无投射结果。')}</p>`;
  return `<div class="sp-card-grid">${cards.map(card=>{
    const art=card.artwork||{};
    const alt=isZh()?(art.altTextZhHans||`塔罗牌图像：${card.canonicalTitle||card.cardId}`):(art.altTextEn||`Tarot card artwork: ${card.canonicalTitle||card.cardId}`);
    return `<article class="sp-card">
      <div class="sp-card__art">${art.src?`<img src="${escape(art.src)}" alt="${escape(alt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`:'<div class="sp-card__placeholder" aria-hidden="true">◇</div>'}</div>
      <div class="sp-card__body"><p class="sp-kicker">${escape(card.position?.positionId||'CARD')}</p><h4>${escape(card.canonicalTitle||card.cardId)}</h4><p>${escape(card.orientation||'UPRIGHT')}</p></div>
    </article>`;
  }).join('')}</div>`;
}
function compactObservation(v={}){
  const fields=['figures','objects','posture','direction','environment','visibleSymbols','animals','plants','celestialObjects','architecturalObjects'];
  return fields.flatMap(k=>arr(v[k]).map(x=>`${human(k)} · ${x}`)).slice(0,18);
}
function sourceAvailabilityLabel(v){return human(v||'UNKNOWN');}
function interpretationMarkup(data={}){
  const cards=arr(data.cards);
  if(!cards.length)return `<p class="sp-empty">${localeText('No source-bound symbolic perspective is available.','暂无受来源约束的象征视角。')}</p>`;
  return cards.map(card=>{
    const waite=card.waitePerspective||{};
    const ref=card.reflectivePerspective||{};
    const psy=card.psychologicalReflectivePerspective||{};
    const trad=card.traditionalPerspective||{};
    const question=isZh()?ref.question?.questionZhHans:ref.question?.questionEn;
    const productLead=isZh()?card.productInterpretation?.productLeadZhHans:card.productInterpretation?.productLeadEn;
    const waiteClaims=arr(waite.editorialClaims).map(x=>isZh()?(x.claimZhHans||x.claim||x.paraphrase||x.summary||x.text):(x.claimEn||x.claim||x.paraphrase||x.summary||x.text)).filter(Boolean);
    return `<article class="sp-perspective-card">
      <header><div><p class="sp-kicker">${escape(card.position?.positionId||'CARD')}</p><h4>${escape(card.canonicalTitle||card.cardId)}</h4></div><span class="sp-status">${escape(card.orientation||'UPRIGHT')}</span></header>
      ${productLead?`<section class="sp-product-lead"><h5>${localeText('Product interpretation','产品解读')}</h5><p>${escape(productLead)}</p></section>`:''}
      <section><h5>${localeText('What is visible','可见内容')}</h5>${list(compactObservation(card.visibleObservation),{empty:localeText('No additional visual observations are listed.','没有列出更多可见观察。')})}</section>
      <section><h5>${localeText('Waite source perspective','Waite 来源视角')}</h5><p class="sp-meta">${escape(sourceAvailabilityLabel(waite.availability))}</p>${waiteClaims.length?list(waiteClaims):`<p class="sp-empty">${localeText('A governed source locator exists; an editorial paraphrase has not been ingested for this card.','已有受治理的来源定位；此牌尚未录入编辑性释义。')}</p>`}</section>
      <section><h5>${localeText('Reflective perspective','反思视角')}</h5>${question?`<p class="sp-reflective-question">${escape(question)}</p>`:`<p class="sp-empty">${localeText('No reflective prompt is available.','暂无反思问题。')}</p>`}</section>
      <section><h5>${localeText('Psychological-reflective lens','心理反思视角')}</h5><p class="sp-meta">${escape(sourceAvailabilityLabel(psy.availability))}</p><p>${localeText('Non-diagnostic inquiry only. It does not establish an unconscious or clinical fact.','仅用于非诊断性的反思，不建立潜意识或临床事实。')}</p></section>
      ${trad.availability?`<section><h5>${localeText('Other traditional perspective','其他传统视角')}</h5><p class="sp-meta">${escape(sourceAvailabilityLabel(trad.availability))}</p></section>`:''}
    </article>`;
  }).join('');
}
function realityMarkup(data={}){
  const groups=[
    [localeText('Supporting evidence','支持证据'),data.supportingEvidence],
    [localeText('Contradictory evidence','矛盾证据'),data.contradictoryEvidence],
    [localeText('Unknown','未知'),data.unknown],
    [localeText('Observation','观察'),data.observation]
  ];
  return `<div class="sp-rcc-grid">${groups.map(([label,items])=>`<section><h4>${escape(label)}</h4>${list(items,{empty:localeText('None supplied.','未提供。')})}</section>`).join('')}</div><p class="sp-boundary-note">${localeText('Tarot is not Reality evidence. Reality may support, contradict, or leave the reflection unresolved.','塔罗不是现实证据。现实可以支持、反驳，或让这个视角保持未决。')}</p>`;
}
function uncertaintyMarkup(data){
  const items=arr(data);
  return items.length?`<div class="sp-uncertainty-list">${items.map(x=>`<article><strong>${escape(human(x.status||'UNKNOWN'))}</strong><p>${escape(human(x.reason||''))}</p></article>`).join('')}</div>`:`<p class="sp-empty">${localeText('No single Reality conclusion is authorized.','系统没有被授权给出单一现实结论。')}</p>`;
}
function nextMarkup(data){const items=arr(data).map(x=>typeof x==='object'?(isZh()?x.zhHans:x.en):x).filter(Boolean);return list(items,{empty:localeText('No next question is prescribed.','没有被规定的下一步问题。')});}
function renderLayer(id,data){
  if(id==='YOUR_INPUT')return `<blockquote class="sp-question">${escape(data?.question||'')}</blockquote>`;
  if(id==='METHOD_EVIDENCE')return evidenceMarkup(data);
  if(id==='PROJECTION')return projectionMarkup(data);
  if(id==='SYMBOLIC_INTERPRETATION')return interpretationMarkup(data);
  if(id==='REALITY_COMPARISON')return realityMarkup(data);
  if(id==='WHAT_REMAINS_UNCERTAIN')return uncertaintyMarkup(data);
  if(id==='POSSIBLE_NEXT_QUESTIONS_ACTIONS')return nextMarkup(data);
  return `<pre>${escape(JSON.stringify(data,null,2))}</pre>`;
}
function sourceMarkup(source={}){
  const units=arr(source.sourceUnits);
  return `<article class="sp-source-card"><header><div><p class="sp-kicker">${escape(source.perspectiveClass||source.perspectiveId||'SOURCE')}</p><h4>${escape(source.sourceTitle||source.sourceId||'Source')}</h4></div><span class="sp-status">${escape(sourceAvailabilityLabel(source.availability))}</span></header>
    <dl><div><dt>${localeText('Source ID','来源 ID')}</dt><dd>${escape(source.sourceId||'—')}</dd></div><div><dt>${localeText('Edition','版本')}</dt><dd>${escape(source.sourceEdition||'—')}</dd></div><div><dt>${localeText('Authority','权威层级')}</dt><dd>${escape(source.authorityTier||'—')}</dd></div><div><dt>${localeText('Rights','权利状态')}</dt><dd>${escape(source.rightsClass||'—')}</dd></div></dl>
    ${units.length?`<ul class="sp-source-units">${units.map(u=>`<li><span>${escape(u.unitType||'SOURCE UNIT')}</span><strong>${escape(u.sourceHeading||'')}</strong>${u.printedPage!=null?`<small>${localeText('Printed page','印刷页')} ${escape(u.printedPage)}</small>`:''}${u.sourceUrl?`<a href="${escape(u.sourceUrl)}" target="_blank" rel="noopener noreferrer">${localeText('Open source locator','打开来源定位')}</a>`:''}</li>`).join('')}</ul>`:''}
  </article>`;
}
export function renderSymbolicView(view){
  currentView=view;
  const results=q('[data-symbolic-results]');
  results.hidden=false;
  for(const layer of view.hierarchy||[]){
    const el=q(`[data-result-layer="${layer.id}"] [data-result-content]`);
    if(el)el.innerHTML=renderLayer(layer.id,layer.data);
  }
  const sourceList=q('[data-source-list]');
  const sources=view.sourceVisibility?.sources||[];
  sourceList.innerHTML=sources.length?sources.map(sourceMarkup).join(''):`<p class="sp-empty">${localeText('No source commentary is available for this projection.','此投射暂无来源释义。')}</p>`;
  q('[data-complex-journey]').hidden=view.complexCaseHandoff?.show!==true;
  q('[data-symbolic-save]').disabled=!(contextPayload?.account?.saveContractAvailable);
  results.focus({preventScroll:true});
}
async function execute(){
  const button=q('[data-symbolic-execute]');
  if(button?.disabled)return;
  const question=q('[data-symbolic-question]')?.value?.trim();
  if(!question){q('[data-execution-status]').textContent=localeText('Add a question before continuing.','请先填写你想理解的问题。');q('[data-symbolic-question]')?.focus();return;}
  button.disabled=true;q('[data-execution-status]').textContent=localeText('Preparing the governed perspective…','正在准备受治理的象征视角……');
  try{
    const response=await fetch('/api/symbolic-method-execute',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({method,question,useCurrentRealityContext:q('[data-use-reality-context]')?.checked===true})});
    const payload=await response.json().catch(()=>null);
    if(!response.ok||!payload?.ok)throw new Error(payload?.error?.code||'EXECUTION_UNAVAILABLE');
    if(payload.publicView)renderSymbolicView(payload.publicView);
    q('[data-execution-status]').textContent='';
  }catch(error){q('[data-execution-status]').textContent=localeText(`Execution remains unavailable: ${error.message}` ,`执行仍不可用：${error.message}`);}
  finally{await loadContext();}
}

qa('[data-method]').forEach(b=>b.setAttribute('aria-pressed','true'));
q('[data-use-reality-context]')?.addEventListener('change',loadContext);
q('[data-view-sources]')?.addEventListener('click',event=>{const s=q('[data-source-list]');const open=s.hidden; s.hidden=!open;event.currentTarget.setAttribute('aria-expanded',String(open));});
q('[data-symbolic-execute]')?.addEventListener('click',execute);
q('[data-symbolic-save]')?.addEventListener('click',async()=>{if(!currentView)return;const body={question:q('[data-symbolic-question]').value,methodEvidence:currentView.hierarchy?.[1]?.data,projection:currentView.hierarchy?.[2]?.data,reading:currentView,userNotes:''};const r=await fetch('/api/symbolic-method-save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const p=await r.json().catch(()=>null);q('[data-save-status]').textContent=p?.ok?localeText('Saved.','已保存。'):p?.error?.code||localeText('Save unavailable.','暂时无法保存。');});
window.addEventListener('puxr:localechange',()=>{loadContext();if(currentView)renderSymbolicView(currentView);});
setMethod(method);
