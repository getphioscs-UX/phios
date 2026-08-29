import {SHARED_SEMANTIC_DIMENSIONS} from './cross-semantic-registry-v2.js';
import {CROSS_COMPOSITION_TEMPLATES} from './cross-composition-rules-v1.js';
export const CROSS_METHOD_RUNTIME_READING_IR_V2_SCHEMA='PHI-OS-CROSS-METHOD-RUNTIME-READING-IR-v2.0.0';
const INPUT_SCHEMA='PHI-OS-CROSS-PERSPECTIVE-INPUT-IR-v1.0.0';
const MATRIX_SCHEMA='PHI-OS-SEMANTIC-EVIDENCE-MATRIX-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const uniq=values=>[...new Set((Array.isArray(values)?values:[]).filter(Boolean))].sort();
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`}
async function sha256(value){const bytes=new TextEncoder().encode(typeof value==='string'?value:stable(value));const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
const labelByDimension=new Map(SHARED_SEMANTIC_DIMENSIONS.map(item=>[item.code,item.label]));
function renderTemplate(template,{label,count,methods}){return template.replaceAll('{label}',label).replaceAll('{count}',String(count)).replaceAll('{methods}',methods.join(', '))}
function claimIndex(crossInput){const map=new Map();for(const method of crossInput.methodInputs||[])for(const claim of method.claims||[]){if(claim.publicationState!=='CUSTOMER_PUBLISHABLE')fail('CROSS_COMPOSITION_NON_PUBLISHABLE_CLAIM');map.set(claim.claimId,claim)}return map}
export function classifyCrossDimension(row,index){
 const claims=(row.methodClaimRefs||[]).map(ref=>index.get(ref)).filter(Boolean);
 const methodRefs=uniq(claims.map(claim=>claim.methodId));
 if(methodRefs.length<2)return null;
 if((row.tensions||[]).length)return 'TENSION';
 if((row.open||[]).length)return 'OPEN';
 if(claims.some(claim=>['CONDITION','TEMPORAL_ACTIVATION'].includes(claim.claimType)))return 'CONTEXT_DEPENDENT';
 if(new Set(claims.map(claim=>claim.claimType)).size>1)return 'COMPLEMENTARY';
 return 'COMMON';
}
function buildCrossClaim(row,index,matrix){
 const supportType=classifyCrossDimension(row,index);if(!supportType)return null;
 const claims=uniq(row.methodClaimRefs).map(ref=>index.get(ref)).filter(Boolean);
 const methodRefs=uniq(claims.map(claim=>claim.methodId));
 if(methodRefs.length<2||claims.length<2)fail('CROSS_CLAIM_TWO_CUSTOMER_PUBLISHABLE_REFS_REQUIRED',{dimension:row.dimension});
 if(claims.some(claim=>claim.publicationState!=='CUSTOMER_PUBLISHABLE'))fail('CROSS_CLAIM_CUSTOMER_PUBLISHABLE_ONLY',{dimension:row.dimension});
 const template=CROSS_COMPOSITION_TEMPLATES[supportType];if(!template)fail('CROSS_COMPOSITION_TEMPLATE_MISSING',{supportType});
 const label=labelByDimension.get(row.dimension);if(!label)fail('CROSS_COMPOSITION_DIMENSION_UNKNOWN',{dimension:row.dimension});
 const claimRefs=uniq(claims.map(claim=>claim.claimId)),evidenceRefs=uniq(claims.flatMap(claim=>claim.evidenceRefs||[])),tensionRefs=uniq(row.tensions||[]);
 return freeze({
  claimId:`CROSS-CLAIM-${row.dimension}`,
  semanticDimension:row.dimension,
  headline:renderTemplate(template.headline,{label,count:claimRefs.length,methods:methodRefs}),
  narrative:renderTemplate(template.narrative,{label,count:claimRefs.length,methods:methodRefs}),
  methodRefs,claimRefs,evidenceRefs,supportType,tensionRefs,
  boundary:{customerPublishableMethodRefMinimumSatisfied:true,sharedEmphasisIsNotFact:true,methodAgreementIsNotProof:true,truthConfidenceCreated:false,percentageMatchCreated:false,methodWinnerSelected:false,automaticConflictResolutionPerformed:false,newMethodMeaningCreated:false,smrProseConsumed:false,xpfCountsTowardAgreement:false,hdrCountsTowardAgreement:false,currentRealityClaimCreated:false},
  lineage:{sourceMatrixDigest:matrix.matrixDigest,methodClaimRefs:claimRefs,xpfContextRefs:uniq(row.xpfContextRefs||[]),currentRealityRefs:[]}
 });
}
export async function buildCrossMethodRuntimeReadingIRv2({crossInput,semanticMatrix}={}){
 if(crossInput?.schemaVersion!==INPUT_SCHEMA)fail('CROSS_COMPOSITION_INPUT_IR_REQUIRED');
 if(semanticMatrix?.schemaVersion!==MATRIX_SCHEMA||semanticMatrix.sourceInputDigest!==crossInput.inputDigest)fail('CROSS_COMPOSITION_MATRIX_LINEAGE_REQUIRED');
 if(crossInput.boundaries?.smrProseConsumed!==false||semanticMatrix.boundaries?.smrProseConsumed!==false)fail('CROSS_COMPOSITION_NO_SMR_PROSE_BOUNDARY_REQUIRED');
 if((semanticMatrix.dimensions||[]).some(row=>(row.currentRealityRefs||[]).length))fail('CROSS_CURRENT_REALITY_NOT_ADMITTED_IN_W23');
 const index=claimIndex(crossInput),claims=[];
 for(const row of semanticMatrix.dimensions||[]){const claim=buildCrossClaim(row,index,semanticMatrix);if(claim)claims.push(claim)}
 claims.sort((a,b)=>a.semanticDimension.localeCompare(b.semanticDimension));
 const composed=new Set(claims.map(claim=>claim.semanticDimension));
 const uncomposedDimensions=(semanticMatrix.dimensions||[]).filter(row=>!composed.has(row.dimension)&&(row.methodClaimRefs?.length||row.xpfContextRefs?.length)).map(row=>row.dimension).sort();
 const emptyDimensions=(semanticMatrix.dimensions||[]).filter(row=>!row.methodClaimRefs?.length&&!row.xpfContextRefs?.length).map(row=>row.dimension).sort();
 const seed={schemaVersion:CROSS_METHOD_RUNTIME_READING_IR_V2_SCHEMA,sourceInputDigest:crossInput.inputDigest,semanticMatrixDigest:semanticMatrix.matrixDigest,claims,uncomposedDimensions,technical:{mappedPublicClaimCount:[...index.values()].length,unmappedClaimRefs:semanticMatrix.unmappedClaimRefs||[],xpfContextPresent:Boolean(crossInput.xpfContext),hdrInternalContextPresent:Boolean(crossInput.hdrInternalContext),hdrInternalContextProjectedToCustomer:false,emptyDimensions,customerCutover:'CLOSED'},boundaries:{sourceReadingsRecalculated:false,rawProjectionConsumed:false,rawSymbolMappedDirectly:false,smrProseConsumed:false,newCanonicalMeaningCreated:false,methodVotingPerformed:false,convergenceAsProofCreated:false,truthConfidencePercentageCreated:false,methodWinnerSelected:false,compatibilityScoreCreated:false,professionalJudgmentCreated:false,recommendationCreated:false,currentRealityAssumed:false,currentRealityIntegrationActivated:false,xpfCountsTowardAgreement:false,hdrCountsTowardAgreement:false,hdrPublicLeakCreated:false,customerCutoverActivated:false}};
 const readingDigest=await sha256(seed);
 return freeze({...seed,readingDigest});
}
export default Object.freeze({classifyCrossDimension,buildCrossMethodRuntimeReadingIRv2});
