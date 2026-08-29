import {freezeDeep,NUM_DEPTH_ENERGY_SCHOOL} from './num-depth-rules.js';
export const NUM_D5_PATTERN_SCHEMA='PHI-OS-NUM-D5-ENERGY-PATTERN-MEANING-CANDIDATE-v1.0.0';
const P=Object.freeze({
 '516':['mobility, external movement and developing through changing environments','流动、外部移动，以及在变化环境中展开'],
 '156':['mobility, external movement and developing through changing environments','流动、外部移动，以及在变化环境中展开'],
 '876':['strong presence, resource coordination, authority and the need to regulate emotional pressure','强势呈现、资源协调、承担与权威，以及调节情绪压力'],
 '786':['strong presence, resource coordination, authority and the need to regulate emotional pressure','强势呈现、资源协调、承担与权威，以及调节情绪压力'],
 '189':['detail detection, high standards, observation and audit-like scrutiny','细节侦测、高标准、观察与类似审计的检视'],
 '819':['detail detection, high standards, observation and audit-like scrutiny','细节侦测、高标准、观察与类似审计的检视'],
 '797':['verbal or strategic influence and public-facing coordination','语言或策略影响与公共协调'], '977':['verbal or strategic influence and public-facing coordination','语言或策略影响与公共协调'],
 '887':['social strategy, ambition, method and active outward engagement','社交策略、企图心、方法感与积极对外互动'],
 '279':['interpersonal attunement and reading social cues','人际感知与读取社交线索'], '729':['interpersonal attunement and reading social cues','人际感知与读取社交线索'],
 '369':['calculation, practical framing and translating a method into something shareable','计算、务实框架与把方法整理成可分享形式'], '639':['calculation, practical framing and translating a method into something shareable','计算、务实框架与把方法整理成可分享形式'],
 '549':['logical framing, learning, expression and persistence','逻辑框架、学习、表达与韧性'], '459':['logical framing, learning, expression and persistence','逻辑框架、学习、表达与韧性'],
 '358':['action, execution and moving intention into concrete activity','行动、执行与把意图推进到具体活动'], '538':['action, execution and moving intention into concrete activity','行动、执行与把意图推进到具体活动'],
 '448':['composure, control, professional focus and sensitivity around security','冷静、控制、专业聚焦与安全感敏感'],
 '988':['serious effort, execution intensity and strong appetite for results','认真投入、执行强度与较强结果欲望'], '898':['serious effort, execution intensity and strong appetite for results','认真投入、执行强度与较强结果欲望'],
 '393':['manual dexterity, creative skill and quick expressive execution','手作灵巧、创造技巧与快速表达执行'], '933':['manual dexterity, creative skill and quick expressive execution','手作灵巧、创造技巧与快速表达执行'],
 '123':['quick action and communication','快速行动与沟通'], '213':['a more think-before-act variation of quick communication','较倾向先想后做的快速沟通变化'],
 '472':['study, analysis and quantitative or structured problem solving','学习、分析与数量化或结构化问题处理'], '742':['study, analysis and quantitative or structured problem solving','学习、分析与数量化或结构化问题处理'],
 '145':['writing, visual expression, mobility and inspiration','写作、视觉表达、流动与灵感'], '415':['writing, visual expression, mobility and inspiration','写作、视觉表达、流动与灵感'],
 '336':['quick pattern recognition and shortcut-seeking that benefits from grounding','快速识别路径与捷径倾向，同时需要落地'],
 '685':['emotional intensity, forceful expression and control pressure','情绪强度、强势表达与控制压力'], '865':['emotional intensity, forceful expression and control pressure','情绪强度、强势表达与控制压力'],
 '775':['heightened susceptibility to external influence and the need to distinguish one’s own stance','较容易受外部影响，因此需要区分自己的立场']
});
export function buildNumEnergyPatternMeaningCandidate({pattern,locale='en'}={}){const p=String(pattern||'');const row=P[p];if(!row)return freezeDeep({schemaVersion:NUM_D5_PATTERN_SCHEMA,workCode:'NUM-D5',school:NUM_DEPTH_ENERGY_SCHOOL,pattern:p,availability:'STRUCTURAL_ONLY_NO_SOURCE_WITNESSED_MEANING',runtimeUseAllowed:false,customerPublishable:false});const canonical={'156':'516','786':'876','819':'189','977':'797','729':'279','639':'369','459':'549','538':'358','898':'988','933':'393','213':'123','742':'472','415':'145','865':'685'}[p]||p;return freezeDeep({schemaVersion:NUM_D5_PATTERN_SCHEMA,workCode:'NUM-D5',school:NUM_DEPTH_ENERGY_SCHOOL,pattern:p,canonicalClaimPattern:canonical,text:locale==='zh-Hans'?row[1]:row[0],sourceClaimId:`NUM-D5-PATTERN-${canonical}`,availability:'SOURCE_WITNESSED_CANDIDATE',reviewState:'PENDING_D8_HUMAN_ADMISSION',runtimeUseAllowed:false,customerPublishable:false,boundaries:{wealthGuaranteeRemoved:true,careerPrescriptionRemoved:true,fortunePredictionAllowed:false,financialAdviceAllowed:false}})}
