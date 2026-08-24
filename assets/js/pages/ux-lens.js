import { getLocale, onLocaleChange } from '../i18n.js';

const root=document.querySelector('[data-uxl-root]');
if(root){
const form=root.querySelector('[data-uxl-form]'), question=root.querySelector('[data-uxl-question]'), status=root.querySelector('[data-uxl-status]');
const result=root.querySelector('[data-uxl-result]'), contextPanel=root.querySelector('[data-uxl-context-panel]'), contextForm=root.querySelector('[data-uxl-context-form]');
let taxonomyHint=null, lastPayload=null, lastQuestion='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const zh=()=>getLocale()==='zh-Hans';
const T={
 loading:()=>zh()?'正在判断这个问题需要什么…':'Determining what this question needs…',
 failed:()=>zh()?'暂时无法完成这个问题。':'This question could not be completed right now.',
 health:()=>zh()?'Health Reality · 健康现实':'Health Reality',
 knowledge:()=>zh()?'Knowledge · 受治理知识':'Governed knowledge',
 current:()=>zh()?'Current Reality · 当前现实':'Current Reality',
 lens:()=>zh()?'Reality Lens · 现实视角':'Reality Lens',
 relationship:()=>zh()?'Relational Reality · 关系现实':'Relational Reality',
 moreContext:()=>zh()?'要可靠地继续，这里需要一点当前现实上下文。它只用于这次 Ask，不会自动保存为 Canonical Reality。':'A little current context is needed to continue reliably. It is temporary for this Ask and is not automatically saved as Canonical Reality.',
 addContext:()=>zh()?'补充当前上下文':'Add current context',
 addInput:()=>zh()?'补充这个视角需要的资料':'Add information for this lens',
 searchKnowledge:()=>zh()?'查看相关知识':'Explore related knowledge',
 professional:()=>zh()?'这需要现实中的专业判断。PHI OS 可以帮助整理资料与问题，但不会替代医疗、法律或财务专业判断。':'This requires real-world professional judgment. PHI OS can help organize information and questions, but does not replace medical, legal, or financial professionals.'
};
function listHtml(items,empty='—'){const xs=(items||[]).filter(Boolean);return xs.length?`<ul>${xs.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:`<p>${esc(empty)}</p>`}
function setStatus(v){status.textContent=v}
function publicState(payload){const s=payload?.cka?.w5w17?.answerState||payload?.ask2?.client?.answerState||'';return s;}
function domainLabel(payload){if(payload.mode==='HEALTH')return T.health();const tax=payload?.ask2?.plan?.taxonomy; if(tax==='RELATIONSHIP')return T.relationship(); if(payload.mode==='ASK2'&&tax==='REALITY_FACT')return T.current(); if(payload.mode==='ASK2')return T.lens(); return T.knowledge();}
function sources(payload){return payload?.cka?.w5w17?.record?.retrievalContext?.authorityGroups?.flatMap(g=>(g.sources||[]).map(s=>({...s,authorityClass:g.authorityClass})))||[]}
function render(payload){lastPayload=payload;const cka=payload?.cka, answer=cka?.clientAnswer, envelope=cka?.w5w17;if(!answer||!envelope)throw new Error('UXL_PUBLIC_PROJECTION_MISSING');
 result.hidden=false;result.querySelector('[data-uxl-domain]').textContent=domainLabel(payload);result.querySelector('[data-uxl-result-question]').textContent=answer.question||lastQuestion;
 const state=publicState(payload); const direct=state==='PROFESSIONAL_HANDOFF'?T.professional():answer.directAnswer;
 result.querySelector('[data-uxl-see-body]').innerHTML=`<p>${esc(direct)}</p>`;
 const why=answer.whyThisMayHappen||[];result.querySelector('[data-uxl-shaping-body]').innerHTML=listHtml(why,zh()?'目前没有足够依据建立更多解释。':'No additional explanation is established yet.');
 const lens=result.querySelector('[data-uxl-lens]'), lensBody=result.querySelector('[data-uxl-lens-body]');const disc=payload?.ask2?.client?.disclosure||payload?.ask2?.plan?.lensDisclosure;
 const primary=disc?.primary?.label||disc?.primary||null;const supporting=(disc?.supporting||[]).map(x=>typeof x==='string'?x:x.label).filter(Boolean);const whyLens=disc?.why||payload?.ask2?.plan?.whyThisLens?.reason;
 if(primary||supporting.length){lens.hidden=false;lensBody.innerHTML=`${primary?`<p><strong>${zh()?'主要视角':'Primary'}:</strong> ${esc(primary)}</p>`:''}${supporting.length?`<p><strong>${zh()?'辅助视角':'Supporting'}:</strong> ${esc(supporting.join(' · '))}</p>`:''}${whyLens?`<p class="uxl-boundary">${esc(whyLens)}</p>`:''}<p class="uxl-boundary">${esc(zh()?'Runtime 结果来自受治理执行；模型不能自行补算。':'Runtime results come from governed execution; the model cannot calculate them itself.')}</p>`}else lens.hidden=true;
 result.querySelector('[data-uxl-unknown-body]').innerHTML=listHtml(answer.unknown?.details,zh()?'目前没有额外未知项被记录。':'No additional unknown is recorded.');
 result.querySelector('[data-uxl-observe-body]').innerHTML=listHtml(answer.whatToObserve,zh()?'继续观察现实中的变化与反馈。':'Continue observing real-world changes and feedback.');
 const ss=sources(payload), ssec=result.querySelector('[data-uxl-sources]');if(ss.length){ssec.hidden=false;result.querySelector('[data-uxl-source-body]').innerHTML=ss.map(s=>`<div class="uxl-source"><strong>${esc(s.authorityLabel||s.publisher||s.authorityClass||'Source')}</strong><p>${esc(s.description||'')}</p>${s.href&&/^https:\/\//.test(s.href)?`<a href="${esc(s.href)}" target="_blank" rel="noopener">${zh()?'查看来源':'Open source'}</a>`:''}</div>`).join('')}else ssec.hidden=true;
 renderNext(state,payload);
 if(['NEEDS_CONTEXT','CURRENT_CONTEXT_REQUIRED'].includes(state)||payload?.ask2?.plan?.orchestrationState==='CURRENT_CONTEXT_REQUIRED'){contextPanel.hidden=false;root.querySelector('[data-uxl-context-lead]').textContent=T.moreContext()} else contextPanel.hidden=true;
 result.scrollIntoView({behavior:'smooth',block:'start'});
}
function renderNext(state,payload){const node=result.querySelector('[data-uxl-next]');const actions=[];if(state==='NEEDS_CONTEXT'||payload?.ask2?.plan?.orchestrationState==='CURRENT_CONTEXT_REQUIRED')actions.push(`<button class="uxl-primary" type="button" data-next-context>${esc(T.addContext())}</button>`);if(state==='ASK2_INPUT_REQUIRED')actions.push(`<span class="uxl-state">${esc(T.addInput())}</span>`);if(state==='NEEDS_CURRENT_AUTHORITY')actions.push(`<span class="uxl-state">${esc(zh()?'这需要最新受治理来源':'Up-to-date governed sources are required')}</span>`);actions.push(`<a class="uxl-secondary" href="/library?query=${encodeURIComponent(lastQuestion)}">${esc(T.searchKnowledge())}</a>`);node.innerHTML=actions.join('');node.querySelector('[data-next-context]')?.addEventListener('click',()=>{contextPanel.hidden=false;contextPanel.scrollIntoView({behavior:'smooth',block:'center'})})}
async function run(guidedContext={}){const q=question.value.trim();if(!q)return;lastQuestion=q;setStatus(T.loading());try{const response=await fetch('/api/ask-phios-orchestrated',{method:'POST',headers:{'content-type':'application/json',Accept:'application/json'},cache:'no-store',body:JSON.stringify({q,locale:getLocale(),taxonomyHint,guidedContext,publicRequest:true})});const payload=await response.json();if(!response.ok||!payload?.ok)throw new Error(payload?.error?.code||'UXL_ASK_FAILED');render(payload);setStatus('')}catch(e){setStatus(`${T.failed()}${e?.message?` (${e.message})`:''}`)}}
form.addEventListener('submit',e=>{e.preventDefault();run()});root.querySelectorAll('[data-taxonomy-hint]').forEach(btn=>btn.addEventListener('click',()=>{const next=btn.dataset.taxonomyHint;taxonomyHint=taxonomyHint===next?null:next;root.querySelectorAll('[data-taxonomy-hint]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.taxonomyHint===taxonomyHint)))}));
contextForm.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(contextForm);run(Object.fromEntries([...fd.entries()].map(([k,v])=>[k,String(v).trim()]))) });
onLocaleChange(()=>{if(lastPayload)render(lastPayload)});const initial=new URLSearchParams(location.search).get('q');if(initial){question.value=initial.slice(0,500);queueMicrotask(()=>run())}
}
