import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';
import {canonicalBirthUtcIso} from './ecr-calculation-runtime.js';
import {createEcrSharedInitializationCapability} from './ecr-shared-initialization-capability.js';
import {resolveEcrP64} from './ecr-p64-mechanical-adapter.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
export async function initializeEcrAstronomy(canonicalInput,options={}){
 const validation=validateCanonicalBirthInput(canonicalInput);
 if(!validation.valid)throw Error(`ECR_CANONICAL_INPUT_INVALID:${validation.reasonCodes.join(',')}`);
 if(canonicalInput.consent?.granted!==true)throw Error('ECR_PROCESSING_CONSENT_REQUIRED');
 if(canonicalInput.timeAccuracy!=='EXACT'||!canonicalInput.birthDate||!canonicalInput.timezone?.iana||!canonicalInput.timezone?.utcOffsetAtBirth)return deepFreeze({status:'UNKNOWN',unknownReason:'EXACT_CALCULABLE_BIRTH_TIME_REQUIRED',birth:null,design:null,activations:[],inputVersion:canonicalInput.inputVersion});
 const capability=createEcrSharedInitializationCapability(options),birthRaw=await capability.astronomy.calculateLongitudesAt(canonicalBirthUtcIso(canonicalInput));
 const moment=await capability.priorDesign(birthRaw),designRaw=await capability.astronomy.calculateLongitudesAt(moment.instantUTC);
 const snapshot=async(raw,layer)=>{
  const bodyActivations=Object.entries(raw.longitudes).map(([bodyCode,longitude])=>({layer,bodyCode,instantUTC:raw.utcIso,eclipticLongitude:longitude,p64:resolveEcrP64(longitude),status:'CALCULATED',provenance:'CALCULATED',astronomyRef:capability.astronomy.adapterCode,designMomentRef:layer==='DESIGN'?moment.outputDigest:null,nodeConvention:bodyCode.includes('NODE')?raw.nodeConvention:null,lineage:{engineCode:raw.engineCode,engineVersion:raw.engineVersion,referenceFrame:raw.referenceFrame}}));
  bodyActivations.push({layer,bodyCode:'CHIRON',instantUTC:raw.utcIso,status:'UNKNOWN',provenance:'UNKNOWN',p64:null,unknownReason:'SHARED_ASTRONOMY_CAPABILITY_NOT_AVAILABLE',lineage:{authority:'SHARED_AST_CAPABILITY_AUDIT'}});
  const result={snapshotType:layer,instantUTC:raw.utcIso,astronomyAuthorityRef:capability.astronomy.adapterCode,ephemerisVersion:raw.engineVersion,bodyActivations};return {...result,calculationDigest:await sha256Stable(result)};
 };
 const birth=await snapshot(birthRaw,'PERSONALITY'),design=await snapshot(designRaw,'DESIGN');
 return deepFreeze({status:'CALCULATED_WITH_EXPLICIT_UNKNOWNS',inputVersion:canonicalInput.inputVersion,birth,design,designMoment:moment,activations:[...birth.bodyActivations,...design.bodyActivations],nodeConvention:birthRaw.nodeConvention,calculationDigest:await sha256Stable({birth,design})});
}
