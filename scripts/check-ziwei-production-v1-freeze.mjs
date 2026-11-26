import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {frozenZwrV1Bytes} from './lib/final-zwr-input-successor.mjs';
const accepted=JSON.parse(fs.readFileSync('content/reports/ziwei/production-v1-acceptance.json'));
assert.equal(accepted.decision,'ACCEPT');assert.equal(accepted.frozen,true);
// Explicit Owner-retired generated review HTML only; actual source/evidence remains frozen.
const retiredGeneratedReviewHtml=new Set([
 ...Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0')).flatMap(id=>['en','zh-Hans'].map(locale=>'tools/review/ZPA-CONTROLLED-'+id+'-'+locale+'.html')),
 ...['A','B'].flatMap(id=>['en','zh-Hans'].map(locale=>'tools/review/ZIWEI-FULL-REPORT-R2-SUBJECT_'+id+'-'+locale+'.html'))
]);
assert.equal(retiredGeneratedReviewHtml.size,28);
assert.equal(accepted.productionAdmission,'NOT_GRANTED','Composer acceptance is not production admission');
let retiredHtmlCount=0,verifiedSourceAndEvidenceCount=0;
for(const [path,hash] of Object.entries(accepted.files)){
 if(retiredGeneratedReviewHtml.has(path)){retiredHtmlCount++;continue;}
 assert.equal(createHash('sha256').update(frozenZwrV1Bytes(path,hash)).digest('hex'),hash,'Frozen production V1 artifact changed: '+path);verifiedSourceAndEvidenceCount++;
}
console.log('PASS accepted Zi Wei composer V1 source/evidence freeze: '+verifiedSourceAndEvidenceCount+' identities verified; '+retiredHtmlCount+' explicitly retired generated review HTML obligations excluded. Original ACCEPT/frozen records unchanged; production admission NOT_GRANTED.');
