/** Read-only Account -> Profile evidence summary; uses existing account authority. */
const host=document.querySelector('[data-account-profile-hub]');
if(host){
  const button=host.querySelector('[data-account-profile-refresh]');
  const status=host.querySelector('[data-account-profile-summary]');
  const list=host.querySelector('[data-account-profile-items]');
  const zh=()=>String(document.documentElement.lang||'').toLowerCase().startsWith('zh');
  const t=(en,cn)=>zh()?cn:en;
  let loading=false;
  let latest=null;
  const labels={
    QUICK_PROFILE:['Quick self-report','快速自陈'],
    FULL_SELF_ASSESSMENT:['Full self-assessment','完整自陈'],
    BIG_FIVE:['Big Five assessment','大五人格测评'],
    FINANCIAL_CAPABILITY:['Financial capability','财务能力'],
    REASONING_TASKS:['Reasoning tasks','推理任务'],
    CAREER_INTERESTS:['Career interests','职业兴趣'],
    IMPORT_EXTERNAL_RESULT:['External assessment','外部测评']
  };
  function render(){
    list.replaceChildren();
    if(!latest){return;}
    if(latest.kind==='GUEST'){
      status.textContent=t('Sign in to view your saved evidence. Guest activity is not automatically retained.','请登录后查看已保存的证据。访客活动不会自动保留。');
      return;
    }
    if(latest.kind==='UNAVAILABLE'){
      status.textContent=t('Saved Profile evidence is unavailable. No changes were made.','已存 Profile 证据目前无法读取；没有修改任何记录。');
      return;
    }
    const items=latest.objects;
    status.textContent=t(`${items.length} saved Profile evidence record(s). Sources remain separate; this does not create a report.`,`已有 ${items.length} 份 Profile 证据。各来源独立保留，不会自动生成报告。`);
    if(!items.length)return;
    const ul=document.createElement('ul');
    ul.className='cx-account-profile-list';
    for(const item of items.slice(0,20)){
      const li=document.createElement('li');
      const type=labels[String(item.mode||'').toUpperCase()];
      const name=type?t(...type):t('Assessment','测评');
      const date=String(item.createdAt||'').slice(0,10);
      const span=document.createElement('span');
      span.textContent=name+(date?' · '+date:'');
      li.append(span);
      ul.append(li);
    }
    list.append(ul);
    if(items.length>20){
      const note=document.createElement('p');
      note.textContent=t('Open Profile to review the remaining records.','请进入 Profile 查看其他记录。');
      list.append(note);
    }
  }
  async function refresh(){
    if(loading)return;
    loading=true;button.disabled=true;
    status.textContent=t('Checking saved evidence…','正在读取已保存的证据……');
    try{
      const r=await fetch('/api/auth/session',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
      if(!r.ok)throw new Error('SESSION_UNAVAILABLE');
      const session=await r.json();
      if(session.authenticated!==true){latest={kind:'GUEST'};render();return;}
      const response=await fetch('/api/account-profile-evidence',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
      if(!response.ok)throw new Error('EVIDENCE_UNAVAILABLE');
      const data=await response.json();
      if(!Array.isArray(data.objects))throw new Error('INVALID_EVIDENCE_RESPONSE');
      latest={kind:'AVAILABLE',objects:data.objects};render();
    }catch{latest={kind:'UNAVAILABLE'};render();}
    finally{loading=false;button.disabled=false;}
  }
  button.addEventListener('click',()=>{void refresh();});
  window.addEventListener('phios:localechange',render);
  window.addEventListener('pageshow',e=>{if(e.persisted){latest=null;list.replaceChildren();status.textContent=t('Check saved evidence when signed in.','登录后可查看已存证据。');}});
  window.addEventListener('phios:account-logout',()=>{latest=null;list.replaceChildren();status.textContent=t('Sign in to view your saved evidence.','请登录后查看已存证据。');});
}
