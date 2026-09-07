import {arr,esc,locale,postJson,reRenderOnLocale,setStatus,tr} from './runtime-ui.js';
import {handoffToMyReality} from '../handoff.js';

let view=null;
const empty=message=>`<div class="cx-p1-empty">${esc(message)}</div>`;

const sourceClassLabel=value=>({
  GOVERNED_KNOWLEDGE:tr('PHI OS knowledge','PHI OS 知识'),
  CURRENT_PUBLIC_FACT:tr('Current public information','当前公共信息'),
  CURRENT_REALITY:tr('Current situation','当前处境'),
  SELF_REPORTED_CURRENT_REALITY:tr('Your current situation','你提供的当前处境'),
  SYMBOLIC_INTERPRETIVE:tr('Interpretive reading','解释性读取'),
  EXTERNAL_PROFILE:tr('External profile result','外部 Profile 结果'),
  SELF_REPORTED:tr('Your self-assessment','你的自我评估'),
  MEASURED_TASK_BASED:tr('Task performance','任务表现'),
  CONTINUITY:tr('Continuity context','持续情境'),
  PROFESSIONAL_EVIDENCE:tr('Professional material','专业资料'),
  GOVERNED_SOURCE:tr('PHI OS source','PHI OS 来源')
})[value]||tr('Source','来源');

const participantLabel=value=>({
  SELF:tr('You','你'),PUBLIC:tr('Public','公共'),A_AND_B:tr('You + Person B','你 + 对方'),
  CASE_PARTICIPANTS:tr('Case participants','个案参与者')
})[value]||value||'';

const scopeLabel=value=>{
  if(!value)return '';
  if(String(value).startsWith('RELATIONSHIP:'))return tr('This relationship','这段关系');
  return ({QUESTION:tr('This question','这个问题'),SOURCE:tr('Selected source','所选来源'),READING:tr('This reading','这份读取'),RELATIONSHIP:tr('This relationship','这段关系'),PROFILE:tr('This profile','这份 Profile'),REALITY:tr('My Reality','My Reality'),PROFESSIONAL_CASE:tr('Professional case','专业个案'),NONE:''})[value]||value;
};

const systemLabel=value=>({
  AVAILABLE:tr('Available','可使用'),
  CURRENT:tr('Current at retrieval','取得时为当前资料'),
  FRESH:tr('Recently retrieved','近期取得'),
  STALE:tr('May be out of date','可能已经过时'),
  CURRENT_SESSION:tr('For this question','仅用于这个问题'),
  VERSIONED:tr('Versioned reference','版本化参考'),
  NOT_USED:tr('Not used','未使用'),
  NOT_REQUIRED:tr('Not required','不需要'),
  BOUNDED_PROVIDER:tr('Coverage depends on the available source','覆盖范围取决于当前可用来源'),
  SELF_REPORTED_CONTEXT_NOT_CANONICAL_REALITY:tr('Provided by you for this question; not treated as a verified fact','由你为这个问题提供；不会被当作已验证事实')
})[value]||String(value||'').replaceAll('_',' ').toLowerCase();

const list=items=>arr(items).length
  ?`<ul class="cx-p1-list">${items.map(x=>`<li>${esc(typeof x==='string'?systemLabel(x):x?.description||x?.title||x?.label||'')}</li>`).join('')}</ul>`
  :empty(tr('Nothing additional is available here.','这里没有额外内容。'));

function selectedKnowledgeContext(form){
  const input=form.querySelector('[data-cx-seeded-context][data-context-type="KNOWLEDGE"]:checked');
  return input?{contextRef:input.dataset.contextRef,contextLabel:input.dataset.contextLabel||tr('Selected knowledge source','已选择知识来源'),contextRoute:input.dataset.contextRoute||'/knowledge/'}:null;
}

function selectedRequest(form){
  const contexts=[];
  if(form.elements.questionOnly.checked)return {questionOnly:true,contexts:[],knowledgeContext:null};
  if(form.elements.contextKnowledge.checked)contexts.push({contextType:'KNOWLEDGE'});
  if(form.elements.contextReality.checked)contexts.push({contextType:'CURRENT_REALITY'});
  form.querySelectorAll('[data-cx-seeded-context]:checked').forEach(input=>contexts.push({contextType:input.dataset.contextType,contextRef:input.dataset.contextRef}));
  return {questionOnly:false,contexts,knowledgeContext:selectedKnowledgeContext(form)};
}

function guidedContext(form){
  return {
    whatIsHappening:String(form.elements.whatIsHappening?.value||'').trim(),
    howLong:String(form.elements.howLong?.value||'').trim(),
    whatChanged:String(form.elements.whatChanged?.value||'').trim(),
    whatMattersMostNow:String(form.elements.whatMattersMostNow?.value||'').trim()
  };
}

function syncLocalizedInputs(form){
  if(form?.elements?.question)form.elements.question.placeholder=tr('What feels uncertain, current, or important?','什么让你感到不确定、正在变化，或现在最重要？');
}

function syncSelection(form){
  const none=form.elements.questionOnly,knowledge=form.elements.contextKnowledge,reality=form.elements.contextReality;
  if(none.checked){knowledge.checked=false;reality.checked=false;form.querySelectorAll('[data-cx-seeded-context]').forEach(x=>x.checked=false);}
  if((knowledge.checked||reality.checked||[...form.querySelectorAll('[data-cx-seeded-context]')].some(x=>x.checked))&&none.checked)none.checked=false;
  document.querySelector('[data-cx-current-reality-fields]').hidden=!reality.checked;
  const selected=[];
  if(knowledge.checked)selected.push(tr('PHI OS knowledge','PHI OS 知识'));
  if(reality.checked)selected.push(tr('My current situation','我的当前处境'));
  form.querySelectorAll('[data-cx-seeded-context]:checked').forEach(x=>selected.push(x.dataset.contextLabel||x.dataset.contextType));
  const p=document.querySelector('[data-cx-context-disclosure] p');
  if(p){
    p.textContent=none.checked
      ?tr('Question only. No personal information will be added automatically, and nothing is saved here.','只问问题。不会自动加入个人资料，这里也不会自动保存内容。')
      :selected.length
        ?tr(`Using: ${selected.join(' · ')}. Nothing is saved automatically.`,`参考：${selected.join(' · ')}。不会自动保存。`)
        :tr('Nothing is selected yet. No personal information will be added automatically.','尚未选择参考内容，也不会自动加入个人资料。');
  }
  syncLocalizedInputs(form);
}

function sourceMeta(s){
  const values=[sourceClassLabel(s.sourceClass)];
  const participant=participantLabel(s.participant),scope=scopeLabel(s.caseScope);
  if(participant)values.push(participant);
  if(scope)values.push(scope);
  return values.join(' · ');
}

function sourceLink(s){
  if(!s.href)return '';
  const external=/^https:\/\//i.test(s.href);
  return `<a href="${esc(s.href)}"${external?' target="_blank" rel="noopener"':''}>${esc(tr('Open source','打开来源'))}</a>`;
}

function sourceCard(s){
  const limits=arr(s.limitations).map(systemLabel).filter(Boolean);
  return `<article class="cx-contextual-ask__source"><strong>${esc(s.label||tr('Source','来源'))}</strong><div class="cx-meta">${esc(sourceMeta(s))}</div>${s.excerpt?`<p>${esc(s.excerpt)}</p>`:''}${sourceLink(s)}${s.retrievedAt?`<div class="cx-meta">${esc(tr('Date','日期'))}: ${esc(s.retrievedAt)}${s.freshness?` · ${esc(systemLabel(s.freshness))}`:''}</div>`:''}${limits.length?`<div class="cx-meta">${esc(tr('Keep in mind','需要注意'))}: ${esc(limits.join(' · '))}</div>`:''}</article>`;
}

function renderBasis(){
  const groups=arr(view?.answerStructure?.basedOnGroups);
  document.querySelector('[data-cx-basis-statement]').textContent=view?.basedOn?.statement||'';
  document.querySelector('[data-cx-basis-groups]').innerHTML=groups.length
    ?`<div class="cx-contextual-ask__source-groups">${groups.map(g=>`<section class="cx-contextual-ask__source-group"><h3>${esc(sourceClassLabel(g.sourceClass))}</h3>${arr(g.sources).map(sourceCard).join('')}</section>`).join('')}</div>`
    :empty(tr('No selected source supported this answer.','没有所选来源支持这个回答。'));
}

function temporalCard(label,items,current=false){
  return `<article><small>${esc(label)}</small>${arr(items).length?`<ul class="cx-p1-list">${items.map(item=>`<li><strong>${esc(item.label||tr('Source','来源'))}</strong>${item.freshness?`<span class="cx-meta"> · ${esc(systemLabel(item.freshness))}</span>`:''}</li>`).join('')}</ul>`:empty(current?tr('No time-sensitive context was used.','没有使用时间敏感的情境。'):tr('No reference or earlier-generated context was selected.','没有选择参考资料或较早生成的情境。'))}</article>`;
}

function renderTemporal(){
  const temporal=view?.answerStructure?.currentVsStable||{};
  document.querySelector('[data-cx-current-vs-stable]').innerHTML=temporalCard(tr('Current / time-sensitive','当前／时间敏感'),temporal.current,true)+temporalCard(tr('Reference / generated earlier','参考／较早生成'),temporal.stable,false);
  const facts=view?.currentFacts||{};
  const node=document.querySelector('[data-cx-current-facts-disclosure]');
  if(!node)return;
  if(!facts.state||facts.state==='NOT_USED'||facts.state==='NOT_REQUIRED'){node.innerHTML='';return;}
  const limitations=arr(facts.limitations).map(systemLabel).filter(Boolean);
  node.innerHTML=`<div class="cx-p1-callout"><strong>${esc(tr('Current public information','当前公共信息'))}: ${esc(systemLabel(facts.state))}</strong>${facts.retrievedAt?`<p>${esc(tr('Retrieved','取得时间'))}: ${esc(facts.retrievedAt)}</p>`:''}${facts.freshness?`<p>${esc(tr('Status at retrieval','取得时状态'))}: ${esc(systemLabel(facts.freshness))}</p>`:''}${limitations.length?`<p>${esc(tr('Keep in mind','需要注意'))}: ${esc(limitations.join(' · '))}</p>`:''}<p>${esc(tr('Time-sensitive public information is kept separate from PHI OS reference knowledge.','时间敏感的公共信息会与 PHI OS 的参考知识分开显示。'))}</p></div>`;
}

function renderProvenance(){
  const groups=arr(view?.provenance?.groups);
  document.querySelector('[data-cx-ask-provenance]').innerHTML=groups.length?groups.map(g=>`<section><h3 class="cx-heading">${esc(sourceClassLabel(g.sourceClass))}</h3>${arr(g.sources).map(s=>{
    const participant=participantLabel(s.participant)||tr('Not applicable','不适用');
    const scope=scopeLabel(s.caseScope)||tr('This question','这个问题');
    return `<dl><dt>${esc(tr('Source','来源'))}</dt><dd>${esc(s.label||'')}</dd><dt>${esc(tr('Source type','来源类型'))}</dt><dd>${esc(sourceClassLabel(s.sourceClass))}</dd><dt>${esc(tr('Person','对象'))}</dt><dd>${esc(participant)}</dd><dt>${esc(tr('Used for','使用范围'))}</dt><dd>${esc(scope)}</dd>${s.retrievedAt?`<dt>${esc(tr('Date','日期'))}</dt><dd>${esc(s.retrievedAt)}</dd>`:''}${s.freshness?`<dt>${esc(tr('Time status','时间状态'))}</dt><dd>${esc(systemLabel(s.freshness))}</dd>`:''}</dl>`;
  }).join('')}</section>`).join(''):empty(tr('No source details are available.','没有可显示的来源细节。'));
}

function renderNext(){
  const next=document.querySelector('[data-cx-next-step]'),kind=view?.possibleNextStep?.kind;
  next.innerHTML=`<p class="cx-body">${esc(view?.possibleNextStep?.label||'')}</p>${kind==='REALITY_ESCALATION'?`<button class="cx-button cx-button--primary" type="button" data-cx-ask-reality>${esc(tr('Continue with My Reality','在 My Reality 继续'))}</button>`:kind==='RELATED_KNOWLEDGE'&&view?.relatedKnowledge?.[0]?.href?`<a class="cx-button" href="${esc(view.relatedKnowledge[0].href)}">${esc(tr('Explore related knowledge','查看相关知识'))}</a>`:''}`;
  next.querySelector('[data-cx-ask-reality]')?.addEventListener('click',()=>document.getElementById('cx-ask-handoff-dialog')?.showModal());
}

function render(){
  if(!view)return;
  document.querySelector('[data-cx-contextual-ask-result]').hidden=false;
  document.querySelector('[data-cx-answer-text]').textContent=view?.answer?.text||'';
  document.querySelector('[data-cx-answer-supporting]').innerHTML=arr(view?.answer?.supporting).length?list(view.answer.supporting):'';
  renderBasis();
  renderTemporal();
  document.querySelector('[data-cx-answer-limits]').innerHTML=list(view?.limits?.items);
  document.querySelector('[data-cx-related-knowledge]').innerHTML=arr(view?.relatedKnowledge).length?view.relatedKnowledge.map(k=>`<article class="cx-p1-source"><strong>${esc(k.title)}</strong>${k.description?`<p>${esc(k.description)}</p>`:''}${k.href?`<a href="${esc(k.href)}">${esc(tr('Explore','查看'))}</a>`:''}</article>`).join(''):empty(tr('No related knowledge or reading is available yet.','目前没有相关知识或读取。'));
  renderNext();
  renderProvenance();
}

function availabilityHelp(item,specificKnowledge){
  if(specificKnowledge)return tr('Selected from the page you came from. You can remove it before asking.','来自你刚才选择的页面；提问前可以取消使用。');
  if(item.availability==='AVAILABLE_FROM_SOURCE'){
    const who=participantLabel(item.participant),scope=scopeLabel(item.caseScope);
    return [tr('Opened from the original source and ready to use.','已从原始来源带入，可以使用。'),who,scope].filter(Boolean).join(' · ');
  }
  if(item.availability==='REQUIRES_SERVER_AUTHORIZED_CONTEXT')return tr('Open Ask from the original reading, relationship or profile to use this source securely.','请从原本的读取、关系或 Profile 页面打开 Ask，才能安全使用这项资料。');
  return tr('Available for this question.','可用于这个问题。');
}

async function loadSeededContexts(){
  const params=new URLSearchParams(location.search),contextType=params.get('contextType'),contextRef=params.get('contextRef'),contextLabel=params.get('contextLabel'),contextRoute=params.get('contextRoute');
  const node=document.querySelector('[data-cx-seeded-contexts]');
  if(!node)return;
  if(!contextType){node.innerHTML='';return;}
  try{
    const response=await fetch(`/api/customer-contextual-ask?locale=${encodeURIComponent(locale())}&contextType=${encodeURIComponent(contextType)}&contextRef=${encodeURIComponent(contextRef||'')}`,{cache:'no-store',credentials:'same-origin'});
    const payload=await response.json();
    const seeded=arr(payload?.availability).filter(x=>x.requestedContextRef||x.contextType===contextType).filter(x=>x.contextType!=='CURRENT_REALITY');
    node.innerHTML=seeded.map(x=>{
      const specificKnowledge=x.contextType==='KNOWLEDGE'&&x.requestedContextRef;
      const label=specificKnowledge?(contextLabel||tr('Selected knowledge source','已选择知识来源')):x.label;
      const available=x.availability==='AVAILABLE'||x.availability==='AVAILABLE_FROM_SOURCE';
      const checked=available&&(specificKnowledge||x.availability==='AVAILABLE_FROM_SOURCE');
      return `<label class="cx-context-choice" data-availability="${esc(x.availability)}"><input type="checkbox" data-cx-seeded-context data-context-type="${esc(x.contextType)}" data-context-ref="${esc(x.requestedContextRef||'')}" data-context-label="${esc(label)}" data-context-route="${esc(contextRoute||'/knowledge/')}" ${checked?'checked':''} ${available?'':'disabled'}><span><strong>${esc(label)}</strong><small>${esc(availabilityHelp(x,specificKnowledge))}</small></span></label>`;
    }).join('');
    if(node.querySelector('[data-context-type="KNOWLEDGE"]:checked')&&document.querySelector('[name="contextKnowledge"]'))document.querySelector('[name="contextKnowledge"]').checked=false;
  }catch{
    node.innerHTML=`<div class="cx-p1-callout">${esc(tr('The selected source could not be confirmed. You can still ask with Knowledge or add your current situation.','无法确认刚才选择的来源。你仍然可以使用知识提问，或加入当前处境。'))}</div>`;
  }
}

function errorMessage(code){
  const value=String(code||'');
  if(value.includes('CONSENT_REQUIRED'))return tr('Please confirm the consent box for the context you selected.','请先确认你所选择情境的同意选项。');
  if(value.includes('ENTITLEMENT_REQUIRED'))return tr('That saved source is not currently available for this Ask session. Open it again from its original page if access is available.','这份已保存来源目前无法用于本次 Ask。若仍有访问权限，请从原始页面重新打开。');
  if(value.includes('NOT_AUTHORIZED')||value.includes('SERVER_AUTHORIZATION_REQUIRED'))return tr('This source must be opened from its original reading, relationship or profile page before Ask can use it.','这项资料必须从原本的读取、关系或 Profile 页面打开后，Ask 才能使用。');
  if(value.includes('CURRENT_REALITY_CONTEXT_INPUT_REQUIRED'))return tr('Add a little about what is happening now, or turn off My current reality.','请补充一点现在正在发生什么，或取消「我的当前现实」。');
  return tr('This question could not be completed with the selected context. Try removing one source or asking with Knowledge only.','目前无法使用所选情境完成这个问题。你可以移除一个来源，或只使用知识再试一次。');
}

function boot(){
  const form=document.querySelector('[data-cx-contextual-ask-form]'),status=document.querySelector('[data-cx-contextual-ask-status]');
  if(!form)return;
  form.addEventListener('change',event=>{
    const target=event.target;
    if(target?.matches?.('[data-cx-seeded-context][data-context-type="KNOWLEDGE"]')&&target.checked){form.elements.contextKnowledge.checked=false;form.elements.questionOnly.checked=false;}
    if(target?.matches?.('[data-cx-seeded-context]')&&target.checked)form.elements.questionOnly.checked=false;
    syncSelection(form);
  });
  form.elements.questionOnly.addEventListener('change',()=>{if(form.elements.questionOnly.checked){form.elements.contextKnowledge.checked=false;form.elements.contextReality.checked=false;}syncSelection(form);});
  form.elements.contextKnowledge.addEventListener('change',()=>{if(form.elements.contextKnowledge.checked){form.elements.questionOnly.checked=false;form.querySelectorAll('[data-cx-seeded-context][data-context-type="KNOWLEDGE"]').forEach(x=>x.checked=false);}syncSelection(form);});
  form.elements.contextReality.addEventListener('change',()=>{if(form.elements.contextReality.checked)form.elements.questionOnly.checked=false;syncSelection(form);});
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    const question=String(form.elements.question.value||'').trim();
    if(!question)return;
    const selection=selectedRequest(form),guided=guidedContext(form);
    if(form.elements.contextReality.checked&&!form.elements.currentRealityConsent.checked){setStatus(status,tr('Confirm that the situation you entered may be used for this question.','请确认你填写的当前处境可以用于这个问题。'),'error');return;}
    setStatus(status,tr('Connecting your question to the selected sources…','正在把你的问题与所选来源连接起来…'));
    try{
      const payload=await postJson('/api/customer-contextual-ask',{question,locale:locale(),...selection,guidedContext:guided,contextConsent:{CURRENT_REALITY:form.elements.currentRealityConsent.checked===true}});
      view=payload.view;
      render();
      setStatus(status,'','success');
      document.querySelector('[data-cx-contextual-ask-result]').scrollIntoView({behavior:'smooth',block:'start'});
    }catch(error){setStatus(status,errorMessage(error?.code),'error');}
  });
  document.querySelector('[data-cx-ask-handoff-confirm]')?.addEventListener('click',async()=>{
    const consent=document.querySelector('[data-cx-ask-handoff-consent]'),s=document.querySelector('[data-cx-ask-handoff-status]');
    if(!consent?.checked){setStatus(s,tr('Confirm that you want to continue this question in My Reality.','请确认你要把这个问题带到 My Reality 继续。'),'error');return;}
    try{
      setStatus(s,tr('Preparing My Reality…','正在准备 My Reality…'));
      await handoffToMyReality({sourceType:'ASK',viewModel:view,statusNode:s});
      setStatus(s,tr('My Reality opened.','My Reality 已打开。'),'success');
    }catch{setStatus(s,tr('The handoff could not be completed right now.','目前无法完成带入。'),'error');}
  });
  const initial=new URLSearchParams(location.search).get('q');
  if(initial)form.elements.question.value=initial.slice(0,500);
  loadSeededContexts().finally(()=>syncSelection(form));
  syncSelection(form);
  reRenderOnLocale(()=>{loadSeededContexts().finally(()=>syncSelection(form));if(view)render();});
}

boot();
