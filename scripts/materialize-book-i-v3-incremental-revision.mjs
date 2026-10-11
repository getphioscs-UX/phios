import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const review='tools/review/free-ask-manuscript-r1/';
const comparison=JSON.parse(fs.readFileSync(review+'BOOK-I-V3-INCREMENTAL-REVISION.json'));
assert.equal(comparison.pageCount,442);
assert.deepEqual(comparison.unmatchedOldTextPages,[13,14,15,16,17,18,19]);
const dir='.tmp/knowledge-manuscripts/book-1-v3-revision-'+comparison.sourceSha256.slice(0,12);
const old=JSON.parse(fs.readFileSync('.tmp/knowledge-manuscripts/book-1-v3/positioned-candidate/full-extraction.json'));
const current=JSON.parse(fs.readFileSync(dir+'/comparison-extraction.json'));
assert.equal(current.sourceSha256,comparison.sourceSha256);
for(let p=1;p<=440;p++)if(p<13||p>19)assert.equal(old.pages[p-1].text,current.pages[(p<13?p:p+2)-1].text,`PDF_PAGE_TEXT_CHANGED_${p}`);
const corpus=JSON.parse(fs.readFileSync('.tmp/knowledge-manuscripts/book-1-v3/positioned-candidate-r2/retrieval-corpus.json'));
const oldText=old.pages.slice(12,19).map(p=>p.text).join('\n\f\n');
const newText=current.pages.slice(12,21).map(p=>p.text).join('\n\f\n');
const start=old.corpus.indexOf(oldText);assert(start>=0);assert.equal(old.corpus.indexOf(oldText,start+1),-1);
const delta=newText.length-oldText.length;
let changed=[];
for(const r of corpus.records){
 assert.equal(r.text,old.corpus.slice(r.startOffset,r.endOffset));
 if(r.startOffset<=start&&r.endOffset>=start+oldText.length){r.text=r.text.slice(0,start-r.startOffset)+newText+r.text.slice(start+oldText.length-r.startOffset);r.endOffset+=delta;r.textSha256=sha(r.text);changed.push(r.sectionCode);}
 else if(r.startOffset>=start+oldText.length){r.startOffset+=delta;r.endOffset+=delta;}
 else assert(r.endOffset<=start,'UNEXPECTED_OVERLAPPING_SECTION');
 r.startPage=r.startPage>=20?r.startPage+2:r.startPage;
 r.endPage=r.endPage>=20?r.endPage+2:r.endPage;
 r.sourcePositionBasis='PDF_PAGE_1_BASED_NOT_PRINTED_PAGE';
}
assert.deepEqual(changed,['B1V3-P0-S001']);
corpus.sourceSha256=comparison.sourceSha256;
corpus.corpusSha256=sha(corpus.records.map(r=>r.text).join(''));
corpus.sourceRevision='v3-revision-20261011-'+comparison.sourceSha256.slice(0,12);
fs.writeFileSync(dir+'/retrieval-corpus.json',JSON.stringify(corpus,null,2)+'\n');
const acceptancePath='content/knowledge/manuscripts/review/book-1-'+corpus.sourceRevision+'-source-acceptance.json';
fs.writeFileSync(acceptancePath,JSON.stringify({schemaVersion:'PHI-OS-MANUSCRIPT-SOURCE-VERSION-ACCEPTANCE-v1',bookCode:'BOOK-1',version:corpus.sourceRevision,status:'HUMAN_ACCEPTED_SOURCE_IDENTITY',scope:'CURRENT_CHINESE_SOURCE_BINARY_ONLY',sourceSha256:corpus.sourceSha256,sourcePath:comparison.sourcePath,byteSize:fs.statSync(comparison.sourcePath).size,ownerStatement:'第一册附件是当前v3的修订稿。442页完整修订稿在desktop，file name PHI-OS-Book-I-v3；9页用于替换第七册介绍之后、目录之前的旧第八册介绍。',historicalSha256:old.sourceSha256,historicalCorpusPreserved:true,remoteByteIdentityVerified:false,extractionAcceptance:false,answerAcceptance:false,fullPublicReadAuthorized:false},null,2)+'\n');
const receipt={at:new Date().toISOString(),state:'LOCAL_INCREMENTAL_CORPUS_MATERIALIZED_NOT_ANSWER_ACCEPTED',sourceSha256:corpus.sourceSha256,previousSourceSha256:old.sourceSha256,sourceAcceptancePath:acceptancePath,corpusPath:dir+'/retrieval-corpus.json',corpusSha256:corpus.corpusSha256,changedRecords:changed,unchangedRecordsReused:274,chapterIdsPreserved:true,headingRepairsPreserved:true,exactTextPageCorrespondence:{old1To12:'same PDF page',old20To440:'new PDF page = old PDF page + 2, including empty pages'},printedPageNumbers:'Original text unchanged outside replacement; not renumbered. PDF offsets are distinct from printed numbering.',replacement:{oldPdfPages:[13,19],newPdfPages:[13,21]},oldFailuresPreserved:true,sourceBinaryAcceptedOnly:true,visualFiguresComparison:'PENDING_NOT_PROVEN_BY_TEXT_EQUALITY',providerCalls:0,productionChanged:false};
fs.writeFileSync(review+'BOOK-I-V3-INCREMENTAL-CORPUS.json',JSON.stringify(receipt,null,2)+'\n');
console.log(receipt);
