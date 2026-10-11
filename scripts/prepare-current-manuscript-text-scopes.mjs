import fs from 'node:fs';
import crypto from 'node:crypto';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(fs.readFileSync('tools/review/free-ask-manuscript-r1/CURRENT-IV-VI-CORPUS-MANIFEST.json'));
const titles={'BOOK-4':['尺度边界','扩展饱和'],'BOOK-6':['什么是文明重组','生活环境']};
const records=manifest.records.flatMap(source=>JSON.parse(fs.readFileSync(source.localPath)).records.filter(r=>titles[source.bookCode].includes(r.heading.split(/[|｜]/)[0].trim())).map(r=>({bookCode:source.bookCode,sourceSha256:source.sourceSha256,corpusSha256:source.corpusSha256,sectionCode:r.sectionCode,sectionSha256:r.textSha256,heading:r.heading,startOffset:0,endOffset:Math.min(r.text.length,1800),scopeState:'TEXT_SCOPE_CANDIDATE',answerAcceptance:'REGRESSION_AND_FRESH_HOLDOUT_REQUIRED',sourceDependency:'SELF_CONTAINED_OPENING_PROSE_NO_OCR_USED',missingDiagramDoesNotBlockThisScope:true,publicFullTextAllowed:false,locale:'zh-Hans'})));
fs.writeFileSync('content/knowledge/source-access/registries/manuscript-text-scope-candidates-v1.json',JSON.stringify({schemaVersion:'MANUSCRIPT_TEXT_SCOPE_CANDIDATES-v1',wholeBookAdmitted:false,records},null,2)+'\n');
console.log('Four bounded prose candidates prepared; not production enabled.');
