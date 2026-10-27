/** Profile / Account connection: informational only; never writes or copies private records. */
const root=document.querySelector('[data-prf-auth-status]');
const login=document.querySelector('[data-prf-signin-link]');
const save=document.querySelector('[data-prf-account-save]');
const isZh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
let state='UNKNOWN';
let configured=false;
function present(){
  if(!root)return;
  root.textContent=state==='ACCOUNT'
    ?(isZh()?'已登录。只有你主动勾选保存、同意保留期限后，才会尝试保存至本人的账户。':'Signed in. Profile evidence is saved to your account only after you explicitly opt in and accept the retention terms.')
    :state==='GUEST'
      ?(isZh()?'访客可以浏览示例与填写测评；保存到个人账户需要先登录，且不得自动保存。':'Guests can explore the example and assessments. Saving evidence requires sign-in and is never automatic.')
      :(isZh()?'暂时无法确认登录状态；请到账户页面检查。':'Sign-in status could not be confirmed. Check your Account page.');
  if(login){
    login.hidden=!(state==='GUEST'&&configured);
    login.href='/api/auth/login?locale='+(isZh()?'zh-Hans':'en');
  }
  if(save){
    if(state==='GUEST'){save.checked=false;save.disabled=true;save.title=isZh()?'请先登录以保存':'Sign in to save';}
    else{save.disabled=false;save.title='';}
  }
}
async function check(){
  try{
    const res=await fetch('/api/auth/session',{cache:'no-store',credentials:'same-origin',headers:{accept:'application/json'}});
    const session=res.ok?await res.json():null;
    configured=session?.providerConfigured===true;
    state=session?.authenticated===true?'ACCOUNT':session?.authenticated===false?'GUEST':'UNKNOWN';
  }catch{state='UNKNOWN';configured=false;}
  present();
}
if(root){
  present();
  void check();
  window.addEventListener('phios:localechange',present);
  window.addEventListener('pageshow',event=>{if(event.persisted)void check();});
}
