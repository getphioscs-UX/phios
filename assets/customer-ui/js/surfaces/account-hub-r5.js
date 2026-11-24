import {observeAccountViews} from '../account-view-state.js';
import {commerceProductName} from './commerce-product-visuals.js';
import {esc,tr} from './runtime-ui.js';
import {resolveApprovedVisual} from '../../../js/runtime/web-production/asset-resolver.js';
// Display existing server projections. No rights are inferred from redirects,
// orders, local storage, UI selection or a successful setup response.
const main=document.querySelector('[data-account-r51]');
if(main){
 const detail=document.getElementById('account-detail'),title=document.getElementById('account-detail-title');
 const names={membership:['Membership and rights','会员与权益'],'paid-ask':['Paid Ask availability','会员 Ask 开放状态'],reports:['My reports','我的报告'],will:['My Will','我的遗嘱'],financial:['Financial records','财务记录'],orders:['Orders and settings','订单与设置']};
 const panels={membership:'account-membership-panel','paid-ask':'account-ask-panel',reports:'account-report-panel',will:'account-will-panel',financial:'account-financial-panel',orders:'account-commerce-panel'};
 let area='',views=new Map(),ask={state:'unchecked'},askEpoch=0,heroGeneration=0;
 const assets=new Map(),assetFor=id=>{if(!assets.has(id))assets.set(id,resolveApprovedVisual(id));return assets.get(id);};
 function bindIcons(){
  for(const button of main.querySelectorAll('[data-account-reports] [data-download],[data-method-pdf],[data-commerce-account] [data-download]'))if(!button.querySelector('[data-account-icon]')){const n=document.createElement('img');n.width=20;n.height=20;n.alt='';n.setAttribute('aria-hidden','true');n.className='account-r51__inline-icon';n.dataset.accountIcon='PHIOS-ICON-DOWNLOAD-v1.svg';button.prepend(n);}
  for(const n of main.querySelectorAll('[data-account-icon]')){const id=n.dataset.accountIcon;if(n.dataset.accountBound===id)continue;n.dataset.accountBound=id;n.dataset.accountAssetState='loading';n.hidden=true;assetFor(id).then(a=>{if(n.dataset.accountIcon!==id)return;n.dataset.accountObject=a.objectKey;n.dataset.accountResolver=a.sourceReference;n.onload=()=>{if(n.dataset.accountIcon===id){n.dataset.accountAssetState='ready';n.hidden=false;}};n.onerror=()=>{if(n.dataset.accountIcon===id){n.dataset.accountAssetState='unavailable';n.hidden=true;}};n.src=a.src;if(n.complete&&n.naturalWidth){n.dataset.accountAssetState='ready';n.hidden=false;}}).catch(()=>{n.dataset.accountAssetState='unavailable';n.hidden=true;});}
 }
 async function loadHero(){const generation=++heroGeneration,n=main.querySelector('[data-account-hero]'),frame=main.querySelector('[data-account-hero-frame]'),fallback=main.querySelector('[data-account-hero-fallback]');frame.dataset.accountAssetState='loading';fallback.hidden=true;n.hidden=true;
  let timer;const fail=()=>{if(generation!==heroGeneration)return;frame.dataset.accountAssetState='unavailable';n.hidden=true;fallback.hidden=false;};
  try{const a=await assetFor('HERO-017');if(a.objectKey!=='images/hero/PHIOS-HERO-ACCOUNT-CONTINUITY-v1.webp')throw Error('ACCOUNT_HERO_IDENTITY_CONFLICT');frame.dataset.accountObject=a.objectKey;frame.dataset.accountResolver=a.sourceReference;n.onload=()=>{if(generation!==heroGeneration)return;clearTimeout(timer);frame.dataset.accountAssetState='ready';n.hidden=false;fallback.hidden=true;};n.onerror=()=>{clearTimeout(timer);fail();};n.loading='eager';timer=setTimeout(fail,9000);n.src=a.src;if(n.complete&&n.naturalWidth)n.onload();}catch{fail();}
 }
 main.querySelector('[data-account-hero-retry]').addEventListener('click',()=>void loadHero());
 function areaForHash(){const id=location.hash.slice(1);if(/^(account-persons|account-reports|account-report-panel)/.test(id))return 'reports';if(id==='account-drafts'||id==='account-will-panel')return 'will';if(/^(financial-account-reports|account-financial)/.test(id))return 'financial';if(/^(account-commerce|account-settings|account-profile|account-continuity)/.test(id))return 'orders';if(id==='account-membership-panel')return 'membership';if(id==='account-ask-panel')return 'paid-ask';return '';}
 function syncSections(){
  for(const [key,id]of Object.entries(panels)){const n=document.getElementById(id);if(n)n.hidden=area!==key;}
  const materials=main.querySelector('[data-account-private-slot]');materials.hidden=!['reports','will','financial'].includes(area);
  for(const [id,key]of [['account-reports','reports'],['account-drafts','will'],['account-financial-drafts','financial']]){const n=document.getElementById(id);if(n)n.hidden=area!==key;}
 }
 function select(next,focus=false){area=names[next]?next:'';main.dataset.accountArea=area;detail.hidden=!area;title.textContent=area?tr(...names[area]):tr('Your account details','账户详情');syncSections();
  for(const a of main.querySelectorAll('[data-account-r5-tile] a')){const yes=a.dataset.accountArea===area&&!!area;if(yes)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');if(a.hasAttribute('aria-controls'))a.setAttribute('aria-expanded',String(yes));}
  if(area==='financial')document.dispatchEvent(new Event('phios:account-financial-open'));
  if(['paid-ask','membership'].includes(area))void loadAsk();
  if(focus){const n=area?title:document.getElementById('account-r5-title');n.tabIndex=-1;n.focus({preventScroll:true});n.scrollIntoView({block:'start'});}
 }
 document.addEventListener('click',event=>{const a=event.target.closest('[data-account-area],[data-account-close]');if(!a||!main.contains(a)||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const next=a.dataset.accountArea||'';if(location.hash===a.hash){event.preventDefault();select(next,true);}});
 window.addEventListener('hashchange',()=>select(areaForHash(),true));document.addEventListener('phios:account-rendered',()=>{syncSections();bindIcons();});
 const p=(text)=>'<p>'+esc(text)+'</p>';
 function statusText(state){return state==='guest'?tr('Sign in to verify this area.','请登录以核实此分区。'):state==='unavailable'?tr('This area could not be verified. Try again later.','暂时无法核实此分区，请稍后重试。'):tr('Checking account services…','正在核对账户服务……');}
 function renderViews(){
  const auth=views.get('auth')?.state||'loading',commerce=views.get('commerce'),reports=views.get('reports'),account=commerce?.account;
  let lines=[];
  const activeRight=e=>!['REVOKED','EXPIRED','REFUNDED'].includes(String(e.state).toUpperCase())&&e.deliveryState==='ready';
  const member=commerce?.state==='verified'&&account.subscriptions.some(s=>s.accessGranted===true),owner=commerce?.state==='verified'&&account.entitlements.some(activeRight);
  const restricted=!!reports?.restricted||!!views.get('methods')?.restricted||commerce?.state==='verified'&&(account.entitlements.some(e=>['REVOKED','EXPIRED','REFUNDED'].includes(String(e.state).toUpperCase()))||account.orders.some(o=>['REFUNDED','PARTIALLY_REFUNDED','PAYMENT_FAILED','CANCELED'].includes(o.state)));
  main.dataset.accountCustomerState=auth!=='signed-in'?auth:restricted?'restricted':member?'membership-active':owner?'product-owner':'authenticated';
  if(auth==='guest')lines.push(tr('Guest · Sign in to see your purchases, rights and private reports.','访客 · 登录后可核实购买、权益与私人报告。'));
  else if(auth==='unavailable')lines.push(tr('Authentication unavailable · Your purchases and access have not been confirmed.','登录服务暂不可用 · 购买及访问权限尚未确认。'));
  else if(auth==='signed-in'){
   lines.push(tr('Authenticated account','已验证账户')+(member?' · '+tr('Membership active','会员有效'):'')+(owner?' · '+tr('Product owner · active access','产品所有者 · 访问权益有效'):''));
   if(commerce?.state==='verified'){

    lines.push(account.orders.length?tr(account.orders.length+' verified order records. Order status is separate from access.',account.orders.length+' 条已核实订单；订单状态与访问权限分别判断。'):tr('No purchases were returned by your verified account.','已验证的账户当前未返回购买记录。'));
    if(account.orders.some(o=>['REFUNDED','PARTIALLY_REFUNDED','PAYMENT_FAILED','CANCELED'].includes(o.state))||account.subscriptions?.some(s=>s.accessGranted===false)||account.entitlements?.some(e=>['REVOKED','EXPIRED','REFUNDED'].includes(e.state)||['revoked','expired'].includes(e.deliveryState)))lines.push(tr('Some orders or rights are inactive, failed, expired, refunded or revoked. Review Orders and Settings.','部分订单或权益未生效、失败、已到期、退款或撤销；请查看订单与设置。'));
   }else lines.push(tr('Purchase history has not been verified.','购买历史尚未核实。'));
   if(reports?.pending)lines.push(tr('Report preparation is pending. Open My Reports for the server status.', '报告正在准备中，请在“我的报告”查看服务端状态。'));
   if(reports?.released)lines.push(tr('Released report versions are available in My Reports.','“我的报告”中有已发布的报告版本。'));
   if(reports?.restricted||views.get('methods')?.restricted)lines.push(tr('Report access is expired, refunded or revoked. It is not downloadable.','部分报告访问已到期、退款或撤销，不能下载。'));
   if(reports?.state==='unavailable'||views.get('drafts')?.state==='unavailable'||views.get('methods')?.state==='error')lines.push(tr('Some private records could not be loaded. Open the relevant area for its error and recovery action.','部分私人记录读取失败；请进入对应分区查看错误与恢复操作。'));
  }else lines.push(statusText(auth));
  const overview=main.querySelector('[data-account-overview]');overview.dataset.accountState=auth;overview.hidden=auth!=='signed-in';const icon=document.createElement('img');icon.width=24;icon.height=24;icon.alt='';icon.setAttribute('aria-hidden','true');icon.className='account-r51__status-icon';const status=auth==='unavailable'?'UNAVAILABLE':auth==='loading'?'TEMPORARY':auth==='guest'?'SEPARATE':commerce?.state!=='verified'?(commerce?.state==='unavailable'?'UNAVAILABLE':'TEMPORARY'):reports?.restricted||views.get('methods')?.restricted||account?.orders?.some(o=>['REFUNDED','PAYMENT_FAILED','CANCELED'].includes(o.state))?'PARTIAL':reports?.pending?'TEMPORARY':account?.subscriptions?.some(s=>s.accessGranted===true)||account?.entitlements?.some(e=>e.deliveryState==='ready')||reports?.released?'AVAILABLE':'SEPARATE';icon.dataset.accountIcon='PHIOS-ICON-STATUS-'+status+'-v1.svg';overview.dataset.statusIcon=status;const text=document.createElement('div');text.replaceChildren(...lines.map(value=>{const n=document.createElement('p');n.textContent=value;return n;}));overview.replaceChildren(icon,text);
  const membership=main.querySelector('[data-account-membership-view]');membership.innerHTML=auth!=='signed-in'?p(statusText(auth)):commerce?.state!=='verified'?p(statusText(commerce?.state)):p(account.subscriptions?.some(s=>s.accessGranted===true)?tr('Active membership · verified by your account service.','有效会员 · 已由账户服务核实。'):tr('No active membership was verified.','未核实到有效会员。'))+(account.subscriptions||[]).map(s=>p(tr('Plan','方案')+': '+(s.planName||commerceProductName(s)||s.entitlementCode||tr('Not provided by the account service','账户服务未提供'))+' · '+tr('Status','状态')+': '+(s.accessGranted===true?tr('Active','有效'):tr('Inactive or expired','未生效或已到期'))+(s.paidUntil?' · '+tr('Paid until','付款有效至')+': '+new Date(typeof s.paidUntil==='number'&&s.paidUntil<1e12?s.paidUntil*1000:s.paidUntil).toLocaleDateString(document.documentElement.lang):''))).join('')+p(tr('Product rights are listed below exactly as returned by the account service. A paid order alone does not unlock another product.','以下仅列出账户服务返回的产品权益；订单已付不代表其他产品已解锁。'))+((account.entitlements||[]).length?'<ul>'+account.entitlements.map(e=>'<li>'+esc(e.title||commerceProductName(e)||e.entitlementCode||tr('Product right','产品权益'))+' · '+esc(e.deliveryState||e.state||tr('Check order details','请核对订单详情'))+'</li>').join('')+'</ul>':p(tr('No product entitlements returned.','账户未返回产品权益。')));
  if(auth==='signed-in'&&commerce?.state==='verified')membership.innerHTML+=p(ask.state==='ready'?tr('Verified remaining usage: ','已核实剩余额度：')+ask.balance.credits+' PHI Credits':tr('Usage has not been verified. Open Paid Ask to check its availability and balance.','使用额度尚未核实，可进入会员 Ask 查看开放状态与余额。'));
  renderAsk();renderNextStep();bindIcons();
 }

 function renderNextStep(){
  const host=main.querySelector('[data-account-next-content]'),auth=views.get('auth')?.state,commerce=views.get('commerce'),reports=views.get('reports'),drafts=views.get('drafts'),methods=views.get('methods'),items=[];
  const add=(key,label,href)=>items.push('<li data-account-priority="'+key+'"><a href="'+href+'">'+esc(label)+'</a></li>');
  if(auth!=='signed-in'){host.innerHTML=p(auth==='guest'?tr('Use Sign in above to verify your account. Your private activity is only shown after authentication.','请使用上方登录入口核实账户，验证后才显示私人活动。'):auth==='unavailable'?tr('Use Check account access again above to request a fresh session check. No purchase or saved activity is assumed.','可使用上方“重新检查账户访问”读取最新状态；不推定购买或保存活动。'):tr('Checking account access…','正在核实账户访问……'));return;}
  if(reports?.state==='verified'&&reports.requiredInputs)add('inputs',tr('Review required report information','查看报告所需资料'),'#account-persons');
  if(reports?.state==='verified'&&reports.pending)add('pending',tr('Check report preparation status','查看报告准备状态'),'#account-reports');
  if(reports?.state==='verified'&&reports.released||methods?.state==='ready'&&methods.released)add('released',tr('Open your released report versions','打开已发布的报告版本'),'#account-reports');
  if(commerce?.state==='verified'&&commerce.account.subscriptions.some(s=>s.accessGranted===true))add('membership',ask.state==='ready'?tr('Review membership · remaining usage: ','查看会员 · 剩余额度：')+ask.balance.credits+' PHI Credits':tr('Review verified membership; usage is not yet verified','查看已核实会员；使用额度尚未核实'),'#account-membership-panel');
  if(drafts?.state==='verified'&&drafts.will)add('will',tr('Continue your saved Will preparation','继续已保存的遗嘱准备'),'#account-drafts');
  if(drafts?.state==='verified'&&drafts.financial)add('financial',tr('Continue your saved financial work','继续已保存的财务资料'),'#financial-account-reports');
  const checked=reports?.state==='verified'||methods?.state==='ready'||drafts?.state==='verified'||commerce?.state==='verified';
  host.innerHTML=items.length?'<ul>'+items.slice(0,3).join('')+'</ul>':p(checked?tr('No actionable priority was returned by the verified services. Use the areas below to review your account.','已核实服务当前未返回可执行的优先事项，可在下方分区查看账户。'):tr('Activity has not been verified. Open the relevant area to check its service status.','活动尚未核实，可进入对应分区核对服务状态。'));
 }
 function renderAsk(){const host=main.querySelector('[data-account-ask-view]'),auth=views.get('auth')?.state;
  if(auth!=='signed-in'){host.innerHTML=p(statusText(auth));return;}
  if(ask.state==='ready'){host.innerHTML=p(tr('Verified usage balance','已核实使用额度')+': '+ask.balance.credits+' PHI Credits')+p(ask.balance.active?tr('Subscription active.','订阅有效。'):tr('Subscription is not active.','订阅未生效。'))+p(ask.executionAvailable&&ask.executionScope==='KNOWLEDGE_ONLY'?tr('Knowledge Ask is available under its existing limits.','知识 Ask 按现有限制提供。'):tr('Paid Ask execution is currently restricted. No Provider is started here.','会员 Ask 执行当前受限，此处不会启动 Provider。'))+'<a href="/membership.html" data-ask-existing>'+esc(tr('Open existing Ask area and its conditions','查看现有 Ask 区与使用条件'))+'</a>';
  }else host.innerHTML=p(ask.state==='loading'?tr('Checking availability and usage…','正在核实开放状态与额度……'):tr('Paid Ask availability or usage could not be verified. No access or credits are assumed.','尚无法核实会员 Ask 的开放状态或额度，不推定已开通或拥有额度。'))+'<a href="/membership.html">'+esc(tr('Read the existing membership and Ask conditions','查看现有会员及 Ask 条件'))+'</a>';
 }
 async function loadAsk(){if(views.get('auth')?.state!=='signed-in'||['loading','ready','unavailable'].includes(ask.state))return;const generation=++askEpoch;ask={state:'loading'};renderAsk();try{const r=await fetch('/api/membership-ask',{credentials:'same-origin',cache:'no-store'}),j=await r.json();if(generation!==askEpoch)return;ask=r.ok&&j.ok&&Number.isFinite(j.balance?.credits)?{state:'ready',...j}:{state:'unavailable'};}catch{if(generation===askEpoch)ask={state:'unavailable'};}renderViews();}
 observeAccountViews(next=>{views=next;renderViews();if(area==='paid-ask'||next.get('auth')?.state==='signed-in'&&next.get('commerce')?.state==='verified'&&next.get('commerce').account.subscriptions.some(s=>s.accessGranted===true))void loadAsk();});
 window.addEventListener('phios:localechange',()=>{renderViews();select(area);});window.addEventListener('phios:account-logout',()=>{askEpoch++;ask={state:'unchecked'};renderViews();});window.addEventListener('pagehide',()=>{askEpoch++;ask={state:'unchecked'};});
 // The approved original Hero remains visible. Other reference bytes remain in the
 // hidden inert archive and source registry; Help explains saved/session boundaries.
 select(areaForHash(),!!location.hash);bindIcons();void loadHero();
}
