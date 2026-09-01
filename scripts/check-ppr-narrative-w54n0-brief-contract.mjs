import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compileNarrativeBrief,NARRATIVE_BRIEF_SCHEMA} from '../functions/personal-reading/narrative/narrative-brief-compiler.js';
import {briefInput,W53,W54,sourceReport} from './ppr-narrative-w54n0-fixtures.mjs';

const contract=JSON.parse(fs.readFileSync('content/personal-reading/narrative/contracts/narrative-brief-contract-v1.json','utf8'));
const schema=JSON.parse(fs.readFileSync('content/personal-reading/narrative/schemas/narrative-brief-v1.schema.json','utf8'));
const snapshot=JSON.parse(fs.readFileSync('content/personal-reading/narrative/successors/w54n0-input-authority-snapshot-v1.json','utf8'));
assert.equal(contract.outputSchema,NARRATIVE_BRIEF_SCHEMA);
assert.equal(schema.properties.schemaVersion.const,NARRATIVE_BRIEF_SCHEMA);
assert.equal(snapshot.required.sourceReport,'PHI-OS-PERSONAL-READING-REPORT-IR-v2.0.0');

const results=[];
for(let i=0;i<24;i++){
  const input=await briefInput(i),a=await compileNarrativeBrief(input),b=await compileNarrativeBrief(input);
  assert.deepEqual(a,b,`case ${i+1} deterministic replay`);
  assert.equal(a.briefSemanticDigest,b.briefSemanticDigest);
  assert.equal(a.sourceSemanticDigest,input.sourceReport.semanticDigest);
  assert.equal(a.sourceReportId,input.sourceReport.reportId);
  assert.match(a.briefId,/^NBR-[A-F0-9]{24}$/);
  assert.match(a.briefSemanticDigest,/^[a-f0-9]{64}$/);
  assert.ok(a.coreThemes.length>=3&&a.coreThemes.length<=5);
  assert.ok(a.priorityFindings.length>=3&&a.priorityFindings.length<=5);
  assert.ok(a.factsAiMustNotAlter.length>=2);
  assert.ok(a.sourceClassLocks.length>=input.sourceReport.methodReadingRefs.length);
  assert.ok(a.prohibitedClaimClasses.includes('DIAGNOSIS'));
  assert.ok(a.prohibitedClaimClasses.includes('GUARANTEED_FUTURE_EVENT'));
  assert.ok(a.prohibitedClaimClasses.includes('PARTNER_HIDDEN_STATE_INFERENCE'));
  assert.ok(a.prohibitedClaimClasses.includes('IQ'));
  assert.equal(a.narrativeFreedom.mayRecalculateFacts,false);
  assert.equal(a.narrativeFreedom.mayCreateScientificValidationFromCrossSourceAlignment,false);
  assert.equal(Object.hasOwn(a,'sections'),false);
  assert.equal(Object.hasOwn(a,'sourceIndex'),false);
  assert.equal(Object.hasOwn(a,'technicalAppendix'),false);
  const profilePresent=input.sourceReport.profileSignalRefs.length>0;
  if(profilePresent){assert.ok(a.profileSignals.length>=1);assert.ok(a.sourceClassLocks.some(x=>String(x.sourceClass).includes('PROFILE')||input.sourceReport.inputSummary.profileSourceClasses.includes(x.sourceClass)))}
  const realityPresent=Boolean(input.sourceReport.currentReality);if(realityPresent)assert.ok(a.currentRealitySignals.length>=1);
  results.push({caseId:`W54N0-${String(i+1).padStart(2,'0')}`,profilePresent,realityPresent,crossPresent:Boolean(input.sourceReport.crossPerspective),customerContextPresent:Boolean(input.customerContext),methodCount:input.sourceReport.methodReadingRefs.length,briefDigest:a.briefSemanticDigest});
}
async function rejects(code,input){let caught=null;try{await compileNarrativeBrief(input)}catch(e){caught=e}assert.equal(caught?.code,code,`${code} should fail closed`)}
const valid=await briefInput(5);
await rejects('W54N0_RAW_OR_PROVIDER_INPUT_FORBIDDEN',{...valid,rawPlanets:[1,2,3]});
await rejects('W54N0_W51_REPORT_IR_V2_REQUIRED',{...valid,sourceReport:{...valid.sourceReport,schemaVersion:'RAW-REPORT'}});
await rejects('W54N0_W53_EVIDENCE_RULES_REQUIRED',{...valid,evidenceWritingRules:{}});
await rejects('W54N0_W54_FACTUAL_GUARD_REQUIRED',{...valid,factualGuard:{}});
await rejects('W54N0_STYLE_INTENT_KEY_NOT_ALLOWED',{...valid,styleIntent:{inventFacts:true}});
const insufficientBase=await sourceReport(0);const insufficient={...insufficientBase,executiveReading:{...insufficientBase.executiveReading,paidNarrativeEligibility:'INSUFFICIENT_GOVERNED_THEMES'}};
await rejects('W54N0_SOURCE_REPORT_NOT_NARRATIVE_ELIGIBLE',{sourceReport:insufficient,evidenceWritingRules:W53,factualGuard:W54});

const campaign={required:24,passed:results.length,deterministicReplay:'PASS_24_OF_24',profilePresent:results.filter(x=>x.profilePresent).length,profileAbsent:results.filter(x=>!x.profilePresent).length,realityPresent:results.filter(x=>x.realityPresent).length,realityAbsent:results.filter(x=>!x.realityPresent).length,crossPerspectivePresent:results.filter(x=>x.crossPresent).length,customerContextPresent:results.filter(x=>x.customerContextPresent).length,methodCountCoverage:[...new Set(results.map(x=>x.methodCount))].sort((a,b)=>a-b)};
assert.deepEqual(campaign.methodCountCoverage,[1,2,3,4,5,6]);
console.log(`✓ W54N0 Generic Narrative Brief passed ${campaign.passed}/${campaign.required}; deterministic replay ${campaign.deterministicReplay}.`);
console.log(`  Profile ${campaign.profilePresent}/${campaign.profileAbsent}; Reality ${campaign.realityPresent}/${campaign.realityAbsent}; Cross ${campaign.crossPerspectivePresent}; customer-context ${campaign.customerContextPresent}; method coverage 1–6.`);
console.log('  Raw registries/calculation bypass, source-class erasure, unsupported fact expansion and provider/model inputs remain fail-closed.');
