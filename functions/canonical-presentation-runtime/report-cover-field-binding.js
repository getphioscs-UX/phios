import {PDFDocument,decodePDFRawStream} from 'pdf-lib';
// Render approved cover placeholders only. Fixed section art is never overlaid.
export async function bindLocalConfirmedCoverFields({pdfBytes,overlayPdfBytes,fields,inputDigest,replaceExistingLocalBinding=false,localReview=false}){
 if(!localReview||!inputDigest||!Array.isArray(fields)||fields.length!==3)throw Error('COVER_CONFIRMED_BINDING_REQUIRED');
 const pdf=await PDFDocument.load(pdfBytes),overlay=await PDFDocument.load(overlayPdfBytes),cover=pdf.getPage(0);if(overlay.getPageCount()!==1)throw Error('COVER_OVERLAY_PAGE_COUNT');
 if(replaceExistingLocalBinding){const a=cover.node.Contents(),last=pdf.context.lookup(a.get(a.size()-1)),text=new TextDecoder().decode(decodePDFRawStream(last).decode());if(!text.includes('BT')||text.includes(' Do')||(text.match(/BT/g)||[]).length!==3)throw Error('COVER_PRIOR_BINDING_STREAM_UNEXPECTED');a.remove(a.size()-1);}
 const allowed=['name','birthDate','birthTime'];for(const [i,f]of fields.entries())if(f.key!==allowed[i]||typeof f.value!=='string'||f.value.length>240)throw Error('COVER_FIELD_INVALID');
 const [page]=await pdf.embedPages(overlay.getPages());cover.drawPage(page,{x:0,y:0,width:cover.getWidth(),height:cover.getHeight()});
 pdf.setTitle('PHI OS · Numerology Full Report');pdf.setProducer('PHI OS');return{bytes:await pdf.save(),binding:{inputDigest,fields,coverPage:1,fixedSectionOverlays:0,localOnly:true}};
}
