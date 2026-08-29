import crypto from 'node:crypto';
import {METHODS,diversityCases,buildDiversityCase} from './smr-diversity-support.mjs';
import {buildCrossPerspectiveInputIR} from '../functions/runtime-reading/cross-perspective-input-ir.js';
import {buildSemanticEvidenceMatrix} from '../functions/runtime-reading/semantic-evidence-matrix.js';
import {buildCrossMethodRuntimeReadingIRv2} from '../functions/runtime-reading/cross-method-reading-ir-v2.js';

export const BASELINE_COMMIT='a30a38d45a273fa0de603dcb9da827bf4c4ca307';
export const CROSS_METHOD_SETS=Object.freeze([
  Object.freeze({setId:'PAIR-AST-BZR',methods:['AST','BZR']}),
  Object.freeze({setId:'PAIR-AST-ZWR',methods:['AST','ZWR']}),
  Object.freeze({setId:'PAIR-BZR-NUM',methods:['BZR','NUM']}),
  Object.freeze({setId:'PAIR-NUM-ECR',methods:['NUM','ECR']}),
  Object.freeze({setId:'TRIPLE-AST-BZR-NUM',methods:['AST','BZR','NUM']}),
  Object.freeze({setId:'TRIPLE-BZR-ZWR-ECR',methods:['BZR','ZWR','ECR']}),
  Object.freeze({setId:'QUAD-AST-ZWR-NUM-ECR',methods:['AST','ZWR','NUM','ECR']}),
  Object.freeze({setId:'FIVE-ALL',methods:['AST','BZR','ZWR','NUM','ECR']})
]);
const SUPPORT_TYPES=Object.freeze(['COMMON','COMPLEMENTARY','TENSION','CONTEXT_DEPENDENT','OPEN']);
const list=v=>Array.isArray(v)?v:[];
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const uniq=v=>[...new Set(list(v).filter(Boolean))];

async function buildSeed(index){
  const methodBuilds={};
  for(const methodId of METHODS) methodBuilds[methodId]=await buildDiversityCase(methodId,diversityCases[methodId][index]);
  return Object.freeze({index,seedId:`CROSS-SEED-${String(index+1).padStart(2,'0')}`,methodBuilds});
}

export async function buildCrossCase(seed,setDef){
  const selected=setDef.methods.map(methodId=>seed.methodBuilds[methodId]);
  const crossInput=await buildCrossPerspectiveInputIR({
    acceptedMethodReadingEnvelopes:selected.map(x=>x.envelope),
    claimCollections:selected.map(x=>x.claims)
  });
  const semanticMatrix=await buildSemanticEvidenceMatrix(crossInput);
  const reading=await buildCrossMethodRuntimeReadingIRv2({crossInput,semanticMatrix});
  const readingAgain=await buildCrossMethodRuntimeReadingIRv2({crossInput,semanticMatrix});
  const claimIndex=new Map(crossInput.methodInputs.flatMap(m=>m.claims).map(c=>[c.claimId,c]));
  const violations=[];
  if(reading.readingDigest!==readingAgain.readingDigest)violations.push('NON_DETERMINISTIC_READING_DIGEST');
  if(reading.sourceInputDigest!==crossInput.inputDigest)violations.push('SOURCE_INPUT_DIGEST_MISMATCH');
  if(reading.semanticMatrixDigest!==semanticMatrix.matrixDigest)violations.push('SEMANTIC_MATRIX_DIGEST_MISMATCH');
  if(reading.boundaries?.customerCutoverActivated!==false)violations.push('CUSTOMER_CUTOVER_PREMATURE');
  if(reading.boundaries?.currentRealityIntegrationActivated!==false)violations.push('CURRENT_REALITY_PREMATURE');
  if(reading.technical?.hdrInternalContextProjectedToCustomer!==false)violations.push('HDR_PUBLIC_LEAK');
  if(new Set(reading.claims.map(c=>c.claimId)).size!==reading.claims.length)violations.push('DUPLICATE_CROSS_CLAIM_ID');
  for(const claim of reading.claims){
    if(!SUPPORT_TYPES.includes(claim.supportType))violations.push(`UNKNOWN_SUPPORT_TYPE:${claim.claimId}`);
    if(claim.methodRefs.length<2||new Set(claim.methodRefs).size<2)violations.push(`INSUFFICIENT_METHOD_REFS:${claim.claimId}`);
    if(!claim.claimRefs.every(ref=>claimIndex.get(ref)?.publicationState==='CUSTOMER_PUBLISHABLE'))violations.push(`NON_PUBLISHABLE_CLAIM_REF:${claim.claimId}`);
    if(claim.boundary?.methodAgreementIsNotProof!==true||claim.boundary?.percentageMatchCreated!==false||claim.boundary?.methodWinnerSelected!==false)violations.push(`BOUNDARY_VIOLATION:${claim.claimId}`);
    if(list(claim.lineage?.currentRealityRefs).length)violations.push(`CURRENT_REALITY_REF_PRESENT:${claim.claimId}`);
    if(/\b\d{1,3}%\b|systems? prove|majority|\b\d\s*(?:out of|of)\s*5\b/i.test(`${claim.headline} ${claim.narrative}`))violations.push(`VOTING_OR_PROOF_LANGUAGE:${claim.claimId}`);
  }
  const supportTypeCounts=Object.fromEntries(SUPPORT_TYPES.map(t=>[t,reading.claims.filter(c=>c.supportType===t).length]));
  const sourceClaims=crossInput.methodInputs.flatMap(m=>m.claims.map(c=>({methodId:m.methodId,claimId:c.claimId,semanticDimension:c.semanticDimension,claimType:c.claimType,headline:c.headline,structuralMeaning:c.structuralMeaning,evidenceRefs:c.evidenceRefs,interpretationUnitRefs:c.interpretationUnitRefs})));
  const caseId=`CROSS-W24-${seed.seedId}-${setDef.setId}`;
  return Object.freeze({
    schemaVersion:'PHI-OS-CROSS-R2-W24-MACHINE-CASE-v1.0.0',caseId,seedId:seed.seedId,seedIndex:seed.index+1,setId:setDef.setId,methodRefs:[...setDef.methods],methodCount:setDef.methods.length,
    canonicalInputDigest:hash(diversityCases[setDef.methods[0]][seed.index].input),sourceInputDigest:crossInput.inputDigest,semanticMatrixDigest:semanticMatrix.matrixDigest,readingDigest:reading.readingDigest,
    sourceMethodSemanticDigests:Object.fromEntries(crossInput.methodInputs.map(m=>[m.methodId,m.semanticDigest])),
    sourceClaimCount:sourceClaims.length,crossClaimCount:reading.claims.length,mappedDimensionCount:semanticMatrix.dimensions.filter(r=>r.methodClaimRefs.length).length,unmappedClaimRefs:semanticMatrix.unmappedClaimRefs,
    supportTypeCounts,dimensionRefs:reading.claims.map(c=>c.semanticDimension),crossClaims:reading.claims,sourceClaims,
    machineState:violations.length?'REJECT':'ACCEPT',violations,
    governance:{allSourceClaimsCustomerPublishable:true,smrProseConsumed:false,rawProjectionUsedAsCrossConclusion:false,xpfCountsTowardAgreement:false,hdrCountsTowardAgreement:false,currentRealityIntegrated:false,methodVoting:false,percentageTruthScore:false,liveCustomerHumanReviewClaimed:false}
  });
}

export async function buildW24Campaign(){
  const seeds=[];for(let i=0;i<8;i++)seeds.push(await buildSeed(i));
  const cases=[];for(const seed of seeds)for(const setDef of CROSS_METHOD_SETS)cases.push(await buildCrossCase(seed,setDef));
  const supportTypeCounts=Object.fromEntries(SUPPORT_TYPES.map(t=>[t,cases.reduce((n,c)=>n+(c.supportTypeCounts[t]||0),0)]));
  const byMethodCount=Object.fromEntries([2,3,4,5].map(n=>[n,cases.filter(c=>c.methodCount===n).length]));
  const byMethod=Object.fromEntries(METHODS.map(m=>[m,cases.filter(c=>c.methodRefs.includes(m)).length]));
  return Object.freeze({
    schemaVersion:'PHI-OS-CROSS-R2-W24-MACHINE-CAMPAIGN-v1.0.0',baselineCommit:BASELINE_COMMIT,workCode:'R2-W24',requiredCaseCount:64,cases,
    summary:{total:cases.length,accepted:cases.filter(c=>c.machineState==='ACCEPT').length,rejected:cases.filter(c=>c.machineState==='REJECT').length,uniqueCanonicalInputs:new Set(cases.map(c=>c.canonicalInputDigest)).size,uniqueMethodSets:new Set(cases.map(c=>c.setId)).size,uniqueReadingDigests:new Set(cases.map(c=>c.readingDigest)).size,byMethodCount,byMethod,supportTypeCounts,globalDimensionCoverage:uniq(cases.flatMap(c=>c.dimensionRefs)).sort(),unmappedClaimCaseCount:cases.filter(c=>c.unmappedClaimRefs.length).length},
    governance:{samePersonDifferentMethodSetMayBeDistinctCrossCase:true,sameMethodSetDifferentCanonicalInputIsStructuralDiversity:true,sameInputDifferentQuestionOnlyDoesNotCreateAnotherCase:true,machineAcceptanceDoesNotEqualHumanAcceptance:true,customerCrossCutoverAllowed:false}
  });
}

export function selectW25Cases(cases){
  const bySet=id=>cases.filter(c=>c.setId===id).sort((a,b)=>a.seedIndex-b.seedIndex);
  const picks=[];
  for(const id of CROSS_METHOD_SETS.slice(0,6).map(x=>x.setId))picks.push(...[0,2,4,6].map(i=>bySet(id)[i]));
  for(const id of CROSS_METHOD_SETS.slice(6).map(x=>x.setId))picks.push(...[0,1,3,4,6,7].map(i=>bySet(id)[i]));
  return picks;
}

export const HUMAN_CRITERIA=Object.freeze(['INPUT_AUTHORITY','SEMANTIC_MAPPING','CROSS_COMPOSITION','SUPPORT_TYPE_FIDELITY','TENSION_OPEN_PRESERVATION','NO_METHOD_VOTING','NO_SMR_PROSE_BACKFEED','STRUCTURAL_SPECIFICITY','NON_REPETITION','CUSTOMER_CLARITY','LINEAGE','BOUNDARY']);
