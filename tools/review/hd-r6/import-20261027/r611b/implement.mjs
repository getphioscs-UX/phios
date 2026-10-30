import fs from'node:fs';import{createHash}from'node:crypto';
const D='tools/review/hd-r6/import-20261027/r611b/',b=JSON.parse(fs.readFileSync(D+'BASELINE.json')),sha=x=>createHash('sha256').update(x).digest('hex');
function edit(p,fn){const old=fs.readFileSync(p);if(sha(old)!==b.files.find(x=>x.path===p).sha256)throw Error('SHARED_OWNER_DRIFT:'+p);fs.writeFileSync(p,fn(old.toString('utf8')));}
edit('functions/canonical-presentation-runtime/report-editorial-registry.js',s=>s+`
// R6.11B explicit contents evidence stays separate from the five front-page roles.
// Only this exact object key was provided by the Owner. No inferred -v1 keys.
export const REPORT_CONTENTS_ASSETS=Object.freeze([Object.freeze({
 methodId:'ZWR',locale:'bilingual',page:6,pageRole:'SEMIFIXED_CONTENTS',
 asset_code:'RPT-ZIWEI-P06-CONTENT',object_key:'images/reports/ziwei/editorial/bilingual/RPT-ZIWEI-P06-CONTENT.webp',
 bucket:'phios-public-assets',ownerEvidence:'OWNER_PROVIDED_R2_OBJECT_LIST_R611B',
 active:false,verification:'R2_REMOTE_BYTES_UNVERIFIED',visualAcceptance:'PENDING',customerPublishable:false
})]);
export function reportContentsAsset(methodId){return REPORT_CONTENTS_ASSETS.find(a=>a.methodId===methodId)||null;}
`);
edit('functions/canonical-presentation-runtime/report-editorial-resolver.js',s=>s+`
// Acceptance-fix candidate: one shared bilingual P06, actual native final-layout
// events, and measured number slots. Publication remains with existing owners.
export function planSemiFixedReportContents({methodId,purchasedPresentation,registeredAsset,assetRead,visualReview,sectionContract,finalLayout}={}){
 const fail=code=>{throw fixedVisualError(code);};
 if(!['HD','BZR','ZWR','NUM','AST','ECR'].includes(methodId))fail('P06_METHOD_INVALID');
 const locale=reportContentLocale(purchasedPresentation?.reportLocale);
 if(purchasedPresentation?.reportLanguageMode!==(locale==='bilingual'?'BILINGUAL':'SINGLE'))fail('P06_PURCHASE_LANGUAGE_REQUIRED');
 if(!registeredAsset||registeredAsset.methodId!==methodId||registeredAsset.locale!=='bilingual'||registeredAsset.page!==6||registeredAsset.pageRole!=='SEMIFIXED_CONTENTS'||!registeredAsset.object_key)fail('P06_EXACT_REGISTRY_REQUIRED');
 if(assetRead?.methodId!==methodId||assetRead.objectKey!==registeredAsset.object_key||assetRead.httpStatus!==200||assetRead.verification!=='CURRENT_BYTES_DECODED'||assetRead.mime!=='image/webp'||!Number.isInteger(assetRead.width)||!Number.isInteger(assetRead.height)||Math.min(assetRead.width,assetRead.height)<=0||!/^[a-f0-9]{64}$/.test(assetRead.sha256)||!/^[a-f0-9]{64}$/.test(assetRead.decodedPngSHA256))fail('P06_CURRENT_OBJECT_BYTES_REQUIRED');
 if(!sectionContract||sectionContract.methodId!==methodId||!sectionContract.version||!Array.isArray(sectionContract.sections)||!sectionContract.sections.length)fail('P06_SECTION_OWNER_REQUIRED');
 const sections=sectionContract.sections,ids=sections.map(s=>s.id);
 if(new Set(ids).size!==ids.length||sections.some(s=>!s.id||!s.zh||!s.en))fail('P06_SECTION_IDENTITY_INVALID');
 if(visualReview?.accepted!==true||visualReview.sha256!==assetRead.sha256||visualReview.methodId!==methodId||visualReview.fixedTitlesVerified!==true||visualReview.pageNumbersBlank!==true||!Array.isArray(visualReview.rows)||visualReview.rows.length!==ids.length)fail('P06_VISUAL_ACCEPTANCE_REQUIRED');
 if(finalLayout?.methodId!==methodId||finalLayout.contentLanguage!==locale||!finalLayout.reportId||!finalLayout.version||!Number.isInteger(finalLayout.pageCount)||finalLayout.pageCount<7||!Array.isArray(finalLayout.sectionOpeners)||finalLayout.sectionOpeners.length!==ids.length)fail('P06_FINAL_LAYOUT_REQUIRED');
 let previous=5;
 const rows=sections.map((s,i)=>{
  const events=finalLayout.sectionOpeners.filter(e=>e.sectionId===s.id),slots=visualReview.rows.filter(r=>r.sectionId===s.id);
  if(events.length!==1||slots.length!==1)fail('P06_SECTION_DUPLICATE_OR_MISSING');
  const ev=events[0],slot=slots[0],n=ev.physicalPageIndex0;
  if(slot.zh!==s.zh||slot.en!==s.en)fail('P06_FIXED_TITLES_MISMATCH');
  if(!Number.isInteger(n)||n<=previous||n>=finalLayout.pageCount)fail('P06_SECTION_PAGE_ORDER_INVALID');previous=n;
  if(!Number.isFinite(slot.xRight)||!Number.isFinite(slot.y)||slot.xRight<=0||slot.xRight>=1||slot.y<=0||slot.y>=1||!Array.isArray(slot.rect)||slot.rect.length!==4||slot.rect.some(x=>!Number.isFinite(x)||x<0||x>1)||slot.rect[0]>=slot.rect[2]||slot.rect[1]>=slot.rect[3]||slot.xRight<slot.rect[0]||slot.xRight>slot.rect[2]||slot.y<slot.rect[1]||slot.y>slot.rect[3])fail('P06_NUMBER_SLOT_INVALID');
  return Object.freeze({sectionId:s.id,titleZh:s.zh,titleEn:s.en,physicalPageNumber1:n+1,targetPageIndex0:n,xRight:slot.xRight,y:slot.y,rect:Object.freeze([...slot.rect])});
 });
 return Object.freeze({methodId,contentLanguage:locale,fixedAssetLanguage:'bilingual',objectKey:registeredAsset.object_key,sourceSHA256:assetRead.sha256,decodedPngSHA256:assetRead.decodedPngSHA256,imageWidth:assetRead.width,imageHeight:assetRead.height,tocPageIndex0:5,physicalPageCount:finalLayout.pageCount,reportId:finalLayout.reportId,version:finalLayout.version,rows:Object.freeze(rows),customerPublishable:false});
}
`);
edit('functions/canonical-presentation-runtime/private-pdf-renderer.js',s=>s.replace("import {PDFDocument,rgb,StandardFonts} from 'pdf-lib';","import {PDFDocument,rgb,StandardFonts,PDFName,PDFHexString} from 'pdf-lib';").replace('renderReleasedCustomerPdf(projection,fontBytes){','renderReleasedCustomerPdf(projection,fontBytes,{onSectionOpener}={}){').replace('paragraph(section.title,15,accent);','if(reviewOnly&&onSectionOpener)onSectionOpener({sectionId:section.id,physicalPageIndex0:pages.length-1});paragraph(section.title,15,accent);')+`
// Post-layout helper on the existing native PDF document. It does not grant
// entitlement, source rights, current-asset approval or production admission.
export async function applySemiFixedReportContents(pdf,{plan,pngBytes,font}={}){
 const bytes=pngBytes instanceof Uint8Array?pngBytes:new Uint8Array(pngBytes||[]);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(!plan||plan.customerPublishable!==false||plan.tocPageIndex0!==5||plan.physicalPageCount!==pdf.getPageCount()||digest!==plan.decodedPngSHA256||!font)throw Error('P06_PDF_BOUND_PLAN_REQUIRED');
 const pages=pdf.getPages(),page=pages[5];
 if(page.node.Annots()?.size())throw Error('P06_EXISTING_ANNOTATIONS_REQUIRE_OWNER_RECONCILIATION');
 const image=await pdf.embedPng(bytes);if(image.width!==plan.imageWidth||image.height!==plan.imageHeight)throw Error('P06_DECODE_DIMENSIONS_DRIFT');
 const {width:W,height:H}=page.getSize(),scale=Math.min(W/image.width,H/image.height),w=image.width*scale,h=image.height*scale,x=(W-w)/2,y=(H-h)/2;
 page.drawRectangle({x:0,y:0,width:W,height:H,color:rgb(1,1,1)});page.drawImage(image,{x,y,width:w,height:h});
 const c=pdf.context,items=[];
 for(const row of plan.rows){
  if(!pages[row.targetPageIndex0]||row.physicalPageNumber1!==row.targetPageIndex0+1)throw Error('P06_TARGET_PAGE_DRIFT');
  const text=String(row.physicalPageNumber1),size=11;page.drawText(text,{x:x+row.xRight*w-font.widthOfTextAtSize(text,size),y:y+row.y*h,size,font,color:rgb(.10,.20,.25)});
  const r=row.rect,annotation=c.register(c.obj({Type:'Annot',Subtype:'Link',Rect:[x+r[0]*w,y+r[1]*h,x+r[2]*w,y+r[3]*h],Border:[0,0,0],Dest:[pages[row.targetPageIndex0].ref,PDFName.of('Fit')]}));page.node.addAnnot(annotation);
  items.push({row,dest:pages[row.targetPageIndex0].ref});
 }
 let outlinesCreated=false;
 if(!pdf.catalog.get(PDFName.of('Outlines'))){
  const root=c.obj({Type:'Outlines',Count:items.length}),rootRef=c.register(root);
  const nodes=items.map(({row,dest})=>c.obj({Title:PDFHexString.fromText(row.sectionId+' '+row.titleZh+' / '+row.titleEn),Parent:rootRef,Dest:[dest,PDFName.of('Fit')]}));const refs=nodes.map(n=>c.register(n));
  nodes.forEach((n,i)=>{if(i)n.set(PDFName.of('Prev'),refs[i-1]);if(i+1<refs.length)n.set(PDFName.of('Next'),refs[i+1]);});
  root.set(PDFName.of('First'),refs[0]);root.set(PDFName.of('Last'),refs.at(-1));pdf.catalog.set(PDFName.of('Outlines'),rootRef);outlinesCreated=true;
 }
 return {methodId:plan.methodId,linksCreated:items.length,outlinesCreated,existingOutlinesPreserved:!outlinesCreated,pages:pages.length,sourceSHA256:plan.sourceSHA256,customerPublishable:false};
}
`);
console.log('Three existing presentation/PDF owners updated under exact baseline hash checks; all releases remain disabled');
