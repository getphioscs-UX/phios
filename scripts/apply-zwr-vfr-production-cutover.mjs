import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root='docs/reports/ziwei/vfr-r1';
const bindingPath='functions/report-delivery/ziwei-canonical-person-binding.js';
const repairedPath=root+'/five-call-experiment/REPAIRED-RESULT.json';
const publicationPath=root+'/DEEP-PUBLICATION-IR.json';
const cachePath=root+'/DEEP-RENDER-CACHE.json';
const decisionPath=root+'/HUMAN-DECISION.json';
const reviewPath='tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html';
const fitPath=root+'/PUBLICATION-FIT-PLAN.json';
const generatorPath='functions/report-delivery/ziwei-vfr-r1-generation.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');

for(const p of [repairedPath,publicationPath,cachePath,decisionPath,reviewPath,fitPath,generatorPath,bindingPath]){
 assert(fs.existsSync(p),'missing cutover evidence: '+p);
}

const repaired=read(repairedPath);
const publication=read(publicationPath);
const cache=read(cachePath);
const decision=read(decisionPath);
const fit=read(fitPath);
const reviewHtml=fs.readFileSync(reviewPath,'utf8');

assert.equal(repaired.status,'PASS');
assert.equal(repaired.providerUsage.semanticReviewCalls,0);
assert.equal(publication.sourceResultDigest,repaired.resultDigest);
assert.equal(cache.repairedResultDigest,repaired.resultDigest);
assert.equal(cache.publicationIrDigest,publication.publicationIrDigest);
assert.equal(cache.providerCallsDuringRerender,0);
assert.equal(decision.decision,'ACCEPT');
assert.equal(decision.repairedResultSha256,hash(repairedPath));
assert.equal(decision.publicationIrSha256,hash(publicationPath));
assert.equal(decision.reviewHtmlSha256,hash(reviewPath));
assert.equal(decision.publicationIrDigest,publication.publicationIrDigest);
assert.equal(decision.renderCacheKey,cache.cacheKey);

const pages=(reviewHtml.match(/class="zv-page/g)||[]).length;
assert.equal(pages,Number(fit.pageCount));
assert.equal(pages,Number(decision.physicalPageCount));
assert(pages>=50&&pages<=80);
assert.equal(decision.deterministicDiagramCount,15);

const generator=fs.readFileSync(generatorPath,'utf8');
assert(!generator.includes('composeZwrVfrOneCall'),'legacy one-call production path must remain retired');
assert(generator.includes('composeZwrVfrProductionDeepManuscript'),'production generator must use approved automatic Deep Manuscript composer');
assert(generator.includes("providerAuthority:'WRITING_ONLY_AUTOMATIC'"),'production provider authority must be automatic writing only');
assert(generator.includes('semanticReviewCalls:0'),'production semantic AI reviewer must remain disabled');

let src=fs.readFileSync(bindingPath,'utf8');
if(src.includes("import {generateZiweiVfrR1Candidate} from './ziwei-vfr-r1-generation.js';")){
 console.log('PASS ZWR-VFR Deep Manuscript production cutover already applied.');
 process.exit(0);
}

const oldImport="import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';";
const oldDefault='generateCandidate=generateZiweiProfessionalSynthesisR5Candidate';
assert(src.includes(oldImport),'unexpected canonical binding import');
assert(src.includes(oldDefault),'unexpected canonical binding generator default');

src=src.replace(oldImport,"import {generateZiweiVfrR1Candidate} from './ziwei-vfr-r1-generation.js';");
src=src.replace(oldDefault,'generateCandidate=generateZiweiVfrR1Candidate');
fs.writeFileSync(bindingPath,src);

const receipt={
 schemaVersion:'ZWR-VFR-R1-DEEP-PRODUCTION-CUTOVER-v2',
 cutoverAt:new Date().toISOString(),
 from:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5-GENERATION-v1',
 to:'ZIWEI-VFR-R1-AUTO-DEEP-GENERATION-v3',
 oldHotPathRetiredFromCanonicalBinding:true,
 providerPolicy:'AUTO_DEEP_MANUSCRIPT_WRITING_WITH_DETERMINISTIC_GATES',
 providerCallsDuringProductionPublication:0,
 firstGenerationProviderPolicy:'BOUNDED_DEEP_WRITING_PLUS_TARGETED_REPAIR',
 semanticAiReviewCalls:0,
 acceptedAuthorityDigest:repaired.authorityDigest,
 acceptedManuscriptResultDigest:repaired.resultDigest,
 publicationIrDigest:publication.publicationIrDigest,
 humanDecisionSha256:hash(decisionPath),
 reviewHtmlSha256:hash(reviewPath),
 physicalPageCount:pages,
 adaptiveFitProfileVersion:fit.schemaVersion,
 deterministicDiagramCount:15,
 unseenAuthorityPolicy:'AUTO_GENERATE_FROM_CANONICAL_AUTHORITY',
 rollbackScript:'scripts/rollback-zwr-vfr-production-cutover.mjs'
};
fs.writeFileSync(root+'/PRODUCTION-CUTOVER.json',JSON.stringify(receipt,null,2)+'\n');
console.log('PASS ZWR-VFR Deep Manuscript production cutover applied: automatic Deep Manuscript generation active for new canonical Authority; publication/rerender provider calls=0; rollback retained.');
