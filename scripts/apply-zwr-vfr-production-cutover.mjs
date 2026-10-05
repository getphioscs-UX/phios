import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const root='docs/reports/ziwei/vfr-r1',bindingPath='functions/report-delivery/ziwei-canonical-person-binding.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const p of [root+'/LIVE-RESULT.json',root+'/LIVE-EVIDENCE.json',root+'/HUMAN-DECISION.json','tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html'])assert(fs.existsSync(p),'missing cutover evidence: '+p);
const live=read(root+'/LIVE-RESULT.json'),evidence=read(root+'/LIVE-EVIDENCE.json'),decision=read(root+'/HUMAN-DECISION.json');
assert.equal(live.status,'PASS');assert.equal(evidence.pageCount,47);assert.equal(evidence.diagramCount,15);assert(evidence.providerCalls<=1);assert.equal(evidence.semanticReviewCalls,0);
assert.equal(decision.decision,'ACCEPT');assert.equal(decision.liveResultSha256,hash(root+'/LIVE-RESULT.json'));assert.equal(decision.reviewHtmlSha256,hash('tools/review/ZWR-VFR-R1-HUMAN-REVIEW.html'));
let src=fs.readFileSync(bindingPath,'utf8');
if(src.includes("ziwei-vfr-r1-generation.js")){
 console.log('PASS ZWR-VFR production cutover already applied.');
 process.exit(0);
}
assert(src.includes("import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';"),'unexpected canonical binding import');
assert(src.includes('return generateZiweiProfessionalSynthesisR5Candidate(context,selection,{loadSubject:async(owner,id)=>{'),'unexpected canonical binding call');
src=src.replace("import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';","import {generateZiweiVfrR1Candidate} from './ziwei-vfr-r1-generation.js';");
src=src.replace('return generateZiweiProfessionalSynthesisR5Candidate(context,selection,{loadSubject:async(owner,id)=>{','return generateZiweiVfrR1Candidate(context,selection,{loadSubject:async(owner,id)=>{');
fs.writeFileSync(bindingPath,src);
fs.writeFileSync(root+'/PRODUCTION-CUTOVER.json',JSON.stringify({
 schemaVersion:'ZWR-VFR-R1-PRODUCTION-CUTOVER-v1',
 cutoverAt:new Date().toISOString(),
 from:'ZIWEI-PROFESSIONAL-SYNTHESIS-R5-GENERATION-v1',
 to:'ZIWEI-VFR-R1-GENERATION-v1',
 oldHotPathRetired:true,
 evidence:{liveResultSha256:decision.liveResultSha256,reviewHtmlSha256:decision.reviewHtmlSha256},
 providerPolicy:'ONE_CALL_SOL_BILINGUAL',
 semanticAiReviewCalls:0,
 physicalPageCount:47,
 deterministicDiagramCount:15
},null,2)+'\n');
console.log('PASS ZWR-VFR production cutover applied. Old R5 customer hot path retired from canonical binding.');
