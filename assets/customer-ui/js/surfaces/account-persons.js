import {installReportQuestions} from './report-questions.js';
import {installReportModeChoice,prepareReportContext,reportContextErrorLabel} from '../report-context-ui.js';
import {esc,tr} from './runtime-ui.js';
import {accountRequest} from './secure-drafts.js';
const host=document.createElement('section');host.className='cx-card cx-stack cx-person-hub';host.id='account-persons';
document.querySelector('#main .cx-container')?.append(host);
let reportsState='loading',reportsError=null;
let persons=[],reports=[],editing=null,message='',available=false,locationCandidates=[],selectedLocation=null,locationBusy=false,searchTimer=null;
const field=(name,en,zh,type='text',value='',extra='')=>`<label class="cx-field"><span>${esc(tr(en,zh))}</span><input class="cx-input" name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const locale=()=>document.documentElement.lang==='zh-Hans'?'zh-Hans':'en';
const oneYearFromNow=()=>{const d=new Date();d.setUTCDate(d.getUTCDate()+365);return d.toISOString().slice(0,10)};
function placeResults(){
 if(locationBusy)return `<p class="cx-field-helper">${esc(tr('Finding places…','正在查找地点…'))}</p>`;
 if(!locationCandidates.length)return '';
 return `<div class="cx-place-results" role="listbox">${locationCandidates.map(c=>`<button type="button" class="cx-place-option" data-place-ref="${esc(c.providerRef)}"><strong>${esc(c.primaryLabel||c.label)}</strong>${c.secondaryLabel?`<small>${esc(c.secondaryLabel)}</small>`:''}</button>`).join('')}</div>`;
}
function render(){
 const p=persons.find(p=>p.personId===editing),birth=p?.canonicalBirthInput;
 host.innerHTML=`<div class="cx-person-hub__header"><div><p class="cx-eyebrow">${esc(tr('PERSONAL PROFILE','个人资料'))}</p><h2>${esc(tr('Your birth profile','你的出生资料'))}</h2><p>${esc(tr('Enter the details you know. PHI OS resolves coordinates, country, timezone and the historical UTC offset from the birth place you confirm.','只填写你知道的资料。确认出生地点后，PHI OS 会自动解析坐标、国家、时区及出生当时的 UTC 偏移。'))}</p></div></div>${message?`<p class="cx-person-message" role="status">${esc(message)}</p>`:''}${available?`
 <div class="cx-stack">${persons.map(p=>`<article><h3>${esc(p.name)}</h3><p>${esc(p.consentState==='ACTIVE'?tr('Consent active','同意有效'):tr('Consent withdrawn','已撤回同意'))} · ${esc(tr('Version','版本'))} ${p.version}</p><button class="cx-button" data-edit="${esc(p.personId)}">${esc(tr('Edit','修改'))}</button> <button class="cx-button cx-button--secondary" data-revoke="${esc(p.personId)}">${esc(tr('Withdraw consent','撤回同意'))}</button></article>`).join('')}</div>
 <details class="cx-account-editor"><summary>${esc(p?tr('Edit profile details','编辑出生资料'):tr('Add a birth profile','新增出生资料'))}</summary><form data-person-form class="cx-stack cx-person-form"><h3>${esc(p?tr('Update your profile','更新资料'):tr('Add your profile','新增资料'))}</h3>
 ${field('name','Name on report','报告显示姓名','text',p?.name??'','required maxlength="120"')}
 ${field('birthDate','Birth date','出生日期','date',birth?.birthDate??'','required')}
 ${field('birthTime','Birth time','出生时间','time',birth?.birthTime??'','step="1"')}
 <label class="cx-field">${esc(tr('Time accuracy','时间准确度'))}<select class="cx-select" name="timeAccuracy">${[['EXACT','Exact','准确'],['APPROXIMATE','Approximate','约略'],['UNKNOWN','Unknown','未知']].map(([v,en,zh])=>`<option value="${v}" ${birth?.timeAccuracy===v?'selected':''}>${esc(tr(en,zh))}</option>`).join('')}</select></label>
 <div class="cx-person-place"><label class="cx-field"><span>${esc(tr('Birth place','出生地点'))}</span><input class="cx-input" name="placeSearch" value="${esc(selectedLocation?.primaryLabel||selectedLocation?.label||birth?.birthPlace?.displayName||'')}" autocomplete="off" placeholder="${esc(tr('Start typing a city or town','输入城市或地区，例如 Kajang'))}" required></label><p class="cx-field-helper">${esc(tr('Choose a suggested place. Latitude, longitude, country and timezone are filled automatically.','请选择建议地点；纬度、经度、国家及时区会自动完成。'))}</p><div data-place-results>${placeResults()}</div>${selectedLocation?`<div class="cx-person-location-summary"><span class="cx-status cx-status--available">${esc(tr('Selected','已选择'))}</span><strong>${esc(selectedLocation.primaryLabel||selectedLocation.label)}</strong><small>${esc(selectedLocation.secondaryLabel||'')}</small></div>`:birth?.birthPlace?`<div class="cx-person-location-summary"><span class="cx-status cx-status--available">${esc(tr('Location resolved','地点已确认'))}</span><strong>${esc(birth.birthPlace.displayName)}</strong><small>${esc(birth.timezone?.iana||'')}</small></div>`:''}</div>
 <label class="cx-field">${esc(tr('Sex used for traditional calculation','传统计算采用的性别'))}<select class="cx-select" name="calculationSex"><option value="">${esc(tr('Not supplied','未提供'))}</option><option value="MALE" ${p?.calculationSex==='MALE'?'selected':''}>${esc(tr('Male','男'))}</option><option value="FEMALE" ${p?.calculationSex==='FEMALE'?'selected':''}>${esc(tr('Female','女'))}</option></select></label>
 <label><input type="checkbox" name="save" required>${esc(tr('These are my details. I consent to saving them and using them for personal method calculations and reports.','这是本人的资料。我同意保存，并用于个人方法计算与报告。'))}</label>
 <details class="cx-person-advanced"><summary>${esc(tr('Consent settings','同意设置'))}</summary><div class="cx-stack cx-stack--tight">${field('expires','Consent valid until','同意有效至','date',p?.methodConsent?.expiresAt?.slice(0,10)||oneYearFromNow(),'required')}<p class="cx-field-helper">${esc(tr('Default: one year. You can withdraw consent at any time.','默认一年。你可以随时撤回同意。'))}</p></div></details>
 <button class="cx-button cx-button--primary" type="submit">${esc(tr('Save profile','保存资料'))}</button></form></details>
 <details class="cx-account-editor"><summary>${esc(tr('Create a Zi Wei report','创建紫微报告'))}</summary><form data-generate-form class="cx-stack cx-person-generate"><h3>${esc(tr('Generate Zi Wei report','生成紫微报告'))}</h3><label class="cx-field">${esc(tr('Profile','资料'))}<select class="cx-select" name="personId" required>${persons.filter(p=>p.consentState==='ACTIVE').map(p=>`<option value="${esc(p.personId)}">${esc(p.name)}</option>`).join('')}</select></label><label class="cx-field">${esc(tr('Report language','报告语言'))}<select class="cx-select" name="locale"><option value="zh-Hans">中文</option><option value="en">English</option></select></label>
 ${field('targetDate','Reading reference date','读取参考日期','date',new Date().toISOString().slice(0,10),'required')}
 <p class="cx-field-helper">${esc(tr('PHI OS uses your saved profile and purchased report access. You do not need to re-enter technical birth data.','PHI OS 会直接使用已保存的出生资料与已购买的报告权益，不需要重复填写技术资料。'))}</p><button class="cx-button cx-button--primary" type="submit">${esc(tr('Generate report','生成报告'))}</button></form></details>
 <section data-released-reports class="cx-account-reports"><div class="cx-account-reports__heading"><h3>${esc(tr('Your released reports','你的已发布报告'))}</h3><button class="cx-button cx-button--secondary" type="button" data-refresh-reports>${esc(tr('Refresh','刷新'))}</button></div>${reportsState==='error'?`<p role="status">${esc(tr('Reports could not be loaded. Refresh to try again.','报告列表加载失败，请刷新重试。'))}</p>`:reportsState==='loading'?`<p role="status">${esc(tr('Loading your reports…','正在加载你的报告…'))}</p>`:''}<div class="cx-account-report-grid">${reports.map(r=>`<article class="cx-account-report-card"><img src="/assets/icons/methods/PHIOS-ICON-METHOD-ZIWEI-v1.svg" alt="" aria-hidden="true"><h4>${esc(tr('Zi Wei report','紫微报告'))} · ${esc(r.subjectName)}</h4><p>${r.presentationMode==='BILINGUAL'?'中文 · English':r.locale==='zh-Hans'?'中文':'English'} · ${esc(tr('Version','版本'))} ${r.version} · ${esc(new Date(r.releasedAt).toLocaleString())} · ${esc(tr('Released','已发布'))}</p><a class="cx-button" target="_blank" rel="noopener" href="/api/account-method-reports?reportId=${encodeURIComponent(r.reportId)}">${esc(tr('Open report','打开报告'))}</a></article>`).join('')||(reportsState==='ready'?`<p>${esc(tr('No released method reports yet.','目前没有已发布的方法报告。'))}</p>`:'')}</div></section>`:''}`;
 installReportQuestions(host);
 const reportSection=host.querySelector('[data-released-reports]');
 const editor=host.querySelector('.cx-account-editor');
 if(reportSection&&editor)host.insertBefore(reportSection,editor);
 host.querySelector('[data-refresh-reports]')?.addEventListener('click',()=>refreshReports());
 host.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editing=b.dataset.edit;selectedLocation=null;locationCandidates=[];message='';render();});
 host.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=async()=>{const p=persons.find(p=>p.personId===b.dataset.revoke);try{await accountRequest('/api/account-persons',{action:'revoke',personId:p.personId,expectedVersion:p.version});await refresh();}catch{message=tr('Unable to withdraw consent. Try again.','无法撤回同意，请重试。');render();}});
 const personForm=host.querySelector('[data-person-form]'),placeInput=personForm?.elements?.placeSearch;
 placeInput?.addEventListener('input',()=>{selectedLocation=null;locationCandidates=[];clearTimeout(searchTimer);const q=placeInput.value.trim();if(q.length<2){renderPlaceResults();return;}searchTimer=setTimeout(()=>searchPlaces(q),320);});
 host.querySelectorAll('[data-place-ref]').forEach(bindPlaceOption);
 personForm?.addEventListener('submit',async e=>{
  e.preventDefault();const f=new FormData(e.target),button=e.target.querySelector('button[type=submit]');button.disabled=true;
  const raw=f.get('birthTime'),time=f.get('timeAccuracy')==='UNKNOWN'?null:raw;
  try{
   const body={action:'save',...(p?{personId:p.personId}:{}),expectedVersion:p?.version??0,name:f.get('name'),locale:locale(),birth:{birthDate:f.get('birthDate'),birthTime:time?(String(time).length===5?time+':00':time):null,timeAccuracy:f.get('timeAccuracy')},calculationSex:f.get('calculationSex')||null,consent:{personalMethod:f.has('save'),report:f.has('save'),saveBirthInput:f.has('save')},expiresAt:f.get('expires')+'T23:59:59Z'};
   if(selectedLocation?.providerRef)body.locationProviderRef=selectedLocation.providerRef;
   else if(p?.canonicalBirthInput?.birthPlace&&p?.canonicalBirthInput?.timezone){body.birth.birthPlace=p.canonicalBirthInput.birthPlace;body.birth.timezone={iana:p.canonicalBirthInput.timezone.iana,utcOffsetAtBirth:p.canonicalBirthInput.timezone.utcOffsetAtBirth};}
   else throw Object.assign(new Error('LOCATION_SELECTION_REQUIRED'),{code:'LOCATION_SELECTION_REQUIRED'});
   await accountRequest('/api/account-persons',body);editing=null;selectedLocation=null;locationCandidates=[];message=tr('Profile saved. Location and timezone were resolved automatically.','资料已保存；地点与时区已由系统自动解析。');await refresh();
  }catch(error){message=error?.code==='LOCATION_SELECTION_REQUIRED'?tr('Choose your birth place from the suggestions before saving.','保存前请从建议列表选择出生地点。'):tr('Unable to save. Check the birth details and consent settings.','无法保存，请检查出生资料与同意设置。');render();}
 });
 if(host.querySelector('[data-generate-form]'))installReportModeChoice(host.querySelector('[data-generate-form]'),{request:accountRequest,locale});
 host.querySelector('[data-generate-form]')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target);e.target.querySelector('button').disabled=true;try{const contextSelection=await prepareReportContext(e.target,{request:accountRequest,locale});await accountRequest('/api/account-method-reports',{...contextSelection,personId:f.get('personId'),locale:f.get('locale'),targetContext:{targetDate:f.get('targetDate'),targetTime:'12:00:00',targetTimezone:{iana:'Etc/UTC',utcOffsetAtTarget:'+00:00'},source:'EXPLICIT_REQUEST'}});message=tr('Your report is released.','报告已发布。');await refresh();}catch(error){if(error.code==='CONTEXT_EDIT_REQUESTED'){e.target.querySelector('button[type=submit]').disabled=false;return;}if(/REALITY_|CONTEXTUAL_|REPORT_CONTEXT_|REPORT_MODE_/.test(error.code||'')){message=reportContextErrorLabel(error.code,locale());let status=e.target.querySelector('[data-context-error]');if(!status){status=document.createElement('p');status.dataset.contextError='';status.setAttribute('role','status');e.target.append(status);}status.textContent=message;e.target.querySelector('button[type=submit]').disabled=false;return;}message=tr('The report could not be released. Check access and consent; report verification must also be available.','报告暂未能发布。请核对权益及同意状态；报告验证服务也必须可用。');render();}});
}
function bindPlaceOption(button){button.onclick=()=>{const item=locationCandidates.find(x=>x.providerRef===button.dataset.placeRef);if(!item)return;selectedLocation=item;locationCandidates=[];const input=host.querySelector('[name=placeSearch]');if(input)input.value=item.primaryLabel||item.label;renderPlaceResults();};}
function renderPlaceResults(){const node=host.querySelector('[data-place-results]');if(!node)return;node.innerHTML=placeResults();node.querySelectorAll('[data-place-ref]').forEach(bindPlaceOption);}
async function searchPlaces(query){locationBusy=true;renderPlaceResults();try{const response=await fetch('/api/location-search?q='+encodeURIComponent(query)+'&locale='+encodeURIComponent(locale()),{headers:{Accept:'application/json'},cache:'no-store'}),payload=await response.json();locationCandidates=response.ok&&payload?.ok?payload.candidates||[]:[];}catch{locationCandidates=[];}finally{locationBusy=false;renderPlaceResults();}}
async function refreshReports(){
 reportsState='loading';reportsError=null;render();
 try{const response=await accountRequest('/api/account-method-reports');if(!Array.isArray(response.reports))throw new Error('REPORT_LIST_INVALID');reports=response.reports;reportsState='ready';}
 catch(e){reports=[];reportsState='error';reportsError=e.status||null;}
 render();
}
async function refresh(){
 const loadReports=refreshReports();
 try{const response=await accountRequest('/api/account-persons');persons=Array.isArray(response.persons)?response.persons:[];available=true;}
 catch(e){persons=[];available=false;message=e.status===401?tr('Sign in to manage your birth profile.','请登录以管理出生资料。'):tr('Birth profiles are temporarily unavailable.','出生资料暂不可用。');}
 await loadReports;render();
 if(!available&&reportsState!=='error'){
  // Reports remain reachable when profile management is temporarily unavailable.
  const section=document.createElement('section');section.className='cx-account-reports';
  section.innerHTML=reports.map(r=>`<article class="cx-account-report-card"><h3>${esc(tr('Zi Wei report','紫微报告'))} · ${esc(r.subjectName)}</h3><a class="cx-button" target="_blank" rel="noopener" href="/api/account-method-reports?reportId=${encodeURIComponent(r.reportId)}">${esc(tr('Open report','打开报告'))}</a></article>`).join('');host.append(section);installReportQuestions(host);
 }
}
refresh();window.addEventListener('phios:localechange',()=>{selectedLocation=null;locationCandidates=[];render();});window.addEventListener('pageshow',e=>{if(e.persisted)refresh();});window.addEventListener('pagehide',()=>{persons=[];reports=[];editing=null;available=false;selectedLocation=null;locationCandidates=[];render();});
