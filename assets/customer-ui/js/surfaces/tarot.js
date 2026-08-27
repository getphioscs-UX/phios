// PHI OS canonical customer Tarot experience.
// The user chooses facedown cards; the governed runtime validates MANUAL_SELECTION and creates the reading.
const q=s=>document.querySelector(s);
const qa=s=>[...document.querySelectorAll(s)];
const method='TAROT';
const CARD_REGISTRY_URL='/content/professional/core-method-runtime/tarot-card-registry-v1.json';
let contextPayload=null;
let currentView=null;
let serverAuthorityOk=false;
let spreadId='THREE_CARD';
let shuffledCardIds=[];
let selectedCardIds=[];

const escape=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const arr=v=>Array.isArray(v)?v:[];
const isZh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
const localeText=(en,zh)=>isZh()?zh:en;
const human=v=>String(v??'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const requiredCount=()=>spreadId==='THREE_CARD'?3:1;
const positions=()=>spreadId==='THREE_CARD'?
  [
    {id:'SITUATION',en:'Situation',zh:'当前局面',helpEn:'Choose the first card for what is most present in the situation.',helpZh:'第一张牌代表：目前局面中最值得看见的部分。'},
    {id:'TENSION',en:'Tension',zh:'主要张力',helpEn:'Choose the second card for the tension, friction or competing force.',helpZh:'第二张牌代表：其中最明显的张力、摩擦或拉扯。'},
    {id:'CONSIDERATION',en:'Consideration',zh:'可以考虑什么',helpEn:'Choose the third card for what may deserve consideration next.',helpZh:'第三张牌代表：接下来值得纳入考虑的方向。'}
  ]:
  [{id:'WHAT_DESERVES_ATTENTION',en:'What deserves attention',zh:'最值得注意什么',helpEn:'Choose one card for the focus that deserves attention now.',helpZh:'选择一张牌，看此刻最值得你注意什么。'}];

function cryptoShuffle(values){
  const out=[...values];
  for(let i=out.length-1;i>0;i--){
    const max=0x100000000-(0x100000000%(i+1));let n;
    do{const x=new Uint32Array(1);crypto.getRandomValues(x);n=x[0];}while(n>=max);
    const j=n%(i+1);[out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}
async function loadCardRegistry(){
  const r=await fetch(CARD_REGISTRY_URL,{cache:'force-cache'});if(!r.ok)throw new Error('CARD_REGISTRY_UNAVAILABLE');
  const payload=await r.json();const ids=arr(payload.entries).map(x=>x.cardId).filter(Boolean);
  if(ids.length!==78||new Set(ids).size!==78)throw new Error('CARD_REGISTRY_INVALID');
  return ids;
}
async function loadContext(){
  const use=q('[data-use-reality-context]')?.checked===true;
  try{
    const [contextResponse,statusResponse]=await Promise.all([
      fetch(`/api/symbolic-method-context?method=${encodeURIComponent(method)}&useCurrentRealityContext=${use?'1':'0'}`,{cache:'no-store'}),
      fetch('/api/tarot-production-status',{cache:'no-store'})
    ]);
    contextPayload=await contextResponse.json().catch(()=>null);const statusPayload=await statusResponse.json().catch(()=>null);
    if(!contextResponse.ok||!contextPayload?.ok)throw new Error(contextPayload?.error?.code||'CONTEXT_UNAVAILABLE');
    if(!statusResponse.ok||!statusPayload?.ok)throw new Error(statusPayload?.error?.code||'STATUS_UNAVAILABLE');
    const a=contextPayload.production||{},b=statusPayload.production||{};
    serverAuthorityOk=a.runAllowed===true&&b.runAllowed===true&&a.state==='FULL_PRODUCTION'&&b.state==='FULL_PRODUCTION'&&a.releaseId===b.releaseId&&a.authorityDigest===b.authorityDigest&&b.clientMayGrantAuthority===false;
    const d=contextPayload.realityContext||{};
    q('[data-reality-context-disclosure]').textContent=use?(d.label||localeText('Current Reality context will be used only for comparison.','当前 Reality context 只会用于现实比较。')):'';
    q('[data-save-status]').textContent=contextPayload.account?.state==='ACCOUNT'?localeText('Saving requires verified identity and retention consent.','保存需要已验证身份与保留同意。'):localeText('Guest readings are not silently saved.','访客读取不会被静默保存。');
    updateReadButton();
  }catch(error){
    serverAuthorityOk=false;updateReadButton();
    q('[data-execution-status]').textContent=localeText('Tarot is temporarily unavailable.','Tarot 暂时无法运行。');
  }
}
function chooseSpread(next){
  spreadId=next==='ONE_CARD'?'ONE_CARD':'THREE_CARD';selectedCardIds=[];shuffledCardIds=[];
  for(const el of qa('[data-spread]'))el.setAttribute('aria-pressed',String(el.dataset.spread===spreadId));
  q('[data-draw-guide]').innerHTML=spreadId==='THREE_CARD'?`<p>${localeText('You will choose three facedown cards in order: Situation, Tension, and Consideration.','你会依次亲自选择三张牌：① 当前局面、② 主要张力、③ 可以考虑什么。')}</p>`:`<p>${localeText('You will choose one facedown card for what deserves attention now.','你会亲自选择一张牌，看此刻最值得注意什么。')}</p>`;
  q('[data-card-picker]').hidden=true;q('[data-reshuffle]').hidden=true;q('[data-position-focus]').hidden=true;q('[data-selection-summary]').hidden=true;
  updateReadButton();
}
function drawPositionCopy(){
  const list=positions();const i=Math.min(selectedCardIds.length,list.length-1);const pos=list[i];
  if(selectedCardIds.length>=requiredCount())return localeText('Your cards are chosen. You can now open the reading.','牌已经选好了。现在可以打开解读。');
  return `<strong>${localeText(`Card ${i+1} of ${requiredCount()} · ${pos.en}`,`第 ${i+1} / ${requiredCount()} 张 · ${pos.zh}`)}</strong><span>${localeText(pos.helpEn,pos.helpZh)}</span>`;
}
function renderDeck(){
  const picker=q('[data-card-picker]');const visible=shuffledCardIds;
  picker.innerHTML=visible.map((cardId,index)=>{
    const selectedIndex=selectedCardIds.indexOf(cardId);const selected=selectedIndex>=0;
    return `<button type="button" class="cx-tarot-card-back${selected?' is-selected':''}" data-card-id="${escape(cardId)}" ${selected?'disabled':''} aria-label="${escape(localeText(`Facedown Tarot card ${index+1}`,`第 ${index+1} 张牌背`))}"><span class="cx-tarot-card-back__mark" aria-hidden="true">Φ</span>${selected?`<span class="cx-tarot-card-back__number">${selectedIndex+1}</span>`:''}</button>`;
  }).join('');
  picker.hidden=false;q('[data-reshuffle]').hidden=false;
  q('[data-position-focus]').hidden=false;q('[data-position-focus]').innerHTML=drawPositionCopy();
  qa('[data-card-id]').forEach(el=>el.addEventListener('click',()=>selectCard(el.dataset.cardId)));
}
async function startDraw(){
  const question=q('[data-symbolic-question]')?.value?.trim();if(!question){q('[data-execution-status]').textContent=localeText('Write your question first.','请先写下你想理解的问题。');q('[data-symbolic-question]')?.focus();return;}
  q('[data-execution-status]').textContent=localeText('Shuffling…','正在洗牌……');
  try{const ids=await loadCardRegistry();shuffledCardIds=cryptoShuffle(ids);selectedCardIds=[];renderDeck();q('[data-selection-summary]').hidden=true;q('[data-execution-status]').textContent='';}
  catch(error){q('[data-execution-status]').textContent=localeText('The deck could not be prepared.','牌组暂时无法准备。');}
  updateReadButton();
}
function selectCard(cardId){
  if(selectedCardIds.includes(cardId)||selectedCardIds.length>=requiredCount())return;
  selectedCardIds.push(cardId);renderDeck();
  if(selectedCardIds.length===requiredCount()){
    const summary=q('[data-selection-summary]');summary.hidden=false;summary.innerHTML=`<strong>${localeText('Selection complete','选牌完成')}</strong><p>${localeText('The cards remain facedown until you open the reading.','牌会继续保持盖住，直到你打开解读。')}</p>`;
  }
  updateReadButton();
}
function updateReadButton(){
  const button=q('[data-symbolic-execute]');if(!button)return;
  button.disabled=!(serverAuthorityOk&&selectedCardIds.length===requiredCount()&&q('[data-symbolic-question]')?.value?.trim());
}
function list(items,{empty='—'}={}){const values=arr(items).filter(Boolean);if(!values.length)return `<p class="sp-empty">${escape(empty)}</p>`;return `<ul class="sp-detail-list">${values.map(v=>`<li>${typeof v==='string'?escape(v):escape(v.statement||v.reason||JSON.stringify(v))}</li>`).join('')}</ul>`;}
function positionLabel(position={}){const id=position.positionId||'';const map={SITUATION:['Situation','当前局面'],TENSION:['Tension','主要张力'],CONSIDERATION:['Consideration','可以考虑什么'],WHAT_DESERVES_ATTENTION:['What deserves attention','最值得注意什么']};const pair=map[id]||[position.label||human(id),position.label||human(id)];return localeText(pair[0],pair[1]);}
function projectionCards(view){return arr(view.hierarchy?.find(x=>x.id==='PROJECTION')?.data?.cards);}
function interpretationCards(view){return arr(view.hierarchy?.find(x=>x.id==='SYMBOLIC_INTERPRETATION')?.data?.cards);}
function drawMarkup(cards=[]){return `<div class="sp-card-grid sp-card-grid--reading">${cards.map(card=>{const art=card.artwork||{};const alt=isZh()?(art.altTextZhHans||`塔罗牌：${card.canonicalTitle}`):(art.altTextEn||`Tarot card: ${card.canonicalTitle}`);return `<article class="sp-card sp-card--reading"><div class="sp-card__art">${art.src?`<img src="${escape(art.src)}" alt="${escape(alt)}" loading="eager" decoding="async" referrerpolicy="no-referrer" data-card-art><span class="sp-card__image-fallback" hidden>${escape(card.canonicalTitle||card.cardId)}</span>`:`<span class="sp-card__image-fallback">${escape(card.canonicalTitle||card.cardId)}</span>`}</div><div class="sp-card__body"><p class="sp-kicker">${escape(positionLabel(card.position))}</p><h4>${escape(card.canonicalTitle||card.cardId)}</h4></div></article>`;}).join('')}</div>`;}
function claimText(card){const claim=arr(card?.waitePerspective?.editorialClaims)[0]||{};return isZh()?(claim.paraphraseZhHans||claim.claimZhHans||claim.paraphrase||claim.claim||''):(claim.paraphraseEn||claim.claimEn||claim.paraphrase||claim.claim||'');}
function themeText(card){const lead=isZh()?card?.productInterpretation?.productLeadZhHans:card?.productInterpretation?.productLeadEn;return lead||'';}
function reflectiveQuestion(card){const ref=card?.reflectivePerspective?.question||{};return isZh()?ref.questionZhHans:ref.questionEn;}
function positionReading(card,index,total){
  const pos=positionLabel(card.position);const title=card.canonicalTitle||card.cardId;const theme=themeText(card);const claim=claimText(card);const question=reflectiveQuestion(card);
  const framing=spreadId==='THREE_CARD'?
    (card.position?.positionId==='SITUATION'?localeText(`In the Situation position, ${title} frames the present question through this lens:`,`${title} 落在「当前局面」，这张牌先把你的问题聚焦到：`):card.position?.positionId==='TENSION'?localeText(`In the Tension position, ${title} asks where friction, competing standards or unresolved pressure may be operating:`,`${title} 落在「主要张力」，它要看的不是结果，而是哪里正在出现拉扯、冲突或难以同时满足的条件：`):localeText(`In the Consideration position, ${title} offers a lens for what may deserve deliberate attention before the next move:`,`${title} 落在「可以考虑什么」，它把注意力放在下一步行动前值得认真纳入判断的部分：`)):
    localeText(`${title} is the single focus card for this reading:`,`${title} 是这次读取唯一的聚焦牌：`);
  return `<article class="sp-reading-card"><header><span class="sp-reading-position">${escape(pos)}</span><h4>${escape(title)}</h4></header><p class="sp-reading-framing">${escape(framing)}</p>${theme?`<p class="sp-reading-theme">${escape(theme)}</p>`:''}${claim?`<div class="sp-reading-source-meaning"><strong>${localeText('Source-bound meaning','来源约束释义')}</strong><p>${escape(claim)}</p></div>`:''}${question?`<div class="sp-reading-question"><strong>${localeText('Bring it back to your situation','把它带回你的处境')}</strong><p>${escape(question)}</p></div>`:''}</article>`;
}
function synthesis(view){
  const cards=interpretationCards(view);if(!cards.length)return '';
  const question=q('[data-symbolic-question]')?.value?.trim()||'';
  if(cards.length===1){const c=cards[0];return localeText(`For “${question}”, ${c.canonicalTitle} does not give a yes/no verdict. It concentrates the reading on ${themeText(c).replace(/^Use .*? to examine /,'').replace(/;.*$/,'')||'one symbolic focus'} and asks you to test that focus against what is actually happening.`,`针对「${question}」，${c.canonicalTitle} 并不是给你一个“是 / 否”的裁决。它把这次读取集中到「${themeText(c).replace(/^使用「.*?」检视“/,'').replace(/”；.*$/,'')||'一个象征焦点'}」，重点是看这个主题是否真的能帮助你理解眼前处境，并继续用现实去验证。`);}
  const labels=cards.map(c=>`${positionLabel(c.position)}：${c.canonicalTitle}`);
  return localeText(`For “${question}”, read the three cards as a sequence rather than three isolated definitions: ${labels.join(' → ')}. The first frames what is present, the second shows where the question becomes tense or divided, and the third gives a consideration to carry into your next observation. This is a structure for reflection, not a prediction of what must happen.`,`针对「${question}」，这三张牌不要分开看成三个关键词，而要连成一个结构：${labels.join(' → ')}。第一张先照亮目前局面，第二张把主要拉扯显出来，第三张则把一个值得带进下一步观察与判断的方向放到你面前。它不是在预言事情一定会怎样，而是在帮助你看清：你现在面对的究竟是什么结构。`);
}
function realityMarkup(view){
  const data=view.hierarchy?.find(x=>x.id==='REALITY_COMPARISON')?.data||{};const using=contextPayload?.realityContext?.usingCurrentRealityContext===true||q('[data-use-reality-context]')?.checked===true;
  if(!using)return `<p>${localeText('You did not use your current Reality context in this reading. Treat the cards as a reflective hypothesis: ask what concrete events, words, behaviours, constraints or evidence would support or contradict the themes you just saw.','这次你没有使用当前 Reality context，所以不要把牌面当成现实证据。更好的做法是把上面的主题当作一个“待验证的假设”：接下来看看现实中有哪些事件、对话、行为、限制或证据真正支持它，又有哪些事实会反驳它。')}</p>`;
  const support=arr(data.supportingEvidence),contradict=arr(data.contradictoryEvidence),obs=arr(data.observation);
  return `<div class="sp-rcc-grid">${support.length?`<section><h4>${localeText('What supports the reflection','哪些现实支持这个视角')}</h4>${list(support)}</section>`:''}${contradict.length?`<section><h4>${localeText('What challenges it','哪些现实与它冲突')}</h4>${list(contradict)}</section>`:''}${obs.length?`<section><h4>${localeText('What is observable','目前可观察到什么')}</h4>${list(obs)}</section>`:''}</div><p class="sp-boundary-note">${localeText('Reality evidence outranks the symbolic reading whenever they conflict.','当现实证据与象征读取冲突时，以现实证据为先。')}</p>`;
}
function nextMarkup(view){const data=view.hierarchy?.find(x=>x.id==='POSSIBLE_NEXT_QUESTIONS_ACTIONS')?.data||[];const items=arr(data).map(x=>typeof x==='object'?(isZh()?x.zhHans:x.en):x).filter(Boolean).filter(x=>!/decision remains yours|决定权仍然属于你/i.test(x));return list(items,{empty:localeText('Notice what changes after you return to the situation.','回到现实后，观察什么发生了变化。')});}
function sourceMarkup(source={}){const units=arr(source.sourceUnits);return `<article class="sp-source-card"><header><div><p class="sp-kicker">${escape(source.perspectiveClass||'SOURCE')}</p><h4>${escape(source.sourceTitle||'Source')}</h4></div></header><p>${escape(localeText('This source informs the interpretation but does not establish Reality truth.','这个来源参与解释，但不建立现实事实。'))}</p>${units.length?`<ul class="sp-source-units">${units.map(u=>`<li>${u.sourceUrl?`<a href="${escape(u.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(u.sourceHeading||localeText('Open source','打开来源'))}</a>`:escape(u.sourceHeading||'')}</li>`).join('')}</ul>`:''}</article>`;}
function renderSymbolicView(view){
  currentView=view;const results=q('[data-symbolic-results]');results.hidden=false;
  const pCards=projectionCards(view);const iCards=interpretationCards(view);
  q('[data-reading-summary]').textContent=synthesis(view);
  q('[data-draw-display]').innerHTML=drawMarkup(pCards);
  q('[data-interpretation-display]').innerHTML=iCards.map((c,i)=>positionReading(c,i,iCards.length)).join('');
  q('[data-reality-display]').innerHTML=realityMarkup(view);
  q('[data-next-display]').innerHTML=nextMarkup(view);
  const sourceList=q('[data-source-list]');const sources=view.sourceVisibility?.sources||[];sourceList.innerHTML=sources.length?sources.map(sourceMarkup).join(''):`<p class="sp-empty">${localeText('No additional source note is available.','暂无更多来源说明。')}</p>`;
  qa('[data-card-art]').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const f=img.parentElement?.querySelector('.sp-card__image-fallback');if(f)f.hidden=false;},{once:true}));
  q('[data-symbolic-save]').disabled=!(contextPayload?.account?.saveContractAvailable);
  results.focus({preventScroll:true});results.scrollIntoView({behavior:'smooth',block:'start'});
}
async function execute(){
  const button=q('[data-symbolic-execute]');if(button?.disabled)return;const question=q('[data-symbolic-question]')?.value?.trim();if(!question)return;
  button.disabled=true;q('[data-execution-status]').textContent=localeText('Opening your reading…','正在打开你的读取……');
  try{
    const response=await fetch('/api/symbolic-method-execute',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({method,question,spreadId,selectedCardIds:[...selectedCardIds],useCurrentRealityContext:q('[data-use-reality-context]')?.checked===true})});
    const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.ok)throw new Error(payload?.error?.code||'EXECUTION_UNAVAILABLE');
    if(payload.publicView)renderSymbolicView(payload.publicView);q('[data-execution-status]').textContent='';
  }catch(error){q('[data-execution-status]').textContent=localeText('The reading could not be opened. Please try again.','这次读取没有成功打开，请再试一次。');}
  finally{updateReadButton();}
}
function resetReading(){currentView=null;selectedCardIds=[];shuffledCardIds=[];q('[data-symbolic-results]').hidden=true;q('[data-card-picker]').hidden=true;q('[data-position-focus]').hidden=true;q('[data-selection-summary]').hidden=true;q('[data-reshuffle]').hidden=true;q('[data-execution-status]').textContent='';updateReadButton();q('[data-symbolic-question]')?.focus();window.scrollTo({top:0,behavior:'smooth'});}

qa('[data-spread]').forEach(el=>el.addEventListener('click',()=>chooseSpread(el.dataset.spread)));
q('[data-start-draw]')?.addEventListener('click',startDraw);
q('[data-reshuffle]')?.addEventListener('click',startDraw);
q('[data-use-reality-context]')?.addEventListener('change',loadContext);
q('[data-symbolic-question]')?.addEventListener('input',updateReadButton);
q('[data-symbolic-execute]')?.addEventListener('click',execute);
q('[data-view-sources]')?.addEventListener('click',event=>{const source=q('[data-source-list]');const open=source.hidden;source.hidden=!open;event.currentTarget.setAttribute('aria-expanded',String(open));});
q('[data-new-reading]')?.addEventListener('click',resetReading);
q('[data-symbolic-save]')?.addEventListener('click',async()=>{if(!currentView)return;const body={question:q('[data-symbolic-question]').value,reading:currentView,userNotes:''};const r=await fetch('/api/symbolic-method-save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const payload=await r.json().catch(()=>null);q('[data-save-status]').textContent=payload?.ok?localeText('Saved.','已保存。'):localeText('Save is unavailable for this session.','这个会话暂时无法保存。');});
window.addEventListener('phios:localechange',()=>{chooseSpread(spreadId);loadContext();if(currentView)renderSymbolicView(currentView);});
chooseSpread('THREE_CARD');loadContext();
