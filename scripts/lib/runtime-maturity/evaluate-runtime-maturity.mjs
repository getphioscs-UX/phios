import { exists, RM_CODES } from './mrm-s-current-lib.mjs';
export function evaluateRuntimeMaturity(capability){
  const na=new Set(capability.notApplicableRmLevels||[]); let highest='NOT_ASSESSED'; const satisfied=[];
  for(const level of RM_CODES){
    if(na.has(level)){satisfied.push({level,state:'NOT_APPLICABLE'});continue;}
    const refs=capability.rmEvidence?.[level]||[];
    if(Array.isArray(refs)&&refs.length>0&&refs.every(exists)){highest=level;satisfied.push({level,state:'SATISFIED'});continue;}
    satisfied.push({level,state:'BLOCKED',missing:refs.filter?.(p=>!exists(p))||[]});break;
  }
  return {evaluatedRM:highest,satisfied};
}
