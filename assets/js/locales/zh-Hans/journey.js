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
  }
});

export default journeyPublic;
