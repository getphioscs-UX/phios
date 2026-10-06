import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root='docs/reports/ziwei/vfr-r1';
const repairedPath=root+'/five-call-experiment/REPAIRED-RESULT.json';
const publicationPath=root+'/DEEP-PUBLICATION-IR.json';
const cachePath=root+'/DEEP-RENDER-CACHE.json';
const decisionPath=root+'/HUMAN-DECISION.json';
const reviewPath='tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const p of [repairedPath,publicationPath,cachePath,decisionPath,reviewPath])assert(fs.existsSync(p),'missing cutover evidence: '+p);

const repaired=read(repairedPath);
const publication=read(publicationPath);
const cache=read(cachePath);
const decision=read(decisionPath);

assert.equal(repaired.status,'PASS');
assert.equal(repaired.providerUsage.semanticReviewCalls,0);
assert(Number(repaired.providerUsage.totalEstimatedProviderCost)<=1);
assert.equal(publication.sourceResultDigest,repaired.resultDigest);
assert.equal(cache.repairedResultDigest,repaired.resultDigest);
assert.equal(cache.publicationIrDigest,publication.publicationIrDigest);
assert.equal(cache.providerCallsDuringRerender,0);

const html=fs.readFileSync(reviewPath,'utf8');
const pages=(html.match(/class="zv-page/g)||[]).length;
assert(pages>=48&&pages<=60,'accepted bilingual publication page count out of range');
for(let i=1;i<=15;i++){
 const id='ZWD-'+String(i).padStart(2,'0');
 assert.equal((html.match(new RegExp('data-diagram-id="'+id+'"','g'))||[]).length,1,'accepted publication must render '+id+' exactly once');
}

assert.equal(decision.decision,'ACCEPT');
assert.equal(decision.repairedResultSha256,hash(repairedPath));
assert.equal(decision.publicationIrSha256,hash(publicationPath));
assert.equal(decision.reviewHtmlSha256,hash(reviewPath));
assert.equal(decision.publicationIrDigest,publication.publicationIrDigest);
assert.equal(decision.renderCacheKey,cache.cacheKey);
assert.equal(decision.physicalPageCount,pages);
assert.equal(decision.deterministicDiagramCount,15);

const binding=fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8');
assert(binding.includes('ziwei-professional-synthesis-r5-generation.js'),'production binding changed before explicit VFR cutover implementation');

console.log(
 'PASS ZWR-VFR cutover readiness: Deep Manuscript repaired result + '+pages+
 '-page/15-diagram publication + zero-cost rerender + HUMAN ACCEPT are intact. '+
 'Ready for explicit Deep Manuscript production cutover implementation; old R5 hot path still active.'
);
