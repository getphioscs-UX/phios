import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {retrieveQuality,customerAnswer,minimalEvidencePack} from '../../../functions/_lib/knowledge-answer-quality-local.js';
import {understandKirQuestion,runKirR2Pipeline} from '../../../functions/_lib/kir-r2-intelligence.js';
import {rerankKirContentFragments} from '../../../functions/_lib/kir-r2-answer-intelligence.js';
import {loadWorldQualityAnswer} from '../../../functions/_lib/world-answer-quality.js';
const dir='tools/review/knowledge-answer-quality-r1/',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const units=read(dir+'ARGUMENT-INDEX.json').units,concepts=read('content/registry/concepts.json').concepts;
const profiles=read('content/knowledge/knowledge-intelligence-r2/semantic-profiles/successors/book4-a6/kir-r2-book-i-iv-semantic-retrieval-profiles-v2.json').profiles;
const env={ASSETS:{fetch:async req=>{const p=new URL(req.url).pathname.slice(1);return p==='content/world/local-answer-quality-r1.json'?Response.json(read(p)):new Response('',{status:403});}}};
const results=[];
for(const c of read(dir+'QUESTIONS.json').cases){
 const start=performance.now();const understanding=understandKirQuestion(c),raw=units.filter(u=>u.language===c.locale).map(u=>({...u,sourceId:u.id,locale:u.language}));
 const before=rerankKirContentFragments({understanding,expansion:{canonicalCandidates:[]},contentSources:raw});
 const after=retrieveQuality({...c,units,concepts,profiles});const reviewedMechanism=await loadWorldQualityAnswer({...c,env});
 results.push({...c,before:{method:'EXISTING_KIR_CONTENT_SCORER_FULL_PUBLIC_CORPUS_NO_EXPECTED_SOURCE_INJECTION',top5:before.results.slice(0,5).map(r=>({id:r.sourceId,score:r.rerankScore,text:r.text,href:r.href}))},after:{readingTop5:after.relatedReading.slice(0,5).map(r=>({id:r.sourceId,score:r.score,text:r.text,classification:r.classification})),coverage:after.coverage,requirements:after.contract,answer:reviewedMechanism||customerAnswer(after),answerRoute:reviewedMechanism?'EXISTING_WORLD_REVIEWED_MECHANISM_LOCAL_CANDIDATE':'EVIDENCE_REVIEW_PENDING_NO_SYNTHESIS',evidencePack:minimalEvidencePack(after)},elapsedMs:Math.round(performance.now()-start)});
}
fs.writeFileSync(dir+'PAIRED-RESULTS.json',JSON.stringify({at:new Date().toISOString(),results,metrics:{humanGoldAvailable:false,recallAt5:null,evidencePrecisionAt5:null,subquestionCoverage:null,answerAccuracy:null,citationCorrectness:null,unsupportedAnswerRate:null,reason:'HUMAN_ANNOTATION_PENDING',machineRoutes:results.reduce((a,r)=>(a[r.after.answerRoute]=(a[r.after.answerRoute]||0)+1,a),{}),providerCalls:0}},null,2));
const old=read('content/knowledge/knowledge-intelligence-r2/benchmarks/kir-r2-w15r-100-question-answer-benchmark-v2.json'),oldResults=[];
for(const c of old.cases){const question=c.question,locale=c.locale||'zh-Hans';const result=retrieveQuality({question,locale,units,concepts,profiles});const candidates=rerankKirContentFragments({understanding:understandKirQuestion({question,locale}),expansion:{canonicalCandidates:[]},contentSources:units.filter(u=>u.language===locale).map(u=>({...u,sourceId:u.id,locale:u.language}))}).results.slice(0,20);const before=await runKirR2Pipeline({question,locale,profiles,articleSources:candidates});oldResults.push({id:c.id||c.caseId,question,locale,historicalExpected:c.expected,before:{guard:before.guard,answer:before.answer.text,used:before.answer.usedEvidenceIds,candidateLimit:20},after:{top5:result.relatedReading.slice(0,5).map(r=>r.sourceId),coverage:result.coverage},goldStatus:'HISTORICAL_EXPECTED_NOT_NEW_HUMAN_GOLD'});}
fs.writeFileSync(dir+'OLD-100-REPLAY.json',JSON.stringify({at:new Date().toISOString(),cohort:'Full local public corpus; differs from expected-source injected historical run; no old receipt changed',results:oldResults},null,2));
console.log(JSON.stringify({paired:results.length,priorTen:results.filter(r=>r.cohort==='PRIOR_TEN_BILINGUAL').length,oldReplay:oldResults.length,routes:results.reduce((a,r)=>(a[r.after.answerRoute]=(a[r.after.answerRoute]||0)+1,a),{})}));
