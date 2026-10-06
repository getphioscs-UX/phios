import {FONT_MINIMUMS,layoutProfile} from './bazi-publication-layout-profiles.js';
// Measures rendered content, including SVG label extents; no clipping-as-fit.
export function measureBaziPublication(root){
 const report=root.querySelector('.bdm-report'),mode=report?.dataset.presentationMode||'BILINGUAL',profile=layoutProfile(mode);
 const pages=[...root.querySelectorAll('.bdm-page')],slots=[],overflowPages=[],clippedSlots=[],hiddenTextSlots=[],fontMinimumViolations=[],missingLocales=[];
 for(const page of pages){const pb=page.getBoundingClientRect(),footer=page.querySelector('footer').getBoundingClientRect(),pageId=Number(page.dataset.pageNumber);let failed=false;
  for(const el of page.querySelectorAll('.bdm-content p,.bdm-content figure,.bdm-insights>div,.pub-heading h2,.pub-footer,.bdm-content svg text')){
   const b=el.getBoundingClientRect(),style=getComputedStyle(el),kind=el.closest('figcaption')?'caption':el.closest('svg')?'diagram':el.closest('.bdm-insights')?'card':el.closest('.pub-heading')?'title':el.closest('footer')?'footer':'body';
   const minimum=(FONT_MINIMUMS[kind]||10.5)*96/72,font=parseFloat(style.fontSize)*(el.ownerSVGElement?Math.abs(el.getScreenCTM().a):1);
   const bottom=kind==='footer'?pb.bottom:footer.top-4,over=Math.max(0,b.bottom-bottom,pb.left+(kind==='footer'?0:15)-b.left,b.right-(pb.right-(kind==='footer'?0:15)),el.ownerSVGElement?0:el.scrollHeight-el.clientHeight,el.ownerSVGElement?0:el.scrollWidth-el.clientWidth);
   const entry={pageId,slotId:slots.length,presentationMode:mode,kind,sourceChars:el.textContent.length,sourceStart:el.dataset.sourceStart??null,sourceEnd:el.dataset.sourceEnd??null,width:b.width,height:b.height,slotHeight:bottom-b.top,contentHeight:b.height,overflowPixels:over,fontSize:font,lineHeight:style.lineHeight,renderedLines:el.getClientRects().length};slots.push(entry);
   if(over>2){failed=true;clippedSlots.push(entry.slotId);}if(font+.1<minimum)fontMinimumViolations.push(entry.slotId);
   if(el.textContent.trim()&&(style.display==='none'||style.visibility==='hidden'||parseFloat(style.opacity)===0||b.width===0||b.height===0))hiddenTextSlots.push(entry.slotId);
   if(el.ownerSVGElement){const box=el.getBBox(),vb=el.ownerSVGElement.viewBox.baseVal;if(box.x<0||box.y<0||box.x+box.width>vb.width+1||box.y+box.height>vb.height+1){failed=true;clippedSlots.push(entry.slotId);}}
  }
  if(page.querySelector('.bdm-content')&&['INTERPRETATION_A','INTERPRETATION_B','SECTION_OPENER'].includes(page.dataset.pageRole))for(const l of profile.locales)if(!page.querySelector(`[lang="${l}"]`))missingLocales.push({pageId,locale:l});
  if(failed)overflowPages.push(pageId);
 }
 const assetFailures=[...root.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),diagrams=[...root.querySelectorAll('figure[data-diagram-id]')];
 const fail=pages.length!==48||diagrams.length!==15||new Set(diagrams.map(d=>d.dataset.diagramId)).size!==15||overflowPages.length||clippedSlots.length||hiddenTextSlots.length||fontMinimumViolations.length||assetFailures.length||missingLocales.length||root.querySelector('[data-missing-required]');
 return {presentationMode:mode,layoutProfileVersion:profile.id,pageCount:pages.length,diagramCount:diagrams.length,overflowPages,clippedSlots,hiddenTextSlots,fontMinimumViolations,assetFailures,missingLocales,slots,recomposePasses:[],fitStatus:fail?'FAIL':'PASS',providerCalls:0};
}
export function assertBaziFitRelease(ir,receipt){if(receipt.presentationMode!==ir.presentationMode||!['PASS','PASS_AFTER_RECOMPOSE'].includes(receipt.fitStatus))throw Error('PUBLICATION_OVERFLOW_UNRESOLVED');if(ir.customerPublishable!==true)throw Error('HUMAN_REVIEW_OR_COVERAGE_PENDING');return true;}
