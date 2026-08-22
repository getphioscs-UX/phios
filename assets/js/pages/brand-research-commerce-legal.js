import { resolvePublicAssetForWeb, fetchPublicAssetConfig, resolvePublicAsset } from '../runtime/web-production/asset-resolver.js';

const VISUAL_REGISTRY='/content/web-production/registries/client-visual-asset-registry-v1.7.json';
const MAP={
  ABOUT:{hero:'HERO-001',ill:'ILL-003',kicker:['A connected system','一个连接起来的系统'],title:['Books explain the model. The platform applies it. The Academy builds capability.','书籍解释模型，平台把它应用于现实，Academy 建立持续使用这种能力。'],copy:['PHI OS connects research, public knowledge, Reality Navigation and professional boundaries without collapsing them into one authority.','PHI OS 将研究、公共知识、Reality Navigation 与专业边界连接起来，但不会把它们混成单一权威。']},
  RESEARCH:{hero:'HERO-001',ill:'ILL-001',kicker:['Research & evidence','研究与证据'],title:['Research should make the limits of an interpretation easier to see.','研究应让一种解释的边界更容易被看见。'],copy:['PHI OS studies how different lenses reveal parts of reality, where they diverge, and how evidence and uncertainty can remain visible across time.','PHI OS 研究不同视角如何揭示现实的一部分、它们在哪里分歧，以及证据与不确定性如何在时间中保持可见。']},
  COMMERCE:{hero:'HERO-018',ill:'ILL-009',kicker:['Access with clear boundaries','清楚边界下的访问'],title:['Know what you are receiving before you continue.','在继续之前，先清楚知道你会得到什么。'],copy:['Access, payment, delivery and refund terms remain separate from knowledge, Reality and professional judgment.','访问、付款、交付与退款条款，与知识、Reality 及专业判断保持分离。']},
  READER:{hero:'HERO-016',ill:'ILL-007',kicker:['Human reading boundary','人类阅读边界'],title:['A reader can contribute perspective without becoming hidden authority.','Reader 可以提供视角，但不会成为隐藏的权威。'],copy:['Scope, consent, data sharing and responsibility remain visible before a professional or external reader enters the work.','在专业人士或 External Reader 进入之前，范围、同意、数据分享与责任必须保持可见。']},
  LEGAL:{hero:'HERO-017',ill:'ILL-010',kicker:['Trust is part of the product','信任本身就是产品的一部分'],title:['Privacy, AI use, terms and policy should remain readable at the moment they matter.','隐私、AI 使用、条款与政策，应在真正需要时保持可读。'],copy:['These pages state the boundaries that presentation, automation and professional services must not silently cross.','这些页面明确界定 presentation、自动化与专业服务不能静默跨越的边界。']}
};

async function resolveIllustration(code){
  try{
    const [vr,config]=await Promise.all([fetch(VISUAL_REGISTRY,{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():Promise.reject()),fetchPublicAssetConfig()]);
    const a=(vr.assets||[]).find(x=>x.sequence===code||x.assetCode===code);
    if(!a||a.r2?.remoteVerified!==true) return null;
    const registry={bucket:'phios-public-assets',assets:[{asset_code:code,object_key:a.r2.objectKey,category:'illustration',family:'illustration',format:'webp',content_type:'image/webp',verification:'verified-owner-r2-upload'}]};
    return resolvePublicAsset({registry,assetCode:code,publicBaseUrl:config.publicAssetBaseUrl,surface:document.body.dataset.brclSurface});
  }catch{return null;}
}

function local(pair){return document.documentElement.lang?.toLowerCase().startsWith('zh')?pair[1]:pair[0]}

async function decorate(){
 const body=document.body; const surface=body.dataset.brclSurface; if(!surface||!MAP[surface]) return; const cfg=MAP[surface];
 const main=document.querySelector('main'); if(!main) return;
 const hero=main.querySelector(':scope > section, :scope > .legal-hero, :scope > .checkout-hero') || main.firstElementChild;
 if(hero && !hero.querySelector('.brcl-hero-media')){
   hero.classList.add('brcl-hero-ready');
   const media=document.createElement('div'); media.className='brcl-hero-media'; media.setAttribute('aria-hidden','true');
   const img=document.createElement('img'); img.alt=''; img.loading='eager'; img.fetchPriority='high'; media.append(img);
   const wash=document.createElement('div'); wash.className='brcl-hero-wash'; wash.setAttribute('aria-hidden','true'); hero.prepend(wash); hero.prepend(media);
   try{const asset=await resolvePublicAssetForWeb(cfg.hero,{surface}); if(asset.renderable) img.src=asset.src;}catch{media.hidden=true}
 }
 if(!main.querySelector('[data-brcl-bridge]')){
   const bridge=document.createElement('section'); bridge.className='brcl-bridge'; bridge.dataset.brclBridge='true';
   bridge.innerHTML=`<div class="brcl-shell brcl-bridge__grid"><div><p class="brcl-kicker">${local(cfg.kicker)}</p><h2>${local(cfg.title)}</h2><p>${local(cfg.copy)}</p></div><figure class="brcl-visual"><img alt="" loading="lazy"></figure></div>`;
   const ref=hero?.nextElementSibling; if(ref) main.insertBefore(bridge,ref); else main.append(bridge);
   const ill=await resolveIllustration(cfg.ill); const fig=bridge.querySelector('.brcl-visual'); if(ill?.renderable){fig.querySelector('img').src=ill.src}else fig.hidden=true;
 }
}

decorate();
window.addEventListener('phios:locale-changed',decorate);
