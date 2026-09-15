import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const read=p=>JSON.parse(fs.readFileSync(p));
export const digest=value=>createHash('sha256').update(value).digest('hex');
export const normalize=value=>String(value??'').normalize('NFKC').replace(/\s+/gu,'');
export function sources(){
 return [1,2,3,4].map(n=>{
  const file=`functions/_source-material/books/book-${n}-desktop-text-v1.json`,pdf=read(file);
  let cursor=0;const pages=pdf.pages.map(p=>{const text=normalize(p.text),start=cursor;cursor+=text.length;return {...p,start,end:cursor,normalized:text};}),text=pages.map(p=>p.normalized).join('');
  const starts=[...text.matchAll(/[✦❖◈◆]/gu)].map(m=>m.index);
  const chunks=starts.map((start,i)=>{const end=starts[i+1]??text.length;return {start,end,text:text.slice(start,end),startPage:pages.find(p=>p.end>start)?.pdfPage,endPage:pages.find(p=>p.end>=end)?.pdfPage};});
  const repeatedHeaders=[...new Set(chunks.filter(c=>c.text.length<180&&chunks.some(other=>other!==c&&other.text.length>c.text.length&&other.text.startsWith(c.text))).map(c=>c.text))].sort((a,b)=>b.length-a.length);
  const withoutRepeatedHeaders=value=>repeatedHeaders.reduce((text,header)=>text.split(header).join(''),value);
  const inventory=n===3?read('content/knowledge/manuscripts/extraction/book-3-final-section-semantics-v1.json').records:read(`content/knowledge/manuscripts/extraction/book-${n}-${n===4?'final':'full'}-section-inventory-v1.json`).sections;
  const registered=n<3?read(`functions/_source-material/books/book-${n}-registered-reviewed-corpus.json`).records:n===3?read('functions/_source-material/books/book-3-registered-sections-v1.json').sections:[];
  const rows=inventory.map(s=>{
   const old=registered.find(r=>r.sectionCode===s.sectionCode),heading=normalize(s.headingRaw||s.heading||s.titleZhHans),title=normalize(s.heading||s.titleZhHans);
   let matches=chunks.filter(c=>c.text.startsWith(heading)||normalize(c.text.slice(1,1+title.length))===title);
   if(!matches.length&&old){const anchors=normalize(old.text).split(/[。！？]/u).filter(x=>x.length>35).slice(0,3);matches=chunks.filter(c=>anchors.filter(a=>c.text.includes(a)).length>=2);}
   const consecutive=matches.length>1&&(matches.every((c,i)=>i===0||chunks.indexOf(c)===chunks.indexOf(matches[i-1])+1)||matches.every(c=>c.startPage===matches[0].startPage));
   const candidate=matches.length===1?matches[0]:consecutive?{start:matches[0].start,end:matches.at(-1).end,text:text.slice(matches[0].start,matches.at(-1).end),startPage:matches[0].startPage,endPage:matches.at(-1).endPage}:null,oldText=old?normalize(old.text):null;
   const equal=!!(candidate&&oldText&&candidate.text===oldText);
   const headerNormalizedEqual=!!(candidate&&oldText&&withoutRepeatedHeaders(candidate.text)===withoutRepeatedHeaders(oldText));
   return {sectionCode:s.sectionCode,title:s.heading||s.titleZhHans,partCode:s.partCode,registeredPages:[s.startPage,s.endPage],registeredTextSha256:s.textSha256||s.sourceTextSha256,registeredBodyAvailable:!!old,registeredBodySha256:old?digest(old.text):null,candidatePages:candidate?[candidate.startPage,candidate.endPage]:null,candidateSpan:candidate?[candidate.start,candidate.end]:null,candidateTextSha256:candidate?digest(candidate.text):null,status:!candidate?(matches.length?'AMBIGUOUS_HEADING':'HEADING_OR_ANCHORS_NOT_MATCHED'):equal?'NORMALIZED_TEXT_EQUAL':headerNormalizedEqual?'TEXT_EQUAL_AFTER_REPEATED_HEADER_NORMALIZATION':!old?'BASELINE_BODY_UNAVAILABLE':'TEXT_DIFFERENCE_REVIEW_REQUIRED',comparisonDoesNotVerifyPdfLayout:true,matchCount:matches.length,adjacentRepeatedHeadingsCombined:consecutive,canonicalBindingChanged:false};
  });
  return {bookCode:`BOOK-${n}`,file,pdf,pages,text,chunks,registered,rows};
 });
}
export function evidence(book,sectionCode,quote){
 const row=book.rows.find(r=>r.sectionCode===sectionCode);if(!row?.candidateSpan)throw Error('SECTION_NOT_ALIGNED:'+sectionCode);
 const normalized=normalize(quote),[start,end]=row.candidateSpan,body=book.text.slice(start,end),offset=body.indexOf(normalized);
 if(offset<0)throw Error('QUOTE_NOT_IN_CANDIDATE:'+sectionCode);
 const absolute=start+offset,last=absolute+normalized.length;
 return {sourcePath:book.file,sourcePdfSha256:book.pdf.sourcePdfSha256,sectionCode,candidateOnly:true,normalizedOffsets:[absolute,last],pages:[book.pages.find(p=>p.end>absolute).pdfPage,book.pages.find(p=>p.end>=last).pdfPage],quote:normalized,quoteSha256:digest(normalized)};
}
