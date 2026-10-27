import {PDFDocument,rgb,StandardFonts} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// Layout only: consumes the existing governed customer PDF projection.
export async function renderReleasedCustomerPdf(projection,fontBytes){
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
 next();paragraph(reviewOnly?(projection.locale==='zh-Hans'?'部分审阅稿 · 不可交付':'Partial review - not for delivery'):(projection.locale==='zh-Hans'?'私人已发布报告':'Private released report'),21,accent);
 paragraph(`${projection.locale==='zh-Hans'?'版本':'Version'} ${projection.reportReference.reportVersion}`,10);
 const headingReserve=balancedReview&&projection.reviewHeadingReserve===175?175:(balancedReview?210:140);
 for(const section of projection.sections){const reserve=balancedReview&&projection.reviewHeadingReserve===175&&section.reviewChapterOpening===true?260:headingReserve;if(section.pageBreakBefore===true||y<reserve)next();paragraph(section.title,15,accent);paragraph(section.authorityLabel,9,accent);const reviewSize=balancedReview&&Number.isFinite(section.reviewFontSize)&&section.reviewFontSize>=9&&section.reviewFontSize<=11?section.reviewFontSize:11;paragraph(section.content,reviewSize);}
 pages.forEach((p,i)=>p.drawText(`${i+1} / ${pages.length}`,{x:480,y:32,size:9,font,color:ink}));
 pdf.setTitle('PHI OS private report');pdf.setProducer('PHI OS governed private delivery');return pdf.save();
}
