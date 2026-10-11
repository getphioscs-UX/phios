import {installCapabilityOverview,renderEntryResult} from '../ask-entry-ui.js';
import {openEntryTarget} from '../entry-context-handoff.js';
const root=document.querySelector('[data-cir-root]');
if(root){
 const form=root.querySelector('[data-cir-form]'),q=root.querySelector('[data-cir-question]'),status=root.querySelector('[data-cir-status]');
 const result=document.createElement('section');result.dataset.askR1Result='';result.hidden=true;result.setAttribute('aria-live','polite');form.after(result);installCapabilityOverview(root);
 let busy=false,routedQuestion='';
 const go=async(selection=null)=>{const question=q?.value?.trim()||'';if(!question||busy)return;busy=true;form?.setAttribute('aria-busy','true');const button=form?.querySelector('[type=submit]');if(button)button.disabled=true;status.textContent=document.documentElement.lang==='zh-Hans'?'正在找到相关入口…':'Finding a relevant entrance…';try{const r=await fetch('/api/client-intent-route',{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000),body:JSON.stringify({question,locale:document.documentElement.lang,entrySurface:'HOME',...(typeof selection==='string'?{capabilityId:selection,selectionConfirmed:true}:selection&&typeof selection==='object'?{capabilityId:selection.capabilityId,selectedMethodId:selection.selectedMethodId,selectionConfirmed:true}:{})})});const p=await r.json();if(!r.ok||!p.ok)throw Error('ROUTE_FAILED');if(q.value.trim()!==question){result.hidden=true;status.textContent='';return;}routedQuestion=question;renderEntryResult(result,p.route,{retry:()=>go(),select:id=>go(id),clarify:()=>q?.focus()});status.textContent='';}catch{status.textContent='';renderEntryResult(result,{outcome:'SERVICE_FAILURE',primaryAction:{kind:'RETRY',label:document.documentElement.lang==='zh-Hans'?'重试':'Retry'}},{retry:()=>go(),select:id=>go(id),clarify:()=>q?.focus()});}finally{busy=false;form?.setAttribute('aria-busy','false');if(button)button.disabled=false;}};
 q?.addEventListener('input',()=>{result.hidden=true;result._askR1Route=null;routedQuestion='';status.textContent='';});
 form?.addEventListener('submit',e=>{e.preventDefault();go();});
 result.addEventListener('click',e=>{const link=e.target.closest('a');if(link && result.dataset.entryState==='MATCHED_CAPABILITY' && openEntryTarget(link.getAttribute('href'),routedQuestion))e.preventDefault();});
 root.querySelectorAll('[data-cir-intent]').forEach(button=>button.addEventListener('click',()=>{q?.focus();}));
}
