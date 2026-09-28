const status=document.querySelector('#status'),result=document.querySelector('#result'),buttons=[...document.querySelectorAll('[data-locale]')];
function element(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
document.querySelector('#provider-status').addEventListener('click',async()=>{
 if(location.origin!=='https://qa.phios-github.pages.dev'){status.textContent='请在 QA 站点打开此页。';return;}
 status.textContent='正在检查模型访问…';
 try{const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rnt2-s04-provider-status'}),cache:'no-store'});const payload=await response.json();status.textContent=payload.ok?'模型访问检查完成（未生成正文）':`检查未完成：${payload.code||response.status}`;result.replaceChildren(element('pre',JSON.stringify(payload,null,2)));}catch{status.textContent='模型访问检查未完成。';}
});
for(const button of buttons)button.addEventListener('click',async()=>{
 if(location.origin!=='https://qa.phios-github.pages.dev'){status.textContent='请在 QA 站点打开此页。';return;}
 buttons.forEach(b=>b.disabled=true);status.textContent='正在读取或生成，请保持页面打开…';result.replaceChildren();
 try{
  const response=await fetch('/api/qa-bazi-t3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'rnt2-s04',sectionKey:'S04_CAREER',locale:button.dataset.locale}),cache:'no-store'});
  const payload=await response.json();
  if(!response.ok||!payload.ok){status.textContent=response.status===401?'请先登录上方审核账户，再返回此页。':`暂未完成：${payload.code||response.status}`;return;}
  const snapshot=payload.result,r=snapshot.result;
  status.textContent=`${payload.cacheHit?'已读取保存结果':'结果已保存'} · ${r.status} · 人工验收：待审核`;
  for(const block of r.candidate?.blocks||[]){const article=element('article','');article.append(element('p',block.text));result.append(article);}
  if(!r.candidate?.blocks?.length)result.append(element('p','尚无可审核正文；请查看验证信息。'));
  const details=element('details','');details.append(element('summary','验证信息 / Verification'),element('pre',JSON.stringify({artifactDigest:snapshot.artifactDigest,identity:snapshot.identity,verification:r.verification,quality:r.quality,internalOnly:r.internalOnly,usageRecord:r.usageRecord,verificationUsageRecords:r.verificationUsageRecords,ownerAcceptance:snapshot.ownerAcceptance,productionActivated:snapshot.productionActivated},null,2)));result.append(details);
 }catch{status.textContent='请求未完成。可以再次打开；服务端不会自动重复扣费生成。';}
 finally{buttons.forEach(b=>b.disabled=false);}
});
