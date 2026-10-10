const root=document.querySelector('[data-cir-root]');
if(root){
  const form=root.querySelector('[data-cir-form]'),q=root.querySelector('[data-cir-question]'),status=root.querySelector('[data-cir-status]');let intent=null;
  const go=async()=>{const question=q?.value?.trim()||'';if(!question&&!intent)return;status.textContent=document.documentElement.lang==='zh-Hans'?'正在判断最合适的入口…':'Finding the smallest useful entry…';try{const r=await fetch('/api/client-intent-route',{method:'POST',headers:{'content-type':'application/json'},cache:'no-store',body:JSON.stringify({question,taxonomyHint:intent})});const p=await r.json();if(!r.ok||!p.ok)throw new Error('ROUTE_FAILED');location.href=p.route.href}catch{const params=new URLSearchParams();if(question)params.set('q',question);if(intent)params.set('intent',intent);location.href=`/ask${params.size?`?${params}`:''}`}};
  form?.addEventListener('submit',e=>{e.preventDefault();go()});
  root.querySelectorAll('[data-cir-intent]').forEach(button=>button.addEventListener('click',()=>{intent=button.dataset.cirIntent;root.querySelectorAll('[data-cir-intent]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));if(!q?.value?.trim())location.href=`/ask?intent=${encodeURIComponent(intent)}`}));
}
