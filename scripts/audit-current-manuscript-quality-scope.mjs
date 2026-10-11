import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='tools/review/free-ask-manuscript-r1/';
const read=p=>JSON.parse(fs.readFileSync(p));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const manifest=read(dir+'CURRENT-IV-VI-CORPUS-MANIFEST.json');
const labels={4:{20:'从扩展边界到承载迁移',66:'复制、传播、放大与尺度转换',98:'扩展基础设施网络',150:'扩展能力、扩展负载与扩展边界',231:'未来容量、人工扩展与文明阈值',263:'从大型共同体到文明运行',288:'文明的跨世代现实层',310:'文明多层承载与协调架构',337:'文明学习、压缩与能力继承循环',372:'文明失配、碎裂与尺度收缩路径',427:'混合文明载体、继任与载体迁移',428:'八册体系装饰页'},6:{2:'第六册封面及七编目录图',38:'文明重组语法',82:'工业文明的破坏与重组能力',129:'冷战全球 Runtime 图谱',182:'去殖民化后的国家重组',286:'文明如何进入日常生活',287:'个人未来容量',342:'文明重组可能空间',343:'八册体系装饰页'}};
const report=[];
for(const row of manifest.records){
 const n=Number(row.bookCode.slice(5));const root=row.localPath.replace(/retrieval-corpus.json$/,'');const extraction=read(root+'full-extraction.json');const corpus=read(row.localPath);
 assert.equal(sha(extraction.corpus),row.corpusSha256);assert.equal(corpus.records.map(r=>r.text).join(''),extraction.corpus);
 const imagePages=extraction.quality.emptyPages.map(page=>{assert(labels[n][page]);return{page,classification:(n===4&&page===428)||(n===6&&(page===2||page===343))?'DECORATIVE_OR_COVER_WITH_TEXT':'IMAGE_DIAGRAM_WITH_TEXT',correctedTitle:labels[n][page],visualEvidence:`.tmp/free-ask-manuscripts/image-page-audit/BOOK-${n}-${page}.png`,visualReview:'TITLE_AND_STRUCTURE_INSPECTED',fullOcrFidelity:'PARTIAL_NOT_FULL_TRANSCRIPTION_ACCEPTED',answerAdmission:false};});
 const oldPath=n===4?'content/knowledge/manuscripts/extraction/book-4-final-section-inventory-v1.json':'content/registry/successors/eight-volume-v1/book-6-manifest.json';const old=read(oldPath);const chapters=n===4?old.sections.filter(r=>r.segmentType==='SECTION').map(r=>({id:r.sectionCode,titleZh:r.heading})):old.parts.flatMap(p=>p.chapters||[]);
 const matches=chapters.map(c=>{const title=c.titleZh||c.title?.['zh-Hans'];const candidates=corpus.records.filter(r=>r.heading.split(/[|｜]/)[0].trim()===title);return{canonicalChapter:c.id,title,currentSections:candidates.map(r=>({sectionCode:r.sectionCode,heading:r.heading,page:r.startPage})),state:candidates.length===1?'EXACT_TITLE_MATCH':'REQUIRES_ALIGNMENT_REVIEW'};});
 const introduction=n===6?corpus.records.find(r=>r.heading.split(/[|｜]/)[0].trim()==='日常现实'):null;
 const renamed={'苏联 Runtime':'苏联运行','中国 Runtime Versioning':'中国运行版本转换','冷战作为全球 Runtime':'冷战作为全球运行体系','当代 Civilization Atlas':'当代文明图谱'};
 for(const match of matches)if(renamed[match.title]){const current=corpus.records.find(r=>r.heading.split(/[|｜]/)[0].trim()===renamed[match.title]);if(current){match.currentSections=[{sectionCode:current.sectionCode,heading:current.heading,page:current.startPage}];match.state='TITLE_RENAMED_CURRENT_SOURCE_ALIGNED_NOT_CONTENT_EQUIVALENCE';}}
 report.push({bookCode:row.bookCode,sourceSha256:row.sourceSha256,sourceAcceptance:row.sourceAcceptancePath,partitionProof:'LOSSLESS_PARTITION_OF_EXTRACTED_TEXT_ONLY',comparisonBaseline:'PDF textItemsToLines output; NOT all PDF image/diagram/footnote content',recordCount:corpus.records.length,nativeMarkerCount:corpus.records.length-1,extraFrontMatterRecord:corpus.records[0].sectionCode,historicalChapterCount:chapters.length,chapterAlignment:matches,additionalNativeMarker:introduction?{sectionCode:introduction.sectionCode,heading:introduction.heading,page:introduction.startPage,classification:'PART_INTRODUCTION',historicalGroup:'第六编｜日常现实',chapterDeleted:false}:null,imagePages,exactOverprintDedup:{algorithm:'identical str + transform + width + height only; no fuzzy or cross-position removal',removed:extraction.pages.reduce((a,p)=>a+(p.exactOverprintedDuplicateItemsRemoved||0),0),uniqueTextVisualFidelity:'PARTIAL_REQUIRES_BODY_AND_NOTES_REVIEW'},footnoteAndReadingOrder:'PARTIAL_NOT_INFERRED_FROM_ZERO_REPLACEMENT_CHARACTERS'});
}
assert.equal(report.flatMap(r=>r.imagePages).length,21);
fs.writeFileSync(dir+'CURRENT-IV-VI-EXTRACTION-QUALITY-AUDIT.json',JSON.stringify({at:new Date().toISOString(),records:report,totalEmptyTextPages:21,diagramPages:18,decorativePages:3,blankPages:0,providerCalls:0,allPdfContentLossless:false},null,2)+'\n');
// Correct the current claim, preserving immutable corpora and historical receipts.
for(const row of manifest.records){row.partitionCoverage='LOSSLESS_PARTITION_OF_EXTRACTED_TEXT_ONLY';row.nativeMarkerCount=row.recordCount-1;row.canonicalChapterCount=row.bookCode==='BOOK-6'?85:125;row.additionalPartIntroductionCount=row.bookCode==='BOOK-6'?1:0;}
fs.writeFileSync(dir+'CURRENT-IV-VI-CORPUS-MANIFEST.json',JSON.stringify(manifest,null,2)+'\n');
console.log('21/21 empty text pages classified; extracted-text partition verified; full PDF fidelity remains PARTIAL.');
