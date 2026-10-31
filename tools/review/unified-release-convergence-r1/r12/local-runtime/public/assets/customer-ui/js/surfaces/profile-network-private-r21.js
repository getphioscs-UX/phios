export function privateNetworkController(root,{t,onNetwork,onClear}){
 let panel,selected,grantId,epoch=0,active=false;
 const api=async body=>{const r=await fetch('/api/profile-context-network',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(8000)});const j=await r.json();if(!r.ok)throw Object.assign(Error(j.code),{code:j.code});return j;};
 const msg=e=>e.code==='ACCOUNT_REQUIRED'?t('Sign in to choose private sources.','请登录后选择私人来源。'):e.code==='DOSSIER_MEMBERSHIP_OR_LEGACY_ACCESS_REQUIRED'?t('An active membership or existing Profile entitlement is required.','需要有效会员或既有Profile权益。'):e.code==='CONSENT_REQUIRED'?t('Private display is not enabled here.','此处尚未开放私人展示。'):t('Private sources could not be read. Retry, or return to the example.','私人来源读取失败。请重试或返回示例。');
 const line=text=>{const p=document.createElement('p');p.textContent=text;panel.append(p);return p;};
 const button=(label,run)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{b.disabled=true;try{await run();}catch(e){onClear();line(msg(e));}finally{b.disabled=false;}};panel.append(b);return b;};
 const clear=()=>{epoch++;onClear();};
 function restore(){if(!grantId||!active)return;root.querySelector('[data-pn-private-panel]')?.remove();panel=document.createElement('section');panel.className='pn-private-controls';panel.dataset.pnPrivatePanel='';root.querySelector('.pn-network').append(panel);button(t('Refresh private view','刷新私人视图'),read);button(t('Revoke and hide','撤销并隐藏'),async()=>{clear();await api({action:'revoke',grantId,confirmed:true});grantId=null;panel.replaceChildren();line(t('Permission revoked. Private connections are hidden.','授权已撤销，私人关联已隐藏。'));});}
 async function read(){const n=++epoch;onClear();const j=await api({action:'read',...selected,grantId});if(n===epoch)onNetwork(j.network);}
 async function open(){
  active=true;
  root.querySelector('[data-pn-private-panel]')?.remove();panel=document.createElement('section');panel.className='pn-private-controls';panel.dataset.pnPrivatePanel='';root.querySelector('.pn-network').append(panel);
  line(t('Choose private connections','选择私人关联'));line(t('Only selected roles will appear. Names, amounts and draft text are not copied. Relationship records are not connected yet.','只展示所选角色，不复制姓名、金额或草稿正文。私人关系记录尚未接通。'));
  try{const permissions=await api({action:'permissions'});for(const g of permissions.grants||[]){button(t('Revoke saved display permission','撤销已保存的展示授权')+' · '+g.expiresAt.slice(0,10),async()=>{clear();await api({action:'revoke',grantId:g.grantId,confirmed:true});if(grantId===g.grantId)grantId=null;await open();});}const j=await api({action:'sources'});if(!j.sources.length)line(t('No available saved sources. Unknown connections are not created.','暂无可用的已保存来源，不自动创建未知关联。'));
   for(const s of j.sources){button((s.domain==='ESTATE'?t('Estate draft','遗产草稿'):t('Financial draft','财务草稿'))+' · v'+s.savedDraftRef.version+' · '+s.savedDraftRef.savedAt.slice(0,10),async()=>{
    clear();selected=s;grantId=null;panel.replaceChildren();line(t('Explicitly preview minimal role choices from this saved source?','是否明确允许预览这份已保存来源中的最小角色选项？'));
    button(t('Preview role choices','预览角色选项'),async()=>{const p=await api({action:'preview',...selected,confirmed:true});panel.replaceChildren();line(t('Select each connection you want to display. Nothing is preselected.','逐项选择希望显示的关联，默认全部不选。'));
     for(const choice of p.choices){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=choice.edgeId;const lang=document.documentElement.lang==='zh-Hans'?'zh-Hans':'en';label.append(input,document.createTextNode((choice.from?.[lang]||'')+' → '+(choice.to?.[lang]||'')+' · '+choice.label[lang]));panel.append(label);}
     if(!p.choices.length)line(t('No explicit roles are established by this source.','此来源尚未记录明确角色。'));
     button(t('Allow selected connections for 24 hours','允许所选关联展示24小时'),async()=>{const edgeIds=[...panel.querySelectorAll('input:checked')].map(i=>i.value);if(!edgeIds.length){line(t('Select at least one connection.','请至少选择一项关联。'));return;}const g=await api({action:'grant',...selected,confirmed:true,edgeIds,expiresAt:new Date(Date.now()+86400000).toISOString()});grantId=g.grant.grantId;await read();panel.replaceChildren();line(t('Only these selected connections are shown. Sources are checked again on refresh.','仅展示本次所选关联，刷新时重新核对来源与授权。'));button(t('Refresh private view','刷新私人视图'),read);button(t('Revoke and hide','撤销并隐藏'),async()=>{clear();await api({action:'revoke',grantId,confirmed:true});grantId=null;panel.replaceChildren();line(t('Permission revoked. Private connections are hidden.','授权已撤销，私人关联已隐藏。'));});});
    });
   });}
  }catch(e){line(msg(e));}
 }
 // Never retain an unchecked private view after resuming a background tab.
 document.addEventListener('visibilitychange',()=>{if(grantId&&active){clear();if(!document.hidden)read().catch(e=>line(msg(e)));}});
 return {open,hide:()=>{active=false;clear();},restore};
}
