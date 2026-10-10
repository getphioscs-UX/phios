import {customerAssetRegistry,hydrateCustomerAssets} from '../assets.js';
const path=location.pathname.replace(/index\.html$/,'');
const targets={
 '/':[[1,'.cx-home-beginning:nth-child(1)',true],[2,'.cx-home-beginning:nth-child(2)',true],[3,'.cx-home-beginning:nth-child(3)',true],[4,'.cx-home-beginning:nth-child(4)',true],[5,'.cx-home-beginning:nth-child(5)',true],[6,'.cx-home-beginning:nth-child(6)',true],[7,'[data-cx-home-section="H02"] .cx-container--wide']],
 '/explore/start/':[[8,'.cx-explore-ending .cx-container']],
 '/reality/':[[10,'[data-cx-panel="navigation"]'],[11,'[data-cx-panel="history"]'],[12,'[data-cx-panel="reading"]'],[13,'#navigation-network-principles'],[15,'[data-cx-panel="navigation"]'],[16,'[data-cx-panel="current"]'],[17,'[data-cx-panel="review"]']],
 '/account/':[[18,'.cx-account-hero'],[19,'.cx-account-shortcuts .cx-card:last-child'],[20,'#account-reports'],[21,'#account-persons'],[22,'#account-drafts'],[23,'[data-cx-account-continuity]'],[24,'[data-r5-account-auth]']],
 '/perspectives/profile/':[[33,'#profile-modes .cx-container']]
}[path]||[];
const english={1:'Start with a question',2:'Start with reading',3:'Start with your current reality',4:'Choose a perspective',5:'Continue over time',6:'Find professional help',7:'How the platform connects',8:'Choose your starting point',10:'Directions and positions',11:'Versions and changes',12:'Evidence and interpretation',13:'How a navigation network forms',15:'Choices and constraints',16:'Keep unknowns visible',17:'Observe, review and continue',18:'Your PHI OS workspace',19:'Consent and access scope',20:'Report delivery and reopening',21:'People and permissions',22:'Timeline and versions',23:'Temporary and saved work',24:'Recovering access',33:'Sources for Personal Evidence'};
if(targets.length){
 const registry=await customerAssetRegistry();
 const zh=()=>document.documentElement.lang.toLowerCase().startsWith('zh');
 function localized(node,en,cn){node.dataset.cxEn=en;node.dataset.cxZh=cn;node.textContent=zh()?cn:en;}
 function bind(){for(const [sequence,selector,inline]of targets){
  const host=document.querySelector(selector),asset=registry.entries.find(x=>x.r5Sequence===sequence);
  if(!host||!asset?.available||host.querySelector('[data-r5-guide="'+asset.assetId+'"]'))continue;
  const node=document.createElement(inline?'figure':'details');node.className='r5-context-guide';node.dataset.r5Guide=asset.assetId;
  if(!inline){const summary=document.createElement('summary');localized(summary,'Visual guide: '+english[sequence],'图示说明：'+asset.titleZh);node.append(summary);}
  const figure=inline?node:document.createElement('figure'),link=document.createElement('a'),image=document.createElement('img');link.href=asset.publicUrl;link.target='_blank';link.rel='noopener';image.dataset.cxAsset=asset.assetId;image.alt=english[sequence]+' illustration';image.width=asset.width;image.height=asset.height;image.loading='lazy';image.decoding='async';link.append(image);figure.append(link);
  if(!inline){const caption=document.createElement('figcaption');localized(caption,english[sequence]+'. This is an illustration, not your data, access status or a calculated result. Select the image to view full size.',asset.titleZh+'。这是说明图，不是你的资料、权限状态或计算结果。点击图片查看完整大小。');figure.append(caption);node.append(figure);}
  if(inline){host.prepend(node);hydrateCustomerAssets(node);}else{if(sequence===33)host.prepend(node);else host.append(node);node.addEventListener('toggle',()=>{if(node.open&&!node.dataset.hydrated){node.dataset.hydrated='true';hydrateCustomerAssets(node);}});}
 }}
 bind();let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;bind();});});observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
 window.addEventListener('phios:localechange',()=>document.querySelectorAll('[data-r5-guide] [data-cx-en]').forEach(node=>node.textContent=zh()?node.dataset.cxZh:node.dataset.cxEn));
}
