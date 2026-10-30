// Test controls are injected only by the isolated server, never production HTML.
const zh=()=>document.documentElement.lang.startsWith('zh');
const toolbar=document.createElement('aside');toolbar.style.cssText='padding:12px;display:flex;gap:10px;flex-wrap:wrap;background:#15334b;color:white';toolbar.dataset.r2Toolbar='true';
for(const account of ['A','B']){const b=document.createElement('button');b.textContent='QA '+account;b.onclick=async()=>{const r=await fetch('/__qa/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account})});if(r.ok)location.reload();};toolbar.append(b);}
const logout=document.createElement('button');logout.textContent=zh()?'退出本地会话':'End local session';logout.dataset.r2Logout='true';logout.onclick=async()=>{const r=await fetch('/__qa/logout',{method:'POST'});if(r.ok){window.dispatchEvent(new Event('phios:account-logout'));document.querySelector('[data-r2-state]')?.remove();}};toolbar.append(logout);
const scope=document.createElement('p');scope.textContent=zh()?'R2 本地 Owner 适配；合成账户。不是生产验收。':'R2 local Owner adapters; synthetic accounts. Not production acceptance.';toolbar.append(scope);document.body.prepend(toolbar);
const worldChoice=document.createElement('select');worldChoice.setAttribute('aria-label',zh()?'自选公共国家背景':'Optional public country context');worldChoice.innerHTML='<option value="">—</option>';toolbar.append(worldChoice);
fetch('/api/customer-subject-workspace').then(r=>r.json()).then(data=>{for(const item of data.items.filter(x=>x.subjectType==='COUNTRY')){const o=document.createElement('option');o.value=item.subjectId;o.textContent=item.displayName;worldChoice.append(o);}worldChoice.value=new URL(location.href).searchParams.get('worldSubjectId')||'';});
worldChoice.onchange=()=>{const u=new URL(location.href);if(worldChoice.value)u.searchParams.set('worldSubjectId',worldChoice.value);else u.searchParams.delete('worldSubjectId');location.href=u.href;};
document.addEventListener('phios:subject-view-ready',async e=>{
 const id=e.detail.subjectId,worldId=new URL(location.href).searchParams.get('worldSubjectId')||'',r=await fetch('/api/customer-subject-workspace?subjectId='+encodeURIComponent(id)+'&locale='+(zh()?'zh-Hans':'en')+'&worldSubjectId='+encodeURIComponent(worldId),{cache:'no-store'}),data=await r.json();
 if(document.querySelector('#subject-profile-select')?.value!==id||!r.ok)return;
 document.querySelector('[data-r2-state]')?.remove();const box=document.createElement('section');box.dataset.r2State='true';
 const title=document.createElement('h3');title.textContent=zh()?'R2 正式接线状态':'R2 formal integration status';box.append(title);
 const notice=document.createElement('p');notice.textContent=zh()?'财务正式读取、主体 Reading／Navigation 与保存仍受阻断；下方 R1 问题仅供复核，不代表完整 Reading。':'Formal Financial reads, Subject Reading/Navigation and saving remain blocked. R1 review prompts below are not a completed Reading.';box.append(notice);
 for(const key of ['financial','reading','navigation','continuity']){const p=document.createElement('p');p.textContent=key+': '+data.integration[key].status+' — '+data.integration[key].code;box.append(p);}
 if(data.integration.world.status==='PASS'){const p=document.createElement('p');p.dataset.r2World='true';p.textContent=(zh()?'有来源的历史公共观察：':'Dated public source observations: ')+data.integration.world.evidence.length;box.append(p);for(const e of data.integration.world.evidence.slice(0,2)){const a=document.createElement('a');a.textContent=e.publisher+' · '+e.period+' · '+e.unit+' · '+e.revision;a.href=e.sourceUrl;a.rel='noopener noreferrer';a.target='_blank';box.append(a,document.createElement('br'));}}
 const save=document.createElement('button');save.textContent=zh()?'保存尚未获准':'Saving not admitted';save.disabled=true;box.append(save);
 document.querySelector('[data-subject-reading]')?.prepend(box);
});
