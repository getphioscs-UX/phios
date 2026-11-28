import {AST_ENTRY_COPY,AST_ENTRY_SOURCES} from './astrology-professional-copy-r1.js';
import {astrologyTeachingDiagram} from './astrology-professional-diagrams-r1.js';
import {installMethodNativeIntakeR2} from './method-native-intake-r2.js';
import {preentryFullOffer} from './preentry-five-method-r5-model.js';
import {resolveUnifiedPublicVisual} from '../../../js/public-v2/unified-public-visual-resolver.js';
const root=document.querySelector('[data-ast-entry]');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>document.documentElement.lang.startsWith('zh')?'zh-Hans':'en',copy=()=>AST_ENTRY_COPY[lang()];
const t=(en,zh)=>lang()==='en'?en:zh;
let direction='chart',pageIndex=0,manifest=null,lastView=null,hero=null,catalog=null,productVisual=null,situationDraft='';
const setText=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
const ids=['ast-chart','ast-introduction','ast-history','ast-structure','ast-phi-reading','ast-report'];
const paragraphs=rows=>rows.map(([title,...parts],i)=>`<article class="ast-article"><h3>${esc(title)}</h3>${parts.map(p=>`<p>${esc(p)}</p>`).join('')}</article>`).join('');
const chapterTitles={
 en:['Chart overview','Core operating structure','Self, expression and inner regulation','Relationships and reciprocity','Work, responsibility and public direction','Resources, security and dependence','Pressure and adaptation','Supporting flow','Longer-range development','Integrated reading'],
 'zh-Hans':['命盘总览','核心运作结构','自我、表达与内在调节','关系与互惠','工作、责任与公共方向','资源、安全与依赖','压力与适应','支持性流动','长期发展','整合阅读']
};
function render(){
 document.title=lang()==='zh-Hans'?'占星 — PHI OS':'Astrology — PHI OS';
 const c=copy(),intake=root.querySelector('[data-method-native-intake]');intake?.remove();
 root.innerHTML=`<div class="ast-wrap"><header class="ast-hero" id="ast-top"><div><p class="ast-kicker">PHI OS · ${t('ASTROLOGY','占星')}</p><h1>${esc(c.title)}</h1><p>${esc(c.lead)}</p><div class="ast-actions"><button class="ast-button primary" data-ast-direction="chart">${esc(c.chart)}</button><button class="ast-button" data-ast-direction="reality">${esc(c.reality)}</button></div><p class="ast-preview-note">${esc(c.paidContextLabel)}</p><p><a href="#ast-introduction">${esc(c.nav[1])}</a> · <a href="#ast-history">${esc(c.nav[2])}</a> · <a href="#ast-report">${esc(c.nav[5])}</a></p></div><figure class="ast-hero-art"><img data-ast-hero hidden alt="${t('Astrology · existing method illustration','占星 · 现有方法意象图')}" decoding="async" fetchpriority="high"></figure></header><nav class="ast-section-nav" aria-label="${t('On this page','本页导航')}">${ids.map((id,i)=>`<a href="#${id}">${esc(c.nav[i])}</a>`).join('')}</nav><section class="ast-section" id="ast-chart"><h2>${esc(c.nav[0])}</h2><p>${t('Use birth details for your free chart. Optional situation text is kept separately and is not analyzed in the free reading.','出生资料用于免费星盘；可选现实文字单独保留，免费阅读不会分析它。')}</p></section><section class="ast-section" id="ast-introduction"><h2>${esc(c.introTitle)}</h2>${c.intro.map(([title,...parts],i)=>`<article class="ast-article"><h3>${esc(title)}</h3>${parts.map(p=>`<p>${esc(p)}</p>`).join('')}<figure class="ast-inline-diagram">${astrologyTeachingDiagram([0,1,1,1,2,0,2,3][i],lang()==='zh-Hans')}</figure></article>`).join('')}</section><section class="ast-section" id="ast-history"><h2>${esc(c.historyTitle)}</h2><nav class="ast-timeline" aria-label="${t('Historical sections','历史章节')}">${c.history.map(([h],i)=>`<a href="#ast-era-${i}">${String(i+1).padStart(2,'0')} · ${esc(h)}</a>`).join('')}</nav>${c.history.map(([h,...p],i)=>`<article class="ast-article" id="ast-era-${i}"><h3>${esc(h)}</h3>${p.map(x=>`<p>${esc(x)}</p>`).join('')}</article>`).join('')}</section><section class="ast-section" id="ast-structure"><h2>${esc(c.structureTitle)}</h2><div class="ast-teaching">${c.diagramLabels.map((h,i)=>`<figure><h3>${esc(h)}</h3>${astrologyTeachingDiagram(i,lang()==='zh-Hans')}<figcaption>${esc(c.diagramNotes[i])}</figcaption></figure>`).join('')}</div></section><section class="ast-section" id="ast-phi-reading"><h2>${esc(c.lensTitle)}</h2>${paragraphs(c.lens.map(([h,p])=>[h,p]))}</section><section class="ast-section" id="ast-report"><h2>${esc(c.reportTitle)}</h2><p>${esc(c.reportLead)}</p><details class="ast-report-outline"><summary>${t('Report chapters and reading order','报告章节与阅读顺序')}</summary><p>${t('After the fixed introduction and chart overview, follow the relationships across chapters rather than reading a single statement in isolation. The final integrated chapter brings the earlier themes together.','先读固定导读与命盘总览，再沿章节比较主题之间的联系；不要把一句话脱离整盘。最后的整合阅读回到前面各章的关系。')}</p><ol>${chapterTitles[lang()].map(h=>`<li>${esc(h)}</li>`).join('')}</ol></details><div data-ast-reader></div><div data-ast-offer></div></section><section class="ast-section ast-sources"><h2>${esc(c.sourcesTitle)}</h2><ul>${AST_ENTRY_SOURCES.map(([label,url])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('')}</ul></section></div><dialog data-ast-zoom><button class="ast-button" data-ast-close>${esc(c.close)}</button><div data-ast-zoom-content></div></dialog>`;
 const chart=root.querySelector('#ast-chart');
 if(intake)chart.append(intake);else{installMethodNativeIntakeR2(root,'astrology');const host=root.querySelector('[data-method-native-intake]');if(host)chart.append(host);}
 root.querySelector('[data-method-native-reading]')?.remove();
 root.querySelector('[data-ast-close]').onclick=()=>root.querySelector('[data-ast-zoom]').close();
 root.querySelectorAll('[data-ast-direction]').forEach(b=>b.onclick=()=>chooseDirection(b.dataset.astDirection));
 bindHero();renderReader();renderOffer();prepareNative();if(lastView)renderSituation(lastView);
}
async function bindHero(){
 const image=root.querySelector('[data-ast-hero]');if(!image)return;
 image.onerror=()=>{image.hidden=true;image.removeAttribute('src');};image.onload=()=>{image.hidden=image.naturalWidth===0;};
 try{hero??=await resolveUnifiedPublicVisual('METHOD-ASTROLOGY-HERO');if(hero.renderable){image.src=hero.src;image.width=hero.width||1600;image.height=hero.height||1000;}}catch{image.hidden=true;}
}
function chooseDirection(value){
 direction=value==='reality'?'reality':'chart';root.dataset.astDirection=direction;
 const host=root.querySelector('[data-method-native-intake]');host?.querySelector('[data-native-open]')?.click();
 const box=root.querySelector('[data-ast-situation]');if(box){box.hidden=direction!=='reality'&&!box.querySelector('textarea')?.value;if(direction==='reality')box.querySelector('textarea')?.focus({preventScroll:true});else root.querySelector('[name=birthDate]')?.focus({preventScroll:true});}
 host?.scrollIntoView({behavior:'smooth',block:'start'});
 root.querySelectorAll('[data-ast-direction]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.astDirection===direction)));
}
function prepareNative(){
 const form=root.querySelector('[data-cx-personal-form]');if(!form)return;
 if(!form.dataset.astProfessionalPrepared){
  form.dataset.astProfessionalPrepared='true';
  // Scope only this dedicated AST form; original shared handlers and consent survive.
  form.querySelectorAll('#cx-r12-profile,.cx-personal-other-perspectives,[data-cx-external-profile-intake],.cx-r12-input-flow,#cx-r12-birth-intro').forEach(n=>n.remove());
  form.querySelectorAll('[data-cx-traditional-sex],[data-cx-numerology-details],[data-cx-reading-contract]').forEach(n=>n.remove());
  const about=form.querySelector('#cx-r12-about-you');const displayName=form.elements.reportSubjectName;if(about&&displayName){displayName.type='hidden';displayName.value=copy().chartHeading;form.append(displayName);about.remove();}
  const adaptive=form.querySelector('[data-cx-adaptive-input]');adaptive?.querySelectorAll(':scope > .cx-r12-input-stage-head,:scope > .cx-p1-section-head').forEach(n=>n.remove());
  const intent=form.elements.intent;if(intent){
   const oldLabel=intent.closest('label');const box=document.createElement('section');box.className='ast-situation';box.dataset.astSituation='';
   const label=document.createElement('label');label.htmlFor='ast-situation-text';label.dataset.astSituationLabel='';intent.id='ast-situation-text';intent.rows=6;intent.removeAttribute('name');intent.dataset.astRealityDraft='';intent.value=situationDraft;
   const neutral=document.createElement('input');neutral.type='hidden';neutral.name='intent';neutral.value='';form.append(neutral);
   const hint=document.createElement('p');hint.dataset.astSituationHint='';
   const organize=document.createElement('button');organize.type='button';organize.className='ast-button';organize.dataset.astOrganize='';
   const note=document.createElement('div');note.dataset.astSituationDraft='';note.setAttribute('aria-live','polite');
   const cancel=document.createElement('button');cancel.type='button';cancel.className='ast-button';cancel.dataset.astCancelSituation='';
   box.append(label,intent,hint,organize,cancel,note);form.before(box);oldLabel?.remove();
   intent.addEventListener('input',()=>{situationDraft=intent.value;});
   organize.onclick=()=>{situationDraft=intent.value;note.replaceChildren();if(situationDraft){const raw=document.createElement('p');raw.textContent=situationDraft;const status=document.createElement('p');status.textContent=copy().noBirth;note.append(raw,status);}renderSituation(lastView);};
   cancel.onclick=()=>{situationDraft='';intent.value='';note.replaceChildren();renderSituation(lastView);};
  }
  const add=document.createElement('button');add.type='button';add.className='ast-button';add.dataset.astAddSituation='';add.onclick=()=>chooseDirection('reality');form.append(add);
 }
 const name=form.elements.reportSubjectName;if(name&&!name.value)name.value=copy().chartHeading;
 const target=form.querySelector('[data-cx-shared-target-context]');if(target&&!target.parentElement.hasAttribute('data-ast-target-details')){const details=document.createElement('details');details.dataset.astTargetDetails='';const summary=document.createElement('summary');summary.dataset.astTargetSummary='';target.before(details);details.append(summary,target);}
 setText(form.querySelector('[data-ast-target-summary]'),t('Add a target time layer (optional)','加入目标时间层（可选）'));
 const submit=form.querySelector('[data-cx-personal-submit]');if(submit){submit.dataset.cxEn='Calculate my free chart';submit.dataset.cxZh='查看我的免费星盘';setText(submit,t('Calculate my free chart','查看我的免费星盘'));}
 const c=copy(),intent=root.querySelector('[data-ast-reality-draft]'),box=root.querySelector('[data-ast-situation]');
 if(box){setText(box.querySelector('[data-ast-situation-label]'),c.situationTitle);setText(box.querySelector('[data-ast-situation-hint]'),c.freeContextNote);setText(box.querySelector('[data-ast-organize]'),c.organize);setText(box.querySelector('[data-ast-cancel-situation]'),c.cancelSituation);box.hidden=direction!=='reality'&&!intent?.value;}
 if(intent)intent.placeholder=c.situationPrompt;
 const placeholders={birthPlaceQuery:t('Search your birth town or city','搜索出生城镇或城市'),reportSubjectName:t('Name to display in this reading','本次阅读显示的名字'),sharedTargetPlaceQuery:t('Search the target place','搜索目标地点')};
 for(const [name,p]of Object.entries(placeholders)){const input=form.elements[name];if(input)input.placeholder=p;}
 setText(form.querySelector('[data-ast-add-situation]'),c.reality);
 const guided=root.querySelector('[data-guided-reality]');if(guided&&!guided.parentElement?.hasAttribute('data-ast-guided-extra')){
  const details=document.createElement('details');details.dataset.astGuidedExtra='';const summary=document.createElement('summary');summary.textContent=t('Existing guided intake','既有引导输入');guided.before(details);details.append(summary,guided);details.hidden=true; // R3: preserve owner node but do not expose its free analysis/answer controls here.
   guided.querySelectorAll('button').forEach(button=>button.disabled=true);
 }
}
function renderSituation(view){
 const result=root.querySelector('[data-cx-personal-results]');if(!result)return;
 result.querySelector('[data-ast-context-result]')?.remove();
 if(situationDraft){const section=document.createElement('section');section.dataset.astContextResult='';section.className='ast-context-output';const title=document.createElement('h2');title.textContent=copy().draftLabel;const raw=document.createElement('p');raw.textContent=situationDraft;const note=document.createElement('p');note.textContent=copy().freeContextNote;const edit=document.createElement('button');edit.type='button';edit.className='ast-button';edit.textContent=copy().edit;edit.onclick=()=>chooseDirection('reality');section.append(title,raw,note,edit);result.append(section);}
 // Free entry never renders situation analysis from a response or from local keywords.
 const wheel=result.querySelector('.ast-cx-r3-wheel svg,.cx-ast-wheel svg,.cx-astw-wheel svg');
 if(wheel&&!result.querySelector('[data-ast-zoom-chart]')){const button=document.createElement('button');button.type='button';button.className='ast-button';button.dataset.astZoomChart='';button.textContent=copy().zoom;button.onclick=()=>showZoom(wheel.cloneNode(true));wheel.parentElement.append(button);}
 if(view&&!result.querySelector('[data-ast-result-offer]')){const section=document.createElement('section');section.dataset.astResultOffer='';section.innerHTML=offerMarkup();result.append(section);bindOfferVisual(section);}
}
function offerMarkup(){
 const offer=preentryFullOffer(catalog?.products,'AST'),p=offer.product;
 const price=p&&Number.isSafeInteger(p.amountMinor)&&p.amountMinor>=0&&typeof p.currency==='string'?new Intl.NumberFormat(lang()==='en'?'en':'zh-CN',{style:'currency',currency:p.currency}).format(p.amountMinor/100):t('Price is confirmed in your account','价格由账户流程确认');
 const available=offer.state==='SERVER_SETUP_REQUIRED'&&p.checkoutAvailable===true;
 return `<section class="ast-full-showcase"><div><h3>${t('Your Full Astrology Report','你的占星完整报告')}</h3><p>${t('Continue from the chart to the accepted whole-chart chapters, with personal interpretation and PDF delivery within the product’s actual scope.','从真实星盘继续进入已接受的整盘章节，在商品实际范围内提供个人化阅读及PDF交付。')}</p><p><strong>${esc(price)}</strong>${p?.pricingVersion?` · ${esc(p.pricingVersion)}`:''}</p><p data-ast-purchase-state="${available?'ACCOUNT_REVIEW_REQUIRED':'UNAVAILABLE'}">${available?t('Sign in, review the subject and terms, and confirm the current purchase offer.','请先登录，复核报告对象与条款，再确认当前购买方案。'):t('New purchase or delivery availability has not been established here. Check your account for the current offer and existing reports.','此处尚未确认新购买或交付可用。请在账户核对当前方案与已有报告。')}</p><p>${t('Situation integration is not promised unless this product explicitly includes it and the server verifies payment, entitlement and your permission for the text.','只有商品明确包含现实整合，且服务端验证支付、权益与这段文字的用途同意后，才提供该项深入阅读。')}</p><a class="ast-button" href="/account/?product=COM-REPORT-ASTROLOGY-FULL&locale=${lang()}">${t('Sign in or review account offers','注册／登录并核对账户方案')}</a></div><figure><img data-ast-product-visual hidden alt="${t('Full Astrology Report product visual; not a personal chart','占星完整报告商品视觉，非个人星盘')}"/></figure></section>`;
}
function bindOfferVisual(scope){const img=scope.querySelector('[data-ast-product-visual]');if(!img||!productVisual)return;img.onerror=()=>{img.hidden=true;};img.onload=()=>{img.hidden=img.naturalWidth===0;};img.src=productVisual.publicUrl;img.width=productVisual.width;img.height=productVisual.height;}
function renderOffer(){const holder=root.querySelector('[data-ast-offer]');if(holder){holder.innerHTML=offerMarkup();bindOfferVisual(holder);}}
function ensureResultEnhancements(){
 const result=root.querySelector('[data-cx-personal-results]');if(!result||result.hidden)return;
 const wheel=result.querySelector('.ast-cx-r3-wheel svg,.cx-ast-wheel svg,.cx-astw-wheel svg');
 if(wheel&&!result.querySelector('[data-ast-zoom-chart]')){const b=document.createElement('button');b.type='button';b.className='ast-button';b.dataset.astZoomChart='';b.textContent=copy().zoom;b.onclick=()=>showZoom(wheel.cloneNode(true));wheel.parentElement.append(b);}
 if(!result.querySelector('[data-ast-result-offer]')){const offer=document.createElement('section');offer.dataset.astResultOffer='';offer.innerHTML=offerMarkup();result.append(offer);bindOfferVisual(offer);}
}
function showZoom(node){const dialog=root.querySelector('[data-ast-zoom]');dialog.querySelector('[data-ast-zoom-content]').replaceChildren(node);dialog.showModal();}
function renderReader(){
 const holder=root.querySelector('[data-ast-reader]');if(!holder)return;const c=copy(),pages=manifest?.pages||[];
 if(!pages.length){holder.innerHTML=`<p>${esc(c.readerPending)}</p>`;return;}
 pageIndex=Math.min(pageIndex,pages.length-1);const p=pages[pageIndex];
 holder.innerHTML=`<div class="ast-reader-stage"><img src="/${esc(p.path)}" alt="${esc(p.title?.[lang()]||p.role)} · ${pageIndex+1}" data-ast-report-page></div><div class="ast-reader-controls"><button class="ast-button" data-ast-page-prev ${pageIndex===0?'disabled':''}>${esc(c.previous)}</button><output aria-live="polite">${esc(c.page)} ${pageIndex+1} / ${pages.length}</output><button class="ast-button" data-ast-page-next ${pageIndex===pages.length-1?'disabled':''}>${esc(c.nextPage)}</button><button class="ast-button" data-ast-page-zoom>${esc(c.zoomPage)}</button></div>${pages.length<6?`<p class="ast-preview-note">${esc(c.readerPending)}</p>`:''}`;
 const img=holder.querySelector('img');img.onerror=()=>{img.hidden=true;const note=document.createElement('p');note.className='ast-failure';note.textContent=t('This report image could not load. The remaining guide is still readable.','这张报告图像暂时无法载入，其他导读仍可阅读。');img.after(note);holder.querySelector('[data-ast-page-zoom]').disabled=true;};
 holder.querySelector('[data-ast-page-prev]').onclick=()=>{pageIndex--;renderReader();};holder.querySelector('[data-ast-page-next]').onclick=()=>{pageIndex++;renderReader();};holder.querySelector('[data-ast-page-zoom]').onclick=()=>showZoom(img.cloneNode(true));
}
if(root){
 fetch('/api/commerce-catalog',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(x=>{if(x?.success===true&&Array.isArray(x.products)){catalog=x;renderOffer();}}).catch(()=>{});
 fetch('/content/web-production/registries/commerce-product-visuals-v1.json').then(r=>r.ok?r.json():null).then(x=>{const matches=x?.assets?.filter(v=>v.productId==='COM-REPORT-ASTROLOGY-FULL'&&v.publicDisplayPolicy?.state==='DISPLAY_WITH_PRODUCT_BOUNDARIES')||[];if(matches.length===1){productVisual=matches[0];renderOffer();}}).catch(()=>{});
 render();new MutationObserver(()=>{prepareNative();ensureResultEnhancements();}).observe(root,{childList:true,subtree:true});
 addEventListener('phios:localechange',render);
 addEventListener('phios:method-reading-ready',event=>{lastView=event.detail?.view||event.detail;renderSituation(lastView);});
 fetch('/assets/customer-ui/media/astrology-professional-entry-r1/report-pages.json').then(r=>{if(!r.ok)throw Error('REPORT_LIST_UNAVAILABLE');return r.json();}).then(x=>{manifest=x;renderReader();}).catch(()=>{});
}
