import {SHARED_SEMANTIC_DIMENSIONS,METHOD_SEMANTIC_DIMENSION_MAPPING,XPF_CONTEXT_DIMENSION_MAPPING} from './cross-semantic-registry-v2.js';
export const SEMANTIC_EVIDENCE_MATRIX_SCHEMA='PHI-OS-SEMANTIC-EVIDENCE-MATRIX-v1.0.0';
const INPUT_SCHEMA='PHI-OS-CROSS-PERSPECTIVE-INPUT-IR-v1.0.0';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const uniq=values=>[...new Set((Array.isArray(values)?values:[]).filter(Boolean))].sort();
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function stable(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`}
async function sha256(value){const bytes=new TextEncoder().encode(typeof value==='string'?value:stable(value));const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function claimSubject(claim){
 const prefix=`METHOD_NATIVE:${claim.methodId}:`;
 if(typeof claim.semanticDimension!=='string'||!claim.semanticDimension.startsWith(prefix))return null;
 return claim.semanticDimension.slice(prefix.length).trim().toUpperCase()||null;
}
export function mapCustomerPublishableClaim(claim){
 if(claim?.publicationState!=='CUSTOMER_PUBLISHABLE')fail('CROSS_MATRIX_CUSTOMER_PUBLISHABLE_CLAIM_REQUIRED',{claimId:claim?.claimId});
 const subject=claimSubject(claim);if(!subject)return freeze({claimRef:claim.claimId,methodId:claim.methodId,subject:null,dimensions:[]});
 const dimensions=METHOD_SEMANTIC_DIMENSION_MAPPING[claim.methodId]?.[subject]||[];
 return freeze({claimRef:claim.claimId,methodId:claim.methodId,subject,dimensions:uniq(dimensions)});
}
export async function buildSemanticEvidenceMatrix(crossInput){
 if(crossInput?.schemaVersion!==INPUT_SCHEMA)fail('CROSS_MATRIX_INPUT_IR_REQUIRED');
 if(crossInput.boundaries?.smrProseConsumed!==false||crossInput.boundaries?.allPublicMethodClaimsCustomerPublishable!==true)fail('CROSS_MATRIX_INPUT_BOUNDARY_REQUIRED');
 const rows=new Map(SHARED_SEMANTIC_DIMENSIONS.map(d=>[d.code,{dimension:d.code,methodClaimRefs:[],supports:[],tensions:[],open:[],xpfContextRefs:[],currentRealityRefs:[]}]))
 const unmappedClaimRefs=[];
 for(const method of crossInput.methodInputs||[]){
  if(method.publicationState!=='CUSTOMER_PUBLISHABLE')fail('CROSS_MATRIX_METHOD_PUBLICATION_STATE_REQUIRED',{methodId:method.methodId});
  for(const claim of method.claims||[]){
   const mapped=mapCustomerPublishableClaim(claim);
   if(!mapped.dimensions.length){unmappedClaimRefs.push(claim.claimId);continue}
   for(const dimension of mapped.dimensions){
    const row=rows.get(dimension);if(!row)fail('CROSS_MATRIX_UNKNOWN_SHARED_DIMENSION',{dimension,claimId:claim.claimId});
    row.methodClaimRefs.push(claim.claimId);
    if(['TENSION','TRADEOFF'].includes(claim.claimType)||claim.counterEvidenceRefs?.length)row.tensions.push(claim.claimId);
    else if(claim.claimType==='OPEN')row.open.push(claim.claimId);
    else row.supports.push(claim.claimId);
   }
  }
 }
 if(crossInput.xpfContext){
  for(const record of crossInput.xpfContext.contextRecords||[]){
   for(const dimension of XPF_CONTEXT_DIMENSION_MAPPING[record.field]||[]){const row=rows.get(dimension);if(row)row.xpfContextRefs.push(record.ref)}
  }
 }
 const dimensions=[...rows.values()].map(row=>freeze({dimension:row.dimension,methodClaimRefs:uniq(row.methodClaimRefs),supports:uniq(row.supports),tensions:uniq(row.tensions),open:uniq(row.open),xpfContextRefs:uniq(row.xpfContextRefs),currentRealityRefs:[]}));
 const seed={schemaVersion:SEMANTIC_EVIDENCE_MATRIX_SCHEMA,sourceInputDigest:crossInput.inputDigest,dimensions,unmappedClaimRefs:uniq(unmappedClaimRefs),boundaries:{rawSymbolsMapped:false,smrProseConsumed:false,methodVotingPerformed:false,xpfCountsTowardMethodAgreement:false,hdrCountsTowardMethodAgreement:false,hdrPublicContentProjected:false,currentRealityIntegrationActivated:false,currentRealityRefsRequiredEmpty:true}};
 const matrixDigest=await sha256(seed);
 return freeze({...seed,matrixDigest});
}
export default Object.freeze({mapCustomerPublishableClaim,buildSemanticEvidenceMatrix});
