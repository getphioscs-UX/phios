/* ASTA-W19 AST structural successor bridge. Preserves legacy MCD v1 display; requests governed AST v2 and Meaning separately. */
const previousFetch=globalThis.fetch?.bind(globalThis);
const hook=()=>document.querySelector('[data-ast-production-meaning]');
const zh=()=>document.documentElement.lang==='zh-Hans';
const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function clear(){const el=hook();if(el)el.innerHTML='';}
function loading(){const el=hook();if(el)el.innerHTML=`<section class="pr-ast-meaning-card" data-state="loading"><small>Astrology Structural Runtime v1</small><strong>${zh()?'正在建立完整结构投影与受治理读取…':'Building full structural projection and governed reading…'}</strong></section>`;}
function blocked(code){const el=hook();if(el)el.innerHTML=`<section class="pr-ast-meaning-card" data-state="blocked"><small>Astrology Structural Runtime v1</small><strong>${zh()?'完整结构读取暂时不可用':'Full structural reading temporarily unavailable'}</strong><code>${esc(code)}</code></section>`;}
function refs(body){return (body?.meaningRefs||[]).map(x=>`<li><strong>${esc(x.label||x.meaningCode)}</strong><span>${esc(x.definition||'')}</span></li>`).join('');}
function render(payload){
 const el=hook();if(!el)return;const reading=payload?.reading;const bodies=reading?.sections?.compositeStructure?.bodies||[];const aspects=reading?.sections?.compositeStructure?.aspects||[];const limits=reading?.sections?.unknownAndLimitations?.limitations||[];
 const bodyCards=bodies.map(body=>`<article class="pr-ast-body"><header><strong>${esc(body.bodyCode)}</strong><span>${esc(body.signCode||'—')}${body.houseNumber?` · H${esc(body.houseNumber)}`:''}</span></header><ul>${refs(body)}</ul></article>`).join('');
 const aspectRows=aspects.map(x=>`<li><span>${esc(x.fromCode)} — ${esc(x.toCode)}</span><strong>${esc(x.aspectType)}</strong>${x.relationMeaning?.label?`<small>${esc(x.relationMeaning.label)}</small>`:''}</li>`).join('');
 const limitHtml=limits.length?`<div class="pr-ast-limits"><small>${zh()?'本次执行限制':'Execution limitations'}</small>${limits.map(x=>`<code>${esc(x)}</code>`).join('')}</div>`:'';
 el.innerHTML=`<section class="pr-ast-meaning-card" data-state="available"><header class="pr-ast-heading"><div><small>Astrology Structural Runtime v1</small><h3>${zh()?'Canonical Meaning 与 Reading':'Canonical Meaning & Reading'}</h3></div><span class="pr-ast-available">${zh()?'Available｜可用':'Available'}</span></header><p class="pr-ast-boundary">${zh()?'这里显示功能、方向、现实领域与结构关系；不产生命运预测、事件预测、身份事实或专业判断。':'This surface shows functions, directions, reality domains and structural relations; it does not create fate prediction, event prediction, identity facts, or professional judgment.'}</p><div class="pr-ast-body-grid">${bodyCards}</div>${aspectRows?`<details class="pr-ast-aspects"><summary>${zh()?'Major Aspects｜主要相位':'Major Aspects'} · ${aspectRows?aspects.length:0}</summary><ul>${aspectRows}</ul></details>`:''}${limitHtml}<footer><span>${zh()?'执行完整度':'Execution completeness'}: <strong>${esc(reading?.executionCompleteness||payload?.executionCompleteness||'UNKNOWN')}</strong></span><code>${esc(payload?.meaningBundle?.bundleCode||'')}</code></footer></section>`;
}
function parseBody(init){try{if(typeof init?.body==='string')return JSON.parse(init.body);}catch{}return null;}
async function requestFullAst(executionRequest){
 if(!previousFetch||executionRequest?.methodCode!=='ASTROLOGY')return;loading();
 try{
  const structural=await previousFetch('/api/ast-structural-execute',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify(executionRequest)});
  const structuralPayload=await structural.json();if(!structural.ok||structuralPayload?.ok!==true)return blocked(structuralPayload?.error||'AST_STRUCTURAL_PROJECTION_UNAVAILABLE');
  const projection=structuralPayload.result;
  document.dispatchEvent(new CustomEvent('phios:ast-structural-projection',{detail:{projection,executionRequest}}));
  const meaning=await previousFetch('/api/method-meaning',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},cache:'no-store',body:JSON.stringify({schemaVersion:'PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0',locale:zh()?'zh-Hans':'en',canonicalProjection:projection})});
  const payload=await meaning.json();if(!meaning.ok||payload?.ok!==true)return blocked(payload?.error||'CMP_AST_MEANING_UNAVAILABLE');render(payload);
 }catch{blocked('AST_STRUCTURAL_READING_NETWORK_FAILURE');}
}
if(previousFetch){
 globalThis.fetch=async function(input,init){
  const response=await previousFetch(input,init);let url='';try{url=typeof input==='string'?input:input?.url||'';}catch{}
  if(/\/api\/method-execute(?:\?|$)/.test(url)){
   try{const payload=await response.clone().json();const executionRequest=parseBody(init);if(payload?.ok===true&&payload?.result?.method?.publicMethodCode==='ASTROLOGY_PROJECTION'&&executionRequest?.methodCode==='ASTROLOGY')queueMicrotask(()=>requestFullAst(executionRequest));}catch{}
  }
  return response;
 };
}
document.addEventListener('click',event=>{if(event.target?.closest?.('#processPersonalRuntime,#clearPersonalRuntimeInput'))clear();});
