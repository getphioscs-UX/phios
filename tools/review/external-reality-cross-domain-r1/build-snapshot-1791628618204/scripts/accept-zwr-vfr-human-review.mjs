import fs from 'node:fs';
import {createHash} from 'node:crypto';

const root='docs/reports/ziwei/vfr-r1';
const decision=String(process.argv[2]||'').toUpperCase();
if(decision!=='ACCEPT')throw Error('EXPLICIT_ACCEPT_REQUIRED');

const repairedPath=root+'/five-call-experiment/REPAIRED-RESULT.json';
const publicationPath=root+'/DEEP-PUBLICATION-IR.json';
const cachePath=root+'/DEEP-RENDER-CACHE.json';
const reviewPath='tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html';
for(const p of [repairedPath,publicationPath,cachePath,reviewPath])if(!fs.existsSync(p))throw Error('ZWR_VFR_REVIEW_ARTIFACT_REQUIRED:'+p);

const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const publication=JSON.parse(fs.readFileSync(publicationPath,'utf8'));
const cache=JSON.parse(fs.readFileSync(cachePath,'utf8'));
if(cache.providerCallsDuringRerender!==0)throw Error('ZWR_VFR_ACCEPT_REQUIRES_ZERO_COST_RERENDER');

const receipt={
 schemaVersion:'ZWR-VFR-R1-DEEP-HUMAN-DECISION-v2',
 decision:'ACCEPT',
 acceptedAt:new Date().toISOString(),
 repairedResultSha256:hash(repairedPath),
 publicationIrSha256:hash(publicationPath),
 reviewHtmlSha256:hash(reviewPath),
 publicationIrDigest:publication.publicationIrDigest,
 renderCacheKey:cache.cacheKey,
 physicalPageCount:(fs.readFileSync(reviewPath,'utf8').match(/class="zv-page/g)||[]).length,
 deterministicDiagramCount:15,
 scope:'Browser/print Deep Manuscript visual-first publication candidate only; no authority expansion; production cutover separately gated.'
};
fs.writeFileSync(root+'/HUMAN-DECISION.json',JSON.stringify(receipt,null,2)+'\n');
console.log('HUMAN ACCEPT ZWR-VFR-R1 Deep Manuscript publication recorded. Production cutover is still not automatic.');
