import {accountRequest,getSecureDraft,draftError} from './secure-drafts.js';
import {esc,tr,locale} from './runtime-ui.js';
export function installFinanceReportCoverage(){
 const card=document.querySelector('[aria-labelledby="finance-report-preview-title"] .cx-card');if(!card)return;
 const host=document.createElement('div');card.append(host);
 const text=(en,zh)=>`<span data-cx-en="${esc(en)}" data-cx-zh="${esc(zh)}">${esc(tr(en,zh))}</span>`;
 host.innerHTML=`<p>${text('RM69 includes both languages and four follow-up questions. Reopen and download the same report without regenerating it. Updated information requires a new report purchase.','RM69 包含双语及后续四个问题。同一报告可持续重开与下载；更新资料后重新生成须另购报告。')}</p><label><input type="checkbox" data-coverage-consent> ${text('Use my exact saved version to check chapter coverage.','使用我的精确保存版本检查章节覆盖情况。')}</label><p><button type="button" class="cx-button cx-button--secondary" data-coverage-check>${text('See what my saved information can show','查看当前资料能完成哪些章节')}</button></p><div data-coverage-result role="status"></div>`;
 host.querySelector('[data-coverage-check]').addEventListener('click',async event=>{
  const button=event.currentTarget,result=host.querySelector('[data-coverage-result]'),draft=getSecureDraft('FINANCIAL');
  if(!draft?.savedRef||draft.dirty){result.textContent=tr('Save and reopen the version you want to review first.','请先保存并重开要检查的资料版本。');return;}
  if(!host.querySelector('[data-coverage-consent]').checked){result.textContent=tr('Confirm use of the saved version first.','请先确认使用保存版本。');return;}
  button.disabled=true;
  try{const language=locale()==='en'?'en':'zh-Hans',savedDraftRef=draft.savedRef;
   const {grant}=await accountRequest('/api/account-financial-consent',{confirmed:true,savedDraftRef,purpose:'REPORT',language,scopes:['people','incomeStreams','expenses','assets','liabilities','guarantees','policies','goals','assumptions'],expiresAt:new Date(Date.now()+86400000).toISOString()});
   const p=await accountRequest('/api/account-financial-report',{action:'preview',savedDraftRef,grantId:grant.grantId,language});
   result.innerHTML=`<p>${esc(tr('Saved version','保存版本'))} ${esc(p.savedDraftRef.version)} · RM69 · ${esc(tr('Chinese and English; four follow-up questions','中英文；后续四个问题'))}</p><ol>${p.chapters.map(c=>`<li><strong>${esc(c.title)}</strong> · ${esc(c.status==='COMMON_CONTENT'?tr('Reading guide','阅读说明'):c.status==='SAVED_FACTS_AVAILABLE'?tr('Saved facts available','已有保存资料'):tr('Details needed','需要补充明细'))}${c.missingMetrics.length?`<p>${esc(tr('Missing: ','待补：'))}${esc(c.missingMetrics.join('、'))}</p>`:''}</li>`).join('')}</ol>`;
  }catch(error){result.textContent=draftError(error);}finally{button.disabled=false;}
 });
 const clear=()=>{host.querySelector('[data-coverage-result]').replaceChildren();host.querySelector('[data-coverage-consent]').checked=false;};window.addEventListener('phios:account-logout',clear);window.addEventListener('pagehide',clear);
}
