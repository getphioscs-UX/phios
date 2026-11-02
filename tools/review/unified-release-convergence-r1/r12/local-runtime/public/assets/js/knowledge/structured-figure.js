import {loadFigureRegistry,loadCanonicalParts,figureHasCanonicalBookOwnership,figurePublicSrc} from '../web-production/public-surface-data.js';
export function chooseStructuredFigure(objectId,bindings,registry,parts){
 for(const b of bindings.filter(b=>b.relatedObjectIds.includes(objectId))){const f=registry.figures.find(f=>f.figure_id===b.figureId);if(f?.status==='available'&&figureHasCanonicalBookOwnership(f,parts)){const src=figurePublicSrc(f);if(src)return {src,title:f.title,role:'PART_READING_CONTEXT',figureId:f.figure_id};}}
 // No independent SVG authority is registered here. The existing reading map/text remains.
 return null;
}
let data;
export async function renderStructuredFigure(host,objectId,locale='en'){
 host.dataset.figureObject=objectId||'';host.replaceChildren();if(!objectId)return;
 try{data??=Promise.all([fetch('/content/knowledge/structured/article-figure-reconciliation-v1.json').then(r=>{if(!r.ok)throw Error('unavailable');return r.json();}),loadFigureRegistry(),loadCanonicalParts()]).catch(error=>{data=null;throw error});const [bindings,registry,parts]=await data;if(!host.isConnected||host.dataset.figureObject!==objectId)return;
 const result=chooseStructuredFigure(objectId,bindings.figures,registry,parts);if(!result)return;
 const figure=host.ownerDocument.createElement('figure'),img=host.ownerDocument.createElement('img'),caption=host.ownerDocument.createElement('figcaption');img.src=result.src;img.alt=result.title?.[locale]||result.title?.en||'';img.loading='lazy';img.style.maxWidth='100%';img.style.height='auto';img.addEventListener('error',()=>figure.remove(),{once:true});caption.textContent=locale==='zh-Hans'?'同一 Part 的阅读参考图，不表示已确认的机制关系。':'Reading illustration for the same Part; it does not establish a mechanism relationship.';figure.append(img,caption);host.append(figure);
 }catch{/* The source text remains the fallback. */}
}
