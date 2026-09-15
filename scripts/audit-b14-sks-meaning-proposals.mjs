import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=process.argv[2]||'.runtime-evidence/meaning-proposals';
const read=p=>JSON.parse(fs.readFileSync(p)),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base='docs/knowledge/structured-successor/meaning-extraction/';
const tasks=read(base+'meaning-extraction-tasks-v1.json').tasks;
const batches=Array.from({length:5},(_,i)=>`${root}/meaning-proposals-batch-0${i+1}.json`);
const proposals=batches.flatMap(p=>read(p).proposals);
const corpusPath=process.argv[3]||'../KSAR-reviewed/books/book-2/materialized/v1/reviewed/retrieval-corpus.json';
const corpus=read(corpusPath),book3=read(root+'/book3-source-pages.json');
const reviewPath='tools/review/KAU-R6D-Book-III-Manuscript-Readability-Review.html';
let reviewedSections=null;
if(fs.existsSync(reviewPath)){
 const html=fs.readFileSync(reviewPath,'utf8'),marker='const DATA=';
 const offset=html.indexOf(marker);if(offset<0)throw new Error('REVIEW_DATA_MISSING');
 const start=offset+marker.length;let end=start,depth=0,inString=false,escaped=false;
 for(;end<html.length;end++){const c=html[end];if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;}else if(c==='"')inString=true;else if(c==='['||c==='{')depth++;else if(c===']'||c==='}'){if(--depth===0){end++;break;}}}
 reviewedSections=JSON.parse(html.slice(start,end)); // Parse data only; never execute attached HTML scripts.
 if(!Array.isArray(reviewedSections)||new Set(reviewedSections.map(s=>s.sectionCode)).size!==reviewedSections.length)throw new Error('INVALID_REVIEW_SECTIONS');
}
const registry=read('content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json');
const expected2=registry.records.find(r=>r.bookCode==='BOOK-2').retrievalCorpusSha256;
const expected3=read('content/knowledge/manuscripts/completed/book-3-completed-manuscript-v1.json').sourceBinary.sha256;
const normalize=s=>String(s||'').normalize('NFKC').replace(/\s+/gu,'');
const reports=tasks.map(t=>{
 const matches=proposals.filter(p=>p.objectId===t.objectId),issues=[];
 if(matches.length!==1)return {objectId:t.objectId,issues:['MISSING_OR_DUPLICATE_PROPOSAL'],quoteResults:[]};
 const p=matches[0];for(const key of ['candidateId','bookCode','partCode','nodeCode','title'])if(p[key]!==t[key])issues.push('IDENTITY_MISMATCH:'+key);
 if(p.aiAssisted!==true||p.canonicalAuthority!==false||p.reviewState!=='PENDING_HUMAN_REVIEW')issues.push('AUTHORITY_FLAGS_INVALID');
 if(typeof p.definitionZh!=='string'||!p.definitionZh.trim())issues.push('MEANING_MISSING');
 if(!['DIRECT_EXTRACT','GROUNDED_PARAPHRASE'].includes(p.extractionMethod))issues.push('EXTRACTION_METHOD_INVALID');
 if(!p.evidenceQuotes?.length)issues.push('EVIDENCE_MISSING');
 if(!p.claimEvidenceMap?.length||!p.claimEvidenceMap.every(m=>m.claim?.trim()&&m.evidenceQuoteIndexes?.length&&m.evidenceQuoteIndexes.every(i=>Number.isInteger(i)&&i>=0&&i<p.evidenceQuotes.length)))issues.push('CLAIM_MAP_INVALID');
 const quoteResults=(p.evidenceQuotes||[]).map((q,i)=>{
  const section=t.sourceSections.find(s=>s.sectionCode===q.sectionCode);const errors=[];
  if(!section)errors.push('UNMAPPED_SECTION');
  if(section&&section.textSha256!==q.expectedSectionTextSha256)errors.push('EXPECTED_SECTION_HASH_MISMATCH');
  let text='',sourceVerified=false;
  if(t.bookCode==='BOOK-2'){
   const record=corpus.records.find(r=>r.sectionCode===q.sectionCode);text=record?.text||'';
   sourceVerified=hash(corpusPath)===expected2&&record?.sourceTextSha256===section?.textSha256&&createHash('sha256').update(text).digest('hex')===record?.textSha256;
  }else if(section){
   const reviewed=reviewedSections?.find(s=>s.sectionCode===q.sectionCode);
   if(reviewed){text=reviewed.text;sourceVerified=createHash('sha256').update(text).digest('hex')===section.textSha256&&reviewed.textSha256===section.textSha256;}
   else{text=Array.from({length:section.endPage-section.startPage+1},(_,j)=>book3.pages[String(section.startPage+j)]||'').join('\n');sourceVerified=book3.sha256===expected3;}
  }
  const quoteMatched=!!normalize(q.quote)&&normalize(text).includes(normalize(q.quote));
  if(!quoteMatched)errors.push('QUOTE_NOT_FOUND_IN_AVAILABLE_SECTION');
  if(!sourceVerified)errors.push('SOURCE_VERSION_NOT_VERIFIED');
  if(q.pdfPageIndex!=null&&section&&(!Number.isInteger(q.pdfPageIndex)||q.pdfPageIndex<section.startPage||q.pdfPageIndex>section.endPage))errors.push('PAGE_OUTSIDE_SECTION');
  return {quoteIndex:i,sectionCode:q.sectionCode,quoteMatched,sourceVerified,issues:errors};
 });
 return {objectId:t.objectId,bookCode:t.bookCode,definitionPresent:!!p.definitionZh?.trim(),issues,quoteResults,readyForSemanticReview:!issues.length&&quoteResults.length>0&&quoteResults.every(q=>!q.issues.length),humanReviewComplete:false};
});
const report={version:'1.0.0',batchFiles:batches.map(p=>({name:p.split('/').at(-1),sha256:hash(p)})),expected:tasks.length,received:proposals.length,unknownObjectIds:proposals.filter(p=>!tasks.some(t=>t.objectId===p.objectId)).map(p=>p.objectId),sourceVersions:{book2:{actual:hash(corpusPath),expected:expected2},book3:{actual:book3.sha256,expected:expected3}},records:reports,humanAcceptanceComplete:false,registryWriteback:false};
if(reviewedSections)report.book3ReviewEvidence={path:reviewPath,sha256:hash(reviewPath),sections:reviewedSections.length,verification:'EXACT_SECTION_TEXT_SHA256_AGAINST_REGISTERED_TASK_SOURCE',pdfAuthorityReplaced:false};
fs.writeFileSync(base+'meaning-proposals-audit-v1.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({received:proposals.length,readyForSemanticReview:reports.filter(r=>r.readyForSemanticReview).length,quotes:reports.flatMap(r=>r.quoteResults).length,matchedQuotes:reports.flatMap(r=>r.quoteResults).filter(q=>q.quoteMatched).length,issues:reports.filter(r=>!r.readyForSemanticReview).map(r=>({id:r.objectId,issues:[...new Set([...r.issues,...r.quoteResults.flatMap(q=>q.issues)])]}))},null,2));
