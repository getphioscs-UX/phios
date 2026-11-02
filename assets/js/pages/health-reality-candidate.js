const form=document.querySelector('[data-health-reality-form]');
const output=document.querySelector('[data-health-reality-output]');
const status=document.querySelector('[data-health-route-status]');
const zh=()=>document.documentElement.lang.startsWith('zh');
const tr=(en,cn)=>zh()?cn:en;
let observation=null,route=null,pending=0;
const add=(parent,tag,en,cn)=>{const n=document.createElement(tag);n.textContent=tr(en,cn);parent.append(n);return n;};
let statusCopy=null;
function setStatus(en,zh){statusCopy=[en,zh];status.textContent=tr(en,zh);}
function render(){
 if(!observation){output.hidden=true;output.replaceChildren();return;}
 output.hidden=false;output.replaceChildren();
 add(output,'h2','This session’s observation','本次会话的观察');
 const text=document.createElement('p');text.textContent=observation.concern;output.append(text);
 add(output,'p',observation.date?'Observed: '+observation.date:'Observation date not provided.',observation.date?'观察日期：'+observation.date:'尚未提供观察日期。');
 add(output,'p','This organizes an observation; it does not diagnose a condition, rule out disease or prescribe treatment. Nothing is saved to your account.','这里只整理观察，不诊断、不排除疾病、不开具治疗方案，也不保存到账户。');
 if(route){
  const section=document.createElement('section');add(section,'h3','What to consider next','下一步可关注的事项');
  const map={HRX_SAFETY_FIRST:['This concern needs appropriate real-world medical care.','这项情况需要现实中的适当医疗照护。'],HRX_AUTHORITY_REQUIRED:['Current health facts need an approved, current health source. No factual conclusion was established here.','当前健康事实需要合适的最新来源；这里尚未确立事实结论。'],HRX_GUIDED_CONTEXT:['Use the question to organize what you know and what remains uncertain, without diagnosing it.','用问题区分已知与未知，不作诊断。'],HRX_GROUNDED_HEALTH:['A current health source is available for explanation. It is not an individual diagnosis.','当前有健康来源可供解释；这不等于个人诊断。']};
  add(section,'p',...(map[route.route]||['This stays with general knowledge rather than an individual health assessment.','这里仅作一般知识整理，不是个人健康评估。']));
  output.append(section);
 }
 const clear=add(output,'button','Clear this session’s observation','清除本次会话观察');clear.type='button';clear.addEventListener('click',()=>{pending++;observation=null;route=null;render();setStatus('Observation cleared. Nothing was saved.','观察已清除，没有保存资料。');});
}
if(form&&output){
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form),id=++pending;
  observation={concern:String(data.get('concern')||'').trim(),date:String(data.get('observedAt')||'').trim()};route=null;render();
  if(data.get('processingConsent')!=='GRANTED'){setStatus('Organized on this page only. Health routing was not requested.','仅在本页整理；没有请求健康信息处理。');return;}
  setStatus('Organizing the health question…','正在整理健康问题……');
  try{
   const response=await fetch('/api/ask-phios-health',{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',credentials:'same-origin',body:JSON.stringify({question:observation.concern,caseRef:'EPHEMERAL-HEALTH-CANDIDATE',consentState:'GRANTED'})});
   const body=await response.json();if(id!==pending)return;if(!response.ok||!body.ok)throw Error('HEALTH_ROUTE_FAILED');
   route=body;render();setStatus('Health question organized. Nothing was saved.','健康问题已整理；没有保存资料。');
  }catch{if(id!==pending)return;setStatus('Health routing is unavailable. Your observation remains on this page; you can retry or clear it.','目前无法处理健康问题。观察仍在本页，你可以重试或清除。');}
 });
 new MutationObserver(()=>{render();if(statusCopy)setStatus(...statusCopy);}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
