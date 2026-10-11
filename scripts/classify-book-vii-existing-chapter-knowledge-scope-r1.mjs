import fs from'node:fs';import assert from'node:assert/strict';import{createHash}from'node:crypto';
const dir='tools/review/free-ask-manuscript-r1/',read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex');
const acceptance='content/knowledge/book-vii/v2-cutover/human-acceptance-v1.json',projection='content/knowledge/public/successors/book-vii-v2-source-refresh-v1/published-projection.json';
const published=read(projection).projections;
const mapping=published.nodes.filter(n=>n.bookCode==='BOOK-7').flatMap(n=>{
 const fragments=published.fragments.filter(f=>f.nodeCode===n.nodeCode&&f.locale==='zh-Hans'&&f.kind==='paragraph'&&String(f.text||'').trim());
 if(!fragments.length)return[];
 const sectionId=n.href?.match(/#(14\.\d+)$/)?.[1];assert(sectionId,'Missing explicit canonical chapter anchor');
 return[{nodeCode:n.nodeCode,chapterIds:[sectionId],mappingBasis:{href:n.href,authorityRecordCode:n.authorityRecordCode},fragments:fragments.map(f=>({fragmentCode:f.fragmentCode,digest:f.digest,sourceVersion:f.sourceVersion||null,sourceDigest:f.sourceDigest||null,sectionDigest:f.sectionDigest||null,derivationMode:f.derivationMode||'EXISTING_ACCEPTED_PROJECTION'})),completeChapterCoverage:false,additionalImplicitChapterRelations:'NOT_VERIFIED'}];
});
const acceptedIds=new Set(mapping.flatMap(m=>m.chapterIds));
const basis={acceptance:{path:acceptance,sha256:sha(fs.readFileSync(acceptance))},projection:{path:projection,sha256:sha(fs.readFileSync(projection))},scope:'Only existing nonempty accepted knowledge projections; not acceptance of entire original chapters.'};
for(const filename of ['SEVEN-BOOK-CHAPTER-QUALITY-AUDIT.json','SEVEN-BOOK-CHAPTER-COVERAGE.json']){
 const p=dir+filename,d=read(p),book=d.books.find(b=>b.bookCode==='BOOK-7');assert.equal(book.chapters.filter(c=>c.segmentType==='SECTION').length,100);
 for(const c of book.chapters){if(c.segmentType!=='SECTION')continue;
  c.accessScopes={fullManuscriptReading:'PROTECTED_NOT_PUBLIC',rawInternalManuscriptRetrieval:'NOT_ADMITTED_BY_EXISTING_RAW_MANUSCRIPT_POLICY',boundedKnowledgeAnswer:acceptedIds.has(c.sectionCode)?'EXISTING_ACCEPTED_PROJECTION_ONLY_QA_CONSUMER_VERIFIED':'PENDING_CHAPTER_QUALITY_AND_BOUNDED_PERMISSION_MAPPING',answerQuote:'BOUNDED_ACCEPTED_PROJECTION_ONLY_NOT_FULL_CHAPTER',fullChapterAnswerAcceptance:'NOT_VERIFIED'};
  c.permissionBasis=basis;
  c.reason=acceptedIds.has(c.sectionCode)?'Existing accepted projection can support bounded knowledge; its ten-unit QA evidence does not prove complete manuscript chapter coverage.':'Full prose protection is retained separately. No completed content/answer audit or governed bounded scope exists for this raw chapter yet; this is pending, not a declaration that every knowledge explanation is forbidden.';
 }
 assert(mapping.every(m=>m.chapterIds.every(id=>book.chapters.some(c=>c.sectionCode===id))));
 book.knowledgeScopeClassification={chapterIdentities:100,proseProjectionObjects:mapping.length,acceptedParagraphFragments:mapping.reduce((n,m)=>n+m.fragments.length,0),explicitlyMappedChapterIdentities:acceptedIds.size,existingAcceptedProseProjectionOnly:acceptedIds.size,pendingChapterQualityAndBoundedScope:100-acceptedIds.size,fullManuscriptPublicReadingRestricted:100,wholeChapterQualified:0,rawRetrievalAutomaticallyEnabled:false,projectionToChapterMapping:mapping,projectionIsNotWholeChapter:true};
 fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
}
console.log(JSON.stringify({classified:100,acceptedProjectionOnly:10,pending:90,wholeChapterQualified:0,providerCalls:0}));
