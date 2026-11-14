import {declaredPageHero} from '../../customer-ui/js/visual-slot-owner.js';
import { resolvePublicAssetForWeb, fetchPublicAssetConfig, resolvePublicAsset, resolveApprovedVisual } from '../runtime/web-production/asset-resolver.js';

const VISUAL_REGISTRY='/content/web-production/registries/client-visual-asset-registry-v1.7.json';
import {BRCL_VISUAL_SURFACES as MAP,brclOwnsEditorialHero} from './brand-research-commerce-legal-contract.js';

async function resolveIllustration(code){
  try{return await resolveApprovedVisual(code,{surface:document.body.dataset.brclSurface});}catch(error){if(error.code==='APPROVED_VISUAL_WITHHELD')return null;}
  try{
    const [vr,config]=await Promise.all([fetch(VISUAL_REGISTRY,{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():Promise.reject()),fetchPublicAssetConfig()]);
    const a=(vr.assets||[]).find(x=>x.sequence===code||x.assetCode===code);
    if(!a||a.r2?.remoteVerified!==true) return null;
    const registry={bucket:'phios-public-assets',assets:[{asset_code:code,object_key:a.r2.objectKey,category:'illustration',family:'illustration',format:'webp',content_type:'image/webp',verification:'verified-owner-r2-upload'}]};
    return resolvePublicAsset({registry,assetCode:code,publicBaseUrl:config.publicAssetBaseUrl,surface:document.body.dataset.brclSurface});
  }catch{return null;}
}

function local(pair){return document.documentElement.lang?.toLowerCase().startsWith('zh')?pair[1]:pair[0]}

export async function decorate(){
 const body=document.body; const surface=body.dataset.brclSurface; if(!surface||!MAP[surface]) return; const cfg=MAP[surface];
 const main=document.querySelector('main'); if(!main) return;
 // The existing service layer owns this exact Hero/support pair. Reuse its
 // canonical successor and copy instead of promoting the next section to Hero.
 const serviceHero=main.querySelector(':scope > .sc-hero');
 const serviceImage=serviceHero?.querySelector('[data-sc-asset]');
 const serviceSupport=main.querySelector('[data-sc-support]');
 if(serviceImage?.dataset.scAsset===cfg.hero&&serviceSupport){
  serviceHero.dataset.visualSlot='MAIN_HERO';serviceHero.dataset.visualOwner='SERVICE_CONTINUITY';
  serviceSupport.dataset.visualOwner='SERVICE_CONTINUITY';body.dataset.brclInheritedOwner='SERVICE_CONTINUITY';
  return;
 }
 const hero=main.querySelector(':scope > section, :scope > .legal-hero, :scope > .checkout-hero') || main.firstElementChild;
 const composedHero=declaredPageHero(main);
 const editorialOwner=brclOwnsEditorialHero(main);
 if(hero&&(!editorialOwner||composedHero||body.dataset.pisHero)){
  for(const old of hero.querySelectorAll(':scope > .brcl-hero-media,:scope > .brcl-hero-wash')){old.hidden=true;old.dataset.visualSupersededBy=composedHero?'PAGE_COMPOSITION':'CLIENT_MASTHEAD';}
  hero.classList.remove('brcl-hero-ready');
  if(hero.dataset.visualOwner==='BRCL'){delete hero.dataset.visualOwner;delete hero.dataset.visualSlot;delete hero.dataset.visualAsset;}
  if(!editorialOwner)body.dataset.brclInheritedOwner='CLIENT_MASTHEAD';
 }
 if(composedHero){composedHero.dataset.visualSlot='MAIN_HERO';composedHero.dataset.visualOwner||='PAGE_COMPOSITION';body.dataset.brclInheritedOwner='PAGE_COMPOSITION';}
 else if(hero&&editorialOwner&&!body.dataset.pisHero){hero.dataset.visualSlot='MAIN_HERO';hero.dataset.visualOwner='BRCL';hero.dataset.visualAsset=cfg.hero;}
 if(hero && editorialOwner && !composedHero && !body.dataset.pisHero && !hero.querySelector('.brcl-hero-media')){
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
 const existingBridge=main.querySelector('[data-brcl-bridge]');
 if(existingBridge){
  existingBridge.querySelector('.brcl-kicker').textContent=local(cfg.kicker);
  existingBridge.querySelector('h2').textContent=local(cfg.title);
  existingBridge.querySelector('.brcl-bridge__grid > div > p:last-child').textContent=local(cfg.copy);
 }
}

decorate();
window.addEventListener('phios:locale-changed',decorate);
