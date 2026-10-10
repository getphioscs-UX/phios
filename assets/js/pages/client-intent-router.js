import {installCapabilityOverview,renderEntryResult} from '../ask-entry-ui.js';
const root=document.querySelector('[data-cir-root]');
if(root){
 const form=root.querySelector('[data-cir-form]'),q=root.querySelector('[data-cir-question]'),status=root.querySelector('[data-cir-status]');
 const result=document.createElement('section');result.dataset.askR1Result='';result.hidden=true;result.setAttribute('aria-live','polite');root.append(result);installCapabilityOverview(root);
 let busy=false;
 const go=async()=>{const question=q?.value?.trim()||'';if(!question||busy)return;busy=true;form?.setAttribute('aria-busy','true');const button=form?.querySelector('[type=submit]');if(button)button.disabled=true;status.textContent=document.documentElement.lang==='zh-Hans'?'正在找到相关入口…':'Finding a relevant entrance…';try{const r=await fetch('/api/client-intent-route',{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify({question,locale:document.documentElement.lang,entrySurface:'HOME'})});const p=await r.json();if(!r.ok||!p.ok)throw Error('ROUTE_FAILED');renderEntryResult(result,p.route);status.textContent='';}catch{status.textContent=document.documentElement.lang==='zh-Hans'?'入口暂时无法连接，请重试，或直接浏览知识。':'Unable to connect. Retry or browse knowledge directly.';}finally{busy=false;form?.setAttribute('aria-busy','false');if(button)button.disabled=false;}};
 form?.addEventListener('submit',e=>{e.preventDefault();go();});
 root.querySelectorAll('[data-cir-intent]').forEach(button=>button.addEventListener('click',()=>{q?.focus();}));
}
