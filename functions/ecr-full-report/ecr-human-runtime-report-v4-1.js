import {ECR_V41_AUTHORITIES} from '../embodied-configuration/ecr-v41-authorities.generated.js';
const admission=ECR_V41_AUTHORITIES['content/embodied-configuration/v4-1/admission/customer-admission-v1.json'];
const sections=[['OVERVIEW','PHI Configuration Overview','PHI 构型概览'],['ORIENTATION','Question / Capability Orientation','问题与能力方向'],['INITIALIZATION','Birth / Design Configuration','出生与 Design 构型'],['DRIVER_FIELD','Planetary Driver Field','行星驱动场'],['CARRIER_ARCHITECTURE','Carrier Architecture','载体架构'],['C1','Carrier Runtime Style','载体运行方式'],['C2','Experience Integration','体验整合'],['C3','Expression Style','表达方式'],['C4','Agency Style','行动方式'],['C5','Identity Style','身份方式'],['CONTINUITY','Continuity & Recovery','持续与恢复'],['CURRENT_REALITY','Current Reality Comparison','当前现实对照'],['NAVIGATION','Navigation','现实导航'],['EVIDENCE','Evidence / Boundaries / Unknowns','证据、边界与未知']];
const copy={
 ORIENTATION:{
  en:'No personal Question / Capability orientation is published yet because the V4.1 compositional semantic resolver has no human-admitted rules for this field. The calculated baseline remains available, but this section stays unknown until those rules are admitted.',
  zh:'目前尚未发布个人化的问题／能力方向，因为 V4.1 组合语义解析器在此字段还没有经过人工准入的规则。已计算的基线结构仍保留，但在这些规则获准前，本节保持未知。'
 },
 CARRIER_ARCHITECTURE:{
  en:"Figures 4A–4B define the Carrier architecture, but no admitted rule currently converts this person's baseline activations into a personal hierarchy, capacity, constraint, integrity or connectivity result. The architecture is available; the personal result remains unknown.",
  zh:'Figure 4A–4B 已定义载体架构，但目前还没有获准规则把这个人的基线激活转换为个人化的层级、容量、约束、完整性或连接结果。架构本身已建立；个人结果仍保持未知。'
 },
 C1:{
  en:'Figure 4C defines the C1 Carrier Runtime fields, but the personal composition rules that would populate intake, environment, perception, cognition, biology, regulation, connectivity, cost and Carrier Runtime Style are not yet admitted. These values therefore remain unknown.',
  zh:'Figure 4C 已定义 C1 载体运行字段，但用于生成个人化摄取、环境、感知、认知、生物运行、调节、连接、运行成本与载体运行方式的组合规则尚未获准，因此这些数值继续保持未知。'
 },
 C2:{
  en:'Figure 5A defines the C2 Experience engine, but no admitted personal composition yet resolves experience filter, stability, perspective, motivation, emotional weighting or meaning orientation from this baseline. C2 therefore remains unknown.',
  zh:'Figure 5A 已定义 C2 体验引擎，但目前还没有获准的个人组合规则，从这份基线解析体验过滤、稳定模式、视角、动机、情绪权重或意义方向，因此 C2 继续保持未知。'
 },
 C3:{
  en:'Figure 5B defines the C3 Expression engine, but no admitted personal composition yet resolves expression drive, translation, compression, architecture, threshold, medium or expression style from this baseline. C3 therefore remains unknown.',
  zh:'Figure 5B 已定义 C3 表达引擎，但目前还没有获准的个人组合规则，从这份基线解析表达驱动力、转换方式、压缩、表达架构、阈值、媒介或表达风格，因此 C3 继续保持未知。'
 },
 C4:{
  en:'Figure 5C defines the C4 Agency engine, but no admitted personal composition yet resolves direction, decision strategy, choice, conflict, responsibility, commitment or execution readiness from this baseline. C4 therefore remains unknown.',
  zh:'Figure 5C 已定义 C4 行动引擎，但目前还没有获准的个人组合规则，从这份基线解析方向、决策策略、选择、冲突、责任、承诺或执行准备度，因此 C4 继续保持未知。'
 },
 C5:{
  en:'Figure 5D defines the C5 Identity engine, but no admitted personal composition yet resolves identity core, boundary, flexibility, drift, stability, integration or openness from this baseline. No fixed identity type is inferred; C5 remains unknown.',
  zh:'Figure 5D 已定义 C5 身份引擎，但目前还没有获准的个人组合规则，从这份基线解析身份核心、边界、弹性、漂移、稳定、整合或开放性。系统不会据此推断固定身份类型；C5 继续保持未知。'
 },
 CURRENT_REALITY:{
  en:'No Current Reality observations are bound to this review case. In V4.1, this section supports observation and comparison only; current driver priority, bottleneck, drift, recovery, runtime state and action conclusions remain unknown unless separately admitted.',
  zh:'此审核案例尚未绑定任何当前现实观察。V4.1 在这里仅支持观察与对照；当前驱动优先级、瓶颈、漂移、恢复、运行状态与行动结论，在另行获准前全部保持未知。'
 },
 EVIDENCE:{
  en:'Astronomical coordinates are calculated outputs. PHI architecture and any personal C1–C5 interpretation are governed interpretive layers, not evidence of biological causation or guaranteed outcomes. Unadmitted personal fields remain unknown; the complete unknown list belongs in the technical evidence appendix.',
  zh:'天文坐标属于计算输出；PHI 架构与任何个人化 C1–C5 解读属于受治理的解释层，不是生物因果证明，也不是必然结果。尚未获准的个人字段继续保持未知；完整未知清单应保留在技术证据附录。'
 }
};
export function buildEcrHumanRuntimeReport({ir,locale='en',sharedEntitlement=null,reviewMode=false}={}){
 if(ir?.schemaVersion!=='PHI-OS-ECR-HUMAN-RUNTIME-CONFIGURATION-v4.1')throw Error('ECR_V41_IR_REQUIRED');
 if(!reviewMode&&!admission.customerProductionAdmitted)throw Error('ECR_V41_HUMAN_REVIEW_REQUIRED');
 const paid=sharedEntitlement?.schemaVersion==='PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0'&&sharedEntitlement.methodCode==='ECR'&&sharedEntitlement.access?.methodAllowed===true&&sharedEntitlement.access?.readingDepthAllowed===true;
 const zh=locale==='zh-Hans',pick=entry=>zh?entry.zh:entry.en;
 const content={
  OVERVIEW:{text:zh?'这是基线构型参照，不能证明你现在的体验或处境。':'This is a baseline configuration reference; it does not establish your present experience or circumstances.'},
  ORIENTATION:{text:pick(copy.ORIENTATION)},
  INITIALIZATION:{activations:ir.initialization.activations.map(a=>({layer:a.layer,body:a.bodyCode,longitude:a.eclipticLongitude??null,gate:a.p64?.gate??null,line:a.p64?.line??null,activationStage:a.p64?.activationStage??null,status:a.status}))},
  DRIVER_FIELD:{drivers:ir.driverField.drivers.map(d=>({driverId:d.driverId,bodies:d.bodyBinding,status:d.status})),text:zh?'基线驱动场不等于当前驱动优先级。':'The baseline driver field is not a current priority ranking.'},
  CARRIER_ARCHITECTURE:{text:pick(copy.CARRIER_ARCHITECTURE),scope:ir.carrier.architecture.personalScaleEnvelope},
  C1:{text:pick(copy.C1),fields:ir.carrier.c1.outputSignature},
  C2:{text:pick(copy.C2),fields:ir.consciousRuntime.c2.outputSignature},
  C3:{text:pick(copy.C3),fields:ir.consciousRuntime.c3.outputSignature},
  C4:{text:pick(copy.C4),fields:ir.consciousRuntime.c4.outputSignature},
  C5:{text:pick(copy.C5),fields:ir.consciousRuntime.c5.outputSignature},
  CONTINUITY:{text:zh?'持续架构描述可比较的状态，不预测人生阶段。':'The continuity architecture describes states for comparison, not a predicted life sequence.',currentState:ir.carrier.continuityBaseline.continuityState.currentState},
  CURRENT_REALITY:{status:ir.currentReality.status,observations:ir.currentReality.observations,text:pick(copy.CURRENT_REALITY)},
  NAVIGATION:{text:zh?'可自愿记录现实观察，再与基线对照；出生构型本身不提供当前行动结论。':'You may record observations and compare them with the baseline; birth configuration alone supplies no current action conclusion.'},
  EVIDENCE:{unknown:ir.unknown,text:pick(copy.EVIDENCE)}
 };
 const visible=paid?sections:sections.filter(s=>['OVERVIEW','INITIALIZATION','EVIDENCE'].includes(s[0]));
 return {schemaVersion:'PHI-OS-ECR-HUMAN-RUNTIME-REPORT-v4.1',edition:'ECR_HUMAN_RUNTIME_V4_1',locale,depth:paid?'PAID':'FREE',publicationState:admission.customerProductionAdmitted?'CUSTOMER_PUBLISHABLE':'HUMAN_REVIEW_REQUIRED',sourceProjectionId:ir.configurationId,sections:visible.map(([sectionId,en,cn])=>({sectionId,title:zh?cn:en,scope:sectionId==='CURRENT_REALITY'?'CURRENT':'BASELINE',content:content[sectionId],sourceRefs:[ir.configurationId]})),boundaries:{rendererCalculates:false,rendererCreatesMeaning:false,reviewModeDoesNotGrantPaidAccess:true,customerProductionAdmitted:admission.customerProductionAdmitted},lineage:ir.lineage};
}
