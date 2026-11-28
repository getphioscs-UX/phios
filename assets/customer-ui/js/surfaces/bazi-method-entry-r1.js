import {installMethodNativeIntakeR2} from './method-native-intake-r2.js';
import {resolveUnifiedPublicVisual} from '../../../js/public-v2/unified-public-visual-resolver.js';
import {hydrateCustomerAssets} from '../assets.js';

// This page owns presentation only. Input validation, chart calculation and
// availability continue to belong to the existing native method adapter.
const root=document.querySelector('[data-bazi-method-entry]');
const zh=()=>document.documentElement.lang.startsWith('zh');
const text=(en,cn)=>zh()?cn:en;
let publicOffer=null;
function renderOffer(){
 const node=root?.querySelector('[data-bazi-offer]');if(!node)return;
 let en='The current product price cannot be confirmed. Check your account before purchase.',cn='暂时无法确认当前商品价格，请在账户内核对后再购买。';
 if(publicOffer){
  const matches=publicOffer.products.filter(product=>product.productId==='COM-REPORT-BAZI-FULL');
  if(matches.length===1){
   const product=matches[0],quotes=product.reportPresentationOptions||[],prices=[...new Set(quotes.filter(q=>Number.isSafeInteger(q.amountMinor)&&typeof q.currency==='string').map(q=>q.currency+':'+q.amountMinor))];
   if(prices.length===1){const [currency,minor]=prices[0].split(':'),amount=Number(minor);if(/^[A-Z]{3}$/.test(currency)&&amount>=0){const price=new Intl.NumberFormat(zh()?'zh-CN':'en-MY',{style:'currency',currency}).format(amount/100);const open=publicOffer.checkoutAvailable===true&&product.checkoutAvailable===true;en=`Current listed price: ${price}. ${open?'Confirm language, details and purchase eligibility in your account.':'New purchases are not currently open. Existing reports remain in your account.'}`;cn=`当前方案标价：${price}。${open?'请在账户内确认语言、资料与购买条件。':'新购买目前未开放；已有报告仍可在账户中查看。'}`;}}
  }
 }
 node.dataset.cxEn=en;node.dataset.cxZh=cn;node.textContent=zh()?cn:en;
}
if(root){
 fetch('/api/commerce-catalog',{credentials:'omit',cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok||data.success!==true||!Array.isArray(data.products))throw Error('CATALOG_UNAVAILABLE');publicOffer=data;renderOffer();}).catch(()=>renderOffer());
 const reader=root.querySelector('[data-bazi-reader]'),pages=[...reader.querySelectorAll('[data-bazi-page-panel]')],select=reader.querySelector('[data-bazi-page]'),prev=reader.querySelector('[data-bazi-prev]'),next=reader.querySelector('[data-bazi-next]'),original=reader.querySelector('[data-bazi-original]'),status=reader.querySelector('[data-bazi-reader-status]');
 let selected=0;
 function readerState(){
  const image=pages[selected].querySelector('img');
  status.textContent=image.complete?(image.naturalWidth?text(`Page ${selected+1} of 6`,`第 ${selected+1} 页，共 6 页`):text('This page could not load. Open the original image or try again.','本页图片暂时无法加载。可打开原图，或稍后重试。')):text('Loading page…','正在加载本页…');
 }
 function showPage(value){selected=Math.max(0,Math.min(5,Number(value)||0));for(const [i,page]of pages.entries())page.hidden=i!==selected;select.value=String(selected);prev.disabled=selected===0;next.disabled=selected===5;original.href=pages[selected].querySelector('img').src;readerState();}
 for(const [i,page]of pages.entries()){
  const image=page.querySelector('img');image.addEventListener('load',()=>{image.dataset.loadState='loaded';if(i===selected)readerState();});image.addEventListener('error',()=>{image.dataset.loadState='unavailable';if(i===selected)readerState();});
 }
 select.addEventListener('change',()=>showPage(select.value));prev.addEventListener('click',()=>showPage(selected-1));next.addEventListener('click',()=>showPage(selected+1));showPage(0);

 const hero=root.querySelector('[data-bazi-hero]');
 hero.addEventListener('load',()=>{hero.hidden=!hero.naturalWidth;hero.dataset.loadState=hero.naturalWidth?'loaded':'unavailable';});
 hero.addEventListener('error',()=>{hero.hidden=true;hero.dataset.loadState='unavailable';});
 resolveUnifiedPublicVisual('METHOD-BAZI-HERO').then(asset=>{if(!asset.renderable)throw Error('HERO_UNAVAILABLE');hero.width=asset.width||1600;hero.height=asset.height||1000;hero.src=asset.src;}).catch(()=>{hero.hidden=true;hero.dataset.loadState='unavailable';});

 installMethodNativeIntakeR2(root,'bazi');
 // No global source or other method is changed. Detach unrelated controls only
 // from this dedicated page's cloned form before the shared runtime boots.
 const intake=root.querySelector('[data-method-native-intake="bazi"]');
 let realityField=null,realityDetails=null;
 const cx=(node,en,cn)=>{node.dataset.cxEn=en;node.dataset.cxZh=cn;node.textContent=zh()?cn:en;return node;};
 function showReality(){if(!realityDetails)return;realityDetails.open=true;realityDetails.scrollIntoView({block:'start'});realityField?.focus({preventScroll:true});}
 root.addEventListener('click',event=>{if(event.target.closest('a[href="#bazi-reality-context"]')){event.preventDefault();showReality();}});
 function renderRealityDraft(){
  if(!realityField)return;
  let panel=intake.querySelector('[data-bazi-reality-result]');
  if(!panel){panel=document.createElement('section');panel.dataset.baziRealityResult='';panel.className='bz-reality-result';realityDetails.append(panel);}
  const draft=realityField.value;panel.replaceChildren();panel.hidden=!draft.trim();if(!draft.trim())return;
  panel.append(cx(document.createElement('h3'),'Your recorded question · not analysed','已记录的问题 · 尚未分析'));
  const quote=document.createElement('blockquote');quote.textContent=draft;panel.append(quote);
  const edit=cx(document.createElement('button'),'Edit','修改');edit.type='button';edit.addEventListener('click',showReality);
  const remove=cx(document.createElement('button'),'Delete this question','删除这个问题');remove.type='button';remove.addEventListener('click',()=>{realityField.value='';renderRealityDraft();});panel.append(edit,remove);
  panel.append(cx(document.createElement('p'),'In-depth reading with real-life context belongs to the formal Full Report. The free version does not analyse the question you enter.','结合现实处境的深入阅读属于正式完整报告。免费版本不会分析你填写的现实问题。'));
 }
 root.querySelector('#bazi-intake-position').replaceWith(intake);
 root.querySelectorAll('[data-method-native-reading]').forEach(node=>node.remove());
 function refineIntake(){
  const form=intake.querySelector('[data-cx-personal-form]');
  const submit=form?.querySelector('[data-cx-personal-submit]');if(submit){submit.dataset.cxEn='Calculate my Four Pillars';submit.dataset.cxZh='排出我的四柱';const label=zh()?submit.dataset.cxZh:submit.dataset.cxEn;if(submit.textContent!==label)submit.textContent=label;}
  // The optional context uses the existing intent input below. The generic
  // multi-method chooser stays out of this dedicated page's main form.
  intake.querySelectorAll('[data-guided-reality]').forEach(node=>{node.hidden=true;});
  if(form&&!form.dataset.baziEntryRefined){
   for(const node of form.querySelectorAll('#cx-r12-profile,.cx-personal-other-perspectives,[data-cx-external-profile-intake],[data-cx-numerology-details],[data-cx-r12-input-flow],#cx-r12-birth-intro,[data-cx-reading-contract]'))node.remove();
   const intro=form.querySelector('#cx-r12-about-you > p');if(intro){intro.dataset.cxEn='Use a name to identify this reading, then enter the birth information below.';intro.dataset.cxZh='填写本次阅读的姓名标识，再填写下方出生资料。';intro.textContent=zh()?intro.dataset.cxZh:intro.dataset.cxEn;}
   realityField=form.elements.intent;
   if(realityField){
    // The free request allowlist reads only `intent`; this separate, in-memory
    // draft is never supplied to free calculation or free interpretation.
    realityField.name='baziRealityDraft';
    realityField.dataset.baziRealityDraft='';
    realityField.addEventListener('input',renderRealityDraft);

    realityDetails=document.createElement('details');realityDetails.id='bazi-reality-context';realityDetails.className='bz-reality-context';
    realityDetails.append(cx(document.createElement('summary'),'Include my real-life context (optional)','结合我的现实处境（可选）'));
    const label=realityField.closest('label');const title=label.querySelector('span');if(title)cx(title,'What has been happening? What would you like to understand, or which choice are you considering?','最近发生了什么？你希望理解什么，或正在考虑什么选择？');
    realityField.dataset.cxEnPlaceholder='Describe what matters to you in this reading.';realityField.dataset.cxZhPlaceholder='写下你希望这次阅读关注的事情。';
    realityField.placeholder=zh()?realityField.dataset.cxZhPlaceholder:realityField.dataset.cxEnPlaceholder;realityField.rows=5;
    realityDetails.append(label,cx(document.createElement('p'),'You can begin here or add context after entering your birth details. Switching between the two keeps your inputs in this page.','你可以先写处境，也可以填完出生资料后再补充；切换入口会保留本页已填写的内容。'));
    realityDetails.append(cx(document.createElement('p'),'In-depth reading with real-life context belongs to the formal Full Report. The free version does not analyse the question you enter.','结合现实处境的深入阅读属于正式完整报告。免费版本不会分析你填写的现实问题。'));
    form.querySelector('#cx-r12-about-you')?.after(realityDetails);
    form.addEventListener('reset',()=>queueMicrotask(renderRealityDraft));
   }
   // Keep the single selected BaZi input for the existing request contract.
   form.dataset.baziEntryRefined='true';
   void hydrateCustomerAssets(intake);
  }
  const heading=intake.querySelector('.wrap > h2');if(heading){const title=text('Calculate your Four Pillars','专业四柱排盘');if(heading.textContent!==title)heading.textContent=title;}
  const note=intake.querySelector('[data-native-note]');if(note){const copy=text('Use your birth details and confirm the place. The existing calculation determines the available chart and timing layers; nothing is saved automatically.','填写出生资料并确认地点。盘面及时间层按现有计算与当前可用范围提供，不会自动保存资料。');if(note.textContent!==copy)note.textContent=copy;}
  const results=intake.querySelector('[data-cx-personal-results]');
  if(results&&!results.querySelector('[data-bazi-report-next]')){
   const next=document.createElement('nav');next.dataset.baziReportNext='';next.className='bz-actions';next.setAttribute('aria-label','Report reading');
   for(const [href,en,cn]of [['#preview','Read the free first six pages','免费阅读报告前六页'],['#continue','Explore the Full Report','查看完整报告']]){const a=cx(document.createElement('a'),en,cn);a.href=href;next.append(a);}results.prepend(next);
  }
  const chart=intake.querySelector('[data-ppr-bazi-professional-structure]');
  if(chart&&!chart.querySelector('[data-bazi-term-help]')){
   const help=document.createElement('details');help.dataset.baziTermHelp='';
   const summary=document.createElement('summary');summary.dataset.cxEn='Chart terms and reading guide';summary.dataset.cxZh='盘面术语与阅读导引';summary.textContent=zh()?summary.dataset.cxZh:summary.dataset.cxEn;help.append(summary);
   for(const [en,cn]of [['Day Master: the day stem, used as the relationship reference.','日主：日柱天干，是关系阅读的参照。'],['Hidden stems: the stems associated with each branch.','藏干：地支内部对应的天干。'],['Ten Gods: phase and polarity relationships measured from the Day Master.','十神：以日主为参照的五行与阴阳关系。']]){const p=document.createElement('p');p.dataset.cxEn=en;p.dataset.cxZh=cn;p.textContent=zh()?cn:en;help.append(p);}
   const link=document.createElement('a');link.href='#read';link.dataset.cxEn='Explore the structure diagrams →';link.dataset.cxZh='查看结构图与逐层说明 →';link.textContent=zh()?link.dataset.cxZh:link.dataset.cxEn;help.append(link);chart.querySelector('header')?.after(help);
  }
 }
 new MutationObserver(refineIntake).observe(intake,{childList:true,subtree:true});refineIntake();
 intake.querySelector('[data-native-open]')?.click();
 function language(){
  for(const node of root.querySelectorAll('[data-cx-en][data-cx-zh]'))if(!node.querySelector('input,select,textarea,button'))node.textContent=zh()?node.dataset.cxZh:node.dataset.cxEn;
  hero.alt=text('BaZi method illustration','八字方法意象图');original.setAttribute('aria-label',text(`Open original report page ${selected+1}`,`打开报告第 ${selected+1} 页原图`));
  const account=root.querySelector('[data-bazi-account]'),url=new URL(account.href);url.searchParams.set('locale',zh()?'zh-Hans':'en');account.href=url.pathname+url.search;
  document.title=text('BaZi — PHI OS','八字 — PHI OS');refineIntake();readerState();
  renderOffer();
  if(realityField)realityField.placeholder=zh()?realityField.dataset.cxZhPlaceholder:realityField.dataset.cxEnPlaceholder;
 }
 new MutationObserver(language).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});language();
}
