export const NUM_DEPTH_SCHEMA='PHI-OS-NUM-D1-D8-RULES-v1.0.0';
export const NUM_DEPTH_VERSION='1.0.0';
export const NUM_DEPTH_BASELINE='f52b6a3c4f1d94e6bf707af47f34e8c7dfca8837';
export const NUM_DEPTH_CURRENT_MAIN='0692037d3a3f522de9f0eb11d37f738df3a2bae6';
export const NUM_DEPTH_PRODUCTION_ACTIVE=true;
export const NUM_DEPTH_HUMAN_ADMISSION='121_CLAIMS_24_CASES_ACCEPTED';
export const NUM_DEPTH_WESTERN_SCHOOL='MODERN_WESTERN_PYTHAGOREAN_PRACTITIONER_LAYER';
export const NUM_DEPTH_ENERGY_SCHOOL='ENERGY_NUMEROLOGY_LEARNING_RECONSTRUCTED_V1';
export const MASTER_NUMBERS=Object.freeze([11,22,33]);
export const NUMBER_THEMES=Object.freeze({
 1:Object.freeze({en:'initiative, autonomy, originality and self-direction',zhHans:'主动、自主、原创与自我方向',frictionEn:'impatience, over-control or excessive self-reliance',frictionZh:'急躁、过度控制或过度依赖自己'}),
 2:Object.freeze({en:'cooperation, sensitivity, diplomacy and attunement',zhHans:'合作、敏感、协调与关系感知',frictionEn:'indecision, over-accommodation or suppressed needs',frictionZh:'犹豫、过度迁就或压抑自身需要'}),
 3:Object.freeze({en:'creative expression, communication, sociability and optimism',zhHans:'创造表达、沟通、社交与乐观',frictionEn:'scattered attention, inconsistency or avoidance of follow-through',frictionZh:'注意力分散、不持续或逃避收尾'}),
 4:Object.freeze({en:'structure, practicality, discipline and dependable effort',zhHans:'结构、务实、纪律与可靠投入',frictionEn:'rigidity, over-control or resistance to change',frictionZh:'僵化、过度控制或抗拒变化'}),
 5:Object.freeze({en:'freedom, change, adaptability, curiosity and experience',zhHans:'自由、变化、适应、好奇与体验',frictionEn:'restlessness, impulsiveness or loss of focus',frictionZh:'躁动、冲动或失去聚焦'}),
 6:Object.freeze({en:'care, responsibility, harmony, support and stewardship',zhHans:'关怀、责任、和谐、支持与照料',frictionEn:'over-responsibility, interference or weak boundaries',frictionZh:'过度承担、介入过多或界线不足'}),
 7:Object.freeze({en:'inquiry, analysis, reflection, depth and independent understanding',zhHans:'探究、分析、反思、深度与独立理解',frictionEn:'withdrawal, skepticism, isolation or over-analysis',frictionZh:'抽离、怀疑、孤立或过度分析'}),
 8:Object.freeze({en:'organization, stewardship of resources, influence and results',zhHans:'组织、资源管理、影响力与结果导向',frictionEn:'pressure, control, status fixation or material overreach',frictionZh:'压力、控制、地位执着或物质过度'}),
 9:Object.freeze({en:'compassion, broad perspective, completion and contribution',zhHans:'慈悲、广阔视角、完成与贡献',frictionEn:'over-idealism, diffuse boundaries or difficulty letting go',frictionZh:'过度理想化、界线分散或难以放下'}),
 11:Object.freeze({en:'heightened sensitivity, intuition, inspiration and transmission',zhHans:'高度敏感、直觉、启发与传递',frictionEn:'nervous intensity, overwhelm or unstable self-trust',frictionZh:'神经紧绷、过载或自我信任不稳'}),
 22:Object.freeze({en:'large-scale building, practical vision and durable implementation',zhHans:'大规模建构、务实愿景与长期落实',frictionEn:'pressure from scale, rigidity or carrying too much responsibility',frictionZh:'规模压力、僵化或承担过重'}),
 33:Object.freeze({en:'service, teaching, care, responsibility and compassionate influence',zhHans:'服务、教导、照料、责任与慈悲影响',frictionEn:'self-sacrifice, over-involvement or blurred boundaries',frictionZh:'过度牺牲、介入过多或界线模糊'})
});
export const NAME_ROLE_META=Object.freeze({
 EXPRESSION:Object.freeze({labelEn:'Expression',labelZh:'表现 / Expression',roleEn:'talents, abilities and the way a person works toward a broader life-direction potential',roleZh:'天赋、能力，以及如何运用这些资源朝较长期方向展开'}),
 SOUL_URGE:Object.freeze({labelEn:'Soul Urge',labelZh:'内驱 / Soul Urge',roleEn:'inner motivation, desire and what tends to matter emotionally',roleZh:'内在动机、欲望，以及情感上真正重视的方向'}),
 PERSONALITY:Object.freeze({labelEn:'Personality',labelZh:'个特 / Personality',roleEn:'outward image, first impression and qualities shared initially',roleZh:'外在形象、第一印象，以及较容易先让别人看见的部分'}),
 MATURITY:Object.freeze({labelEn:'Maturity',labelZh:'成熟 / Maturity',roleEn:'a later-emerging direction that becomes more noticeable from roughly the thirties onward',roleZh:'大约三十多岁以后逐渐变得明显的后期发展方向'})
});
export function digitSum(v){return String(Math.abs(Number(v)||0)).split('').reduce((a,b)=>a+Number(b),0)}
export function reduceSingle(v){let n=Math.abs(Number(v));if(!Number.isFinite(n))throw new TypeError('NUM_D_INVALID_NUMBER');while(n>9)n=digitSum(n);return n}
export function reducePreserveMaster(v){let n=Math.abs(Number(v));if(!Number.isFinite(n))throw new TypeError('NUM_D_INVALID_NUMBER');const steps=[n];while(n>9&&!MASTER_NUMBERS.includes(n)){n=digitSum(n);steps.push(n)}return Object.freeze({rawValue:Number(v),reductionSteps:Object.freeze(steps),value:n,masterPreserved:MASTER_NUMBERS.includes(n)})}
export function freezeDeep(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freezeDeep(x)}return v}
