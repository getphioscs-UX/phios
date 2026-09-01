import fs from 'node:fs';
import path from 'node:path';
import {buildRelationshipParticipantReadingSet} from '../functions/personal-reading/relationship/relationship-participant-reading-set.js';
import {composeMethodRelationship} from '../functions/personal-reading/relationship/method-relationship-composer.js';
import {buildAstRelationalStructuralProjection} from '../functions/relational/ast-relational-runtime.js';
import {buildNumRelationshipStructure} from '../functions/num-expansion/num-relationship-runtime.js';
import {buildNumRelationshipMeaningCandidate} from '../functions/num-depth/num-relationship-meaning-engine.js';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const matrix=readJson('content/personal-reading/relationship/registries/relationship-method-capability-matrix-v1.json');
const registry=readJson('content/personal-reading/relationship/registries/relationship-method-composition-registry-v1.json');
const core=['SUN','MOON','MERCURY','VENUS','MARS','JUPITER','SATURN','URANUS','NEPTUNE','PLUTO'];

const astReading=(id,shift=0)=>({
  schemaVersion:'PHI-OS-AST-RUNTIME-READING-IR-v1.0.0',
  sourceProjectionId:id,
  executionCompleteness:'COMPLETE',
  sections:{structuralCore:{positions:core.map((code,k)=>({code,value:(k*30+shift)%360}))}},
  boundaries:{eventPredictionCreated:false,fortunePredictionCreated:false,professionalJudgmentCreated:false,methodVotingCreated:false}
});
const env=(methodId,who,sourceRef)=>({
  schemaVersion:'PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0',
  methodId,
  readingAuthorityRef:`${methodId}-${who}-READING-${sourceRef}`,
  semanticDigest:`${methodId}-${who}-${sourceRef}`.padEnd(64,'0').slice(0,64),
  sourceLineage:[sourceRef],
  ruleLineage:[],
  acceptedUnits:[{interpretationUnitId:`${methodId}-${who}-${sourceRef}-U1`,summary:`Independent ${methodId} reading ${who}`}],
  boundary:{acceptedAuthorityOnly:true,methodRuntimeExecuted:false,canonicalProjectionCreated:false,rawProjectionConsumedAsCustomerConclusion:false,newMeaningCreated:false,rendererMeaningCreated:false}
});
async function readingSet(i,astARef,astBRef){
  const pairs=['AST','BZR','ZWR','NUM','ECR'].map(methodId=>({methodId,A:env(methodId,'A',methodId==='AST'?astARef:`${methodId}-A-${i}`),B:env(methodId,'B',methodId==='AST'?astBRef:`${methodId}-B-${i}`)}));
  return buildRelationshipParticipantReadingSet({
    relationshipIntentId:`REL-W4-HR-${String(i+1).padStart(2,'0')}`,
    participantARef:`PERSON-A-${i}`,
    participantBRef:`PERSON-B-${i}`,
    participantAInputDigest:'a'.repeat(63)+(i%10),
    participantBInputDigest:'b'.repeat(63)+(i%10),
    methodPairs:pairs,
    capabilityMatrix:matrix
  });
}
const precisionLabel=p=>`A:${p.A.birthTimePrecision}/${p.A.birthPlaceConfirmed?'place-confirmed':'place-open'} · B:${p.B.birthTimePrecision}/${p.B.birthPlaceConfirmed?'place-confirmed':'place-open'}`;
const rubric=[
  'METHOD_FIDELITY',
  'RELATIONSHIP_COMPOSITION_SCOPE',
  'CUSTOMER_CLARITY',
  'PRECISION_BOUNDARY',
  'NO_COMPATIBILITY_SCORE',
  'NO_PARTNER_MIND_READING',
  'NO_DESTINY_OR_GUARANTEED_OUTCOME',
  'SOURCE_AND_LINEAGE'
];
const cases=[];

for(let i=0;i<24;i++){
  const aRef=`AST-HR-A-${i}`,bRef=`AST-HR-B-${i}`;
  const composedOffsets=[0,5,25,30,35,55,60,65,85,90,115,120,145,150,175,180];
  const relativeOffset=i<16?composedOffsets[i]:i===23?17:[0,30,60,90,120,150,180][i-16];
  const a=astReading(aRef,0),b=astReading(bRef,relativeOffset);
  const projection=await buildAstRelationalStructuralProjection({pairContext:{relationshipContextId:`REL-W4-HR-AST-${i}`},personAReading:a,personBReading:b});
  const set=await readingSet(i,aRef,bRef);
  const precision=i>=16&&i<=19?{A:{birthTimePrecision:'EXACT',birthPlaceConfirmed:true},B:{birthTimePrecision:'UNKNOWN',birthPlaceConfirmed:true}}:i>=20&&i<=21?{A:{birthTimePrecision:'APPROXIMATE',birthPlaceConfirmed:true},B:{birthTimePrecision:'EXACT',birthPlaceConfirmed:true}}:i===22?{A:{birthTimePrecision:'EXACT',birthPlaceConfirmed:true},B:{birthTimePrecision:'EXACT',birthPlaceConfirmed:false}}:{A:{birthTimePrecision:'EXACT',birthPlaceConfirmed:true},B:{birthTimePrecision:'EXACT',birthPlaceConfirmed:true}};
  const out=await composeMethodRelationship({participantReadingSet:set,capabilityMatrix:matrix,compositionRegistry:registry,methodId:'AST',evidence:{projection,precision}});
  cases.push({
    caseId:`REL-W4-HR-AST-${String(i+1).padStart(2,'0')}`,
    methodId:'AST',
    scenarioType:out.state==='MACHINE_COMPOSED_HUMAN_ADMISSION_PENDING'?'COMPOSED_STRUCTURAL':out.state,
    precision:precisionLabel(precision),
    state:out.state,
    claimCount:out.claimCount||0,
    representativeClaims:(out.claims||[]).slice(0,3).map(c=>({claimId:c.relationshipClaimId,claimClass:c.claimClass,headline:c.headline,summary:c.summary,compositionRuleId:c.compositionRuleId,sourceRefs:c.sourceRefs,precisionBoundaryRefs:c.precisionBoundaryRefs})),
    expectedBoundary: out.state==='MACHINE_COMPOSED_HUMAN_ADMISSION_PENDING'
      ? 'Structural cross-person contact only; no synastry meaning or polarity.'
      : out.state==='SUPPRESSED_PRECISION'
        ? 'No relationship claim should be produced when required precision is unavailable.'
        : 'No claim should be manufactured when no admitted rule hits.',
    reviewRubric:rubric,
    decision:'PENDING',
    reviewerNotes:null
  });
}

for(let i=0;i<24;i++){
  const set=await readingSet(100+i,`AST-NHR-A-${i}`,`AST-NHR-B-${i}`);
  const dayA=String((i%27)+1).padStart(2,'0'),dayB=String(((i*3)%27)+1).padStart(2,'0');
  const birthA=`1988-${String((i%12)+1).padStart(2,'0')}-${dayA}`,birthB=`1990-${String(((i+5)%12)+1).padStart(2,'0')}-${dayB}`;
  const structure=buildNumRelationshipStructure({left:{ref:set.participants.A.participantRef,birthDate:birthA},right:{ref:set.participants.B.participantRef,birthDate:birthB}});
  const same=i%3===0;
  const left={LIFE_PATH:(i%9)+1,EXPRESSION:((i+2)%9)+1,SOUL_URGE:((i+4)%9)+1,PERSONALITY:((i+6)%9)+1};
  const right={LIFE_PATH:same?left.LIFE_PATH:((i+1)%9)+1,EXPRESSION:i%4===0?left.EXPRESSION:((i+3)%9)+1,SOUL_URGE:((i+5)%9)+1,PERSONALITY:i%5===0?left.PERSONALITY:((i+7)%9)+1};
  const candidate=buildNumRelationshipMeaningCandidate({left,right,energyRelationship:structure});
  const precision={A:{birthTimePrecision:i%2?'UNKNOWN':'EXACT',birthPlaceConfirmed:false},B:{birthTimePrecision:i%3?'UNKNOWN':'APPROXIMATE',birthPlaceConfirmed:false}};
  const out=await composeMethodRelationship({participantReadingSet:set,capabilityMatrix:matrix,compositionRegistry:registry,methodId:'NUM',evidence:{candidate,structure,precision}});
  const reps=[];
  const connection=(out.claims||[]).find(c=>c.claimClass==='CONNECTION');
  const shared=(out.claims||[]).find(c=>c.compositionRuleId==='REL-W4-NUM-R16-SHARED-PRESENT-DIGITS-v1');
  const relNo=(out.claims||[]).find(c=>c.compositionRuleId==='REL-W4-NUM-R16-RELATIONSHIP-NUMBER-FORMULA-v1');
  for(const c of [connection,shared,relNo].filter(Boolean))reps.push({claimId:c.relationshipClaimId,claimClass:c.claimClass,headline:c.headline,summary:c.summary,compositionRuleId:c.compositionRuleId,sourceRefs:c.sourceRefs,precisionBoundaryRefs:c.precisionBoundaryRefs});
  cases.push({
    caseId:`REL-W4-HR-NUM-${String(i+1).padStart(2,'0')}`,
    methodId:'NUM',
    scenarioType:'COMPOSED_ADMITTED_MULTI_FACTOR_STRUCTURE',
    precision:precisionLabel(precision),
    state:out.state,
    claimCount:out.claimCount||0,
    representativeClaims:reps,
    expectedBoundary:'Same-role symbolic echoes may be relationship claims; structural overlaps and Relationship Number remain non-verdict structure/calculation only.',
    reviewRubric:rubric,
    decision:'PENDING',
    reviewerNotes:null
  });
}

const bundle={
  schemaVersion:'PHI-OS-REL-W4-HUMAN-REVIEW-CASES-v1.0.0',
  work:'REL-W4-HUMAN-ADMISSION',
  baselineCommit:'e8ada596d48bdfdfb341a2820eb45c9a29e45c0e',
  status:'REVIEW_READY_HUMAN_DECISION_PENDING',
  requiredCases:48,
  methods:{AST:24,NUM:24,BZR:0,ZWR:0,ECR:0},
  scopeNote:'Only methods with current executable REL-W4 candidate composition are reviewed. Suppressed methods remain outside Human admission until their own authority successors exist.',
  rubric,
  cases
};
fs.writeFileSync('content/personal-reading/relationship/review/rel-w4-human-review-cases-v1.json',JSON.stringify(bundle,null,2)+'\n');
const results={
  schemaVersion:'PHI-OS-REL-W4-HUMAN-REVIEW-RESULTS-v1.0.0',
  work:'REL-W4-HUMAN-ADMISSION',
  baselineCommit:'e8ada596d48bdfdfb341a2820eb45c9a29e45c0e',
  status:'HUMAN_REVIEW_PENDING',
  requiredCases:48,
  accepted:0,
  revised:0,
  rejected:0,
  pending:48,
  reviewer:null,
  aggregateAttestation:null,
  results:cases.map(c=>({caseId:c.caseId,methodId:c.methodId,decision:'PENDING',criteria:{methodFidelity:null,relationshipCompositionScope:null,customerClarity:null,precisionBoundary:null,noCompatibilityScore:null,noPartnerMindReading:null,noDestinyOrGuaranteedOutcome:null,sourceAndLineage:null},reviewerRef:null,reviewedAt:null,notes:null}))
};
fs.writeFileSync('content/personal-reading/relationship/review/rel-w4-human-review-results-v1.json',JSON.stringify(results,null,2)+'\n');

const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const sections=cases.map(c=>`<article class="case"><header><span>${esc(c.caseId)}</span><strong>${esc(c.methodId)} · ${esc(c.scenarioType)}</strong><em>${esc(c.state)}</em></header><p><b>Precision</b> ${esc(c.precision)}</p><p><b>Expected boundary</b> ${esc(c.expectedBoundary)}</p>${c.representativeClaims.length?`<div class="claims">${c.representativeClaims.map(x=>`<section><h3>${esc(x.claimClass)} · ${esc(x.headline)}</h3><p>${esc(x.summary)}</p><small>${esc(x.compositionRuleId)}</small></section>`).join('')}</div>`:'<p class="suppressed">No customer relationship claim is expected for this case.</p>'}<div class="rubric">${rubric.map(r=>`<label><input type="checkbox" disabled> ${esc(r)}</label>`).join('')}</div><footer>Decision: <strong>PENDING</strong> · record the official decision in <code>rel-w4-human-review-results-v1.json</code> or declare the reviewed aggregate back to the maintainer.</footer></article>`).join('\n');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>REL-W4 Human Review</title><style>body{font-family:system-ui,sans-serif;margin:0;background:#f4f3ef;color:#222}.wrap{max-width:1100px;margin:auto;padding:32px}.head{background:#fff;padding:24px;border-radius:18px;margin-bottom:20px}.case{background:#fff;padding:22px;border-radius:16px;margin:18px 0;border:1px solid #ddd}.case header{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}.case header span,.case header em{font-size:12px;color:#666}.claims{display:grid;gap:10px}.claims section{padding:14px;border-radius:12px;background:#f8f8f6}.claims h3{margin:0 0 8px;font-size:15px}.claims p{margin:0 0 8px;line-height:1.5}.rubric{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:7px;margin:14px 0}.rubric label{font-size:12px}.suppressed{padding:12px;border-left:4px solid #777;background:#f7f7f7}.case footer{border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#555}@media(max-width:700px){.wrap{padding:14px}.case header{grid-template-columns:1fr}.case{padding:16px}}</style></head><body><main class="wrap"><section class="head"><h1>REL-W4 Human Admission Review</h1><p>48 cases: AST 24 + NUM 24. BZR / ZWR / ECR remain fail-closed and are not eligible for semantic Human admission in this pack.</p><p>Machine review is not Human admission. Accept only when each case preserves method fidelity, precision, source lineage and the no-verdict/no-mind-reading boundaries.</p></section>${sections}</main></body></html>`;
fs.writeFileSync('content/personal-reading/relationship/review/rel-w4-human-review.html',html);
console.log(JSON.stringify({status:'PASS',cases:cases.length,AST:cases.filter(x=>x.methodId==='AST').length,NUM:cases.filter(x=>x.methodId==='NUM').length,output:'content/personal-reading/relationship/review/rel-w4-human-review-cases-v1.json'},null,2));
