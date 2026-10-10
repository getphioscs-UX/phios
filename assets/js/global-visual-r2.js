import {resolveApprovedVisual} from './runtime/web-production/asset-resolver.js';
const zh=()=>document.documentElement.lang.toLowerCase().startsWith('zh');
const localized=()=>{for(const n of document.querySelectorAll('[data-vr2-en]'))n.textContent=n.getAttribute(zh()?'data-vr2-zh':'data-vr2-en');for(const n of document.querySelectorAll('[data-vr2-en-alt]'))n.alt=n.getAttribute(zh()?'data-vr2-zh-alt':'data-vr2-en-alt');};
localized();new MutationObserver(localized).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
const resolved=new Map();
export async function hydrateApprovedVisuals(root=document){
 await Promise.all([...root.querySelectorAll('img[data-approved-visual]')].map(async image=>{
  if(image.dataset.vr2Bound)return;image.dataset.vr2Bound='loading';
  try{const code=image.dataset.approvedVisual;if(!resolved.has(code))resolved.set(code,resolveApprovedVisual(code));const a=await resolved.get(code);
   image.width=a.width||image.width||1600;image.height=a.height||image.height||1000;image.decoding='async';
   if(!image.loading)image.loading=image.closest('[data-vr2-role="HERO"]')?'eager':'lazy';
   if(image.loading==='eager')image.fetchPriority='high';
   if(a.srcset){image.srcset=a.srcset;image.sizes='(max-width: 768px) 100vw, 1120px';}
   const link=image.closest('a[data-vr2-inspect]');if(link)link.href=a.src;
   image.addEventListener('load',()=>{image.dataset.vr2Bound='decoded';image.nextElementSibling?.matches('[data-vr2-retry]')&&image.nextElementSibling.remove();},{once:true});
   image.addEventListener('error',()=>{image.dataset.vr2Bound='failed';const retry=document.createElement('button');retry.type='button';retry.dataset.vr2Retry='';retry.textContent=zh()?'重新加载图片':'Reload image';retry.onclick=()=>{image.dataset.vr2Bound='';image.hidden=false;retry.remove();image.parentElement.querySelector('[data-vr2-failure-state]')?.remove();hydrateApprovedVisuals(image.parentElement);};image.after(retry);if(image.dataset.approvedVisual!=='PHIOS-ILLUSTRATION-TEMPORARY-LOAD-FAILURE-v1.webp')resolveApprovedVisual('PHIOS-ILLUSTRATION-TEMPORARY-LOAD-FAILURE-v1.webp').then(a=>{const state=document.createElement('img');state.dataset.vr2FailureState='';state.src=a.src;state.alt=zh()?'图片未能载入，可以重试。':'The image could not load. You can retry.';state.width=a.width||1600;state.height=a.height||1000;state.loading='lazy';image.hidden=true;retry.before(state);}).catch(()=>{});},{once:true});
   image.src=a.src;
  }catch(error){image.dataset.vr2Bound='resolution-failed';image.dataset.vr2Error=error.message;}
 }));
}
let trigger;
const dialog=document.createElement('dialog');dialog.className='vr2-lightbox';dialog.setAttribute('aria-label','Full resolution visual / 完整图像');
const close=document.createElement('button');close.type='button';close.textContent='Close / 关闭';close.onclick=()=>dialog.close();
const full=document.createElement('img');dialog.append(close,full);document.body.append(dialog);
document.addEventListener('click',event=>{const link=event.target.closest('a[data-vr2-inspect]');if(!link||!link.href)return;event.preventDefault();trigger=link;full.src=link.href;full.alt=link.querySelector('img')?.alt||'';dialog.showModal();});
dialog.addEventListener('close',()=>trigger?.focus());
hydrateApprovedVisuals();
document.addEventListener('click',async event=>{const button=event.target.closest('[data-vr2-customer-retry]');if(!button)return;const {hydrateCustomerAssets}=await import('../customer-ui/js/assets.js');hydrateCustomerAssets(button.parentElement);});
const surface=document.body.dataset.cxSurface||'';
document.body.dataset.vr2Density=/ACCOUNT|REPORT/.test(surface)?'WORKSPACE':/BOOK|ARTICLE|CONCEPT|KNOWLEDGE|ACADEMY/.test(surface)?'KNOWLEDGE_READING':/PERSONAL_REALITY|TAROT|ICHING|FINANCIAL|ASK|CONFIGURATION/.test(surface)?'PRODUCT_EXPERIENCE':'MARKET_ENTRY';
const texture=document.body.dataset.vr2Density==='KNOWLEDGE_READING'?'PHI-OS-IVORY-GRAIN.webp':'PHI-OS-SOFT-MIST.webp';
resolveApprovedVisual(texture).then(a=>document.body.style.setProperty('--vr2-texture',`url("${a.src}")`)).catch(()=>{});
