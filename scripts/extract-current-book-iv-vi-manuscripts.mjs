import fs from 'node:fs';import crypto from 'node:crypto';import {getDocument}from'pdfjs-dist/legacy/build/pdf.mjs';import{textItemsToLines}from'./lib/knowledge-manuscripts/searchable-pdf-extraction.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const source=JSON.parse(fs.readFileSync('tools/review/free-ask-manuscript-r1/PRIVATE-R2-DOWNLOAD-BYTE-IDENTITY.json','utf8'));
for(const item of source.downloads){
 const bookCode=item.key.includes('book-4')?'BOOK-4':'BOOK-6';const bytes=fs.readFileSync(item.path);if(sha(bytes)!==item.sha256)throw Error('SOURCE_BYTES_CHANGED');
 const version='owner-final-20261011-'+item.sha256.slice(0,12);const dir='.tmp/free-ask-manuscripts/'+bookCode.toLowerCase()+'/'+version;fs.mkdirSync(dir,{recursive:true});
 const task=getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true,verbosity:0});const doc=await task.promise;const pages=[];
 for(let n=1;n<=doc.numPages;n++){const p=await doc.getPage(n);const content=await p.getTextContent();const seen=new Set();const items=content.items.filter(item=>{if(typeof item.str!=='string')return false;const key=JSON.stringify([item.str,item.transform,item.width,item.height]);if(seen.has(key))return false;seen.add(key);return true;});const lines=textItemsToLines(items,n,p.getViewport({scale:1}).height);pages.push({pageNumber:n,rawTextItemCount:content.items.length,exactOverprintedDuplicateItemsRemoved:content.items.length-items.length,lines,text:lines.map(l=>l.text).join('\n')});p.cleanup();if(n%100===0)console.log(bookCode,'page',n);}
 const corpus=pages.map(p=>p.text).join('\n\f\n');const extraction={bookCode,version,sourceSha256:item.sha256,pageCount:doc.numPages,corpusSha256:sha(corpus),pages,corpus,quality:{replacementCharacters:(corpus.match(/\ufffd/g)||[]).length,emptyPages:pages.filter(p=>!p.text.trim()).map(p=>p.pageNumber),scope:'FULL_TEXT_LAYER_EXTRACTION_NOT_VISUAL_OR_SEMANTIC_ACCEPTANCE'}};
 fs.writeFileSync(dir+'/full-extraction.json',JSON.stringify(extraction,null,2));fs.writeFileSync(dir+'/full-corpus.txt',corpus);fs.writeFileSync(dir+'/heading-candidates.json',JSON.stringify(pages.flatMap(p=>p.lines.filter(l=>/^[✦◈◆◇❖]|^(?:10|11|13)\.\d+/.test(l.text)).map(l=>({page:p.pageNumber,text:l.text,fontSize:l.fontSize}))),null,2));
 await task.destroy();console.log(bookCode,doc.numPages,'pages',extraction.quality);
}
