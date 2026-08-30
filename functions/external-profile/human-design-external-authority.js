export const HD_EXTERNAL_AUTHORITY_VERSION='PHI-OS-HD-PRO-R2-EXTERNAL-AUTHORITY-v1.0.0';
export const HD_EXTERNAL_READING_IR_VERSION='PHI-OS-HD-PRO-R2-READING-IR-v1.0.0';
export const HD_EXTERNAL_REALITY_COMPOSITION_VERSION='PHI-OS-HD-PRO-R2-REALITY-COMPOSITION-v1.0.0';

export const HD_EXTERNAL_PRODUCTION=Object.freeze({
  intakeCustomerExecutable:true,
  confirmationCustomerExecutable:true,
  canonicalChartCustomerVisible:true,
  readingCandidateMachineExecutable:true,
  humanReviewRequired:true,
  humanReviewAccepted:false,
  customerReadingPublicationAllowed:false,
  phiosHumanDesignCalculationAllowed:false,
  hdrPublicExecutionAllowed:false,
  advancedVariableAutomaticCalculationAllowed:false
});

const entry=(category,en,zh,domains,boundary)=>Object.freeze({
  category,
  sourceRef:`knowledge/external-readers/human-design/registry/entries.json#human_design.${category}`,
  runtimeLanguage:Object.freeze({en,zhHans:zh}),
  runtimeDomains:Object.freeze(domains),
  boundary:Object.freeze({en:boundary[0],zhHans:boundary[1]})
});

export const HD_EXTERNAL_CATEGORY_AUTHORITY=Object.freeze({
  type:entry('type','Use the reported Type as a carrier-and-action lens: compare how engagement, initiation and response are organized across situations.','把报告中的 Type 当作载体与行动视角：比较投入、发起与回应在不同情境中如何组织。',['carrier','action'],['Type does not establish personality, capability, causation or inevitable behaviour.','Type 不能证明人格、能力、因果关系或必然行为。']),
  strategy:entry('strategy','Use the reported Strategy as an observation protocol: compare when action begins, what it responds to and how friction changes.','把报告中的 Strategy 当作观察协议：比较行动何时开始、回应什么，以及阻力如何变化。',['decision','action','navigation'],['Strategy is not a required action and cannot override present constraints.','Strategy 不是强制行动，也不能凌驾于现实约束。']),
  authority:entry('authority','Use the reported Authority as a decision-architecture lens: observe timing, signal stability and the conditions under which a choice becomes clearer.','把报告中的 Authority 当作决策架构视角：观察决定时机、信号稳定度，以及选择在什么条件下逐渐清晰。',['decision','time','navigation'],['Authority does not override safety, law, financial reality, regulated advice or client choice.','Authority 不能取代安全、法律、财务现实、持牌专业意见或客户选择。']),
  profile:entry('profile','Use the reported Profile as a relational-and-expression lens: observe how learning, visibility, expectation and role negotiation recur.','把报告中的 Profile 当作关系与表达视角：观察学习、被看见、他人期待与角色协商如何反复出现。',['relationship','experience','expression'],['Profile is not a fixed identity or verified account of motive.','Profile 不是固定身份，也不能证明真实动机。']),
  definition:entry('definition','Use the reported Definition as a carrier-and-relationship lens: observe continuity of processing and whether interaction changes integration.','把报告中的 Definition 当作载体与关系视角：观察处理过程的连续性，以及互动是否改变整合方式。',['carrier','relationship'],['Definition does not prove dependency, compatibility or relationship outcome.','Definition 不能证明依赖、相容性或关系结果。']),
  center:entry('center','Treat defined and open Centers as a domain map for organizing questions about carrier signals, experience, expression, pressure and resources.','把定义与开放中心当作领域地图，用来组织载体信号、经验、表达、压力与资源的问题。',['carrier','experience','expression','resources','constraints'],['Centers are not organs, diagnoses or medical evidence.','中心不是器官、诊断或医疗证据。']),
  channel:entry('channel','Treat reported Channels as structural connections whose proposed themes require repeated, traceable reality evidence before being called a recurring signature.','把报告中的 Channels 当作结构连接；相关主题只有在出现反复且可追踪的现实证据后，才可讨论为持续签名。',['signatures','action','expression','relationship'],['A channel description does not establish an observed Runtime signature.','通道描述本身不能建立已观察到的 Runtime 签名。']),
  gate:entry('gate','Treat reported Gates as a fine-grained vocabulary for asking limited questions about recurring experience, expression and action.','把报告中的 Gates 当作细分词汇，用于有限地询问经验、表达与行动是否反复出现。',['experience','expression','action','signatures'],['Gate language cannot be used as a deterministic trait or prediction.','闸门不能被解释为确定性特质或预测。']),
  variable:entry('variable','Treat reported Variables as an orientation lens for observing how attention, context and sensory conditions change operation.','把报告中的 Variables 当作取向视角，观察注意力、情境与感官条件如何改变运行状态。',['environment','carrier','experience','resources'],['Variables do not establish a fixed perceptual identity.','Variables 不能证明固定的感知身份。']),
  phs:entry('phs','Treat reported PHS-related details as carrier conditions to compare with lived sensory context and resource rhythm.','把报告中的 PHS 相关资料当作载体条件，与真实感官情境和资源节律进行比较。',['carrier','environment','resources'],['PHS is not medical, nutritional or therapeutic advice.','PHS 不构成医疗、营养或治疗建议。']),
  environment:entry('environment','Use the reported Environment as a reversible comparison across real contexts: where do attention, energy and interaction become more or less stable?','把报告中的 Environment 用作可逆的现实情境比较：注意力、精力与互动在哪些环境中更稳定或更不稳定？',['environment','carrier','constraints'],['Environment language does not establish a universally correct place.','Environment 描述不能证明存在普遍正确的地点。']),
  cognition:entry('cognition','Use the reported Cognition as an experience lens: ask which sensory signals are most consistently noticed in real situations.','把报告中的 Cognition 当作经验视角：询问在真实情境中哪些感官信号最稳定地被注意到。',['experience','carrier','environment'],['Cognition does not prove perceptual accuracy or diagnostic status.','Cognition 不能证明感知正确性，也不是诊断。']),
  motivation:entry('motivation','Use the reported Motivation as a meaning-and-action lens: observe which framing repeatedly precedes choices without assuming hidden intent.','把报告中的 Motivation 当作意义与行动视角：观察哪些理解框架反复出现在选择之前，同时不假定隐藏动机。',['experience','decision','action'],['Motivation language cannot establish a person’s actual motive as fact.','Motivation 描述不能把一个人的真实动机确定为事实。']),
  perspective:entry('perspective','Use the reported Perspective as an observation lens: compare which distinctions become salient and what tends to remain outside attention.','把报告中的 Perspective 当作观察视角：比较哪些差异会进入注意范围，以及哪些内容容易留在注意之外。',['experience','environment','navigation'],['Perspective does not establish objective truth or a uniquely correct interpretation.','Perspective 不能证明客观真相，也不能确定唯一正确的解释。'])
});

export function hdExternalAuthorityFor(category){return HD_EXTERNAL_CATEGORY_AUTHORITY[category]||null}
