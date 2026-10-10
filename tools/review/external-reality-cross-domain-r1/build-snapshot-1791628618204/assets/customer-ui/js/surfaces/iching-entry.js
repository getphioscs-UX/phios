const button=document.querySelector('[data-iching-full-entry]');
const title=document.querySelector('[data-iching-availability-title]');
const body=document.querySelector('[data-iching-availability-body]');
const state=document.querySelector('[data-iching-availability-state]');
let active=false;
const text=(en,zh)=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh')?zh:en;
function render(){
  if(!button)return;
  if(active){
    button.disabled=false;button.textContent=text('Open I Ching reading','进入易经阅读');
    if(title)title.textContent=text('Full Production is available.','Full Production 已开放。');
    if(body)body.textContent=text('Global public execution is active on the exact server-promoted deployment. Guest saving remains explicit-consent-only.','当前准确部署已经由服务器权限正式提升，全球公开执行已开启；访客保存仍必须明确同意。');
    if(state)state.textContent='FULL_PRODUCTION';
  }else{
    button.disabled=true;button.textContent=text('Run when live activation is complete','完成正式启用后即可运行');
    if(state)state.textContent='NOT ACTIVE';
  }
}
if(button){
  button.addEventListener('click',()=>{if(active)location.assign('/perspectives/iching/run/');});
  fetch('/api/iching-full-production-status',{cache:'no-store'}).then(r=>r.json()).then(payload=>{active=payload?.production?.runAllowed===true&&payload?.production?.globalPublicExecution===true;render();}).catch(()=>render());
  window.addEventListener('phios:localechange',render);
}
