const q=selector=>document.querySelector(selector);
const qa=selector=>[...document.querySelectorAll(selector)];
let contextPayload=null;
let currentView=null;

const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const arr=value=>Array.isArray(value)?value:[];
const isZh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
const localeText=(en,zh)=>isZh()?zh:en;
const human=value=>String(value??'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

async function loadContext(){
  const use=q('[data-use-reality-context]')?.checked===true;
  try{
    const response=await fetch(`/api/symbolic-method-context?method=I_CHING&useCurrentRealityContext=${use?'1':'0'}`,{cache:'no-store'});
    contextPayload=await response.json();
    if(!contextPayload?.ok)throw new Error('CONTEXT_UNAVAILABLE');
    q('[data-iching-production-state]').textContent=human(contextPayload.production.state);
    const disclosure=contextPayload.realityContext;
    q('[data-reality-context-disclosure]').innerHTML=`<strong>${escape(disclosure.label)}</strong>${disclosure.contextItems?.length?`<ul>${disclosure.contextItems.map(x=>`<li>${escape(x.label)}: ${escape(x.value)}</li>`).join('')}</ul>`:''}`;
    q('[data-iching-execute]').disabled=contextPayload.production?.runAllowed!==true;
    q('[data-iching-save]').disabled=!(contextPayload.account?.saveContractAvailable&&currentView);
    q('[data-save-status]').textContent=contextPayload.account?.state==='ACCOUNT'?localeText('Save requires verified identity + configured persistence provider.','保存需要经过验证的账号身份与已配置的持久化服务。'):localeText('Guest sessions have no hidden persistent reading history.','访客会话不会建立隐藏的持久化读取历史。');
  }catch{
    q('[data-execution-status]').textContent=localeText('Method context is unavailable. No execution was started.','方法上下文目前不可用，系统没有启动执行。');
  }
}

function list(items,{empty='—'}={}){
  const values=arr(items).filter(Boolean);
  if(!values.length)return `<p class="sp-empty">${escape(empty)}</p>`;
  return `<ul class="sp-detail-list">${values.map(value=>`<li>${typeof value==='string'?escape(value):escape(value.statement||value.reason||JSON.stringify(value))}</li>`).join('')}</ul>`;
}
function lineName(value){return ({6:localeText('old yin · changing','老阴 · 变爻'),7:localeText('young yang · stable','少阳 · 静爻'),8:localeText('young yin · stable','少阴 · 静爻'),9:localeText('old yang · changing','老阳 · 变爻')})[Number(value)]||String(value??'—');}
function lineGlyph(bit){return Number(bit)===1?'<span class="ich-line-glyph ich-line-glyph--yang" aria-label="yang line"></span>':'<span class="ich-line-glyph ich-line-glyph--yin" aria-label="yin line"><i></i><i></i></span>';}
function evidenceMarkup(data={}){
  const lines=arr(data.sixLines);
  return `<div class="sp-evidence-grid"><div><span>${localeText('Input mode','输入方式')}</span><strong>${escape(human(data.inputMode||'MANUAL_LINES'))}</strong></div><div><span>${localeText('Line order','爻序')}</span><strong>${escape(human(data.lineOrder||'BOTTOM_TO_TOP'))}</strong></div><div><span>${localeText('AI selected','AI 选择')}</span><strong>${data.aiSelected===true?localeText('Yes','是'):localeText('No','否')}</strong></div><div><span>${localeText('Rerolled in calculation','计算内重掷')}</span><strong>${data.rerolledInsideCalculation===true?localeText('Yes','是'):localeText('No','否')}</strong></div></div><ol class="ich-six-line-evidence">${lines.map((item,index)=>{const value=typeof item==='object'?item.lineValue:item;const changing=typeof item==='object'?item.changing:Number(value)===6||Number(value)===9;return `<li><span>${index+1}</span><strong>${escape(value)}</strong><small>${escape(lineName(value))}</small>${changing?`<em>${localeText('changing','变')}</em>`:''}</li>`;}).join('')}</ol>`;
}
function projectionMarkup(data={}){
  const primary=data.primary||{},relating=data.relating||{},lines=arr(data.lines);
  const figure=(hex,label,bits)=>`<article class="ich-hexagram"><p class="sp-kicker">${escape(label)}</p><h4>${escape(hex.number||'—')} · ${escape(hex.chineseNameZhHans||hex.chineseName||'')} ${escape(hex.canonicalName||'')}</h4><div class="ich-hexagram-lines">${[...bits].reverse().map((bit,index)=>`<div><small>${6-index}</small>${lineGlyph(bit)}</div>`).join('')}</div><p>${escape(hex.lowerTrigramId||'—')} → ${escape(hex.upperTrigramId||'—')}</p></article>`;
  const primaryBits=lines.length?lines.map(x=>x.primaryBit):String(primary.binary||'').split('').map(Number);
  const relatingBits=lines.length?lines.map(x=>x.relatingBit):String(relating.binary||'').split('').map(Number);
  return `<div class="ich-hexagram-grid">${figure(primary,localeText('Primary hexagram','本卦'),primaryBits)}${figure(relating,localeText('Relating hexagram','之卦'),relatingBits)}</div><p class="sp-boundary-note">${localeText(`Changing lines: ${arr(data.changingLines).join(', ')||'none'}`,`变爻：${arr(data.changingLines).join('、')||'无'}`)}</p>`;
}
function interpretationMarkup(data={}){
  const pattern=data.structuralPattern||{},tension=data.possibleTension||{},transition=data.possibleTransition||{};
  const candidates=arr(data.commentaryCandidates||tension.candidates);
  return `<article class="sp-perspective-card"><header><div><p class="sp-kicker">${localeText('Source-bound lens','来源约束视角')}</p><h4>${escape(pattern.primaryHexagramId||'I Ching')}</h4></div><span class="sp-status">${escape(human(data.coverage?.primary||tension.status||'UNKNOWN'))}</span></header><section><h5>${localeText('Structural pattern','结构模式')}</h5><p>${escape(pattern.primaryHexagramId||'—')} → ${escape(pattern.relatingHexagramId||transition.toHexagramId||'—')}</p><p>${localeText('Changing lines','变爻')}: ${escape(arr(pattern.changingLines||transition.changingLines).join(', ')||localeText('none','无'))}</p></section><section><h5>${localeText('Source-bound commentary','来源约束释义')}</h5>${candidates.length?list(candidates.map(item=>({statement:`${item.sourceId} · ${item.linePosition?`line ${item.linePosition} · `:''}${item.claim}`}))):`<p class="sp-empty" data-source-gap-state="SOURCE_COMMENTARY_NOT_YET_INGESTED">${localeText('Canonical structure is available; source commentary has not yet been ingested for this hexagram.','规范结构可用；此卦的来源释义尚未录入。')}</p>`}</section><section><h5>${localeText('Boundary','边界')}</h5><p>${localeText('This is a symbolic lens, not a fact, diagnosis, directive, or guaranteed prediction.','这是象征视角，不是事实、诊断、指令或保证性预测。')}</p></section></article>`;
}
function realityMarkup(data={}){
  const groups=[[localeText('Supporting evidence','支持证据'),data.supportingEvidence],[localeText('Contradictory evidence','矛盾证据'),data.contradictoryEvidence],[localeText('Unknown','未知'),data.unknown],[localeText('Observation','观察'),data.observation]];
  return `<div class="sp-rcc-grid">${groups.map(([label,items])=>`<section><h4>${escape(label)}</h4>${list(items,{empty:localeText('None supplied.','未提供。')})}</section>`).join('')}</div><p class="sp-boundary-note">${localeText('An I Ching hexagram is not Reality evidence. Reality may support, contradict, or leave the reflection unresolved.','易经卦象不是现实证据。现实可以支持、反驳，或让这个视角保持未决。')}</p>`;
}
function uncertaintyMarkup(data){const items=arr(data);return items.length?`<div class="sp-uncertainty-list">${items.map(item=>`<article><strong>${escape(human(item.status||'UNKNOWN'))}</strong><p>${escape(human(item.reason||''))}</p></article>`).join('')}</div>`:`<p class="sp-empty">${localeText('No single Reality conclusion is authorized.','系统没有被授权给出单一现实结论。')}</p>`;}
function nextMarkup(data){return list(arr(data).map(item=>typeof item==='object'?(isZh()?item.zhHans:item.en):item).filter(Boolean),{empty:localeText('No next question is prescribed.','没有被规定的下一步问题。')});}
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
  return `<article class="sp-source-card"><header><div><p class="sp-kicker">${escape(source.perspectiveClass||source.perspectiveId||'SOURCE')}</p><h4>${escape(source.sourceTitle||source.sourceId||'Source')}</h4></div><span class="sp-status">${escape(human(source.availability||'UNKNOWN'))}</span></header><dl><div><dt>${localeText('Source ID','来源 ID')}</dt><dd>${escape(source.sourceId||'—')}</dd></div><div><dt>${localeText('Edition','版本')}</dt><dd>${escape(source.sourceEdition||'—')}</dd></div><div><dt>${localeText('Authority','权威层级')}</dt><dd>${escape(source.authorityTier||'—')}</dd></div><div><dt>${localeText('Rights','权利状态')}</dt><dd>${escape(source.rightsClass||'—')}</dd></div></dl>${units.length?`<ul class="sp-source-units">${units.map(unit=>`<li><span>${escape(unit.unitType||'SOURCE UNIT')}</span><strong>${escape(unit.sourceHeading||'')}</strong>${unit.sourceLocator?`<small>${escape(unit.sourceLocator)}</small>`:''}${unit.sourceUrl?`<a href="${escape(unit.sourceUrl)}" target="_blank" rel="noopener noreferrer">${localeText('Open source locator','打开来源定位')}</a>`:''}</li>`).join('')}</ul>`:''}</article>`;
}
export function renderIChingView(view){
  currentView=view;
  const results=q('[data-iching-results]');results.hidden=false;
  for(const layer of view.hierarchy||[]){const target=q(`[data-result-layer="${layer.id}"] [data-result-content]`);if(target)target.innerHTML=renderLayer(layer.id,layer.data);}
  const sources=view.sourceVisibility?.sources||[];q('[data-source-list]').innerHTML=sources.length?sources.map(sourceMarkup).join(''):`<p class="sp-empty">${localeText('No source commentary is available for this projection.','此投射暂无来源释义。')}</p>`;
  q('[data-complex-journey]').hidden=view.complexCaseHandoff?.show!==true;
  q('[data-iching-save]').disabled=!(contextPayload?.account?.saveContractAvailable);
  results.focus({preventScroll:true});
}
async function execute(){
  const button=q('[data-iching-execute]');if(button?.disabled)return;
  const question=q('[data-iching-question]')?.value?.trim();
  if(!question){q('[data-execution-status]').textContent=localeText('Add a question before continuing.','请先填写你想理解的问题。');q('[data-iching-question]')?.focus();return;}
  const lines=qa('[data-iching-line]').sort((a,b)=>Number(a.dataset.ichingLine)-Number(b.dataset.ichingLine)).map(item=>Number(item.value));
  button.disabled=true;q('[data-execution-status]').textContent=localeText('Preparing the governed perspective…','正在准备受治理的象征视角……');
  try{
    const response=await fetch('/api/symbolic-method-execute',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({method:'I_CHING',question,inputMode:'MANUAL_LINES',lines,sessionId:globalThis.crypto?.randomUUID?.()||`ICH-${Date.now()}`,timestamp:new Date().toISOString(),projectionVersion:'1.0.0',useCurrentRealityContext:q('[data-use-reality-context]')?.checked===true})});
    const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.ok)throw new Error(payload?.error?.code||'EXECUTION_UNAVAILABLE');renderIChingView(payload.publicView);q('[data-execution-status]').textContent='';
  }catch(error){q('[data-execution-status]').textContent=localeText(`Execution remains unavailable: ${error.message}`,`执行仍不可用：${error.message}`);}finally{button.disabled=contextPayload?.production?.runAllowed!==true;}
}

q('[data-use-reality-context]')?.addEventListener('change',loadContext);
q('[data-view-sources]')?.addEventListener('click',event=>{const list=q('[data-source-list]');const open=list.hidden;list.hidden=!open;event.currentTarget.setAttribute('aria-expanded',String(open));});
q('[data-iching-execute]')?.addEventListener('click',execute);
q('[data-iching-save]')?.addEventListener('click',async()=>{if(!currentView)return;const body={question:q('[data-iching-question]').value,methodEvidence:currentView.hierarchy?.[1]?.data,projection:currentView.hierarchy?.[2]?.data,reading:currentView,userNotes:''};const response=await fetch('/api/symbolic-method-save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const payload=await response.json().catch(()=>null);q('[data-save-status]').textContent=payload?.ok?localeText('Saved.','已保存。'):payload?.error?.code||localeText('Save unavailable.','暂时无法保存。');});
window.addEventListener('puxr:localechange',()=>{loadContext();if(currentView)renderIChingView(currentView);});
loadContext();
