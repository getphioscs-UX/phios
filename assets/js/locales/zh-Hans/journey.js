/* PHI OS M3C 公共旅程翻译。键名必须与 en/journey.js 对齐。 */
const journeyPublic = Object.freeze({
  journeyPublic: {
    metaTitle: '现实旅程 — PHI OS',
    skip: '跳至现实旅程',
    hero: {
      eyebrow: 'M3C · 现实旅程',
      title: '理解发生了什么。保留重要内容。导航下一步。',
      lead: 'PHI OS 现实旅程把一个正在变化的情境转化为可回顾、可恢复的 Runtime，同时保持证据、解释与不确定性的清晰边界。',
      start: '开始现实旅程',
      resume: '继续旅程',
      demo: '先体验轻量 Demo',
      stages: '7 个有边界阶段',
      runtime: '1 个带版本 Runtime',
      recovery: '保留恢复与谱系',
      mapLabel: '现实旅程的七个阶段',
      factsLabel: '旅程特征'
    },
    overview: {
      eyebrow: '完整旅程',
      title: '从最初变化，到现实继续。',
      lead: '每个阶段只承担一项责任。任何阶段都不会在没有说明的情况下改写之前建立的证据、决定或历史。',
      stageLabel: '阶段',
      purposeLabel: '作用',
      actionLabel: '进行什么',
      preserveLabel: '保留什么边界',
      stagesLabel: '现实旅程阶段'
    },
    stages: {
      entry: {
        name: '入口',
        purpose: '说明哪项变化让这个现实值得被进一步理解。',
        action: '你报告发生了什么变化、何时开始明显、影响什么，以及哪些部分仍不清楚。',
        preserve: '你的文字保持为报告经验；缺失证据继续清晰可见。'
      },
      reconstruction: {
        name: '重建',
        purpose: '在进行解释之前，重建当前情境如何形成。',
        action: '条件、时间、关系、资源、约束与证据缺口被组织为一个有边界的结构。',
        preserve: '重建不会诊断、预测，也不会创造缺失事实。'
      },
      reading: {
        name: '读取',
        purpose: '解释当前 Runtime，同时不把推断提升为事实。',
        action: '观察证据、报告经验、解释与未知现实会被分开显示。',
        preserve: '每项结论都保持与其支持证据及可信度边界的连接。'
      },
      navigation: {
        name: '导航',
        purpose: '把读取转化为可以回顾的有边界方向。',
        action: '可选方向、理由、约束、第一行动与回顾条件变得明确。',
        preserve: 'PHI OS 提供方向，而不是命令、保证或专业处方。'
      },
      review: {
        name: '回顾',
        purpose: '比较原先预期与实际发生的变化。',
        action: '你记录结果、没有改变的部分、意外、约束及下一个 Runtime 状态。',
        preserve: '新的报告会附加到历史，不会改写之前的读取。'
      },
      memory: {
        name: '记忆',
        purpose: '保留结果、尚未解决的现实及选定的下一状态。',
        action: '经过授权的 Runtime Memory 把回顾连接到可恢复的时间线与谱系。',
        preserve: '只保留已经说明的信息，并受适用的访问与隐私控制约束。'
      },
      continuity: {
        name: '持续',
        purpose: '选择这个现实应当如何继续。',
        action: '可以继续、修订、保持开放或开始新旅程，同时不删除来源 Runtime。',
        preserve: '转变需要用户明确选择，并保留父子谱系。'
      }
    },
    boundary: {
      eyebrow: '隐私与 AI 边界',
      title: '辅助保持边界。人类责任不变。',
      lead: '现实旅程用于支持定位与连续性，而不是取代证据、同意或可问责的人类判断。',
      privacyTitle: '信息仅用于说明的目的',
      privacyCopy: '本公共概览不会保存任何内容。正式旅程只会为已经说明的 Runtime 与恢复目的使用信息。',
      aiTitle: 'AI 辅助，不是 AI 权威',
      aiCopy: 'AI 可以协助组织或解释资料。Provider 输出不会因为由模型生成，就自动成为观察证据。',
      evidenceTitle: '不确定性保持可见',
      evidenceCopy: '未知现实与缺失证据会继续保留，不会由看似肯定的语言自动补全。',
      professionalTitle: '不构成专业或紧急建议',
      professionalCopy: 'PHI OS 不构成医疗诊断、法律意见、财务建议，也不是紧急响应服务。',
      privacyAction: '阅读隐私政策',
      aiAction: '阅读 AI 披露',
      professionalAction: '阅读专业边界'
    },
    start: {
      eyebrow: '准备好时再开始',
      title: '从一项你能够描述的变化开始。',
      lead: '你不需要先理解整个情境。入口从最近开始变得不同的部分开始，并让不确定性保持开放。',
      action: '开始现实旅程',
      demo: '先使用不保存的 Demo',
      note: '提交前你可以随时停止。请勿输入紧急信息或高度敏感的身份资料。'
    }
  },
  journeyDashboard: {
    metaTitle: '旅程面板 — PHI OS',
    skip: '跳到旅程面板',
    hero: {
      eyebrow: 'M3C · 旅程面板',
      title: '从你已经建立的现实继续。',
      lead: '在决定继续、修订或开始独立的新旅程之前，先查看当前阶段、恢复状态与历史时间线。',
      overview: '查看旅程概览',
      readOnly: '打开此面板不会改变你的 Runtime。'
    },
    loading: '正在读取可恢复的旅程状态…',
    error: {
      eyebrow: '状态不可用',
      title: '面板无法安全读取这个旅程。',
      copy: '没有任何 Runtime 被更改。请返回上一个旅程页面，或在浏览器存储可用后重试。',
      action: '返回旅程概览'
    },
    empty: {
      eyebrow: '没有进行中的旅程',
      title: '当一项变化值得理解时，再开始。',
      copy: '此浏览器中没有可恢复的 Runtime。入口会开始一个新旅程，不会创造并不存在的过往历史。',
      start: '开始现实旅程',
      overview: '了解七个阶段'
    },
    summary: {
      eyebrow: '可恢复的 Runtime',
      title: '快速查看你的旅程。',
      runtime: 'Runtime',
      currentStage: '当前阶段',
      completedStages: '已完成阶段',
      completedValue: '已完成 {completed} / {total}',
      nextStep: '下一步',
      latestUpdate: '最近更新',
      recoveryStatus: '恢复状态',
      notEstablished: '尚未建立'
    },
    resume: {
      title: '继续当前阶段',
      copy: '继续会使用现有 Runtime，不会建立新的修订版本。',
      action: '继续旅程'
    },
    progress: {
      eyebrow: '旅程进度',
      title: '七个阶段，一个明确的下一步。',
      lead: '已完成阶段会继续可见。“可进入”不代表自动选择或自动完成。',
      label: '现实旅程阶段进度'
    },
    stageStatus: {
      current: '当前',
      completed: '已完成',
      available: '可进入',
      upcoming: '未开放'
    },
    next: {
      entry: '继续入口',
      reconstruction: '继续重建',
      reading: '继续读取',
      navigation: '继续导航',
      review: '继续回顾',
      memory: '查看 Runtime Memory',
      continuity: '确认持续选择'
    },
    recovery: {
      restored: '已在此浏览器恢复',
      protected: '已保存供浏览器恢复',
      sessionOnly: '当前会话可用',
      recoverable: '有已保存的旅程',
      attention: '已保存状态需要检查',
      empty: '没有已保存旅程'
    },
    decisions: {
      eyebrow: '行动边界',
      title: '继续、修订与开始新旅程是不同的行动。',
      lead: '面板不会把这些选择当成同一件事，也不会删除来源 Runtime。',
      resume: {
        title: '继续',
        copy: '使用相同 Runtime 与既有证据继续当前阶段。',
        action: '继续当前旅程'
      },
      revise: {
        title: '修订',
        copy: '通过持续阶段返回，建立连接至来源 Reading 的追加式修订。',
        action: '查看修订选择'
      },
      newJourney: {
        title: '开始新旅程',
        copy: '通过持续阶段确认新的入口，让先前 Runtime 保留在谱系中。',
        action: '查看新旅程选择'
      },
      boundary: '修订与新 Runtime 都需要明确的持续确认。此面板不会执行任何一种转变。'
    },
    timeline: {
      eyebrow: '旅程时间线',
      title: '最近的 Runtime 更新。',
      lead: '事件来自现有的追加式谱系。它们作为历史参考显示，不会因此成为已验证证据。',
      empty: '尚未记录阶段事件。你仍然可以继续进行中的入口。',
      boundary: '打开时间线不会改写、提升或删除任何早期记录。',
      runtime: 'Runtime',
      update: 'Runtime 更新',
      unknownDate: '日期不可用',
      revision: '修订 {number}',
      path: '路径',
      outcome: '结果'
    }
  }
});

export default journeyPublic;
