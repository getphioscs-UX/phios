import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const dir='content/knowledge/structured/successors/master-a-v2-batch3';
const from=dir+'/validation-capture-r1-regression-review.html';
const to='tools/review/MASTER-A-V2-A-BATCH-3-VALIDATION-CAPTURE-R1-REGRESSION-REVIEW.html';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const evidence=JSON.parse(fs.readFileSync(dir+'/check-generated-artifact-preservation-v1.json','utf8'));
const record=evidence.records.find(r=>r.runCapture===from||r.runCapture===to);
assert.equal(record.path,'tools/review/KAP-BOOK-VII-PRODUCTION-ADMISSION-R1-REGRESSION-REVIEW.html');
if(fs.existsSync(from)){const bytes=fs.readFileSync(from);assert.equal(hash(bytes),record.captureSha256);assert.match(bytes.toString(),/Human Review/);assert.equal(fs.existsSync(to),false);fs.renameSync(from,to);assert.equal(hash(fs.readFileSync(to)),record.captureSha256);}
record.runCapture=to;
fs.writeFileSync(dir+'/check-generated-artifact-preservation-v1.json',JSON.stringify(evidence,null,2)+'\n');
fs.writeFileSync(dir+'/regression-review-relocation-v1.json',JSON.stringify({status:'INTERNAL_REVIEW_ARTIFACT_RELOCATED',from,to,sha256:record.captureSha256,bytesUnchanged:true,sourceReview:record.path,knowledgeHtmlExemptionChanged:false},null,2)+'\n');
console.log('Internal regression review relocated byte-for-byte; evidence capture relationship preserved.');
