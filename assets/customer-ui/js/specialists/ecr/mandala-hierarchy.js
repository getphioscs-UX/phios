export const ECR_MANDALA_VISUAL_STATES=Object.freeze(['PRIMARY_ACTIVE','SUPPORTING_ACTIVE','BACKGROUND','LOCKED_DEPTH']);
export const ECR_MANDALA_EXPERIENCE_STATES=Object.freeze(['FREE_SNAPSHOT','PAID_DEPTH']);
export const ECR_MANDALA_PRIMARY_STORY_LAYERS=Object.freeze(['CC12','G16','Q16','R9']);
export const ECR_MANDALA_SECONDARY_DEPTH_LAYERS=Object.freeze(['D12','M8','H64','A8']);

const PRIMARY_STORY=new Set(ECR_MANDALA_PRIMARY_STORY_LAYERS);
const DEEP_SELECTED=new Set(['M8','H64','A8']);

export function normalizeMandalaExperienceState(value){
  return ECR_MANDALA_EXPERIENCE_STATES.includes(value)?value:'PAID_DEPTH';
}
export function isMandalaFreeSnapshot(value){return normalizeMandalaExperienceState(value)==='FREE_SNAPSHOT';}
export function resolveMandalaDriverRelation(rank){
  const n=Number(rank);
  if(n===1)return 'PRIMARY';
  if(n===2||n===3)return 'SUPPORTING';
  return '';
}
export function resolveMandalaVisualState({layer,selected=false,relation='',driverRank=null,experienceState='PAID_DEPTH'}={}){
  const free=isMandalaFreeSnapshot(experienceState);
  const rank=Number(driverRank);
  if(layer==='D12'){
    if(rank===1)return 'PRIMARY_ACTIVE';
    if(rank===2||rank===3)return free?'LOCKED_DEPTH':'SUPPORTING_ACTIVE';
    return 'BACKGROUND';
  }
  if(relation==='SUPPORTING')return free?'LOCKED_DEPTH':'SUPPORTING_ACTIVE';
  if(relation==='PRIMARY')return selected?'PRIMARY_ACTIVE':'BACKGROUND';
  if(!selected)return 'BACKGROUND';
  if(free&&DEEP_SELECTED.has(layer))return 'LOCKED_DEPTH';
  if(PRIMARY_STORY.has(layer))return 'PRIMARY_ACTIVE';
  return 'SUPPORTING_ACTIVE';
}
