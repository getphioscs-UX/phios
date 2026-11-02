import {renderIChingCustomerReading} from './iching-consult-renderer.js';

const q=selector=>document.querySelector(selector);
const qa=selector=>[...document.querySelectorAll(selector)];
const isZh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
const locale=()=>isZh()?'zh-Hans':'en';
const t=(en,zh)=>isZh()?zh:en;
const clean=value=>String(value??'').normalize('NFKC').trim();
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const ASSETS={
  overview:{en:'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-en.webp','zh-Hans':'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-METHODS-OVERVIEW-v1-zh-Hans.webp'},
  threeCoin:{en:'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-en.webp','zh-Hans':'/assets/customer-ui/media/iching/casting/PHIOS-ICHING-CASTING-THREE-COIN-GUIDE-v1-zh-Hans.webp'}
};
let method='SYSTEM_RANDOM';
let serviceReady=false;
let guestSaveAvailable=false;
let latestView=null;
let latestRequest=null;
let coinLineIndex=0;
let coinChoices={1:null,2:null,3:null};
let recordedCoinLines=[];

function question(){return clean(q('[data-consult-question]')?.value);}
function lineMeaning(value){return ({6:t('old yin · changing','老阴 · 变爻'),7:t('young yang · stable','少阳 · 静爻'),8:t('young yin · stable','少阴 · 静爻'),9:t('old yang · changing','老阳 · 变爻')})[Number(value)]||'';}
function lineMark(value){return ({6:'⚋ ×',7:'⚊',8:'⚋',9:'⚊ ○'})[Number(value)]||'—';}
function linePositionLabel(index){return index===0?t('bottom line','初爻'):index===5?t('top line','上爻'):t(`line ${index+1}`,`第 ${index+1} 爻`);}
function setServiceMessage(message=''){const node=q('[data-service-message]');if(!node)return;node.textContent=message;node.hidden=!message;}
function setBusy(busy){for(const node of qa('[data-start-system-cast],[data-read-manual],[data-read-coins],[data-record-line]'))node.disabled=busy||node.dataset.recordLineDisabled==='true';document.body.dataset.ichingBusy=String(busy);}
function ensureQuestion(){const value=question();if(value)return value;setServiceMessage(t('Write one clear question before casting.','请先写下一个你想理解的问题，再开始起卦。'));q('[data-consult-question]')?.focus();q('[data-consult-question]')?.scrollIntoView({behavior:'smooth',block:'center'});return null;}
function updateQuestionCount(){const node=q('[data-question-count]');if(node)node.textContent=String(q('[data-consult-question]')?.value?.length||0);setServiceMessage('');}
function updateGuideImages(){const l=locale();const overview=q('[data-guide-overview-img]');const coin=q('[data-guide-three-coin-img]');if(overview)overview.src=ASSETS.overview[l];if(coin)coin.src=ASSETS.threeCoin[l];}

async function refreshService(){
  try{
    const response=await fetch('/api/iching-full-production-status',{cache:'no-store',headers:{accept:'application/json'}});
    const payload=await response.json();
    serviceReady=response.ok&&payload?.production?.runAllowed===true&&payload?.production?.globalPublicExecution===true;
    if(!serviceReady)setServiceMessage(t('The reading service is temporarily unavailable. Please try again shortly.','阅读服务暂时不可用，请稍后再试。'));
    else setServiceMessage('');
  }catch{serviceReady=false;setServiceMessage(t('The reading service is temporarily unavailable. Please try again shortly.','阅读服务暂时不可用，请稍后再试。'));}
  try{const r=await fetch('/api/iching-full-context',{cache:'no-store'});const p=await r.json();guestSaveAvailable=Boolean(p?.guest?.saveContractAvailable);}catch{guestSaveAvailable=false;}
}

function setMethod(next){
  method=next;
  qa('[data-method]').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.method===method)));
  qa('[data-method-panel]').forEach(panel=>panel.hidden=panel.dataset.methodPanel!==method);
  if(method==='COIN_CAST'||method==='MANUAL_LINES')q('[data-method-guide]').open=true;
  setServiceMessage('');
}

function renderCoinRecorder(){
  q('[data-current-line-label]').textContent=linePositionLabel(coinLineIndex);
  qa('[data-coin-choice]').forEach(button=>button.classList.toggle('is-selected',Number(button.dataset.value)===coinChoices[Number(button.dataset.coinChoice)]));
  const chosen=Object.values(coinChoices).filter(value=>value===2||value===3);
  const total=chosen.length===3?chosen.reduce((sum,value)=>sum+value,0):null;
  q('[data-current-total]').textContent=total?`${total} · ${lineMark(total)}`:'—';
  q('[data-current-line-meaning]').textContent=total?lineMeaning(total):t('Choose the face shown by each coin.','选择三枚硬币各自出现的那一面。');
  const record=q('[data-record-line]');record.disabled=!total;record.dataset.recordLineDisabled=String(!total);
  const list=q('[data-recorded-lines]');
  list.innerHTML=recordedCoinLines.map((item,index)=>`<li><span>${index+1} · ${linePositionLabel(index)}</span><strong>${lineMark(item.value)}</strong><b>${item.value} · ${lineMeaning(item.value)}</b><small>${item.coins.join(' + ')}</small></li>`).join('');
  q('[data-read-coins]').hidden=recordedCoinLines.length!==6;
  q('.icx-current-toss').hidden=recordedCoinLines.length===6;
}
function recordCoinLine(){
  const values=[coinChoices[1],coinChoices[2],coinChoices[3]];
  if(values.some(value=>value!==2&&value!==3))return;
  recordedCoinLines.push({coins:[...values],value:values.reduce((sum,value)=>sum+value,0)});
  coinLineIndex=recordedCoinLines.length;
  coinChoices={1:null,2:null,3:null};
  renderCoinRecorder();
}
function resetCoinRecorder(){coinLineIndex=0;coinChoices={1:null,2:null,3:null};recordedCoinLines=[];q('.icx-current-toss').hidden=false;renderCoinRecorder();}

function renderCastProgress(lines,coins=[]){
  const list=q('[data-cast-lines]');list.innerHTML='';
  return async()=>{
    q('[data-cast-progress]').hidden=false;
    for(let index=0;index<lines.length;index++){
      const li=document.createElement('li');
      li.innerHTML=`<span>${index+1} · ${linePositionLabel(index)}</span><strong>${lineMark(lines[index])}</strong><b>${lines[index]} · ${lineMeaning(lines[index])}</b><small>${(coins[index]||[]).join(' + ')}</small>`;
      list.append(li);
      q('[data-cast-progress-label]').textContent=t(`${index+1} of 6 lines`,`第 ${index+1} / 6 爻`);
      await sleep(180);
    }
  };
}

async function executeReading(body){
  latestRequest=body;
  q('[data-reading]').hidden=false;
  q('[data-reading-loading]').hidden=false;
  q('[data-reading-content]').innerHTML='';
  q('[data-reading-actions]').hidden=true;
  try{
    const response=await fetch('/api/iching-full-execute',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},cache:'no-store',body:JSON.stringify({...body,locale:locale()})});
    const payload=await response.json().catch(()=>null);
    if(!response.ok||!payload?.publicView)throw new Error(payload?.error?.code||'READING_UNAVAILABLE');
    latestView=payload.publicView;
    q('[data-reading-content]').innerHTML=renderIChingCustomerReading(latestView,locale());
    q('[data-reading-actions]').hidden=false;
    q('[data-save-reading]').hidden=!guestSaveAvailable;
    collapseWorkflow();
    q('[data-reading]').focus({preventScroll:true});
    q('[data-reading]').scrollIntoView({behavior:'smooth',block:'start'});
    qa('.icx-steps li').forEach((li,index)=>li.classList.toggle('is-active',index===2));
  }catch(error){
    setServiceMessage(t(`The reading could not be completed: ${error.message}`,`这次阅读暂时无法完成：${error.message}`));
    q('[data-reading]').hidden=true;
  }finally{q('[data-reading-loading]').hidden=true;setBusy(false);}
}

async function systemCast(){
  const currentQuestion=ensureQuestion();if(!currentQuestion)return;
  if(!serviceReady){await refreshService();if(!serviceReady)return;}
  setBusy(true);setServiceMessage(t('Casting the six lines…','正在形成六爻……'));
  try{
    const response=await fetch('/api/iching-full-cast',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},cache:'no-store',body:JSON.stringify({method:'I_CHING',intent:'CREATE_NEW_CAST',question:currentQuestion})});
    const payload=await response.json().catch(()=>null);if(!response.ok||!payload?.cast)throw new Error(payload?.error?.code||'CAST_UNAVAILABLE');
    const cast=payload.cast;const lines=cast.selection?.selectedSymbols?.map(Number)||[];const coins=cast.selection?.coinGroups||[];
    await renderCastProgress(lines,coins)();
    setServiceMessage(t('The six lines are complete. Preparing the interpretation…','六爻已经形成，正在整理解释……'));
    await executeReading({method:'I_CHING',question:currentQuestion,inputMode:'SYSTEM_RANDOM',randomSelectionEvidence:cast.randomSelectionEvidence,sessionId:cast.castId,timestamp:cast.createdAt,projectionVersion:'1.0.0',useCurrentRealityContext:false});
  }catch(error){setBusy(false);setServiceMessage(t(`Casting is temporarily unavailable: ${error.message}`,`起卦暂时不可用：${error.message}`));}
}
async function readManual(){
  const currentQuestion=ensureQuestion();if(!currentQuestion)return;
  if(!serviceReady){await refreshService();if(!serviceReady)return;}
  const lines=qa('[data-manual-line]').sort((a,b)=>Number(a.dataset.manualLine)-Number(b.dataset.manualLine)).map(node=>Number(node.value));
  setBusy(true);setServiceMessage(t('Preparing the reading…','正在整理这次阅读……'));
  await executeReading({method:'I_CHING',question:currentQuestion,inputMode:'MANUAL_LINES',lines,sessionId:crypto.randomUUID?.()||`ICH-MANUAL-${Date.now()}`,timestamp:new Date().toISOString(),projectionVersion:'1.0.0',useCurrentRealityContext:false});
}
async function readCoins(){
  const currentQuestion=ensureQuestion();if(!currentQuestion)return;
  if(recordedCoinLines.length!==6)return;
  if(!serviceReady){await refreshService();if(!serviceReady)return;}
  setBusy(true);setServiceMessage(t('Preparing the reading…','正在整理这次阅读……'));
  await executeReading({method:'I_CHING',question:currentQuestion,inputMode:'COIN_CAST',coinLines:recordedCoinLines.map(item=>item.coins),sessionId:crypto.randomUUID?.()||`ICH-COIN-${Date.now()}`,timestamp:new Date().toISOString(),projectionVersion:'1.0.0',useCurrentRealityContext:false});
}
function collapseWorkflow(){q('[data-workflow-body]').hidden=true;q('[data-workflow-complete]').hidden=false;}
function toggleWorkflow(){const body=q('[data-workflow-body]');body.hidden=!body.hidden;q('[data-workflow-complete] button').textContent=body.hidden?t('Review question & cast','查看问题与起卦过程'):t('Hide question & cast','收起问题与起卦过程');if(!body.hidden)q('[data-workflow]')?.scrollIntoView({behavior:'smooth',block:'start'});}
function resetReading(){latestView=null;latestRequest=null;q('[data-reading]').hidden=true;q('[data-workflow-body]').hidden=false;q('[data-workflow-complete]').hidden=true;q('[data-cast-progress]').hidden=true;q('[data-cast-lines]').innerHTML='';resetCoinRecorder();qa('.icx-steps li').forEach((li,index)=>li.classList.toggle('is-active',index===0));q('[data-consult-question]')?.focus();q('[data-workflow]')?.scrollIntoView({behavior:'smooth',block:'start'});}
async function saveReading(){
  if(!latestView||!latestRequest)return;
  if(!confirm(t('Save this reading to your signed guest session? Nothing is saved unless you confirm.','要把这次阅读保存到当前签名访客会话吗？只有你确认后才会保存。')))return;
  const hierarchy=latestView.hierarchy||[];
  const methodEvidence=hierarchy.find(item=>item.id==='METHOD_EVIDENCE')?.data||{};
  const projection=hierarchy.find(item=>item.id==='PROJECTION')?.data||{};
  const response=await fetch('/api/iching-full-save',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({question:latestRequest.question,methodEvidence,projection,reading:latestView,userNotes:'',retentionConsent:{accepted:true,scope:'SYMBOLIC_READING',policyVersion:'ICHING-GUEST-RETENTION-v1'}})});
  const payload=await response.json().catch(()=>null);q('[data-save-status]').textContent=payload?.ok?t('Saved.','已保存。'):t('Save is temporarily unavailable.','暂时无法保存。');
}
function rerenderLocale(){
  updateGuideImages();renderCoinRecorder();
  if(latestView)q('[data-reading-content]').innerHTML=renderIChingCustomerReading(latestView,locale());
  qa('[data-question-prompt]').forEach(btn=>{btn.textContent=isZh()?btn.dataset.zh:btn.dataset.en;});
}

q('[data-consult-question]')?.addEventListener('input',updateQuestionCount);
qa('[data-question-prompt]').forEach(btn=>btn.addEventListener('click',()=>{q('[data-consult-question]').value=isZh()?btn.dataset.zh:btn.dataset.en;updateQuestionCount();q('[data-consult-question]').focus();}));
qa('[data-method]').forEach(btn=>btn.addEventListener('click',()=>setMethod(btn.dataset.method)));
qa('[data-coin-choice]').forEach(btn=>btn.addEventListener('click',()=>{coinChoices[Number(btn.dataset.coinChoice)]=Number(btn.dataset.value);renderCoinRecorder();}));
q('[data-record-line]')?.addEventListener('click',recordCoinLine);
q('[data-start-system-cast]')?.addEventListener('click',systemCast);
q('[data-read-manual]')?.addEventListener('click',readManual);
q('[data-read-coins]')?.addEventListener('click',readCoins);
q('[data-open-three-coin-guide]')?.addEventListener('click',()=>{q('[data-method-guide]').open=true;q('[data-guide-three-coin]')?.scrollIntoView({behavior:'smooth',block:'center'});});
q('[data-open-method-overview]')?.addEventListener('click',()=>{q('[data-method-guide]').open=true;q('[data-guide-overview]')?.scrollIntoView({behavior:'smooth',block:'center'});});
q('[data-toggle-workflow]')?.addEventListener('click',toggleWorkflow);
q('[data-new-reading]')?.addEventListener('click',()=>{if(confirm(t('Start a new reading? The current screen will be cleared.','要开始新的阅读吗？当前画面会被清空。')))resetReading();});
q('[data-save-reading]')?.addEventListener('click',saveReading);
window.addEventListener('phios:localechange',rerenderLocale);
updateQuestionCount();resetCoinRecorder();setMethod('SYSTEM_RANDOM');rerenderLocale();refreshService();q('[data-consult-question]')?.focus();
