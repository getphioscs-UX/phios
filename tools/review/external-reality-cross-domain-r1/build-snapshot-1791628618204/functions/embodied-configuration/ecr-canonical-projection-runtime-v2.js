import {initializeEcrAstronomy} from './ecr-astronomical-initialization-runtime-v2.js';
import {projectEcrDriverField} from './ecr-planetary-driver-runtime-v2.js';
import {projectEcrSemanticDepth} from './ecr-semantic-runtime-projection.js';
import {projectEcrTopicSuccessorSelection} from './ecr-topic-successor-projection.js';
import {projectEcrCarrierArchitecture} from './ecr-carrier-architecture-projection.js';
import {projectEcrCarrierC1} from './ecr-carrier-c1-projection.js';
import {projectEcrCarrierContinuity} from './ecr-carrier-continuity-projection.js';
import {projectEcrConsciousRuntime} from './ecr-conscious-runtime-projection.js';
import {bindEcrHumanRuntimeReality} from '../current-reality/ecr-human-runtime-binding.js';
import {ECR_FIGURES} from './ecr-figure-authority.js';
import {sha256Stable,deepFreeze} from '../interpretation-runtime/mir7-utils.js';
import {buildEcrCanonicalProjectionFromAnchor} from './ecr-canonical-projection-runtime.js';
export const ECR_HUMAN_RUNTIME_SCHEMA='PHI-OS-ECR-HUMAN-RUNTIME-CONFIGURATION-v4.1';
export async function buildEcrHumanRuntime({canonicalInput,currentReality={},astronomyModuleLoader}={}){
 const initialization=await initializeEcrAstronomy(canonicalInput,{astronomyModuleLoader});
 const field=projectEcrDriverField(initialization),driverField={...field,owner:'K1',outputDigest:await sha256Stable(field)};
 const architecture=await projectEcrCarrierArchitecture(driverField),c1=await projectEcrCarrierC1(architecture),continuityBaseline=await projectEcrCarrierContinuity(c1),consciousRuntime=await projectEcrConsciousRuntime(c1);
 const reality=bindEcrHumanRuntimeReality({...currentReality,locale:canonicalInput.locale});
 const loop=(stage)=>({architecture:ECR_FIGURES['FIG-5E'].internalComponents.find(c=>c.conceptId.endsWith(stage)).components.map(c=>c.term),relationType:'ARCHITECTURAL_SEQUENCE',currentState:'UNBOUND',provenance:'UNKNOWN',evidenceRefs:reality.observations.filter(o=>(stage==='CONSCIOUS_REALITY_SELECTION'?['DECISION','EXECUTION','RELATIONSHIP','CURRENT_STATE']:['BODY_CARRIER','LOAD','ENVIRONMENT','RECOVERY','DRIFT','RESOURCES']).includes(o.domain)).map(o=>o.observationId),evidenceInterpretation:'SELF_REPORTED_CONTEXT_ONLY',unknownReason:'DYNAMIC_LOOP_RESOLVER_NOT_ADMITTED',upstreamDigest:stage==='CONSCIOUS_REALITY_SELECTION'?consciousRuntime.c5.outputDigest:continuityBaseline.outputDigest,reentryRecalculatesAstronomy:false});
 const baseline={schemaVersion:ECR_HUMAN_RUNTIME_SCHEMA,methodId:'ECR',initialization,p64:{mechanicalAuthorityRef:'functions/method-runtime/personal-structure/gate-wheel.js',environmentBridgeAuthorityRef:'content/embodied-configuration/ecr-p64-environment-bridge-v1.json'},driverField,semanticDepth:projectEcrSemanticDepth(driverField),carrier:{architecture,c1,continuityBaseline},consciousRuntime};
 baseline.topicSelection=projectEcrTopicSuccessorSelection(driverField,baseline.semanticDepth);
 const baselineDigest=await sha256Stable(baseline);
 return deepFreeze({...baseline,configurationId:`ECR-V4.1-${baselineDigest}`,baselineDigest,currentReality:reality,feedback:{consciousRealitySelectionLoop:loop('CONSCIOUS_REALITY_SELECTION'),carrierContinuityLoop:loop('CARRIER_CONTINUITY')},provenance:['CALCULATED','DERIVED','INTERPRETED','OBSERVED','DYNAMIC','UNKNOWN'],unknown:[...initialization.activations.filter(a=>a.status==='UNKNOWN').map(a=>`${a.layer}.${a.bodyCode}`),...architecture.unknown,...c1.unknown,...Object.values(consciousRuntime).flatMap(c=>c.unknown)],lineage:{initializationDigest:initialization.calculationDigest||null,baselineDigest,authorityFreeze:'content/embodied-configuration/v4-1/ecr-human-runtime-v4-1-authority-freeze-v1.json'},compatibility:{legacySolarAnchorCoordinate:'HISTORICAL_ONLY',legacyDriverAffinity:'LEGACY_BASELINE_AFFINITY',legacyEcrH64SectorProjection:'SUPERSEDED_GEOMETRY'},boundaries:{currentRealityKnown:reality.currentRealityKnown,scientificCausationClaimed:false,rendererRecalculates:false,rendererCreatesMeaning:false,humanReviewRequired:true,customerProductionAdmitted:false}});
}
// Explicit legacy projection uses the unchanged predecessor implementation.
export function projectEcrLegacyCompatibility(ir,canonicalInput){
 const sun=ir.initialization.activations.find(a=>a.layer==='PERSONALITY'&&a.bodyCode==='SUN'&&a.status==='CALCULATED');
 if(!sun)throw Error('ECR_LEGACY_COMPATIBILITY_BIRTH_SUN_REQUIRED');
 return buildEcrCanonicalProjectionFromAnchor({canonicalInput,anchor:{utcIso:sun.instantUTC,longitude:sun.eclipticLongitude,referenceFrame:sun.lineage.referenceFrame,engineCode:sun.lineage.engineCode,engineVersion:sun.lineage.engineVersion}});
}
