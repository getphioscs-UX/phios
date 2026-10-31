import { applyCustomerLocale } from '../locale.js';

const METHOD_AUTHORITY_URL='/content/professional/method-production-activation/registries/method-registry-v5.json';

const METHOD_COPY=Object.freeze({
  TAROT:Object.freeze({
    name:'Tarot',
    nameZh:'塔罗',
    lens:'Reflective symbolic lens',
    lensZh:'反思性的象征视角',
    summary:'Use a governed spread to surface questions, tensions and possible ways of looking at the situation without presenting the cards as guaranteed prediction.',
    summaryZh:'透过受治理的牌阵看见问题、张力与可能的观察角度，但不会把牌面呈现为保证发生的预测。',
    href:'/perspectives/tarot/'
  }),
  ZI_WEI_DOU_SHU:Object.freeze({
    name:'Zi Wei',
    nameZh:'紫微斗数',
    lens:'Structural and timing lens',
    lensZh:'结构与时间视角',
    summary:'Read chart structure and timing as an interpretive framework for patterns and context, while keeping uncertainty and non-prediction boundaries visible.',
    summaryZh:'把命盘结构与时间作为理解模式和情境的解释框架，同时保留不确定性与非预测边界。',
    href:'/perspectives/personal/'
  }),
  ASTROLOGY:Object.freeze({
    name:'Astrology',
    nameZh:'占星',
    lens:'Symbolic chart lens',
    lensZh:'象征性的星盘视角',
    summary:'Use chart relationships and timing as an interpretive perspective when it is ready for public use.',
    summaryZh:'当它已经可以公开使用时，以星盘关系与时间作为解释性视角。',
    href:'/perspectives/personal/'
  }),
  BAZI:Object.freeze({
    name:'BaZi',
    nameZh:'八字',
    lens:'Pattern and timing lens',
    lensZh:'模式与时间视角',
    summary:'Use governed BaZi structure and timing as an interpretive perspective when it is ready for public use.',
    summaryZh:'当它已经可以公开使用时，以受治理的八字结构与时间作为解释性视角。',
    href:'/perspectives/personal/'
  }),
  NUMEROLOGY:Object.freeze({
    name:'Numerology',
    nameZh:'数字学',
    lens:'Numeric symbolic lens',
    lensZh:'数字象征视角',
    summary:'Use governed numeric patterns as a bounded interpretive lens when it is ready for public use.',
    summaryZh:'当它已经可以公开使用时，以受治理的数字模式作为有边界的解释性视角。',
    href:'/perspectives/personal/'
  })
});

function productionEligible(method){
  return method?.productionEligible===true && Array.isArray(method?.blockingReasons) && method.blockingReasons.length===0;
}

function statusFor(method){
  if(productionEligible(method))return 'available';
  if(method?.state==='BLOCKED')return 'unavailable';
  if(method?.state==='ACTIVATION_CANDIDATE'||method?.state==='VALIDATION')return 'in-review';
  return 'unknown';
}

function statusCopy(kind){
  if(kind==='available')return {en:'Available',zh:'可用'};
  if(kind==='unavailable')return {en:'Unavailable',zh:'暂不可用'};
  if(kind==='in-review')return {en:'In review',zh:'审核中'};
  return {en:'Unknown',zh:'状态未知'};
}

function createPerspectiveCard(method){
  const copy=METHOD_COPY[method.methodCode];
  if(!copy)return null;
  const kind=statusFor(method);
  const state=statusCopy(kind);
  const article=document.createElement('article');
  article.className='cx-card cx-card--perspective cx-home-perspective';
  article.dataset.cxMethod=method.methodCode;
  article.dataset.cxAvailabilitySource=METHOD_AUTHORITY_URL;
  article.innerHTML=`
    <span class="cx-status cx-status--${kind}" data-cx-en="${state.en}" data-cx-zh="${state.zh}">${state.en}</span>
    <div class="cx-stack cx-stack--tight">
      <h3 class="cx-heading-2" data-cx-en="${copy.name}" data-cx-zh="${copy.nameZh}">${copy.name}</h3>
      <p class="cx-home-perspective__lens cx-label" data-cx-en="${copy.lens}" data-cx-zh="${copy.lensZh}">${copy.lens}</p>
    </div>
    <p class="cx-body" data-cx-en="${copy.summary}" data-cx-zh="${copy.summaryZh}">${copy.summary}</p>
    <a class="cx-button cx-button--text cx-home-perspective__link" href="${copy.href}" data-cx-en="Open perspective →" data-cx-zh="打开这个视角 →">Open perspective →</a>`;
  return article;
}

function createEmptyState(){
  const article=document.createElement('article');
  article.className='cx-card cx-card--unknown cx-home-perspectives__empty cx-stack';
  article.innerHTML=`<span class="cx-status cx-status--unknown" data-cx-en="Availability not established" data-cx-zh="尚未确认可用状态">Availability not established</span><h3 class="cx-heading-2" data-cx-en="No public method perspective is currently established here." data-cx-zh="目前这里还没有已确认公开可用的方法视角。">No public method perspective is currently established here.</h3><p class="cx-body" data-cx-en="You can still explore Perspectives to see other source types and their current boundaries." data-cx-zh="你仍然可以进入 Perspectives，查看其他来源类型及其当前边界。">You can still explore Perspectives to see other source types and their current boundaries.</p><a class="cx-button cx-button--text" href="/perspectives/" data-cx-en="Explore Perspectives →" data-cx-zh="探索不同视角 →">Explore Perspectives →</a>`;
  return article;
}

function createAuthorityFailure(){
  const article=document.createElement('article');
  article.className='cx-card cx-card--unknown cx-home-perspectives__empty cx-stack';
  article.innerHTML=`<span class="cx-status cx-status--unknown" data-cx-en="Availability could not be confirmed" data-cx-zh="暂时无法确认可用状态">Availability could not be confirmed</span><h3 class="cx-heading-2" data-cx-en="Perspective availability is temporarily unavailable." data-cx-zh="目前暂时无法读取视角的可用状态。">Perspective availability is temporarily unavailable.</h3><p class="cx-body" data-cx-en="PHI OS will not guess or show a method as available when its current availability cannot be confirmed." data-cx-zh="当当前可用状态无法确认时，PHI OS 不会猜测，也不会把某个方法显示为可用。">PHI OS will not guess or show a method as available when its current availability cannot be confirmed.</p><a class="cx-button cx-button--text" href="/perspectives/" data-cx-en="Open Perspectives →" data-cx-zh="打开 Perspectives →">Open Perspectives →</a>`;
  return article;
}

async function renderCurrentPerspectives(){
  const root=document.querySelector('[data-cx-home-perspectives]');
  if(!root)return;
  try{
    const response=await fetch(METHOD_AUTHORITY_URL,{cache:'no-cache'});
    if(!response.ok)throw new Error(`CX_HOME_METHOD_AUTHORITY_${response.status}`);
    const authority=await response.json();
    const eligible=(authority.methods||[]).filter(productionEligible).map(createPerspectiveCard).filter(Boolean);
    root.replaceChildren(...(eligible.length?eligible:[createEmptyState()]));
    root.dataset.cxAuthorityState='resolved';
    root.dataset.cxAuthorityRegistry=authority.registryCode||'';
  }catch(error){
    root.replaceChildren(createAuthorityFailure());
    root.dataset.cxAuthorityState='unavailable';
    console.warn('[CX home perspectives]',error.message);
  }
  applyCustomerLocale(document.documentElement.lang,document);
}

renderCurrentPerspectives();
