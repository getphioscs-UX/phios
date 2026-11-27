import {esc,tr} from './runtime-ui.js';
const countries=[['UNKNOWN','Other / unsure','其他／不确定'],['MY','Malaysia','马来西亚'],['SG','Singapore','新加坡'],['US','United States','美国'],['GB','United Kingdom','英国'],['AU','Australia','澳大利亚']];
const exposures=[['PAID_OR_LOST','Paid / money lost','已付款／资金损失'],['CREDENTIALS_SHARED','Shared password or code','已提供密码或验证码'],['APP_INSTALLED','Installed a suspicious app','已安装可疑应用'],['SCREEN_SHARED','Shared screen / remote access','已共享屏幕／远程访问'],['IDENTITY_SHARED','Sent identity documents','已提供身份证件']];
const option=(value,en,zh)=>`<option value="${value}">${esc(tr(en,zh))}</option>`;
export function installScamAskControls(form){
 const optionNode=document.createElement('option');optionNode.value='SCAM_CHECK';optionNode.dataset.cxEn='Check something suspicious';optionNode.dataset.cxZh='核对可疑信息';optionNode.textContent=tr('Check something suspicious','核对可疑信息');form.elements.askTask.append(optionNode);
 const panel=document.createElement('section');panel.dataset.scamAskControls='';panel.className='cx-stack';
 const state={};
 function render(){
  for(const name of ['jurisdiction','bankJurisdiction','eventJurisdiction'])state[name]=panel.querySelector(`[name="${name}"]`)?.value||state[name]||'UNKNOWN';
  const checked=panel.querySelectorAll('[name="scamExposure"]');if(checked.length)state.exposure=[...checked].filter(x=>x.checked).map(x=>x.value);
  panel.innerHTML=`<h2>${esc(tr('Check before you act','行动前，先核对'))}</h2><p class="cx-meta">${esc(tr('Describe the message and requested action in the question above. Do not paste passwords, codes, full card numbers or identity documents. Text review only; nothing is saved or reported automatically.','在上方问题栏描述消息与对方要求。请勿粘贴密码、验证码、完整卡号或证件资料。这里只核对文本，不会自动保存或报案。'))}</p>${[['jurisdiction','Your country or region','你所在的国家或地区'],['bankJurisdiction','Payment account country (optional)','付款账户所在国家（可选）'],['eventJurisdiction','Other event country (optional)','事件涉及的其他国家（可选）']].map(([name,en,zh])=>`<label class="cx-p1-field"><span>${esc(tr(en,zh))}</span><select name="${name}">${countries.map(c=>option(...c)).join('')}</select></label>`).join('')}<fieldset><legend>${esc(tr('What has already happened? Select all that apply.','已经发生什么？可多选。'))}</legend>${exposures.map(([code,en,zh])=>`<label class="cx-context-choice"><input type="checkbox" name="scamExposure" value="${code}" ${(state.exposure||[]).includes(code)?'checked':''}><span>${esc(tr(en,zh))}</span></label>`).join('')}<p class="cx-meta">${esc(tr('Leave unchecked if no exposure is confirmed. Requests are different from completed actions.','未确认发生时请勿勾选；对方要求不等于你已照做。'))}</p></fieldset>`;
  for(const name of ['jurisdiction','bankJurisdiction','eventJurisdiction'])panel.querySelector(`[name="${name}"]`).value=state[name];
  sync();
 }
 function sync(){const active=form.elements.askTask.value==='SCAM_CHECK';panel.hidden=!active;form.elements.question.maxLength=active?2000:500;form.querySelector('[name="guidedRoutingMode"]')?.closest('label')?.toggleAttribute('hidden',active);}
 form.querySelector('[name="question"]').closest('label').after(panel);
 form.elements.askTask.addEventListener('change',sync);window.addEventListener('phios:localechange',render);render();
 return {sync,request:()=>form.elements.askTask.value==='SCAM_CHECK'?{task:'SCAM_CHECK',jurisdiction:panel.querySelector('[name="jurisdiction"]').value,bankJurisdiction:panel.querySelector('[name="bankJurisdiction"]').value,eventJurisdiction:panel.querySelector('[name="eventJurisdiction"]').value,exposure:[...panel.querySelectorAll('[name="scamExposure"]:checked')].map(x=>x.value),contexts:[],questionOnly:true,guidedContext:{},contextConsent:{},guidedRouting:false,methodGuidanceRequested:false,followUpContext:null}:null};
}
export function renderScamAskReview(node,result){
 node.replaceChildren();if(!result)return;
 const heading=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;node.append(el);return el;};
 heading('h3',tr('Your priority actions','优先行动'));const list=document.createElement('ol');
 for(const action of result.actions){const item=document.createElement('li');item.textContent=action.text;list.append(item);}node.append(list);
 heading('p',tr('Only text rules and URL structure were reviewed. Live website, phone and company checks are unavailable.','仅核对文本规则与网址结构，未接通实时网站、电话或公司查询。'));
 if(result.indicators.urls.length){heading('h3',tr('Links mentioned — not opened','提及的网址 · 未打开'));for(const url of result.indicators.urls)heading('p',(url.value||tr('Rejected URL','已拒绝的网址'))+' · '+tr('Reputation not checked','未查询信誉'));}
 const button=heading('button',tr('Download this review summary','下载本次核对摘要'));button.type='button';button.className='cx-button';
 button.onclick=()=>{
  const text=[tr('PHI OS · Unverified incident review','PHI OS · 未核实事件复核'),result.assessment,...result.actions.map((a,i)=>`${i+1}. ${a.text}`),...result.unknowns,...result.limitations,...result.sourceReferences.map(s=>`${s.publisher} (${s.scope}; ${s.verifiedAt}): ${s.url}`),tr('No report filed, payment blocked or recovery guaranteed. Privately add your timeline and transaction references before contacting your bank or police.','未代为报案或拦截交易，不保证追回。联系银行或警方前，可私下补充时间线与交易编号。')].join('\n\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='PHIOS-suspicious-request-review.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
}
