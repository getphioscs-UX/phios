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
const registryPath='functions/personal-reading/visual-first/ziwei-vfr-accepted-deep-manuscript-registry.js';
const generatorPath='functions/report-delivery/ziwei-vfr-r1-generation.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');

for(const p of [repairedPath,publicationPath,cachePath,decisionPath,reviewPath,fitPath,registryPath,generatorPath,bindingPath]){
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
for(const forbidden of ['composeZwrVfrOneCall','OPENAI_API_KEY','invokeOpenAIStructured','ZIWEI_R5_PAI_REGISTRY']){
 assert(!generator.includes(forbidden),'production generator must not depend on live provider path: '+forbidden);
}
assert(generator.includes('resolveAcceptedZwrVfrDeepManuscript'),'production generator must resolve accepted manuscript registry');
assert(generator.includes('providerCalls:0'),'production generator must declare zero provider calls');

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
 to:'ZIWEI-VFR-R1-DEEP-REGISTRY-GENERATION-v2',
 oldHotPathRetiredFromCanonicalBinding:true,
 providerPolicy:'ACCEPTED_DEEP_MANUSCRIPT_REGISTRY_ZERO_PROVIDER',
 providerCallsDuringProductionPublication:0,
 semanticAiReviewCalls:0,
 acceptedAuthorityDigest:repaired.authorityDigest,
 acceptedManuscriptResultDigest:repaired.resultDigest,
 publicationIrDigest:publication.publicationIrDigest,
 humanDecisionSha256:hash(decisionPath),
 reviewHtmlSha256:hash(reviewPath),
 physicalPageCount:pages,
 adaptiveFitProfileVersion:fit.schemaVersion,
 deterministicDiagramCount:15,
 unmatchedAuthorityPolicy:'FAIL_CLOSED_AUTHORING_REQUIRED',
 rollbackScript:'scripts/rollback-zwr-vfr-production-cutover.mjs'
};
fs.writeFileSync(root+'/PRODUCTION-CUTOVER.json',JSON.stringify(receipt,null,2)+'\n');
console.log('PASS ZWR-VFR Deep Manuscript production cutover applied: accepted-registry zero-provider hot path active; unmatched authority fails closed; rollback retained.');
