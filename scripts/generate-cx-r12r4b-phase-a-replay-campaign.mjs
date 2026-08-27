import assert from 'node:assert/strict';
import fs from 'node:fs';

const OUTPUT='content/customer-experience-rebuild/r12r4b/cx-r12r4b-phase-a-48-case-live-replay-v1.json';
const METHODS=['AST','BZR','NUM','ZWR'];
const INPUT_REFS=Object.freeze({
  AST:'content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json',
  BZR:'content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json#input',
  NUM:'content/professional/num-production/fixtures/num-production-determinism-fixtures-v1.json',
  ZWR:'scripts/check-zwr-w14-w25-production.mjs#governed-production-input'
});

function casesFor(methodId){
  return Array.from({length:12},(_,index)=>{
    const caseNumber=index+1;
    return {
      caseId:`CX-R12R4B-LIVE-${methodId}-${String(caseNumber).padStart(2,'0')}`,
      methodId,
      caseNumber,
      locale:index%2===0?'en':'zh-Hans',
      requestedDepth:index%4<2?'STANDARD':'PROFESSIONAL',
      calculationVariant:methodId==='AST'?(index%2===0?'PLACIDUS_V1':'WHOLE_SIGN_V1'):'CURRENT_PRODUCTION_BOUND_SCOPE',
      replayOrdinal:Math.floor(index/4)+1,
      fixedInputRef:INPUT_REFS[methodId],
      runtimeExecutionRequired:true,
      sameInputCalculationReplayRequired:true,
      distinctCustomerSubjectClaimed:false,
      expected:{
        calculationReproducible:true,
        meaningAuthorityResolved:true,
        admittedCompositionResolved:true,
        customerInterpretationGenerated:true,
        rawInternalStateLeak:false,
        lineageComplete:true,
        acceptanceBasis:'ADMITTED_COMPOSITION_RULESET',
        liveCustomerHumanReviewed:false
      }
    };
  });
}

const cases=METHODS.flatMap(casesFor);
assert.equal(cases.length,48);
const campaign={
  schemaVersion:'PHI-OS-CX-R12R4B-PHASE-A-LIVE-REPLAY-CAMPAIGN-v1.0.0',
  work:'CX-R12R4B-W08',
  baselineCommit:'4a9ddcaff07abaab4c12be62cd74e0681e528af8',
  status:'MACHINE_REPLAY_CAMPAIGN_ACTIVE',
  methodIds:METHODS,
  casesPerMethod:12,
  caseCount:48,
  replayBoundary:{
    historicalHumanReviewCasesUsedAsCustomerIdentityMatch:false,
    liveProjectionDigestComparedToHistoricalReviewDigest:false,
    admissionEvidenceScope:'COMPOSITION_RULESET',
    distinctCustomerSubjectsClaimed:false,
    liveCustomerHumanReviewClaimed:false
  },
  requiredTotals:{
    calculationReproducible:48,
    meaningAuthorityResolved:48,
    admittedCompositionResolved:48,
    customerInterpretationGenerated:48,
    noRawInternalStateLeak:48,
    lineageComplete:48
  },
  cases
};
const rendered=`${JSON.stringify(campaign,null,2)}\n`;

if(process.argv.includes('--check')){
  assert.ok(fs.existsSync(OUTPUT),'CX_R12R4B_PHASE_A_CAMPAIGN_MISSING');
  assert.equal(fs.readFileSync(OUTPUT,'utf8'),rendered,'CX_R12R4B_PHASE_A_CAMPAIGN_DRIFT');
  console.log('✓ CX-R12R4B Phase A 48-case replay campaign is deterministic.');
}else{
  fs.mkdirSync('content/customer-experience-rebuild/r12r4b',{recursive:true});
  fs.writeFileSync(OUTPUT,rendered);
  console.log(`Generated ${OUTPUT} with ${cases.length} governed live replay cases.`);
}
