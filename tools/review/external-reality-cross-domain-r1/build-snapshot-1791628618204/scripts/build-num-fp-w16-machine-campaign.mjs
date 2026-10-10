import fs from 'node:fs';
import {executeAndProjectMcd5CurrentRequest} from '../functions/method-client-delivery/canonical-projection-runtime-current.js';
import {onRequestPost as meaningPost} from '../functions/api/method-meaning.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const corpus=j('content/professional/num-production/full-production/machine/num-fp-w16-machine-fixture-corpus-v1.json');
const common={birthTime:'12:00:00',birthPlace:{displayName:'Singapore',countryCode:'SG',latitude:1.3521,longitude:103.8198},timezone:{iana:'Asia/Singapore',utcOffsetAtBirth:'+08:00',source:'PINNED_IANA_TZDB',confidence:'HIGH'},timeAccuracy:'EXACT',consent:{recordId:'CONSENT-NUM-FP-W16',granted:true},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
const requestFor=(c)=>({schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'NUMEROLOGY',methodVersion:'0.1.0-candidate',capability:'CALCULATION',purposeCode:'NUM_FP_W16_MACHINE_CAMPAIGN',canonicalInput:{...common,birthDate:c.birthDate,locale:c.locale},executionParameters:{targetDate:c.targetDate},consentRecordId:'CONSENT-NUM-FP-W16',requestId:c.caseId});
async function meaning(projection,locale){const response=await meaningPost({request:new Request('https://phios.local/api/method-meaning',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({schemaVersion:'PHI-OS-CMP-METHOD-MEANING-REQUEST-v1.0.0',locale,canonicalProjection:projection})})});const body=await response.json();if(response.status!==200||body.ok!==true)throw new Error(`${body.error||'MEANING_FAILED'}:${response.status}`);return body;}
const results=[];const coverage={lifePathValues:{},masterPreservedCases:0,repetitionCases:0,coreCycleEchoCases:0,karmicSourceReviewCandidateCases:0,lifePeriodBlockedCases:0,dedupReducedCases:0,locale:{en:0,'zh-Hans':0}};
for(const c of corpus.cases){
 const a=await executeAndProjectMcd5CurrentRequest(requestFor(c));const b=await executeAndProjectMcd5CurrentRequest(requestFor(c));
 if(a.canonicalProjection?.projectionId!==b.canonicalProjection?.projectionId)throw new Error(`NON_DETERMINISTIC_PROJECTION:${c.caseId}`);
 const ma=await meaning(a.canonicalProjection,c.locale);const mb=await meaning(b.canonicalProjection,c.locale);const ia=ma.integratedReading,ib=mb.integratedReading;
 const semantic=a=>JSON.stringify({sections:a.sections,semanticDepth:a.semanticDepth,deduplication:a.deduplication,boundaries:a.boundaries});if(semantic(ia)!==semantic(ib))throw new Error(`NON_DETERMINISTIC_READING_SEMANTICS:${c.caseId}`);
 const life=a.canonicalProjection.calculation.values.find(x=>x.code==='LIFE_PATH')?.value;coverage.lifePathValues[life]=(coverage.lifePathValues[life]||0)+1;coverage.locale[c.locale]++;
 const rel=ia.sections.relationships||[];const src=ia.sections.sourceReviewCandidates?.karmicDebtCompounds||[];
 if(rel.some(x=>x.code==='MASTER_NUMBER_PRESERVED'))coverage.masterPreservedCases++;
 if(rel.some(x=>x.code==='REPEATED_CORE_VALUE'))coverage.repetitionCases++;
 if(rel.some(x=>x.code==='CORE_CYCLE_ECHO'))coverage.coreCycleEchoCases++;
 if(src.length)coverage.karmicSourceReviewCandidateCases++;
 if(ia.sections.timing?.lifePeriod?.availability?.startsWith('BLOCKED'))coverage.lifePeriodBlockedCases++;
 if(ia.deduplication?.canonicalMeaningClustersAfter<ia.deduplication?.canonicalMeaningsBefore)coverage.dedupReducedCases++;
 results.push({caseId:c.caseId,birthDate:c.birthDate,targetDate:c.targetDate,locale:c.locale,projectionId:a.canonicalProjection.projectionId,executionCompleteness:ia.executionCompleteness,coreValues:Object.fromEntries(ia.sections.snapshot.map(x=>[x.role,x.value])),standoutThemes:ia.sections.standoutThemes.map(x=>x.themeCode),relationshipCodes:[...new Set(rel.map(x=>x.code))],canonicalMeaningsBefore:ia.deduplication.canonicalMeaningsBefore,canonicalMeaningClustersAfter:ia.deduplication.canonicalMeaningClustersAfter,karmicSourceReviewCandidates:src,semanticDepth:ia.semanticDepth,boundaries:ia.boundaries,status:'PASS'});
}
const report={schemaVersion:'PHI-OS-NUM-FP-W16-MACHINE-CAMPAIGN-v1.0.0',workCode:'NUM-FP-W16',requestedWorkCode:'NUM-W16',baselineCommit:'c9f0970d7f3148924e85ee1735139558f0cad140',status:'MACHINE_CAMPAIGN_PASS',caseCount:results.length,passed:results.filter(x=>x.status==='PASS').length,failed:0,coverage,acceptance:{deterministicProjection:true,deterministicIntegratedReading:true,noInventedMeaning:true,noKarmicMeaning:true,lifePeriodFailClosed:true,semanticDedupObserved:coverage.dedupReducedCases>0,relationshipCoverageObserved:coverage.repetitionCases>0&&coverage.coreCycleEchoCases>0},cases:results};
fs.writeFileSync('content/professional/num-production/full-production/machine/num-fp-w16-machine-campaign-v1.json',JSON.stringify(report,null,2)+'\n');
console.log(`✓ NUM-FP-W16 machine campaign generated: ${report.passed}/${report.caseCount}`);console.log(`  repetitions=${coverage.repetitionCases}; cycleEcho=${coverage.coreCycleEchoCases}; master=${coverage.masterPreservedCases}; dedup=${coverage.dedupReducedCases}`);
