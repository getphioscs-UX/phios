const clean=value=>String(value??'').trim();
const arr=value=>Array.isArray(value)?value:[];
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const zh=()=>document.documentElement?.lang==='zh-Hans';
const tr=(en,cn)=>zh()?cn:en;
const pad=value=>String(value).padStart(2,'0');

async function requestJson(url,options={}){
  const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options,headers:{accept:'application/json',...(options.headers||{})}});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||payload?.ok!==true){const error=new Error(payload?.error||'REQUEST_FAILED');error.code=payload?.error||'REQUEST_FAILED';throw error}
  return payload;
}

export function currentCivilMoment(timeZone=null,instantMs=Date.now()){
  const instant=new Date(instantMs);
  if(timeZone){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant);
    const get=type=>parts.find(item=>item.type===type)?.value||'';
    return Object.freeze({date:`${get('year')}-${get('month')}-${get('day')}`,time:`${get('hour')}:${get('minute')}`});
  }
  return Object.freeze({date:`${instant.getFullYear()}-${pad(instant.getMonth()+1)}-${pad(instant.getDate())}`,time:`${pad(instant.getHours())}:${pad(instant.getMinutes())}`});
}

function setLocalized(node,en,cn){if(!node)return;node.dataset.cxEn=en;node.dataset.cxZh=cn;node.textContent=tr(en,cn)}
function setStatus(scope,message,state=''){const node=scope.querySelector('[data-cx-target-status]');if(!node)return;node.textContent=message;node.dataset.state=state}
function dispatchChanged(scope){scope.dispatchEvent(new CustomEvent('phios:target-context-change',{bubbles:true}))}

function upgradeMethodExtension(section,kind){
  if(section.dataset.cxTargetMomentUpgraded==='true')return section;
  const isAst=kind==='astrology';
  const grid=section.querySelector(isAst?'.cx-ast-target-grid':'.cx-bazi-target-grid');
  const date=section.querySelector(isAst?'input[name="astCxTargetDate"]':'input[name="baziTargetDate"]');
  const time=section.querySelector(isAst?'input[name="astCxTargetTime"]':'input[name="baziTargetTime"]');
  const timezone=section.querySelector(isAst?'input[name="astCxTargetTimezone"]':'input[name="baziTargetTimezoneIana"]');
  const offset=section.querySelector(isAst?'input[name="astCxTargetUtcOffset"]':'input[name="baziTargetUtcOffset"]');
  if(!grid||!date||!time||!timezone||!offset)return section;
  section.dataset.cxTargetMoment=kind;
  section.dataset.cxTargetMomentUpgraded='true';
  date.dataset.cxTargetDate='';time.dataset.cxTargetTime='';timezone.dataset.cxTargetTimezone='';offset.dataset.cxTargetOffset='';
  timezone.closest('label')?.setAttribute('hidden','');offset.closest('label')?.setAttribute('hidden','');
  grid.classList.add('cx-target-moment-date-time');
  grid.insertAdjacentHTML('beforebegin',`<label class="cx-target-use-now"><input type="checkbox" name="${kind}TargetUseNow" data-cx-target-use-now><span data-cx-en="Use today and now" data-cx-zh="使用今天和现在">${tr('Use today and now','使用今天和现在')}</span></label>`);
  grid.insertAdjacentHTML('afterend',targetPlaceMarkup(`${kind}-target`,isAst?'astCxTargetPlaceRef':'baziTargetPlaceRef'));
  const header=section.querySelector('header .cx-body.cx-muted');
  const details=section.querySelector('details');
  const note=details?.querySelector('.cx-p1-note');
  if(isAst){
    setLocalized(header,'Natal reading works without a target. To add current activation, choose a date, time and confirmed target place; the timezone is resolved automatically.','本命读取不需要目标时刻。若要加入当前激活，请选择日期、时间与已确认的目标地点；时区会自动解析。');
    setLocalized(note,'All blank = natal only. A complete target is sent to the existing Astrology timing calculation, and the specialist renderer then presents that calculated activation.','全部留空＝只看本命。完整目标资料会送入既有占星时间计算，再由专业界面呈现已经算出的激活结果。');
  }else{
    setLocalized(header,'Choose the traditional calculation rule first. Add a date, time and confirmed target place only when you want a Da Yun / Liu Nian timing layer.','先选择传统大运顺逆计算规则；只有想加入大运／流年时间层时，才填写日期、时间与已确认的目标地点。');
    setLocalized(note,'The target timezone and its date-specific UTC offset are resolved from the confirmed place and stay out of the customer form.','系统会根据已确认地点自动解析目标时区与该日期对应的 UTC 偏移；客户表单不显示这些技术字段。');
  }
  return section;
}

function targetPlaceMarkup(key,placeRefName){
  const resultsId=`cx-${key}-place-results`;
  const placeQueryName=placeRefName.replace(/PlaceRef$/,'PlaceQuery');
  return `<div class="cx-target-place-field" data-cx-target-place-field>
    <label><span data-cx-en="Target place" data-cx-zh="目标地点">${tr('Target place','目标地点')}</span><div class="cx-place-input-wrap"><input type="search" name="${placeQueryName}" data-cx-target-place-input autocomplete="off" aria-autocomplete="list" aria-controls="${resultsId}" aria-expanded="false" placeholder="${tr('Start typing a city or area','输入城市或地区')}" data-cx-en-placeholder="Start typing a city or area" data-cx-zh-placeholder="输入城市或地区"><span class="cx-place-spinner" data-cx-target-spinner hidden aria-hidden="true"></span></div></label>
    <div id="${resultsId}" class="cx-place-results" data-cx-target-place-results role="listbox" hidden></div>
    <div class="cx-place-confirmed" data-cx-target-place-confirmed hidden><span aria-hidden="true">✓</span><div><small data-cx-en="Target place and timezone confirmed" data-cx-zh="目标地点与时区已确认">${tr('Target place and timezone confirmed','目标地点与时区已确认')}</small><strong data-cx-target-place-confirmed-label></strong></div><button type="button" data-cx-target-place-change data-cx-en="Change" data-cx-zh="更改">${tr('Change','更改')}</button></div>
    <input type="hidden" name="${placeRefName}" data-cx-target-place-ref>
    <p class="cx-place-help" data-cx-en="Choose a suggestion so the address, timezone and date-specific offset can be checked automatically." data-cx-zh="请从建议中选择地点；系统会自动校对地址、时区与该日期对应的时间偏移。">${tr('Choose a suggestion so the address, timezone and date-specific offset can be checked automatically.','请从建议中选择地点；系统会自动校对地址、时区与该日期对应的时间偏移。')}</p>
    <p class="cx-target-status" data-cx-target-status role="status" aria-live="polite"></p>
  </div>`;
}

function installOne(scope){
  if(scope.dataset.cxTargetMomentInstalled==='true'){
    const query=scope.querySelector('[data-cx-target-place-input]'),placeRef=scope.querySelector('[data-cx-target-place-ref]'),timezone=scope.querySelector('[data-cx-target-timezone]'),offset=scope.querySelector('[data-cx-target-offset]'),confirmed=scope.querySelector('[data-cx-target-place-confirmed]'),confirmedLabel=scope.querySelector('[data-cx-target-place-confirmed-label]');
    if(query?.value&&placeRef?.value&&timezone?.value&&offset?.value){if(confirmedLabel)confirmedLabel.textContent=query.value;if(confirmed)confirmed.hidden=false}
    return;
  }
  const date=scope.querySelector('[data-cx-target-date]'),time=scope.querySelector('[data-cx-target-time]'),timezone=scope.querySelector('[data-cx-target-timezone]'),offset=scope.querySelector('[data-cx-target-offset]');
  const query=scope.querySelector('[data-cx-target-place-input]'),placeRef=scope.querySelector('[data-cx-target-place-ref]'),results=scope.querySelector('[data-cx-target-place-results]'),spinner=scope.querySelector('[data-cx-target-spinner]'),confirmed=scope.querySelector('[data-cx-target-place-confirmed]'),confirmedLabel=scope.querySelector('[data-cx-target-place-confirmed-label]'),useNow=scope.querySelector('[data-cx-target-use-now]');
  if(!date||!time||!timezone||!offset||!query||!placeRef||!results)return;
  scope.dataset.cxTargetMomentInstalled='true';
  const state={candidates:[],active:-1,timer:null,sequence:0,resolving:false,applyingNow:false};
  const expanded=open=>{query.setAttribute('aria-expanded',String(open));if(!open){query.removeAttribute('aria-activedescendant');state.active=-1}};
  const clearResolution=({keepQuery=true}={})=>{placeRef.value='';timezone.value='';offset.value='';state.candidates=[];if(!keepQuery)query.value='';results.hidden=true;confirmed.hidden=true;expanded(false);dispatchChanged(scope)};
  const fillNow=zone=>{state.applyingNow=true;const current=currentCivilMoment(zone||null);date.value=current.date;time.value=current.time;state.applyingNow=false;dispatchChanged(scope)};
  const resolve=async({allowZoneCorrection=true}={})=>{
    if(!placeRef.value||!date.value||!time.value)return;
    const seq=++state.sequence;state.resolving=true;spinner.hidden=false;setStatus(scope,tr('Confirming the target place and its local time…','正在确认目标地点与当地时间…'));
    try{
      let payload=await requestJson('/api/target-location-resolve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({providerRef:placeRef.value,targetDate:date.value,targetTime:time.value,locale:zh()?'zh-Hans':'en'})});
      if(seq!==state.sequence)return;
      let location=payload.location;
      if(useNow?.checked&&allowZoneCorrection&&location?.targetTimezone?.iana){
        const current=currentCivilMoment(location.targetTimezone.iana);
        if(current.date!==date.value||current.time!==time.value){date.value=current.date;time.value=current.time;payload=await requestJson('/api/target-location-resolve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({providerRef:placeRef.value,targetDate:date.value,targetTime:time.value,locale:zh()?'zh-Hans':'en'})});location=payload.location}
      }
      timezone.value=clean(location?.targetTimezone?.iana);offset.value=clean(location?.targetTimezone?.utcOffsetAtTarget);
      if(!timezone.value||!offset.value)throw Object.assign(new Error('TARGET_TIMEZONE_NOT_RESOLVED'),{code:'TARGET_TIMEZONE_NOT_RESOLVED'});
      confirmedLabel.textContent=location.customerLabel||location.displayName||query.value;confirmed.hidden=false;results.hidden=true;expanded(false);
      setStatus(scope,tr('Address and timezone confirmed automatically.','地址与时区已自动确认。'),'success');dispatchChanged(scope);
    }catch(error){if(seq!==state.sequence)return;timezone.value='';offset.value='';confirmed.hidden=true;setStatus(scope,tr('The place was found, but its timezone could not be confirmed. Please choose it again.','已经找到地点，但暂时无法确认时区；请重新选择。'),'error');dispatchChanged(scope)}
    finally{if(seq===state.sequence){spinner.hidden=true;state.resolving=false}}
  };
  const setActive=index=>{const buttons=[...results.querySelectorAll('[data-cx-target-place-option]')];if(!buttons.length)return;state.active=(index+buttons.length)%buttons.length;buttons.forEach((button,i)=>button.setAttribute('aria-selected',String(i===state.active)));const active=buttons[state.active];query.setAttribute('aria-activedescendant',active.id);active.scrollIntoView({block:'nearest'})};
  const choose=candidate=>{state.candidates=[];query.value=candidate.primaryLabel||candidate.label||'';placeRef.value=candidate.providerRef||'';results.hidden=true;expanded(false);void resolve()};
  const renderCandidates=candidates=>{state.candidates=candidates;state.active=-1;if(!candidates.length){results.innerHTML=`<div class="cx-p1-empty">${esc(tr('No matching place found. Try a nearby city, state or country.','没有找到相符地点，请尝试附近城市、州属或国家名称。'))}</div>`}else results.innerHTML=candidates.map((candidate,index)=>`<button id="${results.id}-option-${index}" type="button" class="cx-place-option" role="option" data-cx-target-place-option="${index}" aria-selected="false"><strong>${esc(candidate.primaryLabel||candidate.label)}</strong>${candidate.secondaryLabel?`<small>${esc(candidate.secondaryLabel)}</small>`:''}</button>`).join('');results.hidden=false;expanded(true);results.querySelectorAll('[data-cx-target-place-option]').forEach(button=>{button.addEventListener('mouseenter',()=>setActive(Number(button.dataset.cxTargetPlaceOption)));button.addEventListener('click',()=>choose(candidates[Number(button.dataset.cxTargetPlaceOption)]))})};
  const search=async value=>{const q=clean(value),seq=++state.sequence;if(q.length<2){results.hidden=true;expanded(false);return}spinner.hidden=false;try{const payload=await requestJson(`/api/location-search?q=${encodeURIComponent(q)}&locale=${encodeURIComponent(zh()?'zh-Hans':'en')}`);if(seq===state.sequence)renderCandidates(arr(payload.candidates))}catch{if(seq===state.sequence){results.innerHTML=`<div class="cx-p1-empty">${esc(tr('Place search is temporarily unavailable. Please try again.','地点搜索暂时无法使用，请稍后再试。'))}</div>`;results.hidden=false;expanded(true)}}finally{if(seq===state.sequence)spinner.hidden=true}};
  query.addEventListener('input',()=>{clearResolution({keepQuery:true});clearTimeout(state.timer);state.timer=setTimeout(()=>void search(query.value),280)});
  query.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&!results.hidden&&state.candidates.length){event.preventDefault();setActive(state.active+1)}else if(event.key==='ArrowUp'&&!results.hidden&&state.candidates.length){event.preventDefault();setActive(state.active<0?state.candidates.length-1:state.active-1)}else if(event.key==='Enter'&&state.active>=0&&state.candidates[state.active]){event.preventDefault();choose(state.candidates[state.active])}else if(event.key==='Escape'&&!results.hidden){event.preventDefault();results.hidden=true;expanded(false)}});
  scope.querySelector('[data-cx-target-place-change]')?.addEventListener('click',()=>{clearResolution({keepQuery:false});query.focus()});
  for(const input of [date,time])input.addEventListener('change',()=>{if(!state.applyingNow&&useNow)useNow.checked=false;if(placeRef.value)void resolve({allowZoneCorrection:false});else{timezone.value='';offset.value='';dispatchChanged(scope)}});
  useNow?.addEventListener('change',()=>{if(!useNow.checked)return;fillNow(timezone.value||null);if(placeRef.value)void resolve();else setStatus(scope,tr('Today and now are filled. Choose the target place to confirm its local timezone.','已填入今天和现在；请选择目标地点以确认当地时区。'))});
  const form=scope.closest('form');form?.addEventListener('reset',()=>setTimeout(()=>{state.sequence++;state.candidates=[];state.active=-1;confirmed.hidden=true;results.hidden=true;setStatus(scope,'');expanded(false)},0));
  if(placeRef.value&&timezone.value&&offset.value&&query.value){confirmedLabel.textContent=query.value;confirmed.hidden=false}
}

export function upgradeAndInstallTargetMomentControls(root=document){
  root.querySelectorAll('[data-cx-ast-target-context-v2]').forEach(section=>upgradeMethodExtension(section,'astrology'));
  root.querySelectorAll('[data-cx-bazi-target-context]').forEach(section=>upgradeMethodExtension(section,'bazi'));
  const scopes=[...(root.matches?.('[data-cx-target-moment]')?[root]:[]),...root.querySelectorAll('[data-cx-target-moment]')];
  scopes.forEach(installOne);
}

export default Object.freeze({currentCivilMoment,upgradeAndInstallTargetMomentControls});
