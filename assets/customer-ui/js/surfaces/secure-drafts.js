import {esc,tr} from './runtime-ui.js';
export const draftUrl=d=>`/professional/financial/?draft=${encodeURIComponent(d.draftId)}&kind=${d.draftType}&lang=${document.documentElement.lang==='zh-Hans'?'zh-Hans':'en'}${d.draftType==='WILL'?'#estate-planning':''}`;
export async function accountRequest(path,body){
 const r=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{Accept:'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const p=await r.json().catch(()=>({}));if(!r.ok||p.ok===false)throw Object.assign(new Error(p.code||'REQUEST_FAILED'),{code:p.code,status:r.status});return p;
}
export function draftError(error){
 if(error.status===401)return tr('Sign in again to access your saved drafts.','请重新登录以访问已保存草稿。');
 if(error.code==='DRAFT_VERSION_CONFLICT')return tr('A newer version exists. Restore the latest saved version before saving again. Your current edits have not been overwritten.','已有较新版本。请先恢复最新已保存版本再保存；当前编辑内容尚未被覆盖。');
 if(error.code==='DRAFT_RIGHTS_REVIEW_REQUIRED')return tr('This draft is under a retention hold. Changes and deletion require review.','此草稿处于保留审核状态，修改和删除须先经审核。');
 if(error.status===404)return tr('This draft has expired, was deleted, or is not available to this account.','此草稿已过期、已删除或不属于当前账户。');
 return tr('The request could not be completed. Your entries were not saved. Try again later.','目前无法完成请求，输入内容未保存。请稍后重试。');
}
export function draftState(d){return tr('Saved','保存于')+` ${new Date(d.createdAt).toLocaleString()} · `+tr('Expires','到期')+` ${new Date(d.expiresAt).toLocaleString()} · `+tr('Version','版本')+` ${d.version}`;}
export function installSecureDrafts({host,kind,capture,restore}){
 const panel=document.createElement('section');panel.className='cx-card cx-stack';panel.dataset.secureDraft=kind;host.append(panel);
 let saved=null,signed=false,busy=false,message='',confirmation=null,consent=false,retention=false,days='30',drafts=[];
 const selected=()=>{const q=new URLSearchParams(location.search);return q.get('kind')===kind?q.get('draft'):null;};
 function render(){
  panel.innerHTML=`<h2>${esc(kind==='WILL'?tr('Will draft','遗嘱草稿'):tr('Financial draft','财务草稿'))}</h2><p>${esc(tr('Save only when you choose. Saved drafts are encrypted and accessible from your account.','仅在你选择时保存。已保存草稿会加密，并可从你的账户继续。'))}</p>${signed?`
  ${saved?`<p data-draft-state>${esc(draftState(saved))}</p>`:`<label><input type="checkbox" data-save-consent ${consent?'checked':''}> ${esc(tr('I agree to save this draft securely in my account.','我同意在账户中安全保存此草稿。'))}</label><label>${esc(tr('Keep for','保留期限'))} <select data-retention-days>${['7','30','90','365'].map(n=>`<option value="${n}" ${days===n?'selected':''}>${n} ${esc(tr('days','天'))}</option>`).join('')}</select></label><label><input type="checkbox" data-retention-consent ${retention?'checked':''}> ${esc(tr('I agree to retain it until the selected expiry.','我同意保留至所选期限。'))}</label>`}
  <div class="cx-cluster"><button type="button" class="cx-button" data-save-secure ${busy?'disabled':''}>${esc(tr('Save securely','安全保存'))}</button>${saved?`<button type="button" class="cx-button cx-button--secondary" data-restore-current>${esc(tr('Restore saved version','恢复已保存版本'))}</button><button type="button" class="cx-button cx-button--secondary" data-right="delete">${esc(tr('Delete','删除'))}</button><button type="button" class="cx-button cx-button--secondary" data-right="withdraw">${esc(tr('Withdraw consent','撤回同意'))}</button>`:''}</div>
  ${confirmation?`<div data-draft-confirm><p>${esc(confirmation==='restore'?tr('Replace the current entries with the saved version? Unsaved edits will be lost.','用已保存版本替换当前输入？未保存的编辑将丢失。'):tr('Remove all saved versions of this draft? This cannot be undone.','删除此草稿的全部已保存版本？此操作无法撤销。'))}</p><button type="button" class="cx-button" data-confirm>${esc(tr('Confirm','确认'))}</button> <button type="button" class="cx-button cx-button--secondary" data-cancel>${esc(tr('Cancel','取消'))}</button></div>`:''}
  ${!saved&&drafts.length?`<ul>${drafts.map(d=>`<li><a href="${esc(draftUrl(d))}">${esc(tr('Continue saved draft','继续已保存草稿'))} · ${esc(draftState(d))}</a></li>`).join('')}</ul>`:''}`:`<a class="cx-button" href="/account/">${esc(tr('Sign in to save or continue','登录以保存或继续'))}</a>`}<p role="status" aria-live="polite" data-draft-message>${esc(message)}</p>`;
  panel.querySelector('[data-save-consent]')?.addEventListener('change',e=>consent=e.target.checked);panel.querySelector('[data-retention-consent]')?.addEventListener('change',e=>retention=e.target.checked);panel.querySelector('[data-retention-days]')?.addEventListener('change',e=>days=e.target.value);
  panel.querySelector('[data-save-secure]')?.addEventListener('click',save);
  panel.querySelector('[data-restore-current]')?.addEventListener('click',()=>{confirmation='restore';render();});
  panel.querySelectorAll('[data-right]').forEach(b=>b.addEventListener('click',()=>{confirmation=b.dataset.right;render();}));
  panel.querySelector('[data-cancel]')?.addEventListener('click',()=>{confirmation=null;render();});
  panel.querySelector('[data-confirm]')?.addEventListener('click',async()=>{const action=confirmation;confirmation=null;busy=true;render();try{if(action==='restore')await load(saved.draftId);else{await accountRequest('/api/account-financial-will-drafts',{action,draftId:saved.draftId,confirmed:true});saved=null;consent=false;retention=false;const u=new URL(location.href);u.searchParams.delete('draft');u.searchParams.delete('kind');history.replaceState(null,'',u);message=tr('All saved versions removed. Current entries remain unsaved.','全部已保存版本已删除。当前输入保持未保存。');}}catch(e){message=draftError(e);}finally{busy=false;render();}});
 }
 async function load(id){const data=await accountRequest('/api/account-financial-will-drafts?id='+encodeURIComponent(id));if(data.draftType!==kind)throw new Error('DRAFT_TYPE_MISMATCH');restore(data.payload);saved=data;message=tr('Restored from your secure account.','已从安全账户恢复。');}
 async function save(){if(busy)return;if(!saved&&(!consent||!retention)){message=tr('Choose both save and retention consent before saving.','保存前请分别确认保存同意和保留同意。');render();return;}busy=true;render();try{const data=await accountRequest('/api/account-financial-will-drafts',{action:'save',draftType:kind,payload:capture(),purpose:kind==='WILL'?'WILL_ASSEMBLY':'FINANCIAL_PLANNING',saveConsent:true,retentionConsent:true,expiresAt:saved?.expiresAt||new Date(Date.now()+Number(days)*86400000).toISOString(),draftId:saved?.draftId,expectedVersion:saved?.version||0});saved={...data,createdAt:data.createdAt||new Date().toISOString()};const u=new URL(location.href);u.searchParams.set('draft',saved.draftId);u.searchParams.set('kind',kind);history.replaceState(null,'',u);message=tr('Saved securely.','已安全保存。');}catch(e){message=draftError(e);}finally{busy=false;render();}}
 async function refresh(){try{const p=await accountRequest('/api/account-financial-will-drafts?type='+kind);signed=true;drafts=p.drafts;const id=selected()||saved?.draftId;if(id)await load(id);}catch(e){if(e.status===401||e.status===404){if(e.status===401)signed=false;if(saved)restore({});saved=null;}message=draftError(e);}render();}
 render();refresh();window.addEventListener('pageshow',e=>{if(e.persisted)refresh();});window.addEventListener('phios:localechange',render);
 // Do not leave restored private inputs visible in a back/forward-cache snapshot.
 window.addEventListener('pagehide',()=>{if(saved)restore({});});
}
