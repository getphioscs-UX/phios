import {freezeDeep,NUM_DEPTH_WESTERN_SCHOOL,NUM_DEPTH_PRODUCTION_ACTIVE} from './num-depth-rules.js';

export const NUM_D3_SECONDARY_MEANING_SCHEMA='PHI-OS-NUM-D3-SECONDARY-ROLE-MEANING-v1.0.0';
const META=Object.freeze({
 BALANCE:Object.freeze({claimId:'NUM-D3-ROLE-01',en:'A situational lens for how this tradition frames regaining steadiness during emotionally difficult conditions.',zh:'这一传统用于观察人在情绪扰动或困难情境中如何重新取得稳定的情境性视角。'}),
 RATIONAL_THOUGHT:Object.freeze({claimId:'NUM-D3-ROLE-02',en:'A lens on problem-solving and thinking style.',zh:'用于观察问题处理与思考方式的视角。'}),
 PLANES_OF_EXPRESSION:Object.freeze({claimId:'NUM-D3-ROLE-03',en:'A name-based distribution across physical, mental, emotional and intuitive planes, plus grounded, vacillating and creative groupings.',zh:'把姓名字母分布到身体、心智、情绪、直觉四个层面，并同时观察稳定、摇摆、创造三类分布。'}),
 BRIDGE:Object.freeze({claimId:'NUM-D3-ROLE-04',en:'A structural difference between two core numbers, used to discuss how distinct roles might be brought into closer alignment rather than scored.',zh:'两个核心数字之间的结构差值，用于讨论不同角色如何可能更协调，而不是评分。'}),
 SUBCONSCIOUS_SELF:Object.freeze({claimId:'NUM-D3-ROLE-05',en:'A name-distribution lens on coping with changing or sudden circumstances.',zh:'由姓名数字分布形成、用于观察面对变化或突发情境时应对方式的视角。'})
});
function valueFor(role,chart){
 if(role==='BALANCE')return chart?.balance?.value??null;
 if(role==='RATIONAL_THOUGHT')return chart?.rationalThought?.value??null;
 if(role==='PLANES_OF_EXPRESSION')return {planes:chart?.planes||{},groups:chart?.groups||{}};
 if(role==='BRIDGE')return chart?.bridges||{};
 if(role==='SUBCONSCIOUS_SELF')return chart?.subconsciousSelf??null;
 return null;
}
export function buildNumSecondaryRoleMeanings({secondaryChart,locale='en'}={}){
 if(!secondaryChart||secondaryChart.availability!=='AVAILABLE')return freezeDeep([]);
 const zh=locale==='zh-Hans';
 return freezeDeep(Object.entries(META).map(([role,m])=>({
  schemaVersion:NUM_D3_SECONDARY_MEANING_SCHEMA,
  workCode:'NUM-D3',
  school:NUM_DEPTH_WESTERN_SCHOOL,
  role,
  value:valueFor(role,secondaryChart),
  text:zh?m.zh:m.en,
  sourceClaimId:m.claimId,
  reviewState:'HUMAN_ADMITTED',
  runtimeUseAllowed:NUM_DEPTH_PRODUCTION_ACTIVE,
  customerPublishable:NUM_DEPTH_PRODUCTION_ACTIVE,
  boundaries:{symbolicTraditionOnly:true,empiricalTraitFactCreated:false,medicalInferenceAllowed:false,compatibilityScoreAllowed:false,fortunePredictionAllowed:false}
 })));
}
export default Object.freeze({buildNumSecondaryRoleMeanings});
