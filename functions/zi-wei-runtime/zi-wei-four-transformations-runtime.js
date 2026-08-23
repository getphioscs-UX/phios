import { loadZiWeiPolicy } from './policy-gate.js';
const TRANS=['HUA_LU','HUA_QUAN','HUA_KE','HUA_JI'];
export function placeZiWeiFourTransformations(calendar,stars,options={}){
  const policy=options.policy||loadZiWeiPolicy();
  const p=policy.requiredPolicies.find(x=>x.policyCode==='TRANSFORMATION_SCOPE');
  const row=p?.decision?.table?.[calendar?.birthYear?.stem];
  if(!Array.isArray(row)||row.length!==4) throw Object.assign(new Error('Frozen Southern four-transformation row missing'),{code:'ZWR_TRANSFORMATION_TABLE_MISSING'});
  const byCode=new Map(stars.map(s=>[s.starCode,s]));
  const transformations=row.map((targetStarCode,i)=>{
    const target=byCode.get(targetStarCode);
    if(!target) throw Object.assign(new Error(`Transformation target ${targetStarCode} not present in admitted natal scope`),{code:'ZWR_TRANSFORMATION_TARGET_NOT_ADMITTED',targetStarCode});
    return {transformationCode:TRANS[i],targetStarCode,branch:target.branch,scope:'NATAL_BIRTH_YEAR_ONLY',schoolLabel:'SOUTHERN_TABLE'};
  });
  return {schemaVersion:'PHI-OS-ZWR-FOUR-TRANSFORMATIONS-v1.0.0',birthYearStem:calendar.birthYear.stem,transformations,interpretationIncluded:false};
}
