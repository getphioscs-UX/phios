const form=document.querySelector('[data-appointment-request-form]');
if(form){
  const status=form.querySelector('[role="status"]'),list=document.querySelector('[data-appointment-request-list]');
  const zh=()=>document.documentElement.lang.startsWith('zh');
  const message=(en,cn)=>{status.textContent=zh()?cn:en;};
  const token=crypto.randomUUID(),expiresAt=new Date(Date.now()+30*86400000).toISOString();
  form.elements.timezone.value=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const render=request=>{
    const article=document.createElement('article');article.className='cx-card';
    const title=document.createElement('h3');title.textContent=request.serviceType;
    const detail=document.createElement('p');detail.textContent=`${request.appointmentRequestId} · ${request.status} · ${request.createdAt}`;
    const note=document.createElement('p');note.textContent=request.question;
    const reopen=document.createElement('button');reopen.type='button';reopen.className='cx-button';reopen.textContent=zh()?'重新读取申请':'Reopen request';
    reopen.onclick=async()=>{const response=await fetch('/api/account-appointment-requests?id='+encodeURIComponent(request.appointmentRequestId));const body=await response.json();if(response.ok){note.textContent=body.request.question;message('Request retrieved from your account; a time has not been confirmed.','已从账户重新读取申请；时段尚未确认。');}else message(body.code,body.code);};
    article.append(title,detail,note,reopen);list.append(article);
  };
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const button=form.querySelector('[type="submit"]');button.disabled=true;
    try{
      const response=await fetch('/api/account-appointment-requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serviceType:form.elements.serviceType.value,question:form.elements.question.value,timezone:form.elements.timezone.value,preferences:form.elements.preferences.value,modality:form.elements.modality.value,consent:form.elements.consent.checked,retentionConsent:form.elements.retentionConsent.checked,requestToken:token,expiresAt})});
      const body=await response.json();if(!response.ok){message(response.status===401?'Sign in to save a request.':response.status===503?'Account request storage is not enabled in this environment.':body.code,response.status===401?'请登录后保存申请。':response.status===503?'本环境尚未启用账户申请存储。':body.code);return;}
      list.replaceChildren();render(body.request);message('Request saved. Availability and confirmation require review.','申请已保存。可预约时间与确认仍需审核。');
    }catch{message('Could not confirm saving. Reopen your account requests before retrying.','无法确认保存结果。重试前请先重新读取账户申请。');}finally{button.disabled=false;}
  });
  document.querySelector('[data-appointment-load]').addEventListener('click',async()=>{try{const response=await fetch('/api/account-appointment-requests');const body=await response.json();if(!response.ok){message(body.code,body.code);return;}list.replaceChildren();body.requests.forEach(render);message('Saved account requests loaded.','已读取账户申请。');}catch{message('Could not load account requests.','暂时无法读取账户申请。');}});
}
