import assert from 'node:assert/strict';
import fs from 'node:fs';

const OUTPUT='content/customer-experience-rebuild/review/cx-r12r3b-96-case-human-review-campaign-v1.json';
const METHODS=['AST','NUM','BZR','ZWR'];
const TYPES=[
  {code:'TYPICAL_STRUCTURE',count:6,scenarios:['core reference','secondary role emphasis','balanced structure','primary relation','supporting relation','ordinary mixed structure']},
  {code:'RELATION_DENSE',count:6,scenarios:['three-way support','three-way tension','repetition cluster','counterbalance network','priority competition','dense mixed relation']},
  {code:'MISSING_DATA',count:4,scenarios:['birth time unavailable','time accuracy approximate','optional context absent','one meaning or rule unavailable']},
  {code:'CONFLICT_OR_EXTREME',count:4,scenarios:['competing priorities','high repetition','support and tension coexist','one dominant structure']},
  {code:'LOCALE_ALIGNMENT',count:2,scenarios:['English and Simplified Chinese semantic pair A','English and Simplified Chinese semantic pair B']},
  {code:'SENSITIVE_BOUNDARY',count:2,scenarios:['health or certainty pressure','financial relationship or event pressure']}
];
const FIXTURES=Object.freeze({
  AST:'content/professional/ast-production/fixtures/ast-structural-scope-fixture-v1.json',
  NUM:'content/professional/num-production/fixtures/num-production-determinism-fixtures-v1.json',
  BZR:'content/professional/bzr-production/fixtures/bzr-canonical-projection.production.valid.json',
  ZWR:'content/zi-wei-runtime/fixtures/zi-wei-validation-fixture-corpus-v1.json'
});
const RUBRIC=[
  'calculation fidelity','projection fidelity','source fidelity','method-role accuracy','relation accuracy','priority accuracy','no invented meaning','no generic duplication','conditional language','uncertainty preserved','ordinary-reader clarity','raw codes hidden','reality remains unknown','sensitive-domain safety','lineage traceability'
];

function casesFor(methodId){
  const cases=[];let methodIndex=0;
  for(const type of TYPES){
    for(let i=0;i<type.count;i++){
      methodIndex++;
      const localePair=type.code==='LOCALE_ALIGNMENT';
      cases.push({
        caseId:`CX-R12R3B-HR-${methodId}-${String(methodIndex).padStart(2,'0')}`,
        methodId,
        caseType:type.code,
        scenario:type.scenarios[i],
        fixedInputRef:FIXTURES[methodId],
        fixedVariant:`${type.code}-${String(i+1).padStart(2,'0')}`,
        reviewLocales:localePair?['en','zh-Hans']:[i%2===0?'en':'zh-Hans'],
        expectedMachineGate:type.code==='MISSING_DATA'&&i===3?'STRUCTURE_ONLY':'HUMAN_REVIEW_REQUIRED',
        methodFidelityReview:{methodFidelityAccepted:null,reviewerRef:null,evidenceRef:null,notes:null},
        customerClarityReview:{customerClarityAccepted:null,reviewerRef:null,evidenceRef:null,notes:null},
        rubric:Object.fromEntries(RUBRIC.map(item=>[item,null])),
        decision:'PENDING_EXTERNAL_HUMAN_REVIEW',
        customerPublishable:false
      });
    }
  }
  assert.equal(cases.length,24);
  return cases;
}

const cases=METHODS.flatMap(casesFor);
const campaign={
  schemaVersion:'PHI-OS-CX-R12R3B-HUMAN-REVIEW-CAMPAIGN-v1.0.0',
  work:'CX-R12R3B-W47-W50',
  baselineCommit:'526547698894de0d33d09447aed0b93b83558114',
  status:'PREPARED_EXTERNAL_HUMAN_REVIEW_NOT_STARTED',
  predecessorPatterns:['MIR_HUMAN_REVIEW','I_CHING_HUMAN_REVIEW','TAROT_HUMAN_REVIEW'],
  oneSharedCampaign:true,
  methodIds:METHODS,
  caseCount:cases.length,
  casesPerMethod:24,
  categoryCountsPerMethod:Object.fromEntries(TYPES.map(x=>[x.code,x.count])),
  rubric:RUBRIC,
  reviewPerspectives:['METHOD_FIDELITY','CUSTOMER_CLARITY'],
  dualAcceptanceRule:'methodFidelityAccepted=true AND customerClarityAccepted=true AND external evidenceRef present',
  thresholds:{initialControlledProduction:'AT_LEAST_20_OF_24_PER_METHOD_AND_ZERO_CRITICAL_FAILURE',fullProduction:'24_OF_24_PER_METHOD_AND_96_OF_96_TOTAL'},
  currentTotals:{methodFidelityAccepted:0,customerClarityAccepted:0,dualAccepted:0,pending:96},
  ordinaryReaderFiveMinuteTest:{
    status:'NOT_RUN_EXTERNAL_EVIDENCE_REQUIRED',
    timeLimitMinutes:5,
    questions:['What is this graph showing?','What are the three most important points?','Why does the system consider them worth noticing?','What does the system still not know?','Have the methods been mixed into one conclusion?','What can you do next?'],
    passRule:'AN_ORDINARY_READER_ANSWERS_ALL_SIX_WITHOUT_INTERNAL_TERMINOLOGY_ASSISTANCE',
    reviewerRef:null,
    evidenceRef:null,
    passed:null
  },
  externalEvidence:{required:true,humanAccepted:false,liveBrowserAccepted:false,fullProduction:false},
  workCoverage:[47,48,49,50],
  cases
};
const rendered=`${JSON.stringify(campaign,null,2)}\n`;
if(process.argv.includes('--check')){
  assert.ok(fs.existsSync(OUTPUT),'CX_R12R3B_HUMAN_REVIEW_CAMPAIGN_MISSING');
  assert.equal(fs.readFileSync(OUTPUT,'utf8'),rendered,'CX_R12R3B_HUMAN_REVIEW_CAMPAIGN_DRIFT');
  console.log('✓ CX-R12R3B 96-case human review campaign is deterministic and unchanged.');
}else{
  fs.mkdirSync('content/customer-experience-rebuild/review',{recursive:true});
  fs.writeFileSync(OUTPUT,rendered);
  console.log(`Generated ${OUTPUT} with ${cases.length} fixed cases.`);
}
