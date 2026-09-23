const host=document.createElement('section');
host.className='cx-card cx-stack';host.setAttribute('aria-live','polite');
document.querySelector('#main .cx-container')?.prepend(host);
let session=null;
const zh=()=>document.documentElement.lang==='zh-Hans';
function render(){
  const z=zh(),login=`/api/auth/login?locale=${z?'zh-Hans':'en'}`;
  if(!session){host.textContent=z?'暂时无法读取登录状态，请稍后重试。':'Sign-in status is temporarily unavailable. Please try again.';return;}
  const state=session.authenticated?'AUTHENTICATED':'GUEST';
  document.body.dataset.cxAccountState=state;
  for(const badge of document.querySelectorAll('.cx-account-state')){
    badge.dataset.cxAccountState=state;
    badge.dataset.cxEn=session.authenticated?'Authenticated':'Guest';
    badge.dataset.cxZh=session.authenticated?'已登录':'访客';
    badge.textContent=z?badge.dataset.cxZh:badge.dataset.cxEn;
  }
  host.innerHTML=session.authenticated?`<h2 class="cx-heading-2">${z?'已登录并验证':'Signed in and verified'}</h2><form action="/api/auth/logout" method="post"><button class="cx-button" type="submit">${z?'退出登录':'Sign out'}</button></form>`:session.providerConfigured?`<h2 class="cx-heading-2">${z?'登录你的账户':'Sign in to your account'}</h2><div class="cx-cluster"><a class="cx-button" href="${login}">${z?'登录':'Sign in'}</a><a class="cx-button" href="${login}&mode=signup">${z?'注册':'Create account'}</a></div><p>${z?'请在登录页面使用密码找回功能；邮箱验证后方可使用账户功能。':'Use account recovery on the sign-in page. Verify your email before using account features.'}</p>`:`<p>${z?'账户登录暂未可用。你仍可使用访客功能。':'Account sign-in is not available yet. Guest features remain available.'}</p>`;
}
host.addEventListener('submit',async event=>{
 const form=event.target;if(!(form instanceof HTMLFormElement)||form.getAttribute('action')!=='/api/auth/logout')return;
 event.preventDefault();const button=form.querySelector('button');button.disabled=true;
 try{
  const r=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
  const data=await r.json();if(!r.ok||data.ok!==true||new URL(data.logoutUrl).protocol!=='https:')throw new Error('LOGOUT_FAILED');
  session={authenticated:false,providerConfigured:true};render();location.assign(data.logoutUrl);
 }catch{
  button.disabled=false;let status=form.querySelector('[role="status"]');if(!status){status=document.createElement('p');status.setAttribute('role','status');form.append(status);}
  status.textContent=zh()?'暂时无法完成退出，请重试。':'Sign-out could not finish. Please try again.';
 }
});
fetch('/api/auth/session',{cache:'no-store',credentials:'same-origin'}).then(async r=>{session=r.ok?await r.json():null;render();}).catch(()=>render());
window.addEventListener('phios:localechange',render);
