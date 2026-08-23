/* FMA-C BZR production-meaning bridge. Observes accepted MCD-5 output and never recalculates BaZi. */
const nativeFetch=globalThis.fetch?.bind(globalThis);
const hook=()=>document.querySelector('[data-bzr-production-meaning]');
const zh=()=>document.documentElement.lang==='zh-Hans';
const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function clear(){const el=hook();if(el)el.innerHTML='';}
function renderLoading(){const el=hook();if(el)el.innerHTML=`<section class="pr-bzr-meaning-card" data-state="loading"><small>Canonical Meaning</small><strong>${zh()?'正在建立受治理的八字结构读取…':'Building governed BaZi structural reading…'}</strong></section>`;}
function renderFailure(code){const el=hook();if(el)el.innerHTML=`<section class="pr-bzr-meaning-card" data-state="blocked"><small>Canonical Meaning</small><strong>${zh()?'读取暂时不可用':'Reading temporarily unavailable'}</strong><code>${esc(code)}</code></section>`;}
function mappingRole(item){const code=item?.mappingLineage?.mappingCode||'';if(code.includes('-STEM-'))return zh()?'天干结构':'Stem structure';if(code.includes('-BRANCH-'))return zh()?'地支情境':'Branch context';if(code.includes('-PILLAR-'))return zh()?'柱位结构':'Pillar position';if(code.includes('-LUCK-CYCLE-'))return zh()?'运行阶段':'Runtime phase';return 'Canonical Meaning';}
function render(payload){
 const el=hook();if(!el)return; const items=payload?.localeProjection?.items||[]; const reading=payload?.reading;
 const seen=new Set(), rows=[];
 for(const item of items){const role=mappingRole(item);const key=`${role}:${item.meaningCode}`;if(seen.has(key))continue;seen.add(key);rows.push(`<article><small>${esc(role)}</small><strong>${esc(item.label)}</strong><p>${esc(item.definition)}</p></article>`);}
 const limits=(reading?.sections?.unknownAndLimitations?.limitations||[]).map(x=>`<code>${esc(x)}</code>`).join(' ');
 el.innerHTML=`<section class="pr-bzr-meaning-card" data-state="available"><header><div><small>BaZi Structural Runtime v1</small><h3>${zh()?'Canonical Meaning 与 Reading':'Canonical Meaning & Reading'}</h3></div><span class="pr-bzr-available">${zh()?'Available｜可用':'Available'}</span></header><p class="pr-bzr-boundary">${zh()?'这是受治理的结构读取；不产生命运预测、事件预测、身份断言或专业判断。':'This is governed structural reading; it does not create fate prediction, event prediction, identity claims, or professional judgment.'}</p><div class="pr-bzr-meaning-grid">${rows.join('')}</div>${limits?`<div class="pr-bzr-limitations"><small>${zh()?'本次执行限制':'Execution limitations'}</small><div>${limits}</div></div>`:''}<footer><span>${zh()?'执行完整度':'Execution completeness'}: <strong>${esc(reading?.executionCompleteness||payload?.executionCompleteness||'UNKNOWN')}</strong></span><code>${esc(payload?.meaningBundle?.bundleCode||'')}</code></footer></section>`;
}
async function requestMeaning(projection){
 if(!nativeFetch||projection?.method?.publicMethodCode!=='BAZI_PROJECTION')return;
 renderLoading();
 try{const response=await nativeFetch('/api/method-meaning',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({schemaVersion:'PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0',locale:zh()?'zh-Hans':'en',canonicalProjection:projection})});const payload=await response.json();if(!response.ok||payload?.ok!==true)return renderFailure(payload?.error||'CMP_MEANING_UNAVAILABLE');render(payload);}catch{renderFailure('CMP_MEANING_NETWORK_FAILURE');}
}
if(nativeFetch){
 globalThis.fetch=async function(input,init){
  const response=await nativeFetch(input,init);let url='';try{url=typeof input==='string'?input:input?.url||'';}catch{}
  if(/\/api\/method-execute(?:\?|$)/.test(url)){try{const payload=await response.clone().json();const projection=payload?.result;if(payload?.ok===true&&projection?.method?.publicMethodCode==='BAZI_PROJECTION')queueMicrotask(()=>requestMeaning(projection));}catch{}}
  return response;
 };
}
document.addEventListener('click',event=>{if(event.target?.closest?.('#processPersonalRuntime,#clearPersonalRuntimeInput'))clear();});
