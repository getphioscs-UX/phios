import fs from 'node:fs';import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {ROOT,read,write} from './lib/bazi-deep-manuscript-review.mjs';
const aliases=read('config/reports/bazi-deep-manuscript-r2/pdf-cjk-glyph-aliases.json').aliases;const normalize=text=>[...text].map(c=>aliases[c]||c).join('').normalize('NFKC').replace(/―/g,'—').replace(/\s/g,'');
const modes=[];let failed=false;
for(const mode of ['BILINGUAL','EN','ZH_HANS']){
 const ir=read(ROOT+'LIVE-PUBLICATION-IR-R2-CLOSURE-'+mode+'.json'),receipt=read(ROOT+'fit-closure/'+mode+'-FIT-RECEIPT.json');
 const task=getDocument({data:new Uint8Array(fs.readFileSync(receipt.pdf.path)),useSystemFonts:true});const doc=await task.promise;
 let testedSpans=0;const missing=[],boxes=[];
 for(let index=1;index<=doc.numPages;index++){const page=await doc.getPage(index),content=await page.getTextContent(),text=normalize(content.items.map(i=>i.str||'').join('')),plan=ir.publication.pages[index-1];boxes.push(page.view);
  for(const key of ['content','insightCards'])for(const [locale,spans] of Object.entries(plan?.[key]||{})){if(mode==='EN'&&locale!=='en'||mode==='ZH_HANS'&&locale!=='zh-Hans')continue;for(const span of spans){testedSpans++;const terminal=normalize(span.text.slice(-30));if(!text.includes(terminal))missing.push({page:index,locale,key,start:span.start,end:span.end,terminal});}}
 }
 const a4=boxes.every(b=>Math.abs(b[2]-b[0]-595.28)<1&&Math.abs(b[3]-b[1]-841.89)<1),status=doc.numPages===48&&a4&&!missing.length&&receipt.publicationDigest===ir.digest?'PASS':'FAIL';failed ||= status==='FAIL';modes.push({mode,status,pageCount:doc.numPages,boxes,cropAndMediaScope:'Chromium-generated A4 page view and pdf-lib page MediaBox receipts; no arbitrary crop',textNormalization:'Source-font cmap identical CJK radical aliases before NFKC, horizontal-bar/em-dash extraction equivalence, whitespace; no words removed',testedSpans,missing,publicationDigest:ir.digest,manuscriptDigest:ir.manuscript.digest,providerCalls:0});await task.destroy();
}
write(ROOT+'fit-closure/PDF-TEXT-CONTINUITY.json',{modes,providerCalls:0});console.log(JSON.stringify(modes.map(({mode,status,pageCount,testedSpans,missing})=>({mode,status,pageCount,testedSpans,missing:missing.length}))));if(failed)process.exitCode=1;
