const button=document.querySelector('[data-iching-full-entry]');
const card=document.querySelector('[data-iching-availability-title]')?.closest('aside');
const text=(en,zh)=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh')?zh:en;
let ready=false;
if(card)card.remove();
function render(){
  if(!button)return;
  button.disabled=!ready;
  button.textContent=ready?text('Start an I Ching reading','开始易经阅读'):text('Reading temporarily unavailable','阅读暂时不可用');
  const hint=button.previousElementSibling;
  if(hint?.classList?.contains('cx-muted'))hint.textContent=text('Ask one clear question, choose a casting method, and then read the primary hexagram, changing lines, and relating hexagram in order.','写下一个清楚的问题，选择起卦方式，再按顺序阅读本卦、变爻与之卦。');
}
button?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();if(ready)location.assign('/perspectives/iching/consult/');},true);
fetch('/api/iching-full-production-status',{cache:'no-store',headers:{accept:'application/json'}}).then(r=>r.json()).then(payload=>{ready=payload?.production?.runAllowed===true&&payload?.production?.globalPublicExecution===true;render();}).catch(()=>render());
window.addEventListener('phios:localechange',render);
render();
