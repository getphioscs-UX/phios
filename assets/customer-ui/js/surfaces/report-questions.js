import {tr} from './runtime-ui.js';
import {accountRequest} from './secure-drafts.js';
const pending=new Map();
const paragraph=(parent,text)=>{const p=document.createElement('p');p.textContent=text;parent.append(p);return p;};
export function installReportQuestions(host){
 for(const link of host.querySelectorAll('a[href*="/api/account-method-reports?reportId="]')){
  const card=link.closest('article');if(!card||card.querySelector('[data-report-questions]'))continue;
  const reportId=new URL(link.href,location.href).searchParams.get('reportId');if(!reportId)continue;
  const button=document.createElement('button');button.type='button';button.className='cx-button cx-button--secondary';button.dataset.reportQuestions='';button.textContent=tr('Report questions','报告追问');card.append(button);
  const panel=document.createElement('section');panel.className='cx-stack';panel.hidden=true;card.append(panel);
  const status=paragraph(panel,'');status.setAttribute('role','status');
  button.addEventListener('click',async()=>{
   if(!panel.hidden){panel.hidden=true;return;}
   panel.hidden=false;button.disabled=true;status.textContent=tr('Loading your saved questions…','正在读取已保存的追问…');
   try{await load();}catch{status.textContent=tr('Your saved questions are temporarily unavailable. Please try again later.','暂时无法读取已保存的追问，请稍后重试。');}finally{button.disabled=false;}
  });
  async function load(){
   const data=await accountRequest('/api/account-report-questions?reportId='+encodeURIComponent(reportId));
   panel.replaceChildren(status);status.textContent=tr(`${data.includedRemaining} included questions remaining.`,`还可使用 ${data.includedRemaining} 次报告追问。`);
   for(const item of data.items||[]){
    const entry=document.createElement('article');panel.append(entry);paragraph(entry,item.question);
    if(item.answer){paragraph(entry,item.answer.zhHans||item.answer.answer||'');if(item.answer.en)paragraph(entry,item.answer.en);}
    else paragraph(entry,tr('An answer has not been saved for this question.','这条问题尚未保存回答。'));
   }
   if(data.includedRemaining<1&&!data.governance?.membershipActive){paragraph(panel,tr('Your report and saved answers remain available. Membership lets you continue asking about this report.','报告及已保存问答会继续保留。启用会员后可继续针对这份报告提问。'));const membership=document.createElement('a');membership.href='/account/?product=COM-SUBSCRIPTION-MONTHLY';membership.textContent=tr('Continue with membership','启用会员继续');panel.append(membership);}
   if(data.governance?.answerGenerationAdmitted!==true||data.governance?.canAsk===false||(data.includedRemaining<1&&!data.governance?.membershipActive))return;
   const form=document.createElement('form');form.className='cx-stack';panel.append(form);
   const label=document.createElement('label');label.className='cx-field';label.textContent=tr('What would you like to understand about this report?','关于这份报告，你希望进一步了解什么？');form.append(label);
   const input=document.createElement('textarea');input.className='cx-input';input.required=true;input.maxLength=2000;label.append(input);
   const consent=document.createElement('label');const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.required=true;consent.append(checkbox,document.createTextNode(tr('I agree to use this question and my report to generate and save an answer.','我同意使用这条问题及我的报告生成并保存回答。')));form.append(consent);
   const submit=document.createElement('button');submit.type='submit';submit.className='cx-button cx-button--primary';submit.textContent=tr('Ask about this report','提交报告追问');form.append(submit);
   form.addEventListener('submit',async event=>{
    event.preventDefault();const question=input.value.trim();if(!question||!checkbox.checked)return;
    const existing=pending.get(reportId);const request=existing?.question===question?existing:{question,requestId:crypto.randomUUID()};pending.set(reportId,request);
    submit.disabled=true;input.disabled=true;status.textContent=tr('Preparing your answer…','正在准备回答…');
    try{await accountRequest('/api/account-report-questions',{reportId,...request,consentVersion:'REPORT_FOLLOWUP_CONSENT_V1'});pending.delete(reportId);await load();}
    catch{status.textContent=tr('The answer could not be confirmed. Your question is kept here; no automatic retry will be made.','暂时无法确认回答是否完成。问题已保留在这里，系统不会自动重试。');submit.disabled=false;input.disabled=false;}
   });
  }
 }
}
