import fs from 'node:fs';
import {freezeR32Preview} from './financial-r3-2-local-preview.mjs';
import {renderMergedReport} from '../functions/financial/holistic-planning-product/publication-merged-renderer.js';
export function longFixture(){
 const saved='tools/review/financial-publication-merged/correction-r3/long-saved-base.projection.json';const p=JSON.parse(fs.readFileSync(fs.existsSync(saved)?saved:'tools/review/financial-publication-r3-1/complete-en.projection.json'));
 const original=JSON.parse(fs.readFileSync('tools/review/financial-publication-r3-2/complete.snapshot.json'));
 const {context,input}=structuredClone(original.sourceSnapshot);context.sourceDigest=p.source.contentDigest;context.sourceDraftRef=p.source.sourceRef;context.asOfDate=p.asOfDate;
 input.retirement.years=40;input.retirement.inflation.effectivePeriod='2026-2073';input.retirementFunding.endYear=2073;
 input.retirementFunding.returnAssumption.effectivePeriod='2026-2073';input.retirementFunding.feeAssumption.effectivePeriod='2026-2073';
 input.education.stages=Array.from({length:12},(_,i)=>({...structuredClone(input.education.stages[i%2]),id:'STAGE_'+i,startYear:2030+i,years:5}));
 input.educationFunding.endYear=2045;input.educationFunding.contributionEndYear=2045;
 input.educationFunding.returnAssumption.effectivePeriod='2026-2045';input.educationFunding.feeAssumption.effectivePeriod='2026-2045';
 // Explicit TEST_ONLY source, compiled by the same canonical FCR; never synthetic result rows.
 input.estate.documents=Array.from({length:24},(_,i)=>({...structuredClone(input.estate.documents[i%3]),id:'TEST_DOC_'+i}));
 input.events=Array.from({length:32},(_,i)=>({...structuredClone(input.events[i%4]),id:'TEST_EVENT_'+i,date:(2027+i)+'-01-01'}));
 const envelope=freezeR32Preview(p,context,input);
 return {p,envelope,detailStressOnly:false};
}
if(process.argv[1]?.endsWith('financial-merged-correction-fixtures.mjs')){
 const root='tools/review/financial-publication-merged',f=longFixture();
 fs.writeFileSync(root+'/correction-r3/long-appendix.fixture.json',JSON.stringify({...f,testOnly:true,note:'Long model horizon and explicit synthetic documents/events; legacy core source unchanged.'},null,2));
 console.log('LONG_APPENDIX canonical FCR models compiled',f.envelope.result.models.map(m=>[m.modelId,m.eligible,m.rows.length]));
}
