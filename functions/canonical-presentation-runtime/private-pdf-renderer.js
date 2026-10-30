import {PDFDocument,rgb,StandardFonts,PDFName,PDFHexString} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// Layout only: consumes the existing governed customer PDF projection.
export async function renderReleasedCustomerPdf(projection,fontBytes,{onSectionOpener}={}){
 if(projection?.surface!=='PDF'||projection.renderState!=='ready_for_render')throw new Error('CPR_PDF_PROJECTION_REQUIRED');
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 // Review-only subset embedding preserves unambiguous digit/CJK ToUnicode
 // mappings in the current Noto font. Historical released rendering is unchanged.
 const font=projection.reviewOnly===true&&projection.reviewLatinOnly===true
  ?await pdf.embedFont(StandardFonts.Helvetica)
  :await pdf.embedFont(fontBytes,{subset:projection.reviewOnly===true});
 const ink=rgb(.12,.18,.22),accent=rgb(.16,.39,.38);
 // Opt-in local owner-review pagination. Historical/default and released layouts
 // keep the original path; this never changes content or publication authority.
 const balancedReview=projection.reviewOnly===true&&projection.reviewPagination==='HD_R63_BALANCED_V1';
 let page,y;const pages=[];
 function next(){page=pdf.addPage([595.28,841.89]);pages.push(page);y=774;page.drawText('PHI OS',{x:48,y:802,size:11,font,color:accent});}
 function line(text,size=11,color=ink){if(y<62)next();page.drawText(text,{x:48,y,size,font,color});y-=size*1.65;}
 function paragraph(text,size=11,color=ink){
  if(balancedReview){
   if(!String(text||'').trim())return;
   for(const raw of String(text).split(/\n\s*\n/)){
    const lines=[];for(const input of raw.split(/\r?\n/)){let current='';for(const c of input){if(font.widthOfTextAtSize(current+c,size)>499&&current){const space=current.lastIndexOf(' ');if(space>current.length/2){lines.push(current.slice(0,space));current=current.slice(space+1);}else{lines.push(current);current='';}}current+=c;}lines.push(current.trimEnd());}
    let cursor=0;while(cursor<lines.length){let capacity=Math.max(0,Math.floor((y-62)/(size*1.65))+1),remaining=lines.length-cursor;
     if(capacity<Math.min(3,remaining)){next();continue;}
     let take=Math.min(capacity,remaining);if(remaining>take&&remaining-take<3)take=Math.max(0,remaining-3);
     if(take<Math.min(3,remaining)){next();continue;}
     for(let i=0;i<take;i++)line(lines[cursor++],size,color);if(cursor<lines.length)next();
    }y-=8;
   }return;
  }
  for(const raw of String(text||'').split(/\r?\n/)){let current='';for(const c of raw){if(font.widthOfTextAtSize(current+c,size)>499&&current){const space=current.lastIndexOf(' ');if(space>current.length/2){line(current.slice(0,space),size,color);current=current.slice(space+1);}else{line(current,size,color);current='';}}current+=c;}line(current.trimEnd(),size,color);}y-=7;
 }
 // Local review candidates must not inherit the released-report label.
 const reviewOnly=projection.reviewOnly===true;
 if(reviewOnly&&onSectionOpener){
  const ref=projection.reportReference;
  if(!projection.methodId||!ref?.reportId||!ref.reportVersion||!projection.locale)throw Error('P06_NATIVE_REPORT_IDENTITY_REQUIRED');
  pdf.catalog.set(PDFName.of('PHIOSContentsIdentity'),pdf.context.obj({MethodId:PDFHexString.fromText(projection.methodId),ReportId:PDFHexString.fromText(ref.reportId),Version:PDFHexString.fromText(ref.reportVersion),ContentLanguage:PDFHexString.fromText(projection.locale)}));
 }

 next();paragraph(reviewOnly?(projection.locale==='zh-Hans'?'部分审阅稿 · 不可交付':'Partial review - not for delivery'):(projection.locale==='zh-Hans'?'私人已发布报告':'Private released report'),21,accent);
 paragraph(`${projection.locale==='zh-Hans'?'版本':'Version'} ${projection.reportReference.reportVersion}`,10);
 const headingReserve=balancedReview&&projection.reviewHeadingReserve===175?175:(balancedReview?210:140);
 for(const section of projection.sections){const reserve=balancedReview&&projection.reviewHeadingReserve===175&&section.reviewChapterOpening===true?260:headingReserve;if(section.pageBreakBefore===true||y<reserve)next();if(reviewOnly&&onSectionOpener)onSectionOpener({sectionId:section.id,physicalPageIndex0:pages.length-1});paragraph(section.title,15,accent);paragraph(section.authorityLabel,9,accent);const reviewSize=balancedReview&&Number.isFinite(section.reviewFontSize)&&section.reviewFontSize>=9&&section.reviewFontSize<=11?section.reviewFontSize:11;paragraph(section.content,reviewSize);}
 pages.forEach((p,i)=>p.drawText(`${i+1} / ${pages.length}`,{x:480,y:32,size:9,font,color:ink}));
 pdf.setTitle('PHI OS private report');pdf.setProducer('PHI OS governed private delivery');return pdf.save();
}

// Post-layout helper on the existing native PDF document. It does not grant
// entitlement, source rights, current-asset approval or production admission.
export async function applySemiFixedReportContents(pdf,{plan,pngBytes,font}={}){
 const bytes=pngBytes instanceof Uint8Array?pngBytes:new Uint8Array(pngBytes||[]);
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(!plan||plan.customerPublishable!==false||plan.tocPageIndex0!==5||plan.physicalPageCount!==pdf.getPageCount()||digest!==plan.decodedPngSHA256||!font)throw Error('P06_PDF_BOUND_PLAN_REQUIRED');
 const identity=pdf.catalog.lookup(PDFName.of('PHIOSContentsIdentity'));
 if(!identity||[['MethodId',plan.methodId],['ReportId',plan.reportId],['Version',plan.version],['ContentLanguage',plan.contentLanguage]].some(([key,value])=>identity.get(PDFName.of(key))?.decodeText?.()!==value))throw Error('P06_REPORT_IDENTITY_DRIFT');
 const pages=pdf.getPages(),page=pages[5];
 if(page.node.Annots()?.size())throw Error('P06_EXISTING_ANNOTATIONS_REQUIRE_OWNER_RECONCILIATION');
 const image=await pdf.embedPng(bytes);if(image.width!==plan.imageWidth||image.height!==plan.imageHeight)throw Error('P06_DECODE_DIMENSIONS_DRIFT');
 const {width:W,height:H}=page.getSize(),scale=Math.min(W/image.width,H/image.height),w=image.width*scale,h=image.height*scale,x=(W-w)/2,y=(H-h)/2;
 // Replace the reserved slot stream; do not hide stale/internal text beneath art.
 page.node.delete(PDFName.of('Contents'));page.resetPosition();
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
