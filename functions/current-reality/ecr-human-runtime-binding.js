import {normalizePersonalCurrentRealityInput,canonicalizeCurrentRealityObservations,buildRealityComparisons} from './personal-current-reality-runtime.js';
const unknown=reason=>({value:null,status:'UNKNOWN',provenance:'UNKNOWN',unknownReason:reason,evidenceRefs:[]});
export function bindEcrHumanRuntimeReality({rawInput={},locale='en',candidates=[],responses=[]}={}){
 const input=normalizePersonalCurrentRealityInput(rawInput,locale),observations=canonicalizeCurrentRealityObservations(input);
 const comparisons=buildRealityComparisons({candidates,responses,observationIr:observations});
 const observed=observations.observations.map(o=>({...o,provenance:'OBSERVED'}));
 const byDomain=domain=>observed.filter(o=>o.domain===domain).map(o=>({observationRef:o.observationId,statement:o.statement,provenance:'OBSERVED',objectiveFact:false}));
 const unknownReason=observed.length?'PERSONAL_DYNAMIC_RESOLVER_NOT_ADMITTED':'CURRENT_REALITY_EVIDENCE_REQUIRED';
 return {status:observed.length?'OBSERVATIONS_BOUND':'UNBOUND',observations:observed,comparisons,currentRealityKnown:observed.length>0,dynamicRuntime:observed.length?{currentDriverPriority:unknown(unknownReason),runtimeState:unknown(unknownReason),bottleneckLayer:unknown(unknownReason),flow:unknown(unknownReason),strain:unknown(unknownReason),recoverySignals:byDomain('RECOVERY'),driftSignals:byDomain('DRIFT'),nextObservationTargets:comparisons.comparisons.filter(c=>c.responseState==='OPEN').map(c=>({claimRef:c.methodClaimRef,status:'OPEN',provenance:'UNKNOWN',evidenceRefs:c.observationRefs})),reconfigurationCandidates:[]}:null,observationsAreSelfReports:true,sourceAuthority:'functions/current-reality/personal-current-reality-runtime.js',automaticSemanticMatching:false};
}
