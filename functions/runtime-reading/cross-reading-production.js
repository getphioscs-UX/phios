import {adaptAcceptedMethodReadingEnvelope} from '../single-method-reading/method-production-adapter-core.js';
import {buildCustomerClaimIR} from '../single-method-reading/customer-claim-ir.js';
import {buildCrossPerspectiveInputIR} from './cross-perspective-input-ir.js';
import {buildSemanticEvidenceMatrix} from './semantic-evidence-matrix.js';
import {buildCrossMethodRuntimeReadingIRv2} from './cross-method-reading-ir-v2.js';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
const stable=value=>{if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`};
async function sha256(value){const bytes=new TextEncoder().encode(typeof value==='string'?value:stable(value));const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}

export const CROSS_PRODUCTION_ADMISSION=freeze({
  schemaVersion:'PHI-OS-CROSS-R2-PRODUCTION-ADMISSION-v1.0.0',
  productionAllowed:true,
  customerCrossCutoverAllowed:true,
  machineAcceptance:'64_OF_64',
  humanAcceptance:'36_OF_36',
  humanReviewEvidenceRef:'content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w25-human-admission-v1.json',
  productionAdmissionRef:'content/customer-experience-rebuild/r12r4b/cross/acceptance/cross-w26-final-production-admission-v1.json',
  minimumMethods:2,
  maximumMethods:5,
  currentRealityIntegrationActivated:false
});

export async function maybeBuildProductionCombinedReading({acceptedMethodReadings,customerIntent=null,confirmedXpf=null,hdrInternalReading=null}={}){
  if(CROSS_PRODUCTION_ADMISSION.productionAllowed!==true||CROSS_PRODUCTION_ADMISSION.customerCrossCutoverAllowed!==true)return null;
  const results=Array.isArray(acceptedMethodReadings)?acceptedMethodReadings:[];
  if(results.length<CROSS_PRODUCTION_ADMISSION.minimumMethods||results.length>CROSS_PRODUCTION_ADMISSION.maximumMethods)return null;
  if(results.some(result=>result?.state!=='READY_TO_READ'))return null;
  const methodIds=results.map(result=>result?.methodId);
  if(new Set(methodIds).size!==methodIds.length)fail('CROSS_PRODUCTION_DUPLICATE_METHOD');
  const envelopes=results.map(methodResult=>adaptAcceptedMethodReadingEnvelope(methodResult,{expectedMethodId:methodResult.methodId}));
  const claimCollections=envelopes.map(envelope=>buildCustomerClaimIR({acceptedMethodReadingEnvelope:envelope,customerIntent}));
  const crossInput=await buildCrossPerspectiveInputIR({acceptedMethodReadingEnvelopes:envelopes,claimCollections,confirmedXpf,hdrInternalReading});
  const semanticMatrix=await buildSemanticEvidenceMatrix(crossInput);
  if(semanticMatrix.unmappedClaimRefs.length)fail('CROSS_PRODUCTION_UNMAPPED_CUSTOMER_PUBLISHABLE_CLAIM',{unmappedClaimRefs:semanticMatrix.unmappedClaimRefs});
  const reading=await buildCrossMethodRuntimeReadingIRv2({crossInput,semanticMatrix});
  const releaseSeed={readingDigest:reading.readingDigest,sourceInputDigest:reading.sourceInputDigest,semanticMatrixDigest:reading.semanticMatrixDigest,productionAdmissionRef:CROSS_PRODUCTION_ADMISSION.productionAdmissionRef,humanReviewEvidenceRef:CROSS_PRODUCTION_ADMISSION.humanReviewEvidenceRef,methodRefs:[...methodIds].sort()};
  const releaseDigest=await sha256(releaseSeed);
  return freeze({
    ...reading,
    state:'PRODUCTION',
    publicationState:'CUSTOMER_PUBLISHABLE_CROSS_READING',
    methodRefs:[...methodIds].sort(),
    productionAdmissionRef:CROSS_PRODUCTION_ADMISSION.productionAdmissionRef,
    humanReviewEvidenceRef:CROSS_PRODUCTION_ADMISSION.humanReviewEvidenceRef,
    technical:freeze({...reading.technical,customerCutover:'OPEN',productionAdmission:'W24_64_OF_64_PLUS_W25_36_OF_36'}),
    boundaries:freeze({...reading.boundaries,customerCutoverActivated:true,currentRealityIntegrationActivated:false}),
    releaseDigest
  });
}

export default Object.freeze({CROSS_PRODUCTION_ADMISSION,maybeBuildProductionCombinedReading});
