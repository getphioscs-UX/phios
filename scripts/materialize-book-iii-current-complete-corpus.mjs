import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const dir='.tmp/knowledge-manuscripts/book-3-owner-final-20261011-efbfdd21fa21/positioned-candidate';
const extraction=JSON.parse(fs.readFileSync(dir+'/full-extraction.json'));
const old=JSON.parse(fs.readFileSync('.tmp/free-ask-manuscripts/books/book-3/materialized/v1/reviewed/retrieval-corpus.json'));
const label=value=>String(value).normalize('NFKC').replace(/^[^\p{Script=Han}A-Za-z0-9]+/u,'').split(/[|｜]/u)[0].replace(/\s+/gu,'');
const compact=value=>String(value).normalize('NFKC').replace(/\s+/gu,'');
const markers=[];let offset=0;
for(const page of extraction.pages){
  for(let i=0;i<page.lines.length;i++){
    const line=page.lines[i];
    const prior=old.records.find(r=>label(r.heading)===label(line.text));
    const part=/^[^\p{Script=Han}\d]*第[89八九]部[|｜]/u.test(line.text);
    // Native chapter identity plus PDF heading typography admits alternate
    // glyphs (e.g. the robot icon) without losing the actual chapter.
    if(part || (/^[✦◈◆◇❖]/u.test(line.text) || prior && line.fontSize>15)){
      let heading=line.text.replace(/^[^\p{Script=Han}A-Za-z0-9]+/u,'');
      if(!part)for(let j=i+1;j<page.lines.length && Math.abs(page.lines[j].fontSize-line.fontSize)<0.1 && !/^[✦◈◆◇❖]/u.test(page.lines[j].text);j++)heading+=page.lines[j].text;
      markers.push({offset,page:page.pageNumber,heading,prior,part});
    }
    offset+=line.text.length+(i<page.lines.length-1?1:0);
  }
  offset+=page.pageNumber<extraction.pageCount?3:0;
}
assert.equal(offset,extraction.corpus.length);
assert.equal(markers.filter(m=>!m.part).length,103,'ALL_SOURCE_CHAPTERS_RECONCILED');
assert(markers.filter(m=>!m.part).every(m=>m.prior),'UNMATCHED_NATIVE_CHAPTER');
const bounds=[{offset:0,page:1,heading:'Front Matter',part:false},...markers];
const records=bounds.map((m,i)=>{
  const end=bounds[i+1]?.offset??extraction.corpus.length,text=extraction.corpus.slice(m.offset,end);
  return {sectionCode:m.prior?.sectionCode||(!i?'CM-B3-CURRENT-FRONT':`CM-B3-CURRENT-PART-${i}`),segmentType:!i?'FRONT_MATTER':m.part?'PART_INTRODUCTION':'SECTION',heading:m.heading,headingLabel:label(m.heading),partCode:m.prior?.partCode||null,sequence:i,startPage:m.page,endPage:bounds[i+1]?.page??extraction.pageCount,startOffset:m.offset,endOffset:end,text,textSha256:sha(text),retrievalEligible:!!m.prior,quality:{state:'CURRENT_SOURCE_TEXT_LAYER_CANDIDATE',answerAcceptance:false}};
});
assert.equal(records.map(r=>r.text).join(''),extraction.corpus);
assert.equal(new Set(records.map(r=>r.sectionCode)).size,records.length);
const corpus={schemaVersion:'PHI-OS-MANUSCRIPT-RETRIEVAL-CORPUS-v1',bookCode:'BOOK-3',locale:'zh-Hans',version:extraction.version,sourceSha256:extraction.sourceSha256,corpusSha256:extraction.corpusSha256,recordCount:records.length,records};
fs.writeFileSync(dir+'/retrieval-corpus.json',JSON.stringify(corpus,null,2)+'\n');
const scopes=JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-text-scope-candidates-v3.json')).records.filter(r=>r.bookCode==='BOOK-3');
const rangeComparison=scopes.map(s=>{
  const oldRecord=old.records.find(r=>r.sectionCode===s.sectionCode),current=records.find(r=>r.sectionCode===s.sectionCode);
  const oldText=compact(oldRecord.text.slice(s.startOffset,s.endOffset)),newText=compact(current.text);
  return {sectionCode:s.sectionCode,heading:s.heading,oldSourceSha256:old.sourceSha256,currentSourceSha256:corpus.sourceSha256,oldRange:[s.startOffset,s.endOffset],oldRangeFoundInCurrentText:newText.includes(oldText),state:newText.includes(oldText)?'TEXT_EQUIVALENT_NEW_BINDING_AND_ANSWER_REGRESSION_PENDING':'TEXT_DIFFERENCE_REQUIRES_REVIEW',productionChanged:false};
});
const chapterComparison=records.filter(r=>r.segmentType==='SECTION').map(r=>{
  const previous=old.records.find(o=>o.sectionCode===r.sectionCode);
  return {sectionCode:r.sectionCode,heading:r.heading,oldPages:[previous.startPage,previous.endPage],currentPages:[r.startPage,r.endPage],normalizedBodyEquivalent:compact(previous.text)===compact(r.text),oldTextSha256:previous.textSha256,currentTextSha256:r.textSha256,state:'EXTRACTION_COMPARISON_NOT_ANSWER_ACCEPTANCE'};
});
fs.writeFileSync('tools/review/free-ask-manuscript-r1/BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json',JSON.stringify({at:new Date().toISOString(),sourceSha256:corpus.sourceSha256,corpusSha256:corpus.corpusSha256,corpusPath:dir+'/retrieval-corpus.json',records:records.length,chapters:103,partIntroductions:2,frontMatter:1,partition:'EXACT_PARTITION_OF_CURRENT_POSITIONED_TEXT_NOT_FULL_PDF_LOSSLESS',alternateGlyphChapter:{sectionCode:'CM-B3V1-P9-S030',page:344,glyph:'🤖',identity:'算法协调'},rangeComparison,chapterComparison,oldSourceAndCorpusPreserved:true,providerCalls:0,answerAcceptance:false,productionChanged:false},null,2)+'\n');
console.log({records:records.length,chapters:103,ranges:rangeComparison.map(r=>({heading:r.heading,state:r.state})),normalizedEquivalentChapters:chapterComparison.filter(c=>c.normalizedBodyEquivalent).length});
