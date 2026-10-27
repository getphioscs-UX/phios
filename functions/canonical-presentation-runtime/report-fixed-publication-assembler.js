import {PDFDocument,rgb} from 'pdf-lib';
import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
// Layout-only extension of shared report publication. It owns neither meaning,
// entitlement nor release. Source WebP identity and PDF encoding are separate.
export async function assembleFixedPublicationCandidate({plan,bodyPdf,assets,bodyAsset,localReview=false}){
 if(!localReview)throw Error('FIXED_PUBLICATION_LOCAL_ONLY');
 const source=await PDFDocument.load(bodyPdf),pdf=await PDFDocument.create();
 const entries=plan.filter(p=>p.pageRole==='BODY_CONTENT');if(source.getPageCount()!==entries.length)throw Error('FIXED_PUBLICATION_BODY_COUNT_MISMATCH');
 const bodyPages=await pdf.embedPages(source.getPages()),width=210/25.4*72,height=297/25.4*72,images=new Map();
 const checked=async a=>{if(!a?.sourceBytes||!a?.pdfBytes||a.mime!=='image/jpeg')throw Error('FIXED_PUBLICATION_ENCODING_REQUIRED');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a.sourceBytes)),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==a.sourceSHA256)throw Error('FIXED_PUBLICATION_SOURCE_DIGEST_MISMATCH');if(!images.has(a.sourceSHA256))images.set(a.sourceSHA256,await pdf.embedJpg(a.pdfBytes));return images.get(a.sourceSHA256);};
 const background=await checked(bodyAsset);let n=0;const map=[];
 for(const entry of plan){const page=pdf.addPage([width,height]);if(entry.pageRole==='BODY_CONTENT'){page.drawImage(background,{x:0,y:0,width,height});page.drawPage(bodyPages[n++],{x:0,y:0,width,height});map.push({...entry,bodySourceSHA256:bodyAsset.sourceSHA256});}else{const a=assets[entry.assetRef],image=await checked(a),scale=Math.min(width/image.width,height/image.height);page.drawRectangle({x:0,y:0,width,height,color:rgb(.98,.96,.92)});page.drawImage(image,{x:(width-image.width*scale)/2,y:(height-image.height*scale)/2,width:image.width*scale,height:image.height*scale});map.push({...entry,sourceSHA256:a.sourceSHA256,pdfEncoding:'JPEG_100_444',imageScaleX:scale,imageScaleY:scale});}}
 pdf.setTitle('PHI OS Numerology · Synthetic local review');pdf.setAuthor('PHI OS');pdf.setProducer('PHI OS shared fixed-publication candidate');return{bytes:await pdf.save(),map,publicationEligible:false,semanticDigest:await sha256Stable(map)};
}
