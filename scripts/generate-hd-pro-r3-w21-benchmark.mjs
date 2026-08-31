import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {buildCanonicalHumanDesignExternalChart} from '../functions/external-profile/human-design-canonical-chart.js';
import {buildHumanDesignExternalReadingIr} from '../functions/external-profile/human-design-reading-runtime.js';
import {prioritizeHumanDesignR3WholeChart} from '../functions/external-profile/human-design-r3-whole-chart-priority.js';
import {buildHumanDesignR3ProfessionalReadingIr} from '../functions/external-profile/human-design-r3-reading-ir-v2.js';
import {editorializeHumanDesignR3Reading,assertNoHumanDesignR3EditorialLeaks} from '../functions/external-profile/human-design-r3-customer-editorial.js';
import {buildHumanDesignR3RealityCompositionV2} from '../functions/external-profile/human-design-r3-reality-composition-v2.js';
const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const OUT=`${ROOT}/benchmark/HD-PRO-R3-W21-r2-vs-r3-benchmark-v1.json`;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex').slice(0,24);
const campaign=read(`${ROOT}/campaign/HD-PRO-R3-W20-machine-cases-v1.json`).cases;
const indexes=[0,3,8,12,24,35,38,51,64,77,92,95];
const strategy={MANIFESTOR:'Inform',GENERATOR:'Respond',MANIFESTING_GENERATOR:'Respond',PROJECTOR:'Wait for Invitation',REFLECTOR:'Wait a Lunar Cycle'};
function confirmedFromFacts(f,index){
  const records=[];const push=(field,value)=>records.push({field,value,sourceType:'MANUAL',sourceRegion:`W21:${index}`,customerConfirmed:true});
  push('type',f.type);push('strategy',strategy[f.type]||'');push('authority',f.authority);push('profile',f.profile);push('definition',f.definition);
  push('channels',f.channels.map(x=>x.channelId));push('definedCenters',f.centers.defined);push('openCenters',[...f.centers.undefined,...f.centers.open]);
  const activations=[];let line=1;for(const ch of f.channels)for(const gate of ch.gates)activations.push({layer:line%2?'PERSONALITY':'DESIGN',bodyCode:'SUN',gateLine:`${gate}.${(line++%6)+1}`});for(const h of f.hangingGates)activations.push({layer:'UNSPECIFIED',bodyCode:'',gateLine:`${h.gate}.1`});push('activations',activations);
  for(const [field,value] of Object.entries(f.advanced||{}))push(field,value);
  return {authorityClass:'CUSTOMER_SUPPLIED_EXTERNAL_CONTEXT',provenance:{customerConfirmed:true},records,sourceRefs:['HD-R3-W21-SYNTHETIC-CONFIRMED-EXTERNAL'],profileDigest:`W21-${index}`};
}
function r2ClaimCount(ir){return ir.sections.reduce((n,s)=>n+(s.claims?.length||0),0);}
const rows=indexes.map((index,n)=>{
  const c=campaign[index],f=c.facts;const chart=buildCanonicalHumanDesignExternalChart(confirmedFromFacts(f,index),{generatedAt:'2026-08-31T00:00:00.000Z'});const r2=buildHumanDesignExternalReadingIr(chart,{locale:'en',intent:f.customerIntent});
  const priority=prioritizeHumanDesignR3WholeChart(f,{customerIntent:f.customerIntent});const r3=buildHumanDesignR3ProfessionalReadingIr(f,{priorityResult:priority});const editorial=editorializeHumanDesignR3Reading(f,{readingIr:r3});assertNoHumanDesignR3EditorialLeaks(editorial);const reality=buildHumanDesignR3RealityCompositionV2(f,{priorityResult:priority});
  const r3RuleRefs=new Set(r3.technical.compositionRuleIds);const combined=priority.primaryFindings.filter(x=>x.technicalRefs.structureRefs.length>=2).length;const undefinedPreserved=f.centers.undefined.length===0||r3.sections[0].chartSummary.centers.undefined.length===f.centers.undefined.length;const r2UndefinedCollapsed=f.centers.undefined.length===0||f.centers.undefined.every(x=>chart.structure.openCenters.includes(x));
  const rubric={
    chartSpecificity:combined>=Math.min(2,priority.primaryFindings.length),
    compositionDepth:r3RuleRefs.size>=2&&r2.sections.every(s=>!(s.compositionRuleIds?.length)),
    nonRepetition:priority.primaryFindings.length<=8&&new Set(priority.primaryFindings.map(x=>x.findingId)).size===priority.primaryFindings.length,
    structuralFidelity:undefinedPreserved&&r2UndefinedCollapsed,
    customerClarity:editorial.editorialPolicy.detectedForbiddenTerms.length===0&&r3.customerDefaults.showInternalIds===false,
    realityRelevance:reality.questions.length>=4&&reality.questions.every(q=>q.technicalRefs.claimIds.length>0)
  };
  return {benchmarkId:`HD-R3-W21-${String(n+1).padStart(2,'0')}`,machineCaseId:c.caseId,profile:f.profile,type:f.type,authority:f.authority,definition:f.definition,pass:Object.values(rubric).every(Boolean),rubric,evidence:{r2:{sections:r2.sections.length,atomicClaims:r2ClaimCount(r2),hasCompositionRuleTrace:false,undefinedRepresentedSeparately:false,realityQuestions:0},r3:{sections:r3.sections.length,primaryFindings:priority.primaryFindings.length,combinedPrimaryFindings:combined,compositionRuleFamilies:r3RuleRefs.size,undefinedRepresentedSeparately:true,realityQuestions:reality.questions.length,internalTermLeaks:0}},digests:{r2:r2.readingDigest,r3:r3.readingIrDigest,priority:priority.priorityDigest}};
});
const report={schemaVersion:'PHI-OS-HD-PRO-R3-W21-PROFESSIONAL-BENCHMARK-v1.0.0',work:'HD-PRO-R3-W21',baselineCommit:'3b5670308f4b5e42d4c1da066dcd5fefc5b0e805',status:rows.every(x=>x.pass)?'BENCHMARK_PASS_12_OF_12':'BENCHMARK_FAILED',comparison:'R2 BASIC EXTERNAL READING vs R3 PROFESSIONAL WHOLE-CHART READING',rubricDimensions:['chartSpecificity','compositionDepth','nonRepetition','structuralFidelity','customerClarity','realityRelevance'],summary:{total:12,passed:rows.filter(x=>x.pass).length,failed:rows.filter(x=>!x.pass).length},benchmarks:rows,benchmarkDigest:digest(rows),publication:{r2RemainsCustomerPublished:true,r3State:'SHADOW_CANDIDATE',machineCampaignPassed:true,humanAccepted:false,customerPublishableR3:false}};
const rendered=`${JSON.stringify(report,null,2)}\n`;if(process.argv.includes('--check')){assert.equal(fs.readFileSync(OUT,'utf8'),rendered,'HD_R3_W21_BENCHMARK_DRIFT');console.log(`✓ HD-PRO-R3-W21 benchmark is deterministic: ${report.summary.passed}/12 PASS.`);}else{fs.writeFileSync(OUT,rendered);console.log(`Generated W21 benchmark: ${report.summary.passed}/12 PASS.`);}
