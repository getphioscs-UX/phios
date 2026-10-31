export const visualReceipts=[];
export function recordVisual(asset,state,extra={}){
 const receipt={assetId:asset?.assetId||null,bucketKey:asset?.bucketKey||null,url:asset?.publicUrl||null,state,...extra,at:new Date().toISOString()};
 visualReceipts.push(receipt);if(visualReceipts.length>1000)visualReceipts.shift();
 globalThis.dispatchEvent?.(new CustomEvent('phios:atlas-visual-state',{detail:receipt}));return receipt;
}
export function monitorVisual(img,asset,locale='en'){
 const host=img.closest('figure')||img.parentElement;
 const set=(state,extra={})=>{img.dataset.visualState=state;host.dataset.visualState=state;recordVisual(asset,state,extra);};
 set('BOUND');
 const fail=(state,extra={})=>{set(state,extra);img.hidden=true;let fallback=host.querySelector('[data-visual-fallback]');if(!fallback){fallback=img.ownerDocument.createElement('p');fallback.dataset.visualFallback='';fallback.setAttribute('role','status');host.append(fallback);}fallback.textContent=locale==='zh-Hans'?'插画暂时无法显示；年代、来源与结构化资料仍可阅读。':'Illustration unavailable. Dates, sources and structured information remain readable.';};
 img.addEventListener('error',()=>fail('R2_HTTP_ERROR'),{once:true});
 let transferTimer,observer;const startTransfer=()=>{if(transferTimer||img.complete&&img.naturalWidth)return;recordVisual(asset,'R2_REQUESTED');transferTimer=setTimeout(()=>{if(!img.complete||!img.naturalWidth)fail('R2_HTTP_ERROR',{reason:'TRANSFER_TIMEOUT'});},25000);};if(img.loading==='lazy'&&globalThis.IntersectionObserver){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){startTransfer();observer.disconnect();}},{rootMargin:'500px'});observer.observe(img);}else startTransfer();
 let processed=false;const loaded=async()=>{if(processed)return;processed=true;clearTimeout(transferTimer);observer?.disconnect();try{await img.decode();img.hidden=false;host.querySelector('[data-visual-fallback]')?.remove();set('DECODED');requestAnimationFrame(()=>{const rect=img.getBoundingClientRect(),style=getComputedStyle(img);set(rect.width>0&&rect.height>0&&style.display!=='none'&&!img.closest('details:not([open])')?'VISIBLE':'HIDDEN_BY_LAYOUT',{width:rect.width,height:rect.height});});}catch{fail('DECODE_FAILED');}};
 img.addEventListener('load',loaded,{once:true});
 if(img.complete&&img.naturalWidth)loaded();
 return {fail};
}
export function primaryVisualMarkup(asset,title,locale='en'){
 if(!asset){recordVisual(null,'MISSING_BINDING');return `<p role="status">${locale==='zh-Hans'?'插画尚未匹配；结构化资料仍可阅读。':'Illustration not yet matched. Structured information remains readable.'}</p>`;}
 return `<figure class="world-snapshot-primary" data-primary-snapshot="${asset.subjectId}" data-asset-id="${asset.assetId}"><img src="${asset.publicUrl}" alt="${String(title).replaceAll('"','&quot;')}" loading="eager" decoding="async" fetchpriority="high" data-primary-r2><figcaption>${locale==='zh-Hans'?'情境插画，不作为历史或当前证据；标题、年代与边界以登记资料为准。':'Contextual illustration, not historical or current evidence. Registered text owns titles, dates and boundaries.'}</figcaption></figure>`;
}
