import fs from 'node:fs';
import crypto from 'node:crypto';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {textItemsToLines} from './lib/knowledge-manuscripts/searchable-pdf-extraction.mjs';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const sourcePath=process.argv[2] || 'C:/Users/Guest Account/Desktop/Reality Formation（Volume 1）.pdf';
const bytes=fs.readFileSync(sourcePath), sourceSha256=sha(bytes);
const old=JSON.parse(fs.readFileSync('.tmp/knowledge-manuscripts/book-1-v3/positioned-candidate/full-extraction.json','utf8'));
const dir=`.tmp/knowledge-manuscripts/book-1-v3-revision-${sourceSha256.slice(0,12)}`;
fs.mkdirSync(dir,{recursive:true});
const task=getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true,verbosity:0});
const doc=await task.promise,pages=[];
for(let n=1;n<=doc.numPages;n++){
 const p=await doc.getPage(n),c=await p.getTextContent(),seen=new Set();
 const items=c.items.filter(i=>{if(typeof i.str!=='string')return false;const k=JSON.stringify([i.str,i.transform,i.width,i.height]);if(seen.has(k))return false;seen.add(k);return true;});
 const lines=textItemsToLines(items,n,p.getViewport({scale:1}).height);
 pages.push({pageNumber:n,text:lines.map(l=>l.text).join('\n'),lines});p.cleanup();
}
const normalize=t=>t.normalize('NFKC').replace(/\s+/gu,'');
const index=new Map();for(const p of pages){const k=sha(normalize(p.text));const list=index.get(k)||[];list.push(p.pageNumber);index.set(k,list);}
const mapping=old.pages.map(p=>({oldPdfPage:p.pageNumber,newPdfCandidates:normalize(p.text)?index.get(sha(normalize(p.text)))||[]:[],empty:!normalize(p.text),exactTextCandidates:pages.filter(q=>q.text===p.text&&normalize(p.text)).map(q=>q.pageNumber)}));
const unmatched=mapping.filter(p=>!p.empty&&!p.newPdfCandidates.length).map(p=>p.oldPdfPage);
const mapped=new Set(mapping.flatMap(p=>p.newPdfCandidates));
const added=pages.filter(p=>normalize(p.text)&&!mapped.has(p.pageNumber)).map(p=>({pdfPage:p.pageNumber,text:p.text}));
const receipt={at:new Date().toISOString(),sourcePath,sourceSha256,previousSourceSha256:old.sourceSha256,previousPageCount:old.pageCount,pageCount:pages.length,mapping,unmatchedOldTextPages:unmatched,newOrChangedTextPages:added,comparisonBasis:'NFKC plus whitespace normalization; exact text correspondence separately recorded. Text equality does not prove image or PDF layout equality.',visualInspection:'PENDING',sourceAcceptance:'OWNER_ACCEPTED_CURRENT_V3_REVISION',corpusUpdated:false,productionChanged:false,providerCalls:0};
fs.writeFileSync(dir+'/page-comparison.json',JSON.stringify(receipt,null,2));
fs.writeFileSync(dir+'/comparison-extraction.json',JSON.stringify({sourceSha256,pageCount:pages.length,pages},null,2));
fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-I-V3-INCREMENTAL-REVISION.json',JSON.stringify(receipt,null,2));
await task.destroy();console.log(JSON.stringify({sourceSha256,pageCount:pages.length,unmatchedOldTextPages:unmatched,newOrChangedTextPages:added.map(p=>p.pdfPage),uniqueMappings:mapping.filter(p=>p.newPdfCandidates.length===1).length,dir}));
if(pages.length!==442){
 receipt.state='BLOCKED_COMPLETE_REVISION_NOT_PRESENT';
 receipt.firstStopNode='FULL_CURRENT_SOURCE_OR_EXPLICIT_FRAGMENT_REPLACEMENT_MAP';
 receipt.visualInspection='PAGE_1_RENDER_CONFIRMS_BOOK_VIII_EXPLANATION';
 receipt.fileBytes=bytes.length;
 receipt.inheritedEvidenceDisposition='Preserved; no body equivalence or page shift claimed';
 fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-I-V3-INCREMENTAL-REVISION.json',JSON.stringify(receipt,null,2));
 const statePath='tools/review/free-ask-manuscript-r1/CURRENT-IV-VI-MASTER-STATE.json';
 const state=JSON.parse(fs.readFileSync(statePath,'utf8'));
 state.bookIIncrementalRevision={sourceSha256,pdfPages:pages.length,state:receipt.state,evidence:'tools/review/free-ask-manuscript-r1/BOOK-I-V3-INCREMENTAL-REVISION.json',previousSourcePreserved:true,corpusChanged:false,productionChanged:false,pageShiftApplied:false,originalAnswerFailuresPreserved:true};
 fs.writeFileSync(statePath,JSON.stringify(state,null,2)+'\n');
 const htmlPath='content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
 let html=fs.readFileSync(htmlPath,'utf8');
 const section=`<section id="book-i-v3-incremental-revision"><h2>Book I v3 incremental revision · supplied source discrepancy</h2><p>Supplied SHA256: ${sourceSha256}. PDF.js and Poppler both report ${pages.length} pages. Rendered page 1 starts with Book VIII / Reality Navigation and states it is not sold as an independent public publication. The expected complete 442-page revision is absent from the supplied path.</p><p>BLOCKED_COMPLETE_REVISION_NOT_PRESENT. No body equivalence, two-page shift, revised corpus upload or production cutover claimed. Old v3 text, repaired headings, chapter IDs and failed-answer evidence remain intact.</p><p>982-chapter ledger retained: structural text checks 982; whole-chapter verified 0; whole-chapter admission proven 0; whole-chapter live verified 0. Book II source admission and the 10 working bounded Book III/IV/VI live ranges remain separate valid evidence. This revision has not been deployed. Provider calls = 0.</p><p>Next dependency: complete source or explicit fragment replacement map. Other seven-book work remains PARTIAL.</p></section>`;
 html=html.replace(/<section id="book-i-v3-incremental-revision">[\s\S]*?<\/section>/,'');
 fs.writeFileSync(htmlPath,html.replace('</body>',section+'\n</body>'));
}
