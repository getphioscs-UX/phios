import {PDFDocument,rgb} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// Layout only: consumes the existing governed customer PDF projection.
export async function renderReleasedCustomerPdf(projection,fontBytes){
 if(projection?.surface!=='PDF'||projection.renderState!=='ready_for_render')throw new Error('CPR_PDF_PROJECTION_REQUIRED');
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
 const font=await pdf.embedFont(fontBytes,{subset:false}),ink=rgb(.12,.18,.22),accent=rgb(.16,.39,.38);
 let page,y;const pages=[];
 function next(){page=pdf.addPage([595.28,841.89]);pages.push(page);y=774;page.drawText('PHI OS',{x:48,y:802,size:11,font,color:accent});}
 function line(text,size=11,color=ink){if(y<62)next();page.drawText(text,{x:48,y,size,font,color});y-=size*1.65;}
 function paragraph(text,size=11,color=ink){for(const raw of String(text||'').split(/\r?\n/)){let current='';for(const c of raw){if(font.widthOfTextAtSize(current+c,size)>499&&current){const space=current.lastIndexOf(' ');if(space>current.length/2){line(current.slice(0,space),size,color);current=current.slice(space+1);}else{line(current,size,color);current='';}}current+=c;}line(current.trimEnd(),size,color);}y-=7;}
 next();paragraph(projection.locale==='zh-Hans'?'私人已发布报告':'Private released report',21,accent);
 paragraph(`${projection.locale==='zh-Hans'?'版本':'Version'} ${projection.reportReference.reportVersion}`,10);
 for(const section of projection.sections){if(y<140)next();paragraph(section.title,15,accent);paragraph(section.authorityLabel,9,accent);paragraph(section.content);}
 pages.forEach((p,i)=>p.drawText(`${i+1} / ${pages.length}`,{x:480,y:32,size:9,font,color:ink}));
 pdf.setTitle('PHI OS private report');pdf.setProducer('PHI OS governed private delivery');return pdf.save();
}
