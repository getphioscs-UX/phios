/**
 * PHI OS Runtime Navigation copy — Simplified Chinese.
 *
 * 本文件服务后端 Rule Navigation Engine，
 * 不负责前端按钮、页面标题或 DOM 文案。
 */

export const NAVIGATION_RUNTIME_ZH_HANS = Object.freeze({
  locale: 'zh-Hans',
  outputLanguage: 'zh',

  defaults: Object.freeze({
    runtimeTransition:
      '当前现实运行转变',

    knownBoundary:
      '当前已知边界',

    materialRisk:
      '任何显著增加的风险',

    currentRuntime:
      '尚未建立',

    transitionLabel:
      '澄清当前现实运行转变'
  }),

  priority: Object.freeze({
    unknown: Object.freeze({
      focus: unknown =>
        `澄清最可能改变当前现实读取的未决现实：${unknown}`,

      reason:
        '尚未解决的现实可能实质改变当前现实读取。'
    }),

    evidence: Object.freeze({
      focus: evidence =>
        `观察与“${evidence}”有关的证据是否出现、改变或持续缺席。`,

      reason:
        '当前现实读取仍需要可观察证据，才能支持更进一步的现实导航。'
    }),

    transition: Object.freeze({
      focus: transition =>
        `观察“${transition}”是否趋于稳定、发生逆转或改变方向。`,

      reason:
        '目前尚未建立由更强证据支持的现实导航优先事项。'
    })
  }),

  guidance: Object.freeze({
    desiredFallback:
      '把当前转变带向更清楚、更稳定且可以审阅的状态。',

    suggestedDirection: label =>
      `建议起始方向：${label}`,

    suggestedReason: priority =>
      `这个方向会先处理当前现实导航优先事项：${priority}`,

    userChoice:
      '这是建议起点，不是自动决定。行动前请先确认它符合当前现实。',

    reviewAfterStep:
      '完成一个有边界的步骤后，记录实际发生的结果，并先返回现实审阅，再扩大行动。'
  }),

  paths: Object.freeze({
    observe: Object.freeze({
      label: '观察',

      directionWithEvidence: evidence =>
        `收集或留意与以下内容有关的可观察证据：${evidence}`,

      directionWithoutEvidence:
        '在改变当前现实读取之前，先收集一个可观察信号。',

      boundary:
        '不得把感受、解释、象征性读取、期待或假设转化为已观察证据。',

      rationale:
        '当当前现实读取仍属暂定，或证据仍不完整时，观察是合适的路径。',

      reviewEvidence: evidence =>
        `当以下证据出现、改变或持续缺席时进行审阅：${evidence}`,

      reviewTransition:
        '当当前转变趋于稳定、发生逆转或改变方向时进行审阅。',

      reviewImpact:
        '在从观察进入影响更高的路径之前进行审阅。'
    }),

    clarify: Object.freeze({
      label: '澄清',

      directionWithUnknown: unknown =>
        `澄清关于以下内容，目前哪些是已知、报告经验、解释，以及仍然未知：${unknown}`,

      directionWithoutUnknown:
        '澄清当前转变中哪一部分仍未得到充分建立。',

      boundary:
        '澄清可以细化问题或区分，但不能制造缺失证据，也不能建立因果关系。',

      rationaleWithUnknown:
        '尚未解决的现实可能实质改变当前读取或之后的现实导航。',

      rationaleWithoutUnknown:
        '当前转变仍然过于宽泛，尚不足以支持更具体的路径。',

      reviewUnknown: unknown =>
        `当以下内容出现新资料时进行审阅：${unknown}`,

      reviewPrecision:
        '当未决部分能够被更准确地表达时进行审阅。',

      reviewContradiction:
        '当澄清显示报告经验与已观察证据之间存在矛盾时进行审阅。',

      returnObservation:
        '当澄清没有产生新证据时，返回观察路径。'
    }),

    verify: Object.freeze({
      label: '核实',

      directionWithAlternative:
        '比较主要现实运行模式与替代读取，并识别能够区分两者的证据。',

      directionWithoutAlternative:
        '识别一个能够支持或反驳当前现实读取的可观察条件。',

      boundary:
        '核实只检查证据是否支持某项读取，并不能证明某种解释普遍为真。',

      rationaleWithAlternative:
        '目前仍存在多于一种有边界的可能解释。',

      rationaleWithoutAlternative:
        '当前解释仍需要可观察证据的支持或反驳。',

      alternativeUnknown:
        '哪一种读取更符合之后出现的可观察证据，目前仍然未知。',

      reviewPrimary:
        '当区分性证据支持主要读取时进行审阅。',

      reviewAlternative:
        '当区分性证据支持替代读取时进行审阅。',

      reviewNeither:
        '当证据同时反驳当前两种读取时进行审阅。',

      absenceWarning:
        '不得把缺少证据自动视为确认。'
    }),

    experiment: Object.freeze({
      label: '小型实验',

      direction:
        '当实践测试适合进行时，选择一个与当前转变有关、影响较低、范围较小且可以逆转的改变。',

      boundary:
        '实验必须保持可逆；医疗、法律、财务、儿童安全、虐待或其他高风险决定，必须经过合格专业判断。',

      rationale:
        '有边界的小型实验可以产生新证据，而不需要现实运行主体立即承担重大或不可逆改变。',

      outcomeUnknown:
        '在结果被实际观察之前，实验结果仍然未知。',

      defineResult:
        '开始前先定义，什么可观察结果分别代表支持、反驳或没有显著改变。',

      reviewRisk:
        '当成本、风险、痛苦、依赖或不可逆程度增加时，立即进行审阅。',

      reviewWindow:
        '在预先设定的观察窗口结束后进行审阅。',

      generalizationWarning:
        '不得把一次测试结果推广到未被测试的条件。'
    }),

    reposition: Object.freeze({
      label: '重新定位',

      directionWithRegion:
        '暂时把注意力、投入或决策权重移离当前压力点，同时保留原始现实读取，供之后审阅。',

      directionWithoutRegion:
        '暂时调整当前位置，但不得把调整本身视为当前读取正确的证明。',

      boundary:
        '重新定位改变的是当前与某项条件之间的关系，并不能证明该条件为何存在。',

      rationale:
        '当前位置可能正在增加压力、缩窄观察范围，或降低比较不同可能性的能力。',

      outcomeUnknown:
        '重新定位改变的是底层现实运行，还是只改变即时体验，目前仍然未知。',

      reviewState:
        '审阅重新定位后，可观察压力、资源取得、选择空间或稳定性是否改变。',

      reviewTransfer:
        '当调整产生新限制，或把成本转移给其他人或系统时进行审阅。',

      reviewPermanent:
        '在把重新定位变成长期安排之前进行审阅。',

      returnReading:
        '当没有观察到显著改变时，返回原始现实读取。'
    }),

    reconnect: Object.freeze({
      label: '重新连接',

      direction:
        '当现有证据明确支持存在断连时，重新连接相关的人、资源、日常节律、责任或信息来源。',

      boundary:
        '不得假设重新连接一定安全、互惠、可行或适合。虐待、胁迫、困陷、边界侵犯或安全风险需要专业或保护性审阅。',

      rationale:
        '某项相关连接可能缺失、减弱、中断，或没有被充分纳入当前现实运行。',

      outcomeUnknown:
        '重新连接是否可行、安全、互惠且有用，仍需进一步建立。',

      reviewReciprocity:
        '审阅该连接是否互惠，而不是单方面承担。',

      reviewResponsibility:
        '审阅责任、成本与决策权是否变得更清楚，或更加扭曲。',

      escalation:
        '当出现胁迫、恐吓、虐待、困陷或不安全依赖时，停止并升级处理。',

      reviewSupport:
        '审阅重新连接是否产生可观察支持，而不只是预期中的支持。'
    }),

    recover: Object.freeze({
      label: '恢复',

      direction:
        '在要求进一步解释、决策或改变之前，降低可避免的负荷，并建立一个有边界的恢复窗口。',

      boundary:
        '恢复不是诊断或治疗。医疗或心理症状、急性痛苦、自伤风险或功能崩塌，需要合格专业评估。',

      rationale:
        '当前压力、不确定性或重复要求，可能正在降低现实运行主体可靠观察与回应的能力。',

      causeUnknown:
        '能力下降是暂时、结构性、医疗、心理、环境或关系因素所致，目前仍然未知。',

      reviewFunction:
        '审阅恢复窗口期间，基本功能、注意力、稳定性或决策能力是否改变。',

      reviewReturn:
        '当相同负荷在短暂缓解后迅速返回时进行审阅。',

      escalation:
        '当症状、痛苦、功能受损或安全风险增加时，升级至专业评估。',

      reliefWarning:
        '不得把暂时缓解解释为某一特定原因已经得到证明。'
    }),

    professionalReview: Object.freeze({
      label: '专业审阅',

      direction:
        '把有边界的现实运行记录、证据边界、未决现实、相关风险与拟进行的高影响行动，交由适当且合格的专业人士审阅。',

      boundary:
        'PHI OS 可以组织记录并识别不确定性，但不能诊断、处方、提供受监管建议或取代专业判断。',

      rationale:
        '当风险、不确定性、已有专业资料、法律或财务后果、健康、儿童安全、虐待、胁迫或不可逆行动超出规则引擎边界时，应进入专业审阅。',

      fallbackEvidence:
        '当前现实导航包含可能超出自动解释边界的不确定性或潜在影响。',

      conclusionUnknown:
        '在适当且合格的专业人士完成评估之前，相关专业结论仍然未知。',

      reviewAssessment:
        '收到专业评估后进行审阅。',

      preserveClass:
        '把专业评估保留为独立的证据类别。',

      evidenceWarning:
        '不得把专业意见改写成已观察证据。',

      returnRuntime:
        '把新发现返回同一个现实运行主体，同时保留原始记录不被修改。'
    }),

    financialProfessionalReview: Object.freeze({
      label:
        '财务现实审阅',

      direction:
        '透过独立的引导式证据收集与合资格专业审阅，进一步澄清当前财务现实。',

      boundary:
        '这条路径不会在本页面收集敏感财务记录、推荐产品、提供受监管建议或取代合资格专业判断。',

      rationale:
        '收入、支出、现金流、资产、负债、保障、投资、税务、遗产、退休、房产或企业财务条件，可能实质影响当前现实。',

      suitableWhen: Object.freeze([
        '当前转变涉及收入、支出、债务、保障、投资、税务、退休、遗产、房产或企业财务。',
        '正在考虑一项重要财务决定。',
        '重要财务证据仍不完整或尚未核实。'
      ]),

      firstStep:
        '确认是否要在相关工作区开放后，另行开始引导式财务证据收集。',

      fallbackEvidence:
        '当前现实读取包含需要独立证据边界处理的财务信号。',

      conclusionUnknown:
        '在相关证据被收集，并由合资格专业人士审阅之前，不建立任何专业财务结论。',

      reviewConditions: Object.freeze([
        '在相关财务证据完成收集与核实后进行审阅。',
        '在进行任何重要、受监管、难以逆转或涉及具体产品的财务行动前进行审阅。',
        '把专业发现保留为专业评估，不得改写成已观察证据。'
      ])
    })
  }),

  actions: Object.freeze({
    observe: Object.freeze({
      nextStep: evidence =>
        `选择一个可观察信号；在改变任何条件之前，先记录它目前的基线：${evidence}`,

      steps: evidence => [
        `明确以下内容中，哪些可以被直接看见、计数、标注日期或记录：${evidence}`,
        '只记录当前状态一次，不解释它的原因。',
        '在一次相关事件或一个短观察周期后，再观察同一个信号。'
      ],

      observationWindow:
        '一次相关事件或一个短观察周期；不要无限期等待。',

      completionSignals: Object.freeze([
        '同一个信号已经留下前后两次记录。',
        '已经记录信号出现、改变或持续缺席，但没有把结果改写成证明。'
      ]),

      stopConditions: Object.freeze([
        '如果观察本身增加显著风险，或必须先进行高影响行动，便停止这条路径。'
      ])
    }),

    clarify: Object.freeze({
      nextStep: unknown =>
        `把未决现实改写成一个可以回答的问题：${unknown}`,

      steps: unknown => [
        `分别列出关于以下内容的已知、报告经验、解释与未知：${unknown}`,
        '找出一个能够降低这项不确定性的人、记录、事件或观察。',
        '只收集这一项缺失资料，然后把它带回现实读取。'
      ],

      observationWindow:
        '直到一项重要歧义被缩小；之后先重新读取，再扩大问题。',

      completionSignals: Object.freeze([
        '未决问题已经能够在不隐藏因果假设的情况下被表达。',
        '一项原本模糊的边界已经变成已知，或被明确保留为未知。'
      ]),

      stopConditions: Object.freeze([
        '当澄清开始制造证据、推断动机，或重复同一个无法回答的问题时停止。'
      ])
    }),

    verify: Object.freeze({
      nextStep:
        '分别写出一个支持主要读取、以及一个支持替代读取的可观察条件。',

      steps: Object.freeze([
        '用一句话分别表达两种相互竞争的读取。',
        '在收集更多资料前，先为每一种读取定义一个区分性观察。',
        '把结果归类为支持主要读取、支持替代读取、同时支持两者，或两者都不支持。'
      ]),

      observationWindow:
        '完成一个区分性观察周期后，立即进入现实审阅。',

      completionSignals: Object.freeze([
        '同一份证据已经同时对照两种读取。',
        '当两种读取都不符合时，结果仍被如实记录，没有强迫选出胜者。'
      ]),

      stopConditions: Object.freeze([
        '如果测试无法区分两种读取，或必须透过高影响决定才能产生证据，便停止。'
      ])
    }),

    reconfigure: Object.freeze({
      nextStep: (direction, evidence) =>
        `朝向「${direction}」定义一个范围小、可以逆转的改变，并用这个信号评估：${evidence}`,

      steps: Object.freeze([
        '只选择一个变量进行改变，并尽量保持其他测试条件稳定。',
        '开始前记录基线、具体改变，以及什么结果分别代表支持、反驳或没有显著改变。',
        '只进行一次有边界的测试；在重复或扩大之前先停止并审阅。'
      ]),

      observationWindow:
        '一个预先定义的测试周期；开始前先确定结束点。',

      completionSignals: Object.freeze([
        '测试始终保持可逆，并没有超出原定边界。',
        '结果已经按照预先定义的信号被记录。'
      ]),

      stopConditions: Object.freeze([
        '当成本、风险、痛苦、依赖或不可逆程度增加时立即停止。',
        '受监管、医疗、法律、财务、安全关键或儿童相关决定，必须先经过合格专业审阅。'
      ])
    }),

    reposition: Object.freeze({
      nextStep: constraint =>
        `选择一个当前约束，对注意力、投入、时间安排或决策权重作出一次暂时且可逆的调整：${constraint}`,

      steps: Object.freeze([
        '指出压力点，以及可能正在放大它的当前位置。',
        '定义一个不会转移隐藏成本、也不会移除他人选择权的暂时调整。',
        '观察资源取得、压力、稳定性或选择空间是否改变，然后恢复原位或进入审阅。'
      ]),

      observationWindow:
        '一个有边界的情境，或一段预先定义的暂时时间。',

      completionSignals: Object.freeze([
        '调整保持可逆，而且它对压力或选择空间的影响已经被观察。',
        '任何被转移的成本或新增约束都已经记录。'
      ]),

      stopConditions: Object.freeze([
        '当调整在没有审阅下变成长期安排、转移显著成本，或降低安全与同意时停止。'
      ])
    }),

    reconnect: Object.freeze({
      nextStep:
        '识别一个相关且安全的连接，说明这次接触的有限目的，并确认对方是否愿意且能够互相连接。',

      steps: Object.freeze([
        '指出当前读取确实支持需要连接的对象：人、资源、日常节律、责任或信息来源。',
        '接触前先设定有限目的、边界与请求。',
        '观察互惠、责任清晰度与实际支持，而不是只观察预期中的支持。'
      ]),

      observationWindow:
        '一次有边界的接触或一次双方同意的互动，之后进入审阅。',

      completionSignals: Object.freeze([
        '这项连接对既定目的而言确实可用、互惠且相关。',
        '责任、成本与决策权变得更清楚，而不是更加扭曲。'
      ]),

      stopConditions: Object.freeze([
        '当出现胁迫、恐吓、虐待、困陷、不安全依赖或边界侵犯时停止。'
      ])
    }),

    recover: Object.freeze({
      nextStep:
        '先移除或降低一项可避免负荷，并设定一个有边界的恢复窗口，再要求自己作出下一项决定。',

      steps: Object.freeze([
        '识别一项可以安全暂停、降低、委托或延后的可避免要求。',
        '定义恢复窗口期间需要观察的基本功能、注意力或稳定性信号。',
        '以审阅结束恢复窗口，不要把暂时缓解当作成因已经得到证明。'
      ]),

      observationWindow:
        '一段明确写出开始、结束与功能信号的恢复时间。',

      completionSignals: Object.freeze([
        '选定负荷已经降低，同时没有制造更大的隐藏风险。',
        '基本功能出现改变或没有改变，都已经被记录。'
      ]),

      stopConditions: Object.freeze([
        '如果症状、痛苦、功能受损或安全风险增加，不要继续这条路径，应升级至专业评估。'
      ])
    }),

    professional_review: Object.freeze({
      nextStep:
        '准备一份有边界的记录，包含当前问题、证据边界、未决现实、相关风险与拟进行的高影响行动。',

      steps: Object.freeze([
        '根据实际问题确认需要哪一种专业范围。',
        '带上分开的证据类别与未决部分，不把解释改写为事实。',
        '把专业评估作为独立证据类别记录，并带回同一个现实运行主体审阅。'
      ]),

      observationWindow:
        '直到取得相关合格专业评估；等待期间不得以自动输出取代它。',

      completionSignals: Object.freeze([
        '适当且合格的专业人士已经回应这个有边界的问题。',
        '专业评估及其限制已经作为独立证据类别被保留。'
      ]),

      stopConditions: Object.freeze([
        '当必要的专业审阅无法取得或仍未完成时，不要继续高影响行动。'
      ])
    })
  }),

  review: Object.freeze({
    evidence: evidence =>
      `当以下证据出现、改变或持续缺席时进行审阅：${evidence}`,

    transition:
      '当当前转变趋于稳定、发生逆转或改变方向时进行审阅。',

    highImpact:
      '在任何高影响、难以逆转、受监管、医疗、法律、财务、安全关键或涉及儿童的行动之前进行审阅。',

    risk: risk =>
      `当以下当前风险增加时进行审阅：${risk}`,

    unknown: unknown =>
      `当以下内容出现新资料时进行审阅：${unknown}`
  }),

  continuity: Object.freeze({
    returnResult:
      '把每一项已观察结果返回同一个现实运行主体进行审阅。',

    persistAllowed:
      '只在用户明确允许的储存边界内保存现实导航。',

    sessionOnly:
      '除非用户明确允许储存，否则现实导航仅保留在当前会话。',

    reversible:
      '被选择的路径必须在其既定条件内保持可逆、有边界或可供审阅。',

    newVersion:
      '新证据必须作为新版本保存，不得修改原始证据边界。',

    preserveUnknown:
      '未决现实必须保持可见，直到之后的证据建立或反驳它。'
  }),

  readiness: Object.freeze({
    professional:
      '已有有边界的可选路径，但当前不确定性、风险、信心水平或专业资料，要求在高影响行动前由人类作出专业判断。',

    unknown:
      '已有有边界的可选路径，同时明确保留尚未解决的现实。',

    ready:
      '已有可供用户选择、具备边界且可以审阅的现实导航路径。'
  }),

  professionalReview: Object.freeze({
    recommended:
      '当前不确定性、风险、较低信心或已有专业资料，要求在高影响行动之前由人类作出专业判断。',

    notRequired:
      '目前在低影响的观察、澄清或核实阶段，不需要升级至专业审阅。'
  })
});

export default NAVIGATION_RUNTIME_ZH_HANS;
