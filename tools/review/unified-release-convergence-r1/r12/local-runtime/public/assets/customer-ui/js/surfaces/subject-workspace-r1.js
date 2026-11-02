import './profile-visitor-r1.js';
import '../account-session-signal.js';
import {locale,tr} from './runtime-ui.js';
function createWheel(options){let result;document.dispatchEvent(new CustomEvent('phios:request-six-lens-wheel',{detail:{version:'SUBJECT-CONTEXT-R1',options,receive:v=>{result=v;}}}));if(!result)throw Error('PROFILE_PRESENTATION_UNAVAILABLE');return result;}
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const types={PERSONAL:['Personal','个人'],FAMILY:['Family','家庭'],TEAM:['Team','团队'],BUSINESS:['Business','企业'],INSTITUTION:['Institution','机构'],COUNTRY:['Country observation','国家观察']};
const ids={identity:'IDENTITY',expression:'EXPRESSION',relationships:'RELATIONSHIPS',environment:'ENVIRONMENT',growth:'GROWTH',potential:'POTENTIAL'};
const metricLabels={revenue:['Revenue','营业收入'],costOfSales:['Cost of sales','销售成本'],cashPosition:['Cash position','现金余额'],currentAssets:['Current assets','流动资产'],currentLiabilities:['Current liabilities','流动负债'],grossProfit:['Gross profit','毛利'],grossMargin:['Gross margin','毛利率'],workingCapital:['Working capital','营运资本'],budgetBalance:['Public budget balance','公共财政收支差额']};
export async function installSubjectWorkspace() {
 // Local candidate only. On the production host this performs no request and changes no page.
 if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname)||document.body.dataset.cxSurface!=='MY_REALITY')return;
 let available,active=null,sequence=0,selectedId=new URL(location.href).searchParams.get('subjectId')||'',selection='identity';
 try{const r=await fetch('/api/customer-subject-workspace',{credentials:'same-origin',cache:'no-store'});if(!r.ok)return;available=await r.json();if(!available.ok||!available.items?.length)return;}catch{return;}
 for(const href of ['/assets/customer-ui/surfaces/profile-visitor-r1.css','/assets/customer-ui/surfaces/subject-workspace-r1.css'])if(!document.querySelector(`link[href="${href}"]`)){const l=node('link');l.rel='stylesheet';l.href=href;document.head.append(l);}
 const section=node('section',undefined,'cx-container subject-workspace');section.dataset.subjectWorkspace='true';section.setAttribute('aria-label',tr('Choose a profile','选择主体画像'));
 const title=node('h2',tr('Whose reality are you exploring?','你正在了解谁的现实？')),label=node('label',tr('Profile','主体画像')),select=node('select');select.id='subject-profile-select';label.htmlFor=select.id;
 const personal=node('option',tr('My personal workspace','我的个人工作空间'));personal.value='';select.append(personal);
 for(const i of available.items){const o=node('option',i.displayName+' · '+types[i.subjectType][locale()==='zh-Hans'?1:0]);o.value=i.subjectId;select.append(o);}
 const status=node('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');const content=node('div');content.dataset.subjectReading='true';
 const refresh=node('button',tr('Refresh available profiles','刷新可用画像'));refresh.type='button';refresh.addEventListener('click',()=>location.reload());
 section.append(title,label,select,refresh,status,content);document.querySelector('.cx-my-reality__hero')?.after(section);
 function paintSwitcher(){section.setAttribute('aria-label',tr('Choose a profile','选择主体画像'));title.textContent=tr('Whose reality are you exploring?','你正在了解谁的现实？');label.textContent=tr('Profile','主体画像');personal.textContent=tr('My personal workspace','我的个人工作空间');refresh.textContent=tr('Refresh available profiles','刷新可用画像');for(const option of select.options){const item=available.items.find(i=>i.subjectId===option.value);if(item)option.textContent=(item.displayNames?.[locale()]||item.displayName)+' · '+types[item.subjectType][locale()==='zh-Hans'?1:0];}}
 paintSwitcher();
 const personalParts=[...document.querySelectorAll('.cx-my-reality__context,.cx-my-reality__workspace,.pm-reality-help,[data-cx-start-reality],[data-reality-structure-start],.pis-visual-story')];
 function reset(){active=null;content.replaceChildren();personalParts.forEach(e=>e.hidden=!!select.value);}
 function money(m,f){if(m.value===null)return tr('Not provided','未提供');if(m.unit==='RATIO')return new Intl.NumberFormat(locale(),{style:'percent',maximumFractionDigits:1}).format(m.value);return new Intl.NumberFormat(locale(),{style:'currency',currency:f.currency}).format(m.value/100);}
 function render(w){
  content.replaceChildren();active=w;
  content.append(node('h3',w.displayName),node('p',types[w.subjectType][locale()==='zh-Hans'?1:0]+' · '+(w.role==='PUBLIC_OBSERVER'?tr('Public observation','公共观察'):tr('Authorized profile','已授权的画像'))));
  if(w.dataNature==='SYNTHETIC_EXAMPLE')content.append(node('p',tr('Illustrative data','示例资料'),'subject-data-label'));
  if(w.subjectType==='BUSINESS'&&w.legalForm==='SOLE_PROPRIETORSHIP')content.append(node('p',tr('Sole proprietorship · the operating view does not create a separate legal person.','独资经营 · 经营分析范围不代表独立法人身份。')));
  const grid=node('div',undefined,'subject-overview'),detail=node('div',undefined,'subject-dimension-detail');detail.setAttribute('aria-live','polite');
  const show=id=>{selection=id;detail.replaceChildren();const d=w.dimensions.find(d=>d.id===id);detail.append(node('h4',d.label),node('p',d.definition));if(!d.observations.length)detail.append(node('p',tr('No supporting information has been added for this dimension.','这个维度尚未加入可支持的资料。')));for(const o of d.observations){detail.append(node('p',o.statement));const p=node('p',o.period?`${o.publisher} · ${o.period} · ${o.unit}`:o.position,'subject-source');detail.append(p);if(o.sourceUrl){const a=node('a',tr('Read source','查看来源'));a.href=o.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';detail.append(a);}if(o.limitation)detail.append(node('p',o.limitation,'subject-source'));}};
  const items=w.dimensions.map(d=>({id:d.id,icon:ids[d.id],en:d.label,zh:d.label,de:d.definition,dz:d.definition}));
  const wheel=createWheel({items,centerLabel:w.displayName,groupLabel:tr('Six dimensions for this profile','当前主体的六个维度'),onSelect:show});grid.append(wheel.host,detail);content.append(grid);
  if(selection!=='identity')wheel.host.querySelector(`[data-prf-lens="${selection}"]`)?.click();
  const financial=node('section');financial.append(node('h4',tr('Financial overview','财务概况')));
  if(w.financial.metrics?.length){financial.append(node('p',w.financial.period+' · '+w.financial.currency));const dl=node('dl');for(const m of [...w.financial.metrics,...(w.financial.derived||[])]){const label=metricLabels[m.id]?.[locale()==='zh-Hans'?1:0]||m.id;dl.append(node('dt',label),node('dd',money(m,w.financial)));}financial.append(dl,node('p',tr('Profit, receivables and available cash are different measures.','利润、应收款和可用现金是不同指标。')));}else financial.append(node('p',tr('No financial figures are available in this authorized view.','当前获授权视图没有可用财务数值。')));
  if(w.subjectType==='COUNTRY')financial.append(node('p',tr('GDP describes an economy; government revenue and expenditure describe public finances. None is inferred from population.','GDP 描述经济规模；政府收入和支出属于公共财政。不能从人口资料推算这些数值。')));
  content.append(financial);
  if(w.worldContext.length){const world=node('section');world.append(node('h4',tr('World context','外部现实背景')));for(const e of w.worldContext.slice(-2))world.append(node('p',`${e.publisher} · ${e.period} · ${e.statement}`));world.append(node('p',tr('Dated background does not establish an individual or business outcome.','有日期的背景资料不能直接证明个人或企业的实际结果。')));const link=node('a',tr('Explore World','进入 World'));link.href='/world/';world.append(link);content.append(world);}
  if(w.worldTrend?.state==='TIME_SERIES_TREND'){
   const trend=node('details'),summary=node('summary',tr('Read the archived 12-month CPI sequence','查看存档的12个月消费价格指数序列')),table=node('table');table.append(node('caption',w.worldTrend.periods.join(' — ')+' · '+w.worldTrend.unit));
   const head=node('tr');head.append(node('th',tr('Observed month','观察月份')),node('th',tr('Index','指数')));table.append(head);
   for(const point of w.worldTrend.points){const row=node('tr');row.append(node('td',point.period),node('td',String(point.value)));table.append(row);}trend.append(summary,table,node('p',tr('This describes the archived sequence, without forecasting or identifying causes.','这里只描述存档序列，不预测未来，也不据此判定原因。')));content.append(trend);
  }
  const nav=node('section');nav.append(node('h4',tr('Choose a next step','选择下一步')));const option=node('select');option.id='subject-next-option';const ol=node('label',tr('What would you like to examine?','你想继续核对什么？'));ol.htmlFor=option.id;for(const o of w.navigation.options){const v=node('option',o.label);v.value=o.id;option.append(v);}nav.append(ol,option,node('p',tr('Nothing is selected or saved on your behalf.','系统不会代你作出决定或自动保存。')));content.append(nav);
  document.dispatchEvent(new CustomEvent('phios:subject-view-ready',{detail:{subjectId:w.subjectId,sourceVersion:w.sourceVersion,subjectType:w.subjectType,optionId:w.navigation.options[0]?.id}}));
 }
 async function load(){const current=++sequence;reset();selectedId=select.value;const u=new URL(location.href);if(selectedId)u.searchParams.set('subjectId',selectedId);else u.searchParams.delete('subjectId');history.replaceState(null,'',u);if(!selectedId){status.textContent='';return;}status.textContent=tr('Loading this profile…','正在读取当前画像……');try{const r=await fetch('/api/customer-subject-workspace?subjectId='+encodeURIComponent(selectedId)+'&locale='+encodeURIComponent(locale()),{cache:'no-store',credentials:'same-origin'}),v=await r.json();if(current!==sequence)return;if(!r.ok||!v.ok)throw Error(v.code);render(v.workspace);status.textContent='';}catch{if(current===sequence){active=null;content.replaceChildren();status.textContent=tr('This profile is unavailable. Refresh access or choose another profile.','目前无法读取这个画像。请刷新权限或选择其他画像。');}}}
 select.addEventListener('change',load);
 if(available.items.some(i=>i.subjectId===selectedId))select.value=selectedId;
 else if(selectedId){const denied=node('option',tr('Unavailable profile','无法访问的画像'));denied.value=selectedId;denied.disabled=true;select.append(denied);select.value=selectedId;}
 new MutationObserver(()=>{paintSwitcher();if(active)load();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 document.addEventListener('phios:subject-access-changed',()=>{sequence++;reset();status.textContent=tr('Access changed. Refresh available profiles.','权限已改变，请刷新可用画像。');});
 window.addEventListener('phios:account-logout',()=>{
  sequence++;reset();available.items=available.items.filter(i=>i.role==='PUBLIC_OBSERVER');
  for(const option of [...select.options])if(option.value&&!available.items.some(i=>i.subjectId===option.value))option.remove();
  select.value='';selectedId='';personalParts.forEach(e=>e.hidden=true);
  const u=new URL(location.href);u.searchParams.delete('subjectId');u.searchParams.delete('navigationRef');history.replaceState(null,'',u);
  status.textContent=tr('Your session ended. Refresh access before continuing.','会话已结束。请刷新权限后继续。');
 });
 await load();
}
