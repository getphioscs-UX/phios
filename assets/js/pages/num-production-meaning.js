/* FMA-B NUM production-meaning bridge. It observes the accepted MCD-5 response without changing MCD-7 execution authority. */
const nativeFetch=globalThis.fetch?.bind(globalThis);
const hook=()=>document.querySelector('[data-num-production-meaning]');
const zh=()=>document.documentElement.lang==='zh-Hans';
const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function clear(){const el=hook();if(el)el.innerHTML='';}
function renderLoading(){const el=hook();if(el)el.innerHTML=`<section class="pr-num-meaning-card" data-state="loading"><small>${zh()?'Canonical Meaning':'Canonical Meaning'}</small><strong>${zh()?'正在建立受治理的数字读取…':'Building governed numeric reading…'}</strong></section>`;}
function renderFailure(code){const el=hook();if(el)el.innerHTML=`<section class="pr-num-meaning-card" data-state="blocked"><small>Canonical Meaning</small><strong>${zh()?'读取暂时不可用':'Reading temporarily unavailable'}</strong><code>${esc(code)}</code></section>`;}
function roleFrom(item){return item?.sourceProjectionRef?.selector?.match?.code||'';}
function render(payload){
 const el=hook();if(!el)return; const items=payload?.localeProjection?.items||[]; const reading=payload?.reading;
 const seen=new Set(); const rows=[];
 for(const item of items){const role=roleFrom(item);const key=`${role}:${item.meaningCode}`;if(seen.has(key))continue;seen.add(key);rows.push(`<article><small>${esc(role.replaceAll('_',' '))}</small><strong>${esc(item.label)}</strong><p>${esc(item.definition)}</p></article>`);}
 el.innerHTML=`<section class="pr-num-meaning-card" data-state="available"><header><div><small>Numeric Runtime v1</small><h3>${zh()?'Canonical Meaning 与 Reading':'Canonical Meaning & Reading'}</h3></div><span class="pr-num-available">${zh()?'Available｜可用':'Available'}</span></header><p class="pr-num-boundary">${zh()?'这是结构化 canonical meaning，不是命运预测或专业判断。':'This is governed structural canonical meaning, not fate prediction or professional judgment.'}</p><div class="pr-num-meaning-grid">${rows.join('')}</div><footer><span>${zh()?'执行完整度':'Execution completeness'}: <strong>${esc(reading?.executionCompleteness||payload?.executionCompleteness||'UNKNOWN')}</strong></span><code>${esc(payload?.meaningBundle?.bundleCode||'')}</code></footer></section>`;
}
async function requestMeaning(projection){
 if(!nativeFetch||projection?.method?.publicMethodCode!=='NUMEROLOGY_PROJECTION')return;
 renderLoading();
 try{const response=await nativeFetch('/api/method-meaning',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({schemaVersion:'PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0',locale:zh()?'zh-Hans':'en',canonicalProjection:projection})});const payload=await response.json();if(!response.ok||payload?.ok!==true)return renderFailure(payload?.error||'CMP_MEANING_UNAVAILABLE');render(payload);}catch{renderFailure('CMP_MEANING_NETWORK_FAILURE');}
}
if(nativeFetch){
 globalThis.fetch=async function(input,init){
  const response=await nativeFetch(input,init); let url='';try{url=typeof input==='string'?input:input?.url||'';}catch{}
  if(/\/api\/method-execute(?:\?|$)/.test(url)){try{const payload=await response.clone().json();const projection=payload?.result;if(payload?.ok===true&&projection?.method?.publicMethodCode==='NUMEROLOGY_PROJECTION')queueMicrotask(()=>requestMeaning(projection));}catch{}}
  return response;
 };
}
document.addEventListener('click',event=>{if(event.target?.closest?.('#processPersonalRuntime,#clearPersonalRuntimeInput'))clear();});
