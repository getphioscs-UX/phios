import {customerAssetRegistry,hydrateCustomerAssets} from '../assets.js';
const path=location.pathname.replace(/index\.html$/,'');
const targets={
 '/':[[1,'.cx-home-beginning:nth-child(1)',true],[2,'.cx-home-beginning:nth-child(2)',true],[3,'.cx-home-beginning:nth-child(3)',true],[4,'.cx-home-beginning:nth-child(4)',true],[5,'.cx-home-beginning:nth-child(5)',true],[6,'.cx-home-beginning:nth-child(6)',true]],
 '/reality/':[[9,'[data-cx-panel="overview"]'],[10,'[data-cx-panel="navigation"]'],[11,'[data-cx-panel="history"]'],[14,'[data-cx-panel="reading"]'],[15,'[data-cx-panel="navigation"]'],[16,'[data-cx-panel="current"]']],
 '/account/':[[18,'.cx-account-hero'],[19,'.cx-account-shortcuts .cx-card:last-child'],[20,'#account-reports'],[21,'#account-persons'],[22,'[data-released-reports]'],[23,'[data-cx-account-continuity]'],[24,'[data-r5-account-auth]'],[88,'[data-r6-account-permission-gate="true"]']],
 '/perspectives/profile/':[[33,'#profile-modes .cx-container'],[34,'#profile-modes .cx-container'],[35,'[data-prf-results] .cx-container'],[36,'[data-prf-workbench] .prf-guide'],[37,'[data-prf-dossier-dialog]'],[38,'[data-prf-handoff-panel]'],[39,'[data-prf-boundaries]']],
 '/perspectives/tarot/':[[40,'[data-reading-step="question"]'],[41,'[data-reading-step="spread"]'],[42,'[data-reading-step="draw"]'],[43,'[data-customer-layer="INTERPRETATION"]'],[44,'[data-customer-layer="REALITY"]'],[45,'[data-customer-layer="NEXT"]']]
 ,'/perspectives/iching/':[[46,'.icx-entry-paths']]
 ,'/perspectives/iching/consult/':[[47,'.icx-hexagram-pair'],[48,'.icx-hexagram-pair'],[49,'.icx-direct-reading'],[50,'.icx-reality-reading'],[51,'[data-r6-iching-continuity]']]
 ,'/knowledge/':[[63,'.cx-knowledge-heading']]
 ,'/knowledge/ask/':[[62,'[data-cx-contextual-ask-form]'],[71,'.cx-ask-poster',true],[89,'[data-r6-source-load-failure="true"]']]
 ,'/perspectives/relationship/':[[74,'[data-cx-relationship-state]'],[75,'[data-relationship-intake]']]
 ,'/professional/services/':[[53,'.cx-system-state'],[60,'[data-r6-cash-flow-game-scope]'],[61,'[data-r6-natural-healer-scope]']]
 ,'/professional/financial/':[[56,'[data-estate-form]'],[57,'[data-secure-draft="WILL"]'],[59,'#estate-planning .cx-card',true]]
 ,'/search/':[[68,'[data-cx-knowledge-search-form]'],[87,'[data-r6-no-matching-results="true"]']]
 ,'/academy/':[[69,'[data-navigation-academy]']]
 ,'/academy/lesson/':[[70,'[data-r6-learning-application]']]
 ,'/professional/appointments/':[[54,'[data-appointment-request-form]']]
 ,'/professional-consent-sharing.html':[[55,'#consentSharingForm']]
 ,'/professional-consent-sharing':[[55,'#consentSharingForm']]
 ,'/external-reader-intake.html':[[58,'#externalReaderIntakeForm']]
 ,'/external-reader-intake':[[58,'#externalReaderIntakeForm']]
 ,'/privacy.html':[[83,'#privacy-storage']]
 ,'/privacy':[[83,'#privacy-storage']]
 ,'/books/':[[64,'.cx-knowledge-heading'],[65,'.pis-editorial'],[85,'.cx-knowledge-heading',true]]
 ,'/guided-reading.html':[[66,'[data-r6-guided-reading-map]']]
 ,'/guided-reading':[[66,'[data-r6-guided-reading-map]']]
 ,'/checkout.html':[[81,'[data-r6-checkout-guide]']]
 ,'/checkout':[[81,'[data-r6-checkout-guide]']]
 ,'/knowledge/concepts/':[[67,'.pis-editorial']]
 ,'/perspectives/':[[72,'#perspectives-module-1'],[73,'#perspectives-module-2'],[78,'[data-r6-perspectives-hero]',true]]
 ,'/professional/':[[52,'#review-boundary']]
 ,'/membership.html':[[80,'main .public-section .public-container']]
 ,'/membership':[[80,'main .public-section .public-container']]
 ,'/contact.html':[[82,'main .public-section .public-container']]
 ,'/contact':[[82,'main .public-section .public-container']]
 ,'/digital-product-policy.html':[[84,'[data-r6-digital-policy-guide]']]
 ,'/digital-product-policy':[[84,'[data-r6-digital-policy-guide]']]
}[path]||[];
const english={1:'Start with a question',2:'Start with reading',3:'Start with your current reality',4:'Choose a perspective',5:'Continue over time',6:'Find professional help',7:'How the platform connects',8:'Choose your starting point',10:'Directions and positions',11:'Versions and changes',12:'Evidence and interpretation',13:'How a navigation network forms',15:'Choices and constraints',16:'Keep unknowns visible',17:'Observe, review and continue',18:'Your PHI OS workspace',19:'Consent and access scope',20:'Report delivery and reopening',21:'People and permissions',22:'Timeline and versions',23:'Temporary and saved work',24:'Recovering access',33:'Sources for Personal Evidence'};
if(targets.length){
 Object.assign(english,{34:'Seven ways to add Personal Evidence',35:'Reading your evidence result',36:'Confirm the source of an external result',37:'One bilingual evidence dossier',38:'Choose evidence to carry into Reality',39:'Differences and unknowns between sources',40:'Focus your Tarot question',41:'Choose the spread positions',42:'Shuffle and select your own cards',43:'Read the symbols in their positions',44:'Compare the reading with lived experience',45:'Continue from the same reading'});
 Object.assign(english,{46:'One question and a choice of casting method',53:'Service scope and actual deliverables',54:'An appointment request requires confirmation',55:'Choose the information you authorize for professional handoff',58:'Provide the source of an external reading',62:'Keep the question and its selected sources visible',63:'Explore connected knowledge',74:'Two people and their real circumstances',75:'Shared decisions and individual permissions',83:'Data storage, retention and withdrawal'});
 Object.assign(english,{9:'Your current reality remains a sourced view',14:'Connect evidence without turning it into certainty',61:'Natural Healer service scope',68:'Search results retain their source relationships',69:'Find a learning path through connected topics',70:'Compare learning with lived experience'});
 Object.assign(english,{52:'Keep report review and professional advice distinct',64:'The eight volumes form a connected foundation',65:'Follow a question across volumes',67:'Concepts connect to articles and figures',72:'Different perspectives on the same situation',73:'Sources retain their own boundaries',80:'Membership and individual purchase rights remain distinct',82:'Choose the appropriate support route',84:'Digital content and service deliverables differ'});
 Object.assign(english,{47:'Read six lines from bottom to top',49:'Read the different layers without merging their authority',50:'Compare the symbolic reading with real observations',51:'Continue from the recorded cast',66:'Follow a question through reading',81:'Payment confirmation precedes entitlement and delivery',85:'The eight-volume system'});
 english[48]='Example without changing lines: the primary and relating hexagrams are identical';
 Object.assign(english,{87:'No matching published source for this search',88:'Account permission is required',89:'The selected source could not be loaded'});
 Object.assign(english,{60:'Cash Flow Game learning context',71:'A question connected to explicitly selected sources',78:'Explore multiple lenses without merging their authority'});
 Object.assign(english,{56:'Estate roles and declared responsibilities',57:'A draft, professional review and legal execution are different stages',59:'Prepare estate information for review'});
 const registry=await customerAssetRegistry();
 const zh=()=>document.documentElement.lang.toLowerCase().startsWith('zh');
 function localized(node,en,cn){node.dataset.cxEn=en;node.dataset.cxZh=cn;node.textContent=zh()?cn:en;}
 function bind(){for(const [sequence,selector,inline]of targets){
  const host=document.querySelector(selector),asset=registry.entries.find(x=>x.r5Sequence===sequence);
  const state=!host?'MISSING_SLOT':!asset?.available?'ASSET_UNAVAILABLE':'BOUND';
  window.phiosVisualBindingState??={};window.phiosVisualBindingState[sequence]={selector,state};
  if(state!=='BOUND')continue;
  if(sequence===36&&!document.querySelector('[name="providerFamily"]')){host.querySelector('[data-r5-guide="'+asset.assetId+'"]')?.remove();continue;}
  if(host.querySelector('[data-r5-guide="'+asset.assetId+'"]'))continue;
  const node=document.createElement('figure');node.className='r5-context-guide';node.dataset.r5Guide=asset.assetId;
  const link=document.createElement('a'),image=document.createElement('img');link.href=asset.publicUrl;link.target='_blank';link.rel='noopener';image.dataset.cxEnAlt=english[sequence];image.dataset.cxZhAlt=asset.titleZh;image.alt=zh()?asset.titleZh:english[sequence];image.dataset.cxAsset=asset.assetId;image.width=asset.width;image.height=asset.height;image.loading='lazy';image.decoding='async';link.append(image);node.append(link);
  if(!inline){const caption=document.createElement('figcaption');localized(caption,english[sequence]+'. This is an illustration, not your data, access status or a calculated result. Select the image to view full size.',(sequence===48?'无变爻示例：本卦与之卦相同；你的实际卦局以计算结果为准':asset.titleZh)+'。这是说明图，不是你的资料、权限状态或计算结果。点击图片查看完整大小。');node.append(caption);}
  if(inline||sequence===33)host.prepend(node);else host.append(node);hydrateCustomerAssets(node);
 }}
 bind();let queued=false;
 const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;bind();});};
 // Observe existing method result owners only, never rescan the entire main tree.
 for(const selector of ['[data-prf-results]','[data-prf-workbench]','[data-prf-dossier-dialog]','[data-prf-handoff-panel]','[data-customer-layer]','[data-navigation-academy]','[data-reading-content]'])for(const host of document.querySelectorAll(selector)){
  new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&!node.matches('[data-r5-guide], [data-cx-asset-fallback]')&&!node.closest('[data-r5-guide]'))))schedule();}).observe(host,{childList:true,subtree:true});
 }
 for(const event of ['change','phios:reading-rendered','phios:profile-rendered','phios:account-rendered','phios:search-rendered','phios:ask-source-rendered','phios:estate-rendered','phios:draft-rendered'])document.addEventListener(event,schedule);
 document.addEventListener('DOMContentLoaded',schedule,{once:true});
 window.addEventListener('phios:localechange',()=>{document.querySelectorAll('[data-r5-guide] [data-cx-en]').forEach(node=>node.textContent=zh()?node.dataset.cxZh:node.dataset.cxEn);document.querySelectorAll('[data-r5-guide] img').forEach(node=>node.alt=zh()?node.dataset.cxZhAlt:node.dataset.cxEnAlt);schedule();});
}
