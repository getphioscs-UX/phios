export function evaluateEvidenceStaleness(evidence,currentVersion,{materialVersionChange=false}={}){
 if(evidence.evidenceState==='INVALID') return {state:'INVALID',current:false};
 if(materialVersionChange||evidence.version!==currentVersion) return {state:'STALE',current:false,reason:'VERSION_BINDING_MISMATCH_OR_MATERIAL_CHANGE'};
 return {state:'CURRENT',current:true};
}
