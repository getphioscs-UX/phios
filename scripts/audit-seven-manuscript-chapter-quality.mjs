import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='tools/review/free-ask-manuscript-r1/';
const ledger=JSON.parse(fs.readFileSync(root+'SEVEN-BOOK-CHAPTER-COVERAGE.json'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const books=ledger.books.map(book=>{
 const corpus=JSON.parse(fs.readFileSync(book.corpusPath));
 const chapters=book.chapters.filter(c=>c.segmentType==='SECTION').map(chapter=>{
  const record=corpus.records.find(r=>r.sectionCode===chapter.sectionCode);
  const text=String(record.text||'');
  const structuralChecks={nonEmpty:text.trim().length>0,storedDigestMatches:!record.textSha256||record.textSha256===sha(text),orderedPageBounds:record.startPage<=record.endPage,replacementCharacterAbsent:!text.includes('\uFFFD')};
  const matches=regex=>[...text.matchAll(regex)].slice(0,12).map(m=>({offset:m.index,context:text.slice(Math.max(0,m.index-45),Math.min(text.length,m.index+85))}));
  const dependencies={figureSignals:matches(/图\s*[0-9一二三四五六七八九十]|如图|下图|上图|箭头|横轴|纵轴|图表/gu),footnoteSignals:matches(/脚注|注释|附注|\[[0-9]+\]|[¹²³⁴⁵⁶⁷⁸⁹]/gu),state:'PENDING_SOURCE_PAGE_CLASSIFICATION',absenceOfSignalsProvesNoDependency:false};
  return {...chapter,extractionQuality:{structuralChecks,state:Object.values(structuralChecks).every(Boolean)?'STRUCTURAL_TEXT_CHECK_PASS_NOT_PDF_COMPLETENESS':'STRUCTURAL_FAILURE',pdfVisualCompleteness:'NOT_VERIFIED_PER_CHAPTER'},diagramFootnoteDependencies:dependencies,supportedQuestionTypes:{candidate:['DEFINITION',...( /因为|因此|意味着|取决于/.test(text)?['MECHANISM']:[]),...(/如果|条件|只有|并不|不能/.test(text)?['CONDITIONS_AND_BOUNDARIES']:[]),...(/区别|不同于|并不是.*而是/.test(text)?['COMPARISON']:[])],accepted:[],classification:'CONTENT_CUES_ONLY_NOT_ANSWER_ACCEPTANCE'},answerValidation:{questionFit:'PENDING',citationSupportsConclusion:'PENDING',qualifiersPreserved:'PENDING',wholeChapter:'NOT_VERIFIED'}};
 });
 return {...book,chapters,structurallyCheckedChapters:chapters.length,structuralFailures:chapters.filter(c=>c.extractionQuality.state==='STRUCTURAL_FAILURE').length};
});
const total=books.reduce((n,b)=>n+b.chapters.length,0);assert.equal(total,982);
const result={at:new Date().toISOString(),totalChapters:total,wholeChapterVerified:0,wholeChapterAdmissionProven:0,wholeChapterLiveVerified:0,remainingWholeChapterClosure:982,existingPartialLiveRanges:10,sourceReadabilityAcceptanceNotEquivalentToWholeChapterCustomerClosure:true,structurallyChecked:982,structuralFailures:books.reduce((n,b)=>n+b.structuralFailures,0),books,providerCalls:0,providerCostUSD:0};
fs.writeFileSync(root+'SEVEN-BOOK-CHAPTER-QUALITY-AUDIT.json',JSON.stringify(result,null,2)+'\n');
for(const name of ['SEVEN-BOOK-COVERAGE.json','CURRENT-IV-VI-MASTER-STATE.json']){const state=JSON.parse(fs.readFileSync(root+name));state.chapterQualityAudit={path:root+'SEVEN-BOOK-CHAPTER-QUALITY-AUDIT.json',totalChapters:982,structurallyChecked:982,wholeChapterVerified:0,wholeChapterAdmissionProven:0,wholeChapterLiveVerified:0,remainingWholeChapterClosure:982,existingPartialLiveRanges:10};fs.writeFileSync(root+name,JSON.stringify(state,null,2)+'\n');}
console.log({chapters:982,structuralFailures:result.structuralFailures,wholeChapterVerified:0,partialLiveRanges:10});
