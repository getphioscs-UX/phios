import {tr} from './runtime-ui.js';
export function installAskServiceStatus(form){
 const notice=document.createElement('aside');notice.dataset.askServiceStatus='checking';notice.setAttribute('role','status');notice.className='cx-card';form.before(notice);
 let state='checking';
 const render=()=>{
  notice.replaceChildren();
  const p=document.createElement('p');p.textContent=state==='MAINTENANCE'?tr('Ask is temporarily unavailable. Signing in or changing sources does not remove this restriction. You can still read published sources.','提问服务暂不可用。登录或更换来源不会解除限制，仍可阅读已发布资料。'):state==='unknown'?tr('Ask availability could not be checked. Your question will remain here if submission fails.','暂时无法确认提问服务状态。提交失败时，你的问题会保留在此。'):state==='checking'?tr('Checking Ask availability…','正在确认提问服务状态…'):tr('Availability is confirmed when you submit. Public reading remains available.','服务是否可用会在提交时确认，公开阅读仍可使用。');notice.append(p);
  for(const [href,en,zh]of[['/knowledge/','Read published knowledge','阅读公开知识'],['/search/','Search public sources','搜索公开来源']]){const a=document.createElement('a');a.href=href+'?locale='+document.documentElement.lang;a.textContent=tr(en,zh);a.style.marginInlineEnd='1rem';notice.append(a);}
  if(state==='PUBLIC_BASIC_ONLY')p.textContent=tr('Public basic questions are available without an AI model or saving your question. Account materials, paid tasks and saving remain unavailable during maintenance.','公开基础知识提问可用，不调用 AI 模型，也不会保存问题。维护期间，账户材料、付费任务与保存仍不可用。');
  notice.dataset.askServiceStatus=state;
 };
 render();window.addEventListener('phios:localechange',render);
 fetch('/api/public-service-status',{cache:'no-store',signal:AbortSignal.timeout(5000)}).then(async r=>{if(!r.ok)throw Error();const v=await r.json();if(!v.ok)throw Error();state=v.ask;render();}).catch(()=>{state='unknown';render();});
}
