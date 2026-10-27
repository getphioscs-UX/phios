import {rgb,StandardFonts} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import motionRegistry from '../../content/embodied-configuration/ecr-motion-registry-v1.json';
export const SEC07_ACCEPTED_SHA256='2e9deef92d2e45c5583dd3495253c9f3dca01be534d62024e9f67ddd7a53a9f5';
export const SEC07_PRESENTATION_VERSION='ECR-SEC07-A4-VECTOR-LABELS-R33-v1';
// Copied from the accepted image, not new interpretation or customer-specific prose.
const captions=['Receive, accumulate and provide stability and support','Take action, awaken and start a new cycle','Adapt, adjust and move forward through change','Communicate, penetrate and build connection and influence','Recognise, express and let uniqueness become visible','Set, focus and establish clear boundaries','Develop, extend and open broader possibilities','Interact, share and create value flow'];
export async function drawEcrSec07Presentation({pdf,png,leftFramePng,rightFramePng,fontBytes,sourceSha256}){
 if(sourceSha256!==SEC07_ACCEPTED_SHA256)throw Error('SEC07_EXACT_ACCEPTED_BYTES_REQUIRED');
 pdf.registerFontkit(fontkit);const cn=await pdf.embedFont(fontBytes,{subset:false}),en=await pdf.embedFont(StandardFonts.Helvetica),image=await pdf.embedPng(png),left=await pdf.embedPng(leftFramePng),right=await pdf.embedPng(rightFramePng);
 if(image.width!==1024||image.height!==1536||motionRegistry.entries.length!==8)throw Error('SEC07_PRESENTATION_INPUT_INVALID');
 const width=210/25.4*72,height=297/25.4*72,scale=height/1536,artWidth=1024*scale,gutter=(width-artWidth)/2,page=pdf.addPage([width,height]);
 page.drawRectangle({x:0,y:0,width,height,color:rgb(.87,.78,.57)});
 page.drawImage(left,{x:0,y:0,width:gutter,height});page.drawImage(right,{x:width-gutter,y:0,width:gutter,height});
 page.drawImage(image,{x:gutter,y:0,width:artWidth,height});
 const ink=rgb(.045,.13,.24),cream=rgb(1,.985,.925),regions=[];
 const box=(x,y,w,h,id)=>{page.drawRectangle({x:gutter+x*scale,y:height-(y+h)*scale,width:w*scale,height:h*scale,color:cream});regions.push({id,x,y,width:w,height:h});};
 const text=(value,x,y,size,font=en,centerWidth=0)=>{const measured=font.widthOfTextAtSize(value,size);if(centerWidth&&measured>centerWidth)throw Error('SEC07_LABEL_OVERFLOW:'+value);page.drawText(value,{x:gutter+(x+(centerWidth?(centerWidth-measured)/2:0))*scale,y:height-y*scale,size:size*scale,font,color:ink});};
 const wrap=(s,w,size)=>{const lines=[];let line='';for(const word of s.split(' ')){const next=line?line+' '+word:word;if(en.widthOfTextAtSize(next,size)>w&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;};
 for(let i=0;i<8;i++){
  const m=motionRegistry.entries[i],x=27+i*123;
  if(m.motionId!=='M'+(i+1))throw Error('M8_REGISTRY_ORDER_CHANGED');
  box(x,623,118,54,m.motionId+'-trigram-and-name');text(m.trigramZhHans,x,649,25,cn,118);text(m.label,x,670,12,en,118);
  box(x,800,118,121,m.motionId+'-caption');text(m.labelZhHans,x,821,15,cn,118);text(m.label,x,841,12,en,118);
  const lines=wrap(captions[i],103,12);if(lines.length>5)throw Error('SEC07_CAPTION_OVERFLOW');lines.forEach((s,n)=>text(s,x+2,860+n*13,12));
 }
 box(40,1090,340,77,'H64-English-explanation');
 ['Each environment configuration is formed','by a combination of two motions, describing','how the environment and the carrier interact.','Every configuration offers a unique runtime style,','supporting conditions and response tendency to reality.'].forEach((s,n)=>{if(en.widthOfTextAtSize(s,11.6)>333)throw Error('SEC07_H64_OVERFLOW');text(s,45,1104+n*14.3,11.6);});
 return {page,evidence:{version:SEC07_PRESENTATION_VERSION,sourceSha256,sourcePixelsUnmodified:true,overlayRegions:regions,motionRegistryVersion:motionRegistry.schemaVersion,originalImageBox:{x:gutter,y:0,width:artWidth,height},a4:{width,height},horizontalFrameExtension:{left:gutter,right:gutter},scaleX:scale,scaleY:scale,cropped:false,customerCalculationWritten:false,H42Role:'FIXED_EXAMPLE_ONLY',captionPolicy:'Exact existing English image captions retained; garbled lower Chinese micro-lines replaced by the canonical M8 Chinese labels, not invented prose',microTextQA:'PRESENTATION_CANDIDATE_PENDING_RENDER_CHECK'}};
}
