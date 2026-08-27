const button=document.querySelector('[data-iching-full-entry]');
const availabilityCard=document.querySelector('[data-iching-availability-title]')?.closest('aside');
let active=false;
const text=(en,zh)=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh')?zh:en;

function render(){
  if(availabilityCard) availabilityCard.hidden=true;
  if(!button)return;
  if(active){
    button.disabled=false;
    button.textContent=text('Open I Ching reading','进入易经阅读');
  }else{
    button.disabled=true;
    button.textContent=text('Reading temporarily unavailable','阅读暂时不可用');
  }
}

if(button){
  if(availabilityCard) availabilityCard.hidden=true;
  button.addEventListener('click',()=>{if(active)location.assign('/perspectives/iching/run/');});
  fetch('/api/iching-full-production-status',{cache:'no-store'})
    .then(r=>r.json())
    .then(payload=>{
      active=payload?.production?.runAllowed===true&&payload?.production?.globalPublicExecution===true;
      render();
    })
    .catch(()=>render());
  window.addEventListener('phios:localechange',render);
}
